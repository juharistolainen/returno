/**
 * Pure expected-return projections.
 *
 * Savings interest is credited at the chosen compounding frequency. Top-ups
 * are deposited at the start of each month or year and earn interest only for
 * the time they have been in the account (simple within a compounding period,
 * compound across periods). Daily compounding uses a 365-day year.
 *
 * Investments grow at the expected annual return, compounded monthly, after an
 * annual fund fee applied evenly through the year. With no top-ups, one year
 * multiplies the balance by (1 + return) × (1 − fee).
 *
 * Both rates are nominal. Inflation, when set, does not change either nominal
 * path. It restates each year-end balance in today's euros through `realValue`.
 */

import { realValue } from "./inflation.ts";

export type ContributionFrequency = "monthly" | "yearly";

export type CompoundingFrequency =
  | "annually"
  | "semiannually"
  | "quarterly"
  | "monthly"
  | "daily";

export interface SavingsInput {
  balance: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  /** Nominal annual interest rate as a decimal (0.03 = 3%). */
  annualRate: number;
  compounding: CompoundingFrequency;
  years: number;
  /** Flat tax on positive interest, as a decimal. 0 disables tax. */
  taxRate: number;
  /** Inflation rate as a decimal. 0 leaves real balances equal to nominal. */
  inflationRate: number;
}

export interface InvestmentInput {
  balance: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  /** Expected annual return as a decimal, before fees. */
  expectedReturn: number;
  /** Annual fund/management fee as a decimal of assets. */
  feeRate: number;
  years: number;
  /** Inflation rate as a decimal. 0 leaves real balances equal to nominal. */
  inflationRate: number;
}

export interface YearRow {
  year: number;
  startBalance: number;
  contributions: number;
  grossInterest: number;
  tax: number;
  fees: number;
  /** Net change from interest, tax, and fees. Excludes contributions. */
  gain: number;
  endBalance: number;
  realEndBalance: number;
  cumulativeContributions: number;
}

export interface Projection {
  finalBalance: number;
  finalRealBalance: number;
  totalContributions: number;
  totalGain: number;
  totalTax: number;
  totalFees: number;
  rows: YearRow[];
}

export interface ChartPoint {
  year: number;
  balance: number;
  real: number;
}

export interface Comparison {
  savings: Projection;
  stocks: Projection;
  /** Stocks nominal ending balance minus savings ending balance. */
  nominalDifference: number;
  /** Inflation-adjusted stock balance minus the inflation-adjusted savings balance. */
  realDifference: number;
}

const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MONTH_STARTS: readonly number[] = (() => {
  const starts: number[] = [];
  let day = 0;
  for (const length of MONTH_LENGTHS) {
    starts.push(day);
    day += length;
  }
  return starts;
})();

function periodsPerYear(compounding: CompoundingFrequency): number {
  switch (compounding) {
    case "annually":
      return 1;
    case "semiannually":
      return 2;
    case "quarterly":
      return 4;
    case "monthly":
      return 12;
    case "daily":
      return DAYS_PER_YEAR;
  }
}

function requireFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

function wholeYears(years: number): number {
  requireFinite("years", years);
  if (years < 0) {
    throw new Error("years must be zero or greater");
  }
  return Math.floor(years);
}

function contributionDue(monthIndex: number, frequency: ContributionFrequency): boolean {
  if (frequency === "monthly") return true;
  return monthIndex % MONTHS_PER_YEAR === 0;
}

function emptyProjection(balance: number): Projection {
  return {
    finalBalance: balance,
    finalRealBalance: balance,
    totalContributions: balance,
    totalGain: 0,
    totalTax: 0,
    totalFees: 0,
    rows: [],
  };
}

export function projectSavings(input: SavingsInput): Projection {
  requireFinite("balance", input.balance);
  requireFinite("contribution", input.contribution);
  requireFinite("annualRate", input.annualRate);
  requireFinite("taxRate", input.taxRate);
  requireFinite("inflationRate", input.inflationRate);
  const years = wholeYears(input.years);
  if (years === 0) return emptyProjection(input.balance);
  if (input.compounding === "daily") return projectSavingsDaily(input, years);
  return projectSavingsPeriodic(input, years);
}

function projectSavingsPeriodic(input: SavingsInput, years: number): Projection {
  const periods = periodsPerYear(input.compounding);
  const monthsPerPeriod = MONTHS_PER_YEAR / periods;
  let balance = input.balance;
  let totalContributions = input.balance;
  let totalTax = 0;
  let totalGain = 0;
  const rows: YearRow[] = [];

  for (let year = 1; year <= years; year += 1) {
    const startBalance = balance;
    let yearContributions = 0;
    let yearGross = 0;
    let yearTax = 0;

    for (let period = 0; period < periods; period += 1) {
      let interestBase = balance;
      for (let monthInPeriod = 0; monthInPeriod < monthsPerPeriod; monthInPeriod += 1) {
        const monthIndex = (year - 1) * MONTHS_PER_YEAR + period * monthsPerPeriod + monthInPeriod;
        if (!contributionDue(monthIndex, input.contributionFrequency) || input.contribution === 0) {
          continue;
        }
        balance += input.contribution;
        totalContributions += input.contribution;
        yearContributions += input.contribution;
        const fractionRemaining = (monthsPerPeriod - monthInPeriod) / monthsPerPeriod;
        interestBase += input.contribution * fractionRemaining;
      }

      const gross = interestBase * (input.annualRate / periods);
      const tax = gross > 0 ? gross * input.taxRate : 0;
      balance += gross - tax;
      yearGross += gross;
      yearTax += tax;
      totalTax += tax;
    }

    const gain = yearGross - yearTax;
    totalGain += gain;
    rows.push({
      year,
      startBalance,
      contributions: yearContributions,
      grossInterest: yearGross,
      tax: yearTax,
      fees: 0,
      gain,
      endBalance: balance,
      realEndBalance: realValue(balance, input.inflationRate, year),
      cumulativeContributions: totalContributions,
    });
  }

  return {
    finalBalance: balance,
    finalRealBalance: rows[rows.length - 1]!.realEndBalance,
    totalContributions,
    totalGain,
    totalTax,
    totalFees: 0,
    rows,
  };
}

function isDailyContributionDay(dayOfYear: number, frequency: ContributionFrequency): boolean {
  if (frequency === "yearly") return dayOfYear === 0;
  return MONTH_STARTS.includes(dayOfYear);
}

function projectSavingsDaily(input: SavingsInput, years: number): Projection {
  const dailyRate = input.annualRate / DAYS_PER_YEAR;
  let balance = input.balance;
  let totalContributions = input.balance;
  let totalTax = 0;
  let totalGain = 0;
  const rows: YearRow[] = [];
  let yearStart = balance;
  let yearContributions = 0;
  let yearGross = 0;
  let yearTax = 0;

  for (let day = 0; day < years * DAYS_PER_YEAR; day += 1) {
    const dayOfYear = day % DAYS_PER_YEAR;
    if (isDailyContributionDay(dayOfYear, input.contributionFrequency) && input.contribution !== 0) {
      balance += input.contribution;
      totalContributions += input.contribution;
      yearContributions += input.contribution;
    }

    const gross = balance * dailyRate;
    const tax = gross > 0 ? gross * input.taxRate : 0;
    balance += gross - tax;
    yearGross += gross;
    yearTax += tax;
    totalTax += tax;

    if (dayOfYear === DAYS_PER_YEAR - 1) {
      const gain = yearGross - yearTax;
      totalGain += gain;
      const year = rows.length + 1;
      rows.push({
        year,
        startBalance: yearStart,
        contributions: yearContributions,
        grossInterest: yearGross,
        tax: yearTax,
        fees: 0,
        gain,
        endBalance: balance,
        realEndBalance: realValue(balance, input.inflationRate, year),
        cumulativeContributions: totalContributions,
      });
      yearStart = balance;
      yearContributions = 0;
      yearGross = 0;
      yearTax = 0;
    }
  }

  return {
    finalBalance: balance,
    finalRealBalance: rows[rows.length - 1]!.realEndBalance,
    totalContributions,
    totalGain,
    totalTax,
    totalFees: 0,
    rows,
  };
}

export function projectInvestment(input: InvestmentInput): Projection {
  requireFinite("balance", input.balance);
  requireFinite("contribution", input.contribution);
  requireFinite("expectedReturn", input.expectedReturn);
  requireFinite("feeRate", input.feeRate);
  requireFinite("inflationRate", input.inflationRate);
  const years = wholeYears(input.years);
  if (years === 0) return emptyProjection(input.balance);

  const monthlyGrowth = Math.pow(1 + input.expectedReturn, 1 / MONTHS_PER_YEAR);
  const monthlyRetention = Math.pow(1 - input.feeRate, 1 / MONTHS_PER_YEAR);
  if (!Number.isFinite(monthlyGrowth) || !Number.isFinite(monthlyRetention)) {
    throw new Error("expectedReturn and feeRate must produce a finite monthly factor");
  }
  let balance = input.balance;
  let totalContributions = input.balance;
  let totalFees = 0;
  let totalGain = 0;
  const rows: YearRow[] = [];

  for (let year = 1; year <= years; year += 1) {
    const startBalance = balance;
    let yearContributions = 0;
    let yearFees = 0;
    let yearGross = 0;

    for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
      const monthIndex = (year - 1) * MONTHS_PER_YEAR + month;
      if (contributionDue(monthIndex, input.contributionFrequency) && input.contribution !== 0) {
        balance += input.contribution;
        totalContributions += input.contribution;
        yearContributions += input.contribution;
      }

      const beforeGrowth = balance;
      balance *= monthlyGrowth;
      const gross = balance - beforeGrowth;
      const afterGrowth = balance;
      balance *= monthlyRetention;
      const fee = afterGrowth - balance;
      yearGross += gross;
      yearFees += fee;
      totalFees += fee;
    }

    const gain = yearGross - yearFees;
    totalGain += gain;
    const endReal = realValue(balance, input.inflationRate, year);
    rows.push({
      year,
      startBalance,
      contributions: yearContributions,
      grossInterest: yearGross,
      tax: 0,
      fees: yearFees,
      gain,
      endBalance: balance,
      realEndBalance: endReal,
      cumulativeContributions: totalContributions,
    });
  }

  const finalReal = rows.length > 0 ? rows[rows.length - 1]!.realEndBalance : input.balance;
  return {
    finalBalance: balance,
    finalRealBalance: finalReal,
    totalContributions,
    totalGain,
    totalTax: 0,
    totalFees,
    rows,
  };
}

export function compareProjections(savings: SavingsInput, stocks: InvestmentInput): Comparison {
  const savingsProjection = projectSavings(savings);
  const stocksProjection = projectInvestment(stocks);
  return {
    savings: savingsProjection,
    stocks: stocksProjection,
    nominalDifference: stocksProjection.finalBalance - savingsProjection.finalBalance,
    realDifference: stocksProjection.finalRealBalance - savingsProjection.finalRealBalance,
  };
}

/** Year 0 is the starting balance, then one point per completed year. */
export function toChartPoints(initialBalance: number, projection: Projection): ChartPoint[] {
  return [
    { year: 0, balance: initialBalance, real: initialBalance },
    ...projection.rows.map((row) => ({
      year: row.year,
      balance: row.endBalance,
      real: row.realEndBalance,
    })),
  ];
}

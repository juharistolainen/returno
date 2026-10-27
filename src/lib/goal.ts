/**
 * Monthly top-up needed to hit a goal.
 *
 * The account value is linear in the starting balance and the monthly top-up:
 * final = alpha * balance + beta * monthly. Alpha and beta are closed forms of
 * the same timing rules as the savings and stock projections (top-up at the
 * start of the month, interest net of tax, stock growth net of the fund fee).
 * A whole number of years is checked against those projections in tests.
 */

import {
  projectInvestment,
  projectSavings,
  toChartPoints,
  type ChartPoint,
  type CompoundingFrequency,
  type Projection,
  type YearRow,
} from "./calc.ts";

export type GoalVehicle = "savings" | "stocks";
export type GoalTargetKind = "balance" | "growth";
export type GoalStatus = "reached" | "solvable" | "unreachable";

export interface LinearGrowth {
  /** final = alpha * starting balance + beta * monthly contribution */
  alpha: number;
  beta: number;
  deposits: number;
}

export interface GoalInput {
  vehicle: GoalVehicle;
  /** "balance" is the ending account value. "growth" is the gain after deposits. Both are net of tax and fees. */
  targetKind: GoalTargetKind;
  targetAmount: number;
  balance: number;
  /** Whole months. Negative means the target date is in the past. */
  months: number;
  annualRate: number;
  compounding: CompoundingFrequency;
  taxRate: number;
  expectedReturn: number;
  feeRate: number;
  /** Decimal inflation. Zero leaves the target in nominal euros. Stocks only. */
  inflationRate: number;
}

export interface GoalPlan {
  status: GoalStatus;
  message: string;
  monthlyContribution: number;
  months: number;
  projection: Projection;
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

const MAX_MONTHLY = 1_000_000_000;
const RATE_EPS = 1e-12;

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

function netPeriodRate(annualRate: number, periods: number, taxRate: number): number {
  const gross = annualRate / periods;
  return gross > 0 ? gross * (1 - taxRate) : gross;
}

/** ratio^steps and the sum of ratio^0 .. ratio^(steps-1). */
function geometric(ratio: number, steps: number): { alpha: number; sum: number } {
  if (steps <= 0) return { alpha: 1, sum: 0 };
  if (Math.abs(ratio - 1) <= RATE_EPS) return { alpha: 1, sum: steps };
  const alpha = ratio ** steps;
  return { alpha, sum: (alpha - 1) / (ratio - 1) };
}

export function savingsLinearGrowth(
  months: number,
  annualRate: number,
  compounding: CompoundingFrequency,
  taxRate: number,
): LinearGrowth {
  const wholeMonths = Math.max(0, Math.floor(months));
  if (wholeMonths === 0) return { alpha: 1, beta: 0, deposits: 0 };
  if (compounding === "daily") return dailyLinearGrowth(wholeMonths, annualRate, taxRate);

  const periods = periodsPerYear(compounding);
  const monthsPerPeriod = MONTHS_PER_YEAR / periods;
  const periodRate = netPeriodRate(annualRate, periods, taxRate);
  const growth = 1 + periodRate;
  const perPeriod = monthsPerPeriod + (periodRate * (monthsPerPeriod + 1)) / 2;
  const fullPeriods = Math.floor(wholeMonths / monthsPerPeriod);
  const remainder = wholeMonths - fullPeriods * monthsPerPeriod;
  const series = geometric(growth, fullPeriods);
  return {
    alpha: series.alpha,
    beta: perPeriod * series.sum + remainder,
    deposits: wholeMonths,
  };
}

function dailyMultiplier(annualRate: number, taxRate: number): number {
  const dailyRate = annualRate / DAYS_PER_YEAR;
  if (dailyRate > 0) return 1 + dailyRate * (1 - taxRate);
  return 1 + dailyRate;
}

function applyDailySpan(days: number, multiplier: number): LinearGrowth {
  let alpha = 1;
  let beta = 0;
  let deposits = 0;
  for (let day = 0; day < days; day += 1) {
    if (MONTH_STARTS.includes(day % DAYS_PER_YEAR)) {
      beta += 1;
      deposits += 1;
    }
    alpha *= multiplier;
    beta *= multiplier;
  }
  return { alpha, beta, deposits };
}

function composeGrowth(first: LinearGrowth, then: LinearGrowth): LinearGrowth {
  return {
    alpha: then.alpha * first.alpha,
    beta: then.alpha * first.beta + then.beta,
    deposits: first.deposits + then.deposits,
  };
}

function dailyLinearGrowth(months: number, annualRate: number, taxRate: number): LinearGrowth {
  const multiplier = dailyMultiplier(annualRate, taxRate);
  const fullYears = Math.floor(months / MONTHS_PER_YEAR);
  const extraMonths = months % MONTHS_PER_YEAR;
  const oneYear = applyDailySpan(DAYS_PER_YEAR, multiplier);
  const series = geometric(oneYear.alpha, fullYears);
  let combined: LinearGrowth = {
    alpha: series.alpha,
    beta: oneYear.beta * series.sum,
    deposits: oneYear.deposits * fullYears,
  };
  if (extraMonths > 0) {
    const extraDays = MONTH_LENGTHS.slice(0, extraMonths).reduce((sum, length) => sum + length, 0);
    combined = composeGrowth(combined, applyDailySpan(extraDays, multiplier));
  }
  return combined;
}

export function stockLinearGrowth(months: number, expectedReturn: number, feeRate: number): LinearGrowth {
  const wholeMonths = Math.max(0, Math.floor(months));
  if (wholeMonths === 0) return { alpha: 1, beta: 0, deposits: 0 };
  const monthly =
    Math.pow(1 + expectedReturn, 1 / MONTHS_PER_YEAR) * Math.pow(1 - feeRate, 1 / MONTHS_PER_YEAR);
  const series = geometric(monthly, wholeMonths);
  return { alpha: series.alpha, beta: monthly * series.sum, deposits: wholeMonths };
}

function inflationFactor(months: number, inflationRate: number): number {
  if (inflationRate === 0 || months <= 0) return 1;
  return Math.pow(1 + inflationRate, months / MONTHS_PER_YEAR);
}

function roundUpCents(value: number): number {
  const scaled = value * 100;
  const nearest = Math.round(scaled);
  if (Math.abs(scaled - nearest) < 1e-6) return nearest / 100;
  return Math.ceil(scaled - 1e-8) / 100;
}

function outcome(growth: LinearGrowth, balance: number, monthly: number, infl: number): { final: number; gain: number } {
  const final = growth.alpha * balance + growth.beta * monthly;
  const contributed = balance + growth.deposits * monthly;
  return { final: final / infl, gain: (final - contributed) / infl };
}

export function planGoal(input: GoalInput): GoalPlan {
  const months = input.months < 0 ? input.months : Math.floor(input.months);
  const solvableMonths = Math.max(0, months);
  const growth =
    input.vehicle === "savings"
      ? savingsLinearGrowth(solvableMonths, input.annualRate, input.compounding, input.taxRate)
      : stockLinearGrowth(solvableMonths, input.expectedReturn, input.feeRate);
  const infl = input.vehicle === "stocks" ? inflationFactor(solvableMonths, input.inflationRate) : 1;
  const solved = solveMonthly(input, growth, infl, months);
  return {
    status: solved.status,
    message: solved.message,
    monthlyContribution: solved.monthly,
    months: solvableMonths,
    projection: projectPlan(input, solvableMonths, solved.monthly),
  };
}

function solveMonthly(
  input: GoalInput,
  growth: LinearGrowth,
  infl: number,
  months: number,
): { status: GoalStatus; message: string; monthly: number } {
  const covered = (monthly: number) => {
    const result = outcome(growth, input.balance, monthly, infl);
    return (input.targetKind === "balance" ? result.final : result.gain) + 0.005 >= input.targetAmount;
  };

  if (covered(0)) {
    return {
      status: "reached",
      monthly: 0,
      message:
        months < 1
          ? "There is no time left to save, but the current balance already covers this goal."
          : input.targetKind === "balance"
            ? "The current balance already reaches the target on its own, after tax and fees. The monthly top-up is zero."
            : "The current balance already grows enough, after tax and fees. The monthly top-up is zero.",
    };
  }

  if (months < 1) {
    return {
      status: "unreachable",
      monthly: 0,
      message: "That date is today or in the past, so there is no time to add monthly top-ups.",
    };
  }

  if (input.targetKind === "balance") {
    if (growth.beta <= RATE_EPS) {
      return {
        status: "unreachable",
        monthly: 0,
        message: "Top-ups would not increase the balance under these rates, so the target can't be reached.",
      };
    }
    const exact = (input.targetAmount * infl - growth.alpha * input.balance) / growth.beta;
    return finishSolve(exact, "Monthly top-up for the final balance, after tax and fees, rounded up to the next cent.");
  }

  const denominator = growth.beta - growth.deposits;
  const principalGain = (growth.alpha - 1) * input.balance;
  if (denominator <= 1e-9) {
    return {
      status: "unreachable",
      monthly: 0,
      message:
        input.annualRate === 0 && input.vehicle === "savings"
          ? "With a zero interest rate there is no growth, so a net-growth target above zero can't be reached."
          : "Under these rates, paying in more does not increase growth after fees, so this net-growth target can't be reached.",
    };
  }
  const exact = (input.targetAmount * infl - principalGain) / denominator;
  return finishSolve(exact, "Monthly top-up for the net growth target, after tax and fees, rounded up to the next cent.");
}

function finishSolve(exact: number, solvableMessage: string): { status: GoalStatus; message: string; monthly: number } {
  if (!Number.isFinite(exact) || exact > MAX_MONTHLY) {
    return {
      status: "unreachable",
      monthly: 0,
      message: "The monthly amount needed is above €1,000,000,000, which this planner treats as out of reach.",
    };
  }
  if (exact <= 0) {
    return {
      status: "unreachable",
      monthly: 0,
      message: "Hitting this target would require withdrawing money, which this planner doesn't do.",
    };
  }
  return { status: "solvable", monthly: roundUpCents(exact), message: solvableMessage };
}

function projectPlan(input: GoalInput, months: number, monthly: number): Projection {
  if (months > 0 && months % MONTHS_PER_YEAR === 0) {
    const years = months / MONTHS_PER_YEAR;
    if (input.vehicle === "savings") {
      return projectSavings({
        balance: input.balance,
        contribution: monthly,
        contributionFrequency: "monthly",
        annualRate: input.annualRate,
        compounding: input.compounding,
        years,
        taxRate: input.taxRate,
      });
    }
    return projectInvestment({
      balance: input.balance,
      contribution: monthly,
      contributionFrequency: "monthly",
      expectedReturn: input.expectedReturn,
      feeRate: input.feeRate,
      years,
      inflationRate: input.inflationRate,
    });
  }
  if (input.vehicle === "stocks") return projectStockMonths(input, months, monthly);
  if (input.compounding === "daily") return projectSavingsDays(input, months, monthly);
  return projectSavingsMonths(input, months, monthly);
}

function pushYear(
  rows: YearRow[],
  year: number,
  startBalance: number,
  contributions: number,
  gross: number,
  tax: number,
  fees: number,
  endBalance: number,
  cumulative: number,
  inflationRate: number,
): void {
  rows.push({
    year,
    startBalance,
    contributions,
    grossInterest: gross,
    tax,
    fees,
    gain: gross - tax - fees,
    endBalance,
    realEndBalance: inflationRate === 0 ? endBalance : endBalance / Math.pow(1 + inflationRate, year),
    cumulativeContributions: cumulative,
  });
}

function projectSavingsMonths(input: GoalInput, months: number, monthly: number): Projection {
  const periods = periodsPerYear(input.compounding);
  const monthsPerPeriod = MONTHS_PER_YEAR / periods;
  let balance = input.balance;
  let totalContributions = input.balance;
  let totalTax = 0;
  let totalGain = 0;
  const rows: YearRow[] = [];
  let yearStart = balance;
  let yearContributions = 0;
  let yearGross = 0;
  let yearTax = 0;
  let cursor = 0;

  while (cursor < months) {
    const monthsThisPeriod = Math.min(monthsPerPeriod, months - cursor);
    const complete = monthsThisPeriod === monthsPerPeriod;
    let interestBase = balance;
    for (let monthInPeriod = 0; monthInPeriod < monthsThisPeriod; monthInPeriod += 1) {
      if (monthly !== 0) {
        balance += monthly;
        totalContributions += monthly;
        yearContributions += monthly;
        if (complete) {
          const fraction = (monthsPerPeriod - monthInPeriod) / monthsPerPeriod;
          interestBase += monthly * fraction;
        }
      }
    }
    if (complete) {
      const gross = interestBase * (input.annualRate / periods);
      const tax = gross > 0 ? gross * input.taxRate : 0;
      balance += gross - tax;
      yearGross += gross;
      yearTax += tax;
      totalTax += tax;
    }
    cursor += monthsThisPeriod;
    if (cursor % MONTHS_PER_YEAR === 0 || cursor === months) {
      totalGain += yearGross - yearTax;
      pushYear(rows, cursor / MONTHS_PER_YEAR, yearStart, yearContributions, yearGross, yearTax, 0, balance, totalContributions, 0);
      yearStart = balance;
      yearContributions = 0;
      yearGross = 0;
      yearTax = 0;
    }
  }

  return {
    finalBalance: balance,
    finalRealBalance: balance,
    totalContributions,
    totalGain,
    totalTax,
    totalFees: 0,
    rows,
  };
}

function projectSavingsDays(input: GoalInput, months: number, monthly: number): Projection {
  const fullYears = Math.floor(months / MONTHS_PER_YEAR);
  const extraMonths = months % MONTHS_PER_YEAR;
  const extraDays = MONTH_LENGTHS.slice(0, extraMonths).reduce((sum, length) => sum + length, 0);
  const totalDays = fullYears * DAYS_PER_YEAR + extraDays;
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

  for (let day = 0; day < totalDays; day += 1) {
    const dayOfYear = day % DAYS_PER_YEAR;
    if (MONTH_STARTS.includes(dayOfYear) && monthly !== 0) {
      balance += monthly;
      totalContributions += monthly;
      yearContributions += monthly;
    }
    const gross = balance * dailyRate;
    const tax = gross > 0 ? gross * input.taxRate : 0;
    balance += gross - tax;
    yearGross += gross;
    yearTax += tax;
    totalTax += tax;
    const yearBoundary = dayOfYear === DAYS_PER_YEAR - 1 || day === totalDays - 1;
    if (yearBoundary) {
      totalGain += yearGross - yearTax;
      pushYear(rows, (day + 1) / DAYS_PER_YEAR, yearStart, yearContributions, yearGross, yearTax, 0, balance, totalContributions, 0);
      yearStart = balance;
      yearContributions = 0;
      yearGross = 0;
      yearTax = 0;
    }
  }

  return {
    finalBalance: balance,
    finalRealBalance: balance,
    totalContributions,
    totalGain,
    totalTax,
    totalFees: 0,
    rows,
  };
}

function projectStockMonths(input: GoalInput, months: number, monthly: number): Projection {
  const monthlyGrowth = Math.pow(1 + input.expectedReturn, 1 / MONTHS_PER_YEAR);
  const monthlyRetention = Math.pow(1 - input.feeRate, 1 / MONTHS_PER_YEAR);
  let balance = input.balance;
  let totalContributions = input.balance;
  let totalFees = 0;
  let totalGain = 0;
  const rows: YearRow[] = [];
  let yearStart = balance;
  let yearContributions = 0;
  let yearGross = 0;
  let yearFees = 0;

  for (let month = 0; month < months; month += 1) {
    if (monthly !== 0) {
      balance += monthly;
      totalContributions += monthly;
      yearContributions += monthly;
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
    if ((month + 1) % MONTHS_PER_YEAR === 0 || month === months - 1) {
      totalGain += yearGross - yearFees;
      pushYear(rows, (month + 1) / MONTHS_PER_YEAR, yearStart, yearContributions, yearGross, 0, yearFees, balance, totalContributions, input.inflationRate);
      yearStart = balance;
      yearContributions = 0;
      yearGross = 0;
      yearFees = 0;
    }
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

export function goalChart(startingBalance: number, projection: Projection): ChartPoint[] {
  return toChartPoints(startingBalance, projection);
}

/** Whole months from today until a YYYY-MM-DD date. Null when the date is not real. */
export function monthsUntil(targetDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(targetDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(year, month - 1, day);
  if (target.getFullYear() !== year || target.getMonth() !== month - 1 || target.getDate() !== day) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let months = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
  if (target.getDate() < start.getDate()) months -= 1;
  return months;
}

export const MAX_GOAL_MONTHS = 80 * MONTHS_PER_YEAR;

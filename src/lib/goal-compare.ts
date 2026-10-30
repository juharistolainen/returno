/**
 * Side-by-side monthly top-ups for one goal.
 * Each side is `planGoal` for that account, so tax, fees, and inflation stay
 * on the same rules as the single-account goal.
 */

import { formatEur } from "./format.ts";
import { goalChart, planGoal, type GoalInput, type GoalPlan, type GoalVehicle } from "./goal.ts";
import type { YearRow } from "./calc.ts";

export type GoalCompareInput = Omit<GoalInput, "vehicle">;

export type GoalAdvantage = GoalVehicle | "tie" | "none";

export interface GoalComparison {
  savings: GoalPlan;
  stocks: GoalPlan;
  /** Lower monthly top-up. "none" when either side cannot be solved. */
  lowerMonthly: GoalAdvantage;
  /** Absolute monthly gap, in euros. Zero for a tie or when the sides can't be compared. */
  monthlyGap: number;
  lowerOutOfPocket: GoalAdvantage;
  /** Absolute gap in total money paid in, including the starting balance. */
  outOfPocketGap: number;
}

export const GOAL_COMPARE_CAVEAT =
  "Under the rates you typed. Stock returns are not guaranteed and can be lower.";

function cents(value: number): number {
  return Math.round(value * 100);
}

function advantage(savingsAmount: number, stocksAmount: number): { lower: GoalAdvantage; gap: number } {
  const savingsCents = cents(savingsAmount);
  const stocksCents = cents(stocksAmount);
  if (savingsCents === stocksCents) return { lower: "tie", gap: 0 };
  if (savingsCents < stocksCents) return { lower: "savings", gap: (stocksCents - savingsCents) / 100 };
  return { lower: "stocks", gap: (savingsCents - stocksCents) / 100 };
}

function comparable(plan: GoalPlan): boolean {
  return plan.status === "solvable" || plan.status === "reached";
}

export function compareGoals(input: GoalCompareInput): GoalComparison {
  const savings = planGoal({ ...input, vehicle: "savings" });
  const stocks = planGoal({ ...input, vehicle: "stocks" });
  if (!comparable(savings) || !comparable(stocks)) {
    return {
      savings,
      stocks,
      lowerMonthly: "none",
      monthlyGap: 0,
      lowerOutOfPocket: "none",
      outOfPocketGap: 0,
    };
  }
  const monthly = advantage(savings.monthlyContribution, stocks.monthlyContribution);
  const pocket = advantage(savings.projection.totalContributions, stocks.projection.totalContributions);
  return {
    savings,
    stocks,
    lowerMonthly: monthly.lower,
    monthlyGap: monthly.gap,
    lowerOutOfPocket: pocket.lower,
    outOfPocketGap: pocket.gap,
  };
}

export function goalCompareHeadline(comparison: GoalComparison): string {
  if (comparison.lowerMonthly === "stocks") {
    return `Investing needs ${formatEur(comparison.monthlyGap)} less each month`;
  }
  if (comparison.lowerMonthly === "savings") {
    return `Savings needs ${formatEur(comparison.monthlyGap)} less each month`;
  }
  if (comparison.lowerMonthly === "tie") return "Both need the same each month";
  const savingsBlocked = comparison.savings.status === "unreachable";
  const stocksBlocked = comparison.stocks.status === "unreachable";
  if (savingsBlocked && stocksBlocked) return "Neither account can reach this goal under these rates.";
  if (stocksBlocked) return "The investment can't reach this goal under these rates.";
  return "The savings account can't reach this goal under these rates.";
}

export function goalComparePocketNote(comparison: GoalComparison, horizon: string): string {
  if (comparison.lowerOutOfPocket === "none") return "";
  if (comparison.lowerOutOfPocket === "tie") return `the same out of pocket over ${horizon}`;
  return `less out of pocket over ${horizon}`;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export interface GoalCompareYearRow {
  year: number;
  savingsTopUps: number | null;
  savingsGain: number | null;
  savingsTax: number | null;
  savingsBalance: number | null;
  savingsReal: number | null;
  stocksTopUps: number | null;
  stocksGain: number | null;
  stocksFees: number | null;
  stocksBalance: number | null;
  stocksReal: number | null;
}

export interface GoalComparePoint {
  year: number;
  savings: number | null;
  stocks: number | null;
  savingsReal: number | null;
  stocksReal: number | null;
}

/** One row per projected year. Each side's cells are that account's year row. */
export function goalCompareYearRows(comparison: GoalComparison): GoalCompareYearRow[] {
  const savings = comparison.savings.projection.rows;
  const stocks = comparison.stocks.projection.rows;
  const count = Math.max(savings.length, stocks.length);
  return Array.from({ length: count }, (_, index) => {
    const savingsRow = savings[index];
    const stocksRow = stocks[index];
    return {
      year: savingsRow?.year ?? stocksRow!.year,
      savingsTopUps: cell(savingsRow, "contributions"),
      savingsGain: cell(savingsRow, "gain"),
      savingsTax: cell(savingsRow, "tax"),
      savingsBalance: cell(savingsRow, "endBalance"),
      savingsReal: cell(savingsRow, "realEndBalance"),
      stocksTopUps: cell(stocksRow, "contributions"),
      stocksGain: cell(stocksRow, "gain"),
      stocksFees: cell(stocksRow, "fees"),
      stocksBalance: cell(stocksRow, "endBalance"),
      stocksReal: cell(stocksRow, "realEndBalance"),
    };
  });
}

function cell(row: YearRow | undefined, key: "contributions" | "gain" | "tax" | "fees" | "endBalance" | "realEndBalance"): number | null {
  return row?.[key] ?? null;
}

/** Year 0 is the starting balance, then one point per year, same as `goalChart`. */
export function goalCompareChart(startingBalance: number, comparison: GoalComparison): GoalComparePoint[] {
  const savings = goalChart(startingBalance, comparison.savings.projection);
  const stocks = goalChart(startingBalance, comparison.stocks.projection);
  const count = Math.max(savings.length, stocks.length);
  return Array.from({ length: count }, (_, index) => ({
    year: savings[index]?.year ?? stocks[index]!.year,
    savings: savings[index]?.balance ?? null,
    stocks: stocks[index]?.balance ?? null,
    savingsReal: savings[index]?.real ?? null,
    stocksReal: stocks[index]?.real ?? null,
  }));
}

/** Duration phrase for the comparison cards. Years mode uses the typed year count. */
export function goalSpanLabel(input: { horizonMode: "years" | "date"; years: number; months: number }): string {
  if (input.horizonMode === "years") return countLabel(input.years, "year", "years");
  if (input.months < 1) return "under a month";
  const years = Math.floor(input.months / 12);
  const rest = input.months % 12;
  if (years === 0) return countLabel(rest, "month", "months");
  if (rest === 0) return countLabel(years, "year", "years");
  return `${countLabel(years, "year", "years")} ${countLabel(rest, "month", "months")}`;
}

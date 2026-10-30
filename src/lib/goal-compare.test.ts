import { describe, expect, it } from "vitest";
import { formatEur } from "./format.ts";
import { planGoal } from "./goal.ts";
import {
  GOAL_COMPARE_CAVEAT,
  compareGoals,
  goalCompareHeadline,
  goalComparePocketNote,
  goalSpanLabel,
  type GoalCompareInput,
} from "./goal-compare.ts";

function shared(overrides: Partial<GoalCompareInput> = {}): GoalCompareInput {
  return {
    targetKind: "balance",
    targetAmount: 100_000,
    balance: 10_000,
    months: 20 * 12,
    annualRate: 0.025,
    compounding: "monthly",
    taxRate: 0,
    expectedReturn: 0.07,
    feeRate: 0.0025,
    inflationRate: 0,
    ...overrides,
  };
}

describe("compareGoals", () => {
  it("matches the single-account plans, including tax and inflation", () => {
    const input = shared({
      targetKind: "growth",
      targetAmount: 40_000,
      balance: 2_500,
      months: 15 * 12,
      annualRate: 0.035,
      compounding: "quarterly",
      taxRate: 0.3,
      expectedReturn: 0.06,
      feeRate: 0.004,
      inflationRate: 0.02,
    });
    const comparison = compareGoals(input);
    expect(comparison.savings).toEqual(planGoal({ ...input, vehicle: "savings" }));
    expect(comparison.stocks).toEqual(planGoal({ ...input, vehicle: "stocks" }));
    expect(comparison.savings.projection.totalTax).toBeGreaterThan(0);
    expect(comparison.stocks.projection.totalFees).toBeGreaterThan(0);
    expect(comparison.savings.projection.finalBalance).toBeGreaterThan(comparison.savings.projection.finalRealBalance);
  });

  it("marks the investment when it needs less each month and less out of pocket", () => {
    const input = shared();
    const comparison = compareGoals(input);
    const savings = planGoal({ ...input, vehicle: "savings" });
    const stocks = planGoal({ ...input, vehicle: "stocks" });
    expect(comparison.lowerMonthly).toBe("stocks");
    expect(comparison.monthlyGap).toBeCloseTo(savings.monthlyContribution - stocks.monthlyContribution, 2);
    expect(comparison.lowerOutOfPocket).toBe("stocks");
    expect(comparison.outOfPocketGap).toBeCloseTo(
      savings.projection.totalContributions - stocks.projection.totalContributions,
      2,
    );
    expect(comparison.savings.projection.totalGain).toBe(savings.projection.totalGain);
    expect(comparison.stocks.projection.totalGain).toBe(stocks.projection.totalGain);
    expect(goalCompareHeadline(comparison)).toBe(
      `Investing needs ${formatEur(comparison.monthlyGap)} less each month`,
    );
    expect(goalComparePocketNote(comparison, "20 years")).toBe("less out of pocket over 20 years");
  });

  it("flips the wording when the savings account needs less", () => {
    const comparison = compareGoals(
      shared({
        targetAmount: 50_000,
        balance: 0,
        months: 10 * 12,
        annualRate: 0.08,
        taxRate: 0,
        expectedReturn: 0.01,
        feeRate: 0.01,
      }),
    );
    expect(comparison.lowerMonthly).toBe("savings");
    expect(comparison.lowerOutOfPocket).toBe("savings");
    expect(comparison.monthlyGap).toBeGreaterThan(0);
    expect(goalCompareHeadline(comparison)).toBe(`Savings needs ${formatEur(comparison.monthlyGap)} less each month`);
    expect(goalComparePocketNote(comparison, "10 years")).toBe("less out of pocket over 10 years");
  });

  it("treats equal monthly top-ups as a tie, including a goal the balance already covers", () => {
    const even = compareGoals(
      shared({
        targetAmount: 12_000,
        balance: 0,
        months: 12,
        annualRate: 0,
        taxRate: 0,
        expectedReturn: 0,
        feeRate: 0,
      }),
    );
    expect(even.savings.monthlyContribution).toBe(1_000);
    expect(even.stocks.monthlyContribution).toBe(1_000);
    expect(even.lowerMonthly).toBe("tie");
    expect(even.lowerOutOfPocket).toBe("tie");
    expect(even.monthlyGap).toBe(0);
    expect(even.outOfPocketGap).toBe(0);
    expect(goalCompareHeadline(even)).toBe("Both need the same each month");
    expect(goalComparePocketNote(even, "1 year")).toBe("the same out of pocket over 1 year");

    const covered = compareGoals(shared({ balance: 5_000, targetAmount: 1_000, months: 24 }));
    expect(covered.savings.status).toBe("reached");
    expect(covered.stocks.status).toBe("reached");
    expect(covered.lowerMonthly).toBe("tie");
    expect(covered.monthlyGap).toBe(0);
  });

  it("does not treat an unreachable side as the cheaper monthly top-up", () => {
    const stocksBlocked = compareGoals(
      shared({
        targetKind: "growth",
        targetAmount: 5_000,
        balance: 1_000,
        months: 10 * 12,
        annualRate: 0.03,
        expectedReturn: 0,
        feeRate: 0.2,
      }),
    );
    expect(stocksBlocked.savings.status).toBe("solvable");
    expect(stocksBlocked.stocks.status).toBe("unreachable");
    expect(stocksBlocked.lowerMonthly).toBe("none");
    expect(stocksBlocked.monthlyGap).toBe(0);
    expect(stocksBlocked.outOfPocketGap).toBe(0);
    expect(goalCompareHeadline(stocksBlocked)).toBe("The investment can't reach this goal under these rates.");
    expect(goalComparePocketNote(stocksBlocked, "10 years")).toBe("");

    const neither = compareGoals(shared({ months: -3, balance: 100, targetAmount: 500 }));
    expect(neither.savings.status).toBe("unreachable");
    expect(neither.stocks.status).toBe("unreachable");
    expect(neither.lowerMonthly).toBe("none");
    expect(goalCompareHeadline(neither)).toBe("Neither account can reach this goal under these rates.");

    const savingsBlocked = compareGoals(
      shared({
        targetKind: "growth",
        targetAmount: 5_000,
        balance: 0,
        months: 10 * 12,
        annualRate: 0,
        taxRate: 0,
        expectedReturn: 0.07,
        feeRate: 0,
      }),
    );
    expect(savingsBlocked.savings.status).toBe("unreachable");
    expect(savingsBlocked.stocks.status).toBe("solvable");
    expect(savingsBlocked.lowerMonthly).toBe("none");
    expect(goalCompareHeadline(savingsBlocked)).toBe("The savings account can't reach this goal under these rates.");
  });

  it("keeps the stock-return caveat with the comparison", () => {
    expect(GOAL_COMPARE_CAVEAT).toBe(
      "Under the rates you typed. Stock returns are not guaranteed and can be lower.",
    );
  });
});

describe("goalSpanLabel", () => {
  it("uses the typed year count, and whole months when the horizon is a date", () => {
    expect(goalSpanLabel({ horizonMode: "years", years: 20, months: 20 * 12 })).toBe("20 years");
    expect(goalSpanLabel({ horizonMode: "years", years: 1, months: 12 })).toBe("1 year");
    expect(goalSpanLabel({ horizonMode: "date", years: 20, months: 18 })).toBe("1 year 6 months");
    expect(goalSpanLabel({ horizonMode: "date", years: 20, months: 8 })).toBe("8 months");
    expect(goalSpanLabel({ horizonMode: "date", years: 20, months: 0 })).toBe("under a month");
  });
});

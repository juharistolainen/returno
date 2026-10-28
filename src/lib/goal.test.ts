import { describe, expect, it } from "vitest";
import { projectInvestment, projectSavings } from "./calc.ts";
import {
  monthsUntil,
  planGoal,
  savingsLinearGrowth,
  stockLinearGrowth,
  type GoalInput,
} from "./goal.ts";

function savingsGoal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    vehicle: "savings",
    targetKind: "balance",
    targetAmount: 12_000,
    balance: 0,
    months: 12,
    annualRate: 0,
    compounding: "monthly",
    taxRate: 0,
    expectedReturn: 0,
    feeRate: 0,
    inflationRate: 0,
    ...overrides,
  };
}

function expectMoney(actual: number, expected: number, tolerance = 0.05): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe("linear growth matches the forward simulation", () => {
  it("matches savings projections for each compounding frequency", () => {
    const cases = [
      { compounding: "annually" as const, annualRate: 0.03, taxRate: 0.3, balance: 8_000, monthly: 150, years: 12 },
      { compounding: "semiannually" as const, annualRate: 0.04, taxRate: 0, balance: 1_000, monthly: 80, years: 6 },
      { compounding: "quarterly" as const, annualRate: 0.05, taxRate: 0.3, balance: 2_500, monthly: 40, years: 9 },
      { compounding: "monthly" as const, annualRate: 0.025, taxRate: 0, balance: 10_000, monthly: 200, years: 20 },
      { compounding: "daily" as const, annualRate: 0.02, taxRate: 0.3, balance: 4_000, monthly: 75, years: 8 },
      { compounding: "monthly" as const, annualRate: 0, taxRate: 0.3, balance: 500, monthly: 25, years: 4 },
    ];
    for (const sample of cases) {
      const growth = savingsLinearGrowth(sample.years * 12, sample.annualRate, sample.compounding, sample.taxRate);
      const projected = projectSavings({
        balance: sample.balance,
        contribution: sample.monthly,
        contributionFrequency: "monthly",
        annualRate: sample.annualRate,
        compounding: sample.compounding,
        years: sample.years,
        taxRate: sample.taxRate,
        inflationRate: 0,
      });
      expectMoney(growth.alpha * sample.balance + growth.beta * sample.monthly, projected.finalBalance, 0.02);
    }
  });

  it("matches a stock projection after fees and inflation", () => {
    const growth = stockLinearGrowth(15 * 12, 0.07, 0.0025);
    const projected = projectInvestment({
      balance: 10_000,
      contribution: 200,
      contributionFrequency: "monthly",
      expectedReturn: 0.07,
      feeRate: 0.0025,
      years: 15,
      inflationRate: 0.02,
    });
    expectMoney(growth.alpha * 10_000 + growth.beta * 200, projected.finalBalance, 0.05);
  });

  it("keeps an 18-month annual savings path consistent with the closed form", () => {
    const growth = savingsLinearGrowth(18, 0.12, "annually", 0);
    expectMoney(growth.beta * 100, 1_878, 0.001);
  });
});

describe("planGoal", () => {
  it("solves a zero-rate savings goal as an even monthly split", () => {
    const plan = planGoal(savingsGoal());
    expect(plan.status).toBe("solvable");
    expect(plan.monthlyContribution).toBe(1_000);
    expect(plan.projection.finalBalance).toBe(12_000);
    expect(plan.projection.totalGain).toBe(0);
  });

  it("needs nothing when the current balance already reaches the target", () => {
    const above = planGoal(savingsGoal({ balance: 6_000, targetAmount: 5_000, annualRate: 0.04, months: 10 * 12 }));
    const exact = planGoal(savingsGoal({ balance: 5_000, targetAmount: 5_000, annualRate: 0.04, months: 10 * 12 }));
    expect(above.status).toBe("reached");
    expect(exact.status).toBe("reached");
    expect(above.monthlyContribution).toBe(0);
    expect(exact.monthlyContribution).toBe(0);
    expect(above.projection.finalBalance).toBeGreaterThan(5_000);
  });

  it("hits a compounded savings target when replayed, including tax", () => {
    for (const taxRate of [0, 0.3]) {
      const plan = planGoal(
        savingsGoal({
          balance: 10_000,
          targetAmount: 100_000,
          annualRate: 0.025,
          compounding: "monthly",
          taxRate,
          months: 20 * 12,
        }),
      );
      expect(plan.status).toBe("solvable");
      const replay = projectSavings({
        balance: 10_000,
        contribution: plan.monthlyContribution,
        contributionFrequency: "monthly",
        annualRate: 0.025,
        compounding: "monthly",
        years: 20,
        taxRate,
        inflationRate: 0,
      });
      expect(replay.finalBalance).toBeGreaterThanOrEqual(100_000 - 0.02);
      expect(plan.monthlyContribution).toBeGreaterThan(0);
    }
    const taxed = planGoal(savingsGoal({ balance: 10_000, targetAmount: 50_000, annualRate: 0.04, taxRate: 0.3, months: 15 * 12 }));
    const untaxed = planGoal(savingsGoal({ balance: 10_000, targetAmount: 50_000, annualRate: 0.04, taxRate: 0, months: 15 * 12 }));
    expect(taxed.monthlyContribution).toBeGreaterThan(untaxed.monthlyContribution);
  });

  it("cannot create net growth when the interest rate is zero", () => {
    const plan = planGoal(savingsGoal({ targetKind: "growth", targetAmount: 1_000, annualRate: 0 }));
    expect(plan.status).toBe("unreachable");
    expect(plan.monthlyContribution).toBe(0);
  });

  it("solves a net-growth target and replays it through the stock projection", () => {
    const plan = planGoal(
      savingsGoal({
        vehicle: "stocks",
        targetKind: "growth",
        targetAmount: 20_000,
        balance: 5_000,
        expectedReturn: 0.07,
        feeRate: 0.002,
        months: 10 * 12,
      }),
    );
    expect(plan.status).toBe("solvable");
    const replay = projectInvestment({
      balance: 5_000,
      contribution: plan.monthlyContribution,
      contributionFrequency: "monthly",
      expectedReturn: 0.07,
      feeRate: 0.002,
      years: 10,
      inflationRate: 0,
    });
    expect(replay.totalGain).toBeGreaterThanOrEqual(20_000 - 0.05);
  });

  it("treats an inflation-adjusted savings target as today's euros", () => {
    const shared = {
      vehicle: "savings" as const,
      targetKind: "balance" as const,
      targetAmount: 20_000,
      balance: 1_000,
      annualRate: 0.03,
      compounding: "monthly" as const,
      months: 10 * 12,
    };
    const plan = planGoal(savingsGoal({ ...shared, inflationRate: 0.02 }));
    const nominal = planGoal(savingsGoal(shared));
    expect(plan.status).toBe("solvable");
    expect(plan.monthlyContribution).toBeGreaterThan(nominal.monthlyContribution);
    expect(plan.projection.finalRealBalance).toBeGreaterThanOrEqual(20_000 - 0.05);
    expect(plan.projection.finalBalance).toBeGreaterThan(plan.projection.finalRealBalance);
  });

  it("keeps a partial-year savings goal in today's euros", () => {
    const plan = planGoal(
      savingsGoal({
        balance: 0,
        targetAmount: 5_000,
        annualRate: 0.04,
        compounding: "monthly",
        inflationRate: 0.03,
        months: 18,
      }),
    );
    expect(plan.status).toBe("solvable");
    expect(plan.projection.finalRealBalance).toBeGreaterThanOrEqual(5_000 - 0.05);
    expect(plan.projection.finalBalance).toBeGreaterThan(plan.projection.finalRealBalance);
    expect(plan.projection.rows.at(-1)?.realEndBalance).toBeCloseTo(plan.projection.finalRealBalance, 6);
    expect(plan.projection.rows.at(-1)?.year).toBeCloseTo(1.5, 8);
  });

  it("treats an inflation-adjusted stock target as today's euros", () => {
    const plan = planGoal(
      savingsGoal({
        vehicle: "stocks",
        targetKind: "balance",
        targetAmount: 80_000,
        balance: 10_000,
        expectedReturn: 0.06,
        feeRate: 0.002,
        inflationRate: 0.02,
        months: 15 * 12,
      }),
    );
    expect(plan.status).toBe("solvable");
    expect(plan.projection.finalRealBalance).toBeGreaterThanOrEqual(80_000 - 0.05);
    expect(plan.projection.finalBalance).toBeGreaterThan(plan.projection.finalRealBalance);
  });

  it("is unreachable when fees destroy growth and the target is net growth", () => {
    const plan = planGoal(
      savingsGoal({
        vehicle: "stocks",
        targetKind: "growth",
        targetAmount: 5_000,
        balance: 1_000,
        expectedReturn: 0,
        feeRate: 0.2,
        months: 10 * 12,
      }),
    );
    expect(plan.status).toBe("unreachable");
    expect(plan.monthlyContribution).toBe(0);
  });

  it("reports a past date with no time to contribute", () => {
    const plan = planGoal(savingsGoal({ months: -3, balance: 100, targetAmount: 500 }));
    expect(plan.status).toBe("unreachable");
    expect(plan.months).toBe(0);
    expect(plan.message).toMatch(/past/);
  });

  it("does not describe a date later this month as already past", () => {
    const plan = planGoal(savingsGoal({ months: 0, balance: 100, targetAmount: 500 }));
    expect(plan.status).toBe("unreachable");
    expect(plan.message).toMatch(/less than a month/);
  });

  it("refuses a horizon longer than 80 years instead of silently shortening it", () => {
    const plan = planGoal(savingsGoal({ months: 81 * 12, targetAmount: 1_000 }));
    expect(plan.status).toBe("unreachable");
    expect(plan.months).toBe(0);
    expect(plan.projection.rows).toEqual([]);
  });

  it("does not return NaN when the fund fee is not a real rate", () => {
    const plan = planGoal(
      savingsGoal({ vehicle: "stocks", feeRate: 1.5, expectedReturn: 0.07, targetAmount: 50_000, months: 24 }),
    );
    expect(plan.status).toBe("unreachable");
    expect(plan.monthlyContribution).toBe(0);
    expect(Number.isFinite(plan.projection.finalBalance)).toBe(true);
  });
});

describe("closed form across a spread of rates", () => {
  it("stays aligned with the forward simulation", () => {
    const rates = [0, 0.01, 0.025, 0.07, 0.12];
    const balances = [0, 1_000, 25_000];
    const monthlies = [0, 50, 400];
    for (const annualRate of rates) {
      for (const balance of balances) {
        for (const monthly of monthlies) {
          const growth = savingsLinearGrowth(10 * 12, annualRate, "quarterly", annualRate === 0 ? 0 : 0.3);
          const projected = projectSavings({
            balance,
            contribution: monthly,
            contributionFrequency: "monthly",
            annualRate,
            compounding: "quarterly",
            years: 10,
            taxRate: annualRate === 0 ? 0 : 0.3,
            inflationRate: 0,
          });
          expectMoney(growth.alpha * balance + growth.beta * monthly, projected.finalBalance, 0.05);
          expect(Number.isFinite(projected.finalBalance)).toBe(true);
        }
      }
    }
  });
});

describe("monthsUntil", () => {
  const today = new Date(2026, 9, 27);

  it("counts whole months and rejects impossible dates", () => {
    expect(monthsUntil("2027-10-27", today)).toBe(12);
    expect(monthsUntil("2027-10-26", today)).toBe(11);
    expect(monthsUntil("2026-11-27", today)).toBe(1);
    expect(monthsUntil("2026-10-27", today)).toBe(0);
    expect(monthsUntil("2026-09-01", today)).toBeLessThan(0);
    expect(monthsUntil("2026-02-31", today)).toBeNull();
    expect(monthsUntil("next-year", today)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { comparisonChart, projectComparison, projectSavingsScenario, projectStocksScenario } from "./project.ts";
import { defaultScenario, type Scenario } from "./scenario.ts";

function scenario(overrides: Partial<Scenario>): Scenario {
  return { ...defaultScenario, contribution: 0, years: 1, ...overrides };
}

describe("scenario projections", () => {
  it("treats savings and stock inputs as percentages", () => {
    const savings = projectSavingsScenario(
      scenario({ balance: 1_000, savingsRate: 10, compounding: "annually", taxEnabled: false }),
    );
    expect(savings.finalBalance).toBeCloseTo(1_100, 6);

    const taxed = projectSavingsScenario(
      scenario({ balance: 1_000, savingsRate: 10, compounding: "annually", taxEnabled: true, taxRate: 30 }),
    );
    expect(taxed.finalBalance).toBeCloseTo(1_070, 6);

    const stocks = projectStocksScenario(
      scenario({ balance: 1_000, expectedReturn: 10, fee: 1, inflationEnabled: true, inflationRate: 2 }),
    );
    expect(stocks.finalBalance).toBeCloseTo(1_000 * 1.1 * 0.99, 6);
    expect(stocks.finalRealBalance).toBeCloseTo(stocks.finalBalance / 1.02, 4);
  });

  it("uses one inflation switch for savings and for stocks", () => {
    const base = scenario({
      balance: 1_000,
      years: 2,
      savingsRate: 10,
      compounding: "annually",
      expectedReturn: 10,
      fee: 0,
      inflationRate: 2,
    });
    const inflated = { ...base, inflationEnabled: true };
    const off = projectComparison({ ...base, inflationEnabled: false });
    const on = projectComparison(inflated);
    expect(on.savings.finalBalance).toBeCloseTo(off.savings.finalBalance, 6);
    expect(on.stocks.finalBalance).toBeCloseTo(off.stocks.finalBalance, 6);
    expect(off.savings.finalRealBalance).toBeCloseTo(off.savings.finalBalance, 6);
    expect(on.savings.finalRealBalance).toBeCloseTo(on.savings.finalBalance / 1.02 ** 2, 4);
    expect(on.stocks.finalRealBalance).toBeCloseTo(on.stocks.finalBalance / 1.02 ** 2, 4);
    expect(on.realDifference).toBeCloseTo(on.stocks.finalRealBalance - on.savings.finalRealBalance, 6);
    const point = comparisonChart(inflated, on).at(-1);
    expect(point?.savingsReal).toBeCloseTo(on.savings.finalRealBalance, 6);
    expect(point?.stocksReal).toBeCloseTo(on.stocks.finalRealBalance, 6);
  });

  it("compares both projections from one scenario", () => {
    const comparison = projectComparison(
      scenario({ balance: 1_000, savingsRate: 0, expectedReturn: 0, fee: 0, compounding: "annually" }),
    );
    expect(comparison.nominalDifference).toBeCloseTo(0, 6);
    expect(comparison.savings.finalBalance).toBeCloseTo(1_000, 6);
  });
});

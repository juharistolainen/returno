import { describe, expect, it } from "vitest";
import { projectComparison, projectSavingsScenario, projectStocksScenario } from "./project.ts";
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

  it("compares both projections from one scenario", () => {
    const comparison = projectComparison(
      scenario({ balance: 1_000, savingsRate: 0, expectedReturn: 0, fee: 0, compounding: "annually" }),
    );
    expect(comparison.nominalDifference).toBeCloseTo(0, 6);
    expect(comparison.savings.finalBalance).toBeCloseTo(1_000, 6);
  });
});

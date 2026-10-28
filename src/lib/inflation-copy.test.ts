import { describe, expect, it } from "vitest";
import { formatEur } from "./format.ts";
import {
  balanceInflationCopy,
  chartShowsInflationBand,
  compareInflationCopy,
  goalInflationCopy,
  lostToInflation,
} from "./inflation-copy.ts";
import { projectComparison, projectSavingsScenario, projectStocksScenario } from "./project.ts";
import { defaultScenario } from "./scenario.ts";

describe("lostToInflation", () => {
  it("is zero when inflation is off, because real balances stay nominal", () => {
    const savings = projectSavingsScenario(defaultScenario);
    const stocks = projectStocksScenario(defaultScenario);
    expect(defaultScenario.inflationEnabled).toBe(false);
    expect(lostToInflation(savings.finalBalance, savings.finalRealBalance)).toBeCloseTo(0, 6);
    expect(lostToInflation(stocks.finalBalance, stocks.finalRealBalance)).toBeCloseTo(0, 6);
    for (const row of savings.rows) {
      expect(lostToInflation(row.endBalance, row.realEndBalance)).toBeCloseTo(0, 6);
    }
  });

  it("shows the default purchasing-power gap when inflation is on", () => {
    const on = { ...defaultScenario, inflationEnabled: true };
    const comparison = projectComparison(on);
    const savingsLost = lostToInflation(comparison.savings.finalBalance, comparison.savings.finalRealBalance);
    const stocksLost = lostToInflation(comparison.stocks.finalBalance, comparison.stocks.finalRealBalance);
    expect(comparison.savings.finalBalance).toBeCloseTo(78_803.15, 1);
    expect(comparison.savings.finalRealBalance).toBeCloseTo(53_032.26, 1);
    expect(savingsLost).toBeCloseTo(25_770.89, 1);
    expect(comparison.stocks.finalBalance).toBeCloseTo(135_820.03, 1);
    expect(comparison.stocks.finalRealBalance).toBeCloseTo(91_402.99, 1);
    expect(stocksLost).toBeCloseTo(44_417.04, 1);

    const first = comparison.savings.rows[0]!;
    const last = comparison.savings.rows.at(-1)!;
    const lostFirst = lostToInflation(first.endBalance, first.realEndBalance);
    const lostLast = lostToInflation(last.endBalance, last.realEndBalance);
    expect(lostFirst).toBeCloseTo(248.74, 1);
    expect(lostLast).toBeCloseTo(savingsLost, 4);
    expect(lostLast).toBeGreaterThan(lostFirst);
  });
});

describe("inflation impact visibility", () => {
  it("shades a band only for a nominal line paired with today's euros", () => {
    expect(chartShowsInflationBand(["balance"])).toBe(false);
    expect(chartShowsInflationBand(["balance", "real"])).toBe(true);
    expect(chartShowsInflationBand(["balance", "real", "target"])).toBe(true);
    expect(chartShowsInflationBand(["savings", "stocks"])).toBe(false);
    expect(chartShowsInflationBand(["savings", "stocks", "savingsReal", "stocksReal"])).toBe(false);
  });
});

describe("inflation copy", () => {
  it("states the savings purchasing-power loss", () => {
    const on = projectSavingsScenario({ ...defaultScenario, inflationEnabled: true });
    const lost = lostToInflation(on.finalBalance, on.finalRealBalance);
    expect(balanceInflationCopy(2, on.finalRealBalance, lost)).toBe(
      `At 2% inflation, the ending balance buys what ${formatEur(on.finalRealBalance)} buys today. ${formatEur(lost)} of purchasing power is gone.`,
    );
  });

  it("says inflation cuts the stocks lead on the default comparison", () => {
    const comparison = projectComparison({ ...defaultScenario, inflationEnabled: true });
    expect(compareInflationCopy(comparison.nominalDifference, comparison.realDifference)).toBe(
      `Inflation cuts the stocks lead from ${formatEur(comparison.nominalDifference)} to ${formatEur(comparison.realDifference)}.`,
    );
  });

  it("names a savings lead, a widened lead, and a change of leader", () => {
    expect(compareInflationCopy(-1_000, -400)).toBe(
      `Inflation cuts the savings lead from ${formatEur(1_000)} to ${formatEur(400)}.`,
    );
    expect(compareInflationCopy(1_000, 1_400)).toBe(
      `Inflation widens the stocks lead from ${formatEur(1_000)} to ${formatEur(1_400)}.`,
    );
    expect(compareInflationCopy(1_000, -200)).toBe(
      `In nominal euros, stocks finish ${formatEur(1_000)} ahead. In today's euros, savings finish ${formatEur(200)} ahead.`,
    );
    expect(compareInflationCopy(0, 0)).toBe("They end even in nominal euros and in today's euros.");
  });

  it("tells a goal how much nominal balance today's euros require", () => {
    expect(goalInflationCopy(100_001.7, 148_597.26, 423.97, 268.03)).toBe(
      `To still be worth ${formatEur(100_001.7)}, the account has to reach ${formatEur(148_597.26)}. The monthly top-up is ${formatEur(423.97)}, against ${formatEur(268.03)} with inflation off.`,
    );
  });

  it("omits the comparison when inflation does not change the monthly top-up", () => {
    expect(goalInflationCopy(10_000, 10_000, 200, 200)).toBe(
      `To still be worth ${formatEur(10_000)}, the account has to reach ${formatEur(10_000)}.`,
    );
  });
});

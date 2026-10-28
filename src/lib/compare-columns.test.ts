import { describe, expect, it } from "vitest";
import { compareLeadLabel, compareSummaryKeys, compareYearHeaders } from "./compare-columns.ts";

describe("compare summary cards", () => {
  it("keeps savings, stocks, and the lead in one row when inflation is off", () => {
    expect(compareSummaryKeys(false)).toEqual([["savings", "stocks", "lead"]]);
  });

  it("stacks each path in its own column and puts both leads in the third", () => {
    expect(compareSummaryKeys(true)).toEqual([
      ["savings", "savingsReal", "savingsLost"],
      ["stocks", "stocksReal", "stocksLost"],
      ["lead", "leadReal"],
    ]);
  });
});

describe("compare lead labels", () => {
  it("names who finishes ahead, and adds today's euros for the real gap", () => {
    expect(compareLeadLabel(100)).toBe("Stocks end ahead");
    expect(compareLeadLabel(-100)).toBe("Savings end ahead");
    expect(compareLeadLabel(0)).toBe("They end even");
    expect(compareLeadLabel(100, true)).toBe("Stocks end ahead in today's euros");
    expect(compareLeadLabel(-100, true)).toBe("Savings end ahead in today's euros");
    expect(compareLeadLabel(0, true)).toBe("They end even in today's euros");
  });
});

describe("compare year table columns", () => {
  it("keeps the nominal columns in year, savings, stocks, gap order", () => {
    expect(compareYearHeaders(false)).toEqual(["Year", "Savings", "Stocks", "Gap"]);
  });

  it("places today's euros after the nominal gap", () => {
    expect(compareYearHeaders(true)).toEqual([
      "Year",
      "Savings",
      "Stocks",
      "Gap",
      "Savings today",
      "Stocks today",
      "Gap today",
    ]);
  });
});

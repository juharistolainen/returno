import { describe, expect, it } from "vitest";
import { compareSummaryKeys, compareYearHeaders } from "./compare-columns.ts";

describe("compare summary cards", () => {
  it("keeps savings, stocks, and the lead in one row when inflation is off", () => {
    expect(compareSummaryKeys(false)).toEqual([["savings", "stocks", "lead"]]);
  });

  it("stacks each path in its own column and leaves the lead alone", () => {
    expect(compareSummaryKeys(true)).toEqual([
      ["savings", "savingsReal", "savingsLost"],
      ["stocks", "stocksReal", "stocksLost"],
      ["lead"],
    ]);
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

import { describe, expect, it } from "vitest";
import { compareYearHeaders } from "./compare-columns.ts";

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

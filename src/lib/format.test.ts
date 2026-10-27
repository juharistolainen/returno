import { describe, expect, it } from "vitest";
import { formatChartYear, formatEur } from "./format.ts";

describe("formatChartYear", () => {
  it("keeps whole years as integers and rounds fractions to one decimal", () => {
    expect(formatChartYear(0)).toBe("0");
    expect(formatChartYear(10)).toBe("10");
    expect(formatChartYear(122 / 12)).toBe("10.2");
    expect(formatChartYear(Number.NaN)).toBe("");
  });
});

describe("formatEur", () => {
  it("groups thousands and keeps cents without breaking the number", () => {
    const formatted = formatEur(99999999.99);
    expect(formatted.replace(/\s/g, "")).toBe("99999999,99€");
    expect(formatted).not.toMatch(/\n/);
  });
});

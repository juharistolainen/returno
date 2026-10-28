import { describe, expect, it } from "vitest";
import { inflationFactor, nominalFromReal, realValue } from "./inflation.ts";

describe("inflation", () => {
  it("leaves today and a zero rate unchanged", () => {
    expect(inflationFactor(0, 0.02)).toBe(1);
    expect(inflationFactor(10, 0)).toBe(1);
    expect(inflationFactor(-2, 0.02)).toBe(1);
    expect(realValue(1_000, 0.02, 0)).toBe(1_000);
    expect(realValue(1_000, 0, 10)).toBe(1_000);
    expect(nominalFromReal(1_000, 0.02, 0)).toBe(1_000);
  });

  it("deflates a nominal amount by (1 + inflation) raised to the year", () => {
    expect(realValue(1_000, 0.02, 15)).toBeCloseTo(1_000 / Math.pow(1.02, 15), 8);
    expect(realValue(1_000, 0.02, 1.5)).toBeCloseTo(1_000 / Math.pow(1.02, 1.5), 8);
  });

  it("turns a target in today's euros into the nominal amount that matches it", () => {
    expect(nominalFromReal(80_000, 0.02, 15)).toBeCloseTo(80_000 * Math.pow(1.02, 15), 6);
    expect(realValue(nominalFromReal(80_000, 0.02, 15), 0.02, 15)).toBeCloseTo(80_000, 6);
  });
});

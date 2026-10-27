import { describe, expect, it } from "vitest";
import {
  defaultScenario,
  numberFieldError,
  parseScenario,
  parseUserNumber,
  resolveScenario,
  scenarioFromForm,
  scenarioToFormValues,
} from "./scenario.ts";

describe("parseScenario", () => {
  it("returns the defaults for an empty search", () => {
    expect(parseScenario({})).toEqual(defaultScenario);
  });

  it("accepts numeric strings and clamps impossible values", () => {
    const scenario = parseScenario({
      balance: "5000",
      contribution: "-20",
      years: "20.4",
      savingsRate: "150",
      fee: "0.2",
      taxRate: "30",
    });
    expect(scenario.balance).toBe(5_000);
    expect(scenario.contribution).toBe(0);
    expect(scenario.years).toBe(20);
    expect(scenario.savingsRate).toBe(100);
    expect(scenario.fee).toBe(0.2);
    expect(scenario.taxRate).toBe(30);
  });

  it("falls back when a frequency or boolean is not recognized", () => {
    const scenario = parseScenario({
      contributionFrequency: "weekly",
      compounding: "hourly",
      taxEnabled: "yes",
      inflationEnabled: "false",
      targetKind: "profit",
      vehicle: "crypto",
      horizonMode: "soon",
      targetDate: "2026-13-40",
    });
    expect(scenario.contributionFrequency).toBe(defaultScenario.contributionFrequency);
    expect(scenario.compounding).toBe(defaultScenario.compounding);
    expect(scenario.taxEnabled).toBe(false);
    expect(scenario.inflationEnabled).toBe(false);
    expect(scenario.targetKind).toBe(defaultScenario.targetKind);
    expect(scenario.vehicle).toBe("savings");
    expect(scenario.horizonMode).toBe("years");
    expect(scenario.targetDate).toBe(defaultScenario.targetDate);
  });

  it("reads boolean flags from strings", () => {
    const scenario = parseScenario({ taxEnabled: "true", inflationEnabled: "0" });
    expect(scenario.taxEnabled).toBe(true);
    expect(scenario.inflationEnabled).toBe(false);
  });

  it("rounds years and keeps them inside 1 to 80", () => {
    expect(parseScenario({ years: "0" }).years).toBe(1);
    expect(parseScenario({ years: "80.6" }).years).toBe(80);
    expect(parseScenario({ years: "nope" }).years).toBe(defaultScenario.years);
  });
});

describe("resolveScenario", () => {
  it("uses the stored scenario only when the URL has no search keys", () => {
    const stored = { ...defaultScenario, balance: 42, years: 7 };
    expect(resolveScenario({}, stored).balance).toBe(42);
    expect(resolveScenario({ balance: "5" }, stored).balance).toBe(5);
    expect(resolveScenario({ balance: "5" }, stored).years).toBe(defaultScenario.years);
  });
});

describe("scenarioFromForm", () => {
  it("round-trips a scenario and rejects incomplete or out-of-range input", () => {
    const values = scenarioToFormValues(defaultScenario);
    expect(scenarioFromForm(values)).toEqual(defaultScenario);
    expect(scenarioFromForm({ ...values, savingsRate: "2." })).toBeNull();
    expect(scenarioFromForm({ ...values, years: "1.5" })).toBeNull();
    expect(scenarioFromForm({ ...values, fee: "25" })).toBeNull();
    expect(numberFieldError("years", "1.5")).toMatch(/whole number/);
    expect(numberFieldError("balance", "2.")).toBeUndefined();
  });
});

describe("parseUserNumber", () => {
  it("accepts decimals with a dot or a comma and waits on a trailing separator", () => {
    expect(parseUserNumber("2.5")).toBe(2.5);
    expect(parseUserNumber("2,5")).toBe(2.5);
    expect(parseUserNumber("1 000")).toBe(1000);
    expect(parseUserNumber("2.")).toBe("incomplete");
    expect(parseUserNumber("")).toBe("incomplete");
    expect(parseUserNumber("abc")).toBe("invalid");
    expect(parseUserNumber("-1")).toBe("invalid");
  });
});

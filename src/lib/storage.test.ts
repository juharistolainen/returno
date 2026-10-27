import { describe, expect, it } from "vitest";
import { defaultScenario } from "./scenario.ts";
import { readStoredScenario, SCENARIO_STORAGE_KEY, writeStoredScenario } from "./storage.ts";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("scenario storage", () => {
  it("round-trips the last scenario", () => {
    const storage = memoryStorage();
    const scenario = { ...defaultScenario, balance: 12_345, taxEnabled: true, compounding: "quarterly" as const };
    writeStoredScenario(scenario, storage);
    expect(storage.getItem(SCENARIO_STORAGE_KEY)).toContain("12345");
    expect(readStoredScenario(storage)).toEqual(scenario);
  });

  it("returns null for missing or broken JSON", () => {
    const storage = memoryStorage();
    expect(readStoredScenario(storage)).toBeNull();
    storage.setItem(SCENARIO_STORAGE_KEY, "{");
    expect(readStoredScenario(storage)).toBeNull();
  });
});

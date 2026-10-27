import { parseScenario, type Scenario } from "./scenario.ts";

export const SCENARIO_STORAGE_KEY = "returno.scenario.v1";

export function readStoredScenario(storage: Pick<Storage, "getItem"> | null = defaultStorage()): Scenario | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SCENARIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parseScenario(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function writeStoredScenario(
  scenario: Scenario,
  storage: Pick<Storage, "setItem"> | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenario));
  } catch {
    // Private mode and full storage can reject writes. The URL still holds the scenario.
  }
}

function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

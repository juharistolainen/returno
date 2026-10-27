import { resolveScenario, type Scenario } from "./scenario.ts";
import { readStoredScenario } from "./storage.ts";

/** Validate router search params. A URL with no query restores the last scenario. */
export function validateSearch(search: Record<string, unknown>): Scenario {
  return resolveScenario(search, readStoredScenario());
}

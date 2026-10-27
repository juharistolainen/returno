import { stripSearchParams, type SearchMiddleware } from "@tanstack/react-router";
import { defaultScenario, parseScenario, type Scenario } from "./scenario.ts";

/**
 * Validate router search params from the URL alone.
 * A bare URL stays bare: the saved scenario is applied in the page, not here,
 * because the router rewrites the address bar to match this result.
 */
export function validateSearch(search: Record<string, unknown>): Scenario {
  return parseScenario(search);
}

/** Drop search params whose values equal the defaults, so those keys never appear in the URL. */
export const calculatorSearch: { middlewares: Array<SearchMiddleware<Scenario>> } = {
  middlewares: [stripSearchParams<Scenario>(defaultScenario)],
};

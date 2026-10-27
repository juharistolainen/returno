import { useCallback, useMemo } from "react";
import { defaultParseSearch, useLocation, useNavigate } from "@tanstack/react-router";
import { isCalculatorPath } from "../lib/paths.ts";
import { resolveScenario, scenarioEqual, scenarioToSearch, type Scenario } from "../lib/scenario.ts";
import { readStoredScenario, writeStoredScenario } from "../lib/storage.ts";

/** Show the saved scenario when the address bar has no query. */
export function useShownScenario(): Scenario {
  const searchStr = useLocation().searchStr;
  return useMemo(() => resolveScenario(defaultParseSearch(searchStr), readStoredScenario()), [searchStr]);
}

export function useReplaceScenario(scenario: Scenario): (next: Scenario) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (next: Scenario) => {
      if (scenarioEqual(next, scenario)) return;
      // A bare URL restores storage. Save first so a reset to the defaults is what the next match reads.
      writeStoredScenario(next);
      const pathname = location.pathname;
      if (isCalculatorPath(pathname)) {
        void navigate({ to: pathname, search: scenarioToSearch(next) as Scenario, replace: true });
      }
    },
    [location.pathname, navigate, scenario],
  );
}

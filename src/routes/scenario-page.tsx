import { useCallback } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { scenarioEqual, type Scenario } from "../lib/scenario.ts";

export function useReplaceScenario(scenario: Scenario): (next: Scenario) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (next: Scenario) => {
      if (scenarioEqual(next, scenario)) return;
      const pathname = location.pathname;
      if (pathname === "/savings" || pathname === "/stocks" || pathname === "/compare") {
        void navigate({ to: pathname, search: next, replace: true });
      }
    },
    [location.pathname, navigate, scenario],
  );
}

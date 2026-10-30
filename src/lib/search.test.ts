import { createMemoryHistory, defaultStringifySearch } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReturnoRouter } from "../router.tsx";
import { defaultScenario, scenarioFromLocation, scenarioToSearch, type Scenario } from "./scenario.ts";
import { validateSearch } from "./search.ts";
import { writeStoredScenario } from "./storage.ts";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
}

function shownScenario(router: ReturnType<typeof createReturnoRouter>): Scenario {
  const match = router.state.matches[router.state.matches.length - 1];
  return match?.search as Scenario;
}

async function load(path: string) {
  const router = createReturnoRouter(createMemoryHistory({ initialEntries: [path] }));
  await router.load();
  return router;
}

describe("calculator search urls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps a bare visit free of a query string", async () => {
    for (const path of ["/", "/savings", "/stocks", "/compare", "/goal"]) {
      const router = await load(path);
      expect(router.state.location.pathname).toBe(path);
      expect(router.state.location.searchStr).toBe("");
    }
  });

  it("restores a saved scenario from a bare url without writing params", async () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    const saved = { ...defaultScenario, balance: 42, years: 7 };
    writeStoredScenario(saved, storage);
    const router = await load("/savings");
    expect(router.state.location.searchStr).toBe("");
    expect(validateSearch({})).toEqual(defaultScenario);
    expect(shownScenario(router)).toEqual(defaultScenario);
    expect(scenarioFromLocation(shownScenario(router), router.state.location.searchStr, saved)).toEqual(saved);
  });

  it("omits default params when navigating and round-trips the rest", async () => {
    const router = await load("/savings");
    const custom = { ...defaultScenario, balance: 2_500, taxEnabled: true, vehicle: "stocks" as const };
    await router.navigate({ to: "/stocks", search: custom, replace: true });
    expect(router.state.location.searchStr).toBe(defaultStringifySearch(scenarioToSearch(custom)));
    expect(router.state.location.searchStr).not.toContain("contribution=");
    expect(router.state.location.searchStr).not.toContain("years=");
    expect(shownScenario(router)).toEqual(custom);

    await router.navigate({
      to: "/goal",
      search: scenarioToSearch(custom) as typeof custom,
      replace: true,
    });
    expect(router.state.location.searchStr).toBe(defaultStringifySearch(scenarioToSearch(custom)));
    expect(shownScenario(router)).toEqual(custom);

    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    writeStoredScenario(defaultScenario, storage);
    await router.navigate({
      to: "/compare",
      search: scenarioToSearch(defaultScenario) as typeof defaultScenario,
      replace: true,
    });
    expect(router.state.location.searchStr).toBe("");
    expect(shownScenario(router)).toEqual(defaultScenario);
  });

  it("restores the goal both mode from a shared link without default params", async () => {
    const router = await load("/goal?vehicle=both");
    expect(router.state.location.searchStr).toContain("vehicle=both");
    expect(router.state.location.searchStr).not.toContain("years=");
    expect(router.state.location.searchStr).not.toContain("balance=");
    expect(router.state.location.searchStr).not.toContain("savingsRate=");
    expect(shownScenario(router).vehicle).toBe("both");
    expect(shownScenario(router).years).toBe(defaultScenario.years);
    expect(shownScenario(router).targetAmount).toBe(defaultScenario.targetAmount);
  });

  it("restores an incoming query and does not add the missing defaults", async () => {
    const router = await load("/goal?balance=2500&horizonMode=date");
    expect(router.state.location.searchStr).toContain("balance=2500");
    expect(router.state.location.searchStr).toContain("horizonMode=date");
    expect(router.state.location.searchStr).not.toContain("years=");
    expect(router.state.location.searchStr).not.toContain("contribution=");
    const shown = shownScenario(router);
    expect(shown.balance).toBe(2_500);
    expect(shown.horizonMode).toBe("date");
    expect(shown.years).toBe(defaultScenario.years);
    expect(shown.contribution).toBe(defaultScenario.contribution);
  });
});

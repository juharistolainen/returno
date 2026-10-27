import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { compareRoute } from "./routes/compare.tsx";
import { goalRoute } from "./routes/goal.tsx";
import { homeRoute } from "./routes/home.tsx";
import { rootRoute } from "./routes/root.tsx";
import { savingsRoute } from "./routes/savings.tsx";
import { stocksRoute } from "./routes/stocks.tsx";

const routeTree = rootRoute.addChildren([homeRoute, savingsRoute, stocksRoute, compareRoute, goalRoute]);

function routerBasepath(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return undefined;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function createReturnoRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    basepath: routerBasepath(),
    ...(history ? { history, isServer: false, origin: "http://localhost" } : {}),
  });
}

export const router = createReturnoRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

import { createRoute, createRouter, redirect } from "@tanstack/react-router";
import { validateSearch } from "./lib/search.ts";
import { compareRoute } from "./routes/compare.tsx";
import { rootRoute } from "./routes/root.tsx";
import { savingsRoute } from "./routes/savings.tsx";
import { stocksRoute } from "./routes/stocks.tsx";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/savings", search });
  },
});

const routeTree = rootRoute.addChildren([indexRoute, savingsRoute, stocksRoute, compareRoute]);

function routerBasepath(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return undefined;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const router = createRouter({
  routeTree,
  basepath: routerBasepath(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

import { createRootRoute } from "@tanstack/react-router";
import { NotFound, RootLayout } from "../components/AppShell.tsx";

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

import { Link, createRoute } from "@tanstack/react-router";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { requirePage } from "../content/seo.ts";
import { defaultScenario, scenarioToSearch, type Scenario } from "../lib/scenario.ts";
import { readStoredScenario } from "../lib/storage.ts";
import { rootRoute } from "./root.tsx";

const home = requirePage("/");

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

function HomePage() {
  const scenario = readStoredScenario() ?? defaultScenario;
  return (
    <>
      <header className="max-w-3xl">
        <p className="wds-eyebrow eyebrow">{home.eyebrow}</p>
        <h1 className="display-md mt-2 mb-0">{home.h1}</h1>
        <p className="wds-lead mt-3 mb-0">{home.lede}</p>
      </header>
      <ul className="mt-8 grid gap-3 p-0 sm:grid-cols-2">
        <CalculatorLink to="/savings" scenario={scenario} title="Savings" text="Compound interest on a balance with regular top-ups." />
        <CalculatorLink to="/stocks" scenario={scenario} title="Stocks" text="An expected return after the annual fund fee." />
        <CalculatorLink to="/compare" scenario={scenario} title="Compare" text="The same deposits on both paths, and the gap at the end." />
        <CalculatorLink to="/goal" scenario={scenario} title="Goal" text="The monthly top-up that reaches a target." />
      </ul>
      <SeoBlock page={home} />
    </>
  );
}

function CalculatorLink({
  to,
  scenario,
  title,
  text,
}: {
  to: "/savings" | "/stocks" | "/compare" | "/goal";
  scenario: typeof defaultScenario;
  title: string;
  text: string;
}) {
  return (
    <li className="mb-0">
      <Link
        to={to}
        search={scenarioToSearch(scenario) as Scenario}
        className="block h-full rounded-2xl bg-card p-6 text-ink no-underline"
      >
        <span className="display-xs block">{title}</span>
        <span className="body-sm mt-1 block text-muted">{text}</span>
      </Link>
    </li>
  );
}

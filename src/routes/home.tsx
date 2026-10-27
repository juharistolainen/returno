import { Link, createRoute } from "@tanstack/react-router";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { requirePage } from "../content/seo.ts";
import { defaultScenario } from "../lib/scenario.ts";
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
        <p className="text-sm font-semibold tracking-wide text-savings uppercase">{home.eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">{home.h1}</h1>
        <p className="mt-3 text-lg text-muted">{home.lede}</p>
      </header>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
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
    <li>
      <Link to={to} search={scenario} className="block rounded-2xl border border-line bg-card px-4 py-4">
        <span className="font-display text-2xl">{title}</span>
        <span className="mt-1 block text-sm text-muted">{text}</span>
      </Link>
    </li>
  );
}

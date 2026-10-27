import { createRoute } from "@tanstack/react-router";
import { GrowthChart } from "../components/GrowthChart.tsx";
import { PageIntro } from "../components/PageIntro.tsx";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { ScenarioForm } from "../components/ScenarioForm.tsx";
import { Summary } from "../components/Summary.tsx";
import { YearTable } from "../components/YearTable.tsx";
import { formatEur } from "../lib/format.ts";
import { requirePage } from "../content/seo.ts";
import { projectStocksScenario, savingsChart } from "../lib/project.ts";
import { calculatorSearch, validateSearch } from "../lib/search.ts";
import { rootRoute } from "./root.tsx";
import { useReplaceScenario, useShownScenario } from "./scenario-page.tsx";

const stocksSeo = requirePage("/stocks");

export const stocksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stocks",
  validateSearch,
  search: calculatorSearch,
  component: StocksPage,
});

function StocksPage() {
  const scenario = useShownScenario();
  const update = useReplaceScenario(scenario);
  const projection = projectStocksScenario(scenario);
  const chart = savingsChart(scenario, projection).map((point) => ({
    year: point.year,
    balance: point.balance,
    real: point.real,
  }));
  const series = scenario.inflationEnabled
    ? [
        { dataKey: "balance", label: "Nominal balance", color: "var(--positive-deep)", fill: "var(--positive-pale)" },
        { dataKey: "real", label: "Today's euros", color: "var(--body)" },
      ]
    : [{ dataKey: "balance", label: "Balance", color: "var(--positive-deep)", fill: "var(--positive-pale)" }];

  return (
    <>
      <PageIntro
        eyebrow="Stocks"
        title="Project an investment"
        lede="Same deposits, an expected yearly return, and the fund fee taken off along the way."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-card p-6">
          <ScenarioForm scenario={scenario} onScenario={update} mode="stocks" />
        </section>
        <div className="flex min-w-0 flex-col gap-6">
          <Summary
            stats={[
              { label: "Final balance", value: formatEur(projection.finalBalance) },
              { label: "Total contributions", value: formatEur(projection.totalContributions) },
              {
                label: "Gain after fees",
                value: formatEur(projection.totalGain),
                tone: projection.totalGain < 0 ? "text-stocks" : undefined,
              },
              { label: "Fees paid", value: formatEur(projection.totalFees) },
              ...(scenario.inflationEnabled
                ? [
                    {
                      label: "In today's euros",
                      value: formatEur(projection.finalRealBalance),
                      hint: "Purchasing power at the end",
                    },
                  ]
                : []),
            ]}
          />
          <GrowthChart data={chart} series={series} label="Growth" />
          <YearTable
            rows={projection.rows}
            caption="Investment balance at the end of each year"
            columns={[
              { id: "year", header: "Year", align: "left", cell: (row) => String(row.year) },
              { id: "topups", header: "Top-ups", align: "right", cell: (row) => formatEur(row.contributions) },
              { id: "gain", header: "Gain", align: "right", cell: (row) => formatEur(row.gain) },
              { id: "fees", header: "Fees", align: "right", cell: (row) => formatEur(row.fees) },
              { id: "balance", header: "End balance", align: "right", cell: (row) => formatEur(row.endBalance) },
              ...(scenario.inflationEnabled
                ? [
                    {
                      id: "real",
                      header: "Today's euros",
                      align: "right" as const,
                      cell: (row: (typeof projection.rows)[number]) => formatEur(row.realEndBalance),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
      <SeoBlock page={stocksSeo} />
    </>
  );
}

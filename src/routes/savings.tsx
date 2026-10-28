import { createRoute } from "@tanstack/react-router";
import { GrowthChart } from "../components/GrowthChart.tsx";
import { PageIntro } from "../components/PageIntro.tsx";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { ScenarioForm } from "../components/ScenarioForm.tsx";
import { Summary } from "../components/Summary.tsx";
import { YearTable } from "../components/YearTable.tsx";
import { formatEur } from "../lib/format.ts";
import { requirePage } from "../content/seo.ts";
import { projectSavingsScenario, savingsChart } from "../lib/project.ts";
import { calculatorSearch, validateSearch } from "../lib/search.ts";
import { rootRoute } from "./root.tsx";
import { useReplaceScenario, useShownScenario } from "./scenario-page.tsx";

const savingsSeo = requirePage("/savings");

export const savingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/savings",
  validateSearch,
  search: calculatorSearch,
  component: SavingsPage,
});

function SavingsPage() {
  const scenario = useShownScenario();
  const update = useReplaceScenario(scenario);
  const projection = projectSavingsScenario(scenario);
  const chart = savingsChart(scenario, projection).map((point) => ({
    year: point.year,
    balance: point.balance,
    real: point.real,
  }));
  const series = scenario.inflationEnabled
    ? [
        { dataKey: "balance", label: "Nominal balance", color: "#0f6e62" },
        { dataKey: "real", label: "Today's euros", color: "#35557a" },
      ]
    : [{ dataKey: "balance", label: "Balance", color: "#0f6e62" }];

  return (
    <>
      <PageIntro
        eyebrow="Savings"
        title="Compound a savings balance"
        lede="See a final balance, the money you put in, and the interest that built on top of it."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <ScenarioForm scenario={scenario} onScenario={update} mode="savings" />
        </section>
        <div className="flex min-w-0 flex-col gap-6">
          <Summary
            stats={[
              { label: "Final balance", value: formatEur(projection.finalBalance), tone: "text-savings" },
              { label: "Total contributions", value: formatEur(projection.totalContributions) },
              { label: "Interest earned", value: formatEur(projection.totalGain) },
              ...(scenario.taxEnabled
                ? [{ label: "Tax on interest", value: formatEur(projection.totalTax), hint: "Paid from the account" }]
                : []),
              ...(scenario.inflationEnabled
                ? [
                    {
                      label: "In today's euros",
                      value: formatEur(projection.finalRealBalance),
                      tone: "text-real",
                      hint: "Purchasing power at the end",
                    },
                  ]
                : []),
            ]}
          />
          <GrowthChart data={chart} series={series} label="Growth" />
          <YearTable
            rows={projection.rows}
            caption="Savings balance at the end of each year"
            columns={[
              { id: "year", header: "Year", align: "left", cell: (row) => String(row.year) },
              { id: "topups", header: "Top-ups", align: "right", cell: (row) => formatEur(row.contributions) },
              {
                id: "interest",
                header: scenario.taxEnabled ? "Net interest" : "Interest",
                align: "right",
                cell: (row) => formatEur(row.gain),
              },
              ...(scenario.taxEnabled
                ? [{ id: "tax", header: "Tax", align: "right" as const, cell: (row: (typeof projection.rows)[number]) => formatEur(row.tax) }]
                : []),
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
      <SeoBlock page={savingsSeo} />
    </>
  );
}

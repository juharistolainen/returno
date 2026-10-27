import { createRoute } from "@tanstack/react-router";
import { GrowthChart } from "../components/GrowthChart.tsx";
import { PageIntro } from "../components/PageIntro.tsx";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { ScenarioForm } from "../components/ScenarioForm.tsx";
import { Summary } from "../components/Summary.tsx";
import { YearTable } from "../components/YearTable.tsx";
import { formatEur, formatSignedEur } from "../lib/format.ts";
import { requirePage } from "../content/seo.ts";
import { comparisonChart, projectComparison } from "../lib/project.ts";
import { calculatorSearch, validateSearch } from "../lib/search.ts";
import { rootRoute } from "./root.tsx";
import { useReplaceScenario, useShownScenario } from "./scenario-page.tsx";

const compareSeo = requirePage("/compare");

export const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  validateSearch,
  search: calculatorSearch,
  component: ComparePage,
});

interface CompareRow {
  year: number;
  savings: number;
  stocks: number;
  stocksReal: number;
  gap: number;
}

function ComparePage() {
  const scenario = useShownScenario();
  const update = useReplaceScenario(scenario);
  const comparison = projectComparison(scenario);
  const chart = comparisonChart(scenario, comparison);
  const rows: CompareRow[] = comparison.savings.rows.map((row, index) => {
    const stocks = comparison.stocks.rows[index]!;
    return {
      year: row.year,
      savings: row.endBalance,
      stocks: stocks.endBalance,
      stocksReal: stocks.realEndBalance,
      gap: stocks.endBalance - row.endBalance,
    };
  });
  const difference = comparison.nominalDifference;
  const ahead = difference > 0 ? "Stocks end ahead" : difference < 0 ? "Savings end ahead" : "They end even";
  const series = [
    { dataKey: "savings", label: "Savings", color: "var(--primary-text)" },
    { dataKey: "stocks", label: "Stocks", color: "var(--positive)" },
    ...(scenario.inflationEnabled
      ? [{ dataKey: "stocksReal", label: "Stocks in today's euros", color: "var(--body)", dash: "8 4" }]
      : []),
  ];

  return (
    <>
      <PageIntro
        eyebrow="Compare"
        title="Same deposits, two paths"
        lede="Balance, top-ups, and years are shared. Each path keeps its own rate, fee, and tax."
      />
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl bg-card p-6">
          <ScenarioForm scenario={scenario} onScenario={update} mode="compare" />
        </section>
        <Summary
          stats={[
            { label: "Savings", value: formatEur(comparison.savings.finalBalance) },
            { label: "Stocks", value: formatEur(comparison.stocks.finalBalance) },
            {
              label: ahead,
              value: formatSignedEur(difference),
              hint: "Nominal balance at the end",
            },
            ...(scenario.inflationEnabled
              ? [
                  {
                    label: "Stocks in today's euros",
                    value: formatEur(comparison.stocks.finalRealBalance),
                    hint: `Gap versus savings: ${formatSignedEur(comparison.realDifference)}`,
                  },
                ]
              : []),
          ]}
        />
        <GrowthChart data={chart} series={series} label="Both paths" />
        <YearTable
          rows={rows}
          caption="Savings and stock balances at the end of each year"
          columns={[
            { id: "year", header: "Year", align: "left", cell: (row) => String(row.year) },
            { id: "savings", header: "Savings", align: "right", cell: (row) => formatEur(row.savings) },
            { id: "stocks", header: "Stocks", align: "right", cell: (row) => formatEur(row.stocks) },
            ...(scenario.inflationEnabled
              ? [
                  {
                    id: "real",
                    header: "Stocks today",
                    align: "right" as const,
                    cell: (row: CompareRow) => formatEur(row.stocksReal),
                  },
                ]
              : []),
            { id: "gap", header: "Gap", align: "right", cell: (row) => formatSignedEur(row.gap) },
          ]}
        />
      </div>
      <SeoBlock page={compareSeo} />
    </>
  );
}

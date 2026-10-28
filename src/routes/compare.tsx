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
  savingsReal: number;
  stocksReal: number;
  gap: number;
  gapReal: number;
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
      savingsReal: row.realEndBalance,
      stocksReal: stocks.realEndBalance,
      gap: stocks.endBalance - row.endBalance,
      gapReal: stocks.realEndBalance - row.realEndBalance,
    };
  });
  const difference = comparison.nominalDifference;
  const ahead = difference > 0 ? "Stocks end ahead" : difference < 0 ? "Savings end ahead" : "They end even";
  const series = [
    { dataKey: "savings", label: "Savings", color: "#0f6e62" },
    { dataKey: "stocks", label: "Stocks", color: "#b4532a" },
    ...(scenario.inflationEnabled
      ? [
          { dataKey: "savingsReal", label: "Savings in today's euros", color: "#1c1814" },
          { dataKey: "stocksReal", label: "Stocks in today's euros", color: "#35557a" },
        ]
      : []),
  ];

  return (
    <>
      <PageIntro
        eyebrow="Compare"
        title="Same deposits, two paths"
        lede="Balance, top-ups, years, and inflation are shared. Each path keeps its own rate, fee, and tax."
      />
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <ScenarioForm scenario={scenario} onScenario={update} mode="compare" />
        </section>
        <Summary
          stats={[
            { label: "Savings", value: formatEur(comparison.savings.finalBalance), tone: "text-savings" },
            { label: "Stocks", value: formatEur(comparison.stocks.finalBalance), tone: "text-stocks" },
            {
              label: ahead,
              value: formatSignedEur(difference),
              hint: "Nominal balance at the end",
            },
            ...(scenario.inflationEnabled
              ? [
                  {
                    label: "Savings in today's euros",
                    value: formatEur(comparison.savings.finalRealBalance),
                    tone: "text-savings",
                  },
                  {
                    label: "Stocks in today's euros",
                    value: formatEur(comparison.stocks.finalRealBalance),
                    tone: "text-real",
                    hint: `Gap versus savings, in today's euros: ${formatSignedEur(comparison.realDifference)}`,
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
                    id: "savingsReal",
                    header: "Savings today",
                    align: "right" as const,
                    cell: (row: CompareRow) => formatEur(row.savingsReal),
                  },
                  {
                    id: "stocksReal",
                    header: "Stocks today",
                    align: "right" as const,
                    cell: (row: CompareRow) => formatEur(row.stocksReal),
                  },
                ]
              : []),
            { id: "gap", header: "Gap", align: "right", cell: (row) => formatSignedEur(row.gap) },
            ...(scenario.inflationEnabled
              ? [
                  {
                    id: "gapReal",
                    header: "Gap today",
                    align: "right" as const,
                    cell: (row: CompareRow) => formatSignedEur(row.gapReal),
                  },
                ]
              : []),
          ]}
        />
      </div>
      <SeoBlock page={compareSeo} />
    </>
  );
}

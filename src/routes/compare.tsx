import { createRoute } from "@tanstack/react-router";
import { GrowthChart } from "../components/GrowthChart.tsx";
import { InflationNote } from "../components/InflationNote.tsx";
import { PageIntro } from "../components/PageIntro.tsx";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { ScenarioForm } from "../components/ScenarioForm.tsx";
import { Summary } from "../components/Summary.tsx";
import { YearTable } from "../components/YearTable.tsx";
import { compareColumnHeader, compareYearColumnIds, type CompareColumnId } from "../lib/compare-columns.ts";
import { formatEur, formatSignedEur } from "../lib/format.ts";
import { compareInflationCopy, lostToInflation } from "../lib/inflation-copy.ts";
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
                  {
                    label: "Savings lost to inflation",
                    value: formatEur(lostToInflation(comparison.savings.finalBalance, comparison.savings.finalRealBalance)),
                    hint: "Nominal ending balance minus today's euros",
                  },
                  {
                    label: "Stocks lost to inflation",
                    value: formatEur(lostToInflation(comparison.stocks.finalBalance, comparison.stocks.finalRealBalance)),
                    hint: "Nominal ending balance minus today's euros",
                  },
                ]
              : []),
          ]}
        />
        {scenario.inflationEnabled ? (
          <InflationNote text={compareInflationCopy(comparison.nominalDifference, comparison.realDifference)} />
        ) : null}
        <GrowthChart data={chart} series={series} label="Both paths" />
        <YearTable
          rows={rows}
          caption="Savings and stock balances at the end of each year"
          columns={compareYearColumnIds(scenario.inflationEnabled).map((id) => compareColumn(id))}
        />
      </div>
      <SeoBlock page={compareSeo} />
    </>
  );
}

function compareColumn(id: CompareColumnId): {
  id: string;
  header: string;
  align: "left" | "right";
  cell: (row: CompareRow) => string;
} {
  const header = compareColumnHeader(id);
  switch (id) {
    case "year":
      return { id, header, align: "left", cell: (row) => String(row.year) };
    case "savings":
      return { id, header, align: "right", cell: (row) => formatEur(row.savings) };
    case "stocks":
      return { id, header, align: "right", cell: (row) => formatEur(row.stocks) };
    case "gap":
      return { id, header, align: "right", cell: (row) => formatSignedEur(row.gap) };
    case "savingsReal":
      return { id, header, align: "right", cell: (row) => formatEur(row.savingsReal) };
    case "stocksReal":
      return { id, header, align: "right", cell: (row) => formatEur(row.stocksReal) };
    case "gapReal":
      return { id, header, align: "right", cell: (row) => formatSignedEur(row.gapReal) };
  }
}

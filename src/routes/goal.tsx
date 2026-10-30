import { createRoute } from "@tanstack/react-router";
import { GoalCompareResults } from "../components/GoalCompare.tsx";
import { GoalForm } from "../components/GoalForm.tsx";
import { GrowthChart } from "../components/GrowthChart.tsx";
import { InflationNote } from "../components/InflationNote.tsx";
import { PageIntro } from "../components/PageIntro.tsx";
import { SeoBlock } from "../components/SeoBlock.tsx";
import { Summary } from "../components/Summary.tsx";
import { YearTable } from "../components/YearTable.tsx";
import { requirePage } from "../content/seo.ts";
import { formatChartYear, formatEur } from "../lib/format.ts";
import { compareGoals, goalCompareChart, goalCompareYearRows, goalSpanLabel, type GoalCompareYearRow } from "../lib/goal-compare.ts";
import { goalInflationCopy, lostToInflation } from "../lib/inflation-copy.ts";
import { goalChart, monthsUntil, planGoal, type GoalInput, type GoalVehicle } from "../lib/goal.ts";
import { sessionToday } from "../lib/session-today.ts";
import { calculatorSearch, validateSearch } from "../lib/search.ts";
import type { Scenario } from "../lib/scenario.ts";
import { rootRoute } from "./root.tsx";
import { useReplaceScenario, useShownScenario } from "./scenario-page.tsx";

const goalSeo = requirePage("/goal");

export const goalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goal",
  validateSearch,
  search: calculatorSearch,
  component: GoalPage,
});

function GoalPage() {
  const scenario = useShownScenario();
  const update = useReplaceScenario(scenario);

  return (
    <>
      <PageIntro
        eyebrow="Goal"
        title="What to save each month"
        lede="Set the amount and the date. Returno solves the monthly top-up after tax and fees."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <GoalForm scenario={scenario} onScenario={update} today={sessionToday} />
        </section>
        <div className="flex min-w-0 flex-col gap-6">
          {scenario.vehicle === "both" ? <BothResults scenario={scenario} /> : <SingleResults scenario={scenario} />}
        </div>
      </div>
      <SeoBlock page={goalSeo} />
    </>
  );
}

function BothResults({ scenario }: { scenario: Scenario }) {
  const comparison = compareGoals(goalFields(scenario, sessionToday));
  const span = goalSpanLabel({
    horizonMode: scenario.horizonMode,
    years: scenario.years,
    months: comparison.savings.months,
  });
  const inflationOn = scenario.inflationEnabled;
  const rows = goalCompareYearRows(comparison);
  const chart = goalCompareChart(scenario.balance, comparison);
  const series = [
    { dataKey: "savings", label: "Savings", color: "#0f6e62" },
    { dataKey: "stocks", label: "Stocks", color: "#b4532a" },
    ...(inflationOn
      ? [
          { dataKey: "savingsReal", label: "Savings in today's euros", color: "#1c1814" },
          { dataKey: "stocksReal", label: "Stocks in today's euros", color: "#35557a" },
        ]
      : []),
  ];

  return (
    <>
      <GoalCompareResults comparison={comparison} span={span} inflationOn={inflationOn} />
      {rows.length > 0 ? (
        <>
          <GrowthChart data={chart} series={series} label="Path to the goal" />
          <YearTable
            rows={rows}
            caption="Savings and stock balances at the end of each year on the way to the goal"
            columns={bothYearColumns(scenario.taxEnabled, inflationOn)}
          />
        </>
      ) : null}
    </>
  );
}

function bothMoney(value: number | null): string {
  return value === null ? "—" : formatEur(value);
}

function bothYearColumns(taxEnabled: boolean, inflationOn: boolean) {
  const column = (
    id: string,
    header: string,
    cell: (row: GoalCompareYearRow) => string,
  ) => ({ id, header, align: "right" as const, cell });
  return [
    { id: "year", header: "Year", align: "left" as const, cell: (row: GoalCompareYearRow) => formatChartYear(row.year) },
    column("savingsTopUps", "Savings top-ups", (row) => bothMoney(row.savingsTopUps)),
    column("savingsGain", "Interest after tax", (row) => bothMoney(row.savingsGain)),
    ...(taxEnabled ? [column("savingsTax", "Savings tax", (row) => bothMoney(row.savingsTax))] : []),
    column("savingsBalance", "Savings balance", (row) => bothMoney(row.savingsBalance)),
    column("stocksTopUps", "Stocks top-ups", (row) => bothMoney(row.stocksTopUps)),
    column("stocksGain", "Return after fees", (row) => bothMoney(row.stocksGain)),
    column("stocksFees", "Stocks fees", (row) => bothMoney(row.stocksFees)),
    column("stocksBalance", "Stocks balance", (row) => bothMoney(row.stocksBalance)),
    ...(inflationOn
      ? [
          column("savingsReal", "Savings today", (row) => bothMoney(row.savingsReal)),
          column("savingsLost", "Savings lost", (row) =>
            row.savingsBalance === null || row.savingsReal === null
              ? "—"
              : formatEur(lostToInflation(row.savingsBalance, row.savingsReal)),
          ),
          column("stocksReal", "Stocks today", (row) => bothMoney(row.stocksReal)),
          column("stocksLost", "Stocks lost", (row) =>
            row.stocksBalance === null || row.stocksReal === null
              ? "—"
              : formatEur(lostToInflation(row.stocksBalance, row.stocksReal)),
          ),
        ]
      : []),
  ];
}

function SingleResults({ scenario }: { scenario: Scenario }) {
  if (scenario.vehicle === "both") return null;
  const input = goalInput(scenario, sessionToday, scenario.vehicle);
  const plan = planGoal(input);
  const planWithoutInflation = scenario.inflationEnabled ? planGoal({ ...input, inflationRate: 0 }) : null;
  const chart = goalChart(scenario.balance, plan.projection).map((point) => ({
    year: point.year,
    balance: point.balance,
    real: point.real,
    ...(scenario.targetKind === "balance" ? { target: scenario.targetAmount } : {}),
  }));
  const inflationOn = scenario.inflationEnabled;
  const series = [
    {
      dataKey: "balance",
      label: inflationOn ? "Nominal balance" : "Balance",
      color: scenario.vehicle === "stocks" ? "#b4532a" : "#0f6e62",
    },
    ...(inflationOn ? [{ dataKey: "real", label: "Today's euros", color: "#35557a" }] : []),
    ...(scenario.targetKind === "balance" ? [{ dataKey: "target", label: "Target", color: "#1c1814" }] : []),
  ];
  const tone = plan.status === "unreachable" ? "text-stocks" : plan.status === "reached" ? "text-savings" : "text-ink";

  return (
    <>
      <p className={`rounded-2xl border border-line bg-card px-4 py-3 text-sm ${tone}`}>{plan.message}</p>
      <Summary
        stats={[
          { label: "Monthly top-up", value: formatEur(plan.monthlyContribution), tone },
          { label: "Total contributed", value: formatEur(plan.projection.totalContributions) },
          { label: "Total growth", value: formatEur(plan.projection.totalGain), hint: "After tax and fees" },
          {
            label: inflationOn ? "Ending value today" : "Ending balance",
            value: formatEur(inflationOn ? plan.projection.finalRealBalance : plan.projection.finalBalance),
            hint: horizonLabel(scenario, plan.months),
          },
        ]}
      />
      {planWithoutInflation ? (
        <InflationNote
          text={goalInflationCopy(
            plan.projection.finalRealBalance,
            plan.projection.finalBalance,
            plan.monthlyContribution,
            planWithoutInflation.monthlyContribution,
          )}
        />
      ) : null}
      <GrowthChart data={chart} series={series} label="Path to the goal" />
      <YearTable
        rows={plan.projection.rows}
        caption="Balance at the end of each year on the way to the goal"
        columns={[
          {
            id: "year",
            header: "Year",
            align: "left",
            cell: (row) => formatChartYear(row.year),
          },
          { id: "topups", header: "Top-ups", align: "right", cell: (row) => formatEur(row.contributions) },
          { id: "growth", header: "Growth", align: "right", cell: (row) => formatEur(row.gain) },
          ...(scenario.vehicle === "savings" && scenario.taxEnabled
            ? [{ id: "tax", header: "Tax", align: "right" as const, cell: (row: (typeof plan.projection.rows)[number]) => formatEur(row.tax) }]
            : []),
          ...(scenario.vehicle === "stocks"
            ? [{ id: "fees", header: "Fees", align: "right" as const, cell: (row: (typeof plan.projection.rows)[number]) => formatEur(row.fees) }]
            : []),
          { id: "balance", header: "End balance", align: "right", cell: (row) => formatEur(row.endBalance) },
          ...(inflationOn
            ? [
                {
                  id: "real",
                  header: "Today's euros",
                  align: "right" as const,
                  cell: (row: (typeof plan.projection.rows)[number]) => formatEur(row.realEndBalance),
                },
                {
                  id: "lost",
                  header: "Lost to inflation",
                  align: "right" as const,
                  cell: (row: (typeof plan.projection.rows)[number]) =>
                    formatEur(lostToInflation(row.endBalance, row.realEndBalance)),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}

function countedMonths(scenario: Scenario, today: Date): number {
  const counted = scenario.horizonMode === "date" ? monthsUntil(scenario.targetDate, today) : scenario.years * 12;
  return counted === null ? scenario.years * 12 : counted;
}

function goalFields(scenario: Scenario, today: Date) {
  return {
    targetKind: scenario.targetKind,
    targetAmount: scenario.targetAmount,
    balance: scenario.balance,
    months: countedMonths(scenario, today),
    annualRate: scenario.savingsRate / 100,
    compounding: scenario.compounding,
    taxRate: scenario.taxEnabled ? scenario.taxRate / 100 : 0,
    expectedReturn: scenario.expectedReturn / 100,
    feeRate: scenario.fee / 100,
    inflationRate: scenario.inflationEnabled ? scenario.inflationRate / 100 : 0,
  };
}

function goalInput(scenario: Scenario, today: Date, vehicle: GoalVehicle): GoalInput {
  return { vehicle, ...goalFields(scenario, today) };
}

function horizonLabel(scenario: Scenario, months: number): string {
  if (scenario.horizonMode === "date") {
    if (months < 1) return scenario.targetDate;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const span = rest === 0 ? `${years} years` : `${years} years ${rest} months`;
    return `${span}, until ${scenario.targetDate}`;
  }
  return `${scenario.years} years`;
}

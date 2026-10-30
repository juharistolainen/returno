import { formatEur } from "../lib/format.ts";
import {
  GOAL_COMPARE_CAVEAT,
  goalCompareHeadline,
  goalComparePocketNote,
  type GoalComparison,
} from "../lib/goal-compare.ts";
import type { GoalPlan, GoalVehicle } from "../lib/goal.ts";

const accounts = {
  savings: {
    title: "Savings account",
    pill: "bg-savings-soft text-savings",
    dot: "bg-savings",
    gain: "Interest after tax",
  },
  stocks: {
    title: "Investment",
    pill: "bg-stocks-soft text-stocks",
    dot: "bg-stocks",
    gain: "Return after fees",
  },
} as const;

export function GoalCompareResults({
  comparison,
  span,
  inflationOn,
}: {
  comparison: GoalComparison;
  span: string;
  inflationOn: boolean;
}) {
  const headline = goalCompareHeadline(comparison);
  const note = goalComparePocketNote(comparison, span);
  const tied = comparison.lowerOutOfPocket === "tie";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <AccountCard vehicle="savings" plan={comparison.savings} span={span} inflationOn={inflationOn} lower={comparison.lowerMonthly === "savings"} />
        <AccountCard vehicle="stocks" plan={comparison.stocks} span={span} inflationOn={inflationOn} lower={comparison.lowerMonthly === "stocks"} />
      </div>
      <section aria-label="Comparison" className="@container rounded-2xl border border-line bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 @min-[40rem]:flex-row @min-[40rem]:items-end @min-[40rem]:justify-between">
          <div className="min-w-0 max-w-xl">
            <h2 className="font-display text-2xl tracking-tight text-balance @min-[40rem]:text-3xl">{headline}</h2>
            <p className="mt-3 max-w-prose text-sm text-muted">{GOAL_COMPARE_CAVEAT}</p>
          </div>
          {note ? (
            <div className="shrink-0 @min-[40rem]:w-72 @min-[40rem]:text-right">
              <p
                className={`font-display leading-none tracking-tight tabular-nums whitespace-nowrap text-[clamp(1.5rem,10cqw,2.75rem)] ${tied ? "text-ink" : "text-savings"}`}
              >
                {formatEur(comparison.outOfPocketGap)}
              </p>
              <p className="mt-2 text-sm text-balance text-muted">{note}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function AccountCard({
  vehicle,
  plan,
  span,
  inflationOn,
  lower,
}: {
  vehicle: GoalVehicle;
  plan: GoalPlan;
  span: string;
  inflationOn: boolean;
  lower: boolean;
}) {
  const account = accounts[vehicle];
  const solved = plan.status === "solvable" || plan.status === "reached";
  const caption = plan.months < 1 ? "No whole month left to save" : `per month for ${span}`;

  return (
    <article className="@container min-w-0 rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${account.pill}`}>
          <span className={`size-2 shrink-0 rounded-full ${account.dot}`} aria-hidden />
          {account.title}
        </span>
        {lower ? (
          <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-center text-sm font-medium leading-tight text-paper">
            Lower monthly
          </span>
        ) : null}
      </div>
      {solved ? (
        <>
          <p className="mt-5 font-display leading-none tracking-tight tabular-nums whitespace-nowrap text-[clamp(1.75rem,12cqw,2.75rem)]">
            {formatEur(plan.monthlyContribution)}
          </p>
          <p className="mt-2 text-sm text-muted">{caption}</p>
          <dl className="mt-4 border-t border-line">
            <MoneyRow label="You deposit" value={formatEur(plan.projection.totalContributions)} />
            <MoneyRow label={account.gain} value={formatEur(plan.projection.totalGain)} />
            <MoneyRow
              label="Ending balance"
              value={formatEur(plan.projection.finalBalance)}
              hint={inflationOn ? "Nominal. The target is in today's euros." : undefined}
            />
          </dl>
        </>
      ) : (
        <p className="mt-5 text-sm text-pretty text-muted">{plan.message}</p>
      )}
    </article>
  );
}

function MoneyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-3 last:border-b-0">
      <dt className="text-sm text-muted">
        {label}
        {hint ? <span className="mt-1 block text-xs text-pretty">{hint}</span> : null}
      </dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

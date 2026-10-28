export function Summary({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3">
      {stats.map((stat) => (
        <SummaryCard key={stat.label} stat={stat} />
      ))}
    </dl>
  );
}

/** One column per group. Narrow screens stack the groups in the given order. */
export function SummaryColumns({ columns }: { columns: readonly (readonly Stat[])[] }) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
      {columns.map((column) => (
        <dl key={column.map((stat) => stat.label).join("|")} className="flex min-w-0 flex-col gap-3">
          {column.map((stat) => (
            <SummaryCard key={stat.label} stat={stat} />
          ))}
        </dl>
      ))}
    </div>
  );
}

function SummaryCard({ stat }: { stat: Stat }) {
  return (
    <div className="@container min-w-0 rounded-2xl border border-line bg-card px-4 py-3">
      <dt className="text-sm text-muted">{stat.label}</dt>
      <dd
        className={`mt-1 max-w-full font-display leading-none tabular-nums tracking-tight whitespace-nowrap text-[clamp(1rem,8.4cqw,1.7rem)] ${stat.tone ?? "text-ink"}`}
      >
        {stat.value}
      </dd>
      {stat.hint ? <p className="mt-1 text-xs text-balance text-muted">{stat.hint}</p> : null}
    </div>
  );
}

export interface Stat {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

export function Summary({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-line bg-card px-4 py-3">
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd className={`mt-1 font-display text-2xl tabular-nums tracking-tight sm:text-[1.7rem] ${stat.tone ?? "text-ink"}`}>
            {stat.value}
          </dd>
          {stat.hint ? <p className="mt-1 text-xs text-muted">{stat.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}

interface Stat {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

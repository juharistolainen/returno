export function Summary({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="@container min-w-0 rounded-2xl bg-card p-6">
          <dt className="wds-eyebrow eyebrow">{stat.label}</dt>
          <dd className={`summary-figure mt-2 ${stat.tone ?? "text-ink"}`}>{stat.value}</dd>
          {stat.hint ? <p className="caption mt-2 mb-0 text-balance text-muted">{stat.hint}</p> : null}
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

export function Summary({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="@container min-w-0 rounded-2xl border border-line bg-card px-4 py-3">
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd
            className={`mt-1 max-w-full font-display leading-none tabular-nums tracking-tight whitespace-nowrap text-[clamp(1rem,8.4cqw,1.7rem)] ${stat.tone ?? "text-ink"}`}
          >
            {stat.value}
          </dd>
          {stat.hint ? <p className="mt-1 text-xs text-balance text-muted">{stat.hint}</p> : null}
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

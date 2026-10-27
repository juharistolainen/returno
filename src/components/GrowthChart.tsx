import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatChartYear, formatEur, formatEurCompact } from "../lib/format.ts";

interface Series {
  dataKey: string;
  label: string;
  color: string;
  dash?: string;
}

export function GrowthChart({
  data,
  series,
  label,
}: {
  data: ReadonlyArray<{ year: number }>;
  series: readonly Series[];
  label: string;
}) {
  const points = data.map((point) => ({ ...point })) as Record<string, number>[];
  const multiple = series.length > 1;

  return (
    <section className="rounded-2xl bg-card p-6" aria-label={label}>
      <h2 className="display-xs mb-0">{label}</h2>
      <div className="mt-3 h-64 w-full min-w-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {multiple ? (
            <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(value: number) => formatChartYear(value)}
                tick={{ fill: "var(--text-3)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) => formatEurCompact(value)}
                tick={{ fill: "var(--text-3)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={72}
                domain={[0, "auto"]}
              />
              <Tooltip cursor={false} content={<ChartTooltip series={series} />} />
              {series.map((item) => (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.color}
                  strokeDasharray={item.dash}
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(value: number) => formatChartYear(value)}
                tick={{ fill: "var(--text-3)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) => formatEurCompact(value)}
                tick={{ fill: "var(--text-3)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={72}
                domain={[0, "auto"]}
              />
              <Tooltip cursor={false} content={<ChartTooltip series={series} />} />
              {series.map((item) => (
                <Area
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.color}
                  fill="var(--primary-pale)"
                  fillOpacity={1}
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <ul className="body-sm mt-2 mb-0 flex flex-wrap gap-x-4 gap-y-1 p-0 text-muted">
        {series.map((item) => (
          <li key={item.dataKey} className="mb-0 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChartTooltip({
  series,
  active,
  payload,
  label,
}: {
  series: readonly Series[];
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="body-sm rounded-xl bg-card px-3 py-2 text-ink shadow-md">
      <p className="body-sm-strong m-0 text-ink">Year {label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="m-0"
          style={{ color: series.find((item) => item.dataKey === entry.dataKey)?.color }}
        >
          {entry.name}: {formatEur(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

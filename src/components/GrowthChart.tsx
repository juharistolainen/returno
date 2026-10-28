import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatChartYear, formatEur, formatEurCompact } from "../lib/format.ts";
import { chartShowsInflationBand } from "../lib/inflation-copy.ts";

interface Series {
  dataKey: string;
  label: string;
  color: string;
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
  const showBand = chartShowsInflationBand(series.map((item) => item.dataKey));
  const points = data.map((point) => {
    const row = { ...point } as Record<string, number>;
    if (showBand) {
      row.inflBase = Number(row.real);
      row.inflGap = Math.max(0, Number(row.balance) - Number(row.real));
    }
    return row;
  });
  const multiple = series.length > 1;

  return (
    <section className="rounded-2xl border border-line bg-card p-4" aria-label={label}>
      <h2 className="font-display text-2xl">{label}</h2>
      <div className="mt-3 h-64 w-full min-w-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {multiple ? (
            <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eadfcd" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(value: number) => formatChartYear(value)}
                tick={{ fill: "#5e564c", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) => formatEurCompact(value)}
                tick={{ fill: "#5e564c", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={72}
                domain={[0, "auto"]}
              />
              <Tooltip content={<ChartTooltip />} />
              {showBand ? (
                <>
                  <Area type="monotone" dataKey="inflBase" name="" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} legendType="none" tooltipType="none" />
                  <Area type="monotone" dataKey="inflGap" name="" stackId="band" stroke="none" fill="#35557a" fillOpacity={0.16} isAnimationActive={false} legendType="none" tooltipType="none" />
                </>
              ) : null}
              {series.map((item) => (
                <Line
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </ComposedChart>
          ) : (
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eadfcd" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(value: number) => formatChartYear(value)}
                tick={{ fill: "#5e564c", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) => formatEurCompact(value)}
                tick={{ fill: "#5e564c", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={72}
                domain={[0, "auto"]}
              />
              <Tooltip content={<ChartTooltip />} />
              {series.map((item) => (
                <Area
                  key={item.dataKey}
                  type="monotone"
                  dataKey={item.dataKey}
                  name={item.label}
                  stroke={item.color}
                  fill={item.color}
                  fillOpacity={0.16}
                  strokeWidth={2.25}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {series.map((item) => (
          <li key={item.dataKey} className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
        {showBand ? (
          <li className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-sm bg-[#35557a]/20" />
            Lost to inflation
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">Year {label}</p>
      {payload
        .filter((entry) => entry.name && entry.dataKey !== "inflGap" && entry.dataKey !== "inflBase")
        .map((entry) => (
          <p key={String(entry.dataKey)} style={{ color: entry.color }}>
            {entry.name}: {formatEur(Number(entry.value))}
          </p>
        ))}
    </div>
  );
}

const eur = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurWhole = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCompact = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat("fi-FI", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatEur(value: number): string {
  return eur.format(value);
}

export function formatEurWhole(value: number): string {
  return eurWhole.format(value);
}

export function formatEurCompact(value: number): string {
  return eurCompact.format(value);
}

export function formatPercent(value: number): string {
  return `${percent.format(value)} %`;
}

/** Axis label for a year count. Whole years stay integers; fractions use one decimal. */
export function formatChartYear(year: number): string {
  if (!Number.isFinite(year)) return "";
  const rounded = Math.round(year * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatSignedEur(value: number): string {
  const formatted = formatEur(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

export type CompareColumnId =
  | "year"
  | "savings"
  | "stocks"
  | "gap"
  | "savingsReal"
  | "stocksReal"
  | "gapReal";

const headers: Record<CompareColumnId, string> = {
  year: "Year",
  savings: "Savings",
  stocks: "Stocks",
  gap: "Gap",
  savingsReal: "Savings today",
  stocksReal: "Stocks today",
  gapReal: "Gap today",
};

/** Year, then the nominal trio, then today's euros when inflation is on. */
export function compareYearColumnIds(inflationOn: boolean): CompareColumnId[] {
  const nominal: CompareColumnId[] = ["year", "savings", "stocks", "gap"];
  if (!inflationOn) return nominal;
  return [...nominal, "savingsReal", "stocksReal", "gapReal"];
}

export function compareColumnHeader(id: CompareColumnId): string {
  return headers[id];
}

export function compareYearHeaders(inflationOn: boolean): string[] {
  return compareYearColumnIds(inflationOn).map((id) => headers[id]);
}

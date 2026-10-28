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

export type CompareSummaryKey =
  | "savings"
  | "savingsReal"
  | "savingsLost"
  | "stocks"
  | "stocksReal"
  | "stocksLost"
  | "lead";

/**
 * With inflation on, each path is a column and the lead sits alone in the third.
 * With inflation off, the three nominal cards stay one row.
 */
export function compareSummaryKeys(inflationOn: boolean): CompareSummaryKey[][] {
  if (!inflationOn) return [["savings", "stocks", "lead"]];
  return [
    ["savings", "savingsReal", "savingsLost"],
    ["stocks", "stocksReal", "stocksLost"],
    ["lead"],
  ];
}

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

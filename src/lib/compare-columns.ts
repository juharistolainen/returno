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
  | "lead"
  | "leadReal";

/**
 * With inflation on, each path is a column and the third column holds the nominal
 * lead, then the same lead in today's euros. With inflation off, the three nominal
 * cards stay one row.
 */
export function compareSummaryKeys(inflationOn: boolean): CompareSummaryKey[][] {
  if (!inflationOn) return [["savings", "stocks", "lead"]];
  return [
    ["savings", "savingsReal", "savingsLost"],
    ["stocks", "stocksReal", "stocksLost"],
    ["lead", "leadReal"],
  ];
}

/** Same ahead/even wording for the nominal lead and the today's-euros lead. */
export function compareLeadLabel(difference: number, inTodaysEuros = false): string {
  const where = inTodaysEuros ? " in today's euros" : "";
  if (difference > 0) return `Stocks end ahead${where}`;
  if (difference < 0) return `Savings end ahead${where}`;
  return `They end even${where}`;
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

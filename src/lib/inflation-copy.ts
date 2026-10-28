import { formatEur } from "./format.ts";

/** Nominal euros minus the same amount in today's euros. */
export function lostToInflation(nominal: number, real: number): number {
  return nominal - real;
}

/**
 * The shaded band is the gap between one nominal line and its today's-euros line.
 * Compare uses separate keys for each path, so it keeps its lines and has no band.
 */
export function chartShowsInflationBand(dataKeys: readonly string[]): boolean {
  return dataKeys.includes("balance") && dataKeys.includes("real");
}

export function balanceInflationCopy(ratePercent: number, realEnding: number, lost: number): string {
  return `At ${ratePercent}% inflation, the ending balance buys what ${formatEur(realEnding)} buys today. ${formatEur(lost)} of purchasing power is gone.`;
}

export function compareInflationCopy(nominalDifference: number, realDifference: number): string {
  const nominalSide = leader(nominalDifference);
  const realSide = leader(realDifference);
  if (nominalSide === "even" && realSide === "even") {
    return "They end even in nominal euros and in today's euros.";
  }
  if (nominalSide === "even") {
    return `They end even in nominal euros. In today's euros, ${realSide} finish ${formatEur(Math.abs(realDifference))} ahead.`;
  }
  if (realSide === "even") {
    return `Inflation removes the ${nominalSide} lead of ${formatEur(Math.abs(nominalDifference))}. They end even in today's euros.`;
  }
  if (nominalSide !== realSide) {
    return `In nominal euros, ${nominalSide} finish ${formatEur(Math.abs(nominalDifference))} ahead. In today's euros, ${realSide} finish ${formatEur(Math.abs(realDifference))} ahead.`;
  }
  const nominalLead = Math.abs(nominalDifference);
  const realLead = Math.abs(realDifference);
  if (realLead < nominalLead - 0.005) {
    return `Inflation cuts the ${nominalSide} lead from ${formatEur(nominalLead)} to ${formatEur(realLead)}.`;
  }
  if (realLead > nominalLead + 0.005) {
    return `Inflation widens the ${nominalSide} lead from ${formatEur(nominalLead)} to ${formatEur(realLead)}.`;
  }
  return `Inflation leaves the ${nominalSide} lead at ${formatEur(nominalLead)}.`;
}

export function goalInflationCopy(
  realEnding: number,
  nominalEnding: number,
  monthly: number,
  monthlyWithoutInflation: number,
): string {
  const reach = `To still be worth ${formatEur(realEnding)}, the account has to reach ${formatEur(nominalEnding)}.`;
  if (Math.abs(monthly - monthlyWithoutInflation) < 0.005) return reach;
  return `${reach} The monthly top-up is ${formatEur(monthly)}, against ${formatEur(monthlyWithoutInflation)} with inflation off.`;
}

function leader(difference: number): "savings" | "stocks" | "even" {
  if (difference > 0.005) return "stocks";
  if (difference < -0.005) return "savings";
  return "even";
}

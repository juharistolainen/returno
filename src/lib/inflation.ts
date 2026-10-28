/**
 * One inflation rule for savings and for stocks.
 *
 * The savings interest rate and the stock expected return are nominal. Inflation
 * does not change interest, tax, fees, contributions, or the nominal balance.
 * It only restates purchasing power. A nominal amount `t` years from today
 * (t may be fractional) is worth `nominal / (1 + rate)^t` in today's euros.
 * Time at or before today, and a zero rate, leave the amount unchanged.
 *
 * `nominalFromReal` is the inverse. The goal planner uses it when the target
 * is stated in today's euros: the account must reach that nominal amount.
 * A net-growth target is the nominal gain deflated by the same end-of-horizon
 * factor, not each deposit deflated on the day it was paid.
 */

/** `(1 + inflationRate)^years`, or 1 when there is nothing to restate. */
export function inflationFactor(years: number, inflationRate: number): number {
  if (inflationRate === 0 || years <= 0) return 1;
  return (1 + inflationRate) ** years;
}

/** Purchasing power, in today's euros, of a nominal amount after `years`. */
export function realValue(nominal: number, inflationRate: number, years: number): number {
  return nominal / inflationFactor(years, inflationRate);
}

/** Nominal amount whose purchasing power equals `real` today's euros after `years`. */
export function nominalFromReal(real: number, inflationRate: number, years: number): number {
  return real * inflationFactor(years, inflationRate);
}

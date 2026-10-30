import type { CompoundingFrequency, ContributionFrequency } from "./calc.ts";
import type { GoalTargetKind, GoalVehicle } from "./goal.ts";

export type HorizonMode = "years" | "date";
/** Goal page account. "both" solves savings and stocks for the same goal. */
export type GoalAccount = GoalVehicle | "both";

export interface Scenario {
  balance: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  years: number;
  savingsRate: number;
  compounding: CompoundingFrequency;
  taxEnabled: boolean;
  taxRate: number;
  expectedReturn: number;
  fee: number;
  /** Shared by savings and stocks. Off leaves every figure in nominal euros. */
  inflationEnabled: boolean;
  /** Annual inflation in percent. Used only while `inflationEnabled` is on. */
  inflationRate: number;
  targetAmount: number;
  targetKind: GoalTargetKind;
  horizonMode: HorizonMode;
  targetDate: string;
  vehicle: GoalAccount;
}

export const defaultScenario: Scenario = {
  balance: 10_000,
  contribution: 200,
  contributionFrequency: "monthly",
  years: 20,
  savingsRate: 2.5,
  compounding: "monthly",
  taxEnabled: false,
  taxRate: 30,
  expectedReturn: 7,
  fee: 0.25,
  inflationEnabled: false,
  inflationRate: 2,
  targetAmount: 100_000,
  targetKind: "balance",
  horizonMode: "years",
  targetDate: "2036-12-31",
  vehicle: "savings",
};

const CONTRIBUTION_FREQUENCIES: readonly ContributionFrequency[] = ["monthly", "yearly"];
const TARGET_KINDS: readonly GoalTargetKind[] = ["balance", "growth"];
const HORIZON_MODES: readonly HorizonMode[] = ["years", "date"];
const VEHICLES: readonly GoalAccount[] = ["savings", "stocks", "both"];
const COMPOUNDING_FREQUENCIES: readonly CompoundingFrequency[] = [
  "annually",
  "semiannually",
  "quarterly",
  "monthly",
  "daily",
];

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  let numeric = Number.NaN;
  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) {
    numeric = Number(value.trim());
  }
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

/** Fill any missing or invalid search fields with deterministic defaults. */
export function parseScenario(search: Record<string, unknown>): Scenario {
  const defaults = defaultScenario;
  return {
    balance: readNumber(search.balance, defaults.balance, 0, 1_000_000_000_000),
    contribution: readNumber(search.contribution, defaults.contribution, 0, 1_000_000_000),
    contributionFrequency: readEnum(
      search.contributionFrequency,
      CONTRIBUTION_FREQUENCIES,
      defaults.contributionFrequency,
    ),
    years: Math.round(readNumber(search.years, defaults.years, 1, 80)),
    savingsRate: readNumber(search.savingsRate, defaults.savingsRate, 0, 100),
    compounding: readEnum(search.compounding, COMPOUNDING_FREQUENCIES, defaults.compounding),
    taxEnabled: readBoolean(search.taxEnabled, defaults.taxEnabled),
    taxRate: readNumber(search.taxRate, defaults.taxRate, 0, 100),
    expectedReturn: readNumber(search.expectedReturn, defaults.expectedReturn, 0, 100),
    fee: readNumber(search.fee, defaults.fee, 0, 20),
    inflationEnabled: readBoolean(search.inflationEnabled, defaults.inflationEnabled),
    inflationRate: readNumber(search.inflationRate, defaults.inflationRate, 0, 50),
    targetAmount: readNumber(search.targetAmount, defaults.targetAmount, 0, 1_000_000_000_000),
    targetKind: readEnum(search.targetKind, TARGET_KINDS, defaults.targetKind),
    horizonMode: readEnum(search.horizonMode, HORIZON_MODES, defaults.horizonMode),
    targetDate: readDate(search.targetDate, defaults.targetDate),
    vehicle: readEnum(search.vehicle, VEHICLES, defaults.vehicle),
  };
}

function readDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month! - 1 || date.getDate() !== day) return fallback;
  return value;
}

export function scenarioEqual(left: Scenario, right: Scenario): boolean {
  return (Object.keys(defaultScenario) as (keyof Scenario)[]).every((key) => left[key] === right[key]);
}

/**
 * A bare URL (no query) restores the last scenario. Any query is parsed on its
 * own so a shared link does not depend on the visitor's saved values.
 */
export function resolveScenario(search: Record<string, unknown>, stored: Scenario | null): Scenario {
  if (Object.keys(search).length === 0 && stored) return stored;
  return parseScenario(search);
}

/**
 * Same rule as `resolveScenario`, using the address-bar query rather than the
 * validated search object. The router copies validated search back into the URL,
 * so a saved scenario must not be part of that object.
 */
export function scenarioFromLocation(search: Scenario, searchStr: string, stored: Scenario | null): Scenario {
  if (searchStr === "" || searchStr === "?") return stored ?? search;
  return search;
}

export type FieldParse = number | "incomplete" | "invalid";

/** Parse a typed amount. A trailing separator stays incomplete so "2." can become "2.5". */
export function parseUserNumber(raw: string): FieldParse {
  const trimmed = raw.trim();
  if (trimmed === "" || /[.,]$/.test(trimmed)) return "incomplete";
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return "invalid";
  const value = Number(normalized);
  return Number.isFinite(value) ? value : "invalid";
}

/** Params that differ from the defaults. Equal values are left out, so a default scenario has no query string. */
export function scenarioToSearch(scenario: Scenario): Partial<Scenario> {
  const search: Partial<Scenario> = {};
  for (const key of Object.keys(defaultScenario) as (keyof Scenario)[]) {
    if (scenario[key] !== defaultScenario[key]) assignSearch(search, key, scenario[key]);
  }
  return search;
}

function assignSearch<K extends keyof Scenario>(search: Partial<Scenario>, key: K, value: Scenario[K]) {
  search[key] = value;
}

export type NumericScenarioKey =
  | "balance"
  | "contribution"
  | "years"
  | "savingsRate"
  | "taxRate"
  | "expectedReturn"
  | "fee"
  | "inflationRate"
  | "targetAmount";

export const numericFieldLimits: Record<NumericScenarioKey, { min: number; max: number; integer?: boolean }> = {
  balance: { min: 0, max: 1_000_000_000_000 },
  contribution: { min: 0, max: 1_000_000_000 },
  years: { min: 1, max: 80, integer: true },
  savingsRate: { min: 0, max: 100 },
  taxRate: { min: 0, max: 100 },
  expectedReturn: { min: 0, max: 100 },
  fee: { min: 0, max: 20 },
  inflationRate: { min: 0, max: 50 },
  targetAmount: { min: 0, max: 1_000_000_000_000 },
};

export interface ScenarioFormValues {
  balance: string;
  contribution: string;
  contributionFrequency: ContributionFrequency;
  years: string;
  savingsRate: string;
  compounding: CompoundingFrequency;
  taxEnabled: boolean;
  taxRate: string;
  expectedReturn: string;
  fee: string;
  inflationEnabled: boolean;
  inflationRate: string;
  targetAmount: string;
  targetKind: GoalTargetKind;
  horizonMode: HorizonMode;
  targetDate: string;
  vehicle: GoalAccount;
}

export function scenarioToFormValues(scenario: Scenario): ScenarioFormValues {
  return {
    balance: String(scenario.balance),
    contribution: String(scenario.contribution),
    contributionFrequency: scenario.contributionFrequency,
    years: String(scenario.years),
    savingsRate: String(scenario.savingsRate),
    compounding: scenario.compounding,
    taxEnabled: scenario.taxEnabled,
    taxRate: String(scenario.taxRate),
    expectedReturn: String(scenario.expectedReturn),
    fee: String(scenario.fee),
    inflationEnabled: scenario.inflationEnabled,
    inflationRate: String(scenario.inflationRate),
    targetAmount: String(scenario.targetAmount),
    targetKind: scenario.targetKind,
    horizonMode: scenario.horizonMode,
    targetDate: scenario.targetDate,
    vehicle: scenario.vehicle,
  };
}

export function numberFieldError(name: NumericScenarioKey, raw: string): string | undefined {
  const parsed = parseUserNumber(raw);
  const limits = numericFieldLimits[name];
  if (parsed === "incomplete") return undefined;
  if (parsed === "invalid") return "Enter a number, using . or , for decimals.";
  if (limits.integer && !Number.isInteger(parsed)) return "Enter a whole number of years.";
  if (parsed < limits.min || parsed > limits.max) {
    return `Enter a value from ${limits.min} to ${formatLimit(limits.max)}.`;
  }
  return undefined;
}

export function scenarioFromForm(values: ScenarioFormValues): Scenario | null {
  const numeric = {} as Record<NumericScenarioKey, number>;
  for (const name of Object.keys(numericFieldLimits) as NumericScenarioKey[]) {
    const parsed = parseUserNumber(values[name]);
    if (typeof parsed !== "number" || numberFieldError(name, values[name])) return null;
    numeric[name] = parsed;
  }

  return {
    balance: numeric.balance,
    contribution: numeric.contribution,
    contributionFrequency: values.contributionFrequency,
    years: numeric.years,
    savingsRate: numeric.savingsRate,
    compounding: values.compounding,
    taxEnabled: values.taxEnabled,
    taxRate: numeric.taxRate,
    expectedReturn: numeric.expectedReturn,
    fee: numeric.fee,
    inflationEnabled: values.inflationEnabled,
    inflationRate: numeric.inflationRate,
    targetAmount: numeric.targetAmount,
    targetKind: values.targetKind,
    horizonMode: values.horizonMode,
    targetDate: values.targetDate,
    vehicle: values.vehicle,
  };
}

function formatLimit(max: number): string {
  return new Intl.NumberFormat("en-US").format(max);
}

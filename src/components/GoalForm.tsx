import { useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import type { CompoundingFrequency } from "../lib/calc.ts";
import { MAX_GOAL_MONTHS, monthsUntil } from "../lib/goal.ts";
import {
  numberFieldError,
  scenarioEqual,
  scenarioFromForm,
  scenarioToFormValues,
  type HorizonMode,
  type Scenario,
  type ScenarioFormValues,
} from "../lib/scenario.ts";
import type { GoalTargetKind, GoalVehicle } from "../lib/goal.ts";

const compoundingOptions: readonly { value: CompoundingFrequency; label: string }[] = [
  { value: "annually", label: "Annually" },
  { value: "semiannually", label: "Semiannually" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
];

export function GoalForm({
  scenario,
  onScenario,
  today,
}: {
  scenario: Scenario;
  onScenario: (next: Scenario) => void;
  today: Date;
}) {
  const form = useGoalForm(scenarioToFormValues(scenario));
  const values = useStore(form.store, (state) => state.values);

  useEffect(() => {
    const next = scenarioFromForm(values);
    if (!next || !goalValuesAcceptable(values, today) || scenarioEqual(next, scenario)) return;
    onScenario(next);
  }, [onScenario, scenario, today, values]);

  useEffect(() => {
    const current = scenarioFromForm(form.state.values);
    if (!current || !scenarioEqual(current, scenario)) {
      form.reset(scenarioToFormValues(scenario));
    }
  }, [form, scenario]);

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <fieldset className="flex flex-col gap-4">
        <legend>
          <span className="block font-display text-xl">The goal</span>
          <span className="block text-sm text-muted">What you want, and whether that number is the balance or the growth.</span>
        </legend>
        <NumberField form={form} name="targetAmount" label="Target amount" suffix="EUR" />
        <ChoiceField
          form={form}
          name="targetKind"
          label="What the target means"
          options={[
            {
              value: "balance",
              title: "Final balance",
              hint: "The account should be worth this much at the end, after tax and fees.",
            },
            {
              value: "growth",
              title: "Net growth",
              hint: "Growth on top of what you put in, after tax and fees. This is the target net return.",
            },
          ]}
        />
        <ChoiceField
          form={form}
          name="horizonMode"
          label="When"
          options={[
            { value: "years", title: "Number of years", hint: "A whole number of years from now." },
            { value: "date", title: "Target date", hint: "Counted in whole months from today." },
          ]}
        />
        {values.horizonMode === "years" ? (
          <NumberField form={form} name="years" label="Years" suffix="yr" hint="Whole years, from 1 to 80." />
        ) : (
          <DateField form={form} today={today} />
        )}
        <NumberField form={form} name="balance" label="Current balance" suffix="EUR" hint="Optional. Leave 0 to start from nothing." />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend>
          <span className="block font-display text-xl">Where it grows</span>
          <span className="block text-sm text-muted">The monthly amount is solved net of tax and fees.</span>
        </legend>
        <ChoiceField
          form={form}
          name="vehicle"
          label="Account"
          options={[
            { value: "savings", title: "Savings", hint: "Interest, compounding, and optional tax on interest." },
            { value: "stocks", title: "Stocks", hint: "Expected return and an annual fund fee." },
          ]}
        />
        {values.vehicle === "savings" ? (
          <>
            <NumberField form={form} name="savingsRate" label="Annual interest rate" suffix="%" />
            <SelectField form={form} name="compounding" label="Compounding" options={compoundingOptions} />
            <ToggleField
              form={form}
              name="taxEnabled"
              label="Tax the interest"
              hint="Applies the tax rate to positive interest as it is credited."
            />
            <NumberField form={form} name="taxRate" label="Tax rate" suffix="%" hint="Used only while tax is on." />
          </>
        ) : (
          <>
            <NumberField form={form} name="expectedReturn" label="Expected yearly return" suffix="%" />
            <NumberField form={form} name="fee" label="Annual fund fee" suffix="%" hint="Charged on assets through the year." />
          </>
        )}
        <ToggleField
          form={form}
          name="inflationEnabled"
          label="Target is in today's euros"
          hint="The amount you typed keeps today's purchasing power, for savings and for stocks. Top-ups are still paid in future euros."
        />
        <NumberField form={form} name="inflationRate" label="Inflation" suffix="%" hint="Used only while today's euros are on." />
      </fieldset>
    </form>
  );
}

function goalValuesAcceptable(values: ScenarioFormValues, today: Date): boolean {
  if (values.horizonMode !== "date") return true;
  const months = monthsUntil(values.targetDate, today);
  return months !== null && months <= MAX_GOAL_MONTHS;
}

function useGoalForm(defaultValues: ScenarioFormValues) {
  return useForm({ defaultValues });
}

type GoalFormApi = ReturnType<typeof useGoalForm>;

function NumberField({
  form,
  name,
  label,
  suffix,
  hint,
}: {
  form: GoalFormApi;
  name: "targetAmount" | "years" | "balance" | "savingsRate" | "taxRate" | "expectedReturn" | "fee" | "inflationRate";
  label: string;
  suffix: string;
  hint?: string;
}) {
  const id = `goal-${name}`;
  return (
    <form.Field
      name={name}
      validators={{
        onChange: ({ value }) => numberFieldError(name, value),
        onBlur: ({ value }) => numberFieldError(name, value) ?? (value.trim() === "" ? "Enter a number." : undefined),
      }}
    >
      {(field) => {
        const error = typeof field.state.meta.errors[0] === "string" ? field.state.meta.errors[0] : undefined;
        return (
          <div>
            <label htmlFor={id} className="block text-sm font-medium">
              {label}
            </label>
            <div className={`mt-1 flex items-center rounded-xl border bg-white ${error ? "border-stocks" : "border-line"}`}>
              <input
                id={id}
                name={field.name}
                inputMode={name === "years" ? "numeric" : "decimal"}
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 tabular-nums outline-none"
                value={field.state.value}
                aria-invalid={error ? true : undefined}
                aria-describedby={hint || error ? `${id}-hint` : undefined}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <span className="pr-3 text-sm text-muted">{suffix}</span>
            </div>
            {hint || error ? (
              <p id={`${id}-hint`} className={`mt-1 text-sm ${error ? "text-stocks" : "text-muted"}`}>
                {error ?? hint}
              </p>
            ) : null}
          </div>
        );
      }}
    </form.Field>
  );
}

function DateField({ form, today }: { form: GoalFormApi; today: Date }) {
  const id = "goal-target-date";
  const min = localISODate(today);
  const max = localISODate(new Date(today.getFullYear() + 80, today.getMonth(), today.getDate()));
  return (
    <form.Field
      name="targetDate"
      validators={{
        onChange: ({ value }) => dateError(value, today),
      }}
    >
      {(field) => {
        const error = typeof field.state.meta.errors[0] === "string" ? field.state.meta.errors[0] : undefined;
        return (
          <div>
            <label htmlFor={id} className="block text-sm font-medium">
              Target date
            </label>
            <input
              id={id}
              name={field.name}
              type="date"
              min={min}
              max={max}
              className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 ${error ? "border-stocks" : "border-line"}`}
              value={field.state.value}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint`}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <p id={`${id}-hint`} className={`mt-1 text-sm ${error ? "text-stocks" : "text-muted"}`}>
              {error ?? "Whole months from today, up to 80 years."}
            </p>
          </div>
        );
      }}
    </form.Field>
  );
}

function dateError(value: string, today: Date): string | undefined {
  const months = monthsUntil(value, today);
  if (months === null) return "Enter a real date.";
  if (months > MAX_GOAL_MONTHS) return "Choose a date within 80 years.";
  return undefined;
}

function ChoiceField<Name extends "targetKind" | "horizonMode" | "vehicle">({
  form,
  name,
  label,
  options,
}: {
  form: GoalFormApi;
  name: Name;
  label: string;
  options: readonly { value: ScenarioFormValues[Name]; title: string; hint: string }[];
}) {
  return (
    <form.Field name={name}>
      {(field) => (
        <fieldset>
          <legend className="text-sm font-medium">{label}</legend>
          <div className="mt-2 flex flex-col gap-2">
            {options.map((option) => {
              const id = `goal-${name}-${option.value}`;
              return (
                <label key={option.value} htmlFor={id} className="flex gap-3 rounded-xl border border-line bg-white px-3 py-3">
                  <input
                    id={id}
                    type="radio"
                    name={field.name}
                    className="mt-1 accent-savings"
                    checked={field.state.value === option.value}
                    onChange={() => field.handleChange(option.value as GoalTargetKind & HorizonMode & GoalVehicle)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="mt-1 block text-sm text-muted">{option.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </form.Field>
  );
}

function SelectField({
  form,
  name,
  label,
  options,
}: {
  form: GoalFormApi;
  name: "compounding";
  label: string;
  options: readonly { value: CompoundingFrequency; label: string }[];
}) {
  const id = `goal-${name}`;
  return (
    <form.Field name={name}>
      {(field) => (
        <div>
          <label htmlFor={id} className="block text-sm font-medium">
            {label}
          </label>
          <select
            id={id}
            name={field.name}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value as CompoundingFrequency)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </form.Field>
  );
}

function ToggleField({
  form,
  name,
  label,
  hint,
}: {
  form: GoalFormApi;
  name: "taxEnabled" | "inflationEnabled";
  label: string;
  hint: string;
}) {
  const id = `goal-${name}`;
  return (
    <form.Field name={name}>
      {(field) => (
        <div className="flex gap-3 rounded-xl border border-line bg-white px-3 py-3">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            className="mt-1 size-4 accent-savings"
            checked={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.checked)}
          />
          <label htmlFor={id}>
            <span className="block text-sm font-medium">{label}</span>
            <span className="mt-1 block text-sm text-muted">{hint}</span>
          </label>
        </div>
      )}
    </form.Field>
  );
}

function localISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

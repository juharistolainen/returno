import { useEffect, type ReactNode } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import type { CompoundingFrequency, ContributionFrequency } from "../lib/calc.ts";
import {
  numberFieldError,
  scenarioEqual,
  scenarioFromForm,
  scenarioToFormValues,
  type NumericScenarioKey,
  type Scenario,
  type ScenarioFormValues,
} from "../lib/scenario.ts";

type Mode = "savings" | "stocks" | "compare";

const contributionOptions: readonly { value: ContributionFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const compoundingOptions: readonly { value: CompoundingFrequency; label: string }[] = [
  { value: "annually", label: "Annually" },
  { value: "semiannually", label: "Semiannually" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
];

export function ScenarioForm({
  scenario,
  onScenario,
  mode,
}: {
  scenario: Scenario;
  onScenario: (next: Scenario) => void;
  mode: Mode;
}) {
  const form = useScenarioForm(scenarioToFormValues(scenario));
  const values = useStore(form.store, (state) => state.values);

  useEffect(() => {
    const next = scenarioFromForm(values);
    if (next && !scenarioEqual(next, scenario)) onScenario(next);
  }, [onScenario, scenario, values]);

  useEffect(() => {
    const current = scenarioFromForm(form.state.values);
    if (!current || !scenarioEqual(current, scenario)) {
      form.reset(scenarioToFormValues(scenario));
    }
  }, [form, scenario]);

  return (
    <form
      className={mode === "compare" ? "grid gap-8 lg:grid-cols-3" : "flex flex-col gap-6"}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Fieldset title="Deposits" description="Shared by every view.">
        <NumberField form={form} name="balance" label="Current balance" suffix="EUR" hint="Already in the account." />
        <NumberField
          form={form}
          name="contribution"
          label="Regular top-up"
          suffix="EUR"
          hint="Added at the start of each month or year."
        />
        <SelectField
          form={form}
          name="contributionFrequency"
          label="Top-up frequency"
          options={contributionOptions}
        />
        <NumberField form={form} name="years" label="Years" suffix="yr" hint="Whole years, from 1 to 80." />
      </Fieldset>

      {mode !== "stocks" ? (
        <Fieldset title="Savings assumptions" description="Interest credited on the money that is already there.">
          <NumberField form={form} name="savingsRate" label="Annual interest rate" suffix="%" />
          <SelectField form={form} name="compounding" label="Compounding" options={compoundingOptions} />
          <ToggleField
            form={form}
            name="taxEnabled"
            label="Tax the interest"
            hint="Flat tax on positive interest. 30% is the lower Finnish capital-income rate. The higher bracket is not modeled."
          />
          <NumberField form={form} name="taxRate" label="Tax rate" suffix="%" hint="Used only while tax is on." />
        </Fieldset>
      ) : null}

      {mode !== "savings" ? (
        <Fieldset title="Stock assumptions" description="A constant expected return, after the fund fee.">
          <NumberField form={form} name="expectedReturn" label="Expected yearly return" suffix="%" />
          <NumberField form={form} name="fee" label="Annual fund fee" suffix="%" hint="Charged on assets through the year." />
        </Fieldset>
      ) : null}

      <Fieldset
        className={mode === "compare" ? "lg:col-span-3" : undefined}
        title="Inflation"
        description="One rate for savings and for stocks."
      >
        <ToggleField
          form={form}
          name="inflationEnabled"
          label="Show today's euros"
          hint="Restates every year-end balance in today's purchasing power. Interest, return, fees, and the nominal balance stay the same."
        />
        <NumberField form={form} name="inflationRate" label="Inflation" suffix="%" hint="Used only while today's euros are on." />
      </Fieldset>

      <details className={`rounded-xl bg-[#f7f2e9] px-3 py-2 text-sm text-muted ${mode === "compare" ? "lg:col-span-3" : ""}`}>
        <summary className="cursor-pointer font-medium text-ink">How the numbers are built</summary>
        <div className="mt-2 space-y-2">
          {mode !== "stocks" ? (
            <p>
              Savings top-ups earn interest only for the time they have been deposited. Interest is credited at the
              compounding frequency. Daily compounding uses a 365-day year. Tax, when on, takes a flat share of positive
              interest in the period it is credited.
            </p>
          ) : null}
          {mode !== "savings" ? (
            <p>
              The stock return compounds monthly. The fee is an annual charge on assets, spread through the year. With
              no top-ups, one year multiplies the balance by (1 + return) × (1 − fee).
            </p>
          ) : null}
          <p>
            The interest rate and the expected return are nominal. When today's euros are on, each year-end balance is
            divided by (1 + inflation) raised to the year. Contributions, interest, tax, and fees stay in nominal euros.
          </p>
        </div>
      </details>
    </form>
  );
}

function Fieldset({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={className ? `flex flex-col gap-4 ${className}` : "flex flex-col gap-4"}>
      <legend className="mb-1">
        <span className="block font-display text-xl text-ink">{title}</span>
        <span className="block text-sm text-muted">{description}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function useScenarioForm(defaultValues: ScenarioFormValues) {
  return useForm({ defaultValues });
}

type AppForm = ReturnType<typeof useScenarioForm>;

function NumberField({
  form,
  name,
  label,
  suffix,
  hint,
}: {
  form: AppForm;
  name: NumericScenarioKey;
  label: string;
  suffix: string;
  hint?: string;
}) {
  const id = `field-${name}`;
  return (
    <form.Field
      name={name}
      validators={{
        onChange: ({ value }) => numberFieldError(name, value),
        onBlur: ({ value }) => numberFieldError(name, value) ?? (value.trim() === "" ? "Enter a number." : undefined),
      }}
    >
      {(field) => {
        const error = firstError(field.state.meta.errors);
        return (
          <div>
            <label htmlFor={id} className="block text-sm font-medium">
              {label}
            </label>
            <div
              className={`mt-1 flex items-center rounded-xl border bg-white ${error ? "border-stocks" : "border-line"}`}
            >
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

function SelectField<Name extends "contributionFrequency" | "compounding">({
  form,
  name,
  label,
  options,
}: {
  form: AppForm;
  name: Name;
  label: string;
  options: readonly { value: ScenarioFormValues[Name]; label: string }[];
}) {
  const id = `field-${name}`;
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
            onChange={(event) => {
              const handleChange = field.handleChange as (value: ScenarioFormValues[Name]) => void;
              handleChange(event.target.value as ScenarioFormValues[Name]);
            }}
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
  form: AppForm;
  name: "taxEnabled" | "inflationEnabled";
  label: string;
  hint: string;
}) {
  const id = `field-${name}`;
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

function firstError(errors: unknown[]): string | undefined {
  const first = errors[0];
  return typeof first === "string" ? first : undefined;
}

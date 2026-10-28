import { describe, expect, it } from "vitest";
import {
  compareProjections,
  projectInvestment,
  projectSavings,
  toChartPoints,
  type InvestmentInput,
  type SavingsInput,
} from "./calc.ts";

function savings(overrides: Partial<SavingsInput> = {}): SavingsInput {
  return {
    balance: 0,
    contribution: 0,
    contributionFrequency: "monthly",
    annualRate: 0,
    compounding: "annually",
    years: 1,
    taxRate: 0,
    inflationRate: 0,
    ...overrides,
  };
}

function stocks(overrides: Partial<InvestmentInput> = {}): InvestmentInput {
  return {
    balance: 0,
    contribution: 0,
    contributionFrequency: "monthly",
    expectedReturn: 0,
    feeRate: 0,
    years: 1,
    inflationRate: 0,
    ...overrides,
  };
}

describe("projectSavings zero rate", () => {
  it("keeps a balance with no interest and no top-ups", () => {
    const result = projectSavings(savings({ balance: 2_500, years: 5 }));
    expect(result.finalBalance).toBe(2_500);
    expect(result.totalContributions).toBe(2_500);
    expect(result.totalGain).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.rows).toHaveLength(5);
  });

  it("adds a monthly top-up at the start of every month", () => {
    const result = projectSavings(
      savings({ contribution: 100, contributionFrequency: "monthly", years: 2 }),
    );
    expect(result.totalContributions).toBe(2_400);
    expect(result.finalBalance).toBe(2_400);
    expect(result.rows[0]?.contributions).toBe(1_200);
    expect(result.rows[1]?.contributions).toBe(1_200);
  });

  it("adds a yearly top-up once each year, not every month", () => {
    const result = projectSavings(
      savings({
        balance: 1_000,
        contribution: 100,
        contributionFrequency: "yearly",
        years: 2,
      }),
    );
    expect(result.totalContributions).toBe(1_200);
    expect(result.finalBalance).toBe(1_200);
    expect(result.rows[0]?.contributions).toBe(100);
    expect(result.rows[1]?.contributions).toBe(100);
  });

  it("returns the starting balance when the horizon is zero years", () => {
    const result = projectSavings(savings({ balance: 80, contribution: 50, years: 0 }));
    expect(result.finalBalance).toBe(80);
    expect(result.totalContributions).toBe(80);
    expect(result.rows).toEqual([]);
  });
});

describe("projectSavings compounding", () => {
  it("matches the closed form with no top-ups for each compounding frequency", () => {
    const principal = 10_000;
    const rate = 0.05;
    const years = 10;
    const cases = [
      ["annually", 1],
      ["semiannually", 2],
      ["quarterly", 4],
      ["monthly", 12],
      ["daily", 365],
    ] as const;

    const balances = cases.map(([compounding, periods]) => {
      const result = projectSavings(
        savings({
          balance: principal,
          annualRate: rate,
          compounding,
          years,
        }),
      );
      const expected = principal * Math.pow(1 + rate / periods, periods * years);
      expect(result.finalBalance).toBeCloseTo(expected, 6);
      expect(result.totalGain).toBeCloseTo(expected - principal, 6);
      return result.finalBalance;
    });

    for (let index = 1; index < balances.length; index += 1) {
      expect(balances[index]!).toBeGreaterThan(balances[index - 1]!);
    }
  });

  it("credits monthly compounding on a top-up made at the start of the month", () => {
    const result = projectSavings(
      savings({
        balance: 5_000,
        contribution: 100,
        contributionFrequency: "monthly",
        annualRate: 0.06,
        compounding: "monthly",
        years: 2,
      }),
    );
    const monthlyRate = 0.06 / 12;
    const months = 24;
    const expected =
      5_000 * Math.pow(1 + monthlyRate, months) +
      100 * (1 + monthlyRate) * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    expect(result.finalBalance).toBeCloseTo(expected, 6);
  });

  it("lets a yearly top-up earn a full year of monthly compounding", () => {
    const result = projectSavings(
      savings({
        balance: 1_000,
        contribution: 1_200,
        contributionFrequency: "yearly",
        annualRate: 0.12,
        compounding: "monthly",
        years: 1,
      }),
    );
    expect(result.finalBalance).toBeCloseTo(2_200 * Math.pow(1.01, 12), 6);
  });

  it("weights intra-year top-ups when interest is credited annually", () => {
    const result = projectSavings(
      savings({
        contribution: 100,
        contributionFrequency: "monthly",
        annualRate: 0.12,
        compounding: "annually",
        years: 1,
      }),
    );
    // Deposits at the start of months 0..11 earn 12/12 .. 1/12 of the year.
    const interestBase = 100 * ((12 + 1) * 12) / 2 / 12;
    expect(result.finalBalance).toBeCloseTo(1_200 + interestBase * 0.12, 8);
    expect(result.finalBalance).toBeCloseTo(1_278, 8);
  });

  it("compounds semiannually with top-ups earning a fraction of each half-year", () => {
    const result = projectSavings(
      savings({
        contribution: 100,
        contributionFrequency: "monthly",
        annualRate: 0.12,
        compounding: "semiannually",
        years: 1,
      }),
    );
    const firstBase = 100 * (21 / 6);
    const firstEnd = 600 + firstBase * 0.06;
    const secondBase = firstEnd + 100 * (21 / 6);
    const expected = firstEnd + 600 + secondBase * 0.06;
    expect(result.finalBalance).toBeCloseTo(expected, 8);
  });
});

describe("projectSavings tax", () => {
  it("withholds a flat tax from positive interest", () => {
    const result = projectSavings(
      savings({
        balance: 1_000,
        annualRate: 0.1,
        compounding: "annually",
        taxRate: 0.3,
        years: 1,
      }),
    );
    expect(result.totalTax).toBeCloseTo(30, 8);
    expect(result.totalGain).toBeCloseTo(70, 8);
    expect(result.finalBalance).toBeCloseTo(1_070, 8);
    expect(result.rows[0]?.tax).toBeCloseTo(30, 8);
  });

  it("matches the untaxed result when the tax rate is zero", () => {
    const base = { balance: 4_000, annualRate: 0.04, compounding: "quarterly" as const, years: 6 };
    const taxed = projectSavings(savings({ ...base, taxRate: 0 }));
    const plain = projectSavings(savings(base));
    expect(taxed.finalBalance).toBeCloseTo(plain.finalBalance, 8);
    expect(taxed.totalTax).toBe(0);
  });

  it("earns no net interest when tax takes the entire interest", () => {
    const result = projectSavings(
      savings({
        balance: 1_000,
        contribution: 25,
        contributionFrequency: "monthly",
        annualRate: 0.08,
        compounding: "monthly",
        taxRate: 1,
        years: 3,
      }),
    );
    expect(result.totalGain).toBeCloseTo(0, 8);
    expect(result.finalBalance).toBeCloseTo(result.totalContributions, 8);
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it("applies daily tax to each day's interest", () => {
    const result = projectSavings(
      savings({
        balance: 500,
        annualRate: 0.1,
        compounding: "daily",
        taxRate: 0.3,
        years: 1,
      }),
    );
    const expected = 500 * Math.pow(1 + (0.1 / 365) * 0.7, 365);
    expect(result.finalBalance).toBeCloseTo(expected, 6);
  });
});

describe("projectSavings rows", () => {
  it("keeps the contribution, interest, and balance identity each year", () => {
    const result = projectSavings(
      savings({
        balance: 2_000,
        contribution: 150,
        contributionFrequency: "monthly",
        annualRate: 0.035,
        compounding: "quarterly",
        taxRate: 0.3,
        years: 8,
      }),
    );
    expect(result.rows.map((row) => row.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    let previousEnd = 2_000;
    for (const row of result.rows) {
      expect(row.startBalance).toBeCloseTo(previousEnd, 8);
      expect(row.endBalance).toBeCloseTo(row.startBalance + row.contributions + row.gain, 6);
      expect(row.gain).toBeCloseTo(row.grossInterest - row.tax - row.fees, 8);
      previousEnd = row.endBalance;
    }
    expect(result.finalBalance).toBeCloseTo(result.totalContributions + result.totalGain, 6);
    expect(result.rows[result.rows.length - 1]?.cumulativeContributions).toBeCloseTo(
      result.totalContributions,
      8,
    );
  });
});

describe("projectInvestment", () => {
  it("grows a lump sum by return after the annual fee", () => {
    const result = projectInvestment(
      stocks({ balance: 1_000, expectedReturn: 0.1, feeRate: 0.01, years: 1 }),
    );
    expect(result.finalBalance).toBeCloseTo(1_000 * 1.1 * 0.99, 6);
    expect(result.totalFees).toBeGreaterThan(0);
    expect(result.totalGain).toBeCloseTo(result.finalBalance - 1_000, 6);
  });

  it("leaves contributions untouched when return and fee are both zero", () => {
    const result = projectInvestment(
      stocks({
        balance: 500,
        contribution: 100,
        contributionFrequency: "monthly",
        years: 2,
      }),
    );
    expect(result.finalBalance).toBe(500 + 100 * 24);
    expect(result.totalFees).toBe(0);
    expect(result.totalGain).toBeCloseTo(0, 8);
  });

  it("deposits a yearly top-up at the start of the year so it earns that year's return", () => {
    const result = projectInvestment(
      stocks({
        contribution: 100,
        contributionFrequency: "yearly",
        expectedReturn: 0.1,
        years: 1,
      }),
    );
    expect(result.finalBalance).toBeCloseTo(110, 6);
    expect(result.rows[0]?.contributions).toBe(100);
  });

  it("charges the fee even when the expected return is zero", () => {
    const withoutFee = projectInvestment(stocks({ balance: 1_000, years: 4 }));
    const withFee = projectInvestment(stocks({ balance: 1_000, feeRate: 0.02, years: 4 }));
    expect(withFee.finalBalance).toBeCloseTo(1_000 * Math.pow(0.98, 4), 6);
    expect(withFee.finalBalance).toBeLessThan(withoutFee.finalBalance);
    expect(withFee.totalGain).toBeLessThan(0);
  });

  it("rejects a fund fee that is not below 100 percent", () => {
    expect(() => projectInvestment(stocks({ feeRate: 1.5, years: 1 }))).toThrow(/finite monthly factor/);
  });

  it("does not change the nominal balance when inflation is set", () => {
    const nominal = projectInvestment(
      stocks({
        balance: 8_000,
        contribution: 200,
        expectedReturn: 0.07,
        feeRate: 0.002,
        years: 15,
      }),
    );
    const inflated = projectInvestment(
      stocks({
        balance: 8_000,
        contribution: 200,
        expectedReturn: 0.07,
        feeRate: 0.002,
        years: 15,
        inflationRate: 0.02,
      }),
    );
    expect(inflated.finalBalance).toBeCloseTo(nominal.finalBalance, 6);
    expect(inflated.finalRealBalance).toBeCloseTo(nominal.finalBalance / Math.pow(1.02, 15), 4);
    expect(inflated.rows[14]?.realEndBalance).toBeCloseTo(inflated.finalRealBalance, 6);
    expect(nominal.finalRealBalance).toBeCloseTo(nominal.finalBalance, 8);
  });

  it("keeps the yearly balance identity after fees", () => {
    const result = projectInvestment(
      stocks({
        balance: 3_000,
        contribution: 250,
        contributionFrequency: "yearly",
        expectedReturn: 0.08,
        feeRate: 0.0075,
        inflationRate: 0.025,
        years: 12,
      }),
    );
    let previous = 3_000;
    for (const row of result.rows) {
      expect(row.startBalance).toBeCloseTo(previous, 6);
      expect(row.endBalance).toBeCloseTo(row.startBalance + row.contributions + row.gain, 4);
      expect(row.gain).toBeCloseTo(row.grossInterest - row.fees, 6);
      expect(row.tax).toBe(0);
      previous = row.endBalance;
    }
    expect(result.finalBalance).toBeCloseTo(result.totalContributions + result.totalGain, 4);
  });
});

describe("projectSavings inflation", () => {
  it("restates the balance in today's euros and leaves the nominal path unchanged", () => {
    const input = {
      balance: 8_000,
      contribution: 200,
      annualRate: 0.03,
      compounding: "monthly" as const,
      years: 15,
    };
    const nominal = projectSavings(savings(input));
    const inflated = projectSavings(savings({ ...input, inflationRate: 0.02 }));
    expect(inflated.finalBalance).toBeCloseTo(nominal.finalBalance, 6);
    expect(inflated.totalGain).toBeCloseTo(nominal.totalGain, 6);
    expect(inflated.totalTax).toBeCloseTo(nominal.totalTax, 6);
    expect(inflated.finalRealBalance).toBeCloseTo(nominal.finalBalance / Math.pow(1.02, 15), 4);
    expect(inflated.rows[0]?.realEndBalance).toBeCloseTo((inflated.rows[0]?.endBalance ?? 0) / 1.02, 6);
    expect(inflated.rows[14]?.realEndBalance).toBeCloseTo(inflated.finalRealBalance, 6);
    expect(nominal.finalRealBalance).toBeCloseTo(nominal.finalBalance, 8);
  });
});

describe("compareProjections and chart points", () => {
  it("reports the ending gap between the stock and savings paths", () => {
    const savingsInput = savings({
      balance: 10_000,
      contribution: 200,
      annualRate: 0.02,
      compounding: "monthly",
      years: 10,
    });
    const stocksInput = stocks({
      balance: 10_000,
      contribution: 200,
      expectedReturn: 0.07,
      feeRate: 0.002,
      inflationRate: 0.02,
      years: 10,
    });
    const comparison = compareProjections(savingsInput, stocksInput);
    expect(comparison.nominalDifference).toBeCloseTo(
      comparison.stocks.finalBalance - comparison.savings.finalBalance,
      6,
    );
    expect(comparison.realDifference).toBeCloseTo(
      comparison.stocks.finalRealBalance - comparison.savings.finalRealBalance,
      6,
    );
    expect(comparison.nominalDifference).toBeGreaterThan(0);
  });

  it("deflates both balances before comparing purchasing power", () => {
    const comparison = compareProjections(
      savings({
        balance: 10_000,
        contribution: 200,
        annualRate: 0.02,
        compounding: "monthly",
        years: 10,
        inflationRate: 0.02,
      }),
      stocks({
        balance: 10_000,
        contribution: 200,
        expectedReturn: 0.07,
        feeRate: 0.002,
        inflationRate: 0.02,
        years: 10,
      }),
    );
    expect(comparison.savings.finalRealBalance).toBeLessThan(comparison.savings.finalBalance);
    expect(comparison.realDifference).toBeCloseTo(
      comparison.stocks.finalRealBalance - comparison.savings.finalRealBalance,
      6,
    );
    expect(comparison.realDifference).not.toBeCloseTo(
      comparison.stocks.finalRealBalance - comparison.savings.finalBalance,
      0,
    );
  });

  it("starts the chart at the current balance", () => {
    const projection = projectSavings(savings({ balance: 400, annualRate: 0.01, years: 3 }));
    const points = toChartPoints(400, projection);
    expect(points).toHaveLength(4);
    expect(points[0]).toEqual({ year: 0, balance: 400, real: 400 });
    expect(points[3]?.balance).toBeCloseTo(projection.finalBalance, 8);
  });
});

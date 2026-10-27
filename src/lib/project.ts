import {
  compareProjections,
  projectInvestment,
  projectSavings,
  toChartPoints,
  type ChartPoint,
  type Comparison,
  type Projection,
} from "./calc.ts";
import type { Scenario } from "./scenario.ts";

export function projectSavingsScenario(scenario: Scenario): Projection {
  return projectSavings({
    balance: scenario.balance,
    contribution: scenario.contribution,
    contributionFrequency: scenario.contributionFrequency,
    annualRate: scenario.savingsRate / 100,
    compounding: scenario.compounding,
    years: scenario.years,
    taxRate: scenario.taxEnabled ? scenario.taxRate / 100 : 0,
  });
}

export function projectStocksScenario(scenario: Scenario): Projection {
  return projectInvestment({
    balance: scenario.balance,
    contribution: scenario.contribution,
    contributionFrequency: scenario.contributionFrequency,
    expectedReturn: scenario.expectedReturn / 100,
    feeRate: scenario.fee / 100,
    years: scenario.years,
    inflationRate: scenario.inflationEnabled ? scenario.inflationRate / 100 : 0,
  });
}

export function projectComparison(scenario: Scenario): Comparison {
  return compareProjections(
    {
      balance: scenario.balance,
      contribution: scenario.contribution,
      contributionFrequency: scenario.contributionFrequency,
      annualRate: scenario.savingsRate / 100,
      compounding: scenario.compounding,
      years: scenario.years,
      taxRate: scenario.taxEnabled ? scenario.taxRate / 100 : 0,
    },
    {
      balance: scenario.balance,
      contribution: scenario.contribution,
      contributionFrequency: scenario.contributionFrequency,
      expectedReturn: scenario.expectedReturn / 100,
      feeRate: scenario.fee / 100,
      years: scenario.years,
      inflationRate: scenario.inflationEnabled ? scenario.inflationRate / 100 : 0,
    },
  );
}

export function savingsChart(scenario: Scenario, projection: Projection): ChartPoint[] {
  return toChartPoints(scenario.balance, projection);
}

export interface ComparePoint {
  year: number;
  savings: number;
  stocks: number;
  stocksReal: number;
}

export function comparisonChart(scenario: Scenario, comparison: Comparison): ComparePoint[] {
  const savingsPoints = toChartPoints(scenario.balance, comparison.savings);
  const stockPoints = toChartPoints(scenario.balance, comparison.stocks);
  return savingsPoints.map((point, index) => ({
    year: point.year,
    savings: point.balance,
    stocks: stockPoints[index]?.balance ?? point.balance,
    stocksReal: stockPoints[index]?.real ?? point.real,
  }));
}

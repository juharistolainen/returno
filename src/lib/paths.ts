export const calculatorPaths = ["/savings", "/stocks", "/compare", "/goal"] as const;

export type CalculatorPath = (typeof calculatorPaths)[number];

export function isCalculatorPath(path: string): path is CalculatorPath {
  return (calculatorPaths as readonly string[]).includes(path);
}

import { planGoal } from "../lib/goal.ts";
import { projectComparison, projectSavingsScenario, projectStocksScenario } from "../lib/project.ts";
import { defaultScenario } from "../lib/scenario.ts";
import { formatEur } from "../lib/format.ts";

export const SITE_ORIGIN = "https://returno.site";
export const OG_IMAGE_PATH = "/og.png";

export interface SeoSection {
  heading: string;
  paragraphs: string[];
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoPage {
  path: "/" | "/savings" | "/stocks" | "/compare" | "/goal";
  file: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
}

const savingsExample = projectSavingsScenario(defaultScenario);
const stocksExample = projectStocksScenario(defaultScenario);
const comparisonExample = projectComparison(defaultScenario);
const goalExample = planGoal({
  vehicle: "savings",
  targetKind: "balance",
  targetAmount: 100_000,
  balance: defaultScenario.balance,
  months: defaultScenario.years * 12,
  annualRate: defaultScenario.savingsRate / 100,
  compounding: defaultScenario.compounding,
  taxRate: 0,
  expectedReturn: defaultScenario.expectedReturn / 100,
  feeRate: defaultScenario.fee / 100,
  inflationRate: 0,
});

function money(value: number): string {
  return formatEur(value);
}

export const seoPages: readonly SeoPage[] = [
  {
    path: "/",
    file: "/index.html",
    title: "Returno — savings and investment expected-return calculators",
    description:
      "Browser-only calculators for compound interest, fund fees, and the monthly amount needed to reach a savings goal. Estimates in euros, not financial advice.",
    eyebrow: "Returno",
    h1: "Expected returns, in euros",
    lede: "Returno is a free, browser-only calculator for a savings balance, a fund or stock-market investment, a side-by-side comparison, and the monthly top-up that hits a goal. Nothing you type is sent to a server.",
    sections: [
      {
        heading: "What you can calculate",
        paragraphs: [
          "Savings compounds a balance with regular top-ups, an annual interest rate, and a compounding frequency. Tax on interest is optional.",
          "Stocks uses an expected yearly return and an annual fund fee. Inflation can restate the result in today's euros.",
          "Compare runs both paths with the same deposits and shows the gap at the end.",
          "Goal solves the monthly top-up for a target final balance or a target net growth.",
        ],
      },
      {
        heading: "Assumptions",
        paragraphs: [
          "Every figure assumes the rate you type stays constant. Returno does not forecast markets, tax law, or inflation. Results are estimates, not financial advice.",
          "Top-ups go in at the start of each month or year. A default illustration uses a €10,000 balance, €200 added each month, and 20 years.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Returno store what I type?",
        answer:
          "No account exists and nothing is uploaded. The scenario is kept in the page address and in this browser's localStorage so you can bookmark it.",
      },
      {
        question: "Are the results a forecast?",
        answer: "No. They are compound-growth arithmetic from the rates you enter. They are not financial advice.",
      },
    ],
  },
  {
    path: "/savings",
    file: "/savings/index.html",
    title: "Compound interest calculator with monthly deposits",
    description:
      "See how a euro savings balance grows with regular top-ups, compounding, and optional tax on interest. A worked example uses €10,000 and €200 a month.",
    eyebrow: "Savings",
    h1: "Compound a savings balance",
    lede: "See a final balance, the money you put in, and the interest that built on top of it.",
    sections: [
      {
        heading: "How the savings calculator works",
        paragraphs: [
          "You enter the current balance, a regular top-up, whether that top-up is monthly or yearly, an annual interest rate, how often interest is credited, and the number of years. Tax is off unless you turn it on.",
          "Each top-up is deposited at the start of the month or year. It earns interest only for the time it has been in the account. Interest is credited at the compounding frequency: annually, semiannually, quarterly, monthly, or daily. Daily mode uses a 365-day year and does not add a leap day.",
          "When tax is on, it is a flat percentage of positive interest only. The default 30% matches the lower Finnish capital-income tax rate. The higher 34% bracket is not modeled, and a negative rate is not taxed.",
        ],
      },
      {
        heading: "Formula",
        paragraphs: [
          "Inside one compounding period the interest base is the balance at the start of the period plus each top-up multiplied by the fraction of the period it is present. Interest equals that base times the periodic rate. After tax, the balance increases by interest minus tax.",
          "With no tax and monthly compounding, a starting balance P and a monthly top-up C at monthly rate i for N months ends at P×(1+i)^N + C×(1+i)×((1+i)^N−1)/i. That is the annuity-due form, because the deposit happens before that month's interest.",
        ],
      },
      {
        heading: "A worked example",
        paragraphs: [
          `Defaults: ${money(defaultScenario.balance)} already saved, ${money(defaultScenario.contribution)} added at the start of each month, ${defaultScenario.savingsRate}% interest compounded monthly, no tax, ${defaultScenario.years} years.`,
          `The balance ends at ${money(savingsExample.finalBalance)}. You contributed ${money(savingsExample.totalContributions)} in total, of which ${money(savingsExample.totalGain)} is interest.`,
        ],
      },
    ],
    faqs: [
      {
        question: "When is the monthly deposit added?",
        answer: "At the start of each month, before that period's interest is credited. A yearly top-up is added at the start of each year.",
      },
      {
        question: "Is the 30% tax always applied?",
        answer:
          "No. Tax is off until you enable it. When it is on, the default rate is 30% of positive interest. You can change the rate. Returno does not apply the Finnish 34% bracket.",
      },
      {
        question: "What if the interest rate is zero?",
        answer: "The balance equals what you put in. No interest is credited and no tax is charged.",
      },
    ],
  },
  {
    path: "/stocks",
    file: "/stocks/index.html",
    title: "Investment calculator with fund fees and inflation",
    description:
      "Project an investment from an expected yearly return after the annual fund fee. Optionally restate the ending balance in today's euros.",
    eyebrow: "Stocks",
    h1: "Project an investment",
    lede: "Same deposits, an expected yearly return, and the fund fee taken off along the way.",
    sections: [
      {
        heading: "How the stock calculator works",
        paragraphs: [
          "You enter the current balance, a regular top-up, an expected yearly return, an annual fund or management fee, and the number of years. Inflation is optional.",
          "The expected return compounds monthly. The fee is an annual charge on assets, spread evenly through the year. With no top-ups, one year multiplies the balance by (1 + return) × (1 − fee).",
          "Inflation does not change the nominal balance. It divides each year-end balance by (1 + inflation)^year so you can read purchasing power in today's euros.",
        ],
      },
      {
        heading: "Formula",
        paragraphs: [
          "Each month the top-up is added first. The balance is then multiplied by (1 + return)^(1/12) and by (1 − fee)^(1/12). After twelve months and no top-ups those factors collapse to (1 + return) × (1 − fee).",
          "Gain is the ending balance minus everything you contributed, so fees reduce the gain and can make it negative.",
        ],
      },
      {
        heading: "A worked example",
        paragraphs: [
          `Defaults: ${money(defaultScenario.balance)} invested, ${money(defaultScenario.contribution)} added each month, ${defaultScenario.expectedReturn}% expected return, ${defaultScenario.fee}% annual fee, no inflation, ${defaultScenario.years} years.`,
          `The nominal balance ends at ${money(stocksExample.finalBalance)}. Contributions are ${money(stocksExample.totalContributions)} and growth after fees is ${money(stocksExample.totalGain)}.`,
        ],
      },
    ],
    faqs: [
      {
        question: "Does the fee come off the expected return?",
        answer:
          "The return is applied first and the fee is then charged on the assets. With no deposits during the year, that is the same as multiplying by (1 + return) × (1 − fee), which is slightly less than subtracting the fee from the return.",
      },
      {
        question: "What does inflation change?",
        answer:
          "Only the 'today's euros' series. The nominal ending balance is unchanged. The real value at year t is the nominal balance divided by (1 + inflation)^t.",
      },
      {
        question: "Is a past market return a promise?",
        answer: "No. The yearly return is an assumption you type. Returno does not look up a market and the result is not financial advice.",
      },
    ],
  },
  {
    path: "/compare",
    file: "/compare/index.html",
    title: "Savings account vs investing calculator",
    description:
      "Compare a savings balance and an investment that use the same deposits. See both ending amounts and the gap after interest, tax, and fund fees.",
    eyebrow: "Compare",
    h1: "Same deposits, two paths",
    lede: "Balance, top-ups, and years are shared. Each path keeps its own rate, fee, and tax.",
    sections: [
      {
        heading: "How the comparison works",
        paragraphs: [
          "The shared inputs are the current balance, the top-up, how often you add it, and the number of years. The savings path then uses its interest rate, compounding frequency, and optional tax. The stock path uses its expected return, fund fee, and optional inflation.",
          "Both lines use the same deposit timing as the single calculators. When inflation is on, a third line shows the investment in today's euros.",
        ],
      },
      {
        heading: "Formula",
        paragraphs: [
          "Each path uses the same formula as its own calculator. The gap is the stock ending balance minus the savings ending balance. A positive gap means the investment finished higher under the rates you typed.",
        ],
      },
      {
        heading: "A worked example",
        paragraphs: [
          `Defaults, with tax off and inflation off: savings ends at ${money(comparisonExample.savings.finalBalance)} and the investment ends at ${money(comparisonExample.stocks.finalBalance)}.`,
          `The investment finishes ${money(comparisonExample.nominalDifference)} ahead of savings. That gap is not a prediction. It is the arithmetic of the two rates you entered.`,
        ],
      },
    ],
    faqs: [
      {
        question: "Why is the comparison not advice to invest?",
        answer:
          "It only shows two constant-rate paths. It ignores risk, the chance the return is lower, and tax rules beyond the flat rate you type.",
      },
      {
        question: "Are the deposits identical?",
        answer: "Yes. The same opening balance and the same top-ups are applied to both calculations.",
      },
      {
        question: "Which balance is the gap based on?",
        answer:
          "The headline gap is nominal stocks minus nominal savings. Inflation, when enabled, is shown as an extra stock series and does not change the savings balance.",
      },
    ],
  },
  {
    path: "/goal",
    file: "/goal/index.html",
    title: "Savings goal calculator — monthly amount to reach a target",
    description:
      "Find the monthly top-up that reaches a euro target by a date or in a number of years, after interest, tax, and fund fees.",
    eyebrow: "Goal",
    h1: "What to save each month",
    lede: "Set the amount and the date. Returno solves the monthly top-up after tax and fees.",
    sections: [
      {
        heading: "How the goal calculator works",
        paragraphs: [
          "You choose a target amount, whether that amount is the final balance or the net growth on top of deposits, and a horizon in whole years or as a date. A date is counted in whole months from today.",
          "The account is either a savings balance (interest, compounding, optional tax) or an investment (expected return, fund fee, optional inflation). The solver uses the same deposit timing and the same net-of-tax, net-of-fee growth as the other calculators.",
          "The ending value is linear in the starting balance and the monthly top-up: final = alpha × balance + beta × monthly. Alpha and beta are the closed form of that monthly recurrence. The payment is rounded up to the next cent.",
        ],
      },
      {
        heading: "Formula",
        paragraphs: [
          "For a final-balance target, monthly = (target − alpha × balance) / beta, then rounded up to the next cent. If the balance already reaches the target with no further top-ups, the monthly amount is zero.",
          "For a net-growth target, the goal is ending balance minus contributions. If extra deposits cannot increase that growth, because the rate is zero or fees dominate, the goal is reported as unreachable.",
          "When the stock target is in today's euros, the nominal target is the amount you typed multiplied by (1 + inflation)^(years).",
        ],
      },
      {
        heading: "A worked example",
        paragraphs: [
          `A final balance of ${money(100_000)} in ${defaultScenario.years} years, starting from ${money(defaultScenario.balance)}, at ${defaultScenario.savingsRate}% compounded monthly and no tax, needs ${money(goalExample.monthlyContribution)} each month.`,
          `That payment is rounded up to the next cent, so the replayed ending balance is ${money(goalExample.projection.finalBalance)}, which meets the target.`,
        ],
      },
    ],
    faqs: [
      {
        question: "What if I already have enough?",
        answer: "The monthly top-up is zero. The chart shows the current balance growing on its own.",
      },
      {
        question: "Can a zero interest rate hit a growth target?",
        answer: "No. With no interest, the balance equals what you contribute, so net growth stays zero. A final-balance target can still be met by saving the difference.",
      },
      {
        question: "How is a target date counted?",
        answer:
          "In whole months from today. A date in the past cannot be saved toward. A date less than one month away is too soon for a monthly top-up. Dates more than 80 years away are rejected.",
      },
    ],
  },
];

export function pageByPath(path: string): SeoPage | undefined {
  return seoPages.find((page) => page.path === path);
}

export function requirePage(path: SeoPage["path"]): SeoPage {
  const page = pageByPath(path);
  if (!page) throw new Error(`Missing SEO content for ${path}`);
  return page;
}

export function canonicalUrl(path: string): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

export function webApplicationJsonLd(page: SeoPage): Record<string, unknown> {
  return {
    "@type": "WebApplication",
    name: page.path === "/" ? "Returno" : `Returno — ${page.h1}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web browser",
    browserRequirements: "Requires a modern browser. The explanation is in the HTML.",
    url: canonicalUrl(page.path),
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    description: page.description,
  };
}

export function faqJsonLd(page: SeoPage): Record<string, unknown> | null {
  if (page.faqs.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function jsonLdGraph(page: SeoPage): Record<string, unknown> {
  const graph = [webApplicationJsonLd(page)];
  const faq = faqJsonLd(page);
  if (faq) graph.push(faq);
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function sitemapXml(lastmod: string): string {
  const urls = seoPages
    .map(
      (page) =>
        `  <url><loc>${canonicalUrl(page.path)}</loc><lastmod>${lastmod}</lastmod></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function llmsTxt(): string {
  const links = seoPages
    .map((page) => `- ${page.h1}: ${canonicalUrl(page.path)}`)
    .join("\n");
  return `# Returno

> Free browser-only expected-return calculators in euros. Estimates only, not financial advice.

Returno compounds a savings balance, projects an investment after fund fees, compares the two, and solves the monthly top-up for a goal. Nothing you type is uploaded.

${links}

Formulas and assumptions are on each page. A longer copy is at ${SITE_ORIGIN}/llms-full.txt.
`;
}

export function llmsFullTxt(): string {
  const blocks = seoPages.map((page) => {
    const sections = page.sections
      .map((section) => `## ${section.heading}\n\n${section.paragraphs.join("\n\n")}`)
      .join("\n\n");
    const faqs = page.faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n");
    return `# ${page.h1}\n\n${canonicalUrl(page.path)}\n\n${page.lede}\n\n${sections}\n\n## Questions\n\n${faqs}`;
  });
  return `${blocks.join("\n\n")}\n`;
}

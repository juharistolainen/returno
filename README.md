# Returno

Returno is a browser-only expected-returns calculator, in euros. There is no account and no server-side calculation. The live site is [https://returno.site](https://returno.site).

The figures are estimates, not financial advice. A rate you type is assumed to stay constant.

## Features

- **Savings** (`/savings`) compounds a balance with regular top-ups, a nominal annual rate, and a compounding frequency. Tax on interest is optional. Inflation, when on, restates the balance in today's euros.
- **Stocks** (`/stocks`) applies an expected yearly return and an annual fund fee. The same inflation switch restates that balance in today's euros.
- **Compare** (`/compare`) runs both paths on the same deposits and shows the gap at the end. Inflation, when on, restates both paths.
- **Goal** (`/goal`) turns a current balance and a target net return, due by a date, into the monthly amount to save. The target can also be a final balance, and the horizon can be a number of years. When inflation is on, the target is in today's euros for either account.
- A shareable URL contains only the values that differ from the defaults. A bare visit restores the last scenario from this browser.
- The footer shows the app version and the UTC build time.

Top-ups go in at the start of each month or year. Savings interest is credited at the compounding frequency (daily uses a 365-day year). Amounts are shown in euros.

Inflation is one annual rate and one on/off switch, shared by every calculator. It is off by default. The query keys are `inflationEnabled` and `inflationRate` (a percent). Those keys are the ones older links already used, and a link that turned inflation on still turns the same switch on. The interest rate and the expected return are nominal, so the euros in the account do not change. Each year-end balance is divided by (1 + inflation) raised to the year. On the goal page the typed target is then in today's euros, and the planner solves for the nominal balance that has that purchasing power. Contributions, interest, tax, and fees stay in nominal euros. A net-growth target is the nominal gain deflated by the factor at the horizon, not each deposit deflated on the day it was paid.

## Stack

Vite 8, React 19, TypeScript 7, TanStack Router 1, TanStack Form 1, TanStack Table 9, Recharts 3, Tailwind 4, and Vitest 5.

## Getting started

Node 22 or newer is required, and CI uses 22. The prerender step runs Node with type stripping.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Run one test file with `npx vitest run src/lib/calc.test.ts`, or filter by name with `npx vitest run -t "name"`.

`npm run dev` prints a local URL, usually http://localhost:5173.

## SEO

`npm run build` prerenders `/`, `/savings`, `/stocks`, `/compare`, and `/goal` to static HTML. The build also writes `sitemap.xml`, `llms.txt`, and `llms-full.txt`, copies `robots.txt` from `public/`, and the pages include `/og.png` plus JSON-LD (`WebApplication` and `FAQPage`).

## Production

returno.site is a self-contained Cloudflare Worker named `returno`. There is no asset binding. Build the site, then embed `dist/` in `worker.mjs`:

```bash
npm run build && npm run build:worker
```

`worker.mjs` is generated and is not committed. It serves each prerendered route, returns 404 for an unknown path and 405 for anything other than GET or HEAD, redirects a non-canonical host to `https://returno.site`, and sends security headers on every response, including a Content-Security-Policy.

A version tag `v*` runs the release workflow, which lints, typechecks, tests, builds the site, runs `build:worker`, and attaches `returno-x.y.z.zip` and `worker.mjs` to the GitHub release. The zip is the prerendered site with `index.html` at the top of the archive, kept so the files can be inspected. Production responses come from the Worker. Deploying to Cloudflare is manual, and only when the owner explicitly asks. A merge does not deploy.

`npm run zip` packs an existing `dist/` into `returno-<version>.zip`. `npm run package:site` builds the site and then runs that.

## More

- [PLAN.md](PLAN.md) is the SEO and AI-search roadmap, with what is done and what is still open.
- [DESIGN-PLAN.md](DESIGN-PLAN.md) is the planned restyle to a Wise-inspired design system. It has not started.
- [SECURITY.md](SECURITY.md) says how to report a vulnerability.
- [AGENTS.md](AGENTS.md) is the guide for coding agents. `CLAUDE.md` imports it.

## License

Apache-2.0. See [LICENSE](LICENSE).

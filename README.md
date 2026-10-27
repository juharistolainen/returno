# Returno

Returno is a browser-only expected-returns calculator, in euros. There is no account and no server-side calculation. The live site is [https://returno.site](https://returno.site).

The figures are estimates, not financial advice. A rate you type is assumed to stay constant.

## Features

- **Savings** (`/savings`) compounds a balance with regular top-ups, a nominal annual rate, and a compounding frequency. Tax on interest is optional.
- **Stocks** (`/stocks`) applies an expected yearly return and an annual fund fee. Inflation is optional and only restates the result in today's euros.
- **Compare** (`/compare`) runs both paths on the same deposits and shows the gap at the end.
- **Goal** (`/goal`) turns a current balance and a target net return, due by a date, into the monthly amount to save. The target can also be a final balance, and the horizon can be a number of years.
- A shareable URL contains only the values that differ from the defaults. A bare visit restores the last scenario from this browser.
- The footer shows the app version and the UTC build time.

Top-ups go in at the start of each month or year. Savings interest is credited at the compounding frequency (daily uses a 365-day year). Amounts are shown in euros.

## Stack

Vite 8, React 19, TypeScript 7, TanStack Router 1, TanStack Form 1, TanStack Table 9, Recharts 3, Tailwind 4, and Vitest 5.

## Getting started

Node 22 is required. The prerender step runs Node with type stripping.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run dev` prints a local URL, usually http://localhost:5173.

## SEO

`npm run build` prerenders `/`, `/savings`, `/stocks`, `/compare`, and `/goal` to static HTML. The build also writes `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`, and the pages include `/og.png` plus JSON-LD (`WebApplication` and `FAQPage`).

## Production

returno.site is a self-contained Cloudflare Worker named `returno`. There is no asset binding. Build the site, then embed `dist/` in `worker.mjs`:

```bash
npm run build && npm run build:worker
```

`worker.mjs` is generated and is not committed. It serves each prerendered route, returns 404 for an unknown path and 405 for anything other than GET or HEAD, redirects a non-canonical host to `https://returno.site`, and sends security headers on every response, including a Content-Security-Policy.

A version tag `v*` runs the release workflow, which lints, typechecks, tests, builds the site, runs `build:worker`, and attaches `returno-x.y.z.zip` and `worker.mjs` to the GitHub release. The zip is the prerendered site with `index.html` at the top of the archive, kept so the files can be inspected. Production responses come from the Worker. Deploying to Cloudflare is manual, and only when the owner explicitly asks. A merge does not deploy.

`npm run package:site` builds that zip locally.

## More

- [PLAN.md](PLAN.md) is the SEO and AI-search roadmap.
- [docs/security-review-2026-10.md](docs/security-review-2026-10.md) is the October 2026 security review.

## License

Apache-2.0. See [LICENSE](LICENSE).

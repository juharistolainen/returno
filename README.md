# Returno

Returno is a small, browser-only calculator for expected savings and investment growth. There is no backend. Scenarios stay in the URL and in `localStorage`, so a result can be bookmarked or sent as a link.

The figures are estimates, not financial advice. Returno assumes the rate you type stays constant. It does not know future interest, market returns, fees, tax, or inflation.

## Calculators

- **Savings** (`/savings`) compounds a balance with regular top-ups, a nominal annual rate, and a compounding frequency. Tax on interest is optional. The default rate of 30% matches the lower Finnish capital-income tax rate; the higher bracket is not modeled.
- **Stocks** (`/stocks`) uses an expected yearly return and an annual fund fee. Inflation is optional and only restates the result in today's euros.
- **Compare** (`/compare`) runs both with the same balance, top-up, and horizon, then shows both lines and the gap at the end.
- **Goal** (`/goal`) solves the monthly top-up that reaches a target balance, or a target net growth after tax and fees. The horizon is a number of years or a date. Savings uses the interest rate, compounding, and optional tax. Stocks use the expected return, fund fee, and optional inflation so the target can be in today's euros.

Top-ups are deposited at the start of each month or year and earn a return only for the time they have been in the account. Savings interest is credited at the compounding frequency (daily uses a 365-day year). With no top-ups, a stock balance after one year is `(1 + return) × (1 − fee)`.

Amounts are shown in euros.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The dev server uses the site root `/`.

## Test and check

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

`npm test` runs Vitest on the calculation, search-param, and storage modules. The calculation tests cover contribution timing, compounding frequencies, a zero rate, tax, and fund fees.

## GitHub Pages

The GitHub Pages workflow has been removed. Returno is published from the release zip (and, in production, from the Cloudflare Worker), not from `github.io`.

`npm run build:pages` still builds with Vite base path `/returno/` and copies `index.html` to `404.html`, which is the old project-site fallback. `npm run build` keeps the base path at `/`.

## Static upload (Cloudflare Pages and similar)

GitHub release assets include `returno-<version>.zip`. That archive is the root-path production build: `index.html` is at the top of the zip, not inside a folder. It is the build to drop into Cloudflare Pages, Netlify, or any host that serves the site from `/`. It is not the GitHub Pages artifact, which uses the `/returno/` base path.

On Cloudflare Pages, create a project, choose **Upload assets**, and upload the zip. The archive contains `_redirects`, so `/savings`, `/stocks`, and `/compare` load the app. `404.html` is included for hosts that use a 404 page as the single-page fallback.

To build the same zip locally:

```bash
npm run package:site
```

## License

Apache-2.0. See [LICENSE](LICENSE).

# Returno security and bug review

Reviewed commit: `d282362` (v0.3.0 on `main`), plus the fixes that followed through v0.3.4.
Date: 27 October 2026.
Scope: the whole repository. Production is the Cloudflare Worker `returno`. It serves prerendered HTML and returns real 404, 301, and 405 responses. It does not fall back to `index.html`.

## Result

No high-severity issue. The app has no accounts, no server, and no secret store. Numbers from the URL and from `localStorage` are read field by field and clamped. React renders them as text. `npm audit` reports nothing for production or development dependencies.

The review fixes were the clear, low-risk ones: pinned Actions, a tighter release-tag filter, chart-year formatting, and a few planner and parser edge cases. Hosting and CI changes after the review are recorded under Current state.

## Findings

### Medium

#### M1. Release workflow used a floating third-party action

**Status:** fixed.

`softprops/action-gh-release@v2` published the site zip from a workflow whose token can write repository contents, including GitHub releases. A major tag moves. If that tag were repointed at a malicious commit, the next `v*` push would run that code with permission to create or replace a release asset (`overwrite_files: true`).

The same floating-tag pattern applied to `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

**Evidence:** `.github/workflows/release-site.yml` and the deleted `.github/workflows/pages.yml`. `contents: write` is set on the release workflow, which is what publishing a release needs. The pull-request workflow is `contents: read` only.

**Fix:** each action is pinned to a full commit SHA, with the version in a comment (`action-gh-release` v2.6.2, `checkout` v4.4.0, `setup-node` v4.4.0, `upload-pages-artifact` v3.0.1, `deploy-pages` v4.0.5). Major upgrades (checkout v7, setup-node v7, deploy-pages v5) were not taken. The Pages workflow was later deleted (I3), so only the release-workflow pins remain.

### Low

#### L1. Goal chart printed raw binary fractions

**Status:** fixed.

A target date that is not a whole number of years stores the chart year as `months / 12`. Ten years and two months is `10.1666…`, and the Recharts axis printed the full float (`10.166666666666666`). The year table already rounded that value.

**Evidence:** `src/components/GrowthChart.tsx` passed `dataKey="year"` with no tick formatter. `src/lib/goal.ts` sets `year` to `cursor / 12`.

**Fix:** `formatChartYear` prints whole years as integers and other values to one decimal (`10.2`). Both chart types use it, and the goal table uses the same helper.

#### L2. A future date inside the current month was described as past

**Status:** fixed.

`monthsUntil` counts whole months. From 27 October, 1 November is zero whole months, which is correct for this model, but the planner told the user the date was "today or in the past".

**Evidence:** `monthsUntil("2026-11-01", new Date(2026, 9, 27))` is `0`. `solveMonthly` used one message for every `months < 1`.

**Fix:** a negative month count says the date is in the past. Zero says it is less than a month away.

#### L3. A date beyond 80 years was solved as if it were 80 years

**Status:** fixed.

`goalInput` clamped any longer date to `MAX_GOAL_MONTHS` and still labelled the result with the original date, so the horizon text and the maths could disagree.

**Evidence:** `src/routes/goal.tsx` previously used `counted > MAX_GOAL_MONTHS ? MAX_GOAL_MONTHS : counted`, while `horizonLabel` still appended `scenario.targetDate`.

**Fix:** `planGoal` rejects a horizon above 80 years and returns an empty projection instead of a shortened one.

#### L4. A fund fee of 100% or more produced NaN

**Status:** fixed.

`Math.pow(1 - feeRate, 1/12)` is `NaN` when `feeRate` is greater than 1. The savings and stock forms clamp the fee to 20%, so the page could not send this, but `projectInvestment` and the goal solver could return a non-finite balance if called with it.

**Evidence:** `Math.pow(-0.5, 1/12)` is `NaN`. The monthly factor is computed in `projectInvestment` and `stockLinearGrowth`.

**Fix:** `projectInvestment` throws when the monthly factor is not finite. `planGoal` returns `unreachable` and a finite zero-contribution projection instead of `NaN`.

#### L5. Search-parameter numbers accepted JavaScript numeric syntax

**Status:** fixed.

`Number("0x10")` is `16`, and `Number("")` is `0`. A query such as `?balance=0x10` therefore became a balance of 16 rather than the default. Values are still rendered as text, so this was not XSS. It was sloppy parsing.

**Evidence:** `readNumber` in `src/lib/scenario.ts` passed strings straight to `Number`.

**Fix:** strings must be plain decimals, with an optional exponent (`1e2` still works). Anything else, including hex and an empty string, uses the default. Numeric JSON from `localStorage` is unchanged.

#### L6. The release workflow runs for every matching tag, with permission to publish

**Status:** partly tightened. The rest is a settings choice.

The workflow triggers on tag push and uses `contents: write`, which is what creating a release needs. It does not interpolate `${{ github.ref }}` or other event text into `run:` scripts, so a tag name cannot inject shell. The previous filter was `v*`, which also matches tags such as `v-not-a-version`.

**Fix:** the filter is `v[0-9]*.[0-9]*.[0-9]*`. GitHub tag filters are globs, so this still allows a suffix (`v0.3.0-test`).

**Tag protection:** done. The `Release tags` ruleset limits who can push or move `v*` tags. `overwrite_files: true` can still replace a release asset when a protected tag is rebuilt on purpose.

#### L7. Optional `fsevents` runs an install script

**Status:** recommendation.

`npm audit` (full tree and `--omit=dev`) reports 0 vulnerabilities. Every `resolved` URL in `package-lock.json` is `https://registry.npmjs.org/...` and has an `integrity` hash. There are no git or http tarball dependencies.

The only `hasInstallScript` entry is `fsevents@2.3.3`, an optional macOS dependency of the Vite toolchain (`dev: true`, `os: darwin`). `npm ci` on Linux does not run it. No action needed unless the install policy should ignore optional scripts (`npm ci --ignore-scripts`), which would also skip useful native builds for Tailwind's Oxide bindings. Leave the current install as it is.

#### L8. Direct dependencies have newer major versions

**Status:** done. Every direct dependency is on the latest stable release as of 27 October 2026. `npm outdated` is empty. `npm audit` (full tree and `--omit=dev`) reports 0 vulnerabilities.

| Package | Was | Now |
| --- | --- | --- |
| `@tanstack/react-table` | 8.21.3 | 9.3.1 |
| `typescript` | 6.0.3 | 7.0.2 |
| `vitest` | 4.1.12 | 5.0.5 |
| `@types/node` | 24.19.2 | 26.6.5 |
| `@fontsource/dm-sans` | 5.2.8 | 5.3.0 |
| `@fontsource/fraunces` | 5.2.9 | 5.3.0 |
| `@tanstack/react-form` | 1.28.0 | 1.33.5 |
| `@tanstack/react-router` | 1.168.0 | 1.170.46 |
| `react` / `react-dom` | 19.2.4 | 19.3.1 |
| `react-is` | 19.3.1 | 19.3.1 |
| `recharts` | 3.7.0 | 3.10.1 |
| `@tailwindcss/vite` / `tailwindcss` | 4.2.2 | 4.3.3 |
| `@types/react` | 19.2.14 | 19.3.0 |
| `@types/react-dom` | 19.2.3 | 19.3.0 |
| `@vitejs/plugin-react` | 6.0.1 | 6.1.2 |
| `oxlint` | 1.50.0 | 1.90.0 |
| `vite` | 8.0.8 | 8.3.5 |

**Migration:** TanStack Table 9 is the only API change. `YearTable` now calls `useTable` with an explicit `tableFeatures({})`. The core row model is built in, so `getCoreRowModel` is gone. `ColumnDef` takes the feature set as its first type argument. The table reads cells with `getAllCells()` because column visibility is no longer included unless that feature is registered. Headers and cells render through `table.FlexRender`. TypeScript 7 and Vitest 5 needed no config change. `tsconfig` is unchanged, and `vitest.config.ts` is unchanged. Lint, typecheck, the unit tests, and `npm run build` passed at the time. The suite is 89 tests as of the Node zip writer.

### Informational

#### I1. No cross-site scripting path through scenarios

Search values and `localStorage` (`returno.scenario.v1`) are parsed in `parseScenario`. It builds a new object and copies only known fields. Enums must match an allow-list. The date must be a real `YYYY-MM-DD`. Numbers are finite and clamped (balance and target up to 1e12, rates up to 100, fee up to 20, years 1–80).

There is no `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. Chart labels and currency strings are React text. `JSON.parse('{"__proto__":{"polluted":true}}')` does not change `Object.prototype` (the parser defines an own property; it does not use the `__proto__` setter). A regression test covers that.

A shared link can still set any in-range scenario. That is the feature. It cannot run script.

#### I2. Content-Security-Policy is not set in this repo

**Status:** done on the generated Worker (`scripts/build-worker.mjs`). Every response, including 301, 404, and 405, sends:

```
Content-Security-Policy: default-src 'self'; script-src 'self' <sha256 of each JSON-LD block>; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
```

`script-src` does not use `'unsafe-inline'`. The prerendered `application/ld+json` blocks are allowed by hash. The same hashes cover the copy React inserts, including after a client-side route change, because every page's hash is on every response. `style-src` keeps `'unsafe-inline'` because Recharts and React set `style` attributes, and a hash cannot allow those. Checked in Chrome against the built worker: `/savings` rendered the final balance and the chart SVG, both JSON-LD scripts matched a hash already in the policy, and Chrome reported no Content-Security-Policy refusal.

`public/_redirects` is gone, and `/404.html` is not a public route. The Worker still uses the prerendered not-found document as the body of a 404. The site zip no longer contains `_redirects`.

#### I3. GitHub Pages workflow was present and disabled

**Status:** done. `.github/workflows/pages.yml` is deleted. `npm run build:pages`, the `/returno/` Vite base, the `spaFallback` plugin, and `public/_redirects` are removed. The GitHub Pages site is unpublished.

#### I4. Financial model limits that are intentional

Checked against the existing tests and extra cases added here:

- Top-ups are applied at the start of the month (or on the first day of each 365-day month). Interest is credited at the compounding boundary. Daily mode uses a 365-day year and no leap day.
- Tax applies only to positive interest. A 100% tax leaves the balance equal to contributions.
- One stock year with no top-ups is `(1 + return) × (1 − fee)`. Inflation changes the real series only.
- The goal solver's `alpha` / `beta` form matches `projectSavings` and `projectInvestment` for the compounding frequencies, including a spread of quarterly cases. The monthly amount is rounded up to the next cent, so the replayed balance meets the target.
- A starting balance that already meets the target produces a monthly top-up of 0.
- A zero interest rate cannot hit a positive net-growth target. A fee that exceeds the expected return cannot either, because extra top-ups then reduce growth. A final-balance target can still be reached by depositing more, which is what the solver does.
- The UI will not send a negative rate, balance, or fee. The pure functions still accept a negative savings rate and do not tax a loss. That is reasonable. Extending the forms to model a loss is a product decision.

`sessionToday` is captured when the module loads. A tab left open past midnight still counts months from that timestamp until reload. Acceptable for this app.

#### I5. Repo hygiene

No tokens, private keys, or `.env` files are in the tree. `git` history for the application is the public calculator plus the release commits. Release zips are not committed. `npm audit` was run for the whole tree and with `--omit=dev`; both were clean.

## What the review fixes changed

- Pinned the Actions used by the release workflow to commit SHAs. The Pages workflow was removed instead of kept in a pinned, disabled state.
- Narrowed the release tag filter to version-like tags.
- Deleted `.github/workflows/pages.yml`.
- Upgraded every direct dependency to the latest stable release, including TanStack Table 9, TypeScript 7, Vitest 5, and `@types/node` 26.
- Updated the release notes so they describe the Worker deploy.
- Formatted chart years, distinguished a near date from a past date, and refused a horizon past 80 years.
- Stopped non-finite fund fees from producing `NaN`.
- Rejected non-decimal strings in scenario numbers.
- Added tests for those cases, plus a small grid of savings rates checked against the forward projection.

## Current state

As of 27 October 2026, after v0.3.4:

- The Worker returns 404, 301, and 405 itself. Unknown paths, including `/_redirects` and `/404.html`, get the prerendered not-found page with status 404. There is no `index.html` fallback.
- Tag protection is on through the `Release tags` ruleset.
- The test suite is 89 tests. It covers the calculators, search params, the site zip, and the worker routing cases, including the path-traversal and open-redirect regressions.
- The GitHub Pages site is unpublished. Pages leftovers (`build:pages`, `/returno/` base, `spaFallback`, `public/_redirects`) are removed.
- Cloudflare zone settings in use: Always Use HTTPS is on, and the minimum TLS version is 1.2.
- Dependabot (npm and GitHub Actions, weekly), CodeQL default setup, and private vulnerability reporting are enabled.
- CI (check name `CI / ci`) runs on pull requests to `main` and on pushes to `main`. It uses Node 22 and runs lint, typecheck, test, build, `build:worker`, and `npm audit --omit=dev --audit-level=high`.
- A `v*` tag runs the release workflow, which builds `worker.mjs` and attaches it to the GitHub release together with `returno-x.y.z.zip`. The zip is written by `scripts/zip-site.mjs` (Node). There is no Python in the repo. A merge does not deploy. A Cloudflare deploy happens only when the owner asks.

## Left for Juha

Nothing from this review is still open. Tag protection, which was the remaining item, is done.

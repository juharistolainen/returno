# AGENTS.md

Guidance for coding agents (Claude Code, Cursor, Codex, and others) working in this repository. `CLAUDE.md` imports this file.

## What this is

Returno is a browser-only expected-returns calculator, in euros. It has four calculators (`/savings`, `/stocks`, `/compare`, `/goal`) and a landing page at `/`. Nothing is calculated on a server. Production is https://returno.site, served by a self-contained Cloudflare Worker named `returno`.

Stack: Vite 8, React 19, TypeScript 7, TanStack Router / Form / Table, Recharts 3, Tailwind 4, Vitest 5, oxlint. CI uses Node 22. The prerender step needs Node 22 or newer, because it runs with `--experimental-strip-types`.

## Commands

```bash
npm ci
npm run dev            # Vite dev server, usually http://localhost:5173
npm run lint           # oxlint
npm run typecheck      # tsc -b
npm test               # vitest run (Node environment, no DOM)
npm run build          # tsc -b && vite build && prerender
npm run build:worker   # embed dist/ into worker.mjs (run after build)
npm run zip            # pack an existing dist/ into returno-<version>.zip
```

Single test file or test name:

```bash
npx vitest run src/lib/calc.test.ts
npx vitest run -t "partial test name"
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, build, `build:worker`, and `npm audit --omit=dev --audit-level=high`. Run the same sequence before calling a change done.

## Deployment rules

- Never deploy to Cloudflare, push a tag, or cut a release unless the owner explicitly asks. A merge does not deploy.
- A `v*.*.*` tag runs `.github/workflows/release-site.yml`, which attaches `returno-x.y.z.zip` and `worker.mjs` to a GitHub release. The owner deploys the Worker by hand.
- `worker.mjs` and `returno-*.zip` are generated and gitignored.
- Actions are pinned to full commit SHAs with the version in a comment. Keep it that way. Dependabot updates them.

## Architecture

### Three layers of rendering

1. **Client app** (`src/main.tsx` → `src/router.tsx`): an SPA mounted with `createRoot`, without hydration. Routes live in `src/routes/`. Each is built with `createRoute` and added to the tree in `router.tsx`. `src/routes/root.tsx` uses `RootLayout` and `NotFound` from `src/components/AppShell.tsx`.
2. **Prerender** (`scripts/prerender.mjs`, the last step of `npm run build`): does **not** render React. It takes the Vite-built `dist/index.html` shell and writes HTML strings for each entry in `seoPages` (`src/content/seo.ts`), plus `404.html`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`. That HTML is what crawlers and no-JS visitors see. When the JS bundle loads, `createRoot` replaces it.
3. **Worker** (`scripts/build-worker.mjs` + `scripts/worker-route.mjs`): embeds every file in `dist/` into one `worker.mjs` with no assets binding. `worker-route.mjs` handles routing: the 301 redirect to the canonical host, `noindex` on `workers.dev`, 404 and 405 responses, cache headers, security headers, and the CSP. Its source is inlined into the worker with the `export` keywords stripped, so it must not import anything. CSP `script-src` hashes are computed from the inline JSON-LD blocks in the built HTML (`scripts/csp-hash.mjs`).

Copy for a page therefore lives in two places: the React route component and `src/content/seo.ts`, which feeds both `SeoBlock` (the article under each calculator) and the prerender. When you change a heading or the article, check both. In the browser, `SeoBlock` also sets the document title, description, and robots meta. The route `head` option is not used.

### Scenario state (shared across all calculators)

- `src/lib/scenario.ts` defines one `Scenario` holding every input for all four calculators, plus `defaultScenario`, parsing and clamping (`parseScenario`, `numericFieldLimits`), and form ↔ scenario conversion.
- URL search params are the source of truth. `src/lib/search.ts` strips params that equal the defaults (`stripSearchParams`), so the default scenario is a bare URL. Canonical URLs depend on this.
- A bare URL restores the last scenario from `localStorage` (`src/lib/storage.ts`, key `returno.scenario.v1`). That happens in the page through `useShownScenario` in `src/routes/scenario-page.tsx`, not in `validateSearch`, because the router would otherwise rewrite the address bar.
- `useReplaceScenario` writes storage first, then calls `navigate({ replace: true })` with only the non-default params.
- `parseScenario` copies known fields only, checks enums against an allow-list, accepts plain decimal strings only, and clamps numbers. It is the security boundary for URLs and storage, so keep it strict.

### Calculation code

- `src/lib/calc.ts`: core projections (`projectSavings`, `projectInvestment`, `compareProjections`).
- `src/lib/goal.ts`: solves the monthly top-up for a target (`planGoal`) in closed form, using a linear-growth (`alpha` / `beta`) decomposition that must match the forward projections. Horizons are capped at 80 years.
- `src/lib/project.ts`: maps a `Scenario` to calc inputs and chart points. Route components call this, not `calc.ts` directly.
- `src/lib/session-today.ts`: "today", frozen at page load so goal dates do not drift between renders.

### Build metadata

`vite.config.ts` injects `__APP_VERSION__` and `__BUILD_TIME__` (from `scripts/build-meta.mjs`, which honours `SOURCE_DATE_EPOCH`) and writes `dist/build-meta.json`. The footer stamp is `buildStampText` in `src/lib/build-stamp.ts`. The prerender throws if its own footer text stops matching it.

## Guardrails the tests enforce

- `scripts/verification-meta.mjs` checks that the Google and Bing verification `<meta>` tags are in `index.html` and in every prerendered page. Do not remove them.
- `scripts/worker-route.test.mjs` locks the CSP string, the status codes, the redirects, path traversal handling, and content types. `script-src` must never get `'unsafe-inline'`. `style-src` keeps it because Recharts and React set `style` attributes.
- `src/content/seo.test.ts` locks the SEO strings, the JSON-LD, and the sitemap.
- Test files are `src/**/*.test.ts` and `scripts/**/*.test.mjs`.

## Conventions

- Commit subjects are plain sentences in the imperative, with no prefix (`Show the version and build time in the footer`). The body explains why.
- A version bump is its own commit, `Bump version to x.y.z`, touching only `package.json` and `package-lock.json`. The version shows in the footer.
- Docs and UI copy use short, plain sentences, sentence case, and no emoji. Figures are estimates, not financial advice. Keep that disclaimer wherever it appears.
- When a change finishes an item in `PLAN.md` or `DESIGN-PLAN.md`, update that document in the same PR.

## Planning docs

- `PLAN.md`: the SEO and AI-search roadmap. Done items carry PR links, and there is a status summary at the top.
- `DESIGN-PLAN.md`: a phased retrofit to a Wise-inspired design system (cyan accent, Figtree, `@theme` tokens). The decisions are closed and no phase has started. Read it before any styling work. A design PR must not change `src/lib/`, the copy in `src/content/`, URLs, search params, or `contentSecurityPolicy`, and must not edit `public/favicon.svg`, `public/og.png`, or `scripts/og-image.mjs`.
- `SECURITY.md`: the security reporting policy.

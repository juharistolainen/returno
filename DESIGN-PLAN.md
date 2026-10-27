# Wise design system for Returno — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Returno with the Wise-Inspired Design System export, keeping every route, calculation, URL, label, and prerendered sentence.

**Architecture:** Vendor the package CSS and the two Figtree files, point Tailwind 4's `@theme` colours and fonts at the system's tokens, and keep the existing utility class names. Reimplement the few patterns Returno actually has as ordinary React 19 elements with the package's CSS classes. Do not mount `window.WiseDS`.

**Tech Stack:** Vite 8, React 19, TypeScript, TanStack Router / Form / Table, Recharts 3, Tailwind 4, Vitest 5. Production is a self-contained Cloudflare Worker built by `npm run build && npm run build:worker`.

Inventory below is from `main` at `0f32307` (v0.3.4). `src/` and `index.html` are unchanged at `31d4078`, so it still holds there. Later commits removed the GitHub Pages build (`build:pages`, the `spaFallback` plugin, `public/_redirects`) and moved the Action pins.

**Status (27 Oct 2026):** decisions closed, no phase started. There is no `src/styles/`, and `src/main.tsx` still imports `@fontsource`. The design export was read from a scratch unzip of the uploaded package (`wise-ds-web/AGENT.md`, which this plan treats as the retrofit playbook, plus `DESIGN.md`, `patterns.md`, `tokens.json`, `css/wise-ds.css`, `css/wise-ds-base.css`, `react/wise-ds.d.ts`, `example.html`). That package is not in the repo yet.

## Status

Implemented on `design-system-application`, 2026-10-27. Not deployed, tagged, or released; no PR opened yet.

| Phase | Commit | Summary |
|---|---|---|
| 1 | `8540865` | Vendored `wise-ds.css`, `wise-ds-base.css`, Figtree. `data-accent="cyan"`. `@fontsource` removed. |
| 2 | `1ff0aae` | `@theme` colours point at the tokens. Opacity modifiers and arbitrary backgrounds gone. |
| 3 | `2a8cb10` | Shell, mark, nav tray, copy button, dark footer, client 404. |
| 5 | `fecd651` | Field rows with `field-with-suffix`, ink checkboxes and radios. |
| 4 | `9743269` | Page headers, home cards, summary figures. |
| 6 | `5847dc3` | Chart tokens, year table, SEO article, goal status. |
| 7 | `f531f84` | Prerender classes, static 404 link, unused theme keys removed. |

Phase 5 landed before Phase 4. Checkboxes below are ticked only where the check was run; open boxes were not verified in this pass. See "Implementation notes" for where the code differs from the plan text.

## Implementation notes

Differences from the plan text, and why. All are presentation only.

- **`wise-ds-base.css` loads in Tailwind's base layer** (`@import "./styles/wise-ds-base.css" layer(base);`), not unlayered. Unlayered `:where()` element rules would beat Tailwind utilities. Consequence: Tailwind's preflight `*` reset and the base file tie on specificity and the base file wins by order, so `p`, `h1`–`h3`, `ul`, `li`, and `table` pick up the system's margins (and `p` its `--body` colour, `ul` a 24px left padding). Touched elements set `mb-0`, `m-0`, or `p-0` explicitly. Preflight still wins on heading `font-size` and `a` colour, so headings need a type class and links inherit colour unless classed.
- **No `token-wins.css`.** The built CSS already ends with `--radius-xl: 24px`, `--radius-md: 12px`, the system `--shadow-lg`, and the cyan accent block, so the Phase 1 fallback was not needed.
- **The Phase 3 input border reset was never added.** Phase 5 field markup owns the single ink border, so there was nothing to delete.
- **`.shadow-md` correction.** Tailwind 4's `shadow-md` inlines its own values and does not read `--shadow-md`. `src/index.css` adds an unlayered `.shadow-md { box-shadow: var(--shadow-md); }` beside the radius corrections, so the toast and the chart tooltip use the system shadow.
- **Theme keys after Phase 7:** `paper`, `ink`, `card`, `line`, `line-soft`, `muted`, `tint`, `stocks`, `body`, `positive`, `mute-on-dark`. Removed: `savings`, `savings-soft`, `stocks-soft`, `real`, `on-fill`, `positive-soft`. `stocks` is kept as the name for `--negative-deep` (form errors, a negative stock gain, an unreachable goal) rather than renaming every use; it no longer means the stocks series. `body` is new (`--body`, SEO copy).
- **Goal "reached"** uses `text-positive` (`--positive-deep`), "unreachable" uses `text-stocks` (`--negative-deep`), otherwise `text-ink`, on both the status card and the monthly top-up figure.
- **Chart series** carry an optional `dash` (`"4 4"` for the goal target), passed as `strokeDasharray`. The tooltip colours each row from the series list by `dataKey`, not from Recharts' `entry.color`.
- **Card padding** is `p-6` on the form panels, summary tiles, chart card, and home cards. The goal status card and the table header are `px-6 py-4`.
- **Static 404** is `<main class="wds-container py-8">`, not a bare `<main>`, so the no-JS page has the same gutters as the prerendered routes. Prerendered pages are `<article class="wds-container py-8">`, header `mt-6`, eyebrow `wds-eyebrow eyebrow`, `h3` `body-strong`.

## Global constraints

Copied from the playbook. Every phase inherits them.

- One accent for the whole site: `<html data-accent="cyan">`. The package also ships lime, apricot, amber, and lilac. Returno uses cyan.
- One accent-filled element per view.
- Text on an accent fill is `--on-primary`. An accent base colour is never text, a thin line, or a meaningful icon on a light surface. Links and small accent text use `--primary-text`.
- `--chart-1` and `--chart-2` are for dark panels only. A third category colour, when used on a dark panel, is `--apricot-base`.
- `--mute` fails 4.5:1. Meaningful captions use `--text-3` on light surfaces and `--mute-on-dark` on `--ink`.
- Focus is `outline: 2px solid var(--focus-ring); outline-offset: 2px` on light surfaces, and `--focus-ring-on-dark` on dark bands.
- Labels stay wired to inputs. Errors keep `aria-invalid` and `aria-describedby`. Status keeps a word, not colour alone.
- One `h1` per page, then `h2`, then `h3`. Sentence case. Display headings at weight 900 except `display-lg` (400) and the screen-title styles `display-sm` / `display-xs` (600).
- No emoji or Unicode icons, no gradients, no hover lift or scale, no bouncy motion, no sharp-cornered controls.
- Spacing rounds to the 4px scale: 2, 4, 8, 12, 16, 24, 32, 48, 64, 96. Radii: inputs `--radius-md` (12px), buttons and cards `--radius-xl` (24px), large containers `--radius-2xl` (32px), pills `--radius-pill`.
- Shadows only on UI that floats (popover, toast, modal). Cards sit on sage with no shadow and no border.
- Presentation only. Same copy, URLs, form names, and behaviour. No new pages, no dark mode, no second UI library, no font other than Figtree for display and body.
- Self-hosted fonts only. Do not deploy, tag, or release from a design PR. The owner publishes the Worker.

## Decisions

Recorded 2026-10-27, from Juha.

1. **Accent is cyan.** `<html data-accent="cyan">`. Lime stays unused: it is Wise's brand colour, and this is a public product. With cyan, `wise-ds.css` rewrites `--chart-1` from `--cyan-base` to `--lime-base`. Charts do not use that variable. See Charts.
2. **Charts stay on white cards.** No dark chart panel. Series colours are `--ink`, `--primary-text` (`--cyan-text` `#00587a`), `--body`, and `--text-3`. No accent base (`--cyan-base` `#38c8ff`, `--lime-base` `#9fe870`, `--lilac-base`, `--apricot-base`) as text, a chart stroke, a legend dot, or any other thin mark on a light surface.
3. **Favicon and `og.png` stay as they are.** Do not edit `public/favicon.svg`, `scripts/og-image.mjs`, or `public/og.png`. Their current hexes are a listed exception.
4. **Screen titles are 32px.** Calculator pages and both 404 pages use `display-sm` (32px, weight 600). The home `h1` uses `display-md` (40px, weight 900).
5. **Both 404 links say "Open the savings calculator" and point at `/savings`.** That label names the page it opens. "Back to Returno" does not. The heading "That page is not here" and the sentence under it stay. This is the one copy change in the retrofit.
6. **The static 404 has no calculator nav.** The other prerendered pages include that nav. `dist/404.html` keeps the heading, the sentence, the savings link, and the build stamp.
8. **Chart series: savings blue, stocks green.** Added 2026-10-27 after the first pass, from Juha: the ink / dark-cyan lines were too alike. (A red / green pass came first and was replaced the same day: red read as an error state.) Savings is `--primary-text` (`#00587a`, 7.84:1 on white), stocks `--positive` (`#2ead4b`). `--positive` is 2.92:1 on white, just under the 3:1 line target; it is a deliberate exception so the green differs from the dark blue in lightness as well as hue (`--positive-deep` was too close to the blue). The legend word carries the meaning, and the tooltip rows are ink text with a coloured disc, so no text is set in `--positive`. The single-series area fill follows the line: `--primary-pale` or `--positive-pale`. Today's euros lines are dashed `8 4` (longer than the target's `4 4`) so the grey line is not confused with the dark blue savings line. Summary figures stay ink.
7. **Checkboxes and radios use ink.** `accent-color: var(--ink)` on `field-taxEnabled`, `field-inflationEnabled`, `goal-taxEnabled`, `goal-inflationEnabled`, and the goal radios. They are not an accent fill. The wordmark disc stays the only one.

## Implementation choices

**Components.** Reimplement with the CSS classes. Do not use `react/wise-ds.react.js`.

The runtime file is an IIFE that reads `window.React` and assigns `window.WiseDS`. It was built for React 18 on a global. Returno is React 19, ESM, and Vite. Putting React on `window` and loading a classic script beside the module graph races (`script-src` is `'self'`, so a same-origin file would be allowed, and the order still breaks). `Button` always renders a `<button>`, while the 404 action and the home cards are links. `TextField` has no suffix slot, and the euro / percent / year suffixes are part of the controls. `SegmentedTabs` renders `role="tab"` buttons, and the calculator nav is four routes. The prerender script writes HTML strings and never calls React, so the IIFE does not help crawlers. The `.d.ts` types are the contract for the class names and ARIA, not a module to import.

Typed wrappers, only where the markup repeats: a field row and a metric tile, in `src/components/`, emitting the classes from `patterns.md`. Everywhere else, put the classes on the elements that already exist.

**The one accent fill** is the wordmark disc (the rounded square behind the sparkline in `Mark`), filled with `--primary` (`--cyan-base`) and drawn in `--on-primary` (`#001f2e`). Copy, nav, figures, and checkboxes do not take an accent fill. Links use `--primary-text` (`#00587a`), which is the text step, not the cyan base. The on-page mark follows the accent. `public/favicon.svg` and `public/og.png` do not.

---

## File structure for the later PRs

| File | Responsibility |
|---|---|
| `src/styles/wise-ds.css` | Vendored package CSS. Tokens, type classes, the 15 component classes, both `@font-face` rules. |
| `src/styles/wise-ds-base.css` | Vendored optional layer. Loaded when `class="wds"` goes on `<body>`. |
| `src/styles/token-wins.css` | Added only if the built CSS lets Tailwind redefine a shared variable. See Phase 1. |
| `src/fonts/Figtree-Variable.woff2` | Upright variable font, 300–900. |
| `src/fonts/Figtree-Italic-Variable.woff2` | Italic, referenced by the second `@font-face`. Copy it even though the UI has no italics, or that request 404s. |
| `src/fonts/README.md` | One line from the package README: Figtree, self-hosted, SIL Open Font License 1.1. The export has no license file. |
| `src/index.css` | `@theme` map, radius-utility corrections, page background, focus. |
| `src/main.tsx` | Drop the `@fontsource` imports. |
| `index.html` | `data-accent` and, from Phase 3, `class="wds"` on `<body>`. |
| `src/components/AppShell.tsx` | Shell, mark, nav, copy button, toast, footer, client 404. |
| `src/components/BuildStamp.tsx` | Version and UTC build time. The rendered words stay. |
| `src/components/PageIntro.tsx`, `src/routes/home.tsx` | Page header. |
| `src/components/Summary.tsx` | The big figures and the fit behaviour. |
| `src/components/ScenarioForm.tsx`, `src/components/GoalForm.tsx` | Fields. |
| `src/components/GrowthChart.tsx` and the four route files that pass `color` | Chart strokes. |
| `src/components/YearTable.tsx`, `src/components/SeoBlock.tsx` | Table and the article. |
| `scripts/prerender.mjs` | No-JS HTML, including the stamp and the static 404. |
| `public/favicon.svg`, `scripts/og-image.mjs`, `public/og.png` | Unchanged. Current teal mark stays. |

Do not copy `react/wise-ds.react.js`, `patterns.html`, `example.html`, or `assets/logo-mark.svg` into the app. The logo file is a placeholder mark, not Returno's.

---

## Phase 1 — Install the CSS and Figtree

**Files:** the vendored CSS and fonts above. Modify `src/index.css`, `src/main.tsx`, `index.html`, `package.json`.

**Produces:** `:root` tokens from `wise-ds.css`, Figtree loading from the built CSS, `data-accent="cyan"` on the shell. Tailwind colour utilities still point at the old hexes, so the palette does not flip in this phase. Type does flip, because `--font-sans` and `--font-display` become Figtree together.

### Where the files go

`wise-ds.css` lines 8–9:

```css
src: url("../fonts/Figtree-Variable.woff2") format("woff2");
src: url("../fonts/Figtree-Italic-Variable.woff2") format("woff2");
```

Put the stylesheet at `src/styles/wise-ds.css` and the fonts at `src/fonts/`. From that CSS file, `../fonts/` is `src/fonts/`, which is what Vite resolves. Vite then fingerprints both files into `dist/assets/Figtree-Variable-<hash>.woff2` and `dist/assets/Figtree-Italic-Variable-<hash>.woff2` and rewrites the two `url()` values. That rewrite is the playbook's "fix those two URLs". Do not hand-edit them, and do not move the fonts to `public/` after the CSS is imported, or the relative path and the fingerprint disagree.

Leave the fonts out of `public/`. A `public/fonts` copy would be unhashed and easy to drift from the CSS.

Both woff2 files are about 28KB. Vite's default `assetsInlineLimit` is 4KB, so they are emitted as files. Keep them as files. A `data:` font inside the stylesheet would be blocked: `img-src` allows `data:`, and `font-src` is not set, so fonts fall back to `default-src 'self'`, which does not include `data:`.

### Import order

Replace the font imports in `src/main.tsx` (today `@fontsource/dm-sans` latin 400/500/600/700 and `@fontsource/fraunces` latin 500/700, then `./index.css`). The entry imports only `./index.css`.

`src/index.css`:

```css
@import "tailwindcss";
@import "./styles/wise-ds.css";

@theme {
  --font-sans: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  /* Colours stay on the current hexes until Phase 2. */
  --color-paper: #f4f0e7;
  --color-ink: #1c1814;
  --color-card: #fffdf8;
  --color-line: #e4d9c8;
  --color-muted: #5e564c;
  --color-savings: #0f6e62;
  --color-savings-soft: #e6f3f0;
  --color-stocks: #b4532a;
  --color-stocks-soft: #fde8dc;
  --color-real: #35557a;
}

/*
  Tailwind utilities and the design system share --radius-* and --shadow-*.
  These rules are unlayered, so they beat the utilities, and they do not
  rewrite the custom properties the component classes read.
  rounded-xl is the input utility (12px = --radius-md).
  rounded-2xl is the card utility (24px = --radius-xl, not --radius-2xl which is 32px).
*/
.rounded-lg { border-radius: var(--radius-sm); }
.rounded-xl { border-radius: var(--radius-md); }
.rounded-2xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-pill); }
```

`index.html` head stays as it is (verification metas included). Set `data-accent="cyan"` on `<html>`. Do not add `class="wds"` yet, and do not import `wise-ds-base.css` yet.

Remove `@fontsource/dm-sans` and `@fontsource/fraunces` from `package.json` and the lockfile in this phase so the build stops emitting a second pair of families.

### Shared variable names

Tailwind 4's theme and `wise-ds.css` both write these custom properties: `--font-display`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

If the design-system file is last, `--radius-2xl` becomes 32px and every current `rounded-2xl` card would jump to the hero radius. The unlayered corrections above stop that. `--radius-xl` becoming 24px is what `.wds-btn` and `.wds-card` need. `--font-display` becoming the Figtree stack matches `@theme`.

After `npm run build`, read the last declaration in `dist/assets/*.css`:

- `--radius-xl` is `24px`
- `--radius-md` is `12px`
- `--shadow-lg` contains `rgba(14, 15, 12`
- `[data-accent="cyan"]` sets `--primary: var(--cyan-base)` and `--chart-1: var(--lime-base)`

If Tailwind's theme block lands later and `--radius-xl` is `0.75rem`, add `src/styles/token-wins.css` and `@import` it last, unlayered, restating only the colliding properties with the values from `wise-ds.css` (`--font-display`, `--font-body`, the radius block, the three shadows). The phase is done when the grep matches. Do not rename the system's variables.

### Worker and CSP

`scripts/build-worker.mjs` walks `dist/` and embeds every file. `scripts/worker-route.mjs` already maps `woff2` to `font/woff2` and treats it as binary (base64), because `woff2` is not in `TEXT_EXTENSIONS`. Paths under `/assets/` get `public, max-age=31536000, immutable`.

`contentSecurityPolicy` is:

```js
"default-src 'self'"
"script-src 'self' …hashes"
"style-src 'self' 'unsafe-inline'"
"img-src 'self' data:"
```

There is no `font-src`, so fonts use `default-src 'self'`. A same-origin fingerprinted woff2 passes. A Google Fonts or other CDN URL fails. Do not add a host to the policy. Do not add `font-src`. `scripts/worker-route.test.mjs` asserts `style-src 'self' 'unsafe-inline'` and rejects `unsafe-inline` in `script-src`. Leave that function alone.

`style-src 'unsafe-inline'` stays for Recharts SVG `style` attributes and for the hidden textarea in `copyWithTextarea` (`AppShell.tsx`), which sets `style` properties. `style-src-attr` falls back to `style-src`. A hash cannot allow those attributes. The comment above `contentSecurityPolicy` already says this.

Production is `npm run build` then `npm run build:worker`. There is no other build path. The GitHub Pages build was removed.

### Acceptance

- [x] `find dist -name '*.woff2'` prints two Figtree files under `dist/assets/` after `npm run build`.
- [x] The built CSS `url()` values point at those `/assets/` files.
- [x] The variable grep above passes.
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:worker` pass.
- [x] Worker log still lists the prerendered HTML routes. `contentSecurityPolicy` is unchanged.
- [x] Pages still calculate. The visible change in this phase is Figtree replacing DM Sans and Fraunces.

---

## Phase 2 — Point `@theme` at the tokens

**Files:** `src/index.css` only, plus class tweaks that exist solely because an opacity modifier or an arbitrary colour cannot follow a `var()`.

**Consumes:** Phase 1 tokens.

This is the playbook's mapping rule for a Tailwind site: change the theme values, leave the utility names. `bg-card`, `text-ink`, `text-muted`, `border-line`, `font-display`, and `font-sans` stay in the components.

Replace the colour entries in `@theme`:

```css
@theme {
  --font-sans: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;

  --color-paper: var(--canvas-soft);       /* page */
  --color-ink: var(--ink);
  --color-card: var(--canvas);             /* cards, inputs, nav */
  --color-line: var(--hairline);           /* decorative dividers */
  --color-muted: var(--text-3);            /* captions that carry meaning */
  --color-tint: var(--canvas-tint);        /* new: wells and the nav tray */
  --color-savings: var(--primary-text);    /* interim, until Phase 3 removes extra accent text */
  --color-savings-soft: var(--primary-pale);
  --color-stocks: var(--negative-deep);    /* errors and negative amounts */
  --color-stocks-soft: var(--negative-pale);
  --color-real: var(--body);               /* third series, quiet */
  --color-on-fill: var(--on-primary);
  --color-positive: var(--positive-deep);
  --color-positive-soft: var(--positive-pale);
  --color-mute-on-dark: var(--mute-on-dark); /* footer stamp, Phase 3 */
}
```

`text-savings` through this phase resolves to `--primary-text` (`#00587a`) on purpose. Phase 3 deletes the uses that are not links. Say that in the PR body so the review does not treat the blue eyebrows as the end state.

Tailwind's `/80` modifiers need a colour they can decompose. `var(--hairline)` does not survive `border-line/80`. Drop the alpha instead of inventing a new colour. The system wants flat fills.

| Class today | File | Replacement |
|---|---|---|
| `border-line/80` | `AppShell.tsx` header and footer | `border-line` |
| `bg-card/85 backdrop-blur` | header | `bg-card`. Delete the blur. |
| `border-line/70` | `YearTable.tsx` body rows | `border-line` |
| `bg-[#efe7da]` | nav tray | `bg-tint` |
| `bg-[#f7f2e9]` | `ScenarioForm.tsx` details | `bg-tint` |
| body gradients `#fff9f0`, `#e8f4f1` | `index.css` | delete. `background: var(--color-paper)` and `color: var(--color-ink)`. |

Focus in `index.css` becomes:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

`--focus-ring` is `--ink`. Phase 3 adds the dark-band exception.

`bg-white` and `text-white` are Tailwind's default palette, not `@theme` keys. They are listed in the mapping table and replaced in the component phases. Leave them for one phase so this PR stays a theme diff.

### Acceptance

- [x] Page background is flat `#e8ebe6`. Cards are `#ffffff`. No gradient in `src/`.
- [x] `rg` over `src/` finds no `bg-[#` and no `/80` or `/85` or `/70` colour modifiers.
- [ ] Focus ring is ink, visible on the first field.
- [x] `npm test` and `npm run build` pass. Prerendered headings are unchanged.

---

## Step 2 — Inventory (current source)

Tailwind 4 is the framework. Utilities in the components stay. The tables are the map.

### Colours

Defined in `src/index.css` `@theme` and painted again as raw values.

| Value | Role today | Where |
|---|---|---|
| `#f4f0e7` | Page (`--color-paper`) | `src/index.css`. Also the logo baseline and `public/favicon.svg`. |
| `#1c1814` | Text (`--color-ink`) | `src/index.css`. Goal target series in `src/routes/goal.tsx`. |
| `#fffdf8` | Cards (`--color-card`) | `src/index.css`. Logo stroke, favicon. `bg-white` on inputs is a second white. |
| `#e4d9c8` | Borders (`--color-line`) | `src/index.css`. |
| `#5e564c` | Secondary text (`--color-muted`) | `src/index.css`. Chart ticks in `GrowthChart.tsx` (`fill: "#5e564c"`). |
| `#0f6e62` | Brand, focus, savings series, positive number, link | `--color-savings`. Focus outline. `Mark` and favicon fill. Chart series in `savings.tsx`, `compare.tsx`, `goal.tsx`. |
| `#e6f3f0` | `--color-savings-soft` | Defined only. No component reads it. |
| `#b4532a` | Stocks series, error border, error text, negative gain, failed copy | `--color-stocks`. `stocks.tsx`, `compare.tsx`, `goal.tsx`. Error classes in both forms. Failed state in `CopyLinkButton`. |
| `#fde8dc` | `--color-stocks-soft` | Failed copy button background. |
| `#35557a` | "Today's euros" series and figure | `--color-real`. `stocks.tsx`, `compare.tsx`, `goal.tsx`. |
| `#fff9f0`, `#e8f4f1` | Page gradient | `src/index.css` `body`. |
| `#efe7da` | Nav tray | `AppShell.tsx` arbitrary class. |
| `#f7f2e9` | "How the numbers are built" well | `ScenarioForm.tsx`. |
| `#eadfcd` | Chart grid | `GrowthChart.tsx` `CartesianGrid`. |
| `#f3c7a6` | Dot on the mark | `Mark` and favicon. No other use. |
| `#ffffff` via `text-white` / `bg-white` | Text on the teal copy button and the toast; input fill | `AppShell.tsx`, both forms. |
| `public/og.png` | Social image | Drawn by `scripts/og-image.mjs` from the same paper, card, ink, muted, savings, stocks, and real RGB values. |

### Fonts, sizes, weights

| Piece | Today | Nearest style |
|---|---|---|
| Body | DM Sans, `--font-sans`. Weights 400, 500, 600, 700 loaded. | `--font-body`, Figtree. `body` 16/400, `body-strong` 16/600, `body-sm` 14/400, `body-sm-strong` 14/600. Weight 500 (`font-medium`) rounds to 600. Weight 700 is unused once Figtree is in; nothing sets `font-bold`. |
| Display | Fraunces, `--font-display`. Weights 500 and 700 loaded. Elements set no weight, so the used face is 500. | Figtree. Screen titles `display-sm` 32/600. Card and section titles `display-xs` 24/600. Home title `display-md` 40/900. Figures `figure` 32/900. |
| Wordmark | `text-[1.7rem]` (27px), `font-display`, `AppShell.tsx` | `display-xs` (24px). The example page sets the wordmark in `display-xs`. |
| Page h1 | `text-4xl` (36px) / `sm:text-5xl` (48px). `PageIntro.tsx`, `home.tsx` | Calculator pages: `display-sm` via the page-header pattern (the package calls 32/600 the screen title). Home: `display-md` 40/900. The marketing `display-xl` (64/900) is for a campaign hero and would swamp the form. |
| 404 h1 | `text-3xl` (30px) | `display-sm`. |
| Section h2 | `text-2xl` (24px). Chart, table, SEO headings, home card titles. | `display-xs`. |
| Fieldset title | `text-xl` (20px) `font-display` | `display-xs`. |
| Lede | `text-lg` (18px) | `body-lg` (20px). |
| Body / FAQ question | `text-base` plus `font-semibold` on the question | `body` and `body-strong`. |
| Labels, nav, table, footer disclaimer | `text-sm` (14px), often `font-medium` | `body-sm` or `body-sm-strong`. |
| Hints under figures, build stamp | `text-xs` (12px) | `caption`. |
| Eyebrow | `text-sm font-semibold tracking-wide uppercase` in `--color-savings` | `eyebrow` (12/600, tracking 0.08em, uppercase) in `--text-3`. The package puts eyebrows in `--text-3`, not in the accent. |
| Mono | None loaded. | `--font-mono` system stack. Nothing in the UI needs a mono file. |
| Figures | `text-[clamp(1rem,8.4cqw,1.7rem)]` in `Summary.tsx` | See "Big figures" below. The clamp is the fit behaviour and has to stay. |

### Radii, spacing, shadow

Tailwind's default spacing scale is already a 4px grid. `gap-1` is 4, `gap-2` is 8, `gap-3` is 12, `gap-4` is 16, `gap-6` is 24, `p-4` is 16, `py-8` is 32, `max-w-6xl` is 1152px beside the package container of 1200px. Leave those utilities. The corrections in Phase 1 retarget the radius utilities:

| Utility | Used for | After Phase 1 |
|---|---|---|
| `rounded-lg` | Skip link, wordmark link | `--radius-sm` 8px |
| `rounded-xl` | Inputs, radio rows, details, tooltip | `--radius-md` 12px |
| `rounded-2xl` | Cards, 404 panel, mobile nav tray | `--radius-xl` 24px |
| `rounded-full` | Nav items, copy button, toast, legend dots | `--radius-pill` |

Card interior today is `p-4` (16px) or `px-4 py-3`. The package's card padding is `--space-xl` (24px). Phase 4 and 5 move card padding to `p-6` when a card is touched. Do not rewrite every `p-4` in Phase 2.

Off-scale values that stay as layout, listed in the leftovers:

- Chart plot `h-64` / `sm:h-80` (`GrowthChart.tsx`).
- Table scroller `max-h-[28rem]` (`YearTable.tsx`).
- Form column `minmax(18rem, 22rem)` and summary `minmax(min(100%, 17rem), 1fr)`.
- Recharts `strokeWidth={2.25}` and chart margins of 8. Eight is `--space-sm`. 2.25 has no token; keep it and list it.
- `py-1.5` on nav links and `py-1` on the copy button are under the 48px target. Phase 3 sets those controls to `--control-md` (48px). Inputs stay `--control-sm` (40px), which is the text-field spec. The playbook's 48px check applies to buttons and nav items.

Shadows today: `shadow-sm` on the current nav item and the chart tooltip, `shadow-lg` on the copy toast. Delete the nav shadow (the item is not floating). Keep a shadow on the tooltip and the toast, using `--shadow-md` and `--shadow-lg`.

### Controls

| Control | Where | Pattern |
|---|---|---|
| Skip link | `AppShell.tsx`, `href="#main"` | Stays a link. Focus style uses the focus ring. |
| Wordmark link | `Link to="/"` | Stays a link. Disc is the accent fill. |
| Calculator nav | Four `Link`s, `aria-label="Calculators"`, `aria-current` from the router. Savings, Stocks, Compare, Goal. Search is `scenarioToSearch(scenario)`. | Links, styled like the framed tab tray. Not `role="tab"`. |
| Copy button | `<button type="button">`. Labels: "Copy link", "Link copied", "Could not copy link". `aria-live="polite"`. | `wds-btn wds-btn--secondary`. Status colours are positive / negative, with the words. |
| Toast | `<p role="status">` fixed at the top. Same two messages. | Floating, `--shadow-md`, `--ink` fill, `--canvas-soft` text. |
| Number inputs | `ScenarioForm` ids `field-balance`, `field-contribution`, `field-years`, `field-savingsRate`, `field-taxRate`, `field-expectedReturn`, `field-fee`, `field-inflationRate`. `GoalForm` ids `goal-targetAmount`, `goal-years`, `goal-balance`, `goal-savingsRate`, `goal-taxRate`, `goal-expectedReturn`, `goal-fee`, `goal-inflationRate`. Suffixes EUR, %, yr. `inputMode` decimal or numeric. `aria-invalid` and `aria-describedby={`${id}-hint`}`. | Text field markup, suffix kept. |
| Selects | `field-contributionFrequency` (Monthly, Yearly), `field-compounding` and `goal-compounding` (Annually, Semiannually, Quarterly, Monthly, Daily). | Same field chrome. Native `<select>`. |
| Date | `goal-target-date`, `type="date"`, `min` / `max` from today and 80 years. | Text field. |
| Checkboxes | `field-taxEnabled`, `field-inflationEnabled`, `goal-taxEnabled`, `goal-inflationEnabled`. | Bordered row, `accent-color: var(--ink)`. |
| Radios | `goal-targetKind-balance`, `goal-targetKind-growth`, `goal-horizonMode-years`, `goal-horizonMode-date`, `goal-vehicle-savings`, `goal-vehicle-stocks`. Each has a title and a hint. | Stay radios. A chip would drop the hint. |
| Details | "How the numbers are built" in `ScenarioForm.tsx`. | Tint well. Not a code card. |
| Chart tooltip | Recharts tooltip, not a control in the tab order. | Floating card, `--shadow-md`. |
| Table | `YearTable.tsx`, sticky header, `caption` is `sr-only`. | Package table element styles once `wise-ds-base.css` is loaded. |
| No modals, no toasts besides the copy status, no second nav. | | |

### Routes and templates

One shell, `RootLayout` in `src/components/AppShell.tsx`, wraps every matched route through `<Outlet />`. `src/routes/root.tsx` sets `notFoundComponent: NotFound`, so the client 404 renders in that outlet and keeps the header and footer.

| Route | File | Template |
|---|---|---|
| `/` | `src/routes/home.tsx` | Header, four calculator links, `SeoBlock`. |
| `/savings` | `src/routes/savings.tsx` | `PageIntro`, form card, summary, area chart, year table, SEO. |
| `/stocks` | `src/routes/stocks.tsx` | Same, with the inflation series when it is on. |
| `/compare` | `src/routes/compare.tsx` | Intro, full-width form, summary, multi-series chart, table, SEO. |
| `/goal` | `src/routes/goal.tsx` | Intro, goal form, status sentence, summary, chart, table, SEO. |
| Unknown, with JS | `NotFound` in `AppShell.tsx` | Card, h1 "That page is not here", link to `/savings` with the default scenario search. Sets `noindex`. |
| Unknown, without JS | `scripts/prerender.mjs` writes `dist/404.html` | Today: h1, the same sentence, link "Back to Returno" to `/`, then the build stamp. The plan changes that link to "Open the savings calculator" at `/savings`. Worker returns status 404. |
| Prerendered documents | `scripts/prerender.mjs` `renderPage` | `/`, `/savings`, `/stocks`, `/compare`, `/goal`. Nav of those paths, eyebrow, h1, lede, sections, FAQ, the short disclaimer, then the stamp. `createRoot` in `src/main.tsx` replaces `#root` on boot, so this HTML is what crawlers and no-JS visitors see. |

Shared pieces: `PageIntro`, `ScenarioForm` (modes `savings`, `stocks`, `compare`), `GoalForm`, `Summary`, `GrowthChart`, `YearTable`, `SeoBlock`, `BuildStamp`.

SEO copy lives in `src/content/seo.ts` and is not part of the visual map. Titles, descriptions, canonicals, JSON-LD, sitemap, and `llms.txt` stay.

---

## Step 3 — Token map

| Current | Token or style |
|---|---|
| `#f4f0e7` page, gradients | `--canvas-soft` |
| `#fffdf8` card, `bg-white` inputs | `--canvas` |
| `#efe7da` nav tray, `#f7f2e9` details | `--canvas-tint` |
| `#1c1814` text, goal target line | `--ink` for text. Target line on the chart uses `--text-3` (still 6.26:1 on white) so the target reads as a guide. |
| `#5e564c` captions, chart ticks | `--text-3`. Never `--mute`. |
| `#e4d9c8` dividers, `#eadfcd` grid | `--hairline` for dividers and the grid. Input edges become `--ink` (the field spec). `--hairline` is 1.39:1 on white and cannot be the only edge of a control. |
| `#0f6e62` as a link or the one emphasised action | `--primary-text` |
| `#0f6e62` as a fill (logo, focus, copy button) | Logo disc: `--primary` with `--on-primary` strokes. Focus: `--focus-ring`. Copy button: secondary fill `--canvas-soft`, ink label. |
| `#0f6e62` savings series | `--ink` stroke on the white chart card |
| `#b4532a` stocks series | `--primary-text` (`--cyan-text` `#00587a`). Not `--primary`, not `--chart-1`. |
| `#35557a` real series | `--body` |
| `#b4532a` error text and borders | `--negative` border, `--negative-deep` message |
| `#fde8dc` error wash | `--negative-pale` |
| `#e6f3f0` | `--primary-pale`, then delete the theme key in Phase 7 if nothing references `savings-soft` |
| `#f3c7a6` logo dot | `--on-primary`. The peach dot is a second accent with no token. |
| `text-white` on teal | Goes away with the teal button. Toast text is `--canvas-soft`. |
| DM Sans, Fraunces | `--font-body` and `--font-display` (both Figtree) |
| Sizes in the inventory | The style named in that table |
| Card radius 16px (`rounded-2xl`) | `--radius-xl` 24px |
| Input radius 12px (`rounded-xl`) | `--radius-md` |
| Pill shapes | `--radius-pill` |
| `shadow-sm` on the nav item | Delete |
| `shadow-sm` tooltip, `shadow-lg` toast | `--shadow-md`, `--shadow-lg` |
| Any new transition | `var(--dur-fast)` or `var(--dur-base)` with `var(--ease-out)`. Reduced motion already zeroes those in `wise-ds.css`. |

Exceptions, carried to the Phase 7 report:

- `public/favicon.svg` and `public/og.png` keep today's hexes (`#0f6e62`, `#f4f0e7`, `#fffdf8`, `#f3c7a6`, and the og-image palette in `scripts/og-image.mjs`). Juha decided on 2026-10-27 to leave both assets alone. The on-page `Mark` in `AppShell.tsx` still uses `--primary` and `--on-primary`.
- Chart plot height, table max height, the two grid tracks.
- Recharts `strokeWidth` 2.25.
- `format.ts` / `goal.ts` use of the word "rounded" for cents. That is arithmetic, not CSS.

---

## Component map (the 15 patterns)

| Pattern | Returno |
|---|---|
| Button | Copy button, secondary, 48px, `type="button"`. The 404 "Open the savings calculator" link is `<a class="wds-btn wds-btn--text">` (or a secondary link) and keeps its `to` / search. Home cards are links, not buttons. |
| Pill | No tag in the UI today. Do not add one. The copy button already changes its words. |
| CategoryChip | Do not use. Goal choices have titles and hints that must remain visible. |
| TextField | Every number, select, and date. Keep `htmlFor` / `id`, `name`, `aria-invalid`, `aria-describedby`, suffixes, and the TanStack Form handlers. Error wrapper gets `wds-field--error`; the message stays in the existing hint paragraph, coloured `--negative-deep`. |
| SegmentedTabs | Visual reference for the nav tray only (`wds-tabs--framed` spacing: hairline tray, 8px padding, 40px is too short so the links are 48px). Markup stays `<nav>` and `<a aria-current="page">`. |
| TabBar | Do not add a bottom bar. The header nav is the only nav. |
| PageHeader | `PageIntro` and the home header. Eyebrow, one `h1`, lede in `wds-lead` after the title. |
| SectionLabel | Do not run form legends or SEO headings through the uppercase label. They are sentence-case titles at `display-xs`. Uppercasing "The goal" would change the voice. |
| MetricTile | `Summary` tiles. Label, then the formatted euro string as the figure, hint as the one-line observation. No icon. Figures are `--ink`. A negative gain and an unreachable goal use `--negative-deep` plus the words already in the label or the goal message. |
| FeedEntry | No feed. The year table stays a table. |
| InsightCard | Home calculator links, the form panel, the chart card, the goal message, the client 404 card. White card on sage, no border, no shadow, `display-xs` title where the card has a title. |
| JournalCard | No dated long-form card. The SEO article keeps its headings and paragraphs. |
| DataCard | Do not wrap "How the numbers are built" in a fake code window. Tint well, `--canvas-tint`, radius `--radius-md`. |
| Callout | Do not add one. The disclaimer stays in the footer. |
| Icon | Do not import the Lucide subset. The mark stays the current sparkline SVG, recoloured with `--primary` and `--on-primary`. Error text already has words, so it does not gain an icon. |

---

## Charts

`GrowthChart.tsx` draws on a white card (`bg-card`). That stays. There is no dark chart panel.

Cyan changes the chart tokens. From `wise-ds.css`, `[data-accent="cyan"]` sets `--chart-1: var(--lime-base)` (`#9fe870`). `--chart-2` stays `--lilac-base` (`#b1a1f0`). The default meaning of `--chart-1` is cyan (`#38c8ff`, 1.93:1 on white). After the accent switch it is Wise lime (1.47:1 on white). `--chart-2` is 2.28:1 on white. The playbook limits both to dark panels. `--primary` is the cyan base, and an accent base is not a thin line or text on a light surface. `--positive` is 2.92:1 on white, under the 3:1 mark for a meaningful line.

Series colours are text tokens that clear 3:1 on `--canvas`:

| Series | Token | Resolved at cyan | Where it is passed |
|---|---|---|---|
| Savings, or a single balance | `--primary-text` (was `--ink`, see Decision 8) | `#00587a` (7.84:1 on white) | `savings.tsx` balance. `compare.tsx` savings. `goal.tsx` balance when `vehicle === "savings"`. |
| Stocks | `--positive` (was `--primary-text`, see Decision 8) | `#2ead4b` (2.92:1, exception) | `stocks.tsx` nominal. `compare.tsx` stocks. `goal.tsx` balance when `vehicle === "stocks"`. |
| Today's euros | `--body`, dashed `8 4` (Decision 8) | `#454745` | `stocks.tsx` real, `compare.tsx` `stocksReal`, `goal.tsx` real. |
| Goal target | `--text-3`, dashed `4 4` | `#5f615d` | `goal.tsx` `target`. The legend still says "Target". |

Do not pass `var(--chart-1)`, `var(--chart-2)`, `var(--primary)`, `var(--cyan-base)`, `var(--lime-base)`, or `var(--apricot-base)` as a stroke, fill of a line, or legend dot. `--primary-text` is the allowed accent-linked colour on white.

Pass `stroke="var(--ink)"` (and the siblings). Recharts writes that onto the SVG. `style-src 'unsafe-inline'` already allows it. Delete the hex literals in the route files and in `GrowthChart.tsx` (`#eadfcd`, `#5e564c`, and `entry.color` as a raw paint).

- Grid: `stroke="var(--hairline)"`, vertical still off. The grid is decorative, not a series.
- Tick fill: `var(--text-3)`, `fontSize` 12 (`--fs-caption`).
- Single series keeps the area chart. Fill is flat, opacity 1, and follows the stroke: `var(--primary-pale)` under savings, `var(--positive-pale)` under stocks (Decision 8). Delete `fillOpacity={0.16}`. The pale step is a tint behind the series line, not a thin mark.
- Two or more series keep the line chart, no area.
- `isAnimationActive={false}` stays, so the chart does not depend on the reduced-motion duration tokens.
- Tooltip: white card, `--radius-md`, `--shadow-md`, ink text. Each row has the same line swatch as the legend; the text stays ink (Decision 8). Set `cursor={false}` so the default grey cursor band does not introduce another colour.
- Legend and tooltip: the word plus a 24 × 8px swatch of the series line (same token, same `strokeDasharray`), so dashed series read as dashed. The word is the meaning. (Originally an 8px disc; changed after Decision 8 so the two dashed greys on the goal chart are told apart in the legend.)

---

## Big figures

`Summary.tsx` is the tile row on savings, stocks, compare, and goal. The value is one `formatEur` string, `whitespace-nowrap` and `tabular-nums`, shrunk with `clamp(1rem, 8.4cqw, 1.7rem)` inside `@container` so a long balance does not overflow the tile (`minmax(min(100%, 17rem), 1fr)`).

The `figure` style is 32px / 900 and does not shrink. Keep the fit, and step through token sizes instead of a raw clamp:

```css
.summary-figure {
  font-family: var(--font-display);
  font-weight: var(--fw-black);
  letter-spacing: -0.015em;
  line-height: 1;
  font-size: var(--fs-sm); /* 32px, the figure style */
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  max-width: 100%;
}
@container (max-width: 22rem) {
  .summary-figure { font-size: var(--fs-xs); } /* 24 */
}
@container (max-width: 16rem) {
  .summary-figure { font-size: var(--fs-body-lg); } /* 20 */
}
@container (max-width: 13rem) {
  .summary-figure { font-size: var(--fs-body); font-weight: var(--fw-strong); } /* 16 */
}
```

The tile keeps `@container`. The label stays above the number (`dt` then `dd`), in `eyebrow` / `--text-3`. The hint stays `caption`. Do not split the euro sign into `wds-tile__unit`; `formatEur` is the whole value and the tests around formatting stay untouched.

Default colour is `--ink`. `text-savings` and `text-stocks` on the figure go away in Phase 4. Unreachable / reached / negative gain keep a word in the goal message or the tile label, and the figure uses `--negative-deep` or `--positive-deep` only beside that word.

---

## Footer, version, build time

`RootLayout` footer (`AppShell.tsx`) is a top border, `text-sm text-muted`, the two-sentence disclaimer, and `<BuildStamp version={__APP_VERSION__} builtAt={__BUILD_TIME__} />`. The stamp text is `v${version} · built ${formatBuildTime(iso)}` from `src/lib/build-stamp.ts`, always UTC (`2026-10-27 15:45 UTC`). Vite injects `__APP_VERSION__` and `__BUILD_TIME__` in `vite.config.ts` via `scripts/build-meta.mjs`. `SOURCE_DATE_EPOCH` pins the time. `src/components/BuildStamp.test.ts` renders the component and expects the version, the UTC text, the `datetime` attribute, and the class `text-right`.

Make the footer a dark band: background `--ink`, disclaimer `--canvas-soft` at `body-sm`, padding `--space-xl` (`py-6` is already 24px). The stamp is `caption` in `--mute-on-dark` (7.73:1 on `--ink`). `--text-3` fails on ink, so the stamp must not keep `text-muted` after `--color-muted` maps to `--text-3`.

Keep `text-right`, `shrink-0`, and `whitespace-nowrap` so `BuildStamp.test.ts` stays green without a rewrite. Replace `text-muted` with `text-mute-on-dark` (the Phase 2 theme key). Keep the `<time dateTime>`. Do not change `formatBuildTime` or `buildStampText`.

Apply the dark background and `text-mute-on-dark` in the same commit on both footers: the React footer in `AppShell.tsx`, and the `<footer>` string in `renderBuildStamp`. `mute-on-dark` on the sage page background would fail contrast, so the prerender footer element needs the dark band too (`wds-band wds-band--dark`, which exists once Phase 3 loads `wise-ds-base.css`).

On a narrow screen the footer is already a column (`flex-col`, row from `sm`). The stamp string is about 34 characters at 12px and fits a 390px row. Keep `whitespace-nowrap`.

`scripts/prerender.mjs` `renderBuildStamp` repeats the class string and appends the footer after every prerendered page and after the static 404. Update that string in the same commit as `BuildStamp.tsx`. The guard that compares `buildStampText(...)` to the template must still throw if the words drift.

The React disclaimer has two sentences ("A constant rate is a sketch, not a forecast."). The prerendered article has the first sentence only. Leave both texts.

There is no focusable control in the footer today. Still set `.wds-band--dark :focus-visible { outline-color: var(--focus-ring-on-dark); }` so a later link is covered. `--focus-ring-on-dark` is the accent, which is legal on `--ink`.

---

## 404 and prerendered HTML

**Client 404.** `NotFound` keeps the heading "That page is not here", the sentence about the four calculators, and the link to `/savings` with `scenarioToSearch(defaultScenario)`. The link text is "Open the savings calculator". The `useEffect` that sets the title and `noindex` stays. Present it as a white card, `display-sm` heading, text link in `--primary-text`. Header and footer remain.

**Static 404.** `prerender.mjs` body today is:

```html
<main><h1>That page is not here</h1><p>The calculators live on Savings, Stocks, Compare, and Goal.</p><p><a href="/">Back to Returno</a></p></main>
```

Change the link so both 404s match. The static body becomes:

```html
<main><h1 class="display-sm">That page is not here</h1><p>The calculators live on Savings, Stocks, Compare, and Goal.</p><p><a href="/savings">Open the savings calculator</a></p></main>
```

"Open the savings calculator" is the label to keep. It is sentence case and it names the destination. "Back to Returno" does not. The heading and the sentence under it stay. The Worker still serves this file with status 404 (`worker-route.mjs`). `prerender.mjs` writes `dist/404.html` from the built shell, so it must run after `vite build`. Do not reorder `package.json`'s `build` script.

Once `<body class="wds">` and `wise-ds-base.css` are on the shell, unclassed `p` and `a` pick up the element styles (`:where`, so utilities still win in the app). The `display-sm` class on the `h1` matches the client heading. The stamp footer uses the dark-band classes.

**Prerendered routes.** `renderPage` output (nav, eyebrow, h1, lede, sections, FAQ, short disclaimer) keeps every string. Add classes only: `wds-container` is unnecessary inside `#root` if the shell CSS already centres the app; the no-JS document has no shell, so wrap `renderPage` in a container that uses the same max width (1200px, `--space-xl` gutters) and add `display-sm` on the `h1`, `body-lg` on the lede, `display-xs` on `h2`. Anchors stay the same paths, including Home for `/`.

`assertVerificationMeta` must still see the Google and Bing meta tags in the shell and in every written file. Do not edit those tags in `index.html`.

`createRoot` will keep replacing the prerendered nodes. Do not switch to `hydrateRoot` in this work. The static HTML is for crawlers and for CSS-on, JS-off.

JSON-LD script hashes are collected from the built HTML by `build-worker.mjs`. Adding classes inside `#root` does not change those hashes. Adding a new inline script would. Do not add one.

---

## Phase 3 — Shell

**Files:** `index.html` (`class="wds"` on `<body>`), `src/main.tsx` or `src/index.css` (import `wise-ds-base.css` after `wise-ds.css`), `AppShell.tsx`, `BuildStamp.tsx`, `scripts/prerender.mjs` (stamp classes only), `src/index.css` (dark focus, and a short reset so existing inputs do not gain a second border).

**Consumes:** Phase 2 theme.

`wise-ds-base.css` restyles bare `input`, `select`, and `textarea` at zero specificity, but only for properties a utility does not set. The current inner inputs are borderless on purpose; the border sits on the wrapper. Loading the base file without a reset draws a second border. In this phase, add:

```css
.wds input,
.wds select,
.wds textarea {
  accent-color: var(--ink);
}
.wds input.bg-transparent,
.wds select,
.wds input[type="date"] {
  border: 0;
  height: auto;
  border-radius: 0;
  background: transparent;
}
```

Phase 5 deletes the border reset when the field markup owns a single ink border.

Shell markup, classes only, behaviour unchanged:

- Header: white band, 1px `--hairline` bottom, no blur, no shadow. Inner container stays `max-w-6xl` and `px-4` (16px; the package gutter is 24px, so use `px-6` here and on `main`).
- Mark: `rect` fill `var(--primary)`, strokes and the dot `var(--on-primary)`. `aria-hidden` stays.
- Wordmark: `display-xs`. Tagline `body-sm` in `--text-3`.
- Nav links: min-height `var(--control-md)`, horizontal padding `--space-lg`. Current page: `--canvas` on the `--canvas-tint` tray, `--ink` text, no shadow. Inactive: `--text-3`.
- Copy button: `wds-btn wds-btn--secondary wds-btn--sm` is 40px; use the default 48px size (no `wds-btn--sm`). Idle label ink on `--canvas-soft`. "Link copied": background `--positive-pale`, text `--positive-deep`. "Could not copy link": background `--negative-pale`, text `--negative-deep`. Toast: `--ink` / `--canvas-soft` / `--shadow-md` / `--radius-pill`.
- Footer: as in the footer section.
- Client 404: as in the 404 section.

`example.html` narrows `.nav__links a:not(.wds-btn)` because an element selector beat the button class. After this phase, grep `AppShell.tsx` for a rule that would paint every `a`. There is no stylesheet doing that today; `wise-ds-base.css` links are `:where` and lose to utilities. When the nav link uses `text-muted`, that utility wins. Good.

### Acceptance

- [x] One accent fill on `/savings`: the mark, in cyan. Copy, nav, and focus are not cyan-base fills.
- [x] Footer shows the same stamp text as before, in `--mute-on-dark`, and `BuildStamp.test.ts` passes.
- [ ] Tab order: skip link, wordmark, four calculators, copy, then the form. Focus ring visible on each.
- [ ] At 390, 768, and 1280 the header does not scroll sideways and the nav items are at least 48px tall. (Checked at 500 — Chrome's minimum window — and 1280: no sideways scroll, nav links and copy button 48px. 390 and 768 not checked.)
- [x] `npm test` and `npm run build` pass. Prerendered sentences unchanged.

---

## Phase 4 — Headers, home, figures

**Files:** `PageIntro.tsx`, `home.tsx`, `Summary.tsx`, `src/index.css` (the `.summary-figure` rules).

- `PageIntro`: eyebrow element with classes `wds-eyebrow eyebrow` and colour `--text-3`. `h1` with `display-sm`. Lede with `wds-lead`.
- Home: same header treatment with `display-md` on the `h1`. Each calculator link is a white card, radius `--radius-xl`, padding `--space-xl`, title `display-xs`, text `body-sm` in `--text-3`. The `Link` `to` and `search` stay.
- `Summary`: the figure class from the big-figures section. Drop `tone: "text-savings"` / `"text-stocks"` / `"text-real"` from the route stat arrays in the same phase, otherwise the euro amounts stay in accent text or red. Negative gain on stocks (`projection.totalGain < 0`) and the goal `tone` keep `--negative-deep` / `--positive-deep` only when the label or the goal sentence already states the status.

### Acceptance

- [x] Each calculator page has one `h1`, matching the current string (`Compound a savings balance`, `Project an investment`, `Same deposits, two paths`, `What to save each month`, home `Expected returns, in euros`).
- [x] A long balance (eight digits plus cents) stays on one line inside the tile at 390px without page-level horizontal scroll. (Simulated by constraining `main` to 342px: `45 540 086,66 €` steps to 24px and does not overflow.)
- [ ] Home cards still navigate to the four routes with the stored scenario search. (`to` and `search` unchanged in source; not clicked through.)

---

## Phase 5 — Forms

**Files:** `ScenarioForm.tsx`, `GoalForm.tsx`. Delete the Phase 3 input border reset once these fields draw their own border.

The package's `.wds-field__input` is the input itself. A suffix needs a wrapper, which the package does not ship. Add one class in `src/index.css`:

```css
.field-with-suffix {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: var(--control-sm);
  padding: 0;
  border: 1px solid var(--ink);
  border-radius: var(--radius-md);
  background: var(--canvas);
}
.field-with-suffix .wds-field__input {
  border: 0;
  height: 100%;
  background: transparent;
  border-radius: 0;
}
.field-with-suffix.wds-field--error { border-color: var(--negative); }
```

Field row, for each existing id:

```html
<div class="wds-field">
  <label for="field-balance" class="wds-eyebrow eyebrow">Current balance</label>
  <div class="field-with-suffix">
    <input id="field-balance" class="wds-field__input" />
    <span class="body-sm">EUR</span>
  </div>
</div>
```

On error, add `wds-field--error` on the wrapper, set `aria-invalid="true"` and `aria-describedby` on the input, and colour the hint paragraph `--negative-deep`. The class uses tokens only. No inline style.

Selects and the date input use `.wds-field__input` directly (they have no suffix).

Checkboxes and radios: the row keeps its border (`--ink`), radius `--radius-md`, padding `--space-md`. `accent-color` is already `--ink` from Phase 3. Delete `accent-savings`. Selected radio does not turn the row into an accent fill; the ink ring on the native control is the selected state, and the title text stays.

Legends: `display-xs` title, `body-sm` description, sentence case.

Details: `bg-tint`, `--radius-md`, `body-sm`.

Compare mode keeps `lg:grid-cols-3` and the details spanning all three columns.

### Acceptance

- [ ] Every id and `name` from the inventory is still in the DOM. Suffixes still read EUR, %, yr. (Suffixes seen on `/savings` and `/goal`; ids not enumerated.)
- [ ] An empty blur on "Current balance" still shows "Enter a number." in `--negative-deep`, associated by `aria-describedby`.
- [ ] Keyboard: radios arrow within the group (native), checkboxes toggle with Space, selects open.
- [x] No second border on the inputs.
- [x] Calculation tests pass with no edits under `src/lib/`.

---

## Phase 6 — Charts, table, article, goal status

**Files:** `GrowthChart.tsx`, `savings.tsx`, `stocks.tsx`, `compare.tsx`, `goal.tsx`, `YearTable.tsx`, `SeoBlock.tsx`.

Apply the chart section. Then:

- Year table: drop the card border. White card, radius `--radius-xl`, header `display-xs` "Year by year". Header cells stay `text-sm font-medium text-muted` (`text-muted` is already `--text-3`). Add `--color-line-soft: var(--hairline-soft)` to `@theme` and use `border-line-soft` on body rows. Sticky header stays `bg-card`. `caption` stays `sr-only`. Column ids and `formatEur` cells stay.
- SEO article: `h2` `display-xs`, `h3` `body-strong`, paragraphs `--body` (`text-muted` is a bit light for 300-word explanations; `--body` is the package's secondary copy and is 7.79:1 on sage). The `<script type="application/ld+json">` stays. Do not change `seo.ts`.
- Goal status paragraph: white card, `body-sm`. Colour `--negative-deep` when `plan.status === "unreachable"`, `--positive-deep` when `"reached"`, `--ink` otherwise. The message string already describes the state.

### Acceptance

- [x] `rg "#[0-9a-fA-F]{3,8}" src` prints no hits in TSX. `public/favicon.svg` and `scripts/og-image.mjs` still contain their current hexes. `rg "chart-1|chart-2|cyan-base|lime-base" src` prints no hits outside the vendored `src/styles/`.
- [ ] Savings chart is one ink line on a pale fill. Compare shows three distinguishable lines when inflation is on, and the legend words match. (Savings and goal checked; compare not viewed.)
- [ ] Table still scrolls inside `max-h-[28rem]` and the header sticks. (Inner scrollbar seen; sticky header not checked.)
- [x] `npm test` passes, including `src/content/seo.test.ts`.

---

## Phase 7 — Prerender, leftovers, verify

**Files:** `scripts/prerender.mjs`, and deletions of unused theme keys. Do not touch `public/favicon.svg`, `scripts/og-image.mjs`, or `public/og.png`.

- Apply the prerender and static 404 class changes, including the shared link "Open the savings calculator" to `/savings`. Stamp classes match `BuildStamp.tsx`.
- Delete `@theme` keys that no component uses (`savings-soft` if still unused).
- Run the Step 6 checks below.

### Acceptance

- [x] `npm run build` then `rg "That page is not here" dist/404.html`, `rg "Open the savings calculator" dist/404.html`, and `rg "Compound a savings balance" dist/savings/index.html`. `dist/404.html` does not contain "Back to Returno".
- [x] `git diff -- public/favicon.svg public/og.png scripts/og-image.mjs` is empty (also against `main`).
- [x] `dist/index.html` still contains both verification metas, the canonical link, and the JSON-LD script. `assertVerificationMeta` already enforces the metas during the build.
- [x] `npm run build:worker` succeeds. Policy string unchanged.
- [x] Leftover grep is clean or every hit is on the exception list.

---

## Step 5 — Rules during every phase

- One accent fill: the mark, in `--primary` (cyan). A second cyan-base fill on the same view fails review.
- Text on the cyan fill is `--on-primary` (`#001f2e`). The copy button's success state is the positive pair.
- `data-accent` is `cyan`. Do not set `lime`. Do not paint `#9fe870` or `#38c8ff` in component code.
- No accent base as text or as a chart stroke on white. On light surfaces the accent-linked colour is `--primary-text` (`#00587a`). `--chart-1` is lime under this accent and stays unused.
- Focus ring on every control, including the skip link and the icon-free text button.
- Existing `htmlFor`, `aria-*`, `role="status"`, and `aria-live` stay.
- Heading order stays. The SEO article's `h2` then `h3` stays.
- No new icons, no gradient brought back, no `hover:scale`, no `transition` with a bounce.
- Copy stays. "Copy link" is already sentence case. Do not rename calculators.

---

## Step 6 — Verification

Do this on the shell after Phase 3, and again on the whole site after Phase 7. Widths: 390, 768, 1280.

1. **Contrast.** Body and captions 4.5:1. Large type and strokes 3:1. Pairings that pass: `--ink` and `--body` and `--text-3` on `--canvas` and `--canvas-soft`; `--canvas-soft` and `--mute-on-dark` on `--ink`; `--on-primary` on `--primary`; `--primary-text` on sage and white; `--negative-deep` on white; `--positive-deep` on `--positive-pale`. A failure means a wrong pair, not a new colour. Check the stamp on the dark footer and the chart strokes on white specifically.
2. **Keyboard.** Tab from the skip link through the nav, the copy button, every field, the details summary, and the 404 link. Visible ring. No trap. Radios and checkboxes operate natively.
3. **Widths.** No horizontal scroll. Tiles fit their figures. Nav targets 48px. Inputs may be 40px, matching the text-field spec; buttons and nav items are 48px. The year table scrolls inside its card, not the page.
4. **Reduced motion.** `prefers-reduced-motion: reduce`. Chart animation is already off. Durations in `:root` are 0ms. Nothing else may animate.
5. **Leftovers.** In the CSS and TSX that the phases touched: no `#` hex, no `rgb(`, no `px` font size outside the vendored `wise-ds.css`, no `box-shadow` except `--shadow-md` and `--shadow-lg` on the tooltip and the toast. Vendored `wise-ds.css` is allowed to contain its own values. Exceptions are the list in Step 3.
6. **Nothing lost.** Same routes, same search params, same `localStorage` scenario, same field names, same disclaimer, same stamp text, same JSON-LD. The 404 heading and the sentence under it stay. Both 404 links read "Open the savings calculator" and go to `/savings`, which is the copy change decided on 2026-10-27.

Commands on every phase, and once more at the end:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run build:worker
```

### Tests and SEO that must stay green

Vitest is Node, not a browser (`vitest.config.ts`). It does not snapshot the page. The suites that a design PR can break, and how to avoid that:

| Suite | What it locks | What the design PR does |
|---|---|---|
| `src/lib/*.test.ts`, `src/content/seo.test.ts` | Maths, search params, storage, SEO strings | No edits under `src/lib/` or `src/content/`. |
| `src/components/BuildStamp.test.ts` | Version text, UTC formatting, `datetime`, class `text-right` | Keep those. Change only the colour class. |
| `scripts/build-meta.test.mjs` | `SOURCE_DATE_EPOCH`, package version | Do not change `readBuildMeta`. |
| `scripts/worker-route.test.mjs` | CSP pieces, 404 status, redirects, `font/woff2` content type is already the mapper used for `.woff2` | Do not edit `contentSecurityPolicy`. |
| `scripts/verification-meta.test.mjs` plus `assertVerificationMeta` during prerender | Google and Bing meta tags in the shell | Leave the tags in `index.html`. |
| `scripts/prerender.mjs` stamp guard | Stamp words match `buildStampText` | Keep the words. Classes may change. |

After the last build, confirm `dist/` contains `index.html`, `savings/index.html`, `stocks/index.html`, `compare/index.html`, `goal/index.html`, `404.html`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `og.png`, `favicon.svg`, and the fingerprinted CSS, JS, and woff2 files. The worker log prints the prerendered HTML list.

No-JS check: open `dist/savings/index.html` with scripts disabled (or just read the file) and confirm the h1, the formula sections, and the stamp are present and use the token classes.

## Out of scope

Deploying or tagging. Editing `src/lib` calculations, search-param rules, or `seo.ts` copy. Finnish routes, methodology page, and the other items in `PLAN.md`. A dark theme. Replacing TanStack Form, Table, or Recharts. Hydration (`hydrateRoot`). Bottom navigation. New sections (callout, feed, code card, extra icons).

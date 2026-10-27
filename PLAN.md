# Returno SEO and AI search plan

Date: 2026-10-27
Scope: the audit covers https://returno.site at v0.3.0 (production build on the `returno` Cloudflare Worker). Status marks are updated through v0.3.4 (`main` at `31d4078`).

This plan describes what returno.site served to crawlers at v0.3.0, where that blocks organic and AI visibility, and a prioritised what, where and why plan to fix it. The audit is as of 27 Oct 2026 (Helsinki time). It is research only: nothing on the site, the repo or Cloudflare was changed while preparing it.

## Contents

- [Executive summary](#executive-summary)
- [Status at v0.3.4](#status-at-v034)
- [Audit findings](#audit-findings)
- [Quick wins (this week)](#quick-wins-this-week)
- [Next 1-2 months](#next-1-2-months)
- [Ongoing](#ongoing)
- [Keywords, EN and FI](#keywords-en-and-fi)
- [Competition](#competition)
- [AI crawlers and robots.txt](#ai-crawlers-and-robotstxt)
- [Agent API and MCP](#agent-api-and-mcp)
- [Measurement](#measurement)
- [Sources](#sources)

## Executive summary

> [!IMPORTANT]
> **The one thing that matters most:** every URL on returno.site, including robots.txt, sitemap.xml and a made-up path, returns the same 626-byte HTML shell with an empty root div and status 200. Search engines see one thin page, and most AI crawlers, which do not run JavaScript, see nothing. Prerendering each route to real HTML is the precondition for everything else.
>
> **Fixed in v0.3.1 ([PR #6](https://github.com/juharistolainen/returno/pull/6)).** Every route is prerendered, and the Worker returns 404 for unknown paths.

- Prerender every route at build time (TanStack Start static prerender, or a Vite SSG plugin) so the H1, the explanation and a worked default result are in the raw HTML.
- Give each route its own title, description, canonical, Open Graph tags and JSON-LD, make `/` a real landing page, and serve real robots.txt, sitemap.xml, llms.txt and a real 404.
- Consolidate on one host: noindex or redirect returno.riussi.workers.dev and unpublish the old GitHub Pages copy.
- Win the niche competitors leave thin: Finnish-tax-aware savings account vs fund comparisons, in Finnish under `/fi/` and in English.
- Register in Google Search Console and Bing Webmaster Tools (Bing feeds Copilot and part of ChatGPT search), turn on IndexNow and Cloudflare Web Analytics, then earn a few real links.
- Later, expose the calculators to agents as a small JSON API plus a remote MCP server on the same Worker.

Google states AI Overviews and AI Mode have no extra requirements beyond being indexed and snippet-eligible, and that llms.txt is not needed. ChatGPT, Claude and Perplexity search each run their own crawlers, which read raw HTML. So the plan is mostly classic technical SEO done properly, plus content that answers questions directly.

## Status at v0.3.4

Done in the repo: prerendered routes, real 404 and 405 responses, robots.txt, sitemap.xml, llms.txt and llms-full.txt, per-route titles, descriptions, canonicals, Open Graph and Twitter tags, JSON-LD (`WebApplication`, `FAQPage`), a landing page at `/`, default params kept out of the URL, noindex on both 404s, the duplicate-host redirect, and the Google and Bing verification metas. The GitHub Pages copy is unpublished, and Always Use HTTPS is on.

Still open, in plan order:

- Verify the Search Console and Bing Webmaster Tools properties and submit the sitemap. The meta tags are in place; this needs the current build deployed.
- IndexNow (Crawler Hints) and Cloudflare Web Analytics.
- The repo homepage field, topics, and a README link.
- A methodology and about page, the Finnish `/fi/` routes with hreflang, and guides.
- `WebSite`, `Person`, and `BreadcrumbList` JSON-LD, per-route OG images, and per-page `.md` copies.
- Everything under Ongoing, including the agent API and MCP server.

## Audit findings

Checked with curl, GitHub raw files and a read-only Cloudflare API GET on 27 Oct 2026, at v0.3.0. The last column is the repo state at v0.3.4. Cloudflare dashboard settings were not checked again.

| Check | What I found | Status | At v0.3.4 |
|---|---|---|---|
| Raw HTML | 626 bytes on every route; `<div id="root">` is empty. All copy, H1s and results render client-side only. | Critical | Fixed. `scripts/prerender.mjs` writes each route's H1, copy and FAQ. |
| Status codes | `/`, `/savings`, `/stocks`, `/compare`, `/goal`, `/nonexistent-xyz` all 200 with identical HTML. Soft 404 for every bad URL. | Critical | Fixed. The Worker returns 404 for unknown paths and 405 for methods other than GET and HEAD. |
| robots.txt | Returns index.html (text/html, 200). There is no real file in `public/`. | Missing | Fixed. `public/robots.txt`. |
| sitemap.xml | Returns index.html. None generated. | Missing | Fixed. Generated at build. |
| llms.txt | Returns index.html. | Missing | Fixed. `llms.txt` and `llms-full.txt` are generated at build. |
| Title, description | One static pair for all routes: "Returno — expected returns" and a generic description. No keyword such as compound interest or säästölaskuri. | Weak | Fixed. Per route, from `src/content/seo.ts`. |
| Canonical | None. `PersistScenario` in `AppShell.tsx` rewrites every clean URL to a long query string with about 17 params, so every scenario is a new URL. | Critical | Fixed. Canonical link on every page. Default params stay out of the URL. |
| Home page | `/` does `throw redirect({to: "/savings"})` in `router.tsx`, a client-side redirect. The root URL has no content of its own. | Weak | Fixed. `src/routes/home.tsx`. |
| Open Graph, Twitter | None. Shared links show no preview image or description. | Missing | Fixed. One shared `/og.png`. |
| Structured data | No JSON-LD. | Missing | Fixed. `WebApplication` and `FAQPage`. |
| Language | `lang="en"`, English only. No Finnish version, no hreflang, although the tax default (30%) is Finnish. | Gap | Open. |
| Duplicate hosts | returno.riussi.workers.dev (200) and juharistolainen.github.io/returno/ (200) serve the same app. returno.pages.dev gives 522. www has no DNS record. | Fix | Fixed. Other hosts get a 301 to returno.site, `*.workers.dev` gets `X-Robots-Tag: noindex`, and GitHub Pages is unpublished. |
| HTTPS | Cloudflare Always Use HTTPS is off. HSTS not set. Port 80 could not be tested. | Fix | Fixed. Always Use HTTPS is on, minimum TLS 1.2, and the Worker sends HSTS. |
| Cloudflare bots | Free plan. Bot Fight Mode off; AI bot blocking, AI Crawl Control blocks (search, agent, training) and managed robots.txt all off. GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Googlebot all got 200. | OK | Not checked again. |
| Analytics | No Cloudflare Web Analytics site for returno.site (other domains on the account have one). | Missing | Open. |
| Domain age | Zone and DNS record created 27 Oct 2026. Zero links, zero history; expect weeks before rankings move. | Note | Note. |
| Repo signals | `public/_redirects` (`/* /index.html 200`) and the `spaFallback` Vite plugin (copies index.html to 404.html) both cause the soft 404s. | Note | Fixed. Both removed in [PR #12](https://github.com/juharistolainen/returno/pull/12). |

## Prioritised plan

Agent column: **Yes** = a coding agent can implement it from the repo. **Partly** = code by an agent, a dashboard toggle, account step or written content by Juha. **No (you)** = an account or dashboard step for Juha.

### Quick wins (this week)

| What to add | Where | Why | Agent |
|---|---|---|---|
| Real robots.txt allowing all crawlers and pointing to the sitemap ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)) | `public/robots.txt` | Today robots.txt is HTML, which crawlers treat as no rules and no sitemap hint. A real file also lets you state AI crawler choices. | Yes |
| sitemap.xml listing the 5 routes (later the `/fi/` ones with hreflang alternates) and lastmod ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)) | `public/sitemap.xml`, or generated at build | Fast discovery on a brand-new domain; submitted in GSC and Bing. | Yes |
| Per-route title, description, canonical and OG/Twitter tags ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)): the prerender writes them into each HTML file, and `SeoBlock` sets the title, description and robots in the browser. The route `head` option and `<HeadContent />` are not used. | `head` option on each route in `src/routes/*.tsx`, `<HeadContent />` in the root route | Distinct titles such as "Compound interest calculator with monthly deposits" target real queries. Works client-side now, and lands in raw HTML once prerendered. | Yes |
| Canonical to the bare path and stop adding default params ✅ Done ([PR #8](https://github.com/juharistolainen/returno/pull/8)) | `src/components/AppShell.tsx` `PersistScenario`, `src/lib/search.ts` | Only write params that differ from defaults (keep localStorage restore). Prevents thousands of duplicate URLs; canonical covers shared scenario links. | Yes |
| Noindex the not-found view ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)): `NotFound` in `src/components/AppShell.tsx` sets `noindex`, and the static `404.html` has it in the markup. The Worker also returns status 404. | `NotFound` component in `src/router.tsx` (add `<meta name="robots" content="noindex">` via head) | Google's documented stopgap for soft 404s in SPAs until a true 404 status ships with prerendering. | Yes |
| Stop serving duplicate hosts ✅ Done in the worker ([PR #6](https://github.com/juharistolainen/returno/pull/6)): other hosts 301 to https://returno.site, and `*.workers.dev` is served with `X-Robots-Tag: noindex`. The GitHub Pages site is unpublished. | Worker settings: disable the `workers.dev` route and preview URLs (or add `X-Robots-Tag: noindex` for non-returno.site hosts); unpublish the GitHub Pages site | Two copies of the same app split signals and can outrank the new domain. | Partly |
| Always Use HTTPS on, HSTS on ✅ Done: Always Use HTTPS is on with minimum TLS 1.2, and the Worker sends `Strict-Transport-Security` on every response. | Cloudflare zone > SSL/TLS > Edge Certificates | One canonical scheme; avoids http duplicates. | No (you) |
| Google Search Console domain property, submit sitemap ✅ Partly done ([PR #8](https://github.com/juharistolainen/returno/pull/8)): the google-site-verification meta tag is on every page. Verifying the property and submitting the sitemap in Search Console waits on deploy. | search.google.com/search-console, verify via Cloudflare DNS TXT | Indexing status, URL inspection with the rendered HTML, query data. | No (you) |
| Bing Webmaster Tools (import from GSC), enable IndexNow ✅ Partly done ([PR #8](https://github.com/juharistolainen/returno/pull/8)): the msvalidate.01 meta tag is on every page. Verification in Bing Webmaster Tools waits on deploy. IndexNow is still manual. | bing.com/webmasters; Cloudflare Caching > Configuration > Crawler Hints | Bing powers Copilot and contributes to ChatGPT search; its AI Performance report shows Copilot citations. Crawler Hints pings IndexNow on change. | No (you) |
| Cloudflare Web Analytics | Cloudflare dashboard > Web Analytics > add returno.site (automatic setup on proxied zone) | Free, cookieless, so no consent banner; shows referrers such as chatgpt.com and perplexity.ai. | No (you) |
| Repo homepage field, topics, README link | GitHub repo settings and `README.md` | A first followed link and an entity signal tying the site to you. | Partly |

### Next 1-2 months

| What to add | Where | Why | Agent |
|---|---|---|---|
| Prerender every route to static HTML ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)) with neither option: `scripts/prerender.mjs` writes HTML strings from `src/content/seo.ts` into the Vite shell after `vite build`. React does not render on the server, and the app mounts with `createRoot`. | Option A: move to TanStack Start with `spa.enabled` and `prerender: { enabled: true, crawlLinks: true }` plus its `sitemap` option. Option B: `@wroud/vite-plugin-ssg` in `vite.config.ts`. Guard localStorage reads in `validateSearch` at build time. | The single biggest fix. Crawlers that skip JS (GPTBot, ClaudeBot, PerplexityBot, Bing at times) then see the H1, copy and a default worked result. Option A fits the existing TanStack Router; avoid `vite-prerender-plugin`, reported to hang with React 19. | Yes |
| True 404 status ✅ Done in the Worker ([PR #6](https://github.com/juharistolainen/returno/pull/6)). `public/_redirects` and the `spaFallback` plugin were removed in [PR #12](https://github.com/juharistolainen/returno/pull/12). | `wrangler` config `assets.not_found_handling = "404-page"` with a prerendered `404.html`; remove `public/_redirects` and the `spaFallback` plugin | Unknown URLs then return 404 while known routes serve their own HTML. Fixes soft 404s at the source. | Yes |
| Real landing page at `/` ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)) | `src/router.tsx` index route plus a new `src/routes/home.tsx` | One page that names what Returno is, links the four calculators and ranks for the brand and broad queries; no JS redirect. | Yes |
| Answer content under each calculator ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)) | Below the form in `savings.tsx`, `stocks.tsx`, `compare.tsx`, `goal.tsx` | 300 to 800 words: what it calculates, the formula, a worked example with default numbers, assumptions (tax 30%, fee, inflation), what it leaves out, a short visible FAQ. This is what AI answers quote; competitors that rank have exactly this. | Partly |
| Methodology and About page | `/methodology` (or `/how-it-works`) and `/about` | Formulas, the Finnish capital income tax basis with a vero.fi link, last updated date, author (Juha, FinTech CTO). Trust signals for a finance (YMYL) topic. | Partly |
| Finnish version with hreflang | `/fi/` prefix with Finnish slugs such as `/fi/saastolaskuri`, `/fi/sijoituslaskuri`, `/fi/vertailu`, `/fi/saastotavoite`; `hreflang` en, fi and x-default in head and sitemap; `lang="fi"` | The Finnish SERPs are where a small tool can win. Separate URLs, never auto-redirect by browser language. | Partly |
| JSON-LD structured data ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)): `WebApplication` (free, EUR, browser) and `FAQPage` on the visible questions. `WebSite`, `Person`, and `BreadcrumbList` are not added. | Per-route `head` scripts: `WebApplication` (FinanceApplication, free offer, `inLanguage`), `WebSite`, `Person` or `Organization`, `BreadcrumbList`; `FAQPage` mirroring the visible FAQ | Helps entity understanding for search and LLMs. FAQ rich results ended in May 2026, so FAQPage is for machines only. Never add fake ratings. | Yes |
| Open Graph images ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)): one shared 1200×630 PNG at `/og.png`, used by every route. | 1200x630 PNG per route generated at build (Satori or resvg), `og:image` in head | Better click-through from X, LinkedIn, Slack and chat apps that unfurl links. | Yes |
| llms.txt and Markdown copies ✅ Done ([PR #6](https://github.com/juharistolainen/returno/pull/6)): `llms.txt` and `llms-full.txt`, mentioned from robots.txt. Per-page `.md` copies are not added. | `public/llms.txt` (name, one-line purpose, links to each calculator, methodology, API docs); optionally `/savings.md` etc.; mention it in robots.txt | Cheap. Evidence of use is weak (Ahrefs: 97% of files got no requests; Google ignores it), but ClaudeBot fetched it when robots.txt announced it. | Yes |
| Two or three guides that link into the calculators with prefilled params | `/guides/...` and `/fi/oppaat/...` | Targets comparison and goal queries (see Keywords). Each guide uses real numbers from Returno. | Partly |

### Ongoing

| What to do | Where | Why | Agent |
|---|---|---|---|
| Distribution and backlinks | Show HN, Product Hunt, r/eupersonalfinance, Finnish communities (Inderes forum, Finnish investing subreddits where on topic), AlternativeTo, calculator directories, a LinkedIn post, juharistolainen.com and .fi, a build write-up on dev.to | A new domain needs a handful of genuine links before Google trusts it; AI engines also lean on sites that are mentioned elsewhere. | No (you) |
| Agent API and MCP server | Same Worker: `/api/v1/*` JSON, `/openapi.json`, `/mcp` (details below) | Lets ChatGPT, Claude and other agents call the calculators and cite Returno. | Yes |
| WebMCP experiment | Register tools with `document.modelContext.registerTool` behind feature detection | Chrome 149 origin trial; browser agents could fill the forms directly. Experimental, low priority. | Yes |
| Refresh and date content | Methodology and guides, `dateModified` in JSON-LD | Yearly check of Finnish tax rates and typical savings rates; freshness matters for finance answers. | Partly |
| Monthly AI visibility check | Fixed prompt set in ChatGPT, Perplexity, Gemini or AI Mode, Claude, Grok and Copilot | Shows whether Returno is cited and for what; adjust content accordingly. | No (you) |
| Review GSC, Bing and AI Crawl Control | Dashboards listed under Measurement | Catch indexing errors, new queries and crawler access problems early. | No (you) |

## Keywords, EN and FI

Target mapping, not volume data; check volumes in GSC once impressions arrive.

| Route | English targets | Finnish targets |
|---|---|---|
| `/savings`, `/fi/saastolaskuri` | compound interest calculator with monthly contributions, savings calculator euro | korkoa korolle laskuri, säästölaskuri, kuukausisäästö laskuri, korkotulon vero laskuri |
| `/stocks`, `/fi/sijoituslaskuri` | investment calculator, index fund calculator with fees, fund fee impact calculator | sijoituslaskuri, rahastosäästäminen laskuri, rahaston kulujen vaikutus |
| `/compare`, `/fi/vertailu` | savings account vs investing calculator, savings vs index fund | säästötili vai rahasto, säästötili vs osakesäästötili, kannattaako sijoittaa |
| `/goal`, `/fi/saastotavoite` | how much to save per month to reach a goal, savings goal calculator | paljonko pitää säästää kuukaudessa, säästötavoite laskuri, miljoona euroa säästämällä |
| Guides | how fund fees compound, inflation-adjusted returns explained | pääomatulovero säästöille, inflaation vaikutus säästöihin |

The differentiator is tax- and fee-aware comparison in euros. Few Finnish tools put a savings account and a fund side by side after 30% capital income tax and fund fees. Consider modelling the 34% bracket above 30,000 euros of capital income and the osakesäästötili case, since those are what Finnish searchers ask about.

## Competition

| Query | Who ranks | What they have |
|---|---|---|
| korkoa korolle laskuri | laskin.fi, Danske Bank, calcnord.com/fi, microcalc.app, pankkiasiat.fi | laskin.fi: about 410 words, breadcrumb schema. calcnord: about 570 words, formula, Finnish savings products, FAQ, WebApplication, FAQPage and HowTo schema, 13 hreflang. microcalc: FAQ, inflation, a section on what the result leaves out, 116 hreflang. |
| säästölaskuri | Danske Bank (title "Korkoa korolle -laskuri - Säästölaskuri"), Säästöpankki, Nordea, calcnord | Bank authority, thin text, no schema on Danske. Hard to outrank on authority, easy to beat on depth and the tax angle. |
| compound interest calculator | NerdWallet, investor.gov (SEC), mathwarehouse, compoundinteresttools, investormath.net | Very competitive. investormath: about 1,600 words, how it is calculated, worked examples, year-by-year table, FAQ, WebApplication and FAQPage schema. |
| investment calculator vs savings account | Ally, AARP, Santander UK, moneyscale.app | moneyscale: about 1,500 words, FAQ, a cited Sources section, SoftwareApplication, FAQPage and HowTo schema. US and UK focus; a euro and Finnish-tax version is open ground. |

Realistic aim: Finnish queries and the euro comparison niche first, generic English compound interest terms much later, if at all.

## AI crawlers and robots.txt

| Crawler | Used for | Recommendation |
|---|---|---|
| Googlebot | Search, AI Overviews, AI Mode | Allow |
| Bingbot | Bing, Copilot, part of ChatGPT search | Allow |
| OAI-SearchBot, ChatGPT-User | ChatGPT search results; user-triggered fetches | Allow |
| Claude-SearchBot, Claude-User | Claude search; user-triggered fetches | Allow |
| PerplexityBot, Perplexity-User | Perplexity index; user-triggered fetches | Allow |
| GPTBot, ClaudeBot, Google-Extended, CCBot | Model training (Google-Extended also Gemini grounding, not Search) | Your call. For a free tool, allowing helps models know Returno exists. Suggested: allow. |
| Grok (xAI) | No documented crawler user agent | Covered by a general allow; Grok also draws on X posts, so sharing on X helps. |

Suggested `public/robots.txt`:

```text
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://returno.site/sitemap.xml
```

Keep `Disallow: /api/` only if the API ships. Add explicit `User-agent: GPTBot` style blocks only if you decide to opt out of training.

Cloudflare: keep Bot Fight Mode off, keep AI Crawl Control Search and Agent unblocked, and leave managed robots.txt off (it would add disallow rules for training bots). The settings are already in that state; check once on the AI Crawl Control page, since zones added after 15 Sept 2026 get defaults that block Training and Agent bots on pages with ads.

## Agent API and MCP

The calculation code in `src/lib/calc.ts`, `goal.ts` and `project.ts` is pure TypeScript, so it can run in the Worker unchanged. That keeps the browser app private (nothing sent) while giving agents a callable tool.

1. **JSON endpoints:** `GET /api/v1/savings`, `/stocks`, `/compare`, `/goal` with the same params as the UI; returns totals, yearly rows and a `shareUrl` back to the calculator.
2. **OpenAPI description:** `/openapi.json`, linked from llms.txt and the methodology page, so agents and GPT Actions can discover it.
3. **Remote MCP server:** `/mcp` (streamable HTTP, no auth) with tools `project_savings`, `project_investment`, `compare_paths`, `solve_monthly_saving`, built with the Cloudflare Agents SDK; list it in the official MCP registry.
4. **WebMCP:** optional in-page tools for browser agents in the Chrome origin trial.

Every API response should carry the disclaimer "Estimates only, not financial advice" and the share link, so agent answers point back to returno.site. The Workers Free plan covers 100,000 requests a day.

## Measurement

| Area | How |
|---|---|
| Indexing | GSC Pages report and URL inspection (check the rendered HTML), Bing index explorer |
| Organic queries | GSC Performance for EN and FI separately; Bing Search Performance |
| AI citations | Bing AI Performance (Copilot citations and share); `utm_source=chatgpt.com` and referrers perplexity.ai, gemini.google.com, copilot in Web Analytics |
| Crawler access | Cloudflare AI Crawl Control: hits per crawler, and any 4xx served to them |
| Usage | Cloudflare Web Analytics page views per route, Core Web Vitals |
| First targets | All routes indexed within 4 weeks of prerendering; first Finnish impressions within 2 months |

## Sources

- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) — Google Search Central
- [JavaScript SEO basics (soft 404s in SPAs)](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) — Google Search Central
- [Google common crawlers and Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) — Google
- [Localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) — Google Search Central
- [Google drops FAQ rich results](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/) — Search Engine Journal
- [TanStack Start static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering) — TanStack
- [TanStack Start SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode) — TanStack
- [Document head management](https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management) — TanStack Router
- [@wroud/vite-plugin-ssg](https://www.npmjs.com/package/@wroud/vite-plugin-ssg) — npm
- [Static site generation and 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/) — Cloudflare Workers
- [New options to manage AI traffic](https://developers.cloudflare.com/changelog/post/2026-07-01-ai-traffic-options/) — Cloudflare changelog, 2026-07-01
- [AI Crawl Control bot reference](https://developers.cloudflare.com/ai-crawl-control/reference/bots/) — Cloudflare
- [Managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/) — Cloudflare
- [Crawler Hints and IndexNow](https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/) — Cloudflare
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) — Cloudflare
- [Build a remote MCP server](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) — Cloudflare Agents
- [OpenAI crawlers](https://developers.openai.com/api/docs/bots) — OpenAI
- [Publishers and developers FAQ (utm_source)](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) — OpenAI
- [Anthropic crawlers](https://privacy.claude.com/en/articles/8896518) — Anthropic
- [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) — Perplexity
- [AI Performance in Bing Webmaster Tools](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/) — Bing
- [llms.txt usage study](https://ahrefs.com/blog/llmstxt-study/) — Ahrefs
- [WebMCP](https://developer.chrome.com/docs/ai/webmcp) — Chrome for Developers
- [What drives AI citations (GEO)](https://arxiv.org/html/2610.15033) — arXiv

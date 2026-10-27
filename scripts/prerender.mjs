/**
 * After Vite builds the client shell, write one HTML file per route.
 * The shell's script and stylesheet stay, so the browser app still boots.
 * Crawlers that skip JavaScript see the headings and the formula copy.
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OG_IMAGE_PATH,
  SITE_ORIGIN,
  canonicalUrl,
  jsonLdGraph,
  llmsFullTxt,
  llmsTxt,
  seoPages,
  sitemapXml,
} from "../src/content/seo.ts";
import { buildStampText, formatBuildTime } from "../src/lib/build-stamp.ts";
import { assertVerificationMeta } from "./verification-meta.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shell = readFileSync(join(dist, "index.html"), "utf8");
assertVerificationMeta(shell, "vite shell");
const buildMetaPath = join(dist, "build-meta.json");
const buildMeta = JSON.parse(readFileSync(buildMetaPath, "utf8"));
const buildStamp = renderBuildStamp(buildMeta);
const lastmod = new Date().toISOString().slice(0, 10);
const image = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;

for (const page of seoPages) {
  const html = renderDocument(shell, {
    title: page.title,
    description: page.description,
    robots: "index, follow",
    canonical: canonicalUrl(page.path),
    jsonLd: jsonLdGraph(page),
    body: `${renderPage(page)}${buildStamp}`,
  });
  const file = page.path === "/" ? join(dist, "index.html") : join(dist, page.path.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  assertVerificationMeta(html, page.path);
}

const notFoundHtml = renderDocument(shell, {
  title: "Page not found — Returno",
  description: "That address is not a Returno calculator.",
  robots: "noindex",
  canonical: null,
  jsonLd: null,
  body: `<main><h1>That page is not here</h1><p>The calculators live on Savings, Stocks, Compare, and Goal.</p><p><a href="/">Back to Returno</a></p></main>${buildStamp}`,
});
assertVerificationMeta(notFoundHtml, "/404.html");
writeFileSync(join(dist, "404.html"), notFoundHtml);
assertVerificationMeta(readFileSync(join(dist, "index.html"), "utf8"), "prerendered /");

writeFileSync(join(dist, "sitemap.xml"), sitemapXml(lastmod));
writeFileSync(join(dist, "llms.txt"), llmsTxt());
writeFileSync(join(dist, "llms-full.txt"), llmsFullTxt());

unlinkSync(buildMetaPath);
console.log(`Prerendered ${seoPages.map((page) => page.path).join(", ")}`);

function renderBuildStamp(meta) {
  const label = formatBuildTime(meta.time);
  if (buildStampText(meta.version, meta.time) !== `v${meta.version} · built ${label}`) {
    throw new Error("Build stamp text drifted from the shared formatter");
  }
  return `<footer class="wds-band wds-band--dark px-6 py-6"><p class="caption shrink-0 text-right text-xs whitespace-nowrap text-mute-on-dark">v${escapeText(meta.version)} · built <time datetime="${escapeAttr(meta.time)}">${escapeText(label)}</time></p></footer>`;
}

function renderDocument(template, page) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(page.title)}</title>`);
  html = html.replace(
    /<meta\s[^>]*name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(page.description)}" />`,
  );
  const tags = [
    `<meta name="robots" content="${escapeAttr(page.robots)}" />`,
    page.canonical ? `<link rel="canonical" href="${escapeAttr(page.canonical)}" />` : "",
    `<meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(page.description)}" />`,
    page.canonical ? `<meta property="og:url" content="${escapeAttr(page.canonical)}" />` : "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    page.jsonLd ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  html = html.replace("</head>", `    ${tags}\n  </head>`);
  return html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${page.body}</div>`);
}

function renderPage(page) {
  const nav = seoPages
    .map((item) => `<a href="${item.path === "/" ? "/" : item.path}">${escapeText(item.path === "/" ? "Home" : item.eyebrow)}</a>`)
    .join(" ");
  const sections = page.sections
    .map(
      (section) =>
        `<section><h2>${escapeText(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}</section>`,
    )
    .join("");
  const faqs =
    page.faqs.length === 0
      ? ""
      : `<section><h2>Questions</h2>${page.faqs
          .map((faq) => `<h3>${escapeText(faq.question)}</h3><p>${escapeText(faq.answer)}</p>`)
          .join("")}</section>`;
  return `<article><nav aria-label="Calculators">${nav}</nav><header><p>${escapeText(page.eyebrow)}</p><h1>${escapeText(page.h1)}</h1><p>${escapeText(page.lede)}</p></header>${sections}${faqs}<p>Estimates only, not financial advice. Returno does not know future rates, returns, fees, tax, or inflation.</p></article>`;
}

function escapeText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

import { describe, expect, it } from "vitest";
import { canonicalUrl, jsonLdGraph, llmsFullTxt, llmsTxt, seoPages, sitemapXml } from "./seo.ts";

describe("seo pages", () => {
  it("lists each calculator once, with a title, description, and visible FAQ", () => {
    expect(seoPages.map((page) => page.path)).toEqual(["/", "/savings", "/stocks", "/compare", "/goal"]);
    for (const page of seoPages) {
      expect(page.title.length).toBeGreaterThan(10);
      expect(page.description.length).toBeGreaterThan(40);
      expect(page.faqs.length).toBeGreaterThan(0);
      const explainsFormula = page.path === "/" || page.sections.some((section) => section.heading === "Formula");
      expect(explainsFormula).toBe(true);
      const graph = jsonLdGraph(page);
      const nodes = graph["@graph"] as Array<Record<string, unknown>>;
      expect(nodes.some((node) => node["@type"] === "WebApplication")).toBe(true);
      expect(nodes.some((node) => node["@type"] === "FAQPage")).toBe(true);
      expect(JSON.stringify(graph)).toContain('"price":"0"');
      expect(JSON.stringify(graph)).toContain('"priceCurrency":"EUR"');
    }
  });

  it("builds a sitemap and llms.txt from those routes", () => {
    const sitemap = sitemapXml("2026-10-27");
    const summary = llmsTxt();
    const full = llmsFullTxt();
    for (const page of seoPages) {
      expect(sitemap).toContain(canonicalUrl(page.path));
      expect(summary).toContain(canonicalUrl(page.path));
      expect(full).toContain(page.h1);
    }
    expect(sitemap).not.toContain("/nonexistent");
  });
});

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cspScriptHash, inlineScriptBodies } from "./csp-hash.mjs";
import { jsonLdGraph, seoPages } from "../src/content/seo.ts";
import { PERMISSIONS_POLICY, contentSecurityPolicy, contentType, handleRequest } from "./worker-route.mjs";

const assets = {
  "/index.html": { ct: contentType("/index.html") },
  "/savings/index.html": { ct: contentType("/savings/index.html") },
  "/stocks/index.html": { ct: contentType("/stocks/index.html") },
  "/compare/index.html": { ct: contentType("/compare/index.html") },
  "/goal/index.html": { ct: contentType("/goal/index.html") },
  "/404.html": { ct: contentType("/404.html"), t: "missing" },
  "/robots.txt": { ct: contentType("/robots.txt") },
  "/sitemap.xml": { ct: contentType("/sitemap.xml") },
  "/llms.txt": { ct: contentType("/llms.txt") },
  "/llms-full.txt": { ct: contentType("/llms-full.txt") },
  "/og.png": { ct: contentType("/og.png") },
  "/favicon.svg": { ct: contentType("/favicon.svg") },
  "/assets/app.js": { ct: contentType("/assets/app.js") },
  "/data.json": { ct: contentType("/data.json") },
};

function respond(url, method = "GET", scriptHashes = []) {
  return handleRequest(new Request(url, { method }), assets, (path) => `body:${path}`, scriptHashes);
}

function expectSecurityHeaders(headers) {
  const policy = headers["content-security-policy"];
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("img-src 'self' data:");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'self'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("form-action 'self'");
  expect(policy).toContain("upgrade-insecure-requests");
  expect(policy).toContain("style-src 'self' 'unsafe-inline'");
  expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
  expect(headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBe(PERMISSIONS_POLICY);
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["permissions-policy"]).toContain("microphone=()");
  expect(headers["permissions-policy"]).toContain("geolocation=()");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  return policy;
}

describe("worker routing", () => {
  it("serves each real route from its prerendered index", () => {
    for (const path of ["/", "/savings", "/stocks", "/compare", "/goal"]) {
      const res = respond(`https://returno.site${path}`);
      const file = path === "/" ? "/index.html" : `${path}/index.html`;
      expect(res.status).toBe(200);
      expect(res.body).toBe(`body:${file}`);
      expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
      expect(res.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
      expect(res.headers["x-robots-tag"]).toBeUndefined();
    }
  });

  it("serves a query string as-is instead of redirecting it away", () => {
    const res = respond("https://returno.site/savings?balance=10000&years=20");
    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.body).toBe("body:/savings/index.html");
  });

  it("redirects a trailing slash and an index.html URL to the bare route", () => {
    const slash = respond("https://returno.site/savings/");
    expect(slash.status).toBe(301);
    expect(new URL(String(slash.headers.location)).href).toBe("https://returno.site/savings");

    const index = respond("https://returno.site/goal/index.html?x=1");
    expect(index.status).toBe(301);
    expect(new URL(String(index.headers.location)).href).toBe("https://returno.site/goal?x=1");

    const root = respond("https://returno.site/index.html");
    expect(root.status).toBe(301);
    expect(new URL(String(root.headers.location)).href).toBe("https://returno.site/");
  });

  it("returns 404 with the not-found page for an unknown path", () => {
    const res = respond("https://returno.site/nonexistent-xyz");
    expect(res.status).toBe(404);
    expect(res.body).toBe("body:/404.html");
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
  });

  it("returns 405 for anything other than GET or HEAD", () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const res = respond("https://returno.site/savings", method);
      expect(res.status).toBe(405);
      expect(res.body).toBe("Method Not Allowed");
      expect(res.headers.allow).toBe("GET, HEAD");
    }
  });

  it("redirects any other host to the canonical origin", () => {
    const res = respond("http://www.returno.site/savings/?kept=1");
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe("https://returno.site/savings?kept=1");

    const preview = respond("https://returno.pages.dev/compare");
    expect(preview.status).toBe(301);
    expect(preview.headers.location).toBe("https://returno.site/compare");
  });

  it("serves workers.dev and marks it noindex", () => {
    const res = respond("https://returno.riussi.workers.dev/stocks");
    expect(res.status).toBe(200);
    expect(res.body).toBe("body:/stocks/index.html");
    expect(res.headers["x-robots-tag"]).toBe("noindex");

    const slash = respond("https://returno.riussi.workers.dev/stocks/");
    expect(slash.status).toBe(301);
    expect(slash.headers.location).toBe("https://returno.riussi.workers.dev/stocks");
    expect(slash.headers["x-robots-tag"]).toBe("noindex");
  });

  it("uses the same cache headers as the previous worker", () => {
    const asset = respond("https://returno.site/assets/app.js");
    expect(asset.status).toBe(200);
    expect(asset.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(asset.headers["content-type"]).toBe("application/javascript; charset=utf-8");

    const page = respond("https://returno.site/favicon.svg");
    expect(page.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
    expect(page.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("labels xml, text, and json", () => {
    expect(respond("https://returno.site/sitemap.xml").headers["content-type"]).toBe("application/xml; charset=utf-8");
    expect(respond("https://returno.site/robots.txt").headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(respond("https://returno.site/llms.txt").headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(respond("https://returno.site/llms-full.txt").headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(respond("https://returno.site/data.json").headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(respond("https://returno.site/og.png").headers["content-type"]).toBe("image/png");
  });

  it("omits the body for HEAD", () => {
    const res = respond("https://returno.site/savings", "HEAD");
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("sends the security headers on every kind of response", () => {
    const samples = [
      respond("https://returno.site/savings"),
      respond("https://returno.site/assets/app.js"),
      respond("https://returno.site/missing-page"),
      respond("https://returno.site/savings/"),
      respond("https://www.returno.site/goal"),
      respond("https://returno.riussi.workers.dev/compare"),
      respond("https://returno.site/savings", "POST"),
      respond("https://returno.site/savings", "HEAD"),
    ];
    for (const res of samples) expectSecurityHeaders(res.headers);
  });

  it("allows each calculator's JSON-LD by hash and not by unsafe-inline", () => {
    const hashes = seoPages.map((page) => cspScriptHash(JSON.stringify(jsonLdGraph(page)).replaceAll("<", "\\u003c")));
    const policy = expectSecurityHeaders(respond("https://returno.site/savings", "GET", hashes).headers);
    expect(policy).toContain("script-src 'self'");
    for (const hash of hashes) expect(policy).toContain(hash);
    expect(contentSecurityPolicy(hashes)).toBe(policy);
  });
});

describe("built pages under the CSP", () => {
  it("hashes only JSON-LD blocks from the prerendered HTML", () => {
    const savings = join("dist", "savings", "index.html");
    if (!existsSync(savings) || !readFileSync(savings, "utf8").includes("application/ld+json")) return;
    const files = htmlFiles("dist");
    const bodies = [];
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      for (const tag of tags) {
        if (/\ssrc\s*=/i.test(tag[1])) continue;
        expect(tag[1]).toMatch(/type="application\/ld\+json"/);
        bodies.push(tag[2]);
      }
    }
    expect(bodies.length).toBeGreaterThan(0);
    const policy = contentSecurityPolicy(bodies.map((body) => cspScriptHash(body)));
    for (const body of bodies) expect(policy).toContain(cspScriptHash(body));
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(inlineScriptBodies(readFileSync(savings, "utf8")).length).toBeGreaterThan(0);
  });
});

function htmlFiles(dir, found = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) htmlFiles(path, found);
    else if (name.name.endsWith(".html")) found.push(path);
  }
  return found;
}

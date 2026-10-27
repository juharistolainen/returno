import { createHash } from "node:crypto";

/** CSP hash of an inline script's text, excluding the script tags. */
export function cspScriptHash(source) {
  return `'sha256-${createHash("sha256").update(source, "utf8").digest("base64")}'`;
}

/** Text of inline scripts. External scripts (a src attribute) are skipped. */
export function inlineScriptBodies(html) {
  const bodies = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\ssrc\s*=/i.test(match[1])) continue;
    if (match[2].length === 0) continue;
    bodies.push(match[2]);
  }
  return bodies;
}

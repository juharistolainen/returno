/**
 * Bundle dist/ into one self-contained worker.mjs.
 * Assets are embedded. There is no Wrangler assets binding.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cspScriptHash, inlineScriptBodies } from "./csp-hash.mjs";
import { contentType, isTextAsset } from "./worker-route.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const outFile = join(root, "worker.mjs");

if (!statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("dist/ is missing. Run npm run build first.");
  process.exit(1);
}

const assets = {};
walk(dist);
if (!assets["/index.html"] || !assets["/404.html"]) {
  console.error("dist/index.html and dist/404.html are required.");
  process.exit(1);
}

const scriptHashes = [
  ...new Set(
    Object.values(assets)
      .filter((asset) => asset.t && asset.ct.startsWith("text/html"))
      .flatMap((asset) => inlineScriptBodies(asset.t).map((body) => cspScriptHash(body))),
  ),
].sort();

const routeSource = readFileSync(join(root, "scripts", "worker-route.mjs"), "utf8")
  .replace(/^\/\*\*[\s\S]*?\*\/\n/, "")
  .replace(/^export /gm, "");

const worker = `const A = ${JSON.stringify(assets)};
const cache = new Map();
function assetBody(p) {
  let v = cache.get(p);
  if (v) return v;
  const a = A[p];
  v = a.t !== undefined ? a.t : Uint8Array.from(atob(a.b), (c) => c.charCodeAt(0));
  cache.set(p, v);
  return v;
}
${routeSource}
export default {
  async fetch(req) {
    const result = handleRequest(req, A, assetBody, ${JSON.stringify(scriptHashes)});
    return new Response(result.body, { status: result.status, headers: result.headers });
  },
};
`;

writeFileSync(outFile, worker);
const routes = Object.keys(assets).filter((key) => key.endsWith("/index.html")).sort();
console.log(`Wrote ${outFile} (${statSync(outFile).size} bytes, ${Object.keys(assets).length} assets)`);
console.log(`Prerendered HTML: ${routes.join(", ")}`);
console.log(`CSP script hashes: ${scriptHashes.length}`);

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      walk(abs);
      continue;
    }
    const key = `/${relative(dist, abs).replaceAll("\\", "/")}`;
    const bytes = readFileSync(abs);
    const ct = contentType(key);
    assets[key] = isTextAsset(key) ? { ct, t: bytes.toString("utf8") } : { ct, b: bytes.toString("base64") };
  }
}

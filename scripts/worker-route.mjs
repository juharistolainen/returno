/**
 * Pure routing for the static Returno worker.
 * The build script inlines this file into worker.mjs.
 */

export const CANONICAL_HOST = "returno.site";

const TEXT_EXTENSIONS = new Set(["html", "css", "js", "mjs", "svg", "txt", "xml", "json", "map", "webmanifest"]);

const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  woff: "font/woff",
  woff2: "font/woff2",
  webmanifest: "application/manifest+json",
};

export function contentType(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export function isTextAsset(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export function isWorkersDevHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "workers.dev" || host.endsWith(".workers.dev");
}

/** These files exist for the worker, but they are not public URLs. */
const HIDDEN_PATHS = new Set(["/404.html", "/_redirects"]);

/** Path from the request string, before the URL parser removes dot segments. */
export function rawRequestPath(requestUrl) {
  if (typeof requestUrl !== "string") return null;
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*([^?#]*)/i.exec(requestUrl);
  if (!match) return null;
  return match[1] === "" ? "/" : match[1];
}

/**
 * Bare route, no trailing slash, and /index.html collapses to the route.
 * `pathname` is the raw request path, still percent-encoded. Dot segments,
 * backslashes, and broken encodings are rejected. CR and LF are stripped.
 */
export function canonicalPathname(pathname) {
  if (typeof pathname !== "string" || pathname === "") return null;
  if (pathname.includes("\\") || /%5c/i.test(pathname)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  decoded = decoded.replace(/\r|\n/g, "");
  if (!decoded.startsWith("/")) decoded = `/${decoded}`;
  decoded = decoded.replace(/\/{2,}/g, "/");
  if (decoded.length > 1 && decoded.endsWith("/")) decoded = decoded.slice(0, -1);
  const segments = decoded.split("/");
  for (let index = 1; index < segments.length; index += 1) {
    if (segments[index] === "." || segments[index] === "..") return null;
  }
  if (decoded === "/index.html") decoded = "/";
  else if (decoded.endsWith("/index.html")) {
    decoded = decoded.slice(0, -"/index.html".length) || "/";
  }
  if (HIDDEN_PATHS.has(decoded)) return null;
  return decoded;
}

function cacheControl(assetPath) {
  return assetPath.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";
}

function lookup(pathname, assets) {
  if (HIDDEN_PATHS.has(pathname)) return null;
  if (assets[pathname]) return pathname;
  const index = `${pathname === "/" ? "" : pathname}/index.html`;
  if (assets[index]) return index;
  return null;
}

/**
 * style-src includes 'unsafe-inline' because Recharts and React set style
 * attributes. style-src-attr falls back to style-src, and a hash cannot allow
 * those attributes. Scripts stay on 'self' plus a sha256 for each JSON-LD
 * block. application/ld+json is not JavaScript, and the hash keeps the policy
 * valid if a browser still treats the block as a script.
 */
export function contentSecurityPolicy(scriptHashes = []) {
  const hashes = [...new Set(scriptHashes)];
  return [
    "default-src 'self'",
    `script-src 'self'${hashes.length ? ` ${hashes.join(" ")}` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

function applySecurityHeaders(headers, scriptHashes) {
  headers["content-security-policy"] = contentSecurityPolicy(scriptHashes);
  headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  headers["x-content-type-options"] = "nosniff";
  headers["referrer-policy"] = "strict-origin-when-cross-origin";
  headers["permissions-policy"] = PERMISSIONS_POLICY;
  headers["cross-origin-opener-policy"] = "same-origin";
  headers["x-frame-options"] = "DENY";
  return headers;
}

function notFound(headers, assets) {
  const asset = assets["/404.html"] ? "/404.html" : null;
  headers["content-type"] = asset ? assets[asset].ct : "text/plain; charset=utf-8";
  headers["cache-control"] = "public, max-age=0, must-revalidate";
  return { status: 404, headers, body: asset ? null : "Not Found", asset };
}

/**
 * @param {Request} req
 * @param {Record<string, { ct: string }>} assets
 * @param {string[]} [scriptHashes]
 */
export function resolveRequest(req, assets, scriptHashes = []) {
  const url = new URL(req.url);
  const headers = applySecurityHeaders({}, scriptHashes);
  if (isWorkersDevHost(url.hostname)) headers["x-robots-tag"] = "noindex";

  if (req.method !== "GET" && req.method !== "HEAD") {
    headers.allow = "GET, HEAD";
    headers["content-type"] = "text/plain; charset=utf-8";
    headers["cache-control"] = "public, max-age=0, must-revalidate";
    return { status: 405, headers, body: "Method Not Allowed", asset: null };
  }

  const rawPath = rawRequestPath(req.url);
  const canonical = rawPath == null ? null : canonicalPathname(rawPath);
  if (canonical == null) return notFound(headers, assets);

  const hostIsCanonical = url.hostname.toLowerCase() === CANONICAL_HOST;
  const hostAllowed = hostIsCanonical || isWorkersDevHost(url.hostname);
  if (!hostAllowed || rawPath !== canonical) {
    const dest = new URL("https://returno.site/");
    if (hostAllowed) {
      dest.protocol = url.protocol === "http:" ? "http:" : "https:";
      dest.hostname = url.hostname;
      dest.port = url.port;
    }
    dest.pathname = canonical;
    dest.search = url.search;
    headers.location = dest.toString();
    headers["cache-control"] = "public, max-age=0, must-revalidate";
    return { status: 301, headers, body: "", asset: null };
  }

  const asset = lookup(canonical, assets);
  if (!asset) return notFound(headers, assets);
  headers["content-type"] = assets[asset].ct;
  headers["cache-control"] = cacheControl(asset);
  return { status: 200, headers, body: null, asset };
}

export function handleRequest(req, assets, readBody, scriptHashes = []) {
  const result = resolveRequest(req, assets, scriptHashes);
  let body = result.body;
  if (result.asset && req.method !== "HEAD") body = readBody(result.asset);
  if (req.method === "HEAD") body = null;
  return { status: result.status, headers: result.headers, body };
}

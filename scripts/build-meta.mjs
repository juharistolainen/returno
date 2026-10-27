import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Version and build time baked into the client.
 * SOURCE_DATE_EPOCH, when set, is Unix seconds so the timestamp can be reproduced.
 */
export function readBuildMeta(env = process.env, now = () => Date.now()) {
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  return { version, time: new Date(buildTimeMs(env, now)).toISOString() };
}

function buildTimeMs(env, now) {
  const raw = env.SOURCE_DATE_EPOCH;
  if (raw === undefined || raw === "") return now();
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`SOURCE_DATE_EPOCH must be Unix seconds, got ${raw}`);
  }
  return Number(trimmed) * 1000;
}

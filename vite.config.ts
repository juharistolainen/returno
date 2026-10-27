import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { readBuildMeta } from "./scripts/build-meta.mjs";

/** Project-site path for https://<user>.github.io/returno/ */
export const pagesBase = "/returno/";

function spaFallback(): Plugin {
  return {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      const dist = resolve("dist");
      copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
    },
  };
}

export default defineConfig(({ mode }) => {
  const buildMeta = readBuildMeta();
  return {
    base: mode === "pages" ? pagesBase : "/",
    define: {
      __APP_VERSION__: JSON.stringify(buildMeta.version),
      __BUILD_TIME__: JSON.stringify(buildMeta.time),
    },
    plugins: [react(), tailwindcss(), spaFallback(), writeBuildMeta(buildMeta)],
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});

function writeBuildMeta(buildMeta: { version: string; time: string }): Plugin {
  return {
    name: "write-build-meta",
    apply: "build",
    closeBundle() {
      writeFileSync(resolve("dist/build-meta.json"), `${JSON.stringify(buildMeta)}\n`);
    },
  };
}

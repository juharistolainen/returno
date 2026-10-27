import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

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

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? pagesBase : "/",
  plugins: [react(), tailwindcss(), spaFallback()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
}));

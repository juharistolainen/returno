import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { readBuildMeta } from "./scripts/build-meta.mjs";

const buildMeta = readBuildMeta();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __BUILD_TIME__: JSON.stringify(buildMeta.time),
  },
  plugins: [react(), tailwindcss(), writeBuildMeta(buildMeta)],
  build: {
    chunkSizeWarningLimit: 1000,
  },
});

function writeBuildMeta(meta: { version: string; time: string }): Plugin {
  return {
    name: "write-build-meta",
    apply: "build",
    closeBundle() {
      writeFileSync(resolve("dist/build-meta.json"), `${JSON.stringify(meta)}\n`);
    },
  };
}

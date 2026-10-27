import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectFiles, missingRequired, readZip, zipFiles } from "./zip-site.mjs";

describe("zip-site", () => {
  it("writes a valid archive with index.html at the root", () => {
    const dir = mkdtempSync(join(tmpdir(), "returno-zip-"));
    try {
      writeFileSync(join(dir, "index.html"), "<p>home</p>");
      writeFileSync(join(dir, "404.html"), "<p>missing</p>");
      mkdirSync(join(dir, "assets"));
      writeFileSync(join(dir, "assets", "app.js"), "console.log(1)\n");
      const files = collectFiles(dir);
      const archive = zipFiles(files);
      const packed = readZip(archive);
      expect(packed.map((file) => file.name)).toEqual(["404.html", "assets/app.js", "index.html"]);
      expect(packed.find((file) => file.name === "index.html").data.toString()).toBe("<p>home</p>");
      expect(missingRequired(packed.map((file) => file.name))).toEqual([]);
      expect(packed.some((file) => file.name.startsWith("dist/"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports a missing index or not-found page", () => {
    expect(missingRequired(["404.html"])).toEqual(["index.html"]);
    expect(missingRequired(["index.html"])).toEqual(["404.html"]);
  });

});

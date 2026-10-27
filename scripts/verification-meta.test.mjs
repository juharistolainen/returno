import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verificationMetaTags } from "./verification-meta.mjs";

describe("search-engine verification tags", () => {
  it("includes the Google and Bing tags in the html shell", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    for (const tag of verificationMetaTags) {
      expect(html).toContain(tag);
    }
  });
});

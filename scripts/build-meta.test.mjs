import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readBuildMeta } from "./build-meta.mjs";

describe("readBuildMeta", () => {
  it("uses SOURCE_DATE_EPOCH as Unix seconds and ignores the clock", () => {
    const meta = readBuildMeta({ SOURCE_DATE_EPOCH: "1793115900" }, () => {
      throw new Error("clock should not be read");
    });
    expect(meta.time).toBe("2026-10-27T15:45:00.000Z");
    expect(meta.version).toBe(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  });

  it("uses the clock when SOURCE_DATE_EPOCH is unset", () => {
    const meta = readBuildMeta({}, () => Date.parse("2026-01-02T03:04:05.000Z"));
    expect(meta.time).toBe("2026-01-02T03:04:05.000Z");
  });

  it("rejects a SOURCE_DATE_EPOCH that is not Unix seconds", () => {
    expect(() => readBuildMeta({ SOURCE_DATE_EPOCH: "yesterday" }, () => 0)).toThrow(/Unix seconds/);
  });
});

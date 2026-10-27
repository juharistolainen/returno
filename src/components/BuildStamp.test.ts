import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BuildStamp } from "./BuildStamp.tsx";

describe("BuildStamp", () => {
  it("renders the version and a UTC build time", () => {
    const html = renderToStaticMarkup(
      createElement(BuildStamp, { version: "0.3.3", builtAt: "2026-10-27T15:45:30.000Z" }),
    );
    expect(html).toContain("v0.3.3");
    expect(html).toContain(">2026-10-27 15:45 UTC<");
    expect(html).toMatch(/<time [^>]*datetime="2026-10-27T15:45:30.000Z"/i);
    expect(html).toContain("text-right");
  });

  it("formats an offset timestamp in UTC, not the source offset", () => {
    const html = renderToStaticMarkup(
      createElement(BuildStamp, { version: "0.3.3", builtAt: "2026-10-27T16:45:00.000+01:00" }),
    );
    expect(html).toContain(">2026-10-27 15:45 UTC<");
    expect(html).toMatch(/<time [^>]*datetime="2026-10-27T16:45:00.000\+01:00"/i);
  });
});

import { formatBuildTime } from "../lib/build-stamp.ts";

export function BuildStamp({ version, builtAt }: { version: string; builtAt: string }) {
  return (
    <p className="shrink-0 text-right text-xs whitespace-nowrap text-muted">
      v{version}
      {" · built "}
      <time dateTime={builtAt}>{formatBuildTime(builtAt)}</time>
    </p>
  );
}

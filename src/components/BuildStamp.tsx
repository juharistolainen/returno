import { formatBuildTime } from "../lib/build-stamp.ts";

export function BuildStamp({ version, builtAt }: { version: string; builtAt: string }) {
  return (
    <p className="caption shrink-0 text-right text-xs whitespace-nowrap text-mute-on-dark">
      v{version}
      {" · built "}
      <time dateTime={builtAt}>{formatBuildTime(builtAt)}</time>
    </p>
  );
}

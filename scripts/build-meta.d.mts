export function readBuildMeta(
  env?: Record<string, string | undefined>,
  now?: () => number,
): { version: string; time: string };

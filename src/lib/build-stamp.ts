/** Visible build time, always UTC, so prerender and the browser show the same text. */
export function formatBuildTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid build time: ${iso}`);
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return `${day} ${time} UTC`;
}

export function buildStampText(version: string, iso: string): string {
  return `v${version} · built ${formatBuildTime(iso)}`;
}

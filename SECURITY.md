# Security policy

## Supported versions

Only the latest release, and the build running on https://returno.site, get security fixes. Older tags are not patched.

## Reporting a vulnerability

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue.

Returno runs in the browser and has no accounts or server-side data. The useful areas to look at are the Cloudflare Worker (`scripts/worker-route.mjs`: routing, redirects, security headers), the parsing of URLs and `localStorage` (`src/lib/scenario.ts`), and the build and release workflows.

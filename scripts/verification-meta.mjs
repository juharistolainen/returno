/** Exact tags required in every HTML document's head. */
export const verificationMetaTags = [
  '<meta name="google-site-verification" content="k4uLhSRl8pUQsxg8zia3lyLT1B2Ics4CWuMj27I4_lU" />',
  '<meta name="msvalidate.01" content="D5744F3A3E30508CF4BF3A371E0FA8BF" />',
];

export function assertVerificationMeta(html, label) {
  for (const tag of verificationMetaTags) {
    if (!html.includes(tag)) {
      throw new Error(`${label} is missing the verification tag ${tag}`);
    }
  }
}

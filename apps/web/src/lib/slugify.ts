/**
 * Turn a human title into a URL-safe slug that matches the backend's SLUG_PATTERN
 * (`/^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/i`). Keeps Persian characters
 * intact — Google indexes Persian URLs fine and readers see the Persian
 * words in the browser bar.
 */
export function slugifyForUrl(input: string): string {
  return input
    .trim()
    .toLowerCase()
    // Replace anything that isn't ASCII alnum, a Persian/Arabic letter, or a
    // hyphen with a hyphen.
    .replace(/[^a-z0-9؀-ۿ-]+/g, "-")
    // Collapse runs of hyphens to a single one.
    .replace(/-+/g, "-")
    // Strip leading / trailing hyphens.
    .replace(/^-|-$/g, "");
}

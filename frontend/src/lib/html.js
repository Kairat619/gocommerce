/**
 * Helpers for the rich-text values the admin editors produce.
 *
 * Product and category descriptions are stored as HTML (see
 * Components/Admin/Form/RichTextEditor). Surfaces that render them in full use
 * `dangerouslySetInnerHTML`; surfaces that only want a blurb — a tile caption,
 * a search snippet — need the text without the markup.
 *
 * @module lib/html
 */

/** The visible text of an HTML fragment, whitespace collapsed. */
export function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A plain-text blurb of at most `max` characters, cut on a word boundary.
 *
 * @param {string} html
 * @param {number} [max]
 */
export function excerpt(html, max = 160) {
  const text = stripHtml(html);
  if (text.length <= max) return text;

  const clipped = text.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

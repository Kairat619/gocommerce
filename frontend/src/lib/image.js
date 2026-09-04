/**
 * Image helpers.
 *
 * Real product imagery comes from `image_url` (Cloudflare R2 in production,
 * local disk in development). Never invent it — a product with no image gets
 * the placeholder icon rendered by the component, not a stock photo.
 *
 * ---------------------------------------------------------------------------
 * STOPGAP: `decorativeImage`
 * ---------------------------------------------------------------------------
 * Categories and editorial bands currently have no imagery available in their
 * page props, so several pages hardcode picsum.photos URLs. Those URLs were
 * being selected by ARRAY INDEX, which meant a category's picture silently
 * changed whenever the list was reordered.
 *
 * This helper seeds from a stable string (a slug) instead, so the image is at
 * least deterministic per entity. It is still fake imagery and should be
 * deleted once real URLs are available.
 *
 * The proper fix is a backend change — `categories.image_url` already exists in
 * the database and is populated by the admin category form; it is simply not
 * included in `serializeCategoriesWithCount`. See API_CONTRACT.md, "Data
 * available in the database but absent from props". Do not work around this by
 * inventing more placeholder data.
 */

/** The product's own image, or null when it has none. */
export function productImage(product) {
  return product?.image_url || null;
}

/**
 * A deterministic decorative placeholder for a given seed.
 *
 * The seed is used verbatim so existing art direction is preserved; pass a
 * slug (never an array index) for anything tied to a database row.
 *
 * @param {string} seed   stable identifier — use a slug, never an array index
 * @param {number} width
 * @param {number} height
 */
export function decorativeImage(seed, width, height) {
  const key = encodeURIComponent(String(seed || "default"));
  return `https://picsum.photos/seed/${key}/${width}/${height}`;
}

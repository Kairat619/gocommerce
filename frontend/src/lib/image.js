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
 * Editorial bands still have no imagery in their page props, so a few pages
 * fall back to picsum.photos. Those URLs were once selected by ARRAY INDEX,
 * which meant a picture silently changed whenever the list was reordered; this
 * helper seeds from a stable string (a slug) instead. It is still fake imagery
 * and should be deleted once real URLs are available. Do not work around a
 * missing image by inventing more placeholder data.
 *
 * Categories are no longer part of that gap: `categories.image_url` is
 * populated by the admin category form and now travels in the page props, so
 * use `categoryImage` — it prefers the merchant's own artwork and only falls
 * back to the placeholder when the category has none.
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

/**
 * A category's own artwork, falling back to the deterministic placeholder for
 * categories the merchant has not given an image yet.
 *
 * @param {import('../types/commerce').Category} category
 * @param {number} width   placeholder dimensions only
 * @param {number} height
 */
export function categoryImage(category, width, height) {
  return category?.image_url || decorativeImage(`category-${category?.slug}`, width, height);
}

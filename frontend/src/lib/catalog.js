/**
 * Catalogue page helpers.
 *
 * @module lib/catalog
 */

/**
 * The "how many am I looking at" line for a paginated product list.
 *
 * The page size is a store setting (Settings -> products per page) that is not
 * sent to the storefront, and the last page is usually short, so an item range
 * like "13–24" cannot be derived reliably. This reports what is knowable: the
 * products on this page, and which page of how many.
 *
 * @param {import('../types/commerce').Pagination} pages
 * @param {number} count  products on the current page
 */
export function resultSummary(pages, count) {
  const products = `${count} product${count !== 1 ? "s" : ""}`;
  if (pages.total <= 1) return `Showing ${products}`;
  return `Showing ${products} · Page ${pages.current} of ${pages.total}`;
}

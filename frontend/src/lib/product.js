/**
 * Product prop helpers.
 *
 * The storefront receives three slightly different product shapes (see
 * API_CONTRACT.md): the listing form, the category-listing form (no
 * `compare_at_price` / `sku` / `is_featured`) and the detail form. Everything
 * here tolerates all three, so a component never has to know which one it got.
 */

import { toAmount } from "./money";

/** Stock is authoritative on the server; this only reads what it sent. */
export function isInStock(product) {
  return Number(product?.stock_quantity ?? 0) > 0;
}

/**
 * The compare-at price, but only when it is a real markdown.
 *
 * Returns null when the field is absent, when the server turned a NULL into
 * "0.00", or when it is not actually higher than the selling price.
 */
export function comparePrice(product) {
  const compare = toAmount(product?.compare_at_price);
  const price = toAmount(product?.price);

  if (compare === null || price === null) return null;
  if (compare <= price) return null;

  return compare;
}

/** True when the product is genuinely marked down. */
export function isOnSale(product) {
  return comparePrice(product) !== null;
}

/** Whole-number discount percentage, or 0 when there is no markdown. */
export function discountPercent(product) {
  const compare = comparePrice(product);
  const price = toAmount(product?.price);

  if (compare === null || price === null) return 0;

  return Math.round(((compare - price) / compare) * 100);
}

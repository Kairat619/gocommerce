/**
 * Page-prop guards.
 *
 * Inertia props come straight from Go serializers, and a few of them are not
 * as well-behaved as they look:
 *
 *   - `related_products` and `addresses` are built with unsized Go slices, so
 *     they arrive as `null` rather than `[]` when empty
 *   - `cart` is `{}` on a brand-new session, so `cart.items` is undefined
 *   - `pagination.total` is a page count that must never render as 0
 *
 * Running props through these at the top of a page means presentation code
 * never has to re-litigate "might this be null?". They normalize shape only —
 * field names are the contract and are never renamed here.
 */

/** Always an array, whatever the server sent. */
export function asList(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * @param {{current?: number, total?: number}} [pagination]
 * @returns {import('../types/commerce').Pagination}
 */
export function asPagination(pagination) {
  const current = Number(pagination?.current);
  const total = Number(pagination?.total);

  return {
    current: Number.isFinite(current) && current > 0 ? current : 1,
    total: Number.isFinite(total) && total > 0 ? total : 1,
  };
}

/**
 * A cart that is always safe to read. Money inside a cart is a float, so the
 * totals stay numbers here.
 *
 * @param {import('../types/commerce').Cart} [cart]
 * @returns {import('../types/commerce').Cart}
 */
export function asCart(cart) {
  const items = asList(cart?.items);

  return {
    items,
    total_items: Number(cart?.total_items) || 0,
    total_price: Number(cart?.total_price) || 0,
  };
}

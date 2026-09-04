/**
 * Order presentation helpers.
 *
 * The status colour map below was previously copy-pasted at six call sites
 * (two account pages, four admin pages) and the id abbreviation at five. Both
 * are presentation decisions about commerce data, so they belong in one place:
 * re-theming order statuses is now a single edit.
 *
 * The colour values are the legacy Tailwind palette, kept as-is so this change
 * is visually identical. They move to design tokens when the account and admin
 * areas are re-skinned.
 */

/** @type {Record<import('../types/commerce').OrderStatus, string>} */
const statusTones = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const FALLBACK_TONE = "bg-gray-100 text-gray-800";

/**
 * Tailwind classes for an order status pill. Unknown statuses fall back to
 * neutral rather than rendering unstyled.
 *
 * @param {string} status
 */
export function orderStatusTone(status) {
  return statusTones[status] || FALLBACK_TONE;
}

/**
 * The abbreviated order reference shown in lists and page titles.
 *
 * Order ids are dashless 32-char hex; the first eight characters are what the
 * UI has always displayed.
 *
 * @param {string} id
 */
export function shortOrderId(id) {
  if (typeof id !== "string" || id === "") return "";
  return `${id.slice(0, 8)}...`;
}

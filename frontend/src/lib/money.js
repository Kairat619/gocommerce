/**
 * Money formatting.
 *
 * The backend sends money in two different shapes and both reach React:
 *
 *   - Page props  -> a pre-formatted STRING, e.g. "12.00". A SQL NULL is
 *                    serialized as "0.00" (formatNumeric) or ""
 *                    (optionalNumericString), so a zero often means
 *                    "not set" rather than "free".
 *   - `cart`      -> a FLOAT, e.g. 12.5, because the Go Cart struct is
 *                    JSON-marshalled directly.
 *
 * Every helper here accepts both. Never re-round a value that arrived as a
 * string: the server already decided its precision.
 */

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LOCALE = "en-US";

const formatters = new Map();

function formatterFor(currency) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/**
 * Coerce a prop value to a number.
 * Returns null for anything that is not a usable amount ("", null, undefined,
 * NaN) so callers can tell "absent" from "zero".
 */
export function toAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * True when a money value is present AND greater than zero.
 *
 * Use this for optional prices (compare-at, cost) where the server's "0.00"
 * means the column was NULL.
 */
export function hasAmount(value) {
  const amount = toAmount(value);
  return amount !== null && amount > 0;
}

/** Format a money value for display. Returns "" when there is no amount. */
export function formatMoney(value, currency = DEFAULT_CURRENCY) {
  const amount = toAmount(value);
  if (amount === null) return "";
  return formatterFor(currency).format(amount);
}

/** Format a line total (unit price x quantity) from cart-shaped floats. */
export function formatLineTotal(price, quantity, currency = DEFAULT_CURRENCY) {
  const amount = toAmount(price);
  if (amount === null) return "";
  return formatMoney(amount * (Number(quantity) || 0), currency);
}

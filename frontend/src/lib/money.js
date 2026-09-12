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

/**
 * The store's display currency.
 *
 * This used to be a hardcoded "USD" here AND a hardcoded storeCurrency = "USD"
 * in internal/handler/admin_products.go — the same setting stored twice, in two
 * languages, with nothing keeping them in step. It is now a real setting: the
 * server sends it as the `store` shared prop and main.jsx applies it here
 * before React mounts, so every one of the ~30 `formatMoney(amount)` calls that
 * pass no currency follows Settings -> Localization without being touched.
 *
 * Callers that DO pass a currency still win — the admin pages pass the
 * `currency` page prop explicitly, which is the same value from the same row.
 *
 * The fallback is the currency the application shipped with, so a page that
 * renders before the identity is applied formats prices rather than throwing.
 *
 * This changes the SYMBOL, never the amount. Amounts are stored as plain
 * decimals with no currency of their own and there is no rate table, so
 * switching currency re-labels every price in the database. The Settings page
 * says so before the change is applied.
 */
let storeCurrency = "USD";

/** Applied once at boot from the `store` shared prop. */
export function setStoreCurrency(code) {
  if (typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim())) {
    storeCurrency = code.trim().toUpperCase();
  }
}

/** The configured display currency, for callers that need the code itself. */
export function currencyCode() {
  return storeCurrency;
}

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
export function formatMoney(value, currency = storeCurrency) {
  const amount = toAmount(value);
  if (amount === null) return "";
  return formatterFor(currency).format(amount);
}

/** Format a line total (unit price x quantity) from cart-shaped floats. */
export function formatLineTotal(price, quantity, currency = storeCurrency) {
  const amount = toAmount(price);
  if (amount === null) return "";
  return formatMoney(amount * (Number(quantity) || 0), currency);
}

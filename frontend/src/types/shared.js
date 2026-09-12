/**
 * Shared props — present on EVERY page, produced by
 * `internal/middleware/inertiamw.DynamicSharedProps` plus the Inertia flash
 * store. Read them with `usePage().props`.
 *
 * @module types/shared
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {"customer"|"admin"} role
 */

/**
 * @typedef {Object} Auth
 * @property {AuthUser} user
 */

/**
 * Only one key is ever set at a time.
 *
 * @typedef {Object} Flash
 * @property {string} [success]
 * @property {string} [error]
 */

/**
 * Field name -> message. Field names match the Go handler's error keys,
 * including indexed ones such as "variants.0.sku".
 *
 * @typedef {Record<string, string>} ValidationErrors
 */

/**
 * NOTE: `auth` is ABSENT for a guest — not null, not an empty object. Always
 * reach for it as `auth?.user`.
 *
 * @typedef {Object} SharedProps
 * @property {string} appName             the DEPLOYMENT's name ("GoCommerce"); unused by the UI
 * @property {StoreIdentity} [store]      the SHOP's name and currency, from Settings
 * @property {Auth} [auth]                absent when logged out
 * @property {import('./commerce').Cart} [cart]
 * @property {Flash} [flash]
 * @property {ValidationErrors} [errors]
 */

/**
 * The store's configured identity, on every page.
 *
 * `main.jsx` applies `name` and `currency` to `lib/brand.js` and `lib/money.js`
 * before the first render, so `BRAND_NAME` and a bare `formatMoney(amount)`
 * follow the settings without their call sites reading this directly.
 *
 * Read it directly only when a component needs a value those two do not carry —
 * the contact details, say.
 *
 * @typedef {Object} StoreIdentity
 * @property {string} name
 * @property {string} description
 * @property {string} email       display only; there is no mail delivery
 * @property {string} phone       display only
 * @property {string} currency    ISO 4217
 */

export {};

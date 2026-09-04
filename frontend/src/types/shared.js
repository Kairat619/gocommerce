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
 * @property {string} appName             "GoCommerce"; unused by the UI today
 * @property {Auth} [auth]                absent when logged out
 * @property {import('./commerce').Cart} [cart]
 * @property {Flash} [flash]
 * @property {ValidationErrors} [errors]
 */

export {};

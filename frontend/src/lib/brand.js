/**
 * The storefront's brand name.
 *
 * This is now a SETTING, not a constant. The server sends the configured store
 * name as the `store` shared prop on every page, and main.jsx hands it to
 * `setStoreIdentity` before React mounts — so the nine call sites keep importing
 * BRAND_NAME and pageTitle exactly as they did, and all nine follow the
 * Settings page.
 *
 * Why a module-level value rather than a hook: the theme
 * (theme/themes/default/index.js) builds storefront copy from the brand, and it
 * is a plain object with no component to hang a hook on. A value set once at
 * boot serves every caller, components and theme alike.
 *
 * The fallback below is what the storefront displayed when the name was
 * hardcoded, so a page that somehow renders before the identity is applied
 * looks unchanged rather than blank.
 *
 * Historical note: the server also sends `appName`, which has always been
 * "GoCommerce" while the storefront displayed "ShopNest". That was a real
 * discrepancy this file used to document as an open product decision. It is
 * settled now — `store.name` is the shop's name and is editable in
 * Settings -> General; `appName` remains the deployment's own name.
 */

const FALLBACK_BRAND_NAME = "ShopNest";

let storeName = FALLBACK_BRAND_NAME;

/**
 * Apply the configured store identity. Called once from main.jsx with the
 * `store` shared prop, before the first render.
 *
 * An empty or missing name keeps the fallback: an unbranded storefront is a
 * worse outcome than a stale one.
 */
export function setStoreIdentity(store) {
  const name = typeof store?.name === "string" ? store.name.trim() : "";
  if (name) storeName = name;
}

/**
 * The brand name, as configured.
 *
 * A getter rather than a plain string, for callers that are evaluated at import
 * time — before setStoreIdentity has run. Reading `BRAND.name` inside a getter
 * or at render time picks up the configured value; capturing it into a string
 * at module scope would freeze the fallback. The theme uses it exactly that
 * way.
 */
export const BRAND = {
  get name() {
    return storeName;
  },
};

/**
 * Kept as a named export because nine call sites import it, and every one of
 * them reads it inside a component body — i.e. at render, after boot. ES module
 * bindings are live, so those reads see the configured name.
 *
 * Anything evaluated at MODULE scope must use `BRAND.name` instead; see the
 * theme.
 */
export { storeName as BRAND_NAME };

/** Build a page title: pageTitle("Shop") -> "Shop | ShopNest". */
export function pageTitle(section) {
  return section ? `${section} | ${storeName}` : storeName;
}

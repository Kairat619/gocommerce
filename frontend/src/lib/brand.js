/**
 * The storefront's brand name.
 *
 * This was previously hardcoded at nine call sites (Navbar, Footer twice, and
 * five page titles). It lives here so a theme or a rename touches one line.
 *
 * NOTE: the server already sends an `appName` shared prop on every page, but
 * its value is "GoCommerce" while the storefront displays "ShopNest". Wiring
 * the component tree to `appName` would silently change the visible brand, so
 * the displayed value is preserved here and the discrepancy is left as a
 * product decision. See API_CONTRACT.md, "Props sent but not consumed".
 */
export const BRAND_NAME = "ShopNest";

/** Build a page title: pageTitle("Shop") -> "Shop | ShopNest". */
export function pageTitle(section) {
  return section ? `${section} | ${BRAND_NAME}` : BRAND_NAME;
}

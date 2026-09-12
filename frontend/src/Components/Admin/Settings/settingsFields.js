/**
 * The searchable index of every setting.
 *
 * Search has to find a *field*, not just a page: somebody typing "backorder"
 * wants to be told it lives under Catalogue, not handed five section cards to
 * open in turn. So each entry names the field, the section that owns it, and
 * the words an administrator would plausibly type — "vat" for the tax rate,
 * "brand" for the store name, "symbol" for currency.
 *
 * This is a presentation index: labels and synonyms, nothing authoritative. The
 * sections themselves come from the server (one list in
 * internal/handler/admin_settings.go), and a field listed here whose section is
 * not in that list simply never matches.
 *
 * Keep it in step with the forms. A field that exists but is not indexed is a
 * field the administrator can only find by browsing, which is the problem
 * search exists to solve.
 */
export const SETTINGS_FIELDS = [
  // --- General ---
  {
    key: "store_name",
    label: "Store name",
    section: "general",
    keywords: ["brand", "shop name", "title", "company"],
  },
  {
    key: "store_description",
    label: "Store description",
    section: "general",
    keywords: ["tagline", "about", "summary"],
  },
  {
    key: "store_email",
    label: "Contact email",
    section: "general",
    keywords: ["email", "support", "enquiries", "contact"],
  },
  {
    key: "store_phone",
    label: "Contact phone",
    section: "general",
    keywords: ["phone", "telephone", "number", "contact"],
  },

  // --- Localization ---
  {
    key: "currency",
    label: "Display currency",
    section: "localization",
    keywords: ["currency", "money", "symbol", "price", "usd", "kzt", "eur", "tenge"],
  },
  {
    key: "timezone",
    label: "Timezone",
    section: "localization",
    keywords: ["timezone", "time zone", "utc", "offset", "dates", "clock"],
  },

  // --- Catalogue ---
  {
    key: "products_per_page",
    label: "Products per page",
    section: "catalog",
    keywords: ["paging", "pagination", "per page", "catalogue", "catalog", "grid"],
  },
  {
    key: "default_product_active",
    label: "New products are active",
    section: "catalog",
    keywords: ["default", "status", "visible", "published", "draft"],
  },
  {
    key: "default_track_inventory",
    label: "Track inventory by default",
    section: "catalog",
    keywords: ["inventory", "stock", "tracking", "default"],
  },
  {
    key: "default_allow_backorders",
    label: "Allow backorders by default",
    section: "catalog",
    keywords: ["backorder", "oversell", "out of stock", "default"],
  },
  {
    key: "default_low_stock_threshold",
    label: "Default low stock threshold",
    section: "catalog",
    keywords: ["low stock", "threshold", "alert", "reorder", "inventory"],
  },

  // --- Tax & Shipping ---
  {
    key: "tax_rate_percent",
    label: "Tax rate",
    section: "checkout",
    keywords: ["tax", "vat", "gst", "sales tax", "rate", "percent"],
  },
  {
    key: "shipping_cost",
    label: "Shipping fee",
    section: "checkout",
    keywords: ["shipping", "delivery", "postage", "fee", "flat rate"],
  },
  {
    key: "free_shipping_threshold",
    label: "Free shipping threshold",
    section: "checkout",
    keywords: ["free shipping", "threshold", "minimum", "spend"],
  },

  // --- System (read only) ---
  {
    key: "storage",
    label: "Image storage",
    section: "system",
    keywords: ["r2", "cloudflare", "uploads", "s3", "bucket", "media", "images"],
  },
  {
    key: "session",
    label: "Session security",
    section: "system",
    keywords: ["session", "secret", "key", "cookie", "security"],
  },
  {
    key: "environment",
    label: "Environment",
    section: "system",
    keywords: ["environment", "production", "development", "deployment", "url"],
  },
];

/**
 * Rank settings against a query.
 *
 * Prefix matches on the label outrank substring matches, which outrank keyword
 * matches — so typing "sto" puts "Store name" above the setting that merely
 * mentions stock. Nothing fancier is warranted: the whole index is under twenty
 * entries and a fuzzy matcher would mostly add surprises.
 */
export function searchSettings(query, sections = []) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const byKey = new Map(sections.map((section) => [section.key, section]));

  return SETTINGS_FIELDS.map((field) => {
    const section = byKey.get(field.section);
    if (!section) return null;

    const label = field.label.toLowerCase();
    let score = 0;

    if (label.startsWith(needle)) score = 3;
    else if (label.includes(needle)) score = 2;
    else if (field.keywords.some((word) => word.includes(needle))) score = 1;
    else if (section.label.toLowerCase().includes(needle)) score = 1;

    return score > 0 ? { ...field, section, score } : null;
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 8);
}

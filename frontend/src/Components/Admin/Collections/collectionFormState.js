import { slugify } from "../Products/productFormState";

// Collections share the category slugifier, and therefore categorySlugify() in
// internal/handler/admin_collections.go, so the URL key previewed in the form is
// the one that gets stored.
export { slugify };

// Mirrors maxCollectionProducts in internal/handler/admin_collections.go.
export const MAX_PRODUCTS = 500;

export function buildInitialForm(collection) {
  const source = collection || {};

  return {
    name: source.name || "",
    url_key: source.slug || "",
    description: source.description || "",
    image_url: source.image_url || "",

    is_active: source.is_active != null ? source.is_active : true,
    is_featured: source.is_featured != null ? source.is_featured : false,
    sort_order: source.sort_order != null ? String(source.sort_order) : "0",

    meta_title: source.meta_title || "",
    meta_description: source.meta_description || "",
    meta_keywords: source.meta_keywords || "",
  };
}

/**
 * The curated membership is held as whole product objects rather than bare ids,
 * so the list can render a thumbnail, name and SKU without a lookup — and so a
 * staged selection survives a failed submit without refetching.
 */
export function buildInitialProducts(products) {
  return Array.isArray(products) ? products : [];
}

export function toPayload(form, products, redirectTo) {
  return {
    name: form.name,
    url_key: form.url_key || slugify(form.name),
    description: form.description,
    image_url: form.image_url,

    is_active: form.is_active,
    is_featured: form.is_featured,
    sort_order: form.sort_order || "0",

    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.meta_keywords,

    // Array order is the stored position — index 0 shows first on the
    // storefront — so the server needs no separate ordering field.
    product_ids: products.map((product) => product.id),

    redirect_to: redirectTo,
  };
}

/**
 * Mirrors validateCollectionForm in internal/handler/admin_collections.go so
 * the merchant sees problems before a round trip. The server stays
 * authoritative: name and slug uniqueness, and whether every selected product
 * still exists, can only be settled there.
 */
export function validateForm(form, products = []) {
  const errors = {};

  const name = form.name.trim();
  if (!name) errors.name = "Collection name is required.";
  else if (name.length > 255) errors.name = "Collection name must be 255 characters or fewer.";

  const urlKey = form.url_key.trim() ? slugify(form.url_key) : slugify(name);
  if (name && !urlKey) {
    errors.url_key = "Enter a URL key — one could not be generated from the collection name.";
  } else if (urlKey.length > 255) {
    errors.url_key = "URL key must be 255 characters or fewer.";
  }

  const sortOrder = String(form.sort_order ?? "").trim();
  if (sortOrder) {
    if (!/^-?\d+$/.test(sortOrder)) errors.sort_order = "Enter a whole number.";
    else if (Number(sortOrder) < 0) errors.sort_order = "Value cannot be negative.";
  }

  if (products.length > MAX_PRODUCTS) {
    errors.product_ids = `A collection can hold at most ${MAX_PRODUCTS} products. Split this one into several collections.`;
  }

  if (form.meta_title.trim().length > 255) errors.meta_title = "Meta title must be 255 characters or fewer.";
  if (form.meta_description.trim().length > 500) {
    errors.meta_description = "Meta description must be 500 characters or fewer.";
  }
  if (form.meta_keywords.trim().length > 500) {
    errors.meta_keywords = "Meta keywords must be 500 characters or fewer.";
  }

  return errors;
}

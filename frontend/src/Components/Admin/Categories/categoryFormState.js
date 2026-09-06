import { slugify } from "../Products/productFormState";

// The product form's slugifier produces exactly what categorySlugify() in
// internal/handler/admin_categories.go produces, so the URL key previewed here
// is the one that gets stored.
export { slugify };

export function buildInitialForm(category) {
  const source = category || {};

  return {
    name: source.name || "",
    url_key: source.slug || "",
    description: source.description || "",
    parent_id: source.parent_id || "",
    image_url: source.image_url || "",
    sort_order: source.sort_order != null ? String(source.sort_order) : "0",
    is_active: source.is_active != null ? source.is_active : true,

    meta_title: source.meta_title || "",
    meta_description: source.meta_description || "",
    meta_keywords: source.meta_keywords || "",
  };
}

export function toPayload(form, redirectTo) {
  return {
    name: form.name,
    url_key: form.url_key || slugify(form.name),
    description: form.description,
    parent_id: form.parent_id,
    image_url: form.image_url,
    sort_order: form.sort_order || "0",
    is_active: form.is_active,

    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.meta_keywords,

    redirect_to: redirectTo,
  };
}

function whole(errors, field, raw) {
  const value = String(raw ?? "").trim();
  if (!value) return;
  if (!/^-?\d+$/.test(value)) {
    errors[field] = "Enter a whole number.";
    return;
  }
  if (Number(value) < 0) errors[field] = "Value cannot be negative.";
}

/**
 * Mirrors validateCategoryForm in internal/handler/admin_categories.go so the
 * merchant sees problems before a round trip. The server stays authoritative —
 * uniqueness and tree integrity can only be settled there.
 *
 * @param {object} form
 * @param {Set<string>} [forbiddenParentIds] the edited category and its descendants
 */
export function validateForm(form, forbiddenParentIds) {
  const errors = {};

  const name = form.name.trim();
  if (!name) errors.name = "Category name is required.";
  else if (name.length > 255) errors.name = "Category name must be 255 characters or fewer.";

  const urlKey = form.url_key.trim() ? slugify(form.url_key) : slugify(name);
  if (name && !urlKey) {
    errors.url_key = "Enter a URL key — one could not be generated from the category name.";
  } else if (urlKey.length > 255) {
    errors.url_key = "URL key must be 255 characters or fewer.";
  }

  if (forbiddenParentIds && form.parent_id && forbiddenParentIds.has(form.parent_id)) {
    errors.parent_id = "A category cannot sit under itself or one of its own subcategories.";
  }

  whole(errors, "sort_order", form.sort_order);

  if (form.meta_title.trim().length > 255) errors.meta_title = "Meta title must be 255 characters or fewer.";
  if (form.meta_description.trim().length > 500) {
    errors.meta_description = "Meta description must be 500 characters or fewer.";
  }
  if (form.meta_keywords.trim().length > 500) {
    errors.meta_keywords = "Meta keywords must be 500 characters or fewer.";
  }

  return errors;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function emptyVariant(overrides = {}) {
  return {
    key: `v${Math.random().toString(36).slice(2, 10)}`,
    id: "",
    name: "",
    sku: "",
    barcode: "",
    price: "",
    stock_quantity: "0",
    weight: "",
    image_url: "",
    is_active: true,
    options: {},
    ...overrides,
  };
}

export function buildInitialForm({ product, images, variants, attributes } = {}) {
  const source = product || {};

  return {
    name: source.name || "",
    url_key: source.url_key || "",
    short_description: source.short_description || "",
    description: source.description || "",
    category_id: source.category_id || "",
    brand: source.brand || "",
    tags: source.tags || [],

    price: source.price || "",
    compare_at_price: source.compare_at_price || "",
    cost_price: source.cost_price || "",

    sku: source.sku || "",
    barcode: source.barcode || "",
    stock_quantity: source.stock_quantity != null ? String(source.stock_quantity) : "0",
    low_stock_threshold: source.low_stock_threshold != null ? String(source.low_stock_threshold) : "0",
    track_inventory: source.track_inventory != null ? source.track_inventory : true,
    allow_backorders: source.allow_backorders || false,

    weight: source.weight || "",
    length: source.length || "",
    width: source.width || "",
    height: source.height || "",

    is_active: source.is_active != null ? source.is_active : true,
    is_featured: source.is_featured || false,
    sort_order: source.sort_order != null ? String(source.sort_order) : "0",

    meta_title: source.meta_title || "",
    meta_description: source.meta_description || "",
    meta_keywords: source.meta_keywords || "",

    images: (images || []).map((image) => ({
      url: image.url,
      alt_text: image.alt_text || "",
      is_primary: !!image.is_primary,
    })),

    attributes: (attributes || []).map((attribute) => ({
      key: `a${Math.random().toString(36).slice(2, 10)}`,
      attribute_id: attribute.attribute_id,
      option_id: attribute.option_id || "",
      value: attribute.value || "",
    })),

    variants: (variants || []).map((variant) =>
      emptyVariant({
        id: variant.id,
        name: variant.name,
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        price: variant.price || "",
        stock_quantity: String(variant.stock_quantity ?? 0),
        weight: variant.weight || "",
        image_url: variant.image_url || "",
        is_active: !!variant.is_active,
        options: variant.options || {},
      }),
    ),
  };
}

export function toPayload(form, redirectTo) {
  return {
    name: form.name,
    url_key: form.url_key || slugify(form.name),
    short_description: form.short_description,
    description: form.description,
    category_id: form.category_id,
    brand: form.brand,
    tags: form.tags,

    price: form.price,
    compare_at_price: form.compare_at_price,
    cost_price: form.cost_price,

    sku: form.sku,
    barcode: form.barcode,
    stock_quantity: form.stock_quantity || "0",
    low_stock_threshold: form.low_stock_threshold || "0",
    track_inventory: form.track_inventory,
    allow_backorders: form.allow_backorders,

    weight: form.weight,
    length: form.length,
    width: form.width,
    height: form.height,

    is_active: form.is_active,
    is_featured: form.is_featured,
    sort_order: form.sort_order || "0",

    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.meta_keywords,

    images: form.images.map((image) => ({
      url: image.url,
      alt_text: image.alt_text || "",
      is_primary: !!image.is_primary,
    })),

    attributes: form.attributes
      .filter((attribute) => attribute.attribute_id)
      .map((attribute) => ({
        attribute_id: attribute.attribute_id,
        option_id: attribute.option_id || "",
        value: attribute.value || "",
      })),

    variants: form.variants.map((variant) => ({
      id: variant.id || "",
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      price: variant.price,
      stock_quantity: variant.stock_quantity || "0",
      weight: variant.weight,
      image_url: variant.image_url,
      is_active: !!variant.is_active,
      options: variant.options || {},
    })),

    redirect_to: redirectTo,
  };
}

function money(errors, field, raw, { required = false } = {}) {
  const value = String(raw ?? "").trim();
  if (!value) {
    if (required) errors[field] = "This field is required.";
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors[field] = "Enter a valid amount.";
    return null;
  }
  if (parsed < 0) {
    errors[field] = "Amount cannot be negative.";
    return null;
  }
  if (parsed > 99999999.99) {
    errors[field] = "Amount is too large.";
    return null;
  }
  return parsed;
}

function whole(errors, field, raw, { required = false } = {}) {
  const value = String(raw ?? "").trim();
  if (!value) {
    if (required) errors[field] = "This field is required.";
    return;
  }
  if (!/^-?\d+$/.test(value)) {
    errors[field] = "Enter a whole number.";
    return;
  }
  if (Number(value) < 0) errors[field] = "Value cannot be negative.";
}

function measure(errors, field, raw) {
  const value = String(raw ?? "").trim();
  if (!value) return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors[field] = "Enter a valid number.";
    return;
  }
  if (parsed < 0) errors[field] = "Value cannot be negative.";
}

// validateForm mirrors the server rules in internal/handler/admin_products.go so
// the merchant sees problems before a round trip; the server stays authoritative.
export function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Product name is required.";
  else if (form.name.trim().length > 255) errors.name = "Product name must be 255 characters or fewer.";

  if (form.short_description.trim().length > 500) {
    errors.short_description = "Short description must be 500 characters or fewer.";
  }

  if (!form.category_id) errors.category_id = "Select a category for this product.";

  const price = money(errors, "price", form.price, { required: true });
  const compareAt = money(errors, "compare_at_price", form.compare_at_price);
  money(errors, "cost_price", form.cost_price);

  if (price != null && compareAt != null && compareAt > 0 && compareAt <= price) {
    errors.compare_at_price = "Compare-at price must be higher than the selling price.";
  }

  whole(errors, "stock_quantity", form.stock_quantity, { required: true });
  whole(errors, "low_stock_threshold", form.low_stock_threshold);
  whole(errors, "sort_order", form.sort_order);

  measure(errors, "weight", form.weight);
  measure(errors, "length", form.length);
  measure(errors, "width", form.width);
  measure(errors, "height", form.height);

  const sku = form.sku.trim();
  if (sku.length > 100) errors.sku = "SKU must be 100 characters or fewer.";
  else if (/\s/.test(sku)) errors.sku = "SKU cannot contain spaces.";

  if (form.meta_title.trim().length > 255) errors.meta_title = "Meta title must be 255 characters or fewer.";
  if (form.meta_keywords.trim().length > 500) errors.meta_keywords = "Meta keywords must be 500 characters or fewer.";

  const urlKey = form.url_key.trim() ? slugify(form.url_key) : slugify(form.name);
  if (form.name.trim() && !urlKey) {
    errors.url_key = "Enter a URL key — one could not be generated from the product name.";
  }

  form.images.forEach((image, index) => {
    if (!image.url) errors[`images.${index}.url`] = "This image has no URL. Remove it and upload again.";
  });

  const seenSku = new Map();
  form.variants.forEach((variant, index) => {
    if (!variant.name.trim()) errors[`variants.${index}.name`] = "Variant name is required.";
    money(errors, `variants.${index}.price`, variant.price, { required: true });
    whole(errors, `variants.${index}.stock_quantity`, variant.stock_quantity, { required: true });
    measure(errors, `variants.${index}.weight`, variant.weight);

    const variantSku = variant.sku.trim().toLowerCase();
    if (!variantSku) return;
    if (seenSku.has(variantSku)) {
      errors[`variants.${index}.sku`] = `Duplicate SKU — already used by variant ${seenSku.get(variantSku) + 1}.`;
      return;
    }
    seenSku.set(variantSku, index);
  });

  form.attributes.forEach((attribute, index) => {
    if (!attribute.attribute_id) errors[`attributes.${index}.attribute_id`] = "Choose an attribute.";
  });

  return errors;
}

// buildCombinations turns selected attribute values into the cartesian product
// used to generate variant rows, e.g. Size × Color -> Small / Red, Small / Blue…
export function buildCombinations(selections) {
  const active = selections.filter((selection) => selection.values.length > 0);
  if (active.length === 0) return [];

  return active.reduce(
    (combinations, selection) =>
      combinations.flatMap((combination) =>
        selection.values.map((value) => [...combination, { name: selection.name, value }]),
      ),
    [[]],
  );
}

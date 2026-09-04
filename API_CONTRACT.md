# API CONTRACT — Inertia Application Contract

**This is not a REST API.** GoCommerce has no JSON API for the storefront and
must never grow one. The single contract between Go and React is the
**Inertia page prop**.

```
Route → HTTP method → Inertia page → Page props → React consumption
```

This document is the authoritative list. Before editing any page component,
find it here. Before renaming anything, remember that the name is defined by a
Go serializer in `internal/handler/` — renaming a prop is a **backend change**
and requires explicit authorization.

Companion documents: [`AI_RULES.md`](AI_RULES.md) · [`DO_NOT_BREAK.md`](DO_NOT_BREAK.md)

---

## Table of contents

- [Conventions](#conventions)
- [Shared props](#shared-props-every-page)
- [Reusable object shapes](#reusable-object-shapes)
- [Storefront routes](#storefront-routes)
- [Cart routes](#cart-routes)
- [Auth routes](#auth-routes)
- [Checkout routes](#checkout-routes)
- [Account routes](#account-routes)
- [Admin routes](#admin-routes)
- [The two JSON endpoints](#the-two-json-endpoints)
- [Props sent but not consumed](#props-sent-but-not-consumed)
- [Data available in the database but absent from props](#data-available-in-the-database-but-absent-from-props)

---

## Conventions

| Rule | Detail |
|---|---|
| Prop naming | `snake_case`, mirroring the Go serializers |
| Page naming | `"Pages/Products/Index"` resolves to `frontend/src/Pages/Products/Index.jsx` |
| UUIDs | **dashless hex string**, 32 chars — `fmt.Sprintf("%x", id.Bytes)` |
| Money in props | **pre-formatted string** via `formatNumeric` → `"12.00"`. A NULL becomes `"0.00"` |
| Money in `cart` | **float** — the `Cart` struct is JSON-marshalled directly |
| Dates | pre-formatted server-side: `"January 2, 2006"` (customer) / `"Jan 2, 2006"` (admin) |
| Nullable text | flattened to `""` via `.String` — never `null` |
| Lists | always `[]`, never `null` (`emit_empty_slices: true`) |
| Pagination | `{ current: int, total: int }` where `total` is a **page count**, minimum 1 |
| Request bodies | `parseInput` accepts JSON **or** form-encoded and flattens all values to strings. Payloads must be flat. The product form is the sole exception and uses its own JSON decoder. |
| Mutations | always redirect; never render a page in response to a POST |
| CSRF | `XSRF-TOKEN` cookie set by middleware, non-HttpOnly, echoed as `X-XSRF-TOKEN` |

---

## Shared props (every page)

Produced by `internal/middleware/inertiamw.DynamicSharedProps` plus the Inertia
flash store.

```jsonc
{
  "appName": "GoCommerce",

  // present ONLY when logged in — absent, not null, when a guest
  "auth": {
    "user": { "id": "…hex…", "name": "…", "email": "…", "role": "customer|admin" }
  },

  // present whenever a session exists; empty cart is {} on a fresh session
  "cart": {
    "items": [
      {
        "product_id": "…hex…",
        "name": "…", "slug": "…",
        "price": 12.5,          // FLOAT, not a string
        "quantity": 2,
        "image_url": "…", "sku": "…"
      }
    ],
    "total_items": 2,
    "total_price": 25.0         // FLOAT
  },

  "flash":  { "success": "…" } | { "error": "…" },
  "errors": { "<field>": "message" }
}
```

React access: `usePage().props`. Always guard with `auth?.user` and `cart?.items`.

`appName` is currently **not consumed anywhere** — see
[Props sent but not consumed](#props-sent-but-not-consumed).

---

## Reusable object shapes

### `product` — listing form

Emitted by `serializeFeaturedProducts` and `serializeFilterProducts`.

```jsonc
{
  "id": "…hex…", "name": "…", "slug": "…", "description": "…",
  "price": "49.00",
  "compare_at_price": "69.00",   // "0.00" when unset — treat as absent
  "sku": "…",
  "image_url": "…",              // "" when unset
  "is_featured": true,
  "stock_quantity": 12,
  "category_name": "…", "category_slug": "…"
}
```

`serializeCategoryProducts` emits the same **minus** `compare_at_price`, `sku`
and `is_featured`. Any component rendering both must tolerate their absence.

### `product` — detail form

`serializeProductWithCategory` — the listing fields plus:

```jsonc
{ "barcode": "…", "weight": "0.00", "meta_title": "…", "meta_description": "…" }
```

Note it does **not** include `is_featured`'s siblings from the admin shape:
`short_description`, `brand` and `tags` are absent on the storefront.

### `category`

```jsonc
{ "id": "…hex…", "name": "…", "slug": "…", "description": "…",
  "product_count": 7 }          // product_count only from serializeCategoriesWithCount
```

`image_url` is **not** exposed on storefront category props.

### `order`

`serializeOrder` — shared by checkout confirmation, account order detail and
admin order detail.

```jsonc
{
  "id": "…hex…", "status": "pending|confirmed|processing|shipped|delivered|cancelled",
  "total": "0.00", "subtotal": "0.00", "tax": "0.00",
  "shipping_cost": "0.00", "discount": "0.00",
  "notes": "…",
  "shipping_name": "…", "shipping_address": "…", "shipping_city": "…",
  "shipping_state": "…", "shipping_postal_code": "…", "shipping_country": "…",
  "billing_name": "…", "billing_address": "…", "billing_city": "…",
  "billing_state": "…", "billing_postal_code": "…", "billing_country": "…",
  "created_at": "January 2, 2006"
}
```

### `address`

```jsonc
{ "id": "…hex…", "label": "…", "first_name": "…", "last_name": "…",
  "company": "…", "address_line1": "…", "address_line2": "…",
  "city": "…", "state": "…", "postal_code": "…", "country": "…",
  "phone": "…", "is_default": false }
```

### `pagination`

```jsonc
{ "current": 1, "total": 4 }   // total = page count, never 0
```

---

## Storefront routes

### `GET /` → `Pages/Welcome`

`internal/handler/home.go`

| Prop | Shape |
|---|---|
| `message` | string — **not consumed by React** |
| `featured_products` | `product[]` (listing form), max 8 |
| `categories` | `category[]` with `product_count`, active only |

React: `Welcome.jsx` uses `featured_products` and `categories` only.

### `GET /products` → `Pages/Products/Index`

`internal/handler/products.go` · 12 per page

Query params: `?q=` `?category=` `?min_price=` `?max_price=` `?page=`

| Prop | Shape |
|---|---|
| `products` | `product[]` (listing form) |
| `categories` | `category[]` with `product_count` |
| `pagination` | `{current, total}` |
| `search` | string — echo of `?q=` |
| `category` | string — echo of `?category=` (a slug) |
| `min_price` | string — echo, **unparsed** |
| `max_price` | string — echo, **unparsed** |

The four echoes exist so the filter form repopulates after an Inertia visit.
Dropping them breaks filter persistence.

### `GET /products/{slug}` → `Pages/Products/Show`

Unknown slug → `RenderError` to `Pages/Errors/404` with **HTTP 404**.

| Prop | Shape |
|---|---|
| `product` | `product` (detail form) |
| `images` | `{id, url, alt_text, sort_order, is_primary}[]` |
| `variants` | `{id, name, sku, price, stock_quantity, is_active}[]` — active only |
| `related_products` | `{id, name, slug, price, image_url, category_name}[]` — same category, current product excluded, max 4 |

`related_products` is built with `var filteredRelated []map[string]any`, so it can
arrive as **`null`** rather than `[]` when there are no siblings. Guard it.

### `GET /categories` → `Pages/Categories/Index`

| Prop | Shape |
|---|---|
| `categories` | `category[]` with `product_count` |

### `GET /categories/{slug}` → `Pages/Categories/Show`

Unknown slug → `Pages/Errors/404`, HTTP 404.

| Prop | Shape |
|---|---|
| `category` | `{id, name, slug, description}` — no `product_count` |
| `products` | `product[]` (category form — no `compare_at_price`/`sku`/`is_featured`) |
| `pagination` | `{current, total}` |

### `Pages/Errors/404`

Rendered with `inertia.Props{}` — no props at all.

---

## Cart routes

### `GET /cart` → `Pages/Cart/Index`

| Prop | Shape |
|---|---|
| `cart` | the cart object (also available as a shared prop) |

### Mutations

All redirect. All accept flat JSON or form bodies.

| Route | Fields | On success |
|---|---|---|
| `POST /cart/add` | `product_id` (required), `quantity` (default `"1"`, coerced to ≥ 1) | → `/cart` + success flash |
| `POST /cart/update` | `product_id`, `quantity` (≤ 0 removes the line) | → `/cart` |
| `POST /cart/remove` | `product_id` | → `/cart` |
| `POST /cart/clear` | — | → `/cart` + success flash |

`POST /cart/add` redirects to the **`Referer`** header on every failure path, so
a missing referer degrades badly. Do not rely on staying in place after an error.

---

## Auth routes

### `GET /login` → `Pages/Auth/Login` · `GET /register` → `Pages/Auth/Register`

Both render `inertia.Props{}`. Everything they display comes from shared
`errors` and `flash`. Both are behind `RequireGuest`.

| Route | Fields | Validation error keys | Notes |
|---|---|---|---|
| `POST /login` | `email`, `password`, `remember_me` (`"true"`/`"on"`) | `email`, `password` | Bad credentials → **flash error**, not a field error. Rate-limited per IP. Admin → `/admin`, customer → `/` |
| `POST /register` | `name`, `email`, `password`, `password_confirmation` | per-field | |
| `POST /logout` | — | — | requires auth |

---

## Checkout routes

All behind `RequireAuth`.

### `GET /checkout` → `Pages/Checkout/Index`

Empty or unavailable cart → redirect `/cart` with an error flash.

| Prop | Shape |
|---|---|
| `cart` | cart object (floats) |
| `addresses` | `address[]` — **may be `null`** when the user has none |
| `tax_rate` | float **fraction** (`0.0825` = 8.25%) |
| `shipping_cost` | float |
| `free_shipping_threshold` | float |

Client-side arithmetic, which must stay in agreement with the server:

```
subtotal = cart.total_price
tax      = subtotal * tax_rate
shipping = subtotal >= free_shipping_threshold ? 0 : shipping_cost
total    = subtotal + tax + shipping
```

### `POST /checkout`

Fields: `shipping_name`, `shipping_address`, `shipping_city`, `shipping_state`,
`shipping_postal_code`, `shipping_country`, the six matching `billing_*` fields,
and `notes`.

Server-required: `shipping_name`, `shipping_address`, `shipping_city`,
`shipping_postal_code`, `shipping_country`. Failures come back as a **flash
error**, not field errors.

Success → `/checkout/confirmation/{id}` with a success flash.

### `GET /checkout/confirmation/{id}` → `Pages/Checkout/Confirmation`

| Prop | Shape |
|---|---|
| `order` | `order` |

Ownership is enforced; someone else's order id redirects to `/account/orders`.

---

## Account routes

All behind `RequireAuth`.

### `GET /account` → `Pages/Account/Profile`

| Prop | Shape |
|---|---|
| `user` | `{id, name, email}` — read from the **session**, not the database |
| `addresses` | `address[]` |

### `POST /account`

Fields: `name`, `email` (both required). Errors arrive as flash. On success the
session copies of `user_name` / `user_email` are refreshed, so the shared `auth`
prop updates too.

### `GET /account/orders` → `Pages/Account/Orders` · 10 per page

| Prop | Shape |
|---|---|
| `orders` | `{id, status, total, item_count, created_at}[]` |
| `pagination` | `{current, total}` |

⚠️ `item_count` is **hardcoded to `0`** in the handler. Do not display it.

### `GET /account/orders/{id}` → `Pages/Account/OrderShow`

| Prop | Shape |
|---|---|
| `order` | `order` |
| `items` | `{id, product_name, variant_name, quantity, unit_price, total, product_slug, product_image}[]` |

---

## Admin routes

All behind `RequireAdmin`. 20 rows per page unless noted.

### `GET /admin` → `Pages/Admin/Dashboard`

| Prop | Shape |
|---|---|
| `summary` | `{total_orders, total_revenue, average_order, unique_customers}` |
| `product_count` | int |
| `customer_count` | int |
| `recent_orders` | `{id, customer_name, customer_email, total, status, created_at}[]` |
| `top_products` | `{name, total_sold, total_revenue}[]` |

### Products

| Route | Page | Props |
|---|---|---|
| `GET /admin/products` | `Admin/Products/Index` | `products[]` = `{id, name, slug, price, stock_quantity, is_active, category_name, image_url}`, `pagination` |
| `GET /admin/products/create` | `Admin/Products/Create` | the product-form props (below) |
| `GET /admin/products/{id}/edit` | `Admin/Products/Edit` | the product-form props **plus** `product`, `product_images`, `product_variants`, `product_attributes` |

**Product-form props** (`productFormProps`):

```jsonc
{
  "categories": [{ "id", "parent_id", "name", "slug", "is_active" }],
  "attributes": [{
    "id", "code", "name",
    "type": "text|textarea|number|boolean|select|multiselect",
    "is_required", "is_variant",
    "options": [{ "id", "value" }]
  }],
  "brands":   ["…"],     // distinct existing brand strings
  "currency": "USD",     // const storeCurrency
  "tax_rate": 0.0825     // fraction
}
```

**Edit-only additions** — note `serializeAdminProduct` is far richer than the
storefront product shape:

```jsonc
{
  "product": {
    "id", "category_id", "name",
    "url_key",            // == slug; the form field is url_key
    "slug", "description", "short_description",
    "price",              // formatted string
    "compare_at_price", "cost_price",   // "" when NULL (optionalNumericString)
    "sku", "barcode", "image_url", "brand",
    "tags": ["…"],
    "is_active", "is_featured",
    "stock_quantity", "track_inventory", "allow_backorders", "low_stock_threshold",
    "weight", "length", "width", "height",
    "sort_order", "meta_title", "meta_description", "meta_keywords",
    "category_name", "category_slug"
  },
  "product_images":     [{ "id", "url", "alt_text", "is_primary" }],
  "product_variants":   [{ "id", "name", "sku", "barcode", "price",
                           "stock_quantity", "weight", "image_url",
                           "is_active", "options": { "<attr>": "<value>" } }],
  "product_attributes": [{ "attribute_id", "attribute_code", "attribute_name",
                           "attribute_type", "option_id", "value" }]
}
```

> `optionalNumericString` returns `""` for NULL, whereas `formatNumeric` returns
> `"0.00"`. Both appear in this one object. Do not normalize them.

**`POST /admin/products` and `POST /admin/products/{id}`** take a **JSON body**
decoded by `decodeProductForm` — *not* `parseInput`. Numeric fields are sent as
**strings** so a blank input is distinguishable from a zero.

```jsonc
{
  "name", "url_key", "short_description", "description", "category_id", "brand",
  "tags": ["…"],
  "price", "compare_at_price", "cost_price",
  "sku", "barcode", "stock_quantity", "low_stock_threshold",
  "track_inventory": bool, "allow_backorders": bool,
  "weight", "length", "width", "height",
  "is_active": bool, "is_featured": bool, "sort_order",
  "meta_title", "meta_description", "meta_keywords",
  "images":     [{ "url", "alt_text", "is_primary" }],
  "attributes": [{ "attribute_id", "option_id", "value" }],
  "variants":   [{ "id", "name", "sku", "barcode", "price", "stock_quantity",
                   "weight", "image_url", "is_active", "options": {} }],
  "redirect_to": "edit"      // optional: stay on the product after saving
}
```

Validation error keys: `name`, `url_key`, `short_description`, `category_id`,
`price`, `compare_at_price`, `cost_price`, `stock_quantity`,
`low_stock_threshold`, `sort_order`, `weight`, `length`, `width`, `height`,
`meta_title`, `meta_keywords`, `sku`, and the **indexed** keys
`images.N.url`, `variants.N.sku`, `variants.N.price`.

Limits: name 255, short description 500, SKU 100 (no spaces), meta title 255,
meta keywords 500, URL key 255. Slug and SKU uniqueness are checked server-side.

`POST /admin/products/{id}/delete` → redirect.

### Categories

| Route | Page | Props |
|---|---|---|
| `GET /admin/categories` | `Admin/Categories/Index` | `categories[]` = `{id, name, slug, description, sort_order, is_active}` |
| `GET /admin/categories/create` | `Admin/Categories/Create` | `{}` |
| `GET /admin/categories/{id}/edit` | `Admin/Categories/Edit` | `category` = `{id, name, slug, description, image_url, sort_order, is_active}` |

`POST /admin/categories` and `POST /admin/categories/{id}` fields: `name`,
`description`, `image_url`, `sort_order`, `is_active` (`"true"`/`"on"`).
**The slug is derived server-side from `name`** — there is no slug field.

`POST /admin/categories/{id}/delete` → redirect.

### Orders

| Route | Page | Props |
|---|---|---|
| `GET /admin/orders` | `Admin/Orders/Index` | `orders[]` = `{id, customer_name, customer_email, total, status, created_at}`, `status` (echo of `?status=`), `pagination` |
| `GET /admin/orders/{id}` | `Admin/Orders/Show` | `order`, `items[]` = `{product_name, quantity, unit_price, total}` |

`POST /admin/orders/{id}/status` field: `status`.

Note the admin order-items shape has **no `id`**, unlike the account one.

### Customers

| Route | Page | Props |
|---|---|---|
| `GET /admin/customers` | `Admin/Customers/Index` | `customers[]` = `{id, name, email, role, created_at}`, `pagination` |
| `GET /admin/customers/{id}` | `Admin/Customers/Show` | `customer` = same shape, `orders[]` = `{id, total, status, created_at}` (max 10) |

### Settings

`GET /admin/settings` → `Admin/Settings/Index`

```jsonc
{ "settings": { "tax_rate_percent": 8.25,   // PERCENT here…
                "shipping_cost": 9.99,
                "free_shipping_threshold": 200 } }
```

`POST /admin/settings` fields: `tax_rate_percent`, `shipping_cost`,
`free_shipping_threshold`. Validation error keys match the field names.

> ⚠️ `tax_rate_percent` is a **percentage** (8.25) while the `tax_rate` prop on
> checkout and the product form is a **fraction** (0.0825). Never mix them.

---

## The two JSON endpoints

These are the only non-Inertia responses in the application. They exist to
support the admin attribute picker and the media uploader. **They are not a REST
API and must not be extended into one.**

| Route | Body | Response |
|---|---|---|
| `POST /admin/attributes` | JSON attribute payload | `201` `{id, code, name, type, is_required, is_variant, options[]}` |
| `POST /admin/attributes/{id}/options` | JSON option payload | `201` `{id, attribute_id, value}` |
| `POST /admin/uploads` | `multipart/form-data` | `201` `{url, name, size}` |

Errors: `{ "error": "message" }` with `400`, `413`, `415`, `422`, `500` or `502`.
Uploads accept JPG, PNG, WEBP, GIF, AVIF, SVG up to `MAX_UPLOAD_SIZE`
(default 10 MB) and are stored via `internal/storage` — R2 when configured,
local disk otherwise.

---

## Props sent but not consumed

Safe to leave; do not "clean up" server-side, since that is a backend change.

| Prop | Page | Note |
|---|---|---|
| `appName` | shared, every page | `"GoCommerce"`. The brand string `"ShopNest"` is instead hardcoded in Navbar, Footer and five `<Head title>` calls. Prefer wiring `appName` through. |
| `message` | `Pages/Welcome` | A welcome sentence React ignores |
| `product.meta_title`, `product.meta_description` | `Products/Show` | Available for `<Head>` but unused |
| `images[].sort_order`, `images[].is_primary` | `Products/Show` | Gallery ignores ordering |
| `product.barcode`, `product.weight` | `Products/Show` | Unused |

---

## Data available in the database but absent from props

Each of these would require a **backend change** (a serializer edit) and
therefore explicit authorization. Recorded here so a future agent asks rather
than inventing a workaround.

| Data | Where it lives | Frontend consequence today |
|---|---|---|
| `categories.image_url` | populated by the admin category form | The storefront cannot render real category images, so `Welcome.jsx` and `Categories/*.jsx` use hardcoded `picsum.photos` URLs picked by array index — meaning a category's image changes when sort order changes |
| `products.short_description` | migration 004, in admin props | Cards must truncate `description` (which is HTML) instead |
| `products.brand` | migration 004, in admin props | No brand display or brand filtering on the storefront |
| `products.tags` | migration 004, in admin props | No tag display or tag filtering |
| `order_items` count | derivable | `Account/Orders` receives a hardcoded `item_count: 0` |

**The frontend-only alternative in every case is to render less, not to fabricate
data.** Do not invent placeholder commerce values to fill a gap.

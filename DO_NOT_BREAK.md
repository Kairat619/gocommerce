# DO NOT BREAK

The safety contract. Everything listed here works today. If a change breaks any
of it, the change is wrong — revert rather than patch around it.

Walk this document after every refactoring phase. There is no frontend test
runner, so this list **is** the regression suite.

Companion documents: [`AI_RULES.md`](AI_RULES.md) · [`API_CONTRACT.md`](API_CONTRACT.md)

---

## Commerce

- Product browsing — `/products`, 12 per page
- Product search — `?q=` free-text
- Product filtering — `?category=`, `?min_price=`, `?max_price=`, and all
  combinations of them together with `?q=` and `?page=`
- Filter state round-trips: the server echoes `search`, `category`, `min_price`,
  `max_price` back as props so the filter form stays populated after a visit
- Category navigation — `/categories`, `/categories/{slug}`
- Category imagery — a category's own `image_url`, falling back to the seeded
  placeholder when it has none (`lib/image.categoryImage`)
- Category descriptions render as HTML on `/categories/{slug}`; the tiles on
  `/categories` show a plain-text excerpt of the same value
- Collection navigation — `/collections`, `/collections/{slug}`
- Collections are a **merchandising layer, not a second category system**: every
  product keeps its single `products.category_id`, and nothing about
  `/categories` changed when collections arrived
- Collection product order — the storefront lists a collection's products in the
  merchant's curated order (`collection_products.position`, then name), *not*
  alphabetically; `ProductGrid` renders them as given and must not re-sort
- A disabled collection 404s at `/collections/{slug}` rather than rendering empty
- Featured collections sort ahead of the rest on `/collections`
- Deleting a collection never deletes products — only the membership rows go
- Deleting a product drops it from its collections rather than being refused
  (`collection_products.product_id` is `ON DELETE CASCADE`, unlike
  `products.category_id` which stays `ON DELETE RESTRICT`)
- The admin collection product picker paginates server-side via an Inertia
  partial reload; the full catalogue is never loaded into the browser
- The storefront nav "Collections" points at `/collections` and "Shop by
  Category" at `/categories` — both work, and no existing `/categories` URL
  changed
- Product detail — `/products/{slug}`, including an unknown slug rendering the
  404 page with HTTP 404 (not a redirect, not a 500)
- Product image gallery — primary `image_url` plus `product_images` rows
- Product variants — selection, per-variant price display
- Related products on the product detail page, with the current product excluded
- Pricing display — `price`, and `compare_at_price` only when it is genuinely
  higher than `price`
- Discount percentage calculation
- Inventory display — in-stock / out-of-stock, `stock_quantity`
- Out-of-stock products cannot be added to the cart
- Cart — `/cart`
- Add to cart — from the product card quick-add **and** the product detail page
- Adding a product already in the cart increments its quantity
- Update cart quantity; quantity ≤ 0 removes the line
- Remove from cart; clear cart
- Cart totals — `total_items` and `total_price` stay correct after every mutation
- Cart survives logout, login, and server restart (it lives in the Postgres session)
- Checkout — `/checkout`
- Checkout guards: an empty or unavailable cart redirects to `/cart` with a flash
- Saved-address selection populates the shipping form
- "Billing same as shipping" copies shipping into billing on submit
- Tax, shipping and free-shipping-threshold arithmetic matches the values the
  server sent (`tax_rate`, `shipping_cost`, `free_shipping_threshold`)
- Required shipping fields are enforced: name, address, city, postal code, country
- Coupons — a code applied at `/cart` survives to `/checkout`; only the **code**
  is stored in the session, so the discount is re-evaluated on every render and a
  coupon that expires or stops qualifying silently drops out
- Coupon rejection reasons reach the shopper as the **field error `code`**
  (not valid / disabled / not started / expired / usage limit / already used /
  minimum not met / sign-in needed), and a rejected code never removes a coupon
  that is already applied
- Discount arithmetic: discount comes off the subtotal, tax is charged on the
  discounted subtotal, then shipping; a free-shipping coupon zeroes shipping;
  the free-shipping threshold is measured against the discounted subtotal
- A discount never exceeds the subtotal, and a percentage cap is honoured
- With no coupon the totals are **identical** to the pre-coupon arithmetic
  (`subtotal + subtotal * tax_rate + shipping`)
- `GET /checkout` sends `totals` from `service.ComputeTotals`, the same function
  `CreateOrder` charges from — the figure shown is the figure billed
- Order creation and stock decrement
- Redemption is booked **after** the order exists: `coupons.used_count` is
  incremented and a `coupon_redemptions` row is written, so an abandoned
  checkout never consumes a coupon
- Placing an order clears both the cart and the applied coupon
- Orders keep `coupon_code` and `discount` as placed — editing or deleting the
  coupon afterwards never rewrites order history
- Editing a coupon never resets `used_count`
- Order confirmation — `/checkout/confirmation/{id}`
- Customer account — `/account`, profile update
- Order history — `/account/orders`, `/account/orders/{id}`
- A customer can only ever see their own orders

---

## Admin

- Admin dashboard summary, recent orders, top products
- Product list, create, edit, delete
- **The product form workflow in `frontend/src/Components/Admin/**` is frozen.**
  Media uploader, category picker, attribute picker, variant matrix, rich-text
  editor, tag input, SEO and pricing panels all keep working exactly as they do.
- Product form posts a **JSON body** (not form-encoded) to
  `POST /admin/products` and `POST /admin/products/{id}`
- Product form validation errors return per-field, including the indexed keys
  `images.N.url`, `variants.N.sku`, `variants.N.price`
- `redirect_to: "edit"` keeps the admin on the product after save
- Attribute and attribute-option creation via the two JSON endpoints
- Media upload to `POST /admin/uploads` returning `{url, name, size}`
- Category list, create, edit, delete
- Coupon list, create, edit, delete. The list filters by lifecycle
  (active / scheduled / expired+limit-reached / disabled) and searches code and
  internal note
- **The coupon form workflow in `frontend/src/Components/Admin/Coupons/**` matches
  the product and category forms.** Create and Edit share `CouponForm`; the code
  field, conditional discount fields, conditions, usage limits, validity and the
  live summary all keep working
- Coupon form posts a **JSON body** to `POST /admin/coupons` and
  `POST /admin/coupons/{id}`, with every numeric field as a string so blank
  (unlimited / no minimum) stays distinct from `0`
- Coupon codes are stored upper-cased and are unique; duplicates return the
  field error `code`
- Fields irrelevant to the selected discount type are not submitted
- The category list renders the **tree**: children indented under their parent
  with guide lines, per-branch expand/collapse, expand/collapse all, and a
  search that keeps the ancestors of every match. Every category is always on
  the page exactly once — a row must never disappear, including one stranded in
  a parent loop, which is shown at the top level marked "Detached"
- **The category form workflow in `frontend/src/Components/Admin/Categories/**`
  matches the product form and is settled.** Parent picker, single-image
  uploader, rich-text description, SEO panel and sticky actions all keep
  working, and Create and Edit keep sharing `CategoryForm`.
- Category form posts a **JSON body** (not form-encoded) to
  `POST /admin/categories` and `POST /admin/categories/{id}`
- Category form validation errors return per-field: `name`, `url_key`,
  `parent_id`, `sort_order`, `image_url`, `meta_*`
- `redirect_to: "edit"` keeps the admin on the category after save
- **A category rename never changes its storefront slug.** The form posts the
  existing `url_key` back; only an explicit edit to that field moves
  `/categories/{slug}`
- Category nesting: a category can never be saved under itself or one of its own
  descendants — the picker greys those rows out and the server rejects them
- Deleting a category with products is refused with an explanatory flash, not a
  raw Postgres error
- Order list with status filter; order detail; order status update
- Customer list and customer detail
- Store settings — tax rate, shipping cost, free-shipping threshold

---

## Application

- Authentication — register, login, logout
- Session regeneration on login
- "Remember me"
- Rate limiting on login
- Role-based authorization: `RequireAuth`, `RequireGuest`, `RequireAdmin`
- Admins land on `/admin` after login; customers land on `/`
- Guests are redirected away from `/login` and `/register` when already signed in
- Sessions persist in PostgreSQL across restarts and across replicas
- CSRF — the `XSRF-TOKEN` cookie is set and readable by JS
- Flash messages — `success` and `error`
- Validation errors — per-field, surfaced on the page that submitted
- Error handling — unexpected errors do not leak stack traces to users
- Security headers middleware
- Health check — `GET /health`

---

## Inertia

- Inertia navigation on every internal link
- Page resolution: `Pages/<Name>` maps to `frontend/src/Pages/<Name>.jsx` via the
  `import.meta.glob` in `main.jsx`. **Renaming or moving a page file breaks the
  route** unless the Go handler string changes too — and that is a backend change.
- Page props — every name and shape in [`API_CONTRACT.md`](API_CONTRACT.md)
- Shared props on every page — `appName`, `auth`, `cart`, `flash`, `errors`
- `auth` is absent when logged out (not null, not an empty object)
- Form submissions via `router.post`
- Validation errors returned through redirect + `usePage().props.errors`
- Redirects after mutations
- Pagination — `pagination.current` and `pagination.total`, `?page=` preserved
  alongside active filters
- The root view template `frontend/index.html` keeps all three Go template
  actions: `{{ .ViteTags }}`, `{{ .InertiaHead }}`, `{{ .InertiaScript }}`

---

## Theme engine

- `ACTIVE_THEME` in `frontend/src/theme/themes/index.js` selects the storefront
  identity. Both installed themes (`default`, `luxury`) must build and render.
- The `default` theme reproduces the storefront's original homepage section for
  section — treat it as the reference, not a starting point to edit casually.
- A theme file contains **no Tailwind class strings and no component imports**.
  Variant names only. A class that exists only as theme data is invisible to
  Tailwind's purge and vanishes in the production build.
- Section variant class maps live in the section component, statically.
- `sections/registry.js` `select` functions name the page props each section
  consumes. Changing one silently starves a section of its data.
- An unknown section name is skipped with a dev warning, never thrown — a typo
  in a theme must not blank the storefront.
- `ThemeProvider` writes colours to `document.documentElement`, not a wrapper
  element: `body` takes its background from `var(--color-surface)`.
- `theme/tokens/tokens.css` stays the build-time default so the first paint is
  never unstyled.

---

## Data shapes

These are load-bearing. Breaking one breaks pages silently.

- UUIDs are **dashless hex strings** — never reformatted client-side
- Money in page props is a **pre-formatted string** (`"12.00"`); `"0.00"` is what
  a NULL becomes, so it usually means *absent*, not *free*
- Money inside `cart` is a **float** — the one place client formatting is correct
- Dates arrive **pre-formatted** (`"January 2, 2006"` / `"Jan 2, 2006"`)
- Lists are always `[]`, never `null`
- `POST` handlers accept **both** JSON and form-encoded bodies via `parseInput`,
  which flattens every value to a string — so payloads through it must stay flat.
  Nested objects and arrays only work on the product form, which has its own
  dedicated JSON decoder.

---

## Localization / formatting

- Currency formatting stays consistent across cart, checkout, order summary,
  product card and product detail
- The `currency` prop (`"USD"`) supplied to the admin product form is honoured
- Tax rate is a fraction in props (`0.0825`) but a percentage in the admin
  settings form (`tax_rate_percent`) — do not conflate the two

---

## Infrastructure

- Cloudflare R2 image storage when `R2_*` env vars are set; local disk otherwise
- `/uploads/*` and `/build/*` served with immutable cache headers
- Environment variables in `.env.example` keep working
- Docker and `docker compose` builds
- PostgreSQL 16
- Migrations run automatically and idempotently at startup
- The Vite manifest contract: `public/build/.vite/manifest.json`,
  `PublicPath: /build`, entry `src/main.jsx`
- Vite dev-server tags are emitted **only** when `APP_ENV=development`
- Railway deployment (`railway.toml`, `Dockerfile`)

---

## UX

- Mobile responsiveness at every breakpoint
- Mobile navigation menu opens, closes, and traps focus sensibly
- Mobile filters on the product listing
- Accessibility — semantic HTML, keyboard navigation, visible focus states,
  labelled inputs, adequate contrast, real touch targets
- `prefers-reduced-motion` is respected (already handled in `app.css`)
- Loading states, empty states, error states
- Flash **successes** auto-dismiss after 5 seconds; flash **errors** persist
  until dismissed. Several forms — checkout in particular — return their only
  feedback as a flash error, so it must not disappear on a timer.
- Escape dismisses the flash message
- Flash messages render **once** per page (do not add a second renderer to a page
  already inside a layout that mounts `FlashMessage`)
- A "Skip to content" link is the first focusable element and targets
  `#main-content` on `<main>`
- Every keyboard-focusable control shows a visible focus ring
- The user dropdown and mobile menu close on outside click, on Escape, and on
  Inertia navigation
- Filters collapse behind a toggle below the `lg` breakpoint, with a count of
  the active ones
- Pagination windows the page list (first, last, current ±1, with gaps) instead
  of rendering every page

---

## Architecture

- Go backend architecture — handlers → services → sqlc → pgx
- Chi routing
- sqlc as the only query generator; `sql/queries/*.sql` is the source of truth
- pgx/v5
- PostgreSQL-backed sessions (`internal/session/`) — **not** SCS
- bcrypt password hashing
- golang-migrate with embedded migrations
- The existing database and every applied migration
- No REST API, no GraphQL, no ORM
- No React Router, Redux, Zustand or MobX
- Frontend runtime dependencies stay at three: `@inertiajs/react`, `react`,
  `react-dom`

---

## Verification

```bash
go build ./...                  # must pass
go vet ./...                    # must pass
go test ./...                   # must pass
cd frontend && npm run build    # must pass
```

Then walk the flows above manually. Minimum smoke path:

1. Home → category → product → add to cart → cart → checkout → confirmation
2. Register → logout → login → account → order history → order detail
3. Login as admin → dashboard → product list → edit a product → save
4. Product listing with a search term **and** a category **and** a price range,
   then page 2, and confirm the filters survive

---

## Validation record

Last full pass: 2026-09-04, against a real PostgreSQL 16 (`docker compose up -d`)
with the server built and run in **production** mode (`APP_ENV=production`), so
the built-asset path and the Vite manifest were exercised rather than the dev
server.

**61 end-to-end HTTP checks passed** using the Inertia JSON protocol
(`X-Inertia: true`), which asserts the real component names and prop keys
rather than just status codes.

Reproduce with:

```bash
docker compose up -d
go build -o server.exe ./cmd/server/
APP_ENV=production SESSION_KEY=<any> PORT=8099 ./server.exe
```

Then walk the flows in this document. Seeded logins: `admin@gocommerce.com`
and `jane@example.com`, password `password`.

Two static checks are worth re-running after any prop change; both are simple
scripts over the Go handlers and the page components:

1. every prop a page destructures is one its handler sends
2. every `Render(w, r, "Pages/X", …)` target has a matching `Pages/X.jsx`

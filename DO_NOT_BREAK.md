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
- Order creation and stock decrement
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
- Flash messages auto-dismiss after 5 seconds and can be dismissed manually
- Flash messages render **once** per page (do not add a second renderer to a page
  already inside a layout that mounts `FlashMessage`)

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

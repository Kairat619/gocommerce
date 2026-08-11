# GoCommerce — Development Progress

## Current Status: Step 4 COMPLETE ✅
## Resume at: Step 5 — Shopping Cart

---

## Completed Steps

### Step 1: Project Skeleton & Bridge Setup ✅
- Go + Chi router + Inertia.js v0.3.1 bridge working
- React 19 + Vite 6 + Tailwind 3 frontend
- Docker Compose for PostgreSQL 16
- Cookie-based session store (`internal/session/`)
- Dynamic shared props for auth user + flash messages (`internal/middleware/inertiamw/`)
- Vite dev server + production build both working

### Step 2: Database Schema ✅
- 5 tables: users, categories, products, orders, order_items
- order_status enum (pending/confirmed/processing/shipped/delivered/cancelled)
- 40+ sqlc queries (CRUD, search, pagination, stats)
- Database connection package (`internal/db/conn.go`)
- Idempotent migration runner (`internal/db/migrate.go`)
- Seed data: 3 users, 4 categories, 9 products (`internal/db/seed.go`)

### Step 3: Authentication & Shared Data ✅
- Auth service with bcrypt password hashing (`internal/service/auth.go`)
- UUID parsing utilities for pgtype.UUID conversion
- Auth handlers: Register, Login, Logout (`internal/handler/auth.go`)
- RequireAuth middleware for protected routes (`internal/middleware/auth.go`)
- Inertia Redirect with flash data + validation errors via MemoryFlashStore
- CSRF protection via XSRF-TOKEN cookie middleware
- DynamicSharedProps: auth.user (id, name, email, role) + flash + errors on every page
- Session stores full user data (id, name, email, role) on login/register
- React pages: Login.jsx, Register.jsx with form validation UI
- Welcome page shows auth state (greeting + logout vs sign-in/register)
- Flash messages: success/error banners on all pages

### Step 4: Product Catalog & Store Pages ✅
- Product listing page with search + pagination (`/products`)
- Product detail page with full info (`/products/:slug`)
- Category index page with product counts (`/categories`)
- Category detail page with filtered products (`/categories/:slug`)
- 404 error page
- Product handlers: Index, Show (`internal/handler/products.go`)
- Category handlers: Index, Show (`internal/handler/categories.go`)
- 2 new sqlc count queries: CountProductsByCategory, CountSearchProducts
- 12 products per page with server-side pagination

**React Components:**
- `ProductCard.jsx` — Product card with image, name, price, stock badge
- `Pagination.jsx` — Page navigation with Inertia preserveScroll
- `SearchBar.jsx` — Search input with query param handling
- `Navbar.jsx` — Navigation with auth-aware links
- `StoreLayout.jsx` — Shared layout wrapper (Navbar + main content)

**React Pages:**
- `Products/Index.jsx` — Grid of products with category pills + search
- `Products/Show.jsx` — Product detail with breadcrumbs + Add to Cart button
- `Categories/Index.jsx` — Category grid with icons + product counts
- `Categories/Show.jsx` — Filtered product grid per category
- `Errors/404.jsx` — Simple not-found page

---

## How to Resume

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Start Frontend Dev Server
```bash
cd frontend && npm run dev
```

### 3. Start Go Server
```bash
go run ./cmd/server/
```

### 4. Open
- Store: http://localhost:8080
- Products: http://localhost:8080/products
- Categories: http://localhost:8080/categories
- Vite HMR: http://localhost:5173 (auto-proxied)

---

## Next Step: Step 5 — Shopping Cart

What needs to be built:
- Cart session storage (store cart items in session for guests, DB for logged-in users)
- Add to cart handler (POST /cart/add)
- View cart page (GET /cart)
- Update quantity handler (PUT /cart/items/:id)
- Remove item handler (DELETE /cart/items/:id)
- Cart badge in navbar showing item count
- Cart page with item list, quantities, totals
- Free shipping threshold indicator

### Key files to create/modify:
- `internal/handler/cart.go` — Cart handlers
- `internal/service/cart.go` — Cart business logic
- `frontend/src/Pages/Cart/Index.jsx` — Cart page
- `frontend/src/Components/CartBadge.jsx` — Cart icon with count
- `cmd/server/main.go` — Add cart routes

---

## Route Reference

### Public Routes
- `GET /` → Welcome page
- `GET /login` → Login page
- `POST /login` → Authenticate user
- `GET /register` → Register page
- `POST /register` → Create user
- `GET /products` → Product listing (search, pagination)
- `GET /products/:slug` → Product detail
- `GET /categories` → Category listing
- `GET /categories/:slug` → Category products

### Protected Routes (require auth)
- `POST /logout` → Destroy session

### Shared Props (available on every page)
- `auth.user` — { id, name, email, role } or null
- `flash` — { success, error } or null
- `errors` — Validation errors map or null

---

## Tech Stack Reference
- **Go adapter**: `github.com/mayahiro/go-inertia` v0.3.1
- **Frontend**: React 19 + @inertiajs/react v2.3.27
- **Database**: PostgreSQL 16 via pgx/v5
- **Queries**: sqlc v1.31.0 (regenerate with `sqlc generate`)
- **Router**: go-chi/chi/v5
- **Auth**: golang.org/x/crypto/bcrypt

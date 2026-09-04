# AI RULES

Permanent instruction manual for AI coding assistants working on GoCommerce.
Read this **before** touching any file. It overrides habits, defaults, and
"this would be cleaner if…" instincts.

Companion documents:

- [`DO_NOT_BREAK.md`](DO_NOT_BREAK.md) — the safety contract; what must keep working.
- [`API_CONTRACT.md`](API_CONTRACT.md) — the **Inertia application contract** (not REST).
- [`AGENTS.md`](AGENTS.md) — build commands and code style.

---

## 1. Mental model

Do not think *"I am building an ecommerce website."*

Think:

> **"I am extracting a reusable, theme-driven storefront engine from an existing
> Go + Inertia ecommerce application."**

```
GO       →  Commerce Core        (protected infrastructure)
INERTIA  →  Application Boundary (the contract)
REACT    →  Storefront Engine    (where the work happens)
THEME    →  Visual Identity      (replaceable without touching commerce)
SECTIONS →  Composable storefront building blocks
```

The Commerce Core stays stable. Only presentation changes.

---

## 2. Architecture

**Go is the Commerce Core.** Chi routes → handlers → services → sqlc → PostgreSQL.
All business logic — pricing, tax, stock, orders, auth — lives here.

**Inertia is the application boundary.** There is exactly one frontend/backend
contract: **page props**. Not REST. Not GraphQL.

```
Go Application → Inertia → Page Props → React
```

**React is the Storefront Engine.** Pages consume props, hand data to reusable
commerce components, which render through theme presentation.

**Theme is the presentation layer.** A theme controls typography, colors,
spacing, radii, shadows, layout, component variants, section variants, homepage
composition, animation and visual density — and nothing else.

---

## 3. Backend rules

**Backend changes require explicit human authorization. Every time.**

Protected (do not modify unless told to):

- Go business logic, services, handlers
- Database schema, migrations, SQL queries, sqlc-generated code
- Authentication, authorization, sessions
- Checkout, order, inventory, pricing, cart, customer, product logic
- Chi routes and middleware

You **may** read the backend freely — and you **should** read enough of it to
understand the props you are consuming. Inspection is not permission to refactor.

Never:

- Introduce a REST API (`/api/products`, `/api/cart`, …)
- Introduce GraphQL
- Replace sqlc, pgx/v5, Chi, or golang-migrate
- Introduce an ORM (GORM, Ent, Bun)
- Introduce Gin, Fiber, or Echo
- "Clean up" backend code because it could be nicer

### If you believe a backend change is necessary

**STOP. Do not implement it.** Report instead:

```
BACKEND CHANGE REQUEST

Why it appears necessary:
Current frontend limitation:
Potential backend modification:
Risk:
Recommended frontend-only alternative:
```

Then proceed with the frontend-only alternative whenever one exists.

### Session note

Sessions are **not** SCS. `internal/session/` is a hand-rolled PostgreSQL-backed
store (table `sessions`, migration `003_sessions`) chosen so logins and carts
survive restarts and support multiple replicas. **Do not migrate it to SCS or to
any in-memory store.**

---

## 4. Frontend rules

Use only: **React + Vite + Tailwind CSS + `@inertiajs/react`**.

- Navigation belongs to Inertia. `<Link href>` for GET, `router.post/put/delete`
  for mutations, `{ preserveScroll: true }` where it helps.
- Server data comes from Inertia page props.
- Local UI state uses `useState`, `useMemo`, `useEffect`.

Never introduce:

- React Router, Next.js, Remix — Inertia owns navigation
- Redux, Zustand, MobX — if state feels hard, fix the component boundaries first
- A second routing architecture, or route definitions duplicated in React

**No new npm dependencies without explicit authorization.** The frontend
deliberately ships three runtime dependencies. Keep it that way.

### Props are a contract

Page props are named by the Go handler. A React page consuming `products` and
`pagination` is bound to a serializer in `internal/handler/`.

- **Never rename or drop a prop** to suit a component.
- Prop names are `snake_case` (they mirror the Go serializers).
- Adding a prop is a **backend change** — see §3.
- Check [`API_CONTRACT.md`](API_CONTRACT.md) before editing any page component.

### Data-shape gotchas that will bite you

| Value | Actual shape | Consequence |
|---|---|---|
| UUIDs | **dashless hex** string, 32 chars | never reformat or re-hyphenate |
| Money in props | **pre-formatted string** (`"12.00"`, `"0.00"` when NULL) | do not re-round; `"0.00"` usually means *absent*, not *free* |
| Money in `cart` | **float** (`12.5`) | the cart is the one place you format client-side |
| Dates | **pre-formatted** (`"January 2, 2006"`) | no date library needed or wanted |
| Empty lists | always `[]`, never `null` | `emit_empty_slices` is on |
| `auth` | **absent** when logged out | always write `auth?.user` |

---

## 5. Design rules

- Prefer reusable components; prefer reusable sections; prefer design tokens.
- Separate data concerns from presentation concerns.
- Avoid duplicated UI.
- **Avoid unnecessary abstraction.** A component earns its existence at two or
  more real call sites. Do not create speculative primitives.
- Commerce data must never be invented inside a presentation component. No
  hardcoded placeholder image URLs, no fake product data, no faked counts.
- One component per file; filename matches the component name.
- `export default function ComponentName({ … })`.

### Tailwind and the purge

Tailwind scans `./src/**/*.{js,jsx}` for **literal** class strings.

```jsx
// NEVER — silently loses styles in the production build only
className={`text-${color}-600`}

// ALWAYS — static maps
const tones = { accent: "text-accent", ink: "text-ink" };
className={tones[tone] ?? tones.ink}
```

After any styling work run `npm run build`. A dev-server check will not catch this.

---

## 6. Theme rules

Theme code must be replaceable without rewriting commerce logic.

- Tokens are CSS custom properties; Tailwind colors point at `var(--…)`.
  Switching themes swaps variables, never class names.
- Components take a **semantic** `variant`, resolved through the active theme.
- Sections receive commerce data as props and own only presentation.
- Homepage composition is data (`theme.homepage` is an ordered list of section
  names), not hand-written JSX.
- The **admin** area is application chrome, not storefront identity. It sits
  outside the theme engine.

A future agent should be able to produce a Luxury, Electronics, or Minimal
Furniture theme without touching Go, the database, auth, sessions, checkout,
or orders.

---

## 7. Quality bar

**Mobile-first.** Mobile is not a secondary version. Navigation, mobile menu,
search, filters, product grids, gallery, cart and checkout must all work well at
every breakpoint, with real touch targets.

**Accessible.** Semantic HTML, keyboard navigation, visible focus states,
labelled form controls, useful ARIA on dialogs and drawers, sufficient contrast.

**Performant.** Lazy-load below-the-fold images, size images for their slot,
keep lists efficient, provide loading/skeleton/empty/error states. Preserve the
existing Cloudflare R2 architecture — do not redesign storage.

---

## 8. Workflow

1. **Read before writing.** `API_CONTRACT.md` for the page you are touching.
2. **Work incrementally.** One concern per commit. Re-skinning commits contain no
   logic changes; logic commits contain no re-skinning.
3. **Never leave the repository knowingly broken.**
4. **Verify before claiming done:**

```bash
go build ./...                  # must pass
go vet ./...                    # must pass
go test ./...                   # must pass
cd frontend && npm run build    # must pass — catches Tailwind purge errors
```

5. Walk [`DO_NOT_BREAK.md`](DO_NOT_BREAK.md) after each phase.
6. Report honestly. If something is unverified, say so.

There is **no frontend test runner**. The build plus the manual `DO_NOT_BREAK.md`
walkthrough are the safety net. Treat them as mandatory, not optional.

---

## 9. Frozen areas

Do not restyle or restructure `frontend/src/Components/Admin/**` as part of
storefront or theme work. That admin product form was deliberately rebuilt and is
considered settled. Bug fixes are fine; redesigns are not.

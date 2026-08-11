# GoCommerce

A full-stack e-commerce application: Go backend (Chi router + [Inertia.js](https://inertiajs.com/)
bridge) serving a React 19 frontend (Vite 6, Tailwind 3), backed by PostgreSQL 16.

## Architecture

GoCommerce is an **Inertia.js monolith**: the Go server renders every page and injects
props into the React frontend. React runs client-side for interactivity, but there is no
separate SPA or standalone JSON API — the Go server and the React build ship together as a
single deployable unit (see `Dockerfile`).

```
cmd/server/main.go        # Entry point: router + middleware stack
internal/config/          # Env var loading + validation
internal/db/              # sqlc-generated code, connection, migrations, seed
internal/handler/         # HTTP handlers
internal/middleware/      # Auth + Inertia shared-props middleware
internal/service/         # Business logic (auth, cart, orders, settings)
internal/session/         # Postgres-backed session store
sql/queries/, sql/schema/ # sqlc queries and numbered migrations
frontend/src/Pages/       # Inertia page components (mirror routes)
```

## Local Development

```bash
docker compose up -d            # Start PostgreSQL
make dev                        # DB + Go server (:8080) + Vite (:5173)
```

Or run pieces individually:

```bash
go run ./cmd/server/            # Backend on :8080 (runs migrations + seed on start)
cd frontend && npm run dev      # Vite dev server on :5173
```

Default seeded admin login: `admin@gocommerce.com` / `password`.

## Sessions

Sessions are stored server-side in PostgreSQL (`sessions` table, migration
`003_sessions`). Because session state lives in the database rather than in process
memory, **logins and carts survive restarts and deploys**, and the app can safely run more
than one replica. No extra configuration is required — the session store uses the same
`DATABASE_URL` connection pool.

## Deploying to Railway

The whole app (Go server + built React frontend) deploys as **one Railway service** using
the multi-stage `Dockerfile`, backed by a **Railway PostgreSQL** database. Build settings
are pinned in `railway.toml` (Dockerfile builder + `/health` health check).

> Note: This app cannot be split into a Vercel frontend + separate backend. React pages are
> rendered through the Go server via Inertia, so there is no standalone SPA/API to host on
> Vercel. Deploy the whole thing to Railway.

### 1. Create the project and database

1. Sign in to [Railway](https://railway.app) with GitHub.
2. **New Project → Deploy PostgreSQL**. This provisions a database and a `DATABASE_URL`.

### 2. Add the app service

1. In the same project: **New → GitHub Repo → select this repository**.
2. Railway detects `railway.toml` / `Dockerfile` and builds automatically.

### 3. Configure environment variables (app service → Variables)

| Variable       | Value                          | Notes |
|----------------|--------------------------------|-------|
| `APP_ENV`      | `production`                   | Enables production validation |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}`   | Reference the DB service; append `?sslmode=require` if not already present |
| `SESSION_KEY`  | *(a long random string)*       | **Required** in production or the app refuses to start |
| `SEED`         | `true` first deploy, then `false` | Seeds demo data once; set `false` afterward |
| `APP_URL`      | your Railway public URL        | e.g. `https://gocommerce-production.up.railway.app` |
| `PORT`         | *(optional)*                   | Railway injects one automatically; the app reads it |

Optional (only if using R2 image uploads): `R2_ENDPOINT`, `R2_ACCESS_KEY`,
`R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.

### 4. Expose it publicly

App service → **Settings → Networking → Generate Domain** to get a `*.up.railway.app` URL.

### 5. Deploy and verify

- Railway deploys automatically on every push to `main`.
- Migrations and seeding run on startup (see `cmd/server/main.go`).
- Check the deploy logs for `Database migration complete` and `Server running`.
- Visit `/health` — it returns `{"status":"healthy"}` after pinging the database.

### 6. After the first deploy

Set `SEED=false` and redeploy so demo data is not re-seeded on subsequent restarts.

### Deploying from the CLI (optional)

```bash
npm i -g @railway/cli
make railway-login     # railway login
railway link           # link this repo to your Railway project/service
make railway-up        # railway up  (build & deploy current directory)
make railway-logs      # tail service logs
```

## Useful Make targets

```bash
make help              # List all targets
make dev               # Full local dev environment
make build             # Build Go binary + frontend assets
make test              # Run Go tests
make production        # Optimized production build
make railway-up        # Deploy to the linked Railway service
```

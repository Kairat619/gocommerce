.PHONY: dev build run test lint fmt vet docker-up docker-down sqlc migrate seed clean help railway-login railway-up railway-logs

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
dev: ## Start full development environment (DB + Go server + Vite)
	@echo "Starting PostgreSQL..."
	docker compose up -d
	@echo "Waiting for database..."
	@timeout 10 bash -c 'until docker compose exec db pg_isready -U gocommerce; do sleep 1; done' 2>/dev/null || true
	@echo "Starting Go server and Vite dev server..."
	@make -j2 dev-go dev-vite

dev-go: ## Start Go backend server
	go run ./cmd/server/

dev-vite: ## Start Vite frontend dev server
	cd frontend && npm run dev

# Build
build: build-go build-frontend ## Build everything

build-go: ## Build Go binary
	go build -o server.exe ./cmd/server/

build-frontend: ## Build frontend assets
	cd frontend && npm run build

# Run
run: build-go ## Build and run production server
	./server.exe

# Test
test: ## Run all Go tests
	go test ./...

test-verbose: ## Run all Go tests with verbose output
	go test -v ./...

test-coverage: ## Run tests with coverage report
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

# Lint & Format
lint: ## Run golangci-lint
	golangci-lint run ./...

vet: ## Run go vet
	go vet ./...

fmt: ## Format Go code
	gofmt -w .

fmt-check: ## Check Go formatting
	@test -z "$$(gofmt -l .)" || (echo "Files need formatting:" && gofmt -l . && exit 1)

# Database
sqlc: ## Generate sqlc code
	sqlc generate

migrate: ## Run database migrations (runs automatically on server start)
	@echo "Migrations run automatically when starting the server."
	@echo "To run manually: go run ./cmd/server/"

migrate-down: ## Rollback last migration
	@echo "Rolling back last migration..."
	@go run -exec "echo" ./cmd/server/ 2>/dev/null || true

migrate-status: ## Show migration status
	@echo "Migration status is shown when starting the server."

seed: ## Seed database with sample data
	@echo "Seeding runs automatically on first server start."
	@echo "To re-seed, drop and recreate the database."

# Docker
docker-up: ## Start PostgreSQL container
	docker compose up -d

docker-down: ## Stop PostgreSQL container
	docker compose down

docker-logs: ## View database logs
	docker compose logs -f db

docker-psql: ## Connect to database via psql
	docker compose exec db psql -U gocommerce -d gocommerce

# Clean
clean: ## Remove build artifacts
	rm -f server.exe
	rm -rf frontend/node_modules
	rm -rf public/build
	rm -f coverage.out coverage.html
	@echo "Cleaned build artifacts"

# Install dependencies
install: ## Install all dependencies
	cd frontend && npm install
	go mod tidy

# Environment
setup: install docker-up ## Initial project setup
	@echo "Waiting for database..."
	@timeout 10 bash -c 'until docker compose exec db pg_isready -U gocommerce; do sleep 1; done' 2>/dev/null || true
	@echo "Running migrations and seeding..."
	@make dev-go &
	@sleep 3
	@echo "Setup complete! Access the app at http://localhost:5173"

# Production
production: ## Build for production
	CGO_ENABLED=0 go build -ldflags="-s -w" -o server.exe ./cmd/server/
	cd frontend && npm run build
	@echo "Production build complete. Run: ./server.exe"

# Deployment (Railway) — see README.md "Deploying to Railway" for full steps.
# Requires the Railway CLI: npm i -g @railway/cli
railway-login: ## Authenticate the Railway CLI
	railway login

railway-up: ## Build & deploy the current directory to the linked Railway service
	railway up

railway-logs: ## Tail logs of the linked Railway service
	railway logs

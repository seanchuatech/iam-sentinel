# =============================================================================
# Sentinel IAM — Makefile
# =============================================================================
# Common commands for development, testing, and building.

.PHONY: help dev dev-backend dev-frontend docker-up docker-down migrate test test-backend test-frontend build clean

# Default target
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------
docker-up: ## Start PostgreSQL, Redis, DynamoDB (Docker Compose)
	docker compose up -d

docker-down: ## Stop infrastructure containers
	docker compose down

docker-reset: ## Stop infrastructure and delete all data
	docker compose down -v

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------
dev: docker-up dev-backend ## Start everything (infra + backend)

dev-backend: ## Start Go backend with hot reload (requires 'air')
	cd backend && air

dev-backend-basic: ## Start Go backend without hot reload
	cd backend && go run cmd/server/main.go

dev-frontend: ## Start React frontend dev server
	cd frontend && npm run dev

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
migrate: ## Run database migrations
	cd backend && go run cmd/server/main.go --migrate

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------
test: test-backend ## Run all tests

test-backend: ## Run Go backend tests with coverage
	cd backend && go test ./... -v -cover -count=1

test-frontend: ## Run React frontend tests
	cd frontend && npm test

# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------
build: build-backend build-frontend ## Build everything

build-backend: ## Build Go backend binary
	cd backend && CGO_ENABLED=0 go build -o bin/sentinel cmd/server/main.go

build-frontend: ## Build React frontend for production
	cd frontend && npm run build

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
clean: ## Remove build artifacts
	rm -rf backend/bin backend/tmp frontend/dist

lint-backend: ## Run Go linter
	cd backend && golangci-lint run ./...

fmt: ## Format Go code
	cd backend && gofmt -w . && goimports -w .

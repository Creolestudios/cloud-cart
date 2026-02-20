# ============================================================
# CloudCart — Makefile
# Common development and operations commands
# ============================================================

.PHONY: help up down build restart logs test lint scan clean

# Default target
help: ## Show this help message
	@echo "╔══════════════════════════════════════════════════════╗"
	@echo "║           CloudCart — DevOps Commands               ║"
	@echo "╚══════════════════════════════════════════════════════╝"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker Compose ───────────────────────────────────────────

up: ## Start all services in detached mode
	docker compose up -d --build

up-monitoring: ## Start services with monitoring stack
	docker compose --profile monitoring up -d --build

down: ## Stop all services and remove containers
	docker compose down

down-clean: ## Stop all services, remove containers, volumes, and images
	docker compose down -v --rmi local

restart: ## Restart all services
	docker compose restart

build: ## Build all Docker images
	docker compose build --no-cache

logs: ## View logs from all services (follow mode)
	docker compose logs -f

logs-auth: ## View auth service logs
	docker compose logs -f auth-service

logs-products: ## View product service logs
	docker compose logs -f product-service

logs-orders: ## View order service logs
	docker compose logs -f order-service

logs-gateway: ## View API gateway logs
	docker compose logs -f api-gateway

ps: ## Show running containers
	docker compose ps

# ── Testing ──────────────────────────────────────────────────

test: test-auth test-products test-orders ## Run all tests

test-auth: ## Run auth service tests
	docker compose exec auth-service npm test

test-products: ## Run product service tests
	docker compose exec product-service pytest -v

test-orders: ## Run order service tests
	docker compose exec order-service npm test

test-integration: ## Run integration tests
	docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit --build

# ── Code Quality ─────────────────────────────────────────────

lint: ## Run linters on all services
	@echo "🔍 Linting Auth Service..."
	cd services/auth-service && npm run lint
	@echo "🔍 Linting Product Service..."
	cd services/product-service && python -m flake8 app/
	@echo "🔍 Linting Order Service..."
	cd services/order-service && npm run lint

format: ## Format code in all services
	@echo "✨ Formatting Auth Service..."
	cd services/auth-service && npm run format
	@echo "✨ Formatting Product Service..."
	cd services/product-service && python -m black app/
	@echo "✨ Formatting Order Service..."
	cd services/order-service && npm run format

# ── Security ─────────────────────────────────────────────────

scan: ## Run security scans on all Docker images
	@echo "🔒 Scanning Docker images with Trivy..."
	trivy image cloudcart-auth-service:latest
	trivy image cloudcart-product-service:latest
	trivy image cloudcart-order-service:latest

scan-deps: ## Scan dependencies for vulnerabilities
	@echo "🔒 Scanning Node.js dependencies..."
	cd services/auth-service && npm audit
	cd services/order-service && npm audit
	@echo "🔒 Scanning Python dependencies..."
	cd services/product-service && pip-audit

# ── Database ─────────────────────────────────────────────────

db-migrate: ## Run database migrations
	docker compose exec product-service alembic upgrade head

db-seed: ## Seed databases with sample data
	docker compose exec product-service python -m app.seeds
	docker compose exec auth-service node scripts/seed.js

db-reset: ## Reset all databases
	docker compose down -v
	docker compose up -d postgres mongodb
	sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed

# ── Infrastructure ───────────────────────────────────────────

tf-init: ## Initialize Terraform
	cd infrastructure/terraform/environments/dev && terraform init

tf-plan: ## Plan Terraform changes
	cd infrastructure/terraform/environments/dev && terraform plan -out=tfplan

tf-apply: ## Apply Terraform changes
	cd infrastructure/terraform/environments/dev && terraform apply tfplan

tf-destroy: ## Destroy Terraform infrastructure
	cd infrastructure/terraform/environments/dev && terraform destroy

# ── Kubernetes ───────────────────────────────────────────────

k8s-apply-dev: ## Apply Kubernetes manifests (dev)
	kubectl apply -k infrastructure/kubernetes/kustomize/overlays/dev

k8s-apply-prod: ## Apply Kubernetes manifests (prod)
	kubectl apply -k infrastructure/kubernetes/kustomize/overlays/prod

helm-install: ## Install Helm charts
	helm install cloudcart infrastructure/kubernetes/helm-charts/cloudcart \
		-f infrastructure/kubernetes/helm-charts/cloudcart/values.yaml

helm-upgrade: ## Upgrade Helm release
	helm upgrade cloudcart infrastructure/kubernetes/helm-charts/cloudcart \
		-f infrastructure/kubernetes/helm-charts/cloudcart/values.yaml

# ── Cleanup ──────────────────────────────────────────────────

clean: ## Remove all build artifacts and temporary files
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	@echo "🧹 Cleaned up all build artifacts"

prune: ## Remove unused Docker resources
	docker system prune -af --volumes

<p align="center">
  <img src="https://img.shields.io/badge/Cloud-Native-6C63FF?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Microservices-Architecture-00D9FF?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/DevOps-Best_Practices-00E676?style=for-the-badge&logoColor=white" />
</p>

<h1 align="center">☁️ CloudCart</h1>

<p align="center">
  <strong>A production-grade, cloud-native microservices e-commerce platform<br/>
  demonstrating modern DevOps best practices end-to-end.</strong>
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="CI/CD" />
  <img src="https://img.shields.io/badge/Security-Trivy_%2B_CodeQL-4B275F?logo=trivy&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white" alt="K8s" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/Monitoring-Prometheus_%2B_Grafana-E6522C?logo=prometheus&logoColor=white" alt="Monitoring" />
</p>

<br/>

---

## 📖 About The Project

**CloudCart** is a fully containerized, microservices-based e-commerce platform engineered to showcase **real-world DevOps best practices** — from source code all the way to production infrastructure. It is **not** a simple demo; every layer reflects how modern teams ship, monitor, and secure cloud-native software at scale.

### What This Project Demonstrates

- **Microservices Architecture** — Four independently deployable services (API Gateway, Auth, Products, Orders) communicating via REST and async event-driven messaging through RabbitMQ.
- **Polyglot Stack** — Node.js/Express for Auth & Orders, Python/FastAPI for Products — proving that each service can use the best tool for the job.
- **Multi-Database Strategy** — PostgreSQL for relational product data, MongoDB for document-oriented user and order data, Redis for caching and JWT blacklisting.
- **Full CI/CD Pipeline** — GitHub Actions workflows that lint, test (with real service containers), build multi-platform Docker images, scan for vulnerabilities, and deploy through staging to production.
- **Infrastructure as Code** — Terraform modules for AWS (VPC with 3-AZ networking, EKS Kubernetes cluster, RDS PostgreSQL) with environment separation and remote state.
- **Kubernetes-Ready** — Production manifests with Deployments, HPA auto-scaling, Pod Disruption Budgets, Network Policies (zero-trust), startup/readiness/liveness probes, and Kustomize overlays for dev vs prod.
- **Observability Stack** — Prometheus metrics scraping, pre-built Grafana dashboards, Loki centralized logging, and AlertManager with severity-based routing.
- **Security at Every Layer** — Non-root containers, multi-stage Docker builds, Helmet.js security headers, rate limiting, JWT with token blacklisting, RBAC, Trivy image scanning, CodeQL SAST, and secret detection in CI.

### Who Is This For?

| Audience | Value |
|----------|-------|
| **DevOps Engineers** | Reference architecture covering containerization, IaC, CI/CD, monitoring, and security end-to-end |
| **Backend Developers** | Clean microservices code with proper error handling, validation, logging, and inter-service communication patterns |
| **Students & Learners** | Learn how real-world DevOps practices connect — from a `git push` to a monitored production deployment |
| **Teams & Organizations** | Fork as a starter template and adapt for your own microservices platform |

<br/>

## 📌 Table of Contents

- [About The Project](#-about-the-project)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [DevOps Practices](#-devops-best-practices)
- [Quick Start](#-quick-start)
- [CI/CD Pipeline](#%EF%B8%8F-cicd-pipeline)
- [Monitoring & Observability](#-monitoring--observability)
- [Infrastructure as Code](#-infrastructure-as-code)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)


<br/>

## 🏛️ Architecture Overview

```
                 ┌───────────────────────────────────────────────────────────────┐
                 │                    MONITORING LAYER                           │
                 │     Prometheus  ·  Grafana  ·  Loki  ·  AlertManager         │
                 └────────────────────────────┬──────────────────────────────────┘
                                              │  scrapes metrics
                                              ▼
┌─────────┐    ┌────────────────┐    ┌────────────────────────────────────────┐
│         │    │                │    │            SERVICE LAYER               │
│ Client  │───▶│  API Gateway   │───▶│                                        │
│(Browser)│    │   (Nginx)      │    │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│         │    │  Rate Limiting  │    │  │   Auth   │ │ Product  │ │ Order  │ │
│         │    │  SSL / Headers  │    │  │ Service  │ │ Service  │ │Service │ │
└─────────┘    └────────────────┘    │  │ (Node.js)│ │ (FastAPI)│ │(Node.js│ │
                                     │  │ Port:4001│ │ Port:4002│ │Port:4003 │
                                     │  └────┬─────┘ └────┬─────┘ └───┬────┘ │
                                     └───────┼────────────┼───────────┼──────┘
                                             │            │           │
               ┌─────────────────────────────┼────────────┼───────────┼──────┐
               │                      DATA LAYER          │           │      │
               │  ┌──────────┐   ┌──────────┐  ┌─────────┐  ┌──────┐       │
               │  │  Redis   │   │ MongoDB  │  │PostgreSQL│  │Rabbit│       │
               │  │ (Cache)  │   │(Auth/Ord)│  │(Products)│  │  MQ  │       │
               │  └──────────┘   └──────────┘  └──────────┘  └──────┘       │
               └────────────────────────────────────────────────────────────┘
```

<br/>

## 🧰 Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td><strong>🌐 Gateway</strong></td>
    <td><img src="https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white" /></td>
    <td>Reverse proxy, rate limiting, load balancing, security headers</td>
  </tr>
  <tr>
    <td><strong>🔐 Auth</strong></td>
    <td><img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" /></td>
    <td>JWT auth, RBAC, token blacklisting, password hashing</td>
  </tr>
  <tr>
    <td><strong>📦 Products</strong></td>
    <td><img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" /></td>
    <td>Product catalog CRUD, filtering, pagination, categories</td>
  </tr>
  <tr>
    <td><strong>🛒 Orders</strong></td>
    <td><img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" /></td>
    <td>Order lifecycle, status transitions, analytics</td>
  </tr>
  <tr>
    <td><strong>🗄 Databases</strong></td>
    <td><img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" /> <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" /></td>
    <td>Relational (products) + Document (users, orders)</td>
  </tr>
  <tr>
    <td><strong>📨 Messaging</strong></td>
    <td><img src="https://img.shields.io/badge/RabbitMQ-FF6600?logo=rabbitmq&logoColor=white" /></td>
    <td>Event-driven async communication between services</td>
  </tr>
  <tr>
    <td><strong>⚡ Cache</strong></td>
    <td><img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" /></td>
    <td>Response caching, session store, JWT blacklist</td>
  </tr>
  <tr>
    <td><strong>📊 Monitoring</strong></td>
    <td><img src="https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white" /> <img src="https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white" /></td>
    <td>Metrics collection, dashboards, alerting</td>
  </tr>
  <tr>
    <td><strong>📝 Logging</strong></td>
    <td><img src="https://img.shields.io/badge/Loki-F46800?logo=grafana&logoColor=white" /></td>
    <td>Centralized log aggregation with Promtail</td>
  </tr>
  <tr>
    <td><strong>🏗 IaC</strong></td>
    <td><img src="https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white" /></td>
    <td>AWS infrastructure (VPC, EKS, RDS)</td>
  </tr>
  <tr>
    <td><strong>☸ Orchestration</strong></td>
    <td><img src="https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white" /> <img src="https://img.shields.io/badge/Kustomize-326CE5?logo=kubernetes&logoColor=white" /></td>
    <td>Container orchestration with environment overlays</td>
  </tr>
  <tr>
    <td><strong>⚙ CI/CD</strong></td>
    <td><img src="https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white" /></td>
    <td>Automated lint → test → build → scan → deploy</td>
  </tr>
</table>

<br/>

## 📂 Project Structure

```
cloudcart/
│
├── 📁 services/                         # Microservices
│   ├── api-gateway/                     #   ↳ Nginx reverse proxy & load balancer
│   │   ├── Dockerfile
│   │   └── nginx.conf                   #     Rate limiting, security headers, routing
│   │
│   ├── auth-service/                    #   ↳ Authentication & Authorization
│   │   ├── Dockerfile                   #     Multi-stage (dev + prod)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── server.js                #     Graceful shutdown, signal handling
│   │   │   ├── app.js                   #     Express + Helmet + CORS + Rate Limit
│   │   │   ├── config/                  #     MongoDB, RabbitMQ, Redis connections
│   │   │   ├── controllers/             #     Register, Login, Refresh, Token validation
│   │   │   ├── middleware/              #     JWT auth, RBAC, metrics, error handler
│   │   │   ├── models/                  #     User model with bcrypt hashing
│   │   │   ├── routes/                  #     Express-validator input validation
│   │   │   └── utils/                   #     Winston structured logging
│   │   └── tests/                       #     Jest unit tests
│   │
│   ├── product-service/                 #   ↳ Product Catalog (Python)
│   │   ├── Dockerfile                   #     Multi-stage (dev + prod)
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                  #     FastAPI + Prometheus instrumentation
│   │       ├── config.py                #     Pydantic settings
│   │       ├── database.py              #     Async SQLAlchemy with connection pooling
│   │       ├── models.py                #     UUID PKs, constraints, composite indexes
│   │       ├── schemas.py               #     Pydantic v2 validation schemas
│   │       ├── routers/                 #     Products & Categories CRUD
│   │       └── utils/                   #     Structlog JSON logging
│   │
│   └── order-service/                   #   ↳ Order Management
│       ├── Dockerfile                   #     Multi-stage (dev + prod)
│       ├── package.json
│       └── src/
│           ├── server.js                #     Event consumer, graceful shutdown
│           ├── app.js                   #     Express app
│           ├── config/                  #     MongoDB, RabbitMQ connections
│           ├── controllers/             #     CRUD, status transitions, analytics
│           ├── middleware/              #     Metrics, validation, error handling
│           ├── models/                  #     Order with status history tracking
│           ├── routes/                  #     RESTful order routes
│           └── utils/                   #     Winston logger
│
├── 📁 frontend/                         # Dashboard UI
│   ├── Dockerfile                       #   Multi-stage (Vite dev → Nginx prod)
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js                      #   Service health monitoring dashboard
│       └── style.css                    #   Dark theme with glassmorphism
│
├── 📁 infrastructure/
│   ├── terraform/                       # AWS Infrastructure as Code
│   │   ├── backend.tf                   #   S3 remote state configuration
│   │   ├── modules/
│   │   │   ├── vpc/main.tf              #   3-AZ VPC, public/private subnets, NAT
│   │   │   ├── eks/main.tf              #   EKS cluster, managed node groups, IAM
│   │   │   └── rds/main.tf              #   PostgreSQL, encryption, multi-AZ
│   │   └── environments/
│   │       └── dev/main.tf              #   Dev environment orchestration
│   │
│   └── kubernetes/                      # Container Orchestration
│       ├── manifests/                   #   Raw K8s resources
│       │   ├── namespace.yml
│       │   ├── config.yml               #   ConfigMaps & Secrets
│       │   ├── auth-service.yml         #   Deployment, SVC, HPA, PDB
│       │   ├── product-service.yml      #   Deployment, SVC, HPA
│       │   ├── order-service.yml        #   Deployment, SVC, HPA
│       │   └── network-policies.yml     #   Zero-trust pod security
│       └── kustomize/
│           ├── base/                    #   Base kustomization
│           └── overlays/
│               ├── dev/                 #   1 replica, low resources
│               └── prod/               #   3 replicas, high resources
│
├── 📁 monitoring/                       # Observability Stack
│   ├── prometheus/
│   │   ├── prometheus.yml               #   Scrape configs for all services
│   │   └── rules/alerts.yml             #   Error rate, latency, health alerts
│   ├── grafana/
│   │   ├── provisioning/                #   Auto-provisioned datasources
│   │   └── dashboards/                  #   Pre-built service overview dashboard
│   ├── loki/
│   │   ├── loki-config.yml              #   Log aggregation config
│   │   └── promtail-config.yml          #   Docker log collector
│   └── alertmanager/
│       └── alertmanager.yml             #   Severity-based alert routing
│
├── 📁 scripts/
│   └── init-db/                         # Database initialization
│       ├── postgres/01-init.sql         #   Extensions, schema setup
│       └── mongo/01-init.js             #   Collections, validators, indexes
│
├── 📁 .github/workflows/               # CI/CD Pipelines
│   ├── ci-cd.yml                        #   Lint → Test → Build → Scan → Deploy
│   └── security.yml                     #   CodeQL, dependency audit, secret scan
│
├── docker-compose.yml                   # Local development stack (all services)
├── Makefile                             # Developer convenience commands
├── .env.example                         # Environment variable template
├── .gitignore                           # Git exclusion rules
├── LICENSE                              # MIT License
└── README.md                            # You are here!
```

<br/>

## ✅ DevOps Best Practices

<details>
<summary><b>🐳 Containerization</b> — Click to expand</summary>

<br/>

| Practice | Details |
|----------|---------|
| **Multi-stage builds** | All Dockerfiles use separate `development` and `production` stages. Dev = hot-reload, Prod = minimal image with compiled assets only |
| **Non-root containers** | Every service creates and runs as a dedicated `appuser` (UID 1001) — never `root` |
| **Health checks** | `HEALTHCHECK` directives in Dockerfiles + K8s `livenessProbe`, `readinessProbe`, `startupProbe` |
| **Minimal base images** | Alpine-based images (Node.js 20-alpine, Python 3.11-slim, Nginx-alpine) |
| **PID 1 handling** | `dumb-init` used as PID 1 in Node.js containers for proper signal forwarding |
| **Layer caching** | `package.json` / `requirements.txt` copied before source code for optimal Docker cache |
| **`.dockerignore`** | Prevents `node_modules`, `.env`, logs from entering build context |

</details>

<details>
<summary><b>⚙️ CI/CD Pipeline</b> — Click to expand</summary>

<br/>

| Stage | Tools | What happens |
|-------|-------|-------------|
| **Lint** | ESLint, Flake8 | Code style & quality checks on every PR |
| **Test** | Jest, Pytest | Unit tests with coverage; runs against real DB containers (MongoDB, PostgreSQL, Redis) |
| **Build** | Docker Buildx | Multi-platform images pushed to GitHub Container Registry (`ghcr.io`) |
| **Scan** | Trivy | Container image vulnerability scanning (CRITICAL + HIGH) |
| **Deploy Staging** | kubectl / Kustomize | Auto-deploy from `develop` branch |
| **Deploy Production** | kubectl / Kustomize | Auto-deploy from `main` branch (requires approval) |

</details>

<details>
<summary><b>🏗️ Infrastructure as Code</b> — Click to expand</summary>

<br/>

| Module | Resources Created |
|--------|------------------|
| **VPC** | VPC, 3 public + 3 private subnets, Internet Gateway, NAT Gateway, route tables |
| **EKS** | Managed Kubernetes cluster, auto-scaling node groups (1–5 nodes), IAM roles, cluster logging |
| **RDS** | PostgreSQL 16, encrypted storage, Performance Insights, multi-AZ (prod), automated backups |

State management uses S3 backend with DynamoDB locking (configured in `backend.tf`).

</details>

<details>
<summary><b>📊 Monitoring & Alerting</b> — Click to expand</summary>

<br/>

| Tool | Role |
|------|------|
| **Prometheus** | Scrapes `/metrics` endpoints (prom-client, prometheus-fastapi-instrumentator) every 10–15s |
| **Grafana** | Pre-provisioned dashboards: request rate, error rate %, P95 latency, memory usage, service health |
| **Loki** | Centralized log aggregation from all Docker containers via Promtail |
| **AlertManager** | Routes alerts by severity — `critical` (immediate) vs `warning` (batched). Supports Slack/PagerDuty |

**Alert Rules:**
- 🔴 Error rate > 5% for 5 min → **critical**
- 🟡 P95 latency > 2s for 5 min → **warning**
- 🔴 Service down > 1 min → **critical**
- 🟡 Memory > 512MB for 10 min → **warning**

</details>

<details>
<summary><b>🔒 Security</b> — Click to expand</summary>

<br/>

| Layer | Implementation |
|-------|---------------|
| **Application** | Helmet.js security headers, CORS, rate limiting, input validation (express-validator, Pydantic) |
| **Authentication** | JWT with access + refresh tokens, bcrypt password hashing (12 rounds), token blacklisting via Redis |
| **Authorization** | Role-based access control (user / admin / moderator) |
| **Container** | Non-root users, minimal base images, Trivy vulnerability scanning |
| **Network** | K8s NetworkPolicies (deny-all default, explicit allow rules) |
| **Secrets** | K8s Secrets (External Secrets Operator ready), never in code |
| **CI/CD** | CodeQL SAST, TruffleHog secret detection, `npm audit` / `pip-audit` |
| **Gateway** | Security headers (HSTS, CSP, X-Frame-Options), request size limits, connection limits |

</details>

<details>
<summary><b>☸️ Kubernetes</b> — Click to expand</summary>

<br/>

| Resource | Configuration |
|----------|--------------|
| **Deployments** | Rolling updates (`maxSurge: 1, maxUnavailable: 0`), topology spread constraints |
| **HPA** | Auto-scaling at 70% CPU / 80% memory utilization (2–10 replicas) |
| **PDB** | `minAvailable: 1` ensures availability during cluster upgrades |
| **Probes** | Startup → Readiness → Liveness chain with proper timing |
| **Resources** | CPU/memory requests and limits on all containers |
| **Network Policies** | Zero-trust: deny all ingress by default, selective allowlisting |
| **Kustomize** | Dev overlay (1 replica, 64Mi) vs Prod overlay (3 replicas, 256Mi) |

</details>

<br/>

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Docker + Docker Compose | v2+ | ✅ Yes |
| Node.js | 20+ | 🔧 Local dev only |
| Python | 3.11+ | 🔧 Local dev only |
| Make | any | 📝 Optional |
| Terraform | 1.7+ | 🏗 IaC only |
| kubectl | 1.28+ | ☸ K8s only |

### Step 1 — Clone & Configure

```bash
git clone https://github.com/your-org/cloudcart.git
cd cloudcart
cp .env.example .env
```

### Step 2 — Start All Services

```bash
# 🐳 Using Make (recommended)
make up

# Or directly with Docker Compose
docker compose up -d --build
```

### Step 3 — Verify Services

```bash
# Check all containers are healthy
docker compose ps

# Or use Make
make ps
```

### Step 4 — Access the Platform

| Service | URL | Credentials |
|---------|-----|-------------|
| 🖥 **Frontend Dashboard** | [`localhost:3000`](http://localhost:3000) | — |
| 🌐 **API Gateway** | [`localhost:80`](http://localhost:80) | — |
| 🔐 **Auth API** | [`localhost:4001`](http://localhost:4001/health) | — |
| 📦 **Product API** | [`localhost:4002/docs`](http://localhost:4002/docs) | — |
| 🛒 **Order API** | [`localhost:4003`](http://localhost:4003/health) | — |
| 📊 **Grafana** | [`localhost:3001`](http://localhost:3001) | `admin` / `admin` |
| 📈 **Prometheus** | [`localhost:9090`](http://localhost:9090) | — |
| 📨 **RabbitMQ** | [`localhost:15672`](http://localhost:15672) | `guest` / `guest` |

> 💡 **Tip:** Start the monitoring stack with `docker compose --profile monitoring up -d`

### Step 5 — Run Tests

```bash
make test            # Run all service tests
make test-auth       # Auth service only
make test-products   # Product service only
make test-orders     # Order service only
```

### Step 6 — Stop Everything

```bash
make down            # Stop and remove containers
make down-clean      # Also remove volumes and images
```

<br/>

## ⚙️ CI/CD Pipeline

```
  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────────┐    ┌──────────┐
  │      │    │      │    │      │    │      │    │      │    │          │    │          │
  │ 📝   │───▶│ 🔍   │───▶│ 🧪   │───▶│ 🐳   │───▶│ 🔒   │───▶│ 🚀       │───▶│ 📊       │
  │Commit│    │ Lint  │    │ Test  │    │Build │    │ Scan  │    │ Deploy   │    │ Monitor  │
  │      │    │      │    │      │    │      │    │      │    │          │    │          │
  └──────┘    └──────┘    └──────┘    └──────┘    └──────┘    └──────────┘    └──────────┘
                │              │           │           │            │
           ESLint         Jest        Docker       Trivy      Staging ──▶ Production
           Flake8        Pytest      Buildx      CodeQL      (develop)     (main)
```

**Trigger Rules:**
- `push` to `main` or `develop` → Full pipeline
- `pull_request` to `main` → Build + test (no deploy)
- Weekly schedule → Security scanning (CodeQL, dependency audit, secret detection)

<br/>

## 📊 Monitoring & Observability

### Pre-built Grafana Dashboard Panels

| Panel | Metric | Source |
|-------|--------|--------|
| 📈 Request Rate | `sum(rate(http_requests_total[5m]))` | per service |
| 🔴 Error Rate (%) | `5xx / total * 100` | per service |
| ⏱ P95 Latency | `histogram_quantile(0.95, ...)` | per service |
| 💾 Memory Usage | `process_resident_memory_bytes` | per service |
| 💚 Service Health | `up{job="..."}` | all services |

### Alert Routing

```
Alert Fired
    │
    ├── severity: critical ──▶ #alerts-critical (Slack) ──▶ PagerDuty
    │                           group_wait: 10s
    │
    └── severity: warning  ──▶ #alerts-warning (Slack)
                                group_wait: 30s, repeat: 4h
```

<br/>

## 🏗 Infrastructure as Code

### Terraform Module Architecture

```
infrastructure/terraform/
    │
    ├── backend.tf                    # S3 + DynamoDB state management
    │
    ├── modules/
    │   ├── vpc/      ──▶  VPC, 6 subnets (3 public + 3 private), IGW, NAT, routes
    │   ├── eks/      ──▶  EKS cluster, managed nodes (t3.medium), IAM, logging
    │   └── rds/      ──▶  PostgreSQL 16, gp3 storage, encryption, perf insights
    │
    └── environments/
        ├── dev/      ──▶  t3.medium × 2, db.t3.micro, single NAT
        └── prod/     ──▶  t3.large × 3, db.r6g.large, multi-AZ, deletion protection
```

```bash
# Deploy infrastructure
make tf-init       # Initialize Terraform
make tf-plan       # Preview changes
make tf-apply      # Apply changes
make tf-destroy    # Tear down (dev only!)
```

<br/>

## 🔐 Security

### Defense in Depth

```
  Internet
     │
     ▼
  ┌─────────────────────┐
  │  API Gateway        │  Rate limiting, security headers, HTTPS
  │  (Nginx)            │  CSP, HSTS, X-Frame-Options
  └─────────┬───────────┘
            ▼
  ┌─────────────────────┐
  │  Application Layer  │  JWT auth, input validation, RBAC
  │  (Express / FastAPI)│  Helmet.js, CORS, request size limits
  └─────────┬───────────┘
            ▼
  ┌─────────────────────┐
  │  Container Layer    │  Non-root users, minimal images
  │  (Docker)           │  Trivy scanning, no secrets in images
  └─────────┬───────────┘
            ▼
  ┌─────────────────────┐
  │  Network Layer      │  K8s NetworkPolicies (zero-trust)
  │  (Kubernetes)       │  Private subnets, security groups
  └─────────┬───────────┘
            ▼
  ┌─────────────────────┐
  │  Data Layer         │  Encryption at rest (RDS, EBS)
  │  (Databases)        │  Auth-required connections, backups
  └─────────────────────┘
```

<br/>

## 🧰 Makefile Commands

```bash
make help              # 📋 Show all available commands

# Development
make up                # 🟢 Start all services
make up-monitoring     # 🟢 Start with monitoring stack
make down              # 🔴 Stop all services
make down-clean        # 🔴 Stop + remove volumes & images
make restart           # 🔄 Restart all services
make logs              # 📜 Tail all service logs
make ps                # 📋 List running containers

# Testing
make test              # 🧪 Run all tests
make test-auth         # 🧪 Auth service tests
make test-products     # 🧪 Product service tests
make test-orders       # 🧪 Order service tests

# Code Quality
make lint              # 🔍 Run linters
make format            # ✨ Format code

# Security
make scan              # 🔒 Trivy image scanning
make scan-deps         # 🔒 Dependency vulnerability audit

# Database
make db-migrate        # 📦 Run migrations
make db-seed           # 🌱 Seed sample data
make db-reset          # ♻️  Reset databases

# Infrastructure
make tf-init           # 🏗 Initialize Terraform
make tf-plan           # 📋 Plan changes
make tf-apply          # 🚀 Apply changes

# Kubernetes
make k8s-apply-dev     # ☸ Deploy to dev
make k8s-apply-prod    # ☸ Deploy to prod
```

<br/>

## 🤝 Contributing

1. **Fork** the repository
2. **Branch** — `git checkout -b feature/amazing-feature`
3. **Commit** — use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
4. **Push** — `git push origin feature/amazing-feature`
5. **PR** — open a Pull Request with a clear description

> All PRs trigger the CI pipeline automatically. Merging requires passing lint, test, build, and scan stages.

<br/>

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>

---

<p align="center">
  Built with ❤️ using
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white&style=flat-square" />
</p>

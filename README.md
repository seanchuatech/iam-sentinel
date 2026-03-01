# 🛡️ Sentinel — IAM Dashboard & Policy Engine

A full-stack Identity and Access Management (IAM) system inspired by AWS IAM.
Sentinel implements a **Policy-Based Access Control (PBAC)** system with
role-based identity management, featuring a Go policy evaluation engine and a
beautiful React dashboard.

---

## What Is This?

Sentinel is a learning-oriented, production-architected IAM system that
replicates the core concepts of AWS IAM:

- **Users, Groups & Roles** — Identity management with flexible organizational
  structure
- **Policy Engine** — JSON policy documents evaluated with AWS-style
  deny-override logic
- **Policy Simulator** — Interactive tool to test "Can User X do Action Y on
  Resource Z?"
- **API Key Management** — Generate, scope, and revoke programmatic access keys
- **Audit Logging** — Complete trail of every access request and decision
- **Beautiful Dashboard** — Dark-mode React UI for managing everything visually

---

## Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend — Vite + React + TypeScript"]
        UI["Dashboard SPA<br/>(Shadcn/ui + Tailwind)"]
    end

    subgraph Backend["Backend — Go + Chi"]
        API["REST API<br/>(20+ endpoints)"]
        PE["Policy Evaluation Engine<br/>(deny-override logic)"]
        AUTH["JWT Auth Middleware<br/>(RS256)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL 16<br/>Users, Groups, Roles, Policies")]
        RD[("Redis 7<br/>JWT Blacklist, Cache")]
        DDB[("DynamoDB<br/>Audit Logs")]
    end

    UI -->|"HTTPS"| API
    API --> AUTH
    API --> PE
    API --> PG
    API --> RD
    PE --> PG
    API -->|"Append-only writes"| DDB
```

### AWS Deployment Target

```mermaid
graph LR
    subgraph AWS["AWS Infrastructure"]
        CF["CloudFront<br/>(CDN)"] --> S3["S3<br/>(Static Frontend)"]
        ALB["ALB<br/>(Load Balancer)"] --> ECS["ECS Fargate<br/>(Go API)"]
        ECS --> RDS["RDS<br/>(PostgreSQL)"]
        ECS --> EC["ElastiCache<br/>(Redis)"]
        ECS --> DDB2["DynamoDB<br/>(Audit Logs)"]
    end
```

---

## Tech Stack

| Layer          | Technology                   | Purpose                                      |
| -------------- | ---------------------------- | -------------------------------------------- |
| **Backend**    | Go 1.22+                     | High-performance API server                  |
| **Router**     | Chi                          | Lightweight, idiomatic HTTP routing          |
| **Frontend**   | Vite + React 18 + TypeScript | Fast SPA with hot reload                     |
| **UI**         | Shadcn/ui + Tailwind CSS     | Beautiful, accessible components             |
| **Primary DB** | PostgreSQL 16                | Relational data + JSONB for policy documents |
| **Cache**      | Redis 7                      | JWT blacklist, session cache, rate limiting  |
| **Audit**      | DynamoDB                     | High-throughput append-only audit logs       |
| **Auth**       | JWT (RS256)                  | Stateless authentication                     |
| **Containers** | Docker                       | Consistent dev/prod environments             |
| **IaC**        | Terraform                    | AWS infrastructure provisioning              |

---

## Core Concepts

### Policy-Based Access Control (PBAC)

Sentinel uses JSON policy documents — just like AWS IAM — to define permissions:

```json
{
  "Version": "2024-01-01",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["users:List", "users:Get"],
      "Resource": "arn:sentinel:users/*"
    },
    {
      "Effect": "Deny",
      "Action": ["users:Delete"],
      "Resource": "arn:sentinel:users/*"
    }
  ]
}
```

### Deny-Override Evaluation

```
1. Default: DENY (nothing is allowed by default)
2. Gather all policies for the principal (direct + group + role)
3. Any explicit DENY? → DENY ❌ (always wins)
4. Any explicit ALLOW? → ALLOW ✅
5. Otherwise → implicit DENY ❌
```

### Identity Hierarchy

```
Users ─── belong to ───→ Groups
  │                         │
  └── can assume ──→ Roles  │
                      │     │
                      ▼     ▼
              Policies attached to any of these
```

---

## Project Structure

```
iam-sentinel/
├── backend/                    # Go API service
│   ├── cmd/server/             # Application entry point
│   └── internal/
│       ├── config/             # Environment configuration
│       ├── database/           # DB connections & migrations
│       ├── engine/             # Policy evaluation engine (core!)
│       ├── handlers/           # HTTP request handlers
│       ├── middleware/         # Auth, RBAC, logging, CORS
│       ├── models/             # Domain models
│       ├── repository/         # Data access layer
│       └── service/            # Business logic
├── frontend/                   # React SPA
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── lib/                # API client, auth context
│       └── pages/              # Dashboard pages
├── deployments/                # Docker & Terraform
│   ├── docker/                 # Dockerfiles
│   └── terraform/              # AWS infrastructure as code
├── docker-compose.yml          # Local dev environment
├── Makefile                    # Dev commands
├── IMPLEMENTATION_PLAN.md      # Detailed build plan
└── VOCABULARY.md               # IAM terminology guide
```

---

## API Overview

| Domain        | Endpoints                                        | Description                          |
| ------------- | ------------------------------------------------ | ------------------------------------ |
| **Auth**      | `POST /auth/register, /login, /refresh, /logout` | User authentication & JWT management |
| **Users**     | `CRUD /users`, `POST /users/:id/policies`        | User management & policy attachment  |
| **Groups**    | `CRUD /groups`, `POST /groups/:id/users`         | Group management & membership        |
| **Roles**     | `CRUD /roles`, `POST /roles/:id/assume`          | Role management & assumption         |
| **Policies**  | `CRUD /policies`                                 | Policy document management           |
| **Simulator** | `POST /simulate`                                 | Interactive policy evaluation        |
| **API Keys**  | `GET/POST/DELETE /api-keys`                      | Programmatic access management       |
| **Audit**     | `GET /audit-logs`                                | Access request history               |

All endpoints are prefixed with `/api/v1/`.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool               | Version | Check Command            |
| ------------------ | ------- | ------------------------ |
| **Go**             | 1.22+   | `go version`             |
| **Node.js**        | 20+     | `node --version`         |
| **npm**            | 10+     | `npm --version`          |
| **Docker**         | 24+     | `docker --version`       |
| **Docker Compose** | 2.x     | `docker compose version` |
| **Make**           | any     | `make --version`         |

### 1. Clone the Repository

```bash
git clone https://github.com/seanchuatech/iam-sentinel.git
cd iam-sentinel
```

### 2. Set Up Environment Variables

```bash
# The backend comes with a .env file for local dev.
# Review and customize if needed:
cat backend/.env

# If .env is missing, copy from the example:
cp backend/.env.example backend/.env
```

### 3. Start Infrastructure (Docker)

This starts PostgreSQL, Redis, and DynamoDB Local in Docker containers:

```bash
docker compose up -d
```

Verify all containers are healthy:

```bash
docker compose ps
```

You should see:

```
sentinel-postgres   running (healthy)
sentinel-redis      running (healthy)
sentinel-dynamodb   running
```

### 4. Install Dependencies

```bash
# Backend (Go modules)
cd backend && go mod download && cd ..

# Frontend (npm packages)
cd frontend && npm install && cd ..
```

### 5. Start the Backend

```bash
# Without hot reload
make dev-backend-basic

# With hot reload (requires 'air' — install via: go install github.com/air-verse/air@latest)
make dev-backend
```

The API server starts at **http://localhost:8080**. Verify it's running:

```bash
# Liveness check
curl http://localhost:8080/healthz
# → {"status":"ok"}

# Readiness check (verifies DB + Redis connections)
curl http://localhost:8080/readyz
# → {"status":"ready"}

# API version
curl http://localhost:8080/api/v1/
# → {"service":"sentinel","version":"0.1.0"}
```

### 6. Start the Frontend

In a separate terminal:

```bash
make dev-frontend
```

The dashboard opens at **http://localhost:5173**. API requests are automatically
proxied to the Go backend.

### Available Make Commands

```bash
make help              # Show all available commands
```

| Command                  | Description                            |
| ------------------------ | -------------------------------------- |
| `make dev`               | Start infrastructure + backend         |
| `make dev-backend`       | Start Go backend with hot reload (air) |
| `make dev-backend-basic` | Start Go backend without hot reload    |
| `make dev-frontend`      | Start React frontend dev server        |
| `make docker-up`         | Start Docker containers                |
| `make docker-down`       | Stop Docker containers                 |
| `make docker-reset`      | Stop containers + delete all data      |
| `make test`              | Run all tests                          |
| `make test-backend`      | Run Go tests with coverage             |
| `make build`             | Build backend binary + frontend bundle |
| `make clean`             | Remove build artifacts                 |

### Troubleshooting

**Port already in use:**

```bash
# Check what's using a port
lsof -i :8080   # Backend
lsof -i :5432   # PostgreSQL
lsof -i :5173   # Frontend
```

**Database connection refused:**

```bash
# Make sure Docker containers are running
docker compose ps

# Restart if needed
docker compose down && docker compose up -d
```

**Reset everything (nuclear option):**

```bash
# Stops all containers, deletes volumes (all data), rebuilds
make docker-reset && make docker-up
```

### Running Tests

```bash
# Backend tests
make test-backend

# Frontend tests
make test-frontend

# All tests
make test
```

---

## Documentation

| Document                                           | Description                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Detailed technical plan with phase-by-phase breakdown                   |
| [VOCABULARY.md](./VOCABULARY.md)                   | IAM terminology, access control models, and policy evaluation reference |

---

## License

MIT

<div align="center">

# 🛰️ NovaFleet

### Command Your Fleet Across the Cosmos

**A smart, real-time transport operations platform that replaces spreadsheets and logbooks with a rule-enforced, AI-assisted mission control center for logistics fleets.**

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows)
[![CD](https://img.shields.io/badge/CD-Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](./Jenkinsfile)
[![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](./kubernetes)
[![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./Dockerfile)
[![Next.js](https://img.shields.io/badge/Framework-Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](./prisma)
[![Groq](https://img.shields.io/badge/AI-Groq_API-F55036?style=for-the-badge&logo=lightning&logoColor=white)](#-ai-reporting-with-groq)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## 📖 Table of Contents

1. [About NovaFleet](#-about-novafleet)
2. [The Problem We're Solving](#-the-problem-were-solving)
3. [Key Features](#-key-features)
4. [Role-Based Command Decks](#-role-based-command-decks)
5. [AI Reporting with Groq](#-ai-reporting-with-groq)
6. [Tech Stack](#-tech-stack)
7. [System Architecture](#-system-architecture)
8. [Database Schema](#-database-schema)
9. [Getting Started (Local Setup)](#-getting-started-local-setup)
10. [Environment Variables](#-environment-variables)
11. [Containerization with Docker](#-containerization-with-docker)
12. [CI/CD Pipeline](#-cicd-pipeline)
13. [Kubernetes Deployment](#-kubernetes-deployment)
14. [Code Quality & Security](#-code-quality--security)
15. [Project Structure](#-project-structure)
16. [Branching Strategy](#-branching-strategy)
17. [Roadmap](#-roadmap)
18. [Contributors](#-contributors)
19. [License](#-license)

---

## 🌌 About NovaFleet

**NovaFleet** is an end-to-end transport operations platform built to digitize the complete lifecycle of a logistics fleet — vehicle registration, driver management, trip dispatching, maintenance workflows, fuel/expense tracking, and AI-narrated operational analytics — all behind a single, role-based, real-time cockpit.

It was built to solve a problem that's still shockingly common in logistics companies of every size: **fleets are run on spreadsheets.** That means scheduling conflicts, underutilized vehicles, missed maintenance windows, drivers dispatched with expired licenses, inaccurate expense tracking, and zero real operational visibility for the people who actually need it — fleet managers, drivers, safety officers, and finance teams.

NovaFleet replaces all of that with one system of record, enforced by a server-side business rule engine that no dashboard can bypass, wrapped in a mission-control-themed interface that makes dense operational data genuinely pleasant to read.

## 🎯 The Problem We're Solving

> *"Many logistics companies still rely on spreadsheets and manual logbooks to manage their transport operations. This often leads to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, inaccurate expense tracking, and poor operational visibility."*

NovaFleet directly targets each of these failure points:

| Spreadsheet-Era Problem | NovaFleet Solution |
|---|---|
| Double-booked vehicles/drivers | Server-enforced status locks — a vehicle or driver already `On Trip` cannot be assigned again |
| Overloaded vehicles | Cargo weight is validated against max load capacity before dispatch is ever allowed |
| Drivers dispatched with expired licenses | License expiry is checked at dispatch time, not just displayed on a report |
| Missed maintenance | Opening a maintenance record automatically pulls a vehicle out of the dispatch pool |
| No visibility into true operating cost | Fuel + maintenance + expenses roll up automatically per vehicle, with live ROI calculation |
| No audit trail | Every state transition is logged; an Admin approval workflow governs sensitive document submissions |


## ✨ Key Features

- 🔐 **Secure Authentication & RBAC** — email/password login (Auth.js), five distinct roles, middleware-enforced route protection
- 🚚 **Vehicle Registry** — unique registration numbers, load capacity, odometer, acquisition cost, lifecycle status
- 🧑✈️ **Driver Management** — license tracking, safety scores, contact info, availability status
- 🗺️ **Trip Management** — full `Draft → Dispatched → Completed → Cancelled` lifecycle with hard validation at every transition
- 🔧 **Maintenance Workflow** — opening a maintenance log automatically removes a vehicle from the dispatch pool; closing it restores availability
- ⛽ **Fuel & Expense Tracking** — per-trip fuel logs, tolls, and miscellaneous costs, auto-aggregated into total operational cost
- 📊 **Live KPI Dashboards** — fleet utilization, active/available vehicles, drivers on duty, and more, filterable by type/status/region
- 🧠 **AI-Narrated Reports** — Groq-powered executive summaries built strictly on top of real, backend-computed metrics (see [AI Reporting](#-ai-reporting-with-groq))
- 🛡️ **Admin Approval Tower** — a centralized queue for reviewing and approving/rejecting proof documents (licenses, invoices, insurance) submitted by any role
- 🔔 **Real-Time Notifications** — cross-dashboard status sync so a decision made in one deck is instantly visible in another
- 🌗 **Dark Mode First** — a cosmic, black/silver/gold design system built for long shifts in front of a screen
- 📤 **CSV & PDF Export** — every report can be exported for offline review or audit purposes
- 🔍 **Search, Filter & Sort** — across every major table in the platform

## 🧭 Role-Based Command Decks

NovaFleet routes every user straight into a dashboard tailored to their responsibilities — no role ever sees a cluttered, one-size-fits-all screen.

| Deck | Role | What They Do |
|---|---|---|
| 🛰️ **Mission Control** | Fleet Manager | Oversees fleet assets, dispatches trips, manages maintenance, reviews the driver directory with AI-generated summaries |
| 🧑✈️ **Cockpit** | Driver | Creates and dispatches trips, logs fuel/odometer on completion, uploads compliance documents |
| 🛡️ **Watchtower** | Safety Officer | Monitors license validity and safety scores, suspends/reinstates drivers, reviews compliance risk |
| 📊 **Ledger Deck** | Financial Analyst | Reviews operational costs, fuel efficiency, and vehicle ROI; generates AI-narrated financial reports |
| 👑 **The Tower** | Admin | Approves/rejects submitted proof documents, manages users, and reviews the full platform audit log |

Every transition between these decks — a license submitted by a Driver, reviewed by an Admin, and reflected back on the Safety Officer's dashboard — flows through the same server-side rule engine, so the platform behaves identically no matter which door you walked in through.

## 🤖 AI Reporting with Groq

NovaFleet uses the **Groq API** to generate natural-language executive summaries for its reporting suite — but with one non-negotiable design principle:

> **The AI never invents a number.** Every metric in a NovaFleet report — utilization %, fuel efficiency, operational cost, ROI — is computed first, in SQL/TypeScript, from real database records. Groq's only job is to turn those already-correct figures into clear, professional prose. This keeps every report both genuinely AI-powered and 100% numerically accurate under audit.

This pattern powers several features across the platform:
- 📄 **Executive Summary** in the Master Operations Report (Executive Summary, Key Observations, Recommendation)
- 🧑✈️ **Driver AI Summary Cards** on the Fleet Manager's driver directory — a 2–3 sentence profile combining trip history, safety score, and license status
- 🔧 **Maintenance Prioritization** — ranks vehicles most at risk of unplanned downtime with a one-line justification
- 🛡️ **License Expiry Risk Briefings** on the Safety Officer's Watchtower
- ☀️ **"AI Insight of the Day"** — a single-sentence daily highlight on the main dashboard

All Groq calls happen **server-side only** — the API key never reaches the browser bundle — and AI-generated text is cached (`ai_summary` + `ai_summary_generated_at`) rather than regenerated on every page load, keeping the platform fast and API-quota-friendly during live use.


## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org) (App Router, TypeScript) — a single deployable app, Route Handlers + Server Actions |
| **UI** | TailwindCSS, shadcn/ui, Recharts, Framer Motion |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma |
| **Auth** | Auth.js (NextAuth v5) — Credentials provider, JWT sessions, middleware-based RBAC |
| **AI** | Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) |
| **PDF/CSV Export** | `@react-pdf/renderer`, `json2csv` |
| **Containerization** | Docker (multi-stage build) |
| **CI** | GitHub Actions — lint, type-check, SonarCloud static analysis |
| **CD** | Jenkins — build, push to AWS ECR, deploy to Kubernetes |
| **Orchestration** | Kubernetes — Deployment, Service, HorizontalPodAutoscaler, dedicated Namespace |
| **Registry** | AWS Elastic Container Registry (ECR) |
| **Code Quality** | SonarCloud + CodeAnt AI review |

## 🏗️ System Architecture

```
                    ┌───────────────────────────────────────┐
                    │              NovaFleet                  │
                    │           Next.js 14 App Router          │
                    │  ┌─────────────────┐ ┌────────────────┐ │
                    │  │ app/dashboard/   │ │ app/api/**/     │ │
                    │  │  5 role decks —  │ │ route.ts        │ │
                    │  │  Server + Client │ │ (Route Handlers)│ │
                    │  │  Components      │ │ + Server Actions│ │
                    │  └─────────────────┘ └────────────────┘ │
                    │        Auth.js middleware (RBAC)          │
                    └───────────────────┬───────────────────────┘
                     ┌──────────────────┼───────────────────────┐
                     │                  │                        │
             ┌───────▼──────┐   ┌───────▼──────┐      ┌──────────▼─────────┐
             │ PostgreSQL   │   │ Groq API      │      │ File Storage        │
             │ (Prisma ORM) │   │ (AI report    │      │  licenses, receipts)│
             └──────────────┘   └───────────────┘      └─────────────────────┘

                                        │
                                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  Docker Image → GitHub Actions (CI) → Jenkins (CD)             │
        │  → AWS ECR → Kubernetes (Deployment + Service + HPA)          │
        └──────────────────────────────────────────────────────────────┘
```

**Core design principle:** the database is the single source of truth for every status field. No status is ever changed directly from a client component — it always passes through a server-side rule engine that validates business rules first, so every dashboard is protected identically, and the same guarantee holds whether the app is running locally, in a container, or behind the Kubernetes-managed production service.

## 🗄️ Database Schema

NovaFleet's PostgreSQL schema (managed via Prisma, see [`/prisma/schema.prisma`](./prisma/schema.prisma)) centers on eight core entities:

```
Users ──< Drivers ──< Trips >── Vehicles ──< MaintenanceLogs
                         │            │
                         └──< FuelLogs├──< Expenses
                                       │
                    ProofDocuments (polymorphic: Driver | Vehicle | FuelLog | Expense | Maintenance)
                    DashboardRequests (cross-role status/approval routing)
                    Notifications
                    AuditLogs
```

- **Users** — role, region, credentials
- **Vehicles** — registration number (unique), type, load capacity, odometer, acquisition cost, status
- **Drivers** — license number/category/expiry, safety score, status
- **Trips** — source, destination, cargo weight, planned/actual distance, fuel consumed, lifecycle status
- **MaintenanceLogs / FuelLogs / Expenses** — the cost inputs that roll up into operational cost and ROI
- **ProofDocuments** — the backbone of the Admin approval workflow
- **DashboardRequests / Notifications** — power real-time cross-dashboard status sync
- **AuditLogs** — a full history of every state transition on the platform

Run `npx prisma studio` after setup to explore the live schema visually.


## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (local, Docker, or a hosted instance like Neon/Supabase)
- A [Groq API key](https://console.groq.com)
- npm (or pnpm/yarn if you prefer — adjust commands accordingly)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/novafleet.git
cd novafleet

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then fill in DATABASE_URL, AUTH_SECRET, GROQ_API_KEY, etc. (see below)

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed demo data (5 role accounts + sample fleet data)
npx prisma db seed

# 6. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Demo Accounts (seeded)

| Role | Email | Password |
|---|---|---|
| 🛰️ Fleet Manager | `fleet@nova.app` | `NovaFleet@123` |
| 🧑✈️ Driver | `driver@nova.app` | `NovaFleet@123` |
| 🛡️ Safety Officer | `safety@nova.app` | `NovaFleet@123` |
| 📊 Financial Analyst | `finance@nova.app` | `NovaFleet@123` |
| 👑 Admin | `admin@nova.app` | `NovaFleet@123` |

## 🔑 Environment Variables

See [`.env.example`](./.env.example) for the full list. Core variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/novafleet"

# Auth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AI Reporting
GROQ_API_KEY="your-groq-api-key"

# AWS (used by CI/CD, not required for local dev)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="xxxxxxxxxxxx"
```

> ⚠️ `GROQ_API_KEY` is read **only** on the server (Route Handlers / Server Actions) and is never bundled into client-side JavaScript.


## 🐳 Containerization with Docker

NovaFleet ships with a production-ready [`Dockerfile`](./Dockerfile) using a **multi-stage build** so the final image contains only what's needed to run the app — no dev dependencies, no build tools, no source maps bloating the image.

**How the build is structured:**
1. **Dependencies stage** — installs npm packages in isolation, cached separately so dependency installs aren't repeated on every code change
2. **Build stage** — runs `next build`, producing an optimized, standalone Next.js output
3. **Runtime stage** — copies only the compiled output and production `node_modules` into a slim Node base image, runs as a non-root user, and exposes port `3000`

### Build & run locally

```bash
# Build the image
docker build -t novafleet-app:local .

# Run the container (pass your env file directly)
docker run -p 3000:3000 --env-file .env novafleet-app:local
```

`.dockerignore` excludes `node_modules`, `.next`, `.env`, and local artifacts so the build context stays small and no secrets are ever baked into a layer.

## 🔁 CI/CD Pipeline

NovaFleet uses a **two-stage CI/CD strategy** — GitHub Actions handles continuous integration (fast feedback on every push/PR), and Jenkins handles continuous delivery (building, publishing, and deploying the validated artifact).

### Continuous Integration — GitHub Actions (`.github/workflows/`)

On every push and pull request:
- Installs dependencies and runs type-checking (`tsc --noEmit`)
- Runs linting
- Runs a **SonarCloud** static analysis pass (accessibility, code smells, security hotspots, maintainability) — configured via [`sonar-project.properties`](./sonar-project.properties)
- Blocks merges on failing checks, keeping `main` always in a deployable state

### Continuous Delivery — Jenkins (`Jenkinsfile`)

Once code lands on `main`, the [`Jenkinsfile`](./Jenkinsfile) takes over and drives the release all the way to a running Kubernetes deployment. Here's what each stage does:

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPOSITORY = 'novafleet-app'
        IMAGE_TAG = "${env.BUILD_ID}"
        KUBECONFIG = credentials('kubeconfig-credentials')
    }

    stages {
        stage('Checkout') { ... }        // Pulls the exact commit that triggered the build
        stage('Test') { ... }            // npm install + test suite (wired in as tests are added)
        stage('Build Docker Image') { ... }   // Builds the multi-stage image, tagged with the Jenkins BUILD_ID
        stage('Push to AWS ECR') { ... }      // Authenticates to ECR and pushes both :BUILD_ID and :latest
        stage('Deploy to Kubernetes') { ... } // Injects the new image tag into the manifest and applies it
    }

    post {
        always  { cleanWs() }
        success { echo "Pipeline succeeded! NovaFleet deployed to Staging." }
        failure { echo "Pipeline failed. Check the logs." }
    }
}
```

**Stage-by-stage explanation:**

| Stage | What happens |
|---|---|
| **Checkout** | Jenkins checks out the exact commit from source control (`checkout scm`) — guarantees the pipeline builds precisely what was merged, not a stale working copy |
| **Test** | Installs dependencies (`npm install`); the test-run line is scaffolded and ready to be uncommented once the test suite is in place, so the pipeline never silently skips verification once tests exist |
| **Build Docker Image** | Runs `docker.build(...)` against the repo's `Dockerfile`, tagging the image with the ECR registry path and the Jenkins `BUILD_ID` — every build produces a uniquely traceable image |
| **Push to AWS ECR** | Authenticates to AWS ECR via `aws ecr get-login-password`, then pushes both the versioned tag and `latest`, so `latest` always reflects the most recent successful build while older tags remain available for rollback |
| **Deploy to Kubernetes** | Uses `sed` to inject the freshly built image tag into `kubernetes/deployment.yaml` in place of `IMAGE_TAG_PLACEHOLDER`, then applies the namespace, deployment, service, and HPA manifests in order via `kubectl apply -f` |

**Credentials used (configured in Jenkins, never hardcoded):**
- `aws-account-id` — injected as an environment variable to build the ECR registry URL
- `kubeconfig-credentials` — the kubeconfig Jenkins uses to authenticate to the target Kubernetes cluster

**Post-build hygiene:**
- `cleanWs()` always runs, wiping the Jenkins workspace regardless of outcome, so no build artifacts or credentials linger on the build agent between runs
- Clear success/failure messaging makes pipeline status immediately obvious in the Jenkins console, without needing to dig through stage logs


## ☸️ Kubernetes Deployment

NovaFleet's production runtime is managed entirely through the manifests in [`/kubernetes`](./kubernetes), applied by the Jenkins deploy stage above. The cluster topology is intentionally simple — a single ReplicaSet-backed Deployment behind a Service, with a HorizontalPodAutoscaler handling load — which keeps the operational surface area small while still demonstrating real production patterns.

| Manifest | Purpose |
|---|---|
| `namespace.yaml` | Creates a dedicated `novafleet` namespace, isolating the app's resources (Pods, Services, ConfigMaps, Secrets) from anything else running on the same cluster |
| `deployment.yaml` | Defines the Pod spec (container image, port, environment/secret references, resource requests/limits) and the desired replica count; Jenkins rewrites the image tag here on every successful build before applying it |
| `service.yaml` | Exposes the Deployment's Pods behind a stable internal (or LoadBalancer-type, depending on environment) network endpoint, so Pods can scale up/down or be replaced without breaking connectivity |
| `hpa.yaml` | A HorizontalPodAutoscaler that watches CPU/memory utilization across the Deployment's Pods and automatically scales the replica count up under load and back down when traffic subsides |

### Why this shape?

- **Namespace isolation** keeps NovaFleet's resources cleanly separated for RBAC, resource quotas, and easy teardown (`kubectl delete namespace novafleet` removes everything cleanly)
- **Deployment + ReplicaSet** gives rolling updates for free — a new image tag applied via `kubectl apply` triggers a gradual, zero-downtime rollout across Pods rather than a hard cutover
- **HPA** means the platform doesn't need manual capacity planning for demo spikes or real traffic growth — it reacts to actual load

### Manual deployment (outside the Jenkins pipeline)

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml

# Check rollout status
kubectl rollout status deployment/novafleet-app -n novafleet

# View live Pods
kubectl get pods -n novafleet
```

## 🛡️ Code Quality & Security

- **SonarCloud** — static analysis on every CI run, tracking code smells, accessibility issues, duplication, and security hotspots (see [`sonar-project.properties`](./sonar-project.properties))
- **CodeAnt AI** — automated PR-level code review for additional coverage on security and maintainability concerns
- **Non-root Docker runtime** — the container never runs the app as root, limiting blast radius if a container is ever compromised
- **Server-only secrets** — `GROQ_API_KEY`, `DATABASE_URL`, and `AUTH_SECRET` are read exclusively in server contexts (Route Handlers, Server Actions, middleware) and are never exposed to client bundles
- **Server-side rule enforcement** — every business rule (Section on Mandatory Business Rules below) is enforced in the backend rule engine, not just in the UI, so the rules hold even if the API is called directly

## 📐 Mandatory Business Rules

NovaFleet enforces the following rules at the API layer — never only in the UI — so they can't be bypassed by calling an endpoint directly:

- Vehicle registration numbers must be unique
- `Retired` or `In Shop` vehicles never appear in dispatch selection
- Drivers with expired licenses or `Suspended` status cannot be assigned to trips
- A driver or vehicle already `On Trip` cannot be assigned to another trip
- Cargo weight must not exceed the vehicle's maximum load capacity
- Dispatching a trip automatically sets both vehicle and driver status to `On Trip`
- Completing a trip automatically restores both to `Available`
- Cancelling a dispatched trip restores vehicle and driver to `Available`
- Opening a maintenance record automatically sets the vehicle to `In Shop`
- Closing maintenance restores the vehicle to `Available` (unless it's `Retired`)

## 🌿 Branching Strategy

NovaFleet adheres to a streamlined Git flow tailored for rapid iteration and continuous deployment safety.

### Core Branches
- **`main`**: The single source of truth for production. This branch is strictly protected. Commits pushed or merged here automatically trigger GitHub Actions (CI) and Jenkins (CD) to deploy the platform. Vercel acts as our production edge network for the web frontend.
- **`staging` / `development`**: Pre-production integration branches. Vercel automatically generates preview deployments for these branches so stakeholders can review new features before they hit `main`.

### Supporting Branches
All active work happens in supporting branches, prefixed logically based on the type of work:
- **`feature/<feature-name>`**: For developing new core features (e.g., `feature/ai-reports`, `feature/driver-management`). Branched from `main`.
- **`bugfix/<issue-name>`**: For fixing non-critical bugs found during QA in staging (e.g., `bugfix/pie-chart-rendering`).
- **`hotfix/<issue-name>`**: For critical, urgent fixes needed in production (e.g., `hotfix/prisma-engine-mismatch`). Branched from `main` and merged directly back to resolve incidents quickly.
- **`chore/<task-name>`**: For maintenance tasks like updating dependencies, updating documentation, or modifying CI/CD pipelines (e.g., `chore/update-readme`).

### Pull Request Workflow
1. Create a `feature/` or `bugfix/` branch.
2. Commit your changes using descriptive messages following Conventional Commits format (e.g., `feat: add Groq AI summaries`, `fix: resolve Vercel type error on routes`).
3. Push your branch and open a Pull Request against `main`.
4. **CI Triggers**: GitHub Actions automatically kicks off. It runs `tsc` for type-checking, ESLint for syntax checking, and sends the branch to SonarCloud and CodeAnt AI for rigorous code quality and security scanning.
5. Once all CI checks pass (✅) and PR approvals are met, the code is squashed and merged into `main`, triggering the automatic live deployment pipeline.

## 📁 Project Structure

```
novafleet/
├── .github/workflows/       # CI: lint, type-check, SonarCloud analysis
├── kubernetes/               # namespace, deployment, service, hpa manifests
├── prisma/                   # schema.prisma, migrations, seed script
├── src/                      # application source
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/
│   │   │   ├── fleet/        # 🛰️ Fleet Manager — Mission Control
│   │   │   ├── driver/       # 🧑✈️ Driver — Cockpit
│   │   │   ├── safety/       # 🛡️ Safety Officer — Watchtower
│   │   │   ├── finance/      # 📊 Financial Analyst — Ledger Deck
│   │   │   └── admin/        # 👑 Admin — The Tower
│   │   └── api/               # Route Handlers (reports, proofs, webhooks)
│   ├── components/            # shared UI, charts, KPI cards
│   └── lib/                   # prisma client, rule engine, metrics, groq client
├── Dockerfile                 # multi-stage production build
├── .dockerignore
├── Jenkinsfile                 # CD pipeline (build → ECR → Kubernetes)
├── sonar-project.properties    # SonarCloud configuration
├── auth.ts / auth.config.ts    # Auth.js configuration
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 🗺️ Roadmap

- [x] Core CRUD for vehicles, drivers, trips, maintenance
- [x] Server-enforced business rule engine
- [x] Role-based dashboards for all five personas
- [x] Groq-powered AI report narration
- [x] Admin approval workflow for proof documents
- [x] Dockerized build + Jenkins CI/CD to Kubernetes
- [ ] Automated test suite wired into the Jenkins `Test` stage
- [ ] Email reminders for expiring licenses
- [ ] Vehicle document management UI
- [ ] Multi-cluster / blue-green deployment strategy

## 👥 Contributors

<a href="https://github.com/Darshan1814">
  <img src="https://github.com/Darshan1814.png" width="60" style="border-radius:50%" alt="Darshan1814"/>
</a>

Built with ☄️ for a transport-operations hackathon — pull requests and issue reports welcome.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

**NovaFleet** — *Command Your Fleet Across the Cosmos* 🛰️

</div>

# CitiSent Backend

Express.js + Supabase backend scaffolded with clean architecture principles, Redis caching, and secure defaults.

> For general project architecture, mobile app setup, and web portal documentation, refer to the [Root README](../README.md).

---

## Key Features

* **Authentication & Role-Based Access Control:** Secure authentication, session validation, and tiered role enforcement (Citizens, Agency Staff, and Superadmins) powered by Supabase Auth and JWTs.
* **Report Lifecycle & Management:** Full CRUD operations for citizen reports, status transitions (*Pending*, *In Review*, *Resolved*, *Rejected*), and media attachment handlers.
* **AI Sentiment Pipeline Integration:** Coordinates asynchronous payload dispatch to the AI Sentiment service for emotion detection and urgency evaluation.
* **Real-Time WebSockets:** Bi-directional Socket.IO gateway supporting live report chat rooms, responder typing presence, unread message tracking, and instant status updates.
* **High-Performance Caching:** Multi-driver cache strategy (Redis with automatic fallback to in-memory) for query deduplication and low-latency response times.
* **Secure User Invitations:** Passwordless account setup workflows with time-limited JWT tokens and transactional email delivery via Nodemailer.
* **Defensive Security Baseline:** Hardened with Helmet HTTP headers, CORS allowlists, parameter pollution prevention (HPP), and Zod schema validations.

---

## Tech Stack & Prerequisites

### Tech Stack
* **Runtime & Framework:** [Node.js](https://nodejs.org/) (ES Modules), [Express](https://expressjs.com/) (v4.21)
* **Database & Auth:** [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) (v2.50), PostgreSQL
* **Caching & In-Memory Store:** [Redis](https://redis.io/) (v4.7 client)
* **Real-Time Communication:** [Socket.IO](https://socket.io/) (v4.8)
* **Validation & Security:** [Zod](https://zod.dev/) (v3.23), [Helmet](https://helmetjs.github.io/), [HPP](https://github.com/analog-nico/hpp), `express-rate-limit`
* **Email & Utilities:** [Nodemailer](https://nodemailer.com/), [Multer](https://github.com/expressjs/multer), `jsonwebtoken`

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended) ([Download Node.js](https://nodejs.org/))
* **Package Manager:** `npm` (bundled with Node.js)
* **Supabase Project:** Configured PostgreSQL instance with Supabase URL and Keys
* **Redis Server:** Running locally or via Docker Compose (`docker compose up -d redis`)

---

## Environment Configuration

1. Create a `.env` file in the `backend/` directory:
   ```powershell
   cp .env.example .env
   ```

2. Configure your environment settings:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `4000` |
| `API_PREFIX` | Global API route prefix | `/api/v1` |
| `CORS_ORIGINS` | Allowed client origins (comma-separated) | `http://localhost:5173,http://localhost:8081` |
| `SUPABASE_URL` | Supabase project API URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase publishable anonymous key | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase administrative service role key | `your-supabase-service-role-key` |
| `REDIS_URL` | Redis connection URI | `redis://localhost:6379` |
| `CACHE_DRIVER` | Cache engine (`auto`, `redis`, `memory`) | `auto` |
| `CACHE_TTL_SECONDS` | Cache retention duration in seconds | `60` |
| `SENTIMENT_API_URL` | Endpoint for Python AI service | `http://localhost:8000/analyze` |
| `GMAIL_USER` | SMTP email for invitation delivery | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | App-specific password for Gmail SMTP | `your-app-password` |
| `INVITATION_JWT_SECRET` | Secret key for account invitation links | `secure-random-32-char-string` |
| `WEB_APP_BASE_URL` | Public URL for invitation redirects | `http://localhost:5173` |

> [!WARNING]
> **Security Reminder:** Never commit `.env` files or share `SUPABASE_SERVICE_ROLE_KEY` or SMTP passwords publicly.

---

## Setup and Installation

### Step 1: Navigate to the Backend Directory
```powershell
cd backend
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Start the Backend Server

* **Development Mode (Auto-restart with Nodemon):**
  ```powershell
  npm run dev
  ```
* **Production Mode:**
  ```powershell
  npm start
  ```

*The API server will listen on **`http://localhost:4000`** (Base path: `http://localhost:4000/api/v1`).*

---

### Code Quality & Testing
* **Run Automated Tests:**
  ```powershell
  npm test
  ```
* **Syntax and Lint Check:**
  ```powershell
  npm run lint
  ```
* **Smoke Test Chat WebSocket:**
  ```powershell
  npm run smoke:chat
  ```

---

## API Endpoints Overview

All operational endpoints are prefixed under `/api/v1`:

### 1. System Health
* `GET /` — Server status banner
* `GET /api/v1/health` — Runtime system health
* `GET /api/v1/health/supabase` — Supabase database connectivity health

### 2. Authentication (`/api/v1/auth`)
* `POST /register` — Register a new citizen account
* `POST /login` — Authenticate and receive JWT session
* `POST /forgot-password` — Request password reset email
* `POST /activate-account` — Complete registration from admin invitation
* `GET /me` — Retrieve current authenticated user profile
* `POST /logout` — Invalidate user session

### 3. User Profile (`/api/v1/users`)
* `GET /me` — Fetch user account details
* `PATCH /me` — Update profile information
* `DELETE /me` — Account deletion request

### 4. Reports (`/api/v1/reports`)
* `GET /` — List user/department reports (cached, supports pagination & filters)
* `POST /` — Create a new report (triggers AI sentiment analysis & cache invalidation)
* `GET /:reportId` — Retrieve detailed report dossier
* `PATCH /:reportId` — Update report status or content
* `DELETE /:reportId` — Delete a report

### 5. Administration (`/api/v1/admin`)
* `GET /users` — Paginated list of registered citizen accounts
* `POST /users` — Provision a user account and dispatch invitation email
* `PATCH /users/:userId/ban` — Ban/unban user account
* `GET /analytics` — High-level incident and sentiment metrics

### 6. Departments & Notifications
* `GET /api/v1/departments` — List active municipal agencies and issue categories
* `GET /api/v1/notifications` — Fetch user notification feed
* `PATCH /api/v1/notifications/:id/read` — Mark notification as read

---

## Architectural Rules

* **`routes`**: URL routing and middleware pipeline binding.
* **`middlewares`**: Cross-cutting concerns (JWT authentication, rate limiting, error handling, Zod validation).
* **`controllers`**: Parses HTTP inputs, invokes appropriate service methods, and formats JSON responses.
* **`services`**: Core business rules, validation logic, caching strategies, and third-party integrations (AI, SMTP).
* **`repositories`**: Data access layer executing Supabase queries.
* **`schemas`**: Strict contract validation using Zod schemas.

---

## Caching & Security Baseline

### Caching Strategy
* `GET /api/v1/reports` query results are cached per user and filter combination (`limit`, `offset`, `status`).
* Configurable via `CACHE_TTL_SECONDS` (default: 60s).
* Submitting or updating reports immediately invalidates the associated cache tags.
* **Driver Modes:**
  * `auto` *(Default)*: Automatically connects to Redis if available; gracefully falls back to memory.
  * `redis`: Requires a running Redis instance.
  * `memory`: Uses internal in-memory LRU cache.

### Security Defenses
* **HTTP Hardening:** Helmet integration for Content Security Policy and secure headers.
* **Rate Limiting:** IP-based sliding window rate limits to prevent brute-force attacks.
* **Parameter Pollution Protection:** HPP middleware blocks duplicate query parameter abuse.
* **Payload Size Limits:** JSON request bodies are capped at `1MB` to prevent memory exhaustion.

---

## Troubleshooting

* **Supabase Connection Timeout:**
  - Verify that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are valid.
  - Test connection status directly via `GET http://localhost:4000/api/v1/health/supabase`.
* **Redis Connection Error:**
  - If Redis is not running locally, either launch Redis via Docker (`docker compose up -d redis`) or set `CACHE_DRIVER=memory` in `.env`.
* **Gmail SMTP Authentication Failure:**
  - Ensure you are using an **App Password** generated from your Google Account settings, rather than your personal account password.

---

## Project Structure

```text
backend/
├── database/                   # SQL migrations and schema seeds
├── src/
│   ├── config/                 # Environment validation, Supabase client, and logger
│   ├── middlewares/            # Auth, validation, error handler, and rate limiter
│   ├── modules/                # Domain-driven feature modules
│   │   ├── admin/              # Admin management and analytics
│   │   ├── auth/               # Authentication and password recovery
│   │   ├── departments/        # Agency and department catalog
│   │   ├── health/             # System health and readiness probes
│   │   ├── notifications/      # Push and in-app notification services
│   │   ├── reports/            # Core reports, triage, and attachments
│   │   └── users/              # Citizen profile and management
│   ├── realtime/               # Socket.IO connection and room event handlers
│   ├── routes/                 # Central API route registration
│   ├── shared/                 # Common error classes and async utilities
│   ├── app.js                  # Express app setup and middleware pipeline
│   └── server.js               # HTTP/WebSocket server listener and graceful shutdown
├── .env.example                # Environment variable template
├── Dockerfile                  # Container definition for backend deployments
└── package.json                # Project dependencies and npm scripts
```
# CitiSent-Ops: Production Operations & Runbook Guide

**Control Plane Architecture for Municipal Platform Commissioning & Platform Governance**

---

## 1. System Overview & Architecture

`CitiSent-Ops` is an isolated administrative control plane designed to onboard municipal superadministrators, provision city departments, and maintain operational health across the CitiSent platform without exposing destructive administrative capabilities to the public-facing gateway or citizen web applications.

```
                    ┌─────────────────────────────────┐
                    │  Platform Developer / Operator  │
                    └────────────────┬────────────────┘
                                     │ (Developer Whitelisted JWT)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │  CitiSent-Ops Frontend (React 19 / Vite / Tailwind v4)   │
        │  Port: 5174                                             │
        └────────────────────────────┬────────────────────────────┘
                                     │ HTTP (CORS Protected)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │  CitiSent-Ops Backend (Node.js / Express 4 / ESM)       │
        │  Port: 5001                                             │
        ├────────────────────────────┬────────────────────────────┤
        │ • Rate Limiting (express)  │ • Health Check Probe       │
        │ • Developer Whitelist Gate │ • Parameterized Audit Log  │
        └──────────────┬─────────────┴─────────────┬──────────────┘
                       │                           │
                       ▼                           ▼
          ┌─────────────────────────┐ ┌─────────────────────────┐
          │  Supabase (PostgreSQL)  │ │  Brevo / Gmail SMTP     │
          │  Service Role Client    │ │  Transactional Emails   │
          └─────────────────────────┘ └─────────────────────────┘
```

---

## 2. Ports & Network Boundary

| Service | Port | Base URL | Access Restriction |
| :--- | :--- | :--- | :--- |
| **Ops Frontend Console** | `5174` | `http://localhost:5174` | Developer Browser |
| **Ops API Server** | `5001` | `http://localhost:5001/api/v1/ops` | Restricted CORS Origins |
| **Citizen Gateway Backend** | `4000` | `http://localhost:4000` | Public / Mobile App |
| **Citizen Web App** | `5173` | `http://localhost:5173` | Public Browsers |
| **AI Sentiment Engine** | `8000` | `http://localhost:8000` | Internal Microservice |

---

## 3. Production Hardening & AppSec Policies

### 3.1 IP Rate Limiting (`express-rate-limit`)
To defend against brute-force account discovery and notification spam, rate limiters protect sensitive endpoints:

1. **Developer Registration (`POST /api/v1/ops/register-dev`)**:
   - **Limit:** 5 requests per 15-minute sliding window per IP.
   - **Protection:** Prevents enumeration attacks against `DEVELOPER_ALLOWED_EMAILS`.
2. **Superadmin Provisioning & Invites (`POST /api/v1/ops/superadmins*`)**:
   - **Limit:** 10 requests per 10-minute sliding window per IP.
   - **Protection:** Prevents mass account generation and SMTP provider quota exhaustion.

### 3.2 Developer Whitelist Gate (`authMiddleware.js`)
All `/api/v1/ops/*` routes (except public `/health` and `/register-dev`) require a valid Supabase JWT Bearer token whose email address is present in the `DEVELOPER_ALLOWED_EMAILS` environment variable. Tokens from non-whitelisted users are rejected with `403 Forbidden`.

---

## 4. Observability & Health Monitoring

### 4.1 Health Check Endpoint (`GET /api/v1/ops/health`)
Provides real-time system diagnostics without requiring authentication.

**Sample Request:**
```bash
curl -s http://localhost:5001/api/v1/ops/health | jq
```

**Healthy Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "service": "citisent-ops-backend",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-09-25T05:14:00.000Z",
  "uptime": {
    "seconds": 3840,
    "formatted": "1h 4m 0s"
  },
  "checks": {
    "database": {
      "status": "connected",
      "latencyMs": 42
    },
    "system": {
      "rssMb": 48.2,
      "heapUsedMb": 24.1,
      "heapTotalMb": 32.5
    }
  }
}
```

**Unhealthy Response (HTTP 503 Service Unavailable):**
Triggered if Supabase database query fails or times out:
```json
{
  "status": "unhealthy",
  "service": "citisent-ops-backend",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "disconnected",
      "latencyMs": 1502,
      "error": "connection refused"
    }
  }
}
```

### 4.2 Docker Compose Healthcheck Configuration
Add the following `healthcheck` block to `docker-compose.yml` to automatically restart the container if the database connection drops:

```yaml
  ops-backend:
    build:
      context: ./CitiSent-Ops/backend
      dockerfile: Dockerfile
    container_name: citisent-ops-backend
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - PORT=5001
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - DEVELOPER_ALLOWED_EMAILS=${DEVELOPER_ALLOWED_EMAILS}
    healthcheck:
      test: ["CMD-SHELL", "node -e 'fetch(\"http://localhost:5001/api/v1/ops/health\").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

---

## 5. Standard Operating Procedures (SOPs)

### SOP-01: First-Time Developer Bootstrap
1. Add the developer's email to `DEVELOPER_ALLOWED_EMAILS` in `CitiSent-Ops/backend/.env`.
2. Open `http://localhost:5174` in your browser.
3. Switch to the **First-Time Setup** tab.
4. Enter the whitelisted email and create a strong password (minimum 8 characters).
5. Click **Register Developer Account**. The system provisions the account with a verified email and logs you in immediately.

### SOP-02: Provisioning a New City Superadministrator
1. Log in to `CitiSent-Ops` at `http://localhost:5174`.
2. Navigate to **Superadmin Directory** -> click **Provision Superadmin**.
3. Fill in the required fields:
   - **First Name, Last Name**
   - **Official Government Email**
   - **Phone Number** (E.164 format, e.g., `+639171234567`)
   - **City Jurisdiction** (e.g., `Muntinlupa City`)
   - **Province** (e.g., `Metro Manila`)
4. Submit the form. The system will:
   - Verify that the email and phone number are not already taken.
   - Insert the administrative user with `role = 'superadmin'`.
   - Dispatch an onboarding email containing a cryptographically signed setup link.
   - Display a **Direct Setup URL Fallback** in the UI with a 1-click **Copy Setup URL** button. If the government email firewall delays receipt, securely send this link to the city administrator.

### SOP-03: Handling Superadmin Lockout or Locked 2FA
If an administrator exhausts maximum OTP attempts or hits a security block:
1. In the **Superadmin Directory**, find the administrator.
2. Click the **Unlock** icon (<kbd>🔓</kbd>).
3. Review the safety confirmation modal and click **Clear Lockout**.
4. The system clears failed OTP counts and resets IP cooldowns.

### SOP-04: Suspending or Reactivating an Account
1. Find the administrator in the directory.
2. Click the **Ban / Shield** icon (<kbd>🚫</kbd>).
3. The confirmation modal will prompt: *"Are you sure you want to suspend access for [Admin Name]?"*
4. Confirm the suspension. The administrator will be immediately blocked from logging into the municipal portal.
5. To restore access, click the button again and select **Reactivate Account**.

### SOP-05: Seeding Municipal Departments
1. Navigate to the **Department Seeder** tab.
2. Review the list of standardized city departments (e.g., *City Engineering Office*, *City Health Office*, *Public Safety & Traffic Management*, *City Social Welfare & Development*, etc.).
3. Departments already present in the database are marked with a green **Seeded** badge.
4. Select the desired departments and click **Seed Selected**.
5. Confirm the action in the safety modal.
6. The seeder applies `ON CONFLICT (slug) DO NOTHING`, ensuring idempotent execution with zero risk of overwriting existing department operational data.

### SOP-06: Investigating Security Incidents (Audit Trail)
1. Navigate to the **Audit Trail** tab.
2. Filter by:
   - **Action Type:** `PROVISION_SUPERADMIN`, `RESEND_INVITE_SUPERADMIN`, `UNLOCK_SUPERADMIN`, `STATUS_UPDATE_SUPERADMIN`, or `SEED_DEPARTMENTS`.
   - **Date Range:** Specify `From` and `To` dates.
3. Click **Inspect JSON** on any row to view the full contextual metadata, including actor IP address, target IDs, and timestamp.
4. Use **Copy JSON** to extract records for formal incident reports.

---

## 6. Troubleshooting & Diagnostics

### Problem 1: `429 Too Many Requests`
- **Cause:** Rate limiter triggered due to exceeding request limits within the time window.
- **Resolution:**
  - For Developer Registration: Wait 15 minutes.
  - For Superadmin Provisioning: Wait 10 minutes.
  - In a development or test environment, restart the backend server (`npm run dev`) to reset the in-memory rate limit store.

### Problem 2: `403 Forbidden: Access Denied`
- **Cause:** The signed-in Supabase user email is not in `DEVELOPER_ALLOWED_EMAILS`.
- **Resolution:**
  - Inspect `CitiSent-Ops/backend/.env` and ensure the email is added to `DEVELOPER_ALLOWED_EMAILS` (comma-separated, case-insensitive).
  - Restart the backend to reload environment variables.

### Problem 3: `503 Service Unavailable` on `/health`
- **Cause:** Database unreachable or invalid Supabase service role credentials.
- **Resolution:**
  - Check the `checks.database.error` field in the `/health` JSON payload.
  - Verify that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` match your Supabase project settings.
  - Ensure outbound HTTPS traffic to Supabase is not blocked by local firewalls or proxy servers.

# CitiSent Web Portal

React 19 + Vite web dashboard scaffolded with modular UI components, TanStack Query caching, and real-time administrative triage features.

> For general project background, system architecture, and overall setup, refer to the [Root README](../README.md).

---

## Key Features

* **Executive Analytics & Sentiment Dashboards:** Visualizes report trends, status distributions, departmental metrics, and emotional breakdowns (*Frustrated*, *Angry*, *Urgent*, *Neutral*, etc.) using Chart.js.
* **Multi-Dimensional Report Management:** Filter, search, and triage incoming citizen reports by agency, status (*Pending*, *In Review*, *Resolved*, *Rejected*), severity, or date range.
* **Real-Time Citizen Discussion Drawer:** Instant two-way messaging between municipal staff and citizens on individual reports via Socket.IO WebSockets.
* **Unified Conversations Hub:** Centralized interface to manage all active citizen communications across departments.
* **Citizen Directory & Profile Inspector:** View registered citizens, reporting history, verification status, and activity records.
* **Role-Based Access Control (RBAC):** Tiered permissions handling for Superadmins, Agency Admins, and Department Staff.
* **Agency & Staff Management:** Provision agency profiles, manage staff invitations, and configure municipal services.
* **Offline Resilience & Live Connection Indicator:** Real-time visual network connectivity tracking and optimistic UI caching via TanStack Query.

---

## Tech Stack & Prerequisites

### Tech Stack
* **Framework & Build:** [React](https://react.dev/) (v19.2), [Vite](https://vitejs.dev/) (v7.3)
* **Styling & Animations:** [Tailwind CSS](https://tailwindcss.com/) (v4.2), [Framer Motion](https://www.framer.com/motion/) (v12.35)
* **Data Fetching & State:** [TanStack React Query](https://tanstack.com/query/latest) (v5.99)
* **Real-Time Communication:** [Socket.io-client](https://socket.io/docs/v4/client-api/) (v4.8)
* **Data Visualization:** [Chart.js](https://www.chartjs.org/) (v4.5) & `react-chartjs-2`
* **Icons & Notifications:** `react-icons`, `react-hot-toast`
* **Testing:** [Vitest](https://vitest.dev/) (v4.1), [JSDOM](https://github.com/jsdom/jsdom)

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended) ([Download Node.js](https://nodejs.org/))
* **Package Manager:** `npm` (bundled with Node.js)
* **CitiSent Backend API:** Running on `http://localhost:4000` (or configured API host)

---

## Environment Configuration

1. Create a `.env` file in the `CitiSent-Website/` directory:
   ```powershell
   cp .env.example .env
   ```

2. Configure your environment settings:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API URL for CitiSent Express Backend | `http://localhost:4000/api/v1` |
| `VITE_API_TIMEOUT_MS` | Request timeout duration in milliseconds | `15000` |

> [!WARNING]
> **Security Reminder:** Never commit your `.env` file or sensitive secrets to version control. `VITE_` variables are bundled directly into the client-side JavaScript.

---

## Setup and Installation

### Step 1: Open the Web Directory

```powershell
cd CitiSent-Website
```

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Start the Application

* **Development Mode (Web Frontend Only):**
  ```powershell
  npm run dev:web
  ```
  *The web portal will be accessible at **`http://localhost:5173`**.*

* **Full Stack Development (Web + Backend + Redis):**
  ```powershell
  npm run dev
  ```
  *Starts Redis via Docker Compose, launches the backend server in a separate terminal, and serves the Vite website.*

---

## Available NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev:web` | `vite` | Runs only the Vite frontend development server on port `5173` |
| `npm run dev` | `npm run dev:redis && ... && vite` | Starts Redis + Backend server + Vite dev server together |
| `npm run dev:backend` | `npm --prefix ../backend run dev` | Launches the Express backend server from the website folder |
| `npm run dev:redis` | `docker compose -f ..\docker-compose.yml up -d redis` | Starts the Redis container in Docker |
| `npm run build` | `vite build` | Compiles and optimizes assets into the `dist/` directory |
| `npm run preview` | `vite preview` | Locally serves the production build for validation |
| `npm test` | `vitest run` | Runs automated unit and component test suites |
| `npm run test:watch` | `vitest` | Runs Vitest in interactive watch mode |
| `npm run lint` | `eslint .` | Runs ESLint across all JS and JSX files |

---

## Role-Based Access Control (RBAC)

| Role | Access Level & Permissions |
| :--- | :--- |
| **Superadmin** | Full platform access: View global analytics, manage agencies, invite/revoke admin accounts, audit logs, and oversee all municipal reports. |
| **Agency Admin** | Departmental management: Assign staff, review agency-specific reports, manage triage notes, and participate in citizen discussions. |
| **Agency Staff** | Triage and operations: Update assigned report statuses, respond to citizen queries, and add resolution notes. |

---

## Troubleshooting

* **API Connection Errors (Failed to fetch):**
  - Verify that the CitiSent backend server is running on `http://localhost:4000`.
  - Check `VITE_API_BASE_URL` in your `.env` file.
  - Ensure CORS origin settings on the backend include `http://localhost:5173`.
* **Real-Time Messages Not Updating:**
  - Verify that the WebSocket server is active on the backend.
  - Check the browser console for Socket.IO connection errors or blocked network ports.
* **Port 5173 In Use:**
  - Vite will automatically attempt the next available port (e.g., `5174`). Update your browser URL accordingly.

---

## Project Structure

```text
CitiSent-Website/
├── public/                     # Static assets, logos, and favicon
├── src/
│   ├── components/             # Feature-specific UI modules
│   │   ├── Account-Ui/         # User profile and account preferences
│   │   ├── AdminManagement-Ui/ # Agency and administrator management
│   │   ├── Auth-Ui/            # Login, password recovery, and auth forms
│   │   ├── Dashboard-Ui/       # Analytics widgets and Chart.js graphs
│   │   ├── Notifications-Ui/   # In-app notification center
│   │   ├── Reports-Ui/         # Report data tables, triage modals, and chat drawer
│   │   ├── Settings-Ui/        # System and appearance configuration
│   │   ├── Users-Ui/           # Citizen directory and profile modals
│   │   └── ui/                 # Reusable UI primitives (Buttons, Inputs, Badges, Modals)
│   ├── controllers/            # Component controllers and view-models
│   ├── frontend/               # Navigation, layout wrappers, and sidebar components
│   ├── hooks/                  # Custom React and TanStack Query hooks
│   ├── models/                 # Data schemas, contracts, and role definitions
│   ├── services/               # REST API clients, Supabase SDK, and Socket.IO service
│   ├── utils/                  # Helper utilities, date formatters, and status helpers
│   ├── App.jsx                 # Application entry point and router layout
│   ├── index.css               # Design system tokens and global Tailwind styles
│   └── main.jsx                # React DOM root mount
├── .env.example                # Environment configuration template
├── package.json                # Project dependencies and npm scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── vercel.json                 # SPA single-page routing rewrite rules
└── vite.config.js              # Vite configuration and plugins
```

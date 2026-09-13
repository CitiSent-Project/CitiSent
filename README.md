# CitiSent

> **CitiSent**: An Emotion-Aware City-Based Reporting System with Sentiment Analysis

CitiSent is a multi-platform civic engagement and urban issue reporting system. It connects citizens with city administrators by capturing community concerns, analyzing emotional tone and urgency using AI sentiment analysis, and providing real-time dashboards for issue triage and resolution.

---

## Project Components

The CitiSent repository is organized into four core services and supporting infrastructure:

| Component                      | Directory                                    | Stack                                                  | Description                                                                                                                      |
| :----------------------------- | :------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Admin & Citizen Web Portal** | [`CitiSent-Website/`](./CitiSent-Website)    | React 19, Vite, Tailwind CSS, TanStack Query, Chart.js | Web dashboard for monitoring live city reports, analyzing sentiment metrics, visualizing trends, and managing issue resolutions. |
| **Mobile Application**         | [`CitiSent-Mobile/`](./CitiSent-Mobile)      | React Native, Expo SDK 54, NativeWind, Supabase        | Cross-platform mobile app for citizens to submit geotagged reports, upload media, and receive real-time status updates.          |
| **Core Backend Gateway**       | [`backend/`](./backend)                      | Node.js, Express, Socket.io, Redis, Supabase SDK       | Central REST API and WebSocket hub managing authentication, report lifecycle, sentiment orchestration, and real-time broadcasts. |
| **AI Sentiment Service**       | [`ai-sentiment/`](./ai-sentiment)            | Python 3, FastAPI, Uvicorn, Google Gemini AI           | Microservice responsible for natural language sentiment extraction, emotion classification, and urgency assessment.              |
| **Container & Infrastructure** | [`docker-compose.yml`](./docker-compose.yml) | Docker Compose, Redis 7 Alpine                         | Orchestration setup for running Redis, AI Sentiment, and the Backend in containerized environments.                              |

---

### 1. CitiSent-Website (Web Portal)

- **Location:** [`CitiSent-Website/`](./CitiSent-Website)
- **Documentation:** Read setup guide and documentation in [`CitiSent-Website/README.md`](./CitiSent-Website/README.md)
- **Tech Stack:** React 19, Vite 7, Tailwind CSS v4, TanStack React Query, Chart.js / React-Chartjs-2, Framer Motion, Socket.io-client.
- **Responsibilities:**
  - Interactive administrative dashboard for city managers and staff.
  - Real-time report feeds with WebSocket-driven live updates and status transitions.
  - Sentiment visualization, analytics charts (emotion breakdowns, category trends, hotspot maps).
  - Moderator tools for report review, priority adjustments, and citizen communications.

---

### 2. CitiSent-Mobile (Citizen Mobile App)

- **Location:** [`CitiSent-Mobile/`](./CitiSent-Mobile)
- **Documentation:** Read setup guide and documentation in [`CitiSent-Mobile/README.md`](./CitiSent-Mobile/README.md)
- **Tech Stack:** React Native (0.81), Expo (SDK 54), Expo Router, NativeWind (Tailwind CSS), Supabase JS, Socket.io-client.
- **Responsibilities:**
  - Intuitive mobile interface for citizens to submit city reports and complaints.
  - Geolocation tagging (`expo-location`) and camera/photo attachment (`expo-image-picker`).
  - Live status tracking and real-time chat with city responders on submitted reports.
  - Push notifications and offline-friendly user experience.

---

### 3. Backend API & Realtime Service

- **Location:** [`backend/`](./backend)
- **Documentation:** Read setup guide and documentation in [`backend/README.md`](./backend/README.md)
- **Tech Stack:** Node.js (ES Modules), Express 4, Socket.io 4, Redis 4, Supabase JS, Zod, Helmet, Nodemailer.
- **Responsibilities:**
  - Central API gateway for mobile and web clients (`/api/v1`).
  - Authentication & role-based access control (Citizens, City Staff, Administrators).
  - Integration with the AI Sentiment service upon report submission.
  - Real-time event broadcasting over Socket.io (report status updates, live comments).
  - High-performance caching and rate-limiting using Redis.

---

### 4. AI Sentiment Analysis Service

- **Location:** [`ai-sentiment/`](./ai-sentiment)
- **Documentation:** Read setup guide and documentation in [`ai-sentiment/README.md`](./ai-sentiment/README.md)
- **Tech Stack:** Python 3.11+, FastAPI, Uvicorn, Pydantic, Google GenAI SDK (`google-genai`).
- **Responsibilities:**
  - Natural language understanding (NLU) of citizen issue descriptions.
  - Emotion detection (e.g., frustration, urgency, distress, neutral, satisfaction).
  - Sentiment score evaluation and automated priority recommendation.
  - Independent REST API (`/analyze`) consumed by the backend pipeline.

---

## Getting Started & Running Components

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.11+
- **Docker & Docker Desktop** (for Redis and full-stack container orchestration)
- **Expo Go App / Android Studio / Xcode** (for mobile app testing)

---

### Option 1: Running with Docker Compose (Full Stack / Services)

To spin up Redis, the AI Sentiment service, and the Backend together:

```bash
docker compose up -d
```

To run only the Redis cache container:

```bash
docker compose up -d redis
```

---

### Option 2: Running Components Individually

#### 1. Backend Service (`backend/`)

```powershell
cd backend
npm install
npm run dev
```

_Runs on `http://localhost:4000` (API prefix: `/api/v1`)._

---

#### 2. Web Application (`CitiSent-Website/`)

```powershell
cd CitiSent-Website
npm install
npm run dev
```

_Runs the Vite development server on `http://localhost:5173`._

> **Helpful Scripts:**
>
> - `npm run dev:web` — Starts only the web frontend.
> - `npm run dev:backend` — Starts the backend server from the website directory.

---

#### 3. Mobile Application (`CitiSent-Mobile/`)

```powershell
cd CitiSent-Mobile
npm install
npx expo start
```

_Opens the Expo CLI. Press `a` for Android Emulator, `i` for iOS Simulator, `w` for Web, or scan the QR code using the **Expo Go** app on your physical mobile device._

---

#### 4. AI Sentiment Service (`ai-sentiment/`)

1. Navigate to the AI directory:

   ```bash
   cd ai-sentiment
   ```

2. Create & activate a virtual environment:
   - **PowerShell:** `.\.venv\Scripts\Activate.ps1`
   - **Command Prompt:** `.\.venv\Scripts\activate.bat`
   - **macOS / Linux / Git Bash:** `source .venv/bin/activate`

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   - **Development Mode (Auto-reload):**
     ```bash
     python -m uvicorn main:app --port 8000 --reload
     ```
   - **Production / Stable Mode:**
     ```bash
     python -m uvicorn main:app --port 8000 --workers 2
     ```

_Runs FastAPI on `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`)._

---

## Environment Configuration

Each component requires its respective `.env` file for local development. Template files are available:

- Backend: Copy [`backend/.env.example`](./backend/.env.example) to `backend/.env`
- Web: Copy [`CitiSent-Website/.env.example`](./CitiSent-Website/.env.example) to `CitiSent-Website/.env`
- Mobile: Copy [`CitiSent-Mobile/.env.local.example`](./CitiSent-Mobile/.env.local.example) to `CitiSent-Mobile/.env`
- AI Sentiment: Copy [`ai-sentiment/.env.example`](./ai-sentiment/.env.example) to `ai-sentiment/.env`

test again
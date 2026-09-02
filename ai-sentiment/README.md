# CitiSent AI Sentiment Service

FastAPI + Google Gemini microservice scaffolded for emotion classification, real-time urgency scoring, and AI-assisted triage summaries.

> For general project architecture, mobile app setup, and backend documentation, refer to the [Root README](../README.md).

---

## Features

* **Emotion & Sentiment Classification:** Identifies citizen emotional states (*Sad*, *Happy*, *Frustrated*, *Angry*, *Disappointed*, *Excited*, *Delighted*, *Neutral*).
* **Urgency Levels:** Evaluates real-world risk and operational severity (*Critical*, *High*, *Medium*, *Low*).
* **Automated Admin Summaries:** Generates a concise 1–2 sentence executive summary highlighting citizen sentiment alongside actionable reasons for the selected department.
* **Smart Responder Chat Suggestions:** Proposes contextual response drafts for city staff handling citizen inquiries.
* **Admin Note Suggestions:** Automatically formulates structured triage notes based on the issue description and resolution history.
* **Deterministic & Fast Output:** Leverages structured JSON outputs and low temperature settings with strict timeout safeguards.

---

## Requirements

* **Python:** v3.11 or higher ([Download Python](https://www.python.org/downloads/))
* **Package Manager:** `pip` (bundled with Python)
* **Google Gemini API Key:** Free or paid API key from [Google AI Studio](https://aistudio.google.com/)

---

## Installation and Setup

### Step 1: Open the AI Directory

```powershell
cd ai-sentiment
```

### Step 2: Create a Virtual Environment

It is best practice to use a virtual environment so dependencies do not conflict with your global Python installation.

* **Windows (PowerShell):**
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
  *(If you encounter a script execution policy restriction, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and retry).*

* **Windows (Command Prompt):**
  ```cmd
  python -m venv .venv
  .\.venv\Scripts\activate.bat
  ```

* **macOS / Linux / Git Bash:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

Once activated, your terminal prompt will show `(.venv)`.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configuration

1. Create a `.env` file in the `ai-sentiment/` directory:
   ```powershell
   cp .env.example .env
   ```

2. Open `.env` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   *(Optional: You can also specify `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081` to customize CORS settings).*

> [!WARNING]
> **Security Reminder:** Never commit your `.env` file or share your `GEMINI_API_KEY` publicly. Always keep API keys private.

---

## How to Run

### Development Mode (Auto-Reload on Code Changes)

```bash
python -m uvicorn main:app --port 8000 --reload
```

### Stable / Production Mode

```bash
python -m uvicorn main:app --port 8000 --workers 2
```

The service will start on **`http://localhost:8000`**.

---

## API Endpoints & Usage

Interactive API documentation and schema testing are available automatically at **`http://localhost:8000/docs`** (Swagger UI).

### 1. Analyze Report (`POST /analyze`)
Analyzes a submitted citizen report and returns structured classification metrics.

* **Request Body:**
  ```json
  {
    "office": "City Traffic Management Division",
    "location": "Cor. Rizal & Quezon Avenue",
    "description": "Traffic lights have been completely broken for two days, causing massive gridlock and near-accidents during rush hour!"
  }
  ```

* **Response (200 OK):**
  ```json
  {
    "urgency": "High",
    "emotion": "Frustrated",
    "confidence": 0.95,
    "summary": "The citizen is expressing strong frustration over non-functional traffic signals that present imminent road safety hazards and significant congestion."
  }
  ```

### 2. Health & Status Check (`GET /status`)
Checks if the Gemini client is properly initialized and returns supported classification dimensions.

* **Response (200 OK):**
  ```json
  {
    "status": "ready",
    "model": "gemini-flash-lite-latest",
    "supportedUrgencyLevels": ["Emergency", "Urgent", "Moderate", "Calm"]
  }
  ```

### 3. Chat Suggestions (`POST /chat/suggestions`)
Generates contextual quick replies for city staff responding to citizen chat messages.

### 4. Admin Note Suggestions (`POST /admin-notes/suggestions`)
Generates internal summary notes based on conversation history and resolution progress.

---

## Troubleshooting

* **`401 Unauthorized / Invalid API Key`:**
  Verify that `GEMINI_API_KEY` in `.env` is correct and active in [Google AI Studio](https://aistudio.google.com/).
* **`429 Quota Exceeded`:**
  The Google Gemini API free-tier rate limit was reached. Wait a minute and retry, or review your quota tier in the Google AI console.
* **`Port 8000 in use`:**
  If port 8000 is occupied, you can run the service on an alternative port (e.g., `--port 8001`), ensuring you also update `SENTIMENT_API_URL` in the backend `.env`.
* **Script Execution Blocked in PowerShell:**
  Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your PowerShell window before activating `.venv`.

---

## Project Structure

```text
ai-sentiment/
├── api/                        # FastAPI route controllers
│   ├── get_report.py           # Health and status endpoints
│   ├── get_suggestions.py      # Chat and admin note suggestion routes
│   └── post_report.py          # Primary report analysis route (/analyze)
├── tests/                      # Unit and integration test suites
├── ai.py                       # Core Gemini SDK integration and prompt engineering
├── main.py                     # FastAPI application setup and CORS middleware
├── requirements.txt            # Production dependencies (FastAPI, uvicorn, google-genai)
├── requirements-dev.txt        # Development dependencies (pytest, httpx)
├── Dockerfile                  # Container definition for Docker deployments
└── .env.example                # Environment variable template
```

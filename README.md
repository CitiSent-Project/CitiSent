# CitiSent

CitiSent: An Emotion-Aware City-Based Reporting System with Sentiment Analysis

## Running the Website

The website lives in the `CitiSent-Website` folder.

1. **Open the website directory:**

   ```powershell
   cd CitiSent-Website
   ```

2. **Install dependencies:**

   ```powershell
   npm install
   ```

3. **Start the website and backend together:**

   ```powershell
   npm run dev
   ```

   This starts the website with Vite and launches the backend from the sibling `backend` folder in a separate terminal window.

4. **Optional commands:**

   ```powershell
   npm run dev:web
   npm run dev:backend
   ```

   Use `dev:web` to run only the website and `dev:backend` to run only the backend server.

## Running the Mobile App

The mobile app lives in the `CitiSent-Mobile` folder and uses Expo.

1. **Open the mobile directory:**

   ```powershell
   cd CitiSent-Mobile
   ```

2. **Install dependencies:**

   ```powershell
   npm install
   ```

3. **Start the app:**

   ```powershell
   npx expo start
   ```

   Expo will open the development menu, where you can run the app on Android, iOS, or the web.


## Running the AI Sentiment Service

Follow these steps to start the Python AI (ai-sentiment):

1. **Navigate to the AI directory:**

   ```bash
   cd ai-sentiment
   ```

2. **Activate the Virtual Environment:**
   - **PowerShell (VS Code default):** `.\.venv\Scripts\Activate.ps1`
   - **Command Prompt (cmd):** `.\.venv\Scripts\activate.bat`
   - **Git Bash / Mac / Linux:** `source .venv/Scripts/activate`

   _(You should see `(.venv)` appear in your terminal once activated.)_

3. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Server:**

   **Option A: Stable Mode (Recommended)**
   Use this if you want the server to be stable. 
   *Downside: You have to manually stop and restart the server if you edit the Python code.*
   ```bash
   python -m uvicorn main:app --port 8000 --workers 2
   ```

   **Option B: Development Mode**
   Use this if you want the server to automatically restart when you edit the Python code.
   ```bash
   python -m uvicorn main:app --port 8000 --reload
   ```

   **Option C: Run Python**
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
   ```

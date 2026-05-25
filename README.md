# CitiSent

CitiSent: An Emotion-Aware City-Based Reporting System with Sentiment Analysis

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
   ```bash
   python -m uvicorn main:app --port 8000 --reload
   ```

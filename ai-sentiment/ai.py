import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = None
MODEL = "gemini-flash-lite-latest"  # most token-efficient available on free tier


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


# Compact prompt with LGU office context and admin summary
PROMPT_TEMPLATE = (
    'Classify this LGU citizen report. Return JSON only with these exact keys:\n'
    '{{"urgency": "Emergency|Urgent|Moderate|Calm", "confidence": 0.0-1.0, "summary": "..."}}\n\n'
    'Rules:\n'
    '- Emergency=life threat; Urgent=serious infra; Moderate=maintenance; Calm=suggestion\n'
    '- "summary" MUST be a 1-2 sentence explanation for the admin. You MUST put a HUGE EMPHASIS on the emotion and sentiment of the citizen (e.g., frustrated, panicked, calm) alongside why the urgency was chosen for the selected office.\n\n'
    'Selected Office:{office} Location:{location} Report:{description}'
)


def analyze_report(office: str, location: str, description: str) -> dict:
    client = _get_client()

    prompt = PROMPT_TEMPLATE.format(
        office=office,
        location=location,
        description=description,
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",  # forces clean JSON — no markdown fences
            max_output_tokens=200,                  # increased to accommodate the summary
            temperature=0.1,                        # low temp = consistent, deterministic output
        ),
    )

    result = json.loads(response.text.strip())

    urgency = result.get("urgency")
    confidence = result.get("confidence")
    summary = result.get("summary", "No summary provided.")

    valid_urgency = ["Emergency", "Urgent", "Moderate", "Calm"]
    if urgency not in valid_urgency:
        raise ValueError(f"Unsupported urgency label returned by model: '{urgency}'")

    return {
        "urgency": urgency,
        "confidence": round(float(confidence), 4) if confidence else 0.0,
        "summary": summary,
    }
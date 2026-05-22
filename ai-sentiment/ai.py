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


# Compact prompt with LGU office context, admin summary, and emotion classification
PROMPT_TEMPLATE = (
    'Classify this LGU citizen report. Return JSON only with these exact keys:\n'
    '{{"urgency": "Critical|High|Medium|Low", "emotion": "Sad|Happy|Frustrated|Angry|Disappointed|Excited|Delighted|Neutral", "confidence": 0.0-1.0, "summary": "..."}}\n\n'
    'Rules:\n'
    '- Critical=life threat; High=serious infra; Medium=maintenance; Low=suggestion\n'
    '- Sad=sorrowful/grief; Happy=pleased/content; Frustrated=annoyed/dissatisfied; Angry=hostile/outraged; Disappointed=let down/unmet expectations; Excited=eager/enthusiastic; Delighted=very pleased/overjoyed; Neutral=factual/no strong feeling\n'
    '- "summary" MUST be a 1-2 sentence explanation for the admin. You MUST put a HUGE EMPHASIS on the emotion and sentiment of the citizen (e.g., frustrated, panicked, calm) alongside why the urgency was chosen for the selected office.\n\n'
    'Selected Office:{office} Location:{location} Report:{description}'
)

VALID_URGENCY = ["Critical", "High", "Medium", "Low"]
VALID_EMOTION = ["Sad", "Happy", "Frustrated", "Angry", "Disappointed", "Excited", "Delighted", "Neutral"]


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
            max_output_tokens=250,                  # increased to accommodate emotion + summary
            temperature=0.1,                        # low temp = consistent, deterministic output
        ),
    )

    result = json.loads(response.text.strip())

    urgency = result.get("urgency")
    emotion = result.get("emotion", "Neutral")
    confidence = result.get("confidence")
    summary = result.get("summary", "No summary provided.")

    if urgency not in VALID_URGENCY:
        raise ValueError(f"Unsupported urgency label returned by model: '{urgency}'")

    if emotion not in VALID_EMOTION:
        emotion = "Neutral"  # fallback for unexpected emotion values

    return {
        "urgency": urgency,
        "emotion": emotion,
        "confidence": round(float(confidence), 4) if confidence else 0.0,
        "summary": summary,
    }
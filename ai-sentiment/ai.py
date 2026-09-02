import os
import json
import asyncio
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("citisent.ai")

_client = None
MODEL = "gemini-flash-lite-latest"  # most token-efficient available on free tier
GEMINI_TIMEOUT_SECONDS = 12  # prevent hanging if Gemini is slow or rate-limited


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


async def analyze_report(office: str, location: str, description: str) -> dict:
    client = _get_client()

    prompt = PROMPT_TEMPLATE.format(
        office=office,
        location=location,
        description=description,
    )

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",  # forces clean JSON — no markdown fences
                    max_output_tokens=250,                  # increased to accommodate emotion + summary
                    temperature=0.1,                        # low temp = consistent, deterministic output
                ),
            ),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Gemini API call timed out after %ds", GEMINI_TIMEOUT_SECONDS)
        raise TimeoutError(f"Gemini API did not respond within {GEMINI_TIMEOUT_SECONDS}s")

    # Guard: Gemini may return an empty or blocked response
    raw_text = getattr(response, "text", None)
    if not raw_text or not raw_text.strip():
        logger.warning("Gemini returned empty response text")
        raise ValueError("Gemini returned an empty response")

    try:
        result = json.loads(raw_text.strip())
    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned invalid JSON: %s", raw_text[:200])
        raise ValueError(f"Gemini returned malformed JSON: {exc}")

    urgency = result.get("urgency")
    emotion = result.get("emotion", "Neutral")
    confidence = result.get("confidence")
    summary = result.get("summary", "No summary provided.")

    if urgency not in VALID_URGENCY:
        raise ValueError(f"Unsupported urgency label returned by model: '{urgency}'")

    if emotion not in VALID_EMOTION:
        emotion = "Neutral"  # fallback for unexpected emotion values

    # Guard: confidence might be a non-numeric value
    try:
        confidence_val = round(float(confidence), 4) if confidence is not None else 0.0
    except (TypeError, ValueError):
        confidence_val = 0.0

    return {
        "urgency": urgency,
        "emotion": emotion,
        "confidence": confidence_val,
        "summary": summary,
    }


SUGGESTIONS_PROMPT_TEMPLATE = (
    "You are an AI assistant helping a Local Government Unit (LGU) admin respond to a citizen's message in a chat thread.\n"
    "Based on the report details and the recent chat history, generate exactly 4 distinct, helpful, safe, and appropriate suggested replies for the admin to choose from.\n\n"
    "Report details:\n"
    "- Category/Context: {report_category}\n"
    "- Urgency: {urgency}\n"
    "- Citizen's original reported emotion/sentiment: {detected_emotion}\n\n"
    "Latest citizen message:\n"
    "\"{latest_message}\"\n\n"
    "Recent conversation context (chronological, oldest to newest):\n"
    "{conversation_context_str}\n\n"
    "Rules:\n"
    "1. Provide exactly 4 reply suggestions in the 'suggestedReplies' array, ranked by relevance/helpfulness (rank 1 is best/recommended).\n"
    "2. The suggestions must be suitable for an LGU admin responding to a citizen. They must be polite, helpful, clear, and structured professionally.\n"
    "3. Align the tone with the urgency and emotion (e.g. empathetic for angry/sad, prompt and active for critical/high urgency).\n"
    "4. Do not make unsupported promises, do not blame the citizen, and do not contradict the urgency or nature of the report.\n"
    "5. Keep suggestions concise, actionable, and ready to be loaded into a chat composer for final editing.\n"
    "6. Return JSON only with these exact keys:\n"
    "   \"suggestedReplies\": [{{ \"text\": \"...\", \"rank\": 1 }}, {{ \"text\": \"...\", \"rank\": 2 }}, {{ \"text\": \"...\", \"rank\": 3 }}, {{ \"text\": \"...\", \"rank\": 4 }}],\n"
    "   \"tone\": \"empathetic|neutral|professional|urgent\",\n"
    "   \"confidence\": 0.0-1.0,\n"
    "   \"reason\": \"...\",\n"
    "   \"triggerEmotion\": \"...\",\n"
    "   \"fallbackMessage\": \"...\"\n"
)


def get_default_suggestions(reason: str) -> dict:
    return {
        "suggestedReplies": [
            {"text": "Thank you for reaching out. We have received your message and are looking into it.", "rank": 1},
            {"text": "Could you please provide more details or clarify your request?", "rank": 2},
            {"text": "We are currently reviewing this issue and will update you as soon as possible.", "rank": 3},
            {"text": "If this is an immediate emergency, please contact our direct hotline or emergency services.", "rank": 4}
        ],
        "tone": "neutral",
        "confidence": 0.5,
        "reason": reason,
        "triggerEmotion": "Neutral",
        "fallbackMessage": "Thank you for reaching out. We have received your message and are looking into it."
    }


# Template for generating admin note suggestions. 
# We explicitly instruct the AI to use a humanized, conversational tone and to match the language 
# (including Filipino/Taglish) of the citizen's report to make the notes more accessible and user-friendly.
ADMIN_NOTE_SUGGESTIONS_PROMPT_TEMPLATE = (
    "You are assisting a Local Government Unit (LGU) admin with an internal status note for a citizen report.\n"
    "Generate exactly 4 conversational, humanized, yet professional note suggestions. The admin will review and edit one before saving it.\n\n"
    "Report details:\n"
    "- Category: {report_category}\n"
    "- Status being applied: {report_status}\n"
    "- Urgency: {urgency}\n"
    "- Citizen emotion: {detected_emotion}\n"
    "- Original report: {report_description}\n\n"
    "Recent conversation (chronological, oldest to newest):\n"
    "{conversation_context_str}\n\n"
    "Rules:\n"
    "1. Tone: Write as if a helpful human staff member is summarizing the status. Avoid overly robotic or bureaucratic phrasing.\n"
    "2. Language: ALWAYS write the suggestions in the SAME LANGUAGE as the 'Original report' or 'Recent conversation'. If it is in Filipino or Taglish, the notes MUST be in Filipino/Taglish.\n"
    "3. Suggestions are internal processing notes to track status, not direct chat replies to the citizen.\n"
    "4. pending: acknowledge triage or assignment; in_review: record investigation/progress; resolved: record a completed action and outcome; rejected: state a respectful, factual reason it cannot proceed.\n"
    "5. Use conversation details when available. If there is no conversation, tailor the wording to the citizen emotion without inventing facts.\n"
    "6. Never invent completed work, dates, contacts, evidence, or promises.\n"
    "7. Return JSON only with exactly these keys:\n"
    "   \"suggestedNotes\": [{{ \"text\": \"...\", \"rank\": 1 }}, {{ \"text\": \"...\", \"rank\": 2 }}, {{ \"text\": \"...\", \"rank\": 3 }}, {{ \"text\": \"...\", \"rank\": 4 }}],\n"
    "   \"tone\": \"empathetic|neutral|professional|urgent\",\n"
    "   \"confidence\": 0.0-1.0,\n"
    "   \"reason\": \"...\",\n"
    "   \"triggerEmotion\": \"...\"\n"
)


def get_default_admin_note_suggestions(report_status: str, reason: str) -> dict:
    """Return safe, status-specific notes when Gemini cannot produce suggestions."""
    status = str(report_status or "pending").strip().lower()
    # Fallback templates designed to sound helpful, humanized, and conversational.
    # These step away from rigid bureaucratic language while still remaining professional.
    templates_by_status = {
        "in_review": [
            "We're currently looking into this report. The assigned team is checking the details provided.",
            "Review is underway! We might need a bit more time to verify things before we can give a final update.",
            "I've forwarded this report for assessment so the right team can handle it properly.",
            "We're on it. The citizen's concern is noted and we're actively following up.",
        ],
        "resolved": [
            "Great news, we've reviewed this and completed the necessary actions.",
            "The responsible team has taken care of this based on the provided info. All sorted!",
            "We've processed the concern and it's now marked as resolved.",
            "Action complete! I'm closing this report since we've handled the review and necessary steps.",
        ],
        "rejected": [
            "We reviewed this, but unfortunately, we can't process it further with the current info.",
            "We couldn't resolve this particular concern through the report at this time.",
            "I have to close this report for now as we don't have enough details to take action.",
            "We can't proceed with this right now. We might need the citizen to submit more details later.",
        ],
        "pending": [
            "We've received the report and it's queued up for our team to review.",
            "The concern is logged and we'll assign it for triage shortly.",
            "Got the initial details! The appropriate office will review this soon.",
            "We've safely recorded the citizen's concern and will follow up on it.",
        ],
    }
    notes = templates_by_status.get(status, templates_by_status["pending"])
    return {
        "suggestedNotes": [{"text": text, "rank": index + 1} for index, text in enumerate(notes)],
        "tone": "professional",
        "confidence": 0.5,
        "reason": reason,
        "triggerEmotion": "Neutral",
    }


async def generate_suggestions(
    latest_message: str,
    conversation_context: list,
    report_category: str,
    urgency: str,
    detected_emotion: str
) -> dict:
    client = _get_client()

    # Format context list to string
    ctx_lines = []
    for msg in conversation_context:
        sender = msg.get("sender", "unknown")
        text = msg.get("text", "")
        ctx_lines.append(f"- {sender}: {text}")
    conversation_context_str = "\n".join(ctx_lines) if ctx_lines else "(No previous context)"

    prompt = SUGGESTIONS_PROMPT_TEMPLATE.format(
        latest_message=latest_message,
        conversation_context_str=conversation_context_str,
        report_category=report_category,
        urgency=urgency,
        detected_emotion=detected_emotion
    )

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=600,
                    temperature=0.2,
                ),
            ),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Gemini suggestions call timed out after %ds", GEMINI_TIMEOUT_SECONDS)
        return get_default_suggestions("Gemini suggestions API call timed out")
    except Exception as exc:
        logger.error("Gemini suggestions API call failed: %s", str(exc))
        return get_default_suggestions(f"Gemini suggestions API call failed: {str(exc)}")

    raw_text = getattr(response, "text", None)
    if not raw_text or not raw_text.strip():
        logger.warning("Gemini suggestions returned empty response")
        return get_default_suggestions("Gemini returned an empty response")

    try:
        result = json.loads(raw_text.strip())
    except json.JSONDecodeError as exc:
        logger.warning("Gemini suggestions returned invalid JSON: %s", raw_text[:200])
        return get_default_suggestions(f"Malformed JSON from Gemini: {exc}")

    # Validate output schema
    replies = result.get("suggestedReplies")
    if not isinstance(replies, list) or len(replies) != 4:
        logger.warning("Gemini suggestions did not return exactly 4 replies. Got: %s", replies)
        return get_default_suggestions("Gemini did not return exactly 4 suggestions")

    # Double check each item has text and rank
    for item in replies:
        if not isinstance(item, dict) or "text" not in item or "rank" not in item:
            logger.warning("Invalid suggestion item: %s", item)
            return get_default_suggestions("Gemini returned invalid suggestion items")

    # Enforce schema fields
    return {
        "suggestedReplies": replies,
        "tone": result.get("tone", "neutral"),
        "confidence": result.get("confidence", 0.8),
        "reason": result.get("reason", "Generated from conversation history."),
        "triggerEmotion": result.get("triggerEmotion", "Neutral"),
        "fallbackMessage": result.get("fallbackMessage", "Thank you for your message.")
    }


async def generate_admin_note_suggestions(
    report_status: str,
    conversation_context: list,
    report_category: str,
    urgency: str,
    detected_emotion: str,
    report_description: str,
) -> dict:
    """Generate structured, editable internal notes for a report status update."""
    client = _get_client()
    ctx_lines = [
        f"- {message.get('sender', 'unknown')}: {message.get('text', '')}"
        for message in conversation_context
    ]
    context_text = "\n".join(ctx_lines) if ctx_lines else "(No conversation is available.)"
    prompt = ADMIN_NOTE_SUGGESTIONS_PROMPT_TEMPLATE.format(
        report_status=report_status,
        conversation_context_str=context_text,
        report_category=report_category,
        urgency=urgency,
        detected_emotion=detected_emotion,
        report_description=report_description,
    )

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=600,
                    temperature=0.2,
                ),
            ),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        raw_text = getattr(response, "text", None)
        if not raw_text or not raw_text.strip():
            return get_default_admin_note_suggestions(report_status, "Gemini returned an empty response")
        result = json.loads(raw_text.strip())
        notes = result.get("suggestedNotes")
        if not isinstance(notes, list) or len(notes) != 4:
            return get_default_admin_note_suggestions(report_status, "Gemini did not return exactly 4 suggestions")
        for item in notes:
            if not isinstance(item, dict) or not str(item.get("text", "")).strip() or "rank" not in item:
                return get_default_admin_note_suggestions(report_status, "Gemini returned invalid suggestion items")
        return {
            "suggestedNotes": notes,
            "tone": result.get("tone", "professional"),
            "confidence": result.get("confidence", 0.8),
            "reason": result.get("reason", "Generated from report context."),
            "triggerEmotion": result.get("triggerEmotion", detected_emotion or "Neutral"),
        }
    except asyncio.TimeoutError:
        logger.warning("Gemini admin-note suggestions timed out after %ds", GEMINI_TIMEOUT_SECONDS)
        return get_default_admin_note_suggestions(report_status, "Gemini suggestions API call timed out")
    except Exception as exc:
        logger.error("Gemini admin-note suggestions failed: %s", str(exc))
        return get_default_admin_note_suggestions(report_status, f"Gemini suggestions API call failed: {exc}")

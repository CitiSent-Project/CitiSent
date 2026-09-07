import os
import json
import asyncio
import collections
import logging
import random
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("citisent.ai")

_client = None
MODEL = "gemini-flash-lite-latest"  # most token-efficient available on free tier
GEMINI_TIMEOUT_SECONDS = 30  # accommodates queuing delay + Gemini latency
GEMINI_MAX_RETRIES = 3        # retry up to 3x on transient errors
GEMINI_RETRY_BASE_DELAY = 2  # seconds — full-jitter exponential: up to 2s, 4s, 8s


class _GeminiRateLimiter:
    """
    Sliding-window rate limiter + concurrency cap for the Gemini API.

    Limits are read from environment variables so the same code works on
    both free and paid tiers — no code changes needed when upgrading:

        Free tier  (~30 RPM):  GEMINI_RPM_LIMIT=25  GEMINI_MAX_CONCURRENT=3   (defaults)
        Paid tier (~4000 RPM): GEMINI_RPM_LIMIT=2000 GEMINI_MAX_CONCURRENT=50

    Excess requests QUEUE and wait instead of crashing into 429s.

    Usage (async context manager):
        async with _rate_limiter:
            response = await client.aio.models.generate_content(...)
    """
    # Read from env — defaults are conservative free-tier values.
    # Override in docker-compose / .env when upgrading to paid tier.
    RPM_LIMIT     = int(os.getenv("GEMINI_RPM_LIMIT", "25"))      # req/min cap
    MAX_CONCURRENT = int(os.getenv("GEMINI_MAX_CONCURRENT", "3"))  # simultaneous calls

    def __init__(self) -> None:
        # Timestamps of the last RPM_LIMIT requests (sliding 60-second window)
        self._window: collections.deque = collections.deque()
        self._lock = asyncio.Lock()
        self._semaphore = asyncio.Semaphore(self.MAX_CONCURRENT)

    async def __aenter__(self):
        # 1. Concurrency gate — block if MAX_CONCURRENT already in-flight
        await self._semaphore.acquire()
        # 2. Sliding-window gate — block if RPM_LIMIT hit in last 60s
        async with self._lock:
            now = time.monotonic()
            # Drop timestamps older than 60 seconds
            while self._window and now - self._window[0] > 60.0:
                self._window.popleft()
            if len(self._window) >= self.RPM_LIMIT:
                # Wait until the oldest slot rolls out of the 60-second window
                wait = 60.0 - (now - self._window[0]) + 0.05  # tiny buffer
                logger.info(
                    "Gemini quota full (%d/%d rpm) — queuing request for %.1fs",
                    len(self._window), self.RPM_LIMIT, wait,
                )
                await asyncio.sleep(wait)
                now = time.monotonic()
                while self._window and now - self._window[0] > 60.0:
                    self._window.popleft()
            self._window.append(time.monotonic())
        return self

    async def __aexit__(self, *_):
        self._semaphore.release()


# Module-level singleton — shared across all three Gemini call sites
_rate_limiter = _GeminiRateLimiter()


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


# Trimmed prompt — same accuracy, ~30% fewer tokens = more requests fit in free quota
PROMPT_TEMPLATE = (
    'Classify this LGU citizen report. Return JSON only:\n'
    '{{"urgency":"Critical|High|Medium|Low","emotion":"Sad|Happy|Frustrated|Angry|Disappointed|Excited|Delighted|Neutral","confidence":0.0-1.0,"summary":"..."}}\n'
    'urgency: Critical=life threat; High=serious infra; Medium=maintenance; Low=suggestion\n'
    'emotion: Sad=grief; Happy=content; Frustrated=annoyed; Angry=outraged; Disappointed=let down; Excited=enthusiastic; Delighted=overjoyed; Neutral=factual\n'
    'summary: 1-2 sentences for admin. Emphasize citizen emotion+sentiment and urgency reason.\n'
    'Office:{office} Location:{location} Report:{description}'
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

    last_exc = None
    for attempt in range(1, GEMINI_MAX_RETRIES + 1):
        try:
            # Rate limiter queues this call if quota is full — no wasted 429s
            async with _rate_limiter:
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=MODEL,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",  # forces clean JSON
                            max_output_tokens=200,                  # trimmed; summary fits in 200
                            temperature=0.1,                        # low temp = consistent output
                        ),
                    ),
                    timeout=GEMINI_TIMEOUT_SECONDS,
                )
            break  # success — exit retry loop
        except asyncio.TimeoutError:
            logger.warning("Gemini timed out after %ds (attempt %d/%d)", GEMINI_TIMEOUT_SECONDS, attempt, GEMINI_MAX_RETRIES)
            last_exc = TimeoutError(f"Gemini did not respond within {GEMINI_TIMEOUT_SECONDS}s")
            if attempt < GEMINI_MAX_RETRIES:
                # Full jitter: avoids thundering-herd on simultaneous retries
                await asyncio.sleep(random.uniform(0, GEMINI_RETRY_BASE_DELAY * attempt))
            continue
        except Exception as exc:
            err_str = str(exc)
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                # Full-jitter exponential backoff: 0–2s, 0–4s, 0–8s
                delay = random.uniform(0, GEMINI_RETRY_BASE_DELAY * (2 ** (attempt - 1)))
                logger.warning(
                    "Gemini rate-limited (attempt %d/%d) — retrying in %.1fs",
                    attempt, GEMINI_MAX_RETRIES, delay,
                )
                last_exc = exc
                if attempt < GEMINI_MAX_RETRIES:
                    await asyncio.sleep(delay)
                continue
            raise  # non-retryable — propagate immediately
    else:
        raise last_exc

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
        async with _rate_limiter:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        max_output_tokens=500,
                        temperature=0.2,
                    ),
                ),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
    except asyncio.TimeoutError:
        logger.warning("Gemini suggestions timed out after %ds", GEMINI_TIMEOUT_SECONDS)
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
        async with _rate_limiter:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        max_output_tokens=500,
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

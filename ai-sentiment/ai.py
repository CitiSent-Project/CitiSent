import os
from threading import Lock

from transformers import pipeline

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

MODEL_NAME = os.getenv(
    "SENTIMENT_MODEL_NAME",
    "cross-encoder/nli-MiniLM2-L6-H768",
)

SUPPORTED_URGENCY_LEVELS = (
    "Emergency",
    "Urgent",
    "Moderate",
    "Calm",
)

_CANDIDATE_TO_URGENCY = {
    "life-threatening emergency": "Emergency",
    "urgent infrastructure repair": "Urgent",
    "routine maintenance": "Moderate",
    "community suggestion": "Calm",
}
_CANDIDATE_LABELS = tuple(_CANDIDATE_TO_URGENCY.keys())

_classifier = None
_classifier_lock = Lock()


def build_analysis_text(issue_type: str, location: str, description: str) -> str:
    return "\n".join(
        [
            f"Issue Type: {issue_type.strip()}",
            f"Location: {location.strip()}",
            f"Report: {description.strip()}",
        ]
    )


def normalize_urgency_label(value: str | None) -> str | None:
    normalized_value = str(value or "").strip().lower()

    for urgency in SUPPORTED_URGENCY_LEVELS:
        if normalized_value == urgency.lower():
            return urgency

    return _CANDIDATE_TO_URGENCY.get(normalized_value)


def _build_classifier():
    print(f"Loading Smart LGU System model: {MODEL_NAME}")
    return pipeline(
        "zero-shot-classification",
        model=MODEL_NAME,
    )


def get_classifier():
    global _classifier

    if _classifier is None:
        with _classifier_lock:
            if _classifier is None:
                _classifier = _build_classifier()

    return _classifier


def analyze_report(
    issue_type: str,
    location: str,
    description: str,
    classifier=None,
) -> dict:
    analysis_text = build_analysis_text(issue_type, location, description)
    active_classifier = classifier or get_classifier()
    result = active_classifier(analysis_text, list(_CANDIDATE_LABELS))

    labels = result.get("labels") or []
    scores = result.get("scores") or []

    if not labels or not scores:
        raise ValueError("Model returned an empty response.")

    urgency = normalize_urgency_label(labels[0])

    if not urgency:
        raise ValueError("Model returned an unsupported urgency label.")

    return {
        "urgency": urgency,
        "confidence": round(float(scores[0]), 4),
    }


def get_model_status() -> dict:
    classifier = get_classifier()

    return {
        "status": "ready",
        "model": MODEL_NAME,
        "supportedUrgencyLevels": list(SUPPORTED_URGENCY_LEVELS),
        "candidateLabels": list(_CANDIDATE_LABELS),
        "classifierType": classifier.__class__.__name__,
    }

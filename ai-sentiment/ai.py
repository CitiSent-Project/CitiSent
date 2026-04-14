import os
from transformers import pipeline

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
print("Loading Smart LGU System...")

classifier = pipeline("zero-shot-classification", model="cross-encoder/nli-MiniLM2-L6-H768")

priority_map = {
    "life-threatening emergency": "CRITICAL",
    "urgent infrastructure repair": "HIGH",
    "routine maintenance": "MEDIUM",
    "community suggestion": "LOW"
}

candidate_labels = list(priority_map.keys())

# Shared in-memory DB
reports_db = []

def analyze_report(text: str) -> dict:
    result = classifier(text, candidate_labels)
    top_category = result['labels'][0]
    score = result['scores'][0]

    return {
        "name": priority_map[top_category],
        "confidence": round(score, 4)
    }
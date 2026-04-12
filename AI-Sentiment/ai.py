import os
from transformers import pipeline

# Setup
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
print("Loading Smart LGU System (Standardized Labels)...")

# Load the classifier model
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Smart-to-Label Mapping
priority_map = {
    "life-threatening emergency": "LABEL_0",   # Critical
    "urgent infrastructure repair": "LABEL_1", # High
    "routine maintenance": "LABEL_2",           # Medium
    "community suggestion": "LABEL_3"           # Low
}

display_names = {
    "LABEL_0": "CRITICAL",
    "LABEL_1": "HIGH",
    "LABEL_2": "MEDIUM",
    "LABEL_3": "LOW"
}

candidate_labels = list(priority_map.keys())

# Shared in-memory database
reports_db = []

def analyze_report(text):
    """Run AI classification and return structured result."""
    result = classifier(text, candidate_labels)
    smart_category = result['labels'][0]
    score = result['scores'][0]
    original_label = priority_map[smart_category]

    return {
        "text": text,
        "label": original_label,
        "name": display_names[original_label],
        "confidence": round(score, 4)
    }
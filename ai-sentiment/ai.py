import os
from transformers import pipeline

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
print("Loading Smart LGU System Models...")

# Model 1: The Event Urgency Classifier
classifier_urgency = pipeline("zero-shot-classification", model="cross-encoder/nli-MiniLM2-L6-H768")
urgency_labels = [
    "life-threatening emergency", 
    "urgent infrastructure repair", 
    "routine maintenance", 
    "community suggestion"
]

# Model 2: The Emotion Classifier
# This model outputs specific emotions (e.g., 'panic', 'fear', 'anger', 'neutral')
classifier_emotion = pipeline("text-classification", model="SamLowe/roberta-base-go_emotions")

# Shared in-memory DB
reports_db = []

def determine_final_priority(urgency: str, emotion: str) -> str:
    """
    A matrix that dictates the final priority based on what happened + how they feel.
    """
    # High-distress emotions that should escalate an issue
    escalation_emotions = ["panic", "fear", "nervousness", "anger", "annoyance"]
    
    if urgency == "life-threatening emergency":
        return "CRITICAL" # Always critical, regardless of emotion
        
    elif urgency == "urgent infrastructure repair":
        if emotion in escalation_emotions:
            return "CRITICAL" # Escalated due to citizen distress
        return "HIGH"
        
    elif urgency == "routine maintenance":
        if emotion in escalation_emotions:
            return "HIGH" # Escalated due to frustration/anger
        return "MEDIUM"
        
    else: # community suggestion
        return "LOW"

def analyze_report(text: str) -> dict:
    # 1. Analyze the Event
    urgency_result = classifier_urgency(text, urgency_labels)
    top_urgency = urgency_result['labels'][0]
    urgency_score = urgency_result['scores'][0]
    
    # 2. Analyze the Emotion
    emotion_result = classifier_emotion(text)[0]
    top_emotion = emotion_result['label']
    emotion_score = emotion_result['score']
    
    # 3. Calculate Final Priority
    final_priority = determine_final_priority(top_urgency, top_emotion)
    
    return {
        "final_priority": final_priority,
        "event_type": top_urgency,
        "emotion_detected": top_emotion,
        "urgency_confidence": round(urgency_score, 4),
        "emotion_confidence": round(emotion_score, 4)
    }
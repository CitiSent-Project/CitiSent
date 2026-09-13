import pytest
from fastapi.testclient import TestClient

import api.get_report as get_report_module
import api.post_report as post_report_module
import api.get_suggestions as get_suggestions_module
from main import app

client = TestClient(app)


def test_analyze_endpoint_returns_normalized_urgency(monkeypatch):
    async def fake_analyze_report(office, location, description):
        assert office == "BFP"
        assert location == "Riverside"
        assert description == "Water level is rising quickly."
        return {
            "urgency": "Critical",
            "emotion": "Frustrated",
            "confidence": 0.9731,
            "summary": "Flooding reported in Riverside area.",
        }

    monkeypatch.setattr(post_report_module, "analyze_report", fake_analyze_report)

    response = client.post(
        "/analyze",
        json={
            "office": "BFP",
            "location": "Riverside",
            "description": "Water level is rising quickly.",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "urgency": "Critical",
        "emotion": "Frustrated",
        "confidence": 0.9731,
        "summary": "Flooding reported in Riverside area.",
    }


def test_analyze_endpoint_rejects_trimmed_empty_fields():
    response = client.post(
        "/analyze",
        json={
            "office": "   ",
            "location": "Riverside",
            "description": "Water level is rising quickly.",
        },
    )
    assert response.status_code == 400
    assert "Office cannot be empty" in response.json()["detail"]

    response = client.post(
        "/analyze",
        json={
            "office": "BFP",
            "location": "   ",
            "description": "Water level is rising quickly.",
        },
    )
    assert response.status_code == 400
    assert "Location cannot be empty" in response.json()["detail"]


def test_analyze_endpoint_rejects_short_descriptions():
    response = client.post(
        "/analyze",
        json={
            "office": "Flooding",
            "location": "Riverside",
            "description": "Too short",
        },
    )

    assert response.status_code == 422


def test_analyze_endpoint_handles_value_error(monkeypatch):
    async def fake_analyze_report(office, location, description):
        raise ValueError("Unsupported urgency label returned by model")

    monkeypatch.setattr(post_report_module, "analyze_report", fake_analyze_report)

    response = client.post(
        "/analyze",
        json={
            "office": "BFP",
            "location": "Riverside",
            "description": "Water level is rising quickly.",
        },
    )

    assert response.status_code == 422
    assert "Unsupported urgency label" in response.json()["detail"]


def test_status_endpoint_returns_readiness_metadata(monkeypatch):
    response = client.get("/status")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "model" in data
    assert data["supportedUrgencyLevels"] == ["Emergency", "Urgent", "Moderate", "Calm"]


def test_status_endpoint_returns_503_when_client_fails(monkeypatch):
    def fake_get_client():
        raise RuntimeError("Failed to configure client")

    import ai
    monkeypatch.setattr(ai, "_get_client", fake_get_client)

    response = client.get("/status")
    assert response.status_code == 503
    assert response.json()["detail"] == "Sentiment analysis model is unavailable."


def test_admin_note_suggestions_endpoint(monkeypatch):
    async def fake_generate_admin_note_suggestions(**kwargs):
        return {
            "suggestedNotes": [
                {"text": "Note 1", "rank": 1},
                {"text": "Note 2", "rank": 2},
                {"text": "Note 3", "rank": 3},
                {"text": "Note 4", "rank": 4},
            ],
            "tone": "professional",
            "confidence": 0.9,
            "reason": "Status update",
            "triggerEmotion": "Neutral",
        }

    monkeypatch.setattr(get_suggestions_module, "generate_admin_note_suggestions", fake_generate_admin_note_suggestions)

    response = client.post(
        "/admin-notes/suggestions",
        json={
            "reportStatus": "in_review",
            "conversationContext": [],
            "reportCategory": "Roads",
            "urgency": "Medium",
            "detectedEmotion": "Neutral",
            "reportDescription": "Pothole in road",
        },
    )

    assert response.status_code == 200
    assert len(response.json()["suggestedNotes"]) == 4


def test_internal_api_key_authentication(monkeypatch):
    test_key = "test-internal-secret-key-12345"
    monkeypatch.setenv("SENTIMENT_API_KEY", test_key)

    async def fake_analyze(office, location, description):
        return {"urgency": "Low", "emotion": "Neutral", "confidence": 0.8, "summary": "ok"}

    monkeypatch.setattr(post_report_module, "analyze_report", fake_analyze)

    payload = {
        "office": "Engineering",
        "location": "Main St",
        "description": "Streetlight flickering",
    }

    # 1. Missing API key returns 401
    res_missing = client.post("/analyze", json=payload)
    assert res_missing.status_code == 401
    assert "Missing internal API key" in res_missing.json()["detail"]

    # 2. Invalid API key returns 401
    res_invalid = client.post("/analyze", json=payload, headers={"X-API-Key": "wrong-key"})
    assert res_invalid.status_code == 401
    assert "Invalid internal API key" in res_invalid.json()["detail"]

    # 3. Valid API key succeeds (200)
    res_valid = client.post("/analyze", json=payload, headers={"X-API-Key": test_key})
    assert res_valid.status_code == 200
    assert res_valid.json()["urgency"] == "Low"

    # 4. Health check endpoint is public without key
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"


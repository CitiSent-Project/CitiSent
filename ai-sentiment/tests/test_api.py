from fastapi.testclient import TestClient

import api.get_report as get_report_module
import api.post_report as post_report_module
from main import app

client = TestClient(app)


def test_analyze_endpoint_returns_normalized_urgency(monkeypatch):
    def fake_analyze_report(issue_type, location, description):
        assert issue_type == "Flooding"
        assert location == "Riverside"
        assert description == "Water level is rising quickly."
        return {
            "urgency": "Emergency",
            "confidence": 0.9731,
        }

    monkeypatch.setattr(post_report_module, "analyze_report", fake_analyze_report)

    response = client.post(
        "/analyze",
        json={
            "issueType": "Flooding",
            "location": "Riverside",
            "description": "Water level is rising quickly.",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "urgency": "Emergency",
        "confidence": 0.9731,
    }


def test_analyze_endpoint_rejects_trimmed_empty_fields():
    response = client.post(
        "/analyze",
        json={
            "issueType": "   ",
            "location": "Riverside",
            "description": "Water level is rising quickly.",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Issue type cannot be empty."


def test_analyze_endpoint_rejects_short_descriptions():
    response = client.post(
        "/analyze",
        json={
            "issueType": "Flooding",
            "location": "Riverside",
            "description": "Too short",
        },
    )

    assert response.status_code == 422


def test_status_endpoint_returns_readiness_metadata(monkeypatch):
    monkeypatch.setattr(
        get_report_module,
        "get_model_status",
        lambda: {
            "status": "ready",
            "model": "stub-model",
            "supportedUrgencyLevels": ["Emergency", "Urgent", "Moderate", "Calm"],
            "candidateLabels": ["life-threatening emergency"],
            "classifierType": "FakeClassifier",
        },
    )

    response = client.get("/status")

    assert response.status_code == 200
    assert response.json()["supportedUrgencyLevels"] == [
        "Emergency",
        "Urgent",
        "Moderate",
        "Calm",
    ]


def test_status_endpoint_returns_503_when_model_is_unavailable(monkeypatch):
    def fake_get_model_status():
        raise RuntimeError("model unavailable")

    monkeypatch.setattr(get_report_module, "get_model_status", fake_get_model_status)

    response = client.get("/status")

    assert response.status_code == 503
    assert response.json()["detail"] == "Sentiment analysis model is unavailable."

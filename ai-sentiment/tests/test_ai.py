import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock

import ai


class FakeResponse:
    def __init__(self, text: str):
        self.text = text


def make_mock_client(response_text: str = None, side_effect=None):
    mock_client = MagicMock()
    if side_effect:
        mock_client.aio.models.generate_content = AsyncMock(side_effect=side_effect)
    else:
        mock_client.aio.models.generate_content = AsyncMock(return_value=FakeResponse(response_text))
    return mock_client


def test_analyze_report_success(monkeypatch):
    async def _test():
        expected_data = {
            "urgency": "Critical",
            "emotion": "Frustrated",
            "confidence": 0.9542,
            "summary": "Citizen is expressing urgency regarding power lines.",
        }
        fake_client = make_mock_client(json.dumps(expected_data))
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client)

        result = await ai.analyze_report(
            office="City Engineering Office",
            location="Barangay 1",
            description="Fallen power line across the main street.",
        )

        assert result["urgency"] == "Critical"
        assert result["emotion"] == "Frustrated"
        assert result["confidence"] == 0.9542
        assert result["summary"] == "Citizen is expressing urgency regarding power lines."

    asyncio.run(_test())


def test_analyze_report_fallback_emotion_and_non_numeric_confidence(monkeypatch):
    async def _test():
        data = {
            "urgency": "Low",
            "emotion": "UnknownEmotion",
            "confidence": "not-a-number",
            "summary": "Inquiry about permits.",
        }
        fake_client = make_mock_client(json.dumps(data))
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client)

        result = await ai.analyze_report(
            office="BPLO",
            location="City Hall",
            description="Asking about business permit renewal steps.",
        )

        assert result["urgency"] == "Low"
        assert result["emotion"] == "Neutral"  # fallback to Neutral
        assert result["confidence"] == 0.0

    asyncio.run(_test())


def test_analyze_report_rejects_unsupported_urgency(monkeypatch):
    async def _test():
        data = {
            "urgency": "SevereDanger",  # not in VALID_URGENCY
            "emotion": "Angry",
            "confidence": 0.9,
            "summary": "Emergency.",
        }
        fake_client = make_mock_client(json.dumps(data))
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client)

        with pytest.raises(ValueError, match="Unsupported urgency label"):
            await ai.analyze_report(
                office="BFP",
                location="Barangay 2",
                description="Fire spreading rapidly to adjacent houses.",
            )

    asyncio.run(_test())


def test_analyze_report_empty_or_malformed_response(monkeypatch):
    async def _test():
        # Empty response
        fake_client_empty = make_mock_client("")
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client_empty)
        with pytest.raises(ValueError, match="empty response"):
            await ai.analyze_report("Office", "Location", "Valid description here.")

        # Malformed JSON
        fake_client_bad_json = make_mock_client("not-a-valid-json")
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client_bad_json)
        with pytest.raises(ValueError, match="malformed JSON"):
            await ai.analyze_report("Office", "Location", "Valid description here.")

    asyncio.run(_test())


def test_analyze_report_timeout(monkeypatch):
    async def _test():
        async def delayed_generate(*args, **kwargs):
            await asyncio.sleep(2)
            return FakeResponse("{}")

        fake_client = MagicMock()
        fake_client.aio.models.generate_content = delayed_generate
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client)
        monkeypatch.setattr(ai, "GEMINI_TIMEOUT_SECONDS", 0.05)

        with pytest.raises(TimeoutError, match="Gemini.*did not respond"):
            await ai.analyze_report("Office", "Location", "Valid description here.")

    asyncio.run(_test())





def test_get_default_admin_note_suggestions_by_status():
    for status in ["pending", "in_review", "resolved", "rejected"]:
        notes = ai.get_default_admin_note_suggestions(status, f"Default for {status}")
        assert len(notes["suggestedNotes"]) == 4
        assert notes["reason"] == f"Default for {status}"
        assert notes["suggestedNotes"][0]["rank"] == 1





def test_generate_admin_note_suggestions_success(monkeypatch):
    async def _test():
        response_payload = {
            "suggestedNotes": [
                {"text": "Assigned to road maintenance unit.", "rank": 1},
                {"text": "Pothole patch scheduled for tomorrow.", "rank": 2},
                {"text": "Awaiting asphalt delivery.", "rank": 3},
                {"text": "Site inspection completed.", "rank": 4},
            ],
            "tone": "professional",
            "confidence": 0.9,
            "reason": "Status change to in_review.",
            "triggerEmotion": "Neutral",
        }
        fake_client = make_mock_client(json.dumps(response_payload))
        monkeypatch.setattr(ai, "_get_client", lambda: fake_client)

        result = await ai.generate_admin_note_suggestions(
            report_status="in_review",
            conversation_context=[],
            report_category="Roads",
            urgency="Medium",
            detected_emotion="Neutral",
            report_description="Deep pothole in front of market.",
        )

        assert len(result["suggestedNotes"]) == 4
        assert result["suggestedNotes"][0]["text"] == "Assigned to road maintenance unit."

    asyncio.run(_test())

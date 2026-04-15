import pytest

import ai


def test_build_analysis_text_is_deterministic():
    analysis_text = ai.build_analysis_text(
        issue_type="Road Repair",
        location="Barangay San Miguel",
        description="A large pothole is blocking one lane.",
    )

    assert analysis_text == (
        "Issue Type: Road Repair\n"
        "Location: Barangay San Miguel\n"
        "Report: A large pothole is blocking one lane."
    )


def test_get_classifier_builds_the_model_once(monkeypatch):
    created_instances = []

    def fake_build_classifier():
        instance = object()
        created_instances.append(instance)
        return instance

    monkeypatch.setattr(ai, "_classifier", None)
    monkeypatch.setattr(ai, "_build_classifier", fake_build_classifier)

    first_classifier = ai.get_classifier()
    second_classifier = ai.get_classifier()

    assert first_classifier is second_classifier
    assert created_instances == [first_classifier]


def test_normalize_urgency_label_handles_candidate_and_final_values():
    assert ai.normalize_urgency_label("life-threatening emergency") == "Emergency"
    assert ai.normalize_urgency_label("urgent") == "Urgent"
    assert ai.normalize_urgency_label("Moderate") == "Moderate"
    assert ai.normalize_urgency_label("not-supported") is None


def test_analyze_report_normalizes_model_output():
    class FakeClassifier:
        def __call__(self, text, candidate_labels):
            assert "Issue Type: Flooding" in text
            assert "Location: Riverside" in text
            assert "Report: Water level is rising quickly." in text
            assert candidate_labels
            return {
                "labels": ["life-threatening emergency"],
                "scores": [0.9812],
            }

    result = ai.analyze_report(
        issue_type="Flooding",
        location="Riverside",
        description="Water level is rising quickly.",
        classifier=FakeClassifier(),
    )

    assert result == {
        "urgency": "Emergency",
        "confidence": 0.9812,
    }


def test_analyze_report_rejects_unsupported_model_labels():
    class FakeClassifier:
        def __call__(self, _text, _candidate_labels):
            return {
                "labels": ["unsupported label"],
                "scores": [0.45],
            }

    with pytest.raises(ValueError, match="unsupported urgency label"):
        ai.analyze_report(
            issue_type="Streetlight",
            location="Main Avenue",
            description="The streetlight has been out for three days.",
            classifier=FakeClassifier(),
        )

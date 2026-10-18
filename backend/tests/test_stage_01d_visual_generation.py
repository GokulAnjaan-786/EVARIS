"""EVARIS — Stage 01D Automated Test Suite: Live Speech-to-Visual Generation.

Verifies end-to-end routing from raw speech transcripts to:
1. Concept and parser selection
2. Equation and coefficient extraction
3. RenderMode selection (CREATE, UPDATE, HIGHLIGHT, RETAIN)
4. Schema validation of VisualPayload
5. Correct dynamic mathematical derivations (roots, vertex, intercepts)
6. Churn suppression and ambiguity rejection
"""

import pytest
import numpy as np
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.speech.whisper_engine import WhisperSpeechEngine
from app.understanding.speech_concept_router import SpeechConceptRouter
from app.understanding.decision_engine import DecisionEngine
from app.visual.models import RenderMode, VisualTypology


def receive_event_of_type(websocket, event_type: str, max_tries: int = 15):
    for _ in range(max_tries):
        msg = websocket.receive_json()
        if msg.get("event_type") == event_type:
            return msg
    raise TimeoutError(f"Did not receive expected event '{event_type}' within {max_tries} frames")



def test_stage_01d_four_core_sentences_progression():
    """Validates the exact 4-sentence progression requested in Stage 01D:
    1. 'Plot y equals two x plus five.' -> CREATE line y = 2x + 5
    2. 'Now plot y equals three x minus two.' -> UPDATE line y = 3x - 2
    3. 'Plot y equals x squared plus two x minus eight.' -> CREATE parabola y = x^2 + 2x - 8
    4. 'Highlight the vertex of the current parabola.' -> HIGHLIGHT vertex (-1.0, -9.0)
    """
    router = SpeechConceptRouter()
    engine = DecisionEngine()

    # Sentence 1: "Plot y equals two x plus five."
    s1 = "Plot y equals two x plus five."
    p1, c1, found1 = router.route_speech_to_visual(s1, "Mathematics", engine)
    assert found1 is True
    assert p1 is not None
    assert p1.mode == RenderMode.CREATE
    assert p1.typology == VisualTypology.FUNCTION_GRAPH
    assert "2x + 5" in p1.data["function_latex"]
    assert p1.data["function_expr"] == "2.0*x + (5.0)"
    # Intercepts
    points1 = {pt["id"]: pt for pt in p1.data["points"]}
    assert "y_intercept" in points1
    assert points1["y_intercept"]["coordinates"] == [0.0, 5.0]
    assert "x_intercept" in points1
    assert points1["x_intercept"]["coordinates"] == [-2.5, 0.0]

    # Sentence 2: "Now plot y equals three x minus two."
    s2 = "Now plot y equals three x minus two."
    p2, c2, found2 = router.route_speech_to_visual(s2, "Mathematics", engine)
    assert found2 is True
    assert p2 is not None
    assert p2.mode == RenderMode.UPDATE, f"Expected UPDATE for parameter change, got {p2.mode}"
    assert p2.typology == VisualTypology.FUNCTION_GRAPH
    assert "3x - 2" in p2.data["function_latex"]
    assert p2.data["function_expr"] == "3.0*x + (-2.0)"
    points2 = {pt["id"]: pt for pt in p2.data["points"]}
    assert points2["y_intercept"]["coordinates"] == [0.0, -2.0]

    # Sentence 3: "Plot y equals x squared plus two x minus eight."
    s3 = "Plot y equals x squared plus two x minus eight."
    p3, c3, found3 = router.route_speech_to_visual(s3, "Mathematics", engine)
    assert found3 is True
    assert p3 is not None
    assert p3.mode == RenderMode.CREATE
    assert p3.typology == VisualTypology.FUNCTION_GRAPH
    assert "x^2 + 2x - 8" in p3.data["function_latex"]
    assert p3.data["function_expr"] == "1.0*x*x + (2.0)*x + (-8.0)"
    # Domain and range auto-framed around roots [-4, 2] and vertex [-1, -9]
    assert p3.data["range"][0] <= -9.0
    assert p3.data["domain"][0] <= -4.0
    assert p3.data["domain"][1] >= 2.0

    # Sentence 4: "Highlight the vertex of the current parabola."
    s4 = "Highlight the vertex of the current parabola."
    p4, c4, found4 = router.route_speech_to_visual(s4, "Mathematics", engine)
    assert found4 is True
    assert p4 is not None
    assert p4.mode == RenderMode.HIGHLIGHT, f"Expected HIGHLIGHT for vertex request, got {p4.mode}"
    assert p4.typology == VisualTypology.FUNCTION_GRAPH
    vertex_pt = next((pt for pt in p4.data["points"] if pt["id"] == "vertex_pt"), None)
    assert vertex_pt is not None, "vertex_pt not found in points"
    assert vertex_pt["highlight"] is True
    assert vertex_pt["coordinates"] == [-1.0, -9.0], f"Expected vertex (-1.0, -9.0), got {vertex_pt['coordinates']}"
    assert "Vertex (-1, -9)" in vertex_pt["label"]


def test_stage_01d_previously_unseen_equations():
    """Verifies that unseen, novel equation values produce distinct, accurate graph payloads."""
    router = SpeechConceptRouter()
    engine = DecisionEngine()

    # Unseen Equation A: negative slope line
    p_a, _, found_a = router.route_speech_to_visual(
        "Plot y equals minus four x plus ten.", "Mathematics", engine
    )
    assert found_a is True
    assert p_a is not None
    assert p_a.mode == RenderMode.CREATE
    assert "-4x + 10" in p_a.data["function_latex"]
    assert p_a.data["function_expr"] == "-4.0*x + (10.0)"
    points_a = {pt["id"]: pt for pt in p_a.data["points"]}
    assert points_a["y_intercept"]["coordinates"] == [0.0, 10.0]
    assert points_a["x_intercept"]["coordinates"] == [2.5, 0.0]

    # Unseen Equation B: quadratic with b=0
    p_b, _, found_b = router.route_speech_to_visual(
        "Plot y equals two x squared minus twelve.", "Mathematics", engine
    )
    assert found_b is True
    assert p_b is not None
    assert p_b.mode == RenderMode.CREATE
    assert "2x^2 - 12" in p_b.data["function_latex"]
    assert p_b.data["function_expr"] == "2.0*x*x + (0.0)*x + (-12.0)"
    # Vertex is at x=0, y=-12
    p_b_vert, _, _ = router.route_speech_to_visual(
        "Highlight the vertex of the curve.", "Mathematics", engine
    )
    assert p_b_vert is not None
    assert p_b_vert.mode == RenderMode.HIGHLIGHT
    vpt = next((pt for pt in p_b_vert.data["points"] if pt["id"] == "vertex_pt"), None)
    assert vpt is not None
    assert vpt["coordinates"] == [0.0, -12.0]


def test_stage_01d_ambiguity_and_conversational_suppression():
    """Verifies that ambiguous speech and casual classroom phrases do not fabricate visuals."""
    router = SpeechConceptRouter()
    engine = DecisionEngine()

    phrases = [
        "Can everyone hear me clearly in the back?",
        "Good morning everyone, welcome to today's lecture.",
        "Please take out your notebooks and write this down.",
        "Let's move on to the next slide now.",
        "Testing one two three, is the mic working?"
    ]

    for phrase in phrases:
        payload, concept, is_found = router.route_speech_to_visual(phrase, "Mathematics", engine)
        assert payload is None, f"Phrase '{phrase}' unexpectedly created visual: {payload}"
        assert is_found is False


def test_stage_01d_websocket_live_speech_pipeline():
    """Tests the full live pipeline through the WebSocket endpoint across all 7 stages:
    Ingestion -> Whisper VAD/Transcribe -> Router -> DecisionEngine -> Validated Payload -> Frontend Render Confirmation
    """
    client = TestClient(app)

    # 1.5s audio pulse at 440Hz (48,000 bytes at 16kHz 16-bit PCM)
    t = np.linspace(0, 1.5, int(16000 * 1.5), endpoint=False)
    sine_pcm = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16).tobytes()

    with client.websocket_connect("/ws/classroom/session_stage01d_e2e") as websocket:
        # Initial greeting/state sync
        _ = websocket.receive_json()

        # Start live session in Mathematics
        websocket.send_json({
            "command": "START_LIVE_AUDIO",
            "payload": {"subject": "Mathematics"}
        })
        status_msg = receive_event_of_type(websocket, "STATUS_CHANGE")
        assert status_msg["payload"]["status"] == "LISTENING"

        test_steps = [
            ("Plot y equals two x plus five.", "CREATE", "2x + 5"),
            ("Now plot y equals three x minus two.", "UPDATE", "3x - 2"),
            ("Plot y equals x squared plus two x minus eight.", "CREATE", "x^2 + 2x - 8"),
            ("Highlight the vertex of the current parabola.", "HIGHLIGHT", "(-1, -9)")
        ]

        for sentence, expected_mode, expected_identifier in test_steps:
            with patch.object(
                WhisperSpeechEngine,
                "transcribe_audio_chunk",
                return_value=(sentence, 42.0, 0.08, True)
            ):
                # Send raw PCM audio
                websocket.send_bytes(sine_pcm)

                # Stage 1-3: Transcript update
                tx_event = receive_event_of_type(websocket, "TRANSCRIPT_UPDATE")
                assert tx_event["payload"]["is_live"] is True
                assert tx_event["payload"]["sentence"] == sentence

                # Stage 4-6: Visual payload validated and dispatched
                vis_event = receive_event_of_type(websocket, "VISUAL_PAYLOAD")
                payload = vis_event["payload"]
                assert payload["mode"] == expected_mode
                assert payload["typology"] == "FUNCTION_GRAPH"
                if expected_mode in ["CREATE", "UPDATE"]:
                    assert expected_identifier in payload["data"]["function_latex"]
                elif expected_mode == "HIGHLIGHT":
                    vpt = next((p for p in payload["data"]["points"] if p["id"] == "vertex_pt"), None)
                    assert vpt is not None
                    assert expected_identifier in vpt["label"]
                    assert vpt["coordinates"] == [-1.0, -9.0]

                # Stage 7: Client confirms DOM rendering
                websocket.send_json({
                    "command": "VISUAL_RENDERED",
                    "payload": {
                        "visual_id": payload["visual_id"],
                        "render_duration_ms": 3.4
                    }
                })
                render_diag = receive_event_of_type(websocket, "DIAGNOSTIC_EVENT")
                assert render_diag["payload"]["stage"] == "FRONTEND_RENDERED"


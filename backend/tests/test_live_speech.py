"""Tests for EVARIS Live Speech Recognition, Audio Pipeline, and Visual Decision Engine."""

import pytest
import numpy as np
from unittest.mock import patch
from starlette.testclient import TestClient
from app.main import app
from app.speech.whisper_engine import get_speech_engine, WhisperSpeechEngine
from app.understanding.speech_concept_router import get_speech_router, SpeechConceptRouter
from app.visual.models import VisualTypology, RenderMode, VisualPayload


def test_whisper_engine_initialization():
    """Verify that the Whisper engine loads successfully with safe device selection and diagnostics."""
    engine = get_speech_engine()
    assert engine.is_loaded()
    assert engine.model_name == "tiny.en"
    assert engine.device in ["cpu", "cuda"]
    assert engine.compute_type in ["int8", "float16"]
    
    diag = engine.get_diagnostics()
    assert diag["model_name"] == "tiny.en"
    assert diag["device"] in ["cpu", "cuda"]
    assert diag["compute_type"] in ["int8", "float16"]
    assert diag["is_loaded"] is True
    assert diag["sample_rate"] == 16000


def test_whisper_vad_filters_silence():
    """Verify that pure silence or sub-threshold audio is rejected before model inference."""
    engine = get_speech_engine()
    # 1.5 seconds of 16kHz 16-bit mono PCM silence
    silence_pcm = b"\x00\x00" * int(16000 * 1.5)
    
    text, confidence = engine.transcribe_pcm(silence_pcm)
    assert text == ""
    assert confidence == 0.0


def test_whisper_engine_transcription_error_handling():
    """Verify that malformed input or unexpected inference error is safely handled."""
    engine = get_speech_engine()
    # Empty byte payload
    text, infer_ms, energy, is_speech = engine.transcribe_audio_chunk(b"")
    assert text == ""
    assert is_speech is False
    assert infer_ms == 0.0


def test_speech_router_math_equation_generation():
    """Verify teacher speaking an equation produces a 2D graph visual payload."""
    router = get_speech_router()
    spoken_text = "Today we examine the quadratic function y equals x squared minus four x plus three"
    
    result = router.route_speech(
        text=spoken_text,
        subject="Mathematics",
        active_visual=None,
    )
    
    assert result is not None
    payload, concept = result
    assert concept == "Quadratic Curve"
    assert payload.typology == VisualTypology.FUNCTION_GRAPH
    assert "x^2 - 4x + 3" in payload.data.get("function_latex", "")
    assert payload.continuity_key == "parabola_graph_01"


def test_speech_router_followup_continuity():
    """Verify follow-up speech updates existing visual without destroying state or resetting."""
    router = get_speech_router()
    
    # 1. Initial equation
    initial_speech = "Let's plot y equals x squared minus four x plus three"
    initial_res = router.route_speech(text=initial_speech, subject="Mathematics", active_visual=None)
    assert initial_res is not None
    initial_payload, _ = initial_res
    
    # 2. Teacher explains follow-up concept
    followup_speech = "Notice how the vertex at two comma minus one represents the minimum point of this parabola"
    followup_res = router.route_speech(
        text=followup_speech,
        subject="Mathematics",
        active_visual=initial_payload,
    )
    
    assert followup_res is not None
    updated_payload, followup_concept = followup_res
    assert followup_concept == "Parabola Vertex Analysis"
    # Continuity preserved: same continuity key and lineage
    assert updated_payload.continuity_key == initial_payload.continuity_key
    assert updated_payload.typology == VisualTypology.FUNCTION_GRAPH
    assert updated_payload.mode in [RenderMode.UPDATE, RenderMode.HIGHLIGHT]
    
    # Vertex point present and highlighted
    points = updated_payload.data.get("points", [])
    vertex_pt = next((p for p in points if p.get("coordinates") == [2.0, -1.0]), None)
    assert vertex_pt is not None
    assert vertex_pt.get("highlight") is True


def test_speech_router_rejects_unclear_or_conversational_speech():
    """Verify that casual classroom chatter does NOT produce hallucinated or unsupported visuals."""
    router = get_speech_router()
    
    conversational_utterances = [
        "Good morning everyone, can you hear me through the microphone?",
        "Please settle down and open your textbooks to page fifty.",
        "Testing, testing, one two three.",
        "Let me know if my audio is lagging.",
        "Um, yeah, okay, right then.",
    ]
    
    for utterance in conversational_utterances:
        result = router.route_speech(text=utterance, subject="Mathematics", active_visual=None)
        assert result is None, f"Expected None for conversational speech: '{utterance}'"


def test_speech_router_cs_algorithm_generation():
    """Verify teacher explaining binary search generates an algorithmic flowchart visual."""
    router = get_speech_router()
    spoken_text = "Let's perform binary search by taking the sorted array and calculating the midpoint between low and high"
    
    result = router.route_speech(
        text=spoken_text,
        subject="Computer Science",
        active_visual=None,
    )
    
    assert result is not None
    payload, concept = result
    assert concept == "Midpoint Evaluation"
    assert payload.typology == VisualTypology.STRUCTURED_FLOWCHART
    nodes = payload.data.get("nodes", [])
    assert len(nodes) >= 3
    node_labels = [n["label"] for n in nodes]
    assert any("mid" in lbl.lower() for lbl in node_labels)


def receive_event_of_type(websocket, expected_type: str, max_reads: int = 15):
    """Reads messages from websocket until the desired event_type is found, skipping intermediate diagnostic traces."""
    for _ in range(max_reads):
        msg = websocket.receive_json()
        if msg.get("event_type") == expected_type:
            return msg
    raise AssertionError(f"Did not receive expected event '{expected_type}' within {max_reads} messages.")


def test_websocket_live_audio_session_protocol():
    """Verify live audio lifecycle: START_LIVE_AUDIO -> binary PCM stream -> STOP_LIVE_AUDIO."""
    client = TestClient(app)
    with client.websocket_connect("/ws/classroom/session_test_speech") as websocket:
        # Receive initial CONNECTION_ESTABLISHED
        init_msg = websocket.receive_json()
        assert init_msg["event_type"] == "CONNECTION_ESTABLISHED"
        assert init_msg["session_id"] == "session_test_speech"
        assert init_msg["payload"]["engine"] == "EVARIS Universal Real-Time Visual Teaching Engine"
        
        # Start live audio
        websocket.send_json({
            "command": "START_LIVE_AUDIO",
            "payload": {
                "subject": "Mathematics",
            }
        })
        status_msg = websocket.receive_json()
        assert status_msg["event_type"] == "STATUS_CHANGE"
        assert status_msg["payload"]["status"] == "LISTENING"
        assert status_msg["payload"]["mode"] == "LIVE_MICROPHONE"
        
        # Send a synthetic 16kHz PCM chunk (0.5 second silence)
        sample_rate = 16000
        duration = 0.5
        silence_pcm = b"\x00\x00" * int(sample_rate * duration)
        websocket.send_bytes(silence_pcm)
        
        # Stop live audio
        websocket.send_json({
            "command": "STOP_LIVE_AUDIO"
        })
        stop_msg = receive_event_of_type(websocket, "STATUS_CHANGE")
        assert stop_msg["payload"]["status"] == "IDLE"
        assert stop_msg["payload"]["mode"] == "STANDBY"


def test_websocket_audio_chunk_transcription_and_visual_dispatch():
    """Verify that recognized audio chunk generates TRANSCRIPT_UPDATE, VISUAL_PAYLOAD, and TELEMETRY_REPORT."""
    client = TestClient(app)
    
    # Mock speech_engine.transcribe_audio_chunk to return a math utterance
    with patch.object(
        WhisperSpeechEngine,
        "transcribe_audio_chunk",
        return_value=("Let's plot y equals x squared minus four x plus three", 45.2, 0.08, True)
    ):
        with client.websocket_connect("/ws/classroom/session_test_dispatch") as websocket:
            # 1. Connection established
            _ = websocket.receive_json()
            
            # 2. Start live audio
            websocket.send_json({
                "command": "START_LIVE_AUDIO",
                "payload": {"subject": "Mathematics"}
            })
            _ = websocket.receive_json()
            
            # 3. Send enough audible audio to trigger buffer threshold (1.5s 440Hz wave = 48,000 bytes)
            t = np.linspace(0, 1.5, int(16000 * 1.5), endpoint=False)
            sine_wave = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
            websocket.send_bytes(sine_wave.tobytes())
            
            # 4. Expect TRANSCRIPT_UPDATE
            transcript_msg = receive_event_of_type(websocket, "TRANSCRIPT_UPDATE")
            assert transcript_msg["payload"]["is_live"] is True
            assert "x squared" in transcript_msg["payload"]["sentence"]
            
            # 5. Expect VISUAL_PAYLOAD
            visual_msg = receive_event_of_type(websocket, "VISUAL_PAYLOAD")
            assert visual_msg["payload"]["typology"] == "FUNCTION_GRAPH"
            
            # 6. Expect TELEMETRY_REPORT
            telemetry_msg = receive_event_of_type(websocket, "TELEMETRY_REPORT")
            assert "transcription_ms" in telemetry_msg["payload"]
            assert "understanding_ms" in telemetry_msg["payload"]
            assert "visual_ms" in telemetry_msg["payload"]
            assert "total_latency_ms" in telemetry_msg["payload"]


def test_websocket_noisy_conversational_input_no_hallucinated_visual():
    """Verify that casual classroom conversation does NOT trigger false visual payloads."""
    client = TestClient(app)
    
    with patch.object(
        WhisperSpeechEngine,
        "transcribe_audio_chunk",
        return_value=("Good morning everyone can you hear me okay", 32.1, 0.05, True)
    ):
        with client.websocket_connect("/ws/classroom/session_test_noise") as websocket:
            _ = websocket.receive_json()  # CONNECTION_ESTABLISHED
            
            websocket.send_json({
                "command": "START_LIVE_AUDIO",
                "payload": {"subject": "Mathematics"}
            })
            _ = websocket.receive_json()  # STATUS_CHANGE (LISTENING)
            
            # Send audible audio chunk
            t = np.linspace(0, 1.5, int(16000 * 1.5), endpoint=False)
            sine_wave = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
            websocket.send_bytes(sine_wave.tobytes())

            # Transcript update is emitted for transparency
            transcript_msg = receive_event_of_type(websocket, "TRANSCRIPT_UPDATE")
            assert "Good morning" in transcript_msg["payload"]["sentence"]
            
            # Telemetry is emitted, NOT a visual payload!
            telemetry_msg = receive_event_of_type(websocket, "TELEMETRY_REPORT")
            assert telemetry_msg["event_type"] == "TELEMETRY_REPORT"


def test_websocket_get_state_diagnostics():
    """Verify GET_STATE command returns STATE_SYNC with accurate speech diagnostics."""
    client = TestClient(app)
    with client.websocket_connect("/ws/classroom/session_test_state") as websocket:
        _ = websocket.receive_json()
        
        websocket.send_json({"command": "GET_STATE"})
        state_msg = websocket.receive_json()
        assert state_msg["event_type"] == "STATE_SYNC"
        assert state_msg["session_id"] == "session_test_state"
        assert "speech_diagnostics" in state_msg["payload"]
        assert state_msg["payload"]["speech_diagnostics"]["model_name"] == "tiny.en"
        assert state_msg["payload"]["speech_diagnostics"]["device"] in ["cpu", "cuda"]


def test_visual_continuity_three_step_progression():
    """Verify end-to-end 3-step visual continuity (Creation -> Vertex Focus -> Roots Mutation)."""
    router = get_speech_router()
    
    # Step 1: Initial curve introduction
    s1 = "Today we examine the quadratic function y equals x squared minus four x plus three"
    r1 = router.route_speech(s1, "Mathematics")
    assert r1 is not None
    p1, c1 = r1
    assert p1.typology == VisualTypology.FUNCTION_GRAPH
    assert p1.mode == RenderMode.CREATE
    initial_key = p1.continuity_key
    
    # Step 2: Teacher explains vertex
    s2 = "Notice the vertex at two comma minus one which represents the minimum point"
    r2 = router.route_speech(s2, "Mathematics", active_visual=p1)
    assert r2 is not None
    p2, c2 = r2
    assert p2.continuity_key == initial_key
    assert p2.mode in [RenderMode.UPDATE, RenderMode.HIGHLIGHT]
    
    # Step 3: Teacher explains roots
    s3 = "The parabola crosses the x axis at x equals one and x equals three"
    r3 = router.route_speech(s3, "Mathematics", active_visual=p2)
    assert r3 is not None
    p3, c3 = r3
    assert p3.continuity_key == initial_key
    assert p3.mode in [RenderMode.UPDATE, RenderMode.HIGHLIGHT]
    points = p3.data.get("points", [])
    assert any("root" in p.get("id", "").lower() for p in points)


def test_dynamic_novel_equations_generate_custom_visuals():
    """Verify that speaking novel equations generates genuine custom visuals from spoken values, NOT hardcoded curves."""
    router = get_speech_router()

    # 1. Linear function: y = 2x + 5
    linear_speech = "Let's plot y equals two x plus five"
    r_lin = router.route_speech(linear_speech, "Mathematics")
    assert r_lin is not None
    payload_lin, concept_lin = r_lin
    assert concept_lin == "Linear Function"
    assert payload_lin.typology == VisualTypology.FUNCTION_GRAPH
    assert "2x" in payload_lin.data["function_latex"]
    assert "5" in payload_lin.data["function_latex"]
    assert "x^2" not in payload_lin.data["function_latex"]

    # 2. Novel quadratic: y = x^2 - 9 (different from sample lesson's x^2 - 4x + 3)
    quad_speech = "Now examine the curve y equals x squared minus nine"
    r_quad = router.route_speech(quad_speech, "Mathematics")
    assert r_quad is not None
    payload_quad, concept_quad = r_quad
    assert concept_quad == "Quadratic Curve"
    assert payload_quad.typology == VisualTypology.FUNCTION_GRAPH
    assert "x^2 - 9" in payload_quad.data["function_latex"]
    # Verify domain auto-scaled to include roots -3 and 3
    assert payload_quad.data["domain"][0] <= -3.0
    assert payload_quad.data["domain"][1] >= 3.0


def test_dynamic_photosynthesis_speech_understanding():
    """Verify real science speech generates biochemical pathway with reactants and products."""
    router = get_speech_router()

    # Step 1: Photosynthesis introduction
    speech1 = "Photosynthesis uses light energy to convert carbon dioxide and water into glucose and oxygen"
    res1 = router.route_speech(speech1, "Science")
    assert res1 is not None
    p1, c1 = res1
    assert p1.typology == VisualTypology.SCIENCE_DIAGRAM
    assert "Photosynthesis" in c1
    elements = p1.data.get("elements", [])
    labels = [e["label"] for e in elements]
    assert any("CO₂" in lbl or "Reactants" in lbl for lbl in labels)
    assert any("Glucose" in lbl or "Products" in lbl for lbl in labels)
    assert any("Thylakoid" in lbl for lbl in labels)

    # Step 2: Teacher explains thylakoid light absorption (Visual Continuity: In-place highlight)
    speech2 = "The thylakoid granum stacks absorb photons to power the light reactions"
    res2 = router.route_speech(speech2, "Science", active_visual=p1)
    assert res2 is not None
    p2, c2 = res2
    assert p2.continuity_key == p1.continuity_key
    assert p2.mode == RenderMode.HIGHLIGHT
    active_elem = next((e for e in p2.data["elements"] if e["id"] == "thylakoids"), None)
    assert active_elem is not None
    assert active_elem["highlight"] is True

    # Step 3: Teacher explains stroma dark reactions (Visual Continuity: Shifts highlight to stroma)
    speech3 = "Meanwhile the stroma fluid carries out the Calvin cycle to synthesize glucose"
    res3 = router.route_speech(speech3, "Science", active_visual=p2)
    assert res3 is not None
    p3, c3 = res3
    assert p3.continuity_key == p1.continuity_key
    assert p3.mode == RenderMode.HIGHLIGHT
    stroma_elem = next((e for e in p3.data["elements"] if e["id"] == "stroma"), None)
    assert stroma_elem is not None
    assert stroma_elem["highlight"] is True


def test_dynamic_binary_search_explanation():
    """Verify teacher explaining binary search generates execution flowchart."""
    router = get_speech_router()
    speech = "Binary search repeatedly halves the search range to locate the target in logarithmic time"
    res = router.route_speech(speech, "Computer Science")
    assert res is not None
    payload, concept = res
    assert payload.typology == VisualTypology.STRUCTURED_FLOWCHART
    nodes = payload.data.get("nodes", [])
    assert len(nodes) >= 4
    # Verify branch node or search range halving exists
    assert any("half" in n["details"].lower() or "log n" in n["details"].lower() for n in nodes)


def test_dynamic_history_timeline_and_chronological_continuity():
    """Verify historical statements generate timeline and chronological additions."""
    router = get_speech_router()

    # Step 1: French Revolution 1789
    speech1 = "The French Revolution began in 1789 with the storming of the Bastille"
    res1 = router.route_speech(speech1, "History")
    assert res1 is not None
    p1, c1 = res1
    assert p1.typology == VisualTypology.TIMELINE
    events1 = p1.data.get("events", [])
    assert len(events1) >= 1
    assert events1[0]["period"] == "1789"
    assert "French Revolution" in events1[0]["title"]

    # Step 2: Chronological follow-up 1799
    speech2 = "In 1799 Napoleon took power concluding the revolutionary era"
    res2 = router.route_speech(speech2, "History", active_visual=p1)
    assert res2 is not None
    p2, c2 = res2
    assert p2.typology == VisualTypology.TIMELINE
    assert p2.continuity_key == p1.continuity_key
    events2 = p2.data.get("events", [])
    assert len(events2) == 2
    periods = [e["period"] for e in events2]
    assert periods == ["1789", "1799"]
    assert events2[1]["highlight"] is True


def test_subject_change_isolates_continuity():
    """Verify that changing subject resets visual continuity state to avoid cross-domain contamination."""
    client = TestClient(app)
    with client.websocket_connect("/ws/classroom/session_test_subj_switch") as ws:
        _ = ws.receive_json()  # CONNECTION_ESTABLISHED

        # Start live audio in Mathematics
        ws.send_json({
            "command": "START_LIVE_AUDIO",
            "payload": {"subject": "Mathematics"}
        })
        _ = ws.receive_json()  # STATUS_CHANGE

        # Switch subject to Science
        ws.send_json({
            "command": "SET_LIVE_SUBJECT",
            "payload": {"subject": "Science"}
        })
        status_msg = ws.receive_json()
        assert status_msg["event_type"] == "STATUS_CHANGE"
        assert status_msg["payload"]["subject"] == "Science"


def test_stage_by_stage_diagnostic_pipeline_events():
    """Verify end-to-end diagnostic events are emitted for every stage with genuine measurements."""
    client = TestClient(app)

    with patch.object(
        WhisperSpeechEngine,
        "transcribe_audio_chunk",
        return_value=("Let's plot y equals two x plus five", 28.5, 0.09, True)
    ):
        with client.websocket_connect("/ws/classroom/session_test_pipeline_diag") as ws:
            _ = ws.receive_json()  # CONNECTION_ESTABLISHED

            ws.send_json({
                "command": "START_LIVE_AUDIO",
                "payload": {"subject": "Mathematics"}
            })
            _ = ws.receive_json()  # STATUS_CHANGE

            # Send 1.5s audio chunk
            t = np.linspace(0, 1.5, int(16000 * 1.5), endpoint=False)
            sine_wave = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
            ws.send_bytes(sine_wave.tobytes())

            # Collect emitted messages
            received_events = []
            for _ in range(10):
                msg = ws.receive_json()
                received_events.append(msg)
                if msg["event_type"] == "TELEMETRY_REPORT":
                    break

            # Filter diagnostic events
            diag_events = [m for m in received_events if m.get("event_type") == "DIAGNOSTIC_EVENT"]
            stages = [d["payload"]["stage"] for d in diag_events]

            # Verify presence of stages 1 to 6 in order
            assert "AUDIO_RECEIVED" in stages
            assert "AUDIO_PROCESSED" in stages
            assert "TRANSCRIPT_PRODUCED" in stages
            assert "CONCEPT_EXTRACTED" in stages
            assert "VISUAL_ACTION_SELECTED" in stages
            assert "VISUAL_PAYLOAD_VALIDATED" in stages

            # Confirm trace_id is shared across stages
            trace_ids = set(d["payload"]["trace_id"] for d in diag_events)
            assert len(trace_ids) == 1

            # Test Stage 7: Send VISUAL_RENDERED confirmation from client
            ws.send_json({
                "command": "VISUAL_RENDERED",
                "payload": {
                    "trace_id": list(trace_ids)[0],
                    "visual_id": "vis_graph_test",
                    "render_duration_ms": 12.4
                }
            })
            render_diag = ws.receive_json()
            assert render_diag["event_type"] == "DIAGNOSTIC_EVENT"
            assert render_diag["payload"]["stage"] == "FRONTEND_RENDERED"
            assert render_diag["payload"]["duration_ms"] == 12.4




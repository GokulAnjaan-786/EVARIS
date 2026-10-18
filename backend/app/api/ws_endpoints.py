"""WebSocket Real-Time Classroom Endpoint for EVARIS.

Handles bidirectional streaming:
- Live microphone audio ingestion and real-time Faster-Whisper transcription
- Spoken concept recognition and visual payload dispatching with visual continuity
- Sample lesson simulation playback
- Master classroom controls (Pause, Resume, Freeze, Reset, Manual Step)
- Genuine latency telemetry profiling
"""

import asyncio
import json
import time
import base64
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("evaris.live_pipeline")

from ..core.telemetry import LatencyRecord
from ..understanding.decision_engine import DecisionEngine
from ..understanding.speech_concept_router import SpeechConceptRouter
from ..speech.whisper_engine import WhisperSpeechEngine
from ..speech.mock_streamer import SAMPLE_LESSONS

router = APIRouter()

# Shared speech engine singleton
_SPEECH_ENGINE: Optional[WhisperSpeechEngine] = None

def get_session_speech_engine() -> WhisperSpeechEngine:
    global _SPEECH_ENGINE
    if _SPEECH_ENGINE is None:
        _SPEECH_ENGINE = WhisperSpeechEngine()
    return _SPEECH_ENGINE


class ClassroomSession:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.decision_engine = DecisionEngine()
        self.concept_router = SpeechConceptRouter()
        self.speech_engine = get_session_speech_engine()

        self.is_active = True
        self.is_paused = False
        self.is_frozen = False
        self.current_lesson_id: Optional[str] = None
        self.current_step_index: int = 0
        self.stream_task: Optional[asyncio.Task] = None

        # Live Audio Ingestion Buffer & VAD State Machine
        self.is_live_audio = False
        self.live_audio_buffer = bytearray()
        self.live_subject = "Mathematics"
        self.last_speech_time = time.time()
        self.has_speech_in_buffer = False
        self.is_transcribing = False
        self.step_counter = 0
        self.speech_energy_threshold = 0.004

    async def send_event(self, event_type: str, payload: Dict[str, Any]):
        """Dispatches a typed event over the WebSocket."""
        try:
            await self.websocket.send_json({
                "event_type": event_type,
                "session_id": self.session_id,
                "timestamp_ms": int(time.time() * 1000),
                "payload": payload
            })
        except Exception:
            pass

    async def process_live_audio_pcm(self, pcm_bytes: bytes, client_ts: Optional[float] = None):
        """Processes incoming raw 16kHz 16-bit mono PCM bytes from teacher microphone with speech-aware VAD chunking."""
        if not pcm_bytes:
            return

        # Ensure live audio mode is active if binary PCM frames are streaming
        if not self.is_live_audio:
            self.is_live_audio = True

        trace_id = f"trace_{self.session_id}_{self.step_counter + 1}"

        # Stage 1: AUDIO_RECEIVED
        await self.send_event("DIAGNOSTIC_EVENT", {
            "session_id": self.session_id,
            "trace_id": trace_id,
            "stage": "AUDIO_RECEIVED",
            "timestamp_ms": int(time.time() * 1000),
            "details": {"bytes_count": len(pcm_bytes)},
            "is_live": True
        })

        # Cap buffer capacity to prevent memory leaks from excessive queuing (5 seconds max = 160,000 bytes)
        MAX_CAPACITY = 160000
        if len(self.live_audio_buffer) + len(pcm_bytes) > MAX_CAPACITY:
            discard_len = len(self.live_audio_buffer) + len(pcm_bytes) - MAX_CAPACITY
            self.live_audio_buffer = bytearray(self.live_audio_buffer[discard_len:])

        self.live_audio_buffer.extend(pcm_bytes)

        # Inspect incoming chunk energy to update speech tracking
        chunk_floats = self.speech_engine.pcm_to_float32(pcm_bytes)
        chunk_energy = self.speech_engine.calculate_rms_energy(chunk_floats)
        now = time.time()

        if chunk_energy >= self.speech_energy_threshold:
            self.has_speech_in_buffer = True
            self.last_speech_time = now
        elif not self.has_speech_in_buffer and len(self.live_audio_buffer) >= 16000:
            # Check energy across the accumulated window so continuous soft speech isn't missed
            buf_floats = self.speech_engine.pcm_to_float32(bytes(self.live_audio_buffer))
            if self.speech_engine.calculate_rms_energy(buf_floats) >= self.speech_energy_threshold:
                self.has_speech_in_buffer = True
                self.last_speech_time = now

        # Prune leading background silence when no active speech has been detected for over 1.5 seconds (48,000 bytes)
        # Keep 16,000 bytes (0.50s) acoustic lookback so the beginning of the first spoken syllable is never clipped
        if not self.has_speech_in_buffer and len(self.live_audio_buffer) > 48000:
            self.live_audio_buffer = bytearray(self.live_audio_buffer[-16000:])
            return

        # Determine if audio buffer is ready to transcribe:
        # Condition 1: Natural conversational pause after speech (400ms silence and at least 0.5s audio)
        silence_pause_elapsed = now - self.last_speech_time
        is_silence_flush = self.has_speech_in_buffer and silence_pause_elapsed >= 0.40 and len(self.live_audio_buffer) >= 16000

        # Condition 2: Continuous speech max buffer ceiling (~1.5s = 48,000 bytes) to maintain real-time responsiveness
        is_max_buffer_flush = len(self.live_audio_buffer) >= 48000

        if not (is_silence_flush or is_max_buffer_flush):
            return

        # Prevent concurrent worker backlog: if a transcription is already in flight, accumulate safely
        if self.is_transcribing:
            return

        self.is_transcribing = True
        try:
            audio_data = bytes(self.live_audio_buffer)
            # If flushing due to continuous buffer cap, retain 8000 bytes (0.25s) overlap for boundary words
            OVERLAP_BYTES = 8000
            if is_max_buffer_flush and self.has_speech_in_buffer and len(self.live_audio_buffer) > OVERLAP_BYTES:
                self.live_audio_buffer = bytearray(self.live_audio_buffer[-OVERLAP_BYTES:])
            else:
                self.live_audio_buffer.clear()
                self.has_speech_in_buffer = False

            audio_recv_ts = time.time()

            # Execute Faster-Whisper on background threadpool
            text, infer_ms, energy, is_speech = await asyncio.to_thread(
                self.speech_engine.transcribe_audio_chunk, audio_data, self.speech_energy_threshold
            )
            transcribe_done_ts = time.time()

            # Stage 2: AUDIO_PROCESSED
            await self.send_event("DIAGNOSTIC_EVENT", {
                "session_id": self.session_id,
                "trace_id": trace_id,
                "stage": "AUDIO_PROCESSED",
                "timestamp_ms": int(transcribe_done_ts * 1000),
                "details": {
                    "audio_duration_ms": round(len(audio_data) / 32.0, 1),
                    "rms_energy": round(energy, 4),
                    "is_speech": is_speech
                },
                "is_live": True
            })

            if is_speech and text:
                self.step_counter += 1
                telemetry = LatencyRecord(
                    event_id=f"live_{self.step_counter}",
                    mode="LIVE",
                    is_simulated=False,
                    client_capture_ts=client_ts
                )
                telemetry.audio_capture_ts = audio_recv_ts
                telemetry.transcription_done_ts = transcribe_done_ts

                # Stage 3: TRANSCRIPT_PRODUCED
                await self.send_event("DIAGNOSTIC_EVENT", {
                    "session_id": self.session_id,
                    "trace_id": trace_id,
                    "stage": "TRANSCRIPT_PRODUCED",
                    "timestamp_ms": int(time.time() * 1000),
                    "duration_ms": infer_ms,
                    "details": {"sentence": text},
                    "is_live": True
                })

                # Emit genuine live transcript update
                logger.info(f"[STAGE 1-3 TRANSCRIPT] Recognized text: '{text}' (infer_ms={infer_ms:.1f}ms, energy={energy:.4f})")
                await self.send_event("TRANSCRIPT_UPDATE", {
                    "token": "",
                    "sentence": text,
                    "concept": self.decision_engine.concept_tracker.active_concept or "Live Spoken Concept",
                    "subject": self.live_subject,
                    "topic": self.live_subject,
                    "is_final": True,
                    "is_live": True,
                    "step_index": self.step_counter,
                    "total_steps": 0,
                    "trace_id": trace_id
                })

                # Connect recognised speech to Visual Decision Engine
                understanding_start_ts = time.time()
                visual_payload, concept_name, is_concept_found = self.concept_router.route_speech_to_visual(
                    text, self.live_subject, self.decision_engine
                )
                understanding_done_ts = time.time()
                telemetry.understanding_done_ts = understanding_done_ts
                logger.info(f"[STAGE 4 CONCEPT] Concept='{concept_name}', Subject='{self.live_subject}', is_found={is_concept_found}")

                # Stage 4: CONCEPT_EXTRACTED
                await self.send_event("DIAGNOSTIC_EVENT", {
                    "session_id": self.session_id,
                    "trace_id": trace_id,
                    "stage": "CONCEPT_EXTRACTED",
                    "timestamp_ms": int(time.time() * 1000),
                    "duration_ms": round((understanding_done_ts - understanding_start_ts) * 1000, 2),
                    "details": {
                        "concept_name": concept_name,
                        "is_concept_found": is_concept_found,
                        "subject": self.live_subject
                    },
                    "is_live": True
                })

                # Stage 5: VISUAL_ACTION_SELECTED
                action_mode = visual_payload.mode.value if visual_payload else "RETAIN"
                typology_str = visual_payload.typology.value if visual_payload else None
                logger.info(f"[STAGE 5 ACTION] Mode={action_mode}, Typology={typology_str}, Frozen={self.is_frozen}")
                await self.send_event("DIAGNOSTIC_EVENT", {
                    "session_id": self.session_id,
                    "trace_id": trace_id,
                    "stage": "VISUAL_ACTION_SELECTED",
                    "timestamp_ms": int(time.time() * 1000),
                    "details": {
                        "action": action_mode,
                        "typology": typology_str,
                        "frozen": self.is_frozen
                    },
                    "is_live": True
                })

                if visual_payload and not self.is_frozen:
                    visual_done_ts = time.time()
                    telemetry.visual_ready_ts = visual_done_ts

                    # Stage 6: VISUAL_PAYLOAD_VALIDATED
                    logger.info(f"[STAGE 6 PAYLOAD] Generated valid payload: id={visual_payload.visual_id}, mode={action_mode}, title='{visual_payload.title}', data_keys={list(visual_payload.data.keys())}")
                    await self.send_event("DIAGNOSTIC_EVENT", {
                        "session_id": self.session_id,
                        "trace_id": trace_id,
                        "stage": "VISUAL_PAYLOAD_VALIDATED",
                        "timestamp_ms": int(time.time() * 1000),
                        "details": {
                            "visual_id": visual_payload.visual_id,
                            "valid": True
                        },
                        "is_live": True
                    })

                    payload_dict = visual_payload.model_dump()
                    payload_dict["trace_id"] = trace_id
                    await self.send_event("VISUAL_PAYLOAD", payload_dict)
                else:
                    telemetry.visual_ready_ts = understanding_done_ts

                telemetry.delivered_ts = time.time()

                # Emit measured telemetry with actual timings
                await self.send_event("TELEMETRY_REPORT", telemetry.to_metrics_dict())

        finally:
            self.is_transcribing = False

    async def flush_live_audio(self):
        """Flushes and transcribes any remaining speech audio when microphone is turned off."""
        if len(self.live_audio_buffer) >= 6000 and not self.is_transcribing:
            audio_data = bytes(self.live_audio_buffer)
            self.live_audio_buffer.clear()
            self.has_speech_in_buffer = False

            text, infer_ms, energy, is_speech = await asyncio.to_thread(
                self.speech_engine.transcribe_audio_chunk, audio_data, self.speech_energy_threshold
            )
            if is_speech and text:
                self.step_counter += 1
                await self.send_event("TRANSCRIPT_UPDATE", {
                    "token": "",
                    "sentence": text,
                    "concept": self.decision_engine.concept_tracker.active_concept or "Final Speech Segment",
                    "subject": self.live_subject,
                    "topic": self.live_subject,
                    "is_final": True,
                    "is_live": True,
                    "step_index": self.step_counter,
                    "total_steps": 0
                })

                visual_payload, concept_name, is_concept_found = self.concept_router.route_speech_to_visual(
                    text, self.live_subject, self.decision_engine
                )
                if visual_payload and not self.is_frozen:
                    await self.send_event("VISUAL_PAYLOAD", visual_payload.model_dump())
        else:
            self.live_audio_buffer.clear()
            self.has_speech_in_buffer = False


    async def run_lesson_stream(self, lesson_id: str):
        """Asynchronously streams a sample lesson with realistic speech timing (Regression / Demo Mode)."""
        if lesson_id not in SAMPLE_LESSONS:
            await self.send_event("ERROR", {"message": f"Lesson '{lesson_id}' not found."})
            return

        lesson = SAMPLE_LESSONS[lesson_id]
        self.current_lesson_id = lesson_id
        steps = lesson["steps"]

        await self.send_event("STATUS_CHANGE", {
            "status": "TEACHING",
            "lesson_id": lesson_id,
            "lesson_title": lesson["title"],
            "subject": lesson["subject"]
        })

        for i, step in enumerate(steps):
            self.current_step_index = i
            while self.is_paused:
                await asyncio.sleep(0.2)

            telemetry = LatencyRecord(
                event_id=f"step_{i+1}",
                mode="SIMULATED",
                is_simulated=True
            )
            telemetry.audio_capture_ts = time.time()

            # Stream simulated transcript tokens (word by word)
            words = step["sentence"].split(" ")
            accumulated_sentence = ""
            for word in words:
                while self.is_paused:
                    await asyncio.sleep(0.2)

                accumulated_sentence += (" " + word if accumulated_sentence else word)
                await self.send_event("TRANSCRIPT_UPDATE", {
                    "token": word,
                    "sentence": accumulated_sentence,
                    "concept": step["concept"],
                    "subject": step["subject"],
                    "topic": step["topic"],
                    "is_final": False,
                    "is_live": False,
                    "step_index": i + 1,
                    "total_steps": len(steps)
                })
                await asyncio.sleep(0.08)

            telemetry.transcription_done_ts = time.time()

            await self.send_event("TRANSCRIPT_UPDATE", {
                "token": "",
                "sentence": step["sentence"],
                "concept": step["concept"],
                "subject": step["subject"],
                "topic": step["topic"],
                "is_final": True,
                "is_live": False,
                "step_index": i + 1,
                "total_steps": len(steps)
            })

            if not self.is_frozen:
                visual_payload = self.decision_engine.process_step(step)
                telemetry.understanding_done_ts = time.time()

                if visual_payload:
                    telemetry.visual_ready_ts = time.time()
                    await self.send_event("VISUAL_PAYLOAD", visual_payload.model_dump())
                else:
                    telemetry.visual_ready_ts = time.time()
            else:
                telemetry.understanding_done_ts = time.time()
                telemetry.visual_ready_ts = time.time()

            telemetry.delivered_ts = time.time()
            await self.send_event("TELEMETRY_REPORT", telemetry.to_metrics_dict())

            pause_seconds = step.get("pause_ms", 3500) / 1000.0
            elapsed = 0.0
            while elapsed < pause_seconds:
                if self.is_paused:
                    await asyncio.sleep(0.2)
                else:
                    await asyncio.sleep(0.1)
                    elapsed += 0.1

        await self.send_event("STATUS_CHANGE", {
            "status": "COMPLETED",
            "message": "Lesson presentation finished.",
            "lesson_id": lesson_id
        })

    def stop_stream(self):
        if self.stream_task and not self.stream_task.done():
            self.stream_task.cancel()
        self.stream_task = None


@router.websocket("/ws/classroom/{session_id}")
async def classroom_websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = ClassroomSession(session_id, websocket)

    diag = session.speech_engine.get_diagnostics()

    # Send handshake welcome
    await session.send_event("CONNECTION_ESTABLISHED", {
        "session_id": session_id,
        "engine": "EVARIS Universal Real-Time Visual Teaching Engine",
        "supported_subjects": ["Mathematics", "Computer Science", "Science", "Physics", "Biology", "Tamil", "English"],
        "speech_engine": f"Faster-Whisper ({diag['model_name']} {diag['compute_type']} on {diag['device'].upper()})",
        "speech_diagnostics": diag,
        "status": "IDLE"
    })

    try:
        while True:
            # Receive either binary frames (raw PCM) or text JSON messages
            message_obj = await websocket.receive()
            
            # Handle binary WebSocket frames
            if "bytes" in message_obj and message_obj["bytes"]:
                pcm_bytes = message_obj["bytes"]
                await session.process_live_audio_pcm(pcm_bytes)
                continue

            # Handle text JSON messages
            if "text" in message_obj and message_obj["text"]:
                try:
                    message = json.loads(message_obj["text"])
                except json.JSONDecodeError:
                    continue

                command = message.get("command") or message.get("action")
                payload = message.get("payload", {})

                # 1. LIVE MICROPHONE AUDIO COMMANDS
                if command == "START_LIVE_AUDIO":
                    session.stop_stream()
                    session.is_live_audio = True
                    session.live_audio_buffer.clear()
                    session.live_subject = payload.get("subject", "Mathematics")
                    session.step_counter = 0
                    session.decision_engine.reset()
                    await session.send_event("STATUS_CHANGE", {
                        "status": "LISTENING",
                        "subject": session.live_subject,
                        "mode": "LIVE_MICROPHONE"
                    })

                elif command == "AUDIO_CHUNK":
                    # Handle base64 encoded PCM chunk
                    pcm_base64 = payload.get("pcm_base64")
                    client_ts = payload.get("client_ts")
                    if pcm_base64:
                        pcm_bytes = base64.b64decode(pcm_base64)
                        await session.process_live_audio_pcm(pcm_bytes, client_ts=client_ts)

                elif command == "STOP_LIVE_AUDIO":
                    await session.flush_live_audio()
                    session.is_live_audio = False
                    await session.send_event("STATUS_CHANGE", {
                        "status": "IDLE",
                        "mode": "STANDBY"
                    })

                elif command == "SET_LIVE_SUBJECT":
                    new_sub = payload.get("subject", "Mathematics")
                    if new_sub != session.live_subject:
                        session.live_subject = new_sub
                        # Isolate concept tracking: reset previous subject visuals
                        session.decision_engine.reset()
                        await session.send_event("STATUS_CHANGE", {
                            "status": "LISTENING" if session.is_live_audio else "IDLE",
                            "subject": session.live_subject,
                            "mode": "LIVE_MICROPHONE" if session.is_live_audio else "STANDBY"
                        })

                elif command == "VISUAL_RENDERED":
                    # Stage 7: FRONTEND_RENDERED confirmation
                    trace_id = payload.get("trace_id", f"trace_{session.session_id}_{session.step_counter}")
                    render_ms = payload.get("render_duration_ms", 0.0)
                    logger.info(f"[STAGE 7 RENDERED] Frontend confirmed DOM render: visual_id='{payload.get('visual_id')}', render_ms={render_ms}ms")
                    await session.send_event("DIAGNOSTIC_EVENT", {
                        "session_id": session.session_id,
                        "trace_id": trace_id,
                        "stage": "FRONTEND_RENDERED",
                        "timestamp_ms": int(time.time() * 1000),
                        "duration_ms": render_ms,
                        "details": {
                            "visual_id": payload.get("visual_id")
                        },
                        "is_live": session.is_live_audio
                    })

                elif command == "GET_STATE":
                    diag = session.speech_engine.get_diagnostics()
                    await session.send_event("STATE_SYNC", {
                        "session_id": session.session_id,
                        "status": "LISTENING" if session.is_live_audio else ("PAUSED" if session.is_paused else ("TEACHING" if session.stream_task else "IDLE")),
                        "subject": session.live_subject,
                        "is_live_audio": session.is_live_audio,
                        "is_frozen": session.is_frozen,
                        "speech_diagnostics": diag
                    })

                # 2. SAMPLE LESSON COMMANDS
                elif command == "START_SAMPLE_LESSON":
                    lesson_id = payload.get("lesson_id", "math_quadratic")
                    session.stop_stream()
                    session.is_live_audio = False
                    session.decision_engine.reset()
                    session.is_paused = False
                    session.is_frozen = False
                    session.stream_task = asyncio.create_task(session.run_lesson_stream(lesson_id))

                elif command == "PAUSE":
                    session.is_paused = True
                    await session.send_event("STATUS_CHANGE", {"status": "PAUSED"})

                elif command == "RESUME":
                    session.is_paused = False
                    await session.send_event("STATUS_CHANGE", {"status": "TEACHING"})

                elif command == "FREEZE_VISUAL":
                    session.is_frozen = payload.get("frozen", True)
                    await session.send_event("STATUS_CHANGE", {
                        "status": "FROZEN" if session.is_frozen else ("LISTENING" if session.is_live_audio else "TEACHING"),
                        "visual_frozen": session.is_frozen
                    })

                elif command == "RESET":
                    session.stop_stream()
                    session.is_live_audio = False
                    session.live_audio_buffer.clear()
                    session.decision_engine.reset()
                    session.is_paused = False
                    session.is_frozen = False
                    await session.send_event("STATUS_CHANGE", {"status": "RESET"})

                elif command == "MANUAL_STEP":
                    lesson_id = payload.get("lesson_id", session.current_lesson_id or "math_quadratic")
                    step_idx = payload.get("step_index", 0)
                    if lesson_id in SAMPLE_LESSONS and step_idx < len(SAMPLE_LESSONS[lesson_id]["steps"]):
                        step = SAMPLE_LESSONS[lesson_id]["steps"][step_idx]
                        visual_payload = session.decision_engine.process_step(step)
                        if visual_payload:
                            await session.send_event("VISUAL_PAYLOAD", visual_payload.model_dump())
                        await session.send_event("TRANSCRIPT_UPDATE", {
                            "token": "",
                            "sentence": step["sentence"],
                            "concept": step["concept"],
                            "subject": step["subject"],
                            "topic": step["topic"],
                            "is_final": True,
                            "is_live": False,
                            "step_index": step_idx + 1,
                            "total_steps": len(SAMPLE_LESSONS[lesson_id]["steps"])
                        })


    except WebSocketDisconnect:
        session.stop_stream()
        session.is_live_audio = False
    except Exception as e:
        session.stop_stream()
        session.is_live_audio = False

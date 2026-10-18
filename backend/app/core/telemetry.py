"""EVARIS Telemetry and Latency Profiling Module.

Measures each stage of the teaching pipeline independently:
- Audio-to-Transcript delay
- Context understanding & decision delay
- Visual generation/synthesis time
- End-to-end response time
- Stage-by-stage diagnostic pipeline trace events
"""

import time
from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class DiagnosticStage(str, Enum):
    AUDIO_RECEIVED = "AUDIO_RECEIVED"                      # Stage 1: Raw PCM bytes received over WebSocket
    AUDIO_PROCESSED = "AUDIO_PROCESSED"                    # Stage 2: 16kHz VAD framing, RMS energy calculated
    TRANSCRIPT_PRODUCED = "TRANSCRIPT_PRODUCED"            # Stage 3: Faster-Whisper recognized speech output
    CONCEPT_EXTRACTED = "CONCEPT_EXTRACTED"                # Stage 4: Semantic parser extracted domain concept & parameters
    VISUAL_ACTION_SELECTED = "VISUAL_ACTION_SELECTED"      # Stage 5: DecisionEngine determined RenderMode (CREATE/UPDATE/HIGHLIGHT)
    VISUAL_PAYLOAD_VALIDATED = "VISUAL_PAYLOAD_VALIDATED"  # Stage 6: Pydantic schema validation successful
    FRONTEND_RENDERED = "FRONTEND_RENDERED"                # Stage 7: Frontend DOM/canvas rendered the visual


class DiagnosticEvent(BaseModel):
    session_id: str
    trace_id: str
    stage: DiagnosticStage
    timestamp_ms: int = Field(default_factory=lambda: int(time.time() * 1000))
    duration_ms: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    is_live: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "trace_id": self.trace_id,
            "stage": self.stage.value if isinstance(self.stage, DiagnosticStage) else self.stage,
            "timestamp_ms": self.timestamp_ms,
            "duration_ms": self.duration_ms,
            "details": self.details,
            "is_live": self.is_live
        }


class LatencyRecord(BaseModel):
    event_id: str
    mode: str = "LIVE"  # "LIVE" or "SIMULATED"
    is_simulated: bool = False
    client_capture_ts: Optional[float] = None
    audio_capture_ts: float = Field(default_factory=time.time)
    transcription_done_ts: Optional[float] = None
    understanding_done_ts: Optional[float] = None
    visual_ready_ts: Optional[float] = None
    delivered_ts: Optional[float] = None

    @property
    def transcription_ms(self) -> float:
        if self.transcription_done_ts:
            return round((self.transcription_done_ts - self.audio_capture_ts) * 1000, 2)
        return 0.0

    @property
    def understanding_ms(self) -> float:
        if self.understanding_done_ts and self.transcription_done_ts:
            return round((self.understanding_done_ts - self.transcription_done_ts) * 1000, 2)
        return 0.0

    @property
    def visual_ms(self) -> float:
        if self.visual_ready_ts and self.understanding_done_ts:
            return round((self.visual_ready_ts - self.understanding_done_ts) * 1000, 2)
        return 0.0

    @property
    def total_latency_ms(self) -> float:
        endpoint = self.delivered_ts or self.visual_ready_ts or time.time()
        return round((endpoint - self.audio_capture_ts) * 1000, 2)

    def to_metrics_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "mode": self.mode,
            "is_simulated": self.is_simulated,
            "transcription_ms": self.transcription_ms,
            "understanding_ms": self.understanding_ms,
            "visual_ms": self.visual_ms,
            "total_latency_ms": self.total_latency_ms,
            "timestamp": time.time(),
        }

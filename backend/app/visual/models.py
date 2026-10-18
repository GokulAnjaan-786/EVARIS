"""EVARIS Visual Data Models and Contracts.

Defines Pydantic schemas for multi-subject visual payloads, continuity states,
and real-time classroom events.
"""

from enum import Enum
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field
import time


class VisualTypology(str, Enum):
    MATH_EQUATION = "MATH_EQUATION"
    FUNCTION_GRAPH = "FUNCTION_GRAPH"
    STRUCTURED_FLOWCHART = "STRUCTURED_FLOWCHART"
    SCIENCE_DIAGRAM = "SCIENCE_DIAGRAM"
    TIMELINE = "TIMELINE"
    CODE_SNIPPET = "CODE_SNIPPET"


class RenderMode(str, Enum):
    CREATE = "CREATE"        # Mount new visual
    UPDATE = "UPDATE"        # Mutate existing visual parameters smoothly
    HIGHLIGHT = "HIGHLIGHT"  # Highlight sub-elements on existing visual without reload
    RETAIN = "RETAIN"        # Keep current visual steady, suppress churn


class ActiveFeature(BaseModel):
    id: str
    type: str  # 'point', 'curve', 'node', 'label', 'region'
    label: str
    coordinates: Optional[List[float]] = None
    highlight: bool = False
    details: Optional[str] = None


class VisualMetadata(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0, default=0.95)
    subject: str
    topic: str
    generation_time_ms: float = 0.0
    source_attribution: Optional[str] = "EVARIS Universal Visual Engine"


class VisualPayload(BaseModel):
    visual_id: str
    typology: VisualTypology
    mode: RenderMode = RenderMode.CREATE
    continuity_key: str  # Identifies visual lineage (e.g., 'math_parabola_01')
    title: str
    subtitle: Optional[str] = None
    data: Dict[str, Any]  # Typology-specific payload (e.g. KaTeX LaTeX string, graph domain/range/curve, flowchart nodes/edges)
    active_features: List[ActiveFeature] = Field(default_factory=list)
    metadata: VisualMetadata
    created_at: float = Field(default_factory=time.time)


class TranscriptToken(BaseModel):
    token: str
    start_ms: int
    end_ms: int
    is_final: bool = False


class TranscriptUpdate(BaseModel):
    session_id: str
    current_sentence: str
    full_transcript: str
    active_concept: str
    active_subject: str
    is_speaking: bool = True
    timestamp: float = Field(default_factory=time.time)


class ClassroomEventType(str, Enum):
    CONNECTION_ESTABLISHED = "CONNECTION_ESTABLISHED"
    TRANSCRIPT_UPDATE = "TRANSCRIPT_UPDATE"
    VISUAL_PAYLOAD = "VISUAL_PAYLOAD"
    TELEMETRY_REPORT = "TELEMETRY_REPORT"
    CONTROL_COMMAND = "CONTROL_COMMAND"
    STATUS_CHANGE = "STATUS_CHANGE"
    ERROR = "ERROR"


class ClassroomEvent(BaseModel):
    event_type: ClassroomEventType
    session_id: str
    timestamp_ms: int = Field(default_factory=lambda: int(time.time() * 1000))
    payload: Dict[str, Any]


class SampleLesson(BaseModel):
    id: str
    title: str
    subject: str
    grade_level: str
    duration_seconds: int
    description: str
    initial_concept: str

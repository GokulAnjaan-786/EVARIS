"""Structured Concept Models for EVARIS Live Concept Understanding.

Represents concepts extracted from teacher speech:
- Subject and topic classification
- Teacher pedagogical intent (INTRODUCE, EXPLAIN, COMPARE, DERIVE, CORRECT, UPDATE, HIGHLIGHT)
- Extracted entities, mathematical parameters, algorithmic steps, chronological milestones
- Uncertainty quantification and ambiguity detection
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from ..visual.models import VisualTypology, RenderMode


class TeacherIntent(str, Enum):
    INTRODUCE = "INTRODUCE"    # Introducing a new concept or topic (triggers CREATE)
    EXPLAIN = "EXPLAIN"        # Explaining details of the active concept (triggers UPDATE or RETAIN)
    DERIVE = "DERIVE"          # Step-by-step mathematical derivation (triggers MATH_EQUATION or UPDATE)
    HIGHLIGHT = "HIGHLIGHT"    # Drawing focus to a specific element/point/node (triggers HIGHLIGHT)
    UPDATE = "UPDATE"          # Updating parameters of the active visual (triggers UPDATE)
    COMPARE = "COMPARE"        # Comparing two structures or equations
    CORRECT = "CORRECT"        # Correcting a previous statement or updating values
    CONVERSATIONAL = "CONVERSATIONAL"  # Casual chat, greeting, audio check (no visual)
    AMBIGUOUS = "AMBIGUOUS"    # Incomplete or ambiguous speech (wait for more speech)


class ExtractedConcept(BaseModel):
    """Structured result of semantic parsing of teacher speech."""
    concept_name: str
    subject: str
    topic: str
    intent: TeacherIntent = TeacherIntent.INTRODUCE
    typology: VisualTypology = VisualTypology.MATH_EQUATION
    continuity_key: str
    target_feature_id: Optional[str] = None
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    
    # Specific payload builder data
    builder_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Uncertainty tracking
    is_uncertain: bool = False
    uncertainty_reason: Optional[str] = None
    
    # Raw speech segment
    source_sentence: str = ""

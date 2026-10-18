"""Speech Concept Router for EVARIS Live Audio.

Connects recognised speech from local Whisper to the Visual Decision Engine.
Maps spoken natural language to mathematical equations, coordinate curves,
flowcharts, scientific schematics, and historical timelines while preserving visual continuity.
Rejects conversational chatter or ambiguous noise to avoid fabricating visuals.
"""

from typing import Optional, Tuple, Dict, Any
from .concept_models import ExtractedConcept, TeacherIntent
from .ambiguity_guard import AmbiguityGuard
from .parsers.math_parser import MathParser
from .parsers.science_parser import ScienceParser
from .parsers.flowchart_parser import FlowchartParser
from .parsers.timeline_parser import TimelineParser
from .decision_engine import DecisionEngine
from ..visual.models import VisualPayload, RenderMode, VisualTypology


class SpeechConceptRouter:
    """Intelligent concept routing engine that converts live teacher speech into pedagogical visual payloads."""

    def __init__(self):
        self.ambiguity_guard = AmbiguityGuard()
        self.math_parser = MathParser()
        self.science_parser = ScienceParser()
        self.flowchart_parser = FlowchartParser()
        self.timeline_parser = TimelineParser()

    def is_conversational_or_noise(self, text: str) -> bool:
        """Checks if the spoken text is casual conversational chatter or classroom management."""
        is_suppressed, _ = self.ambiguity_guard.evaluate(text)
        return is_suppressed

    def parse_speech_concept(
        self,
        spoken_text: str,
        subject: str = "Mathematics",
        active_visual: Optional[VisualPayload] = None
    ) -> Tuple[Optional[ExtractedConcept], str, bool]:
        """Parses spoken natural language into a structured ExtractedConcept.

        Returns:
            Tuple of:
            - ExtractedConcept (None if suppressed or uncategorized)
            - Concept label or diagnostic reason
            - is_concept_found: True if a genuine domain concept was identified
        """
        # 1. Ambiguity & Conversational Guard
        is_suppressed, reason = self.ambiguity_guard.evaluate(spoken_text)
        if is_suppressed:
            return None, reason or "Conversational / Audio Check", False

        sub_lower = subject.lower()

        # Subject-prioritized parsing order with universal cross-domain fallback
        parsers = []
        if any(kw in sub_lower for kw in ["math", "physics", "algebra", "calculus", "geometry"]):
            parsers = [self.math_parser, self.science_parser, self.flowchart_parser, self.timeline_parser]
        elif any(kw in sub_lower for kw in ["sci", "bio", "chem", "plant", "cell"]):
            parsers = [self.science_parser, self.math_parser, self.flowchart_parser, self.timeline_parser]
        elif any(kw in sub_lower for kw in ["comp", "algo", "code", "prog", "software", "data"]):
            parsers = [self.flowchart_parser, self.math_parser, self.science_parser, self.timeline_parser]
        elif any(kw in sub_lower for kw in ["hist", "social", "time", "civ"]):
            parsers = [self.timeline_parser, self.math_parser, self.science_parser, self.flowchart_parser]
        else:
            # Universal / Custom subject: try all parsers in logical order
            parsers = [self.math_parser, self.science_parser, self.flowchart_parser, self.timeline_parser]

        for parser in parsers:
            extracted = parser.parse(spoken_text, active_visual=active_visual)
            if extracted:
                return extracted, extracted.concept_name, True

        return None, "Uncategorized Explanation", False

    def route_speech_to_visual(
        self,
        spoken_text: str,
        subject: str,
        decision_engine: DecisionEngine
    ) -> Tuple[Optional[VisualPayload], str, bool]:
        """Analyzes real spoken text and routes to the appropriate visual builder via DecisionEngine.

        Returns:
            Tuple of:
            - visual_payload: Optional[VisualPayload] (None if retained or unclear)
            - concept_name: detected concept label
            - is_concept_found: True if a genuine domain concept was identified
        """
        active_visual = decision_engine.last_visual_payload
        extracted, concept_name, is_found = self.parse_speech_concept(
            spoken_text, subject=subject, active_visual=active_visual
        )

        if not is_found or extracted is None:
            return None, concept_name, False

        # Assemble step payload for DecisionEngine
        step_data = {
            "sentence": spoken_text,
            "subject": extracted.subject,
            "topic": extracted.topic,
            "concept": extracted.concept_name,
            "typology": extracted.typology.value if isinstance(extracted.typology, VisualTypology) else extracted.typology,
            "continuity_key": extracted.continuity_key,
            "target_feature_id": extracted.target_feature_id,
            **extracted.builder_data
        }

        visual = decision_engine.process_step(step_data)
        return visual, extracted.concept_name, True

    def route_speech(
        self,
        text: str,
        subject: str = "Mathematics",
        active_visual: Optional[VisualPayload] = None,
        decision_engine: Optional[DecisionEngine] = None
    ) -> Optional[Tuple[VisualPayload, str]]:
        """Convenience method for evaluating speech and generating/updating visual payloads."""
        engine = decision_engine or DecisionEngine()
        if active_visual:
            engine.last_visual_payload = active_visual
            engine.concept_tracker.active_concept = active_visual.title
            engine.concept_tracker.active_continuity_key = active_visual.continuity_key

        visual, concept, is_found = self.route_speech_to_visual(text, subject, engine)
        if is_found and visual is not None:
            return visual, concept
        return None


_ROUTER_SINGLETON: Optional[SpeechConceptRouter] = None


def get_speech_router() -> SpeechConceptRouter:
    """Returns the singleton SpeechConceptRouter instance."""
    global _ROUTER_SINGLETON
    if _ROUTER_SINGLETON is None:
        _ROUTER_SINGLETON = SpeechConceptRouter()
    return _ROUTER_SINGLETON

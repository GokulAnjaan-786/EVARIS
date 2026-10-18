"""Concept Tracker & State Transition Engine.

Analyzes context and speech input to determine whether the teacher is:
1. Introducing a completely new concept (CREATE visual)
2. Adding granular explanation to the active concept (RETAIN visual, suppress churn)
3. Directing focus to a specific sub-element (UPDATE or HIGHLIGHT existing visual)
"""

from typing import Dict, Any, Tuple
from ..visual.models import RenderMode


class ConceptTracker:
    def __init__(self):
        self.active_concept: str = ""
        self.active_continuity_key: str = ""
        self.last_transition_time: float = 0.0

    def evaluate_transition(
        self,
        incoming_concept: str,
        continuity_key: str,
        target_feature_id: str = None,
        has_parameter_update: bool = False
    ) -> Tuple[RenderMode, str]:
        """Evaluates relationship between current concept state and incoming concept.
        
        Returns:
            Tuple of (RenderMode, explanation_of_decision)
        """
        # First concept in session
        if not self.active_concept:
            self.active_concept = incoming_concept
            self.active_continuity_key = continuity_key
            return RenderMode.CREATE, "Initial concept introduction"

        # Same continuity lineage
        if continuity_key == self.active_continuity_key:
            if target_feature_id:
                return RenderMode.HIGHLIGHT, f"Focusing on sub-element '{target_feature_id}' within current visual"
            elif has_parameter_update:
                self.active_concept = incoming_concept
                return RenderMode.UPDATE, f"Mutating parameters of current visual for {incoming_concept}"
            elif incoming_concept == self.active_concept:
                return RenderMode.RETAIN, "Sustained explanation on active concept; visual stability maintained"
            else:
                self.active_concept = incoming_concept
                return RenderMode.UPDATE, f"Mutating parameters of current visual for {incoming_concept}"

        # Distinct continuity key -> True concept transition
        self.active_concept = incoming_concept
        self.active_continuity_key = continuity_key
        return RenderMode.CREATE, f"Transitioning to new topic: {incoming_concept}"

    def reset(self):
        self.active_concept = ""
        self.active_continuity_key = ""

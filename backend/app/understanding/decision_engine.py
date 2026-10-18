"""Visual Decision Engine for EVARIS.

Orchestrates context understanding, concept tracking, typology selection,
and visual payload synthesis across all universal subjects.
"""

from typing import Dict, Any, Optional
import time

from .context_buffer import ContextBuffer
from .concept_tracker import ConceptTracker
from ..visual.models import VisualPayload, RenderMode
from ..visual.builders.math_builder import build_math_payload
from ..visual.builders.graph_builder import build_graph_payload
from ..visual.builders.flowchart_builder import build_flowchart_payload
from ..visual.builders.science_builder import build_science_payload
from ..visual.builders.timeline_builder import build_timeline_payload


class DecisionEngine:
    def __init__(self):
        self.context_buffer = ContextBuffer()
        self.concept_tracker = ConceptTracker()
        self.last_visual_payload: Optional[VisualPayload] = None
        self.last_visual_emission_time: float = 0.0

    def process_step(self, step: Dict[str, Any]) -> Optional[VisualPayload]:
        """Processes an incoming step from spoken teaching or sample lesson.
        
        Args:
            step: Dict containing spoken sentence, target concept, typology, and visual builder parameters.
            
        Returns:
            VisualPayload if a visual update/highlight/creation is warranted, or None if retained.
        """
        sentence = step.get("sentence", "")
        subject = step.get("subject", "Mathematics")
        topic = step.get("topic", "General")
        concept = step.get("concept", topic)
        continuity_key = step.get("continuity_key", f"vis_{topic.lower().replace(' ', '_')}")
        target_feature_id = step.get("target_feature_id")
        typology = step.get("typology", "MATH_EQUATION")

        # 1. Update Context
        self.context_buffer.add_sentence(sentence, subject=subject, topic=topic)

        # 2. Evaluate Transition
        mode, reason = self.concept_tracker.evaluate_transition(
            incoming_concept=concept,
            continuity_key=continuity_key,
            target_feature_id=target_feature_id
        )

        # If RETAIN and we already have a visual payload, suppress visual churn
        if mode == RenderMode.RETAIN and self.last_visual_payload is not None:
            return None

        # 3. Route to Subject Builder
        visual: Optional[VisualPayload] = None

        if typology == "MATH_EQUATION":
            visual = build_math_payload(
                visual_id=step.get("visual_id", f"vis_math_{int(time.time()*1000)}"),
                title=step.get("title", topic),
                latex_expression=step.get("latex", ""),
                steps=step.get("steps"),
                active_step_id=target_feature_id,
                mode=mode,
                continuity_key=continuity_key,
                topic=topic
            )

        elif typology == "FUNCTION_GRAPH":
            visual = build_graph_payload(
                visual_id=step.get("visual_id", f"vis_graph_{int(time.time()*1000)}"),
                title=step.get("title", topic),
                function_latex=step.get("function_latex", ""),
                function_js=step.get("function_expr", ""),
                domain=step.get("domain", [-5, 5]),
                range_y=step.get("range", [-5, 5]),
                points_of_interest=step.get("points"),
                mode=mode,
                continuity_key=continuity_key,
                topic=topic
            )

        elif typology == "STRUCTURED_FLOWCHART":
            visual = build_flowchart_payload(
                visual_id=step.get("visual_id", f"vis_flow_{int(time.time()*1000)}"),
                title=step.get("title", topic),
                nodes=step.get("nodes", []),
                edges=step.get("edges", []),
                active_node_id=target_feature_id,
                mode=mode,
                continuity_key=continuity_key,
                topic=topic
            )

        elif typology == "SCIENCE_DIAGRAM":
            visual = build_science_payload(
                visual_id=step.get("visual_id", f"vis_sci_{int(time.time()*1000)}"),
                title=step.get("title", topic),
                diagram_type=step.get("diagram_type", "cell_structure"),
                elements=step.get("elements", []),
                active_element_id=target_feature_id,
                mode=mode,
                continuity_key=continuity_key,
                topic=topic
            )

        elif typology == "TIMELINE":
            visual = build_timeline_payload(
                visual_id=step.get("visual_id", f"vis_time_{int(time.time()*1000)}"),
                title=step.get("title", topic),
                events=step.get("events", []),
                active_event_id=target_feature_id,
                mode=mode,
                continuity_key=continuity_key,
                topic=topic
            )

        if visual:
            self.last_visual_payload = visual
            self.last_visual_emission_time = time.time()

        return visual

    def reset(self):
        self.context_buffer.clear()
        self.concept_tracker.reset()
        self.last_visual_payload = None

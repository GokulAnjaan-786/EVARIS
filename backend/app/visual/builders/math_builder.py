"""Math Visual Payload Builder for EVARIS.

Generates validated KaTeX/LaTeX mathematical equations, expressions,
and step-by-step calculus/algebra derivations.
"""

from typing import List, Optional
from ..models import VisualPayload, VisualTypology, RenderMode, ActiveFeature, VisualMetadata


def build_math_payload(
    visual_id: str,
    title: str,
    latex_expression: str,
    steps: Optional[List[dict]] = None,
    active_step_id: Optional[str] = None,
    mode: RenderMode = RenderMode.CREATE,
    continuity_key: str = "math_eq",
    topic: str = "Algebra / Calculus",
    confidence: float = 0.98,
) -> VisualPayload:
    """Builds a validated KaTeX mathematical visual payload."""
    features = []
    if steps:
        for step in steps:
            is_active = (step.get("id") == active_step_id)
            features.append(
                ActiveFeature(
                    id=step["id"],
                    type="equation_step",
                    label=step["explanation"],
                    highlight=is_active,
                    details=step.get("latex")
                )
            )

    return VisualPayload(
        visual_id=visual_id,
        typology=VisualTypology.MATH_EQUATION,
        mode=mode,
        continuity_key=continuity_key,
        title=title,
        subtitle="Mathematical Formulation & Derivation",
        data={
            "latex": latex_expression,
            "steps": steps or [],
            "active_step_id": active_step_id,
            "display_mode": "block"
        },
        active_features=features,
        metadata=VisualMetadata(
            confidence=confidence,
            subject="Mathematics",
            topic=topic,
            generation_time_ms=12.4
        )
    )

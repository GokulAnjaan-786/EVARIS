"""Function Graph and Coordinate Geometry Visual Builder.

Renders 2D coordinate graphs (functions, curves, points, roots, vertex highlights).
Crucial for demonstrating Visual Continuity (updating or highlighting existing curves).
"""

from typing import List, Dict, Any, Optional
from ..models import VisualPayload, VisualTypology, RenderMode, ActiveFeature, VisualMetadata


def build_graph_payload(
    visual_id: str,
    title: str,
    function_latex: str,
    function_js: str,  # JS-evaluable or sampled expression: e.g. "x*x - 4*x + 3"
    domain: List[float],
    range_y: List[float],
    points_of_interest: Optional[List[Dict[str, Any]]] = None,
    mode: RenderMode = RenderMode.CREATE,
    continuity_key: str = "graph_coordinate_system",
    topic: str = "Quadratic Functions",
    confidence: float = 0.96,
) -> VisualPayload:
    """Builds a validated 2D coordinate function graph payload."""
    features = []
    if points_of_interest:
        for poi in points_of_interest:
            features.append(
                ActiveFeature(
                    id=poi["id"],
                    type="point",
                    label=poi["label"],
                    coordinates=poi["coordinates"],
                    highlight=poi.get("highlight", False),
                    details=poi.get("details")
                )
            )

    return VisualPayload(
        visual_id=visual_id,
        typology=VisualTypology.FUNCTION_GRAPH,
        mode=mode,
        continuity_key=continuity_key,
        title=title,
        subtitle=f"Coordinate Geometry: ${function_latex}$",
        data={
            "function_latex": function_latex,
            "function_expr": function_js,
            "domain": domain,
            "range": range_y,
            "points": points_of_interest or [],
            "show_grid": True,
            "show_axes": True,
            "x_label": "x",
            "y_label": "f(x)"
        },
        active_features=features,
        metadata=VisualMetadata(
            confidence=confidence,
            subject="Mathematics",
            topic=topic,
            generation_time_ms=18.5
        )
    )

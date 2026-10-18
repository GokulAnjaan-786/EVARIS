"""Flowchart and Algorithm Visual Builder for EVARIS.

Generates structured directed graphs, decision nodes, and algorithmic sequences
(e.g., Binary Search, sorting, state transitions).
"""

from typing import List, Dict, Any, Optional
from ..models import VisualPayload, VisualTypology, RenderMode, ActiveFeature, VisualMetadata


def build_flowchart_payload(
    visual_id: str,
    title: str,
    nodes: List[Dict[str, Any]],  # id, label, type ('start', 'decision', 'process', 'end'), active
    edges: List[Dict[str, Any]],  # from, to, label, highlighted
    active_node_id: Optional[str] = None,
    mode: RenderMode = RenderMode.CREATE,
    continuity_key: str = "algo_flowchart",
    topic: str = "Algorithms & Data Structures",
    confidence: float = 0.97,
) -> VisualPayload:
    """Builds a structured algorithm flowchart payload."""
    features = []
    for node in nodes:
        is_highlighted = (node["id"] == active_node_id) or node.get("highlight", False)
        features.append(
            ActiveFeature(
                id=node["id"],
                type="node",
                label=node["label"],
                highlight=is_highlighted,
                details=node.get("details")
            )
        )

    return VisualPayload(
        visual_id=visual_id,
        typology=VisualTypology.STRUCTURED_FLOWCHART,
        mode=mode,
        continuity_key=continuity_key,
        title=title,
        subtitle="Algorithmic Execution & Decision Graph",
        data={
            "nodes": nodes,
            "edges": edges,
            "active_node_id": active_node_id,
            "layout": "vertical"
        },
        active_features=features,
        metadata=VisualMetadata(
            confidence=confidence,
            subject="Computer Science",
            topic=topic,
            generation_time_ms=16.1
        )
    )

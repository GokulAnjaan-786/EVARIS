"""Timeline Visual Builder for EVARIS.

Renders chronological events, historical periods, and process stages.
"""

from typing import List, Dict, Any, Optional
from ..models import VisualPayload, VisualTypology, RenderMode, ActiveFeature, VisualMetadata


def build_timeline_payload(
    visual_id: str,
    title: str,
    events: List[Dict[str, Any]],  # year/date, label, description, highlight
    active_event_id: Optional[str] = None,
    mode: RenderMode = RenderMode.CREATE,
    continuity_key: str = "history_timeline",
    topic: str = "World History & Technology",
    confidence: float = 0.95,
) -> VisualPayload:
    """Builds an interactive chronological timeline visual payload."""
    features = []
    for ev in events:
        is_highlighted = (ev["id"] == active_event_id) or ev.get("highlight", False)
        features.append(
            ActiveFeature(
                id=ev["id"],
                type="milestone",
                label=f"{ev['period']}: {ev['title']}",
                highlight=is_highlighted,
                details=ev.get("description")
            )
        )

    return VisualPayload(
        visual_id=visual_id,
        typology=VisualTypology.TIMELINE,
        mode=mode,
        continuity_key=continuity_key,
        title=title,
        subtitle="Chronological Milestone Progression",
        data={
            "events": events,
            "active_event_id": active_event_id
        },
        active_features=features,
        metadata=VisualMetadata(
            confidence=confidence,
            subject="History / Social Sciences",
            topic=topic,
            generation_time_ms=15.0
        )
    )

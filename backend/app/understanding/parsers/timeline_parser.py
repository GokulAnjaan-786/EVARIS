"""Dynamic Historical Timeline & Chronological Milestone Parser for EVARIS.

Extracts historical dates, years, and pivotal events:
- Year & Date extraction (1789, 1969, 1945, 1492, etc.)
- Milestone descriptions, causes, and impacts
- Visual Continuity: Appends or inserts chronological milestones into active timelines
"""

import re
from typing import Optional, Dict, Any, List
from ..concept_models import ExtractedConcept, TeacherIntent
from ...visual.models import VisualTypology, VisualPayload


KNOWN_HISTORICAL_EVENTS = [
    {
        "keywords": ["french revolution", "bastille", "1789"],
        "default_year": "1789",
        "title": "Outbreak of the French Revolution",
        "description": "Storming of the Bastille, Declaration of the Rights of Man, and collapse of the Ancien Régime."
    },
    {
        "keywords": ["napoleon", "1799", "coup of 18 brumaire"],
        "default_year": "1799",
        "title": "Rise of Napoleon Bonaparte",
        "description": "Coup of 18 Brumaire establishes the French Consulate and concludes the revolutionary decade."
    },
    {
        "keywords": ["apollo 11", "moon landing", "armstrong", "1969"],
        "default_year": "1969",
        "title": "Apollo 11 Lunar Landing",
        "description": "Neil Armstrong and Buzz Aldrin become the first humans to walk on the lunar surface."
    },
    {
        "keywords": ["world war 2", "second world war", "ww2", "1945"],
        "default_year": "1945",
        "title": "Conclusion of World War II",
        "description": "Unconditional surrender of Axis powers and establishment of the United Nations."
    },
    {
        "keywords": ["world war 1", "first world war", "ww1", "1914"],
        "default_year": "1914",
        "title": "Outbreak of World War I",
        "description": "Assassination of Archduke Franz Ferdinand ignites global conflict across Europe."
    },
    {
        "keywords": ["printing press", "gutenberg", "1440", "1450"],
        "default_year": "1440",
        "title": "Invention of Movable Type Printing",
        "description": "Johannes Gutenberg invents movable type printing press, accelerating scientific and cultural dissemination."
    }
]


class TimelineParser:
    """Parses chronological historical statements and updates interactive timelines."""

    def parse(
        self,
        raw_text: str,
        active_visual: Optional[VisualPayload] = None
    ) -> Optional[ExtractedConcept]:
        clean = raw_text.lower().strip()

        # Extract 3-digit or 4-digit year (e.g. 1789, 1969, 1945)
        year_match = re.search(r"\b(1[0-9]{3}|20[0-2][0-9]|[5-9][0-9]{2})\b", clean)
        extracted_year = year_match.group(1) if year_match else None

        # Check against known historical milestones
        matched_event = None
        for ev in KNOWN_HISTORICAL_EVENTS:
            if any(kw in clean for kw in ev["keywords"]):
                matched_event = ev
                break

        # If a year and a historical verb/event is present or matched
        if matched_event or (extracted_year and any(w in clean for w in ["revolution", "war", "began", "landed", "signed", "invented", "founded", "treaty", "empire"])):
            year = extracted_year or (matched_event["default_year"] if matched_event else "1789")
            ev_title = matched_event["title"] if matched_event else f"Historical Event ({year})"
            ev_desc = matched_event["description"] if matched_event else raw_text.strip()
            new_event_id = f"event_{year}_{abs(hash(ev_title)) % 1000}"

            # 1. Visual Continuity: Check if timeline is already active
            if active_visual and active_visual.typology == VisualTypology.TIMELINE:
                existing_events = list(active_visual.data.get("events", []))
                cont_key = active_visual.continuity_key
                timeline_title = active_visual.title

                # Avoid duplicate event if already present
                existing_years = [e.get("period") for e in existing_events]
                if year not in existing_years or ev_title not in [e.get("title") for e in existing_events]:
                    # Un-highlight old events
                    updated_events = []
                    for e in existing_events:
                        ec = dict(e)
                        ec["highlight"] = False
                        updated_events.append(ec)

                    # Add new event
                    updated_events.append({
                        "id": new_event_id,
                        "period": year,
                        "title": ev_title,
                        "description": ev_desc,
                        "highlight": True
                    })

                    # Sort chronologically by year integer
                    def sort_key(item):
                        try:
                            return int(re.sub(r"[^\d]", "", str(item.get("period", "0"))))
                        except Exception:
                            return 0

                    updated_events.sort(key=sort_key)

                    return ExtractedConcept(
                        concept_name=f"Chronological Update: {year}",
                        subject="History / Social Sciences",
                        topic="World History & Civilization",
                        intent=TeacherIntent.UPDATE,
                        typology=VisualTypology.TIMELINE,
                        continuity_key=cont_key,
                        target_feature_id=new_event_id,
                        confidence=0.97,
                        source_sentence=raw_text,
                        builder_data={
                            "title": timeline_title,
                            "events": updated_events,
                            "active_event_id": new_event_id
                        }
                    )

            # 2. Fresh Timeline Creation
            events = [
                {
                    "id": new_event_id,
                    "period": year,
                    "title": ev_title,
                    "description": ev_desc,
                    "highlight": True
                }
            ]

            return ExtractedConcept(
                concept_name=f"Timeline Milestone {year}",
                subject="History / Social Sciences",
                topic="World History & Civilization",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.TIMELINE,
                continuity_key="history_timeline_stream",
                target_feature_id=new_event_id,
                confidence=0.96,
                source_sentence=raw_text,
                builder_data={
                    "title": f"Chronological Progression: {ev_title}",
                    "events": events,
                    "active_event_id": new_event_id
                }
            )

        return None

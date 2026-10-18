"""Dynamic Algorithm & Flowchart Parser for EVARIS.

Extracts algorithmic processes, decision logic, and control flows:
- Binary Search (logarithmic range division, midpoint calculation, branch comparison)
- Linear Search (sequential scan, termination condition)
- Sorting Algorithms (Merge Sort, Bubble Sort, Quick Sort)
- General conditional logic / loops
- Visual Continuity: Real-time step highlighting and decision tracking
"""

import re
from typing import Optional, Dict, Any, List
from ..concept_models import ExtractedConcept, TeacherIntent
from ...visual.models import VisualTypology, VisualPayload


class FlowchartParser:
    """Parses computer science algorithms into structured directed graphs."""

    def parse(
        self,
        raw_text: str,
        active_visual: Optional[VisualPayload] = None
    ) -> Optional[ExtractedConcept]:
        clean = raw_text.lower().strip()

        # 1. Visual Continuity: Check follow-up on active flowchart
        if active_visual and active_visual.typology == VisualTypology.STRUCTURED_FLOWCHART:
            followup = self._parse_flowchart_followup(clean, raw_text, active_visual)
            if followup:
                return followup

        # 2. Binary Search
        bs = self._parse_binary_search(clean, raw_text)
        if bs:
            return bs

        # 3. Linear Search
        ls = self._parse_linear_search(clean, raw_text)
        if ls:
            return ls

        # 4. Sorting Algorithms (Merge Sort, Quick Sort, Bubble Sort)
        sort_flow = self._parse_sorting(clean, raw_text)
        if sort_flow:
            return sort_flow

        return None

    def _parse_flowchart_followup(
        self,
        clean: str,
        raw_text: str,
        active_visual: VisualPayload
    ) -> Optional[ExtractedConcept]:
        """Highlights or updates specific nodes in the active flowchart."""
        nodes = list(active_visual.data.get("nodes", []))
        edges = list(active_visual.data.get("edges", []))
        cont_key = active_visual.continuity_key
        title = active_visual.title

        target_node_id = None
        concept_name = "Algorithm Step Transition"

        # A. Midpoint evaluation focus
        if any(w in clean for w in ["midpoint", "middle element", "mid index", "halfway"]):
            target_node_id = "node_calc_mid"
            concept_name = "Midpoint Calculation & Evaluation"

        # B. Branch comparison focus (Target < Mid or Target > Mid)
        elif any(w in clean for w in ["compare", "less than", "greater than", "is array[mid] == target", "check equal"]):
            target_node_id = "node_check_eq"
            concept_name = "Target Comparison Branch"

        # C. Range adjustment (halving the search space)
        elif any(w in clean for w in ["halve", "halves", "discard half", "adjust high", "adjust low"]):
            target_node_id = "node_branch_left" if "node_branch_left" in [n["id"] for n in nodes] else "node_check_eq"
            concept_name = "Search Space Halving"

        # D. Termination / Base case / Found
        elif any(w in clean for w in ["found", "base case", "return", "terminate", "exit"]):
            target_node_id = "node_found" if "node_found" in [n["id"] for n in nodes] else "node_end"
            concept_name = "Algorithm Termination"

        if target_node_id:
            updated_nodes = []
            for n in nodes:
                node_copy = dict(n)
                node_copy["highlight"] = (n["id"] == target_node_id)
                updated_nodes.append(node_copy)

            return ExtractedConcept(
                concept_name=concept_name,
                subject="Computer Science",
                topic="Search & Algorithm Flow",
                intent=TeacherIntent.HIGHLIGHT,
                typology=VisualTypology.STRUCTURED_FLOWCHART,
                continuity_key=cont_key,
                target_feature_id=target_node_id,
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": f"{title} [{concept_name}]",
                    "nodes": updated_nodes,
                    "edges": edges,
                    "active_node_id": target_node_id
                }
            )

        return None

    def _parse_binary_search(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects binary search and builds its execution flowchart."""
        if not any(k in clean for k in ["binary search", "halves the search", "halve the search", "divide and conquer", "sorted array"]):
            return None

        has_midpoint = any(k in clean for k in ["midpoint", "middle element", "mid index"])
        concept_name = "Midpoint Evaluation" if has_midpoint else "Binary Search Algorithm Flow"
        active_node_id = "node_calc_mid" if has_midpoint else "node_start"

        nodes = [
            {
                "id": "node_start",
                "label": "Start: Input Sorted Array & Target T",
                "type": "start",
                "highlight": not has_midpoint,
                "details": "Requires monotonically sorted array bounds: Low=0, High=N-1"
            },
            {
                "id": "node_check_bounds",
                "label": "Loop Condition: Is Low <= High?",
                "type": "decision",
                "highlight": False,
                "details": "Exhaustion check: if false, element does not exist in array"
            },
            {
                "id": "node_calc_mid",
                "label": "Calculate Mid = Low + (High - Low)/2",
                "type": "process",
                "highlight": has_midpoint,
                "details": "Prevents integer 32-bit overflow"
            },
            {
                "id": "node_check_eq",
                "label": "Is Array[Mid] == Target?",
                "type": "decision",
                "highlight": False,
                "details": "O(1) comparison at middle index"
            },
            {
                "id": "node_branch_left",
                "label": "T < Array[Mid] ? High = Mid - 1 : Low = Mid + 1",
                "type": "process",
                "highlight": False,
                "details": "Discards half of remaining search interval: O(log N)"
            },
            {
                "id": "node_found",
                "label": "Target Located: Return Mid Index",
                "type": "end",
                "highlight": False,
                "details": "Successful search completion in at most ⌈log₂ N⌉ steps"
            }
        ]

        edges = [
            {"from": "node_start", "to": "node_check_bounds", "label": "Initialize"},
            {"from": "node_check_bounds", "to": "node_calc_mid", "label": "True"},
            {"from": "node_calc_mid", "to": "node_check_eq", "label": ""},
            {"from": "node_check_eq", "to": "node_found", "label": "Yes (Match)"},
            {"from": "node_check_eq", "to": "node_branch_left", "label": "No (Mismatch)"},
            {"from": "node_branch_left", "to": "node_check_bounds", "label": "Next Iteration"}
        ]

        return ExtractedConcept(
            concept_name=concept_name,
            subject="Computer Science",
            topic="Search Algorithms & Complexity",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.STRUCTURED_FLOWCHART,
            continuity_key="cs_bs_flowchart",
            confidence=0.98,
            source_sentence=raw_text,
            builder_data={
                "title": f"Binary Search: {concept_name}",
                "nodes": nodes,
                "edges": edges,
                "active_node_id": active_node_id
            }
        )

    def _parse_linear_search(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects linear search algorithm."""
        if not any(k in clean for k in ["linear search", "sequential search", "every element from beginning"]):
            return None

        nodes = [
            {"id": "node_start", "label": "Start: Input Array & Target T", "type": "start", "highlight": True},
            {"id": "node_set_idx", "label": "Set Index i = 0", "type": "process", "highlight": False},
            {"id": "node_check_idx", "label": "Is i < Array.Length?", "type": "decision", "highlight": False},
            {"id": "node_compare", "label": "Is Array[i] == Target?", "type": "decision", "highlight": False},
            {"id": "node_next", "label": "Increment i = i + 1", "type": "process", "highlight": False},
            {"id": "node_found", "label": "Target Located: Return i", "type": "end", "highlight": False}
        ]

        edges = [
            {"from": "node_start", "to": "node_set_idx", "label": ""},
            {"from": "node_set_idx", "to": "node_check_idx", "label": ""},
            {"from": "node_check_idx", "to": "node_compare", "label": "Yes"},
            {"from": "node_compare", "to": "node_found", "label": "Yes"},
            {"from": "node_compare", "to": "node_next", "label": "No"},
            {"from": "node_next", "to": "node_check_idx", "label": "Repeat"}
        ]

        return ExtractedConcept(
            concept_name="Linear Search Algorithm",
            subject="Computer Science",
            topic="Search Algorithms",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.STRUCTURED_FLOWCHART,
            continuity_key="cs_linear_search_flowchart",
            confidence=0.97,
            source_sentence=raw_text,
            builder_data={
                "title": "Linear Search: O(N) Sequential Traversal",
                "nodes": nodes,
                "edges": edges,
                "active_node_id": "node_start"
            }
        )

    def _parse_sorting(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects sorting algorithms (Merge Sort, Bubble Sort)."""
        if "merge sort" in clean or ("divide" in clean and "merge" in clean):
            nodes = [
                {"id": "node_start", "label": "Start: Input Unsorted Array", "type": "start", "highlight": True},
                {"id": "node_base", "label": "Is Array Length <= 1?", "type": "decision", "highlight": False},
                {"id": "node_divide", "label": "Divide Array into Left and Right Subarrays", "type": "process", "highlight": False},
                {"id": "node_recurse", "label": "Recursively Sort Left and Right Halves", "type": "process", "highlight": False},
                {"id": "node_merge", "label": "Merge Two Sorted Subarrays in O(N)", "type": "process", "highlight": False},
                {"id": "node_end", "label": "Return Sorted Array (O(N log N))", "type": "end", "highlight": False}
            ]
            edges = [
                {"from": "node_start", "to": "node_base", "label": ""},
                {"from": "node_base", "to": "node_end", "label": "Yes (Base Case)"},
                {"from": "node_base", "to": "node_divide", "label": "No"},
                {"from": "node_divide", "to": "node_recurse", "label": ""},
                {"from": "node_recurse", "to": "node_merge", "label": ""},
                {"from": "node_merge", "to": "node_end", "label": ""}
            ]
            return ExtractedConcept(
                concept_name="Merge Sort Divide & Conquer",
                subject="Computer Science",
                topic="Sorting Algorithms",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.STRUCTURED_FLOWCHART,
                continuity_key="cs_merge_sort_flowchart",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "Merge Sort: Divide, Conquer, and Combine (O(N log N))",
                    "nodes": nodes,
                    "edges": edges,
                    "active_node_id": "node_start"
                }
            )

        return None

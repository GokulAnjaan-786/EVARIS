"""Mock Streamer and Multi-Subject Sample Lesson Engine for EVARIS.

Provides high-fidelity, timestamped teaching lessons across Mathematics,
Computer Science, and Biology. Validates speech ingestion, concept tracking,
and real-time visual continuity without requiring a live microphone.
"""

from typing import List, Dict, Any


SAMPLE_LESSONS: Dict[str, Dict[str, Any]] = {
    "math_quadratic": {
        "id": "math_quadratic",
        "title": "Quadratic Functions & Parabola Vertex",
        "subject": "Mathematics",
        "grade_level": "High School / College Algebra",
        "duration_seconds": 35,
        "description": "Explores the standard quadratic curve f(x) = x² - 4x + 3, derives its vertex minimum, and isolates its roots on the Cartesian coordinate plane.",
        "steps": [
            {
                "step_index": 1,
                "sentence": "Today, we will analyze the quadratic function f(x) equals x squared minus 4x plus 3, which models parabolic trajectories.",
                "subject": "Mathematics",
                "topic": "Quadratic Functions",
                "concept": "Standard Quadratic Equation",
                "typology": "MATH_EQUATION",
                "continuity_key": "math_quad_stream",
                "title": "Standard Quadratic Formulation",
                "latex": "f(x) = x^2 - 4x + 3",
                "steps": [
                    {"id": "s1", "explanation": "General Form: ax² + bx + c", "latex": "a = 1,\\; b = -4,\\; c = 3"},
                    {"id": "s2", "explanation": "Discriminant: Δ = b² - 4ac", "latex": "\\Delta = (-4)^2 - 4(1)(3) = 16 - 12 = 4 > 0"},
                ],
                "target_feature_id": "s1",
                "pause_ms": 3500
            },
            {
                "step_index": 2,
                "sentence": "Let us plot this function on the Cartesian coordinate plane to see how its curvature behaves across the domain.",
                "subject": "Mathematics",
                "topic": "Quadratic Functions",
                "concept": "Coordinate Graph",
                "typology": "FUNCTION_GRAPH",
                "continuity_key": "parabola_graph_01",
                "title": "Parabola f(x) = x² - 4x + 3",
                "function_latex": "f(x) = x^2 - 4x + 3",
                "function_expr": "x*x - 4*x + 3",
                "domain": [-1.0, 5.0],
                "range": [-2.0, 6.0],
                "points": [],
                "target_feature_id": None,
                "pause_ms": 4000
            },
            {
                "step_index": 3,
                "sentence": "Because the leading coefficient a is positive, the parabola opens upward, reaching a single absolute minimum at its vertex.",
                "subject": "Mathematics",
                "topic": "Quadratic Functions",
                "concept": "Parabola Vertex Analysis",
                "typology": "FUNCTION_GRAPH",
                "continuity_key": "parabola_graph_01",  # Same continuity key -> Mutates existing graph!
                "title": "Parabola f(x) = x² - 4x + 3 [Vertex Located]",
                "function_latex": "f(x) = x^2 - 4x + 3",
                "function_expr": "x*x - 4*x + 3",
                "domain": [-1.0, 5.0],
                "range": [-2.0, 6.0],
                "points": [
                    {
                        "id": "vertex_pt",
                        "label": "Vertex (2, -1) [Absolute Min]",
                        "coordinates": [2.0, -1.0],
                        "highlight": True,
                        "details": "Calculated via x = -b / 2a = -(-4) / 2 = 2; f(2) = 2² - 4(2) + 3 = -1"
                    }
                ],
                "target_feature_id": "vertex_pt",
                "pause_ms": 4500
            },
            {
                "step_index": 4,
                "sentence": "By setting f(x) to zero, we factor the quadratic into (x - 1)(x - 3) = 0, giving us two distinct real roots where the curve crosses the x-axis.",
                "subject": "Mathematics",
                "topic": "Quadratic Functions",
                "concept": "Roots / X-Intercepts",
                "typology": "FUNCTION_GRAPH",
                "continuity_key": "parabola_graph_01",  # Same graph mutated with root points!
                "title": "Parabola f(x) = x² - 4x + 3 [Roots & Vertex]",
                "function_latex": "f(x) = (x - 1)(x - 3)",
                "function_expr": "x*x - 4*x + 3",
                "domain": [-1.0, 5.0],
                "range": [-2.0, 6.0],
                "points": [
                    {
                        "id": "vertex_pt",
                        "label": "Vertex (2, -1)",
                        "coordinates": [2.0, -1.0],
                        "highlight": False,
                        "details": "Minimum Point"
                    },
                    {
                        "id": "root_1",
                        "label": "Root x₁ = 1",
                        "coordinates": [1.0, 0.0],
                        "highlight": True,
                        "details": "Left x-intercept"
                    },
                    {
                        "id": "root_2",
                        "label": "Root x₂ = 3",
                        "coordinates": [3.0, 0.0],
                        "highlight": True,
                        "details": "Right x-intercept"
                    }
                ],
                "target_feature_id": "root_1",
                "pause_ms": 4500
            }
        ]
    },
    "cs_binary_search": {
        "id": "cs_binary_search",
        "title": "Binary Search Algorithm & Divide-and-Conquer",
        "subject": "Computer Science",
        "grade_level": "Undergraduate CS / Algorithms",
        "duration_seconds": 30,
        "description": "Demonstrates algorithmic divide-and-conquer logic, branching evaluation, and logarithmic search complexity.",
        "steps": [
            {
                "step_index": 1,
                "sentence": "Binary search is an efficient logarithmic algorithm that locates a target value within a sorted collection by repeatedly halving the search space.",
                "subject": "Computer Science",
                "topic": "Search Algorithms",
                "concept": "Algorithmic Overview",
                "typology": "STRUCTURED_FLOWCHART",
                "continuity_key": "cs_bs_flowchart",
                "title": "Binary Search Execution Flow",
                "nodes": [
                    {"id": "node_start", "label": "Start: Input Sorted Array & Target T", "type": "start", "highlight": True},
                    {"id": "node_calc_mid", "label": "Calculate Mid = Low + (High - Low)/2", "type": "process", "highlight": False},
                    {"id": "node_check_eq", "label": "Is Array[Mid] == Target?", "type": "decision", "highlight": False},
                    {"id": "node_found", "label": "Return Mid Index (Target Located)", "type": "end", "highlight": False},
                    {"id": "node_check_gt", "label": "Is Array[Mid] < Target?", "type": "decision", "highlight": False},
                    {"id": "node_right", "label": "Low = Mid + 1 (Search Right Subarray)", "type": "process", "highlight": False},
                    {"id": "node_left", "label": "High = Mid - 1 (Search Left Subarray)", "type": "process", "highlight": False}
                ],
                "edges": [
                    {"from": "node_start", "to": "node_calc_mid", "label": ""},
                    {"from": "node_calc_mid", "to": "node_check_eq", "label": ""},
                    {"from": "node_check_eq", "to": "node_found", "label": "Yes"},
                    {"from": "node_check_eq", "to": "node_check_gt", "label": "No"},
                    {"from": "node_check_gt", "to": "node_right", "label": "Yes"},
                    {"from": "node_check_gt", "to": "node_left", "label": "No"}
                ],
                "target_feature_id": "node_start",
                "pause_ms": 4000
            },
            {
                "step_index": 2,
                "sentence": "At each iteration, we calculate the middle index to evaluate whether the element matches our target in O(1) time.",
                "subject": "Computer Science",
                "topic": "Search Algorithms",
                "concept": "Midpoint Calculation",
                "typology": "STRUCTURED_FLOWCHART",
                "continuity_key": "cs_bs_flowchart",  # Same flowchart, highlighting midpoint node!
                "title": "Binary Search: Midpoint Evaluation",
                "nodes": [
                    {"id": "node_start", "label": "Start: Input Sorted Array & Target T", "type": "start", "highlight": False},
                    {"id": "node_calc_mid", "label": "Calculate Mid = Low + (High - Low)/2", "type": "process", "highlight": True},
                    {"id": "node_check_eq", "label": "Is Array[Mid] == Target?", "type": "decision", "highlight": False},
                    {"id": "node_found", "label": "Return Mid Index (Target Located)", "type": "end", "highlight": False},
                    {"id": "node_check_gt", "label": "Is Array[Mid] < Target?", "type": "decision", "highlight": False},
                    {"id": "node_right", "label": "Low = Mid + 1 (Search Right Subarray)", "type": "process", "highlight": False},
                    {"id": "node_left", "label": "High = Mid - 1 (Search Left Subarray)", "type": "process", "highlight": False}
                ],
                "edges": [
                    {"from": "node_start", "to": "node_calc_mid", "label": ""},
                    {"from": "node_calc_mid", "to": "node_check_eq", "label": ""},
                    {"from": "node_check_eq", "to": "node_found", "label": "Yes"},
                    {"from": "node_check_eq", "to": "node_check_gt", "label": "No"},
                    {"from": "node_check_gt", "to": "node_right", "label": "Yes"},
                    {"from": "node_check_gt", "to": "node_left", "label": "No"}
                ],
                "target_feature_id": "node_calc_mid",
                "pause_ms": 4000
            },
            {
                "step_index": 3,
                "sentence": "If the target is greater than the middle element, we instantly eliminate the left half of the array, achieving O(log N) efficiency.",
                "subject": "Computer Science",
                "topic": "Search Algorithms",
                "concept": "Branch Elimination",
                "typology": "STRUCTURED_FLOWCHART",
                "continuity_key": "cs_bs_flowchart",  # Highlighting branch transition
                "title": "Binary Search: Right Subarray Branch Transition",
                "nodes": [
                    {"id": "node_start", "label": "Start: Input Sorted Array & Target T", "type": "start", "highlight": False},
                    {"id": "node_calc_mid", "label": "Calculate Mid = Low + (High - Low)/2", "type": "process", "highlight": False},
                    {"id": "node_check_eq", "label": "Is Array[Mid] == Target?", "type": "decision", "highlight": False},
                    {"id": "node_found", "label": "Return Mid Index (Target Located)", "type": "end", "highlight": False},
                    {"id": "node_check_gt", "label": "Is Array[Mid] < Target?", "type": "decision", "highlight": False},
                    {"id": "node_right", "label": "Low = Mid + 1 (Search Right Subarray)", "type": "process", "highlight": True},
                    {"id": "node_left", "label": "High = Mid - 1 (Search Left Subarray)", "type": "process", "highlight": False}
                ],
                "edges": [
                    {"from": "node_start", "to": "node_calc_mid", "label": ""},
                    {"from": "node_calc_mid", "to": "node_check_eq", "label": ""},
                    {"from": "node_check_eq", "to": "node_found", "label": "Yes"},
                    {"from": "node_check_eq", "to": "node_check_gt", "label": "No"},
                    {"from": "node_check_gt", "to": "node_right", "label": "Yes"},
                    {"from": "node_check_gt", "to": "node_left", "label": "No"}
                ],
                "target_feature_id": "node_right",
                "pause_ms": 4500
            }
        ]
    },
    "bio_photosynthesis": {
        "id": "bio_photosynthesis",
        "title": "Chloroplast & Photosynthetic Light Reactions",
        "subject": "Science / Biology",
        "grade_level": "Secondary / College Biology",
        "duration_seconds": 32,
        "description": "Visualizes the anatomical organelles of the plant chloroplast, highlighting thylakoid membrane stacks, stroma, and energy conversion.",
        "steps": [
            {
                "step_index": 1,
                "sentence": "Photosynthesis takes place inside specialized plant organelles called chloroplasts, enclosed by a double-membrane envelope.",
                "subject": "Science",
                "topic": "Cell Biology",
                "concept": "Chloroplast Anatomy",
                "typology": "SCIENCE_DIAGRAM",
                "continuity_key": "bio_chloroplast_diagram",
                "title": "Chloroplast Cellular Schematic",
                "diagram_type": "cell_structure",
                "elements": [
                    {"id": "outer_membrane", "label": "Outer Membrane", "role": "Permeable barrier", "x": 400, "y": 250, "radius": 220, "highlight": False, "description": "Smooth outer phospholipid bilayer."},
                    {"id": "inner_membrane", "label": "Inner Membrane", "role": "Selective transport", "x": 400, "y": 250, "radius": 200, "highlight": False, "description": "Regulates passage of metabolites."},
                    {"id": "stroma", "label": "Stroma Fluid", "role": "Dark reactions / Calvin cycle", "x": 300, "y": 200, "radius": 40, "highlight": False, "description": "Aqueous fluid containing enzymes and chloroplast DNA."},
                    {"id": "thylakoids", "label": "Thylakoid Granum", "role": "Light-dependent reactions", "x": 480, "y": 260, "radius": 55, "highlight": False, "description": "Membrane disc stacks containing chlorophyll complexes."}
                ],
                "target_feature_id": None,
                "pause_ms": 4000
            },
            {
                "step_index": 2,
                "sentence": "Light energy is captured by chlorophyll molecules embedded directly within these disc-shaped thylakoid membranes, exciting electrons.",
                "subject": "Science",
                "topic": "Cell Biology",
                "concept": "Thylakoid Granum Excitation",
                "typology": "SCIENCE_DIAGRAM",
                "continuity_key": "bio_chloroplast_diagram",  # Same diagram, highlighting thylakoids!
                "title": "Chloroplast: Thylakoid Stacks (Light Reactions)",
                "diagram_type": "cell_structure",
                "elements": [
                    {"id": "outer_membrane", "label": "Outer Membrane", "role": "Permeable barrier", "x": 400, "y": 250, "radius": 220, "highlight": False, "description": "Smooth outer phospholipid bilayer."},
                    {"id": "inner_membrane", "label": "Inner Membrane", "role": "Selective transport", "x": 400, "y": 250, "radius": 200, "highlight": False, "description": "Regulates passage of metabolites."},
                    {"id": "stroma", "label": "Stroma Fluid", "role": "Dark reactions", "x": 300, "y": 200, "radius": 40, "highlight": False, "description": "Aqueous fluid containing enzymes."},
                    {"id": "thylakoids", "label": "Thylakoid Granum", "role": "Photon Absorption (Active)", "x": 480, "y": 260, "radius": 55, "highlight": True, "description": "Chlorophyll pigments absorb 680nm/700nm photons."}
                ],
                "target_feature_id": "thylakoids",
                "pause_ms": 4500
            },
            {
                "step_index": 3,
                "sentence": "The energized electrons generate ATP and NADPH, which diffuse into the surrounding aqueous stroma to power the Calvin cycle.",
                "subject": "Science",
                "topic": "Cell Biology",
                "concept": "Stroma Calvin Cycle",
                "typology": "SCIENCE_DIAGRAM",
                "continuity_key": "bio_chloroplast_diagram",  # Mutating to highlight stroma fluid
                "title": "Chloroplast: Stroma Glucose Synthesis",
                "diagram_type": "cell_structure",
                "elements": [
                    {"id": "outer_membrane", "label": "Outer Membrane", "role": "Permeable barrier", "x": 400, "y": 250, "radius": 220, "highlight": False, "description": "Smooth outer phospholipid bilayer."},
                    {"id": "inner_membrane", "label": "Inner Membrane", "role": "Selective transport", "x": 400, "y": 250, "radius": 200, "highlight": False, "description": "Regulates passage of metabolites."},
                    {"id": "stroma", "label": "Stroma Fluid (Calvin Cycle)", "role": "CO₂ Fixation (Active)", "x": 300, "y": 200, "radius": 40, "highlight": True, "description": "Enzyme RuBisCO catalyzes carbon fixation into G3P sugars."},
                    {"id": "thylakoids", "label": "Thylakoid Granum", "role": "ATP/NADPH Supplier", "x": 480, "y": 260, "radius": 55, "highlight": False, "description": "Generates chemical energy carrier molecules."}
                ],
                "target_feature_id": "stroma",
                "pause_ms": 4500
            }
        ]
    }
}

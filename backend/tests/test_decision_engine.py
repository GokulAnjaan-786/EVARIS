"""Unit tests for EVARIS Decision Engine and Concept Tracker."""

import pytest
from app.understanding.decision_engine import DecisionEngine
from app.visual.models import RenderMode, VisualTypology


def test_decision_engine_continuity_and_updates():
    engine = DecisionEngine()

    # Step 1: Initial creation of graph
    step1 = {
        "sentence": "Let's plot f(x) = x squared minus 4x plus 3.",
        "subject": "Mathematics",
        "topic": "Quadratic Functions",
        "concept": "Coordinate Graph",
        "typology": "FUNCTION_GRAPH",
        "continuity_key": "parabola_quad_test",
        "title": "Parabola f(x)",
        "function_latex": "f(x) = x^2 - 4x + 3",
        "function_expr": "x*x - 4*x + 3",
        "domain": [-1.0, 5.0],
        "range": [-2.0, 6.0],
        "points": [],
        "target_feature_id": None
    }
    v1 = engine.process_step(step1)
    assert v1 is not None
    assert v1.mode == RenderMode.CREATE
    assert v1.continuity_key == "parabola_quad_test"

    # Step 2: Highlighting vertex on same graph (Continuity!)
    step2 = {
        "sentence": "The vertex reaches an absolute minimum at (2, -1).",
        "subject": "Mathematics",
        "topic": "Quadratic Functions",
        "concept": "Parabola Vertex Analysis",
        "typology": "FUNCTION_GRAPH",
        "continuity_key": "parabola_quad_test",  # Same continuity key
        "title": "Parabola f(x) [Vertex Located]",
        "function_latex": "f(x) = x^2 - 4x + 3",
        "function_expr": "x*x - 4*x + 3",
        "domain": [-1.0, 5.0],
        "range": [-2.0, 6.0],
        "points": [
            {"id": "vertex_pt", "label": "Vertex", "coordinates": [2.0, -1.0], "highlight": True}
        ],
        "target_feature_id": "vertex_pt"
    }
    v2 = engine.process_step(step2)
    assert v2 is not None
    assert v2.mode == RenderMode.HIGHLIGHT  # Sub-element highlighted on existing visual!
    assert v2.continuity_key == "parabola_quad_test"


def test_decision_engine_churn_suppression():
    engine = DecisionEngine()

    step = {
        "sentence": "Consider the quadratic equation.",
        "subject": "Mathematics",
        "topic": "Quadratic Functions",
        "concept": "Equation",
        "typology": "MATH_EQUATION",
        "continuity_key": "churn_test_key",
        "title": "Formula",
        "latex": "f(x) = x^2"
    }
    v1 = engine.process_step(step)
    assert v1 is not None

    # Exact same concept and continuity without target feature -> Suppress visual churn
    step_repeat = {
        "sentence": "As we can see, it is indeed quadratic.",
        "subject": "Mathematics",
        "topic": "Quadratic Functions",
        "concept": "Equation",
        "typology": "MATH_EQUATION",
        "continuity_key": "churn_test_key",
        "title": "Formula",
        "latex": "f(x) = x^2"
    }
    v2 = engine.process_step(step_repeat)
    assert v2 is None  # Churn suppressed!

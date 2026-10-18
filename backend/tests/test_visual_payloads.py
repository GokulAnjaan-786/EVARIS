"""Unit tests for EVARIS Visual Builders and Pydantic Schemas."""

import pytest
from app.visual.models import VisualTypology, RenderMode
from app.visual.builders.math_builder import build_math_payload
from app.visual.builders.graph_builder import build_graph_payload
from app.visual.builders.flowchart_builder import build_flowchart_payload
from app.visual.builders.science_builder import build_science_payload


def test_math_builder_creates_valid_payload():
    payload = build_math_payload(
        visual_id="test_math_1",
        title="Quadratic Formula",
        latex_expression="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        steps=[{"id": "step1", "explanation": "Discriminant computation", "latex": "\\Delta = b^2 - 4ac"}],
        active_step_id="step1"
    )
    assert payload.typology == VisualTypology.MATH_EQUATION
    assert payload.title == "Quadratic Formula"
    assert payload.mode == RenderMode.CREATE
    assert len(payload.active_features) == 1
    assert payload.active_features[0].highlight is True


def test_graph_builder_supports_continuity_mode():
    payload = build_graph_payload(
        visual_id="test_graph_1",
        title="Parabola f(x)",
        function_latex="f(x) = x^2 - 4x + 3",
        function_js="x*x - 4*x + 3",
        domain=[-2.0, 6.0],
        range_y=[-2.0, 8.0],
        points_of_interest=[
            {"id": "vertex", "label": "Vertex", "coordinates": [2.0, -1.0], "highlight": True}
        ],
        mode=RenderMode.UPDATE,
        continuity_key="parabola_series_01"
    )
    assert payload.typology == VisualTypology.FUNCTION_GRAPH
    assert payload.mode == RenderMode.UPDATE
    assert payload.continuity_key == "parabola_series_01"
    assert len(payload.data["points"]) == 1
    assert payload.data["points"][0]["coordinates"] == [2.0, -1.0]


def test_flowchart_builder_creates_algorithm_nodes():
    nodes = [
        {"id": "n1", "label": "Start", "type": "start"},
        {"id": "n2", "label": "Check Midpoint", "type": "process"}
    ]
    edges = [{"from": "n1", "to": "n2", "label": ""}]
    payload = build_flowchart_payload(
        visual_id="test_flow_1",
        title="Binary Search",
        nodes=nodes,
        edges=edges,
        active_node_id="n2"
    )
    assert payload.typology == VisualTypology.STRUCTURED_FLOWCHART
    assert payload.active_features[1].highlight is True


def test_science_builder_validates_cell_diagram():
    elements = [
        {"id": "chloroplast", "label": "Chloroplast", "role": "Photosynthesis", "x": 200, "y": 200, "radius": 50}
    ]
    payload = build_science_payload(
        visual_id="test_sci_1",
        title="Plant Cell",
        diagram_type="cell_structure",
        elements=elements
    )
    assert payload.typology == VisualTypology.SCIENCE_DIAGRAM
    assert payload.metadata.subject == "Science"

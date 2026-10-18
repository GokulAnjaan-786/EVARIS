"""Dynamic Mathematical Function & Equation Parser for EVARIS.

Transforms natural language mathematical speech into verified mathematical models:
- Quadratic curves f(x) = ax² + bx + c with arbitrary coefficients
- Linear equations y = mx + b
- Trigonometric curves (sin, cos, tan)
- Classic mathematical theorems and formulas (Pythagoras, Euler, Quadratic Formula)
- Visual continuity: computes exact vertex, roots, intercepts, and tangents
"""

import re
import math
from typing import Optional, Dict, Any, List, Tuple
from ..concept_models import ExtractedConcept, TeacherIntent
from ...visual.models import VisualTypology, VisualPayload


WORD_TO_DIGIT = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "minus": "-", "negative": "-", "plus": "+",
}


def normalize_math_speech(text: str) -> str:
    """Normalizes spoken words into standard mathematical symbols."""
    t = text.lower()
    # Replace common spoken expressions
    t = re.sub(r"\bx\s*squared\b", "x^2", t)
    t = re.sub(r"\bx\s*cubed\b", "x^3", t)
    t = re.sub(r"\bx\s*to\s*the\s*power\s*(of\s*)?2\b", "x^2", t)
    t = re.sub(r"\bx\s*to\s*the\s*power\s*(of\s*)?3\b", "x^3", t)
    t = re.sub(r"\bequals\b", "=", t)
    t = re.sub(r"\by\s*equals\b", "y =", t)
    t = re.sub(r"\bf\s*of\s*x\s*equals\b", "f(x) =", t)
    
    # Word to number replacements
    for word, digit in WORD_TO_DIGIT.items():
        t = re.sub(rf"\b{word}\b", digit, t)
        
    # Clean up duplicate signs e.g. "+ -" -> "-"
    t = re.sub(r"\+\s*-", "-", t)
    t = re.sub(r"-\s*-", "+", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


class MathParser:
    """Extracts mathematical models, curves, and step derivations from live speech."""

    def parse(
        self,
        raw_text: str,
        active_visual: Optional[VisualPayload] = None
    ) -> Optional[ExtractedConcept]:
        norm = normalize_math_speech(raw_text)
        
        # 1. Visual Continuity: Check if teacher is referencing or updating an ACTIVE graph
        if active_visual and active_visual.typology == VisualTypology.FUNCTION_GRAPH:
            followup = self._parse_graph_followup(norm, raw_text, active_visual)
            if followup:
                return followup

        # 2. Parse Quadratic Function: e.g. y = a x^2 + b x + c
        quad = self._parse_quadratic(norm, raw_text)
        if quad:
            return quad

        # 3. Parse Linear Function: e.g. y = m x + b
        linear = self._parse_linear(norm, raw_text)
        if linear:
            return linear

        # 4. Parse Trigonometric Function: e.g. y = sin(x), cos(x)
        trig = self._parse_trigonometric(norm, raw_text)
        if trig:
            return trig

        # 5. Parse Classic Theorems & Formulas (KaTeX display)
        formula = self._parse_formula(norm, raw_text)
        if formula:
            return formula

        return None

    def _parse_graph_followup(
        self,
        norm: str,
        raw_text: str,
        active_visual: VisualPayload
    ) -> Optional[ExtractedConcept]:
        """Handles visual continuity updates to the currently active function graph."""
        func_expr = active_visual.data.get("function_expr", "")
        func_latex = active_visual.data.get("function_latex", "")
        existing_points = list(active_visual.data.get("points", []))
        domain = active_visual.data.get("domain", [-5.0, 5.0])
        range_y = active_visual.data.get("range", [-5.0, 5.0])
        cont_key = active_visual.continuity_key

        # A. Vertex / Turning Point / Minimum / Maximum
        if any(w in norm for w in ["vertex", "minimum", "maximum", "turning point", "peak"]):
            # Check if coordinates explicitly mentioned (e.g. "at 2, -1" or "at two comma minus one")
            coord_match = re.search(r"(-?\d+(?:\.\d+)?)\s*(?:comma|,|\s+and\s+)\s*(-?\d+(?:\.\d+)?)", norm)
            if coord_match:
                vx = float(coord_match.group(1))
                vy = float(coord_match.group(2))
            else:
                # Calculate vertex automatically from function if quadratic
                vx, vy = self._derive_vertex_from_expr(func_expr)
                if vx is None:
                    vx, vy = 0.0, 0.0

            # Update points list: update or append vertex
            new_points = [p for p in existing_points if p.get("id") != "vertex_pt"]
            vertex_label = f"Vertex ({int(vx) if vx.is_integer() else round(vx, 2)}, {int(vy) if vy.is_integer() else round(vy, 2)})"
            new_points.append({
                "id": "vertex_pt",
                "label": vertex_label,
                "coordinates": [vx, vy],
                "highlight": True,
                "details": "Calculated via x = -b / 2a"
            })

            return ExtractedConcept(
                concept_name="Parabola Vertex Analysis",
                subject="Mathematics",
                topic="Quadratic Functions",
                intent=TeacherIntent.HIGHLIGHT,
                typology=VisualTypology.FUNCTION_GRAPH,
                continuity_key=cont_key,
                target_feature_id="vertex_pt",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": f"Parabola ${func_latex}$ [Vertex Located]",
                    "function_latex": func_latex,
                    "function_expr": func_expr,
                    "domain": domain,
                    "range": range_y,
                    "points": new_points
                }
            )

        # B. Roots / Zeroes / X-intercepts
        if any(w in norm for w in ["root", "intercept", "zeroes", "crosses the x", "factors"]):
            roots = self._derive_roots_from_expr(func_expr)
            new_points = [p for p in existing_points if not p.get("id", "").startswith("root_")]
            
            # Explicit mentioned roots (e.g. "x = 1 and x = 3")
            explicit_roots = re.findall(r"x\s*=\s*(-?\d+(?:\.\d+)?)", norm)
            if explicit_roots:
                roots = [float(r) for r in explicit_roots]

            for idx, r_val in enumerate(roots):
                r_id = f"root_{idx+1}"
                r_label = f"Root x_{idx+1} = {int(r_val) if r_val.is_integer() else round(r_val, 2)}"
                new_points.append({
                    "id": r_id,
                    "label": r_label,
                    "coordinates": [r_val, 0.0],
                    "highlight": True,
                    "details": f"Zero crossing at x = {r_val}"
                })

            return ExtractedConcept(
                concept_name="Roots & Factorization",
                subject="Mathematics",
                topic="Quadratic Functions",
                intent=TeacherIntent.UPDATE,
                typology=VisualTypology.FUNCTION_GRAPH,
                continuity_key=cont_key,
                target_feature_id="root_1" if roots else None,
                confidence=0.97,
                source_sentence=raw_text,
                builder_data={
                    "title": f"Parabola ${func_latex}$ [Roots & Intercepts]",
                    "function_latex": func_latex,
                    "function_expr": func_expr,
                    "domain": domain,
                    "range": range_y,
                    "points": new_points
                }
            )

        return None

    def _parse_quadratic(self, norm: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Parses arbitrary quadratic functions: y = ax^2 + bx + c."""
        # Check quadratic keywords
        if not any(k in norm for k in ["x^2", "x squared", "quadratic", "parabola"]):
            return None

        # Extract coefficients a, b, c from patterns like "y = x^2 - 4x + 3", "x^2 - 9", "2x^2 + 4x - 6"
        # Regex to match quadratic terms
        quad_regex = r"(?:y\s*=\s*|f\(x\)\s*=\s*|plot\s+)?(-?\s*\d*)\s*x\^2(?:\s*([+-]\s*\d*)\s*x)?(?:\s*([+-]\s*\d+))?"
        match = re.search(quad_regex, norm)
        
        a, b, c = 1.0, 0.0, 0.0
        if match:
            # Coefficient a
            a_str = match.group(1).replace(" ", "") if match.group(1) else ""
            if a_str in ["", "+"]:
                a = 1.0
            elif a_str == "-":
                a = -1.0
            else:
                try:
                    a = float(a_str)
                except ValueError:
                    a = 1.0

            # Coefficient b
            if match.group(2):
                b_str = match.group(2).replace(" ", "")
                if b_str in ["+", "+1"]:
                    b = 1.0
                elif b_str in ["-", "-1"]:
                    b = -1.0
                else:
                    try:
                        b = float(b_str)
                    except ValueError:
                        b = 0.0

            # Constant c
            if match.group(3):
                c_str = match.group(3).replace(" ", "")
                try:
                    c = float(c_str)
                except ValueError:
                    c = 0.0

        # Construct LaTeX and JS expression
        # Format terms cleanly
        a_part = f"{int(a) if a.is_integer() else a}x^2" if a != 1 else "x^2"
        if a == -1: a_part = "-x^2"
        
        b_part = ""
        if b > 0:
            b_part = f" + {int(b) if b.is_integer() else b}x" if b != 1 else " + x"
        elif b < 0:
            b_part = f" - {abs(int(b) if b.is_integer() else b)}x" if b != -1 else " - x"
            
        c_part = ""
        if c > 0:
            c_part = f" + {int(c) if c.is_integer() else c}"
        elif c < 0:
            c_part = f" - {abs(int(c) if c.is_integer() else c)}"

        latex_fn = f"f(x) = {a_part}{b_part}{c_part}".strip()
        js_expr = f"{a}*x*x + ({b})*x + ({c})"

        # Compute vertex for intelligent domain & range auto-framing
        vx = -b / (2 * a) if a != 0 else 0.0
        vy = a * vx * vx + b * vx + c
        
        domain = [round(vx - 4.5, 1), round(vx + 4.5, 1)]
        range_min = round(vy - 2.0, 1) if a > 0 else round(vy - 8.0, 1)
        range_max = round(vy + 8.0, 1) if a > 0 else round(vy + 2.0, 1)
        range_y = [range_min, range_max]

        # Calculate roots if discriminant >= 0
        points = []
        disc = b * b - 4 * a * c
        if disc >= 0 and a != 0:
            r1 = (-b - math.sqrt(disc)) / (2 * a)
            r2 = (-b + math.sqrt(disc)) / (2 * a)
            # Expand domain to comfortably fit roots
            min_r = min(r1, r2)
            max_r = max(r1, r2)
            if min_r < domain[0]: domain[0] = round(min_r - 1.5, 1)
            if max_r > domain[1]: domain[1] = round(max_r + 1.5, 1)

        return ExtractedConcept(
            concept_name="Quadratic Curve",
            subject="Mathematics",
            topic="Quadratic Functions",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.FUNCTION_GRAPH,
            continuity_key="parabola_graph_01",
            confidence=0.96,
            source_sentence=raw_text,
            builder_data={
                "title": f"Parabola ${latex_fn}$",
                "function_latex": latex_fn,
                "function_expr": js_expr,
                "domain": domain,
                "range": range_y,
                "points": points
            }
        )

    def _parse_linear(self, norm: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Parses linear equations: y = mx + b."""
        if not re.search(r"\b(line|linear|slope|y\s*=\s*-?\d*\s*x|plot\s+y\s*=)\b", norm):
            return None
            
        lin_regex = r"(?:y\s*=\s*|f\(x\)\s*=\s*|plot\s+)?(-?\s*\d*)\s*x(?:\s*([+-]\s*\d+))?"
        match = re.search(lin_regex, norm)
        if not match:
            return None

        m_str = match.group(1).replace(" ", "") if match.group(1) else ""
        if m_str in ["", "+"]: m = 1.0
        elif m_str == "-": m = -1.0
        else:
            try: m = float(m_str)
            except ValueError: m = 1.0

        b = 0.0
        if match.group(2):
            try: b = float(match.group(2).replace(" ", ""))
            except ValueError: b = 0.0

        m_part = f"{int(m) if m.is_integer() else m}x" if m != 1 else "x"
        if m == -1: m_part = "-x"
        b_part = f" + {int(b) if b.is_integer() else b}" if b > 0 else (f" - {abs(int(b) if b.is_integer() else b)}" if b < 0 else "")
        latex_fn = f"f(x) = {m_part}{b_part}"
        js_expr = f"{m}*x + ({b})"

        # Points of interest: y-intercept
        points = [{
            "id": "y_intercept",
            "label": f"Intercept (0, {int(b) if b.is_integer() else b})",
            "coordinates": [0.0, b],
            "highlight": True,
            "details": f"y-intercept at x = 0"
        }]

        return ExtractedConcept(
            concept_name="Linear Function",
            subject="Mathematics",
            topic="Linear Algebra & Functions",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.FUNCTION_GRAPH,
            continuity_key="linear_graph_01",
            confidence=0.95,
            source_sentence=raw_text,
            builder_data={
                "title": f"Linear Function ${latex_fn}$",
                "function_latex": latex_fn,
                "function_expr": js_expr,
                "domain": [-6.0, 6.0],
                "range": [-6.0, 6.0],
                "points": points
            }
        )

    def _parse_trigonometric(self, norm: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Parses trigonometric waves: sin, cos, tan."""
        if "sin" in norm or "sine" in norm:
            return ExtractedConcept(
                concept_name="Sine Wave",
                subject="Mathematics",
                topic="Trigonometry",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.FUNCTION_GRAPH,
                continuity_key="trig_sine_01",
                confidence=0.96,
                source_sentence=raw_text,
                builder_data={
                    "title": "Trigonometric Function: f(x) = \\sin(x)",
                    "function_latex": "f(x) = \\sin(x)",
                    "function_expr": "Math.sin(x)",
                    "domain": [-6.28, 6.28],
                    "range": [-1.5, 1.5],
                    "points": [
                        {"id": "origin", "label": "(0, 0)", "coordinates": [0.0, 0.0], "highlight": False},
                        {"id": "peak", "label": "Peak (π/2, 1)", "coordinates": [1.57, 1.0], "highlight": True}
                    ]
                }
            )
        elif "cos" in norm or "cosine" in norm:
            return ExtractedConcept(
                concept_name="Cosine Wave",
                subject="Mathematics",
                topic="Trigonometry",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.FUNCTION_GRAPH,
                continuity_key="trig_cosine_01",
                confidence=0.96,
                source_sentence=raw_text,
                builder_data={
                    "title": "Trigonometric Function: f(x) = \\cos(x)",
                    "function_latex": "f(x) = \\cos(x)",
                    "function_expr": "Math.cos(x)",
                    "domain": [-6.28, 6.28],
                    "range": [-1.5, 1.5],
                    "points": [
                        {"id": "peak", "label": "Intercept (0, 1)", "coordinates": [0.0, 1.0], "highlight": True}
                    ]
                }
            )
        return None

    def _parse_formula(self, norm: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Parses classic mathematical derivations and theorems for KaTeX display."""
        # Pythagorean theorem
        if any(k in norm for k in ["pythagor", "a^2 + b^2", "a squared plus b squared"]):
            return ExtractedConcept(
                concept_name="Pythagorean Theorem",
                subject="Mathematics",
                topic="Geometry & Trigonometry",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.MATH_EQUATION,
                continuity_key="math_pythagoras",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "Pythagorean Theorem",
                    "latex": "a^2 + b^2 = c^2",
                    "steps": [
                        {"id": "s1", "explanation": "Right-Angled Triangle Relation", "latex": "a^2 + b^2 = c^2"},
                        {"id": "s2", "explanation": "Solving for Hypotenuse c", "latex": "c = \\sqrt{a^2 + b^2}"}
                    ]
                }
            )

        # Quadratic Formula
        if "quadratic formula" in norm or ("b^2 - 4ac" in norm) or ("discriminant" in norm):
            return ExtractedConcept(
                concept_name="Quadratic Formula",
                subject="Mathematics",
                topic="Algebraic Solutions",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.MATH_EQUATION,
                continuity_key="math_quad_formula",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "The Quadratic Formula",
                    "latex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
                    "steps": [
                        {"id": "s1", "explanation": "Standard Quadratic Form", "latex": "ax^2 + bx + c = 0"},
                        {"id": "s2", "explanation": "Discriminant Evaluation", "latex": "\\Delta = b^2 - 4ac"},
                        {"id": "s3", "explanation": "Closed-Form Roots", "latex": "x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}"}
                    ]
                }
            )

        # Euler's Identity
        if "euler" in norm and ("pi" in norm or "identity" in norm):
            return ExtractedConcept(
                concept_name="Euler's Identity",
                subject="Mathematics",
                topic="Complex Analysis",
                intent=TeacherIntent.INTRODUCE,
                typology=VisualTypology.MATH_EQUATION,
                continuity_key="math_euler",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "Euler's Identity",
                    "latex": "e^{i\\pi} + 1 = 0",
                    "steps": [
                        {"id": "s1", "explanation": "Euler's Formula at x = π", "latex": "e^{i x} = \\cos(x) + i\\sin(x)"},
                        {"id": "s2", "explanation": "Fundamental Constant Unity", "latex": "e^{i\\pi} = -1 \\implies e^{i\\pi} + 1 = 0"}
                    ]
                }
            )

        return None

    def _derive_vertex_from_expr(self, expr: str) -> Tuple[Optional[float], Optional[float]]:
        """Extracts a, b, c from JS expression like '1.0*x*x + (-4.0)*x + (3.0)' to derive vertex."""
        m = re.search(r"(-?\d+(?:\.\d+)?)\*x\*x\s*\+\s*\((-?\d+(?:\.\d+)?)\)\*x\s*\+\s*\((-?\d+(?:\.\d+)?)\)", expr)
        if m:
            a, b, c = float(m.group(1)), float(m.group(2)), float(m.group(3))
            if a != 0:
                vx = -b / (2 * a)
                vy = a * vx * vx + b * vx + c
                return vx, vy
        return None, None

    def _derive_roots_from_expr(self, expr: str) -> List[float]:
        """Extracts roots from JS expression."""
        m = re.search(r"(-?\d+(?:\.\d+)?)\*x\*x\s*\+\s*\((-?\d+(?:\.\d+)?)\)\*x\s*\+\s*\((-?\d+(?:\.\d+)?)\)", expr)
        if m:
            a, b, c = float(m.group(1)), float(m.group(2)), float(m.group(3))
            disc = b * b - 4 * a * c
            if disc >= 0 and a != 0:
                r1 = (-b - math.sqrt(disc)) / (2 * a)
                r2 = (-b + math.sqrt(disc)) / (2 * a)
                return sorted(list(set([round(r1, 2), round(r2, 2)])))
        return []

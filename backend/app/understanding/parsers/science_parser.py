"""Dynamic Science Schematic & Biological Process Parser for EVARIS.

Extracts scientific concepts, reactions, and organelles from teacher speech:
- Photosynthesis: Light energy + CO2 + H2O -> Glucose + O2 (Chloroplast, Thylakoid, Stroma)
- Cellular Respiration: Glucose + O2 -> CO2 + H2O + ATP (Mitochondria)
- Cell Anatomy: Nucleus, Mitochondria, Membrane, Ribosomes
- Chemical Molecules: Water (H2O), Carbon Dioxide (CO2)
- Visual Continuity: In-place highlighting of active organelles and reaction stages
"""

import re
from typing import Optional, Dict, Any, List
from ..concept_models import ExtractedConcept, TeacherIntent
from ...visual.models import VisualTypology, VisualPayload


class ScienceParser:
    """Parses scientific explanations, biochemical pathways, and cell structures."""

    def parse(
        self,
        raw_text: str,
        active_visual: Optional[VisualPayload] = None
    ) -> Optional[ExtractedConcept]:
        clean = raw_text.lower().strip()

        # 1. Visual Continuity: Follow-up on active science diagram
        if active_visual and active_visual.typology == VisualTypology.SCIENCE_DIAGRAM:
            followup = self._parse_science_followup(clean, raw_text, active_visual)
            if followup:
                return followup

        # 2. Photosynthesis Reaction / Pathway
        photo = self._parse_photosynthesis(clean, raw_text)
        if photo:
            return photo

        # 3. Cellular Respiration
        resp = self._parse_cellular_respiration(clean, raw_text)
        if resp:
            return resp

        # 4. Cell Anatomy / Organelles
        cell = self._parse_cell_anatomy(clean, raw_text)
        if cell:
            return cell

        # 5. Molecular Structure (e.g. H2O Water Molecule)
        mol = self._parse_molecule(clean, raw_text)
        if mol:
            return mol

        return None

    def _parse_science_followup(
        self,
        clean: str,
        raw_text: str,
        active_visual: VisualPayload
    ) -> Optional[ExtractedConcept]:
        """Handles visual continuity updates to an active scientific schematic."""
        diag_type = active_visual.data.get("diagram_type", "cell_structure")
        elements = list(active_visual.data.get("elements", []))
        cont_key = active_visual.continuity_key
        title = active_visual.title

        # A. Thylakoid Granum / Light-dependent reactions
        if any(w in clean for w in ["thylakoid", "granum", "light reaction", "photon", "chlorophyll"]):
            updated_elements = []
            for elem in elements:
                el = dict(elem)
                if elem["id"] == "thylakoids":
                    el["highlight"] = True
                    el["role"] = "Photon Absorption & ATP Generation (Active Stage)"
                else:
                    el["highlight"] = False
                updated_elements.append(el)

            return ExtractedConcept(
                concept_name="Thylakoid Light Reactions",
                subject="Science",
                topic="Photosynthesis & Cell Energetics",
                intent=TeacherIntent.HIGHLIGHT,
                typology=VisualTypology.SCIENCE_DIAGRAM,
                continuity_key=cont_key,
                target_feature_id="thylakoids",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "Chloroplast: Thylakoid Stacks [Light Reactions Active]",
                    "diagram_type": diag_type,
                    "elements": updated_elements,
                    "active_element_id": "thylakoids"
                }
            )

        # B. Stroma / Calvin Cycle / Glucose Synthesis
        if any(w in clean for w in ["stroma", "calvin cycle", "glucose", "dark reaction", "carbon fixation"]):
            updated_elements = []
            for elem in elements:
                el = dict(elem)
                if elem["id"] == "stroma":
                    el["highlight"] = True
                    el["role"] = "Calvin Cycle: CO₂ Fixation into Glucose (Active Stage)"
                else:
                    el["highlight"] = False
                updated_elements.append(el)

            return ExtractedConcept(
                concept_name="Stroma Calvin Cycle",
                subject="Science",
                topic="Photosynthesis & Cell Energetics",
                intent=TeacherIntent.HIGHLIGHT,
                typology=VisualTypology.SCIENCE_DIAGRAM,
                continuity_key=cont_key,
                target_feature_id="stroma",
                confidence=0.98,
                source_sentence=raw_text,
                builder_data={
                    "title": "Chloroplast: Stroma [Calvin Cycle & Glucose Synthesis]",
                    "diagram_type": diag_type,
                    "elements": updated_elements,
                    "active_element_id": "stroma"
                }
            )

        # C. Nucleus or Mitochondria highlight in cell diagram
        if "nucleus" in clean:
            updated_elements = []
            for elem in elements:
                el = dict(elem)
                el["highlight"] = (elem["id"] == "nucleus")
                updated_elements.append(el)

            return ExtractedConcept(
                concept_name="Cell Nucleus Analysis",
                subject="Science",
                topic="Cell Biology",
                intent=TeacherIntent.HIGHLIGHT,
                typology=VisualTypology.SCIENCE_DIAGRAM,
                continuity_key=cont_key,
                target_feature_id="nucleus",
                confidence=0.97,
                source_sentence=raw_text,
                builder_data={
                    "title": f"{title} [Nucleus Highlighted]",
                    "diagram_type": diag_type,
                    "elements": updated_elements,
                    "active_element_id": "nucleus"
                }
            )

        return None

    def _parse_photosynthesis(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects and constructs photosynthesis diagram with reactants, energy, and products."""
        if not any(k in clean for k in ["photosynthesis", "chloroplast", "convert carbon dioxide", "light energy"]):
            return None

        # Build dynamic schematic showing reactants, organelle, and products
        elements = [
            {
                "id": "outer_membrane",
                "label": "Double Membrane Barrier",
                "role": "Selective transport envelope",
                "x": 400, "y": 250, "radius": 220,
                "highlight": False,
                "description": "Double-phospholipid membrane enclosing the stroma"
            },
            {
                "id": "stroma",
                "label": "Stroma (Calvin Cycle)",
                "role": "Fixes CO₂ into C₆H₁₂O₆ (Glucose)",
                "x": 300, "y": 200, "radius": 45,
                "highlight": False,
                "description": "Fluid-filled lumen containing enzymes for light-independent reactions"
            },
            {
                "id": "thylakoids",
                "label": "Thylakoid Granum",
                "role": "Photon capture: H₂O + Light → O₂ + ATP/NADPH",
                "x": 480, "y": 260, "radius": 60,
                "highlight": True,
                "description": "Stacked disc membranes holding chlorophyll pigments"
            },
            {
                "id": "reactants_in",
                "label": "Reactants: 6CO₂ + 6H₂O",
                "role": "Inflow: Carbon Dioxide and Water",
                "x": 160, "y": 140, "radius": 35,
                "highlight": True,
                "description": "Atmospheric CO₂ and root-absorbed water input"
            },
            {
                "id": "products_out",
                "label": "Products: C₆H₁₂O₆ + 6O₂",
                "role": "Outflow: Glucose and Oxygen",
                "x": 640, "y": 360, "radius": 35,
                "highlight": True,
                "description": "Synthesized carbohydrate energy and breathable oxygen gas"
            }
        ]

        return ExtractedConcept(
            concept_name="Photosynthesis Biochemical Pathway",
            subject="Science",
            topic="Biochemistry & Cell Physiology",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.SCIENCE_DIAGRAM,
            continuity_key="bio_photosynthesis_schematic",
            confidence=0.98,
            source_sentence=raw_text,
            builder_data={
                "title": "Photosynthesis: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂",
                "diagram_type": "photosynthesis_reaction",
                "elements": elements,
                "active_element_id": "thylakoids"
            }
        )

    def _parse_cellular_respiration(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects cellular respiration in mitochondria."""
        if not any(k in clean for k in ["respiration", "mitochondria", "atp production", "krebs cycle"]):
            return None

        elements = [
            {
                "id": "mitochondria_membrane",
                "label": "Outer & Inner Cristae",
                "role": "Proton gradient barrier",
                "x": 400, "y": 250, "radius": 200,
                "highlight": False,
                "description": "Folded cristae membranes hosting ATP synthase"
            },
            {
                "id": "matrix",
                "label": "Mitochondrial Matrix",
                "role": "Krebs Citric Acid Cycle",
                "x": 320, "y": 220, "radius": 50,
                "highlight": True,
                "description": "Location of pyruvate oxidation and electron carrier generation"
            },
            {
                "id": "atp_yield",
                "label": "ATP Generation: 36–38 ATP",
                "role": "High-energy cellular currency output",
                "x": 580, "y": 270, "radius": 40,
                "highlight": True,
                "description": "Oxidative phosphorylation yields cellular energy"
            }
        ]

        return ExtractedConcept(
            concept_name="Cellular Respiration Pathway",
            subject="Science",
            topic="Cell Energetics & Metabolism",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.SCIENCE_DIAGRAM,
            continuity_key="bio_respiration_schematic",
            confidence=0.97,
            source_sentence=raw_text,
            builder_data={
                "title": "Cellular Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP",
                "diagram_type": "cell_structure",
                "elements": elements,
                "active_element_id": "matrix"
            }
        )

    def _parse_cell_anatomy(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects general eukaryotic or plant cell structure."""
        if not any(k in clean for k in ["cell structure", "plant cell", "animal cell", "organelle", "cytoplasm"]):
            return None

        elements = [
            {
                "id": "cell_wall",
                "label": "Cell Wall / Membrane",
                "role": "Structural envelope and boundary",
                "x": 400, "y": 250, "radius": 220,
                "highlight": False,
                "description": "Outer structural boundary of the biological cell"
            },
            {
                "id": "nucleus",
                "label": "Nucleus & DNA",
                "role": "Genetic transcription center",
                "x": 320, "y": 200, "radius": 55,
                "highlight": True,
                "description": "Stores chromosome genomic library"
            },
            {
                "id": "mitochondria",
                "label": "Mitochondria",
                "role": "Cellular ATP power generator",
                "x": 520, "y": 300, "radius": 40,
                "highlight": False,
                "description": "Provides chemical metabolic energy"
            },
            {
                "id": "vacuole",
                "label": "Central Vacuole",
                "role": "Turgor pressure and water storage",
                "x": 460, "y": 180, "radius": 50,
                "highlight": False,
                "description": "Fluid-filled reservoir maintaining plant cell rigidity"
            }
        ]

        return ExtractedConcept(
            concept_name="Eukaryotic Cell Anatomy",
            subject="Science",
            topic="Cell Biology",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.SCIENCE_DIAGRAM,
            continuity_key="bio_cell_anatomy",
            confidence=0.96,
            source_sentence=raw_text,
            builder_data={
                "title": "Eukaryotic Cell Structure & Organelles",
                "diagram_type": "cell_structure",
                "elements": elements,
                "active_element_id": "nucleus"
            }
        )

    def _parse_molecule(self, clean: str, raw_text: str) -> Optional[ExtractedConcept]:
        """Detects molecular bonding e.g. Water molecule H2O."""
        if not any(k in clean for k in ["water molecule", "h2o", "chemical bond", "hydrogen bond"]):
            return None

        elements = [
            {
                "id": "oxygen_atom",
                "label": "Oxygen (O, δ-)",
                "role": "High electronegativity center",
                "x": 400, "y": 200, "radius": 55,
                "highlight": True,
                "description": "Partial negative charge drawing covalent electron density"
            },
            {
                "id": "hydrogen_1",
                "label": "Hydrogen 1 (H, δ+)",
                "role": "Covalent bond (104.5° angle)",
                "x": 300, "y": 320, "radius": 35,
                "highlight": False,
                "description": "Partial positive pole of polar water dipole"
            },
            {
                "id": "hydrogen_2",
                "label": "Hydrogen 2 (H, δ+)",
                "role": "Covalent bond (104.5° angle)",
                "x": 500, "y": 320, "radius": 35,
                "highlight": False,
                "description": "Second hydrogen completing bent molecular geometry"
            }
        ]

        return ExtractedConcept(
            concept_name="Polar Water Molecule (H₂O)",
            subject="Science",
            topic="Chemistry & Molecular Bonding",
            intent=TeacherIntent.INTRODUCE,
            typology=VisualTypology.SCIENCE_DIAGRAM,
            continuity_key="chem_water_molecule",
            confidence=0.97,
            source_sentence=raw_text,
            builder_data={
                "title": "Water Molecule Structure: Polar Covalent H₂O (104.5°)",
                "diagram_type": "molecule",
                "elements": elements,
                "active_element_id": "oxygen_atom"
            }
        )

"""Ambiguity Guard and Conversational Filter for EVARIS.

Rejects conversational chatter, classroom management instructions, audio checks,
and ambiguous or incomplete fragments to prevent fabricating false visuals.
"""

import re
from typing import Tuple, Optional


CONVERSATIONAL_PATTERNS = [
    r"^(hello|hi|hey|good morning|good afternoon|good evening)\b",
    r"\bcan you (hear|see) me\b",
    r"\bam i audible\b",
    r"\btest(ing)?\s*(one\s*two|mic|1\s*2)?\b",
    r"\bis the (screen|audio|mic|microphone|camera) working\b",
    r"\blet('?s)? wait for (everyone|the others|a minute)\b",
    r"\bsettle down (class|students|everyone)?\b",
    r"\bopen your (text)?books? (to page)?\b",
    r"\bturn to page\b",
    r"\bhow are you\b",
    r"\bthank you\b",
    r"\b(bye|goodbye)\b|see you (tomorrow|later)?",
    r"\bany questions (so far)?\b",
    r"\bokay guys\b",
    r"\balright so yeah\b",
    r"\bum+ (yeah|okay|right)\b",
    r"\bjust a (second|moment)\b",
    r"\bplease quiet down\b"
]


class AmbiguityGuard:
    """Evaluates whether spoken text contains genuine pedagogical concept content or should be suppressed."""

    def evaluate(self, text: str) -> Tuple[bool, Optional[str]]:
        """Returns:
            - is_suppressed: True if the speech is conversational, noise, or too ambiguous
            - reason: Diagnostic reason string
        """
        clean = text.strip().lower()

        # 1. Length check: very short fragments are noise
        if len(clean) < 6:
            return True, "Audio fragment too short or ambient noise"

        # 2. Pattern check for greetings, mic tests, classroom management
        for pat in CONVERSATIONAL_PATTERNS:
            if re.search(pat, clean):
                return True, "Conversational / Classroom Management Speech"

        # 3. Filler words only
        words = clean.split()
        fillers = {"um", "uh", "yeah", "okay", "alright", "so", "like", "well", "ah"}
        if all(w in fillers for w in words):
            return True, "Speech consists solely of hesitation filler words"

        return False, None

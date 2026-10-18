"""Ambiguity Guard and Conversational Filter for EVARIS.

Rejects conversational chatter, classroom management instructions, audio checks,
and ambiguous or incomplete fragments to prevent fabricating false visuals.
"""

import re
from typing import Tuple, Optional


CONVERSATIONAL_PATTERNS = [
    r"^(hello|hi|hey|good morning|good afternoon|good evening)",
    r"can you (hear|see) me",
    r"am i audible",
    r"test(ing)?\s*(one\s*two|mic|1\s*2)?",
    r"is the (screen|audio|mic|microphone|camera) working",
    r"let('?s)? wait for (everyone|the others|a minute)",
    r"settle down (class|students|everyone)?",
    r"open your (text)?books? (to page)?",
    r"turn to page",
    r"how are you",
    r"thank you",
    r"bye|goodbye|see you (tomorrow|later)?",
    r"any questions (so far)?",
    r"okay guys",
    r"alright so yeah",
    r"um+ (yeah|okay|right)",
    r"just a (second|moment)",
    r"please quiet down"
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

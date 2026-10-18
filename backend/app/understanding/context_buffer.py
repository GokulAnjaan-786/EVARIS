"""Context Buffer for EVARIS Lesson Understanding.

Accumulates recent transcript tokens and sentences within a sliding window.
Maintains topic history and detects salient entities without unnecessary overhead.
"""

from typing import List, Dict, Any, Optional
import time


class ContextBuffer:
    def __init__(self, max_sentences: int = 8, sliding_window_seconds: float = 45.0):
        self.max_sentences = max_sentences
        self.sliding_window_seconds = sliding_window_seconds
        self.sentences: List[Dict[str, Any]] = []
        self.current_topic: str = "Introductory Teaching"
        self.active_subject: str = "Mathematics"
        self.recognized_entities: List[str] = []

    def add_sentence(self, text: str, subject: Optional[str] = None, topic: Optional[str] = None):
        """Appends a new sentence to the rolling context buffer."""
        now = time.time()
        if subject:
            self.active_subject = subject
        if topic:
            self.current_topic = topic

        self.sentences.append({
            "text": text.strip(),
            "timestamp": now,
            "topic": self.current_topic,
            "subject": self.active_subject
        })

        # Prune old sentences exceeding window or count limit
        cutoff = now - self.sliding_window_seconds
        self.sentences = [s for s in self.sentences if s["timestamp"] >= cutoff][-self.max_sentences:]

    def get_aggregated_context(self) -> str:
        """Returns the accumulated recent context as a contiguous string."""
        return " ".join(s["text"] for s in self.sentences)

    def clear(self):
        """Resets the context buffer."""
        self.sentences.clear()
        self.recognized_entities.clear()

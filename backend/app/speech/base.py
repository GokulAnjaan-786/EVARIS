"""Abstract Base Transcriber interface for EVARIS."""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any


class BaseSpeechEngine(ABC):
    @abstractmethod
    async def stream_transcription(self, audio_stream: AsyncGenerator[bytes, None]) -> AsyncGenerator[Dict[str, Any], None]:
        """Streams audio chunks and yields timestamped transcription events."""
        pass

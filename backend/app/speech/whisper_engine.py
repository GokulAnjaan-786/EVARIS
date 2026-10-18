"""Local Speech Recognition Engine for EVARIS using Faster-Whisper.

Performs offline, real-time transcription on local hardware without paid APIs.
Processes 16kHz 16-bit mono PCM audio chunks streamed from the browser.
Safely detects and utilizes CUDA when runtime libraries are fully operational,
otherwise gracefully falls back to quantized CPU mode with truthful diagnostics.
"""

import time
import io
import wave
import logging
from typing import Tuple, Optional, List, Dict, Any
import numpy as np
import ctranslate2
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

_MODEL_INSTANCE: Optional[WhisperModel] = None
_ACTIVE_DEVICE: str = "cpu"
_ACTIVE_COMPUTE_TYPE: str = "int8"
_CUDA_ERROR: Optional[str] = None
_MODEL_NAME: str = "tiny.en"

# Common Faster-Whisper YouTube training artifact hallucinations on silence/low-energy slices
HALLUCINATED_PHRASES = {
    "thanks for watching",
    "thank you for watching",
    "thanks for listening",
    "thank you",
    "bye",
    "bye bye",
    "bye. bye",
    "you are just",
    "please subscribe",
    "subscribe to my channel",
    "see you next time",
    "subtitles by",
}


def _initialize_whisper_model() -> Tuple[WhisperModel, str, str, Optional[str]]:
    """Initializes WhisperModel with safe device detection.
    
    Attempts CUDA initialization first if CUDA devices are reported by CTranslate2.
    Validates CUDA inference with a lightweight probe. If cublas or CUDA runtime libraries
    are missing or raise any runtime exception, falls back safely to CPU int8.
    """
    cuda_error: Optional[str] = None
    cuda_available = False
    try:
        cuda_available = ctranslate2.get_cuda_device_count() > 0
    except Exception as e:
        cuda_error = f"CUDA check failed: {e}"

    if cuda_available:
        try:
            logger.info("CUDA device detected; attempting WhisperModel initialization on CUDA float16...")
            model = WhisperModel(
                _MODEL_NAME,
                device="cuda",
                compute_type="float16",
                num_workers=1
            )
            # Lightweight probe to confirm cuBLAS / CUDA libraries are accessible
            probe_audio = np.zeros(1600, dtype=np.float32)
            _ = list(model.transcribe(probe_audio, beam_size=1)[0])
            logger.info("WhisperModel successfully initialized and verified on CUDA (float16).")
            return model, "cuda", "float16", None
        except Exception as e:
            cuda_error = str(e)
            logger.warning(
                "CUDA initialization or probe failed (%s). Safely falling back to CPU int8 mode.",
                cuda_error
            )

    # Safe CPU fallback (int8 quantized mode for ultra-fast local CPU inference)
    logger.info("Initializing WhisperModel on CPU int8 (num_workers=1)...")
    model = WhisperModel(
        _MODEL_NAME,
        device="cpu",
        compute_type="int8",
        num_workers=1
    )
    return model, "cpu", "int8", cuda_error


def get_whisper_model() -> WhisperModel:
    """Returns the singleton WhisperModel instance (lazy loaded on first request)."""
    global _MODEL_INSTANCE, _ACTIVE_DEVICE, _ACTIVE_COMPUTE_TYPE, _CUDA_ERROR
    if _MODEL_INSTANCE is None:
        _MODEL_INSTANCE, _ACTIVE_DEVICE, _ACTIVE_COMPUTE_TYPE, _CUDA_ERROR = _initialize_whisper_model()
    return _MODEL_INSTANCE


class WhisperSpeechEngine:
    """Local Speech Recognition Engine interface for EVARIS."""

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.model = get_whisper_model()

    @property
    def model_name(self) -> str:
        return _MODEL_NAME

    @property
    def device(self) -> str:
        return _ACTIVE_DEVICE

    @property
    def compute_type(self) -> str:
        return _ACTIVE_COMPUTE_TYPE

    @property
    def cuda_error(self) -> Optional[str]:
        return _CUDA_ERROR

    def is_loaded(self) -> bool:
        """Returns True if the underlying model is loaded and ready."""
        return self.model is not None

    def get_diagnostics(self) -> Dict[str, Any]:
        """Returns truthful diagnostics about model, device, and compute type."""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "compute_type": self.compute_type,
            "is_loaded": self.is_loaded(),
            "sample_rate": self.sample_rate,
            "cuda_error": self.cuda_error,
        }

    def pcm_to_float32(self, pcm_bytes: bytes) -> np.ndarray:
        """Converts raw 16-bit signed integer PCM bytes to float32 numpy array normalized to [-1.0, 1.0]."""
        if not pcm_bytes:
            return np.array([], dtype=np.float32)
        int16_arr = np.frombuffer(pcm_bytes, dtype=np.int16)
        return int16_arr.astype(np.float32) / 32768.0

    def calculate_rms_energy(self, audio_array: np.ndarray) -> float:
        """Calculates Root-Mean-Square (RMS) acoustic energy of the audio segment."""
        if len(audio_array) == 0:
            return 0.0
        return float(np.sqrt(np.mean(np.square(audio_array))))

    def transcribe_audio_chunk(
        self,
        pcm_bytes: bytes,
        energy_threshold: float = 0.004
    ) -> Tuple[str, float, float, bool]:
        """Transcribes a raw PCM audio chunk.

        Args:
            pcm_bytes: Raw 16kHz 16-bit signed mono PCM bytes.
            energy_threshold: RMS threshold below which audio is classified as silence.

        Returns:
            Tuple of:
            - text: recognized transcript text
            - inference_ms: actual inference duration in milliseconds
            - energy: RMS energy level
            - is_speech: True if speech energy detected above silence threshold
        """
        if not pcm_bytes:
            return "", 0.0, 0.0, False

        audio_float = self.pcm_to_float32(pcm_bytes)
        energy = self.calculate_rms_energy(audio_float)

        # Truthful check: reject all-zero (dead line/muted) or below calibrated acoustic speech threshold
        max_amplitude = float(np.max(np.abs(audio_float))) if len(audio_float) > 0 else 0.0
        if max_amplitude == 0.0 or energy < energy_threshold:
            return "", 0.0, energy, False

        t0 = time.time()
        try:
            segments, info = self.model.transcribe(
                audio_float,
                beam_size=1,
                language="en",
                temperature=0.0,
                condition_on_previous_text=False,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300)
            )

            text_segments: List[str] = []
            for segment in segments:
                # Discard segments with high silence/non-speech probability
                if getattr(segment, "no_speech_prob", 0.0) > 0.65:
                    continue

                clean_text = segment.text.strip()
                normalized = clean_text.lower().rstrip(".,!? ")
                if normalized in HALLUCINATED_PHRASES:
                    continue

                if clean_text:
                    text_segments.append(clean_text)

            full_text = " ".join(text_segments).strip()
            inference_ms = round((time.time() - t0) * 1000, 2)
            is_valid_speech = bool(full_text)
            return full_text, inference_ms, energy, is_valid_speech

        except Exception as e:
            logger.error("Whisper transcription error: %s", e)
            inference_ms = round((time.time() - t0) * 1000, 2)
            return "", inference_ms, energy, False

    def transcribe_pcm(
        self,
        pcm_bytes: bytes,
        energy_threshold: float = 0.004
    ) -> Tuple[str, float]:
        """Convenience wrapper for raw PCM transcription.
        
        Returns:
            Tuple of (transcript_text, confidence_score) where confidence is 0.0 for
            silence or failure, and 1.0 for detected speech.
        """
        text, infer_ms, energy, is_speech = self.transcribe_audio_chunk(pcm_bytes, energy_threshold)
        if not is_speech or not text:
            return "", 0.0
        return text, 1.0


_SPEECH_ENGINE_SINGLETON: Optional[WhisperSpeechEngine] = None


def get_speech_engine(sample_rate: int = 16000) -> WhisperSpeechEngine:
    """Returns the singleton WhisperSpeechEngine instance."""
    global _SPEECH_ENGINE_SINGLETON
    if _SPEECH_ENGINE_SINGLETON is None:
        _SPEECH_ENGINE_SINGLETON = WhisperSpeechEngine(sample_rate=sample_rate)
    return _SPEECH_ENGINE_SINGLETON


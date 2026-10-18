"""EVARIS Backend Configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "EVARIS"
    PROJECT_FULL_NAME: str = "Every Victory Arrives After Rising In Silence"
    BRAND_TAGLINE: str = "Intelligence That Makes Learning Visible."
    VERSION: str = "0.1.0-phase1"
    DEBUG: bool = True
    
    # Server Binding
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Real-Time & Audio Simulation Defaults
    STREAM_CHUNK_INTERVAL_MS: int = 400
    DEBOUNCE_VISUAL_WINDOW_MS: int = 1200

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()

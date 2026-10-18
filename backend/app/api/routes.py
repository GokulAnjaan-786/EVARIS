"""REST API endpoints for EVARIS."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from ..core.config import settings
from ..speech.mock_streamer import SAMPLE_LESSONS

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "full_name": settings.PROJECT_FULL_NAME,
        "tagline": settings.BRAND_TAGLINE,
        "version": settings.VERSION,
        "mode": "Phase 1 Local Prototype"
    }


@router.get("/lessons")
async def list_sample_lessons() -> List[Dict[str, Any]]:
    """Returns metadata for all available multi-subject demonstration lessons."""
    results = []
    for lesson_id, lesson in SAMPLE_LESSONS.items():
        results.append({
            "id": lesson["id"],
            "title": lesson["title"],
            "subject": lesson["subject"],
            "grade_level": lesson["grade_level"],
            "duration_seconds": lesson["duration_seconds"],
            "description": lesson["description"],
            "total_steps": len(lesson["steps"])
        })
    return results


@router.get("/lessons/{lesson_id}")
async def get_sample_lesson(lesson_id: str) -> Dict[str, Any]:
    """Returns details for a specific sample lesson."""
    if lesson_id not in SAMPLE_LESSONS:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return SAMPLE_LESSONS[lesson_id]

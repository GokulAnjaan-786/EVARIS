"""EVARIS Main Application Entrypoint.

Universal Real-Time Visual Teaching Engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.routes import router as rest_router
from .api.ws_endpoints import router as ws_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="EVARIS — AI-Powered Real-Time Visual Teaching Engine. Intelligence That Makes Learning Visible.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(rest_router, prefix="/api", tags=["REST API"])
app.include_router(ws_router, tags=["WebSocket Real-Time"])


@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "full_name": settings.PROJECT_FULL_NAME,
        "tagline": settings.BRAND_TAGLINE,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

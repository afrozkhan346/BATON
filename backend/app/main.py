from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import projects, sources, claims, gaps, review, report


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    init_db()
    yield


app = FastAPI(
    title="BATON API",
    description="Evidence-First Knowledge Handover Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected",
        "llm_provider": settings.LLM_PROVIDER,
    }


# Include Routers
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(sources.router, prefix="/api/v1/projects", tags=["Sources"])
app.include_router(claims.router, prefix="/api/v1", tags=["Claims"])
app.include_router(gaps.router, prefix="/api/v1", tags=["Gaps"])
app.include_router(review.router, prefix="/api/v1", tags=["Review"])
app.include_router(report.router, prefix="/api/v1", tags=["Report"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

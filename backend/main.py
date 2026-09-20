"""
Quantum-Enhanced Adaptive Urban Traffic Optimization - Main FastAPI Server
Phase 1: Project Foundation
"""
import os
import sys
from contextlib import asynccontextmanager

# Add parent directory to sys.path so modules resolve cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.init_db import init_database
from backend.api.health import check_health

try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from backend.api.router import api_router

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup: ensure SQLite database is initialized
        init_database()
        yield
        # Shutdown logic if needed

    app = FastAPI(
        title="Quantum-Enhanced Adaptive Urban Traffic Optimization API",
        description="Smart City + Quantum Computing traffic optimization platform backend.",
        version="1.0.0-phase1",
        lifespan=lifespan
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routes under /api
    app.include_router(api_router, prefix="/api")

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": str(exc),
                "path": str(request.url.path)
            }
        )

    @app.get("/")
    def root():
        return {
            "name": "Quantum-Enhanced Adaptive Urban Traffic Optimization",
            "documentation": "/docs",
            "health": "/api/health"
        }

except ImportError:
    # If fastapi is not installed in the current environment, provide fallback app
    app = None

if __name__ == "__main__":
    init_database()
    print("Database verified. FastAPI server ready to launch with uvicorn backend.main:app --port 8000")

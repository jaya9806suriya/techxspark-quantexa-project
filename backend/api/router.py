"""
Central API Router for Quantum-Enhanced Adaptive Urban Traffic Optimization.
"""
try:
    from fastapi import APIRouter
    from backend.api.health import router as health_router
    from backend.api.traffic import router as traffic_router
    from backend.api.quantum import router as quantum_router
    from backend.api.emergency import emergency_router, incidents_router, simulation_router, analytics_router

    api_router = APIRouter()
    api_router.include_router(health_router)
    api_router.include_router(traffic_router)
    api_router.include_router(quantum_router)
    api_router.include_router(emergency_router)
    api_router.include_router(incidents_router)
    api_router.include_router(simulation_router)
    api_router.include_router(analytics_router)
except ImportError:
    api_router = None

__all__ = ["api_router"]

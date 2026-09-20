"""
Quantum optimization endpoints.
"""
from typing import Dict, Any
from backend.services.quantum_service import QuantumService

try:
    from fastapi import APIRouter, Body
    router = APIRouter(prefix="/quantum", tags=["Quantum"])

    @router.get("/status")
    def get_status():
        return QuantumService.get_status()

    @router.get("/history")
    def get_history():
        return QuantumService.get_history()

    @router.post("/optimize")
    def trigger_optimize(payload: Dict[str, Any] = Body(...)):
        return QuantumService.run_optimization(payload)
except ImportError:
    router = None

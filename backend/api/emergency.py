"""
Emergency corridor, incidents, simulation, and analytics endpoints.
"""
from typing import Dict, Any
from backend.services.emergency_service import EmergencyService
from backend.simulation.engine import simulation_engine
from backend.simulation.scenario import get_scenarios
from backend.analytics.metrics_collector import MetricsCollector

try:
    from fastapi import APIRouter, Body
    emergency_router = APIRouter(prefix="/emergency", tags=["Emergency"])
    incidents_router = APIRouter(prefix="/incidents", tags=["Incidents"])
    simulation_router = APIRouter(prefix="/simulation", tags=["Simulation"])
    analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

    @emergency_router.get("/corridors")
    def get_corridors():
        return EmergencyService.get_corridors()

    @emergency_router.post("/toggle")
    def toggle_corridor(payload: Dict[str, Any] = Body(...)):
        return EmergencyService.toggle_corridor(payload.get("corridor_id"), payload.get("active", True))

    @incidents_router.get("")
    def get_incidents():
        return EmergencyService.get_incidents()

    @simulation_router.get("/state")
    def get_simulation_state():
        return simulation_engine.step()

    @simulation_router.get("/scenarios")
    def get_sim_scenarios():
        return get_scenarios()

    @simulation_router.post("/control")
    def control_simulation(payload: Dict[str, Any] = Body(...)):
        return simulation_engine.set_control(payload.get("action", "play"), payload.get("speed", 1.0))

    @analytics_router.get("/summary")
    def get_analytics_summary():
        return {
            "kpi": MetricsCollector.get_summary_kpi(),
            "time_series": MetricsCollector.get_time_series_data()
        }
except ImportError:
    emergency_router = incidents_router = simulation_router = analytics_router = None

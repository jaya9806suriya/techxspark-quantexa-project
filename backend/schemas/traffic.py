"""
Pydantic Schemas for Request and Response validation.
"""
try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    Field = lambda *args, **kwargs: None
from typing import List, Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: Dict[str, Any]
    quantum_backend: Dict[str, Any]
    timestamp: float

class TrafficNodeSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    node_type: str
    signal_state: str
    cycle_time_sec: int
    qubit_assigned: int
    current_load: float

class TrafficEdgeSchema(BaseModel):
    id: str
    source_id: str
    target_id: str
    street_name: str
    distance_km: float
    speed_limit_kmh: int
    capacity_vph: int
    current_flow_vph: int
    density_percentage: float
    congestion_level: str
    quantum_weight: float

class OptimizationRequest(BaseModel):
    algorithm: str = "QAOA" # "QAOA", "VQE", "CLASSICAL_DIJKSTRA"
    backend: str = "aer_simulator"
    p_steps: int = 2
    shots: int = 1024
    target_zone: Optional[str] = "DOWNTOWN_METRO"
    penalty_weight: float = 2.5

class OptimizationResultSchema(BaseModel):
    run_id: str
    algorithm: str
    backend_name: str
    qubits_used: int
    circuit_depth: int
    execution_time_ms: float
    cost_value: float
    congestion_reduction_pct: float
    co2_saved_kg: float
    status: str
    converged: bool
    optimal_phases: Dict[str, str]

class EmergencyCorridorSchema(BaseModel):
    id: str
    name: str
    source_node_id: str
    target_node_id: str
    active: bool
    priority_level: str
    eta_minutes: float
    green_wave_active: bool
    nodes_sequence: List[str]

class IncidentSchema(BaseModel):
    id: str
    title: str
    incident_type: str
    severity: str
    latitude: float
    longitude: float
    affected_edge_id: Optional[str]
    status: str
    reported_at: str

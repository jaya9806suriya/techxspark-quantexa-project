"""
SQLAlchemy models for Quantum Execution, Incidents, Emergency Corridors, and History.
"""
try:
    from sqlalchemy import Column, String, Float, Integer
    from backend.database.connection import Base
except ImportError:
    class Base:
        pass
    Column = String = Float = Integer = lambda *args, **kwargs: None

class OptimizationRunModel(Base):
    __tablename__ = "optimization_runs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    backend_name = Column(String, nullable=False)
    qubits_used = Column(Integer, default=0)
    circuit_depth = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    cost_value = Column(Float, default=0.0)
    congestion_reduction_pct = Column(Float, default=0.0)
    co2_saved_kg = Column(Float, default=0.0)
    status = Column(String, default="COMPLETED")

class EmergencyCorridorModel(Base):
    __tablename__ = "emergency_corridors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_node_id = Column(String, nullable=False)
    target_node_id = Column(String, nullable=False)
    active = Column(Integer, default=0)
    priority_level = Column(String, default="AMBULANCE")
    eta_minutes = Column(Float, default=5.0)
    green_wave_active = Column(Integer, default=0)
    nodes_sequence = Column(String, default="[]")

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    incident_type = Column(String, default="ACCIDENT")
    severity = Column(String, default="MODERATE")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    affected_edge_id = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    reported_at = Column(String, nullable=False)

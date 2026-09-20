"""
SQLAlchemy and Schema models for Traffic Nodes and Edges.
"""
try:
    from sqlalchemy import Column, String, Float, Integer, ForeignKey
    from sqlalchemy.orm import relationship
    from backend.database.connection import Base
except ImportError:
    class Base:
        pass
    Column = String = Float = Integer = ForeignKey = relationship = lambda *args, **kwargs: None

class TrafficNodeModel(Base):
    __tablename__ = "traffic_nodes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    node_type = Column(String, default="intersection")
    signal_state = Column(String, default="ADAPTIVE")
    cycle_time_sec = Column(Integer, default=90)
    qubit_assigned = Column(Integer, default=0)
    current_load = Column(Float, default=0.0)

class TrafficEdgeModel(Base):
    __tablename__ = "traffic_edges"

    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("traffic_nodes.id"), nullable=False)
    target_id = Column(String, ForeignKey("traffic_nodes.id"), nullable=False)
    street_name = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    speed_limit_kmh = Column(Integer, nullable=False)
    capacity_vph = Column(Integer, nullable=False)
    current_flow_vph = Column(Integer, default=0)
    density_percentage = Column(Float, default=0.0)
    congestion_level = Column(String, default="LOW")
    quantum_weight = Column(Float, default=1.0)

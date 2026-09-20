"""
Simulation package initialization.
Exports all core components for the Real-Time Traffic Simulation Engine.
"""
from backend.app.simulation.vehicle import TrafficVehicle
from backend.app.simulation.road import TrafficRoad
from backend.app.simulation.intersection import TrafficIntersection
from backend.app.simulation.state import SimulationState
from backend.app.simulation.simulator import TrafficSimulator, traffic_simulator

__all__ = [
    "TrafficVehicle",
    "TrafficRoad",
    "TrafficIntersection",
    "SimulationState",
    "TrafficSimulator",
    "traffic_simulator",
]

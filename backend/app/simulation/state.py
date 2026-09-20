"""
SimulationState snapshot model for capturing the global traffic network state,
KPI metrics, intersection status, road conditions, and controls.
"""
from typing import Dict, Any, List, Optional

class SimulationState:
    def __init__(
        self,
        sim_time: float = 0.0,
        is_running: bool = False,
        speed_multiplier: float = 1.0,
        traffic_intensity: str = "MEDIUM",
        custom_rate: float = 60.0,
        step_count: int = 0,
    ):
        self.sim_time = sim_time
        self.is_running = is_running
        self.speed_multiplier = speed_multiplier
        self.traffic_intensity = traffic_intensity
        self.custom_rate = custom_rate
        self.step_count = step_count
        self.intersections: List[Dict[str, Any]] = []
        self.roads: List[Dict[str, Any]] = []
        self.kpis: Dict[str, Any] = {
            "average_waiting_time": 42.5,  # sec
            "total_queue_length": 219,     # total queued vehicles
            "traffic_throughput": 284.0,   # vehicles / minute
            "average_speed": 36.8,         # km/h
            "fuel_consumption": 142.6,     # liters
            "co2_estimate": 329.4,         # kg CO2
        }
        self.history: List[Dict[str, Any]] = []

    def update_kpis(
        self,
        avg_wait: float,
        total_queue: int,
        throughput: float,
        avg_speed: float,
        fuel: float,
        co2: float,
    ):
        self.kpis = {
            "average_waiting_time": round(avg_wait, 1),
            "total_queue_length": int(total_queue),
            "traffic_throughput": round(throughput, 1),
            "average_speed": round(avg_speed, 1),
            "fuel_consumption": round(fuel, 2),
            "co2_estimate": round(co2, 2),
        }

        # Keep rolling history of last 20 snapshots for time series graphs
        entry = {
            "timestamp": round(self.sim_time, 1),
            "waiting_time": self.kpis["average_waiting_time"],
            "queue_length": self.kpis["total_queue_length"],
            "throughput": self.kpis["traffic_throughput"],
            "speed": self.kpis["average_speed"],
            "co2": self.kpis["co2_estimate"],
        }
        self.history.append(entry)
        if len(self.history) > 30:
            self.history.pop(0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sim_time": round(self.sim_time, 1),
            "is_running": self.is_running,
            "speed_multiplier": self.speed_multiplier,
            "traffic_intensity": self.traffic_intensity,
            "custom_rate": self.custom_rate,
            "step_count": self.step_count,
            "kpis": self.kpis,
            "intersections": self.intersections,
            "roads": self.roads,
            "history": self.history,
        }

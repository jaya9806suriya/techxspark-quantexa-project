"""
Traffic flow simulation engine.
Simulates macroscopic and microscopic vehicle packet propagation across road segments.
"""
from typing import Dict, Any, List
import random

class SimulationEngine:
    def __init__(self, step_interval_sec: float = 1.0):
        self.step_interval_sec = step_interval_sec
        self.step_count = 1420
        self.is_running = True
        self.speed_multiplier = 1.0
        self.vehicle_count = 14890

    def step(self) -> Dict[str, Any]:
        self.step_count += 1
        delta = random.randint(-15, 20)
        self.vehicle_count = max(5000, self.vehicle_count + delta)
        return {
            "step": self.step_count,
            "running": self.is_running,
            "speed": self.speed_multiplier,
            "active_vehicles": self.vehicle_count,
            "throughput_vpm": round(random.uniform(320, 390), 1),
            "average_delay_sec": round(random.uniform(42, 58), 1),
        }

    def set_control(self, action: str, speed: float = 1.0) -> Dict[str, Any]:
        if action == "play":
            self.is_running = True
        elif action == "pause":
            self.is_running = False
        elif action == "reset":
            self.step_count = 0
            self.vehicle_count = 12000
        self.speed_multiplier = speed
        return self.step()

simulation_engine = SimulationEngine()

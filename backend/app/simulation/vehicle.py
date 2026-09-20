"""
TrafficVehicle model for microscopic vehicle tracking in the simulation network.
Tracks speed, position, waiting time in queue, fuel consumption, and CO2 emissions.
"""
from typing import Optional, List

class TrafficVehicle:
    def __init__(
        self,
        vehicle_id: str,
        origin: str,
        destination: str,
        current_road_id: Optional[str] = None,
        current_intersection_id: Optional[str] = None,
        target_speed_kmh: float = 45.0,
    ):
        self.id = vehicle_id
        self.origin = origin
        self.destination = destination
        self.current_road_id = current_road_id
        self.current_intersection_id = current_intersection_id
        self.target_speed_kmh = target_speed_kmh
        self.speed_kmh = target_speed_kmh
        self.distance_traveled_km = 0.0
        self.waiting_time_sec = 0.0
        self.travel_time_sec = 0.0
        self.state = "TRANSIT"  # TRANSIT, QUEUED, ARRIVED
        self.fuel_liters = 0.0  # liters consumed
        self.co2_kg = 0.0       # kg CO2 emitted

    def step(self, delta_sec: float, road_speed_limit: float = 45.0):
        self.travel_time_sec += delta_sec
        if self.state == "QUEUED":
            self.speed_kmh = 0.0
            self.waiting_time_sec += delta_sec
            # Idling fuel consumption: ~0.00035 L/sec (~1.25 L/hour idle for typical urban engine)
            idle_fuel = delta_sec * 0.00035
            self.fuel_liters += idle_fuel
            # Gasoline emission: ~2.31 kg CO2 per liter
            self.co2_kg += idle_fuel * 2.31
        else:
            # Transit state
            self.speed_kmh = max(10.0, min(self.speed_kmh, road_speed_limit))
            # Distance moved in delta_sec: (speed km/h) * (delta_sec / 3600)
            dist_km = (self.speed_kmh / 3600.0) * delta_sec
            self.distance_traveled_km += dist_km
            # Driving fuel consumption: ~0.075 L/km at cruising speed
            drive_fuel = dist_km * 0.075
            self.fuel_liters += drive_fuel
            self.co2_kg += drive_fuel * 2.31

    def queue_at(self, intersection_id: str):
        self.state = "QUEUED"
        self.current_intersection_id = intersection_id
        self.speed_kmh = 0.0

    def release_from_queue(self, next_road_id: Optional[str] = None):
        self.state = "TRANSIT"
        self.current_road_id = next_road_id
        self.speed_kmh = self.target_speed_kmh * 0.7  # Accelerating from stop

    def mark_arrived(self):
        self.state = "ARRIVED"
        self.speed_kmh = 0.0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "origin": self.origin,
            "destination": self.destination,
            "current_road_id": self.current_road_id,
            "current_intersection_id": self.current_intersection_id,
            "speed_kmh": round(self.speed_kmh, 1),
            "distance_traveled_km": round(self.distance_traveled_km, 3),
            "waiting_time_sec": round(self.waiting_time_sec, 1),
            "travel_time_sec": round(self.travel_time_sec, 1),
            "state": self.state,
            "fuel_liters": round(self.fuel_liters, 4),
            "co2_kg": round(self.co2_kg, 4),
        }

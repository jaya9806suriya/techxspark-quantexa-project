"""
TrafficRoad model representing physical directed roadway segments between intersections.
Manages active transit vehicles, flow rate, speed restrictions, and congestion calculation.
"""
from typing import List, Dict, Any
from backend.app.simulation.vehicle import TrafficVehicle

class TrafficRoad:
    def __init__(
        self,
        road_id: str,
        source_id: str,
        target_id: str,
        street_name: str,
        distance_km: float,
        speed_limit_kmh: float,
        road_capacity: float,  # capacity in vehicles/minute
        current_flow: float = 0.0,
        congestion_level: str = "LOW",
    ):
        self.id = road_id
        self.source_id = source_id
        self.target_id = target_id
        self.street_name = street_name
        self.distance_km = distance_km
        self.speed_limit_kmh = speed_limit_kmh
        self.road_capacity = road_capacity
        self.current_flow = current_flow
        self.congestion_level = congestion_level
        self.vehicles: List[TrafficVehicle] = []
        self.average_speed = speed_limit_kmh

    def add_vehicle(self, vehicle: TrafficVehicle):
        vehicle.current_road_id = self.id
        vehicle.target_speed_kmh = self.speed_limit_kmh
        self.vehicles.append(vehicle)
        self.update_metrics()

    def remove_vehicle(self, vehicle_id: str):
        self.vehicles = [v for v in self.vehicles if v.id != vehicle_id]
        self.update_metrics()

    def step(self, delta_sec: float) -> List[TrafficVehicle]:
        """
        Step all vehicles traveling along this road segment.
        Returns list of vehicles that reached the destination intersection at the end of the segment.
        """
        arrived_at_intersection: List[TrafficVehicle] = []
        remaining_vehicles: List[TrafficVehicle] = []

        # Effective speed on road drops as density increases
        density_ratio = len(self.vehicles) / max(10, self.road_capacity * 0.5)
        speed_factor = max(0.2, 1.0 - min(0.8, density_ratio * 0.5))
        effective_speed = self.speed_limit_kmh * speed_factor

        for v in self.vehicles:
            v.speed_kmh = effective_speed
            v.step(delta_sec, road_speed_limit=effective_speed)
            # If vehicle traversed distance of road
            if v.distance_traveled_km >= self.distance_km:
                arrived_at_intersection.append(v)
            else:
                remaining_vehicles.append(v)

        self.vehicles = remaining_vehicles
        self.update_metrics()
        return arrived_at_intersection

    def update_metrics(self):
        veh_count = len(self.vehicles)
        # Flow rate estimation (vehicles / minute)
        self.current_flow = round(veh_count * (self.average_speed / max(0.1, self.distance_km)) / 60.0 * 10.0, 1)

        capacity_utilization = veh_count / max(15.0, self.road_capacity * 0.4)
        if capacity_utilization > 0.85:
            self.congestion_level = "CRITICAL"
            self.average_speed = round(self.speed_limit_kmh * 0.35, 1)
        elif capacity_utilization > 0.60:
            self.congestion_level = "HIGH"
            self.average_speed = round(self.speed_limit_kmh * 0.55, 1)
        elif capacity_utilization > 0.35:
            self.congestion_level = "MEDIUM"
            self.average_speed = round(self.speed_limit_kmh * 0.75, 1)
        else:
            self.congestion_level = "LOW"
            self.average_speed = self.speed_limit_kmh

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "street_name": self.street_name,
            "distance_km": self.distance_km,
            "speed_limit_kmh": self.speed_limit_kmh,
            "road_capacity": self.road_capacity,
            "current_flow": self.current_flow,
            "congestion_level": self.congestion_level,
            "vehicle_count": len(self.vehicles),
            "average_speed": round(self.average_speed, 1),
        }

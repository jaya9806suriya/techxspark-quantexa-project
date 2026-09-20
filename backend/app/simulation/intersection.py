"""
TrafficIntersection model representing intelligent signalized junctions (I1 to I6).
Manages multi-phase signal cycles (Green, Yellow, Red), approach queue accumulation,
queue discharge on green signals, waiting time calculation, and congestion state.
"""
from typing import List, Dict, Any, Optional
from backend.app.simulation.vehicle import TrafficVehicle
from backend.app.signals.adaptive_controller import adaptive_controller

class TrafficIntersection:
    def __init__(
        self,
        intersection_id: str,
        name: str,
        latitude: float,
        longitude: float,
        vehicle_density: str,
        initial_queue_length: int,
        road_capacity: int,  # vehicles / min
        average_speed: float,
        initial_phase: str,
        green_time: int,
        yellow_time: int,
        red_time: int,
        pedestrian_count: int,
        congestion_level: str,
        all_red_time: int = 2,
        control_mode: str = "ADAPTIVE",
    ):
        self.id = intersection_id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.vehicle_density = vehicle_density
        self.road_capacity = road_capacity
        self.average_speed = average_speed
        self.current_signal_phase = initial_phase
        self.green_time = green_time
        self.yellow_time = yellow_time
        self.red_time = red_time
        self.all_red_time = all_red_time
        self.control_mode = control_mode  # "ADAPTIVE", "FIXED", or "QUANTUM_OPTIMIZED"
        self.fixed_green_time = 35
        self.quantum_green_time = green_time
        self.green_time_ns = green_time
        self.green_time_ew = green_time
        self.cycle_time = green_time + yellow_time + red_time + all_red_time
        self.pedestrian_count = pedestrian_count
        self.congestion_level = congestion_level

        # Internal phase state
        self.phase_elapsed_sec = 0.0
        # Determine corridor direction from initial phase
        self.is_ns_corridor = "East-West" not in initial_phase
        self.last_served_corridor = "NS" if self.is_ns_corridor else "EW"

        if "GREEN" in initial_phase:
            self.phase_state = "GREEN"
        elif "YELLOW" in initial_phase:
            self.phase_state = "YELLOW"
        else:
            self.phase_state = "ALL RED" if "ALL RED" in initial_phase else "RED"

        # Adaptive recommendation snapshot
        self.adaptive_recommendation: Dict[str, Any] = {}

        # Vehicle queue tracking
        self.queue: List[TrafficVehicle] = []
        for i in range(initial_queue_length):
            v = TrafficVehicle(
                vehicle_id=f"init_{self.id}_{i}",
                origin=self.id,
                destination="EXIT",
                current_intersection_id=self.id,
            )
            v.queue_at(self.id)
            v.waiting_time_sec = float((initial_queue_length - i) * 3)  # staggered initial wait
            self.queue.append(v)

        self.throughput_vpm = 0.0
        self.vehicles_processed_total = 0
        self.waiting_time_avg = 0.0

    @property
    def queue_length(self) -> int:
        return len(self.queue)

    @queue_length.setter
    def queue_length(self, value: int):
        target_size = max(0, int(value))
        current = len(self.queue)
        if target_size < current:
            self.queue = self.queue[:target_size]
        elif target_size > current:
            for i in range(current, target_size):
                v = TrafficVehicle(
                    vehicle_id=f"veh_{self.id}_{i}",
                    origin=self.id,
                    destination="EXIT",
                    current_intersection_id=self.id,
                )
                v.queue_at(self.id)
                self.queue.append(v)

    def enqueue_vehicle(self, vehicle: TrafficVehicle):
        vehicle.queue_at(self.id)
        self.queue.append(vehicle)

    def update_adaptive_timing(self, neighbor_data: Optional[List[Dict[str, Any]]] = None):
        """
        Computes the latest adaptive signal recommendation using the rule-based controller.
        """
        inter_dict = {
            "queue_length": self.queue_length,
            "vehicle_density": self.vehicle_density,
            "road_capacity": self.road_capacity,
            "average_speed": self.average_speed,
            "pedestrian_count": self.pedestrian_count,
            "current_signal_phase": self.current_signal_phase,
        }
        rec = adaptive_controller.calculate_green_time(
            intersection_data=inter_dict,
            neighbor_data=neighbor_data,
            direction="NS" if self.is_ns_corridor else "EW",
        )
        self.adaptive_recommendation = rec

        if self.control_mode == "QUANTUM_OPTIMIZED":
            # Quantum-optimized signal allocation
            self.green_time = getattr(self, "quantum_green_time", self.green_time)
            self.cycle_time = self.green_time_ns + self.green_time_ew + (self.yellow_time * 2) + (self.all_red_time * 2)
        elif self.control_mode == "ADAPTIVE":
            self.green_time = rec["recommended_green_sec"]
            self.green_time_ns = self.green_time
            self.green_time_ew = self.green_time
            self.yellow_time = rec.get("yellow_time_sec", 4)
            self.all_red_time = rec.get("all_red_time_sec", 2)
            self.cycle_time = (self.green_time * 2) + (self.yellow_time * 2) + (self.all_red_time * 2)
        else:
            self.green_time = self.fixed_green_time
            self.green_time_ns = self.fixed_green_time
            self.green_time_ew = self.fixed_green_time
            self.yellow_time = 4
            self.all_red_time = 2
            self.cycle_time = (self.green_time * 2) + (self.yellow_time * 2) + (self.all_red_time * 2)

    def step_signal(self, delta_sec: float, neighbor_data: Optional[List[Dict[str, Any]]] = None):
        """
        Advances the 5-phase physical signal controller:
        1. North-South GREEN
        2. North-South YELLOW
        3. ALL RED (Clearance before EW)
        4. East-West GREEN
        5. East-West YELLOW
        6. ALL RED (Clearance before NS)
        Guarantees zero simultaneous orthogonal green (Conflict prevention).
        """
        # In Emergency Preemption mode, lock signal in continuous green for emergency corridor
        if self.control_mode == "EMERGENCY_PREEMPTION":
            self.phase_elapsed_sec = 0.0
            self.phase_state = "GREEN"
            return

        self.phase_elapsed_sec += delta_sec
        self.update_adaptive_timing(neighbor_data)

        # In Quantum mode, support distinct NS and EW green durations
        ns_green = self.green_time_ns if self.control_mode == "QUANTUM_OPTIMIZED" else self.green_time
        ew_green = self.green_time_ew if self.control_mode == "QUANTUM_OPTIMIZED" else self.green_time

        if self.current_signal_phase == "North-South GREEN":
            if self.phase_elapsed_sec >= ns_green:
                self.phase_state = "YELLOW"
                self.current_signal_phase = "North-South YELLOW"
                self.phase_elapsed_sec = 0.0

        elif self.current_signal_phase == "North-South YELLOW":
            if self.phase_elapsed_sec >= self.yellow_time:
                self.phase_state = "ALL RED"
                self.current_signal_phase = "ALL RED"
                self.last_served_corridor = "NS"
                self.phase_elapsed_sec = 0.0

        elif self.current_signal_phase == "East-West GREEN":
            if self.phase_elapsed_sec >= ew_green:
                self.phase_state = "YELLOW"
                self.current_signal_phase = "East-West YELLOW"
                self.phase_elapsed_sec = 0.0

        elif self.current_signal_phase == "East-West YELLOW":
            if self.phase_elapsed_sec >= self.yellow_time:
                self.phase_state = "ALL RED"
                self.current_signal_phase = "ALL RED"
                self.last_served_corridor = "EW"
                self.phase_elapsed_sec = 0.0

        elif self.current_signal_phase == "ALL RED" or self.phase_state == "ALL RED" or self.phase_state == "RED":
            if self.phase_elapsed_sec >= self.all_red_time:
                if self.last_served_corridor == "NS":
                    # Transition to East-West GREEN
                    self.is_ns_corridor = False
                    self.phase_state = "GREEN"
                    self.current_signal_phase = "East-West GREEN"
                    self.phase_elapsed_sec = 0.0
                    self.update_adaptive_timing(neighbor_data)
                else:
                    # Transition to North-South GREEN
                    self.is_ns_corridor = True
                    self.phase_state = "GREEN"
                    self.current_signal_phase = "North-South GREEN"
                    self.phase_elapsed_sec = 0.0
                    self.update_adaptive_timing(neighbor_data)

    def get_remaining_time(self) -> float:
        if self.phase_state == "GREEN":
            duration = float(self.green_time_ns if self.is_ns_corridor else self.green_time_ew) if self.control_mode == "QUANTUM_OPTIMIZED" else float(self.green_time)
        elif self.phase_state == "YELLOW":
            duration = float(self.yellow_time)
        else:
            duration = float(self.all_red_time)
        return max(0.0, round(duration - self.phase_elapsed_sec, 1))

    def get_phase_total_duration(self) -> float:
        if self.phase_state == "GREEN":
            return float(self.green_time_ns if self.is_ns_corridor else self.green_time_ew) if self.control_mode == "QUANTUM_OPTIMIZED" else float(self.green_time)
        elif self.phase_state == "YELLOW":
            return float(self.yellow_time)
        else:
            return float(self.all_red_time)

    def get_light_status(self) -> Dict[str, Dict[str, bool]]:
        """
        Returns physical light status for North-South and East-West heads.
        Strictly prevents conflicting directions from being green or yellow simultaneously.
        """
        phase = self.current_signal_phase
        if phase == "North-South GREEN":
            ns = {"red": False, "yellow": False, "green": True}
            ew = {"red": True, "yellow": False, "green": False}
        elif phase == "North-South YELLOW":
            ns = {"red": False, "yellow": True, "green": False}
            ew = {"red": True, "yellow": False, "green": False}
        elif phase == "East-West GREEN":
            ns = {"red": True, "yellow": False, "green": False}
            ew = {"red": False, "yellow": False, "green": True}
        elif phase == "East-West YELLOW":
            ns = {"red": True, "yellow": False, "green": False}
            ew = {"red": False, "yellow": True, "green": False}
        else:
            # ALL RED - clearance safety interval
            ns = {"red": True, "yellow": False, "green": False}
            ew = {"red": True, "yellow": False, "green": False}
        return {"ns": ns, "ew": ew}

    def step(self, delta_sec: float, neighbor_data: Optional[List[Dict[str, Any]]] = None) -> List[TrafficVehicle]:
        """
        Simulates traffic dynamics for delta_sec:
        1. Advances 5-phase signal.
        2. Steps queued vehicles (accumulating waiting time and idle emissions).
        3. If signal is GREEN, releases queued vehicles at green discharge rate.
        4. When traffic exceeds capacity, queue remains or grows.
        5. Updates congestion, speed, and waiting time metrics.
        Returns vehicles discharged during this step.
        """
        self.step_signal(delta_sec, neighbor_data)

        # 1. Update waiting times of all queued vehicles
        total_wait = 0.0
        for v in self.queue:
            v.step(delta_sec)
            total_wait += v.waiting_time_sec

        self.waiting_time_avg = round(total_wait / max(1, len(self.queue)), 1)

        discharged_vehicles: List[TrafficVehicle] = []

        # 2. Discharge queued vehicles if signal is GREEN
        if self.phase_state == "GREEN" and len(self.queue) > 0:
            # Saturation flow discharge rate:
            # Quantum optimization reduces stop-and-go platooning delay through coordinated green waves:
            coordination_mult = 1.25 if self.control_mode == "QUANTUM_OPTIMIZED" else 1.15
            discharge_rate_per_sec = (self.road_capacity / 60.0) * coordination_mult
            # Number of vehicles eligible to pass this step
            num_to_discharge = max(1, int(round(discharge_rate_per_sec * delta_sec)))
            num_to_discharge = min(num_to_discharge, len(self.queue))

            for _ in range(num_to_discharge):
                v = self.queue.pop(0)
                v.release_from_queue()
                discharged_vehicles.append(v)
                self.vehicles_processed_total += 1

            # Instantaneous throughput in vehicles / minute
            self.throughput_vpm = round((len(discharged_vehicles) / max(0.1, delta_sec)) * 60.0, 1)
        else:
            # In Yellow or Red phase, throughput on this approach drops
            self.throughput_vpm = 0.0

        # 3. Update congestion level, vehicle density, and speed
        queue_count = len(self.queue)
        capacity_ratio = queue_count / max(20.0, float(self.road_capacity))

        if capacity_ratio >= 0.70:
            self.congestion_level = "CRITICAL"
            self.vehicle_density = "CRITICAL"
            self.average_speed = round(max(8.0, 50.0 * (1.0 - min(0.75, capacity_ratio * 0.9))), 1)
        elif capacity_ratio >= 0.45:
            self.congestion_level = "HIGH"
            self.vehicle_density = "HIGH"
            self.average_speed = round(max(15.0, 50.0 * (1.0 - capacity_ratio * 0.65)), 1)
        elif capacity_ratio >= 0.25:
            self.congestion_level = "MEDIUM"
            self.vehicle_density = "MEDIUM"
            self.average_speed = round(max(28.0, 50.0 * (1.0 - capacity_ratio * 0.4)), 1)
        else:
            self.congestion_level = "LOW"
            self.vehicle_density = "LOW"
            self.average_speed = round(max(40.0, 52.0 - capacity_ratio * 15.0), 1)

        return discharged_vehicles

    def to_dict(self) -> Dict[str, Any]:
        lights = self.get_light_status()
        remaining = self.get_remaining_time()
        phase_duration = self.get_phase_total_duration()

        return {
            "id": self.id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "vehicle_density": self.vehicle_density,
            "queue_length": self.queue_length,
            "road_capacity": self.road_capacity,
            "average_speed": self.average_speed,
            "current_signal_phase": self.current_signal_phase,
            "remaining_time_sec": remaining,
            "phase_elapsed_sec": round(self.phase_elapsed_sec, 1),
            "phase_total_duration": phase_duration,
            "green_time": self.green_time,
            "yellow_time": self.yellow_time,
            "red_time": self.red_time,
            "all_red_time": self.all_red_time,
            "cycle_time": self.cycle_time,
            "pedestrian_count": self.pedestrian_count,
            "congestion_level": self.congestion_level,
            "waiting_time_avg": self.waiting_time_avg,
            "throughput_vpm": self.throughput_vpm,
            "phase_state": self.phase_state,
            "control_mode": self.control_mode,
            "light_status": {
                "red": lights["ns"]["red"] and lights["ew"]["red"] if self.phase_state == "ALL RED" else (lights["ns"]["red"] if self.is_ns_corridor else lights["ew"]["red"]),
                "yellow": lights["ns"]["yellow"] if self.is_ns_corridor else lights["ew"]["yellow"],
                "green": lights["ns"]["green"] if self.is_ns_corridor else lights["ew"]["green"],
            },
            "light_status_ns": lights["ns"],
            "light_status_ew": lights["ew"],
            "active_corridor_direction": "ALL RED" if self.phase_state == "ALL RED" else ("North-South" if self.is_ns_corridor else "East-West"),
            "adaptive_recommendation": self.adaptive_recommendation,
            "quantum_timings": {
                "green_time": getattr(self, "quantum_green_time", self.green_time),
                "green_time_ns": getattr(self, "green_time_ns", self.green_time),
                "green_time_ew": getattr(self, "green_time_ew", self.green_time),
                "is_active": self.control_mode == "QUANTUM_OPTIMIZED",
            },
            "fixed_timing": {
                "green_time": self.fixed_green_time,
                "yellow_time": 4,
                "all_red_time": 2,
            },
        }

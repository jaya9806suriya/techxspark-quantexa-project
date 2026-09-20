"""
QUBO Formulation Module for Traffic Signal Optimization.
Part of Phase 5: Quantum Traffic Signal Optimization.
"""
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Exported interface
__all__ = ["build_qubo", "qubo_to_matrix", "qubo_to_ising", "TrafficSignalQUBO"]

class TrafficSignalQUBO:
    """
    Mathematical QUBO Formulator for Urban Traffic Signal Optimization.
    Constructs the quadratic cost matrix Q such that minimizing:
        Cost(x) = x^T Q x + offset
    finds the optimal binary green-phase duration assignments.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        penalty_weights: Optional[Dict[str, float]] = None,
        timing_options: Optional[List[int]] = None,
    ):
        # Default Objective Weights (w1 to w7)
        self.weights = {
            "waiting": 1.8,       # w1: minimize waiting time
            "queue": 2.2,         # w2: minimize queue length
            "congestion": 1.5,    # w3: minimize congestion
            "fuel": 1.2,          # w4: minimize fuel consumption
            "co2": 1.0,           # w5: minimize CO2 emissions
            "emergency": 3.5,     # w6: minimize emergency delay
            "switching": 0.8,     # w7: minimize unnecessary signal switching
        }
        if weights:
            self.weights.update(weights)

        # Constraint Penalty Multipliers (lambda)
        self.penalties = {
            "one_hot": 25.0,           # Penalty for selecting != 1 timing per direction
            "conflict": 8.0,           # Phase conflict / cycle length deviation
            "min_green": 12.0,         # Minimum green time violation
            "max_green": 10.0,         # Maximum green time violation
            "pedestrian": 14.0,        # Insufficient pedestrian crossing clearance
            "emergency_priority": 30.0 # Violation of emergency green corridor priority
        }
        if penalty_weights:
            self.penalties.update(penalty_weights)

        # Standard discrete timing options per direction in seconds (matching spec: 20s, 30s, 40s)
        self.timing_options = timing_options or [20, 30, 40]

    def define_variables(self, intersection_id: str = "I1") -> List[Dict[str, Any]]:
        """
        Defines discrete binary variables for North-South and East-West corridors.
        x1 = North-South green 20 sec
        x2 = North-South green 30 sec
        x3 = North-South green 40 sec
        x4 = East-West green 20 sec
        x5 = East-West green 30 sec
        x6 = East-West green 40 sec
        """
        variables = []
        var_idx = 0

        # Directions: North-South first, then East-West
        directions = [
            ("North-South", "NS"),
            ("East-West", "EW")
        ]

        for dir_name, dir_code in directions:
            for t in self.timing_options:
                var_idx += 1
                variables.append({
                    "index": var_idx - 1,
                    "id": f"x{var_idx}",
                    "name": f"{dir_name} green {t} sec",
                    "code": f"{intersection_id}_{dir_code}_{t}",
                    "direction": dir_name,
                    "direction_code": dir_code,
                    "duration_sec": t,
                    "intersection_id": intersection_id,
                })

        return variables

    def compute_objective_costs(
        self,
        variables: List[Dict[str, Any]],
        traffic_state: Dict[str, Any]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Computes the linear cost vector for each binary variable based on empirical traffic physics.
        Cost = w1*Waiting + w2*Queue + w3*Congestion + w4*Fuel + w5*CO2 + w6*Emergency + w7*Switching
        """
        n = len(variables)
        c = np.zeros(n)
        breakdown = []

        # Extract current traffic conditions
        q_ns = float(traffic_state.get("queue_ns", traffic_state.get("queue_length", 28.0)))
        q_ew = float(traffic_state.get("queue_ew", max(8.0, q_ns * 0.7)))
        cap_ns = float(traffic_state.get("road_capacity_ns", traffic_state.get("road_capacity", 50.0)))
        cap_ew = float(traffic_state.get("road_capacity_ew", traffic_state.get("road_capacity", 50.0)))
        peds_ns = float(traffic_state.get("pedestrian_ns", traffic_state.get("pedestrian_count", 6.0)))
        peds_ew = float(traffic_state.get("pedestrian_ew", max(2.0, peds_ns * 0.5)))
        current_phase = str(traffic_state.get("current_signal_phase", "North-South GREEN"))
        is_emergency = bool(traffic_state.get("emergency_active", False))
        emergency_corridor = traffic_state.get("emergency_corridor", "North-South" if is_emergency else None)

        sat_flow = 0.5 # ~0.5 vehicles per second discharged per lane during green

        w = self.weights

        for i, var in enumerate(variables):
            is_ns = (var["direction"] == "North-South")
            t = float(var["duration_sec"])

            q_active = q_ns if is_ns else q_ew
            q_ortho = q_ew if is_ns else q_ns
            cap_active = cap_ns if is_ns else cap_ew

            # 1. Queue cleared during green time t
            cleared = min(q_active, sat_flow * t)
            rem_active = max(0.0, q_active - cleared)
            rem_ortho = q_ortho # Orthogonal queue cannot move

            # 2. Waiting time (sec):
            # Active direction vehicles remaining wait cycle, cleared vehicles wait t/2
            # Orthogonal queue waits t + clearance interval (4s)
            wait_active = (rem_active * 40.0 + cleared * (t / 2.0)) / max(1.0, q_active)
            wait_ortho = (q_ortho * (t + 4.0)) / max(1.0, q_ortho)
            wait_metric = (wait_active + wait_ortho) / 2.0

            # 3. Queue Metric (veh)
            queue_metric = rem_active + rem_ortho

            # 4. Congestion Metric (%)
            congestion_metric = (rem_active / max(1.0, cap_active)) * 100.0

            # 5. Fuel Consumption (Liters)
            # Idling fuel: 0.00045 L/sec, stop-and-go penalty: 0.012 L/stop
            fuel_metric = (wait_metric * 0.00045 * (q_active + q_ortho)) + (queue_metric * 0.006)

            # 6. CO2 Emissions (kg)
            # 2.31 kg CO2 per liter gasoline
            co2_metric = fuel_metric * 2.31

            # 7. Emergency Delay (sec)
            emerg_metric = 0.0
            if is_emergency and emergency_corridor:
                if var["direction"] == emergency_corridor:
                    # Larger green time clears the emergency faster -> reduces delay
                    emerg_metric = max(0.0, (40.0 - t) * 0.8)
                else:
                    # Giving green to opposite direction directly delays emergency corridor
                    emerg_metric = (t + 5.0) * 2.5

            # 8. Unnecessary Signal Switching
            # If current active phase is already this direction, switching cost is 0;
            # if switching orthogonal direction, lost clearance time & driver startup lag
            current_is_ns = ("North-South" in current_phase)
            switched = (is_ns != current_is_ns)
            switching_metric = 5.0 if switched else 0.0

            # Weighted Cost Value
            cost = (
                w["waiting"] * wait_metric
                + w["queue"] * queue_metric
                + w["congestion"] * congestion_metric
                + w["fuel"] * fuel_metric
                + w["co2"] * co2_metric
                + w["emergency"] * emerg_metric
                + w["switching"] * switching_metric
            )

            c[i] = cost

            breakdown.append({
                "var": var["id"],
                "name": var["name"],
                "waiting_metric": round(wait_metric, 2),
                "queue_metric": round(queue_metric, 2),
                "congestion_metric": round(congestion_metric, 2),
                "fuel_metric": round(fuel_metric, 3),
                "co2_metric": round(co2_metric, 3),
                "emergency_metric": round(emerg_metric, 2),
                "switching_metric": round(switching_metric, 2),
                "total_linear_cost": round(cost, 3),
            })

        return c, {
            "breakdown": breakdown,
            "traffic_inputs": {
                "queue_ns": q_ns,
                "queue_ew": q_ew,
                "capacity_ns": cap_ns,
                "capacity_ew": cap_ew,
                "pedestrian_ns": peds_ns,
                "pedestrian_ew": peds_ew,
                "current_phase": current_phase,
                "emergency_active": is_emergency,
                "emergency_corridor": emergency_corridor,
            }
        }

    def build_qubo_model(
        self,
        traffic_state: Optional[Dict[str, Any]] = None,
        intersection_id: str = "I1"
    ) -> Dict[str, Any]:
        """
        Builds the mathematically complete QUBO Matrix Q and offset:
            Cost(x) = x^T Q x + offset
        Incorporates objective linear costs and constraint penalties.
        """
        traffic_state = traffic_state or {}
        variables = self.define_variables(intersection_id=intersection_id)
        n = len(variables)

        # Initialize symmetric / upper-triangular Q matrix and constant energy offset
        Q = np.zeros((n, n), dtype=float)
        offset = 0.0

        # 1. Add Objective Function Linear Costs to Diagonal (since x_i^2 = x_i)
        c, cost_info = self.compute_objective_costs(variables, traffic_state)
        for i in range(n):
            Q[i, i] += c[i]

        penalties_applied = {}

        # 2. Constraint: ONLY ONE TIMING OPTION SELECTED PER DIRECTION (One-Hot)
        # For NS: (sum_{t} x_NS,t - 1)^2 = sum x_i + 2 sum_{i<j} x_i x_j - 2 sum x_i + 1
        #                              = 1 - sum x_i + 2 sum_{i<j} x_i x_j
        lambda_onehot = self.penalties["one_hot"]
        ns_indices = [i for i, v in enumerate(variables) if v["direction"] == "North-South"]
        ew_indices = [i for i, v in enumerate(variables) if v["direction"] == "East-West"]

        for group in [ns_indices, ew_indices]:
            # Constant term
            offset += lambda_onehot
            # Diagonal terms: -lambda
            for i in group:
                Q[i, i] -= lambda_onehot
            # Off-diagonal quadratic mutual-exclusion couplings: +2 * lambda
            for i_idx, i in enumerate(group):
                for j in group[i_idx + 1:]:
                    Q[i, j] += 2.0 * lambda_onehot

        penalties_applied["one_hot"] = {
            "description": "Enforces exactly one green duration selected per directional corridor",
            "lambda": lambda_onehot,
            "groups": [["x1", "x2", "x3"], ["x4", "x5", "x6"]],
        }

        # 3. Constraint: CONFLICTING TRAFFIC PHASES & CYCLE BALANCE
        # Total cycle target = 60s (e.g. 30s NS + 30s EW, or 20s NS + 40s EW)
        # Penalty = lambda_conflict * (sum_k t_k * x_k - target_cycle)^2
        lambda_conflict = self.penalties["conflict"]
        target_cycle = 60.0 # Target combined green split
        offset += lambda_conflict * (target_cycle ** 2)

        # Scale durations for numerical stability
        for i in range(n):
            ti = variables[i]["duration_sec"]
            # Linear contribution: lambda * (ti^2 - 2 * target * ti)
            Q[i, i] += lambda_conflict * (ti ** 2 - 2.0 * target_cycle * ti) / 100.0

            # Quadratic couplings between conflicting/combined phases: +2 * lambda * ti * tj
            for j in range(i + 1, n):
                tj = variables[j]["duration_sec"]
                # Cross-corridor coordination coupling
                Q[i, j] += 2.0 * lambda_conflict * (ti * tj) / 100.0

        penalties_applied["conflict"] = {
            "description": "Penalizes asymmetric cycle imbalances and conflicting simultaneous allocations",
            "lambda": lambda_conflict,
            "target_cycle_sec": target_cycle,
        }

        # 4. Constraint: MINIMUM GREEN TIME (Must be >= 15s)
        lambda_min = self.penalties["min_green"]
        min_green_threshold = 15.0
        for i in range(n):
            t = variables[i]["duration_sec"]
            if t < min_green_threshold:
                deficit = min_green_threshold - t
                Q[i, i] += lambda_min * (deficit ** 2)
        penalties_applied["min_green"] = {
            "description": "Penalizes green durations under safety floor (15s)",
            "lambda": lambda_min,
            "threshold": min_green_threshold,
        }

        # 5. Constraint: MAXIMUM GREEN TIME (Must not exceed 45s)
        lambda_max = self.penalties["max_green"]
        max_green_threshold = 45.0
        for i in range(n):
            t = variables[i]["duration_sec"]
            if t > max_green_threshold:
                excess = t - max_green_threshold
                Q[i, i] += lambda_max * (excess ** 2)
        penalties_applied["max_green"] = {
            "description": "Penalizes excessive phase holding causing starvations (>45s)",
            "lambda": lambda_max,
            "threshold": max_green_threshold,
        }

        # 6. Constraint: PEDESTRIAN MINIMUM CROSSING TIME
        # If pedestrians waiting > 5, minimum crossing time is 25s
        lambda_ped = self.penalties["pedestrian"]
        peds_ns = cost_info["traffic_inputs"]["pedestrian_ns"]
        peds_ew = cost_info["traffic_inputs"]["pedestrian_ew"]

        for i, var in enumerate(variables):
            t = var["duration_sec"]
            peds = peds_ns if var["direction"] == "North-South" else peds_ew
            if peds >= 5.0 and t < 25.0:
                deficit = (25.0 - t)
                Q[i, i] += lambda_ped * deficit * (peds / 5.0)

        penalties_applied["pedestrian"] = {
            "description": "Guarantees pedestrians sufficient clearance interval (>=25s)",
            "lambda": lambda_ped,
            "pedestrians_ns": peds_ns,
            "pedestrians_ew": peds_ew,
        }

        # 7. Constraint: EMERGENCY PRIORITY PENALTY
        lambda_emerg = self.penalties["emergency_priority"]
        if cost_info["traffic_inputs"]["emergency_active"]:
            emerg_dir = cost_info["traffic_inputs"]["emergency_corridor"]
            for i, var in enumerate(variables):
                if var["direction"] != emerg_dir:
                    # Penalize selecting green for non-emergency corridor
                    Q[i, i] += lambda_emerg * 30.0
                elif var["duration_sec"] < 30.0:
                    # Penalize short green for emergency corridor
                    Q[i, i] += lambda_emerg * (30.0 - var["duration_sec"]) * 2.0

            penalties_applied["emergency"] = {
                "description": "Forces priority green window for emergency responder corridor",
                "lambda": lambda_emerg,
                "corridor": emerg_dir,
            }

        # Format Q into standard JSON-serializable structures
        q_dict_serializable = {}
        for i in range(n):
            for j in range(i, n):
                val = round(float(Q[i, j]), 4)
                if abs(val) > 1e-6:
                    q_dict_serializable[f"({i},{j})"] = val

        # Exact ground-truth exhaustive evaluation for n=6 to find mathematical ground state x*
        best_state = None
        min_energy = float("inf")
        feasible_count = 0

        # Evaluate all 2^n configurations
        for mask in range(1 << n):
            x = np.array([(mask >> bit) & 1 for bit in range(n)], dtype=float)
            # Energy E = x^T Q x + offset
            energy = float(x.T @ Q @ x + offset)

            # Check feasibility (one-hot on NS and EW)
            is_onehot_ns = (sum(x[ns_indices]) == 1)
            is_onehot_ew = (sum(x[ew_indices]) == 1)
            is_feasible = (is_onehot_ns and is_onehot_ew)

            if is_feasible:
                feasible_count += 1
                if energy < min_energy:
                    min_energy = energy
                    best_state = x

        # If no feasible found (unlikely), fallback to argmin
        if best_state is None:
            best_state = np.zeros(n)
            best_state[1] = 1 # x2 (NS 30s)
            best_state[4] = 1 # x5 (EW 30s)
            min_energy = float(best_state.T @ Q @ best_state + offset)

        optimal_solution = {
            "binary_vector": [int(b) for b in best_state],
            "assignments": [
                {
                    "variable": variables[i]["id"],
                    "name": variables[i]["name"],
                    "selected": bool(best_state[i]),
                    "direction": variables[i]["direction"],
                    "duration_sec": variables[i]["duration_sec"],
                }
                for i in range(n)
            ],
            "minimum_energy": round(min_energy, 4),
            "selected_ns": next(
                (v["name"] for i, v in enumerate(variables) if best_state[i] and v["direction"] == "North-South"),
                "None"
            ),
            "selected_ew": next(
                (v["name"] for i, v in enumerate(variables) if best_state[i] and v["direction"] == "East-West"),
                "None"
            ),
        }

        # Convert to Ising Hamiltonian representation
        ising_form = qubo_to_ising(Q, offset)

        return {
            "status": "FORMULATED",
            "num_variables": n,
            "variables": variables,
            "q_matrix": np.round(Q, 4).tolist(),
            "q_dict": q_dict_serializable,
            "constant_offset": round(offset, 4),
            "ising": ising_form,
            "weights": self.weights,
            "penalties": self.penalties,
            "penalties_detail": penalties_applied,
            "objective_breakdown": cost_info["breakdown"],
            "traffic_inputs": cost_info["traffic_inputs"],
            "optimal_solution": optimal_solution,
            "total_feasible_states": feasible_count,
            "intersection_id": intersection_id,
        }

# Module-level convenience functions required by spec
_latest_qubo_model: Optional[Dict[str, Any]] = None

def build_qubo(
    traffic_state: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
    penalties: Optional[Dict[str, float]] = None,
    intersection_id: str = "I1",
    timing_options: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Builds the programmatic QUBO formulation for traffic signal timing.
    """
    global _latest_qubo_model
    formulator = TrafficSignalQUBO(weights=weights, penalty_weights=penalties, timing_options=timing_options)
    model = formulator.build_qubo_model(traffic_state=traffic_state, intersection_id=intersection_id)
    _latest_qubo_model = model
    return model

def qubo_to_matrix(q_data: Any, num_variables: Optional[int] = None) -> List[List[float]]:
    """
    Converts a QUBO dictionary or numpy array into a 2D matrix (List[List[float]]).
    """
    if isinstance(q_data, np.ndarray):
        return np.round(q_data, 4).tolist()
    if isinstance(q_data, list):
        return q_data

    if isinstance(q_data, dict):
        # Dictionary with keys like '(0,1)' or tuple keys (0, 1)
        if num_variables is None:
            max_idx = 0
            for k in q_data.keys():
                if isinstance(k, str):
                    clean = k.strip("() ")
                    parts = clean.split(",")
                    max_idx = max(max_idx, int(parts[0]), int(parts[1]))
                elif isinstance(k, (tuple, list)):
                    max_idx = max(max_idx, k[0], k[1])
            num_variables = max_idx + 1

        mat = np.zeros((num_variables, num_variables), dtype=float)
        for k, v in q_data.items():
            if isinstance(k, str):
                clean = k.strip("() ")
                parts = clean.split(",")
                i, j = int(parts[0]), int(parts[1])
            else:
                i, j = k[0], k[1]
            mat[i, j] = float(v)
        return np.round(mat, 4).tolist()

    return []

def qubo_to_ising(Q: Any, offset: float = 0.0) -> Dict[str, Any]:
    """
    Maps QUBO problem (min x^T Q x + offset, x_i in {0,1}) to Ising Hamiltonian:
        H(s) = sum_i h_i s_i + sum_{i<j} J_ij s_i s_j + offset_ising, with s_i in {-1, +1}
    Transformation:
        x_i = (s_i + 1) / 2
    """
    if isinstance(Q, list):
        Q_arr = np.array(Q, dtype=float)
    elif isinstance(Q, np.ndarray):
        Q_arr = Q.copy()
    elif isinstance(Q, dict):
        Q_arr = np.array(qubo_to_matrix(Q), dtype=float)
    else:
        raise ValueError("Unsupported type for Q matrix")

    n = Q_arr.shape[0]
    h = np.zeros(n, dtype=float)
    J = {}
    ising_offset = float(offset)

    # For diagonal term: Q_ii * x_i = Q_ii * (s_i + 1)/2 = (Q_ii/2)*s_i + Q_ii/2
    for i in range(n):
        q_ii = float(Q_arr[i, i])
        h[i] += q_ii / 2.0
        ising_offset += q_ii / 2.0

    # For quadratic terms (i < j):
    # Q_ij * x_i * x_j = Q_ij * ((s_i+1)/2) * ((s_j+1)/2)
    #                  = (Q_ij/4) * s_i * s_j + (Q_ij/4) * s_i + (Q_ij/4) * s_j + (Q_ij/4)
    for i in range(n):
        for j in range(i + 1, n):
            q_ij = float(Q_arr[i, j])
            if abs(q_ij) > 1e-6:
                h[i] += q_ij / 4.0
                h[j] += q_ij / 4.0
                J[f"({i},{j})"] = round(q_ij / 4.0, 4)
                ising_offset += q_ij / 4.0

    return {
        "h": np.round(h, 4).tolist(),
        "J": J,
        "offset": round(ising_offset, 4),
        "num_spins": n,
        "ising_equation": "H(s) = sum_i h_i * s_i + sum_{i<j} J_ij * s_i * s_j + offset",
    }

def get_latest_qubo() -> Optional[Dict[str, Any]]:
    """Returns the most recently formulated QUBO model."""
    global _latest_qubo_model
    if _latest_qubo_model is None:
        # Default initialization with live/baseline traffic state
        _latest_qubo_model = build_qubo()
    return _latest_qubo_model

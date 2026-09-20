#!/usr/bin/env python3
"""
Python Bridge Dispatcher for Backend Services and SQLite.
Used by full-stack runtime to directly invoke backend modules.
"""
import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.init_db import init_database
from backend.api.health import check_health
from backend.services.traffic_service import TrafficService
from backend.services.quantum_service import QuantumService
from backend.services.emergency_service import EmergencyService
from backend.simulation.engine import simulation_engine
from backend.app.simulation import traffic_simulator
from backend.analytics.metrics_collector import MetricsCollector
from backend.analytics.environmental_model import EnvironmentalModel
from backend.app.quantum.qubo import build_qubo, get_latest_qubo
from backend.app.quantum.qaoa import run_qaoa, run_network_qaoa, get_qaoa_status

# Ensure SQLite schema & initial dataset are initialized idempotently on fresh install
DB_FILE = os.environ.get("DATABASE_PATH", "quantum_traffic.db")
if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
    try:
        init_database()
    except Exception as _db_err:
        pass

def _get_live_traffic_for_qubo(intersection_id: str = "I1") -> dict:
    """Helper to assemble realistic live traffic state for QUBO formulation."""
    try:
        signals_data = traffic_simulator.get_signals()
        signals = signals_data.get("signals", [])
        target = next((s for s in signals if s["id"] == intersection_id), None)
        if not target and signals:
            target = signals[0]

        if target:
            # Estimate NS vs EW queues based on phase and queue
            q = float(target.get("queue_length", 30))
            is_ns = "North-South" in target.get("current_signal_phase", "North-South GREEN")
            q_ns = q if is_ns else max(6.0, q * 0.65)
            q_ew = max(6.0, q * 0.7) if is_ns else q
            return {
                "queue_ns": round(q_ns, 1),
                "queue_ew": round(q_ew, 1),
                "queue_length": q,
                "road_capacity_ns": float(target.get("capacity", 80)),
                "road_capacity_ew": float(target.get("capacity", 80)),
                "pedestrian_ns": float(target.get("pedestrian_count", 15)),
                "pedestrian_ew": max(4.0, float(target.get("pedestrian_count", 15)) * 0.6),
                "current_signal_phase": target.get("current_signal_phase", "North-South GREEN"),
                "emergency_active": False,
                "emergency_corridor": None,
            }
    except Exception:
        pass
    return {
        "queue_ns": 38.0,
        "queue_ew": 22.0,
        "queue_length": 38.0,
        "road_capacity_ns": 80.0,
        "road_capacity_ew": 80.0,
        "pedestrian_ns": 18.0,
        "pedestrian_ew": 10.0,
        "current_signal_phase": "North-South GREEN",
        "emergency_active": False,
        "emergency_corridor": None,
    }

def handle(action: str, payload_str: str = "{}"):
    payload = {}
    if payload_str:
        if payload_str.startswith("b64:"):
            try:
                import base64
                decoded = base64.b64decode(payload_str[4:]).decode("utf-8")
                payload = json.loads(decoded)
            except Exception:
                payload = {}
        else:
            try:
                payload = json.loads(payload_str)
            except Exception:
                payload = {}

    if action == "health":
        return check_health()
    elif action == "sim_start":
        return traffic_simulator.start()
    elif action == "sim_pause":
        return traffic_simulator.pause()
    elif action == "sim_reset":
        return traffic_simulator.reset()
    elif action == "sim_status":
        return traffic_simulator.get_status()
    elif action == "sim_speed":
        return traffic_simulator.set_speed(float(payload.get("speed", 1.0)))
    elif action == "sim_intensity":
        return traffic_simulator.set_intensity(payload.get("intensity", "MEDIUM"), payload.get("custom_rate"))
    elif action == "sim_step":
        if "intensity" in payload:
            traffic_simulator.set_intensity(payload.get("intensity", "MEDIUM"), payload.get("custom_rate"))
        if "speed" in payload:
            traffic_simulator.set_speed(float(payload.get("speed", 1.0)))
        return traffic_simulator.step(float(payload.get("delta_sec", 1.0)))
    elif action == "intersections":
        return TrafficService.get_intersections()
    elif action == "intersection_detail":
        return TrafficService.get_intersection_by_id(payload.get("id", "I1"))
    elif action == "traffic":
        return TrafficService.get_traffic()
    elif action == "signals":
        return traffic_simulator.get_signals()
    elif action == "signals_adaptive":
        return traffic_simulator.set_signal_mode("ADAPTIVE", payload.get("intersection_id"))
    elif action == "signals_manual":
        return traffic_simulator.set_signal_mode("FIXED", payload.get("intersection_id"), payload)
    elif action == "network":
        return TrafficService.get_network_graph()
    elif action == "nodes":
        return TrafficService.get_all_nodes()
    elif action == "edges":
        return TrafficService.get_all_edges()
    elif action == "live_metrics":
        return TrafficService.get_live_metrics()
    elif action == "quantum_status":
        status_data = QuantumService.get_status()
        status_data.update(get_qaoa_status())
        return status_data
    elif action == "quantum_history":
        return QuantumService.get_history()
    elif action == "quantum_optimize":
        return QuantumService.run_optimization(payload)
    elif action == "quantum_qaoa":
        intersection_id = payload.get("intersection_id", "I1")
        p_steps = int(payload.get("p_steps", 2))
        shots = int(payload.get("shots", 1024))
        traffic_state = payload.get("traffic_state")
        if not traffic_state:
            traffic_state = _get_live_traffic_for_qubo(intersection_id)
        weights = payload.get("weights")
        penalties = payload.get("penalties")
        qubo_data = payload.get("qubo_data")
        return run_qaoa(
            qubo_data=qubo_data,
            p_steps=p_steps,
            shots=shots,
            traffic_state=traffic_state,
            weights=weights,
            penalties=penalties,
            intersection_id=intersection_id,
        )
    elif action == "quantum_optimize_network":
        p_steps = int(payload.get("p_steps", 2))
        shots = int(payload.get("shots", 1024))
        weights = payload.get("weights")
        penalties = payload.get("penalties")
        traffic_states = payload.get("traffic_states")
        return run_network_qaoa(
            p_steps=p_steps,
            shots=shots,
            weights=weights,
            penalties=penalties,
            traffic_states=traffic_states,
        )
    elif action == "quantum_apply_signals":
        timings = payload.get("timings", payload)
        return traffic_simulator.apply_quantum_signals(timings)
    elif action == "quantum_benchmark":
        duration_sec = int(payload.get("duration_sec", 60))
        timings = payload.get("timings")
        return traffic_simulator.run_controlled_benchmark(duration_sec=duration_sec, quantum_timings=timings)
    elif action == "signals_quantum":
        return traffic_simulator.set_signal_mode("QUANTUM_OPTIMIZED", payload.get("intersection_id"), payload)
    elif action == "quantum_qubo_build":
        intersection_id = payload.get("intersection_id", "I1")
        traffic_state = payload.get("traffic_state")
        if not traffic_state:
            traffic_state = _get_live_traffic_for_qubo(intersection_id)
        weights = payload.get("weights")
        penalties = payload.get("penalties")
        return build_qubo(
            traffic_state=traffic_state,
            weights=weights,
            penalties=penalties,
            intersection_id=intersection_id,
        )
    elif action == "quantum_qubo_latest":
        return get_latest_qubo()
    elif action == "corridors":
        return EmergencyService.get_corridors()
    elif action == "toggle_corridor":
        return EmergencyService.toggle_corridor(payload.get("corridor_id"), payload.get("active", True))
    elif action == "emergency_create":
        return traffic_simulator.create_emergency(payload)
    elif action == "emergency_activate":
        return traffic_simulator.activate_emergency(payload)
    elif action == "emergency_status":
        return traffic_simulator.get_emergency_status()
    elif action == "emergency_complete":
        return traffic_simulator.complete_emergency(payload)
    elif action == "incidents":
        return EmergencyService.get_incidents()
    elif action == "events_trigger":
        return traffic_simulator.trigger_event(payload)
    elif action == "events_resolve":
        return traffic_simulator.resolve_event(payload.get("event_id", ""))
    elif action == "events_history":
        return traffic_simulator.get_events_summary()
    elif action == "events_clear":
        return traffic_simulator.clear_events()
    elif action == "sim_state":
        return simulation_engine.step()
    elif action == "sim_control":
        return simulation_engine.set_control(payload.get("action", "play"), payload.get("speed", 1.0))
    elif action == "analytics_summary":
        return {
            "kpi": MetricsCollector.get_summary_kpi(),
            "time_series": MetricsCollector.get_time_series_data()
        }
    elif action == "environmental_metrics":
        sim_status = traffic_simulator.get_status()
        return EnvironmentalModel.calculate_metrics(simulation_state=sim_status, custom_config=payload)
    elif action == "three_method_comparison":
        duration_sec = int(payload.get("duration_sec", 60))
        intensity = payload.get("intensity", "MEDIUM")
        p_steps = int(payload.get("p_steps", 2))
        return traffic_simulator.run_three_method_comparison(duration_sec=duration_sec, intensity=intensity, p_steps=p_steps)
    else:
        return {"error": f"Unknown action: {action}"}

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "health"
    payload = sys.argv[2] if len(sys.argv) > 2 else "{}"
    result = handle(action, payload)
    print(json.dumps(result))

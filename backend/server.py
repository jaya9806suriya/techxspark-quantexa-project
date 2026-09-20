#!/usr/bin/env python3
"""
Lightweight standalone Python HTTP API Server.
Runs on Python 3 standard library with native SQLite support.
Serves identical endpoints to FastAPI for maximum runtime compatibility.
"""
import http.server
import socketserver
import json
import urllib.parse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.init_db import init_database
from backend.api.health import check_health
from backend.services.traffic_service import TrafficService
from backend.services.quantum_service import QuantumService
from backend.services.emergency_service import EmergencyService
from backend.simulation.engine import simulation_engine
from backend.app.simulation import traffic_simulator
from backend.analytics.metrics_collector import MetricsCollector

PORT = int(os.environ.get("BACKEND_PORT", 8000))

class QuantumTrafficHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/api/health", "/health"):
            self._send_json(check_health())
        elif path == "/api/traffic/nodes":
            self._send_json(TrafficService.get_all_nodes())
        elif path == "/api/traffic/edges":
            self._send_json(TrafficService.get_all_edges())
        elif path == "/api/traffic/live-metrics":
            self._send_json(TrafficService.get_live_metrics())
        elif path == "/api/quantum/status":
            self._send_json(QuantumService.get_status())
        elif path == "/api/quantum/history":
            self._send_json(QuantumService.get_history())
        elif path == "/api/emergency/corridors":
            self._send_json(EmergencyService.get_corridors())
        elif path == "/api/incidents":
            self._send_json(EmergencyService.get_incidents())
        elif path == "/api/simulation/state":
            self._send_json(simulation_engine.step())
        elif path == "/api/simulation/status":
            self._send_json(traffic_simulator.get_status())
        elif path == "/api/analytics/summary":
            self._send_json({
                "kpi": MetricsCollector.get_summary_kpi(),
                "time_series": MetricsCollector.get_time_series_data()
            })
        else:
            self._send_json({"error": "Not Found", "path": path}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length) if length > 0 else b'{}'
        try:
            payload = json.loads(body.decode('utf-8'))
        except Exception:
            payload = {}

        if path == "/api/quantum/optimize":
            self._send_json(QuantumService.run_optimization(payload))
        elif path == "/api/emergency/toggle":
            self._send_json(EmergencyService.toggle_corridor(payload.get("corridor_id"), payload.get("active", True)))
        elif path == "/api/simulation/control":
            self._send_json(simulation_engine.set_control(payload.get("action", "play"), payload.get("speed", 1.0)))
        elif path == "/api/simulation/start":
            self._send_json(traffic_simulator.start())
        elif path == "/api/simulation/pause":
            self._send_json(traffic_simulator.pause())
        elif path == "/api/simulation/reset":
            self._send_json(traffic_simulator.reset())
        elif path == "/api/simulation/speed":
            self._send_json(traffic_simulator.set_speed(float(payload.get("speed", 1.0))))
        elif path == "/api/simulation/intensity":
            self._send_json(traffic_simulator.set_intensity(payload.get("intensity", "MEDIUM"), payload.get("custom_rate")))
        elif path == "/api/simulation/step":
            if "intensity" in payload:
                traffic_simulator.set_intensity(payload.get("intensity", "MEDIUM"), payload.get("custom_rate"))
            if "speed" in payload:
                traffic_simulator.set_speed(float(payload.get("speed", 1.0)))
            self._send_json(traffic_simulator.step(float(payload.get("delta_sec", 1.0))))
        else:
            self._send_json({"error": "Not Found", "path": path}, status=404)

def run():
    init_database()
    with socketserver.TCPServer(("0.0.0.0", PORT), QuantumTrafficHandler) as httpd:
        print(f"Standalone Quantum Traffic Python Server running on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == "__main__":
    run()

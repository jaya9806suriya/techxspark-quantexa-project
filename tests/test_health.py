"""
Unit test for health check endpoint and database connectivity.
"""
import unittest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.health import check_health
from backend.services.traffic_service import TrafficService

class TestHealthAndDatabase(unittest.TestCase):
    def test_health_check(self):
        health = check_health()
        self.assertEqual(health["status"], "ok")
        self.assertEqual(health["database"]["connected"], True)
        self.assertGreater(health["database"]["tables_found"], 0)

    def test_traffic_nodes_seeded(self):
        nodes = TrafficService.get_all_nodes()
        self.assertGreaterEqual(len(nodes), 5)
        self.assertIn("Civic Center Hub", [n["name"] for n in nodes])

    def test_traffic_edges_seeded(self):
        edges = TrafficService.get_all_edges()
        self.assertGreaterEqual(len(edges), 5)

if __name__ == "__main__":
    unittest.main()

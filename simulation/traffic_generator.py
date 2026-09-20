#!/usr/bin/env python3
"""
Traffic generator module.
Synthesizes origin-destination (OD) trip matrices and Poisson vehicle arrivals for micro-simulation.
"""
import random
import time
from typing import List, Dict, Any

class TrafficGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)

    def generate_od_matrix(self, node_ids: List[str]) -> Dict[str, Dict[str, int]]:
        od_matrix = {}
        for src in node_ids:
            od_matrix[src] = {}
            for dst in node_ids:
                if src == dst:
                    od_matrix[src][dst] = 0
                else:
                    od_matrix[src][dst] = random.randint(50, 450)
        return od_matrix

if __name__ == "__main__":
    tg = TrafficGenerator()
    matrix = tg.generate_od_matrix(["N1", "N2", "N3", "N4"])
    print(f"Generated OD Matrix for {len(matrix)} nodes.")

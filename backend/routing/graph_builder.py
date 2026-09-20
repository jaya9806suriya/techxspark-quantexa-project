"""
Graph building and NetworkX topology generator.
Transforms SQLite database nodes and road edges into mathematical directed multigraphs.
"""
from typing import Dict, Any, List

class GraphBuilder:
    @staticmethod
    def build_network_graph(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        adjacency = {}
        for n in nodes:
            adjacency[n["id"]] = []

        for e in edges:
            src = e["source_id"]
            tgt = e["target_id"]
            if src in adjacency:
                adjacency[src].append({
                    "edge_id": e["id"],
                    "target": tgt,
                    "distance_km": e["distance_km"],
                    "weight": e["quantum_weight"],
                    "congestion": e["congestion_level"]
                })

        return {
            "node_count": len(nodes),
            "edge_count": len(edges),
            "is_directed": True,
            "density": len(edges) / (len(nodes) * (len(nodes) - 1) or 1),
            "adjacency_sample": adjacency,
        }

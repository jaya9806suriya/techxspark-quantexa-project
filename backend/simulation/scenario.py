"""
Simulation scenario definitions.
"""
from typing import Dict, Any, List

SCENARIOS = [
    {
        "id": "SCEN_RUSH_HOUR",
        "name": "Morning Rush Hour (Inbound Corridor)",
        "description": "High vehicle influx from Bay Bridge into Financial District and Market St.",
        "influx_multiplier": 1.8,
        "incident_probability": 0.05,
    },
    {
        "id": "SCEN_EMERGENCY_GRID",
        "name": "Multi-Vehicle Major Incident on Highway Ramp",
        "description": "Complete blockage of Bay Bridge approach requiring quantum detour redistribution.",
        "influx_multiplier": 1.2,
        "incident_probability": 0.85,
    },
    {
        "id": "SCEN_STORM_SURGE",
        "name": "Severe Weather Wet Surface Speed Reduction",
        "description": "Speed reductions across Embarcadero and Port waterfront arterials.",
        "influx_multiplier": 0.9,
        "incident_probability": 0.25,
    }
]

def get_scenarios() -> List[Dict[str, Any]]:
    return SCENARIOS

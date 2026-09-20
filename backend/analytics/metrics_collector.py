"""
Traffic metrics and time-series telemetry collector.
"""
from typing import Dict, Any, List

class MetricsCollector:
    @staticmethod
    def get_time_series_data() -> List[Dict[str, Any]]:
        hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
        data = []
        for i, h in enumerate(hours):
            # Realistic diurnal curve
            classical_delay = [18, 14, 12, 28, 72, 58, 48, 52, 85, 78, 45, 26][i]
            quantum_delay = [14, 11, 10, 20, 48, 38, 32, 36, 56, 51, 31, 19][i]
            data.append({
                "time": h,
                "classical_delay_sec": classical_delay,
                "quantum_delay_sec": quantum_delay,
                "savings_pct": round(((classical_delay - quantum_delay) / classical_delay) * 100, 1),
                "vehicles_processed": int(classical_delay * 180 + 2000)
            })
        return data

    @staticmethod
    def get_summary_kpi() -> Dict[str, Any]:
        return {
            "total_co2_reduction_tons": 42.8,
            "average_commute_savings_min": 8.4,
            "fuel_saved_liters": 18450,
            "emergency_response_gain_pct": 36.2,
            "quantum_fidelity_score": 98.6
        }

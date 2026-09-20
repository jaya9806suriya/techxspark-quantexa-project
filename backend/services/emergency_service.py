"""
Emergency corridor preemption and incident service.
"""
import json
from typing import List, Dict, Any
from backend.database.connection import get_raw_connection

class EmergencyService:
    @staticmethod
    def get_corridors() -> List[Dict[str, Any]]:
        conn = get_raw_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM emergency_corridors ORDER BY id ASC")
        rows = []
        for r in cursor.fetchall():
            item = dict(r)
            try:
                item["nodes_sequence"] = json.loads(item["nodes_sequence"])
            except Exception:
                item["nodes_sequence"] = []
            item["active"] = bool(item["active"])
            item["green_wave_active"] = bool(item["green_wave_active"])
            rows.append(item)
        conn.close()
        return rows

    @staticmethod
    def toggle_corridor(corridor_id: str, active: bool) -> Dict[str, Any]:
        conn = get_raw_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE emergency_corridors 
        SET active = ?, green_wave_active = ?
        WHERE id = ?
        """, (1 if active else 0, 1 if active else 0, corridor_id))
        conn.commit()

        cursor.execute("SELECT * FROM emergency_corridors WHERE id = ?", (corridor_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return {"error": "Corridor not found"}
        res = dict(row)
        res["active"] = bool(res["active"])
        res["green_wave_active"] = bool(res["green_wave_active"])
        res["nodes_sequence"] = json.loads(res["nodes_sequence"])
        return res

    @staticmethod
    def get_incidents() -> List[Dict[str, Any]]:
        conn = get_raw_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents ORDER BY reported_at DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

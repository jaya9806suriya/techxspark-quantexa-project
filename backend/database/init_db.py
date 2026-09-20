#!/usr/bin/env python3
"""
Database Initialization and Seeding Script
Initializes SQLite database schema and populates initial Smart City network data.
"""
import sqlite3
import os
import json
import time

DB_PATH = os.environ.get("DATABASE_PATH", "quantum_traffic.db")

def init_database():
    print(f"Initializing Quantum Traffic SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Intersections (Phase 2 Multi-Intersection Network)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS intersections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        vehicle_density TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        queue_length INTEGER NOT NULL,
        road_capacity INTEGER NOT NULL, -- vehicles/min
        average_speed REAL NOT NULL, -- km/h
        current_signal_phase TEXT NOT NULL,
        green_time INTEGER NOT NULL, -- sec
        yellow_time INTEGER NOT NULL, -- sec
        red_time INTEGER NOT NULL, -- sec
        pedestrian_count INTEGER NOT NULL,
        congestion_level TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Intersection Roads / Edges (Phase 2)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS intersection_roads (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        street_name TEXT NOT NULL,
        distance_km REAL NOT NULL,
        speed_limit_kmh INTEGER NOT NULL,
        road_capacity INTEGER NOT NULL,
        current_flow INTEGER NOT NULL,
        congestion_level TEXT NOT NULL,
        FOREIGN KEY (source_id) REFERENCES intersections(id),
        FOREIGN KEY (target_id) REFERENCES intersections(id)
    );
    """)

    # 3. Traffic Nodes (Intersections & Gateways - legacy compatibility)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS traffic_nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        node_type TEXT NOT NULL, -- 'intersection', 'highway_ramp', 'emergency_hub', 'transit_center'
        signal_state TEXT DEFAULT 'ADAPTIVE', -- 'ADAPTIVE', 'GREEN_NS', 'GREEN_EW', 'HOLD'
        cycle_time_sec INTEGER DEFAULT 90,
        qubit_assigned INTEGER DEFAULT 0,
        current_load REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Traffic Edges (Road Segments)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS traffic_edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        street_name TEXT NOT NULL,
        distance_km REAL NOT NULL,
        speed_limit_kmh INTEGER NOT NULL,
        capacity_vph INTEGER NOT NULL,
        current_flow_vph INTEGER DEFAULT 0,
        density_percentage REAL DEFAULT 0.0,
        congestion_level TEXT DEFAULT 'LOW', -- 'LOW', 'MODERATE', 'HEAVY', 'CRITICAL'
        quantum_weight REAL DEFAULT 1.0,
        FOREIGN KEY (source_id) REFERENCES traffic_nodes(id),
        FOREIGN KEY (target_id) REFERENCES traffic_nodes(id)
    );
    """)

    # 3. Optimization History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimization_runs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        algorithm TEXT NOT NULL, -- 'QAOA', 'VQE', 'CLASSICAL_DIJKSTRA', 'GENETIC'
        backend_name TEXT NOT NULL, -- 'qiskit_aer', 'ibm_brisbane', 'scipy_classical'
        qubits_used INTEGER NOT NULL,
        circuit_depth INTEGER NOT NULL,
        execution_time_ms REAL NOT NULL,
        cost_value REAL NOT NULL,
        congestion_reduction_pct REAL NOT NULL,
        co2_saved_kg REAL NOT NULL,
        status TEXT NOT NULL
    );
    """)

    # 4. Emergency Corridors
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_corridors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        source_node_id TEXT NOT NULL,
        target_node_id TEXT NOT NULL,
        active INTEGER DEFAULT 0,
        priority_level TEXT NOT NULL, -- 'AMBULANCE', 'FIRE', 'POLICE', 'VIP'
        eta_minutes REAL NOT NULL,
        green_wave_active INTEGER DEFAULT 0,
        nodes_sequence TEXT NOT NULL -- JSON array of node IDs
    );
    """)

    # 5. Events & Incidents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        incident_type TEXT NOT NULL, -- 'ACCIDENT', 'ROADWORK', 'WEATHER', 'STADIUM_EVENT'
        severity TEXT NOT NULL, -- 'MINOR', 'MODERATE', 'SEVERE', 'CRITICAL'
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        affected_edge_id TEXT,
        status TEXT NOT NULL, -- 'ACTIVE', 'INVESTIGATING', 'CLEARED'
        reported_at TEXT NOT NULL
    );
    """)

    # 6. System Configuration / Telemetry State
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Seed initial data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM intersections")
    if cursor.fetchone()[0] == 0:
        seed_intersections(cursor)
        conn.commit()
        print("Phase 2 Intersections data seeded successfully.")

    cursor.execute("SELECT COUNT(*) FROM traffic_nodes")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        conn.commit()
        print("Initial Smart City traffic grid seeded successfully.")
    else:
        print("Database already contains data, skipping legacy seed.")

    conn.close()

def seed_intersections(cursor):
    intersections_data = [
        ("I1", "Central Junction", 37.7833, -122.4080, "HIGH", 54, 90, 28.5, "North-South GREEN", 45, 4, 41, 65, "HIGH"),
        ("I2", "North Junction", 37.7915, -122.4080, "MEDIUM", 28, 75, 41.2, "East-West GREEN", 35, 4, 51, 24, "MEDIUM"),
        ("I3", "East Junction", 37.7885, -122.3980, "HIGH", 42, 80, 31.0, "North-South GREEN", 42, 4, 44, 38, "HIGH"),
        ("I4", "South Junction", 37.7750, -122.4080, "CRITICAL", 68, 85, 19.8, "East-West GREEN", 50, 5, 35, 42, "CRITICAL"),
        ("I5", "West Junction", 37.7833, -122.4185, "LOW", 15, 70, 48.0, "North-South GREEN", 30, 3, 57, 16, "LOW"),
        ("I6", "Hospital Junction", 37.7685, -122.4050, "LOW", 12, 65, 52.4, "North-South GREEN", 48, 4, 38, 12, "LOW"),
    ]
    cursor.executemany("""
    INSERT INTO intersections (id, name, latitude, longitude, vehicle_density, queue_length, road_capacity, average_speed, current_signal_phase, green_time, yellow_time, red_time, pedestrian_count, congestion_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, intersections_data)

    roads_data = [
        ("R1_1_2", "I1", "I2", "Central-North Arterial", 1.0, 45, 85, 68, "HIGH"),
        ("R1_2_1", "I2", "I1", "North-Central Arterial", 1.0, 45, 85, 64, "HIGH"),
        ("R2_1_4", "I1", "I4", "5th Street Corridor", 1.1, 50, 90, 82, "CRITICAL"),
        ("R2_4_1", "I4", "I1", "5th Street Northbound", 1.1, 50, 90, 79, "CRITICAL"),
        ("R3_1_5", "I1", "I5", "Market Civic Way", 1.0, 40, 75, 42, "MEDIUM"),
        ("R3_5_1", "I5", "I1", "Market Downtown Way", 1.0, 40, 75, 38, "MEDIUM"),
        ("R4_2_3", "I2", "I3", "Financial-Waterfront Link", 0.9, 45, 80, 56, "HIGH"),
        ("R4_3_2", "I3", "I2", "Waterfront-Financial Link", 0.9, 45, 80, 52, "HIGH"),
        ("R5_3_5", "I3", "I5", "Midtown Diagonal", 1.8, 50, 80, 46, "MEDIUM"),
        ("R5_5_3", "I5", "I3", "Midtown Eastbound", 1.8, 50, 80, 44, "MEDIUM"),
        ("R6_4_5", "I4", "I5", "SoMa West Access", 1.2, 45, 75, 38, "LOW"),
        ("R6_5_4", "I5", "I4", "SoMa South Connector", 1.2, 45, 75, 35, "LOW"),
        ("R7_4_6", "I4", "I6", "Hospital Trauma Route", 0.8, 55, 70, 24, "LOW"),
        ("R7_6_4", "I6", "I4", "Hospital Exit Route", 0.8, 55, 70, 22, "LOW"),
    ]
    cursor.executemany("""
    INSERT INTO intersection_roads (id, source_id, target_id, street_name, distance_km, speed_limit_kmh, road_capacity, current_flow, congestion_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, roads_data)


def seed_data(cursor):
    # Nodes in a metropolitan downtown grid (centered on San Francisco / Metropolitan Grid)
    nodes = [
        ("N1", "Civic Center Hub", 37.7792, -122.4191, "emergency_hub", "ADAPTIVE", 90, 1, 45.2),
        ("N2", "Market & 4th Plaza", 37.7858, -122.4065, "intersection", "GREEN_NS", 85, 2, 78.4),
        ("N3", "Mission Bay Junction", 37.7700, -122.3912, "emergency_hub", "GREEN_EW", 95, 3, 34.1),
        ("N4", "Financial District North", 37.7946, -122.4005, "intersection", "ADAPTIVE", 110, 4, 88.9),
        ("N5", "Embarcadero Transit Point", 37.7936, -122.3930, "transit_center", "ADAPTIVE", 80, 5, 62.0),
        ("N6", "SoMa Tech Corridor", 37.7785, -122.3970, "intersection", "GREEN_NS", 90, 6, 52.3),
        ("N7", "Bay Bridge Approach", 37.7877, -122.3883, "highway_ramp", "HOLD", 120, 7, 91.5),
        ("N8", "Central Hospital Emergency Bay", 37.7833, -122.4167, "emergency_hub", "GREEN_NS", 60, 8, 28.0),
        ("N9", "Port Waterfront Gate", 37.8010, -122.4050, "transit_center", "ADAPTIVE", 75, 9, 41.6),
        ("N10", "Union Square Retail Loop", 37.7879, -122.4075, "intersection", "ADAPTIVE", 90, 10, 74.2),
    ]
    cursor.executemany("""
    INSERT INTO traffic_nodes (id, name, latitude, longitude, node_type, signal_state, cycle_time_sec, qubit_assigned, current_load)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, nodes)

    # Road segments connecting nodes
    edges = [
        ("E1", "N1", "N8", "Civic Way - Hospital Ave", 0.8, 45, 1800, 720, 40.0, "LOW", 1.05),
        ("E2", "N8", "N2", "Golden Gate Ave", 1.2, 50, 2200, 1780, 80.9, "HEAVY", 2.45),
        ("E3", "N2", "N4", "Montgomery Corridor", 1.1, 40, 2000, 1850, 92.5, "CRITICAL", 3.80),
        ("E4", "N4", "N5", "California St Arterial", 0.9, 45, 1600, 1100, 68.7, "MODERATE", 1.62),
        ("E5", "N5", "N7", "Embarcadero Southbound", 1.4, 60, 3200, 2980, 93.1, "CRITICAL", 4.10),
        ("E6", "N2", "N6", "4th St Connector", 1.0, 45, 1900, 1050, 55.2, "MODERATE", 1.35),
        ("E7", "N6", "N3", "Mission Bay Blvd", 1.5, 55, 2400, 820, 34.1, "LOW", 0.95),
        ("E8", "N1", "N6", "Market South Cut", 1.3, 50, 2100, 1120, 53.3, "MODERATE", 1.30),
        ("E9", "N4", "N9", "Columbus Arterial", 1.2, 45, 1700, 780, 45.8, "LOW", 1.12),
        ("E10", "N2", "N10", "Powell Corridor", 0.4, 35, 1200, 960, 80.0, "HEAVY", 2.10),
        ("E11", "N10", "N4", "Post Street Link", 0.8, 40, 1500, 980, 65.3, "MODERATE", 1.55),
        ("E12", "N3", "N7", "King St Express", 2.1, 65, 3600, 2100, 58.3, "MODERATE", 1.40),
    ]
    cursor.executemany("""
    INSERT INTO traffic_edges (id, source_id, target_id, street_name, distance_km, speed_limit_kmh, capacity_vph, current_flow_vph, density_percentage, congestion_level, quantum_weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, edges)

    # Optimization history records
    runs = [
        ("OPT-8921", "2026-09-19 08:30:00", "QAOA", "qiskit_aer", 12, 4, 142.5, -45.2, 28.4, 342.1, "COMPLETED"),
        ("OPT-8920", "2026-09-19 08:15:00", "CLASSICAL_DIJKSTRA", "scipy_classical", 0, 0, 12.8, -32.1, 14.2, 185.0, "COMPLETED"),
        ("OPT-8919", "2026-09-19 08:00:00", "QAOA", "qiskit_aer", 10, 3, 115.2, -41.8, 26.1, 310.5, "COMPLETED"),
        ("OPT-8918", "2026-09-19 07:45:00", "VQE", "qiskit_aer", 8, 5, 230.1, -38.4, 22.8, 265.4, "COMPLETED"),
        ("OPT-8917", "2026-09-19 07:30:00", "CLASSICAL_DIJKSTRA", "scipy_classical", 0, 0, 11.4, -30.5, 13.5, 172.8, "COMPLETED"),
    ]
    cursor.executemany("""
    INSERT INTO optimization_runs (id, timestamp, algorithm, backend_name, qubits_used, circuit_depth, execution_time_ms, cost_value, congestion_reduction_pct, co2_saved_kg, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, runs)

    # Emergency Corridors
    corridors = [
        ("EC-01", "Trauma 1 Express: Civic to General Hospital", "N1", "N8", 1, "AMBULANCE", 3.2, 1, json.dumps(["N1", "N8"])),
        ("EC-02", "Fire Rescue: Financial Hub to Bridge", "N4", "N7", 0, "FIRE", 5.8, 0, json.dumps(["N4", "N5", "N7"])),
        ("EC-03", "Metro Police: Waterfront Quick Response", "N9", "N2", 0, "POLICE", 4.1, 0, json.dumps(["N9", "N4", "N2"])),
    ]
    cursor.executemany("""
    INSERT INTO emergency_corridors (id, name, source_node_id, target_node_id, active, priority_level, eta_minutes, green_wave_active, nodes_sequence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, corridors)

    # Incidents
    incidents = [
        ("INC-401", "Vehicle Stalling on Bay Bridge Ramp", "ACCIDENT", "SEVERE", 37.7877, -122.3883, "E5", "ACTIVE", "12 mins ago"),
        ("INC-402", "Fiber Optic Cable Work on Montgomery", "ROADWORK", "MODERATE", 37.7900, -122.4020, "E3", "ACTIVE", "45 mins ago"),
        ("INC-403", "Oracle Park Gameday Influx", "STADIUM_EVENT", "MODERATE", 37.7786, -122.3893, "E7", "ACTIVE", "1 hr ago"),
    ]
    cursor.executemany("""
    INSERT INTO incidents (id, title, incident_type, severity, latitude, longitude, affected_edge_id, status, reported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, incidents)

    # System Configuration
    configs = [
        ("system_name", "Quantum-Enhanced Adaptive Urban Traffic Optimization"),
        ("environment", "production-ready"),
        ("quantum_backend", "qiskit_aer"),
        ("active_qubits", "16"),
        ("classical_solver", "networkx_dijkstra"),
        ("optimization_interval_sec", "30"),
        ("grid_city", "San Francisco Metro"),
        ("telemetry_status", "NOMINAL_ONLINE"),
    ]
    cursor.executemany("""
    INSERT INTO system_config (key, value) VALUES (?, ?)
    """, configs)

if __name__ == "__main__":
    init_database()

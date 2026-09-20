# System Architecture: Quantum-Enhanced Adaptive Urban Traffic Optimization

## High-Level Topology

```
+-------------------------------------------------------------+
|                      React 19 Frontend                      |
| (Vite + Tailwind + Lucide + Recharts + Leaflet OpenStreetMap)|
|   - Smart City Command Center (12 Operational Pages)        |
+------------------------------+------------------------------+
                               | HTTP / REST
+------------------------------v------------------------------+
|            Node.js / Express Full-Stack Gateway              |
|   - Bound to Port 3000 (Cloud Run Reverse Proxy Gateway)     |
|   - Serves SPA Assets & Proxies to Python Dispatcher         |
+------------------------------+------------------------------+
                               | IPC / Python Runner
+------------------------------v------------------------------+
|            Python Backend & Optimization Services           |
|   - FastAPI / Pydantic / SQLAlchemy / SQLite Database        |
|   - NetworkX Graph Topology Engine                           |
|   - QUBO Problem Formulator & Ising Hamiltonians             |
|   - Qiskit Aer & IBM Quantum QPU Adapters (QAOA / VQE)       |
+-------------------------------------------------------------+
```

## Data Persistence
- **Storage**: SQLite Database (`quantum_traffic.db`)
- **Tables**:
  - `traffic_nodes`: Intersections, lat/lon, cycle times, signal states, qubit bindings
  - `traffic_edges`: Road links, capacities, current flow, congestion classification
  - `optimization_runs`: QAOA/VQE run history, energy expectation values, emissions saved
  - `emergency_corridors`: Preempted green-wave pathways with active statuses
  - `incidents`: Real-time hazard notifications, coordinates, severity levels
  - `system_config`: Active parameters and telemetry state

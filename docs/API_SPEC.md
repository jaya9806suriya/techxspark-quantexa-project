# REST API Specification (v1.0.0-phase1)

## Base URL: `/api`

### Endpoints:
1. `GET /api/health`
   - Returns service status, SQLite database connectivity status, table count, and quantum backend readiness.
2. `GET /api/traffic/nodes`
   - Returns all intersections, geographic coordinates, current signal states, cycle times.
3. `GET /api/traffic/edges`
   - Returns road segments, capacity, current flow, congestion level, quantum weight.
4. `GET /api/traffic/live-metrics`
   - Aggregate network speed, congestion index, active emergency routes, quantum readiness score.
5. `GET /api/quantum/status`
   - Quantum simulator specifications, available qubits, fidelity, supported algorithms.
6. `GET /api/quantum/history`
   - Historical ledger of optimization runs with cost convergence and CO2 offsets.
7. `POST /api/quantum/optimize`
   - Executes QAOA / VQE optimization on current grid state.
8. `GET /api/emergency/corridors`
   - Emergency vehicle prioritized corridors and green-wave preemption status.
9. `POST /api/emergency/toggle`
   - Activates or releases green-wave preemption for specific emergency corridors.
10. `GET /api/incidents`
    - Real-time road obstructions, accidents, and special events.
11. `GET /api/simulation/state`
    - Microscopic simulation step and throughput metrics.
12. `POST /api/simulation/control`
    - Simulation playback controls (play, pause, reset, speed multiplier).
13. `GET /api/analytics/summary`
    - Diurnal time-series delay comparisons (Classical vs Quantum) and KPI reductions.

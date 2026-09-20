import React from "react";
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Zap,
  Gauge,
  Siren,
} from "lucide-react";
import { PageId, HealthCheckResponse, LiveMetrics } from "../types";

interface HeaderProps {
  currentPage: PageId;
  health: HealthCheckResponse | null;
  liveMetrics: LiveMetrics | null;
  activeEmergencyCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Smart City Operations Dashboard",
    subtitle: "Real-time metropolitan traffic surveillance and quantum optimization metrics.",
  },
  "live-traffic": {
    title: "Live Traffic GIS Map",
    subtitle: "OpenStreetMap spatial visualization with real-time corridor congestion layers.",
  },
  "traffic-network": {
    title: "Traffic Network Topology",
    subtitle: "Graph-theoretic arterial node representation, throughput, and capacity constraints.",
  },
  "quantum-optimizer": {
    title: "Quantum Traffic Optimizer (QUBO / QAOA)",
    subtitle: "Variational ansatz parameter tuning, Hamiltonian formulation, and circuit execution.",
  },
  "emergency-corridor": {
    title: "Emergency Corridor Preemption",
    subtitle: "Automated green-wave phase lock for first responders and trauma transport.",
  },
  "events-incidents": {
    title: "Events, Hazards & Incident Log",
    subtitle: "Active arterial incidents, road construction, and stadium crowd diversions.",
  },
  simulation: {
    title: "Microscopic Traffic Simulation",
    subtitle: "Dynamic vehicle injection, scenario stress-testing, and throughput playback.",
  },
  analytics: {
    title: "Traffic & Emissions Analytics",
    subtitle: "Comparative diurnal delay curves, fuel conservation, and carbon offset tracking.",
  },
  "classical-vs-quantum": {
    title: "Classical vs Quantum Benchmarks",
    subtitle: "Side-by-side performance evaluation: Dijkstra / Heuristics vs QAOA / VQE.",
  },
  "optimization-history": {
    title: "Optimization Run Ledger",
    subtitle: "Immutable audit history of circuit runs, energy convergence, and speedup factors.",
  },
  documentation: {
    title: "System Architecture & Formulation",
    subtitle: "Technical specifications, mathematical QUBO derivations, and Phase 1-5 roadmap.",
  },
  settings: {
    title: "System Settings & Diagnostics",
    subtitle: "Backend QPU provider configuration, SQLite integrity checks, and telemetry polling.",
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  health,
  liveMetrics,
  activeEmergencyCount,
  onRefresh,
  isRefreshing,
}) => {
  const pageInfo = PAGE_TITLES[currentPage] || {
    title: "Command Center",
    subtitle: "Quantum-Enhanced Adaptive Urban Traffic Optimization",
  };

  const isHealthy = health?.status === "ok" && health?.database?.connected;

  return (
    <header
      id="command-header"
      className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 select-none z-10"
    >
      {/* Title & Context */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {pageInfo.title}
          {activeEmergencyCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.5 rounded-full animate-pulse font-mono font-medium">
              <Siren className="w-3 h-3" />
              {activeEmergencyCount} EMERGENCY CORRIDOR ACTIVE
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-400">{pageInfo.subtitle}</p>
      </div>

      {/* Real-time Ticker Metrics & Controls */}
      <div className="flex items-center gap-4">
        {/* KPI Ticker Badges */}
        {liveMetrics && (
          <div className="hidden lg:flex items-center gap-2">
            <div className="bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Avg Speed:</span>
              <span className="text-slate-200 font-mono font-semibold">
                {liveMetrics.average_network_speed_kmh} km/h
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Avg Density:</span>
              <span className="text-slate-200 font-mono font-semibold">
                {liveMetrics.avg_density_percentage}%
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Q-Readiness:</span>
              <span className="text-emerald-300 font-mono font-semibold">
                {liveMetrics.quantum_readiness_score}%
              </span>
            </div>
          </div>
        )}

        {/* Backend / Database Connection Status Badge */}
        <div
          id="api-health-status"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
            isHealthy
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
              : "bg-red-950/40 text-red-300 border-red-800/60"
          }`}
          title={
            isHealthy
              ? `Backend: OK | SQLite: Connected (${health?.database?.tables_found ?? 0} tables)`
              : "Backend or Database Disconnected"
          }
        >
          {isHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>/api/health: {isHealthy ? "200 OK" : "ERROR"}</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          id="refresh-telemetry-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition border border-slate-700 disabled:opacity-50"
          title="Refresh Telemetry & Health"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>
    </header>
  );
};

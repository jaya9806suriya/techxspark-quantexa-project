import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Gauge,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Siren,
  ShieldCheck,
  Cpu,
  Clock,
  Car,
  Fuel,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  XCircle,
  Construction,
  CheckCircle,
  RefreshCw,
  Radio,
  Sparkles,
  Layers,
  Route,
  ArrowUpRight,
  ChevronRight,
  Info,
  LineChart as LineChartIcon,
  Rss,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrafficNode,
  TrafficEdge,
  LiveMetrics,
  OptimizationRun,
  EmergencyCorridor,
  Incident,
  PageId,
  SimulationSpeed,
  TrafficIntensity,
  DetailedTrafficSignal,
  DynamicEventsSummaryResponse,
} from "../types";
import { LeafletMap } from "../components/LeafletMap";
import { useTrafficSimulation } from "../services/useTrafficSimulation";
import { AdaptiveSignalControllerView } from "../components/AdaptiveSignalControllerView";
import { ApiService } from "../services/api";
import { FullDemoRunner } from "../components/FullDemoRunner";
import { TechTermTooltip } from "../components/TechTermTooltip";

interface DashboardPageProps {
  nodes: TrafficNode[];
  edges: TrafficEdge[];
  liveMetrics: LiveMetrics | null;
  history: OptimizationRun[];
  corridors: EmergencyCorridor[];
  incidents: Incident[];
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  nodes,
  edges,
  liveMetrics,
  history,
  corridors,
  incidents,
  onNavigate,
}) => {
  // Real-Time Simulation Hook
  const {
    kpis,
    isRunning,
    speedMultiplier,
    intensity,
    simTime,
    intersections: simIntersections,
    roads: simRoads,
    history: simHistory,
    start,
    pause,
    reset,
    setSpeed,
    setIntensity,
  } = useTrafficSimulation();

  // Additional state for Quick Actions feedback and live panels
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [eventsSummary, setEventsSummary] = useState<DynamicEventsSummaryResponse>({
    active_events: [],
    event_history: [],
    closed_edges: [],
  });
  const [emergencyStatus, setEmergencyStatus] = useState<any>(null);
  const [quantumStatus, setQuantumStatus] = useState<any>(null);

  const latestRun = history && history.length > 0 ? history[0] : null;

  // Fetch event history & status periodically
  const fetchDashboardState = useCallback(async () => {
    try {
      const [eventsRes, emgRes, qRes] = await Promise.all([
        ApiService.getEventsHistory().catch(() => null),
        ApiService.getEmergencyStatus().catch(() => null),
        ApiService.getQuantumStatus().catch(() => null),
      ]);
      if (eventsRes) setEventsSummary(eventsRes);
      if (emgRes) setEmergencyStatus(emgRes);
      if (qRes) setQuantumStatus(qRes);
    } catch (err) {
      console.error("Dashboard state fetch error", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardState();
    const interval = setInterval(fetchDashboardState, 4000);
    return () => clearInterval(interval);
  }, [fetchDashboardState]);

  // Quick Action Handlers
  const handleRunQuantumOptimization = async () => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      const res = await ApiService.runNetworkQAOA({ p_steps: 2, shots: 1024 });
      await ApiService.applyOptimizedSignals(res.intersections);
      setActionNotice("⚛ QAOA Quantum Optimization Executed & Applied across 6 intersections!");
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateEmergency = async () => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      await ApiService.activateEmergency({
        vehicle_id: "EV-001",
        emergency_type: "Ambulance",
        start_location: "I6",
        destination: "I2",
        priority: "CRITICAL",
      });
      setActionNotice("🚑 Emergency Green Corridor Preemption launched for Ambulance EV-001!");
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerCongestion = async () => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      await ApiService.triggerEvent({
        type: "CONGESTION",
        target_id: "I1",
        severity: "CRITICAL",
      });
      setActionNotice("⚠ Sudden Congestion Surge (+45 vehicles) injected at I1 (Downtown Main Cross)!");
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerAccident = async () => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      await ApiService.triggerEvent({
        type: "ACCIDENT",
        target_id: "R1",
        severity: "HIGH",
      });
      setActionNotice("🚧 Accident reported on R1 (Main Downtown Arterial). Capacity restricted to 25 vpm.");
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseRoad = async () => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      await ApiService.triggerEvent({
        type: "ROAD_CLOSURE",
        target_id: "R1",
        severity: "CRITICAL",
      });
      setActionNotice("⛔ Road R1 CLOSED. Link removed from NetworkX graph; alternate routes recalculated.");
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    setActionLoading(true);
    try {
      await ApiService.resolveEvent(eventId);
      setActionNotice(`✅ Incident ${eventId} resolved. Physical capacity & NetworkX routing restored.`);
      await fetchDashboardState();
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const speedOptions: SimulationSpeed[] = [1, 2, 5, 10];
  const intensityOptions: TrafficIntensity[] = ["LOW", "MEDIUM", "HIGH", "CUSTOM"];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto font-sans">
      {/* 1. Header Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> System: ONLINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" /> Quantum Engine: <TechTermTooltip term="QAOA">QAOA</TechTermTooltip>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Network: 6 Intersections (I1 - I6)
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" /> Quantum Traffic Command Center
            </h1>
            <div className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Real-time urban traffic optimization platform pairing <TechTermTooltip term="NetworkX">NetworkX</TechTermTooltip> dynamic graph routing with <TechTermTooltip term="QAOA">QAOA</TechTermTooltip> quantum signal timing algorithms.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-bold">
              Sim Time: {simTime.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Real-Time Simulation Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Simulation Engine:</span>
            {isRunning ? (
              <button
                onClick={pause}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" /> PAUSE
              </button>
            ) : (
              <button
                onClick={start}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> START SIMULATION
              </button>
            )}
            <button
              onClick={reset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Speed:</span>
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                  speedMultiplier === s
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" /> Demand:
            </span>
            {intensityOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setIntensity(opt)}
                className={`px-2 py-1 rounded font-bold uppercase transition cursor-pointer ${
                  intensity === opt
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Action feedback toast */}
        {actionNotice && (
          <div className="mt-4 p-3 bg-cyan-950/70 border border-cyan-700/60 rounded-xl text-xs font-mono text-cyan-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">×</button>
          </div>
        )}
      </div>

      {/* Automated Hackathon Showcase: RUN FULL DEMO & LIVE DEMO STATUS */}
      <FullDemoRunner onDemoCompleted={fetchDashboardState} />

      {/* 2. Quick Actions Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="text-xs font-mono text-slate-400 mb-2.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Actions
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={isRunning ? pause : start}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isRunning ? "PAUSE SIM" : "RUN SIMULATION"}
          </button>

          <button
            onClick={handleRunQuantumOptimization}
            disabled={actionLoading}
            className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40 disabled:opacity-50 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" /> RUN QUANTUM OPTIMIZATION
          </button>

          <button
            onClick={handleActivateEmergency}
            disabled={actionLoading}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
          >
            <Siren className="w-3.5 h-3.5" /> ACTIVATE EMERGENCY
          </button>

          <button
            onClick={handleTriggerCongestion}
            disabled={actionLoading}
            className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> TRIGGER CONGESTION
          </button>

          <button
            onClick={handleTriggerAccident}
            disabled={actionLoading}
            className="py-2.5 px-3 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/40 disabled:opacity-50 cursor-pointer"
          >
            <Construction className="w-3.5 h-3.5" /> TRIGGER ACCIDENT
          </button>

          <button
            onClick={handleCloseRoad}
            disabled={actionLoading}
            className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" /> CLOSE ROAD
          </button>
        </div>
      </div>

      {/* 3. Primary 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Average Waiting Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Waiting Time</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {kpis ? `${kpis.average_waiting_time}s` : "42.5s"}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Real-time queue delay</span>
            </div>
          </div>
        </div>

        {/* 2. Queue Length */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Queue Length</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {kpis ? `${kpis.total_queue_length}` : "219"}{" "}
              <span className="text-xs text-slate-400 font-normal">veh</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
              <span>Dynamic network queue</span>
            </div>
          </div>
        </div>

        {/* 3. Throughput */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Throughput</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {kpis ? `${kpis.traffic_throughput}` : "284.0"}{" "}
              <span className="text-xs text-slate-400 font-normal">vpm</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
              <span>Cleared vehicles / min</span>
            </div>
          </div>
        </div>

        {/* 4. Fuel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Fuel</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {kpis ? `${kpis.fuel_consumption}` : "142.6"}{" "}
              <span className="text-xs text-slate-400 font-normal">L</span>
            </div>
            <div className="mt-1 text-[11px] text-purple-400 font-mono">
              Transit + idling fuel
            </div>
          </div>
        </div>

        {/* 5. CO2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">CO2</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {kpis ? `${kpis.co2_estimate}` : "329.4"}{" "}
              <span className="text-xs text-slate-400 font-normal">kg</span>
            </div>
            <div className="mt-1 text-[11px] text-rose-400 font-mono">
              Urban emissions index
            </div>
          </div>
        </div>

        {/* 6. Emergency ETA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Emergency ETA</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Siren className="w-4 h-4 animate-pulse text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-100 font-mono text-emerald-400">
              {emergencyStatus?.eta_seconds ? `${emergencyStatus.eta_seconds}s` : "113.1s"}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 font-mono">
              Green corridor active
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Spatial Network Map Panel & Optimization Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Container */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Main Map (Intersections, Traffic, Signals, Congestion, Emergency Route, Closures, Accidents)
              </h3>
              <p className="text-xs text-slate-400">
                Live OpenStreetMap spatial visualization displaying 6 intersections, traffic density, emergency route (🚑), road closures (⛔), and accidents (🚧).
              </p>
            </div>

            <button
              onClick={() => onNavigate("traffic-network")}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition cursor-pointer"
            >
              Network Topology <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-[400px]">
            <LeafletMap
              nodes={nodes}
              edges={edges}
              intersections={simIntersections.length > 0 ? simIntersections : (nodes as any)}
              roads={simRoads.length > 0 ? simRoads : (edges as any)}
              incidents={incidents}
            />
          </div>
        </div>

        {/* Right Side: Optimization Status & Emergency Overview */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Optimization Status Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Optimization Status</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                Qiskit Aer QPU
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between"><span>Last Optimization:</span> <span className="text-white font-bold">{latestRun?.timestamp ? new Date(latestRun.timestamp).toLocaleTimeString() : "Just now"}</span></div>
              <div className="flex justify-between"><span>Algorithm:</span> <span className="text-cyan-400 font-bold">QAOA</span></div>
              <div className="flex justify-between"><span>Objective Value:</span> <span className="text-emerald-400 font-bold">{latestRun?.cost_value ? latestRun.cost_value.toFixed(2) : "-14.82"}</span></div>
              <div className="flex justify-between"><span>Qubits:</span> <span className="text-purple-400 font-bold">{latestRun?.qubits_used || 12} Qubits</span></div>
              <div className="flex justify-between"><span>QAOA Layers:</span> <span className="text-amber-400 font-bold">p = 2</span></div>
              <div className="flex justify-between"><span>Execution Time:</span> <span className="text-cyan-300 font-bold">{latestRun?.execution_time_ms ? `${latestRun.execution_time_ms} ms` : "135.4 ms"}</span></div>
            </div>

            <button
              onClick={() => onNavigate("quantum-optimizer")}
              className="w-full mt-2 py-2 bg-slate-950 hover:bg-cyan-950/60 text-cyan-300 text-xs font-mono font-bold rounded-xl border border-cyan-800/60 transition flex items-center justify-center gap-1.5"
            >
              Open QAOA Workbench →
            </button>
          </div>

          {/* Emergency Panel */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Siren className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Emergency Status</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                {emergencyStatus?.active ? "ACTIVE" : "STANDBY"}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between"><span>Vehicle ID:</span> <span className="text-white font-bold">{emergencyStatus?.vehicle_id || "EV-001"}</span></div>
              <div className="flex justify-between"><span>Emergency Type:</span> <span className="text-amber-400 font-bold">{emergencyStatus?.emergency_type || "Ambulance"}</span></div>
              <div className="flex justify-between"><span>Priority:</span> <span className="text-red-400 font-bold">{emergencyStatus?.priority || "CRITICAL"}</span></div>
              <div className="flex justify-between"><span>Route:</span> <span className="text-cyan-300 font-bold">{(emergencyStatus?.route || ["I6", "I4", "I1", "I2"]).join(" ➔ ")}</span></div>
              <div className="flex justify-between"><span>ETA:</span> <span className="text-emerald-400 font-bold">{emergencyStatus?.eta_seconds ? `${emergencyStatus.eta_seconds}s` : "113.1s"}</span></div>
            </div>

            <button
              onClick={() => onNavigate("emergency-corridor")}
              className="w-full mt-2 py-2 bg-slate-950 hover:bg-emerald-950/60 text-emerald-300 text-xs font-mono font-bold rounded-xl border border-emerald-800/60 transition flex items-center justify-center gap-1.5"
            >
              Open Emergency Management →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Live Traffic Feed & Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Traffic Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Rss className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Live Traffic Updates Feed</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              STREAMING
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11px] max-h-56 overflow-y-auto custom-scrollbar">
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-slate-300 flex items-start gap-2">
              <span className="text-cyan-400 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span>Intersection I1: North-South GREEN active (38s split).</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-slate-300 flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span>Emergency Vehicle EV-001 approaching I4 (Green Hold Priority).</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span>Network Throughput: {kpis?.traffic_throughput ?? 284.0} vpm across 7 links.</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-slate-300 flex items-start gap-2">
              <span className="text-purple-400 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span>QAOA Quantum Signal Optimizer ready for recalculation.</span>
            </div>
          </div>
        </div>

        {/* Live Analytics Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-emerald-400" /> Live Analytics (Real-Time Delay & Throughput)
              </h3>
              <p className="text-xs text-slate-400">
                Live telemetry visualization capturing intersection queue delay over simulation time steps.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-lg">
              Real-Time Metrics
            </span>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simHistory.slice(-15)} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} unit="s" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", fontSize: "11px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="waiting_time" name="Avg Delay (s)" stroke="#06b6d4" fillOpacity={1} fill="url(#waitGrad)" />
                <Area type="monotone" dataKey="throughput" name="Throughput (vpm)" stroke="#10b981" fillOpacity={1} fill="url(#tpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Signal Status Panel (All 6 Intersections) */}
      <AdaptiveSignalControllerView />

      {/* 7. Events / Active Incidents Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Events (Active Incidents)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {eventsSummary.active_events.length} Active
            </span>
          </div>

          <button
            onClick={() => onNavigate("events-incidents")}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition cursor-pointer"
          >
            Events Control Center →
          </button>
        </div>

        {eventsSummary.active_events.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
            <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto opacity-80" />
            <p className="text-xs text-slate-300 font-medium">All Arterial Links Operating Normally</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsSummary.active_events.map((evt) => (
              <div key={evt.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{evt.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {evt.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{evt.target_name || evt.target_id}</h4>
                  <p className="text-xs text-slate-400 mt-1">{evt.details}</p>
                </div>
                <button
                  onClick={() => handleResolveEvent(evt.id)}
                  className="w-full mt-3 py-1.5 bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve Incident
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

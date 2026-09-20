import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  MapPin,
  Construction,
  Car,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Radio,
  Siren,
  Route,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { ApiService } from "../services/api";
import { DynamicEventItem, DynamicEventsSummaryResponse, Incident } from "../types";

interface EventsIncidentsPageProps {
  incidents?: Incident[];
}

const INTERSECTIONS = [
  { id: "I1", name: "I1: Downtown Main Cross", defaultRoad: "R1" },
  { id: "I2", name: "I2: North Highway Junction", defaultRoad: "R3" },
  { id: "I3", name: "I3: East Commercial Hub", defaultRoad: "R2" },
  { id: "I4", name: "I4: West Tech Corridor", defaultRoad: "R4" },
  { id: "I5", name: "I5: South Industrial Ring", defaultRoad: "R5" },
  { id: "I6", name: "I6: Emergency Medical Center", defaultRoad: "R6" },
];

const ROADS = [
  { id: "R1", name: "R1: Main Downtown Arterial (I1 <-> I2)", source: "I1", target: "I2" },
  { id: "R2", name: "R2: East Express Highway (I1 <-> I3)", source: "I1", target: "I3" },
  { id: "R3", name: "R3: North Outer Connector (I2 <-> I4)", source: "I2", target: "I4" },
  { id: "R4", name: "R4: West Tech Connector (I3 <-> I4)", source: "I3", target: "I4" },
  { id: "R5", name: "R5: South Ring Bypass (I3 <-> I5)", source: "I3", target: "I5" },
  { id: "R6", name: "R6: Medical Emergency Corridor (I5 <-> I6)", source: "I5", target: "I6" },
  { id: "R7", name: "R7: East Perimeter Link (I4 <-> I6)", source: "I4", target: "I6" },
];

export const EventsIncidentsPage: React.FC<EventsIncidentsPageProps> = () => {
  const [summary, setSummary] = useState<DynamicEventsSummaryResponse>({
    active_events: [],
    event_history: [],
    closed_edges: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");

  // Form states for the 4 event types
  // 1. Congestion Form
  const [congestionTarget, setCongestionTarget] = useState<string>("I1");

  // 2. Accident Form
  const [accidentTarget, setAccidentTarget] = useState<string>("R1");
  const [accidentSeverity, setAccidentSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");

  // 3. Road Closure Form
  const [closureTarget, setClosureTarget] = useState<string>("R1");

  // 4. Emergency Form
  const [emergencyVehicleId, setEmergencyVehicleId] = useState<string>("EV-001");
  const [emergencyType, setEmergencyType] = useState<string>("AMBULANCE");
  const [emergencyStart, setEmergencyStart] = useState<string>("I1");
  const [emergencyDest, setEmergencyDest] = useState<string>("I6");
  const [emergencyPriority, setEmergencyPriority] = useState<string>("CRITICAL");

  const fetchEvents = useCallback(async () => {
    try {
      const data = await ApiService.getEventsHistory();
      setSummary(data || { active_events: [], event_history: [], closed_edges: [] });
    } catch (err) {
      console.error("Failed to load events summary", err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      fetchEvents();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Handlers for event triggering
  const handleTriggerCongestion = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await ApiService.triggerEvent({
        type: "CONGESTION",
        target_id: congestionTarget,
        severity: "CRITICAL",
      });
      setActionMessage(`⚠ Sudden Congestion triggered on ${congestionTarget}. Vehicle density & queue surged (+45 vehicles). Adaptive optimization triggered.`);
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAccident = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await ApiService.triggerEvent({
        type: "ACCIDENT",
        target_id: accidentTarget,
        severity: accidentSeverity,
      });
      setActionMessage(`🚧 Accident reported on ${accidentTarget} (${accidentSeverity} severity). Road capacity reduced & traffic flow updated.`);
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClosure = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await ApiService.triggerEvent({
        type: "ROAD_CLOSURE",
        target_id: closureTarget,
        severity: "CRITICAL",
      });
      setActionMessage(`⛔ Road ${closureTarget} CLOSED. Edge removed from NetworkX routing graph. Alternate shortest routes recalculated.`);
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEmergency = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await ApiService.triggerEvent({
        type: "EMERGENCY",
        vehicle_id: emergencyVehicleId,
        type: emergencyType,
        start_location: emergencyStart,
        destination: emergencyDest,
        priority: emergencyPriority,
      });
      setActionMessage(`🚑 Emergency Green Corridor preemption launched for ${emergencyVehicleId} (${emergencyStart} ➔ ${emergencyDest}).`);
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await ApiService.resolveEvent(eventId);
      setActionMessage(`✅ Event ${eventId} resolved. Physical capacity & NetworkX routing restored.`);
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      await ApiService.clearEvents();
      setActionMessage("🔄 All active events cleared. Network topology & capacity reset.");
      await fetchEvents();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter history
  const filteredHistory = summary.event_history.filter((item) => {
    if (historyFilter === "ALL") return true;
    if (historyFilter === "ACTIVE") return item.status === "ACTIVE";
    if (historyFilter === "RESOLVED") return item.status === "RESOLVED";
    return item.type === historyFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse text-amber-400" /> Phase 9 Engine Active
              </span>
              <span className="text-xs text-slate-400 font-mono">Dynamic Event Management System</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Events & Incidents Control Center</h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Inject dynamic physical road hazards into the simulator. Every event alters actual NetworkX graphs, road capacities, vehicle density, and signal timings in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={handleClearAll}
              disabled={loading || summary.active_events.length === 0}
              className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-mono font-semibold rounded-xl border border-red-800/80 transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Events
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Active Incidents</span>
            <span className={`text-base font-mono font-bold ${summary.active_events.length > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
              {summary.active_events.length}
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">NetworkX Closed Links</span>
            <span className={`text-base font-mono font-bold ${summary.closed_edges.length > 0 ? "text-red-400 font-extrabold" : "text-slate-400"}`}>
              {summary.closed_edges.length} {summary.closed_edges.length > 0 ? `(${summary.closed_edges.join(", ")})` : ""}
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Event History</span>
            <span className="text-base font-mono font-bold text-cyan-400">{summary.event_history.length}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Simulation Physical Sync</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> REAL-TIME
            </span>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className="mt-4 p-3 bg-cyan-950/70 border border-cyan-700/60 rounded-xl text-xs font-mono text-cyan-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">×</button>
          </div>
        )}
      </div>

      {/* 2. Interactive Event Trigger Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: Sudden Congestion */}
        <div className="bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> ⚠ Congestion
              </span>
              <span className="text-[10px] font-mono text-slate-400">Phase 9.1</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sudden Congestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Injects queue surge (+45 vehicles) and forces density to CRITICAL at target intersection. Recalculates congestion and triggers adaptive signal timing.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Target Intersection:</label>
                <select
                  value={congestionTarget}
                  onChange={(e) => setCongestionTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {INTERSECTIONS.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-amber-300/90 space-y-1">
                <div className="flex justify-between"><span>Density Surge:</span> <span className="font-bold text-amber-400">CRITICAL</span></div>
                <div className="flex justify-between"><span>Queue Addition:</span> <span className="font-bold text-amber-400">+45 vehicles</span></div>
                <div className="flex justify-between"><span>Signal Action:</span> <span className="font-bold text-cyan-400">Adaptive Re-calc</span></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerCongestion}
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-900/30 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" /> Trigger Congestion Surge
          </button>
        </div>

        {/* CARD 2: Accident */}
        <div className="bg-slate-900 border border-orange-500/30 hover:border-orange-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-orange-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-orange-950 text-orange-300 border border-orange-800 text-xs font-mono font-bold flex items-center gap-1.5">
                <Construction className="w-3.5 h-3.5 text-orange-400" /> 🚧 Accident
              </span>
              <span className="text-[10px] font-mono text-slate-400">Phase 9.2</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Vehicle Accident</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Restricts physical road capacity on selected road link or intersection. (e.g. 85 veh/min ➔ 15-30 veh/min) and updates vehicle flow.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Target Road Link / Hub:</label>
                <select
                  value={accidentTarget}
                  onChange={(e) => setAccidentTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <optgroup label="Road Links">
                    {ROADS.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Intersections">
                    {INTERSECTIONS.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Accident Severity:</label>
                <select
                  value={accidentSeverity}
                  onChange={(e) => setAccidentSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="LOW">LOW (Capacity -30%)</option>
                  <option value="MEDIUM">MEDIUM (Capacity -50%)</option>
                  <option value="HIGH">HIGH (Capacity -70%)</option>
                  <option value="CRITICAL">CRITICAL (Capacity -85% ➔ 15 vpm)</option>
                </select>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-orange-300/90 space-y-1">
                <div className="flex justify-between"><span>Standard Capacity:</span> <span>85 veh/min</span></div>
                <div className="flex justify-between"><span>Reduced Capacity:</span> <span className="font-bold text-orange-400">
                  {accidentSeverity === "CRITICAL" ? "15" : accidentSeverity === "HIGH" ? "25" : accidentSeverity === "MEDIUM" ? "42" : "60"} veh/min
                </span></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerAccident}
            disabled={loading}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-orange-900/30 disabled:opacity-50"
          >
            <Construction className="w-4 h-4" /> Report Accident Incident
          </button>
        </div>

        {/* CARD 3: Road Closure */}
        <div className="bg-slate-900 border border-red-500/30 hover:border-red-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-red-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-red-950 text-red-300 border border-red-800 text-xs font-mono font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-400" /> ⛔ Road Closure
              </span>
              <span className="text-[10px] font-mono text-slate-400">Phase 9.3</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Road Closure</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Disables selected road completely (Capacity = 0). Removes edge from NetworkX graph, forcing routing engine to recalculate alternate paths.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Road Link to Close:</label>
                <select
                  value={closureTarget}
                  onChange={(e) => setClosureTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                >
                  {ROADS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-red-300/90 space-y-1">
                <div className="flex justify-between"><span>Physical Capacity:</span> <span className="font-bold text-red-400">0 veh/min (DISABLED)</span></div>
                <div className="flex justify-between"><span>NetworkX Graph:</span> <span className="font-bold text-red-400">Edge Removed</span></div>
                <div className="flex justify-between"><span>Routing Action:</span> <span className="font-bold text-cyan-400">Auto Reroute</span></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerClosure}
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-900/30 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Close Selected Road
          </button>
        </div>

        {/* CARD 4: Emergency Green Corridor */}
        <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-emerald-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> 🚑 Emergency
              </span>
              <span className="text-[10px] font-mono text-slate-400">Phase 9.4</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Green Corridor</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Launches Emergency Green Corridor preemption. Sets route signals to continuous GREEN and clears conflicting queues.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Vehicle ID:</label>
                  <input
                    type="text"
                    value={emergencyVehicleId}
                    onChange={(e) => setEmergencyVehicleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Type:</label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="FIRE_TRUCK">Fire Truck</option>
                    <option value="POLICE">Police</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Start Hub:</label>
                  <select
                    value={emergencyStart}
                    onChange={(e) => setEmergencyStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    {INTERSECTIONS.map((i) => (
                      <option key={i.id} value={i.id}>{i.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Destination:</label>
                  <select
                    value={emergencyDest}
                    onChange={(e) => setEmergencyDest(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    {INTERSECTIONS.map((i) => (
                      <option key={i.id} value={i.id}>{i.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerEmergency}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 disabled:opacity-50 mt-2"
          >
            <Siren className="w-4 h-4" /> Launch Green Corridor
          </button>
        </div>
      </div>

      {/* 3. Active Dynamic Events Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Active Simulation Incidents</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {summary.active_events.length} Active
            </span>
          </div>
          {summary.closed_edges.length > 0 && (
            <span className="text-xs font-mono text-red-400 bg-red-950/60 border border-red-800/60 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> NetworkX Closed Link(s): {summary.closed_edges.join(", ")}
            </span>
          )}
        </div>

        {summary.active_events.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <p className="text-sm text-slate-300 font-medium">Network Operating Normally</p>
            <p className="text-xs text-slate-500 font-mono">No active congestion, accidents, closures, or emergency corridors present.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.active_events.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{evt.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        evt.type === "ROAD_CLOSURE"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : evt.type === "ACCIDENT"
                          ? "bg-orange-950 text-orange-300 border border-orange-800"
                          : evt.type === "CONGESTION"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {evt.type}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {evt.type === "ROAD_CLOSURE" && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {evt.type === "ACCIDENT" && <Construction className="w-4 h-4 text-orange-400 shrink-0" />}
                    {evt.type === "CONGESTION" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {evt.type === "EMERGENCY" && <Siren className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />}
                    <span>Target: {evt.target_name || evt.target_id}</span>
                  </h4>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {evt.details}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] font-mono text-slate-500 flex justify-between">
                    <span>Started: {evt.start_time}</span>
                    <span className="text-amber-400 font-semibold">{evt.severity}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveEvent(evt.id)}
                  disabled={loading}
                  className="w-full mt-3 py-2 bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-200 text-xs font-mono font-bold rounded-lg border border-slate-700 hover:border-emerald-700 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve & Restore Capacity
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Event History Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Event History Log</h2>
            <p className="text-xs text-slate-400">Complete historical record of triggered dynamic events and resolutions.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {["ALL", "ACTIVE", "RESOLVED", "CONGESTION", "ACCIDENT", "ROAD_CLOSURE", "EMERGENCY"].map((tag) => (
              <button
                key={tag}
                onClick={() => setHistoryFilter(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  historyFilter === tag
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Event ID</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Target Location</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Start Time</th>
                <th className="p-3.5">End Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Physical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No historical events recorded for filter filter: "{historyFilter}"
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 text-cyan-400 font-bold">{item.id}</td>
                    <td className="p-3.5 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.type === "ROAD_CLOSURE" ? "bg-red-950 text-red-300 border border-red-800" :
                        item.type === "ACCIDENT" ? "bg-orange-950 text-orange-300 border border-orange-800" :
                        item.type === "CONGESTION" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                        "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-200">{item.target_name || item.target_id}</td>
                    <td className="p-3.5">
                      <span className={`font-semibold ${
                        item.severity === "CRITICAL" ? "text-red-400" :
                        item.severity === "HIGH" ? "text-orange-400" : "text-amber-400"
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{item.start_time}</td>
                    <td className="p-3.5 text-slate-400">{item.end_time || "—"}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "ACTIVE"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-[11px] text-slate-400 max-w-xs truncate" title={item.details}>
                      {item.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

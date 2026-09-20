import React, { useState, useEffect } from "react";
import {
  Siren,
  Shield,
  CheckCircle2,
  AlertOctagon,
  Zap,
  ArrowRight,
  Navigation,
  Flame,
  ShieldAlert,
  Play,
  CheckCheck,
  RotateCcw,
  MapPin,
  Activity,
  Clock,
  Radio,
  Car,
  Compass,
  Check,
  RotateCw,
} from "lucide-react";
import { ApiService } from "../services/api";
import { EmergencyCorridor } from "../types";

interface EmergencyCorridorPageProps {
  corridors: EmergencyCorridor[];
  onRefresh: () => void;
}

export const EmergencyCorridorPage: React.FC<EmergencyCorridorPageProps> = ({
  corridors,
  onRefresh,
}) => {
  // Form State
  const [vehicleId, setVehicleId] = useState<string>("EV-001");
  const [emergencyType, setEmergencyType] = useState<"Ambulance" | "Fire Truck" | "Police">("Ambulance");
  const [startLocation, setStartLocation] = useState<string>("I6");
  const [destination, setDestination] = useState<string>("I2");
  const [priority, setPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM">("CRITICAL");
  const [algorithm, setAlgorithm] = useState<"dijkstra" | "astar">("dijkstra");

  // Dynamic Emergency Engine State
  const [emergencyStatus, setEmergencyStatus] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Intersection Metadata for Map & Selection
  const INTERSECTION_OPTIONS = [
    { id: "I1", name: "Central Junction", lat: 37.7833, lon: -122.408, x: 500, y: 300 },
    { id: "I2", name: "North Junction", lat: 37.7915, lon: -122.408, x: 500, y: 120 },
    { id: "I3", name: "East Junction", lat: 37.7885, lon: -122.398, x: 740, y: 200 },
    { id: "I4", name: "South Junction", lat: 37.775, lon: -122.408, x: 500, y: 480 },
    { id: "I5", name: "West Junction", lat: 37.7833, lon: -122.4185, x: 240, y: 300 },
    { id: "I6", name: "Hospital Junction", lat: 37.7685, lon: -122.405, x: 500, y: 640 },
  ];

  // Fetch current emergency preemption status on mount & poll every 2 seconds when active
  useEffect(() => {
    fetchEmergencyStatus();
    const interval = setInterval(() => {
      fetchEmergencyStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmergencyStatus = async () => {
    try {
      const status = await ApiService.getEmergencyStatus();
      setEmergencyStatus(status);
    } catch (err) {
      console.warn("Failed to fetch emergency status:", err);
    }
  };

  // 1. Action: CREATE EMERGENCY (POST /api/emergency/create)
  const handleCreateEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setToastMessage(null);

    try {
      const res = await ApiService.createEmergency({
        vehicle_id: vehicleId,
        emergency_type: emergencyType,
        start_location: startLocation,
        destination: destination,
        priority: priority,
        algorithm: algorithm,
      });

      setEmergencyStatus(res);
      setToastMessage(`Emergency ${vehicleId} created! Dynamic NetworkX shortest route calculated.`);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to create emergency:", err);
      setToastMessage(`Error: ${err.message || "Failed to create emergency"}`);
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Action: ACTIVATE GREEN CORRIDOR (POST /api/emergency/activate)
  const handleActivateEmergency = async () => {
    setIsActivating(true);
    setToastMessage(null);

    try {
      const res = await ApiService.activateEmergency({
        vehicle_id: vehicleId,
        emergency_type: emergencyType,
        start_location: startLocation,
        destination: destination,
        priority: priority,
      });

      setEmergencyStatus(res);
      setToastMessage(`GREEN CORRIDOR PREEMPTION ACTIVATED! Signals along route locked in Green Phase.`);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to activate emergency:", err);
      setToastMessage(`Error: ${err.message || "Failed to activate green corridor"}`);
    } finally {
      setIsActivating(false);
    }
  };

  // 3. Action: COMPLETE EMERGENCY & RESTORE NORMAL OPTIMIZATION (POST /api/emergency/complete)
  const handleCompleteEmergency = async () => {
    setIsCompleting(true);
    setToastMessage(null);

    try {
      const res = await ApiService.completeEmergency();
      setEmergencyStatus(res.emergency_status || null);
      setToastMessage("Emergency completed! Preemption unlocked and normal signal optimization restored.");
      onRefresh();
    } catch (err: any) {
      console.error("Failed to complete emergency:", err);
      setToastMessage(`Error: ${err.message || "Failed to complete emergency"}`);
    } finally {
      setIsCompleting(false);
    }
  };

  // Emergency vehicle emoji indicator
  const getVehicleEmoji = (type: string) => {
    switch (type) {
      case "Fire Truck":
        return "🚒";
      case "Police":
        return "🚓";
      default:
        return "🚑";
    }
  };

  const routeList: string[] = emergencyStatus?.route || ["I6", "I4", "I1", "I2"];
  const isPreemptionActive = emergencyStatus?.active || emergencyStatus?.status === "ACTIVE" || emergencyStatus?.status === "IN_TRANSIT";

  // Compute position for animated vehicle icon on SVG Map
  const progressPct = emergencyStatus?.progress_pct || 0.0;
  const currentStepIdx = emergencyStatus?.current_step_index || 0;
  const currentJunctionId = emergencyStatus?.current_intersection || routeList[0] || "I6";

  const getJunctionCoords = (id: string) => {
    const item = INTERSECTION_OPTIONS.find((n) => n.id === id);
    return item ? { x: item.x, y: item.y } : { x: 500, y: 640 };
  };

  // Calculate animated position along route segments
  const currNode = getJunctionCoords(routeList[minMaxIdx(currentStepIdx, 0, routeList.length - 1)]);
  const nextNode = getJunctionCoords(routeList[minMaxIdx(currentStepIdx + 1, 0, routeList.length - 1)]);
  const animX = currNode.x + (nextNode.x - currNode.x) * 0.3;
  const animY = currNode.y + (nextNode.y - currNode.y) * 0.3;

  function minMaxIdx(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto font-sans">
      {/* 1. Header Banner & Status Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 animate-pulse" />
                Phase 8 Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                NetworkX Dijkstra / A* Routing
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              EMERGENCY GREEN CORRIDOR MANAGEMENT
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Dynamically calculates optimal emergency routes using NetworkX, locks arterial traffic signals in continuous Green Hold phases, prevents orthogonal signal conflicts, and restores normal optimization after vehicle transit.
            </p>
          </div>

          {/* Preemption Status Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${
                isPreemptionActive
                  ? "bg-red-950/80 border-red-500 text-red-300 shadow-md shadow-red-950/40"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  isPreemptionActive ? "bg-red-500 animate-ping" : "bg-slate-600"
                }`}
              />
              <div className="text-left">
                <div className="text-[10px] uppercase text-slate-400">Green Wave Status</div>
                <div className="font-bold">
                  {isPreemptionActive ? "PREEMPTION ACTIVE (LOCKED)" : "STANDBY (READY)"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3 bg-slate-950 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-mono flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Grid: Creation Form & Emergency Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Emergency Creation Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-400" />
              Emergency Vehicle Dispatch Form
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              NetworkX Router
            </span>
          </div>

          <form onSubmit={handleCreateEmergency} className="space-y-4 text-xs font-mono">
            {/* Field 1: Vehicle ID */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">VEHICLE ID</label>
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="e.g. EV-001"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Field 2: Emergency Type */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">EMERGENCY TYPE</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Ambulance", "Fire Truck", "Police"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEmergencyType(type)}
                    className={`py-2 px-2 rounded-lg text-center font-bold border transition flex items-center justify-center gap-1 ${
                      emergencyType === type
                        ? type === "Ambulance"
                          ? "bg-red-950 text-red-300 border-red-600 shadow-sm"
                          : type === "Fire Truck"
                          ? "bg-amber-950 text-amber-300 border-amber-600 shadow-sm"
                          : "bg-blue-950 text-blue-300 border-blue-600 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span>{getVehicleEmoji(type)}</span>
                    <span className="text-[11px]">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Start & Destination Locations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">START LOCATION</label>
                <select
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {INTERSECTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id} - {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">DESTINATION</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {INTERSECTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id} - {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 4: Priority & Routing Algorithm */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">PRIORITY CLASS</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-red-400 font-bold focus:outline-none focus:border-red-500"
                >
                  <option value="CRITICAL">CRITICAL (Priority 1)</option>
                  <option value="HIGH">HIGH (Priority 2)</option>
                  <option value="MEDIUM">MEDIUM (Priority 3)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">ROUTING ALGORITHM</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="dijkstra">NetworkX Dijkstra</option>
                  <option value="astar">NetworkX A* Search</option>
                </select>
              </div>
            </div>

            {/* Form Submit Button */}
            <button
              type="submit"
              disabled={isCreating || isActivating}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
                  Calculating NetworkX Route...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  CALCULATE SHORTEST ROUTE (POST /api/emergency/create)
                </>
              )}
            </button>
          </form>

          {/* Primary Preemption Control Action Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <button
              id="btn-activate-green-corridor"
              onClick={handleActivateEmergency}
              disabled={isActivating || isCompleting}
              className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2.5 shadow-lg ${
                isActivating
                  ? "bg-red-800 text-red-200 cursor-not-allowed"
                  : isPreemptionActive
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 ring-2 ring-red-400/50"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 cursor-pointer"
              }`}
            >
              {isActivating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Locking Green Corridor Signals...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  ACTIVATE GREEN CORRIDOR (POST /api/emergency/activate)
                </>
              )}
            </button>

            <button
              id="btn-complete-emergency"
              onClick={handleCompleteEmergency}
              disabled={isCompleting || isActivating}
              className="w-full py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-bold text-xs uppercase tracking-wider transition border border-emerald-800/80 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCompleting ? (
                <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <CheckCheck className="w-4 h-4 text-emerald-400" />
              )}
              COMPLETE EMERGENCY &amp; RESTORE NORMAL TRAFFIC
            </button>
          </div>
        </div>

        {/* Right Column: Emergency Dashboard & Route Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Emergency Telemetry Dashboard Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-red-400 font-bold tracking-wider block">
                  Live Dispatch Telemetry
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Emergency Status Dashboard
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`px-3 py-1 rounded-full font-bold border ${
                    isPreemptionActive
                      ? "bg-red-950 text-red-300 border-red-700 animate-pulse"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  STATUS: {emergencyStatus?.status || "STANDBY"}
                </span>
              </div>
            </div>

            {/* Dashboard 5 KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              {/* KPI 1: Vehicle ID */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">DISPATCH VEHICLE</span>
                <span className="text-white font-bold text-base mt-0.5 flex items-center gap-1.5">
                  <span>{getVehicleEmoji(emergencyStatus?.emergency_type || emergencyType)}</span>
                  <span>{emergencyStatus?.vehicle_id || vehicleId}</span>
                </span>
                <span className="text-[10px] text-red-400 mt-0.5 block">
                  {emergencyStatus?.priority || priority} PRIORITY
                </span>
              </div>

              {/* KPI 2: Current Location */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CURRENT LOCATION</span>
                <span className="text-cyan-300 font-bold text-base mt-0.5 block truncate">
                  {currentJunctionId}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  {emergencyStatus?.current_intersection_name || "Hospital Junction"}
                </span>
              </div>

              {/* KPI 3: Distance Remaining */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">DISTANCE REMAINING</span>
                <span className="text-amber-300 font-bold text-base mt-0.5 block">
                  {emergencyStatus?.distance_remaining_km !== undefined ? `${emergencyStatus.distance_remaining_km} km` : "2.9 km"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Total: {emergencyStatus?.distance_km || 2.9} km
                </span>
              </div>

              {/* KPI 4: ETA */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ESTIMATED ETA</span>
                <span className="text-emerald-400 font-bold text-base mt-0.5 block">
                  {emergencyStatus?.eta_seconds ? `${Math.round(emergencyStatus.eta_seconds)}s` : "113s"}
                </span>
                <span className="text-[10px] text-emerald-300 mt-0.5 block">
                  {emergencyStatus?.algorithm_used || "NetworkX DIJKSTRA"}
                </span>
              </div>
            </div>

            {/* Route Sequence & Signals Prepared Indicator */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  DYNAMIC ROUTE SEQUENCE (NetworkX):
                </span>
                <span className="text-emerald-400 font-bold">
                  {emergencyStatus?.signals_prepared || routeList.length} Signals Prepared
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                {routeList.map((nodeId: string, idx: number) => {
                  const isCurrent = currentJunctionId === nodeId;
                  return (
                    <React.Fragment key={nodeId}>
                      <div
                        className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 whitespace-nowrap ${
                          isCurrent
                            ? "bg-red-950 border-red-500 text-red-200 font-bold ring-2 ring-red-500/50"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        {isCurrent && <span>{getVehicleEmoji(emergencyType)}</span>}
                        <span>{nodeId}</span>
                      </div>
                      {idx < routeList.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Signals Prepared Preemption List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Affected Intersection Signal Preemptions
              </h4>
              <span className="text-[10px] text-slate-400">
                Green Corridor Hold Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(emergencyStatus?.affected_intersections || [
                { id: "I6", name: "Hospital Junction", preemption: "GREEN_HOLD", signal_phase: "North-South GREEN" },
                { id: "I4", name: "South Junction", preemption: "GREEN_HOLD", signal_phase: "North-South GREEN" },
                { id: "I1", name: "Central Junction", preemption: "GREEN_HOLD", signal_phase: "North-South GREEN" },
                { id: "I2", name: "North Junction", preemption: "GREEN_HOLD", signal_phase: "North-South GREEN" },
              ]).map((item: any) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    isPreemptionActive
                      ? "bg-red-950/30 border-red-800/80 text-red-200"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                        {item.id}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Phase: {item.signal_phase}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPreemptionActive
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {isPreemptionActive ? "GREEN HOLD" : "STANDBY"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Map & Animation Corridor Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" />
              Live Emergency Route &amp; Animated Vehicle Traversal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualization of preemption corridor animation: 🚑 → I6 → I4 → I1 → I2
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Preemption Corridor
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              Normal Grid
            </span>
          </div>
        </div>

        {/* SVG Topology & Vehicle Animation Canvas */}
        <div className="w-full h-80 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 1000 750" className="w-full h-full">
            {/* Background Grid Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="750" fill="url(#grid)" opacity="0.4" />

            {/* Road Links between Junctions */}
            <line x1="500" y1="640" x2="500" y2="480" stroke={isPreemptionActive ? "#ef4444" : "#334155"} strokeWidth={isPreemptionActive ? 6 : 3} strokeDasharray={isPreemptionActive ? "8 4" : undefined} />
            <line x1="500" y1="480" x2="500" y2="300" stroke={isPreemptionActive ? "#ef4444" : "#334155"} strokeWidth={isPreemptionActive ? 6 : 3} strokeDasharray={isPreemptionActive ? "8 4" : undefined} />
            <line x1="500" y1="300" x2="500" y2="120" stroke={isPreemptionActive ? "#ef4444" : "#334155"} strokeWidth={isPreemptionActive ? 6 : 3} strokeDasharray={isPreemptionActive ? "8 4" : undefined} />

            <line x1="500" y1="300" x2="240" y2="300" stroke="#334155" strokeWidth="3" />
            <line x1="500" y1="300" x2="740" y2="200" stroke="#334155" strokeWidth="3" />
            <line x1="740" y1="200" x2="500" y2="120" stroke="#334155" strokeWidth="3" />
            <line x1="500" y1="480" x2="240" y2="300" stroke="#334155" strokeWidth="3" />

            {/* Junction Nodes */}
            {INTERSECTION_OPTIONS.map((node) => {
              const isOnRoute = routeList.includes(node.id);
              const isCurrent = currentJunctionId === node.id;

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={isCurrent ? 24 : isOnRoute ? 20 : 16}
                    fill={isCurrent ? "#991b1b" : isOnRoute ? "#0f172a" : "#020617"}
                    stroke={isCurrent ? "#ef4444" : isOnRoute ? "#22d3ee" : "#475569"}
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  <text
                    y="5"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.id}
                  </text>
                  <text
                    y="34"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}

            {/* Animated Emergency Vehicle Badge */}
            {isPreemptionActive && (
              <g transform={`translate(${animX}, ${animY})`}>
                <circle r="22" fill="#ef4444" opacity="0.3" className="animate-ping" />
                <circle r="18" fill="#7f1d1d" stroke="#f87171" strokeWidth="2" />
                <text y="5" textAnchor="middle" fontSize="16">
                  {getVehicleEmoji(emergencyType)}
                </text>
              </g>
            )}
          </svg>

          {/* Overlay Status Box */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl text-xs font-mono space-y-1">
            <div className="text-slate-400 text-[10px] font-bold uppercase">CORRIDOR ANIMATION STATE</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span>{getVehicleEmoji(emergencyType)}</span>
              <span>{routeList.join(" → ")}</span>
            </div>
            <div className="text-emerald-400">
              ETA: {emergencyStatus?.eta_seconds ? `${Math.round(emergencyStatus.eta_seconds)}s` : "113s"} | Rem: {emergencyStatus?.distance_remaining_km || 2.9} km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

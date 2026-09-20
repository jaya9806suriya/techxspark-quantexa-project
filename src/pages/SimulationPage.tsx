import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Clock,
  Car,
  Activity,
  Fuel,
  CloudRain,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useTrafficSimulation } from "../services/useTrafficSimulation";
import { TrafficIntensity, SimulationSpeed } from "../types";

export const SimulationPage: React.FC = () => {
  const {
    status,
    kpis,
    intersections,
    roads,
    history,
    isRunning,
    speedMultiplier,
    intensity,
    customRate,
    simTime,
    stepCount,
    isConnected,
    connectionMode,
    error,
    start,
    pause,
    reset,
    setSpeed,
    setIntensity,
  } = useTrafficSimulation();

  const [customInputValue, setCustomInputValue] = useState<number>(customRate || 60);

  const speedOptions: SimulationSpeed[] = [1, 2, 5, 10];
  const intensityOptions: TrafficIntensity[] = ["LOW", "MEDIUM", "HIGH", "CUSTOM"];

  const handleIntensityChange = (newIntensity: TrafficIntensity) => {
    if (newIntensity === "CUSTOM") {
      setIntensity("CUSTOM", customInputValue);
    } else {
      setIntensity(newIntensity);
    }
  };

  const handleCustomRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntensity("CUSTOM", customInputValue);
  };

  // Congestion color badge
  const getCongestionBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-950/80 text-rose-300 border-rose-700";
      case "HIGH":
        return "bg-amber-950/80 text-amber-300 border-amber-700";
      case "MEDIUM":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-700";
      default:
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700";
    }
  };

  const getSignalBadge = (phase: string) => {
    if (phase.includes("GREEN")) {
      return {
        bg: "bg-emerald-950/70 border-emerald-500/60 text-emerald-300",
        dot: "bg-emerald-400 animate-pulse",
        text: "GREEN SIGNAL",
      };
    }
    if (phase.includes("YELLOW")) {
      return {
        bg: "bg-amber-950/70 border-amber-500/60 text-amber-300",
        dot: "bg-amber-400 animate-pulse",
        text: "YELLOW SIGNAL",
      };
    }
    return {
      bg: "bg-rose-950/70 border-rose-500/60 text-rose-300",
      dot: "bg-rose-400",
      text: "RED SIGNAL",
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Simulation Command Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                id="sim-pause-btn"
                onClick={pause}
                className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" /> PAUSE SIMULATION
              </button>
            ) : (
              <button
                id="sim-start-btn"
                onClick={start}
                className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> START SIMULATION
              </button>
            )}

            <button
              id="sim-reset-btn"
              onClick={reset}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> RESET
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-medium px-2">Speed:</span>
            {speedOptions.map((s) => (
              <button
                key={s}
                id={`sim-speed-${s}x`}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  speedMultiplier === s
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Connection Mode & Simulation Step Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className="font-mono text-slate-300 uppercase">
                {connectionMode === "websocket"
                  ? "WS /ws/traffic"
                  : connectionMode.toUpperCase()}
              </span>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300">
              Time: <strong>{simTime.toFixed(1)}s</strong> (Step #{stepCount})
            </div>
          </div>
        </div>

        {/* Traffic Generation: Configurable Intensity */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mr-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Traffic Generation Intensity:
            </span>
            {intensityOptions.map((opt) => (
              <button
                key={opt}
                id={`sim-intensity-${opt.toLowerCase()}`}
                onClick={() => handleIntensityChange(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  intensity === opt
                    ? opt === "HIGH"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/60"
                      : opt === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/60"
                      : opt === "LOW"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/60"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {opt}
                {opt === "LOW" && " (~20 vpm)"}
                {opt === "MEDIUM" && " (~60 vpm)"}
                {opt === "HIGH" && " (~140 vpm - Over capacity)"}
              </button>
            ))}
          </div>

          {intensity === "CUSTOM" && (
            <form onSubmit={handleCustomRateSubmit} className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Spawn rate:</span>
              <input
                type="number"
                min="10"
                max="250"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(Number(e.target.value))}
                className="w-20 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-400">veh/min</span>
              <button
                type="submit"
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded font-semibold text-xs transition"
              >
                Apply
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Average Waiting Time */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">Average Waiting Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.average_waiting_time}s` : "42.5s"}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            {intensity === "HIGH" ? (
              <span className="text-rose-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Queuing delay rising
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> Stabilized
              </span>
            )}
          </div>
        </div>

        {/* 2. Queue Length */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">Total Queue Length</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.total_queue_length}` : "219"}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">veh</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isRunning ? (
              <span className="text-cyan-400">Live dynamic count</span>
            ) : (
              <span>Engine paused</span>
            )}
          </div>
        </div>

        {/* 3. Traffic Throughput */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">Traffic Throughput</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.traffic_throughput}` : "284.0"}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">vpm</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">Discharge rate</div>
        </div>

        {/* 4. Average Speed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">Average Speed</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.average_speed}` : "36.8"}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">km/h</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Corridor average</div>
        </div>

        {/* 5. Fuel Consumption */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">Fuel Consumption</span>
            <Fuel className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.fuel_consumption}` : "142.6"}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">L</span>
          </div>
          <div className="text-[11px] text-purple-400 font-mono">Transit + Idling</div>
        </div>

        {/* 6. CO2 Estimate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">CO2 Estimate</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {kpis ? `${kpis.co2_estimate}` : "329.4"}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">kg</span>
          </div>
          <div className="text-[11px] text-rose-400 font-mono">2.31 kg CO2 / L</div>
        </div>
      </div>

      {/* Real-Time Intersections Micro-Status (6 Intersections: I1 to I6) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Car className="w-4 h-4 text-cyan-400" />
              Real-Time Intersection Dynamics (6 Connected Nodes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live signal progression, approach queue accumulation during Red, and discharge during Green.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            6/6 Intersections Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {intersections.map((inter) => {
            const signalInfo = getSignalBadge(inter.current_signal_phase);
            const isGreen = inter.current_signal_phase.includes("GREEN");
            const capacityPercent = Math.min(100, Math.round((inter.queue_length / inter.road_capacity) * 100));

            return (
              <div
                key={inter.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-mono font-bold text-xs">
                      {inter.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{inter.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cap: {inter.road_capacity} vpm
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${getCongestionBadge(
                      inter.congestion_level
                    )}`}
                  >
                    {inter.congestion_level}
                  </span>
                </div>

                {/* Live Signal Phase Banner */}
                <div
                  className={`px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs font-mono ${signalInfo.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${signalInfo.dot}`} />
                    <span className="font-semibold">{inter.current_signal_phase}</span>
                  </div>
                  <span className="text-[10px] opacity-80 font-sans">
                    {isGreen ? "DISCHARGING" : "HOLDING"}
                  </span>
                </div>

                {/* Queue & Capacity Utilization Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Queue Length:</span>
                    <span className="font-mono font-bold text-slate-100 flex items-center gap-1">
                      {inter.queue_length} vehicles
                      {isGreen ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          (↓ Green clearing)
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-semibold">
                          (↑ Queuing)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        capacityPercent > 75
                          ? "bg-rose-500"
                          : capacityPercent > 50
                          ? "bg-amber-500"
                          : "bg-cyan-500"
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Utilization: {capacityPercent}%</span>
                    <span>Speed: {inter.average_speed} km/h</span>
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Signal Cycle:{" "}
                    <strong className="text-slate-300">
                      {inter.green_time}s G / {inter.yellow_time}s Y / {inter.red_time}s R
                    </strong>
                  </div>
                  <div className="text-right text-slate-400">
                    Pedestrians: <strong className="text-cyan-300">{inter.pedestrian_count}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Dynamic Charts: Queue & Throughput History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue & Throughput Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Dynamic Queue vs. Throughput Trend
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Live Rolling Stream
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="queueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="thruGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="queue_length"
                  name="Queue (vehicles)"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#queueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="throughput"
                  name="Throughput (vpm)"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#thruGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed & Emissions Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Corridor Average Speed & Accumulated CO2
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Micro-Calculations
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="speed"
                  name="Speed (km/h)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="co2"
                  name="Total CO2 (kg)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

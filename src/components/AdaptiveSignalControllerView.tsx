import React, { useState, useEffect } from "react";
import {
  DetailedTrafficSignal,
  SignalComparisonSummary,
  SignalControlMode,
  SignalsTelemetryResponse,
} from "../types";
import { ApiService } from "../services/api";
import { AnimatedTrafficLight } from "./AnimatedTrafficLight";
import {
  Cpu,
  Sliders,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  Car,
  Users,
  Gauge,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Layers,
  Fuel,
  Leaf,
  Info,
} from "lucide-react";

interface AdaptiveSignalControllerViewProps {
  onSignalUpdated?: () => void;
}

export const AdaptiveSignalControllerView: React.FC<AdaptiveSignalControllerViewProps> = ({
  onSignalUpdated,
}) => {
  const [telemetry, setTelemetry] = useState<SignalsTelemetryResponse | null>(null);
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string>("I1");
  const [loading, setLoading] = useState<boolean>(true);
  const [modeSwitching, setModeSwitching] = useState<boolean>(false);
  const [showDualHeads, setShowDualHeads] = useState<boolean>(true);

  // Manual configuration inputs
  const [manualGreen, setManualGreen] = useState<number>(35);
  const [manualYellow, setManualYellow] = useState<number>(4);
  const [manualAllRed, setManualAllRed] = useState<number>(2);
  const [overrideAll, setOverrideAll] = useState<boolean>(true);

  const fetchSignals = async () => {
    try {
      const data = await ApiService.getSignalsTelemetry();
      setTelemetry(data);
    } catch (e) {
      console.error("Failed to load signal telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = async (newMode: SignalControlMode) => {
    setModeSwitching(true);
    try {
      if (newMode === "ADAPTIVE") {
        const res = await ApiService.setAdaptiveSignals(overrideAll ? undefined : selectedIntersectionId);
        setTelemetry(res);
      } else {
        const res = await ApiService.setManualSignals({
          intersection_id: overrideAll ? undefined : selectedIntersectionId,
          green_time: manualGreen,
          yellow_time: manualYellow,
          all_red_time: manualAllRed,
        });
        setTelemetry(res);
      }
      onSignalUpdated?.();
    } catch (e) {
      console.error("Error switching signal mode:", e);
    } finally {
      setModeSwitching(false);
    }
  };

  const handleApplyManualTiming = async () => {
    setModeSwitching(true);
    try {
      const res = await ApiService.setManualSignals({
        intersection_id: overrideAll ? undefined : selectedIntersectionId,
        green_time: manualGreen,
        yellow_time: manualYellow,
        all_red_time: manualAllRed,
      });
      setTelemetry(res);
      onSignalUpdated?.();
    } catch (e) {
      console.error("Error setting manual timings:", e);
    } finally {
      setModeSwitching(false);
    }
  };

  const signals = telemetry?.signals || [];
  const activeIntersection =
    signals.find((s) => s.id === selectedIntersectionId) || signals[0];
  const comparison = telemetry?.comparison;
  const currentMode = telemetry?.mode || "ADAPTIVE";

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MODE CONTROLS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Adaptive Traffic Signal Control
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                      currentMode === "ADAPTIVE"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {currentMode} MODE ACTIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic queue-based green timing with strict orthogonal safety conflict clearance.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
            <button
              id="btn-mode-adaptive"
              onClick={() => handleToggleMode("ADAPTIVE")}
              disabled={modeSwitching}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentMode === "ADAPTIVE"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Adaptive Timing
            </button>

            <button
              id="btn-mode-fixed"
              onClick={() => handleToggleMode("FIXED")}
              disabled={modeSwitching}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentMode === "FIXED"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Fixed Timing (Manual)
            </button>
          </div>
        </div>

        {/* Orthogonal Conflict Prevention Safety Guarantee Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Conflict Shield ACTIVE: Orthogonal directions (N-S & E-W) are hardware-isolated. Never green simultaneously.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Green: 10s–60s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Yellow: 3s–5s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>All Red Clearance: 2s</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPARATIVE PERFORMANCE BENCHMARK (Fixed vs. Adaptive) */}
      {comparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">
                Performance Evaluation: Fixed vs. Adaptive Control
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Live Empirical Network Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Average Waiting Time */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Avg Waiting Time</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.waiting_time.toFixed(1)}s
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.waiting_time.toFixed(1)}s
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{comparison.improvement.waiting_time_reduction_pct}% wait</span>
              </div>
            </div>

            {/* Total Queue Length */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Total Queue</span>
                <Car className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.queue_length} <span className="text-xs font-normal text-slate-400">veh</span>
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.queue_length} veh
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{comparison.improvement.queue_reduction_pct}% queue</span>
              </div>
            </div>

            {/* Network Throughput */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Throughput</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.throughput.toFixed(0)} <span className="text-xs font-normal text-slate-400">vpm</span>
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.throughput.toFixed(0)} vpm
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{comparison.improvement.throughput_gain_pct}% throughput</span>
              </div>
            </div>

            {/* Average Speed */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Network Speed</span>
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.average_speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.average_speed.toFixed(1)} km/h
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{comparison.improvement.speed_gain_pct}% speed</span>
              </div>
            </div>

            {/* CO2 Emissions */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>CO2 Emissions</span>
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.co2.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.co2.toFixed(1)} kg
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{comparison.improvement.co2_reduction_pct}% CO2</span>
              </div>
            </div>

            {/* Fuel Consumption */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Fuel Consumed</span>
                <Fuel className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="my-2">
                <div className="text-lg font-bold text-slate-100">
                  {comparison.adaptive.fuel.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
                </div>
                <div className="text-[11px] text-slate-400 line-through">
                  Fixed: {comparison.fixed.fuel.toFixed(1)} L
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{comparison.improvement.fuel_reduction_pct}% fuel</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 6-INTERSECTION LIVE ANIMATED TRAFFIC LIGHTS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Live Animated Signals</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              (All 6 Intersections)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDualHeads(!showDualHeads)}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              {showDualHeads ? "Show Single Head" : "Show Dual (N-S / E-W)"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {signals.map((sig) => {
            const isSelected = sig.id === selectedIntersectionId;
            return (
              <div
                key={sig.id}
                id={`signal-card-${sig.id}`}
                onClick={() => setSelectedIntersectionId(sig.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                {/* Intersection Header */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {sig.id}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      sig.congestion_level === "CRITICAL"
                        ? "bg-red-500/20 text-red-300"
                        : sig.congestion_level === "HIGH"
                        ? "bg-amber-500/20 text-amber-300"
                        : sig.congestion_level === "MEDIUM"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {sig.congestion_level}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-200 text-center truncate w-full mb-2">
                  {sig.name}
                </div>

                {/* Animated Light Head */}
                <div className="my-1">
                  <AnimatedTrafficLight
                    id={`light-${sig.id}`}
                    lightStatus={sig.light_status}
                    lightStatusNs={sig.light_status_ns}
                    lightStatusEw={sig.light_status_ew}
                    currentPhase={sig.current_signal_phase}
                    remainingTimeSec={sig.remaining_time_sec}
                    phaseTotalDuration={sig.phase_total_duration}
                    size="sm"
                    showDualHeads={showDualHeads}
                    showCountdown={true}
                  />
                </div>

                {/* Queue & Timing Stats */}
                <div className="w-full mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Queue:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {sig.queue_length} veh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Phase:</span>
                    <span className="font-mono font-medium text-cyan-300 truncate max-w-[90px]">
                      {sig.current_signal_phase.replace("North-South", "N-S").replace("East-West", "E-W")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Green Time:</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {sig.green_time}s {currentMode === "ADAPTIVE" && "(opt)"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DETAILED INTERSECTION INSPECTOR & RULE-BASED ADAPTIVE CONTROLLER LOGIC */}
      {activeIntersection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Focused Animated Traffic Light & Signal State Machine */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {activeIntersection.id}
                </span>
                <h4 className="text-base font-bold text-slate-100 mt-1">
                  {activeIntersection.name}
                </h4>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Active Phase</div>
                <div className="text-sm font-mono font-bold text-cyan-300">
                  {activeIntersection.current_signal_phase}
                </div>
              </div>
            </div>

            {/* Prominent Animated Dual Heads Display */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 my-2 shadow-inner">
              <AnimatedTrafficLight
                id={`focus-light-${activeIntersection.id}`}
                lightStatus={activeIntersection.light_status}
                lightStatusNs={activeIntersection.light_status_ns}
                lightStatusEw={activeIntersection.light_status_ew}
                currentPhase={activeIntersection.current_signal_phase}
                remainingTimeSec={activeIntersection.remaining_time_sec}
                phaseTotalDuration={activeIntersection.phase_total_duration}
                size="lg"
                showDualHeads={true}
                showCountdown={true}
              />
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Elapsed: {activeIntersection.phase_elapsed_sec}s</span>
                <span className="text-cyan-400 font-bold">Remaining: {activeIntersection.remaining_time_sec}s</span>
                <span className="text-slate-400">Total: {activeIntersection.phase_total_duration}s</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (activeIntersection.phase_elapsed_sec /
                          Math.max(1, activeIntersection.phase_total_duration)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Conflict Safety Guarantee Box */}
            <div className="w-full mt-4 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Conflict Prevention Guard: </span>
                {activeIntersection.current_signal_phase.includes("North-South")
                  ? "East-West corridor is locked in RED state."
                  : activeIntersection.current_signal_phase.includes("East-West")
                  ? "North-South corridor is locked in RED state."
                  : "All corridors in RED clearance state."}
              </div>
            </div>
          </div>

          {/* Middle Column: Adaptive Input Telemetry & Rule Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Adaptive Controller Inputs
              </h4>
              <span className="text-xs text-cyan-400 font-mono">
                Rule Engine
              </span>
            </div>

            {/* 7 Core Inputs Specified in Requirements */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">1. Queue Length</div>
                <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                  {activeIntersection.queue_length} <span className="text-xs font-normal text-slate-400">veh</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">2. Vehicle Density</div>
                <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
                  {activeIntersection.vehicle_density}
                </div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">3. Road Capacity</div>
                <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                  {activeIntersection.road_capacity} <span className="text-xs font-normal text-slate-400">vpm</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">4. Average Speed</div>
                <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                  {activeIntersection.average_speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">5. Pedestrian Demand</div>
                <div className="text-base font-mono font-bold text-amber-300 mt-0.5">
                  {activeIntersection.pedestrian_count} <span className="text-xs font-normal text-slate-400">peds</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">6. Current Phase</div>
                <div className="text-xs font-mono font-semibold text-emerald-300 mt-1 truncate">
                  {activeIntersection.current_signal_phase.replace("North-South", "N-S").replace("East-West", "E-W")}
                </div>
              </div>
            </div>

            {/* Rule Engine Execution Breakdown */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Green-Time Rule Logic</span>
                <span className="text-emerald-400 font-mono">
                  {activeIntersection.green_time}s Selected
                </span>
              </div>

              <div className="text-[11px] space-y-1.5 text-slate-300">
                <div
                  className={`flex justify-between p-1.5 rounded ${
                    activeIntersection.queue_length > 50
                      ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400"
                  }`}
                >
                  <span>Queue &gt; 50:</span>
                  <span>Base Green = 50 sec</span>
                </div>
                <div
                  className={`flex justify-between p-1.5 rounded ${
                    activeIntersection.queue_length >= 30 && activeIntersection.queue_length <= 50
                      ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400"
                  }`}
                >
                  <span>Queue 30–50:</span>
                  <span>Base Green = 40 sec</span>
                </div>
                <div
                  className={`flex justify-between p-1.5 rounded ${
                    activeIntersection.queue_length >= 15 && activeIntersection.queue_length < 30
                      ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400"
                  }`}
                >
                  <span>Queue 15–30:</span>
                  <span>Base Green = 30 sec</span>
                </div>
                <div
                  className={`flex justify-between p-1.5 rounded ${
                    activeIntersection.queue_length < 15
                      ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400"
                  }`}
                >
                  <span>Queue &lt; 15:</span>
                  <span>Base Green = 20 sec</span>
                </div>
              </div>

              {activeIntersection.adaptive_recommendation?.rationale && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-medium">Applied Logic: </span>
                  {activeIntersection.adaptive_recommendation.rationale}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Signal Mode Control & Timing Overrides */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Manual Timing Mode Settings
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  Phase 4 Control
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Switch to fixed signal intervals or tune individual parameters for calibrated experiments.
              </p>

              {/* Scope Selector */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  Configuration Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOverrideAll(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      overrideAll
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All 6 Intersections
                  </button>
                  <button
                    onClick={() => setOverrideAll(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      !overrideAll
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Only {activeIntersection.id}
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Green Time (sec)</span>
                    <span className="font-mono font-bold text-emerald-400">{manualGreen}s</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={manualGreen}
                    onChange={(e) => setManualGreen(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Min: 10s</span>
                    <span>Max: 60s</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Yellow Time (sec)</span>
                    <span className="font-mono font-bold text-amber-400">{manualYellow}s</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="6"
                    step="1"
                    value={manualYellow}
                    onChange={(e) => setManualYellow(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Min: 3s</span>
                    <span>Max: 6s</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">All Red Clearance (sec)</span>
                    <span className="font-mono font-bold text-red-400">{manualAllRed}s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={manualAllRed}
                    onChange={(e) => setManualAllRed(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Min: 1s</span>
                    <span>Max: 4s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApplyManualTiming}
                disabled={modeSwitching}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                Apply Fixed Timings ({overrideAll ? "Network-wide" : activeIntersection.id})
              </button>

              <button
                onClick={() => handleToggleMode("ADAPTIVE")}
                disabled={modeSwitching || currentMode === "ADAPTIVE"}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${
                  currentMode === "ADAPTIVE"
                    ? "bg-slate-950 text-slate-500 border-slate-800 cursor-not-allowed"
                    : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Return to Adaptive Controller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

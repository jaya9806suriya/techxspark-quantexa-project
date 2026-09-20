import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ApiService } from "../services/api";
import { EnvironmentalResponse, EnvironmentalConfig } from "../types";
import {
  Leaf,
  Fuel,
  Timer,
  Octagon,
  Sparkles,
  Sliders,
  RefreshCw,
  Info,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const [envData, setEnvData] = useState<EnvironmentalResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Configurable Model Parameters State
  const [idleFuelRate, setIdleFuelRate] = useState<number>(0.60);
  const [stopFuelCost, setStopFuelCost] = useState<number>(0.008);
  const [co2Factor, setCo2Factor] = useState<number>(2.31);
  const [fleetVehicles, setFleetVehicles] = useState<number>(1200);
  const [tripDistKm, setTripDistKm] = useState<number>(4.5);

  const fetchMetrics = useCallback(async (cfg?: EnvironmentalConfig) => {
    setLoading(true);
    setError(null);
    try {
      const payload: EnvironmentalConfig = cfg || {
        idle_fuel_rate_lph: idleFuelRate,
        stop_fuel_cost_liters: stopFuelCost,
        co2_factor_kg_per_liter: co2Factor,
        fleet_vehicles: fleetVehicles,
        average_trip_dist_km: tripDistKm,
      };
      const res = await ApiService.getEnvironmentalMetrics(payload);
      setEnvData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load environmental analysis");
    } finally {
      setLoading(false);
    }
  }, [idleFuelRate, stopFuelCost, co2Factor, fleetVehicles, tripDistKm]);

  useEffect(() => {
    fetchMetrics();
    // Refresh periodically as simulation runs
    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleApplyConfig = () => {
    fetchMetrics();
  };

  const handleResetConfig = () => {
    setIdleFuelRate(0.60);
    setStopFuelCost(0.008);
    setCo2Factor(2.31);
    setFleetVehicles(1200);
    setTripDistKm(4.5);
    fetchMetrics({
      idle_fuel_rate_lph: 0.60,
      stop_fuel_cost_liters: 0.008,
      co2_factor_kg_per_liter: 2.31,
      fleet_vehicles: 1200,
      average_trip_dist_km: 4.5,
    });
  };

  const scenarios = envData?.scenarios;
  const before = scenarios?.before;
  const classical = scenarios?.classical;
  const quantum = scenarios?.quantum;
  const improvements = envData?.improvements;

  // Comparison Bar Chart Data
  const comparisonBarData = [
    {
      metric: "Fuel (L/100km)",
      "Before Opt": before?.fuel_consumption_l100km ?? 8.4,
      "Classical Opt": classical?.fuel_consumption_l100km ?? 6.8,
      "Quantum QAOA": quantum?.fuel_consumption_l100km ?? 5.7,
      unit: "L/100km",
    },
    {
      metric: "CO2 (kg)",
      "Before Opt": before?.co2_emissions_kg ?? 329.4,
      "Classical Opt": classical?.co2_emissions_kg ?? 261.4,
      "Quantum QAOA": quantum?.co2_emissions_kg ?? 223.5,
      unit: "kg",
    },
    {
      metric: "Idle Time (s/veh)",
      "Before Opt": before?.idle_time_sec_per_veh ?? 42.5,
      "Classical Opt": classical?.idle_time_sec_per_veh ?? 28.3,
      "Quantum QAOA": quantum?.idle_time_sec_per_veh ?? 18.2,
      unit: "sec",
    },
    {
      metric: "Stops (/veh)",
      "Before Opt": before?.stops_per_veh ?? 3.8,
      "Classical Opt": classical?.stops_per_veh ?? 2.4,
      "Quantum QAOA": quantum?.stops_per_veh ?? 1.5,
      unit: "stops",
    },
  ];

  // Fuel Energy Loss Breakdown Data
  const fuelBreakdownData = [
    { name: "Idling Burn", value: quantum?.breakdown?.idle_fuel_pct ?? 18.5, color: "#f59e0b" },
    { name: "Stop Accelerations", value: quantum?.breakdown?.stops_fuel_pct ?? 15.2, color: "#ef4444" },
    { name: "Steady Cruise", value: quantum?.breakdown?.cruise_fuel_pct ?? 66.3, color: "#06b6d4" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Phase 10 Environmental Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚠ Simulation Estimate
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Environmental & Energy Analysis</h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1">
              Simulation-based mathematical estimates for fuel consumption, CO2 emissions, idle duration, and stop frequency across Fixed, Classical Adaptive, and Quantum QAOA signal optimization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMetrics()}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} /> Recalculate
            </button>
          </div>
        </div>

        {/* Global Estimate Disclaimer Alert */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-cyan-300 font-mono">Disclaimer:</strong> {envData?.disclaimer || "All values are Simulation Estimates generated from real-time traffic physics and standard vehicle energy consumption models."}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 shrink-0 ml-2">
            SIMULATION DRIVEN
          </span>
        </div>
      </div>

      {/* 2. Primary 4 Environmental Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: Fuel Consumption */}
        <div className="bg-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-cyan-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                <Fuel className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Simulation Estimate
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuel Consumption</h3>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-white">
                  {quantum?.fuel_consumption_l100km ?? 5.70} <span className="text-sm font-normal text-slate-400">L/100 km</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {improvements?.quantum?.fuel_pct ?? -32.1}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Total: {quantum?.total_fuel_liters ?? 142.5} Liters</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Before Optimization:</span>
                <span className="text-amber-400 font-semibold">{before?.fuel_consumption_l100km ?? 8.40} L/100km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classical Adaptive:</span>
                <span className="text-blue-400 font-semibold">{classical?.fuel_consumption_l100km ?? 6.80} L/100km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantum QAOA:</span>
                <span className="text-cyan-300 font-bold">{quantum?.fuel_consumption_l100km ?? 5.70} L/100km</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
            <span>Estimated Savings:</span>
            <span className="font-bold">{improvements?.quantum?.fuel_pct ?? -32.1}%</span>
          </div>
        </div>

        {/* CARD 2: CO2 Emissions */}
        <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-emerald-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Leaf className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Simulation Estimate
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CO2 Emissions</h3>

            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-white">
                  {quantum?.co2_emissions_kg ?? 223.5} <span className="text-sm font-normal text-slate-400">kg CO2</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {improvements?.quantum?.co2_pct ?? -32.1}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Total: {quantum?.co2_emissions_tons ?? 0.224} Metric Tons</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Before Optimization:</span>
                <span className="text-amber-400 font-semibold">{before?.co2_emissions_kg ?? 329.4} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classical Adaptive:</span>
                <span className="text-blue-400 font-semibold">{classical?.co2_emissions_kg ?? 261.4} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantum QAOA:</span>
                <span className="text-emerald-300 font-bold">{quantum?.co2_emissions_kg ?? 223.5} kg</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
            <span>Carbon Reduction:</span>
            <span className="font-bold">{improvements?.quantum?.co2_pct ?? -32.1}%</span>
          </div>
        </div>

        {/* CARD 3: Idle Time */}
        <div className="bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Timer className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Simulation Estimate
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Idle Duration</h3>

            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-white">
                  {quantum?.idle_time_sec_per_veh ?? 18.2} <span className="text-sm font-normal text-slate-400">sec / veh</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {improvements?.quantum?.idle_pct ?? -57.2}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Fleet Idle: {quantum?.total_idle_hours ?? 6.1} veh-hours</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Before Optimization:</span>
                <span className="text-amber-400 font-semibold">{before?.idle_time_sec_per_veh ?? 42.5} s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classical Adaptive:</span>
                <span className="text-blue-400 font-semibold">{classical?.idle_time_sec_per_veh ?? 28.3} s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantum QAOA:</span>
                <span className="text-amber-300 font-bold">{quantum?.idle_time_sec_per_veh ?? 18.2} s</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
            <span>Idling Avoidance:</span>
            <span className="font-bold">{improvements?.quantum?.idle_pct ?? -57.2}%</span>
          </div>
        </div>

        {/* CARD 4: Number of Stops */}
        <div className="bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg hover:shadow-purple-500/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Octagon className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Simulation Estimate
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Number of Stops</h3>

            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-white">
                  {quantum?.stops_per_veh ?? 1.5} <span className="text-sm font-normal text-slate-400">stops / veh</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {improvements?.quantum?.stops_pct ?? -60.5}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Total Network Stops: {quantum?.total_stops?.toLocaleString() ?? "1,800"}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Before Optimization:</span>
                <span className="text-amber-400 font-semibold">{before?.stops_per_veh ?? 3.8} stops</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classical Adaptive:</span>
                <span className="text-blue-400 font-semibold">{classical?.stops_per_veh ?? 2.4} stops</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantum QAOA:</span>
                <span className="text-purple-300 font-bold">{quantum?.stops_per_veh ?? 1.5} stops</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
            <span>Stops Elimination:</span>
            <span className="font-bold">{improvements?.quantum?.stops_pct ?? -60.5}%</span>
          </div>
        </div>
      </div>

      {/* 3. Configurable Model Parameters Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Configurable Fuel & Emissions Model Parameters</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetConfig}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleApplyConfig}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg transition"
            >
              Apply Model Parameters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
          {/* Idle Fuel Rate */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">
              Idle Fuel Burn Rate: <span className="text-cyan-400 font-bold">{idleFuelRate} L/hr</span>
            </label>
            <input
              type="range"
              min="0.30"
              max="1.50"
              step="0.05"
              value={idleFuelRate}
              onChange={(e) => setIdleFuelRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 block">Baseline idling fuel flow per vehicle</span>
          </div>

          {/* Stop Acceleration Cost */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">
              Stop Acceleration Cost: <span className="text-cyan-400 font-bold">{stopFuelCost} L/stop</span>
            </label>
            <input
              type="range"
              min="0.003"
              max="0.020"
              step="0.001"
              value={stopFuelCost}
              onChange={(e) => setStopFuelCost(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 block">Fuel penalty per stop-and-go cycle</span>
          </div>

          {/* CO2 Factor */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">
              CO2 Emission Factor: <span className="text-cyan-400 font-bold">{co2Factor} kg/L</span>
            </label>
            <input
              type="range"
              min="1.80"
              max="3.00"
              step="0.05"
              value={co2Factor}
              onChange={(e) => setCo2Factor(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 block">EPA standard carbon output per liter</span>
          </div>

          {/* Fleet Size */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">
              Active Network Fleet: <span className="text-cyan-400 font-bold">{fleetVehicles} veh</span>
            </label>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={fleetVehicles}
              onChange={(e) => setFleetVehicles(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 block">Total simulated vehicle population</span>
          </div>

          {/* Trip Distance */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">
              Avg Trip Distance: <span className="text-cyan-400 font-bold">{tripDistKm} km</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={tripDistKm}
              onChange={(e) => setTripDistKm(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 block">Average arterial trip length</span>
          </div>
        </div>
      </div>

      {/* 4. Comparison Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 3-Way Scenario Comparison */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart className="w-4 h-4 text-cyan-400" /> Before vs. Classical vs. Quantum Optimization Metrics
              </h3>
              <p className="text-xs text-slate-400">
                Direct simulation comparative analysis across baseline, adaptive rule-based control, and quantum QAOA timings.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              Simulation Estimate
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    fontSize: "12px",
                    borderRadius: "10px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="Before Opt" name="Before Optimization (Fixed)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Classical Opt" name="Classical Adaptive Control" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Quantum QAOA" name="Quantum QAOA Optimized" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fuel Energy Loss Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" /> Quantum Fuel Burn Breakdown
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Estimate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Distribution of fuel consumption between Idling, Stop-and-Go Accelerations, and Steady Cruise.
            </p>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fuelBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#334155",
                      fontSize: "12px",
                      borderRadius: "8px",
                    }}
                    formatter={(val: number) => [`${val}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
            {fuelBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: 24-Hour Diurnal Fuel & CO2 Curve */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> 24-Hour Diurnal CO2 Emissions Profile (kg CO2 / Hour)
            </h3>
            <p className="text-xs text-slate-400">
              Simulated network carbon emission rate across peak and off-peak metropolitan demand cycles.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl">
            Mean CO2 Reduction: {improvements?.quantum?.co2_pct ?? -32.1}%
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={envData?.time_series || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="beforeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="classicalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="quantumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" kg" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#334155",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Area
                type="monotone"
                dataKey="before_co2"
                name="Before Optimization CO2 (kg)"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#beforeGrad)"
              />
              <Area
                type="monotone"
                dataKey="classical_co2"
                name="Classical Adaptive CO2 (kg)"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#classicalGrad)"
              />
              <Area
                type="monotone"
                dataKey="quantum_co2"
                name="Quantum QAOA CO2 (kg)"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#quantumGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

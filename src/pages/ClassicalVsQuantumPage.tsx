import React, { useState, useEffect, useCallback } from "react";
import {
  GitCompare,
  Play,
  RefreshCw,
  Zap,
  Info,
  CheckCircle2,
  BarChart2,
  Activity,
  Award,
  Layers,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ApiService } from "../services/api";
import { ThreeMethodComparisonResponse } from "../types";
import { TechTermTooltip } from "../components/TechTermTooltip";

export const ClassicalVsQuantumPage: React.FC = () => {
  const [data, setData] = useState<ThreeMethodComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // User-configurable scenario parameters
  const [intensity, setIntensity] = useState<string>("MEDIUM");
  const [durationSec, setDurationSec] = useState<number>(60);
  const [pSteps, setPSteps] = useState<number>(2);

  const runBenchmark = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.runThreeMethodComparison({
        duration_sec: durationSec,
        intensity: intensity,
        p_steps: pSteps,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute 3-method comparison benchmark");
    } finally {
      setLoading(false);
    }
  }, [durationSec, intensity, pSteps]);

  useEffect(() => {
    runBenchmark();
  }, [runBenchmark]);

  const metricsTable = data?.metrics_table || [];
  const timeline = data?.timeline || [];
  const radarData = data?.radar_data || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-cyan-400" /> Phase 11 Comparison Framework
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Simulation Results
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Classical vs. Quantum 3-Method Benchmark</h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1">
              Executes three control strategies under strictly identical traffic demand, road network topology, initial queue states, and arrival seeds to measure empirical performance gains neutrally.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runBenchmark}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Running Benchmark...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run 3-Method Comparison
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Scenario Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Traffic Demand Scenario:</label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="LOW">LOW Demand (Off-Peak)</option>
              <option value="MEDIUM">MEDIUM Demand (Balanced)</option>
              <option value="HIGH">HIGH Demand (Arterial Congestion)</option>
              <option value="CUSTOM">RUSH_HOUR Surge (Heavy Gridlock)</option>
            </select>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Benchmark Duration:</label>
            <select
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={30}>30 Seconds (Quick Check)</option>
              <option value={60}>60 Seconds (Standard Run)</option>
              <option value={120}>120 Seconds (Extended Cycle)</option>
            </select>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <label className="text-[10px] font-mono text-slate-400 block mb-1">QAOA Layers (p):</label>
            <select
              value={pSteps}
              onChange={(e) => setPSteps(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={1}>p = 1 Layer (Fast)</option>
              <option value={2}>p = 2 Layers (Balanced)</option>
              <option value={3}>p = 3 Layers (High Depth)</option>
            </select>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[10px] font-mono text-slate-400">Simulation Status</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Identical Seed & Topology
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs font-mono text-red-300">
            Error: {error}
          </div>
        )}
      </div>

      {/* 2. Primary 8-Metric Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Simulation Results
              </span>
              <h2 className="text-lg font-bold text-white">Comprehensive 8-Metric Comparison Ledger</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct side-by-side empirical measurements under identical initial conditions.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            3 Control Strategies Evaluated
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Metric</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5 text-amber-400 font-bold">1. Fixed Timing</th>
                <th className="p-3.5 text-blue-400 font-bold">2. Rule-Based Adaptive</th>
                <th className="p-3.5 text-cyan-400 font-bold">3. Hybrid Quantum-Classical</th>
                <th className="p-3.5 text-right text-emerald-400">Quantum Gain vs Fixed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {metricsTable.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{row.metric}</span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">{row.unit}</td>
                  <td className="p-3.5 font-bold text-amber-300/90">{row.fixed}</td>
                  <td className="p-3.5 font-bold text-blue-300/90">{row.adaptive}</td>
                  <td className="p-3.5 font-bold text-cyan-300">{row.quantum}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400">
                    {row.quantum_imp_pct > 0 ? `+${row.quantum_imp_pct}%` : `${row.quantum_imp_pct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Bar Chart Metric Comparison */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> 3-Way Comparative Bar Chart
              </h3>
              <p className="text-xs text-slate-400">
                Key performance metric comparison across Fixed, Adaptive, and Quantum control.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              Simulation Results
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsTable.slice(0, 5)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <Bar dataKey="fixed" name="Fixed Timing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adaptive" name="Rule-Based Adaptive" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quantum" name="Hybrid Quantum-Classical" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Multi-Axis Radar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Performance Radar Envelope
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Score (0-100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Normalized multi-dimensional performance coverage across all 8 optimization axes.
            </p>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={75} data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  <Radar name="Fixed" dataKey="Fixed" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Radar name="Adaptive" dataKey="Adaptive" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Radar name="Quantum" dataKey="Quantum" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Chart C: Timeline Line Chart Progression */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Waiting Time Progression (Seconds)
            </h3>
            <p className="text-xs text-slate-400">
              Comparative average queue delay progression over elapsed simulation seconds.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl">
            Simulation Results
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time_sec" stroke="#94a3b8" fontSize={11} unit="s" />
              <YAxis stroke="#94a3b8" fontSize={11} unit="s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#334155",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line type="monotone" dataKey="fixed_wait" name="Fixed Timing Delay" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="adaptive_wait" name="Adaptive Control Delay" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="quantum_wait" name="Hybrid Quantum QAOA Delay" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Neutral Performance Findings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Neutral Empirical Observations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 font-mono pt-2">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">1. Fixed Timing Baseline</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Static green signal cycles cause queue accumulation during non-uniform arrival surges, yielding higher delays and stops.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-blue-400 font-bold block">2. Rule-Based Adaptive</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Local queue heuristics dynamically extend green splits, providing solid queue relief without combinatorial phase optimization.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">3. Hybrid Quantum-Classical</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              QAOA formulation explores grid phase conflict matrices to minimize total network energy loss and delay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

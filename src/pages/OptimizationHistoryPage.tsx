import React from "react";
import { OptimizationRun } from "../types";
import { History, RefreshCw, Cpu, CheckCircle2 } from "lucide-react";

interface OptimizationHistoryPageProps {
  history: OptimizationRun[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const OptimizationHistoryPage: React.FC<OptimizationHistoryPageProps> = ({
  history,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Quantum & Classical Run Audit Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Immutable database records of executed variational circuits and traffic plan deployments.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          Sync from SQLite
        </button>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Backend</th>
                <th className="px-4 py-3">Qubits</th>
                <th className="px-4 py-3">Depth</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Cost Energy</th>
                <th className="px-4 py-3">Congestion Cut</th>
                <th className="px-4 py-3">CO2 Offset</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
              {history.map((run) => (
                <tr key={run.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-cyan-400">{run.id}</td>
                  <td className="px-4 py-3 text-slate-400">{run.timestamp}</td>
                  <td className="px-4 py-3 text-slate-200 font-sans font-semibold">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      {run.algorithm}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{run.backend_name}</td>
                  <td className="px-4 py-3 text-purple-300">{run.qubits_used} Q</td>
                  <td className="px-4 py-3 text-slate-300">p={run.circuit_depth}</td>
                  <td className="px-4 py-3 text-slate-300">{run.execution_time_ms} ms</td>
                  <td className="px-4 py-3 text-cyan-300">{run.cost_value.toFixed(1)}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    +{run.congestion_reduction_pct}%
                  </td>
                  <td className="px-4 py-3 text-emerald-300">{run.co2_saved_kg} kg</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

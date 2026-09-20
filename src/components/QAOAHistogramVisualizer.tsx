import React from "react";
import { BarChart3, Crown, CheckCircle2, AlertTriangle, Hash, Sparkles } from "lucide-react";
import { QAOAHilbertCandidate } from "../types";

interface QAOAHistogramVisualizerProps {
  topCandidates: QAOAHilbertCandidate[];
  bestBitstring: string;
  shots: number;
  bestObjective: number;
}

export const QAOAHistogramVisualizer: React.FC<QAOAHistogramVisualizerProps> = ({
  topCandidates,
  bestBitstring,
  shots,
  bestObjective,
}) => {
  if (!topCandidates || topCandidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-xs font-mono">
        No measurement histogram available yet. Run QAOA optimization to collect quantum state measurements.
      </div>
    );
  }

  const maxCount = Math.max(...topCandidates.map((c) => c.count), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Quantum Measurement Distribution (Top Bitstrings)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sampled {shots} projective measurement shots on computational basis |x&rang; &isin; &#123;0, 1&#125;<sup>n</sup>
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
            Optimal State (x*)
          </span>
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block"></span>
            Other Basis States
          </span>
        </div>
      </div>

      {/* Histogram Bars List */}
      <div className="space-y-2.5 font-mono text-xs">
        {topCandidates.map((candidate, idx) => {
          const isBest = candidate.bitstring === bestBitstring;
          const percentage = ((candidate.count / shots) * 100).toFixed(1);
          const barWidth = Math.max(4, Math.round((candidate.count / maxCount) * 100));

          return (
            <div
              key={candidate.bitstring}
              className={`p-2.5 rounded-lg border transition-all ${
                isBest
                  ? "bg-emerald-950/40 border-emerald-700/80 ring-1 ring-emerald-500/40"
                  : "bg-slate-950 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] w-4">#{idx + 1}</span>
                  <span
                    className={`font-bold tracking-wider text-sm ${
                      isBest ? "text-emerald-300 flex items-center gap-1" : "text-slate-200"
                    }`}
                  >
                    |{candidate.bitstring}&rang;
                    {isBest && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" />}
                  </span>
                  {isBest && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                      Best Bitstring (Min Energy)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">
                    <span className="text-slate-200 font-bold">{candidate.count}</span> / {shots}{" "}
                    <span className="text-slate-500">({percentage}%)</span>
                  </span>
                  <span
                    className={`font-bold ${
                      isBest ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    E = {candidate.objective_value.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBest
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                      : "bg-slate-700"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Summary Strip */}
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>
            Optimal Variational Assignment:{" "}
            <span className="text-emerald-300 font-bold">|{bestBitstring}&rang;</span>
          </span>
        </div>
        <div className="text-slate-400 text-right">
          Global Min Objective Cost:{" "}
          <span className="text-cyan-400 font-bold">{bestObjective.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

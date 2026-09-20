import React, { useState } from "react";
import { Table, Eye, Hash, Activity } from "lucide-react";
import { QUBOVariable, QUBOIsingRepresentation } from "../types";

interface QUBOMatrixVisualizerProps {
  qMatrix: number[][];
  variables: QUBOVariable[];
  constantOffset: number;
  ising: QUBOIsingRepresentation;
  optimalSolution?: {
    binary_vector: number[];
    minimum_energy: number;
    selected_ns: string;
    selected_ew: string;
  };
}

export const QUBOMatrixVisualizer: React.FC<QUBOMatrixVisualizerProps> = ({
  qMatrix,
  variables,
  constantOffset,
  ising,
  optimalSolution,
}) => {
  const [viewTab, setViewTab] = useState<"heatmap" | "table" | "ising">("heatmap");
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    val: number;
    varRow: QUBOVariable;
    varCol: QUBOVariable;
  } | null>(null);

  const n = qMatrix?.length || 0;

  // Compute min and max values for color scaling (excluding extreme zeroes)
  let minVal = 0;
  let maxVal = 0;
  if (qMatrix && qMatrix.length > 0) {
    qMatrix.forEach((row, i) => {
      row.forEach((val, j) => {
        if (j >= i) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      });
    });
  }

  // Get background color intensity for a matrix element
  const getCellBg = (val: number, isDiag: boolean, isUpper: boolean) => {
    if (!isUpper) return "bg-slate-950/40 text-slate-700 border-slate-900";
    if (Math.abs(val) < 1e-4) return "bg-slate-900/60 text-slate-500 border-slate-800/80";

    if (val > 0) {
      const ratio = Math.min(1, val / (maxVal || 1));
      if (ratio > 0.6) return "bg-rose-950/80 text-rose-200 border-rose-800 font-semibold";
      if (ratio > 0.3) return "bg-rose-950/40 text-rose-300 border-rose-900/80";
      return "bg-amber-950/40 text-amber-300 border-amber-900/60";
    } else {
      const ratio = Math.min(1, Math.abs(val) / (Math.abs(minVal) || 1));
      if (ratio > 0.5) return "bg-cyan-950/90 text-cyan-200 border-cyan-700 font-semibold";
      return "bg-cyan-950/40 text-cyan-300 border-cyan-900/80";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header with View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            QUBO Matrix Q & Energy Landscape
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cost(x) = x<sup>T</sup> Q x + {constantOffset.toFixed(2)} &nbsp;|&nbsp; n = {n} binary decision variables
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewTab("heatmap")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              viewTab === "heatmap"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Heatmap Grid
          </button>
          <button
            onClick={() => setViewTab("table")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              viewTab === "table"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Numerical Table
          </button>
          <button
            onClick={() => setViewTab("ising")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              viewTab === "ising"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Ising Transform
          </button>
        </div>
      </div>

      {/* Heatmap Visualizer */}
      {viewTab === "heatmap" && (
        <div className="space-y-3">
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-500 text-[10px] w-12"></th>
                    {variables.map((v, j) => (
                      <th
                        key={v.id}
                        className="p-2 text-center text-slate-400 font-semibold border-b border-slate-800 text-[11px]"
                      >
                        <div className="text-cyan-400 font-bold">{v.id}</div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[85px]">{v.duration_sec}s</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qMatrix.map((row, i) => {
                    const rowVar = variables[i];
                    return (
                      <tr key={rowVar?.id || i}>
                        {/* Row Header */}
                        <td className="p-2 text-slate-300 font-semibold border-r border-slate-800 whitespace-nowrap bg-slate-950/40">
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-400 font-bold">{rowVar?.id}</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              ({rowVar?.direction_code}-{rowVar?.duration_sec}s)
                            </span>
                          </div>
                        </td>

                        {/* Cells */}
                        {row.map((val, j) => {
                          const colVar = variables[j];
                          const isUpper = j >= i;
                          const isDiag = i === j;
                          const bgClasses = getCellBg(val, isDiag, isUpper);

                          return (
                            <td
                              key={j}
                              onMouseEnter={() => {
                                if (isUpper && rowVar && colVar) {
                                  setHoveredCell({ row: i, col: j, val, varRow: rowVar, varCol: colVar });
                                }
                              }}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-2.5 text-center border transition-all cursor-pointer select-none ${bgClasses} ${
                                hoveredCell?.row === i && hoveredCell?.col === j
                                  ? "ring-2 ring-cyan-400 scale-105 z-10"
                                  : ""
                              }`}
                            >
                              <span className="text-[11px] font-mono">
                                {isUpper ? val.toFixed(1) : "-"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hovered Cell Detail Card */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono min-h-[50px] flex items-center justify-between">
            {hoveredCell ? (
              <div className="flex flex-wrap items-center gap-4 text-slate-200">
                <span className="text-cyan-400 font-bold">
                  Q[{hoveredCell.varRow.id}, {hoveredCell.varCol.id}] = {hoveredCell.val.toFixed(3)}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {hoveredCell.row === hoveredCell.col ? (
                    <span className="text-emerald-400 font-semibold">
                      Linear Objective + Self-Constraint Bias for ({hoveredCell.varRow.name})
                    </span>
                  ) : (
                    <span className="text-purple-400 font-semibold">
                      Quadratic Coupling between ({hoveredCell.varRow.name}) and ({hoveredCell.varCol.name})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px]">
                Hover over any cell Q[i, j] in the matrix above to view exact quadratic term and physical coupling details.
              </span>
            )}

            {/* Matrix Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block"></span> Negative (Favorable)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-700 inline-block"></span> Positive Penalty
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Numerical Table View */}
      {viewTab === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-slate-800">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-2.5 border-b border-slate-800">Term (i, j)</th>
                <th className="p-2.5 border-b border-slate-800">Decision Variable Pair</th>
                <th className="p-2.5 border-b border-slate-800">Weight Q_ij</th>
                <th className="p-2.5 border-b border-slate-800">Physical Traffic Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {qMatrix.flatMap((row, i) =>
                row
                  .map((val, j) => {
                    if (j < i || Math.abs(val) < 1e-4) return null;
                    const v1 = variables[i];
                    const v2 = variables[j];
                    const isDiag = i === j;
                    return (
                      <tr key={`${i}-${j}`} className="hover:bg-slate-950/60 transition">
                        <td className="p-2.5 text-cyan-400 font-bold">
                          ({v1?.id}, {v2?.id})
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {isDiag ? v1?.name : `${v1?.name} ↔ ${v2?.name}`}
                        </td>
                        <td
                          className={`p-2.5 font-bold ${
                            val > 0 ? "text-rose-400" : "text-cyan-400"
                          }`}
                        >
                          {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px]">
                          {isDiag
                            ? "Linear objective cost (Waiting + Queue + Fuel) minus one-hot relaxation"
                            : v1?.direction === v2?.direction
                            ? "Mutual exclusion penalty: cannot select two durations for same corridor"
                            : "Cross-corridor cycle length coordination & conflict coupling"}
                        </td>
                      </tr>
                    );
                  })
                  .filter(Boolean)
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ising Model View */}
      {viewTab === "ising" && (
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 space-y-1">
            <div className="text-cyan-400 font-semibold text-sm">// Transformed Ising Hamiltonian H(s)</div>
            <div className="text-slate-400 text-[11px]">
              Mapping: x<sub>i</sub> = (s<sub>i</sub> + 1) / 2 &nbsp;&nbsp;with spin variables s<sub>i</sub> &isin; &#123;-1, +1&#125;
            </div>
            <div className="text-purple-300 pt-1 font-bold">
              {ising?.ising_equation || "H(s) = sum_i h_i * s_i + sum_{i<j} J_ij * s_i * s_j + offset"}
            </div>
            <div className="text-emerald-400 text-[11px] pt-1">
              Ising Energy Offset: {ising?.offset?.toFixed(3)} &nbsp;|&nbsp; Active Spins: {ising?.num_spins || n}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linear Biases h_i */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>Linear Spin Biases (h<sub>i</sub>)</span>
                <span className="text-[10px] text-cyan-400">Local Fields</span>
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {ising?.h?.map((hVal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded border border-slate-800/80 text-[11px]"
                  >
                    <span className="text-slate-300">
                      s<sub>{idx + 1}</sub> ({variables[idx]?.id})
                    </span>
                    <span
                      className={`font-bold ${
                        hVal < 0 ? "text-cyan-400" : "text-amber-400"
                      }`}
                    >
                      {hVal.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Couplings J_ij */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>Spin-Spin Couplings (J<sub>ij</sub>)</span>
                <span className="text-[10px] text-purple-400">Exchange Interactions</span>
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {ising?.J && Object.entries(ising.J).length > 0 ? (
                  Object.entries(ising.J).map(([pair, jVal]) => (
                    <div
                      key={pair}
                      className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded border border-slate-800/80 text-[11px]"
                    >
                      <span className="text-slate-300">J{pair}</span>
                      <span
                        className={`font-bold ${
                          jVal > 0 ? "text-rose-400" : "text-cyan-400"
                        }`}
                      >
                        {jVal.toFixed(3)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-[11px] p-2">No active couplings.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimal Ground State Summary Footer */}
      {optimalSolution && (
        <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold tracking-wider block">
              Exhaustive Evaluation & Ground State Energy
            </span>
            <div className="text-slate-200 font-medium mt-0.5">
              Optimal Assignment:{" "}
              <span className="text-cyan-300 font-mono font-bold">
                {optimalSolution.selected_ns}
              </span>{" "}
              &nbsp;+&nbsp;{" "}
              <span className="text-cyan-300 font-mono font-bold">
                {optimalSolution.selected_ew}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Min Energy E(x*)</span>
              <span className="text-cyan-400 font-bold">{optimalSolution.minimum_energy.toFixed(2)}</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Vector x*</span>
              <span className="text-emerald-400 font-bold">
                [{optimalSolution.binary_vector?.join(", ")}]
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

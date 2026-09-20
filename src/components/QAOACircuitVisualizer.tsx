import React, { useState } from "react";
import { Cpu, Layers, Terminal, Sparkles, Binary, CheckCircle2 } from "lucide-react";
import { QAOACircuitSpec } from "../types";

interface QAOACircuitVisualizerProps {
  circuitSpec: QAOACircuitSpec;
  backendName: string;
  isFallback: boolean;
}

export const QAOACircuitVisualizer: React.FC<QAOACircuitVisualizerProps> = ({
  circuitSpec,
  backendName,
  isFallback,
}) => {
  const [activeTab, setActiveTab] = useState<"layers" | "ascii" | "gates">("layers");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header with Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              QAOA Variational Quantum Circuit Architecture
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                isFallback
                  ? "bg-amber-950/70 text-amber-300 border-amber-800"
                  : "bg-purple-950/70 text-purple-300 border-purple-800"
              }`}
            >
              {backendName}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ansatz: |&psi;(&gamma;, &beta;)&rang; = &prod;<sub>l=1..p</sub> e<sup>-i &beta;<sub>l</sub> H<sub>M</sub></sup> e<sup>-i &gamma;<sub>l</sub> H<sub>C</sub></sup> |+&rang;<sup>&otimes;n</sup>
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("layers")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              activeTab === "layers"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Circuit Layers
          </button>
          <button
            onClick={() => setActiveTab("ascii")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              activeTab === "ascii"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Qiskit ASCII Diagram
          </button>
          <button
            onClick={() => setActiveTab("gates")}
            className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
              activeTab === "gates"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            Gate Metrics
          </button>
        </div>
      </div>

      {/* Circuit Metadata Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 block text-[10px]">REGISTER SIZE</span>
          <span className="text-purple-300 font-bold text-base">{circuitSpec.num_qubits} Qubits</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">q[0]..q[{circuitSpec.num_qubits - 1}]</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 block text-[10px]">CIRCUIT DEPTH</span>
          <span className="text-cyan-400 font-bold text-base">{circuitSpec.circuit_depth}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Unitary gate stages</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 block text-[10px]">QAOA LAYERS (p)</span>
          <span className="text-emerald-400 font-bold text-base">p = {circuitSpec.layers_p}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            &gamma;=[{circuitSpec.gamma?.join(", ")}], &beta;=[{circuitSpec.beta?.join(", ")}]
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-500 block text-[10px]">TOTAL QUANTUM GATES</span>
          <span className="text-amber-300 font-bold text-base">{circuitSpec.total_gates} Gates</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {circuitSpec.gate_breakdown?.rzz_entangling_gates} Entangling Rzz
          </span>
        </div>
      </div>

      {/* Tab Content: Circuit Layers */}
      {activeTab === "layers" && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {circuitSpec.circuit_layers?.map((layer) => {
            const isH = layer.type === "Hadamard";
            const isCost = layer.type === "Cost_Unitary";
            const isMixer = layer.type === "Mixer_Unitary";
            const isMeasure = layer.type === "Measurement";

            return (
              <div
                key={layer.layer_index}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isH
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          : isCost
                          ? "bg-purple-950 text-purple-300 border border-purple-800"
                          : isMixer
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      Stage {layer.layer_index}: {layer.type}
                    </span>
                    <span className="text-slate-200 font-semibold">{layer.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">{layer.description}</p>
                </div>

                <div className="text-right font-mono text-[11px] shrink-0">
                  {layer.parameter && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 block font-bold">
                      {layer.parameter}
                    </span>
                  )}
                  {layer.rzz_gates !== undefined && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {layer.rzz_gates} Rzz couplings | {layer.rz_gates} Rz fields
                    </span>
                  )}
                  {layer.rx_gates !== undefined && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {layer.rx_gates} Rx transverse mixer rotations
                    </span>
                  )}
                  {layer.qubits_affected && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      All {layer.qubits_affected.length} qubits
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content: ASCII Qiskit Diagram */}
      {activeTab === "ascii" && (
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          <div className="text-[10px] font-mono text-slate-500 mb-2 flex items-center justify-between">
            <span>// Synthesized Qiskit Circuit Wire Diagram (n={circuitSpec.num_qubits} qubits, p={circuitSpec.layers_p} layers)</span>
            <span className="text-purple-400 font-bold">Z-Measurement at termination</span>
          </div>
          <pre className="font-mono text-xs text-cyan-300 leading-relaxed whitespace-pre select-all">
            {circuitSpec.ascii_diagram}
          </pre>
        </div>
      )}

      {/* Tab Content: Gate Metrics Breakdown */}
      {activeTab === "gates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Hadamard H</span>
            <span className="text-cyan-400 font-bold text-lg">
              {circuitSpec.gate_breakdown?.hadamard_gates || 6}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Superposition base</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Entangling Rzz</span>
            <span className="text-purple-300 font-bold text-lg">
              {circuitSpec.gate_breakdown?.rzz_entangling_gates || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">2-qubit Ising J_ij</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Cost Field Rz</span>
            <span className="text-emerald-400 font-bold text-lg">
              {circuitSpec.gate_breakdown?.rz_phase_gates || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">1-qubit biases h_i</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Mixer Rx</span>
            <span className="text-amber-400 font-bold text-lg">
              {circuitSpec.gate_breakdown?.rx_mixer_gates || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Transverse spin flip</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Measurement</span>
            <span className="text-slate-300 font-bold text-lg">
              {circuitSpec.gate_breakdown?.measurement_gates || 6}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Pauli-Z collapse</span>
          </div>
        </div>
      )}
    </div>
  );
};

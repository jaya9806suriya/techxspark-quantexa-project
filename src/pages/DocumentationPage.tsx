import React from "react";
import { BookOpen, Layers, Terminal, Cpu, CheckCircle2, ChevronRight } from "lucide-react";

export const DocumentationPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Technical Documentation & Formulation Specifications
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Complete engineering reference for Quantum-Enhanced Adaptive Urban Traffic Optimization (Phase 1).
        </p>
      </div>

      {/* Math Formulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          1. QUBO Mathematical Formulation for Traffic Signal Coordination
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          The urban traffic signal phase optimization problem is mapped onto an unconstrained binary quadratic
          cost function over binary decision variables $x_i \in &#123;0, 1&#125;$ representing the activation of green
          phases across intersection approaches:
        </p>

        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 space-y-2">
          <div>// Objective: Minimize Total Vehicle Queues and Congestion Wait Time</div>
          <div className="text-slate-200 font-bold">min H(x) = x^T Q x = \sum_i Q_ii x_i + \sum_{'{'}i &lt; j{'}'} Q_ij x_i x_j</div>
          <div className="text-slate-400 text-[11px] pt-1">
            Where:
            <br />• Q_ii = -w_i * q_i : Negative diagonal linear queue pressure on approach i
            <br />• Q_ij = \lambda * Conflict(i, j) : Positive quadratic penalty preventing conflicting green phases
            <br />• Q_ik = -\gamma * Coordination(i, k) : Cooperative coupling term promoting green-wave offsets
          </div>
        </div>
      </div>

      {/* QAOA Circuit Ansatz */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          2. Quantum Approximate Optimization Algorithm (QAOA) Ansatz
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          The problem Hamiltonian $H_C$ is mapped from QUBO via the standard variable transformation
          $x_i = (I - Z_i)/2$. The QAOA ansatz constructs a parameterized quantum state over $p$ alternating
          operator layers:
        </p>

        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-purple-300 space-y-2">
          <div className="text-slate-200 font-bold">|\psi(\gamma, \beta)&gt; = \prod_{'{'}l=1{'}'}^p [ e^&#123;-i \beta_l H_M&#125; \cdot e^&#123;-i \gamma_l H_C&#125; ] |+&gt;^&#123;\otimes n&#125;</div>
          <div className="text-slate-400 text-[11px] pt-1">
            • Initial State: Equal superposition |+&gt; = (|0&gt; + |1&gt;)/sqrt(2) via Hadamard gates
            <br />• Problem Unitary: e^&#123;-i \gamma H_C&#125; implemented with parameterized Rzz(2 \gamma J_ij) gates
            <br />• Mixer Unitary: e^&#123;-i \beta H_M&#125; = \prod_i Rx(2 \beta) rotating qubits in X basis
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          3. Multi-Phase Implementation Roadmap
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/60 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 font-mono">PHASE 1 (ACTIVE)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-semibold text-slate-200">Project Foundation & UI Shell</div>
            <p className="text-slate-400 text-[11px]">
              FastAPI/Express full-stack backend, SQLite persistence, Leaflet OpenStreetMap GIS, 12 command-center pages.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-400 font-mono">PHASE 2</div>
            <div className="font-semibold text-slate-200">Real-Time Traffic Network & Sensors</div>
            <p className="text-slate-400 text-[11px]">
              Micro-simulation integration (SUMO/CityFlow), live sensor telemetry streams, dynamic graph edges.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-400 font-mono">PHASE 3</div>
            <div className="font-semibold text-slate-200">Advanced QAOA & Multi-QPU Execution</div>
            <p className="text-slate-400 text-[11px]">
              Direct IBM Quantum Cloud hardware job submission, error mitigation (Zero-Noise Extrapolation), hardware compilation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

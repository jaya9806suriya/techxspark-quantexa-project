import React, { useState } from "react";
import { Info } from "lucide-react";

interface TechTermTooltipProps {
  term: "QUBO" | "QAOA" | "Hybrid" | "Ising" | "Green Corridor" | "Dijkstra" | "NetworkX";
  children?: React.ReactNode;
}

const TERM_EXPLANATIONS: Record<string, { title: string; description: string; judgeNote: string }> = {
  QUBO: {
    title: "QUBO (Quadratic Unconstrained Binary Optimization)",
    description: "A binary mathematical formulation used to model traffic phase decisions, vehicle queues, and signal conflict constraints.",
    judgeNote: "Translates real-world traffic queues into a binary optimization problem compatible with quantum annealers and QPUs.",
  },
  QAOA: {
    title: "QAOA (Quantum Approximate Optimization Algorithm)",
    description: "A hybrid quantum-classical algorithm used to search for global optimal timing splits using quantum superposition & entanglement.",
    judgeNote: "Explores $2^N$ combinatorial timing combinations simultaneously to escape local traffic congestion traps.",
  },
  Hybrid: {
    title: "Hybrid Quantum-Classical System",
    description: "Classical traffic simulation combined with periodic quantum QPU optimization.",
    judgeNote: "Combines real-time sensor loops on classical servers with heavy combinatorial phase solver on quantum hardware.",
  },
  Ising: {
    title: "Ising Hamiltonian Spin Model",
    description: "Mapping of binary traffic variables to quantum spin states (+1, -1) to compute minimum energy states.",
    judgeNote: "Represents traffic conflict matrices as spin coupling forces where minimum energy equals maximum traffic throughput.",
  },
  "Green Corridor": {
    title: "Emergency Green Corridor Preemption",
    description: "Dynamic priority routing system using Dijkstra/A* pathfinding to lock continuous green signals along emergency routes.",
    judgeNote: "Guarantees zero-stop travel for ambulances and fire trucks while holding cross traffic safely.",
  },
  Dijkstra: {
    title: "Dijkstra / A* Graph Pathfinding",
    description: "Real-time shortest path routing algorithm executing over NetworkX directed road topology.",
    judgeNote: "Dynamically reroutes vehicles around closed roads and accidents in milliseconds.",
  },
  NetworkX: {
    title: "NetworkX Graph Topology Engine",
    description: "Graph theoretical representation of urban intersections (nodes) and arterial streets (edges).",
    judgeNote: "Maintains real-time link capacities and dynamically removes closed road edges.",
  },
};

export const TechTermTooltip: React.FC<TechTermTooltipProps> = ({ term, children }) => {
  const [show, setShow] = useState<boolean>(false);
  const info = TERM_EXPLANATIONS[term] || {
    title: term,
    description: "Technical Smart City optimization concept.",
    judgeNote: "Used for dynamic traffic control.",
  };

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="underline decoration-cyan-500/50 underline-offset-2 font-semibold">
        {children || term}
      </span>
      <Info className="w-3.5 h-3.5 text-cyan-400 opacity-70 group-hover:opacity-100 transition" />

      {show && (
        <span className="block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl z-[9999] text-xs font-sans text-slate-200 pointer-events-none animate-fade-in text-left">
          <span className="font-bold font-mono text-cyan-300 text-xs mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> {info.title}
          </span>
          <span className="block text-[11px] text-slate-300 leading-relaxed mb-1.5">
            {info.description}
          </span>
          <span className="block pt-1.5 border-t border-slate-800 text-[10px] font-mono text-emerald-400">
            <strong>Judge Summary:</strong> {info.judgeNote}
          </span>
        </span>
      )}
    </span>
  );
};

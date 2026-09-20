import React, { useState } from "react";
import { TrafficNode, TrafficEdge, Incident } from "../types";
import { LeafletMap } from "../components/LeafletMap";
import { Filter, Layers, Navigation, Compass, AlertCircle } from "lucide-react";

interface LiveTrafficPageProps {
  nodes: TrafficNode[];
  edges: TrafficEdge[];
  incidents: Incident[];
}

export const LiveTrafficPage: React.FC<LiveTrafficPageProps> = ({
  nodes,
  edges,
  incidents,
}) => {
  const [selectedNode, setSelectedNode] = useState<TrafficNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<TrafficEdge | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");

  const filteredEdges =
    filterLevel === "ALL"
      ? edges
      : edges.filter((e) => e.congestion_level === filterLevel);

  return (
    <div className="p-6 h-full flex flex-col space-y-4 max-w-7xl mx-auto">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">Filter Congestion:</span>
          {["ALL", "CRITICAL", "HEAVY", "MODERATE", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                filterLevel === lvl
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            San Francisco Downtown Grid
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {filteredEdges.length} / {edges.length} Road Links Shown
          </span>
        </div>
      </div>

      {/* Map & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        {/* Main Map */}
        <div className="lg:col-span-3 h-full min-h-[480px]">
          <LeafletMap
            nodes={nodes}
            edges={filteredEdges}
            incidents={incidents}
            onSelectNode={(n) => {
              setSelectedNode(n);
              setSelectedEdge(null);
            }}
            onSelectEdge={(e) => {
              setSelectedEdge(e);
              setSelectedNode(null);
            }}
          />
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                Element Telemetry
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                Click Map Item
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-mono text-[10px]">INTERSECTION NODE</div>
                  <div className="text-sm font-semibold text-slate-100">{selectedNode.name}</div>
                  <div className="text-cyan-400 font-mono text-[11px]">ID: {selectedNode.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Signal State</span>
                    <span className="font-semibold text-emerald-400 font-mono">{selectedNode.signal_state}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Cycle Time</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedNode.cycle_time_sec}s</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Qubit QPU Index</span>
                    <span className="font-semibold text-cyan-400 font-mono">Q#{selectedNode.qubit_assigned}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Current Load</span>
                    <span className="font-semibold text-amber-400 font-mono">{selectedNode.current_load}%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 text-[11px] text-slate-400">
                  Coordinates: {selectedNode.latitude.toFixed(4)}, {selectedNode.longitude.toFixed(4)}
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-mono text-[10px]">ROAD ARTERIAL</div>
                  <div className="text-sm font-semibold text-slate-100">{selectedEdge.street_name}</div>
                  <div className="text-cyan-400 font-mono text-[11px]">ID: {selectedEdge.id} ({selectedEdge.source_id} &rarr; {selectedEdge.target_id})</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Congestion</span>
                    <span className="font-semibold text-red-400 font-mono">{selectedEdge.congestion_level}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Density</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedEdge.density_percentage}%</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Current Flow</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedEdge.current_flow_vph} vph</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-slate-400 block">Quantum Weight</span>
                    <span className="font-semibold text-purple-400 font-mono">{selectedEdge.quantum_weight}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs space-y-2">
                <Navigation className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>Click any intersection pin or road arterial segment to inspect live telemetry.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>OpenStreetMap cartography layer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

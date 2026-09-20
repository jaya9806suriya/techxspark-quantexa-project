import React, { useState, useEffect } from "react";
import {
  Intersection,
  IntersectionRoad,
  TrafficSignal,
  NetworkGraphData,
  TrafficSummaryData,
  TrafficNode,
  TrafficEdge,
} from "../types";
import { ApiService } from "../services/api";
import { useTrafficSimulation } from "../services/useTrafficSimulation";
import { LeafletMap } from "../components/LeafletMap";
import { AnimatedTrafficLight } from "../components/AnimatedTrafficLight";
import { AdaptiveSignalControllerView } from "../components/AdaptiveSignalControllerView";
import {
  Network,
  Share2,
  MapPin,
  Activity,
  Layers,
  Radio,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  AlertCircle,
  CheckCircle2,
  GitCommit,
  Car,
  Compass,
  Cpu,
} from "lucide-react";

interface TrafficNetworkPageProps {
  nodes?: TrafficNode[];
  edges?: TrafficEdge[];
}

// Fixed topology layout coordinates for the 6-intersection graph canvas
const NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  I2: { x: 380, y: 70 },   // North Junction (Top)
  I5: { x: 120, y: 220 },  // West Junction (Left)
  I1: { x: 380, y: 220 },  // Central Junction (Center)
  I3: { x: 640, y: 220 },  // East Junction (Right)
  I4: { x: 380, y: 390 },  // South Junction (Bottom)
  I6: { x: 600, y: 440 },  // Hospital Junction (Southeast of South)
};

export const TrafficNetworkPage: React.FC<TrafficNetworkPageProps> = ({
  nodes: _legacyNodes = [],
  edges: _legacyEdges = [],
}) => {
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [roads, setRoads] = useState<IntersectionRoad[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraphData | null>(null);
  const [selectedId, setSelectedId] = useState<string>("I3"); // Defaults to I3 as in user example
  const [viewMode, setViewMode] = useState<"both" | "graph" | "map" | "signals">("both");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Phase 3 Real-time Traffic Simulation integration
  const {
    intersections: simIntersections,
    roads: simRoads,
    isRunning: isSimRunning,
    simTime,
    isConnected: isWsConnected,
  } = useTrafficSimulation();

  // Sync simulation stream updates to local view when live
  useEffect(() => {
    if (simIntersections && simIntersections.length > 0) {
      setIntersections(simIntersections);
    }
  }, [simIntersections]);

  useEffect(() => {
    if (simRoads && simRoads.length > 0) {
      setRoads(simRoads);
    }
  }, [simRoads]);

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const [intersectionsData, networkData, signalsData] = await Promise.all([
        ApiService.getIntersections(),
        ApiService.getNetworkGraph(),
        ApiService.getSignals(),
      ]);

      setIntersections(intersectionsData);
      setRoads(networkData.roads || []);
      setNetworkGraph(networkData);
      setSignals(signalsData);
    } catch (err) {
      console.error("Failed to load Phase 2 network data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const selectedIntersection = intersections.find((i) => i.id === selectedId) || intersections[0];

  // Helper colors for congestion
  const getCongestionBadgeClass = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-950 text-rose-300 border-rose-800";
      case "HIGH":
        return "bg-orange-950 text-orange-300 border-orange-800";
      case "MEDIUM":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "LOW":
      default:
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "#f43f5e";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
      default:
        return "#10b981";
    }
  };

  // Signal lamp component
  const renderTrafficLightIcon = (phase: string, size = "md") => {
    const isGreen = phase.includes("GREEN");
    const isYellow = phase.includes("YELLOW");
    const isRed = phase.includes("RED") || (!isGreen && !isYellow);

    const lampSize = size === "lg" ? "w-4 h-4" : "w-2.5 h-2.5";

    return (
      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shadow-inner">
        <span
          className={`${lampSize} rounded-full transition-all duration-300 ${
            isRed ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-red-950/60"
          }`}
          title="Red Light"
        />
        <span
          className={`${lampSize} rounded-full transition-all duration-300 ${
            isYellow ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-amber-950/60"
          }`}
          title="Yellow Light"
        />
        <span
          className={`${lampSize} rounded-full transition-all duration-300 ${
            isGreen ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-emerald-950/60"
          }`}
          title="Green Light"
        />
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto min-h-full">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Multi-Intersection Traffic Network
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Phase 2 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Realistic 6-junction topology modeled with NetworkX in backend & SQLite persistence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("both")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                viewMode === "both" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                viewMode === "graph" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Graph Topology
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                viewMode === "map" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              OpenStreetMap
            </button>
            <button
              id="btn-view-adaptive-signals"
              onClick={() => setViewMode("signals")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === "signals"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Adaptive Signals
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition flex items-center justify-center"
            title="Refresh network data from backend"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Network Metrics KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Total Vertices</div>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">6 Hubs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">I1 &mdash; I6 Intersections</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Directed Roads</div>
          <div className="text-xl font-bold text-purple-400 font-mono mt-1">14 Segments</div>
          <div className="text-[10px] text-slate-500 mt-0.5">7 Two-way Corridors</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Graph Density</div>
          <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
            {networkGraph?.graph_density ?? 0.467}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">NetworkX Connected</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Total Queue</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {intersections.reduce((acc, i) => acc + i.queue_length, 0)} veh
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Approaches</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Average Speed</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {(intersections.reduce((acc, i) => acc + i.average_speed, 0) / (intersections.length || 1)).toFixed(1)} km/h
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Real-time Sensor Mean</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Hospital Corridor</div>
          <div className="text-xl font-bold text-rose-400 font-mono mt-1">I6 Linked</div>
          <div className="text-[10px] text-rose-300 mt-0.5">I4 &harr; I6 Trauma Priority</div>
        </div>
      </div>

      {/* Main Interactive Visualizer Section */}
      {viewMode === "signals" ? (
        <AdaptiveSignalControllerView onSignalUpdated={loadData} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizers (Graph and/or Map) */}
        <div className={viewMode === "both" ? "lg:col-span-8 space-y-6" : "lg:col-span-8"}>
          {/* 1. Interactive Topological Network Graph Canvas */}
          {(viewMode === "both" || viewMode === "graph") && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-200">
                    Interactive Topological Road Graph
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    (Click node to inspect)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      if (networkGraph?.shortest_paths?.west_to_hospital?.path) {
                        setHighlightedPath(networkGraph.shortest_paths.west_to_hospital.path);
                      } else {
                        setHighlightedPath(["I5", "I4", "I6"]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition ${
                      highlightedPath.length > 0 && highlightedPath.includes("I6")
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    Highlight I5 &rarr; I6 Hospital Route
                  </button>
                  {highlightedPath.length > 0 && (
                    <button
                      onClick={() => setHighlightedPath([])}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Topology SVG Canvas */}
              <div className="relative w-full h-[460px] bg-slate-950/80 rounded-xl border border-slate-800/60 overflow-hidden flex items-center justify-center">
                <svg
                  viewBox="0 0 760 500"
                  className="w-full h-full select-none"
                  style={{ maxHeight: "460px" }}
                >
                  <defs>
                    {/* Glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {/* Arrow markers */}
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker
                      id="arrow-path"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                    </marker>
                  </defs>

                  {/* 1. Road Edges */}
                  {roads.map((road) => {
                    const src = NODE_COORDINATES[road.source_id];
                    const tgt = NODE_COORDINATES[road.target_id];
                    if (!src || !tgt) return null;

                    const isPathHighlighted =
                      highlightedPath.length > 1 &&
                      highlightedPath.includes(road.source_id) &&
                      highlightedPath.includes(road.target_id) &&
                      Math.abs(highlightedPath.indexOf(road.source_id) - highlightedPath.indexOf(road.target_id)) === 1;

                    const isSelectedConnected =
                      selectedId === road.source_id || selectedId === road.target_id;

                    const color = isPathHighlighted
                      ? "#f43f5e"
                      : isSelectedConnected
                      ? "#38bdf8"
                      : getCongestionColor(road.congestion_level);

                    const strokeWidth = isPathHighlighted ? 4 : isSelectedConnected ? 3 : 2;

                    // Slight offset for parallel two-way representation
                    const dx = tgt.x - src.x;
                    const dy = tgt.y - src.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const offsetX = (-dy / len) * 4;
                    const offsetY = (dx / len) * 4;

                    const x1 = src.x + offsetX;
                    const y1 = src.y + offsetY;
                    const x2 = tgt.x + offsetX;
                    const y2 = tgt.y + offsetY;

                    const midX = (src.x + tgt.x) / 2 + offsetX * 1.5;
                    const midY = (src.y + tgt.y) / 2 + offsetY * 1.5;

                    return (
                      <g key={road.id} className="cursor-pointer group">
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={color}
                          strokeWidth={strokeWidth}
                          strokeOpacity={isPathHighlighted || isSelectedConnected ? 1 : 0.65}
                          strokeDasharray={road.congestion_level === "CRITICAL" ? "4,4" : undefined}
                          markerEnd={
                            isPathHighlighted
                              ? "url(#arrow-path)"
                              : isSelectedConnected
                              ? "url(#arrow-active)"
                              : "url(#arrow)"
                          }
                        />
                        {/* Street name & capacity tooltip on hover */}
                        <circle cx={midX} cy={midY} r="3" fill={color} opacity="0.8" />
                      </g>
                    );
                  })}

                  {/* 2. Intersections (Nodes) */}
                  {intersections.map((node) => {
                    const coords = NODE_COORDINATES[node.id];
                    if (!coords) return null;

                    const isSelected = selectedId === node.id;
                    const isHospital = node.id === "I6";
                    const isGreen = node.current_signal_phase.includes("GREEN");
                    const isYellow = node.current_signal_phase.includes("YELLOW");
                    const activeSignalColor = isGreen ? "#22c55e" : isYellow ? "#eab308" : "#ef4444";
                    const congestionColor = getCongestionColor(node.congestion_level);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => setSelectedId(node.id)}
                        className="cursor-pointer transition-transform"
                      >
                        {/* Outer Selection Pulsing Ring */}
                        {isSelected && (
                          <circle
                            r="38"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            className="animate-spin"
                            style={{ animationDuration: "12s" }}
                          />
                        )}

                        {/* Node Background Halo */}
                        <circle
                          r="28"
                          fill="#0f172a"
                          stroke={isSelected ? "#38bdf8" : congestionColor}
                          strokeWidth={isSelected ? 3 : 2}
                          filter={isSelected ? "url(#glow)" : undefined}
                        />

                        {/* Traffic Signal Icon (Tri-color mini housing inside node) */}
                        <g transform="translate(0, -9)">
                          <rect
                            x="-16"
                            y="-6"
                            width="32"
                            height="12"
                            rx="4"
                            fill="#020617"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <circle
                            cx="-8"
                            cy="0"
                            r="3"
                            fill={!isGreen && !isYellow ? "#ef4444" : "#450a0a"}
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="3"
                            fill={isYellow ? "#f59e0b" : "#451a03"}
                          />
                          <circle
                            cx="8"
                            cy="0"
                            r="3"
                            fill={isGreen ? "#10b981" : "#022c22"}
                          />
                        </g>

                        {/* Node ID label */}
                        <text
                          y="10"
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="13"
                          fontWeight="700"
                          fontFamily="monospace"
                        >
                          {node.id}
                        </text>

                        {/* Sub-label (Name) */}
                        <text
                          y="42"
                          textAnchor="middle"
                          fill={isSelected ? "#38bdf8" : "#94a3b8"}
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="sans-serif"
                        >
                          {node.name.replace(" Junction", "")}
                        </text>

                        {/* Queue badge */}
                        <g transform="translate(0, 54)">
                          <rect
                            x="-24"
                            y="-7"
                            width="48"
                            height="14"
                            rx="7"
                            fill="#020617"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="3"
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="8"
                            fontWeight="600"
                            fontFamily="monospace"
                          >
                            {node.queue_length} veh
                          </text>
                        </g>

                        {/* Congestion indicator badge */}
                        <circle
                          cx="20"
                          cy="-20"
                          r="6"
                          fill={congestionColor}
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Graph Legend overlay */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2 text-[10px] space-y-1 text-slate-300">
                  <div className="font-semibold text-slate-200">NetworkX Topology Graph</div>
                  <div className="text-slate-400">Nodes: 6 &bull; Roads: 14 &bull; Connected: Yes</div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Low</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" />
                    <span>Med</span>
                    <span className="w-2 h-2 rounded-full bg-orange-500 ml-1" />
                    <span>High</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
                    <span>Crit</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Interactive Leaflet OpenStreetMap View */}
          {(viewMode === "both" || viewMode === "map") && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-200">
                    Geographic Road Map (Leaflet + OpenStreetMap)
                  </h2>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  San Francisco Metropolitan Downtown Grid
                </div>
              </div>

              <div className="w-full h-[400px] rounded-xl overflow-hidden">
                <LeafletMap
                  intersections={intersections}
                  roads={roads}
                  selectedIntersectionId={selectedId}
                  onSelectIntersection={(item) => setSelectedId(item.id)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Details Panel (Matching User Example format!) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Detailed Selected Intersection Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-base">
                  {selectedIntersection?.id || "I3"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Intersection {selectedIntersection?.id}
                  </h3>
                  <div className="text-xs text-slate-400 font-medium">
                    {selectedIntersection?.name}
                  </div>
                </div>
              </div>

              {/* Congestion Status Pill */}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getCongestionBadgeClass(
                  selectedIntersection?.congestion_level || "HIGH"
                )}`}
              >
                {selectedIntersection?.congestion_level}
              </span>
            </div>

            {/* Exact Required Details Panel Spec */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 font-sans">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                Telemetry Readings
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Intersection</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {selectedIntersection?.id} &mdash; {selectedIntersection?.name}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Vehicle Density</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedIntersection?.vehicle_density === "CRITICAL"
                        ? "text-rose-400"
                        : selectedIntersection?.vehicle_density === "HIGH"
                        ? "text-orange-400"
                        : selectedIntersection?.vehicle_density === "MEDIUM"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {selectedIntersection?.vehicle_density}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Queue</span>
                  <span className="font-mono font-semibold text-slate-100">
                    {selectedIntersection?.queue_length} vehicles
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Current Phase</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {selectedIntersection?.current_signal_phase}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Green Time</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {selectedIntersection?.green_time} sec
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Road Capacity</span>
                  <span className="font-mono font-semibold text-slate-100">
                    {selectedIntersection?.road_capacity} vehicles/min
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Congestion</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedIntersection?.congestion_level === "CRITICAL"
                        ? "text-rose-400"
                        : selectedIntersection?.congestion_level === "HIGH"
                        ? "text-orange-400"
                        : selectedIntersection?.congestion_level === "MEDIUM"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {selectedIntersection?.congestion_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Signal Light Visualizer & Timing Progress */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  Adaptive Dual-Head Signal
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {selectedIntersection?.current_signal_phase}
                </span>
              </div>

              {selectedIntersection && (
                <div className="flex justify-center py-1">
                  <AnimatedTrafficLight
                    id={`sidebar-light-${selectedIntersection.id}`}
                    currentPhase={selectedIntersection.current_signal_phase}
                    phaseTotalDuration={selectedIntersection.green_time}
                    remainingTimeSec={Math.max(1, Math.round(selectedIntersection.green_time * 0.65))}
                    showDualHeads={true}
                    size="md"
                    showCountdown={true}
                  />
                </div>
              )}

              {/* Cycle Timing Bar */}
              {selectedIntersection && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Cycle Distribution</span>
                    <span>
                      {selectedIntersection.green_time +
                        selectedIntersection.yellow_time +
                        selectedIntersection.red_time}
                      s total
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          (selectedIntersection.green_time /
                            (selectedIntersection.green_time +
                              selectedIntersection.yellow_time +
                              selectedIntersection.red_time)) *
                          100
                        }%`,
                      }}
                      className="bg-emerald-500 h-full"
                      title={`Green: ${selectedIntersection.green_time}s`}
                    />
                    <div
                      style={{
                        width: `${
                          (selectedIntersection.yellow_time /
                            (selectedIntersection.yellow_time +
                              selectedIntersection.red_time +
                              selectedIntersection.green_time)) *
                          100
                        }%`,
                      }}
                      className="bg-amber-400 h-full"
                      title={`Yellow: ${selectedIntersection.yellow_time}s`}
                    />
                    <div
                      style={{
                        width: `${
                          (selectedIntersection.red_time /
                            (selectedIntersection.green_time +
                              selectedIntersection.yellow_time +
                              selectedIntersection.red_time)) *
                          100
                        }%`,
                      }}
                      className="bg-red-500 h-full"
                      title={`Red: ${selectedIntersection.red_time}s`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="text-emerald-400">Green: {selectedIntersection.green_time}s</span>
                    <span className="text-amber-400">Yellow: {selectedIntersection.yellow_time}s</span>
                    <span className="text-red-400">Red: {selectedIntersection.red_time}s</span>
                  </div>
                </div>
              )}

              {/* Additional Dynamics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Average Speed</div>
                  <div className="text-sm font-bold font-mono text-slate-100">
                    {selectedIntersection?.average_speed} km/h
                  </div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Pedestrian Count</div>
                  <div className="text-sm font-bold font-mono text-slate-100">
                    {selectedIntersection?.pedestrian_count} crossers
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Topology Adjacency */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                Connected Neighbor Roads
              </div>
              <div className="space-y-1.5">
                {roads
                  .filter(
                    (r) =>
                      r.source_id === selectedIntersection?.id ||
                      r.target_id === selectedIntersection?.id
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                        <span className="font-medium text-slate-200">{r.street_name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${getCongestionBadgeClass(
                          r.congestion_level
                        )}`}
                      >
                        {r.distance_km}km &bull; {r.congestion_level}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Intersection Fast Selector / Signal Phase Overview Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Multi-Intersection Traffic Signal Phasing Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            6 Active Synchronized Junctions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {intersections.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-800/80 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                      {item.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.current_signal_phase}</div>
                    </div>
                  </div>
                  <AnimatedTrafficLight
                    id={`matrix-light-${item.id}`}
                    currentPhase={item.current_signal_phase}
                    phaseTotalDuration={item.green_time}
                    size="sm"
                    showCountdown={false}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500">Density</div>
                    <div className="font-semibold text-slate-200">{item.vehicle_density}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Queue</div>
                    <div className="font-semibold text-amber-400">{item.queue_length} veh</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Green</div>
                    <div className="font-semibold text-emerald-400">{item.green_time}s</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

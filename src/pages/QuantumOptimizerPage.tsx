import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Play,
  RotateCw,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Car,
  Users,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  HelpCircle,
  Binary,
  BarChart3,
  Timer,
  AlertTriangle,
  Info,
} from "lucide-react";
import { ApiService } from "../services/api";
import {
  QUBOModelResponse,
  QUBOObjectiveWeights,
  QUBOPenalties,
  QAOAResultResponse,
  QAOAStatusResponse,
} from "../types";
import { QUBOMatrixVisualizer } from "../components/QUBOMatrixVisualizer";
import { QAOACircuitVisualizer } from "../components/QAOACircuitVisualizer";
import { QAOAHistogramVisualizer } from "../components/QAOAHistogramVisualizer";
import { QuantumSignalOptimizer } from "../components/QuantumSignalOptimizer";

interface QuantumOptimizerPageProps {
  onRunCompleted?: () => void;
  onNavigateToSimulation?: () => void;
}

export const QuantumOptimizerPage: React.FC<QuantumOptimizerPageProps> = ({
  onRunCompleted,
  onNavigateToSimulation,
}) => {
  // Navigation tabs between Phase 7 (Signals), Phase 6 (QAOA Circuit), and Phase 5 (QUBO Matrix)
  const [activeView, setActiveView] = useState<"phase7" | "qaoa" | "qubo">("phase7");

  // Target Intersection Selection
  const [selectedIntersection, setSelectedIntersection] = useState<string>("I1");

  // QAOA Engine Hyperparameters
  const [qaoaLayersP, setQaoaLayersP] = useState<number>(2);
  const [qaoaShots, setQaoaShots] = useState<number>(1024);

  // Live vs Manual Traffic Inputs
  const [useLiveSimulation, setUseLiveSimulation] = useState<boolean>(true);
  const [trafficInputs, setTrafficInputs] = useState({
    queue_ns: 45,
    queue_ew: 22,
    road_capacity_ns: 80,
    road_capacity_ew: 80,
    pedestrian_ns: 14,
    pedestrian_ew: 8,
    current_signal_phase: "North-South GREEN",
    emergency_active: false,
    emergency_corridor: "North-South" as "North-South" | "East-West",
  });

  // Configurable Objective Weights (w1 to w7)
  const [weights, setWeights] = useState<QUBOObjectiveWeights>({
    waiting: 1.8,
    queue: 2.2,
    congestion: 1.5,
    fuel: 1.2,
    co2: 1.0,
    emergency: 3.5,
    switching: 0.8,
  });

  // Configurable Constraint Penalties (lambda)
  const [penalties, setPenalties] = useState<QUBOPenalties>({
    one_hot: 25.0,
    conflict: 8.0,
    min_green: 12.0,
    max_green: 10.0,
    pedestrian: 14.0,
    emergency_priority: 30.0,
  });

  // Quantum State & Status
  const [backendStatus, setBackendStatus] = useState<QAOAStatusResponse | null>(null);
  const [quboModel, setQuboModel] = useState<QUBOModelResponse | null>(null);
  const [qaoaResult, setQaoaResult] = useState<QAOAResultResponse | null>(null);

  // Progress Indicators
  const [isQaoaRunning, setIsQaoaRunning] = useState<boolean>(false);
  const [isQuboBuilding, setIsQuboBuilding] = useState<boolean>(false);
  const [qaoaStepIndex, setQaoaStepIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  // 7 Explicit QAOA Progress Steps
  const QAOA_STEPS = [
    "Preparing QUBO",
    "Converting to Ising",
    "Building QAOA circuit",
    "Running simulator",
    "Measuring states",
    "Evaluating solutions",
    "Selecting best solution",
  ];

  // Fetch backend status and initial QUBO / QAOA on mount
  useEffect(() => {
    fetchBackendStatus();
    handleBuildQUBO(true);
    handleRunQAOA(true);
  }, []);

  const fetchBackendStatus = async () => {
    try {
      const status = await ApiService.getQAOAStatus();
      setBackendStatus(status);
    } catch (err) {
      console.warn("Could not fetch QAOA status:", err);
    }
  };

  // Fetch live traffic state from simulation if enabled
  const fetchLiveTraffic = useCallback(async (intId: string) => {
    try {
      const signalsRes = await ApiService.getSignalsTelemetry();
      const target = signalsRes.signals.find((s) => s.id === intId);
      if (target) {
        const q = target.queue_length;
        const isNS = target.current_signal_phase.includes("North-South");
        const q_ns = isNS ? q : Math.max(6, Math.round(q * 0.65));
        const q_ew = isNS ? Math.max(6, Math.round(q * 0.7)) : q;
        setTrafficInputs({
          queue_ns: q_ns,
          queue_ew: q_ew,
          road_capacity_ns: target.capacity || 80,
          road_capacity_ew: target.capacity || 80,
          pedestrian_ns: target.pedestrian_count || 10,
          pedestrian_ew: Math.max(3, Math.round((target.pedestrian_count || 10) * 0.6)),
          current_signal_phase: target.current_signal_phase,
          emergency_active: false,
          emergency_corridor: "North-South",
        });
      }
    } catch (err) {
      console.warn("Could not fetch live telemetry, using default state:", err);
    }
  }, []);

  const handleIntersectionChange = (intId: string) => {
    setSelectedIntersection(intId);
    if (useLiveSimulation) {
      fetchLiveTraffic(intId);
    }
  };

  // 1. Action: BUILD QUBO (Phase 5)
  const handleBuildQUBO = async (silentInitial: boolean = false) => {
    setIsQuboBuilding(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.buildQUBO({
        intersection_id: selectedIntersection,
        weights,
        penalties,
        traffic_state: trafficInputs,
      });
      setQuboModel(res);
      if (!silentInitial) {
        setLastRunTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error("Failed to build QUBO:", err);
      setErrorMsg(err.message || "Failed to formulate QUBO");
    } finally {
      setIsQuboBuilding(false);
    }
  };

  // 2. Action: RUN QUANTUM OPTIMIZATION (Phase 6: QAOA)
  // Workflow:
  // Traffic Data -> QUBO -> Ising Hamiltonian -> QAOA -> Quantum Circuit -> Measurement -> Best Bitstring -> Signal Timing
  const handleRunQAOA = async (silentInitial: boolean = false) => {
    setIsQaoaRunning(true);
    setErrorMsg(null);
    setQaoaStepIndex(1);

    try {
      // Step 1: Preparing QUBO
      if (!silentInitial) {
        await new Promise((r) => setTimeout(r, 120));
        setQaoaStepIndex(2); // Converting to Ising
        await new Promise((r) => setTimeout(r, 120));
        setQaoaStepIndex(3); // Building QAOA circuit
        await new Promise((r) => setTimeout(r, 120));
        setQaoaStepIndex(4); // Running simulator
      }

      const res = await ApiService.runQAOA({
        intersection_id: selectedIntersection,
        p_steps: qaoaLayersP,
        shots: qaoaShots,
        traffic_state: trafficInputs,
        weights,
        penalties,
      });

      if (!silentInitial) {
        setQaoaStepIndex(5); // Measuring states
        await new Promise((r) => setTimeout(r, 100));
        setQaoaStepIndex(6); // Evaluating solutions
        await new Promise((r) => setTimeout(r, 100));
        setQaoaStepIndex(7); // Selecting best solution
      }

      setQaoaResult(res);
      setLastRunTime(new Date().toLocaleTimeString());

      // If QUBO model isn't populated, build it for synchronization
      if (!quboModel) {
        handleBuildQUBO(true);
      }

      if (onRunCompleted) {
        onRunCompleted();
      }
    } catch (err: any) {
      console.error("Failed to run QAOA:", err);
      setErrorMsg(err.message || "Failed to execute QAOA optimization");
    } finally {
      setIsQaoaRunning(false);
      setTimeout(() => setQaoaStepIndex(0), 1600);
    }
  };

  const isFallback = qaoaResult ? qaoaResult.is_fallback : (backendStatus ? backendStatus.is_fallback : true);
  const backendDisplayName = qaoaResult
    ? qaoaResult.backend
    : (backendStatus?.backend_name || "Quantum Simulation Fallback");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Level Phase Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-phase7-signals"
            onClick={() => setActiveView("phase7")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeView === "phase7"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Phase 7: Quantum Signals &amp; Simulator</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-200 border border-emerald-700/50">
              Active
            </span>
          </button>

          <button
            id="tab-phase6-qaoa"
            onClick={() => setActiveView("qaoa")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeView === "qaoa"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-300" />
            <span>Phase 6: QAOA Circuit &amp; Histogram</span>
          </button>

          <button
            id="tab-phase5-qubo"
            onClick={() => setActiveView("qubo")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeView === "qubo"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/40"
                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>Phase 5: QUBO Matrix Formulation</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{backendDisplayName}</span>
        </div>
      </div>

      {/* Phase 7: Quantum-Optimized Traffic Signals (Connected to Simulator) */}
      {activeView === "phase7" && (
        <QuantumSignalOptimizer
          onAppliedToSimulation={onRunCompleted}
          onNavigateToSimulation={onNavigateToSimulation}
        />
      )}

      {/* Phase 6 & Phase 5: Deep Engine Explorer & Formulations */}
      {activeView !== "phase7" && (
        <>
          {/* Top Banner & Control Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-bold text-slate-100">
                Phase 6: QAOA Quantum Optimization Engine
              </h1>
              {/* Backend indicator clearly labeled according to requirements */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                  isFallback
                    ? "bg-amber-950/80 text-amber-300 border-amber-800"
                    : "bg-purple-950/80 text-purple-300 border-purple-800"
                }`}
              >
                {backendDisplayName}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              End-to-end quantum variational workflow: Traffic Data &rarr; QUBO &rarr; Ising Hamiltonian &rarr;
              QAOA Variational Circuit &rarr; Quantum Simulator &rarr; State Measurement &rarr; Best Bitstring &rarr;
              Optimized Signal Timings.
            </p>
          </div>

          {/* Action Buttons: RUN QUANTUM OPTIMIZATION & BUILD QUBO */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-build-qubo"
              onClick={() => handleBuildQUBO(false)}
              disabled={isQuboBuilding || isQaoaRunning}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isQuboBuilding ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              )}
              BUILD QUBO
            </button>

            <button
              id="btn-run-qaoa"
              onClick={() => handleRunQAOA(false)}
              disabled={isQaoaRunning || isQuboBuilding}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isQaoaRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  Running QAOA Quantum Engine...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  RUN QUANTUM OPTIMIZATION
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fallback Notice (Mandatory Labeling) */}
        {isFallback && (
          <div className="p-2.5 bg-amber-950/40 border border-amber-800/80 rounded-lg flex items-center gap-2.5 text-xs text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Quantum Simulation Fallback Active:</strong> Executing on high-precision numerical
              Statevector Schrödinger Evolution Simulator. Qiskit Aer native C++ binary is not installed in the container
              environment. Results accurately simulate quantum unitary operations and measurement collapse.
            </span>
          </div>
        )}

        {/* Real-time 7-Step Progress Pipeline */}
        {qaoaStepIndex > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-300">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Step {qaoaStepIndex} of 7: {QAOA_STEPS[qaoaStepIndex - 1]}
              </span>
              <span>{Math.round((qaoaStepIndex / 7) * 100)}% Complete</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-[10px] font-mono">
              {QAOA_STEPS.map((stepName, sIdx) => {
                const stepNum = sIdx + 1;
                const isComplete = qaoaStepIndex > stepNum;
                const isCurrent = qaoaStepIndex === stepNum;
                return (
                  <div
                    key={stepName}
                    className={`p-1.5 rounded border text-center truncate ${
                      isComplete
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        : isCurrent
                        ? "bg-purple-950/80 border-purple-600 text-purple-200 font-bold ring-1 ring-purple-500"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isComplete ? "✓ " : `${stepNum}. `}
                    {stepName}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* QAOA Configuration Strip: Qubits, Layers p, Shots, Target Node */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        {/* Param 1: Qubits */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[10px]">NUMBER OF QUBITS</span>
            <span className="text-purple-300 font-bold text-base">6 Qubits</span>
            <span className="text-[10px] text-slate-400 block">x1..x6 binary variables</span>
          </div>
          <Binary className="w-5 h-5 text-purple-400" />
        </div>

        {/* Param 2: QAOA Layers p */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-slate-400">
            <span className="text-[10px]">QAOA LAYERS (p)</span>
            <span className="text-cyan-400 font-bold">p = {qaoaLayersP}</span>
          </div>
          <div className="flex gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setQaoaLayersP(lvl)}
                className={`flex-1 py-1 rounded text-center font-bold text-xs transition ${
                  qaoaLayersP === lvl
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Param 3: Measurement Shots */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-slate-400">
            <span className="text-[10px]">NUMBER OF SHOTS</span>
            <span className="text-emerald-400 font-bold">{qaoaShots} Shots</span>
          </div>
          <select
            value={qaoaShots}
            onChange={(e) => setQaoaShots(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500"
          >
            <option value={256}>256 shots (Fast)</option>
            <option value={512}>512 shots (Balanced)</option>
            <option value={1024}>1024 shots (Default)</option>
            <option value={2048}>2048 shots (High Precision)</option>
            <option value={4096}>4096 shots (Statistical Depth)</option>
          </select>
        </div>

        {/* Param 4: Target Node */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-slate-400">
            <span className="text-[10px]">TARGET JUNCTION</span>
            <span className="text-cyan-400 font-bold">{selectedIntersection}</span>
          </div>
          <select
            value={selectedIntersection}
            onChange={(e) => handleIntersectionChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="I1">I1 - Central Junction</option>
            <option value="I2">I2 - North Junction</option>
            <option value="I3">I3 - East Junction</option>
            <option value="I4">I4 - South Junction</option>
            <option value="I5">I5 - West Junction</option>
            <option value="I6">I6 - Hospital Junction</option>
          </select>
        </div>
      </div>

      {/* Primary KPI Results Dashboard: Best Bitstring, Objective Value, Circuit Depth, Execution Time */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        {/* KPI 1: Best Bitstring */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Best Bitstring</span>
            <Binary className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 tracking-wider">
            {qaoaResult?.best_bitstring || "------"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {qaoaResult?.decoded_solution?.selected_ns_phase || "Pending run"}
          </div>
        </div>

        {/* KPI 2: Objective Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Objective Value</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {qaoaResult?.objective_value !== undefined ? qaoaResult.objective_value.toFixed(2) : "--"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            Minimum ground energy
          </div>
        </div>

        {/* KPI 3: Circuit Depth */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Circuit Depth</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {qaoaResult?.circuit_depth || 8}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {qaoaResult?.circuit_specification?.total_gates || 42} total gates
          </div>
        </div>

        {/* KPI 4: Execution Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Execution Time</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {qaoaResult?.execution_time_ms ? `${qaoaResult.execution_time_ms} ms` : "--"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {backendDisplayName}
          </div>
        </div>
      </div>

      {/* Decoded Signal Timings Card */}
      {qaoaResult?.signal_timings && (
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider block">
                Quantum Decoded Optimization
              </span>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Optimized Signal Timings for Junction {selectedIntersection}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Split: {qaoaResult.signal_timings.split_ratio}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                Cycle: {qaoaResult.signal_timings.total_cycle_time_sec}s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">NORTH-SOUTH GREEN</span>
              <span className="text-emerald-400 font-bold text-xl block mt-0.5">
                {qaoaResult.signal_timings.north_south_green_sec}s
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {qaoaResult.decoded_solution?.selected_ns_phase}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">EAST-WEST GREEN</span>
              <span className="text-emerald-400 font-bold text-xl block mt-0.5">
                {qaoaResult.signal_timings.east_west_green_sec}s
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {qaoaResult.decoded_solution?.selected_ew_phase}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">YELLOW TRANSITION</span>
              <span className="text-amber-400 font-bold text-xl block mt-0.5">
                {qaoaResult.signal_timings.yellow_time_sec}s
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Clearance phase</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">ALL-RED INTERVAL</span>
              <span className="text-rose-400 font-bold text-xl block mt-0.5">
                {qaoaResult.signal_timings.all_red_clearance_sec}s
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Intersection safety lock</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">FEASIBILITY STATUS</span>
              <span
                className={`font-bold text-base block mt-1.5 ${
                  qaoaResult.decoded_solution?.is_feasible ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {qaoaResult.decoded_solution?.is_feasible ? "✓ Valid One-Hot" : "Relaxed"}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {qaoaResult.decoded_solution?.is_feasible ? "Feasible state" : "Penalized state"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs between QAOA Circuit & Histogram and QUBO Formulation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveView("qaoa")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeView === "qaoa"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-4 h-4" />
          QAOA Circuit &amp; Measurement Histogram
        </button>

        <button
          onClick={() => setActiveView("qubo")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeView === "qubo"
              ? "bg-cyan-600 text-white shadow-sm"
              : "bg-slate-900 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          QUBO Matrix Formulation &amp; Weights
        </button>
      </div>

      {/* View 1: QAOA Circuit & Histogram */}
      {activeView === "qaoa" && (
        <div className="space-y-6">
          {/* QAOA Quantum Circuit Visualizer */}
          {qaoaResult?.circuit_specification && (
            <QAOACircuitVisualizer
              circuitSpec={qaoaResult.circuit_specification}
              backendName={backendDisplayName}
              isFallback={isFallback}
            />
          )}

          {/* Measurement Histogram Visualizer */}
          {qaoaResult && (
            <QAOAHistogramVisualizer
              topCandidates={qaoaResult.top_histogram}
              bestBitstring={qaoaResult.best_bitstring}
              shots={qaoaResult.shots}
              bestObjective={qaoaResult.objective_value}
            />
          )}
        </div>
      )}

      {/* View 2: QUBO Matrix Formulation & Weights */}
      {activeView === "qubo" && (
        <div className="space-y-6">
          {quboModel && (
            <QUBOMatrixVisualizer
              qMatrix={quboModel.q_matrix}
              variables={quboModel.variables}
              constantOffset={quboModel.constant_offset}
              ising={quboModel.ising}
              optimalSolution={quboModel.optimal_solution}
            />
          )}

          {/* Weights & Constraints Configurator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Objective Weights */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Objective Weights (w1 to w7)
                </h3>
                <button
                  onClick={() =>
                    setWeights({
                      waiting: 1.8,
                      queue: 2.2,
                      congestion: 1.5,
                      fuel: 1.2,
                      co2: 1.0,
                      emergency: 3.5,
                      switching: 0.8,
                    })
                  }
                  className="text-[11px] text-slate-400 hover:text-cyan-400 underline"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>w1: Waiting Time</span>
                    <span className="text-cyan-400 font-bold">{weights.waiting.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={weights.waiting}
                    onChange={(e) => setWeights({ ...weights, waiting: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>w2: Queue Length</span>
                    <span className="text-cyan-400 font-bold">{weights.queue.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={weights.queue}
                    onChange={(e) => setWeights({ ...weights, queue: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>w3: Congestion</span>
                    <span className="text-amber-400 font-bold">{weights.congestion.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={weights.congestion}
                    onChange={(e) => setWeights({ ...weights, congestion: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>w4: Fuel &amp; w5: CO2</span>
                    <span className="text-emerald-400 font-bold">{weights.fuel.toFixed(1)} / {weights.co2.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={weights.fuel}
                    onChange={(e) => setWeights({ ...weights, fuel: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="text-rose-300">w6: Emergency Delay</span>
                    <span className="text-rose-400 font-bold">{weights.emergency.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={10.0}
                    step={0.5}
                    value={weights.emergency}
                    onChange={(e) => setWeights({ ...weights, emergency: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Constraints & Penalties */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Constraints &amp; Penalties (&lambda;)
                </h3>
                <button
                  onClick={() =>
                    setPenalties({
                      one_hot: 25.0,
                      conflict: 8.0,
                      min_green: 12.0,
                      max_green: 10.0,
                      pedestrian: 14.0,
                      emergency_priority: 30.0,
                    })
                  }
                  className="text-[11px] text-slate-400 hover:text-cyan-400 underline"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>One-Hot Constraint (&lambda;<sub>one-hot</sub>)</span>
                    <span className="text-purple-400 font-bold">{penalties.one_hot.toFixed(0)}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={penalties.one_hot}
                    onChange={(e) => setPenalties({ ...penalties, one_hot: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Conflict &amp; Cycle Balance (&lambda;<sub>conflict</sub>)</span>
                    <span className="text-purple-400 font-bold">{penalties.conflict.toFixed(0)}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={2}
                    value={penalties.conflict}
                    onChange={(e) => setPenalties({ ...penalties, conflict: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Min Green</span>
                      <span className="text-cyan-400 font-bold">{penalties.min_green.toFixed(0)}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      value={penalties.min_green}
                      onChange={(e) => setPenalties({ ...penalties, min_green: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Max Green</span>
                      <span className="text-cyan-400 font-bold">{penalties.max_green.toFixed(0)}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      value={penalties.max_green}
                      onChange={(e) => setPenalties({ ...penalties, max_green: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
};

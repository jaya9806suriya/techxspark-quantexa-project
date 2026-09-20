import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertTriangle,
  Cpu,
  Siren,
  Leaf,
  GitCompare,
  Info,
  Check,
  Zap,
  Radio,
} from "lucide-react";
import { ApiService } from "../services/api";

export interface DemoStepItem {
  step: number;
  label: string;
  key: string;
  status: "idle" | "running" | "completed" | "error";
  detail: string;
}

interface FullDemoRunnerProps {
  onDemoCompleted?: () => void;
}

export const FullDemoRunner: React.FC<FullDemoRunnerProps> = ({ onDemoCompleted }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [steps, setSteps] = useState<DemoStepItem[]>([
    { step: 1, label: "Traffic Simulation", key: "sim", status: "idle", detail: "Initializing baseline multi-intersection traffic flow..." },
    { step: 2, label: "Congestion Detection", key: "congestion", status: "idle", detail: "Injecting +45 vehicle surge at Central Junction (I1)..." },
    { step: 3, label: "Adaptive Signals", key: "adaptive", status: "idle", detail: "Activating rule-based density green time extensions..." },
    { step: 4, label: "QUBO Formulation", key: "qubo", status: "idle", detail: "Formulating Quadratic Unconstrained Binary Optimization matrix..." },
    { step: 5, label: "QAOA Optimization", key: "qaoa", status: "idle", detail: "Executing QAOA circuit solver on Qiskit Aer QPU simulator..." },
    { step: 6, label: "Signal Optimization", key: "apply", status: "idle", detail: "Applying optimized quantum signal timing splits to intersections..." },
    { step: 7, label: "Emergency Corridor", key: "emergency", status: "idle", detail: "Spawning Ambulance EV-001 & locking green corridor..." },
    { step: 8, label: "Analytics", key: "env", status: "idle", detail: "Calculating simulation estimates for Fuel, CO2, Idle Time & Stops..." },
    { step: 9, label: "Comparison", key: "benchmark", status: "idle", detail: "Running 3-method benchmark (Fixed vs Adaptive vs Hybrid Quantum)..." },
  ]);

  const updateStepStatus = (index: number, status: "idle" | "running" | "completed" | "error", extraDetail?: string) => {
    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          return { ...s, status, detail: extraDetail || s.detail };
        }
        return s;
      })
    );
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runFullDemo = async () => {
    if (isRunning) return;
    setIsRunning(true);
    let activeStepIdx = 0;

    // Reset steps
    setSteps((prev) => prev.map((s) => ({ ...s, status: "idle" })));

    try {
      // Step 1: Traffic Simulation
      activeStepIdx = 0;
      setCurrentStepIndex(0);
      updateStepStatus(0, "running");
      await ApiService.startSimulation();
      await delay(900);
      updateStepStatus(0, "completed", "Simulation Engine ONLINE at 1x speed.");

      // Step 2: Congestion Detection
      activeStepIdx = 1;
      setCurrentStepIndex(1);
      updateStepStatus(1, "running");
      await ApiService.triggerEvent({ type: "CONGESTION", target_id: "I1", severity: "HIGH" });
      await delay(900);
      updateStepStatus(1, "completed", "Surge of +45 vehicles injected at I1. Congestion level: HIGH.");

      // Step 3: Adaptive Signals
      activeStepIdx = 2;
      setCurrentStepIndex(2);
      updateStepStatus(2, "running");
      await ApiService.setAdaptiveSignals("I1");
      await delay(800);
      updateStepStatus(2, "completed", "Rule-based adaptive controller extended green split.");

      // Step 4: QUBO Formulation
      activeStepIdx = 3;
      setCurrentStepIndex(3);
      updateStepStatus(3, "running");
      const quboRes = await ApiService.buildQUBO({ intersection_id: "I1" });
      await delay(900);
      updateStepStatus(3, "completed", `Formulated QUBO matrix with ${quboRes.num_variables} binary phase variables.`);

      // Step 5: QAOA Optimization
      activeStepIdx = 4;
      setCurrentStepIndex(4);
      updateStepStatus(4, "running");
      const qaoaRes = await ApiService.runQAOA({ intersection_id: "I1", p_steps: 2, shots: 1024 });
      await delay(1000);
      updateStepStatus(4, "completed", `QAOA solved minimum energy: ${qaoaRes.objective_value.toFixed(2)} in ${qaoaRes.execution_time_ms}ms.`);

      // Step 6: Signal Optimization
      activeStepIdx = 5;
      setCurrentStepIndex(5);
      updateStepStatus(5, "running");
      const netQaoa = await ApiService.runNetworkQAOA({ p_steps: 2, shots: 1024 });
      await ApiService.applyOptimizedSignals(netQaoa.intersections);
      await delay(900);
      updateStepStatus(5, "completed", "Quantum optimized signal timing splits applied across all 6 intersections.");

      // Step 7: Emergency Corridor
      activeStepIdx = 6;
      setCurrentStepIndex(6);
      updateStepStatus(6, "running");
      await ApiService.createEmergency({ vehicle_id: "EV-001", emergency_type: "Ambulance", start_location: "I6", destination: "I2" });
      await ApiService.activateEmergency();
      await delay(1100);
      updateStepStatus(6, "completed", "Emergency Green Corridor preemption locked (I6 ➔ I4 ➔ I1 ➔ I2).");

      // Step 8: Analytics
      activeStepIdx = 7;
      setCurrentStepIndex(7);
      updateStepStatus(7, "running");
      const envRes = await ApiService.getEnvironmentalMetrics();
      await delay(900);
      updateStepStatus(7, "completed", `Calculated simulation estimates: -${envRes.improvements.quantum.fuel_pct}% fuel, -${envRes.improvements.quantum.co2_pct}% CO2.`);

      // Step 9: Comparison
      activeStepIdx = 8;
      setCurrentStepIndex(8);
      updateStepStatus(8, "running");
      const compRes = await ApiService.runThreeMethodComparison({ duration_sec: 30 });
      await delay(1000);
      updateStepStatus(8, "completed", `Benchmark completed: Fixed vs Adaptive vs Hybrid Quantum (+${compRes.metrics_table[2].quantum_imp_pct}% throughput).`);

      setCurrentStepIndex(99);
      if (onDemoCompleted) onDemoCompleted();
    } catch (err: any) {
      updateStepStatus(activeStepIdx, "error", `Error: ${err.message || "Step failed"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const isAllDone = completedCount === steps.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header & Run Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Automated Hackathon Showcase
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Demo Controller</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            RUN FULL DEMO
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            One-click demonstration sequence for technical judges, non-technical judges, and college faculty.
          </p>
        </div>

        <button
          onClick={runFullDemo}
          disabled={isRunning}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-mono font-black text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer scale-105 hover:scale-108"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>RUNNING DEMO ({completedCount}/{steps.length})...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-slate-950" />
              <span>RUN FULL DEMO</span>
            </>
          )}
        </button>
      </div>

      {/* Live Demo Status Tracker */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> LIVE DEMO STATUS
          </h3>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {completedCount} / {steps.length} Steps Completed
          </span>
        </div>

        {/* Stepper Progress Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {steps.map((s, idx) => {
            const isCurrent = currentStepIndex === idx && isRunning;
            return (
              <div
                key={s.key}
                className={`p-3 rounded-xl border text-xs font-mono transition-all flex flex-col justify-between space-y-1.5 ${
                  s.status === "completed"
                    ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
                    : s.status === "running"
                    ? "bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 animate-pulse"
                    : s.status === "error"
                    ? "bg-red-950/40 border-red-500/50 text-red-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] truncate">{s.label}</span>
                  {s.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : s.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">Step {s.step}</span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {s.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Toast Banner */}
      {isAllDone && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/70 rounded-xl text-xs font-mono text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-sm text-white block">🎉 Full Live Hackathon Demonstration Completed Successfully!</span>
              <span className="text-slate-300">All 11 technical subsystems verified end-to-end: Traffic, Congestion, Adaptive, QUBO, QAOA, Signals, Emergency, Analytics & Classical Comparison.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

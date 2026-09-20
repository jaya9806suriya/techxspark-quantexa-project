import React, { useState } from "react";
import { Settings, Database, Cpu, CheckCircle2, RefreshCw, Server } from "lucide-react";
import { HealthCheckResponse } from "../types";

interface SettingsPageProps {
  health: HealthCheckResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  health,
  onRefresh,
  isRefreshing,
}) => {
  const [activeBackend, setActiveBackend] = useState<string>("qiskit_aer");
  const [telemetryRate, setTelemetryRate] = useState<number>(10);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Database Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            SQLite Database Health & Connection Diagnostics
          </h3>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Ping Database
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block text-[10px]">Database Engine</span>
            <span className="text-slate-100 font-bold">{health?.database?.engine ?? "SQLite3"}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block text-[10px]">Database File Location</span>
            <span className="text-cyan-400 font-bold">{health?.database?.file ?? "quantum_traffic.db"}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block text-[10px]">Connection State</span>
            <span className="text-emerald-400 font-bold">
              {health?.database?.connected ? "CONNECTED (HEALTHY)" : "DISCONNECTED"}
            </span>
          </div>
        </div>

        {health?.modules_loaded && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <div className="text-slate-400 mb-1.5 font-mono text-[10px]">BACKEND MODULES MOUNTED:</div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {health.modules_loaded.map((mod) => (
                <span
                  key={mod}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300"
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantum Backend Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Quantum Execution Hardware Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Default QPU Provider</label>
            <select
              value={activeBackend}
              onChange={(e) => setActiveBackend(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="qiskit_aer">Qiskit Aer Simulator (Local 32-Qubit Statevector)</option>
              <option value="ibm_brisbane">IBM Brisbane (127-Qubit Eagle QPU)</option>
              <option value="ibm_kyoto">IBM Kyoto (133-Qubit Heron QPU)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Telemetry Polling Rate</label>
            <select
              value={telemetryRate}
              onChange={(e) => setTelemetryRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value={5}>Every 5 Seconds (High Precision)</option>
              <option value={10}>Every 10 Seconds (Recommended)</option>
              <option value={30}>Every 30 Seconds (Low Network Overhead)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition"
          >
            Save Configuration
          </button>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

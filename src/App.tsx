import React, { useState, useEffect, useCallback } from "react";
import {
  PageId,
  TrafficNode,
  TrafficEdge,
  LiveMetrics,
  OptimizationRun,
  EmergencyCorridor,
  Incident,
  HealthCheckResponse,
} from "./types";
import { ApiService } from "./services/api";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveTrafficPage } from "./pages/LiveTrafficPage";
import { TrafficNetworkPage } from "./pages/TrafficNetworkPage";
import { QuantumOptimizerPage } from "./pages/QuantumOptimizerPage";
import { EmergencyCorridorPage } from "./pages/EmergencyCorridorPage";
import { EventsIncidentsPage } from "./pages/EventsIncidentsPage";
import { SimulationPage } from "./pages/SimulationPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ClassicalVsQuantumPage } from "./pages/ClassicalVsQuantumPage";
import { OptimizationHistoryPage } from "./pages/OptimizationHistoryPage";
import { DocumentationPage } from "./pages/DocumentationPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [nodes, setNodes] = useState<TrafficNode[]>([]);
  const [edges, setEdges] = useState<TrafficEdge[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [history, setHistory] = useState<OptimizationRun[]>([]);
  const [corridors, setCorridors] = useState<EmergencyCorridor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        healthRes,
        nodesRes,
        edgesRes,
        metricsRes,
        historyRes,
        corridorsRes,
        incidentsRes,
      ] = await Promise.all([
        ApiService.getHealth().catch(() => null),
        ApiService.getTrafficNodes().catch(() => []),
        ApiService.getTrafficEdges().catch(() => []),
        ApiService.getLiveMetrics().catch(() => null),
        ApiService.getOptimizationHistory().catch(() => []),
        ApiService.getEmergencyCorridors().catch(() => []),
        ApiService.getIncidents().catch(() => []),
      ]);

      if (healthRes) setHealth(healthRes);
      if (nodesRes) setNodes(nodesRes);
      if (edgesRes) setEdges(edgesRes);
      if (metricsRes) setLiveMetrics(metricsRes);
      if (historyRes) setHistory(historyRes);
      if (corridorsRes) setCorridors(corridorsRes);
      if (incidentsRes) setIncidents(incidentsRes);
    } catch (err) {
      console.error("Failed to fetch initial telemetry", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // Auto-refresh telemetry every 12 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const activeEmergencyCount = corridors.filter((c) => c.active).length;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Command Center Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        dbConnected={Boolean(health?.database?.connected)}
        activeQubits={32}
        nodeCount={nodes.length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          health={health}
          liveMetrics={liveMetrics}
          activeEmergencyCount={activeEmergencyCount}
          onRefresh={fetchAllData}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <ErrorBoundary key={currentPage}>
          {currentPage === "dashboard" && (
            <DashboardPage
              nodes={nodes}
              edges={edges}
              liveMetrics={liveMetrics}
              history={history}
              corridors={corridors}
              incidents={incidents}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === "live-traffic" && (
            <LiveTrafficPage
              nodes={nodes}
              edges={edges}
              incidents={incidents}
            />
          )}

          {currentPage === "traffic-network" && (
            <TrafficNetworkPage
              nodes={nodes}
              edges={edges}
            />
          )}

          {currentPage === "quantum-optimizer" && (
            <QuantumOptimizerPage
              onRunCompleted={fetchAllData}
              onNavigateToSimulation={() => setCurrentPage("simulation")}
            />
          )}

          {currentPage === "emergency-corridor" && (
            <EmergencyCorridorPage
              corridors={corridors}
              onRefresh={fetchAllData}
            />
          )}

          {currentPage === "events-incidents" && (
            <EventsIncidentsPage
              incidents={incidents}
            />
          )}

          {currentPage === "simulation" && (
            <SimulationPage />
          )}

          {currentPage === "analytics" && (
            <AnalyticsPage />
          )}

          {currentPage === "classical-vs-quantum" && (
            <ClassicalVsQuantumPage />
          )}

          {currentPage === "optimization-history" && (
            <OptimizationHistoryPage
              history={history}
              onRefresh={fetchAllData}
              isRefreshing={isRefreshing}
            />
          )}

          {currentPage === "documentation" && (
            <DocumentationPage />
          )}

          {currentPage === "settings" && (
            <SettingsPage
              health={health}
              onRefresh={fetchAllData}
              isRefreshing={isRefreshing}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

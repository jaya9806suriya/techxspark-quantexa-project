import {
  HealthCheckResponse,
  TrafficNode,
  TrafficEdge,
  LiveMetrics,
  OptimizationRun,
  EmergencyCorridor,
  Incident,
  SimulationState,
  AnalyticsData,
  Intersection,
  IntersectionRoad,
  TrafficSignal,
  NetworkGraphData,
  TrafficSummaryData,
  SimulationEngineStatus,
  TrafficIntensity,
  SignalsTelemetryResponse,
} from "../types";

export class ApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API error (${res.status}): ${errorBody}`);
    }

    return res.json();
  }

  static async getHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>("/api/health");
  }

  static async getTrafficNodes(): Promise<TrafficNode[]> {
    return this.request<TrafficNode[]>("/api/traffic/nodes");
  }

  static async getTrafficEdges(): Promise<TrafficEdge[]> {
    return this.request<TrafficEdge[]>("/api/traffic/edges");
  }

  static async getLiveMetrics(): Promise<LiveMetrics> {
    return this.request<LiveMetrics>("/api/traffic/live-metrics");
  }

  static async getQuantumStatus(): Promise<any> {
    return this.request<any>("/api/quantum/status");
  }

  static async getOptimizationHistory(): Promise<OptimizationRun[]> {
    return this.request<OptimizationRun[]>("/api/quantum/history");
  }

  static async triggerOptimization(params: {
    algorithm: string;
    backend: string;
    p_steps?: number;
    shots?: number;
  }): Promise<any> {
    return this.request<any>("/api/quantum/optimize", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  static async getEmergencyCorridors(): Promise<EmergencyCorridor[]> {
    return this.request<EmergencyCorridor[]>("/api/emergency/corridors");
  }

  static async toggleEmergencyCorridor(corridor_id: string, active: boolean): Promise<EmergencyCorridor> {
    return this.request<EmergencyCorridor>("/api/emergency/toggle", {
      method: "POST",
      body: JSON.stringify({ corridor_id, active }),
    });
  }

  static async getIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>("/api/incidents");
  }

  static async getSimulationState(): Promise<SimulationState> {
    return this.request<SimulationState>("/api/simulation/state");
  }

  static async controlSimulation(action: "play" | "pause" | "reset", speed: number = 1.0): Promise<SimulationState> {
    return this.request<SimulationState>("/api/simulation/control", {
      method: "POST",
      body: JSON.stringify({ action, speed }),
    });
  }

  static async getAnalyticsSummary(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>("/api/analytics/summary");
  }

  // Phase 2: Multi-Intersection Traffic Network
  static async getIntersections(): Promise<Intersection[]> {
    return this.request<Intersection[]>("/api/intersections");
  }

  static async getIntersectionById(id: string): Promise<Intersection> {
    return this.request<Intersection>(`/api/intersections/${id}`);
  }

  static async getTrafficData(): Promise<TrafficSummaryData> {
    return this.request<TrafficSummaryData>("/api/traffic");
  }

  static async getSignals(): Promise<TrafficSignal[]> {
    return this.request<TrafficSignal[]>("/api/signals");
  }

  static async getNetworkGraph(): Promise<NetworkGraphData> {
    return this.request<NetworkGraphData>("/api/network");
  }

  // Phase 3: Real-Time Traffic Simulation APIs
  static async startSimulation(): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/start", {
      method: "POST",
    });
  }

  static async pauseSimulation(): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/pause", {
      method: "POST",
    });
  }

  static async resetSimulation(): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/reset", {
      method: "POST",
    });
  }

  static async getSimulationStatus(): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/status");
  }

  static async setSimulationSpeed(speed: number): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/speed", {
      method: "POST",
      body: JSON.stringify({ speed }),
    });
  }

  static async setTrafficIntensity(intensity: TrafficIntensity, custom_rate?: number): Promise<SimulationEngineStatus> {
    return this.request<SimulationEngineStatus>("/api/simulation/intensity", {
      method: "POST",
      body: JSON.stringify({ intensity, custom_rate }),
    });
  }

  // Phase 4: Adaptive Traffic Signal Control APIs
  static async getSignalsTelemetry(): Promise<SignalsTelemetryResponse> {
    return this.request<SignalsTelemetryResponse>("/api/signals");
  }

  static async setAdaptiveSignals(intersection_id?: string): Promise<SignalsTelemetryResponse> {
    return this.request<SignalsTelemetryResponse>("/api/signals/adaptive", {
      method: "POST",
      body: JSON.stringify({ intersection_id }),
    });
  }

  static async setManualSignals(payload: {
    intersection_id?: string;
    green_time?: number;
    yellow_time?: number;
    all_red_time?: number;
  }): Promise<SignalsTelemetryResponse> {
    return this.request<SignalsTelemetryResponse>("/api/signals/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Phase 5: QUBO Formulation APIs
  static async buildQUBO(params?: import("../types").QUBOBuildRequest): Promise<import("../types").QUBOModelResponse> {
    return this.request<import("../types").QUBOModelResponse>("/api/quantum/qubo", {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  }

  static async getLatestQUBO(): Promise<import("../types").QUBOModelResponse> {
    return this.request<import("../types").QUBOModelResponse>("/api/quantum/qubo/latest");
  }

  // Phase 6: QAOA Quantum Optimization Engine APIs
  static async runQAOA(params?: import("../types").QAOARequest): Promise<import("../types").QAOAResultResponse> {
    return this.request<import("../types").QAOAResultResponse>("/api/quantum/qaoa", {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  }

  static async getQAOAStatus(): Promise<import("../types").QAOAStatusResponse> {
    return this.request<import("../types").QAOAStatusResponse>("/api/quantum/status");
  }

  // Phase 7: Quantum-Optimized Traffic Signals APIs
  static async runNetworkQAOA(params?: {
    p_steps?: number;
    shots?: number;
    weights?: any;
    penalties?: any;
    traffic_states?: any;
  }): Promise<import("../types").NetworkQAOAResult> {
    return this.request<import("../types").NetworkQAOAResult>("/api/quantum/optimize-network", {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  }

  static async applyOptimizedSignals(timingsData?: any): Promise<import("../types").ApplyOptimizedSignalsResponse> {
    return this.request<import("../types").ApplyOptimizedSignalsResponse>("/api/quantum/apply-signals", {
      method: "POST",
      body: JSON.stringify({ timings: timingsData }),
    });
  }

  static async runControlledBenchmark(
    durationSec: number = 60,
    timingsData?: any,
  ): Promise<import("../types").ControlledBenchmarkResponse> {
    return this.request<import("../types").ControlledBenchmarkResponse>("/api/quantum/benchmark", {
      method: "POST",
      body: JSON.stringify({ duration_sec: durationSec, timings: timingsData }),
    });
  }

  // Phase 8: Emergency Green Corridor APIs
  static async createEmergency(payload: {
    vehicle_id: string;
    emergency_type: string;
    start_location: string;
    destination: string;
    priority: string;
    algorithm?: string;
  }): Promise<any> {
    return this.request<any>("/api/emergency/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async activateEmergency(payload?: any): Promise<any> {
    return this.request<any>("/api/emergency/activate", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  static async getEmergencyStatus(): Promise<any> {
    return this.request<any>("/api/emergency/status");
  }

  static async completeEmergency(payload?: any): Promise<any> {
    return this.request<any>("/api/emergency/complete", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  // Phase 9: Dynamic Event Management APIs
  static async triggerEvent(payload: {
    type: string;
    target_id?: string;
    severity?: string;
    vehicle_id?: string;
    start_location?: string;
    destination?: string;
    priority?: string;
  }): Promise<any> {
    return this.request<any>("/api/events/trigger", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async resolveEvent(eventId: string): Promise<any> {
    return this.request<any>("/api/events/resolve", {
      method: "POST",
      body: JSON.stringify({ event_id: eventId }),
    });
  }

  static async getEventsHistory(): Promise<import("../types").DynamicEventsSummaryResponse> {
    return this.request<import("../types").DynamicEventsSummaryResponse>("/api/events/history");
  }

  static async clearEvents(): Promise<any> {
    return this.request<any>("/api/events/clear", {
      method: "POST",
    });
  }

  static async getEnvironmentalMetrics(
    config?: import("../types").EnvironmentalConfig
  ): Promise<import("../types").EnvironmentalResponse> {
    return this.request<import("../types").EnvironmentalResponse>("/api/analytics/environmental", {
      method: "POST",
      body: JSON.stringify(config || {}),
    });
  }

  // Phase 11: Classical vs Quantum 3-Method Comparison API
  static async runThreeMethodComparison(params?: {
    duration_sec?: number;
    intensity?: string;
    p_steps?: number;
  }): Promise<import("../types").ThreeMethodComparisonResponse> {
    return this.request<import("../types").ThreeMethodComparisonResponse>("/api/quantum/compare-three-methods", {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  }
}




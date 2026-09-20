import { useState, useEffect, useRef, useCallback } from "react";
import {
  SimulationEngineStatus,
  TrafficIntensity,
  SimulationSpeed,
  RealTimeSimulationKPIs,
} from "../types";
import { ApiService } from "./api";

export function useTrafficSimulation() {
  const [status, setStatus] = useState<SimulationEngineStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionMode, setConnectionMode] = useState<"websocket" | "sse" | "polling">("websocket");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const handleIncomingState = useCallback((nextState: SimulationEngineStatus) => {
    setStatus(nextState);
  }, []);

  // Initialize and maintain real-time link
  useEffect(() => {
    let isUnmounted = false;

    // 1. Initial REST fetch for instant display
    ApiService.getSimulationStatus()
      .then((data) => {
        if (!isUnmounted) setStatus(data);
      })
      .catch((err) => {
        console.warn("Initial sim status error:", err.message);
      });

    // 2. Try WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/traffic`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) return;
        setIsConnected(true);
        setConnectionMode("websocket");
        setError(null);
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "init" || parsed.type === "update" || parsed.type === "status") {
            handleIncomingState(parsed.data);
          }
        } catch (e) {
          console.error("Failed to parse WS payload:", e);
        }
      };

      ws.onerror = () => {
        // If WebSocket errors, fallback to SSE
        if (!isUnmounted && connectionMode === "websocket") {
          fallbackToSSE();
        }
      };

      ws.onclose = () => {
        if (!isUnmounted && connectionMode === "websocket") {
          setIsConnected(false);
          fallbackToSSE();
        }
      };
    } catch (e) {
      fallbackToSSE();
    }

    // 3. Fallback to Server-Sent Events
    function fallbackToSSE() {
      if (sseRef.current || isUnmounted) return;
      try {
        const sse = new EventSource("/api/simulation/stream");
        sseRef.current = sse;

        sse.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          setConnectionMode("sse");
        };

        sse.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "init" || parsed.type === "update") {
              handleIncomingState(parsed.data);
            }
          } catch (err) {
            console.error("SSE parse error:", err);
          }
        };

        sse.onerror = () => {
          sse.close();
          sseRef.current = null;
          fallbackToPolling();
        };
      } catch (err) {
        fallbackToPolling();
      }
    }

    // 4. Ultimate Fallback: Polling every 1.5s
    function fallbackToPolling() {
      if (pollTimerRef.current || isUnmounted) return;
      setConnectionMode("polling");
      setIsConnected(true);

      const poll = async () => {
        try {
          const res = await ApiService.getSimulationStatus();
          if (!isUnmounted) {
            handleIncomingState(res);
          }
        } catch (e: any) {
          if (!isUnmounted) setError(e.message);
        }
      };

      poll();
      pollTimerRef.current = window.setInterval(poll, 1500);
    }

    return () => {
      isUnmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [handleIncomingState, connectionMode]);

  // Actions
  const start = useCallback(async () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "start" }));
      }
      const res = await ApiService.startSimulation();
      handleIncomingState(res);
    } catch (e: any) {
      setError(e.message);
    }
  }, [handleIncomingState]);

  const pause = useCallback(async () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "pause" }));
      }
      const res = await ApiService.pauseSimulation();
      handleIncomingState(res);
    } catch (e: any) {
      setError(e.message);
    }
  }, [handleIncomingState]);

  const reset = useCallback(async () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "reset" }));
      }
      const res = await ApiService.resetSimulation();
      handleIncomingState(res);
    } catch (e: any) {
      setError(e.message);
    }
  }, [handleIncomingState]);

  const setSpeed = useCallback(
    async (speed: SimulationSpeed) => {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: "speed", speed }));
        }
        const res = await ApiService.setSimulationSpeed(speed);
        handleIncomingState(res);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [handleIncomingState]
  );

  const setIntensity = useCallback(
    async (intensity: TrafficIntensity, customRate?: number) => {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: "intensity", intensity, custom_rate: customRate }));
        }
        const res = await ApiService.setTrafficIntensity(intensity, customRate);
        handleIncomingState(res);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [handleIncomingState]
  );

  return {
    status,
    kpis: status?.kpis ?? null,
    intersections: status?.intersections ?? [],
    roads: status?.roads ?? [],
    history: status?.history ?? [],
    isRunning: status?.is_running ?? false,
    speedMultiplier: status?.speed_multiplier ?? 1,
    intensity: status?.traffic_intensity ?? "MEDIUM",
    customRate: status?.custom_rate ?? 60,
    simTime: status?.sim_time ?? 0,
    stepCount: status?.step_count ?? 0,
    isConnected,
    connectionMode,
    error,
    start,
    pause,
    reset,
    setSpeed,
    setIntensity,
  };
}

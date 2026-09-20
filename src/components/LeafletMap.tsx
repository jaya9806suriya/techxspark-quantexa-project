import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { TrafficNode, TrafficEdge, Incident, Intersection, IntersectionRoad } from "../types";

interface LeafletMapProps {
  nodes?: TrafficNode[];
  edges?: TrafficEdge[];
  intersections?: Intersection[];
  roads?: IntersectionRoad[];
  incidents?: Incident[];
  selectedIntersectionId?: string;
  onSelectNode?: (node: TrafficNode) => void;
  onSelectEdge?: (edge: TrafficEdge) => void;
  onSelectIntersection?: (intersection: Intersection) => void;
  center?: [number, number];
  zoom?: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  nodes = [],
  edges = [],
  intersections = [],
  roads = [],
  incidents = [],
  selectedIntersectionId,
  onSelectNode,
  onSelectEdge,
  onSelectIntersection,
  center = [37.781, -122.408],
  zoom = 14,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Add Zoom Control at top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Add Dark/CartoDB/OpenStreetMap styled tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update vectors on data change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // IF PHASE 2 INTERSECTIONS EXIST, RENDER PHASE 2 NETWORK FIRST
    if (intersections.length > 0) {
      const interMap = new Map<string, Intersection>();
      intersections.forEach((i) => interMap.set(i.id, i));

      // Draw Phase 2 Roads
      roads.forEach((road) => {
        const src = interMap.get(road.source_id);
        const tgt = interMap.get(road.target_id);
        if (!src || !tgt) return;

        const color =
          road.congestion_level === "CRITICAL"
            ? "#ef4444" // red
            : road.congestion_level === "HIGH"
            ? "#f97316" // orange
            : road.congestion_level === "MEDIUM"
            ? "#f59e0b" // amber
            : "#10b981"; // emerald

        const weight = road.congestion_level === "CRITICAL" ? 5 : 3.5;

        const polyline = L.polyline(
          [
            [src.latitude, src.longitude],
            [tgt.latitude, tgt.longitude],
          ],
          {
            color,
            weight,
            opacity: 0.85,
            dashArray: road.congestion_level === "CRITICAL" ? "6, 6" : undefined,
          }
        );

        polyline.bindPopup(`
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #0284c7;">
              ${road.street_name}
            </div>
            <div><strong>Trajectory:</strong> ${road.source_id} &rarr; ${road.target_id}</div>
            <div><strong>Congestion:</strong> <span style="color:${color}; font-weight:700;">${road.congestion_level}</span></div>
            <div><strong>Speed Limit:</strong> ${road.speed_limit_kmh} km/h</div>
            <div><strong>Road Capacity:</strong> ${road.road_capacity} vehicles/min</div>
            <div><strong>Current Flow:</strong> ${road.current_flow} vehicles/min</div>
            <div><strong>Distance:</strong> ${road.distance_km} km</div>
          </div>
        `);

        polyline.addTo(layerGroup);
      });

      // Draw Phase 2 Intersections with custom Traffic Light marker
      intersections.forEach((item) => {
        const isSelected = selectedIntersectionId === item.id;
        const congestionBg =
          item.congestion_level === "CRITICAL"
            ? "#ef4444"
            : item.congestion_level === "HIGH"
            ? "#f97316"
            : item.congestion_level === "MEDIUM"
            ? "#f59e0b"
            : "#10b981";

        const isGreen = item.current_signal_phase.includes("GREEN");
        const isYellow = item.current_signal_phase.includes("YELLOW");
        const activeLightColor = isGreen ? "#22c55e" : isYellow ? "#eab308" : "#ef4444";

        const customIcon = L.divIcon({
          className: "custom-traffic-light-pin",
          html: `
            <div style="
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform: translate(-50%, -100%);
            ">
              <!-- Traffic Light Mini Beacon -->
              <div style="
                background: #0f172a;
                border: 2px solid ${isSelected ? '#38bdf8' : congestionBg};
                box-shadow: ${isSelected ? '0 0 12px #38bdf8' : '0 2px 8px rgba(0,0,0,0.5)'};
                border-radius: 8px;
                padding: 3px 6px;
                display: flex;
                align-items: center;
                gap: 5px;
                color: #ffffff;
                font-family: monospace;
                font-size: 11px;
                font-weight: 700;
              ">
                <span style="
                  width: 9px;
                  height: 9px;
                  border-radius: 50%;
                  background: ${activeLightColor};
                  box-shadow: 0 0 6px ${activeLightColor};
                  display: inline-block;
                "></span>
                <span>${item.id}</span>
              </div>
              <!-- Queue Tag -->
              <div style="
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                font-size: 9px;
                color: #cbd5e1;
                padding: 1px 4px;
                margin-top: 2px;
                white-space: nowrap;
                font-family: sans-serif;
              ">
                ${item.queue_length} veh
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });

        // Popup matching the exact required format from instructions
        marker.bindPopup(`
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; color: #0f172a; padding: 4px; min-width: 180px;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              Intersection ${item.id} &mdash; ${item.name}
            </div>
            <div style="margin-bottom: 2px;"><strong>Vehicle Density:</strong> <span style="font-weight:700; color:${congestionBg};">${item.vehicle_density}</span></div>
            <div style="margin-bottom: 2px;"><strong>Queue:</strong> ${item.queue_length} vehicles</div>
            <div style="margin-bottom: 2px;"><strong>Current Phase:</strong> <span style="color:#0284c7; font-weight:600;">${item.current_signal_phase}</span></div>
            <div style="margin-bottom: 2px;"><strong>Green Time:</strong> ${item.green_time} sec</div>
            <div style="margin-bottom: 2px;"><strong>Road Capacity:</strong> ${item.road_capacity} vehicles/min</div>
            <div style="margin-bottom: 2px;"><strong>Congestion:</strong> <span style="font-weight:700; color:${congestionBg};">${item.congestion_level}</span></div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
              Speed: ${item.average_speed} km/h | Pedestrians: ${item.pedestrian_count}
            </div>
          </div>
        `);

        marker.on("click", () => {
          if (onSelectIntersection) onSelectIntersection(item);
        });

        marker.addTo(layerGroup);
      });
    } else {
      // LEGACY NODES & EDGES FALLBACK
      const nodeMap = new Map<string, TrafficNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      edges.forEach((edge) => {
        const src = nodeMap.get(edge.source_id);
        const tgt = nodeMap.get(edge.target_id);
        if (!src || !tgt) return;

        const color =
          edge.congestion_level === "CRITICAL"
            ? "#ef4444"
            : edge.congestion_level === "HEAVY"
            ? "#f97316"
            : edge.congestion_level === "MODERATE"
            ? "#f59e0b"
            : "#10b981";

        const polyline = L.polyline(
          [
            [src.latitude, src.longitude],
            [tgt.latitude, tgt.longitude],
          ],
          { color, weight: 3.5, opacity: 0.85 }
        );
        polyline.addTo(layerGroup);
      });

      nodes.forEach((node) => {
        const circle = L.circleMarker([node.latitude, node.longitude], {
          radius: 6,
          fillColor: "#06b6d4",
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });
        circle.addTo(layerGroup);
      });
    }

    // Incidents
    incidents.forEach((inc) => {
      const marker = L.circleMarker([inc.latitude, inc.longitude], {
        radius: 9,
        fillColor: "#e11d48",
        color: "#ffd1d9",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
          <div style="font-weight: 700; color: #e11d48;">[INCIDENT] ${inc.title}</div>
          <div><strong>Severity:</strong> ${inc.severity}</div>
          <div><strong>Type:</strong> ${inc.incident_type}</div>
        </div>
      `);
      marker.addTo(layerGroup);
    });
  }, [nodes, edges, intersections, roads, incidents, selectedIntersectionId, onSelectNode, onSelectEdge, onSelectIntersection]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-md p-2.5 text-[11px] space-y-1.5 z-[1000] text-slate-300">
        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[9px]">
          Congestion Level
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-1 rounded-sm bg-emerald-500" />
          <span>LOW (Fluids flow)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-1 rounded-sm bg-amber-500" />
          <span>MEDIUM (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-1 rounded-sm bg-orange-500" />
          <span>HIGH (Heavy queue)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-1 rounded-sm bg-red-500" />
          <span>CRITICAL (Gridlock)</span>
        </div>
        <div className="pt-1 border-t border-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-cyan-400 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <span>Traffic Signal Light</span>
        </div>
      </div>
    </div>
  );
};


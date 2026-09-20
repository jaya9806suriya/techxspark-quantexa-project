import React from "react";
import { LightHeadState, SignalPhaseState } from "../types";
import { ShieldCheck, Clock, ArrowUpDown, ArrowLeftRight } from "lucide-react";

interface AnimatedTrafficLightProps {
  id?: string;
  lightStatus?: LightHeadState;
  lightStatusNs?: LightHeadState;
  lightStatusEw?: LightHeadState;
  currentPhase?: SignalPhaseState | string;
  remainingTimeSec?: number;
  phaseTotalDuration?: number;
  size?: "sm" | "md" | "lg";
  showDualHeads?: boolean;
  activeCorridor?: string;
  showCountdown?: boolean;
}

export const AnimatedTrafficLight: React.FC<AnimatedTrafficLightProps> = ({
  id = "traffic-light",
  lightStatus,
  lightStatusNs,
  lightStatusEw,
  currentPhase = "North-South GREEN",
  remainingTimeSec = 0,
  phaseTotalDuration = 45,
  size = "md",
  showDualHeads = false,
  activeCorridor,
  showCountdown = true,
}) => {
  // If dual heads not passed, fallback to active single head
  const isNsActive = currentPhase.includes("North-South");
  const isAllRed = currentPhase.includes("ALL RED");

  const nsLights: LightHeadState = lightStatusNs || {
    red: !isNsActive || isAllRed,
    yellow: isNsActive && currentPhase.includes("YELLOW"),
    green: isNsActive && currentPhase.includes("GREEN"),
  };

  const ewLights: LightHeadState = lightStatusEw || {
    red: isNsActive || isAllRed,
    yellow: !isNsActive && !isAllRed && currentPhase.includes("YELLOW"),
    green: !isNsActive && !isAllRed && currentPhase.includes("GREEN"),
  };

  // Lens diameter sizing based on prop
  const sizeConfig = {
    sm: {
      lens: "w-4 h-4",
      housing: "p-1.5 gap-1.5 rounded-lg",
      counterText: "text-xs",
      label: "text-[10px]",
    },
    md: {
      lens: "w-7 h-7",
      housing: "p-2 gap-2 rounded-xl",
      counterText: "text-sm",
      label: "text-xs",
    },
    lg: {
      lens: "w-10 h-10",
      housing: "p-3 gap-3 rounded-2xl",
      counterText: "text-base font-mono font-bold",
      label: "text-xs font-semibold",
    },
  }[size];

  const renderSingleHead = (
    lights: LightHeadState,
    directionLabel: string,
    icon: React.ReactNode,
    isActiveCorridor: boolean
  ) => {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 mb-1 text-slate-300 font-medium text-[11px]">
          {icon}
          <span>{directionLabel}</span>
          {isActiveCorridor && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
          )}
        </div>

        {/* Outer Matte Signal Housing */}
        <div
          id={`${id}-housing-${directionLabel.toLowerCase()}`}
          className={`flex flex-col items-center bg-slate-950 border-2 ${
            isActiveCorridor ? "border-slate-700 shadow-lg shadow-black/40" : "border-slate-800/80"
          } ${sizeConfig.housing} relative shadow-inner`}
        >
          {/* Visor / Sun Shield Top Accent */}
          <div className="w-full h-1 bg-slate-800 rounded-t-sm mb-0.5 opacity-60" />

          {/* RED LENS */}
          <div className="relative group">
            <div
              className={`${sizeConfig.lens} rounded-full transition-all duration-300 flex items-center justify-center ${
                lights.red
                  ? "bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.95)] ring-2 ring-red-400/50 animate-pulse"
                  : "bg-red-950/40 border border-red-950/60 opacity-35"
              }`}
            >
              {lights.red && (
                <div className="w-1/3 h-1/3 rounded-full bg-red-200/80 blur-[1px]" />
              )}
            </div>
            {/* Hood cap illusion */}
            <div className="absolute -top-1 left-0 right-0 h-1 rounded-t-full bg-black/60 pointer-events-none" />
          </div>

          {/* YELLOW LENS */}
          <div className="relative group">
            <div
              className={`${sizeConfig.lens} rounded-full transition-all duration-300 flex items-center justify-center ${
                lights.yellow
                  ? "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.95)] ring-2 ring-amber-300/50 animate-pulse"
                  : "bg-amber-950/40 border border-amber-950/60 opacity-35"
              }`}
            >
              {lights.yellow && (
                <div className="w-1/3 h-1/3 rounded-full bg-amber-100/90 blur-[1px]" />
              )}
            </div>
            <div className="absolute -top-1 left-0 right-0 h-1 rounded-t-full bg-black/60 pointer-events-none" />
          </div>

          {/* GREEN LENS */}
          <div className="relative group">
            <div
              className={`${sizeConfig.lens} rounded-full transition-all duration-300 flex items-center justify-center ${
                lights.green
                  ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.95)] ring-2 ring-emerald-300/50 animate-pulse"
                  : "bg-emerald-950/40 border border-emerald-950/60 opacity-35"
              }`}
            >
              {lights.green && (
                <div className="w-1/3 h-1/3 rounded-full bg-emerald-100/90 blur-[1px]" />
              )}
            </div>
            <div className="absolute -top-1 left-0 right-0 h-1 rounded-t-full bg-black/60 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  };

  const activeLights = lightStatus || (isNsActive ? nsLights : ewLights);

  return (
    <div id={id} className="flex flex-col items-center gap-2">
      {showDualHeads ? (
        <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
          {renderSingleHead(nsLights, "N-S", <ArrowUpDown className="w-3 h-3 text-cyan-400" />, isNsActive && !isAllRed)}
          <div className="w-[1px] h-20 bg-slate-800 self-center" />
          {renderSingleHead(ewLights, "E-W", <ArrowLeftRight className="w-3 h-3 text-indigo-400" />, !isNsActive && !isAllRed)}
        </div>
      ) : (
        renderSingleHead(
          activeLights,
          activeCorridor || (isNsActive ? "North-South" : "East-West"),
          isNsActive ? <ArrowUpDown className="w-3 h-3 text-cyan-400" /> : <ArrowLeftRight className="w-3 h-3 text-indigo-400" />,
          true
        )
      )}

      {/* Countdown timer display */}
      {showCountdown && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-200">
          <Clock className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span className={`${sizeConfig.counterText} font-mono font-semibold`}>
            {Math.max(0, Math.round(remainingTimeSec))}s
          </span>
          <span className="text-[10px] text-slate-400 font-sans">remaining</span>
        </div>
      )}
    </div>
  );
};

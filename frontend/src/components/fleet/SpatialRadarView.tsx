import React, { useState } from 'react';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  Layers,
  Plane,
  AlertTriangle,
  RotateCcw,
  Eye,
  Activity
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const SpatialRadarView: React.FC = () => {
  const {
    fleet,
    selectedEngineId,
    setSelectedEngineId,
    activeFilter,
    viewMode,
    setViewMode,
    mission
  } = useTelemetry();

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      id="airspace-theatre-viewport"
      className="relative w-full h-[480px] bg-[#090e1b] rounded-xl overflow-hidden shadow-2xl border border-[#3b494b]/30 p-4 flex flex-col justify-between select-none"
    >
      {/* Radar Scanline Background / SVG Coordinate Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45 transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg className="w-full h-full text-[#3b494b]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tactical-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.5" />
              <circle cx="24" cy="24" r="0.75" fill="currentColor" fillOpacity="0.3" />
            </pattern>
            <radialGradient id="radar-glow" cx="50%" cy="52%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.09" />
              <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#tactical-grid)" />
          <rect width="100%" height="100%" fill="url(#radar-glow)" />

          {/* Airspace Concentric Radar Rings Centered on Command Base */}
          <circle cx="50%" cy="52%" r="90" fill="none" stroke="#00f0ff" strokeDasharray="3 4" strokeOpacity="0.22" strokeWidth="0.75" />
          <circle cx="50%" cy="52%" r="180" fill="none" stroke="#00f0ff" strokeOpacity="0.28" strokeWidth="0.75" />
          <circle cx="50%" cy="52%" r="270" fill="none" stroke="#00f0ff" strokeDasharray="4 6" strokeOpacity="0.18" strokeWidth="0.75" />
          <circle cx="50%" cy="52%" r="360" fill="none" stroke="#00f0ff" strokeDasharray="2 4" strokeOpacity="0.12" strokeWidth="0.5" />

          {/* Crosshair Coordinate Axes */}
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#00f0ff" strokeOpacity="0.25" strokeWidth="0.5" />
          <line x1="0%" y1="52%" x2="100%" y2="52%" stroke="#00f0ff" strokeOpacity="0.25" strokeWidth="0.5" />

          {/* Diagonal Sector Lines */}
          <line x1="10%" y1="10%" x2="90%" y2="94%" stroke="#00f0ff" strokeOpacity="0.1" strokeDasharray="4 8" strokeWidth="0.5" />
          <line x1="10%" y1="94%" x2="90%" y2="10%" stroke="#00f0ff" strokeOpacity="0.1" strokeDasharray="4 8" strokeWidth="0.5" />

          {/* Flight Vector Paths */}
          {/* UAV-01 ISR Loiter */}
          <path d="M 280,310 Q 380,210 520,180 T 780,140" fill="none" stroke="#00f0ff" strokeDasharray="6 3" strokeOpacity="0.5" strokeWidth="1.2" />
          {/* UAV-03 Emergency RTB Path to Runway 09 */}
          <path d="M 640,360 L 510,270 L 410,260" fill="none" stroke="#ef4444" strokeDasharray="4 4" strokeOpacity="0.7" strokeWidth="1.6" />
          {/* UAV-04 Maritime Recon Arc */}
          <path d="M 220,160 Q 320,120 450,110 T 690,95" fill="none" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.2" />
          {/* Airbase Home Vector Center Icon */}
          <polygon points="50%,50% 49.5%,53% 50.5%,53%" fill="#00f0ff" opacity="0.8" />
        </svg>
      </div>

      {/* Radar Sweep Simulation Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="w-[840px] h-[840px] absolute -top-[180px] -left-[180px] sm:left-[calc(50%-420px)] rounded-full origin-center animate-[spin_12s_linear_infinite] opacity-20"
          style={{
            background: 'conic-gradient(from 0deg, rgba(0,240,255,0.45) 0deg, transparent 60deg, transparent 360deg)'
          }}
        ></div>
      </div>

      {/* Top Controls Overlay of Spatial Map */}
      <div className="relative z-20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#252a38]/90 rounded-md backdrop-blur-md border border-[#3b494b]/40 shadow-md">
          <Compass className="text-[#00f0ff] w-4 h-4" />
          <span className="font-label-tactical text-[11px] text-[#dee2f5] uppercase font-mono">
            SECTOR GRID: 34.22°N // 76.19°E
          </span>
          <span className="font-label-micro text-[9.5px] text-[#849495] tracking-wider hidden sm:inline font-mono">
            ALT CEILING: {mission.ceilingFt.toLocaleString()} FT
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="map-zoom-in"
            type="button"
            onClick={handleZoomIn}
            title="Zoom In Airspace"
            className="p-1.5 bg-[#252a38]/80 hover:bg-[#343948] rounded text-[#dee2f5] border border-[#3b494b]/30 shadow-sm transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out"
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out Airspace"
            className="p-1.5 bg-[#252a38]/80 hover:bg-[#343948] rounded text-[#dee2f5] border border-[#3b494b]/30 shadow-sm transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {zoomLevel !== 1 && (
            <button
              id="map-zoom-reset"
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1.5 bg-[#252a38]/80 hover:bg-[#343948] rounded text-[#00f0ff] border border-[#3b494b]/30 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            id="btn-toggle-sensor-mode"
            type="button"
            onClick={() => setViewMode(viewMode === 'radar' ? 'twin-schematic' : 'radar')}
            className={`px-2.5 py-1 rounded font-label-tactical text-[10.5px] uppercase font-mono shadow-sm flex items-center gap-1.5 border transition-all ${
              viewMode === 'twin-schematic'
                ? 'bg-[#00f0ff] text-[#002022] border-[#00f0ff] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-[#252a38]/80 hover:bg-[#343948] text-[#00f0ff] border-[#3b494b]/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'radar' ? 'SENSORS: OPTICAL/RADAR' : 'VIEW: 3D ENGINE TWIN'}</span>
          </button>
        </div>
      </div>

      {/* INTERACTIVE UAV AIRSPACE MARKERS / HUDS */}
      <div
        className="relative flex-1 w-full transition-transform duration-300 pointer-events-none"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {fleet.slice(0, 4).map((uav) => {
          const isSelected = selectedEngineId === uav.id;
          const isMatchFilter =
            activeFilter === 'all' ||
            (activeFilter === 'healthy' && (uav.healthStatus === 'NOMINAL' || uav.healthStatus === 'OPTIMAL')) ||
            (activeFilter === 'warning' && (uav.healthStatus === 'WARNING' || uav.healthStatus === 'WATCH')) ||
            (activeFilter === 'critical' && uav.healthStatus === 'CRITICAL');

          const isCritical = uav.healthStatus === 'CRITICAL';
          const isWarning = uav.healthStatus === 'WARNING' || uav.healthStatus === 'WATCH';

          return (
            <div
              key={uav.id}
              id={`marker-${uav.id}`}
              onClick={() => setSelectedEngineId(uav.id)}
              className={`uav-marker absolute z-30 cursor-pointer pointer-events-auto group transition-all duration-300 ${
                isMatchFilter ? 'opacity-100' : 'opacity-20'
              } ${isSelected ? 'scale-110 z-40' : ''}`}
              style={{
                left: `${uav.mapPos.xPct}%`,
                top: `${uav.mapPos.yPct}%`
              }}
            >
              <div className="relative flex items-center">
                {/* Blip ring */}
                {isCritical ? (
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#93000a]/40 flex items-center justify-center animate-ping group-hover:scale-125 transition-transform"></div>
                    <div className="absolute w-7 h-7 rounded-full bg-[#93000a]/60 border border-[#ffb4ab]/80 flex items-center justify-center">
                      <AlertTriangle className="text-[#ffdad6] w-3.5 h-3.5" />
                    </div>
                  </div>
                ) : isWarning ? (
                  <div className="w-7 h-7 rounded-full bg-amber-500/25 border border-amber-400/60 flex items-center justify-center animate-pulse group-hover:scale-125 transition-transform">
                    <Plane className="text-amber-400 w-3.5 h-3.5 -rotate-45" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center animate-pulse group-hover:scale-125 transition-transform">
                    <Plane className="text-[#00f0ff] w-3.5 h-3.5 -rotate-45" />
                  </div>
                )}

                {/* HUD Info Plate */}
                <div
                  className={`ml-2 px-2 py-1 rounded backdrop-blur-md shadow-xl flex flex-col whitespace-nowrap border transition-all ${
                    isSelected
                      ? 'bg-[#303443]/95 border-[#00f0ff] ring-1 ring-[#00f0ff]/50'
                      : 'bg-[#252a38]/90 border-[#3b494b]/40 group-hover:bg-[#303443]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-label-tactical text-[11px] font-mono font-bold ${
                        isCritical
                          ? 'text-[#ffb4ab]'
                          : isWarning
                          ? 'text-amber-300'
                          : 'text-[#dee2f5]'
                      }`}
                    >
                      {uav.callsign} {isCritical ? '[RTB]' : ''}
                    </span>
                    <span
                      className={`font-label-micro text-[9px] px-1 rounded font-mono font-bold ${
                        isCritical
                          ? 'bg-[#93000a] text-[#ffdad6]'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {uav.healthPercentage}%
                    </span>
                  </div>
                  <span
                    className={`font-label-micro text-[9px] font-mono ${
                      isCritical
                        ? 'text-[#ffb4ab]'
                        : isWarning
                        ? 'text-amber-200/80'
                        : 'text-[#849495]'
                    }`}
                  >
                    {uav.altitudeFt.toLocaleString()} FT // {uav.airspeedKt} KT
                    {uav.id === 'uav-02' ? ' // CHT DRIFT' : ''}
                    {uav.id === 'uav-03' ? ' // BRG WEAR' : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Bottom Telemetry Legend & Coordinates */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 text-[#b9cacb] font-label-micro text-[9.5px] font-mono">
        <div className="flex items-center gap-4 bg-[#252a38]/90 px-3 py-1 rounded backdrop-blur-md border border-[#3b494b]/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>NORMAL FLIGHT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>THERMAL ADVISORY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
            <span>RTB CRITICAL EMERGENCY</span>
          </div>
        </div>

        <div className="px-2.5 py-1 bg-[#252a38]/90 rounded text-[#849495] uppercase font-label-micro text-[9.5px] border border-[#3b494b]/30">
          PRIMARY TACAN: {mission.tacanStation}
        </div>
      </div>
    </div>
  );
};

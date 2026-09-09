import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { DynamicEngineTwin } from './DynamicEngineTwin';
import {
  Layers,
  Video,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Flame,
  Radio,
  Eye,
  ShieldCheck,
  Activity,
  Cpu,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const Section1DigitalTwin: React.FC = () => {
  const {
    twinState,
    telemetry,
    selectedEngine,
    activeHotspotId,
    setActiveHotspotId,
    isLiveStreaming,
    toggleLiveStreaming,
    showToast,
  } = useDashboard();

  // Primary visual mode: 3D SCHEMATIC, LIVE VIDEO, or THERMAL VIEW
  const [displayMode, setDisplayMode] = useState<'schematic' | 'video' | 'thermal'>('schematic');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlayingScan, setIsPlayingScan] = useState<boolean>(true);
  const [timelineProgress, setTimelineProgress] = useState<number>(68);
  const [showComponentLabels, setShowComponentLabels] = useState<boolean>(true);
  const [engineOrientation, setEngineOrientation] = useState<{ yaw: number; pitch: number }>({ yaw: 30, pitch: -15 });

  // Active hotspots (Cylinders 1-4)
  const currentHotspots = twinState?.cylinderHotspots || [
    { id: 1, label: 'CYL-1', temp: 152, status: 'NOMINAL', xPercent: 36, yPercent: 32 },
    { id: 2, label: 'CYL-2', temp: 178, status: 'WARNING', xPercent: 64, yPercent: 34 },
    { id: 3, label: 'CYL-3', temp: 154, status: 'NOMINAL', xPercent: 34, yPercent: 60 },
    { id: 4, label: 'CYL-4', temp: 153, status: 'NOMINAL', xPercent: 66, yPercent: 62 },
  ];

  const activeHotspot = currentHotspots.find(h => h.id === activeHotspotId) || currentHotspots[1] || currentHotspots[0];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(1.6, Math.max(0.85, parseFloat((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoomLevel(1);
    setActiveHotspotId(selectedEngine.id === 'eng-02' ? 2 : 1);
    showToast('Engine Digital Twin viewport centered to 100% perspective.', 'info');
  };

  return (
    <section
      id="section-1-digital-twin"
      className={`relative w-full rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-2xl shadow-2xl transition-all duration-300 flex flex-col ${
        isFullscreen
          ? 'fixed inset-4 z-50 overflow-hidden bg-[#070b16] p-6 border-[#00f0ff]/60 shadow-[0_0_60px_rgba(0,240,255,0.25)]'
          : 'p-4 sm:p-5 lg:p-6'
      }`}
    >
      {/* 1. TOP HEADER: Engine Identification, Live Status & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#3b494b]/40">
        {/* Left: Engine ID, Callsign & Digital Twin Synchronization Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-base sm:text-lg tracking-wider text-[#dee2f5] uppercase">
                3D Digital Twin Engine Visualization
              </span>
              <span className="font-mono-telemetry text-xs font-bold px-2.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40">
                {selectedEngine.name} // {selectedEngine.engineNumber}
              </span>
              <span className="font-mono-telemetry text-[11px] px-2 py-0.5 rounded bg-[#303443] text-[#b9cacb] border border-[#3b494b]/60">
                {selectedEngine.callsign}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono-telemetry text-[11px] text-[#849495] mt-0.5">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    twinState?.syncStatus === 'SYNCHRONIZED'
                      ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'
                      : 'bg-[#ffb4ab] animate-ping'
                  }`}
                ></span>
                <span className="text-[#00f0ff] font-semibold">
                  TWIN SYNC: {twinState?.syncStatus || 'SYNCHRONIZED'} ({twinState?.thermodynamicParametersCount || 112} PARAMETERS)
                </span>
              </span>
              <span>•</span>
              <span>RESIDUAL MAE: {twinState?.divergenceScoreMae ?? telemetry.twinDivergenceMae}°C</span>
              <span>•</span>
              <span className={isLiveStreaming ? 'text-[#00f0ff]' : 'text-[#849495]'}>
                {isLiveStreaming ? 'LIVE TELEMETRY (20Hz)' : 'SIMULATION PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Primary View Switcher & Tool Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exact Required View Switchers: 3D SCHEMATIC, LIVE VIDEO, THERMAL VIEW */}
          <div className="flex items-center p-1 rounded-lg bg-[#090e1b] border border-[#3b494b]/60 shadow-inner">
            <button
              id="btn-view-schematic"
              type="button"
              onClick={() => {
                setDisplayMode('schematic');
                showToast('Switched to 3D Schematic Digital Twin mode.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold uppercase transition-all ${
                displayMode === 'schematic'
                  ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D SCHEMATIC</span>
            </button>

            <button
              id="btn-view-video"
              type="button"
              onClick={() => {
                setDisplayMode('video');
                showToast('Switched to Live Video / Engine Bay Borescope feed.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold uppercase transition-all ${
                displayMode === 'video'
                  ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>LIVE VIDEO</span>
            </button>

            <button
              id="btn-view-thermal"
              type="button"
              onClick={() => {
                setDisplayMode('thermal');
                showToast('Switched to Thermal FLIR False-Color Heat Map.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold uppercase transition-all ${
                displayMode === 'thermal'
                  ? 'bg-[#ffb4ab] text-[#690005] font-bold shadow-[0_0_12px_rgba(255,180,171,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>THERMAL VIEW</span>
            </button>
          </div>

          {/* Toggle Labels */}
          <button
            type="button"
            onClick={() => setShowComponentLabels(!showComponentLabels)}
            title="Toggle Engine Component Labels"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono-telemetry border transition-all ${
              showComponentLabels
                ? 'bg-[#303443] text-[#00f0ff] border-[#00f0ff]/40'
                : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>LABELS</span>
          </button>

          {/* Zoom & Viewport Controls */}
          <div className="flex items-center gap-1 bg-[#090e1b] p-1 rounded-lg border border-[#3b494b]/50">
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              title="Zoom Out"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5]"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono-telemetry text-[11px] text-[#00f0ff] font-bold px-1 min-w-[34px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              title="Zoom In"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5]"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset Viewport"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#00f0ff]"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. VISUALLY DOMINANT ENGINE 3D STAGE (Tall, commanding hero section) */}
      <div
        id="digital-twin-main-viewport"
        className="relative w-full min-h-[460px] sm:min-h-[500px] lg:h-[540px] xl:h-[580px] rounded-lg overflow-hidden flex items-center justify-center bg-[#070b16] border border-[#3b494b]/50 shadow-inner group select-none mt-3"
      >
        {/* Aerospace Blueprint Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 240, 255, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 240, 255, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        ></div>

        {/* Aerospace Engineering HUD Status Bars (Cleanly framed to avoid overlapping the central model) */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20 font-mono text-[10px]">
          <div className="bg-[#090e1b]/85 border border-[#3b494b]/50 backdrop-blur-xs px-3 py-1.5 rounded-md flex items-center gap-3 shadow-md">
            <span className="text-[#00f0ff] font-bold">ROTAX 915 iSC3 TURBO</span>
            <span className="text-slate-400">
              YAW: {engineOrientation.yaw >= 0 ? `+${engineOrientation.yaw}` : engineOrientation.yaw}° | PITCH: {engineOrientation.pitch >= 0 ? `+${engineOrientation.pitch}` : engineOrientation.pitch}°
            </span>
            <span className="text-slate-400 hidden md:inline">AIRFLOW: 34.2 m/s</span>
          </div>
          <div className="bg-[#090e1b]/85 border border-[#3b494b]/50 backdrop-blur-xs px-3 py-1.5 rounded-md flex items-center gap-2.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
            <span className="text-[#00f0ff] font-bold">{isLiveStreaming ? 'LIVE SYNC (20Hz)' : 'STANDBY'}</span>
            <span className="text-slate-400 hidden sm:inline">AMBIENT Δ: +18.4°C</span>
          </div>
        </div>

        <div className="absolute bottom-14 left-3 right-3 flex items-center justify-between pointer-events-none z-20 font-mono text-[10px]">
          <div className="bg-[#090e1b]/85 border border-[#3b494b]/50 backdrop-blur-xs px-3 py-1 rounded-md text-slate-300 shadow-md">
            AIR PRESSURE: 29.4 inHg • MANIFOLD: NOMINAL
          </div>
          <div className="bg-[#090e1b]/85 border border-[#3b494b]/50 backdrop-blur-xs px-3 py-1 rounded-md text-[#00f0ff] font-semibold shadow-md">
            CO-SIM CLUSTER: NODE-04
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: 3D SCHEMATIC & WIREFRAME */}
        {/* ------------------------------------------------------------- */}
        {displayMode === 'schematic' && (
          <div
            className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Dynamic Interactive 3D Digital Twin Engine (Replaces static image) */}
            <DynamicEngineTwin
              zoomLevel={zoomLevel}
              isThermalMode={false}
              rpm={telemetry.rpm || 2450}
              activeHotspotId={activeHotspotId}
              onRotationChange={(yaw, pitch) => setEngineOrientation({ yaw, pitch })}
              cylinders={currentHotspots}
              className="w-full h-full max-h-[500px]"
            />

            {/* Active Engine Tomography Scanning Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
              <div
                className={`w-full absolute left-0 right-0 ${
                  isPlayingScan ? 'animate-engine-scan' : ''
                }`}
                style={{
                  top: isPlayingScan ? undefined : `${timelineProgress}%`,
                  transition: isPlayingScan ? 'none' : 'top 0.2s ease-out',
                }}
              >
                {/* 1. Volumetric Trailing Light Sheet (Holographic Tomography Fan) */}
                <div
                  className="w-full h-28 -mt-28 pointer-events-none opacity-45 animate-pulse"
                  style={{
                    background: 'linear-gradient(to top, rgba(0, 240, 255, 0.35) 0%, rgba(0, 240, 255, 0.08) 50%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  }}
                >
                  {/* Micro-raster holographic scanlines */}
                  <div
                    className="w-full h-full opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.45) 0px, transparent 1px, transparent 3px)',
                    }}
                  />
                </div>

                {/* 2. Primary High-Intensity Laser Scanning Beam */}
                <div className="relative w-full flex items-center justify-center">
                  {/* Outer Wide Diffuse Cyan Laser Glow */}
                  <div className="absolute w-full h-4 bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent blur-sm animate-scan-pulse" />

                  {/* Intense Core Laser Blade (Cyan + White Hot Core) */}
                  <div className="relative w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00f0ff] via-[#ffffff] to-transparent shadow-[0_0_16px_#00f0ff,0_0_32px_#00f0ff,0_0_48px_rgba(0,240,255,0.8)]" />

                  {/* 3. Left Tactical HUD Scan Tag */}
                  <div className="absolute left-6 -top-5.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#090e1b]/95 border border-[#00f0ff]/60 text-[9px] font-mono-telemetry text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
                    <span className="font-bold tracking-wider">ENGINE SCAN // ACTIVE</span>
                  </div>

                  {/* 4. Right Tactical Telemetry Coordinate Tag */}
                  <div className="absolute right-6 -top-5.5 hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-[#090e1b]/95 border border-[#00f0ff]/60 text-[9px] font-mono-telemetry text-[#7df4ff] shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                    <span>TOMOGRAPHY</span>
                    <span className="text-[#849495]">•</span>
                    <span className="text-[#00f0ff] font-bold">40Hz // Z-SWEEP</span>
                  </div>
                </div>

                {/* 5. Secondary Downward Ambient Scatter Reflection */}
                <div
                  className="w-full h-10 pointer-events-none opacity-25"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0, 240, 255, 0.35) 0%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                  }}
                />
              </div>
            </div>

            {/* INTERACTIVE COMPONENT HOTSPOTS & LABELS */}
            {currentHotspots.map(hotspot => {
              const isWarning = hotspot.status === 'WARNING';
              const isCritical = hotspot.status === 'CRITICAL';
              const isSelected = activeHotspotId === hotspot.id;

              return (
                <div
                  key={hotspot.id}
                  id={`twin-hotspot-${hotspot.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspotId(hotspot.id);
                    showToast(
                      `Component Focus: ${hotspot.label} CHT is ${hotspot.temp}°C (${
                        isWarning ? 'WARNING - Cooling Baffle Stagnation' : isCritical ? 'CRITICAL EXCURSION' : 'NOMINAL'
                      })`,
                      isWarning ? 'warning' : isCritical ? 'error' : 'info'
                    );
                  }}
                  style={{ left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group/node"
                >
                  {/* Concentric Pulsing Reticle */}
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCritical
                          ? 'bg-[#ef4444]/35 animate-ping'
                          : isWarning
                            ? 'bg-[#b4c5ff]/40 animate-ping'
                            : 'bg-[#00f0ff]/25 group-hover/node:bg-[#00f0ff]/35'
                      } ${isSelected ? 'scale-125 ring-2 ring-[#00f0ff]' : ''}`}
                    ></span>

                    <span
                      className={`absolute w-3.5 h-3.5 rounded-full border-2 border-[#090e1b] shadow-lg ${
                        isCritical ? 'bg-[#ef4444]' : isWarning ? 'bg-[#b4c5ff]' : 'bg-[#00f0ff]'
                      }`}
                    ></span>
                  </div>

                  {/* Component Health Tag */}
                  {showComponentLabels && (
                    <div
                      className={`mt-1.5 px-2 py-0.5 rounded backdrop-blur-md font-mono-telemetry text-[10px] font-bold shadow-xl border whitespace-nowrap flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'ring-1 ring-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-105'
                          : 'opacity-90 group-hover/node:opacity-100'
                      } ${
                        isCritical
                          ? 'bg-[#93000a]/95 text-[#ffdad6] border-[#ef4444]'
                          : isWarning
                            ? 'bg-[#303443]/95 text-[#b4c5ff] border-[#b4c5ff]'
                            : 'bg-[#161b29]/95 text-[#dbfcff] border-[#00f0ff]/40'
                      }`}
                    >
                      <span>{hotspot.label}</span>
                      <span className="text-[8px] opacity-75">|</span>
                      <span className={isWarning ? 'text-[#ffb4ab] font-extrabold' : ''}>{hotspot.temp}°C</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Additional Engine Structural Labels */}
            {showComponentLabels && (
              <>
                <div
                  style={{ left: '50%', top: '18%' }}
                  onClick={() => showToast('Cooling Fin Baffle Array: Convective air velocity 34.2 m/s.', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/85 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></span>
                    <span>COOLING FIN BAFFLE ARRAY</span>
                  </div>
                </div>

                <div
                  style={{ left: '50%', top: '50%' }}
                  onClick={() => showToast('Intake Manifold Plenum: Pressure 29.4 inHg nominal.', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/85 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></span>
                    <span>INTAKE MANIFOLD RUNNER</span>
                  </div>
                </div>

                <div
                  style={{ left: '50%', top: '82%' }}
                  onClick={() => showToast('Oil Sump Scavenge: Sump Temp 92°C, Pressure 4.8 bar.', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/85 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></span>
                    <span>OIL SUMP & SCAVENGE LINE</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: LIVE VIDEO / BORESCOPE FEED */}
        {/* ------------------------------------------------------------- */}
        {displayMode === 'video' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#070b16]">
            {/* Simulated Live Video Viewport Container */}
            <div className="relative w-full max-w-3xl h-[400px] rounded-lg bg-[#090e1b] border border-[#00f0ff]/40 overflow-hidden flex flex-col justify-between p-4 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              {/* Scanline Texture */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,240,255,0.06)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>

              {/* Video Header HUD */}
              <div className="relative z-20 flex items-center justify-between font-mono-telemetry text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[#ef4444] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-ping"></span>
                    REC // BORESCOPE LIVE OPTICAL
                  </span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#00f0ff]">{selectedEngine.callsign} ENGINE COMPARTMENT</span>
                </div>
                <div className="text-[#849495]">
                  60 FPS • 1080P RAW • LAT: 28ms
                </div>
              </div>

              {/* Center Crosshair Reticle & Optical Target */}
              <div className="relative z-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#00f0ff]/50 flex items-center justify-center animate-spin" style={{ animationDuration: '24s' }}>
                  <div className="w-4 h-4 rounded-full bg-[#00f0ff]/80"></div>
                </div>
                <span className="font-display text-base font-semibold text-[#dee2f5] mt-3">
                  Engine Bay High-Resolution Optical Inspection Stream
                </span>
                <p className="font-mono-telemetry text-xs text-[#849495] mt-1 max-w-md">
                  Real-time borescope inspection pointing to Cylinder Head #2 Cooling Baffle Shroud.
                </p>
              </div>

              {/* Video Bottom Telemetry HUD */}
              <div className="relative z-20 flex items-center justify-between font-mono-telemetry text-xs bg-[#161b29]/90 p-2 rounded border border-[#3b494b]/40">
                <div className="flex items-center gap-3">
                  <span className="text-[#dbfcff]">CHT: {telemetry.cht}°C</span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#dbfcff]">RPM: {telemetry.rpm}</span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#ffb4ab]">VIB: {telemetry.vibrationRmsG} G</span>
                </div>
                <div className="text-[#00f0ff] text-[11px] font-bold">
                  FOCUS: CYL-2 BAFFLE RESTRICTION
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: THERMAL VIEW (FLIR FALSE-COLOR HEATMAP) */}
        {/* ------------------------------------------------------------- */}
        {displayMode === 'thermal' && (
          <div
            className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Dynamic Thermal Engine 3D Digital Twin (Replaces static image) */}
            <DynamicEngineTwin
              zoomLevel={zoomLevel}
              isThermalMode={true}
              rpm={telemetry.rpm || 2450}
              activeHotspotId={activeHotspotId}
              onRotationChange={(yaw, pitch) => setEngineOrientation({ yaw, pitch })}
              className="w-full h-full max-h-[500px]"
            />

            {/* High-Contrast Thermal Heatmap Overlay */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-85"
              style={{
                background: `
                  radial-gradient(circle at 64% 34%, rgba(255, 30, 30, 0.85) 0%, rgba(255, 140, 0, 0.55) 28%, rgba(255, 230, 0, 0.2) 45%, transparent 65%),
                  radial-gradient(circle at 36% 32%, rgba(0, 150, 255, 0.45) 0%, transparent 40%),
                  radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.25) 0%, transparent 60%)
                `,
              }}
            ></div>

            {/* FLIR Thermal Scale Legend on the Side */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#090e1b]/90 border border-[#3b494b]/60 rounded-lg p-2.5 flex flex-col items-center gap-1.5 font-mono-telemetry text-[9px] shadow-2xl">
              <span className="text-[#ffb4ab] font-bold">190°C</span>
              <div className="w-3 h-32 rounded bg-gradient-to-b from-[#ff2200] via-[#ffaa00] via-[#00f0ff] to-[#002266] border border-[#3b494b]/40"></div>
              <span className="text-[#00f0ff] font-bold">130°C</span>
              <span className="text-[#849495] text-[8px] mt-1">FLIR LWIR</span>
            </div>

            {/* Hotspot callout on Thermal View */}
            <div
              style={{ left: '64%', top: '34%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <div className="px-2.5 py-1 rounded bg-[#93000a]/90 text-[#ffdad6] border border-[#ef4444] font-mono-telemetry text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                PEAK EXCURSION: CYL-2 (178.4°C)
              </div>
            </div>
          </div>
        )}

        {/* 3. BOTTOM TIMELINE / SCANNER SCRUBBER CONTROLS (Always accessible) */}
        <div className="absolute bottom-2 left-4 right-4 z-20 bg-[#090e1b]/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#3b494b]/50 flex items-center justify-between gap-3 font-mono-telemetry text-xs">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => {
              setIsPlayingScan(!isPlayingScan);
              showToast(isPlayingScan ? 'Scanline telemetry playback paused.' : 'Live scanline playback active.', 'info');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f0ff]/15 text-[#00f0ff] hover:bg-[#00f0ff]/25 font-bold transition-colors"
          >
            {isPlayingScan ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingScan ? 'PAUSE SCAN' : 'RESUME SCAN'}</span>
          </button>

          {/* Timeline / Progress Bar */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-[#849495]">00:00</span>
            <input
              type="range"
              min="0"
              max="100"
              value={timelineProgress}
              onChange={(e) => setTimelineProgress(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[#303443] rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
            />
            <span className="text-[10px] text-[#00f0ff] font-bold">03:22:15</span>
          </div>

          {/* Component Selection Quick Pills */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[10px] text-[#849495]">INSPECT NODE:</span>
            {currentHotspots.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setActiveHotspotId(h.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeHotspotId === h.id
                    ? 'bg-[#00f0ff] text-[#00363a]'
                    : h.status === 'WARNING'
                      ? 'bg-[#303443] text-[#b4c5ff]'
                      : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

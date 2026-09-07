import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  Layers,
  Video,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Flame,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const PropulsionTwinModelCard: React.FC = () => {
  const {
    twinState,
    telemetry,
    selectedEngine,
    activeHotspotId,
    setActiveHotspotId,
    showToast,
  } = useDashboard();

  // View & display modes
  const [viewMode, setViewMode] = useState<'cad' | 'asset-slot'>('cad');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [thermalOverlay, setThermalOverlay] = useState<boolean>(true);
  const [scanlineActive, setScanlineActive] = useState<boolean>(true);
  const [showHotspotTags, setShowHotspotTags] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Asset slot state
  const [assetSource, setAssetSource] = useState<'borescope' | 'flir' | 'custom'>('borescope');
  const [customAssetUrl, setCustomAssetUrl] = useState<string>('');
  const [isPlayingAsset, setIsPlayingAsset] = useState<boolean>(true);

  // Selected hotspot data
  const currentHotspots = twinState?.cylinderHotspots || [
    { id: 1, label: 'CYL-1', temp: 152, status: 'NOMINAL', xPercent: 36, yPercent: 32 },
    { id: 2, label: 'CYL-2', temp: 178, status: 'WARNING', xPercent: 64, yPercent: 34 },
    { id: 3, label: 'CYL-3', temp: 154, status: 'NOMINAL', xPercent: 34, yPercent: 60 },
    { id: 4, label: 'CYL-4', temp: 153, status: 'NOMINAL', xPercent: 66, yPercent: 62 },
  ];

  const activeHotspot = currentHotspots.find(h => h.id === activeHotspotId) || currentHotspots[1] || currentHotspots[0];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(1.6, Math.max(0.9, parseFloat((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoomLevel(1);
    setActiveHotspotId(selectedEngine.id === 'eng-02' ? 2 : 1);
    showToast('Propulsion Twin CAD viewport reset to 100% nominal perspective.', 'info');
  };

  return (
    <div
      id="propulsion-twin-card"
      className={`relative bg-[#161b29]/90 backdrop-blur-2xl rounded-xl border border-[#3b494b]/40 shadow-2xl flex flex-col gap-3 transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 z-50 overflow-y-auto bg-[#090e1b]/95 p-5 border-[#00f0ff]/60 shadow-[0_0_50px_rgba(0,240,255,0.2)]'
          : 'w-full p-4 lg:p-5'
      }`}
    >
      {/* 1. AEROSPACE COMMAND HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/30">
        {/* Left: Component Identity & Version Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm lg:text-base tracking-wider text-[#dee2f5] uppercase">
                Propulsion Twin Model
              </span>
              <span className="font-mono-telemetry text-[10px] font-bold px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                DHRUVAA-CADX-V4.2
              </span>
            </div>
            <span className="font-mono-telemetry text-[10px] text-[#849495] flex items-center gap-1.5">
              <span>ACTIVE CO-SIMULATION:</span>
              <span className="text-[#00f0ff] font-semibold">{selectedEngine.name} ({selectedEngine.callsign})</span>
              <span>•</span>
              <span className="text-[#b9cacb]">THERMODYNAMIC RESIDUAL: {twinState.divergenceScoreMae}°C</span>
            </span>
          </div>
        </div>

        {/* Right: Mode Switchers (CAD-X vs Asset Slot) & Viewport Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher (Exact User Tags: CAD-X and Asset Slot) */}
          <div className="flex items-center p-1 rounded-lg bg-[#090e1b] border border-[#3b494b]/50 shadow-inner">
            <button
              id="view-cadx-btn"
              type="button"
              title="CAD-X Engine Wireframe & Telemetry"
              onClick={() => {
                setViewMode('cad');
                showToast('Switched to CAD-X Engine Wireframe & Telemetry view.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry uppercase transition-all duration-200 ${
                viewMode === 'cad'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5] hover:bg-[#161b29]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>CAD-X</span>
            </button>
            <button
              id="view-asset-slot-btn"
              type="button"
              title="Modular Asset / Video Slot"
              onClick={() => {
                setViewMode('asset-slot');
                showToast('Asset Slot Active: Live Optical/FLIR stream & 3D model container loaded.', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry uppercase transition-all duration-200 ${
                viewMode === 'asset-slot'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5] hover:bg-[#161b29]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Asset Slot</span>
            </button>
          </div>

          {/* Quick Display Toggles (Visible in CAD mode) */}
          {viewMode === 'cad' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#090e1b] p-1 rounded-lg border border-[#3b494b]/40">
              <button
                type="button"
                onClick={() => setThermalOverlay(!thermalOverlay)}
                title="Toggle Thermal Gradient Overlay"
                className={`px-2 py-1 rounded text-[10px] font-mono-telemetry uppercase flex items-center gap-1 transition-colors ${
                  thermalOverlay ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40' : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setScanlineActive(!scanlineActive)}
                title="Toggle Radar Laser Scanline"
                className={`px-2 py-1 rounded text-[10px] font-mono-telemetry uppercase flex items-center gap-1 transition-colors ${
                  scanlineActive ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40' : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Scan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHotspotTags(!showHotspotTags)}
                title="Toggle Hotspot Readout Tags"
                className={`px-2 py-1 rounded text-[10px] font-mono-telemetry uppercase flex items-center gap-1 transition-colors ${
                  showHotspotTags ? 'bg-[#303443] text-[#dee2f5]' : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Nodes</span>
              </button>
            </div>
          )}

          {/* Zoom and Fullscreen controls */}
          <div className="flex items-center gap-1 bg-[#090e1b] p-1 rounded-lg border border-[#3b494b]/40">
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              title="Zoom Out"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono-telemetry text-[10px] text-[#00f0ff] font-bold px-1 min-w-[32px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              title="Zoom In"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset Zoom & Alignment"
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#dee2f5] transition-colors ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen View'}
              className="p-1 rounded hover:bg-[#303443] text-[#849495] hover:text-[#00f0ff] transition-colors ml-0.5"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXPANSIVE MAIN WORKSPACE (Large Screen Grid Layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* ========================================================= */}
        {/* LEFT / CENTER: HIGH-DEFINITION CAD-X VISUAL STAGE (Col 8) */}
        {/* ========================================================= */}
        <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-2">
          <div
            id="cad-visual-canvas-stage"
            className="relative w-full min-h-[440px] sm:min-h-[480px] lg:h-[530px] rounded-xl overflow-hidden flex items-center justify-center bg-[#070b16] border border-[#3b494b]/50 shadow-inner group select-none"
          >
            {/* Precision Aerospace CAD Blueprint Background Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 240, 255, 0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 240, 255, 0.08) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px',
              }}
            ></div>

            {/* Radial Core Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.1)_0,transparent_75%)] pointer-events-none"></div>

            {/* Corner Alignment Reticles (Aerospace CAD standard) */}
            <div className="absolute top-3 left-3 font-mono-telemetry text-[9px] text-[#00f0ff]/60 pointer-events-none z-10 flex flex-col gap-0.5">
              <span>┌ DHRUVAA-CADX-V4.2 // TOP-DOWN ISOMETRIC CUTAWAY</span>
              <span className="text-[#849495] text-[8px]">AXIS: [X: +42.18mm | Y: -12.04mm | Z: +104.90mm]</span>
            </div>
            <div className="absolute top-3 right-3 font-mono-telemetry text-[9px] text-[#00f0ff]/60 pointer-events-none z-10 text-right">
              <span>CALIBRATED MESH: 112 PARAMETERS ┐</span>
              <span className="text-[#849495] block text-[8px]">RESIDUAL MAE: {telemetry.twinDivergenceMae}%</span>
            </div>
            <div className="absolute bottom-3 left-3 font-mono-telemetry text-[9px] text-[#849495] pointer-events-none z-10">
              <span>└ AIRFLOW: 34.2 m/s • DYNAMIC HEAD: 142 KTS</span>
            </div>
            <div className="absolute bottom-3 right-3 font-mono-telemetry text-[9px] text-[#00f0ff]/60 pointer-events-none z-10 text-right">
              <span>STATUS: {twinState.syncStatus} ┘</span>
            </div>

            {/* View Mode 1: CAD-X Wireframe & Hologram */}
            {viewMode === 'cad' ? (
              <div
                className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* High-res Aero Piston Engine CAD Wireframe Graphic */}
                <img
                  id="aero-engine-cad-wireframe-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9nSnI54G1zXINMfqrMSkfsTwQLVFm7Hd852eOEyMKlBmHZZUY_cECExFKCCY7GWCtyfQGy4TZ_j3d4QYTCTxUTwac0CUjVshT8mqndlRX75QZnqeMYE3BCfG76NpwUb3porcXyhbqRsgQbSF16jyZwNUmILzFF3VokuifHUxeNBe8mcyVUruNd6E3tbZkSCw8kVx5GEk-1-KMxRmlTVp8JPWqv_gu0pRwbiAtOclx2SwBfB7qjA7U"
                  alt="Technical CAD wireframe rendering of aero piston engine with cooling fins, cylinder heads, and manifold telemetry"
                  className="w-full h-full max-h-[480px] object-contain filter drop-shadow-[0_0_20px_rgba(0,240,255,0.18)] transition-all duration-500"
                />

                {/* Thermal Gradient Heat Map Overlay Layer */}
                {thermalOverlay && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"
                    style={{
                      background: `
                        radial-gradient(circle at 64% 34%, rgba(255, 75, 75, 0.45) 0%, rgba(255, 140, 0, 0.25) 25%, transparent 55%),
                        radial-gradient(circle at 36% 32%, rgba(0, 240, 255, 0.25) 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, transparent 60%)
                      `,
                    }}
                  ></div>
                )}

                {/* Animated Holographic Radar Scanline */}
                {scanlineActive && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                      className="w-full h-1 bg-gradient-to-r from-transparent via-[#00f0ff]/80 to-transparent shadow-[0_0_15px_#00f0ff] animate-pulse"
                      style={{
                        position: 'absolute',
                        top: '0%',
                        animation: 'scanlineMove 6s linear infinite',
                      }}
                    ></div>
                    <style>{`
                      @keyframes scanlineMove {
                        0% { top: 0%; opacity: 0.2; }
                        50% { opacity: 0.8; }
                        100% { top: 100%; opacity: 0.2; }
                      }
                    `}</style>
                  </div>
                )}

                {/* DYNAMIC CYLINDER HOTSPOTS WITH DETAILED RETICLES */}
                {currentHotspots.map(hotspot => {
                  const isWarning = hotspot.status === 'WARNING';
                  const isCritical = hotspot.status === 'CRITICAL';
                  const isSelected = activeHotspotId === hotspot.id;

                  return (
                    <div
                      key={hotspot.id}
                      id={`cad-hotspot-node-${hotspot.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHotspotId(hotspot.id);
                        showToast(
                          `Inspecting ${hotspot.label}: Observed ${hotspot.temp}°C (${
                            isWarning ? 'THERMAL WARNING - Baffle Gap' : isCritical ? 'CRITICAL EXCURSION' : 'NOMINAL'
                          })`,
                          isWarning ? 'warning' : isCritical ? 'error' : 'info'
                        );
                      }}
                      style={{ left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group/hotspot"
                    >
                      {/* Concentric Pulsing Reticle Ring */}
                      <div className="relative flex items-center justify-center">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isCritical
                              ? 'bg-[#ef4444]/30 animate-ping'
                              : isWarning
                                ? 'bg-[#b4c5ff]/35 animate-ping'
                                : 'bg-[#00f0ff]/20 group-hover/hotspot:bg-[#00f0ff]/30'
                          } ${isSelected ? 'scale-125 ring-2 ring-[#00f0ff]' : ''}`}
                        ></span>

                        {/* Solid Inner Target Core */}
                        <span
                          className={`absolute w-3.5 h-3.5 rounded-full border-2 border-[#090e1b] shadow-lg transition-transform group-hover/hotspot:scale-125 ${
                            isCritical
                              ? 'bg-[#ef4444]'
                              : isWarning
                                ? 'bg-[#b4c5ff]'
                                : 'bg-[#00f0ff]'
                          }`}
                        ></span>

                        {/* Selected Crosshair Halo */}
                        {isSelected && (
                          <div className="absolute -inset-3 border border-[#00f0ff] border-dashed rounded-full animate-spin pointer-events-none" style={{ animationDuration: '12s' }}></div>
                        )}
                      </div>

                      {/* Hotspot Floating Readout Tag */}
                      {showHotspotTags && (
                        <div
                          className={`mt-1.5 px-2 py-0.5 rounded backdrop-blur-md font-mono-telemetry text-[10px] font-bold shadow-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            isSelected
                              ? 'scale-110 ring-1 ring-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                              : 'opacity-90 group-hover/hotspot:opacity-100 group-hover/hotspot:scale-105'
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

                {/* Additional CAD Component Annotations (Manifold & Cooling Fin Array) */}
                <div
                  style={{ left: '50%', top: '20%' }}
                  onClick={() => showToast('Cooling Fin Array: Local aerodynamic heat dissipation coefficient evaluated at 74 W/m²·K.', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/80 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] group-hover:text-[#00f0ff] group-hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]/60"></span>
                    <span>COOLING FIN BAFFLE</span>
                  </div>
                </div>

                <div
                  style={{ left: '50%', top: '50%' }}
                  onClick={() => showToast('Intake Manifold Runner: Manifold Absolute Pressure 29.2 inHg (Differential: +0.2 inHg vs Model).', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/80 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] group-hover:text-[#00f0ff] group-hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]/60"></span>
                    <span>INTAKE MANIFOLD PLENUM</span>
                  </div>
                </div>

                <div
                  style={{ left: '50%', top: '80%' }}
                  onClick={() => showToast('Oil Sump Scavenge Port: Pressure 52.4 PSI, Temperature 88°C. Nominal scavenge volume.', 'info')}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  <div className="px-2 py-0.5 rounded bg-[#090e1b]/80 border border-[#3b494b]/60 font-mono-telemetry text-[9px] text-[#849495] group-hover:text-[#00f0ff] group-hover:border-[#00f0ff]/50 transition-colors flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]/60"></span>
                    <span>OIL SUMP & SCAVENGE</span>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode 2: Modular UAV Asset / Video Slot */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#070b16] text-center gap-4">
                {/* Simulated Live Stream / Asset HUD Player */}
                <div className="relative w-full max-w-2xl h-72 rounded-lg bg-[#090e1b] border border-[#00f0ff]/30 overflow-hidden flex flex-col justify-between p-3">
                  {/* Video Viewport Simulated Feed */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#090e1b]/80 via-transparent to-[#090e1b]/90 pointer-events-none z-10"></div>
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-luminosity"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.2) 0%, transparent 60%)`,
                    }}
                  ></div>

                  {/* Top Feed HUD */}
                  <div className="relative z-20 flex items-center justify-between font-mono-telemetry text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[#ef4444] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping"></span>
                        LIVE FEED: {assetSource.toUpperCase()}
                      </span>
                      <span className="text-[#849495]">|</span>
                      <span className="text-[#00f0ff]">UAV-PT-BRAVO (ENG-02)</span>
                    </div>
                    <div className="text-[#849495]">
                      FPS: 60 • 1080P RAW • LAT: 24ms
                    </div>
                  </div>

                  {/* Center Crosshair Reticle */}
                  <div className="relative z-20 flex flex-col items-center justify-center gap-1 text-center">
                    <div className="w-16 h-16 rounded-full border border-[#00f0ff]/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00f0ff]"></div>
                    </div>
                    <span className="font-display text-sm font-semibold text-[#dee2f5] mt-2">
                      {assetSource === 'borescope'
                        ? 'High-Resolution Engine Bay Borescope Feed'
                        : assetSource === 'flir'
                          ? 'FLIR Infrared Long-Wave Thermal Camera'
                          : 'Custom UAV Camera / 3D Model Stream'}
                    </span>
                    <p className="font-mono-telemetry text-[10px] text-[#849495] max-w-md">
                      Stream actively synchronized with DHRUVAA-CADX-V4.2 digital twin co-simulation loop.
                    </p>
                  </div>

                  {/* Bottom Video Controls & Telemetry HUD */}
                  <div className="relative z-20 flex items-center justify-between font-mono-telemetry text-[10px] bg-[#161b29]/80 p-1.5 rounded border border-[#3b494b]/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPlayingAsset(!isPlayingAsset)}
                        className="p-1 rounded bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/30"
                      >
                        {isPlayingAsset ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                      <span className="text-[#dbfcff]">CHT: {telemetry.cht}°C</span>
                      <span className="text-[#849495]">|</span>
                      <span className="text-[#dbfcff]">RPM: {telemetry.rpm}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAssetSource('borescope')}
                        className={`px-1.5 py-0.5 rounded text-[9px] ${assetSource === 'borescope' ? 'bg-[#00f0ff] text-[#00363a] font-bold' : 'text-[#849495]'}`}
                      >
                        Borescope
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssetSource('flir')}
                        className={`px-1.5 py-0.5 rounded text-[9px] ${assetSource === 'flir' ? 'bg-[#00f0ff] text-[#00363a] font-bold' : 'text-[#849495]'}`}
                      >
                        FLIR Thermal
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('cad')}
                        className="px-2 py-0.5 rounded bg-[#303443] text-[#dee2f5] hover:bg-[#252a38] font-bold"
                      >
                        Return to CAD-X
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom URL Input for real assets */}
                <div className="flex items-center gap-2 w-full max-w-md">
                  <input
                    type="text"
                    value={customAssetUrl}
                    onChange={(e) => setCustomAssetUrl(e.target.value)}
                    placeholder="Enter external MP4 stream, RTSP, or ThreeJS/GLB URL..."
                    className="flex-1 bg-[#090e1b] border border-[#3b494b]/60 rounded px-2.5 py-1 text-[11px] font-mono-telemetry text-[#dee2f5] focus:border-[#00f0ff] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAssetUrl) {
                        setAssetSource('custom');
                        showToast(`Connected custom asset stream: ${customAssetUrl}`, 'success');
                      } else {
                        showToast('Please specify a valid stream or GLB asset URL.', 'warning');
                      }
                    }}
                    className="px-3 py-1 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 text-[11px] font-mono-telemetry font-bold hover:bg-[#00f0ff]/30"
                  >
                    Mount
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Component Selection Ribbon Below Big CAD View */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#090e1b]/80 border border-[#3b494b]/30">
            <div className="flex items-center gap-1.5 text-xs font-mono-telemetry">
              <span className="text-[#849495] uppercase text-[10px]">Select Hotspot Node:</span>
              {currentHotspots.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setActiveHotspotId(h.id);
                    showToast(`Focused on ${h.label}: Current ${h.temp}°C`, h.status === 'WARNING' ? 'warning' : 'info');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-telemetry font-bold transition-all ${
                    activeHotspotId === h.id
                      ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : h.status === 'WARNING'
                        ? 'bg-[#303443] text-[#b4c5ff] hover:bg-[#3b494b]'
                        : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                  }`}
                >
                  {h.label} ({h.temp}°C)
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 font-mono-telemetry text-[10px] text-[#849495]">
              <span className="flex items-center gap-1 text-[#00f0ff]">
                <ShieldCheck className="w-3 h-3" />
                DHRUVAA-CADX VERIFIED
              </span>
              <span>•</span>
              <span>MAE SCORE: {telemetry.twinDivergenceMae}%</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: INTEGRATED TELEMETRY & DIGITAL TWIN INSPECTOR (Col 4) */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-3">
          {/* Active Hotspot Detailed Dossier */}
          <div className="p-3.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff]"></span>
                <span className="font-mono-telemetry text-xs font-bold text-[#dee2f5] uppercase">
                  Node Inspector: {activeHotspot.label}
                </span>
              </div>
              <span
                className={`font-mono-telemetry text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  activeHotspot.status === 'WARNING'
                    ? 'bg-[#303443] text-[#b4c5ff] border border-[#b4c5ff]/50'
                    : 'bg-[#00f0ff]/10 text-[#00f0ff]'
                }`}
              >
                {activeHotspot.status}
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 font-mono-telemetry">
              <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/30 flex flex-col">
                <span className="text-[9px] text-[#849495]">OBSERVED CHT</span>
                <span className={`text-base font-bold ${activeHotspot.status === 'WARNING' ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`}>
                  {activeHotspot.temp}°C
                </span>
                <span className="text-[8px] text-[#849495]">Threshold: 175°C max</span>
              </div>
              <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/30 flex flex-col">
                <span className="text-[9px] text-[#849495]">TWIN BASELINE</span>
                <span className="text-base font-bold text-[#dee2f5]">152°C</span>
                <span className={`text-[8px] font-bold ${activeHotspot.temp > 152 ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`}>
                  Delta: +{(activeHotspot.temp - 152).toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Aerodynamic / Cooling Fin Status Description */}
            <div className="p-2 rounded bg-[#161b29]/70 border border-[#3b494b]/30 font-mono-telemetry text-[10px] flex flex-col gap-1">
              <span className="text-[#00f0ff] font-semibold text-[9px]">PHYSICAL COMPONENT SPEC:</span>
              <p className="text-[#b9cacb] leading-relaxed">
                {activeHotspot.id === 2
                  ? 'Cylinder Head #2 High-density Fin Array. Aerodynamic baffle restriction identified with local heat flux stagnation (-8.1%).'
                  : `Cylinder Head #${activeHotspot.id} Standard Aero Assembly. Convective airflow within normal thermal boundary layer.`}
              </p>
            </div>
          </div>

          {/* 4-Cylinder Thermal Disparity Gauge Array */}
          <div className="p-3.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-telemetry text-xs font-bold text-[#dee2f5] uppercase">
                4-Cylinder Thermal Head Disparity
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#00f0ff]">
                Δ-MAX: 26.0°C
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono-telemetry text-xs">
              {currentHotspots.map(cyl => {
                const isAnomaly = cyl.id === 2;
                const pct = Math.min(100, Math.max(10, Math.round(((cyl.temp - 130) / 60) * 100)));

                return (
                  <div
                    key={cyl.id}
                    onClick={() => setActiveHotspotId(cyl.id)}
                    className={`p-1.5 rounded cursor-pointer transition-all ${
                      activeHotspotId === cyl.id ? 'bg-[#161b29] ring-1 ring-[#00f0ff]' : 'hover:bg-[#161b29]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className={isAnomaly ? 'text-[#b4c5ff] font-bold' : 'text-[#849495]'}>
                        {cyl.label} {isAnomaly ? '(Restriction)' : '(Nominal)'}
                      </span>
                      <span className={`font-bold ${isAnomaly ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`}>
                        {cyl.temp}°C
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#303443] rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          isAnomaly ? 'bg-[#ffb4ab]' : 'bg-[#00f0ff]'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital Twin Co-Simulation Parameters */}
          <div className="p-3.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/40 flex flex-col gap-2 font-mono-telemetry text-[10px]">
            <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-1.5">
              <span className="font-bold text-[#dee2f5] uppercase">Digital Twin Co-Processor</span>
              <span className="text-[#00f0ff] font-bold">112 CHANNELS</span>
            </div>

            <div className="flex flex-col gap-1.5 text-[#849495] pt-1">
              <div className="flex items-center justify-between">
                <span>Model Architecture:</span>
                <span className="text-[#dbfcff] font-semibold">DHRUVAA-CADX-V4.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manifold Pressure (MAP):</span>
                <span className="text-[#dbfcff] font-semibold">{telemetry.manifoldPressureInHg || 29.2} inHg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Baffle Differential Pressure:</span>
                <span className="text-[#ffb4ab] font-semibold">4.1 inH2O (Anomaly)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Thermodynamic State:</span>
                <span className="text-[#00f0ff] font-semibold">SYNCHRONIZED (99.4%)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast('Full thermodynamic invariant sweep passed: 112/112 constraints verified.', 'success')}
              className="mt-2 w-full py-1.5 rounded bg-[#161b29] hover:bg-[#303443] text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-bold uppercase transition-colors"
            >
              Verify Twin Invariants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

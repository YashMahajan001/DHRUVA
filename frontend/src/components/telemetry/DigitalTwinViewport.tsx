import React, { useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { SubsystemId } from '../../types/engineDetailsTypes';
import { Video, Box, Plane, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, Upload } from 'lucide-react';

export const DigitalTwinViewport: React.FC = () => {
  const {
    selectedEngine,
    subsystems,
    selectedSubsystemId,
    selectSubsystem,
    telemetry,
    cameraRotation,
    cameraZoom,
    isometricOffset,
    renderMode,
    assetMode,
    rotateTwin,
    zoomTwin,
    resetTwinView,
    setIsometricOffset,
    setRenderMode,
    setAssetMode,
    customAssetUrl,
    setCustomAssetUrl,
    activeTargetLabel,
    runTwinCalibration,
    isCalibrating,
    stressSimulationActive
  } = useMissionDashboard();

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaInputUrl, setMediaInputUrl] = useState('');

  const handleExplodeToggle = () => {
    if (isometricOffset > 0) {
      setIsometricOffset(0);
    } else {
      setIsometricOffset(65);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAssetUrl(url);
      setAssetMode('custom_media');
      setIsMediaModalOpen(false);
    }
  };

  const activeSubsys = subsystems[selectedSubsystemId];

  // Calculated exploded offsets for 3D engine parts
  const cylOffsetX = isometricOffset * 0.8;
  const coolingOffsetY = -isometricOffset * 0.6;
  const sumpOffsetY = isometricOffset * 0.5;
  const fuelOffsetY = -isometricOffset * 0.3;

  return (
    <div className="xl:col-span-8 flex flex-col bg-surface-container-low/95 rounded shadow-xl relative overflow-hidden border border-outline-variant/20 select-none">
      {/* TOP VIEWPORT CONTROLS BAR */}
      <div className="h-12 bg-surface-container px-unit-md flex items-center justify-between z-20 border-b border-outline-variant/20">
        <div className="flex items-center gap-unit-sm">
          <div className="flex items-center gap-unit-xs bg-surface-container-lowest px-unit-sm py-1 rounded border border-outline-variant/30">
            <span
              className={`w-2 h-2 rounded-full ${
                stressSimulationActive
                  ? 'bg-red-500 animate-ping'
                  : 'bg-primary-container animate-pulse shadow-[0_0_8px_#00f0ff]'
              }`}
            ></span>
            <span className="font-label-tactical text-label-tactical text-primary uppercase">
              TWIN-CORE V3 // {selectedEngine.model}
            </span>
          </div>
          <span className="font-label-micro text-label-micro text-outline hidden sm:inline font-mono">
            SER: {selectedEngine.id}
          </span>
        </div>

        {/* Viewport Render & Asset Mode Toggles */}
        <div className="flex items-center gap-unit-xs">
          {/* Asset View Selector: Twin CAD / Tactical UAV / Custom Video Placeholder */}
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30 mr-1">
            <button
              onClick={() => setAssetMode('engine_twin')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-all cursor-pointer ${
                assetMode === 'engine_twin'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Digital Twin Engine View"
            >
              <Box className="w-3 h-3" />
              <span className="hidden md:inline">Twin</span>
            </button>

            <button
              onClick={() => setAssetMode('uav_airframe')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-all cursor-pointer ${
                assetMode === 'uav_airframe'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="UAV Tactical Airframe Cutaway"
            >
              <Plane className="w-3 h-3" />
              <span className="hidden md:inline">Airframe</span>
            </button>

            <button
              onClick={() => {
                setAssetMode('custom_media');
                if (!customAssetUrl) setIsMediaModalOpen(true);
              }}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-all cursor-pointer ${
                assetMode === 'custom_media'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Replace with Video/Asset"
            >
              <Video className="w-3 h-3" />
              <span className="hidden md:inline">Media</span>
            </button>
          </div>

          {/* Wireframe Button */}
          <button
            id="btn-wireframe"
            onClick={() => setRenderMode(renderMode === 'wireframe' ? 'holo' : 'wireframe')}
            className={`px-unit-sm py-1 rounded font-label-tactical text-label-tactical uppercase transition-all flex items-center gap-1 cursor-pointer ${
              renderMode === 'wireframe'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_4x4</span>
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          {/* Exploded Button */}
          <button
            id="btn-exploded"
            onClick={handleExplodeToggle}
            className={`px-unit-sm py-1 rounded font-label-tactical text-label-tactical uppercase transition-all flex items-center gap-1 cursor-pointer ${
              isometricOffset > 0
                ? 'bg-secondary-container text-on-secondary-container font-bold shadow-[0_0_8px_rgba(0,83,219,0.4)]'
                : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">layers</span>
            <span className="hidden sm:inline">Exploded</span>
          </button>

          {/* Holo-HUD Button */}
          <button
            id="btn-hologram"
            onClick={() => setRenderMode('holo')}
            className={`px-unit-sm py-1 rounded font-label-tactical text-label-tactical uppercase transition-all flex items-center gap-1 cursor-pointer ${
              renderMode === 'holo'
                ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span className="hidden sm:inline">Holo-HUD</span>
          </button>
        </div>
      </div>

      {/* COMPONENT SELECTOR BUTTON BAR */}
      <div className="bg-surface-container-lowest/80 px-unit-md py-unit-xs flex flex-wrap items-center gap-unit-xs z-20 border-b border-outline-variant/15">
        <span className="font-label-micro text-label-micro text-outline uppercase mr-unit-xs">
          SYSTEM CLUSTERS:
        </span>
        {(Object.keys(subsystems) as SubsystemId[]).map((key) => {
          const item = subsystems[key];
          const isSelected = selectedSubsystemId === key;
          return (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => selectSubsystem(key)}
              className={`comp-tab px-unit-sm py-1 rounded font-label-tactical text-label-tactical uppercase transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.index}. {item.name} ({item.health}%)
            </button>
          );
        })}
      </div>

      {/* 3D SVG / CANVAS TWIN STAGE */}
      <div className="relative flex-1 w-full min-h-[470px] flex items-center justify-center bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-surface-container-lowest overflow-hidden select-none">
        {/* TACTICAL GRID RETICLE BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none opacity-20 tactical-grid-bg"></div>
        <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-30"></div>

        {/* CORNER OPTICAL HUD BRACKETS */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/40 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/40 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>

        {/* FLOATING HUD OVERLAY STATUS */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-1">
          <div className="font-label-micro text-label-micro text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            PITCH: <span className="font-mono">18°</span> | YAW:{' '}
            <span className="font-mono">{((cameraRotation + 35) % 360).toFixed(0)}°</span> | FOV:{' '}
            <span className="font-mono">{cameraZoom.toFixed(2)}x</span>
          </div>
          <div className="font-label-micro text-label-micro text-outline font-mono">
            ENGINE MODE: HIGH-ALTITUDE CRUISE [{telemetry.rpm.toLocaleString()} RPM]
          </div>
        </div>

        {/* MODE 1: 3D DIGITAL TWIN AERO PISTON ENGINE (ROTAX 915iS) */}
        {assetMode === 'engine_twin' && (
          <div
            id="engine-canvas-container"
            className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
            style={{
              transform: `scale(${cameraZoom}) rotate(${cameraRotation}deg)`
            }}
          >
            <svg
              id="engine-svg"
              viewBox="0 0 800 500"
              className={`w-full h-full max-w-[740px] max-h-[460px] drop-shadow-[0_0_20px_rgba(0,240,255,0.2)] ${
                renderMode === 'wireframe' ? 'grayscale contrast-150' : ''
              }`}
            >
              <defs>
                <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0053db" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
                </linearGradient>
                <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* CRANKCASE BASE (FOUNDATION) */}
              <g
                id="node-crankcase"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => selectSubsystem('lubrication')}
              >
                <polygon
                  points="300,320 500,320 540,390 260,390"
                  fill="#161b29"
                  opacity="0.8"
                  stroke="#849495"
                  strokeWidth="1.5"
                />
                <line x1="260" y1="390" x2="300" y2="440" stroke="#849495" strokeWidth="1.5" />
                <line x1="540" y1="390" x2="500" y2="440" stroke="#849495" strokeWidth="1.5" />
                <polygon
                  points="300,440 500,440 540,390 260,390"
                  fill="#090e1b"
                  stroke="#3b494b"
                  strokeWidth="1.5"
                />
                {/* Crankshaft Axis line */}
                <line
                  x1="240"
                  y1="360"
                  x2="560"
                  y2="360"
                  stroke="#00f0ff"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />
              </g>

              {/* COMPONENT 1: CYLINDER ASSEMBLY (4-CYLINDER BOXER CONFIGURATION) */}
              <g
                id="node-cylinders"
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSubsystemId === 'cylinder' ? 'opacity-100 filter-[url(#neonBlur)]' : 'opacity-70'
                }`}
                onClick={() => selectSubsystem('cylinder')}
              >
                {/* Left Cylinders #1 & #3 */}
                <g
                  id="cyl-left"
                  className="transition-transform duration-500"
                  style={{ transform: `translateX(${-cylOffsetX}px)` }}
                >
                  <rect
                    x="180"
                    y="240"
                    width="110"
                    height="90"
                    rx="4"
                    fill="#1a1f2d"
                    stroke={selectedSubsystemId === 'cylinder' ? '#00f0ff' : '#3b494b'}
                    strokeWidth={selectedSubsystemId === 'cylinder' ? 2.5 : 1.5}
                  />
                  <line x1="180" y1="260" x2="290" y2="260" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  <line x1="180" y1="280" x2="290" y2="280" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  <line x1="180" y1="300" x2="290" y2="300" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  {/* Cylinder Head Left */}
                  <polygon
                    points="150,230 180,240 180,330 150,320"
                    fill="#252a38"
                    stroke="#00f0ff"
                    strokeWidth="1.8"
                  />
                </g>

                {/* Right Cylinders #2 & #4 */}
                <g
                  id="cyl-right"
                  className="transition-transform duration-500"
                  style={{ transform: `translateX(${cylOffsetX}px)` }}
                >
                  <rect
                    x="510"
                    y="240"
                    width="110"
                    height="90"
                    rx="4"
                    fill="#1a1f2d"
                    stroke={selectedSubsystemId === 'cylinder' ? '#00f0ff' : '#3b494b'}
                    strokeWidth={selectedSubsystemId === 'cylinder' ? 2.5 : 1.5}
                  />
                  <line x1="510" y1="260" x2="620" y2="260" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  <line x1="510" y1="280" x2="620" y2="280" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  <line x1="510" y1="300" x2="620" y2="300" stroke="#00f0ff" strokeWidth="1" opacity="0.7" />
                  {/* Cylinder Head Right */}
                  <polygon
                    points="650,230 620,240 620,330 650,320"
                    fill="#252a38"
                    stroke="#00f0ff"
                    strokeWidth="1.8"
                  />
                </g>
              </g>

              {/* COMPONENT 2: COOLING SYSTEM (RADIATOR DUCT & AIR SHROUDS) */}
              <g
                id="node-cooling"
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSubsystemId === 'cooling' ? 'opacity-100 filter-[url(#neonBlur)]' : 'opacity-70'
                }`}
                onClick={() => selectSubsystem('cooling')}
              >
                <g
                  id="cooling-mesh"
                  className="transition-transform duration-500"
                  style={{ transform: `translateY(${coolingOffsetY}px)` }}
                >
                  <path
                    d="M 280,180 L 520,180 L 550,230 L 250,230 Z"
                    fill="#0053db"
                    fillOpacity="0.25"
                    stroke="#7bd0ff"
                    strokeWidth={selectedSubsystemId === 'cooling' ? 2.5 : 1.5}
                  />
                  <line x1="320" y1="180" x2="310" y2="230" stroke="#7bd0ff" strokeWidth="1" />
                  <line x1="360" y1="180" x2="350" y2="230" stroke="#7bd0ff" strokeWidth="1" />
                  <line x1="400" y1="180" x2="400" y2="230" stroke="#7bd0ff" strokeWidth="1" />
                  <line x1="440" y1="180" x2="450" y2="230" stroke="#7bd0ff" strokeWidth="1" />
                  <line x1="480" y1="180" x2="490" y2="230" stroke="#7bd0ff" strokeWidth="1" />
                  {/* Air intake funnel */}
                  <polygon
                    points="340,110 460,110 490,170 310,170"
                    fill="transparent"
                    stroke="#b4c5ff"
                    strokeWidth="1.5"
                    strokeDasharray="3,2"
                  />
                </g>
              </g>

              {/* COMPONENT 3: LUBRICATION & OIL SUMP */}
              <g
                id="node-lubrication"
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSubsystemId === 'lubrication' ? 'opacity-100 filter-[url(#neonBlur)]' : 'opacity-70'
                }`}
                onClick={() => selectSubsystem('lubrication')}
              >
                <g
                  id="sump-mesh"
                  className="transition-transform duration-500"
                  style={{ transform: `translateY(${sumpOffsetY}px)` }}
                >
                  <path
                    d="M 330,420 L 470,420 L 450,470 L 350,470 Z"
                    fill="#1a1f2d"
                    stroke="#00f0ff"
                    strokeWidth={selectedSubsystemId === 'lubrication' ? 2.5 : 1.8}
                  />
                  {/* Oil Cooler Loop */}
                  <path d="M 470,435 Q 510,435 510,400" fill="none" stroke="#7df4ff" strokeWidth="2" />
                  <circle cx="510" cy="400" r="4" fill="#00f0ff" />
                </g>
              </g>

              {/* COMPONENT 4: FUEL INJECTION RAILS */}
              <g
                id="node-fuel"
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSubsystemId === 'fuel' ? 'opacity-100 filter-[url(#neonBlur)]' : 'opacity-70'
                }`}
                onClick={() => selectSubsystem('fuel')}
              >
                <g
                  id="fuel-mesh"
                  className="transition-transform duration-500"
                  style={{ transform: `translateY(${fuelOffsetY}px)` }}
                >
                  {/* Fuel manifold rail */}
                  <line
                    x1="220"
                    y1="215"
                    x2="580"
                    y2="215"
                    stroke="#f59e0b"
                    strokeWidth={selectedSubsystemId === 'fuel' ? 3.5 : 2.5}
                    strokeLinecap="round"
                  />
                  {/* Injector nozzles to cylinders */}
                  <rect x="235" y="215" width="12" height="24" rx="2" fill="#f59e0b" />
                  <rect x="270" y="215" width="12" height="24" rx="2" fill="#f59e0b" />
                  <rect x="518" y="215" width="12" height="24" rx="2" fill="#f59e0b" />
                  <rect x="553" y="215" width="12" height="24" rx="2" fill="#f59e0b" />
                </g>
              </g>

              {/* COMPONENT 5: ELECTRICAL / IGNITION SYSTEM & SPARK PLUGS */}
              <g
                id="node-electrical"
                className={`cursor-pointer transition-all duration-500 ${
                  selectedSubsystemId === 'electrical' ? 'opacity-100 filter-[url(#neonBlur)]' : 'opacity-70'
                }`}
                onClick={() => selectSubsystem('electrical')}
              >
                <g id="elec-mesh" className="transition-transform duration-500">
                  {/* Dual ECU Modules */}
                  <rect
                    x="350"
                    y="250"
                    width="100"
                    height="60"
                    rx="3"
                    fill="#252a38"
                    stroke="#dbfcff"
                    strokeWidth={selectedSubsystemId === 'electrical' ? 2.5 : 1.8}
                  />
                  <circle cx="375" cy="280" r="8" fill="#00363a" stroke="#00f0ff" strokeWidth="1.2" />
                  <circle cx="425" cy="280" r="8" fill="#00363a" stroke="#00f0ff" strokeWidth="1.2" />
                  {/* High tension ignition leads */}
                  <path
                    d="M 375,272 Q 300,200 170,240"
                    fill="none"
                    stroke="#dbfcff"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                  <path
                    d="M 425,272 Q 500,200 630,240"
                    fill="none"
                    stroke="#dbfcff"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                </g>
              </g>

              {/* PROPELLER SHAFT / FLANGE FORWARD */}
              <g id="prop-hub">
                <ellipse cx="400" cy="360" rx="26" ry="12" fill="#343948" stroke="#849495" strokeWidth="1.5" />
                <polygon points="388,360 412,360 408,300 392,300" fill="#252a38" stroke="#849495" strokeWidth="1" />
              </g>

              {/* INTERACTIVE HOLOGRAPHIC HOTSPOT PINS */}
              {/* Hotspot 1: Cylinder Head */}
              <g className="cursor-pointer group" onClick={() => selectSubsystem('cylinder')}>
                <circle
                  cx="165"
                  cy="275"
                  r="14"
                  fill="#00f0ff"
                  fillOpacity="0.15"
                  stroke="#00f0ff"
                  strokeWidth="1"
                  className="animate-pulse"
                />
                <circle cx="165" cy="275" r="4" fill="#00f0ff" />
                <line x1="165" y1="261" x2="165" y2="200" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2,2" />
                <rect x="90" y="180" width="75" height="20" rx="2" fill="#0e1320" stroke="#00f0ff" strokeWidth="1" />
                <text
                  x="127"
                  y="194"
                  fill="#00f0ff"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  CYL {Math.round(telemetry.chtPeak)}°C
                </text>
              </g>

              {/* Hotspot 2: Radiator / Coolant */}
              <g className="cursor-pointer group" onClick={() => selectSubsystem('cooling')}>
                <circle
                  cx="400"
                  cy="140"
                  r="14"
                  fill="#7bd0ff"
                  fillOpacity="0.15"
                  stroke="#7bd0ff"
                  strokeWidth="1"
                  className="animate-pulse"
                />
                <circle cx="400" cy="140" r="4" fill="#7bd0ff" />
                <line x1="400" y1="126" x2="400" y2="70" stroke="#7bd0ff" strokeWidth="1" strokeDasharray="2,2" />
                <rect x="355" y="50" width="90" height="20" rx="2" fill="#0e1320" stroke="#7bd0ff" strokeWidth="1" />
                <text
                  x="400"
                  y="64"
                  fill="#7bd0ff"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  AIRFLOW {telemetry.radiatorAirflow.toFixed(0)}m/s
                </text>
              </g>

              {/* Hotspot 3: Fuel Injector Rail */}
              <g className="cursor-pointer group" onClick={() => selectSubsystem('fuel')}>
                <circle
                  cx="560"
                  cy="215"
                  r="14"
                  fill="#f59e0b"
                  fillOpacity="0.15"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  className="animate-pulse"
                />
                <circle cx="560" cy="215" r="4" fill="#f59e0b" />
                <line x1="560" y1="201" x2="620" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                <rect x="620" y="150" width="90" height="20" rx="2" fill="#0e1320" stroke="#f59e0b" strokeWidth="1" />
                <text
                  x="665"
                  y="164"
                  fill="#f59e0b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  FUEL {telemetry.fuelFlow.toFixed(1)} L/h
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* MODE 2: UAV TACTICAL AIRFRAME CUTAWAY */}
        {assetMode === 'uav_airframe' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
            <svg viewBox="0 0 800 450" className="w-full h-full max-w-[700px] max-h-[420px]">
              {/* UAV Fuselage Outline */}
              <polygon
                points="400,60 420,160 415,360 400,420 385,360 380,160"
                fill="#161b29"
                stroke="#00f0ff"
                strokeWidth="1.5"
                opacity="0.85"
              />
              {/* Wings */}
              <polygon
                points="400,180 760,240 730,260 410,220"
                fill="#1a1f2d"
                stroke="#00f0ff"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <polygon
                points="400,180 40,240 70,260 390,220"
                fill="#1a1f2d"
                stroke="#00f0ff"
                strokeWidth="1.5"
                opacity="0.7"
              />
              {/* Tail V-Empennage */}
              <polygon points="400,370 470,430 450,440 400,390" fill="#252a38" stroke="#7bd0ff" strokeWidth="1.5" />
              <polygon points="400,370 330,430 350,440 400,390" fill="#252a38" stroke="#7bd0ff" strokeWidth="1.5" />
              {/* Engine Bay Highlight (Pusher Propeller Mount) */}
              <rect
                x="375"
                y="340"
                width="50"
                height="50"
                rx="4"
                fill="#00f0ff"
                fillOpacity="0.2"
                stroke="#00f0ff"
                strokeWidth="2"
                className="animate-pulse"
              />
              <text x="400" y="368" fill="#00f0ff" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
                ENGINE BAY
              </text>
              <text x="400" y="380" fill="#dee2f5" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                ROTAX 915iS PUSHER
              </text>
            </svg>
            <div className="absolute bottom-4 left-6 font-mono text-[10px] text-primary">
              TACTICAL AIRFRAME: MALE HIGH-ALTITUDE ISR PLATFORM // WINGSPAN: 20.6m
            </div>
          </div>
        )}

        {/* MODE 3: CUSTOM VIDEO / ASSET PLACEHOLDER SLOT (Requirement 8) */}
        {assetMode === 'custom_media' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
            {customAssetUrl ? (
              <div className="w-full h-full max-w-[700px] max-h-[420px] rounded border border-primary/40 overflow-hidden relative shadow-2xl">
                {customAssetUrl.endsWith('.mp4') || customAssetUrl.endsWith('.webm') ? (
                  <video src={customAssetUrl} autoPlay loop muted className="w-full h-full object-cover" />
                ) : (
                  <img src={customAssetUrl} alt="Custom UAV / Engine Feed" className="w-full h-full object-contain" />
                )}
                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="absolute top-3 right-3 bg-surface-container-lowest/80 text-primary border border-primary/30 px-2 py-1 rounded text-xs font-mono flex items-center gap-1 hover:bg-surface-container"
                >
                  <Upload className="w-3 h-3" /> Change Media
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 rounded-lg p-8 max-w-md text-center bg-surface-container/40">
                <Video className="w-12 h-12 text-primary mb-3 animate-pulse" />
                <h4 className="font-headline-sm text-sm text-on-surface font-bold">
                  CUSTOM UAV / PROPULSION MEDIA SLOT
                </h4>
                <p className="text-xs text-outline mt-1 max-w-xs">
                  This viewport slot is engineered for your UAV flight video, 3D simulation recording, or CAD render stream.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <label className="px-3 py-1.5 bg-primary-container text-on-primary-container text-xs font-mono font-bold rounded cursor-pointer hover:opacity-90 transition-opacity">
                    Upload Local File
                    <input type="file" accept="video/*,image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button
                    onClick={() => setIsMediaModalOpen(true)}
                    className="px-3 py-1.5 bg-surface-container-highest text-on-surface text-xs font-mono rounded hover:bg-surface-bright cursor-pointer"
                  >
                    Enter Stream URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM-RIGHT VIEWPORT CAMERA & ROTATION DOCK */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md p-1 rounded shadow-lg border border-outline-variant/20">
          <button
            onClick={() => rotateTwin(-15)}
            className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            title="Rotate Counter-Clockwise (-15°)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => rotateTwin(15)}
            className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            title="Rotate Clockwise (+15°)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-outline-variant/40 mx-1"></div>
          <button
            onClick={() => zoomTwin(0.15)}
            className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomTwin(-0.15)}
            className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-outline-variant/40 mx-1"></div>
          <button
            onClick={resetTwinView}
            className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            title="Reset Camera Orientation & Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* BOTTOM-LEFT EXPLODED SLIDER HUD */}
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-unit-sm bg-surface-container-high/90 backdrop-blur-md px-unit-md py-1.5 rounded shadow-lg border border-outline-variant/20">
          <span className="font-label-micro text-label-micro text-outline uppercase font-mono">
            ISOMETRIC OFFSET:
          </span>
          <input
            id="explode-slider"
            type="range"
            min="0"
            max="100"
            value={isometricOffset}
            onChange={(e) => setIsometricOffset(parseInt(e.target.value, 10))}
            className="w-28 h-1 bg-surface-container-highest rounded appearance-none cursor-pointer accent-primary-container"
          />
          <span id="explode-val" className="font-label-micro text-label-micro text-primary font-mono w-7 text-right">
            {isometricOffset}%
          </span>
        </div>
      </div>

      {/* ACTIVE SYSTEM FOOTER DIAGNOSTIC BAR */}
      <div className="bg-surface-container px-unit-md py-2 flex items-center justify-between z-20 border-t border-outline-variant/20">
        <div className="flex items-center gap-unit-sm">
          <span className="font-label-micro text-label-micro text-outline uppercase">
            DIAGNOSTIC TARGET:
          </span>
          <span
            id="active-target-label"
            className={`font-label-tactical text-label-tactical font-bold ${
              isCalibrating ? 'text-amber-400 animate-pulse' : 'text-primary'
            }`}
          >
            {activeTargetLabel}
          </span>
        </div>
        <div className="flex items-center gap-unit-md">
          <span className="font-label-micro text-label-micro text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary">verified_user</span>
            AUTO-ISOLATION READY
          </span>
          <button
            onClick={runTwinCalibration}
            disabled={isCalibrating}
            className="px-unit-sm py-0.5 bg-surface-container-highest hover:bg-primary hover:text-on-primary font-label-tactical text-label-tactical uppercase rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCalibrating ? 'Calibrating...' : 'Run Twin Calibration'}
          </button>
        </div>
      </div>

      {/* URL Input Modal for Custom Media */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-primary/40 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-on-surface uppercase font-mono">
              Configure Visual Asset Slot
            </h3>
            <p className="text-xs text-outline mt-1">
              Provide a direct URL to your MP4/WebM video stream, animated GLB render, or UAV tactical imagery.
            </p>
            <input
              type="text"
              placeholder="https://example.com/uav-mission-feed.mp4"
              value={mediaInputUrl}
              onChange={(e) => setMediaInputUrl(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded px-3 py-2 text-xs font-mono text-on-surface mt-4 focus:outline-none focus:border-primary"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="px-3 py-1.5 text-xs text-outline hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (mediaInputUrl.trim()) {
                    setCustomAssetUrl(mediaInputUrl.trim());
                    setAssetMode('custom_media');
                  }
                  setIsMediaModalOpen(false);
                }}
                className="px-3 py-1.5 bg-primary-container text-on-primary-container text-xs font-mono font-bold rounded"
              >
                Load Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

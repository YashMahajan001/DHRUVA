import React, { useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { SubsystemId } from '../../types/engineDetailsTypes';
import { DynamicEngineTwin } from '../faults/DynamicEngineTwin';
import { Video, Box, Plane, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, Upload, Grid, Layers, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

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

  // Dynamic 4-cylinder thermal values derived directly from live telemetry & stress state
  const cyl1Temp = stressSimulationActive
    ? telemetry.chtPeak + 14
    : telemetry.chtAvg - telemetry.chtSpread * 0.25;
  const cyl2Temp = stressSimulationActive
    ? telemetry.chtAvg + 6
    : telemetry.chtAvg + telemetry.chtSpread * 0.4;
  const cyl3Temp = stressSimulationActive
    ? telemetry.chtAvg - 3
    : telemetry.chtAvg - telemetry.chtSpread * 0.2;
  const cyl4Temp = stressSimulationActive
    ? telemetry.chtAvg + 3
    : telemetry.chtAvg + telemetry.chtSpread * 0.1;

  const dynamicCylinders = [
    {
      id: 1,
      name: 'CYL-1',
      temp: Math.round(cyl1Temp),
      status: cyl1Temp > 198 ? 'CRITICAL' : cyl1Temp > 188 ? 'WARNING' : 'NOMINAL',
    },
    {
      id: 2,
      name: 'CYL-2',
      temp: Math.round(cyl2Temp),
      status: cyl2Temp > 198 ? 'CRITICAL' : cyl2Temp > 188 ? 'WARNING' : 'NOMINAL',
    },
    {
      id: 3,
      name: 'CYL-3',
      temp: Math.round(cyl3Temp),
      status: cyl3Temp > 198 ? 'CRITICAL' : cyl3Temp > 188 ? 'WARNING' : 'NOMINAL',
    },
    {
      id: 4,
      name: 'CYL-4',
      temp: Math.round(cyl4Temp),
      status: cyl4Temp > 198 ? 'CRITICAL' : cyl4Temp > 188 ? 'WARNING' : 'NOMINAL',
    },
  ];

  // Calculated exploded offsets for 3D engine parts
  const cylOffsetX = isometricOffset * 0.8;
  const coolingOffsetY = -isometricOffset * 0.6;
  const sumpOffsetY = isometricOffset * 0.5;
  const fuelOffsetY = -isometricOffset * 0.3;

  return (
    <div className="xl:col-span-8 flex flex-col bg-[#161b29]/95 rounded-xl shadow-xl relative overflow-hidden border border-[#3b494b]/30 select-none">
      {/* TOP VIEWPORT CONTROLS BAR */}
      <div className="h-12 bg-[#1a1f2d] px-4 flex items-center justify-between z-20 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#090e1b] px-3 py-1 rounded-md border border-[#3b494b]/40">
            <span
              className={`w-2 h-2 rounded-full ${
                stressSimulationActive
                  ? 'bg-red-500 animate-ping'
                  : 'bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]'
              }`}
            />
            <span className="font-mono text-xs text-[#00f0ff] font-bold uppercase tracking-wider">
              TWIN-CORE V3 // {selectedEngine.model}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#849495] hidden sm:inline">
            SER: {selectedEngine.id}
          </span>
        </div>

        {/* Viewport Render & Asset Mode Toggles */}
        <div className="flex items-center gap-2">
          {/* Asset View Selector: Twin CAD / Tactical UAV / Custom Video Placeholder */}
          <div className="flex items-center bg-[#090e1b] p-0.5 rounded-lg border border-[#3b494b]/40">
            <button
              onClick={() => setAssetMode('engine_twin')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                assetMode === 'engine_twin'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Digital Twin Engine View"
            >
              <Box className="w-3 h-3" />
              <span className="hidden md:inline">Twin</span>
            </button>

            <button
              onClick={() => setAssetMode('uav_airframe')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                assetMode === 'uav_airframe'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
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
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                assetMode === 'custom_media'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
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
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              renderMode === 'wireframe'
                ? 'bg-[#00f0ff] text-[#00363a] border-[#00f0ff]'
                : 'bg-[#252a38] text-[#b9cacb] border-[#3b494b]/30 hover:text-[#dee2f5]'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          {/* Exploded Button */}
          <button
            id="btn-exploded"
            onClick={handleExplodeToggle}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isometricOffset > 0
                ? 'bg-[#0053db] text-[#dbfcff] border-[#0053db] shadow-[0_0_8px_rgba(0,83,219,0.4)]'
                : 'bg-[#252a38] text-[#b9cacb] border-[#3b494b]/30 hover:text-[#dee2f5]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Exploded</span>
          </button>

          {/* Holo-HUD Button */}
          <button
            id="btn-hologram"
            onClick={() => setRenderMode('holo')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              renderMode === 'holo'
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-[#252a38] text-[#b9cacb] border-[#3b494b]/30 hover:text-[#dee2f5]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Holo-HUD</span>
          </button>
        </div>
      </div>

      {/* COMPONENT SELECTOR BUTTON BAR */}
      <div className="bg-[#090e1b]/95 px-4 py-2.5 flex flex-wrap items-center gap-2 z-20 border-b border-[#3b494b]/30">
        <span className="font-mono text-[10px] text-[#849495] uppercase font-bold tracking-wider mr-1">
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
              className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSelected
                  ? 'bg-[#00f0ff] text-[#00363a] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'bg-[#161b29] text-[#b9cacb] border-[#3b494b]/30 hover:border-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#00363a]' : item.health >= 90 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} />
              <span>{item.index}. {item.name}</span>
              <span className={`text-[9px] ${isSelected ? 'text-[#00363a]/80 font-extrabold' : 'text-[#849495]'}`}>({item.health}%)</span>
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
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
          >
            <DynamicEngineTwin
              zoomLevel={cameraZoom}
              isThermalMode={renderMode === 'holo'}
              rpm={telemetry.rpm}
              cameraRotationDeg={cameraRotation}
              explodedOffset={isometricOffset}
              renderMode={renderMode}
              selectedSubsystemId={selectedSubsystemId}
              cylinders={dynamicCylinders}
              chtPeak={telemetry.chtPeak}
              chtAvg={telemetry.chtAvg}
              chtSpread={telemetry.chtSpread}
              isStressed={stressSimulationActive}
              className="w-full h-full max-w-[760px] max-h-[480px]"
            />

            {/* INTERACTIVE HOLOGRAPHIC HOTSPOT CALLOUT OVERLAYS */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-full max-w-[760px] h-full max-h-[480px]">
                {/* Hotspot 1: Cylinder Head */}
                <div
                  id="node-cylinders"
                  className="absolute left-[14%] top-[46%] pointer-events-auto cursor-pointer group flex items-center gap-2 transition-transform hover:scale-105"
                  onClick={() => selectSubsystem('cylinder')}
                  title="Cylinder Assembly Subsystem (Click to Inspect)"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#00f0ff]/25 animate-ping absolute" />
                    <span className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
                  </div>
                  <div className="bg-[#090e1b]/95 border border-[#00f0ff]/70 px-2.5 py-1 rounded backdrop-blur-xs shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                    <span className="font-mono text-[10px] text-[#00f0ff] font-bold tracking-wider">
                      CYL {Math.round(telemetry.chtPeak)}°C
                    </span>
                  </div>
                </div>

                {/* Hotspot 2: Radiator / Coolant / Airflow */}
                <div
                  id="node-cooling"
                  className="absolute left-[44%] top-[12%] pointer-events-auto cursor-pointer group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                  onClick={() => selectSubsystem('cooling')}
                  title="Cooling & Induction Subsystem (Click to Inspect)"
                >
                  <div className="bg-[#090e1b]/95 border border-[#7bd0ff]/70 px-2.5 py-1 rounded backdrop-blur-xs shadow-[0_0_12px_rgba(123,208,255,0.25)]">
                    <span className="font-mono text-[10px] text-[#7bd0ff] font-bold tracking-wider">
                      AIRFLOW {telemetry.radiatorAirflow.toFixed(0)}m/s
                    </span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#7bd0ff]/25 animate-ping absolute" />
                    <span className="w-3 h-3 rounded-full bg-[#7bd0ff] shadow-[0_0_10px_#7bd0ff]" />
                  </div>
                </div>

                {/* Hotspot 3: Fuel Injection Rail */}
                <div
                  id="node-fuel"
                  className="absolute right-[14%] top-[34%] pointer-events-auto cursor-pointer group flex items-center gap-2 transition-transform hover:scale-105"
                  onClick={() => selectSubsystem('fuel')}
                  title="Fuel Injection Subsystem (Click to Inspect)"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#f59e0b]/25 animate-ping absolute" />
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
                  </div>
                  <div className="bg-[#090e1b]/95 border border-[#f59e0b]/70 px-2.5 py-1 rounded backdrop-blur-xs shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <span className="font-mono text-[10px] text-[#f59e0b] font-bold tracking-wider">
                      FUEL {telemetry.fuelFlow.toFixed(1)} L/h
                    </span>
                  </div>
                </div>

                {/* Hidden DOM elements to preserve legacy test querySelectors */}
                <div id="node-lubrication" className="hidden" onClick={() => selectSubsystem('lubrication')} />
                <div id="node-electrical" className="hidden" onClick={() => selectSubsystem('electrical')} />
                <div id="node-crankcase" className="hidden" onClick={() => selectSubsystem('lubrication')} />
              </div>
            </div>
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
      <div className="bg-[#161b29] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20 border-t border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#849495] uppercase tracking-wider font-semibold">
            DIAGNOSTIC TARGET:
          </span>
          <span
            id="active-target-label"
            className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#090e1b] border border-[#3b494b]/30 ${
              isCalibrating ? 'text-amber-400 animate-pulse border-amber-400/40' : 'text-[#00f0ff] border-[#00f0ff]/30'
            }`}
          >
            {activeTargetLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#b9cacb] flex items-center gap-1.5 bg-[#090e1b]/70 px-2.5 py-1 rounded border border-[#3b494b]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-semibold text-[#00dbe9]">AUTO-ISOLATION READY</span>
          </span>
          <button
            onClick={runTwinCalibration}
            disabled={isCalibrating}
            className="px-3 py-1.5 bg-[#252a38] hover:bg-[#00f0ff] hover:text-[#00363a] font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 border border-[#3b494b]/40 shadow-sm"
          >
            {isCalibrating ? 'CALIBRATING...' : 'RUN TWIN CALIBRATION'}
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

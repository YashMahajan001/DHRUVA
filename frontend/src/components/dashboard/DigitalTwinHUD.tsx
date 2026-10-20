import React, { useEffect, useRef, useState } from 'react';
import { Layers, Maximize2, Minimize2, Video, Upload } from 'lucide-react';
import { EngineInstance, Mission } from '../../types';

interface DigitalTwinHUDProps {
  engine: EngineInstance;
  mission: Mission;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenAssetModal: () => void;
  customAssetUrl?: string;
  viewMode: 'schematic' | 'uav_feed' | 'cad_twin';
  onChangeViewMode: (mode: 'schematic' | 'uav_feed' | 'cad_twin') => void;
}

export const DigitalTwinHUD: React.FC<DigitalTwinHUDProps> = ({
  engine,
  mission,
  isExpanded,
  onToggleExpand,
  onOpenAssetModal,
  customAssetUrl,
  viewMode,
  onChangeViewMode,
}) => {
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Combustion Oscilloscope Canvas Animation
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      ctx.lineWidth = 1.8 * dpr;
      ctx.strokeStyle = engine.statusColor || '#00f0ff';
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;
      const vib = engine.telemetry?.vibration || 2.1;
      const amp = vib * 5 * dpr;

      for (let x = 0; x < width; x++) {
        const y =
          mid +
          Math.sin(x * 0.045 + phase) * amp +
          Math.sin(x * 0.12 - phase * 1.6) * (amp * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Subtle phosphor glow line
      ctx.lineWidth = 0.8 * dpr;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      phase += 0.14;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [engine.telemetry?.vibration, engine.statusColor]);

  // Cylinder status colors
  const getCylColor = (temp: number) => {
    if (temp > 215) return '#ef4444';
    if (temp > 200) return '#f59e0b';
    return '#00f0ff';
  };

  const c1 = engine.telemetry?.cylinderTemps?.[0] || engine.telemetry?.cht || 178;
  const c2 = engine.telemetry?.cylinderTemps?.[1] || engine.telemetry?.cht || 174;
  const c3 = engine.telemetry?.cylinderTemps?.[2] || engine.telemetry?.cht || 180;
  const c4 = engine.telemetry?.cylinderTemps?.[3] || engine.telemetry?.cht || 176;

  // Health dial calculation
  const healthVal = engine.health || 92;
  const dashoffset = 100 - healthVal;

  return (
    <div
      id="digital-twin-hud-container"
      className={`relative w-full rounded-xl overflow-hidden bg-[#090e1b] border border-[#3b494b]/20 shadow-xl flex flex-col justify-between p-4 sm:p-5 transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-4 z-50 bg-[#090e1b]/98'
          : 'min-h-[400px] md:min-h-[460px]'
      }`}
    >
      {/* Background Visual Asset Layer (Custom video/image or default Stitch UAV flight backdrop) */}
      {viewMode === 'uav_feed' && customAssetUrl ? (
        <div className="absolute inset-0 z-0">
          {customAssetUrl.endsWith('.mp4') || customAssetUrl.endsWith('.webm') ? (
            <video
              src={customAssetUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <img
              src={customAssetUrl}
              alt="Custom UAV Video/Feed"
              className="w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-[#00f0ff]/10 mix-blend-color"></div>
        </div>
      ) : (
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuArjGvQz6BNliOj6tDWGe1M5Ndr_ixd6M704C6aGQNiwQBbscgSFPyN_tnpi7UBd10P2hjZbnW64pfprpljMCK9fFaci_IL8BGjzcW0-46GbvulDhqDmuoRz6lxUUV2uihjG4sEiyWyPQp2D6Bp-gXO7tRF1bFEDlV3uwqItX_AYHV93o56IZFZDvebJ9widg6X0zjcPXyIVrv2zEpDcWoraYpbznlB0_5_ZibTHgvfRuLPHRGZXAYl')`,
          }}
        />
      )}

      {/* Atmospheric Vignette Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#090e1b] via-[#090e1b]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#090e1b]/70 via-transparent to-[#090e1b]/70 pointer-events-none" />

      {/* Top HUD Controls & Tactical Mode Switcher */}
      <div className="relative z-30 flex items-center justify-between gap-2 pb-2">
        {/* Camera Info Callout */}
        <div className="text-xs text-[#849495] leading-relaxed hidden md:block">
          <span className="font-mono text-[#00f0ff] font-semibold">CAM-01</span>
          <span className="mx-1.5 text-[#3b494b]">·</span>
          <span>FOV {mission.fovDegrees || 84}°</span>
          <span className="mx-1.5 text-[#3b494b]">·</span>
          <span className="text-[#00dbe9]">FLIR</span>
        </div>

        {/* Tactical View Mode Switcher & Asset Replacement Tools */}
        <div className="flex items-center gap-1.5 bg-[#161b29]/90 p-1.5 rounded border border-[#3b494b]/30 backdrop-blur-md">
          <button
            onClick={() => onChangeViewMode('schematic')}
            className={`px-3 py-1 rounded font-mono text-xs uppercase transition-colors flex items-center gap-1.5 ${
              viewMode === 'schematic'
                ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                : 'text-[#b9cacb] hover:text-[#dee2f5]'
            }`}
            title="Holographic Piston Twin Schematics"
          >
            <Layers className="w-3 h-3" />
            <span>Schematic</span>
          </button>

          <button
            onClick={() => onChangeViewMode('uav_feed')}
            className={`px-3 py-1 rounded font-mono text-xs uppercase transition-colors flex items-center gap-1.5 ${
              viewMode === 'uav_feed'
                ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                : 'text-[#b9cacb] hover:text-[#dee2f5]'
            }`}
            title="Live UAV Optical / FLIR Feed"
          >
            <Video className="w-3 h-3" />
            <span>FLIR Feed</span>
          </button>

          {/* Replace Asset / Custom Video Button */}
          <button
            onClick={onOpenAssetModal}
            className="px-3 py-1 rounded font-mono text-xs uppercase text-[#00f0ff] hover:bg-[#252a38] border border-[#00f0ff]/30 transition-colors flex items-center gap-1.5"
            title="Replace visual with custom UAV video / image asset"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Set Asset</span>
          </button>

          {/* Fullscreen Expand Button */}
          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#252a38] transition-colors"
            title={isExpanded ? 'Collapse HUD Viewport' : 'Expand HUD Viewport'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Top-Right Spatial Callout */}
        <div className="text-right text-xs text-[#849495] leading-relaxed hidden md:block">
          <span className="font-mono text-[#00f0ff]">{engine.twinState?.syntheticTwinId || 'TWIN D-04'}</span>
          <span className="mx-1.5 text-[#3b494b]">·</span>
          <span>AZ {engine.twinState?.azimuth || 114}°</span>
          <span className="mx-1.5 text-[#3b494b]">·</span>
          <span>EL {engine.twinState?.elevation || -12.4}°</span>
        </div>
      </div>

      {/* Artificial Horizon Crosshair Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-25 flex items-center gap-4 z-10">
        <div className="w-16 h-[1px] bg-[#00f0ff]"></div>
        <div className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></div>
        </div>
        <div className="w-16 h-[1px] bg-[#00f0ff]"></div>
      </div>

      {/* Center Digital Twin Interactive Schematic */}
      <div className="relative z-20 w-full flex-1 flex flex-col justify-center items-center py-2">
        <div className="relative w-full max-w-lg aspect-[16/9] flex items-center justify-center">
          {/* Holographic Vector Engine SVG */}
          <svg
            className="w-full h-full text-[#00f0ff]/80"
            viewBox="0 0 600 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cyanGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0053db" stopOpacity="0.2" />
              </linearGradient>
              <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Central Propulsion Core Rings */}
            <ellipse
              cx="300"
              cy="160"
              rx="140"
              ry="70"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.5"
            />
            <ellipse
              cx="300"
              cy="160"
              rx="90"
              ry="45"
              stroke="#00f0ff"
              strokeWidth="2"
              filter="url(#vectorGlow)"
              opacity="0.8"
            />

            {/* 4 Opposed Piston Chambers (Lycoming O-320 geometry) */}
            {/* Left Bank: CYL 1 & CYL 3 */}
            <rect
              x="110"
              y="110"
              width="80"
              height="36"
              rx="4"
              fill="#161b29"
              fillOpacity="0.85"
              stroke={getCylColor(c1)}
              strokeWidth="1.5"
            />
            <text
              x="120"
              y="132"
              fill="#dbfcff"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="700"
            >
              CYL 1 <tspan fill={getCylColor(c1)} fontSize="9">[{Math.round(c1)}°C]</tspan>
            </text>

            <rect
              x="110"
              y="174"
              width="80"
              height="36"
              rx="4"
              fill="#161b29"
              fillOpacity="0.85"
              stroke={getCylColor(c3)}
              strokeWidth="1.5"
            />
            <text
              x="120"
              y="196"
              fill="#dbfcff"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="700"
            >
              CYL 3 <tspan fill={getCylColor(c3)} fontSize="9">[{Math.round(c3)}°C]</tspan>
            </text>

            {/* Right Bank: CYL 2 & CYL 4 */}
            <rect
              x="410"
              y="110"
              width="80"
              height="36"
              rx="4"
              fill="#161b29"
              fillOpacity="0.85"
              stroke={getCylColor(c2)}
              strokeWidth="1.5"
            />
            <text
              x="420"
              y="132"
              fill="#dbfcff"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="700"
            >
              CYL 2 <tspan fill={getCylColor(c2)} fontSize="9">[{Math.round(c2)}°C]</tspan>
            </text>

            <rect
              x="410"
              y="174"
              width="80"
              height="36"
              rx="4"
              fill="#161b29"
              fillOpacity="0.85"
              stroke={getCylColor(c4)}
              strokeWidth="1.5"
            />
            <text
              x="420"
              y="196"
              fill="#dbfcff"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="700"
            >
              CYL 4 <tspan fill={getCylColor(c4)} fontSize="9">[{Math.round(c4)}°C]</tspan>
            </text>

            {/* Crankshaft & Core Connecting Drive */}
            <line x1="190" y1="128" x2="250" y2="155" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />
            <line x1="190" y1="192" x2="250" y2="165" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />
            <line x1="410" y1="128" x2="350" y2="155" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />
            <line x1="410" y1="192" x2="350" y2="165" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />

            {/* Turbo/Exhaust Turbine Core Hub */}
            <circle
              cx="300"
              cy="160"
              r="28"
              fill="#090e1b"
              stroke="#00f0ff"
              strokeWidth="2"
              filter="url(#vectorGlow)"
            />
            {/* Spinning Turbine Blade with dynamic RPM proportional speed */}
            <path d="M 292 145 L 308 145 L 305 175 L 295 175 Z" fill="#00f0ff" opacity="0.85">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 300 160"
                to="360 300 160"
                dur={`${Math.max(0.3, 1200 / (engine.telemetry?.rpm || 2400))}s`}
                repeatCount="indefinite"
              />
            </path>
            <circle cx="300" cy="160" r="6" fill="#00f0ff" />

            {/* Sensor Optical Nodes & Holographic Leader Lines */}
            <circle cx="150" cy="95" r="4" fill="#00f0ff" filter="url(#vectorGlow)" />
            <line x1="150" y1="95" x2="150" y2="110" stroke="#00f0ff" strokeDasharray="2 2" strokeWidth="1" />

            <circle cx="450" cy="95" r="4" fill="#00f0ff" filter="url(#vectorGlow)" />
            <line x1="450" y1="95" x2="450" y2="110" stroke="#00f0ff" strokeDasharray="2 2" strokeWidth="1" />

            <circle cx="300" cy="235" r="4" fill="#00f0ff" filter="url(#vectorGlow)" />
            <line x1="300" y1="210" x2="300" y2="235" stroke="#00f0ff" strokeDasharray="2 2" strokeWidth="1" />
          </svg>

          {/* Interactive Floating Sensor Badges */}
          <div className="absolute top-2 left-4 bg-[#090e1a]/90 border border-[#00f0ff]/20 px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md text-left">
            <span className="text-[10px] text-[#849495] block">CHT · 1A</span>
            <span className="font-mono text-xs font-bold text-[#00f0ff]">
              {Math.round(c1)} °C
            </span>
          </div>

          <div className="absolute top-2 right-4 bg-[#090e1a]/90 border border-[#00f0ff]/20 px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md text-right">
            <span className="text-[10px] text-[#849495] block">EGT · 2B</span>
            <span className="font-mono text-xs font-bold text-[#00f0ff]">
              {Math.round(engine.telemetry?.egt || 690)} °C
            </span>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#090e1a]/90 border border-[#00f0ff]/20 px-3 py-1 rounded-lg shadow-md backdrop-blur-md text-center whitespace-nowrap">
            <span className="text-[10px] text-[#849495] block">Bearing Vibration</span>
            <span
              className={`font-mono text-xs font-bold ${
                (engine.telemetry?.vibration || 2.1) > 4.0
                  ? 'text-[#ef4444]'
                  : (engine.telemetry?.vibration || 2.1) > 3.0
                  ? 'text-[#f59e0b]'
                  : 'text-[#10b981]'
              }`}
            >
              {(engine.telemetry?.vibration || 2.1).toFixed(1)} mm/s
              <span className="ml-1 text-[10px] font-normal text-[#849495]">
                (
                {(engine.telemetry?.vibration || 2.1) > 4.0
                  ? 'Critical'
                  : (engine.telemetry?.vibration || 2.1) > 3.0
                  ? 'Warning'
                  : 'Nominal'}
                )
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Integrated Live Engine Health circle HUD widget over the twin */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-[#0c1220]/90 border border-[#00f0ff]/15 backdrop-blur-xl p-3 sm:p-3.5 rounded-xl shadow-md">
        {/* Big Health Dial Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1a2335]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="transition-all duration-700"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={engine.statusColor || '#00f0ff'}
                strokeDasharray={`${healthVal}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="font-mono text-base sm:text-lg font-bold leading-none"
                style={{ color: engine.statusColor || '#00f0ff' }}
              >
                {healthVal}%
              </span>
              <span className="text-[8px] text-[#849495] uppercase tracking-wider mt-0.5">
                Health
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: engine.statusColor || '#10b981' }}
              ></span>
              <span
                className="text-sm sm:text-base font-semibold tracking-tight"
                style={{ color: engine.statusColor === '#ef4444' ? '#ffb4ab' : engine.statusColor === '#f59e0b' ? '#f59e0b' : '#dee2f5' }}
              >
                {engine.status || 'Nominal'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#849495]">
              <span>Model: <span className="text-[#dee2f5] font-medium">{engine.model || 'Lycoming O-320'}</span></span>
              <span>·</span>
              <span>RUL <span className="text-[#00f0ff] font-mono font-bold">{engine.rul || 184} h</span></span>
            </div>
          </div>
        </div>

        {/* Live Animated Canvas Waveform (Combustion Oscilloscope) */}
        <div className="flex-1 min-w-[180px] max-w-sm flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] text-[#849495]">
            <span>Harmonic Sensor [CH-01]</span>
            <span className="text-[#00f0ff] font-mono font-semibold">
              {(engine.telemetry?.harmonicFreq || 124.8).toFixed(1)} Hz
            </span>
          </div>
          <canvas
            ref={oscCanvasRef}
            className="w-full h-8 bg-[#090e1a] rounded-lg border border-[#3b494b]/20"
          ></canvas>
        </div>
      </div>

      {/* Bottom HUD Reticle Footer Info */}
      <div className="relative z-20 flex justify-between items-end pt-1.5 text-[#849495] text-xs">
        <div className="hidden sm:block text-[11px]">Lock: <span className="text-[#dee2f5]">{mission.targetLock || 'Disengaged'}</span></div>
        <div className="text-[11px]">
          Refresh <span className="font-mono text-[#00f0ff]">{engine.twinState?.frameRefreshHz || 60}Hz</span> · Latency <span className="font-mono text-[#00f0ff]">{engine.twinState?.latencyMs || 12}ms</span>
        </div>
      </div>
    </div>
  );
};

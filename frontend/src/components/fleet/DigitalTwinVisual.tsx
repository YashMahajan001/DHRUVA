import React, { useState } from 'react';
import {
  Upload,
  Video,
  Activity,
  Layers,
  Thermometer,
  ShieldAlert,
  Flame,
  Zap,
  Info,
  ExternalLink
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const DigitalTwinVisual: React.FC = () => {
  const { selectedEngine, currentTelemetry, twinState } = useTelemetry();
  const [activeSubsystem, setActiveSubsystem] = useState<string>('cylinders');
  const [customAssetUrl, setCustomAssetUrl] = useState<string | null>(null);
  const [isAssetUploadOpen, setIsAssetUploadOpen] = useState<boolean>(false);
  const [viewAngle, setViewAngle] = useState<'schematic' | 'thermal' | 'video-slot'>('schematic');

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAssetUrl(url);
      setViewAngle('video-slot');
    }
  };

  const isUav3 = selectedEngine.id === 'uav-03';
  const isUav2 = selectedEngine.id === 'uav-02';

  return (
    <div
      id="digital-twin-visual-container"
      className="relative w-full h-[480px] bg-[#090e1b] rounded-xl overflow-hidden shadow-2xl border border-[#00f0ff]/30 p-4 flex flex-col justify-between"
    >
      {/* Top Bar / Mode Toggles */}
      <div className="relative z-20 flex items-center justify-between flex-wrap gap-2 border-b border-[#3b494b]/30 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping"></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-label-tactical text-[11px] text-[#00f0ff] font-mono font-bold uppercase">
                DIGITAL TWIN SCHEMATIC: {selectedEngine.model}
              </span>
              <span className="font-label-micro text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#7df4ff] font-mono">
                {twinState?.digitalTwinFidelity || 'PHYSICS_AI_HYBRID'}
              </span>
            </div>
            <span className="font-label-micro text-[9px] text-[#849495] font-mono">
              FIDELITY CONFIDENCE: {twinState?.confidenceScore || 98.4}% // SYNC LATENCY: 18ms
            </span>
          </div>
        </div>

        {/* View Angle & Replacement Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewAngle('schematic')}
            className={`px-2.5 py-1 rounded font-label-tactical text-[10px] font-mono uppercase transition-all ${
              viewAngle === 'schematic'
                ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
            }`}
          >
            CAD Schematic
          </button>
          <button
            type="button"
            onClick={() => setViewAngle('thermal')}
            className={`px-2.5 py-1 rounded font-label-tactical text-[10px] font-mono uppercase transition-all ${
              viewAngle === 'thermal'
                ? 'bg-amber-500 text-[#002022] font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
            }`}
          >
            Thermal IR
          </button>
          <button
            type="button"
            onClick={() => {
              setViewAngle('video-slot');
              setIsAssetUploadOpen(true);
            }}
            className={`px-2.5 py-1 rounded font-label-tactical text-[10px] font-mono uppercase transition-all flex items-center gap-1 ${
              viewAngle === 'video-slot'
                ? 'bg-[#2563eb] text-[#dee2f5] font-bold shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Asset / Video</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
        {viewAngle === 'video-slot' ? (
          /* Video / Asset Replacement View */
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#00f0ff]/40 rounded-lg p-4 bg-[#161b29]/60 relative">
            {customAssetUrl ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {customAssetUrl.includes('image') || !customAssetUrl.endsWith('.mp4') ? (
                  <img
                    src={customAssetUrl}
                    alt="Engine Digital Twin Custom Asset"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <video
                    src={customAssetUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-full max-w-full object-contain rounded"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setCustomAssetUrl(null)}
                  className="absolute top-2 right-2 px-2 py-1 bg-[#93000a] text-[#ffdad6] rounded text-[10px] font-mono"
                >
                  Clear Asset
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center max-w-md">
                <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/40 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <h4 className="font-headline-sm text-[16px] text-[#dee2f5] mb-1 font-bold">
                  AERO ENGINE CAD / VIDEO ASSET SLOT
                </h4>
                <p className="font-body-sm text-[12px] text-[#b9cacb] mb-4">
                  This viewport placeholder is engineered for seamless drop-in of custom UAV / Engine 3D models, video telemetry, or live WebRTC stream.
                </p>
                <label className="cursor-pointer px-4 py-2 bg-[#00f0ff] hover:bg-[#00dbe9] text-[#002022] font-label-tactical text-[11px] font-bold rounded font-mono uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  Upload MP4 Video / Asset
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleAssetUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        ) : (
          /* Interactive High-Tech Aero Piston Digital Twin Schematic */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* SVG Interactive Engine Layout */}
            <svg
              className="w-full h-full max-h-[300px]"
              viewBox="0 0 700 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="crank-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a1f2d" />
                  <stop offset="100%" stopColor="#090e1b" />
                </linearGradient>
                <linearGradient id="hot-cyl" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="norm-cyl" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Engine Block Base Outline */}
              <rect
                x="160"
                y="60"
                width="380"
                height="190"
                rx="8"
                fill="url(#crank-grad)"
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="8 4"
                strokeOpacity="0.4"
              />

              {/* Crankcase Central Axis */}
              <line
                x1="180"
                y1="155"
                x2="520"
                y2="155"
                stroke="#849495"
                strokeWidth="6"
                strokeOpacity="0.5"
              />
              <circle cx="210" cy="155" r="14" fill="#252a38" stroke="#00f0ff" strokeWidth="1.5" />
              <circle cx="350" cy="155" r="18" fill="#252a38" stroke={isUav3 ? '#ef4444' : '#00f0ff'} strokeWidth={isUav3 ? '3' : '1.5'} />
              <circle cx="490" cy="155" r="14" fill="#252a38" stroke="#00f0ff" strokeWidth="1.5" />

              {/* 4 Opposed Cylinders (Lycoming O-320 horizontally opposed configuration) */}
              {/* Cylinder 1 (Top Left) */}
              <g
                className="cursor-pointer group"
                onClick={() => setActiveSubsystem('cylinders')}
              >
                <rect
                  x="210"
                  y="20"
                  width="70"
                  height="75"
                  rx="4"
                  fill="url(#norm-cyl)"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                />
                {/* Cooling fins */}
                <line x1="205" y1="35" x2="285" y2="35" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="205" y1="48" x2="285" y2="48" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="205" y1="61" x2="285" y2="61" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <text x="245" y="76" fill="#dee2f5" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  CYL 1
                </text>
                <text x="245" y="88" fill="#00f0ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                  {currentTelemetry.chtPerCylinder[0]}°C
                </text>
              </g>

              {/* Cylinder 2 (Top Right - has anomaly on UAV-02) */}
              <g
                className="cursor-pointer group"
                onClick={() => setActiveSubsystem('cylinders')}
              >
                <rect
                  x="420"
                  y="20"
                  width="70"
                  height="75"
                  rx="4"
                  fill={isUav2 ? 'url(#hot-cyl)' : 'url(#norm-cyl)'}
                  stroke={isUav2 ? '#f59e0b' : '#00f0ff'}
                  strokeWidth={isUav2 ? '2.5' : '1.5'}
                />
                <line x1="415" y1="35" x2="495" y2="35" stroke={isUav2 ? '#f59e0b' : '#00f0ff'} strokeWidth="1" />
                <line x1="415" y1="48" x2="495" y2="48" stroke={isUav2 ? '#f59e0b' : '#00f0ff'} strokeWidth="1" />
                <line x1="415" y1="61" x2="495" y2="61" stroke={isUav2 ? '#f59e0b' : '#00f0ff'} strokeWidth="1" />
                <text x="455" y="76" fill={isUav2 ? '#ffdad6' : '#dee2f5'} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  CYL 2 {isUav2 ? '⚠️' : ''}
                </text>
                <text x="455" y="88" fill={isUav2 ? '#f59e0b' : '#00f0ff'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
                  {currentTelemetry.chtPerCylinder[1]}°C
                </text>
              </g>

              {/* Cylinder 3 (Bottom Left) */}
              <g
                className="cursor-pointer group"
                onClick={() => setActiveSubsystem('cylinders')}
              >
                <rect
                  x="210"
                  y="215"
                  width="70"
                  height="75"
                  rx="4"
                  fill="url(#norm-cyl)"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                />
                <line x1="205" y1="230" x2="285" y2="230" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="205" y1="243" x2="285" y2="243" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="205" y1="256" x2="285" y2="256" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <text x="245" y="270" fill="#dee2f5" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  CYL 3
                </text>
                <text x="245" y="282" fill="#00f0ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                  {currentTelemetry.chtPerCylinder[2]}°C
                </text>
              </g>

              {/* Cylinder 4 (Bottom Right) */}
              <g
                className="cursor-pointer group"
                onClick={() => setActiveSubsystem('cylinders')}
              >
                <rect
                  x="420"
                  y="215"
                  width="70"
                  height="75"
                  rx="4"
                  fill="url(#norm-cyl)"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                />
                <line x1="415" y1="230" x2="495" y2="230" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="415" y1="243" x2="495" y2="243" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="415" y1="256" x2="495" y2="256" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.6" />
                <text x="455" y="270" fill="#dee2f5" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  CYL 4
                </text>
                <text x="455" y="282" fill="#00f0ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                  {currentTelemetry.chtPerCylinder[3]}°C
                </text>
              </g>

              {/* Central Stage 2 Crankshaft Bearing - has anomaly on UAV-03 */}
              <g
                className="cursor-pointer group"
                onClick={() => setActiveSubsystem('crankshaftBearing')}
              >
                <circle
                  cx="350"
                  cy="155"
                  r="26"
                  fill={isUav3 ? '#93000a' : '#1a1f2d'}
                  stroke={isUav3 ? '#ef4444' : '#00f0ff'}
                  strokeWidth={isUav3 ? '3' : '1.5'}
                  filter={isUav3 ? 'url(#glow-cyan)' : undefined}
                />
                <text
                  x="350"
                  y="159"
                  fill={isUav3 ? '#ffdad6' : '#dee2f5'}
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isUav3 ? 'BRG TRIP' : 'BRG STG 2'}
                </text>
              </g>

              {/* Leader Line to Floating Telemetry Badge for Bearing */}
              <path
                d="M 350,130 L 350,85 L 320,85"
                fill="none"
                stroke={isUav3 ? '#ef4444' : '#00f0ff'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <g transform="translate(10, 65)">
                <rect width="145" height="42" rx="4" fill="#161b29" stroke={isUav3 ? '#ef4444' : '#00f0ff'} strokeWidth="1" />
                <text x="8" y="16" fill="#849495" fontSize="8.5" fontFamily="JetBrains Mono">
                  CRANKSHAFT BEARING
                </text>
                <text x="8" y="32" fill={isUav3 ? '#ffdad6' : '#00f0ff'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  {currentTelemetry.vibration} g RMS {isUav3 ? '(CRIT)' : '(NOM)'}
                </text>
              </g>

              {/* Leader Line to Oil Sump Badge */}
              <path
                d="M 350,180 L 350,225 L 320,225"
                fill="none"
                stroke={isUav3 ? '#ef4444' : '#00f0ff'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <g transform="translate(10, 205)">
                <rect width="145" height="42" rx="4" fill="#161b29" stroke={isUav3 ? '#ef4444' : '#00f0ff'} strokeWidth="1" />
                <text x="8" y="16" fill="#849495" fontSize="8.5" fontFamily="JetBrains Mono">
                  LUBRICATION CIRCUIT
                </text>
                <text x="8" y="32" fill={isUav3 ? '#ffdad6' : '#dee2f5'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  {currentTelemetry.oilPressure} PSI // {currentTelemetry.oilTemperature}°C
                </text>
              </g>

              {/* Leader Line to Turbocharger & Injection (Right Side) */}
              <path
                d="M 540,155 L 560,155"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <g transform="translate(545, 135)">
                <rect width="145" height="42" rx="4" fill="#161b29" stroke="#00f0ff" strokeWidth="1" />
                <text x="8" y="16" fill="#849495" fontSize="8.5" fontFamily="JetBrains Mono">
                  INJECTION &amp; TURBO
                </text>
                <text x="8" y="32" fill="#00f0ff" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  {currentTelemetry.fuelFlow} L/HR // {currentTelemetry.egt}°C EGT
                </text>
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Synthetic Physics Sensors Subsystem Data Ribbon */}
      <div className="relative z-20 grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#161b29]/90 p-2.5 rounded-lg border border-[#3b494b]/40 text-on-surface">
        <div className="flex flex-col">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            BEARING WEAR COEFF
          </span>
          <span
            className={`font-telemetry-num-md text-[13px] font-mono font-bold ${
              isUav3 ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'
            }`}
          >
            {twinState?.syntheticSensors.bearingWearCoefficient || (isUav3 ? '0.89 [CRIT]' : '0.04 [NOM]')}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            THERMAL STRESS
          </span>
          <span
            className={`font-telemetry-num-md text-[13px] font-mono font-bold ${
              isUav2 ? 'text-amber-300' : 'text-[#dee2f5]'
            }`}
          >
            {twinState?.syntheticSensors.pistonThermalStressMpa || 42.1} MPa
          </span>
        </div>

        <div className="flex flex-col">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            COMBUSTION STABILITY
          </span>
          <span className="font-telemetry-num-md text-[13px] text-emerald-400 font-mono font-bold">
            {twinState?.syntheticSensors.combustionStabilityIndex || 0.98}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            HARMONIC SPIKE
          </span>
          <span
            className={`font-telemetry-num-md text-[13px] font-mono font-bold ${
              isUav3 ? 'text-[#ffb4ab]' : 'text-[#00dbe9]'
            }`}
          >
            {twinState?.syntheticSensors.harmonicVibrationSpikeHz || 120} Hz
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * DHRUVAA UAV / Digital Twin Holographic Cutaway Viewport
 * Prepared for replacing with custom UAV/engine video or media assets.
 */
import React, { useState } from 'react';
import { useMission } from '../../context/MaintenanceContext';
import {
  Eye,
  Layers,
  Upload,
  Video,
  Maximize2,
  Cpu,
  Flame,
  AlertTriangle,
  Compass,
  Crosshair
} from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const DigitalTwinCutaway: React.FC = () => {
  const { selectedEngine, openModal } = useMission();
  const [viewMode, setViewMode] = useState<'hologram' | 'blueprint' | 'customAsset'>('hologram');
  const [customAssetUrl, setCustomAssetUrl] = useState<string>('');
  const [isHoveringNode, setIsHoveringNode] = useState<string | null>(null);

  const isEng03 = selectedEngine.id === 'eng-03';
  const isEng02 = selectedEngine.id === 'eng-02';

  return (
    <div className="p-4 rounded bg-[#090e1b]/85 border border-[#00f0ff]/30 flex flex-col gap-3 relative overflow-hidden shadow-[0_0_24px_rgba(0,240,255,0.06)]">
      <ReticleCorner color="#00f0ff" size={6} />

      {/* Viewport Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b494b]/30 pb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#00f0ff]" />
          <h3 className="font-headline text-sm text-[#dee2f5] uppercase tracking-wide font-semibold">
            DIGITAL TWIN CUTAWAY // {selectedEngine.airframeCallsign}
          </h3>
          <span className="font-telemetry text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 uppercase">
            MODEL FIDELITY {selectedEngine.twinState.modelFidelityPercent}%
          </span>
        </div>

        {/* View Mode Switcher & Media Replacement Trigger */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded bg-[#161b29] border border-[#3b494b]/30 p-0.5">
            <button
              onClick={() => setViewMode('hologram')}
              className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
                viewMode === 'hologram'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              HOLOGRAPHIC TWIN
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
                viewMode === 'blueprint'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              SCHEMATIC
            </button>
            <button
              onClick={() => setViewMode('customAsset')}
              className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all flex items-center gap-1 ${
                viewMode === 'customAsset'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
              title="Replace placeholder with your own video or rendering"
            >
              <Video className="w-3 h-3" />
              <span>CUSTOM MEDIA</span>
            </button>
          </div>

          <button
            onClick={() => openModal('twinCutaway', { engineId: selectedEngine.id })}
            className="p-1 rounded bg-[#161b29] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#00f0ff] border border-[#3b494b]/40 transition-colors"
            title="Expand Fullscreen 3D Twin Cutaway"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="relative h-64 sm:h-72 w-full rounded bg-[#050811] border border-[#3b494b]/30 flex items-center justify-center overflow-hidden tactical-grid">
        {/* Optical Scanning Line HUD Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.05)_0%,transparent_70%)]" />

        {viewMode === 'customAsset' ? (
          /* User Custom Video / Asset Replacement View */
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md gap-3 z-10">
            {customAssetUrl ? (
              <div className="w-full h-full relative">
                <video
                  src={customAssetUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-48 object-cover rounded border border-[#00f0ff]/40"
                />
                <button
                  onClick={() => setCustomAssetUrl('')}
                  className="mt-2 text-xs text-red-400 hover:underline font-tactical uppercase"
                >
                  Clear Custom Video
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#161b29] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-headline text-base text-[#dee2f5] font-bold">
                    REPLACE WITH CUSTOM UAV / ENGINE MEDIA
                  </h4>
                  <p className="font-body text-xs text-[#b9cacb] mt-1">
                    Insert your direct MP4 / WebM video URL or 3D asset link to bind your custom engine simulation.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full mt-1">
                  <input
                    type="url"
                    placeholder="https://.../engine_cutaway.mp4"
                    value={customAssetUrl}
                    onChange={(e) => setCustomAssetUrl(e.target.value)}
                    className="flex-1 bg-[#161b29] border border-[#3b494b]/50 rounded px-2.5 py-1 text-xs text-[#dee2f5] font-telemetry focus:border-[#00f0ff] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!customAssetUrl) {
                        setCustomAssetUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                      }
                    }}
                    className="px-3 py-1 rounded bg-[#00f0ff] text-[#00363a] font-tactical text-[11px] font-bold uppercase hover:bg-[#7df4ff]"
                  >
                    LOAD
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* High-Tech Aerospace SVG Holographic Wireframe Engine & Airframe */
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Tactical Compass / Orientation Rose in Corner */}
            <div className="absolute top-2 left-2 flex items-center gap-1 font-telemetry text-[9px] text-[#849495]">
              <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>PITCH: +2.4° // ROLL: 0.0° // YAW: 184°</span>
            </div>

            <svg
              className="w-full h-full max-h-60"
              viewBox="0 0 600 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Tactical Reticle Rings */}
              <circle cx="300" cy="120" r="105" stroke="#00f0ff" strokeOpacity="0.12" strokeDasharray="4 6" />
              <circle cx="300" cy="120" r="80" stroke="#00f0ff" strokeOpacity="0.08" />

              {/* Airframe Outline (UAV Twin-Boom Fuselage) */}
              <path
                d="M 300 20 L 330 80 L 480 95 L 485 110 L 340 125 L 345 190 L 325 210 L 300 170 L 275 210 L 255 190 L 260 125 L 115 110 L 120 95 L 270 80 Z"
                stroke="#00f0ff"
                strokeOpacity="0.25"
                strokeWidth="1.2"
                fill="rgba(0, 240, 255, 0.02)"
              />

              {/* Aero Piston Engine Core Cutaway */}
              <rect x="250" y="85" width="100" height="70" rx="3" stroke="#00f0ff" strokeWidth="1.5" fill="#090e1b" fillOpacity="0.8" />
              <line x1="270" y1="85" x2="270" y2="155" stroke="#3b494b" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="330" y1="85" x2="330" y2="155" stroke="#3b494b" strokeWidth="1" strokeDasharray="2 2" />

              {/* Cylinders (Horizontally Opposed 4-Cylinder Aero Configuration) */}
              {/* Cylinder 1 (Top Left) */}
              <rect x="210" y="90" width="38" height="26" rx="2" stroke="#00dbe9" strokeWidth="1.2" fill="#161b29" />
              {/* Cylinder 2 (Top Right - Affected on Eng 02) */}
              <rect
                x="352"
                y="90"
                width="38"
                height="26"
                rx="2"
                stroke={isEng02 ? '#f59e0b' : '#00dbe9'}
                strokeWidth={isEng02 ? '2' : '1.2'}
                fill={isEng02 ? 'rgba(245, 158, 11, 0.25)' : '#161b29'}
                className={isEng02 ? 'animate-pulse' : ''}
              />
              {/* Cylinder 3 (Bottom Left) */}
              <rect x="210" y="124" width="38" height="26" rx="2" stroke="#00dbe9" strokeWidth="1.2" fill="#161b29" />
              {/* Cylinder 4 (Bottom Right) */}
              <rect x="352" y="124" width="38" height="26" rx="2" stroke="#00dbe9" strokeWidth="1.2" fill="#161b29" />

              {/* Crankshaft Central Journal & Bearings (Affected on Eng 03) */}
              <line x1="260" y1="120" x2="340" y2="120" stroke="#dee2f5" strokeWidth="3" strokeLinecap="round" />
              {/* Bearing #2 Node */}
              <circle
                cx="300"
                cy="120"
                r={isEng03 ? 8 : 5}
                fill={isEng03 ? '#ef4444' : '#00f0ff'}
                fillOpacity={isEng03 ? '0.6' : '0.4'}
                stroke={isEng03 ? '#ef4444' : '#00f0ff'}
                strokeWidth="2"
                className={isEng03 ? 'animate-ping' : ''}
              />
              <circle cx="300" cy="120" r="4" fill={isEng03 ? '#ef4444' : '#00f0ff'} />

              {/* Propeller Hub & Blades */}
              <ellipse cx="300" cy="35" rx="8" ry="4" fill="#00f0ff" />
              <path d="M 230 35 Q 265 33 292 35" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 370 35 Q 335 33 308 35" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Telemetry Leader Line 1: Cylinder #2 (Thermal Warning) */}
              <line x1="390" y1="103" x2="440" y2="60" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="440" y1="60" x2="550" y2="60" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="390" cy="103" r="3" fill="#f59e0b" />

              {/* Telemetry Leader Line 2: Crankshaft Bearing #2 (Critical Spall) */}
              <line x1="300" y1="128" x2="300" y2="185" stroke={isEng03 ? '#ef4444' : '#00f0ff'} strokeWidth="1" strokeDasharray="2 2" />
              <line x1="300" y1="185" x2="160" y2="185" stroke={isEng03 ? '#ef4444' : '#00f0ff'} strokeWidth="1" />
              <circle cx="300" cy="128" r="3" fill={isEng03 ? '#ef4444' : '#00f0ff'} />

              {/* Telemetry Leader Line 3: Oil Scavenge & Cooler */}
              <line x1="250" y1="145" x2="160" y2="80" stroke="#00dbe9" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="250" cy="145" r="3" fill="#00dbe9" />
            </svg>

            {/* Interactive Overlay Badges aligned with leader lines */}
            {/* Top-Right Badge: Cylinder #2 */}
            <div
              onClick={() => openModal('sensorStream', { engineId: selectedEngine.id, component: 'Cylinder #2' })}
              className={`absolute top-6 right-4 p-2 rounded bg-[#161b29]/90 border ${
                isEng02 ? 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'border-[#3b494b]/60'
              } font-telemetry text-[9px] cursor-pointer hover:border-[#00f0ff] transition-all flex flex-col`}
            >
              <div className="flex items-center gap-1 font-bold text-amber-300">
                <Flame className="w-3 h-3" />
                <span>CYLINDER #2 ASSEMBLY</span>
              </div>
              <span className="text-[#dee2f5]">CHT: {selectedEngine.telemetry.cht}°C {isEng02 && '(+14% THERMAL DECAY)'}</span>
              <span className="text-[#849495]">Baffle Seal Clearance: Degrading</span>
            </div>

            {/* Bottom-Left Badge: Crankshaft Bearing #2 */}
            <div
              onClick={() => openModal('workOrder', { woId: '8924', engine: selectedEngine })}
              className={`absolute bottom-6 left-4 p-2 rounded bg-[#161b29]/90 border ${
                isEng03 ? 'border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-[#3b494b]/60'
              } font-telemetry text-[9px] cursor-pointer hover:border-[#00f0ff] transition-all flex flex-col`}
            >
              <div className="flex items-center gap-1 font-bold text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>CRANKSHAFT BEARING #2</span>
              </div>
              <span className="text-[#dee2f5]">Harmonic Vib: {selectedEngine.telemetry.vibration} mm/s</span>
              <span className="text-red-400">{isEng03 ? 'Micro-Spalling Active // Overhaul Required' : 'Nominal Tolerances'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Footer with Status & Sensor Hotspot Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#b9cacb] font-body pt-1 border-t border-[#3b494b]/20">
        <div className="flex items-center gap-2">
          <span className="font-telemetry text-[10px] text-[#00f0ff] uppercase font-bold">
            DIGITAL TWIN NODES:
          </span>
          <span className="font-telemetry text-[9px] text-[#dee2f5]">
            4 CYLINDERS • CRANKSHAFT JOURNAL • DUAL MAGNETOS • OIL MANIFOLD
          </span>
        </div>
        <div className="font-telemetry text-[10px] text-[#849495]">
          CLICK ANY COMPONENT NODE TO VIEW SENSORS
        </div>
      </div>
    </div>
  );
};

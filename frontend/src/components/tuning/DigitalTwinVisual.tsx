import React, { useState } from 'react';
import { Layers, Video, Image, Sliders, ExternalLink, RefreshCw } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const DigitalTwinVisual: React.FC = () => {
  const { 
    telemetry, 
    twinVisualMode, 
    setTwinVisualMode, 
    customAssetUrl, 
    setIsCustomAssetModalOpen 
  } = useDashboard();

  const [activeCylinder, setActiveCylinder] = useState<number | null>(null);

  // Per-cylinder telemetry from real-time stream
  const [cyl1, cyl2, cyl3, cyl4] = telemetry.cylinderCht;
  const [p1, p2, p3, p4] = telemetry.cylinderPressure;

  return (
    <div 
      id="digital-twin-hud-module"
      className="relative overflow-hidden rounded-lg bg-[#090e1b]/90 border border-[#3b494b]/30 p-3 mt-1.5 shadow-md select-none"
    >
      {/* Top HUD Status Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#00dbe9] uppercase tracking-wider font-semibold">
            HOLOGRAPHIC THERMAL GRADIENT // CYL 01 - 04 NODE CUTAWAY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#849495] hidden sm:inline">
            TWIN RESOLUTION: 0.25MM FEM
          </span>

          {/* Quick Asset Config Trigger */}
          <button
            type="button"
            onClick={() => setIsCustomAssetModalOpen(true)}
            className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff] hover:text-[#7df4ff] bg-[#161b29] px-2 py-0.5 rounded border border-[#00f0ff]/30 transition-colors"
            title="Replace placeholder with your custom UAV video or 3D engine asset"
          >
            <Video className="w-2.5 h-2.5" />
            <span>CUSTOM ASSET</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Cutaway Container */}
      <div 
        id="twin-canvas-viewport"
        className="relative w-full h-40 rounded bg-[#161b29] flex items-center justify-center overflow-hidden border border-[#3b494b]/20"
      >
        {/* Background Asset: Video or High-Tech Engine HUD Image */}
        {customAssetUrl ? (
          customAssetUrl.endsWith('.mp4') || customAssetUrl.endsWith('.webm') ? (
            <video 
              src={customAssetUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <img 
              src={customAssetUrl} 
              alt="Custom UAV Engine Digital Twin Asset" 
              className="w-full h-full object-cover opacity-75"
            />
          )
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Aerospace Engine Cutaway Render */}
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3YrC5UNwIoxFlEwDEUncXmGiDE8oyeJvsHP2SD6seubfiPSIPT6BEABbqm5fyrpBvOBAeorQhPVhZ-DntODebZud-gpofz3hR0kOXiIbUh9Ph0cWS800H9tueEbkqtlhVbw7dfuzjbtmI55w_2tfZw9_pa_zyuRT75Wn-U-czOHai_n8OlU0I_x9nfQVNBdU5TkmVlWwwWQToLxdIZc0IP5QNw_tr-Hd90ar6T_byOhz1TGkoz-qG"
              alt="Dark aerospace HUD wireframe showing an exploded engineering digital twin view of a UAV aero-piston engine" 
              className="w-full h-full object-cover opacity-60 filter brightness-95 contrast-125"
            />

            {/* Tactical animated scanline sweep */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f0ff]/5 to-transparent h-12 w-full animate-pulse pointer-events-none" />
          </div>
        )}

        {/* Tactical HUD Reticles (Corner Brackets) */}
        <div className="absolute inset-0 p-2.5 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-3 h-3 border-t-2 border-l-2 border-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
            <div className="w-3 h-3 border-t-2 border-r-2 border-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
          </div>

          {/* Dynamic Live Telemetry Node Badges pinned across engine cutaway */}
          <div className="flex flex-wrap justify-between items-center px-2 sm:px-4 gap-2 pointer-events-auto">
            {/* Cylinder #1 */}
            <div 
              id="hud-node-cyl1"
              onMouseEnter={() => setActiveCylinder(1)}
              onMouseLeave={() => setActiveCylinder(null)}
              className="bg-[#090e1b]/90 px-2 py-1 rounded border-l-2 border-[#00f0ff] shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="font-mono text-[9px] text-[#00f0ff] block font-bold">
                CYL #1: {cyl1}°C
              </span>
              <span className="font-mono text-[8px] text-[#849495]">
                KNOCK: {telemetry.knockIndex.toFixed(2)}%
              </span>
            </div>

            {/* Cylinder #2 (Peak pressure & temperature node) */}
            <div 
              id="hud-node-cyl2"
              onMouseEnter={() => setActiveCylinder(2)}
              onMouseLeave={() => setActiveCylinder(null)}
              className="bg-[#090e1b]/95 px-2.5 py-1 rounded border-l-2 border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)] backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform ring-1 ring-[#00f0ff]/30"
            >
              <span className="font-mono text-[9px] text-[#00f0ff] block font-bold">
                CYL #2: {cyl2}°C
              </span>
              <span className="font-mono text-[8px] text-[#7df4ff] font-semibold">
                PEAK PRESSURE: {p2} BAR
              </span>
            </div>

            {/* Cylinder #3 */}
            <div 
              id="hud-node-cyl3"
              onMouseEnter={() => setActiveCylinder(3)}
              onMouseLeave={() => setActiveCylinder(null)}
              className="bg-[#090e1b]/90 px-2 py-1 rounded border-l-2 border-[#00f0ff] shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="font-mono text-[9px] text-[#00f0ff] block font-bold">
                CYL #3: {cyl3}°C
              </span>
              <span className="font-mono text-[8px] text-[#849495]">
                EGT: {telemetry.egt}°C
              </span>
            </div>

            {/* Cylinder #4 (Oil sink) */}
            <div 
              id="hud-node-cyl4"
              onMouseEnter={() => setActiveCylinder(4)}
              onMouseLeave={() => setActiveCylinder(null)}
              className="hidden md:block bg-[#090e1b]/90 px-2 py-1 rounded border-l-2 border-[#00f0ff] shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="font-mono text-[9px] text-[#00f0ff] block font-bold">
                CYL #4: {cyl4}°C
              </span>
              <span className="font-mono text-[8px] text-[#849495]">
                OIL SINK: {telemetry.oilTemp}°C
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="w-3 h-3 border-b-2 border-l-2 border-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
            <div className="w-3 h-3 border-b-2 border-r-2 border-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
          </div>
        </div>
      </div>
    </div>
  );
};

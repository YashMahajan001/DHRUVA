/**
 * DHRUVAA 3D Digital Twin Fullscreen Cutaway Modal
 */
import React, { useState } from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Eye, X, Layers, Cpu, Flame, ShieldAlert, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const DigitalTwinModal: React.FC = () => {
  const { activeModal, modalData, closeModal, engines } = useMission();
  const [activeLayer, setActiveLayer] = useState<'all' | 'thermal' | 'acoustic' | 'structural'>('all');

  if (activeModal !== 'twinCutaway') return null;

  const engineId = modalData?.engineId || 'eng-03';
  const targetEngine = engines.find((e) => e.id === engineId) || engines[2];
  const isEng03 = targetEngine.id === 'eng-03';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl rounded bg-[#090e1b] border border-[#00f0ff]/50 p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
        <ReticleCorner color="#00f0ff" size={8} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#00f0ff]" />
            <div>
              <span className="font-headline text-lg text-[#dee2f5] uppercase font-bold tracking-wide">
                HOLOGRAPHIC 3D TWIN CUTAWAY // {targetEngine.displayId} ({targetEngine.model})
              </span>
              <span className="text-[10px] text-[#00dbe9] font-telemetry block uppercase">
                TAIL: {targetEngine.airframeId} • ENGINE RUL: {targetEngine.rulHours}h • STATUS: {targetEngine.status}
              </span>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-[#b9cacb] hover:text-[#dee2f5] transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-telemetry text-[9px] text-[#849495] uppercase">
              VISUALIZATION CONTOURS:
            </span>
            <div className="flex rounded bg-[#161b29] border border-[#3b494b]/30 p-0.5">
              {(['all', 'thermal', 'acoustic', 'structural'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-2.5 py-1 rounded font-telemetry text-[10px] uppercase transition-all ${
                    activeLayer === layer
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                      : 'text-[#b9cacb] hover:text-[#dee2f5]'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>

          <div className="font-telemetry text-[10px] text-[#00f0ff]">
            SYNTHETIC TWIN LATENCY: 12ms (REAL-TIME CONVERGENCE)
          </div>
        </div>

        {/* Main 3D Cutaway Graphic Canvas */}
        <div className="relative h-80 w-full rounded bg-[#050811] border border-[#3b494b]/40 flex items-center justify-center tactical-grid overflow-hidden">
          <div className="absolute top-3 left-3 text-[10px] font-telemetry text-[#849495] flex flex-col gap-0.5">
            <span>RPM: {targetEngine.telemetry.rpm}</span>
            <span>OIL PRESSURE: {targetEngine.telemetry.oilPressure} PSI</span>
            <span>VIBRATION: {targetEngine.telemetry.vibration} mm/s</span>
          </div>

          <svg className="w-full h-full max-h-72" viewBox="0 0 700 280" fill="none">
            {/* Grid Radial Lines */}
            <circle cx="350" cy="140" r="120" stroke="#00f0ff" strokeOpacity="0.1" strokeDasharray="4 6" />
            <circle cx="350" cy="140" r="90" stroke="#00f0ff" strokeOpacity="0.06" />

            {/* Engine Block Outline */}
            <rect x="260" y="80" width="180" height="120" rx="4" stroke="#00f0ff" strokeWidth="2" fill="#0c1220" />

            {/* Cylinders (Horizontally Opposed Layout) */}
            {/* Cylinder 1 */}
            <rect x="190" y="90" width="65" height="40" rx="3" stroke="#00dbe9" strokeWidth="1.5" fill="#161b29" />
            <text x="200" y="115" fill="#849495" fontSize="10" fontFamily="JetBrains Mono">CYL #1</text>

            {/* Cylinder 2 */}
            <rect
              x="445"
              y="90"
              width="65"
              height="40"
              rx="3"
              stroke={targetEngine.id === 'eng-02' ? '#f59e0b' : '#00dbe9'}
              strokeWidth={targetEngine.id === 'eng-02' ? '2.5' : '1.5'}
              fill={targetEngine.id === 'eng-02' ? 'rgba(245, 158, 11, 0.25)' : '#161b29'}
            />
            <text x="455" y="115" fill={targetEngine.id === 'eng-02' ? '#f59e0b' : '#849495'} fontSize="10" fontFamily="JetBrains Mono">CYL #2</text>

            {/* Cylinder 3 */}
            <rect x="190" y="150" width="65" height="40" rx="3" stroke="#00dbe9" strokeWidth="1.5" fill="#161b29" />
            <text x="200" y="175" fill="#849495" fontSize="10" fontFamily="JetBrains Mono">CYL #3</text>

            {/* Cylinder 4 */}
            <rect x="445" y="150" width="65" height="40" rx="3" stroke="#00dbe9" strokeWidth="1.5" fill="#161b29" />
            <text x="455" y="175" fill="#849495" fontSize="10" fontFamily="JetBrains Mono">CYL #4</text>

            {/* Crankshaft Central Journal */}
            <line x1="280" y1="140" x2="420" y2="140" stroke="#dee2f5" strokeWidth="4" strokeLinecap="round" />

            {/* Bearing Races */}
            <circle cx="310" cy="140" r="8" stroke="#00f0ff" strokeWidth="2" fill="#161b29" />
            <circle
              cx="350"
              cy="140"
              r={isEng03 ? 12 : 8}
              stroke={isEng03 ? '#ef4444' : '#00f0ff'}
              strokeWidth={isEng03 ? 3 : 2}
              fill={isEng03 ? 'rgba(239, 68, 68, 0.4)' : '#161b29'}
              className={isEng03 ? 'animate-pulse' : ''}
            />
            <circle cx="390" cy="140" r="8" stroke="#00f0ff" strokeWidth="2" fill="#161b29" />

            {/* Callouts */}
            {isEng03 && (
              <g>
                <line x1="350" y1="125" x2="350" y2="45" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="350" y1="45" x2="460" y2="45" stroke="#ef4444" strokeWidth="1.5" />
                <circle cx="350" cy="125" r="4" fill="#ef4444" />
                <text x="470" y="49" fill="#ef4444" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  MICRO-SPALLING BEARING #2 (+19 dB)
                </text>
              </g>
            )}

            {targetEngine.id === 'eng-02' && (
              <g>
                <line x1="477" y1="90" x2="477" y2="35" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="477" y1="35" x2="560" y2="35" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="477" cy="90" r="4" fill="#f59e0b" />
                <text x="570" y="39" fill="#f59e0b" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  THERMAL DECAY (+14% CHT)
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Diagnostics & Tolerances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-telemetry text-xs">
          <div className="p-3 bg-[#161b29]/80 rounded border border-[#3b494b]/30">
            <span className="text-[#849495] text-[9px] uppercase">Geometric Clearance</span>
            <div className="text-[#dee2f5] font-bold mt-1">
              {isEng03 ? '0.082 mm (EXCEEDS 0.050 mm MAX)' : '0.038 mm (NOMINAL)'}
            </div>
            <span className={isEng03 ? 'text-red-400 text-[10px]' : 'text-emerald-400 text-[10px]'}>
              {isEng03 ? 'Journal play exceeds airworthiness limit' : 'Factory tolerance maintained'}
            </span>
          </div>

          <div className="p-3 bg-[#161b29]/80 rounded border border-[#3b494b]/30">
            <span className="text-[#849495] text-[9px] uppercase">Oil Film Hydrodynamic Pressure</span>
            <div className="text-[#dee2f5] font-bold mt-1">
              {isEng03 ? '2.1 MPa (BOUNDARY FRICTION)' : '4.8 MPa (HYDRODYNAMIC)'}
            </div>
            <span className={isEng03 ? 'text-red-400 text-[10px]' : 'text-emerald-400 text-[10px]'}>
              {isEng03 ? 'Film breakdown detected by acoustic probe' : 'Full lubrication cushion intact'}
            </span>
          </div>

          <div className="p-3 bg-[#161b29]/80 rounded border border-[#3b494b]/30">
            <span className="text-[#849495] text-[9px] uppercase">Remaining Useful Life (RUL)</span>
            <div className={`font-bold mt-1 text-sm ${isEng03 ? 'text-red-400' : 'text-emerald-400'}`}>
              {targetEngine.rulHours} FLIGHT HOURS
            </div>
            <span className="text-[#b9cacb] text-[10px]">
              Mean time to unscheduled removal: {isEng03 ? 'IMMEDIATE' : '480h Fleet benchmark'}
            </span>
          </div>
        </div>

        {/* Close */}
        <div className="flex items-center justify-end pt-2 border-t border-[#3b494b]/30">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-tactical text-xs uppercase font-bold tracking-wider transition-all cursor-pointer"
          >
            RETURN TO MISSION DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};

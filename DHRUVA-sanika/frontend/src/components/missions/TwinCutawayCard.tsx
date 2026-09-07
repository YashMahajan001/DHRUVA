/**
 * DHRUVAA — Synthetic Inference Engine Digital Twin Visual (Center Column)
 */

import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Eye, RefreshCw, Cpu, Layers } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const TwinCutawayCard: React.FC = () => {
  const { twinState, selectedEngine, setIsCopilotOpen } = useDashboard();
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomMediaUrl(url);
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
  };

  const handleResetAsset = () => {
    setCustomMediaUrl(null);
  };

  return (
    <div className="bg-[#161b29]/90 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Cutaway Asset Viewport with Custom Asset Replacement Hook */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        {/* Visual Box (Ready for custom asset/video) */}
        <div 
          className="relative w-20 h-20 rounded bg-[#252a38] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#00f0ff]/30 group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Click to replace digital twin with custom CAD, MP4 video, or image"
        >
          {customMediaUrl ? (
            mediaType === 'video' ? (
              <video 
                src={customMediaUrl} 
                autoPlay 
                loop 
                muted 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={customMediaUrl} 
                alt="Custom UAV Engine Asset" 
                className="w-full h-full object-cover" 
              />
            )
          ) : (
            <>
              {/* Default Synthetic Wireframe Engine Cutaway Asset */}
              <img 
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" 
                alt="Digital Twin Engine Assembly" 
                className="w-full h-full object-cover mix-blend-luminosity opacity-85" 
              />
              <div className="absolute inset-0 bg-[#00f0ff]/15" />
              {/* Holographic Glowing Crosshair Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full border border-[#00f0ff]/60 border-dashed animate-spin" style={{ animationDuration: '14s' }} />
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
              </div>
            </>
          )}

          {/* Hover Overlay with Upload Cue */}
          <div className="absolute inset-0 bg-[#090e1b]/85 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 text-center">
            <Upload className="w-4 h-4 text-[#00f0ff] mb-0.5" />
            <span className="font-mono-telemetry text-[8px] text-[#dee2f5] font-semibold">
              REPLACE ASSET
            </span>
          </div>

          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*,video/*" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>

        {/* Narrative & Inference Description */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-bold uppercase tracking-wider">
              SYNTHETIC INFERENCE ENGINE ONLINE
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />
          </div>
          <p className="font-sans text-xs text-[#b9cacb] mt-0.5 max-w-xl leading-relaxed">
            Continuously computing virtual thermodynamic cycles and boundary layer friction against real-time simulated telemetry for {selectedEngine.model}.
          </p>
          <div className="flex items-center gap-3 mt-1.5 font-mono-telemetry text-[9px] text-[#849495]">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#00f0ff]" />
              TWIN SYNC: <span className="text-[#dee2f5] font-bold">{twinState.twinConvergencePercent}%</span>
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#b4c5ff]" />
              THERMO EFF: <span className="text-[#dee2f5] font-bold">{twinState.thermodynamicEfficiency}%</span>
            </span>
            {customMediaUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleResetAsset(); }}
                className="text-[#ef4444] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> RESET ASSET
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Latency Metric & Copilot Trigger */}
      <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            INFERENCE LATENCY
          </span>
          <span className="font-mono-telemetry text-base text-[#00f0ff] font-bold">
            {twinState.inferenceLatencyMs} MS
          </span>
        </div>

        <button
          onClick={() => setIsCopilotOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#252a38] hover:bg-[#303443] border border-[#00f0ff]/40 text-[#00f0ff] font-mono-telemetry text-xs font-semibold transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
          title="Inquire with AI Copilot regarding current digital twin state"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>CONSULT AI</span>
        </button>
      </div>
    </div>
  );
};

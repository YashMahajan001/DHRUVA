import React, { useState } from 'react';
import { X, Video, Image, Check, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const CustomAssetModal: React.FC = () => {
  const { 
    isCustomAssetModalOpen, 
    setIsCustomAssetModalOpen, 
    customAssetUrl, 
    setCustomAssetUrl,
    showToast 
  } = useDashboard();

  const [inputUrl, setInputUrl] = useState(customAssetUrl || '');

  if (!isCustomAssetModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomAssetUrl(inputUrl.trim() || null);
    setIsCustomAssetModalOpen(false);
    showToast('Digital Twin Asset Updated', inputUrl.trim() ? 'Custom UAV / Engine asset mounted to HUD viewport.' : 'Restored baseline holographic thermal FEM cutaway.');
  };

  const handleReset = () => {
    setInputUrl('');
    setCustomAssetUrl(null);
    setIsCustomAssetModalOpen(false);
    showToast('Reset Asset', 'Restored baseline holographic thermal FEM cutaway.');
  };

  return (
    <div 
      id="custom-asset-modal-overlay"
      className="fixed inset-0 z-50 bg-[#090e1b]/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div 
        id="custom-asset-modal-content"
        className="w-full max-w-lg bg-[#161b29] border border-[#00f0ff]/40 rounded-xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#00f0ff]" />
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5] uppercase tracking-wider">
              REPLACE UAV / DIGITAL TWIN ASSET
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomAssetModalOpen(false)}
            className="p-1 rounded hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#b9cacb] leading-relaxed">
          Provide a URL to your own UAV flight footage (.mp4, .webm), engine test cell video, or 3D schematic render to replace the placeholder cutaway. The live telemetry HUD overlay reticles will automatically track over your asset.
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="font-mono text-[10px] text-[#849495] uppercase block mb-1">
              Asset Media URL (MP4 / WebM / Image / Stream)
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. https://example.com/uav-engine-test.mp4 or /assets/uav-render.png"
              className="w-full bg-[#090e1b] text-[#dee2f5] font-mono text-xs px-3 py-2 rounded border border-[#3b494b]/40 focus:outline-none focus:border-[#00f0ff] placeholder-[#849495]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded font-mono text-[10px] uppercase text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#252a38] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              RESTORE STOCK FEM
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCustomAssetModalOpen(false)}
                className="px-3 py-1.5 rounded font-mono text-xs uppercase text-[#b9cacb] hover:bg-[#252a38]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-mono text-xs font-bold uppercase rounded shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
              >
                MOUNT ASSET
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

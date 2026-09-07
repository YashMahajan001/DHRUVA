import React, { useState } from 'react';
import { Check, Image, Upload, Video, X } from 'lucide-react';

interface AssetReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssetUrl: string;
  onSaveAssetUrl: (url: string) => void;
}

export const AssetReplaceModal: React.FC<AssetReplaceModalProps> = ({
  isOpen,
  onClose,
  currentAssetUrl,
  onSaveAssetUrl,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentAssetUrl || '');
  const [dragActive, setDragActive] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUrlInput(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUrlInput(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveAssetUrl(urlInput.trim());
    onClose();
  };

  const handleResetDefault = () => {
    setUrlInput('');
    onSaveAssetUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b29] border border-[#00f0ff]/40 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#3b494b]/30">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#00f0ff]" />
            <span className="font-display font-bold text-base text-[#dee2f5]">
              UAV / ENGINE VISUAL ASSET CONFIGURATION
            </span>
          </div>
          <button onClick={onClose} className="text-[#849495] hover:text-[#dee2f5]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#b9cacb] leading-relaxed">
          Configure the primary HUD visual area with your custom UAV thermal video stream, engine
          CAD animation, or optical camera backdrop.
        </p>

        {/* Drag & Drop File Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center transition-colors ${
            dragActive
              ? 'border-[#00f0ff] bg-[#00f0ff]/10'
              : 'border-[#3b494b]/40 bg-[#090e1b]/50 hover:border-[#00f0ff]/30'
          }`}
        >
          <Upload className="w-7 h-7 text-[#00f0ff] mb-2" />
          <p className="font-mono text-xs text-[#dee2f5] font-semibold mb-1">
            Drag &amp; Drop custom UAV video or image file here
          </p>
          <p className="text-[10px] text-[#849495] mb-3">
            Supports MP4, WebM, PNG, JPG, or SVG
          </p>
          <label className="px-3 py-1.5 bg-[#252a38] hover:bg-[#343948] text-[#00f0ff] border border-[#00f0ff]/40 rounded font-mono text-xs font-semibold cursor-pointer transition-colors">
            Browse Local File
            <input
              type="file"
              accept="video/mp4,video/webm,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Or enter Direct Stream / Video URL */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-[#849495] uppercase font-bold">
            Or Direct Video / RTSP / Image Stream URL:
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/assets/uav_feed.mp4 or image URL"
            className="w-full bg-[#090e1b] border border-[#3b494b]/40 px-3 py-2 rounded text-xs font-mono text-[#dee2f5] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        {urlInput && (
          <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/30 flex items-center justify-between text-xs font-mono text-[#10b981]">
            <span>Asset staged for HUD overlay</span>
            <Check className="w-4 h-4" />
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-[#3b494b]/30">
          <button
            onClick={handleResetDefault}
            className="text-xs font-mono text-[#849495] hover:text-[#dee2f5] transition-colors"
          >
            Reset to Default Stitch Backdrop
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded font-mono text-xs text-[#849495] hover:text-[#dee2f5]"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-[#00f0ff] text-[#00363a] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
            >
              APPLY ASSET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

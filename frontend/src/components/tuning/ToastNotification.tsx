import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const ToastNotification: React.FC = () => {
  const { toast, clearToast } = useDashboard();

  if (!toast) return null;

  return (
    <div 
      id="statusToast"
      className="fixed bottom-6 right-6 z-50 bg-[#252a38] text-[#dee2f5] p-4 rounded-xl shadow-2xl max-w-md border border-[#00f0ff]/30 backdrop-blur-md select-none animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-start gap-3">
        {toast.isError ? (
          <AlertTriangle className="w-6 h-6 text-[#ffb4ab] shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-6 h-6 text-[#00f0ff] shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
        )}
        <div className="space-y-1 flex-1">
          <h4 className={`font-['Space_Grotesk'] text-base font-bold ${toast.isError ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`}>
            {toast.title}
          </h4>
          <p className="text-xs text-[#b9cacb] leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={clearToast}
          className="text-[#849495] hover:text-[#dee2f5] p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

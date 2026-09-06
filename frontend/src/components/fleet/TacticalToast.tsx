import React, { useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const TacticalToast: React.FC = () => {
  const { tacticalNotification, clearNotification } = useTelemetry();

  useEffect(() => {
    if (tacticalNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tacticalNotification, clearNotification]);

  if (!tacticalNotification) return null;

  const isCrit = tacticalNotification.type === 'critical';
  const isWarn = tacticalNotification.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`p-4 rounded-lg shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${
          isCrit
            ? 'bg-[#090e1b]/95 border-[#ef4444] text-[#ffdad6] shadow-[0_0_20px_rgba(239,68,68,0.35)]'
            : isWarn
            ? 'bg-[#090e1b]/95 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
            : 'bg-[#090e1b]/95 border-[#00f0ff] text-[#dbfcff] shadow-[0_0_20px_rgba(0,240,255,0.35)]'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isCrit ? (
            <AlertOctagon className="w-5 h-5 text-[#ef4444] animate-bounce" />
          ) : isWarn ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#00f0ff]" />
          )}
        </div>

        <div className="flex flex-col gap-0.5 flex-1">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#849495]">
            <span>TACTICAL BUS NOTIFICATION</span>
            <span>{tacticalNotification.timestamp}</span>
          </div>
          <p className="font-mono text-[12px] leading-snug font-bold">
            {tacticalNotification.message}
          </p>
        </div>

        <button
          type="button"
          onClick={clearNotification}
          className="text-[#849495] hover:text-[#dee2f5] p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

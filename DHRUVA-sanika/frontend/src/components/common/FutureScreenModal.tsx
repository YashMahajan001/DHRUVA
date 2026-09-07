/**
 * DHRUVAA Future Screen Placeholder Modal
 * Acknowledges user requests for screens outside the exported single-screen scope.
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Layers, X, Shield, ArrowRight } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const FutureScreenModal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useMission();

  if (activeModal !== 'futureScreen') return null;

  const screenName = modalData?.screenName || 'Subsystem Module';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded bg-[#090e1b] border border-[#00f0ff]/50 p-6 shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col gap-4 relative">
        <ReticleCorner color="#00f0ff" size={7} />

        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00f0ff]" />
            <span className="font-headline text-base text-[#dee2f5] uppercase font-bold tracking-wide">
              TACTICAL SUBSYSTEM // {screenName}
            </span>
          </div>
          <button
            onClick={closeModal}
            className="text-[#b9cacb] hover:text-[#dee2f5] transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded bg-[#161b29]/80 border border-[#3b494b]/30 flex flex-col gap-2 font-body text-xs text-[#b9cacb] leading-relaxed">
          <div className="flex items-center gap-2 text-[#00f0ff] font-tactical text-[11px] uppercase font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>EXPORT DIRECTIVE ACTIVE</span>
          </div>
          <p>
            As directed by mission flight controllers, only the primary <strong className="text-[#dee2f5]">MISSION DASHBOARD</strong> is exported and active in this deployment cycle.
          </p>
          <p className="text-[11px] text-[#849495]">
            Subsystem modules for <strong className="text-[#00dbe9]">{screenName}</strong> are architectural targets for subsequent operational phases.
          </p>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[#3b494b]/30">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-tactical text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1"
          >
            <span>RETURN TO MISSION COMMAND</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

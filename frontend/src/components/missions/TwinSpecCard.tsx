/**
 * DHRUVAA — SYS.TWIN.SPEC Card (Left Column)
 */

import React from 'react';
import { Cpu, ChevronRight } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const TwinSpecCard: React.FC = () => {
  const { selectedEngine, setIsEngineModalOpen } = useDashboard();

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            SYS.TWIN.SPEC
          </span>
        </div>
        <button
          onClick={() => setIsEngineModalOpen(true)}
          className="font-mono-telemetry text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] uppercase font-bold hover:bg-[#00f0ff]/30 transition-colors flex items-center gap-1 cursor-pointer"
          title="Switch Engine Twin Model"
        >
          <span>{selectedEngine.model}</span>
          <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Spec Sub-Grid */}
      <div className="grid grid-cols-2 gap-2 mt-0.5">
        <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Architecture
          </span>
          <span className="font-mono-telemetry text-xs text-[#dee2f5] font-semibold">
            {selectedEngine.architecture}
          </span>
        </div>
        <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Baseline HP
          </span>
          <span className="font-mono-telemetry text-xs text-[#dee2f5] font-semibold">
            {selectedEngine.baselineHp} HP @ {selectedEngine.ratedRpm} RPM
          </span>
        </div>
      </div>
    </div>
  );
};

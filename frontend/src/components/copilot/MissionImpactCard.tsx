import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MissionImpactData } from '../../types';

interface MissionImpactCardProps {
  data: MissionImpactData;
}

export const MissionImpactCard: React.FC<MissionImpactCardProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isNotRec = data.readiness.includes('NOT RECOMMENDED') || data.readiness.includes('RESTRICTED');
  const isCond = data.readiness.includes('CONDITIONAL') || data.readiness.includes('REVIEW');

  let bannerStyle = 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30';
  if (isNotRec) bannerStyle = 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40';
  else if (isCond) bannerStyle = 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40';

  const getStatusColor = (st: string) => {
    if (st === 'CRITICAL' || st === 'ELEVATED') return 'text-[#fca5a5] bg-[#ef4444]/15 border-[#ef4444]/30';
    if (st === 'MARGINAL') return 'text-[#fcd34d] bg-[#f59e0b]/15 border-[#f59e0b]/30';
    return 'text-[#6ee7b7] bg-[#10b981]/15 border-[#10b981]/30';
  };

  return (
    <div className="bg-[#111726]/95 border border-[#3b494b]/40 rounded-lg p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#00f0ff] uppercase font-bold tracking-wider flex items-center gap-1">
          <Compass className="w-3 h-3" /> MISSION IMPACT
        </span>
        <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${bannerStyle}`}>
          {data.readiness}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 font-mono text-[9px]">
        <div className="p-1 rounded border border-[#3b494b]/30 bg-[#090e1b] flex flex-col items-center">
          <span className="text-[#849495] text-[8px]">THERMAL</span>
          <span className={`px-1 rounded text-[8px] font-bold mt-0.5 border ${getStatusColor(data.thermalStress)}`}>
            {data.thermalStress}
          </span>
        </div>

        <div className="p-1 rounded border border-[#3b494b]/30 bg-[#090e1b] flex flex-col items-center">
          <span className="text-[#849495] text-[8px]">VIBRATION</span>
          <span className={`px-1 rounded text-[8px] font-bold mt-0.5 border ${getStatusColor(data.vibrationStress)}`}>
            {data.vibrationStress}
          </span>
        </div>

        <div className="p-1 rounded border border-[#3b494b]/30 bg-[#090e1b] flex flex-col items-center">
          <span className="text-[#849495] text-[8px]">RUL BUFFER</span>
          <span className={`px-1 rounded text-[8px] font-bold mt-0.5 border ${getStatusColor(data.rulStatus)}`}>
            {data.rulStatus}
          </span>
        </div>
      </div>

      {data.factors && data.factors.length > 0 && (
        <div className="pt-0.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[8.5px] font-mono text-[#00dbe9] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            <span>{isExpanded ? 'Hide Mission Factors' : 'View Mission Factors'}</span>
          </button>

          {isExpanded && (
            <div className="mt-1.5 pt-1 border-t border-[#3b494b]/30 flex flex-col gap-1 text-[9px] font-mono text-[#b9cacb] bg-[#090e1b]/80 p-2 rounded">
              {data.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-[#00f0ff]">▪</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

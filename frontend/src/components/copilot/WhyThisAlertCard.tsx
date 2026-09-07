import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, ShieldAlert } from 'lucide-react';
import { WhyThisAlertExplanation } from '../../types';

interface WhyThisAlertCardProps {
  data: WhyThisAlertExplanation;
  defaultExpanded?: boolean;
}

export const WhyThisAlertCard: React.FC<WhyThisAlertCardProps> = ({
  data,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  if (!data || !data.factors || data.factors.length === 0) return null;

  return (
    <div className="border border-[#3b494b]/40 rounded-lg bg-[#111726]/90 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[9px] font-mono text-[#00f0ff] hover:bg-[#1a2130] transition-colors cursor-pointer"
      >
        <span className="font-bold flex items-center gap-1.5">
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>WHY THIS ALERT?</span>
        </span>
        <span className="text-[8px] text-[#849495]">
          {isExpanded ? 'COLLAPSE' : `${data.factors.length} OBSERVABLE FACTORS ▾`}
        </span>
      </button>

      {isExpanded && (
        <div className="px-2.5 pb-2 pt-1 border-t border-[#3b494b]/30 flex flex-col gap-1.5 text-[9.5px]">
          {data.factors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[#b9cacb]">
              <span className="text-[#00f0ff] font-mono font-bold">{idx + 1}.</span>
              <span className="leading-tight">{factor}</span>
            </div>
          ))}
          <div className="mt-1 pt-1.5 border-t border-[#3b494b]/25 font-mono text-[9px] text-[#00dbe9] flex items-start gap-1">
            <span className="font-bold text-[#849495] shrink-0">Combined Assessment:</span>
            <span>{data.conclusion}</span>
          </div>
        </div>
      )}
    </div>
  );
};

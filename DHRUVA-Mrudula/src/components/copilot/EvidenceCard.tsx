import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { TelemetryEvidenceMetric } from '../../types';

interface EvidenceCardProps {
  metrics: TelemetryEvidenceMetric[];
  rawEvidence?: string[];
  baselineStandard?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  metrics,
  rawEvidence = [],
  baselineStandard = 'DHRUVA PROTOTYPE BASELINE',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-[#111726]/95 border border-[#3b494b]/40 rounded-lg p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[9px] font-mono">
        <span className="text-[#00f0ff] uppercase font-bold tracking-wider flex items-center gap-1">
          <Activity className="w-3 h-3" /> TELEMETRY EVIDENCE
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#849495] hover:text-[#00f0ff] text-[8.5px] font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Evidence'}</span>
          {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-2 gap-1 font-mono text-[9.5px]">
        {metrics.map((m, idx) => {
          let badgeStyle = 'text-[#7df4ff] bg-[#090e1b] border-[#3b494b]/40';
          let isUp = m.delta?.startsWith('+');
          let isDown = m.delta?.startsWith('-');

          if (m.status === 'warning') {
            badgeStyle = 'text-[#fcd34d] bg-[#f59e0b]/10 border-[#f59e0b]/30';
          } else if (m.status === 'critical') {
            badgeStyle = 'text-[#fca5a5] bg-[#ef4444]/10 border-[#ef4444]/30';
          }

          return (
            <div
              key={idx}
              className={`p-1.5 rounded border flex items-center justify-between ${badgeStyle}`}
            >
              <span className="font-semibold text-[#849495]">{m.label}</span>
              <div className="flex items-center gap-1 font-bold">
                <span>{m.value}</span>
                {m.delta && (
                  <span className="text-[8px] flex items-center opacity-90">
                    {isUp && <ArrowUpRight className="w-2.5 h-2.5" />}
                    {isDown && <ArrowDownRight className="w-2.5 h-2.5" />}
                    {m.delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="mt-1 pt-1.5 border-t border-[#3b494b]/30 flex flex-col gap-1 text-[9px] font-mono text-[#b9cacb] bg-[#090e1b]/80 p-2 rounded">
          <span className="text-[#849495] font-bold text-[8px] uppercase tracking-wider">
            Correlated Sensor Baselines ({baselineStandard})
          </span>
          {rawEvidence.map((ev, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[#00f0ff]">▪</span>
              <span>{ev}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

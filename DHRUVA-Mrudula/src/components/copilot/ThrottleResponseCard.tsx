import React from 'react';
import { Zap, Gauge, ArrowUpRight } from 'lucide-react';
import { ThrottleResponseData } from '../../types';

interface ThrottleResponseCardProps {
  data: ThrottleResponseData;
}

export const ThrottleResponseCard: React.FC<ThrottleResponseCardProps> = ({ data }) => {
  const isDeviating = data.latencyDeviationPct > 25 || data.assessment.includes('SLUGGISH') || data.assessment.includes('DEGRADED');

  const commandFill = Math.min(100, Math.max(0, data.commandPct || 100));
  const actualFill = Math.min(100, Math.max(0, data.actualPct || 72));

  return (
    <div className="bg-[#111726]/95 border border-[#3b494b]/40 rounded-lg p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#00f0ff] uppercase font-bold tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3" /> THROTTLE TRANSIENT RESPONSE
        </span>
        <span
          className={`font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
            isDeviating
              ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40'
              : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
          }`}
        >
          {isDeviating ? 'DEVIATING' : 'NORMAL'}
        </span>
      </div>

      {/* Visual Power Bars */}
      <div className="flex flex-col gap-1.5 bg-[#090e1b] p-2 rounded border border-[#3b494b]/30 font-mono text-[9px]">
        {/* Command Bar */}
        <div>
          <div className="flex justify-between text-[#849495] text-[8px] mb-0.5">
            <span>COMMANDED POWER STEP</span>
            <span className="text-[#dee2f5] font-bold">{commandFill}%</span>
          </div>
          <div className="w-full bg-[#161b29] h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-[#00f0ff] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
              style={{ width: `${commandFill}%` }}
            />
          </div>
        </div>

        {/* Actual Response Bar */}
        <div>
          <div className="flex justify-between text-[#849495] text-[8px] mb-0.5">
            <span>ACTUAL GOVERNOR TRACKING</span>
            <span className={`font-bold ${isDeviating ? 'text-[#f59e0b]' : 'text-[#10b981]'}`}>
              {actualFill}%
            </span>
          </div>
          <div className="w-full bg-[#161b29] h-2 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDeviating ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
              }`}
              style={{ width: `${actualFill}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric Breakdown */}
      <div className="grid grid-cols-3 gap-1 font-mono text-[9px] text-center">
        <div className="p-1 rounded bg-[#090e1b] border border-[#3b494b]/30">
          <span className="text-[#849495] block text-[7.5px]">LATENCY</span>
          <span className="font-bold text-[#dee2f5]">{data.stepLatencyMs} ms</span>
          <span className="text-[7.5px] text-[#f59e0b] block">+{data.latencyDeviationPct}%</span>
        </div>

        <div className="p-1 rounded bg-[#090e1b] border border-[#3b494b]/30">
          <span className="text-[#849495] block text-[7.5px]">SLEW RATE</span>
          <span className="font-bold text-[#dee2f5]">{data.powerSlewRatePctSec}%/s</span>
          <span className="text-[7.5px] text-[#849495] block">Nom: 85%/s</span>
        </div>

        <div className="p-1 rounded bg-[#090e1b] border border-[#3b494b]/30">
          <span className="text-[#849495] block text-[7.5px]">BANDWIDTH</span>
          <span className="font-bold text-[#00dbe9]">{data.responseBandwidthHz} Hz</span>
          <span className="text-[7.5px] text-[#849495] block">Response cut</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[8px] font-mono text-[#849495] pt-0.5 border-t border-[#3b494b]/20">
        <span>{data.assessment}</span>
        <span className="text-[#00f0ff] font-semibold">DERIVED / DEMO ANALYTIC</span>
      </div>
    </div>
  );
};

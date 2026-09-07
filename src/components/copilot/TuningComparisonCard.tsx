import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronRight, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { TuningComparisonData } from '../../types';

interface TuningComparisonCardProps {
  data: TuningComparisonData;
}

export const TuningComparisonCard: React.FC<TuningComparisonCardProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const renderTrend = (trend: 'up' | 'down', isPositiveForGoal: boolean) => {
    const isUp = trend === 'up';
    let color = isPositiveForGoal ? 'text-[#10b981]' : 'text-[#f59e0b]';
    return (
      <span className={`inline-flex items-center gap-0.5 font-bold ${color}`}>
        {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      </span>
    );
  };

  return (
    <div className="bg-[#111726]/95 border border-[#3b494b]/40 rounded-lg p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#00f0ff] uppercase font-bold tracking-wider flex items-center gap-1">
          <Sliders className="w-3 h-3" /> FADEC TUNING COMPARISON
        </span>
        <span className="font-mono text-[8px] text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.2 rounded border border-[#10b981]/30 font-bold">
          RECOMMENDED: {data.recommended}
        </span>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-[#090e1b] rounded border border-[#3b494b]/30 p-2 font-mono text-[9px]">
        <div className="grid grid-cols-3 pb-1 border-b border-[#3b494b]/30 text-[#849495] text-[8px] font-bold">
          <span>PARAMETER</span>
          <span className="text-center text-[#00f0ff]">PROFILE A (LEAN)</span>
          <span className="text-center text-[#f59e0b]">PROFILE B (AGILE)</span>
        </div>

        <div className="grid grid-cols-3 py-1 border-b border-[#3b494b]/20 items-center">
          <span className="text-[#b9cacb]">Fuel efficiency</span>
          <span className="text-center">{renderTrend(data.profileA.fuelTrend, true)}</span>
          <span className="text-center">{renderTrend(data.profileB.fuelTrend, false)}</span>
        </div>

        <div className="grid grid-cols-3 py-1 border-b border-[#3b494b]/20 items-center">
          <span className="text-[#b9cacb]">Thermal load (CHT)</span>
          <span className="text-center">{renderTrend(data.profileA.chtTrend, true)}</span>
          <span className="text-center">{renderTrend(data.profileB.chtTrend, false)}</span>
        </div>

        <div className="grid grid-cols-3 py-1 border-b border-[#3b494b]/20 items-center">
          <span className="text-[#b9cacb]">Vibration margin</span>
          <span className="text-center">{renderTrend(data.profileA.vibTrend, true)}</span>
          <span className="text-center">{renderTrend(data.profileB.vibTrend, false)}</span>
        </div>

        <div className="grid grid-cols-3 pt-1 items-center">
          <span className="text-[#b9cacb]">Throttle response</span>
          <span className="text-center">{renderTrend(data.profileA.throttleTrend, false)}</span>
          <span className="text-center">{renderTrend(data.profileB.throttleTrend, true)}</span>
        </div>
      </div>

      {/* Rationale Callout */}
      <div className="text-[9px] font-mono text-[#b9cacb] bg-[#1a2130]/90 p-1.5 rounded border-l-2 border-[#10b981]">
        <span className="text-[#10b981] font-bold block text-[8px] uppercase">Recommendation Rationale:</span>
        <span>{data.reason}</span>
      </div>

      {/* Compare Details Expandable */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[8.5px] font-mono text-[#00dbe9] hover:underline flex items-center gap-1 cursor-pointer"
        >
          {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          <span>{isExpanded ? 'Hide Detailed Numbers' : 'Compare Supporting Details'}</span>
        </button>

        {isExpanded && (
          <div className="mt-1.5 pt-1 border-t border-[#3b494b]/30 grid grid-cols-2 gap-1.5 text-[8.5px] font-mono bg-[#090e1b] p-2 rounded">
            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30 flex flex-col gap-0.5">
              <span className="text-[#00f0ff] font-bold">Profile A Details</span>
              <span className="text-[#849495]">Fuel Flow: {data.profileA.fuelLHr} L/h (-9.5%)</span>
              <span className="text-[#849495]">Peak CHT: {data.profileA.chtC}°C (+4°C)</span>
              <span className="text-[#849495]">Latency Delta: +{data.profileA.latencyDeltaMs} ms</span>
            </div>

            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30 flex flex-col gap-0.5">
              <span className="text-[#f59e0b] font-bold">Profile B Details</span>
              <span className="text-[#849495]">Fuel Flow: {data.profileB.fuelLHr} L/h (+12%)</span>
              <span className="text-[#849495]">Peak CHT: {data.profileB.chtC}°C (+12.5°C)</span>
              <span className="text-[#849495]">Latency Delta: {data.profileB.latencyDeltaMs} ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

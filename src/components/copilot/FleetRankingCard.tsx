import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { FleetRankingItem } from '../../types';

interface FleetRankingCardProps {
  rankings: FleetRankingItem[];
  onSelectEngine?: (engineId: string) => void;
}

export const FleetRankingCard: React.FC<FleetRankingCardProps> = ({
  rankings,
  onSelectEngine,
}) => {
  const [selectedEngineId, setSelectedEngineId] = useState<string>(rankings[0]?.engineId || '');

  const activeItem = rankings.find((r) => r.engineId === selectedEngineId) || rankings[0];

  return (
    <div className="bg-[#111726]/95 border border-[#3b494b]/40 rounded-lg p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#00f0ff] uppercase font-bold tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3" /> FLEET PRIORITY QUEUE
        </span>
        <span className="text-[8px] font-mono text-[#849495]">Click engine to inspect</span>
      </div>

      {/* Interactive Ranking Table */}
      <div className="flex flex-col gap-1 font-mono text-[9px]">
        {rankings.map((item) => {
          const isSelected = item.engineId === selectedEngineId;
          let priColor = 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30';
          if (item.priority === 'HIGH') priColor = 'text-[#ef4444] bg-[#ef4444]/15 border-[#ef4444]/40';
          else if (item.priority === 'MEDIUM') priColor = 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/40';

          return (
            <button
              key={item.engineId}
              onClick={() => {
                setSelectedEngineId(item.engineId);
                if (onSelectEngine) onSelectEngine(item.engineId);
              }}
              className={`p-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#1a2336] border-[#00f0ff]/60 shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                  : 'bg-[#090e1b] border-[#3b494b]/30 hover:bg-[#151c2d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#849495] font-bold text-[8.5px]">0{item.rank}</span>
                <span className="font-bold text-[#dee2f5]">{item.engineId}</span>
                <span className="text-[8px] text-[#849495] hidden sm:inline">{item.engineName}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[#849495]">Score: {item.urgencyScore}</span>
                <span className={`px-1 py-0.2 rounded font-bold text-[8px] border ${priColor}`}>
                  {item.priority}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Why This Engine Was Prioritized */}
      {activeItem && (
        <div className="mt-1 pt-1.5 border-t border-[#3b494b]/30 bg-[#090e1b]/90 p-2 rounded flex flex-col gap-1 text-[9px] font-mono">
          <div className="flex items-center justify-between text-[#00f0ff] font-bold">
            <span>PRIORITY ANALYSIS: {activeItem.engineId}</span>
            <span className="text-[#849495] text-[8px]">Urgency Score: {activeItem.urgencyScore}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[8.5px] my-0.5 text-center">
            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30">
              <span className="text-[#849495] block text-[7.5px]">HEALTH</span>
              <span className="font-bold text-[#dee2f5]">{activeItem.health}%</span>
            </div>
            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30">
              <span className="text-[#849495] block text-[7.5px]">RUL</span>
              <span className="font-bold text-[#fcd34d]">{activeItem.rulHours}h</span>
            </div>
            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30">
              <span className="text-[#849495] block text-[7.5px]">VIB RMS</span>
              <span className="font-bold text-[#fca5a5]">{activeItem.vibrationMmS}</span>
            </div>
            <div className="p-1 rounded bg-[#161b29] border border-[#3b494b]/30">
              <span className="text-[#849495] block text-[7.5px]">PEAK CHT</span>
              <span className="font-bold text-[#dee2f5]">{activeItem.chtC}°C</span>
            </div>
          </div>

          {activeItem.criticalFlags && activeItem.criticalFlags.length > 0 ? (
            <div className="flex flex-col gap-0.5 text-[#b9cacb] text-[8.5px] mt-0.5">
              <span className="text-[#849495] font-bold">Multi-Indicator Flags:</span>
              {activeItem.criticalFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-1 text-[#fde68a]">
                  <span className="text-[#00f0ff]">▪</span>
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[#10b981] text-[8.5px]">All subsystem parameters within baseline loiter bounds.</span>
          )}
        </div>
      )}
    </div>
  );
};

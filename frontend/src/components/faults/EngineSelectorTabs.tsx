import React from 'react';
import { EngineId } from '../../types/faultTypes';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Clock, Activity, ShieldAlert } from 'lucide-react';

export const EngineSelectorTabs: React.FC = () => {
  const { engines, selectedEngineId, selectEngine } = useDashboard();

  return (
    <div
      id="engine-unit-selector-tabs"
      className="grid grid-cols-2 lg:grid-cols-4 gap-2"
    >
      {(engines || []).map(eng => {
        const isSelected = eng.id === selectedEngineId;

        // Custom status badge style based on severity
        let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
        let statusDot = 'bg-emerald-400';

        if (eng.status === 'WARNING') {
          badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
          statusDot = 'bg-amber-400';
        } else if (eng.status === 'CRITICAL') {
          badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          statusDot = 'bg-rose-400 animate-pulse';
        } else if (eng.status === 'WATCH') {
          badgeStyle = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
          statusDot = 'bg-cyan-400';
        }

        return (
          <button
            key={eng.id}
            id={`tab-${eng.id}`}
            type="button"
            onClick={() => selectEngine(eng.id)}
            className={`text-left p-2.5 rounded-lg transition-all flex flex-col gap-1 cursor-pointer relative overflow-hidden border ${
              isSelected
                ? 'bg-[#151d2f] border-[#00f0ff]/50 shadow-[0_0_12px_rgba(0,240,255,0.15)] ring-1 ring-[#00f0ff]/30'
                : 'bg-[#0f1422]/90 hover:bg-[#141b2c] border-[#3b494b]/30'
            }`}
          >
            {/* Header: Engine Name and Status Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                <span className="font-display text-sm font-bold text-slate-100">
                  {eng.name}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {eng.callsign}
                </span>
              </div>
              <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded border ${badgeStyle}`}>
                {eng.statusTag}
              </span>
            </div>

            {/* Health & RUL Row */}
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-1">
              <span>
                Health: <strong className={eng.healthPercent < 75 ? 'text-amber-400' : 'text-slate-200'}>{eng.healthPercent.toFixed(0)}%</strong>
              </span>
              <span>
                RUL: <strong className={eng.rulHours < 25 ? 'text-rose-400' : 'text-slate-200'}>{eng.rulHours}h</strong>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

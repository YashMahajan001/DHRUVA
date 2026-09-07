import React from 'react';
import { EngineId } from '../../types/faultTypes';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Clock, Activity, ShieldAlert } from 'lucide-react';

export const EngineSelectorTabs: React.FC = () => {
  const { engines, selectedEngineId, selectEngine } = useDashboard();

  return (
    <div
      id="engine-unit-selector-tabs"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5"
    >
      {(engines || []).map(eng => {
        const isSelected = eng.id === selectedEngineId;

        // Custom status badge style based on severity
        let badgeStyle = 'bg-[#303443] text-[#00f0ff]';
        let barColor = 'bg-[#00f0ff]';
        let confColor = 'text-[#dee2f5]';

        if (eng.status === 'WARNING') {
          badgeStyle = 'bg-[#303443] text-[#b4c5ff] animate-pulse font-bold';
          barColor = 'bg-[#b4c5ff]';
          confColor = 'text-[#7df4ff]';
        } else if (eng.status === 'CRITICAL') {
          badgeStyle = 'bg-[#93000a] text-[#ffdad6] animate-pulse font-bold';
          barColor = 'bg-[#ef4444]';
          confColor = 'text-[#ffb4ab]';
        } else if (eng.status === 'WATCH') {
          badgeStyle = 'bg-[#303443] text-[#7bd0ff] font-medium';
          barColor = 'bg-[#7bd0ff]';
          confColor = 'text-[#dee2f5]';
        }

        return (
          <button
            key={eng.id}
            id={`tab-${eng.id}`}
            type="button"
            onClick={() => selectEngine(eng.id)}
            className={`text-left p-3.5 rounded-lg transition-all flex flex-col gap-1.5 cursor-pointer relative overflow-hidden ${
              isSelected
                ? 'bg-[#252a38] border border-[#00f0ff]/50 shadow-[0_0_16px_rgba(0,240,255,0.22)] ring-1 ring-[#00f0ff]/40'
                : 'bg-[#161b29]/90 hover:bg-[#1a1f2d] border border-[#3b494b]/30 shadow-md'
            }`}
          >
            {/* Header: Engine Name and Status Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-[#dee2f5] tracking-wide">
                  {eng.name}
                </span>
                <span className="font-mono-telemetry text-[10px] text-[#849495] uppercase">
                  {eng.model.split(' ')[0]}
                </span>
              </div>
              <span className={`font-mono-telemetry text-[9px] px-2 py-0.5 rounded tracking-wider ${badgeStyle}`}>
                {eng.statusTag}
              </span>
            </div>

            {/* Callsign and AI Confidence */}
            <div className="flex items-center justify-between font-mono-telemetry text-xs text-[#b9cacb]">
              <span>CALLSIGN: {eng.callsign}</span>
              <span className={`font-semibold ${confColor}`}>
                {eng.aiConfidence.toFixed(1)}% AI CONF
              </span>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full bg-[#303443] h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-500 ${barColor}`}
                style={{ width: `${eng.aiConfidence}%` }}
              ></div>
            </div>

            {/* Secondary telemetry info (Health %, RUL, Phase) */}
            <div className="flex items-center justify-between pt-1 font-mono-telemetry text-[10px] text-[#849495] border-t border-[#3b494b]/20">
              <span className="flex items-center gap-1 text-[#dee2f5]">
                <Activity className="w-3 h-3 text-[#00f0ff]" />
                Health: <strong className="text-[#dbfcff]">{eng.healthPercent.toFixed(1)}%</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#7df4ff]" />
                RUL: <strong className={eng.rulHours < 20 ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'}>{eng.rulHours}h</strong>
              </span>
              <span className="text-[#849495] uppercase">{eng.missionPhase}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

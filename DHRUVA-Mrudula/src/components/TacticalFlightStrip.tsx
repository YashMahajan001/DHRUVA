import React, { useEffect, useState } from 'react';
import { EngineInstance, Mission } from '../types';

interface TacticalFlightStripProps {
  mission: Mission;
  engines: EngineInstance[];
  selectedEngineIndex: number;
  onSelectEngine: (index: number) => void;
  onOpenMissionModal: () => void;
}

export const TacticalFlightStrip: React.FC<TacticalFlightStripProps> = ({
  mission,
  engines,
  selectedEngineIndex,
  onSelectEngine,
  onOpenMissionModal,
}) => {
  const [zuluTime, setZuluTime] = useState<string>('');

  useEffect(() => {
    const updateZulu = () => {
      const now = new Date();
      const z = now.toISOString().substring(11, 19) + 'Z';
      setZuluTime(z);
    };
    updateZulu();
    const interval = setInterval(updateZulu, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="tactical-flight-strip"
      className="w-full bg-[#090e1b]/95 border-b border-[#3b494b]/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md z-30"
    >
      {/* Vehicle Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252a38] border border-[#3b494b]/40 rounded shadow-sm">
          <span className="font-mono text-[11px] text-[#dbfcff] font-medium tracking-widest">
            ASSET:
          </span>
          <span className="font-mono text-sm text-[#00f0ff] font-bold">
            {mission.assetId || 'UAV-01'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1f2d] border border-[#10b981]/30 rounded">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="font-mono text-[11px] text-[#10b981] font-bold tracking-wider">
            ONLINE
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-[#b9cacb] font-mono text-[9px] uppercase tracking-wider">
          <span className="text-[#849495]">LINK:</span>
          <span className="text-[#00dbe9]">{mission.linkStatus || 'SATCOM // ENCRYPTED 256-BIT'}</span>
        </div>
      </div>

      {/* Quick Mission Telemetry Badges */}
      <div className="flex items-center flex-wrap gap-2 font-mono text-[9px]">
        <button
          onClick={onOpenMissionModal}
          className="bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/30 hover:border-[#00f0ff]/40 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Click to view & configure mission envelope"
        >
          <span className="text-[#849495]">MISSION:</span>
          <span className="text-[#dee2f5] font-semibold tracking-wide">
            {mission.missionName || 'HIGH ALTITUDE ISR'}
          </span>
        </button>

        <div className="bg-[#161b29] border border-[#3b494b]/30 px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="text-[#849495]">PHASE:</span>
          <span className="text-[#00f0ff] font-semibold tracking-wide">
            {mission.phase || 'LOITER // AUTONOMOUS'}
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/30 px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="text-[#849495]">ALT:</span>
          <span className="text-xs text-[#dee2f5] font-bold">
            {(mission.altitudeFt || 18000).toLocaleString()} FT
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/30 px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="text-[#849495]">SPD:</span>
          <span className="text-xs text-[#dee2f5] font-bold">
            {mission.airspeedKt || 198} KT
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/30 px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="text-[#849495]">FUEL:</span>
          <span className="text-xs text-[#10b981] font-bold">
            {mission.fuelRemainingPct || 64}%
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/30 px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="text-[#849495]">ZULU:</span>
          <span className="text-xs text-[#7df4ff] font-bold font-mono">
            {zuluTime || '19:48:22Z'}
          </span>
        </div>
      </div>

      {/* Multi-Engine Selector Bar */}
      <div
        id="engine-selector-nav"
        className="flex items-center gap-1 bg-[#252a38]/80 p-0.5 rounded border border-[#3b494b]/30"
      >
        {engines.map((eng, idx) => {
          const isSelected = selectedEngineIndex === idx;
          const healthColor =
            eng.health >= 85
              ? 'text-[#10b981]'
              : eng.health >= 60
              ? 'text-[#f59e0b]'
              : 'text-[#ef4444]';

          return (
            <button
              key={eng.id}
              id={`engine-btn-${idx}`}
              onClick={() => onSelectEngine(idx)}
              className={`px-3 py-1 rounded font-mono text-[11px] uppercase transition-all duration-200 flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_12px_rgba(0,240,255,0.45)]'
                  : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
              }`}
              title={`Switch telemetry focus to ${eng.name}`}
            >
              <span>{eng.id}</span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  isSelected ? 'text-[#00363a]' : healthColor
                }`}
              >
                {eng.health}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

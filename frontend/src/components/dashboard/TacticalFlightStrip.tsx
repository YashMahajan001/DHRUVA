import React, { useEffect, useState } from 'react';
import { EngineInstance, Mission } from '../../types';

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
      className="w-full bg-[#090e1b]/95 border-b border-[#3b494b]/15 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-md z-30"
    >
      {/* Vehicle Identification */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#252a38] border border-[#3b494b]/20 rounded shadow-sm">
          <span className="font-mono text-[10px] sm:text-xs text-[#dbfcff] font-medium tracking-widest">
            ASSET:
          </span>
          <span className="font-mono text-xs sm:text-sm text-[#00f0ff] font-bold">
            {mission.assetId || 'UAV-01'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2 sm:py-1 bg-[#1a1f2d] border border-[#10b981]/30 rounded">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="font-mono text-[10px] sm:text-xs text-[#10b981] font-bold tracking-wider">
            ONLINE
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[#b9cacb] font-mono text-xs uppercase tracking-wider">
          <span className="text-[#849495]">LINK:</span>
          <span className="text-[#00dbe9]">{mission.linkStatus || 'SATCOM // ENCRYPTED 256-BIT'}</span>
        </div>
      </div>

      {/* Quick Mission Telemetry Badges */}
      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 font-mono text-xs">
        <button
          onClick={onOpenMissionModal}
          className="bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/20 hover:border-[#00f0ff]/40 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
          title="Click to view & configure mission envelope"
        >
          <span className="text-[#849495] text-[10px]">MISSION:</span>
          <span className="text-[#dee2f5] font-semibold tracking-wide text-xs">
            {mission.missionName || 'HIGH ALTITUDE ISR'}
          </span>
        </button>

        <div className="bg-[#161b29] border border-[#3b494b]/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
          <span className="text-[#849495] text-[10px]">PHASE:</span>
          <span className="text-[#00f0ff] font-semibold tracking-wide text-xs">
            {mission.phase || 'LOITER // AUTONOMOUS'}
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
          <span className="text-[#849495] text-[10px]">ALT:</span>
          <span className="text-xs sm:text-sm text-[#dee2f5] font-bold">
            {(mission.altitudeFt || 18000).toLocaleString()} FT
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
          <span className="text-[#849495] text-[10px]">SPD:</span>
          <span className="text-xs sm:text-sm text-[#dee2f5] font-bold">
            {mission.airspeedKt || 198} KT
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
          <span className="text-[#849495] text-[10px]">FUEL:</span>
          <span className="text-xs sm:text-sm text-[#10b981] font-bold">
            {mission.fuelRemainingPct || 64}%
          </span>
        </div>

        <div className="bg-[#161b29] border border-[#3b494b]/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
          <span className="text-[#849495] text-[10px]">ZULU:</span>
          <span className="text-xs sm:text-sm text-[#7df4ff] font-bold font-mono">
            {zuluTime || '19:48:22Z'}
          </span>
        </div>
      </div>

      {/* Multi-Engine Selector Bar */}
      <div
        id="engine-selector-nav"
        className="flex items-center gap-1 bg-[#252a38]/80 p-0.5 rounded border border-[#3b494b]/20"
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
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase transition-all duration-200 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
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

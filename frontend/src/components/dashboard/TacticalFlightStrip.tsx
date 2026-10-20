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
      className="w-full bg-[#0c1220]/90 border border-[#00f0ff]/15 rounded-xl px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
    >
      {/* Vehicle Identification & Link */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161f30] border border-[#00f0ff]/20 rounded-lg">
          <span className="text-[10px] text-[#849495] font-semibold tracking-wider">ASSET</span>
          <span className="font-mono text-xs text-[#00f0ff] font-bold">
            {mission.assetId || 'UAV-01'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="font-mono text-[10px] text-[#10b981] font-semibold tracking-wider">ONLINE</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[#849495] text-xs">
          <span>Link:</span>
          <span className="text-[#00dbe9] font-mono text-[11px]">SATCOM Encrypted</span>
        </div>
      </div>

      {/* Unified Mission Telemetry Group (consolidated instead of 6 individual boxes) */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <button
          onClick={onOpenMissionModal}
          className="text-[#dee2f5] hover:text-[#00f0ff] text-xs font-medium px-2 py-1 rounded bg-[#161f30]/60 hover:bg-[#161f30] transition-colors cursor-pointer flex items-center gap-1"
          title="Click to view & configure mission envelope"
        >
          <span className="text-[#849495] text-[10px]">Mission:</span>
          <span>{mission.missionName || 'ISR Patrol'}</span>
        </button>

        <span className="text-[#3b494b] hidden sm:inline">·</span>

        <span className="text-xs text-[#849495]">
          Phase <span className="text-[#00f0ff] font-medium">{mission.phase || 'Loiter'}</span>
        </span>

        <span className="text-[#3b494b] hidden sm:inline">·</span>

        <span className="text-xs text-[#849495]">
          Alt <span className="font-mono text-[#dee2f5] font-medium">{(mission.altitudeFt || 18000).toLocaleString()} FT</span>
        </span>

        <span className="text-[#3b494b] hidden sm:inline">·</span>

        <span className="text-xs text-[#849495]">
          Speed <span className="font-mono text-[#dee2f5] font-medium">{mission.airspeedKt || 198} KT</span>
        </span>

        <span className="text-[#3b494b] hidden sm:inline">·</span>

        <span className="text-xs text-[#849495]">
          Fuel <span className="font-mono text-[#10b981] font-medium">{mission.fuelRemainingPct || 64}%</span>
        </span>

        <span className="text-[#3b494b] hidden md:inline">·</span>

        <span className="hidden md:inline font-mono text-[11px] text-[#7df4ff] bg-[#161f30]/60 px-1.5 py-0.5 rounded">
          {zuluTime || '19:48:22Z'}
        </span>
      </div>

      {/* Multi-Engine Selector Bar */}
      <div
        id="engine-selector-nav"
        className="flex items-center gap-1 bg-[#161f30]/80 p-0.5 rounded-lg border border-[#3b494b]/30"
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
              className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase transition-all duration-200 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-[#849495] hover:bg-[#1a2335] hover:text-[#dee2f5]'
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

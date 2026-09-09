import React, { useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { formatShortDuration } from '../../utils/formatters';
import { Plane, Compass, Fuel, Zap, ChevronDown, ChevronUp, Gauge, Activity } from 'lucide-react';

export const MissionSummaryBar: React.FC = () => {
  const { selectedMission, telemetry, selectedEngine } = useMissionDashboard();
  const [isExpanded, setIsExpanded] = useState(false);

  const missionProgressPercent = Math.round(
    (selectedMission.elapsedSeconds / selectedMission.totalDurationSeconds) * 100
  );

  return (
    <div className="bg-[#161b29]/90 backdrop-blur-md rounded-xl border border-[#3b494b]/30 p-3 shadow-md select-none transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* UAV & Mission Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            <Plane className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[#dee2f5] font-bold text-xs uppercase tracking-wide">
              {selectedMission.callsign}
            </span>
            <span className="text-[#849495] text-[10px]">[{selectedMission.uavTailNumber}]</span>
            <span className="text-[#00dbe9] text-[10px] hidden sm:inline font-semibold">
              • {selectedMission.missionType}
            </span>
          </div>
        </div>

        {/* Tactical Key Metrics Row */}
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          {/* Phase & Altitude */}
          <div className="flex items-center gap-1.5 bg-[#090e1b]/70 px-2.5 py-1 rounded-md border border-[#3b494b]/20">
            <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#849495] uppercase text-[10px]">PHASE:</span>
            <span className="text-[#00f0ff] font-bold uppercase">{selectedMission.phase}</span>
            <span className="text-[#849495]">@</span>
            <span className="text-[#dee2f5] font-bold">{selectedMission.altitudeFt.toLocaleString()} FT</span>
          </div>

          {/* Mission Progress & Remaining */}
          <div className="hidden lg:flex items-center gap-2 bg-[#090e1b]/70 px-2.5 py-1 rounded-md border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase text-[10px]">PROGRESS:</span>
            <div className="w-20 bg-[#303443] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#00f0ff] h-full transition-all duration-500 shadow-[0_0_6px_#00f0ff]"
                style={{ width: `${missionProgressPercent}%` }}
              />
            </div>
            <span className="text-[#00f0ff] font-bold">{missionProgressPercent}%</span>
            <span className="text-[#849495] text-[10px]">({formatShortDuration(selectedMission.remainingSeconds)} REM)</span>
          </div>

          {/* Fuel & Endurance */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#090e1b]/70 px-2.5 py-1 rounded-md border border-[#3b494b]/20">
            <Fuel className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-[#849495] uppercase text-[10px]">FUEL:</span>
            <span className="text-[#f59e0b] font-bold">{selectedMission.fuelRemainingLiters} L</span>
            <span className="text-[#849495] text-[10px]">
              ({telemetry.fuelFlow} L/h • {selectedMission.enduranceHoursRemaining}h END)
            </span>
          </div>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-[#849495] hover:text-[#dee2f5] rounded-md bg-[#090e1b]/60 hover:bg-[#252a38] border border-[#3b494b]/30 transition-colors cursor-pointer text-[10px]"
            title="Toggle Extended Avionics Telemetry"
          >
            <span>{isExpanded ? 'LESS' : 'DETAILS'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3 text-[#00f0ff]" /> : <ChevronDown className="w-3 h-3 text-[#00f0ff]" />}
          </button>
        </div>
      </div>

      {/* Expanded Avionics Telemetry Matrix */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#3b494b]/30 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-[10px] font-mono">
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">ENGINE SPEED</span>
            <span className="text-[#00f0ff] font-bold text-sm block mt-0.5">{telemetry.rpm.toLocaleString()} RPM</span>
            <span className="text-[#10b981] text-[9px]">CRUISE NOMINAL</span>
          </div>
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">EXHAUST GAS TEMP (EGT)</span>
            <span className="text-[#dee2f5] font-bold text-sm block mt-0.5">{telemetry.egtAvg} °C</span>
            <span className="text-[#f59e0b] text-[9px]">PEAK: {telemetry.egtPeak} °C</span>
          </div>
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">OIL CIRCUIT</span>
            <span className="text-[#dee2f5] font-bold text-sm block mt-0.5">{telemetry.oilPressure} PSI</span>
            <span className="text-[#7df4ff] text-[9px]">TEMP: {telemetry.oilTemperature} °C</span>
          </div>
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">AVIONICS DC BUS</span>
            <span className="text-[#dee2f5] font-bold text-sm flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-[#00f0ff]" /> {telemetry.batteryVoltage} V
            </span>
            <span className="text-[#00dbe9] text-[9px]">{telemetry.alternatorCurrent} A ALT</span>
          </div>
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">VIBRATION RMS</span>
            <span className="text-[#dee2f5] font-bold text-sm block mt-0.5">{telemetry.vibrationAmplitude} mm/s</span>
            <span className="text-[#10b981] text-[9px]">PEAK: {telemetry.vibrationPeakHz} Hz</span>
          </div>
          <div className="bg-[#090e1b]/80 p-2.5 rounded-lg border border-[#3b494b]/20">
            <span className="text-[#849495] uppercase block text-[9px] font-semibold">PLANT MODEL</span>
            <span className="text-[#dee2f5] font-bold text-xs block mt-0.5 truncate">{(selectedEngine as any).name || selectedEngine.model}</span>
            <span className="text-[#849495] text-[9px]">ID: {selectedEngine.id.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

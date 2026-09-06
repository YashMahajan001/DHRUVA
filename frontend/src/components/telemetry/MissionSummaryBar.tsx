import React, { useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { formatShortDuration } from '../../utils/formatters';
import { Plane, Compass, Fuel, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export const MissionSummaryBar: React.FC = () => {
  const { selectedMission, telemetry, selectedEngine } = useMissionDashboard();
  const [isExpanded, setIsExpanded] = useState(false);

  const missionProgressPercent = Math.round(
    (selectedMission.elapsedSeconds / selectedMission.totalDurationSeconds) * 100
  );

  return (
    <div className="bg-surface-container-low/90 backdrop-blur-md rounded border border-outline-variant/20 p-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* UAV & Mission Title */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Plane className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-on-surface font-bold text-xs uppercase">{selectedMission.callsign}</span>
            <span className="text-outline text-[10px]">[{selectedMission.uavTailNumber}]</span>
            <span className="text-primary text-[10px] hidden sm:inline">• {selectedMission.missionType}</span>
          </div>
        </div>

        {/* Tactical Key Metrics Row */}
        <div className="flex items-center gap-4 text-[11px]">
          {/* Phase & Altitude */}
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-secondary-fixed" />
            <span className="text-outline">PHASE:</span>
            <span className="text-primary font-bold">{selectedMission.phase}</span>
            <span className="text-outline">@</span>
            <span className="text-on-surface font-bold">{selectedMission.altitudeFt.toLocaleString()} FT</span>
          </div>

          {/* Mission Progress & Remaining */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-outline">PROGRESS:</span>
            <div className="w-16 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${missionProgressPercent}%` }}
              ></div>
            </div>
            <span className="text-primary font-bold">{missionProgressPercent}%</span>
            <span className="text-outline">({formatShortDuration(selectedMission.remainingSeconds)} REM)</span>
          </div>

          {/* Fuel & Endurance */}
          <div className="hidden md:flex items-center gap-1.5">
            <Fuel className="w-3 h-3 text-amber-400" />
            <span className="text-outline">FUEL:</span>
            <span className="text-amber-400 font-bold">{selectedMission.fuelRemainingLiters} L</span>
            <span className="text-outline">({telemetry.fuelFlow} L/h • {selectedMission.enduranceHoursRemaining}h END)</span>
          </div>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors cursor-pointer"
            title="Toggle Extended Avionics Telemetry"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Avionics Telemetry Matrix */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-outline-variant/20 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] font-mono">
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">ENGINE SPEED</span>
            <span className="text-primary font-bold text-xs">{telemetry.rpm} RPM</span>
            <span className="text-outline text-[9px]">CRUISE NOMINAL</span>
          </div>
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">EXHAUST GAS TEMP (EGT)</span>
            <span className="text-on-surface font-bold text-xs">{telemetry.egtAvg} °C</span>
            <span className="text-primary-fixed text-[9px]">PEAK: {telemetry.egtPeak} °C</span>
          </div>
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">OIL CIRCUIT</span>
            <span className="text-on-surface font-bold text-xs">{telemetry.oilPressure} PSI</span>
            <span className="text-primary-fixed text-[9px]">TEMP: {telemetry.oilTemperature} °C</span>
          </div>
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">AVIONICS DC BUS</span>
            <span className="text-on-surface font-bold text-xs flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-primary" /> {telemetry.batteryVoltage} V
            </span>
            <span className="text-primary-fixed text-[9px]">{telemetry.alternatorCurrent} A ALT</span>
          </div>
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">VIBRATION RMS</span>
            <span className="text-on-surface font-bold text-xs">{telemetry.vibrationAmplitude} mm/s</span>
            <span className="text-primary-fixed text-[9px]">PEAK: {telemetry.vibrationPeakHz} Hz</span>
          </div>
          <div className="bg-surface-container p-1.5 rounded">
            <span className="text-outline uppercase block">GROUND SPEED</span>
            <span className="text-primary font-bold text-xs">{selectedMission.groundSpeedKts} KTS</span>
            <span className="text-outline text-[9px]">{selectedEngine.displacement}</span>
          </div>
        </div>
      )}
    </div>
  );
};

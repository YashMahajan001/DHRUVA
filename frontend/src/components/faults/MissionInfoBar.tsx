import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Plane, Compass, Navigation, Gauge, BatteryMedium, Clock, MapPin } from 'lucide-react';

export const MissionInfoBar: React.FC = () => {
  const { mission, showToast } = useDashboard();

  return (
    <div
      id="mission-info-hud"
      className="w-full bg-[#161b29]/75 backdrop-blur-xl px-4 py-2 rounded-lg border border-[#3b494b]/30 shadow-md flex flex-wrap items-center justify-between gap-3 font-mono-telemetry text-xs"
    >
      {/* UAV Callsign & Type */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => showToast(`Airframe: ${mission.tailNumber} (${mission.uavType})`, 'info')}
      >
        <div className="w-7 h-7 rounded bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
          <Plane className="w-4 h-4 -rotate-45" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#dee2f5] tracking-wider">{mission.callsign}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#303443] text-[#00f0ff]">
              {mission.code}
            </span>
          </div>
          <span className="text-[9px] text-[#849495] truncate max-w-[220px]">
            {mission.missionType}
          </span>
        </div>
      </div>

      {/* Altitude & Airspeed */}
      <div className="flex items-center gap-4 border-l border-[#3b494b]/30 pl-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-[#849495] uppercase">ALTITUDE (MSL)</span>
          <span className="text-sm font-bold text-[#dbfcff]">
            {mission.altitudeFeet.toLocaleString()} <span className="text-[9px] text-[#849495]">FT</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] text-[#849495] uppercase">AIRSPEED</span>
          <span className="text-sm font-bold text-[#dbfcff]">
            {mission.airspeedKnots} <span className="text-[9px] text-[#849495]">KTS</span>
          </span>
        </div>
      </div>

      {/* Sortie Progress Bar */}
      <div className="flex flex-col gap-1 min-w-[140px] flex-1 max-w-[220px] border-l border-[#3b494b]/30 pl-3">
        <div className="flex justify-between text-[9px]">
          <span className="text-[#849495]">MISSION PROGRESS</span>
          <span className="text-[#00f0ff] font-bold">{mission.progressPercent}%</span>
        </div>
        <div className="w-full bg-[#303443] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#00f0ff] h-full transition-all duration-500 shadow-[0_0_6px_#00f0ff]"
            style={{ width: `${mission.progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Elapsed vs Remaining */}
      <div className="flex items-center gap-3 border-l border-[#3b494b]/30 pl-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-[#849495] uppercase">T-ELAPSED</span>
          <span className="text-xs font-semibold text-[#b9cacb]">{mission.elapsedTime}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-[#849495] uppercase">T-REMAINING</span>
          <span className="text-xs font-semibold text-[#00f0ff]">{mission.remainingTime}</span>
        </div>
      </div>

      {/* Fuel Endurance */}
      <div className="flex items-center gap-2 border-l border-[#3b494b]/30 pl-3">
        <div className="flex flex-col text-right">
          <span className="text-[9px] text-[#849495] uppercase">FUEL / ENDURANCE</span>
          <span className="text-xs font-bold text-[#7df4ff]">
            {mission.fuelRemainingPercent}% ({mission.fuelEnduranceHours}h)
          </span>
        </div>
        <div className="w-2.5 h-6 bg-[#303443] rounded-xs overflow-hidden flex flex-col justify-end p-0.5">
          <div
            className="w-full bg-[#00f0ff] rounded-xs"
            style={{ height: `${mission.fuelRemainingPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Waypoint */}
      <div className="hidden 2xl:flex items-center gap-1.5 border-l border-[#3b494b]/30 pl-3 text-[#b9cacb]">
        <MapPin className="w-3.5 h-3.5 text-[#00f0ff]" />
        <span className="text-[10px] text-[#849495]">{mission.waypoint}</span>
      </div>
    </div>
  );
};

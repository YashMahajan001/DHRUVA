import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Plane, MapPin } from 'lucide-react';

export const MissionInfoBar: React.FC = () => {
  const { mission, showToast } = useDashboard();

  return (
    <div
      id="mission-info-hud"
      className="w-full bg-[#0d121f]/70 px-3.5 py-1.5 rounded-lg border border-[#3b494b]/20 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-400"
    >
      {/* UAV Callsign & Type */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        onClick={() => showToast(`Airframe: ${mission.tailNumber} (${mission.uavType})`, 'info')}
      >
        <Plane className="w-3.5 h-3.5 text-[#00f0ff] -rotate-45" />
        <span className="font-semibold text-slate-200">{mission.callsign}</span>
        <span className="text-[10px] px-1 py-0.5 rounded bg-[#1e2538] text-[#00f0ff]">
          {mission.code}
        </span>
        <span className="text-slate-500 text-[11px] hidden sm:inline">({mission.uavType})</span>
      </div>

      {/* Flight Telemetry Strip */}
      <div className="flex items-center gap-4 text-[11px]">
        <div>
          <span className="text-slate-500">ALT: </span>
          <span className="text-slate-200 font-semibold">{mission.altitudeFeet.toLocaleString()} FT</span>
        </div>
        <div>
          <span className="text-slate-500">SPD: </span>
          <span className="text-slate-200 font-semibold">{mission.airspeedKnots} KTS</span>
        </div>
        <div>
          <span className="text-slate-500">FUEL: </span>
          <span className="text-[#00f0ff] font-semibold">{mission.fuelRemainingPercent}% ({mission.fuelEnduranceHours}h)</span>
        </div>
        <div className="hidden md:block">
          <span className="text-slate-500">SORTIE: </span>
          <span className="text-slate-200">{mission.progressPercent}% ({mission.elapsedTime} / {mission.remainingTime})</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 text-slate-400">
          <MapPin className="w-3 h-3 text-[#00f0ff]" />
          <span>{mission.waypoint}</span>
        </div>
      </div>
    </div>
  );
};

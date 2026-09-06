import React from 'react';
import { useTelemetry } from '../../context/FleetContext';

export const AirbaseReadinessPanel: React.FC = () => {
  const { fleetAggregate, mission } = useTelemetry();

  return (
    <div
      id="airbase-readiness-panel"
      className="bg-[#161b29]/95 rounded-xl p-4 shadow-xl border border-[#3b494b]/30 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between text-[#b9cacb] font-label-tactical text-[11px] font-mono uppercase">
        <span className="font-bold text-[#dee2f5]">AIRBASE ASSET READINESS ALLOCATION</span>
        <span className="font-label-micro text-[9px] text-[#849495]">BASE: {mission.airBase}</span>
      </div>

      {/* Segmented allocation bar */}
      <div className="flex items-center gap-0.5 w-full h-3 rounded-full overflow-hidden bg-[#303443]">
        <div
          className="h-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)] transition-all duration-500"
          style={{ width: `${fleetAggregate.readinessAllocation.airbornePct}%` }}
          title={`4 Airborne (${fleetAggregate.readinessAllocation.airbornePct}%)`}
        ></div>
        <div
          className="h-full bg-amber-400 transition-all duration-500"
          style={{ width: `${fleetAggregate.readinessAllocation.taxiPreflightPct}%` }}
          title={`2 Taxi/Pre-flight (${fleetAggregate.readinessAllocation.taxiPreflightPct}%)`}
        ></div>
        <div
          className="h-full bg-[#849495] transition-all duration-500"
          style={{ width: `${fleetAggregate.readinessAllocation.inRepairPct}%` }}
          title={`2 Maintenance Bay (${fleetAggregate.readinessAllocation.inRepairPct}%)`}
        ></div>
      </div>

      {/* 3 Status Columns */}
      <div className="grid grid-cols-3 text-center pt-1 font-label-micro text-[9.5px] font-mono">
        <div className="flex flex-col">
          <span className="text-[#00f0ff] font-bold">4 AIRBORNE</span>
          <span className="text-[#849495]">50% OF FLEET</span>
        </div>
        <div className="flex flex-col">
          <span className="text-amber-300 font-bold">2 TAXI/PRE-FLIGHT</span>
          <span className="text-[#849495]">25% OF FLEET</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#849495] font-bold">2 IN REPAIR</span>
          <span className="text-[#849495]">25% OF FLEET</span>
        </div>
      </div>
    </div>
  );
};

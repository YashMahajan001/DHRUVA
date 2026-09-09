import React from 'react';
import { useTelemetry } from '../../context/FleetContext';

export const MissionSubBar: React.FC = () => {
  const { fleet, activeFilter, setActiveFilter, fleetAggregate, mission } = useTelemetry();

  const healthyCount = fleet.filter(f => f.healthStatus === 'NOMINAL' || f.healthStatus === 'OPTIMAL').length;
  const warningCount = fleet.filter(f => f.healthStatus === 'WARNING' || f.healthStatus === 'WATCH').length;
  const criticalCount = fleet.filter(f => f.healthStatus === 'CRITICAL').length;

  return (
    <div className="flex flex-col w-full">
      {/* Sub-bar Mission Meta & Airspace Summary Header */}
      <div className="px-6 py-3 bg-[#090e1b]/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border-b border-[#3b494b]/20 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse"></span>
            <div className="flex flex-col">
              <span className="font-label-micro text-[9px] text-[#849495] tracking-widest uppercase font-mono">
                AIRSPACE DOMAIN
              </span>
              <span className="font-headline-sm text-[16px] md:text-[18px] text-[#dee2f5] tracking-wide font-bold">
                {mission.airspaceDomain}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-5 px-3.5 py-1.5 bg-[#161b29] rounded-lg border border-[#3b494b]/30">
            <div className="flex flex-col">
              <span className="font-label-micro text-[9px] text-[#849495] uppercase font-mono">
                AIRCRAFT TRACKED
              </span>
              <span className="font-telemetry-num-md text-[15px] text-[#00dbe9] font-mono">
                {String(fleetAggregate.aircraftTracked).padStart(2, '0')}{' '}
                <span className="text-[10px] text-[#849495]">UAVs</span>
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b494b]"></div>
            <div className="flex flex-col">
              <span className="font-label-micro text-[9px] text-[#849495] uppercase font-mono">
                READINESS RATING
              </span>
              <span className="font-telemetry-num-md text-[15px] text-[#dee2f5] font-mono">
                {fleetAggregate.readinessRating}%
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b494b]"></div>
            <div className="flex flex-col">
              <span className="font-label-micro text-[9px] text-[#849495] uppercase font-mono">
                SORTIES ACTIVE
              </span>
              <span className="font-telemetry-num-md text-[15px] text-[#dbfcff] font-mono">
                {String(fleetAggregate.sortiesActive).padStart(2, '0')}{' '}
                <span className="text-[10px] text-[#849495]">AIRBORNE</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills / Tactical Tabs */}
        <div
          id="fleet-filter-bar"
          className="flex items-center gap-1 bg-[#161b29] p-1 rounded-lg border border-[#3b494b]/30"
        >
          <button
            id="filter-btn-all"
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded font-label-tactical text-[11px] font-mono uppercase tracking-wider transition-all ${
              activeFilter === 'all'
                ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
          >
            All Fleet ({fleet.length})
          </button>
          <button
            id="filter-btn-healthy"
            type="button"
            onClick={() => setActiveFilter('healthy')}
            className={`px-3 py-1 rounded font-label-tactical text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeFilter === 'healthy'
                ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Healthy ({healthyCount})
          </button>
          <button
            id="filter-btn-warning"
            type="button"
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1 rounded font-label-tactical text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeFilter === 'warning'
                ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Warning ({warningCount})
          </button>
          <button
            id="filter-btn-critical"
            type="button"
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1 rounded font-label-tactical text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeFilter === 'critical'
                ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
            Critical ({criticalCount})
          </button>
        </div>
      </div>

      {/* Operational Status Sub-Ribbon */}
      <div className="px-6 py-1.5 bg-[#161b29]/40 border-b border-[#3b494b]/20 flex items-center justify-between text-[#b9cacb] font-label-micro text-[9.5px] tracking-widest uppercase font-mono">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <span className="text-[#00dbe9]">DATA LINK: MIL-STD-1553B CARRIER ACTIVE</span>
          <span className="hidden sm:inline">SATCOM LINK LATENCY: {mission.satcomLatencyMs}ms</span>
          <span className="hidden lg:inline">ENCRYPTION: AES-GCM-256 (LEVEL 4)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#849495]">AIR BASE: {mission.airBase}</span>
          <span className="w-1 h-1 rounded-full bg-[#00f0ff]"></span>
          <span className="text-[#dee2f5]">RADAR COVERAGE: {mission.radarCoverage}</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Rocket,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Radar,
  Shield,
  Navigation,
  Send
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const PropulsionMatrixCards: React.FC = () => {
  const { fleet, selectedEngineId, setSelectedEngineId, activeFilter } = useTelemetry();

  // Filter cards based on top tab selection
  const filteredFleet = fleet.filter(uav => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'healthy') return uav.healthStatus === 'NOMINAL' || uav.healthStatus === 'OPTIMAL';
    if (activeFilter === 'warning') return uav.healthStatus === 'WARNING' || uav.healthStatus === 'WATCH';
    if (activeFilter === 'critical') return uav.healthStatus === 'CRITICAL';
    return true;
  });

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Matrix Sub-Header */}
      <div className="flex items-center justify-between px-1">
        <span className="font-label-tactical text-[11px] text-[#b9cacb] uppercase tracking-widest font-mono">
          PROPULSION TELEMETRY &amp; DIGITAL TWIN STATUS MATRIX
        </span>
        <span className="font-label-micro text-[9.5px] text-[#00dbe9] font-mono">
          UPDATED 1.2 SEC AGO // 50Hz STREAM
        </span>
      </div>

      {/* Grid of 4 Cards */}
      <div id="fleet-card-container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFleet.map((uav) => {
          const isSelected = selectedEngineId === uav.id;
          const isCritical = uav.healthStatus === 'CRITICAL';
          const isWarning = uav.healthStatus === 'WARNING' || uav.healthStatus === 'WATCH';
          const isOptimal = uav.healthStatus === 'OPTIMAL';

          return (
            <div
              key={uav.id}
              id={`card-${uav.id}`}
              onClick={() => setSelectedEngineId(uav.id)}
              className={`uav-card rounded-xl p-4 shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden border ${
                isSelected
                  ? 'bg-[#1a1f2d] border-[#00f0ff] ring-1 ring-[#00f0ff]/60 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                  : 'bg-[#161b29]/90 border-[#3b494b]/30 hover:bg-[#1a1f2d] hover:border-[#3b494b]/60'
              }`}
            >
              {/* Background ambient corner glow */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none ${
                  isCritical
                    ? 'bg-[#93000a]/20'
                    : isWarning
                    ? 'bg-amber-500/15'
                    : 'bg-[#00f0ff]/10'
                }`}
              ></div>

              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      isCritical
                        ? 'bg-[#93000a]/30 border-[#ffb4ab]/40 text-[#ffb4ab]'
                        : isWarning
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                        : isOptimal
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
                        : 'bg-[#252a38] border-[#00f0ff]/30 text-[#00f0ff]'
                    }`}
                  >
                    {isCritical ? (
                      <AlertOctagon className="w-5 h-5 animate-bounce" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isOptimal ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Rocket className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-headline-sm text-[16px] font-bold ${
                          isCritical ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
                        }`}
                      >
                        {uav.callsign}
                      </span>
                      <span className="font-label-micro text-[9.5px] text-[#849495] font-mono tracking-wider">
                        "{uav.tacticalName}"
                      </span>
                    </div>
                    <span className="font-label-micro text-[9.5px] text-[#b9cacb] font-mono">
                      TWIN: {uav.model}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`font-label-tactical text-[10.5px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-[#93000a] text-[#ffdad6] animate-pulse border border-[#ffb4ab]/40'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {uav.statusLabel}
                  </span>
                  <span
                    className={`font-label-micro text-[9px] font-mono mt-0.5 ${
                      isCritical
                        ? 'text-[#ffb4ab] font-bold'
                        : isWarning
                        ? 'text-amber-200/80'
                        : 'text-[#849495]'
                    }`}
                  >
                    {uav.rulNote || `RUL: ${uav.rulHours} HRS`}
                  </span>
                </div>
              </div>

              {/* Operational Spec Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#090e1b]/60 p-2.5 rounded-lg mb-3 border border-[#3b494b]/20">
                <div className="flex flex-col">
                  <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
                    ALTITUDE
                  </span>
                  <span
                    className={`font-telemetry-num-md text-[14px] font-mono font-bold ${
                      isCritical ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
                    }`}
                  >
                    {uav.altitudeFt.toLocaleString()}{' '}
                    <span className="text-[9px] text-[#849495] font-normal">
                      FT {isCritical ? '(DESC)' : ''}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
                    AIRSPEED
                  </span>
                  <span className="font-telemetry-num-md text-[14px] text-[#dee2f5] font-mono font-bold">
                    {uav.airspeedKt}{' '}
                    <span className="text-[9px] text-[#849495] font-normal">KT</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
                    FUEL REMAIN
                  </span>
                  <span
                    className={`font-telemetry-num-md text-[14px] font-mono font-bold ${
                      isCritical
                        ? 'text-[#ffb4ab]'
                        : isWarning
                        ? 'text-amber-300'
                        : 'text-[#00f0ff]'
                    }`}
                  >
                    {uav.fuelRemainingPct}%
                  </span>
                </div>
              </div>

              {/* Mission & Diagnostic Status Footnote */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-body-sm text-[12px]">
                  <div
                    className={`flex items-center gap-1.5 truncate ${
                      isCritical ? 'text-[#ffb4ab] font-bold' : 'text-[#b9cacb]'
                    }`}
                  >
                    {isCritical ? (
                      <Send className="w-3.5 h-3.5 text-[#ffb4ab] rotate-45 shrink-0" />
                    ) : isWarning ? (
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : isOptimal ? (
                      <Navigation className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                    ) : (
                      <Radar className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                    )}
                    <span className="truncate">{uav.missionName}</span>
                  </div>

                  <span
                    className={`font-label-micro text-[9px] font-mono flex items-center gap-1 shrink-0 ${
                      isCritical
                        ? 'text-[#ffb4ab] font-bold'
                        : isWarning
                        ? 'text-amber-300 font-semibold'
                        : 'text-emerald-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCritical
                          ? 'bg-[#ffb4ab] animate-ping'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    ></span>
                    {uav.anomalyCount}{' '}
                    {isCritical
                      ? 'CRITICAL'
                      : isWarning
                      ? 'WARNING'
                      : 'ANOMALIES'}
                  </span>
                </div>

                {/* Sub-Alert Banner if present */}
                {uav.activeFaultSnippet && (
                  <div
                    className={`px-2 py-1 rounded text-[10px] font-mono truncate font-medium ${
                      isCritical
                        ? 'bg-[#93000a]/50 text-[#ffdad6] border border-[#ffb4ab]/30'
                        : 'bg-amber-500/10 text-amber-200 border border-amber-400/20'
                    }`}
                  >
                    {uav.activeFaultSnippet}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

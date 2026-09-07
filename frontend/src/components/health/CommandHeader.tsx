/**
 * DHRUVAA Command Header & Breadcrumb Strip with Engine/Mission Selector
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { ShieldAlert, CheckCircle, RefreshCw, Layers, Compass, Gauge, AlertTriangle } from 'lucide-react';

export const CommandHeader: React.FC = () => {
  const {
    engines,
    selectedEngineId,
    setSelectedEngineId,
    selectedEngine,
    openModal,
    approveAllPendingOrders,
    syncWithERP,
    isSyncingERP
  } = useMission();

  return (
    <div
      id="commandHeader"
      className="px-6 py-4 bg-[#090e1b]/80 border-b border-[#3b494b]/30 flex flex-wrap items-center justify-between gap-4"
    >
      {/* Breadcrumb, Title & Status */}
      <div className="flex flex-col gap-1 max-w-4xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-telemetry text-[9px] text-[#00f0ff] tracking-widest uppercase">
            AIRWORTHINESS DEFENSE CLUSTER
          </span>
          <span className="text-[#3b494b] text-xs">•</span>
          <span className="font-telemetry text-[9px] text-[#b9cacb] uppercase">
            MRO TACTICAL OPERATIONS
          </span>
          <span className="text-[#3b494b] text-xs">•</span>
          <span className="font-telemetry text-[9px] text-[#00dbe9] uppercase">
            SYS.MRO_CMD // ORG-44
          </span>
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-headline text-2xl lg:text-3xl text-[#dee2f5] tracking-tight uppercase font-bold">
            PREDICTIVE MAINTENANCE &amp; AIRWORTHINESS COMMAND
          </h1>
          <span className="px-2 py-0.5 rounded bg-[#1a1f2d] border border-[#00f0ff]/30 text-[#00f0ff] font-tactical text-[11px] uppercase">
            AUTONOMOUS DISPATCH ACTIVE
          </span>
        </div>

        <p className="font-body text-xs lg:text-sm text-[#b9cacb] leading-relaxed">
          RUL Forecasting, Degradation Tracking &amp; Autonomous Maintenance Work-Order Dispatch. Real-time fleet survivability matrix based on synthetic twin telemetry.
        </p>

        {/* Engine and Mission Quick Selector Strip */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <span className="font-tactical text-[10px] text-[#849495] uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
            ACTIVE AIRFRAME FOCUS:
          </span>
          <div className="flex items-center gap-1.5">
            {engines.map((eng) => {
              const isSelected = eng.id === selectedEngineId;
              const statusColor =
                eng.status === 'CRITICAL'
                  ? 'border-red-500/50 text-red-400 bg-red-950/20'
                  : eng.status === 'WARNING'
                  ? 'border-amber-500/50 text-amber-300 bg-amber-950/20'
                  : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20';

              return (
                <button
                  key={eng.id}
                  onClick={() => setSelectedEngineId(eng.id)}
                  className={`px-2.5 py-1 rounded font-tactical text-[11px] transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? `ring-1 ring-[#00f0ff] ${statusColor} font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)]`
                      : 'border-[#3b494b]/40 text-[#b9cacb] bg-[#161b29]/60 hover:border-[#00f0ff]/40 hover:text-[#dee2f5]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      eng.status === 'CRITICAL'
                        ? 'bg-red-400 animate-ping'
                        : eng.status === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>{eng.displayId} ({eng.airframeId})</span>
                  <span className="font-telemetry text-[9px] opacity-75">
                    {eng.overallHealthPercent}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Mission Info Badge */}
          <div className="ml-auto hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161b29] border border-[#3b494b]/30 font-tactical text-[10px] text-[#b9cacb]">
            <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>MISSION:</span>
            <span className="text-[#dee2f5] font-bold">{selectedEngine.currentMission.callsign}</span>
            <span className="text-[#3b494b]">|</span>
            <span>ALT: <span className="text-[#00f0ff] font-telemetry">{selectedEngine.currentMission.altitudeFt.toLocaleString()} FT</span></span>
            <span className="text-[#3b494b]">|</span>
            <span>RUL: <span className={selectedEngine.rulHours < 30 ? 'text-red-400 font-bold' : selectedEngine.rulHours < 75 ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'}>{selectedEngine.rulHours}h</span></span>
          </div>
        </div>
      </div>

      {/* Quick Action Cluster */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          id="btnDirective"
          onClick={() => openModal('airworthiness')}
          className="px-3 py-2 rounded bg-[#252a38]/70 border border-[#3b494b]/40 hover:border-[#00f0ff] text-[#dee2f5] hover:text-[#00f0ff] transition-all font-tactical text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 text-[#00f0ff]" />
          <span>GENERATE AIRWORTHINESS DIRECTIVE</span>
        </button>

        <button
          id="btnApproveAll"
          onClick={approveAllPendingOrders}
          className="px-3 py-2 rounded bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#00363a] transition-all font-tactical text-[11px] shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center gap-1.5 cursor-pointer font-bold"
        >
          <CheckCircle className="w-4 h-4" />
          <span>APPROVE WORK ORDERS</span>
        </button>

        <button
          id="btnSyncERP"
          onClick={syncWithERP}
          disabled={isSyncingERP}
          className="px-3 py-2 rounded bg-[#252a38]/70 border border-[#3b494b]/40 hover:border-[#00f0ff] text-[#dee2f5] hover:text-[#00f0ff] transition-all font-tactical text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingERP ? 'animate-spin text-[#00f0ff]' : ''}`} />
          <span>{isSyncingERP ? 'SYNCHRONIZING ERP...' : 'SYNC WITH MRO ERP'}</span>
        </button>
      </div>
    </div>
  );
};

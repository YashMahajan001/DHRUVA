import React from 'react';
import { Radar, Download, Beaker, Radio, Activity } from 'lucide-react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';

export const ControlBar: React.FC = () => {
  const { runFullSweep, exportTelemetryLog, openModal, telemetry, selectedEngine, isLiveStreaming, alerts, mission } = useDashboard();

  const isDegraded = selectedEngine.healthPercent < 85 || alerts.length > 0 || selectedEngine.status !== 'NORMAL';
  const statusColor = isDegraded
    ? selectedEngine.healthPercent < 60 || selectedEngine.status === 'CRITICAL'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const statusText = selectedEngine.healthPercent < 60 || selectedEngine.status === 'CRITICAL'
    ? 'CRITICAL ALERT'
    : isDegraded
    ? 'ATTENTION REQUIRED'
    : 'NOMINAL';

  return (
    <div
      id="module-control-bar"
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111726]/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[#3b494b]/30 shadow-md"
    >
      {/* Title, Engine, and Overall Status */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-[#00f0ff] rounded-xs shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
          <h1 className="font-display text-lg font-bold text-[#dee2f5] tracking-tight">
            Fault Diagnosis
          </h1>
        </div>

        <span className="text-[#3b494b] font-mono">/</span>

        {/* Selected Engine & Airframe */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-semibold text-[#00f0ff]">{selectedEngine.name}</span>
          <span className="text-slate-500">({mission?.tailNumber || selectedEngine.callsign})</span>
        </div>

        {/* Overall Status Badge */}
        <div
          id="autonomic-reasoner-status"
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-mono font-semibold uppercase ${statusColor}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span>{statusText}</span>
        </div>

        {/* Refresh / Timestamp */}
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 pl-2 border-l border-[#3b494b]/30">
          <Activity className={`w-3 h-3 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span>LIVE 20Hz · UTC {telemetry.timestamp ? telemetry.timestamp.split(' ')[0] : 'ACTIVE'}</span>
        </div>
      </div>

      {/* Essential Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          id="btn-sweep"
          type="button"
          onClick={runFullSweep}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 bg-[#00f0ff]/15 hover:bg-[#00f0ff] hover:text-[#090e1b] text-[#00f0ff] font-mono text-xs rounded border border-[#00f0ff]/40 transition-colors font-semibold cursor-pointer"
        >
          <Radar className="w-3.5 h-3.5" />
          <span>Full Sweep</span>
        </button>

        <button
          id="btn-export"
          type="button"
          onClick={exportTelemetryLog}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 bg-[#161b29] hover:bg-[#202738] text-slate-300 hover:text-white font-mono text-xs rounded border border-[#3b494b]/40 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <button
          id="btn-sim-modal"
          type="button"
          onClick={() => openModal('scenario-sim')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 bg-[#161b29] hover:bg-[#202738] text-[#7df4ff] hover:text-white font-mono text-xs rounded border border-[#3b494b]/40 transition-colors cursor-pointer"
        >
          <Beaker className="w-3.5 h-3.5" />
          <span>Simulate</span>
        </button>
      </div>
    </div>
  );
};

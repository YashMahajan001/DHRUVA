import React from 'react';
import { Radar, Download, Beaker, Cpu } from 'lucide-react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';

export const ControlBar: React.FC = () => {
  const { runFullSweep, exportTelemetryLog, openModal, telemetry } = useDashboard();

  return (
    <div
      id="module-control-bar"
      className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 bg-[#161b29]/90 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-xl"
    >
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-7 bg-[#00f0ff] rounded-xs shadow-[0_0_8px_#00f0ff]"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-telemetry text-[9px] uppercase tracking-widest text-[#00f0ff]">
                MODULE DHRUVAA // DIAG-AI-V4
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#849495] tracking-wider">
                // UTC-STAMP: {telemetry.timestamp.split(' ')[0]}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl text-[#dee2f5] font-bold uppercase tracking-tight leading-tight">
              Fault Diagnostics &amp; Anomaly Resolution
            </h1>
          </div>
        </div>

        {/* Live status telemetry capsule */}
        <div
          id="autonomic-reasoner-status"
          className="flex items-center gap-2 bg-[#303443]/60 border border-[#3b494b]/40 px-3 py-1 rounded font-mono-telemetry text-xs text-[#b9cacb]"
        >
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_6px_#00f0ff]"></span>
          <span>AUTONOMIC REASONER: ONLINE (CYC-384ms)</span>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
        <button
          id="btn-sweep"
          type="button"
          onClick={runFullSweep}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#00f0ff]/15 hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#00f0ff]/40 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] font-semibold"
        >
          <Radar className="w-4 h-4" />
          <span>Run Full Sweep</span>
        </button>

        <button
          id="btn-export"
          type="button"
          onClick={exportTelemetryLog}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#1a1f2d] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#3b494b]/40 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Telemetry Log</span>
        </button>

        <button
          id="btn-sim-modal"
          type="button"
          onClick={() => openModal('scenario-sim')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#1a1f2d] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#3b494b]/40 transition-colors"
        >
          <Beaker className="w-4 h-4 text-[#7df4ff]" />
          <span>Simulate Scenario</span>
        </button>
      </div>
    </div>
  );
};

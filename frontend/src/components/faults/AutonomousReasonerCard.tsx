import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Cpu, AlertCircle } from 'lucide-react';

export const AutonomousReasonerCard: React.FC = () => {
  const { diagnosticInsight, selectedEngine } = useDashboard();

  return (
    <div
      id="autonomous-reasoner-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
            Autonomous Reasoner
          </span>
        </div>

        <span
          id="ai-status-pill"
          className={`font-mono-telemetry text-[9px] px-2 py-0.5 rounded bg-[#303443] font-bold tracking-wider ${diagnosticInsight.severityClass}`}
        >
          {selectedEngine.status === 'NORMAL' ? 'NOMINAL' : selectedEngine.status} // CONFIDENCE: {diagnosticInsight.autonomicConfidence.toFixed(1)}%
        </span>
      </div>

      {/* Detected Anomaly Headline */}
      <div className="flex flex-col gap-1">
        <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase tracking-wider">
          DETECTED ANOMALY
        </span>
        <h3
          id="anomaly-headline"
          className="font-display text-sm sm:text-base text-[#dee2f5] font-bold leading-snug"
        >
          {diagnosticInsight.detectedAnomaly}
        </h3>
      </div>

      {/* Severity Badge */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="font-mono-telemetry text-[9px] text-[#849495]">SEVERITY:</span>
        <span
          id="anomaly-severity-badge"
          className={`font-mono-telemetry text-[10px] px-2 py-0.5 rounded bg-[#303443] font-bold border border-[#3b494b]/40 shadow-sm ${diagnosticInsight.severityClass}`}
        >
          {diagnosticInsight.severityBadge}
        </span>
      </div>
    </div>
  );
};

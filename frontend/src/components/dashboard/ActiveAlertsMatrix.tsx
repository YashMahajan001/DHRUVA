import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AlertSeverity, FaultEvent } from '../../types';

interface ActiveAlertsMatrixProps {
  alerts: FaultEvent[];
  onInspectEngine: (engineIndex: number) => void;
  onDismissAlert: (id: string) => void;
}

export const ActiveAlertsMatrix: React.FC<ActiveAlertsMatrixProps> = ({
  alerts,
  onInspectEngine,
  onDismissAlert,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [inspectModalAlert, setInspectModalAlert] = useState<FaultEvent | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity === 'ALL') return true;
    return alert.severity === selectedSeverity;
  });

  return (
    <div
      id="active-alerts-matrix"
      className="bg-[#0c1220]/90 border border-[#00f0ff]/15 p-3 sm:p-3.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col gap-2.5"
    >
      {/* Alerts Matrix Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          <span className="text-sm font-semibold text-[#dee2f5]">
            Active Alerts
          </span>
        </div>
        <span className="text-xs text-[#849495]">
          {alerts.length} {alerts.length === 1 ? 'fault' : 'faults'}
        </span>
      </div>

      {/* Severity Filter Chips */}
      <div className="flex items-center gap-1 text-[9px] font-mono">
        {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              selectedSeverity === sev
                ? 'bg-[#252a38] text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                : 'text-[#849495] hover:text-[#dee2f5]'
            }`}
          >
            {sev === 'NORMAL' ? 'ADVISORY' : sev}
          </button>
        ))}
      </div>

      {/* Alert Items List */}
      <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="py-4 text-center text-[#849495] font-mono text-xs border border-dashed border-[#3b494b]/30 rounded">
            No active faults.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            const sevBadge = isCritical
              ? 'bg-[#ef4444]/20 text-[#ffb4ab] border-[#ef4444]/40'
              : isWarning
              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
              : 'bg-[#00f0ff]/15 text-[#00dbe9] border-[#00f0ff]/30';

            const engLabel = `ENG-0${alert.engineIndex + 1}`;

            return (
              <div
                key={alert.id}
                className="p-2 rounded bg-[#090e1b]/80 border border-[#3b494b]/30 hover:border-[#00f0ff]/40 flex items-center justify-between gap-2 transition-all text-xs"
              >
                <div 
                  className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  onClick={() => setInspectModalAlert(alert)}
                  title="Click to view full fault evidence"
                >
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border uppercase shrink-0 ${sevBadge}`}>
                    {alert.severity}
                  </span>
                  <span className="font-mono text-[10px] text-[#dee2f5] font-semibold shrink-0">
                    {engLabel}
                  </span>
                  <span className="text-[#849495]">·</span>
                  <span className="font-sans text-xs text-[#dee2f5] font-medium truncate">
                    {alert.title}
                  </span>
                  <span className="text-[#849495] hidden sm:inline">·</span>
                  <span className="text-[10px] font-mono text-[#849495] truncate hidden sm:inline">
                    {alert.component}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onInspectEngine(alert.engineIndex)}
                    className="px-2 py-0.5 bg-[#161f30] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] text-[10px] font-semibold rounded border border-[#00f0ff]/30 transition-all cursor-pointer"
                    title={`Inspect ${engLabel}`}
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="text-[#849495] hover:text-[#dee2f5] p-1 rounded hover:bg-[#161b29] transition-colors cursor-pointer"
                    title="Acknowledge alert"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Alert Modal if selected */}
      {inspectModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#161b29] border border-[#00f0ff]/50 p-4 rounded-xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#3b494b]/30">
              <span className="font-display font-bold text-sm text-[#dee2f5]">
                FAULT EVENT ISOLATION // {inspectModalAlert.id}
              </span>
              <button
                onClick={() => setInspectModalAlert(null)}
                className="text-[#849495] hover:text-[#dee2f5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3 text-xs flex flex-col gap-2">
              <p className="text-[#00f0ff] font-mono">{inspectModalAlert.title}</p>
              <p className="text-[#dee2f5]">{inspectModalAlert.description}</p>
              <div className="bg-[#090e1b] p-2 rounded text-[11px] font-mono text-[#849495]">
                COMPONENT: {inspectModalAlert.component}
                <br />
                ENGINE BUS: {inspectModalAlert.engineId}
                <br />
                LOG TIMESTAMP: {inspectModalAlert.timestamp}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#3b494b]/30">
              <button
                onClick={() => {
                  onInspectEngine(inspectModalAlert.engineIndex);
                  setInspectModalAlert(null);
                }}
                className="bg-[#00f0ff] text-[#00363a] font-mono text-xs px-3 py-1.5 rounded font-bold"
              >
                SWITCH TO {inspectModalAlert.engineId}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

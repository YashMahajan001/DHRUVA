import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AlertSeverity, FaultEvent } from '../types';

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
      className="bg-[#161b29] border border-[#3b494b]/30 p-3.5 rounded-xl shadow-lg flex flex-col gap-2.5"
    >
      {/* Alerts Matrix Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          <span className="font-display text-base font-bold text-[#dee2f5] tracking-wider uppercase">
            Active Alerts Matrix
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#849495] uppercase tracking-wider">
          {alerts.length} FLAGGED ANOMALIES
        </span>
      </div>

      {/* Severity Filter Chips */}
      <div className="flex items-center gap-1 text-[9px] font-mono">
        {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-2 py-0.5 rounded transition-colors ${
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
      <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="py-4 text-center text-[#849495] font-mono text-xs border border-dashed border-[#3b494b]/30 rounded">
            NO ACTIVE {selectedSeverity} ANOMALIES RECORDED
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            const bgClass = isCritical
              ? 'bg-[#93000a]/25 border border-[#ffb4ab]/30'
              : isWarning
              ? 'bg-[#252a38] border border-[#f59e0b]/30'
              : 'bg-[#252a38] border border-[#3b494b]/30';

            const dotClass = isCritical
              ? 'bg-[#ef4444] animate-pulse shadow-[0_0_6px_#ef4444]'
              : isWarning
              ? 'bg-[#f59e0b]'
              : 'bg-[#00dbe9]';

            const titleColor = isCritical
              ? 'text-[#ffb4ab]'
              : isWarning
              ? 'text-[#f59e0b]'
              : 'text-[#00dbe9]';

            return (
              <div
                key={alert.id}
                className={`p-2.5 rounded flex items-center justify-between gap-2 transition-all ${bgClass}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dotClass}`} />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono text-[11px] font-bold block ${titleColor}`}>
                        {alert.title}
                      </span>
                      <span className="font-mono text-[9px] text-[#849495]">
                        [{alert.timestamp}]
                      </span>
                    </div>
                    <span className="text-xs text-[#b9cacb] block leading-tight">
                      {alert.description}
                    </span>
                    <span className="font-mono text-[9px] text-[#849495] block mt-0.5">
                      SUBSYSTEM: {alert.component}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCritical && (
                    <button
                      onClick={() => onInspectEngine(alert.engineIndex)}
                      className="px-2.5 py-1 bg-[#ef4444] text-[#090e1b] font-mono text-[9px] font-bold rounded uppercase hover:opacity-90 transition-opacity cursor-pointer"
                      title="Isolate and inspect Engine 03"
                    >
                      INSPECT
                    </button>
                  )}

                  {isWarning && (
                    <button
                      onClick={() => onInspectEngine(alert.engineIndex)}
                      className="px-2.5 py-1 bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] border border-[#f59e0b]/40 font-mono text-[9px] font-bold rounded uppercase transition-colors cursor-pointer"
                      title="Diagnose thermal gradient on Engine 02"
                    >
                      DIAGNOSE
                    </button>
                  )}

                  {!isCritical && !isWarning && (
                    <span className="font-mono text-[9px] text-[#849495] font-bold px-2 py-1 bg-[#161b29] rounded border border-[#3b494b]/30">
                      NOMINAL
                    </span>
                  )}

                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="text-[#849495] hover:text-[#dee2f5] p-1 rounded hover:bg-[#161b29] transition-colors"
                    title="Acknowledge alert"
                  >
                    <X className="w-3.5 h-3.5" />
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

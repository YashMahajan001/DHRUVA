import React, { useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { AlertSeverity } from '../../types';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, Info, Check, ShieldAlert } from 'lucide-react';

export const ActiveAlertsModal: React.FC = () => {
  const {
    isAlertsModalOpen,
    setIsAlertsModalOpen,
    alerts,
    acknowledgeAlert
  } = useMissionDashboard();

  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');

  if (!isAlertsModalOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
            <AlertOctagon className="w-3 h-3 text-red-400" /> CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold">
            <AlertTriangle className="w-3 h-3 text-orange-400" /> WARNING
          </span>
        );
      case 'WATCH':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> WATCH
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> NORMAL
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-error-container/40 border border-error/50 flex items-center justify-center text-error">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-headline-sm text-sm text-on-surface font-bold uppercase">
                ACTIVE TELEMETRY ALERTS & ANOMALIES
              </h2>
              <span className="text-[10px] font-mono text-outline">
                AVIONICS BUS SENSOR FAULT DETECTOR
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAlertsModalOpen(false)}
            className="p-1.5 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Filter Bar */}
        <div className="bg-surface-container-lowest px-4 py-2 border-b border-outline-variant/20 flex items-center gap-2">
          <span className="text-[10px] font-mono text-outline uppercase">Filter:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'WATCH', 'NORMAL'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:text-on-surface bg-surface-container'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-xs">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-outline flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span>No active telemetry faults matching filter criteria.</span>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded border transition-all flex flex-col gap-2 ${
                  alert.acknowledged
                    ? 'bg-surface-container/60 border-outline-variant/20 opacity-80'
                    : 'bg-surface-container border-outline-variant/40 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="font-bold text-on-surface text-xs">{alert.code}</span>
                    <span className="text-[10px] text-outline">•</span>
                    <span className="text-[11px] text-primary">{alert.component}</span>
                  </div>
                  <span className="text-[10px] text-outline">{alert.timestamp}</span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {alert.description}
                </p>

                {alert.actionRequired && (
                  <div className="p-2 bg-surface-container-highest/60 rounded border border-outline-variant/20 text-[11px] text-amber-300 font-sans flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span><strong>Action Required:</strong> {alert.actionRequired}</span>
                  </div>
                )}

                <div className="flex items-center justify-end pt-1">
                  {alert.acknowledged ? (
                    <span className="text-[10px] text-outline flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface transition-colors cursor-pointer border border-outline-variant/30 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Acknowledge Alert
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-surface-container border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono text-outline">
          <span>DHRUVAA PROGNOSTIC SENSOR HARNESS</span>
          <button
            onClick={() => setIsAlertsModalOpen(false)}
            className="px-3 py-1 bg-surface-container-highest text-on-surface rounded hover:bg-surface-bright transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, AlertTriangle, AlertOctagon, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';
import { AlertSeverity } from '../../types/tuningTypes';

export const AlertsDrawer: React.FC = () => {
  const { 
    isAlertsDrawerOpen, 
    setIsAlertsDrawerOpen, 
    alerts, 
    acknowledgeAlert 
  } = useDashboard();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');

  if (!isAlertsDrawerOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'WATCH':
        return (
          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 uppercase flex items-center gap-1">
            <Eye className="w-3 h-3" />
            WATCH
          </span>
        );
      case 'NORMAL':
        return (
          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            NORMAL
          </span>
        );
    }
  };

  return (
    <div 
      id="alerts-drawer-overlay"
      className="fixed inset-0 z-50 bg-[#090e1b]/70 backdrop-blur-sm flex justify-end select-none"
      onClick={() => setIsAlertsDrawerOpen(false)}
    >
      <div 
        id="alerts-drawer-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#161b29] border-l border-[#3b494b]/30 h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-[#ffb4ab] w-5 h-5" />
              <div>
                <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5] uppercase tracking-wider">
                  ACTIVE PROPULSION ALERTS
                </h2>
                <span className="font-mono text-[9px] text-[#849495] tracking-widest uppercase">
                  STANAG TELEMETRY AUDIT TRAIL
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAlertsDrawerOpen(false)}
              className="p-1 rounded hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Severity Filters */}
          <div className="flex flex-wrap gap-1">
            {(['ALL', 'CRITICAL', 'WARNING', 'WATCH', 'NORMAL'] as const).map(sev => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  severityFilter === sev
                    ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-sm'
                    : 'bg-[#090e1b] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-2.5">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-[#849495] font-mono text-xs">
                No alerts matching category {severityFilter}
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-[#090e1b]/80 border rounded-lg p-3 space-y-2 transition-all ${
                    alert.severity === 'CRITICAL'
                      ? 'border-[#ffb4ab]/60 bg-[#93000a]/10'
                      : alert.severity === 'WARNING'
                      ? 'border-[#f59e0b]/40'
                      : 'border-[#3b494b]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {getSeverityBadge(alert.severity)}
                    <span className="font-mono text-[9px] text-[#849495]">
                      {alert.timestamp}
                    </span>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] text-[#7df4ff] font-bold uppercase tracking-wider">
                      {alert.subsystem} [{alert.id}]
                    </div>
                    <p className="text-xs text-[#dee2f5] mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>

                  {alert.value && (
                    <div className="flex justify-between font-mono text-[9px] text-[#849495] bg-[#161b29] p-1.5 rounded">
                      <span>MEASURED: <strong className="text-[#dee2f5]">{alert.value}</strong></span>
                      <span>THRESHOLD: <strong className="text-[#dee2f5]">{alert.threshold}</strong></span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    {alert.acknowledged ? (
                      <span className="font-mono text-[9px] text-[#10b981] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        ACKNOWLEDGED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 bg-[#252a38] hover:bg-[#303443] text-[#00f0ff] font-mono text-[9px] font-bold uppercase rounded border border-[#00f0ff]/30 transition-colors cursor-pointer"
                      >
                        ACKNOWLEDGE FAULT
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#3b494b]/20 text-center font-mono text-[9px] text-[#849495]">
          GROUND STATION AUDIT LOG // STANAG-4586
        </div>
      </div>
    </div>
  );
};

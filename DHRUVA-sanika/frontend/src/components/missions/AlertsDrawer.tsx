/**
 * DHRUVAA — Active Alerts & Diagnostics Drawer
 */

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Filter,
  Layers
} from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';
import { AlertSeverity } from '../../types/simulationTypes';

export const AlertsDrawer: React.FC = () => {
  const { 
    isAlertsOpen, 
    setIsAlertsOpen, 
    alerts, 
    triggerAutoRecovery, 
    isRecovering,
    clearAllFaults,
    selectedEngine 
  } = useDashboard();

  const [filterSeverity, setFilterSeverity] = useState<'ALL' | AlertSeverity>('ALL');

  if (!isAlertsOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-[#ef4444]" />,
          badge: 'bg-[#93000a] text-[#ffdad6] border-[#ef4444]',
          border: 'border-[#ef4444]/60'
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />,
          badge: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/50',
          border: 'border-[#f59e0b]/50'
        };
      case 'WATCH':
        return {
          icon: <AlertCircle className="w-4 h-4 text-[#b4c5ff]" />,
          badge: 'bg-[#b4c5ff]/20 text-[#b4c5ff] border-[#b4c5ff]/50',
          border: 'border-[#b4c5ff]/40'
        };
      case 'NORMAL':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-[#10b981]" />,
          badge: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
          border: 'border-[#10b981]/30'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#090e1b] border-l border-[#ef4444]/40 h-full shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#161b29] border-b border-[#3b494b]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#252a38] border border-[#ef4444]/50 flex items-center justify-center text-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono-telemetry text-sm font-bold text-[#dee2f5] tracking-wider uppercase flex items-center gap-2">
                ACTIVE PROPULSION ALERTS
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#849495]">
                SUBSYSTEM DIAGNOSTICS // {selectedEngine.id}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAlertsOpen(false)}
            className="p-1.5 rounded hover:bg-[#252a38] text-[#849495] hover:text-[#dee2f5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Filter Tabs */}
        <div className="px-4 py-2 bg-[#0e1320] border-b border-[#3b494b]/25 flex items-center gap-1.5 font-mono-telemetry text-[10px]">
          <Filter className="w-3 h-3 text-[#849495] mr-1" />
          {(['ALL', 'CRITICAL', 'WARNING', 'WATCH', 'NORMAL'] as Array<'ALL' | AlertSeverity>).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-1 rounded uppercase font-semibold transition-all cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-[#252a38] text-[#00f0ff] border border-[#00f0ff]/50'
                  : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5] border border-transparent'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 font-sans text-xs">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-[#849495] gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
              <span className="font-mono-telemetry text-xs text-[#dee2f5]">No alerts matching filter</span>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const style = getSeverityBadge(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg bg-[#161b29] border ${style.border} flex flex-col gap-2 transition-all shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {style.icon}
                      <span className="font-mono-telemetry text-xs font-bold text-[#dee2f5]">
                        {alert.component}
                      </span>
                    </div>
                    <span className={`font-mono-telemetry text-[9px] px-2 py-0.5 rounded uppercase font-bold border ${style.badge}`}>
                      {alert.severity}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[#dee2f5] leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/30 font-mono-telemetry text-[10px] text-[#b9cacb]">
                    {alert.details}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono-telemetry text-[#849495] pt-1 border-t border-[#3b494b]/20">
                    <span>SUBSYSTEM: {alert.subsystem}</span>
                    <span>LOG TIME: {alert.timestamp} UTC</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Actions Bottom Bar */}
        <div className="p-3 bg-[#161b29] border-t border-[#3b494b]/30 flex items-center justify-between gap-3">
          <button
            onClick={clearAllFaults}
            className="flex-1 py-2 rounded bg-[#252a38] hover:bg-[#303443] text-[#dee2f5] font-mono-telemetry text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Acknowledge & Clear All
          </button>
          <button
            onClick={triggerAutoRecovery}
            disabled={isRecovering}
            className="flex-1 py-2 rounded bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] font-mono-telemetry text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
            <span>{isRecovering ? 'Recovering...' : 'AI Auto-Recovery'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

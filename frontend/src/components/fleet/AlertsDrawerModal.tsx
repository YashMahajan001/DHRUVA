import React from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

interface AlertsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsDrawerModal: React.FC<AlertsDrawerModalProps> = ({ isOpen, onClose }) => {
  const { alerts, acknowledgeAlert, setSelectedEngineId } = useTelemetry();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 backdrop-blur-sm p-4">
      <div
        id="alerts-modal-panel"
        className="w-full max-w-2xl bg-[#090e1b] border border-[#00f0ff]/40 rounded-xl shadow-2xl p-5 flex flex-col gap-4 text-left relative max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-[#ffb4ab]" />
            <h3 className="font-headline-sm text-[18px] text-[#dee2f5] uppercase font-bold tracking-wider">
              ACTIVE PROPULSION TELEMETRY ALERTS
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-[#161b29] hover:bg-[#252a38] text-[#849495] hover:text-[#dee2f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto flex flex-col gap-2.5 pr-1 max-h-[55vh]">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const isWatch = alert.severity === 'WATCH';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border flex flex-col gap-2 transition-all ${
                  alert.acknowledged
                    ? 'bg-[#161b29]/40 border-[#3b494b]/20 opacity-60'
                    : isCritical
                    ? 'bg-[#93000a]/20 border-[#ffb4ab]/50'
                    : isWarning
                    ? 'bg-amber-500/15 border-amber-400/40'
                    : isWatch
                    ? 'bg-sky-500/10 border-sky-400/30'
                    : 'bg-[#161b29] border-[#3b494b]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-label-tactical text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isCritical
                          ? 'bg-[#93000a] text-[#ffdad6] animate-pulse border border-[#ffb4ab]/50'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : isWatch
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-[#dee2f5]">
                      {alert.uavCallsign} — {alert.component}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#849495] shrink-0">
                    {alert.timestamp}
                  </span>
                </div>

                <p className="font-body-md text-[13px] text-[#dee2f5] font-mono leading-relaxed">
                  {alert.description}
                </p>

                {alert.recommendedAction && (
                  <div className="text-[11px] font-mono text-[#00f0ff] bg-[#090e1b] px-2 py-1 rounded border border-[#00f0ff]/20">
                    RECOMMENDED: {alert.recommendedAction}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#3b494b]/20">
                  <span className="text-[10px] font-mono text-[#849495]">
                    AI Confidence: {alert.confidencePct}%
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEngineId(alert.engineId);
                        onClose();
                      }}
                      className="px-2 py-1 text-[10px] font-mono rounded bg-[#252a38] hover:bg-[#343948] text-[#00f0ff] transition-colors"
                    >
                      Inspect Engine
                    </button>

                    {!alert.acknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-[#00f0ff] hover:bg-[#00dbe9] text-[#002022] transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#3b494b]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252a38] hover:bg-[#343948] text-[#dee2f5] rounded text-[11px] font-mono uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

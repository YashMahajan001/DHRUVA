import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast } = useDashboard();

  if (!toast.show) return null;

  let Icon = Info;
  let iconColor = 'text-[#00f0ff]';
  let borderColor = 'border-[#00f0ff]/40';

  if (toast.type === 'success') {
    Icon = CheckCircle;
    iconColor = 'text-[#10b981]';
    borderColor = 'border-[#10b981]/50';
  } else if (toast.type === 'warning') {
    Icon = AlertTriangle;
    iconColor = 'text-[#f59e0b]';
    borderColor = 'border-[#f59e0b]/50';
  } else if (toast.type === 'error') {
    Icon = AlertOctagon;
    iconColor = 'text-[#ef4444]';
    borderColor = 'border-[#ef4444]/50';
  }

  return (
    <div
      id="tactical-toast"
      className={`fixed bottom-6 right-6 z-50 bg-[#1a1f2d]/95 backdrop-blur-md px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-3 border ${borderColor} animate-in slide-in-from-bottom-5 duration-300`}
    >
      <Icon className={`w-5 h-5 ${iconColor} shrink-0`} />
      <span className="font-mono-telemetry text-xs text-[#dee2f5] max-w-sm">
        {toast.message}
      </span>
    </div>
  );
};

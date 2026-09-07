import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  title?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  title,
  type = 'info',
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#00f0ff] shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (type) {
      case 'error':
        return 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      case 'warning':
        return 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]';
      case 'success':
        return 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
      default:
        return 'border-[#00f0ff]/60 shadow-[0_0_20px_rgba(0,240,255,0.25)]';
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100 max-w-md pointer-events-auto"
      role="alert"
    >
      <div className={`p-3.5 rounded bg-[#161b29]/95 backdrop-blur-md border ${getBorder()} text-[#dee2f5] flex items-start gap-3 shadow-2xl`}>
        {getIcon()}
        <div className="flex flex-col flex-1 pr-2">
          {title && (
            <span className="font-mono text-xs text-[#00f0ff] font-bold uppercase tracking-wider">
              {title}
            </span>
          )}
          <span className="font-sans text-xs text-[#b9cacb] mt-0.5 leading-snug">
            {message}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#849495] hover:text-[#dee2f5] transition-colors p-1"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

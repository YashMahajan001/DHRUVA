import React from 'react';
import { ArrowRight, Activity, Gauge, Compass, Layers, Sliders, Zap } from 'lucide-react';
import { SuggestedActionItem } from '../../types';

interface SuggestedActionsProps {
  actions: SuggestedActionItem[];
  onSelectAction: (query: string) => void;
  disabled?: boolean;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  actions,
  onSelectAction,
  disabled = false,
}) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="pt-1 flex flex-col gap-1 border-t border-[#3b494b]/30">
      <span className="text-[8px] font-mono text-[#849495] uppercase font-bold tracking-wider">
        SUGGESTED NEXT ANALYSIS:
      </span>

      <div className="flex flex-wrap gap-1">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAction(act.query)}
            disabled={disabled}
            className="font-mono text-[8.5px] px-2 py-0.5 rounded bg-[#161f30] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#7df4ff] border border-[#00f0ff]/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <span>{act.label}</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-75" />
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, Flame, Gauge, Zap } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  delta?: string;
  status?: 'nominal' | 'warning' | 'critical' | 'info';
  iconType?: 'health' | 'thermal' | 'vibration' | 'throttle' | 'rul';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  delta,
  status = 'nominal',
  iconType,
}) => {
  let borderBg = 'border-[#3b494b]/40 bg-[#0d121f]/90 text-[#dee2f5]';
  let badgeColor = 'text-[#7df4ff] bg-[#00f0ff]/10';

  if (status === 'warning') {
    borderBg = 'border-[#f59e0b]/40 bg-[#f59e0b]/5 text-[#fef3c7]';
    badgeColor = 'text-[#f59e0b] bg-[#f59e0b]/15';
  } else if (status === 'critical') {
    borderBg = 'border-[#ef4444]/40 bg-[#ef4444]/5 text-[#fee2e2]';
    badgeColor = 'text-[#ef4444] bg-[#ef4444]/15';
  } else if (status === 'nominal') {
    borderBg = 'border-[#10b981]/30 bg-[#10b981]/5 text-[#d1fae5]';
    badgeColor = 'text-[#10b981] bg-[#10b981]/15';
  }

  const renderIcon = () => {
    switch (iconType) {
      case 'thermal':
        return <Flame className="w-3 h-3 text-[#f59e0b]" />;
      case 'vibration':
        return <Activity className="w-3 h-3 text-[#ef4444]" />;
      case 'throttle':
        return <Zap className="w-3 h-3 text-[#00f0ff]" />;
      case 'health':
      default:
        return <Gauge className="w-3 h-3 text-[#00dbe9]" />;
    }
  };

  return (
    <div className={`p-2 rounded-lg border flex flex-col justify-between ${borderBg}`}>
      <div className="flex items-center justify-between text-[8.5px] font-mono text-[#849495] uppercase">
        <span className="flex items-center gap-1 font-semibold">
          {renderIcon()}
          {label}
        </span>
        {delta && <span className={`px-1 py-0.2 rounded font-bold ${badgeColor}`}>{delta}</span>}
      </div>

      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-sm font-bold font-mono text-[#dee2f5]">{value}</span>
        {subValue && <span className="text-[8.5px] font-mono text-[#849495]">{subValue}</span>}
      </div>
    </div>
  );
};

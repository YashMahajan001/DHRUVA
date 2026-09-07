import React from 'react';
import { Activity, Clock } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TelemetryHistoryPoint } from '../../types';

interface TelemetryTrendChartProps {
  historyData: TelemetryHistoryPoint[];
  selectedMetrics: string[];
  onToggleMetric: (metric: string) => void;
  selectedTimeRange: '1m' | '5m' | '15m' | '30m' | '1h';
  onSelectTimeRange: (range: '1m' | '5m' | '15m' | '30m' | '1h') => void;
}

export const TelemetryTrendChart: React.FC<TelemetryTrendChartProps> = ({
  historyData,
  selectedMetrics,
  onToggleMetric,
  selectedTimeRange,
  onSelectTimeRange,
}) => {
  // Normalize metrics for stacked or comparable display, or display actual values with multiple axes
  // For telemetry engineers, normalized 0-100% or multi-line scaling allows viewing RPM (2400), CHT (180), and OIL (80) on the same tactical chart
  const formattedData = historyData.map((pt, idx) => {
    const totalPoints = historyData.length;
    const offsetSec = (totalPoints - 1 - idx) * 2;
    const timeLabel = offsetSec === 0 ? 'T-0' : `-${offsetSec}s`;

    return {
      ...pt,
      timeLabel,
      // Normalized indices (0-100) for clean comparison
      rpmNorm: Math.min(100, Math.max(0, ((pt.rpm - 1800) / (2700 - 1800)) * 100)),
      chtNorm: Math.min(100, Math.max(0, ((pt.cht - 140) / (240 - 140)) * 100)),
      oilNorm: Math.min(100, Math.max(0, (pt.oil / 100) * 100)),
      egtNorm: Math.min(100, Math.max(0, ((pt.egt - 550) / (850 - 550)) * 100)),
      vibNorm: Math.min(100, Math.max(0, (pt.vibration / 5.5) * 100)),
    };
  });

  const metricsConfig = [
    { key: 'rpm', normKey: 'rpmNorm', label: 'RPM', color: '#00f0ff', unit: 'RPM', rawKey: 'rpm' },
    { key: 'cht', normKey: 'chtNorm', label: 'CHT', color: '#f59e0b', unit: '°C', rawKey: 'cht' },
    { key: 'oil', normKey: 'oilNorm', label: 'OIL PSI', color: '#10b981', unit: 'PSI', rawKey: 'oil' },
    { key: 'egt', normKey: 'egtNorm', label: 'EGT', color: '#dbfcff', unit: '°C', rawKey: 'egt' },
    { key: 'vibration', normKey: 'vibNorm', label: 'VIB', color: '#ef4444', unit: 'mm/s', rawKey: 'vibration' },
  ];

  return (
    <div
      id="telemetry-trend-panel"
      className="bg-[#161b29] border border-[#3b494b]/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between h-full"
    >
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-display text-base font-bold text-[#dee2f5] uppercase tracking-wide">
            Live Telemetry Trend
          </span>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-[#090e1b] p-0.5 rounded border border-[#3b494b]/30">
          <Clock className="w-3 h-3 text-[#849495] ml-1.5" />
          {(['1m', '5m', '15m', '30m', '1h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onSelectTimeRange(r)}
              className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase transition-colors ${
                selectedTimeRange === r
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                  : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {metricsConfig.map((m) => {
            const isSelected = selectedMetrics.includes(m.key);
            return (
              <button
                key={m.key}
                onClick={() => onToggleMetric(m.key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                  isSelected
                    ? 'bg-[#252a38] border-current font-bold'
                    : 'bg-transparent border-transparent opacity-40 hover:opacity-80'
                }`}
                style={{ color: m.color }}
                title={`Toggle ${m.label} on trend line`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts High-Precision Telemetry Trend Area */}
      <div className="w-full h-44 bg-[#090e1b] rounded border border-[#3b494b]/30 p-1.5 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="oilGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="egtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dbfcff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#dbfcff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 148, 149, 0.15)" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#849495"
              fontSize={9}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#849495"
              fontSize={9}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TelemetryHistoryPoint & { timeLabel: string };
                  return (
                    <div className="bg-[#090e1b]/95 border border-[#00f0ff]/50 p-2.5 rounded shadow-2xl font-mono text-[10px] backdrop-blur-md">
                      <div className="text-[#849495] border-b border-[#3b494b]/30 pb-1 mb-1 font-bold">
                        POINT: {data.timeLabel} // REAL-TIME LOG
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#00f0ff]">
                          CORE RPM: <strong className="text-white">{Math.round(data.rpm)}</strong>
                        </span>
                        <span className="text-[#f59e0b]">
                          CYL HEAD CHT: <strong className="text-white">{Math.round(data.cht)} °C</strong>
                        </span>
                        <span className="text-[#10b981]">
                          OIL PRESSURE: <strong className="text-white">{Math.round(data.oil)} PSI</strong>
                        </span>
                        <span className="text-[#dbfcff]">
                          EXHAUST EGT: <strong className="text-white">{Math.round(data.egt)} °C</strong>
                        </span>
                        <span className="text-[#ef4444]">
                          VIBRATION: <strong className="text-white">{data.vibration.toFixed(1)} mm/s</strong>
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {selectedMetrics.includes('rpm') && (
              <Area
                type="monotone"
                dataKey="rpmNorm"
                stroke="#00f0ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rpmGrad)"
                isAnimationActive={false}
              />
            )}

            {selectedMetrics.includes('cht') && (
              <Area
                type="monotone"
                dataKey="chtNorm"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chtGrad)"
                isAnimationActive={false}
              />
            )}

            {selectedMetrics.includes('oil') && (
              <Area
                type="monotone"
                dataKey="oilNorm"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#oilGrad)"
                isAnimationActive={false}
              />
            )}

            {selectedMetrics.includes('egt') && (
              <Area
                type="monotone"
                dataKey="egtNorm"
                stroke="#dbfcff"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#egtGrad)"
                isAnimationActive={false}
              />
            )}

            {selectedMetrics.includes('vibration') && (
              <Area
                type="monotone"
                dataKey="vibNorm"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="transparent"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Scale Legend Bar */}
      <div className="flex justify-between items-center text-[#849495] font-mono text-[9px] mt-1">
        <span>-60 SEC</span>
        <span>-45 SEC</span>
        <span>-30 SEC</span>
        <span>-15 SEC</span>
        <span className="text-[#00f0ff] font-bold">REAL-TIME T-0</span>
      </div>
    </div>
  );
};

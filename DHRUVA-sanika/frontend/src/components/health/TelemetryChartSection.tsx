/**
 * DHRUVAA Functional Telemetry Timeline & Engine Health Trend Chart
 */
import React, { useMemo } from 'react';
import { useMission, ChartMetric, TimeRange } from '../../context/MaintenanceContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const TelemetryChartSection: React.FC = () => {
  const {
    selectedEngine,
    timeRange,
    setTimeRange,
    selectedMetric,
    setSelectedMetric
  } = useMission();

  const metricConfig: Record<
    ChartMetric | 'health',
    {
      label: string;
      unit: string;
      color: string;
      fill: string;
      warningThreshold?: number;
      criticalThreshold?: number;
      nominalBase: number;
    }
  > = {
    cht: {
      label: 'Cylinder Head Temperature (CHT)',
      unit: '°C',
      color: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.12)',
      warningThreshold: 185,
      criticalThreshold: 205,
      nominalBase: 160
    },
    egt: {
      label: 'Exhaust Gas Temperature (EGT)',
      unit: '°C',
      color: '#00f0ff',
      fill: 'rgba(0, 240, 255, 0.12)',
      warningThreshold: 780,
      criticalThreshold: 820,
      nominalBase: 740
    },
    rpm: {
      label: 'Crankshaft Speed (RPM)',
      unit: 'RPM',
      color: '#10b981',
      fill: 'rgba(16, 185, 129, 0.12)',
      warningThreshold: 2200,
      nominalBase: 2500
    },
    vibration: {
      label: 'Harmonic Vibration Amplitude',
      unit: 'mm/s',
      color: '#ef4444',
      fill: 'rgba(239, 68, 68, 0.15)',
      warningThreshold: 2.0,
      criticalThreshold: 3.2,
      nominalBase: 1.0
    },
    oilPressure: {
      label: 'Main Gallery Oil Pressure',
      unit: 'PSI',
      color: '#00dbe9',
      fill: 'rgba(0, 219, 233, 0.12)',
      warningThreshold: 55,
      criticalThreshold: 45,
      nominalBase: 65
    },
    fuelFlow: {
      label: 'Fuel Flow Rate',
      unit: 'GPH',
      color: '#7bd0ff',
      fill: 'rgba(123, 208, 255, 0.12)',
      nominalBase: 14.0
    },
    health: {
      label: 'Historical Engine Health Trend',
      unit: '%',
      color: '#10b981',
      fill: 'rgba(16, 185, 129, 0.15)',
      warningThreshold: 75,
      criticalThreshold: 50,
      nominalBase: 90
    }
  };

  const currentConfig = metricConfig[selectedMetric] || metricConfig.cht;

  // Prepare chart data slice based on time range
  const chartData = useMemo(() => {
    const history = selectedEngine.telemetryHistory;
    let sliceCount = 30;
    if (timeRange === '15M') sliceCount = 15;
    if (timeRange === '1H') sliceCount = 25;
    if (timeRange === '6H') sliceCount = 35;
    if (timeRange === '24H') sliceCount = 40;

    return history.slice(-sliceCount).map((pt, idx) => ({
      ...pt,
      displayTime: pt.timestamp,
      metricValue: pt[selectedMetric] ?? pt.cht,
      healthValue: selectedEngine.overallHealthPercent - Math.max(0, (sliceCount - idx) * 0.15)
    }));
  }, [selectedEngine, selectedMetric, timeRange]);

  const timeRanges: TimeRange[] = ['15M', '1H', '6H', '24H', 'LIVE'];
  const metrics: { id: ChartMetric; label: string }[] = [
    { id: 'cht', label: 'CHT' },
    { id: 'egt', label: 'EGT' },
    { id: 'rpm', label: 'RPM' },
    { id: 'vibration', label: 'VIBRATION' },
    { id: 'oilPressure', label: 'OIL PRESS' },
    { id: 'fuelFlow', label: 'FUEL FLOW' },
  ];

  return (
    <div className="p-4 rounded bg-[#090e1b]/85 border border-[#3b494b]/30 flex flex-col gap-3 relative shadow-[0_0_20px_rgba(0,0,0,0.4)]">
      <ReticleCorner color="#00f0ff" size={6} />

      {/* Header with Metric & Time Range Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b494b]/30 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00f0ff]" />
          <h3 className="font-headline text-sm text-[#dee2f5] uppercase tracking-wide font-semibold">
            TELEMETRY TIMELINE &amp; ENGINE HEALTH SPECTRUM
          </h3>
          <span className="font-telemetry text-[10px] text-[#00dbe9] uppercase hidden sm:inline-block">
            [{currentConfig.label}]
          </span>
        </div>

        {/* Controls: Metric Chips & Time Ranges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Tabs */}
          <div className="flex rounded bg-[#161b29] border border-[#3b494b]/30 p-0.5">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
                  selectedMetric === m.id
                    ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'text-[#b9cacb] hover:text-[#dee2f5]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex rounded bg-[#161b29] border border-[#3b494b]/30 p-0.5">
            {timeRanges.map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
                  timeRange === tr
                    ? 'bg-[#252a38] text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                    : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#3b494b" strokeOpacity={0.25} />

            <XAxis
              dataKey="displayTime"
              stroke="#849495"
              tick={{ fill: '#849495', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#3b494b', strokeOpacity: 0.4 }}
            />

            <YAxis
              stroke="#849495"
              tick={{ fill: '#849495', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#3b494b', strokeOpacity: 0.4 }}
              domain={['auto', 'auto']}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const dataPoint = payload[0].payload;
                return (
                  <div className="p-2.5 rounded bg-[#161b29]/95 border border-[#00f0ff]/50 shadow-xl backdrop-blur-md flex flex-col gap-1 font-telemetry text-[10px]">
                    <span className="text-[#849495] uppercase">{label} UTC</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#b9cacb] font-semibold">{currentConfig.label}:</span>
                      <span className="text-[#00f0ff] font-bold text-xs">
                        {dataPoint.metricValue} {currentConfig.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] border-t border-[#3b494b]/30 pt-1 text-[#849495]">
                      <span>Airframe: {selectedEngine.airframeId}</span>
                      <span>Health: {selectedEngine.overallHealthPercent}%</span>
                    </div>
                  </div>
                );
              }}
            />

            {currentConfig.warningThreshold && (
              <ReferenceLine
                y={currentConfig.warningThreshold}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: `WARN: ${currentConfig.warningThreshold}`,
                  fill: '#f59e0b',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight'
                }}
              />
            )}

            {currentConfig.criticalThreshold && (
              <ReferenceLine
                y={currentConfig.criticalThreshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                label={{
                  value: `CRIT: ${currentConfig.criticalThreshold}`,
                  fill: '#ef4444',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight'
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="metricValue"
              stroke={currentConfig.color}
              strokeWidth={2}
              fill="url(#metricGrad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Live Engine Health Correlation */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#b9cacb] pt-1 border-t border-[#3b494b]/20 font-body">
        <div className="flex items-center gap-2">
          <span className="font-telemetry text-[10px] text-[#849495] uppercase">
            HEALTH STATUS:
          </span>
          <span
            className={`font-tactical text-[11px] font-bold uppercase ${
              selectedEngine.status === 'CRITICAL'
                ? 'text-red-400'
                : selectedEngine.status === 'WARNING'
                ? 'text-amber-300'
                : 'text-emerald-400'
            }`}
          >
            {selectedEngine.status} ({selectedEngine.overallHealthPercent}%)
          </span>
          <span className="text-[#3b494b]">•</span>
          <span className="font-telemetry text-[10px] text-[#849495]">
            RUL: <strong className="text-[#dee2f5]">{selectedEngine.rulHours} FLIGHT HRS</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 font-telemetry text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>NOMINAL BASELINE</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>ADVISORY BAND</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>CRITICAL LIMIT</span>
          </span>
        </div>
      </div>
    </div>
  );
};

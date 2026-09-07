/**
 * DHRUVAA — Functional Aerospace Telemetry Chart Card (Center Column)
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useDashboard, ChartMetricMode, TimeRangeMode } from '../../context/MissionSimulationContext';

export const TelemetryChartCard: React.FC = () => {
  const { 
    historicalTrend, 
    chartMetric, 
    setChartMetric, 
    timeRange, 
    setTimeRange,
    telemetry
  } = useDashboard();

  const getMetricConfig = () => {
    switch (chartMetric) {
      case 'ALT_BHP':
        return {
          title: 'ALTITUDE & POWER PROFILE CORRELATION',
          line1Key: 'altitude',
          line1Name: 'ALTITUDE (x1000 FT)',
          line1Color: '#00f0ff',
          line1Unit: ' kFT',
          line2Key: 'engineBhp',
          line2Name: 'ENGINE BHP (%)',
          line2Color: '#b4c5ff',
          line2Unit: '%'
        };
      case 'RPM_FUEL':
        return {
          title: 'RPM & INSTANTANEOUS FUEL BURN RATE',
          line1Key: 'rpm',
          line1Name: 'RPM (CRANKSHAFT)',
          line1Color: '#00f0ff',
          line1Unit: ' RPM',
          line2Key: 'fuelFlow',
          line2Name: 'FUEL BURN (L/HR)',
          line2Color: '#10b981',
          line2Unit: ' L/HR'
        };
      case 'THERMAL':
        return {
          title: 'THERMAL CORE MATRIX: CHT & EGT PEAK',
          line1Key: 'cht',
          line1Name: 'AVG CHT (°C)',
          line1Color: '#f59e0b',
          line1Unit: '°C',
          line2Key: 'egt',
          line2Name: 'EGT PEAK (°C)',
          line2Color: '#ef4444',
          line2Unit: '°C'
        };
      case 'VIBE_HEALTH':
        return {
          title: 'VIBRATION HARMONICS & TWIN HEALTH SCORE',
          line1Key: 'vibration',
          line1Name: 'VIBRATION RMS (mm/s)',
          line1Color: '#b4c5ff',
          line1Unit: ' mm/s',
          line2Key: 'health',
          line2Name: 'TWIN HEALTH (%)',
          line2Color: '#00f0ff',
          line2Unit: '%'
        };
      default:
        return {
          title: 'ALTITUDE & POWER PROFILE CORRELATION',
          line1Key: 'altitude',
          line1Name: 'ALTITUDE (x1000 FT)',
          line1Color: '#00f0ff',
          line1Unit: ' kFT',
          line2Key: 'engineBhp',
          line2Name: 'ENGINE BHP (%)',
          line2Color: '#b4c5ff',
          line2Unit: '%'
        };
    }
  };

  const config = getMetricConfig();

  return (
    <div className="bg-[#161b29]/90 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2">
      {/* Chart Header & Metric Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            {config.title}
          </span>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-3 font-mono-telemetry text-[10px]">
          {/* Active Lines Legend */}
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: config.line1Color }} />
            <span className="text-[#b9cacb]">{config.line1Name}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ backgroundColor: config.line2Color }} />
            <span className="text-[#b9cacb]">{config.line2Name}</span>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center bg-[#090e1b] rounded p-0.5 border border-[#3b494b]/30">
            {(['5M', '15M', '1H', 'ALL'] as TimeRangeMode[]).map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  timeRange === tr 
                    ? 'bg-[#252a38] text-[#00f0ff] font-bold shadow-[0_0_6px_rgba(0,240,255,0.25)]' 
                    : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Mode Tabs */}
      <div className="flex items-center gap-1 font-mono-telemetry text-[10px] pb-1 border-b border-[#3b494b]/20">
        <span className="text-[#849495] text-[9px] mr-1 uppercase">METRICS:</span>
        {(
          [
            { id: 'ALT_BHP', label: 'ALT & BHP' },
            { id: 'RPM_FUEL', label: 'RPM & FUEL FLOW' },
            { id: 'THERMAL', label: 'CHT & EGT THERMALS' },
            { id: 'VIBE_HEALTH', label: 'VIBRATION & HEALTH' }
          ] as Array<{ id: ChartMetricMode; label: string }>
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setChartMetric(m.id)}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              chartMetric === m.id
                ? 'bg-[#303443] text-[#00f0ff] font-semibold border border-[#00f0ff]/40'
                : 'bg-[#090e1b] text-[#849495] hover:text-[#dee2f5] border border-transparent'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Responsive Recharts Container */}
      <div className="relative w-full h-40 bg-[#090e1b] rounded p-2 overflow-hidden border border-[#3b494b]/25">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b494b" opacity={0.25} />
            <XAxis 
              dataKey="minute" 
              stroke="#849495" 
              fontSize={10} 
              tickLine={false}
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              yAxisId="left"
              stroke="#849495" 
              fontSize={10} 
              tickLine={false}
              fontFamily="JetBrains Mono"
              domain={['auto', 'auto']}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#849495" 
              fontSize={10} 
              tickLine={false}
              fontFamily="JetBrains Mono"
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#090e1b]/95 backdrop-blur-md p-2 rounded border border-[#00f0ff]/40 shadow-xl font-mono-telemetry text-xs">
                      <p className="text-[#849495] text-[10px] mb-1 font-semibold">{label}</p>
                      {payload.map((entry, idx) => (
                        <p key={idx} className="flex items-center gap-2" style={{ color: entry.color }}>
                          <span>{entry.name}:</span>
                          <span className="font-bold text-[#dee2f5]">{entry.value}</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={config.line1Key}
              name={config.line1Name}
              stroke={config.line1Color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={config.line2Key}
              name={config.line2Name}
              stroke={config.line2Color}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute bottom-1 right-2 font-mono-telemetry text-[8px] text-[#849495] pointer-events-none">
          T-MINUTES TIMELINE // LIVE DUAL STREAM
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, Clock, Filter } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useDashboard, ChartMetricType, TimeRangeType } from '../../context/MissionTuningContext';

export const ComparativeVisualization: React.FC = () => {
  const { 
    telemetryHistory, 
    selectedTimeRange, 
    setSelectedTimeRange,
    selectedChartMetric,
    setSelectedChartMetric,
    candidates 
  } = useDashboard();

  const [activeViewMode, setActiveViewMode] = useState<'pareto' | 'timeseries'>('pareto');

  // Filter history based on time range
  const filteredData = React.useMemo(() => {
    const total = telemetryHistory.length;
    if (selectedTimeRange === '1m') return telemetryHistory.slice(-12);
    if (selectedTimeRange === '5m') return telemetryHistory.slice(-25);
    if (selectedTimeRange === '15m') return telemetryHistory.slice(-35);
    return telemetryHistory;
  }, [telemetryHistory, selectedTimeRange]);

  // Alpha, Beta, Gamma data points
  const alpha = candidates[0];
  const beta = candidates[1];
  const gamma = candidates[2];

  return (
    <div 
      id="comparative-visualization-panel"
      className="bg-[#090e1b]/85 border border-[#3b494b]/30 rounded-lg p-3.5 space-y-3 shadow-inner"
    >
      {/* View Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3b494b]/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#b9cacb] uppercase font-bold tracking-wider">
            {activeViewMode === 'pareto' 
              ? 'THERMODYNAMIC SAFETY CEILING vs CRUISE PERSISTENCE' 
              : 'LIVE TELEMETRY STREAM & ENGINE HEALTH TREND'}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#161b29] p-0.5 rounded border border-[#3b494b]/30">
            <button
              id="view-pareto-tab"
              type="button"
              onClick={() => setActiveViewMode('pareto')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider transition-all ${
                activeViewMode === 'pareto'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-sm'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Pareto Bars
            </button>
            <button
              id="view-timeseries-tab"
              type="button"
              onClick={() => setActiveViewMode('timeseries')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider transition-all ${
                activeViewMode === 'timeseries'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-sm'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              <LineChartIcon className="w-3 h-3" />
              Live Charts
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: STITCH PARETO BARS */}
      {activeViewMode === 'pareto' && (
        <div>
          {/* Legend */}
          <div className="flex items-center justify-end gap-3 font-mono text-[9px] mb-2">
            <span className="flex items-center gap-1 text-[#b9cacb]">
              <span className="w-2 h-2 rounded-full bg-[#849495]" /> ALPHA
            </span>
            <span className="flex items-center gap-1 text-[#00f0ff] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" /> BETA (REC)
            </span>
            <span className="flex items-center gap-1 text-[#ffb4ab]">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> GAMMA
            </span>
          </div>

          {/* SVG Comparative Multi-Bar Visualization */}
          <div className="h-32 w-full flex items-end gap-6 pt-2 px-2">
            {/* Bar 1: Fuel Burn */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-2 h-20">
                <div 
                  className="w-3.5 bg-[#849495] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '75%' }} 
                  title={`Alpha: ${alpha.fuelBurnLh} L/h`} 
                />
                <div 
                  className="w-3.5 bg-[#00f0ff] rounded-t transition-all shadow-[0_0_8px_rgba(0,240,255,0.4)] hover:brightness-125 cursor-pointer" 
                  style={{ height: '60%' }} 
                  title={`Beta: ${beta.fuelBurnLh} L/h (-16.3% ECON)`} 
                />
                <div 
                  className="w-3.5 bg-[#ef4444] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '52%' }} 
                  title={`Gamma: ${gamma.fuelBurnLh} L/h`} 
                />
              </div>
              <span className="font-mono text-[9px] text-[#b9cacb] uppercase tracking-wider font-medium">Burn Rate</span>
            </div>

            {/* Bar 2: Peak CHT */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-2 h-20">
                <div 
                  className="w-3.5 bg-[#849495] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '65%' }} 
                  title={`Alpha: ${alpha.thermalCht}°C`} 
                />
                <div 
                  className="w-3.5 bg-[#00f0ff] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '70%' }} 
                  title={`Beta: ${beta.thermalCht}°C (+4°C STABLE)`} 
                />
                <div 
                  className="w-3.5 bg-[#ef4444] rounded-t transition-all animate-pulse hover:brightness-125 cursor-pointer" 
                  style={{ height: '98%' }} 
                  title={`Gamma: ${gamma.thermalCht}°C (LIMIT EXCEEDED)`} 
                />
              </div>
              <span className="font-mono text-[9px] text-[#b9cacb] uppercase tracking-wider font-medium">Peak CHT</span>
            </div>

            {/* Bar 3: Loiter Endurance */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-2 h-20">
                <div 
                  className="w-3.5 bg-[#849495] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '70%' }} 
                  title={`Alpha: ${alpha.missionLoiterHours} hrs`} 
                />
                <div 
                  className="w-3.5 bg-[#00f0ff] rounded-t transition-all shadow-[0_0_8px_rgba(0,240,255,0.4)] hover:brightness-125 cursor-pointer" 
                  style={{ height: '92%' }} 
                  title={`Beta: ${beta.missionLoiterHours} hrs (+2.3 HRS TACTICAL)`} 
                />
                <div 
                  className="w-3.5 bg-[#ef4444] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '10%' }} 
                  title="Gamma: Aborted" 
                />
              </div>
              <span className="font-mono text-[9px] text-[#b9cacb] uppercase tracking-wider font-medium">Endurance</span>
            </div>

            {/* Bar 4: RUL Margin */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-2 h-20">
                <div 
                  className="w-3.5 bg-[#849495] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '85%' }} 
                  title={`Alpha: ${alpha.estRulHours} hrs`} 
                />
                <div 
                  className="w-3.5 bg-[#00f0ff] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '81%' }} 
                  title={`Beta: ${beta.estRulHours} hrs`} 
                />
                <div 
                  className="w-3.5 bg-[#ef4444] rounded-t transition-all hover:brightness-125 cursor-pointer" 
                  style={{ height: '25%' }} 
                  title={`Gamma: ${gamma.estRulHours} hrs (-66% CRIT)`} 
                />
              </div>
              <span className="font-mono text-[9px] text-[#b9cacb] uppercase tracking-wider font-medium">RUL Margin</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RECHARTS REAL-TIME STREAM */}
      {activeViewMode === 'timeseries' && (
        <div className="space-y-2">
          {/* Controls: Metric Selection & Time Range */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Metric Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedChartMetric('cht_egt')}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  selectedChartMetric === 'cht_egt'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                    : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                CHT &amp; EGT (°C)
              </button>
              <button
                type="button"
                onClick={() => setSelectedChartMetric('rpm_fuel')}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  selectedChartMetric === 'rpm_fuel'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                    : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                RPM vs Fuel Flow
              </button>
              <button
                type="button"
                onClick={() => setSelectedChartMetric('vibration')}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  selectedChartMetric === 'vibration'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                    : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                Vibration (g)
              </button>
              <button
                type="button"
                onClick={() => setSelectedChartMetric('health_trend')}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  selectedChartMetric === 'health_trend'
                    ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 font-bold'
                    : 'bg-[#161b29] text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                Health Trend (%)
              </button>
            </div>

            {/* Time Ranges */}
            <div className="flex items-center gap-1 font-mono text-[9px]">
              <Clock className="w-3 h-3 text-[#849495]" />
              {(['1m', '5m', '15m', '1h'] as TimeRangeType[]).map(tr => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setSelectedTimeRange(tr)}
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    selectedTimeRange === tr
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                      : 'text-[#849495] hover:text-[#dee2f5]'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Live Chart Canvas */}
          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid stroke="#252a38" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#849495" 
                  tick={{ fontSize: 9, fill: '#849495', fontFamily: 'JetBrains Mono' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#849495" 
                  tick={{ fontSize: 9, fill: '#849495', fontFamily: 'JetBrains Mono' }}
                  domain={['auto', 'auto']}
                  width={32}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090e1b', 
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  itemStyle={{ padding: '1px 0' }}
                />
                {selectedChartMetric === 'cht_egt' && (
                  <>
                    <Line type="monotone" dataKey="cht" stroke="#00f0ff" strokeWidth={1.5} dot={false} name="CHT (°C)" />
                    <Line type="monotone" dataKey="egt" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="EGT (°C)" />
                  </>
                )}
                {selectedChartMetric === 'rpm_fuel' && (
                  <>
                    <Line type="monotone" dataKey="rpm" stroke="#00f0ff" strokeWidth={1.5} dot={false} name="RPM" />
                    <Line type="monotone" dataKey="fuelFlow" stroke="#10b981" strokeWidth={1.5} dot={false} name="Fuel Flow (L/h)" />
                  </>
                )}
                {selectedChartMetric === 'vibration' && (
                  <Line type="monotone" dataKey="vibration" stroke="#ffb4ab" strokeWidth={1.5} dot={false} name="Vibration (g)" />
                )}
                {selectedChartMetric === 'health_trend' && (
                  <Line type="monotone" dataKey="health" stroke="#10b981" strokeWidth={2} dot={false} name="Engine Health (%)" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

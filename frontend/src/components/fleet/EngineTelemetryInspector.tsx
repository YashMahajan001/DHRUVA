import React, { useState } from 'react';
import {
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  Activity,
  Zap,
  Battery,
  Wind,
  Maximize2,
  Clock,
  Filter
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const EngineTelemetryInspector: React.FC = () => {
  const {
    selectedEngine,
    currentTelemetry,
    twinState,
    telemetryHistory,
    timeRange,
    setTimeRange,
    selectedChartMetric,
    setSelectedChartMetric
  } = useTelemetry();

  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const isCritical = selectedEngine.healthStatus === 'CRITICAL';
  const isWarning = selectedEngine.healthStatus === 'WARNING' || selectedEngine.healthStatus === 'WATCH';

  // Metrics list for charts
  const metricOptions: { id: typeof selectedChartMetric; label: string; unit: string; color: string }[] = [
    { id: 'cht', label: 'CHT (Cyl Head Temp)', unit: '°C', color: '#00f0ff' },
    { id: 'rpm', label: 'Engine Speed', unit: 'RPM', color: '#10b981' },
    { id: 'egt', label: 'Exhaust Gas Temp', unit: '°C', color: '#f59e0b' },
    { id: 'oilPressure', label: 'Oil Pressure', unit: 'PSI', color: '#60a5fa' },
    { id: 'vibration', label: 'Vibration RMS', unit: 'g', color: '#ef4444' },
    { id: 'fuelFlow', label: 'Fuel Flow Rate', unit: 'L/hr', color: '#a78bfa' },
    { id: 'health', label: 'Health Index', unit: '%', color: '#34d399' }
  ];

  const currentOption = metricOptions.find(m => m.id === selectedChartMetric) || metricOptions[0];

  // Calculate chart boundaries
  const values = telemetryHistory.map(p => (p as any)[selectedChartMetric] || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.15;
  const chartMin = Math.max(0, Math.floor(minVal - padding));
  const chartMax = Math.ceil(maxVal + padding);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 160;

  const points = telemetryHistory.map((pt, i) => {
    const val = (pt as any)[selectedChartMetric] || 0;
    const x = (i / (telemetryHistory.length - 1 || 1)) * svgWidth;
    const y = svgHeight - ((val - chartMin) / (chartMax - chartMin || 1)) * (svgHeight - 20) - 10;
    return { x, y, val, pt };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z` : '';

  return (
    <div
      id="engine-telemetry-inspector"
      className="bg-[#161b29]/95 rounded-xl p-5 shadow-xl border border-[#3b494b]/30 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Header with Engine Health & RUL Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3b494b]/30 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#252a38] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[18px] text-[#dee2f5] font-bold">
                {selectedEngine.callsign} — {selectedEngine.model}
              </span>
              <span
                className={`font-label-tactical text-[11px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  isCritical
                    ? 'bg-[#93000a] text-[#ffdad6] animate-pulse border border-[#ffb4ab]/40'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {selectedEngine.statusLabel}
              </span>
            </div>
            <span className="font-label-micro text-[9.5px] text-[#849495] font-mono">
              ENGINE ID: {selectedEngine.id.toUpperCase()} // MISSION: {selectedEngine.missionName} // PHASE: {selectedEngine.missionPhase}
            </span>
          </div>
        </div>

        {/* Health & RUL Badge */}
        <div className="flex items-center gap-4 bg-[#090e1b] px-3.5 py-1.5 rounded-lg border border-[#3b494b]/30 font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#849495] uppercase">ENGINE HEALTH</span>
            <span
              className={`text-[18px] font-bold leading-tight ${
                isCritical ? 'text-[#ffb4ab]' : isWarning ? 'text-amber-300' : 'text-[#00f0ff]'
              }`}
            >
              {selectedEngine.healthPercentage}%
            </span>
          </div>
          <div className="w-[1px] h-7 bg-[#3b494b]"></div>
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-[#849495] uppercase">REMAINING USEFUL LIFE</span>
            <span
              className={`text-[18px] font-bold leading-tight ${
                selectedEngine.rulHours < 20 ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
              }`}
            >
              {selectedEngine.rulHours} <span className="text-[11px] text-[#849495] font-normal">HRS</span>
            </span>
          </div>
        </div>
      </div>

      {/* 9 Live Telemetry Parameter Gauges / Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. RPM */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>ENGINE RPM</span>
            <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#dee2f5] font-mono font-bold">
              {currentTelemetry.rpm}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">RPM</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono">Nominal: 2300-2600</span>
        </div>

        {/* 2. CHT */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between ${
            selectedEngine.id === 'uav-02'
              ? 'bg-amber-500/10 border-amber-400/40'
              : 'bg-[#252a38]/60 border-[#3b494b]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>MEAN CHT</span>
            <Thermometer className={`w-3.5 h-3.5 ${selectedEngine.id === 'uav-02' ? 'text-amber-400' : 'text-[#00f0ff]'}`} />
          </div>
          <div className="my-1">
            <span
              className={`font-telemetry-num-xl text-[20px] font-mono font-bold ${
                selectedEngine.id === 'uav-02' ? 'text-amber-300' : 'text-[#dee2f5]'
              }`}
            >
              {currentTelemetry.cht}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">°C</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">
            C1-C4: [{currentTelemetry.chtPerCylinder.join(', ')}]
          </span>
        </div>

        {/* 3. EGT */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>EXHAUST GAS (EGT)</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#dee2f5] font-mono font-bold">
              {currentTelemetry.egt}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">°C</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">Max limit: 850°C</span>
        </div>

        {/* 4. Oil Pressure */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between ${
            isCritical ? 'bg-[#93000a]/20 border-[#ffb4ab]/40' : 'bg-[#252a38]/60 border-[#3b494b]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>OIL PRESSURE</span>
            <Droplets className={`w-3.5 h-3.5 ${isCritical ? 'text-[#ffb4ab]' : 'text-[#60a5fa]'}`} />
          </div>
          <div className="my-1">
            <span
              className={`font-telemetry-num-xl text-[20px] font-mono font-bold ${
                isCritical ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
              }`}
            >
              {currentTelemetry.oilPressure}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">PSI</span>
          </div>
          <span
            className={`text-[9px] font-mono ${
              isCritical ? 'text-[#ffb4ab] font-bold' : 'text-[#849495]'
            }`}
          >
            {isCritical ? 'LOW PRESSURE WARNING' : 'Range: 55-75 PSI'}
          </span>
        </div>

        {/* 5. Oil Temperature */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between ${
            isCritical ? 'bg-[#93000a]/20 border-[#ffb4ab]/40' : 'bg-[#252a38]/60 border-[#3b494b]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>OIL TEMP</span>
            <Thermometer className="w-3.5 h-3.5 text-[#60a5fa]" />
          </div>
          <div className="my-1">
            <span
              className={`font-telemetry-num-xl text-[20px] font-mono font-bold ${
                isCritical ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
              }`}
            >
              {currentTelemetry.oilTemperature}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">°C</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">Normal: 75-95°C</span>
        </div>

        {/* 6. Fuel Flow */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>FUEL FLOW RATE</span>
            <Wind className="w-3.5 h-3.5 text-[#00dbe9]" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#00dbe9] font-mono font-bold">
              {currentTelemetry.fuelFlow}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">L/HR</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">PPH: {(currentTelemetry.fuelFlow * 1.58).toFixed(1)}</span>
        </div>

        {/* 7. Vibration */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between ${
            isCritical ? 'bg-[#93000a]/20 border-[#ffb4ab]/40' : 'bg-[#252a38]/60 border-[#3b494b]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>BEARING VIBRATION</span>
            <Activity className={`w-3.5 h-3.5 ${isCritical ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`} />
          </div>
          <div className="my-1">
            <span
              className={`font-telemetry-num-xl text-[20px] font-mono font-bold ${
                isCritical ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
              }`}
            >
              {currentTelemetry.vibration}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">g RMS</span>
          </div>
          <span
            className={`text-[9px] font-mono ${
              isCritical ? 'text-[#ffb4ab] font-bold' : 'text-emerald-400'
            }`}
          >
            {isCritical ? 'EXCEEDANCE @ 840Hz' : 'Baseline &lt; 0.35g'}
          </span>
        </div>

        {/* 8. Battery Voltage */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>BUS VOLTAGE</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#dee2f5] font-mono font-bold">
              {currentTelemetry.batteryVoltage}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">VDC</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">28V MIL-STD Bus</span>
        </div>

        {/* 9. Alternator Current */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>ALTERNATOR</span>
            <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#dee2f5] font-mono font-bold">
              {currentTelemetry.alternatorCurrent}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">A</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">Rated: 50A Max</span>
        </div>

        {/* 10. Manifold Pressure */}
        <div className="p-2.5 bg-[#252a38]/60 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#849495] font-label-micro text-[9px] font-mono">
            <span>MANIFOLD PRESS</span>
            <Gauge className="w-3.5 h-3.5 text-[#b4c5ff]" />
          </div>
          <div className="my-1">
            <span className="font-telemetry-num-xl text-[20px] text-[#dee2f5] font-mono font-bold">
              {currentTelemetry.manifoldPressure}
            </span>
            <span className="text-[10px] text-[#849495] ml-1 font-mono">inHg</span>
          </div>
          <span className="text-[9px] text-[#849495] font-mono">Boost Nominal</span>
        </div>
      </div>

      {/* Live Interactive Telemetry Trend Chart */}
      <div className="mt-2 bg-[#090e1b] p-3.5 rounded-lg border border-[#3b494b]/40 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b494b]/30 pb-2">
          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-micro text-[9px] text-[#849495] uppercase font-mono mr-1">
              CHART PARAMETER:
            </span>
            {metricOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedChartMetric(opt.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                  selectedChartMetric === opt.id
                    ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                    : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
                }`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-[#161b29] p-0.5 rounded border border-[#3b494b]/30">
            {['1m', '5m', '15m', '1h', '12h'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  timeRange === t
                    ? 'bg-[#252a38] text-[#00f0ff] font-bold border border-[#00f0ff]/30'
                    : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Live SVG Graph Viewport */}
        <div className="relative w-full h-[160px]">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="metric-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentOption.color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={currentOption.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.2, 0.5, 0.8].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={svgHeight * ratio}
                x2={svgWidth}
                y2={svgHeight * ratio}
                stroke="#3b494b"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Fill */}
            {areaD && <path d={areaD} fill="url(#metric-grad)" />}

            {/* Line Stroke */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={currentOption.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points */}
            {points.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.pt === pt.pt ? 5 : 2}
                fill={hoveredPoint?.pt === pt.pt ? '#ffffff' : currentOption.color}
                stroke="#090e1b"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-[#252a38]/95 border border-[#00f0ff] px-2.5 py-1 rounded shadow-xl font-mono text-[11px] transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${hoveredPoint.y - 8}px`
              }}
            >
              <div className="text-[#00f0ff] font-bold">
                {hoveredPoint.val} {currentOption.unit}
              </div>
              <div className="text-[9px] text-[#849495]">
                {hoveredPoint.pt.timeLabel} ({hoveredPoint.pt.timestamp.slice(11, 19)} UTC)
              </div>
            </div>
          )}
        </div>

        {/* Chart Scale Labels */}
        <div className="flex justify-between items-center text-[#849495] font-label-micro text-[9px] font-mono px-1">
          <span>MIN: {chartMin} {currentOption.unit}</span>
          <span className="text-[#00f0ff]">
            ACTIVE: {(currentTelemetry as any)[selectedChartMetric] || values[values.length - 1]} {currentOption.unit}
          </span>
          <span>MAX: {chartMax} {currentOption.unit}</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  AlertTriangle,
  Flame,
  Activity,
  Gauge,
  Droplets,
  Search,
  Sparkles,
  Eye,
  FileText,
  Clock,
  Radio,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const Section3FaultsAndTelemetry: React.FC = () => {
  const {
    selectedEngine,
    telemetry,
    historicalData,
    timeRange,
    setTimeRange,
    isLiveStreaming,
    setActiveHotspotId,
    openModal,
    showToast,
  } = useDashboard();

  // Active channel view: 'cht' (default primary explaining fault), 'egt', 'rpm-oil', 'vibration', 'combined'
  const [selectedChannel, setSelectedChannel] = useState<'cht' | 'egt' | 'rpm-oil' | 'vibration'>('cht');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Active faults for selected engine
  const activeFaults = selectedEngine.id === 'eng-02' ? [
    {
      id: 'FLT-9824-01',
      component: 'Cylinder #2 Fin Assembly',
      subsystem: 'Aero Cooling Ducts',
      severity: 'WARNING',
      probability: 92,
      status: 'ACTIVE // UNRESOLVED',
      detectionTime: '13:50:12 UTC (T+03:22:15)',
      description: 'Cyl 2 CHT exceeded 174°C operational threshold under 82% cruise. Digital Twin divergence residual is +14.2% above thermodynamic equilibrium.',
      hotspotId: 2,
    },
    {
      id: 'FLT-9824-02',
      component: 'Cowling Air Baffle Assembly',
      subsystem: 'Thermal Management',
      severity: 'WATCH',
      probability: 68,
      status: 'MONITORED',
      detectionTime: '12:28:40 UTC (T+02:00:43)',
      description: 'Heat flux decay detected (-8.1%). Convective stagnation observed across right cylinder bank without oil scavenge temperature surge.',
      hotspotId: 2,
    },
    {
      id: 'FLT-9824-04',
      component: 'Cruise Power Envelope',
      subsystem: 'Autonomic Reasoner',
      severity: 'WARNING',
      probability: 96,
      status: 'ADVISORY ISSUED',
      detectionTime: '14:05:30 UTC (T+03:37:33)',
      description: 'Throttle derate to 78% limit advised to suppress peak temperature excursion and halt accelerated component fatigue.',
      hotspotId: 2,
    },
  ] : selectedEngine.id === 'eng-03' ? [
    {
      id: 'FLT-9824-03',
      component: 'Main Crank Journal Bearing',
      subsystem: 'Lube Oil Scavenge',
      severity: 'CRITICAL',
      probability: 98,
      status: 'CRITICAL ALERT',
      detectionTime: '14:10:02 UTC (T+03:42:05)',
      description: 'Inductive magnetic chip detector detected +47 metallic particulate counts/min. Vibration kurtosis elevated to 6.4 G.',
      hotspotId: 1,
    }
  ] : [
    {
      id: 'FLT-9824-00',
      component: 'Spark CDI Magneto Switch',
      subsystem: 'Ignition System',
      severity: 'NORMAL',
      probability: 99,
      status: 'VERIFIED NOMINAL',
      detectionTime: '11:15:20 UTC (T+00:47:23)',
      description: 'Autonomous CDI dual ignition switch verify passed with RPM drop <40. All thermodynamic channels within baseline margin.',
      hotspotId: 1,
    }
  ];

  // Telemetry chart data
  const data = historicalData.length > 0 ? historicalData : [];
  const activeHoverPoint = hoveredPointIndex !== null ? data[hoveredPointIndex] : data[data.length - 1];

  // SVG Chart Geometry Constants
  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute CHT Chart Range (Min: 140, Max: 190)
  const minCht = 140;
  const maxCht = 190;
  const getX = (idx: number) => padding.left + (idx / Math.max(1, data.length - 1)) * chartWidth;
  const getY = (val: number, min: number, max: number) =>
    padding.top + chartHeight - ((val - min) / (max - min)) * chartHeight;

  // Generate SVG Path for Observed CHT & Baseline
  const observedPath = data
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.observedCht, minCht, maxCht).toFixed(1)}`)
    .join(' ');

  const baselinePath = data
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.twinBaselineCht, minCht, maxCht).toFixed(1)}`)
    .join(' ');

  // Divergence Area Shading Path
  const areaPath = `${observedPath} L ${getX(data.length - 1).toFixed(1)} ${getY(
    data[data.length - 1]?.twinBaselineCht || 152,
    minCht,
    maxCht
  ).toFixed(1)} ${data
    .slice()
    .reverse()
    .map(p => {
      const idx = data.indexOf(p);
      return `L ${getX(idx).toFixed(1)} ${getY(p.twinBaselineCht, minCht, maxCht).toFixed(1)}`;
    })
    .join(' ')} Z`;

  return (
    <section id="section-3-faults-and-telemetry" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: ACTIVE FAULTS (5 Cols)                               */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-md p-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#3b494b]/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
                <span className="font-display text-sm font-bold tracking-wider text-[#dee2f5] uppercase">
                  ACTIVE FAULTS
                </span>
                <span className="font-mono-telemetry text-xs px-2 py-0.5 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 font-bold">
                  {activeFaults.length} DETECTED
                </span>
              </div>
              <span className="font-mono-telemetry text-[11px] text-[#849495]">
                UNIT: {selectedEngine.name}
              </span>
            </div>

            {/* List of Faults - Each Clearly Separated */}
            <div className="flex flex-col gap-3 mt-3">
              {activeFaults.map(fault => {
                const isWarning = fault.severity === 'WARNING';
                const isCritical = fault.severity === 'CRITICAL';
                const isWatch = fault.severity === 'WATCH';

                return (
                  <div
                    key={fault.id}
                    id={`card-${fault.id}`}
                    className={`rounded-lg border p-3.5 bg-[#0e1320] flex flex-col gap-2.5 transition-all shadow-md hover:border-[#00f0ff]/50 ${
                      isCritical
                        ? 'border-[#ef4444]/60 bg-[#93000a]/10'
                        : isWarning
                          ? 'border-[#b4c5ff]/50 bg-[#303443]/20'
                          : isWatch
                            ? 'border-[#7bd0ff]/40 bg-[#161b29]'
                            : 'border-[#00f0ff]/30'
                    }`}
                  >
                    {/* Top Row: Fault ID, Component & Severity Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-telemetry text-xs font-bold text-[#00f0ff]">
                            {fault.id}
                          </span>
                          <span className="text-[#849495] text-xs">•</span>
                          <span className="font-display text-xs font-bold text-[#dee2f5]">
                            {fault.component}
                          </span>
                        </div>
                        <span className="font-mono-telemetry text-[10px] text-[#849495]">
                          Subsystem: {fault.subsystem}
                        </span>
                      </div>

                      <span
                        className={`font-mono-telemetry text-[10px] font-bold px-2 py-0.5 rounded uppercase border whitespace-nowrap ${
                          isCritical
                            ? 'bg-[#93000a] text-[#ffdad6] border-[#ef4444]'
                            : isWarning
                              ? 'bg-[#303443] text-[#b4c5ff] border-[#b4c5ff]/60'
                              : 'bg-[#161b29] text-[#7df4ff] border-[#00f0ff]/40'
                        }`}
                      >
                        {fault.severity}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="font-mono-telemetry text-xs text-[#b9cacb] leading-relaxed">
                      {fault.description}
                    </p>

                    {/* Metadata Row: Probability, Status & Detection Time */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#3b494b]/30 font-mono-telemetry text-[10px]">
                      <div>
                        <span className="text-[#849495]">PROBABILITY: </span>
                        <span className="text-[#00f0ff] font-bold">{fault.probability}% BAYESIAN</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#849495]">STATUS: </span>
                        <span className="text-[#b4c5ff] font-semibold">{fault.status}</span>
                      </div>
                      <div className="col-span-2 text-[9px] text-[#849495]">
                        DETECTED: {fault.detectionTime}
                      </div>
                    </div>

                    {/* Exact Requested Action Buttons: INSPECT, DIAGNOSE, VIEW EVIDENCE */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-[#3b494b]/30">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHotspotId(fault.hotspotId);
                          const el = document.getElementById('section-1-digital-twin');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          showToast(`Focused 3D Twin Viewport on ${fault.component} (Cylinder 2)`, 'info');
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] font-mono-telemetry text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>INSPECT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          openModal('agent-trace');
                          showToast(`Triggered Autonomous AI Diagnostics trace for ${fault.id}`, 'info');
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-[#1a1f2d] hover:bg-[#252a38] border border-[#3b494b]/60 text-[#dee2f5] font-mono-telemetry text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-[#00f0ff]" />
                        <span>DIAGNOSE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('section-4-root-cause-analysis');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          showToast(`Navigated to Bayesian Root-Cause Evidence Chain for ${fault.id}`, 'info');
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-[#090e1b] hover:bg-[#161b29] border border-[#3b494b]/60 text-[#849495] hover:text-[#dee2f5] font-mono-telemetry text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>VIEW EVIDENCE</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: TELEMETRY ANALYSIS (7 Cols)                        */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-md p-4 shadow-xl">
            {/* Header with Title, Range Selector & Live Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-[#00f0ff]" />
                <span className="font-display text-sm font-bold tracking-wider text-[#dee2f5] uppercase">
                  TELEMETRY ANALYSIS
                </span>
                <span className="flex items-center gap-1 font-mono-telemetry text-[10px] text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping"></span>
                  LIVE 20Hz
                </span>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/50 font-mono-telemetry text-[10px]">
                {['LIVE', '15M', '1H', 'SORTIE'].map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setTimeRange(range);
                      showToast(`Telemetry time range updated to ${range}.`, 'info');
                    }}
                    className={`px-2.5 py-1 rounded font-bold uppercase transition-all ${
                      timeRange === range
                        ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                        : 'text-[#849495] hover:text-[#dee2f5]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Channel Selector Tabs (Prioritizing the telemetry that explains the active fault) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 border-b border-[#3b494b]/30">
              <button
                type="button"
                onClick={() => setSelectedChannel('cht')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold transition-all ${
                  selectedChannel === 'cht'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dee2f5] border border-transparent'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#ffb4ab]" />
                <span>CHT // THERMAL (EXPLAINS FAULT)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('egt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold transition-all ${
                  selectedChannel === 'egt'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dee2f5] border border-transparent'
                }`}
              >
                <span>EGT 4-CYL SPREAD</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('rpm-oil')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold transition-all ${
                  selectedChannel === 'rpm-oil'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dee2f5] border border-transparent'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>RPM & OIL PRESSURE</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel('vibration')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry font-bold transition-all ${
                  selectedChannel === 'vibration'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dee2f5] border border-transparent'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>VIBRATION RMS</span>
              </button>
            </div>

            {/* Current Hover / Live Data Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 my-2 rounded bg-[#090e1b] border border-[#3b494b]/40 font-mono-telemetry text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#849495]">TIME:</span>
                <span className="text-[#dee2f5] font-bold">{activeHoverPoint?.timestamp || '14:28:44 UTC'}</span>
              </div>

              {selectedChannel === 'cht' && (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#ffb4ab]"></span>
                    <span className="text-[#ffb4ab] font-bold">ACTUAL CHT: {activeHoverPoint?.observedCht ?? telemetry.cht}°C</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#00f0ff] border-t border-dashed"></span>
                    <span className="text-[#00f0ff]">EXPECTED TWIN: {activeHoverPoint?.twinBaselineCht ?? 152.0}°C</span>
                  </span>
                  <span className="text-[#ffb4ab] font-extrabold">
                    Δ +{((activeHoverPoint?.observedCht ?? telemetry.cht) - (activeHoverPoint?.twinBaselineCht ?? 152.0)).toFixed(1)}°C
                  </span>
                </div>
              )}

              {selectedChannel === 'egt' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#849495]">EGT SPREAD:</span>
                  <span className="text-[#00f0ff] font-bold">C1: {telemetry.egtCylinders?.[0] || 784}°C</span>
                  <span className="text-[#ffb4ab] font-bold">C2: {telemetry.egtCylinders?.[1] || 826}°C</span>
                  <span className="text-[#00f0ff] font-bold">C3: {telemetry.egtCylinders?.[2] || 789}°C</span>
                  <span className="text-[#00f0ff] font-bold">C4: {telemetry.egtCylinders?.[3] || 781}°C</span>
                </div>
              )}

              {selectedChannel === 'rpm-oil' && (
                <div className="flex items-center gap-3">
                  <span className="text-[#00f0ff] font-bold">RPM: {telemetry.rpm}</span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#00f0ff] font-bold">OIL PRESS: {telemetry.oilPressureBar.toFixed(2)} BAR</span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#dee2f5]">SUMP: {telemetry.oilTempC}°C</span>
                </div>
              )}

              {selectedChannel === 'vibration' && (
                <div className="flex items-center gap-3">
                  <span className="text-[#00f0ff] font-bold">VIB RMS: {telemetry.vibrationRmsG.toFixed(2)} G</span>
                  <span className="text-[#849495]">|</span>
                  <span className="text-[#7df4ff]">KURTOSIS: {telemetry.vibrationKurtosis || 3.12}</span>
                </div>
              )}
            </div>

            {/* RESPONSIVE SVG TELEMETRY CHART */}
            <div className="relative w-full h-[220px] bg-[#070b16] rounded-lg border border-[#3b494b]/50 overflow-hidden">
              {/* Chart Grid Lines */}
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full select-none"
                preserveAspectRatio="none"
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <defs>
                  <linearGradient id="chtDivergenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255, 180, 171, 0.45)" />
                    <stop offset="100%" stopColor="rgba(0, 240, 255, 0.05)" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Horizontal Grid Lines */}
                {[140, 150, 160, 170, 180, 190].map(temp => {
                  const y = getY(temp, minCht, maxCht);
                  const isThreshold = temp === 180;
                  return (
                    <g key={temp}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke={isThreshold ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 73, 75, 0.35)'}
                        strokeDasharray={isThreshold ? '4 3' : undefined}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        fill={isThreshold ? '#ef4444' : '#849495'}
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {temp}°C
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Divergence Area (Actual vs Expected) */}
                <path d={areaPath} fill="url(#chtDivergenceGrad)" />

                {/* Baseline Expected Curve (Cyan Dashed) */}
                <path
                  d={baselinePath}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />

                {/* Observed Actual Curve (Amber / Coral Solid) */}
                <path
                  d={observedPath}
                  fill="none"
                  stroke="#ffb4ab"
                  strokeWidth="2.4"
                />

                {/* Interactive Hover Point & Vertical Line */}
                {hoveredPointIndex !== null && (
                  <>
                    <line
                      x1={getX(hoveredPointIndex)}
                      y1={padding.top}
                      x2={getX(hoveredPointIndex)}
                      y2={height - padding.bottom}
                      stroke="#00f0ff"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={getX(hoveredPointIndex)}
                      cy={getY(data[hoveredPointIndex].observedCht, minCht, maxCht)}
                      r="4"
                      fill="#ffb4ab"
                      stroke="#070b16"
                      strokeWidth="2"
                    />
                    <circle
                      cx={getX(hoveredPointIndex)}
                      cy={getY(data[hoveredPointIndex].twinBaselineCht, minCht, maxCht)}
                      r="3.5"
                      fill="#00f0ff"
                      stroke="#070b16"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* Invisible Hover Rectangles */}
                {data.map((_, idx) => {
                  const x = getX(idx) - (chartWidth / data.length) / 2;
                  const w = chartWidth / data.length;
                  return (
                    <rect
                      key={idx}
                      x={Math.max(padding.left, x)}
                      y={padding.top}
                      width={w}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                    />
                  );
                })}
              </svg>

              {/* Threshold Warning Banner */}
              <div className="absolute top-2 right-3 font-mono-telemetry text-[9px] text-[#ef4444] bg-[#93000a]/30 px-2 py-0.5 rounded border border-[#ef4444]/40">
                CRITICAL THRESHOLD: 180°C
              </div>
            </div>

            {/* Explanation Footer: Explaining the Active Fault */}
            <div className="mt-3 p-2.5 rounded bg-[#090e1b] border border-[#3b494b]/40 font-mono-telemetry text-xs flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[#dee2f5] font-bold">
                  Telemetry Diagnosis: Cylinder Head #2 Thermal Divergence
                </span>
                <span className="text-[#849495] text-[11px] leading-relaxed">
                  Notice the sharp delta opening between Observed CHT (Coral) and Expected Digital Twin baseline (Cyan dashed) starting at T+03:15:00. Adjacent cylinders maintain normal 152°C, confirming a localized cooling restriction rather than a whole-engine fuel mixture imbalance.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

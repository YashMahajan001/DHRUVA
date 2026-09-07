import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  TrendingUp,
  Play,
  Pause,
  Rewind,
  FastForward,
  ZoomIn,
  Brain,
  BarChart3,
  Flame,
  Droplets,
  Activity,
} from 'lucide-react';
import { LiveTelemetryGauges } from './LiveTelemetryGauges';

export const MultiChannelCorrelatorCard: React.FC = () => {
  const {
    telemetry,
    historicalData,
    scrubProgressPct,
    setScrubProgressPct,
    isPlaying,
    togglePlayhead,
    stepScrub,
    focusAnomalyWindow,
    selectedEngine,
    timeRange,
    setTimeRange,
    showToast,
  } = useDashboard();

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; cht: number; baseline: number; time: string } | null>(null);

  // Derive scrub time from scrubProgressPct
  const hours = Math.floor((scrubProgressPct / 100) * 4.5);
  const minutes = Math.floor(((scrubProgressPct / 100) * 270) % 60);
  const seconds = Math.floor((scrubProgressPct * 1.3) % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const scrubTimeLabel = `13:${pad(minutes)}:${pad(seconds)} UTC (T+${pad(hours)}:${pad(minutes)}:${pad(seconds)})`;

  // Determine CHT divergence string & peak
  const isEng2 = selectedEngine.id === 'eng-02';
  const isEng3 = selectedEngine.id === 'eng-03';
  const isEng4 = selectedEngine.id === 'eng-04';

  let divergenceBadge = '+0.4% NOMINAL';
  let badgeClass = 'text-[#00f0ff] bg-[#303443]';
  let peakVal = 'Observed Peak: 151.2°C (Optimal)';

  if (isEng2) {
    divergenceBadge = '+14.2% DIVERGENT';
    badgeClass = 'text-[#b4c5ff] bg-[#303443] font-bold shadow-[0_0_8px_rgba(180,197,255,0.25)]';
    peakVal = 'Observed Peak: 178.4°C (+26.4°C vs Nominal)';
  } else if (isEng3) {
    divergenceBadge = '+6.1% HYDRAULIC ELEVATION';
    badgeClass = 'text-[#ffb4ab] bg-[#93000a] font-bold';
    peakVal = 'Observed Peak: 168.1°C (Oil Friction Bound)';
  } else if (isEng4) {
    divergenceBadge = '+3.8% TRANSIENT';
    badgeClass = 'text-[#7bd0ff] bg-[#303443] font-medium';
    peakVal = 'Observed Peak: 158.3°C (Wastegate Hunting)';
  }

  // SVG dimensions for CHT chart
  const svgWidth = 600;
  const svgHeight = 120;
  const reticleX = (scrubProgressPct / 100) * svgWidth;

  // Compute points for SVG curve
  const safeHistory = historicalData && Array.isArray(historicalData) && historicalData.length > 0 ? historicalData : [];
  const pointsStr = safeHistory
    .map((pt, idx) => {
      const x = (idx / Math.max(1, safeHistory.length - 1)) * svgWidth;
      // Temp scale 140°C = y:110, 185°C = y:15
      const y = 110 - ((pt.observedCht - 140) / 45) * 95;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const baselinePointsStr = safeHistory
    .map((pt, idx) => {
      const x = (idx / Math.max(1, safeHistory.length - 1)) * svgWidth;
      const y = 110 - ((pt.twinBaselineCht - 140) / 45) * 95;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Current value at scrub cursor
  const currentIndex = safeHistory.length > 0 
    ? Math.min(safeHistory.length - 1, Math.max(0, Math.floor((scrubProgressPct / 100) * safeHistory.length)))
    : 0;
  const currentScrubData = safeHistory[currentIndex] || { observedCht: 152, twinBaselineCht: 152, timestamp: '14:28:44' };
  const cursorY = 110 - ((currentScrubData.observedCht - 140) / 45) * 95;

  return (
    <div
      id="multi-channel-telemetry-correlator"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-3.5"
    >
      {/* Correlator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
          <h2 className="font-display text-base sm:text-lg text-[#dee2f5] font-bold uppercase tracking-tight">
            Multi-Channel Telemetry Correlator
          </h2>
        </div>

        {/* Time range selector and Live Scrub Point */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex items-center bg-[#090e1b] rounded border border-[#3b494b]/40 p-0.5">
            {['15M', '1H', '4H', 'SORTIE'].map(range => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  showToast(`Telemetry time window set to: ${range}`, 'info');
                }}
                className={`px-2 py-0.5 font-mono-telemetry text-[10px] rounded uppercase transition-colors ${
                  timeRange === range
                    ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                    : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Scrub point badge */}
          <div className="flex items-center gap-1.5 bg-[#303443]/60 px-2.5 py-1 rounded font-mono-telemetry text-[10px] border border-[#3b494b]/30">
            <span className="text-[#849495]">SCRUB POINT:</span>
            <span id="scrub-time-label" className="text-[#00f0ff] font-bold">
              {scrubTimeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* CHART 1: CHT vs Digital Twin Baseline */}
      <div className="flex flex-col gap-1.5 bg-[#1a1f2d]/70 p-3 rounded border border-[#3b494b]/20">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono-telemetry text-xs uppercase text-[#dee2f5] font-semibold">
              1. Cylinder Head Temp (CHT) vs Digital Twin Baseline
            </span>
            <span id="cht-divergence-badge" className={`font-mono-telemetry text-[9px] px-1.5 py-0.5 rounded ${badgeClass}`}>
              {divergenceBadge}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono-telemetry text-[10px]">
            <span className="flex items-center gap-1.5 text-[#00f0ff]">
              <span className="w-2.5 h-0.5 bg-[#00f0ff]"></span> OBSERVED
            </span>
            <span className="flex items-center gap-1.5 text-[#849495]">
              <span className="w-2.5 h-0.5 bg-[#849495] border-b border-dashed border-[#849495]"></span> TWIN MODEL
            </span>
          </div>
        </div>

        {/* The SVG interactive telemetry visualization */}
        <div
          className="relative w-full h-36 overflow-hidden bg-[#090e1b] rounded border border-[#3b494b]/30 cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            const idx = Math.min(historicalData.length - 1, Math.floor((pct / 100) * historicalData.length));
            const pt = historicalData[idx];
            if (pt) {
              setHoveredPoint({ x: clickX, cht: pt.observedCht, baseline: pt.twinBaselineCht, time: pt.timestamp });
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
            setScrubProgressPct(pct);
          }}
        >
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <linearGradient id="grad-observed" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="grad-warning-band" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#b4c5ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#b4c5ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Threshold Ceiling Band (180°C limit) */}
            <rect x="0" y="8" width={svgWidth} height="22" fill="#93000a" opacity="0.16" />
            <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.75" />
            <text x="8" y="24" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="8.5" opacity="0.9">
              MAX OPERATIONAL CEILING (180°C)
            </text>

            {/* Tactical Gridlines */}
            <line x1="0" y1="65" x2={svgWidth} y2="65" stroke="#3b494b" strokeWidth="0.75" strokeDasharray="2,4" opacity="0.4" />
            <line x1="0" y1="95" x2={svgWidth} y2="95" stroke="#3b494b" strokeWidth="0.75" opacity="0.3" />
            <line x1="150" y1="0" x2="150" y2={svgHeight} stroke="#3b494b" strokeWidth="0.75" strokeDasharray="2,4" opacity="0.3" />
            <line x1="300" y1="0" x2="300" y2={svgHeight} stroke="#3b494b" strokeWidth="0.75" strokeDasharray="2,4" opacity="0.3" />
            <line x1="450" y1="0" x2="450" y2={svgHeight} stroke="#3b494b" strokeWidth="0.75" strokeDasharray="2,4" opacity="0.3" />

            {/* Anomaly Highlight Zone if Engine 02 */}
            {isEng2 && (
              <>
                <rect x="420" y="0" width="160" height={svgHeight} fill="url(#grad-warning-band)" />
                <line x1="420" y1="0" x2="420" y2={svgHeight} stroke="#b4c5ff" strokeWidth="1" strokeDasharray="2,2" />
              </>
            )}

            {/* Digital Twin Baseline (Dashed Cyan-Grey) */}
            <polyline
              fill="none"
              stroke="#849495"
              strokeWidth="1.75"
              strokeDasharray="4,3"
              points={baselinePointsStr}
            />

            {/* Observed Engine Telemetry Polyline & Area Fill */}
            <polygon
              fill="url(#grad-observed)"
              opacity="0.5"
              points={`0,${svgHeight} ${pointsStr} ${svgWidth},${svgHeight}`}
            />
            <polyline
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.2"
              points={pointsStr}
            />

            {/* Current Cursor / Scrub Reticle on Chart */}
            <line
              x1={reticleX}
              y1="0"
              x2={reticleX}
              y2={svgHeight}
              stroke="#dbfcff"
              strokeWidth="1"
              opacity="0.9"
            />
            <circle
              cx={reticleX}
              cy={cursorY}
              r="4"
              fill="#00f0ff"
              stroke="#0e1320"
              strokeWidth="1.5"
              className="animate-pulse"
            />
          </svg>

          {/* Hover tooltip */}
          {hoveredPoint && (
            <div
              style={{ left: `${Math.min(hoveredPoint.x, svgWidth - 140)}px`, top: '10px' }}
              className="pointer-events-none absolute z-20 bg-[#1a1f2d]/95 backdrop-blur border border-[#00f0ff]/50 px-2 py-1 rounded shadow-xl font-mono-telemetry text-[9px]"
            >
              <div className="text-[#dbfcff] font-semibold">{hoveredPoint.time}</div>
              <div className="text-[#00f0ff]">Observed: {hoveredPoint.cht}°C</div>
              <div className="text-[#849495]">Twin Model: {hoveredPoint.baseline}°C</div>
            </div>
          )}
        </div>

        {/* Readout footer */}
        <div className="flex items-center justify-between font-mono-telemetry text-[10px] text-[#849495]">
          <span>Baseline: 152°C</span>
          <span id="cht-current-val" className="text-[#b4c5ff] font-bold">
            {isEng2 ? `Current CHT: ${telemetry.cht}°C (+${(telemetry.cht - 152).toFixed(1)}°C)` : peakVal}
          </span>
          <span>Sampling: 50 Hz</span>
        </div>
      </div>

      {/* CHART 2: EGT Distribution across 4 Cylinders */}
      <div className="flex flex-col gap-1.5 bg-[#1a1f2d]/70 p-3 rounded border border-[#3b494b]/20">
        <div className="flex items-center justify-between">
          <span className="font-mono-telemetry text-xs uppercase text-[#dee2f5] font-semibold">
            2. Exhaust Gas Temperature (EGT) Distribution
          </span>
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            CYL 1 - 4 COMPARISON
          </span>
        </div>

        {/* 4 EGT Bar Array */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(telemetry?.egtCylinders || []).map((temp, i) => {
            const cylNum = i + 1;
            const isAnomalyCyl = isEng2 && cylNum === 2;
            const barPct = Math.min(100, Math.round((temp / 900) * 100));

            return (
              <div
                key={cylNum}
                className={`bg-[#090e1b] p-2 rounded flex flex-col gap-1 ${
                  isAnomalyCyl ? 'ring-1 ring-[#b4c5ff]/50 shadow-[0_0_10px_rgba(180,197,255,0.2)]' : 'border border-[#3b494b]/20'
                }`}
              >
                <div className="flex justify-between font-mono-telemetry text-[10px]">
                  <span className={isAnomalyCyl ? 'text-[#b4c5ff] font-bold' : 'text-[#849495]'}>
                    CYL #{cylNum}
                  </span>
                  <span className={isAnomalyCyl ? 'text-[#b4c5ff] font-bold' : 'text-[#00f0ff] font-bold'}>
                    {temp}°C
                  </span>
                </div>

                <div className="w-full bg-[#303443] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAnomalyCyl ? 'bg-[#b4c5ff]' : 'bg-[#00f0ff]'
                    }`}
                    style={{ width: `${barPct}%` }}
                  ></div>
                </div>

                <span className={`font-mono-telemetry text-[9px] ${isAnomalyCyl ? 'text-[#b4c5ff] font-bold' : 'text-[#849495]'}`}>
                  {isAnomalyCyl ? '+42°C High' : 'Nominal spread'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DUAL SUB-CHARTS: Oil Hydraulic Dynamics & Vibration RMS / Kurtosis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Chart 3: Oil Pressure / Sump Residual */}
        <div className="bg-[#1a1f2d]/70 p-3 rounded border border-[#3b494b]/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-telemetry text-xs uppercase text-[#dee2f5] font-semibold">
              3. Oil Pressure / Sump Residual
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#00f0ff]">
              {isEng3 ? 'PRESSURE DROP' : 'STABLE'}
            </span>
          </div>

          <div className="w-full h-20 bg-[#090e1b] rounded overflow-hidden relative border border-[#3b494b]/20">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 80">
              <path
                d="M 0,40 Q 75,38 150,42 T 300,39"
                fill="none"
                stroke="#7df4ff"
                strokeWidth="1.8"
              />
              <path
                d="M 0,55 Q 75,54 150,56 T 300,53"
                fill="none"
                stroke="#849495"
                strokeDasharray="3,3"
                strokeWidth="1.2"
              />
            </svg>
            <div className="absolute bottom-1 left-2 font-mono-telemetry text-[9px] text-[#b9cacb]">
              Press: {telemetry.oilPressureBar} bar | Temp: {telemetry.oilTempC}°C
            </div>
          </div>
        </div>

        {/* Chart 4: Vibration RMS & Kurtosis */}
        <div className="bg-[#1a1f2d]/70 p-3 rounded border border-[#3b494b]/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-telemetry text-xs uppercase text-[#dee2f5] font-semibold">
              4. Vibration RMS &amp; Kurtosis
            </span>
            <span
              id="vibe-status-badge"
              className={`font-mono-telemetry text-[9px] ${
                isEng3 ? 'text-[#ffb4ab] font-bold' : isEng4 ? 'text-[#7bd0ff]' : 'text-[#00f0ff]'
              }`}
            >
              {telemetry.vibrationRmsG.toFixed(2)} G ({isEng3 ? 'CRITICAL KURTOSIS: 6.4' : 'NOMINAL'})
            </span>
          </div>

          <div className="w-full h-20 bg-[#090e1b] rounded overflow-hidden relative border border-[#3b494b]/20">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 80">
              <path
                d="M 0,45 L 30,42 L 60,49 L 90,41 L 120,44 L 150,38 L 180,48 L 210,40 L 240,43 L 270,41 L 300,42"
                fill="none"
                stroke={isEng3 ? '#ef4444' : '#00dbe9'}
                strokeWidth="1.8"
              />
            </svg>
            <div className="absolute bottom-1 left-2 font-mono-telemetry text-[9px] text-[#b9cacb]">
              Spectral Kurtosis: {telemetry.vibrationKurtosis.toFixed(2)} (Gaussian: ~3.0)
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Gauges Ribbon (Requirement 2) */}
      <LiveTelemetryGauges />

      {/* Scrub Controller Bar with Interactive Playhead Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#3b494b]/20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Step Back 10s"
            onClick={() => stepScrub(-10)}
            className="p-1.5 rounded bg-[#1a1f2d] hover:bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/30 transition-colors"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          <button
            id="play-pause-btn"
            type="button"
            onClick={togglePlayhead}
            className={`px-3 py-1 rounded font-mono-telemetry text-xs flex items-center gap-1.5 border transition-all ${
              isPlaying
                ? 'bg-[#00f0ff] text-[#00363a] border-[#00f0ff] font-bold shadow-[0_0_10px_#00f0ff]'
                : 'bg-[#1a1f2d] hover:bg-[#252a38] text-[#dee2f5] border-[#3b494b]/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Playhead'}</span>
          </button>

          <button
            type="button"
            title="Step Forward 10s"
            onClick={() => stepScrub(10)}
            className="p-1.5 rounded bg-[#1a1f2d] hover:bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/30 transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono-telemetry text-[9px] text-[#849495] ml-2 hidden sm:inline">
            STEP: 0.1s // SYNC ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={focusAnomalyWindow}
            className="px-3 py-1 rounded bg-[#b4c5ff]/20 text-[#b4c5ff] hover:bg-[#b4c5ff]/30 font-mono-telemetry text-xs flex items-center gap-1.5 border border-[#b4c5ff]/40 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom Anomaly Window</span>
          </button>
        </div>
      </div>

      {/* Digital Twin Divergence Score Banner */}
      <div className="bg-[#161b29]/95 p-3 rounded-lg border border-[#3b494b]/30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-[#00f0ff]" />
          <div className="flex flex-col">
            <span className="font-sans text-xs text-[#dee2f5] font-medium">
              Digital Twin Real-Time Divergence Score
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              Cross-referencing 112 thermodynamic state parameters against physical UAV-PT baseline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="font-mono-telemetry text-[9px] text-[#849495]">MAE RESIDUAL</span>
            <span
              id="mae-residual-val"
              className={`font-mono-telemetry text-base font-bold ${
                isEng2 ? 'text-[#b4c5ff]' : isEng3 ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'
              }`}
            >
              {telemetry.twinDivergenceMae.toFixed(2)}%
            </span>
          </div>
          <div className="w-9 h-9 rounded bg-[#303443] flex items-center justify-center text-[#00f0ff]">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

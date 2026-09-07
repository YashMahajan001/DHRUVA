import React, { useRef, useEffect, useState } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { TimeRange } from '../../types/engineDetailsTypes';
import { Play, Pause, Activity, LineChart as ChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const TelemetryWaveformChart: React.FC = () => {
  const {
    selectedSubsystem,
    telemetry,
    telemetryHistory,
    timeRange,
    setTimeRange,
    isStreamPaused,
    toggleTelemetryPause,
    stressSimulationActive
  } = useMissionDashboard();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'oscilloscope' | 'multimetric'>('oscilloscope');
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; valSynthetic: number; valPhysical: number } | null>(null);

  // Animated Oscilloscope Canvas Loop
  useEffect(() => {
    if (chartViewMode !== 'oscilloscope') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tStep = 0;

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!isStreamPaused) {
        tStep += 0.04;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Clear Canvas Background
      ctx.fillStyle = '#090e1b';
      ctx.fillRect(0, 0, w, h);

      // Draw Tactical Coordinate Grid
      ctx.strokeStyle = 'rgba(59, 73, 75, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Stress multipliers for amplitude
      const ampMulti = stressSimulationActive ? 1.6 : 1.0;
      const speedMulti = stressSimulationActive ? 1.8 : 1.0;

      // 1. Digital Twin Synthetic Model (Electric Cyan Line)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        const angle = (i * 0.035) + (tStep * speedMulti);
        const wave = (Math.sin(angle) * 35 + Math.sin(angle * 2.4) * 14) * ampMulti;
        const y = (h / 2) + wave;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Physical Sensor Data with Micro-Noise (Blue/Lavender Line)
      ctx.strokeStyle = stressSimulationActive ? '#ffb4ab' : '#b4c5ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < w; i += 2) {
        const angle = (i * 0.035) + (tStep * speedMulti);
        const jitter = (Math.sin(i * 12.3 + tStep * 4) * (stressSimulationActive ? 8 : 3.5));
        const wave = ((Math.sin(angle) * 35 + Math.sin(angle * 2.4) * 14) * ampMulti) + jitter;
        const y = (h / 2) + wave;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // Draw hover reticle if user is hovering
      if (hoverCoord) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hoverCoord.x, 0);
        ctx.lineTo(hoverCoord.x, h);
        ctx.moveTo(0, hoverCoord.y);
        ctx.lineTo(w, hoverCoord.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [chartViewMode, hoverCoord, isStreamPaused, stressSimulationActive]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normY = ((rect.height / 2 - y) / 50).toFixed(3);
    setHoverCoord({
      x,
      y,
      valSynthetic: Number(normY),
      valPhysical: Number((Number(normY) + (Math.random() - 0.5) * 0.02).toFixed(3))
    });
  };

  const timeRanges: TimeRange[] = ['10s', '1m', '5m', '1h'];

  return (
    <div className="xl:col-span-8 bg-surface-container-low/95 p-unit-lg rounded shadow-xl flex flex-col gap-unit-md border border-outline-variant/20 select-none">
      <div className="flex flex-wrap items-center justify-between gap-unit-sm">
        <div className="flex items-center gap-unit-md">
          <div className="flex flex-col">
            <span className="font-label-micro text-label-micro text-outline uppercase">
              LIVE WAVEFORM STREAM
            </span>
            <span id="chart-subsystem-tag" className="font-headline-sm text-headline-sm text-on-surface">
              {selectedSubsystem.chartTag}
            </span>
          </div>
          <span className="flex items-center gap-1 font-label-micro text-label-micro text-primary bg-primary/10 px-unit-xs py-0.5 rounded border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            2.5 kHz STREAM
          </span>
        </div>

        <div className="flex items-center gap-unit-xs">
          {/* Mode Switcher: Oscilloscope vs Recharts Historical Trend */}
          <div className="flex bg-surface-container-highest p-0.5 rounded border border-outline-variant/20 mr-1">
            <button
              onClick={() => setChartViewMode('oscilloscope')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer ${
                chartViewMode === 'oscilloscope'
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Real-time Oscilloscope"
            >
              <Activity className="w-3 h-3" />
              <span>Scope</span>
            </button>
            <button
              onClick={() => setChartViewMode('multimetric')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer ${
                chartViewMode === 'multimetric'
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Multi-Metric Historical Telemetry"
            >
              <ChartIcon className="w-3 h-3" />
              <span>Trend</span>
            </button>
          </div>

          {/* Timebase Selector */}
          <div className="flex bg-surface-container-highest p-0.5 rounded border border-outline-variant/20">
            {timeRanges.map((tr) => (
              <button
                key={tr}
                id={`tb-${tr}`}
                onClick={() => setTimeRange(tr)}
                className={`px-unit-sm py-0.5 rounded font-label-micro text-label-micro uppercase transition-colors cursor-pointer ${
                  timeRange === tr
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'text-on-surface hover:text-primary'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>

          {/* Pause / Resume Button */}
          <button
            id="btn-chart-pause"
            onClick={toggleTelemetryPause}
            className="p-1.5 bg-surface-container-highest hover:bg-surface-bright rounded text-on-surface transition-colors cursor-pointer border border-outline-variant/20"
            title={isStreamPaused ? 'Resume Telemetry Stream' : 'Pause Telemetry Stream'}
          >
            {isStreamPaused ? <Play className="w-3.5 h-3.5 text-primary" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CHART VIEWPORT: HTML5 OSCILLOSCOPE OR RECHARTS TREND */}
      <div className="w-full h-56 bg-surface-container-lowest rounded relative overflow-hidden flex items-center justify-center border border-outline-variant/20">
        {chartViewMode === 'oscilloscope' ? (
          <>
            <canvas
              ref={canvasRef}
              id="telemetryCanvas"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoverCoord(null)}
              className="w-full h-full block cursor-crosshair"
            />
            {/* Legend Overlay */}
            <div className="absolute top-2 right-3 font-label-micro text-label-micro text-outline pointer-events-none flex gap-unit-md bg-surface-container-lowest/80 px-2 py-1 rounded backdrop-blur-xs border border-outline-variant/20">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-primary"></span> SYNTHETIC TWIN
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-secondary-fixed"></span> PHYSICAL SENSOR
              </span>
            </div>

            {/* Live Hover Tooltip */}
            {hoverCoord && (
              <div
                className="absolute bg-surface-container-high/95 text-on-surface text-[10px] font-mono px-2 py-1 rounded border border-primary/40 shadow-xl pointer-events-none z-30"
                style={{
                  left: Math.min(hoverCoord.x + 12, (canvasRef.current?.width || 500) - 140),
                  top: Math.max(hoverCoord.y - 45, 10)
                }}
              >
                <div>TWIN: <span className="text-primary font-bold">{hoverCoord.valSynthetic} V</span></div>
                <div>SENS: <span className="text-secondary-fixed font-bold">{hoverCoord.valPhysical} V</span></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory.slice(-25)}>
                <CartesianGrid stroke="#3b494b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="timestamp" hide />
                <YAxis
                  yAxisId="left"
                  stroke="#00f0ff"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#b4c5ff"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e1320',
                    borderColor: '#00f0ff55',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#dee2f5'
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="chtAvg"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  dot={false}
                  name="Avg CHT (°C)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rpm"
                  stroke="#b4c5ff"
                  strokeWidth={1.5}
                  dot={false}
                  name="RPM"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="oilPressure"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="Oil PSI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* FOOTER TELEMETRY STATS */}
      <div className="flex flex-wrap items-center justify-between font-label-micro text-label-micro text-outline font-mono">
        <div className="flex items-center gap-unit-md">
          <span>
            RESIDUAL ERROR: <strong className="text-primary font-mono font-normal">±{telemetry.residualError} V</strong>
          </span>
          <span>
            SAMPLE RATE: <strong className="text-on-surface font-mono font-normal">2,500 S/sec</strong>
          </span>
          <span>
            BUFFER: <strong className="text-on-surface font-mono font-normal">RING_BUFFER_1024</strong>
          </span>
        </div>
        <div className="text-primary-fixed-dim">KALMAN FILTER: ONLINE</div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Fuel,
  Plane,
  Activity,
  Wrench,
  ChevronRight,
  ArrowUpRight,
  Printer,
  Sparkles,
  Sliders,
  X,
  FileText,
  Check,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useEngine } from '../context/EngineContext';
import { useAuth } from '../context/AuthContext';

// Mock historical trend data for 24h, 7d, and 30d
const TREND_DATA_24H = [
  { time: 'T-12h', health: 93, forecast: 93, threshold: 80 },
  { time: 'T-10h', health: 92, forecast: 92, threshold: 80 },
  { time: 'T-8h', health: 94, forecast: 94, threshold: 80 },
  { time: 'T-6h', health: 91, forecast: 91, threshold: 80 },
  { time: 'T-4h', health: 90, forecast: 90, threshold: 80 },
  { time: 'T-2.5h (Climb)', health: 87, forecast: 87, threshold: 80 },
  { time: 'T-1h (Loiter)', health: 90, forecast: 90, threshold: 80 },
  { time: 'NOW (Cruise)', health: 91, forecast: 91, threshold: 80 },
  { time: '+2h (Descent)', health: null, forecast: 92, threshold: 80 },
  { time: '+4h (Recovery)', health: null, forecast: 93, threshold: 80 },
];

const TREND_DATA_7D = [
  { time: 'Sortie 14', health: 95, forecast: 95, threshold: 80 },
  { time: 'Sortie 15', health: 93, forecast: 93, threshold: 80 },
  { time: 'Sortie 16', health: 92, forecast: 92, threshold: 80 },
  { time: 'Sortie 17', health: 89, forecast: 89, threshold: 80 },
  { time: 'Sortie 18', health: 91, forecast: 91, threshold: 80 },
  { time: 'Sortie 19', health: 90, forecast: 90, threshold: 80 },
  { time: 'Current Sortie', health: 91, forecast: 91, threshold: 80 },
];

const TREND_DATA_30D = [
  { time: 'Week 1', health: 96, forecast: 96, threshold: 80 },
  { time: 'Week 2', health: 94, forecast: 94, threshold: 80 },
  { time: 'Week 3', health: 91, forecast: 91, threshold: 80 },
  { time: 'Week 4 (Current)', health: 91, forecast: 91, threshold: 80 },
];

export const ExecutiveOverview: React.FC = () => {
  const navigate = useNavigate();
  const { operatorId } = useAuth();
  const { engines, mission, alerts, mroTasks, isStreamActive } = useEngine();

  // Local state for interactive features
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [signOffTime, setSignOffTime] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`UTC ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Derived high-level fleet calculations
  const totalEngines = engines.length || 4;
  const avgHealth = Math.round(
    engines.reduce((sum, e) => sum + (e.health || 0), 0) / (engines.length || 1)
  );
  const healthyCount = engines.filter((e) => (e.health || 0) >= 80).length;
  const attentionCount = engines.filter((e) => (e.health || 0) < 80).length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const avgRul = Math.round(
    engines.reduce((sum, e) => sum + (e.rul || 400), 0) / (engines.length || 1)
  );

  // Health status categorization
  const isHealthy = avgHealth >= 85;
  const isWatch = avgHealth >= 70 && avgHealth < 85;

  // Sign off handler
  const handleSignOff = () => {
    if (!isSignedOff) {
      setIsSignedOff(true);
      setSignOffTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    } else {
      setIsSignedOff(false);
      setSignOffTime('');
    }
  };

  const chartData =
    timeRange === '24h'
      ? TREND_DATA_24H
      : timeRange === '7d'
      ? TREND_DATA_7D
      : TREND_DATA_30D;

  return (
    <div id="executive-overview-page" className="w-full min-h-screen pb-16 px-4 sm:px-8 pt-4">
      {/* ========================================================================= */}
      {/* SECTION 1: TOP EXECUTIVE COMMAND HEADER                                   */}
      {/* ========================================================================= */}
      <section className="mb-6 flex flex-col gap-4">
        {/* Breadcrumb / Classification Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#849495] tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>DHRUVAA STRATEGIC COMMAND</span>
            <span>//</span>
            <span className="text-[#00f0ff]">MISSION EXECUTIVE BRIEFING</span>
            <span>//</span>
            <span>SORTIE {mission?.id || 'SN-ISR-042'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161b29] border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-[10px] tracking-wider uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
              COMMAND LEVEL 3
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#b9cacb] bg-[#161b29] px-2 py-0.5 rounded border border-[#3b494b]/30">
              <Clock className="w-3 h-3 text-[#00f0ff]" />
              {currentTime || 'UTC 14:32:00'}
            </span>
          </div>
        </div>

        {/* Primary Title Bar & Quick Executive Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-[#dee2f5] tracking-tight uppercase flex items-center gap-3">
              Executive Overview
              <span className="text-xs font-mono font-normal tracking-wider px-2.5 py-1 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                {isHealthy ? 'ALL PROPULSION NOMINAL' : 'ATTENTION REQUIRED'}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#849495] mt-1 font-sans">
              High-Level Fleet Health, Sortie Envelope Readiness & Strategic Decision Center
            </p>
          </div>

          {/* Executive Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-open-executive-briefing"
              onClick={() => setIsBriefingOpen(true)}
              className="px-4 py-2 rounded bg-gradient-to-r from-[#00f0ff]/20 to-[#0053db]/30 hover:from-[#00f0ff]/30 hover:to-[#0053db]/40 border border-[#00f0ff]/50 text-[#dee2f5] font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#00f0ff]" />
              Executive Briefing Document
            </button>

            <button
              onClick={() => navigate('/fleet')}
              className="px-3.5 py-2 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dee2f5] font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plane className="w-3.5 h-3.5 text-[#00f0ff]" />
              Fleet Radar
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-2 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dee2f5] font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#00f0ff]" />
              Engineering Deck
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 & 3: HERO PLATFORM HEALTH & KEY EXECUTIVE KPIS                   */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        {/* HERO CARD: Overall Platform Health Score (5 Cols) */}
        <div className="xl:col-span-5 bg-[#161b29]/90 border border-[#3b494b]/40 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-lg">
          {/* Subtle aerospace background radial glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00f0ff]" />
                <span className="font-mono text-xs text-[#849495] tracking-widest uppercase font-semibold">
                  PLATFORM INTEGRATED HEALTH
                </span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
                {isStreamActive ? 'LIVE CAN-BUS LINK' : 'STREAM PAUSED'}
              </span>
            </div>

            {/* Circular Progress Gauge & Plain Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
              {/* Radial Score Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="58"
                    stroke="#252a38"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="58"
                    stroke={isHealthy ? '#10b981' : isWatch ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * avgHealth) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-3xl font-black text-[#dee2f5] tracking-tighter">
                    {avgHealth}%
                  </span>
                  <span className="font-mono text-[9px] text-[#849495] uppercase tracking-wider font-semibold">
                    FLEET SCORE
                  </span>
                </div>
              </div>

              {/* Status Sentence for Non-Engineers */}
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 justify-center sm:justify-start">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isHealthy ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#f59e0b]'
                    }`}
                  ></span>
                  <span className="font-mono text-sm font-bold tracking-wider text-[#dee2f5] uppercase">
                    {isHealthy ? 'OPERATIONALLY READY // GO' : 'PROCEED WITH ADVISORY'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
                  {isHealthy
                    ? 'The propulsion system is operating within all safety margins. 3 engines are performing at peak efficiency, and 1 engine exhibits mild thermal elevation under altitude loiter.'
                    : 'One engine requires monitoring due to thermal elevation. Normal cruise operations remain flight safe.'}
                </p>

                <div className="font-mono text-[11px] text-[#849495] pt-1">
                  Synthetic Twin Validation: <span className="text-[#00f0ff] font-semibold">124,000 passes</span> • Zero critical faults
                </div>
              </div>
            </div>
          </div>

          {/* Quick Drill-down Footer */}
          <div className="mt-4 pt-3 border-t border-[#3b494b]/30 flex items-center justify-between text-xs font-mono text-[#849495]">
            <span>UAV Platform: <strong className="text-[#dee2f5]">{mission?.assetId || 'UAV-01 MALE'}</strong></span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[#00f0ff] hover:text-[#38bdf8] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              Open Live Telemetry <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI MATRIX GRID: 6 Critical Executive Numbers (7 Cols) */}
        <div className="xl:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* KPI 1: Active UAVs */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                ACTIVE UAVs
              </span>
              <Plane className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#dee2f5]">
                1 <span className="text-xs font-normal text-[#849495]">/ 1 Sortie</span>
              </div>
              <div className="font-mono text-[10px] text-[#10b981] mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                Loiter Reconnaissance
              </div>
            </div>
          </div>

          {/* KPI 2: Healthy Engines */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                HEALTHY ENGINES
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#10b981]">
                {healthyCount} <span className="text-xs font-normal text-[#849495]">/ {totalEngines}</span>
              </div>
              <div className="font-mono text-[10px] text-[#b9cacb] mt-1">
                75% Optimal Status
              </div>
            </div>
          </div>

          {/* KPI 3: Engines Needing Attention */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                NEEDS ATTENTION
              </span>
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#f59e0b]">
                {attentionCount} <span className="text-xs font-normal text-[#849495]">Engine (ENG 02)</span>
              </div>
              <div className="font-mono text-[10px] text-[#f59e0b] mt-1">
                Thermal Elevation (+18°C)
              </div>
            </div>
          </div>

          {/* KPI 4: Critical Safety Faults */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                CRITICAL FAULTS
              </span>
              <ShieldAlert className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#dee2f5]">
                {criticalAlertsCount}
              </div>
              <div className="font-mono text-[10px] text-[#10b981] mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                Zero Immediate Hazards
              </div>
            </div>
          </div>

          {/* KPI 5: Average Remaining Life (RUL) */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                AVG ENGINE LIFE (RUL)
              </span>
              <Clock className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#dee2f5]">
                {avgRul} <span className="text-xs font-normal text-[#849495]">Hours</span>
              </div>
              <div className="font-mono text-[10px] text-[#00f0ff] mt-1">
                +14h vs mission safety target
              </div>
            </div>
          </div>

          {/* KPI 6: Mission Fuel Endurance */}
          <div className="bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
            <div className="flex items-center justify-between text-[#849495] mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                FUEL ENDURANCE
              </span>
              <Fuel className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-[#dee2f5]">
                {mission?.remainingTime || '04h 32m'}
              </div>
              <div className="font-mono text-[10px] text-[#b9cacb] mt-1">
                {mission?.fuelRemainingPct || 64}% remaining (Safe margin)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: MISSION READINESS & FLIGHT ENVELOPE SUMMARY                     */}
      {/* ========================================================================= */}
      <section className="mb-6 bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#3b494b]/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-[#dee2f5] tracking-wide uppercase">
                  Sortie Flight Envelope Assessment
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/40">
                  MISSION GO
                </span>
              </div>
              <p className="text-xs text-[#849495] font-sans mt-0.5">
                Current operational margins ensure complete sortie safety without emergency intervention.
              </p>
            </div>
          </div>

          {/* Quick Mission Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/40">
              Phase: <strong className="text-[#00f0ff]">{mission?.phase || 'HIGH ALTITUDE ISR'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/40">
              Altitude: <strong className="text-[#dee2f5]">{mission?.altitudeFt?.toLocaleString() || '18,450'} FT</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/40">
              Airspeed: <strong className="text-[#dee2f5]">{mission?.airspeedKt || 198} KT</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-[#252a38] text-[#dee2f5] border border-[#3b494b]/40">
              Sortie Progress: <strong className="text-[#10b981]">{mission?.missionProgressPct || 68}%</strong>
            </span>
          </div>
        </div>

        {/* 4 Safety Envelope Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Margin 1: Thermal Margin */}
          <div className="bg-[#090e1b]/60 p-3 rounded-lg border border-[#3b494b]/20">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#849495]">Thermal Safety Margin</span>
              <span className="text-[#f59e0b] font-bold">14°C Headroom (Safe)</span>
            </div>
            <div className="w-full h-2 bg-[#252a38] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-full" style={{ width: '84%' }}></div>
            </div>
            <span className="text-[10px] text-[#849495] font-sans mt-1.5 block">
              Adequate convective cooling at 18,450 FT prevents thermal runaway.
            </span>
          </div>

          {/* Margin 2: Vibration Envelope */}
          <div className="bg-[#090e1b]/60 p-3 rounded-lg border border-[#3b494b]/20">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#849495]">Vibration Stability</span>
              <span className="text-[#10b981] font-bold">4.8 mm/s (Within Limit)</span>
            </div>
            <div className="w-full h-2 bg-[#252a38] rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: '91%' }}></div>
            </div>
            <span className="text-[10px] text-[#849495] font-sans mt-1.5 block">
              Mechanical harmonics well below structural fatigue threshold.
            </span>
          </div>

          {/* Margin 3: Fuel Reserve */}
          <div className="bg-[#090e1b]/60 p-3 rounded-lg border border-[#3b494b]/20">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#849495]">Fuel Reserve Status</span>
              <span className="text-[#10b981] font-bold">64% (Sortie + 45m reserve)</span>
            </div>
            <div className="w-full h-2 bg-[#252a38] rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: '88%' }}></div>
            </div>
            <span className="text-[10px] text-[#849495] font-sans mt-1.5 block">
              Burn rate aligns with pre-flight mission plan trajectory.
            </span>
          </div>

          {/* Margin 4: Autonomy & Telemetry */}
          <div className="bg-[#090e1b]/60 p-3 rounded-lg border border-[#3b494b]/20">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#849495]">Telemetry & Twin Sync</span>
              <span className="text-[#00f0ff] font-bold">99.8% Synchronized</span>
            </div>
            <div className="w-full h-2 bg-[#252a38] rounded-full overflow-hidden">
              <div className="h-full bg-[#00f0ff] rounded-full" style={{ width: '99%' }}></div>
            </div>
            <span className="text-[10px] text-[#849495] font-sans mt-1.5 block">
              Dual CAN-bus telemetry latency under 12ms.
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: "WHAT NEEDS MY ATTENTION" (PRIORITIZED ACTION CARDS)           */}
      {/* ========================================================================= */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#dee2f5] tracking-wide uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
              What Needs My Attention
            </h2>
            <p className="text-xs text-[#849495] font-sans">
              Prioritized operational issues requiring awareness, strategic decision, or maintenance scheduling.
            </p>
          </div>
          <span className="font-mono text-xs text-[#849495] hidden sm:block">
            Sorted by Urgency: <strong className="text-[#dee2f5]">High to Routine</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Engine 02 (Thermal Elevation) */}
          <div className="bg-[#161b29]/90 border-l-4 border-l-[#f59e0b] border-y border-r border-[#3b494b]/40 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-mono text-[10px] font-bold tracking-wider uppercase">
                  WATCH // MODERATE
                </span>
                <span className="font-mono text-xs text-[#dee2f5] font-semibold">ENG 02 (Port Outboard)</span>
              </div>

              <h3 className="text-sm font-bold text-[#dee2f5] mb-2">
                Elevated Cylinder Head Temperature (+18°C)
              </h3>

              <div className="space-y-2 text-xs text-[#b9cacb] leading-relaxed">
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">What is happening:</strong>
                  The engine is running warmer than standard loiter level (196°C vs 178°C norm) due to cooling baffle restriction.
                </div>
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">Why it matters:</strong>
                  Safe for cruising, but sustained high-speed climb could cause heat wear.
                </div>
                <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#f59e0b]/30 text-[#f59e0b]">
                  <strong className="font-mono block text-[10px] uppercase font-bold">Recommended Manager Decision:</strong>
                  Advise flight controller to avoid rapid climb bursts. Maintain steady loiter cruise.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#3b494b]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#849495]">Timeline: Monitor this sortie</span>
              <button
                onClick={() => navigate('/engine/eng-02')}
                className="font-mono text-xs text-[#00f0ff] hover:text-[#38bdf8] flex items-center gap-1 font-semibold cursor-pointer"
              >
                Inspect ENG 02 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Engine 03 (Vibration Harmonics) */}
          <div className="bg-[#161b29]/90 border-l-4 border-l-[#00f0ff] border-y border-r border-[#3b494b]/40 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-mono text-[10px] font-bold tracking-wider uppercase">
                  ROUTINE // POST-FLIGHT
                </span>
                <span className="font-mono text-xs text-[#dee2f5] font-semibold">ENG 03 (Starboard Inboard)</span>
              </div>

              <h3 className="text-sm font-bold text-[#dee2f5] mb-2">
                Journal Bearing Harmonic Vibration Signature
              </h3>

              <div className="space-y-2 text-xs text-[#b9cacb] leading-relaxed">
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">What is happening:</strong>
                  Slight vibration harmonic (4.8 mm/s) detected at shaft rotational frequency.
                </div>
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">Why it matters:</strong>
                  Zero in-flight hazard. Over 50+ flight hours, unchecked vibration causes premature bearing wear.
                </div>
                <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#00f0ff]/30 text-[#b9cacb]">
                  <strong className="text-[#00f0ff] font-mono block text-[10px] uppercase font-bold">Recommended Manager Decision:</strong>
                  Approve routine ultrasonic bearing check during scheduled post-flight ground inspection.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#3b494b]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#849495]">Timeline: Within 25 flight hours</span>
              <button
                onClick={() => navigate('/maintenance')}
                className="font-mono text-xs text-[#00f0ff] hover:text-[#38bdf8] flex items-center gap-1 font-semibold cursor-pointer"
              >
                View MRO Task <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Engine 01 & 04 (Peak Operation) */}
          <div className="bg-[#161b29]/90 border-l-4 border-l-[#10b981] border-y border-r border-[#3b494b]/40 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-[10px] font-bold tracking-wider uppercase">
                  NOMINAL // OPTIMAL
                </span>
                <span className="font-mono text-xs text-[#dee2f5] font-semibold">ENG 01 & ENG 04</span>
              </div>

              <h3 className="text-sm font-bold text-[#dee2f5] mb-2">
                Primary Propulsion Units Performing Flawlessly
              </h3>

              <div className="space-y-2 text-xs text-[#b9cacb] leading-relaxed">
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">What is happening:</strong>
                  Cylinder head temperatures (170-172°C) and oil pressure (58 PSI) are at ideal factory specifications.
                </div>
                <div>
                  <strong className="text-[#dee2f5] font-mono block text-[11px] uppercase text-[#849495]">Why it matters:</strong>
                  Provides reliable thrust stability and aerodynamic trim across both wing stations.
                </div>
                <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#10b981]/30 text-[#b9cacb]">
                  <strong className="text-[#10b981] font-mono block text-[10px] uppercase font-bold">Recommended Manager Decision:</strong>
                  No action required. Maintain standard passive digital twin telemetry tracking.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#3b494b]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#849495]">Timeline: Full Sortie Duration</span>
              <button
                onClick={() => navigate('/fleet')}
                className="font-mono text-xs text-[#00f0ff] hover:text-[#38bdf8] flex items-center gap-1 font-semibold cursor-pointer"
              >
                View Fleet Matrix <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: AI EXECUTIVE DIAGNOSTIC INSIGHT                                 */}
      {/* ========================================================================= */}
      <section className="mb-6 bg-gradient-to-br from-[#161b29] to-[#0c1424] border border-[#00f0ff]/30 rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#3b494b]/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f0ff]/20 to-[#0053db]/30 border border-[#00f0ff]/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.3)] shrink-0">
              <Sparkles className="w-5 h-5 text-[#00f0ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-[#dee2f5] tracking-wide uppercase">
                  DHRUVAA AI Executive Strategic Insight
                </h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold">
                  SYNTHETIC DIGITAL TWIN
                </span>
              </div>
              <p className="text-xs text-[#849495] font-sans">
                Real-time predictive machine learning evaluation synthesized for mission commanders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-mono text-[10px] text-[#849495] uppercase block">AI Model Confidence</span>
              <span className="font-mono text-base font-bold text-[#00f0ff]">94.2% High Fidelity</span>
            </div>
            <button
              onClick={() => navigate('/faults')}
              className="px-3.5 py-1.5 rounded bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Explore AI Diagnostics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Plain English AI Executive Narrative (8 Cols) */}
          <div className="lg:col-span-8 space-y-3 text-xs sm:text-sm text-[#dee2f5] leading-relaxed">
            <p>
              Based on <strong>124,000 synthetic digital twin simulations</strong> against real-time CAN-bus telemetry, the propulsion platform maintains a <strong>94.2% mission success probability</strong>. Engine 02's temperature elevation has reached thermodynamic equilibrium due to convective airflow at 18,450 FT MSL.
            </p>

            <div className="bg-[#090e1b]/80 border border-[#00f0ff]/30 rounded-lg p-3.5 text-xs text-[#b9cacb]">
              <div className="font-mono text-[11px] text-[#00f0ff] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
                Recommended Strategic Decision:
              </div>
              <p className="text-[#dee2f5] font-medium">
                Authorize planned mission continuation with a <strong>5% climb power margin cap</strong> on the outboard wing. Plan scheduled 45-minute ground inspection of the cooling shroud upon post-mission recovery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] text-[#849495]">
              <span>Expected Impact: <strong className="text-[#10b981]">+18.5 hrs life saved</strong></span>
              <span>•</span>
              <span>Cost Avoidance: <strong className="text-[#10b981]">$12,000 teardown prevented</strong></span>
              <span>•</span>
              <span>Sortie Completion: <strong className="text-[#10b981]">100% On Schedule</strong></span>
            </div>
          </div>

          {/* AI Decision Summary Box (4 Cols) */}
          <div className="lg:col-span-4 bg-[#090e1b]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#849495] tracking-widest uppercase block mb-1">
                ADVISORY SIGN-OFF SUMMARY
              </span>
              <div className="font-mono text-sm font-bold text-[#10b981] flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                LOW STRATEGIC RISK
              </div>
              <p className="text-[11px] text-[#b9cacb] leading-normal font-sans">
                No telemetry divergence detected between physical CAN-bus sensor feeds and the physics-based digital twin model.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-[#3b494b]/30">
              <span className="font-mono text-[9px] text-[#849495] block italic">
                * Advisory decision aid. Mission Commander retains ultimate authority.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: FLEET HEALTH SNAPSHOT (DISTRIBUTION & 4 ENGINE CARDS)           */}
      {/* ========================================================================= */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#dee2f5] tracking-wide uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00f0ff]" />
              Propulsion Fleet Health Distribution
            </h2>
            <p className="text-xs text-[#849495] font-sans">
              Individual engine health status with plain-English summaries. Click any engine to view full details.
            </p>
          </div>

          {/* Segmented Distribution Legend */}
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-[#10b981]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></span>
              Healthy (75%)
            </span>
            <span className="flex items-center gap-1 text-[#f59e0b]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]"></span>
              Watch (25%)
            </span>
            <span className="flex items-center gap-1 text-[#ef4444]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]"></span>
              Critical (0%)
            </span>
          </div>
        </div>

        {/* Fleet Distribution Bar */}
        <div className="w-full h-2.5 bg-[#252a38] rounded-full overflow-hidden flex mb-4">
          <div className="bg-[#10b981] h-full" style={{ width: '75%' }} title="3 Healthy Engines (75%)"></div>
          <div className="bg-[#f59e0b] h-full" style={{ width: '25%' }} title="1 Watch Engine (25%)"></div>
        </div>

        {/* 4 Engine Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {engines.map((eng, idx) => {
            const isEngHealthy = (eng.health || 0) >= 80;
            const isEngWatch = (eng.health || 0) >= 70 && (eng.health || 0) < 80;
            const healthColor = isEngHealthy
              ? 'text-[#10b981]'
              : isEngWatch
              ? 'text-[#f59e0b]'
              : 'text-[#ef4444]';
            const badgeBg = isEngHealthy
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
              : isEngWatch
              ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
              : 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30';

            // Non-technical descriptions
            const descriptions = [
              'Optimal combustion across all 4 cylinders. Zero anomalies.',
              'Elevated cylinder temperature under climb; stable at cruise.',
              'Mild journal bearing vibration; normal flight safe.',
              'Excellent ignition and fuel flow parameters.',
            ];

            return (
              <div
                key={eng.id || idx}
                onClick={() => navigate(`/engine/${eng.id}`)}
                className="bg-[#161b29]/80 hover:bg-[#1f2537] border border-[#3b494b]/30 hover:border-[#00f0ff]/50 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#dee2f5]">
                      {eng.id.toUpperCase()}
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${badgeBg}`}>
                      {isEngHealthy ? 'OPTIMAL' : isEngWatch ? 'WATCH' : 'CRITICAL'}
                    </span>
                  </div>

                  <div className="font-display text-sm font-semibold text-[#dee2f5] mb-1">
                    {eng.name || `Engine 0${idx + 1}`}
                  </div>

                  <p className="text-xs text-[#849495] mb-3 leading-relaxed">
                    {descriptions[idx] || 'Operating within safe parameters.'}
                  </p>
                </div>

                <div className="border-t border-[#3b494b]/30 pt-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-mono text-[11px] text-[#849495]">Health Index</span>
                    <span className={`font-mono text-base font-black ${healthColor}`}>
                      {eng.health || 85}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-[11px] font-mono text-[#849495]">
                    <span>Remaining Life</span>
                    <span className="text-[#dee2f5] font-semibold">{eng.rul || 420} hrs</span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-mono text-[10px] text-[#00f0ff] group-hover:underline flex items-center justify-end gap-1">
                      View Diagnostics <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: FLEET HEALTH TREND & FORECAST CHART (RECHARTS)                 */}
      {/* ========================================================================= */}
      <section className="mb-6 bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#dee2f5] tracking-wide uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00f0ff]" />
              Fleet Health Trajectory & Predictive Forecast
            </h2>
            <p className="text-xs text-[#849495] font-sans">
              Historical fleet health index and predictive recovery trajectory through mission landing.
            </p>
          </div>

          {/* Time range switcher */}
          <div className="flex items-center gap-1 bg-[#090e1b] p-1 rounded-lg border border-[#3b494b]/30">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'text-[#849495] hover:text-[#dee2f5]'
                }`}
              >
                {r === '24h' ? 'Last 24 Hours' : r === '7d' ? 'Past 7 Sorties' : '30-Day Fleet Trend'}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#849495"
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
              />
              <YAxis
                domain={[60, 100]}
                stroke="#849495"
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090e1b',
                  borderColor: '#00f0ff',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#00f0ff', fontWeight: 'bold' }}
                itemStyle={{ color: '#dee2f5' }}
              />
              {/* Safety Threshold Reference Line */}
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: '80% Safety Target',
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#00f0ff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorHealth)"
                name="Fleet Health"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#818cf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorForecast)"
                name="AI Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plain-English Trend Interpretation */}
        <div className="mt-3 p-3 bg-[#090e1b]/70 border border-[#3b494b]/20 rounded-lg flex items-start gap-2.5 text-xs text-[#b9cacb]">
          <Info className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#dee2f5] font-mono text-[11px] uppercase block">
              Commander Trend Assessment:
            </strong>
            Overall propulsion health has remained exceptionally stable between 88% and 94% throughout the past 24 hours. The brief 3% drop at T-2.5h coincided with high-altitude tactical ascent and quickly recovered once level flight was attained. AI predictive models indicate stability through sortie recovery.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: MAINTENANCE & TURNAROUND OUTLOOK                               */}
      {/* ========================================================================= */}
      <section className="mb-6 bg-[#161b29]/80 border border-[#3b494b]/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3b494b]/30 pb-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#dee2f5] tracking-wide uppercase flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#00f0ff]" />
              Maintenance & Turnaround Outlook
            </h2>
            <p className="text-xs text-[#849495] font-sans">
              Ground crew scheduling, upcoming servicing windows, and turnaround feasibility.
            </p>
          </div>

          <button
            onClick={() => navigate('/maintenance')}
            className="px-3.5 py-1.5 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/40 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Open Full MRO Deck <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-[#090e1b]/70 border border-[#3b494b]/30 rounded-lg p-3.5">
            <span className="font-mono text-[10px] text-[#849495] uppercase block">Next 24 Hours</span>
            <span className="font-mono text-lg font-bold text-[#f59e0b]">1 Task Due Post-Flight</span>
            <span className="text-[11px] text-[#b9cacb] block font-sans">Cooling Shroud Inspection (ENG 02)</span>
          </div>

          <div className="bg-[#090e1b]/70 border border-[#3b494b]/30 rounded-lg p-3.5">
            <span className="font-mono text-[10px] text-[#849495] uppercase block">Next 7 Days</span>
            <span className="font-mono text-lg font-bold text-[#dee2f5]">2 Routine Tasks</span>
            <span className="text-[11px] text-[#b9cacb] block font-sans">Spark plug clean, oil sample analysis</span>
          </div>

          <div className="bg-[#090e1b]/70 border border-[#3b494b]/30 rounded-lg p-3.5">
            <span className="font-mono text-[10px] text-[#849495] uppercase block">Turnaround Projection</span>
            <span className="font-mono text-lg font-bold text-[#10b981]">RAPID TURNAROUND FEASIBLE</span>
            <span className="text-[11px] text-[#b9cacb] block font-sans">Estimated downtime &lt; 45 minutes</span>
          </div>
        </div>

        {/* Filtered Upcoming MRO List */}
        <div className="space-y-2">
          {mroTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="bg-[#090e1b]/50 border border-[#3b494b]/20 hover:border-[#3b494b]/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    task.severity === 'WARNING'
                      ? 'bg-[#f59e0b]'
                      : task.severity === 'CRITICAL'
                      ? 'bg-[#ef4444]'
                      : 'bg-[#10b981]'
                  }`}
                ></span>
                <div>
                  <div className="font-mono text-xs font-bold text-[#dee2f5]">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-[#849495] font-sans">
                    {task.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <span className="text-[#849495]">Engine: <strong className="text-[#dee2f5]">{task.engineId?.toUpperCase()}</strong></span>
                <span className="text-[#00f0ff] font-semibold">{task.hoursRemaining}h remaining</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    task.severity === 'WARNING'
                      ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                      : 'bg-[#10b981]/20 text-[#10b981]'
                  }`}
                >
                  {task.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: MANAGER DECISION CENTER & SIGN-OFF                            */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#161b29] to-[#0f172a] border border-[#00f0ff]/40 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#3b494b]/30 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase font-semibold">
                COMMAND CHECKLIST & SIGN-OFF
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#dee2f5] tracking-wide uppercase mt-1">
              Manager Operational Decision Center
            </h2>
            <p className="text-xs text-[#849495] font-sans">
              Review high-level recommendations and log formal executive decision for current sortie.
            </p>
          </div>

          {/* Decision Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 font-mono text-xs font-bold uppercase">
              <Check className="w-3.5 h-3.5" />
              1. Sortie: APPROVED (GO)
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 font-mono text-xs font-bold uppercase">
              <Check className="w-3.5 h-3.5" />
              2. Fleet: STABLE
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40 font-mono text-xs font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              3. MRO: ROUTINE GROUND CHECK
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <h3 className="font-display text-sm font-bold text-[#dee2f5] uppercase tracking-wide">
              Executive Decision Summary:
            </h3>
            <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed font-sans">
              "Proceed with scheduled mission profile. Authorize return-to-base recovery at scheduled 18:45 UTC. Maintain standard loiter altitude and log routine post-flight cooling inspection for Engine 02 and bearing check for Engine 03."
            </p>
            {isSignedOff && (
              <div className="pt-2 flex items-center gap-2 font-mono text-xs text-[#10b981]">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                <span>
                  Command Authorization Logged by <strong>{operatorId || 'CDR. V. SHASTRI'}</strong> at {signOffTime}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleSignOff}
              className={`px-4 py-2.5 rounded font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSignedOff
                  ? 'bg-[#10b981] text-[#090e1b] shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-[#00f0ff] hover:bg-[#38bdf8] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.35)]'
              }`}
            >
              <Check className="w-4 h-4" />
              {isSignedOff ? 'Authorization Recorded ✓' : 'Log Executive Authorization'}
            </button>

            <button
              onClick={() => setIsBriefingOpen(true)}
              className="px-4 py-2.5 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/40 text-[#dee2f5] font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#00f0ff]" />
              Export Briefing
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* EXECUTIVE BRIEFING DOCUMENT MODAL                                         */}
      {/* ========================================================================= */}
      {isBriefingOpen && (
        <div
          id="briefing-modal-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsBriefingOpen(false)}
        >
          <div
            className="bg-[#090e1b] border border-[#00f0ff]/50 rounded-xl max-w-3xl w-full p-6 text-[#dee2f5] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-widest block">
                  DHRUVAA DEFENSE PROPULSION // OFFICIAL RECORD
                </span>
                <h2 className="font-display text-xl font-bold uppercase text-[#dee2f5]">
                  Executive Sortie Briefing Document
                </h2>
              </div>
              <button
                onClick={() => setIsBriefingOpen(false)}
                className="p-1 rounded text-[#849495] hover:text-[#dee2f5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content */}
            <div className="space-y-4 text-xs font-sans">
              {/* Mission Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161b29] p-3 rounded border border-[#3b494b]/30 font-mono text-[11px]">
                <div>
                  <span className="text-[#849495] block">SORTIE ID:</span>
                  <span className="text-[#dee2f5] font-bold">{mission?.id || 'SN-ISR-042'}</span>
                </div>
                <div>
                  <span className="text-[#849495] block">AIRFRAME:</span>
                  <span className="text-[#dee2f5] font-bold">{mission?.assetId || 'UAV-01 MALE'}</span>
                </div>
                <div>
                  <span className="text-[#849495] block">DATE / TIME:</span>
                  <span className="text-[#dee2f5] font-bold">{currentTime}</span>
                </div>
                <div>
                  <span className="text-[#849495] block">OPERATIONAL STATUS:</span>
                  <span className="text-[#10b981] font-bold">MISSION GO (91%)</span>
                </div>
              </div>

              {/* Aggregated Propulsion Status Table */}
              <div>
                <h3 className="font-mono text-xs uppercase font-bold text-[#00f0ff] mb-2">
                  1. Propulsion Fleet Status Matrix
                </h3>
                <table className="w-full text-left font-mono text-[11px] border border-[#3b494b]/30 rounded">
                  <thead className="bg-[#161b29] text-[#849495]">
                    <tr>
                      <th className="p-2">Engine</th>
                      <th className="p-2">Position</th>
                      <th className="p-2">Health Index</th>
                      <th className="p-2">Est. RUL</th>
                      <th className="p-2">Operational Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b494b]/20">
                    {engines.map((e, idx) => (
                      <tr key={e.id || idx}>
                        <td className="p-2 font-bold text-[#dee2f5]">{e.id.toUpperCase()}</td>
                        <td className="p-2 text-[#849495]">{e.name?.split('(')[1]?.replace(')', '') || 'Wing Station'}</td>
                        <td className="p-2 font-bold text-[#10b981]">{e.health}%</td>
                        <td className="p-2 text-[#dee2f5]">{e.rul} hrs</td>
                        <td className="p-2 text-[#b9cacb]">
                          {idx === 1
                            ? 'Watch: +18°C CHT elevation under climb; safe at loiter'
                            : idx === 2
                            ? 'Routine: 4.8 mm/s vibration; check at turnaround'
                            : 'Nominal: Peak operational performance'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI Strategic Assessment */}
              <div className="bg-[#161b29]/80 p-3.5 rounded border border-[#3b494b]/30">
                <h3 className="font-mono text-xs uppercase font-bold text-[#00f0ff] mb-1">
                  2. AI Synthetic Digital Twin Recommendation
                </h3>
                <p className="text-xs text-[#b9cacb] leading-relaxed">
                  The AI Diagnostic Engine validates that UAV-01 can complete its assigned loiter orbit with zero immediate abort risk. Convective air cooling stabilizes Engine 02. The recommended tactical constraint is to avoid sudden rapid climb maneuvers on the outboard wing.
                </p>
              </div>

              {/* Sign-off confirmation */}
              <div className="border-t border-[#3b494b]/30 pt-3 flex items-center justify-between font-mono text-[11px] text-[#849495]">
                <span>
                  Authorizing Officer: <strong className="text-[#dee2f5]">{operatorId || 'CDR. V. SHASTRI'}</strong>
                </span>
                <span>
                  Status: <strong className="text-[#10b981]">{isSignedOff ? 'AUTHORIZED' : 'PENDING REVIEW'}</strong>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#3b494b]/40 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00f0ff] text-[#00363a] font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 hover:bg-[#38bdf8] transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save Document
              </button>
              <button
                onClick={() => setIsBriefingOpen(false)}
                className="px-4 py-2 rounded bg-[#161b29] hover:bg-[#252a38] text-[#dee2f5] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

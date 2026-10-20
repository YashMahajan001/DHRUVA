import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Plane,
  Gauge,
  Activity,
  Sliders,
  Radar,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Wind,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const AeroplaneDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { view } = useParams<{ view?: string }>();

  // Determine active view from URL path
  const activeView = useMemo(() => {
    if (location.pathname.includes('/telemetry')) return 'telemetry';
    if (location.pathname.includes('/diagnostics') || location.pathname.includes('/faults')) return 'diagnostics';
    if (location.pathname.includes('/simulation') || location.pathname.includes('/envelope')) return 'simulation';
    if (location.pathname.includes('/fleet')) return 'fleet';
    if (location.pathname.includes('/maintenance')) return 'maintenance';
    return 'cockpit';
  }, [location.pathname]);

  // Selected Engine & Flight State
  const [selectedEngine, setSelectedEngine] = useState<string>('CFM56-7B-TURBOFAN');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Flight Envelope Controls
  const [thrustRating, setThrustRating] = useState<'IDLE' | 'CRZ' | 'CLB' | 'TOGA'>('CRZ');
  const [throttle, setThrottle] = useState<number>(0.78); // 0 to 1
  const [flightLevel, setFlightLevel] = useState<number>(350); // FL350 = 35,000 ft
  const [machSpeed, setMachSpeed] = useState<number>(0.82); // Mach
  const [oatCelsius, setOatCelsius] = useState<number>(-54); // Outside air temp

  // Fault Injection
  const [activeFault, setActiveFault] = useState<string | null>(null);

  // Live Telemetry History
  const [telemetryHistory, setTelemetryHistory] = useState<
    { time: number; n1: number; n2: number; egt: number; fuelFlow: number; thrust: number; vibration: number }[]
  >([]);

  // Telemetry Snapshot
  const [telemetry, setTelemetry] = useState({
    n1: 88.4, // %
    n2: 92.1, // %
    egt: 642, // °C
    egtMargin: 48, // °C
    epr: 1.54, // ratio
    grossThrustKn: 102.5, // kN
    fuelFlowKgH: 2180, // kg/h
    oilPressurePsi: 58.2, // psi
    oilTempC: 104, // °C
    vibrationN1: 0.28, // mils
    vibrationN2: 0.35, // mils
    fadecStatus: 'NOMINAL CH-A',
    compressorBleed: 'CLOSED',
    bypassRatio: 5.4,
  });

  // Listen to external engine changes
  useEffect(() => {
    const handleAeroEngineChange = (e: any) => {
      if (e.detail?.engineId) {
        setSelectedEngine(e.detail.engineId);
      }
    };
    window.addEventListener('dhruva-aero-engine-change', handleAeroEngineChange);
    return () => window.removeEventListener('dhruva-aero-engine-change', handleAeroEngineChange);
  }, []);

  // Update parameters when thrust rating changes
  const handleRatingChange = (rating: 'IDLE' | 'CRZ' | 'CLB' | 'TOGA') => {
    setThrustRating(rating);
    if (rating === 'IDLE') setThrottle(0.25);
    if (rating === 'CRZ') setThrottle(0.78);
    if (rating === 'CLB') setThrottle(0.90);
    if (rating === 'TOGA') setThrottle(1.0);
  };

  // Simulation physics loop
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.4;
      // Air density falloff with altitude
      const altitudeFactor = Math.max(0.35, 1 - flightLevel * 0.0018);

      let targetN1 = 30 + throttle * 68 + noise;
      let targetN2 = 55 + throttle * 44 + noise * 0.8;
      let targetEgt = 420 + throttle * 340 + (activeFault === 'TURBINE_CREEP' ? 95 : 0) + noise * 3;
      let targetThrust = throttle * 122 * altitudeFactor + (activeFault === 'COMPRESSOR_SURGE' ? -25 : 0);
      let targetFuelFlow = (650 + throttle * 2400) * altitudeFactor + (activeFault === 'FUEL_COKING' ? 220 : 0);
      let targetVib = 0.2 + throttle * 0.15 + (activeFault === 'HIGH_VIBRATION' ? 1.85 : 0) + Math.random() * 0.05;

      if (activeFault === 'COMPRESSOR_SURGE') {
        targetN1 += Math.sin(Date.now() / 200) * 8;
        targetEgt += 70;
      }

      setTelemetry((prev) => ({
        n1: Number((prev.n1 * 0.85 + targetN1 * 0.15).toFixed(1)),
        n2: Number((prev.n2 * 0.85 + targetN2 * 0.15).toFixed(1)),
        egt: Math.round(prev.egt * 0.85 + targetEgt * 0.15),
        egtMargin: Math.round(750 - (prev.egt * 0.85 + targetEgt * 0.15)),
        epr: Number((1.1 + throttle * 0.52 * altitudeFactor).toFixed(2)),
        grossThrustKn: Number((prev.grossThrustKn * 0.85 + targetThrust * 0.15).toFixed(1)),
        fuelFlowKgH: Math.round(prev.fuelFlowKgH * 0.85 + targetFuelFlow * 0.15),
        oilPressurePsi: Number((48 + throttle * 18 + noise).toFixed(1)),
        oilTempC: Math.round(92 + throttle * 22),
        vibrationN1: Number(targetVib.toFixed(2)),
        vibrationN2: Number((targetVib * 1.15).toFixed(2)),
        fadecStatus: activeFault ? 'DEGRADED / ADVISORY' : 'NOMINAL CH-A',
        compressorBleed: throttle < 0.4 ? 'STAGE 9 OPEN' : 'CLOSED',
        bypassRatio: Number((5.4 - throttle * 0.3).toFixed(1)),
      }));

      setTelemetryHistory((prev) => {
        const nextTime = prev.length > 0 ? prev[prev.length - 1].time + 1 : 1;
        const nextItem = {
          time: nextTime,
          n1: Number(targetN1.toFixed(1)),
          n2: Number(targetN2.toFixed(1)),
          egt: Math.round(targetEgt),
          fuelFlow: Math.round(targetFuelFlow),
          thrust: Number(targetThrust.toFixed(1)),
          vibration: Number(targetVib.toFixed(2)),
        };
        const updated = [...prev, nextItem];
        return updated.slice(-30);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulating, throttle, flightLevel, activeFault]);

  // Fleet data for Airspace Radar view
  const airspaceFleet = [
    { tail: 'VT-DHR', type: 'Boeing 737-800', engine: 'CFM56-7B26', alt: 'FL350', speed: 'M 0.82', status: 'CRUISE', health: '98%', cycles: 1420 },
    { tail: 'AIC-402', type: 'Airbus A320neo', engine: 'LEAP-1A26', alt: 'FL380', speed: 'M 0.79', status: 'CLIMB', health: '96%', cycles: 980 },
    { tail: 'AF-109', type: 'Diamond DA42', engine: 'Austro AE300', alt: '12,500 FT', speed: '162 KT', status: 'PATROL', health: '99%', cycles: 430 },
    { tail: 'IAF-K31', type: 'Tactical Trainer', engine: 'O-320 Class', alt: '6,000 FT', speed: '125 KT', status: 'CIRCUIT', health: '94%', cycles: 2150 },
    { tail: 'VT-BLR', type: 'Boeing 737-MAX', engine: 'CFM LEAP-1B', alt: 'FL330', speed: 'M 0.81', status: 'DESCENT', health: '97%', cycles: 720 },
  ];

  // Airworthiness Directives (ADs) & Maintenance
  const airworthinessDirectives = [
    { adNumber: 'FAA-2026-14-02', title: 'HPT Stage 1 Blade Boroscope Inspection', dueInCycles: 48, status: 'COMPLIANT' },
    { adNumber: 'EASA-AD-2025-0188', title: 'FADEC Software EEC Revision 4.8.1', dueInCycles: 0, status: 'VERIFIED' },
    { adNumber: 'DGCA-2026-ENG-09', title: 'LPC Booster Shroud Acoustic Liner Check', dueInCycles: 190, status: 'MONITORED' },
    { adNumber: 'FAA-2025-22-11', title: 'Fuel Metering Unit (FMU) Filter Replacement', dueInCycles: 12, status: 'ACTION REQD' },
  ];

  return (
    <div
      id="aeroplane-dashboard-page"
      className="min-h-screen w-full bg-[#080d1a] text-[#dee2f5] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 selection:bg-[#38bdf8] selection:text-[#080d1a]"
    >
      {/* 1. Header Overview Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#38bdf8]/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#0284c7] p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.35)] flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <Plane className="w-5 h-5 text-[#38bdf8]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-[#e0f2fe] tracking-wider uppercase">
                {selectedEngine === 'CFM56-7B-TURBOFAN'
                  ? 'CFM56 High-Bypass Turbofan Twin'
                  : selectedEngine === 'AE300-CLASS'
                  ? 'Austro Engine AE300 Aviation Twin'
                  : 'Lycoming O-320 Aircraft Piston Twin'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40">
                ACTIVE DIGITAL TWIN
              </span>
            </div>
            <p className="text-xs font-mono text-[#94a3b8]">
              Dual-Spool Thermodynamic Simulation, FADEC Flight Envelope & Airworthiness Monitoring
            </p>
          </div>
        </div>

        {/* Quick Simulation & View Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#101828] border border-[#38bdf8]/30 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-[#94a3b8]">FLIGHT PHASE:</span>
            <span className="font-bold text-[#38bdf8]">
              {thrustRating === 'TOGA' ? 'TAKEOFF (TOGA)' : thrustRating === 'CLB' ? 'CLIMB' : thrustRating === 'CRZ' ? 'CRUISE FL350' : 'FLIGHT IDLE'}
            </span>
          </div>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              isSimulating
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 hover:bg-[#10b981]/25'
                : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40 hover:bg-[#f59e0b]/25'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'SIM ACTIVE' : 'SIM PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* N1 Fan Spool */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>N1 (FAN)</span>
            <span className="text-[10px] text-[#38bdf8]">5,175 RPM</span>
          </div>
          <div className="my-1.5">
            <span className="font-mono font-extrabold text-2xl text-[#38bdf8]">{telemetry.n1}</span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">%</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#38bdf8] h-full transition-all duration-300" style={{ width: `${Math.min(100, telemetry.n1)}%` }} />
          </div>
        </div>

        {/* N2 Core Compressor */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>N2 (CORE)</span>
            <span className="text-[10px] text-[#38bdf8]">14,460 RPM</span>
          </div>
          <div className="my-1.5">
            <span className="font-mono font-extrabold text-2xl text-[#e0f2fe]">{telemetry.n2}</span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">%</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0284c7] h-full transition-all duration-300" style={{ width: `${Math.min(100, telemetry.n2)}%` }} />
          </div>
        </div>

        {/* EGT Exhaust Gas Temp */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>EGT (TURBINE)</span>
            <span className={`text-[10px] font-bold ${telemetry.egt > 720 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              +{telemetry.egtMargin}°C MARGIN
            </span>
          </div>
          <div className="my-1.5">
            <span className={`font-mono font-extrabold text-2xl ${telemetry.egt > 720 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
              {telemetry.egt}
            </span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">°C</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${telemetry.egt > 720 ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`}
              style={{ width: `${Math.min(100, (telemetry.egt / 850) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gross Thrust */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>GROSS THRUST</span>
            <span className="text-[10px] text-[#38bdf8]">EPR {telemetry.epr}</span>
          </div>
          <div className="my-1.5">
            <span className="font-mono font-extrabold text-2xl text-[#10b981]">{telemetry.grossThrustKn}</span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">kN</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#10b981] h-full transition-all duration-300" style={{ width: `${Math.min(100, (telemetry.grossThrustKn / 130) * 100)}%` }} />
          </div>
        </div>

        {/* Fuel Flow */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>FUEL FLOW</span>
            <span className="text-[10px] text-[#94a3b8]">JET-A1</span>
          </div>
          <div className="my-1.5">
            <span className="font-mono font-extrabold text-2xl text-[#e0f2fe]">{telemetry.fuelFlowKgH}</span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">kg/h</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#38bdf8] h-full transition-all duration-300" style={{ width: `${Math.min(100, (telemetry.fuelFlowKgH / 3200) * 100)}%` }} />
          </div>
        </div>

        {/* Core Vibration */}
        <div className="bg-[#101828]/90 border border-[#38bdf8]/20 rounded-xl p-3.5 flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
            <span>VIBRATION</span>
            <span className={`text-[10px] font-bold ${telemetry.vibrationN1 > 1.0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              {telemetry.vibrationN1 > 1.0 ? 'EXCEEDANCE' : 'NORMAL'}
            </span>
          </div>
          <div className="my-1.5">
            <span className={`font-mono font-extrabold text-2xl ${telemetry.vibrationN1 > 1.0 ? 'text-[#ef4444]' : 'text-[#38bdf8]'}`}>
              {telemetry.vibrationN1}
            </span>
            <span className="text-xs font-mono text-[#94a3b8] ml-1">mils</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${telemetry.vibrationN1 > 1.0 ? 'bg-[#ef4444]' : 'bg-[#38bdf8]'}`}
              style={{ width: `${Math.min(100, (telemetry.vibrationN1 / 2.5) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Operational Viewport */}
      {activeView === 'cockpit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Turbofan Schematic / Cross-Section View (7 Cols) */}
          <div className="lg:col-span-7 bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#38bdf8]/20">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-display font-bold text-sm text-[#e0f2fe] uppercase tracking-wider">
                  Thermodynamic Turbofan Cutaway Twin
                </span>
              </div>
              <span className="font-mono text-xs text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-0.5 rounded-full border border-[#38bdf8]/30">
                BYPASS RATIO: {telemetry.bypassRatio}:1
              </span>
            </div>

            {/* Visual Turbofan Cross-Section SVG Diagram */}
            <div className="relative w-full h-64 sm:h-72 bg-[#080d1a] rounded-xl border border-[#38bdf8]/20 p-4 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 800 320" className="w-full h-full">
                <defs>
                  <linearGradient id="coldFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="hotFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Outer Nacelle & Bypass Cowl */}
                <path d="M 60 70 Q 250 40 500 50 L 720 80 L 710 110 L 480 90 Q 250 85 80 100 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 60 250 Q 250 280 500 270 L 720 240 L 710 210 L 480 230 Q 250 235 80 220 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />

                {/* Bypass Airflow Arrows */}
                <path d="M 160 85 Q 400 80 680 95" fill="none" stroke="url(#coldFlow)" strokeWidth="6" strokeDasharray="12 6" className={isSimulating ? 'animate-pulse' : ''} />
                <path d="M 160 235 Q 400 240 680 225" fill="none" stroke="url(#coldFlow)" strokeWidth="6" strokeDasharray="12 6" className={isSimulating ? 'animate-pulse' : ''} />

                {/* Center Core Body */}
                <path d="M 220 120 L 450 125 L 640 145 L 680 160 L 640 175 L 450 195 L 220 200 Z" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />

                {/* Fan Rotor (N1) */}
                <g className={isSimulating ? 'animate-pulse' : ''}>
                  <rect x="130" y="70" width="22" height="180" rx="6" fill="#38bdf8" opacity="0.85" />
                  <circle cx="141" cy="160" r="32" fill="#0284c7" />
                  <text x="141" y="164" fill="#080d1a" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">FAN</text>
                </g>

                {/* Low-Pressure & High-Pressure Compressor Stages (N2) */}
                <g>
                  <rect x="230" y="125" width="14" height="70" rx="3" fill="#0284c7" opacity="0.8" />
                  <rect x="260" y="128" width="12" height="64" rx="3" fill="#0284c7" opacity="0.8" />
                  <rect x="290" y="132" width="10" height="56" rx="3" fill="#0284c7" opacity="0.8" />
                  <text x="265" y="112" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">HPC</text>
                </g>

                {/* Combustor Chamber */}
                <g>
                  <rect x="330" y="132" width="55" height="56" rx="6" fill="url(#hotFlow)" opacity="0.9" />
                  <Flame className="w-6 h-6 text-yellow-300" x="345" y="145" />
                  <text x="358" y="112" fill="#f59e0b" fontSize="10" textAnchor="middle" fontFamily="monospace">COMBUST</text>
                </g>

                {/* High-Pressure & Low-Pressure Turbines (HPT / LPT) */}
                <g>
                  <rect x="410" y="132" width="12" height="56" rx="3" fill="#f97316" opacity="0.85" />
                  <rect x="435" y="130" width="14" height="60" rx="3" fill="#f97316" opacity="0.85" />
                  <text x="430" y="112" fill="#f97316" fontSize="10" textAnchor="middle" fontFamily="monospace">TURBINE</text>
                </g>

                {/* Core Exhaust Jet */}
                <path d="M 460 135 Q 560 145 680 155 L 680 165 Q 560 175 460 185 Z" fill="url(#hotFlow)" opacity="0.75" />

                {/* Live Core Temperature Indicator */}
                <text x="358" y="215" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {telemetry.egt}°C
                </text>
              </svg>

              {/* Status Overlay */}
              <div className="absolute bottom-3 left-3 bg-[#101828]/90 border border-[#38bdf8]/30 px-3 py-1.5 rounded-lg font-mono text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                <span>N1: {telemetry.n1}% // N2: {telemetry.n2}%</span>
              </div>
            </div>

            {/* Flight Deck Throttle Quadrant & Controls */}
            <div className="mt-4 pt-4 border-t border-[#38bdf8]/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8] mb-2">
                  <span>THROTTLE LEVER (TRA)</span>
                  <span className="font-bold text-[#38bdf8]">{Math.round(throttle * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.01"
                  value={throttle}
                  onChange={(e) => setThrottle(parseFloat(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#64748b] mt-1">
                  <button onClick={() => handleRatingChange('IDLE')} className="hover:text-[#38bdf8] cursor-pointer">IDLE</button>
                  <button onClick={() => handleRatingChange('CRZ')} className="hover:text-[#38bdf8] cursor-pointer">CRZ</button>
                  <button onClick={() => handleRatingChange('CLB')} className="hover:text-[#38bdf8] cursor-pointer">CLB</button>
                  <button onClick={() => handleRatingChange('TOGA')} className="hover:text-[#38bdf8] cursor-pointer text-[#ef4444]">TOGA</button>
                </div>
              </div>

              {/* Altitude & Flight Level Selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8] mb-2">
                  <span>ALTITUDE (FLIGHT LEVEL)</span>
                  <span className="font-bold text-[#38bdf8]">FL{flightLevel} ({flightLevel * 100} FT)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="410"
                  step="10"
                  value={flightLevel}
                  onChange={(e) => setFlightLevel(parseInt(e.target.value))}
                  className="w-full accent-[#0284c7] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#64748b] mt-1">
                  <span>SEA LEVEL</span>
                  <span>FL180</span>
                  <span>FL350 CRZ</span>
                  <span>FL410 MAX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Graphs & Diagnostics Deck (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Dual Spool RPM Graph */}
            <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-xs text-[#e0f2fe] uppercase tracking-wider">
                  Dual-Spool Telemetry History (N1 vs N2)
                </span>
                <span className="text-[10px] font-mono text-[#94a3b8]">Live 30s Buffer</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[30, 105]} stroke="#64748b" fontSize={10} fontStyle="monospace" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#080d1a', borderColor: '#38bdf8', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Line type="monotone" dataKey="n1" stroke="#38bdf8" strokeWidth={2} dot={false} name="N1 Fan (%)" />
                    <Line type="monotone" dataKey="n2" stroke="#f59e0b" strokeWidth={2} dot={false} name="N2 Core (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs font-mono pt-2 border-t border-[#38bdf8]/15">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                  <span>N1 Low Pressure ({telemetry.n1}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span>N2 High Pressure ({telemetry.n2}%)</span>
                </div>
              </div>
            </div>

            {/* Aviation Fault Injection & Safety Deck */}
            <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                  <span className="font-display font-bold text-xs text-[#e0f2fe] uppercase tracking-wider">
                    FADEC In-Flight Anomaly Injection
                  </span>
                </div>
                {activeFault && (
                  <button
                    onClick={() => setActiveFault(null)}
                    className="text-[10px] font-mono text-[#38bdf8] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Fault
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 my-2">
                <button
                  onClick={() => setActiveFault(activeFault === 'COMPRESSOR_SURGE' ? null : 'COMPRESSOR_SURGE')}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                    activeFault === 'COMPRESSOR_SURGE'
                      ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : 'bg-[#080d1a] border-[#38bdf8]/20 text-[#dee2f5] hover:border-[#38bdf8]/50'
                  }`}
                >
                  <div className="font-bold">Compressor Surge</div>
                  <div className="text-[10px] text-[#94a3b8]">HPC Flow Breakdown</div>
                </button>

                <button
                  onClick={() => setActiveFault(activeFault === 'TURBINE_CREEP' ? null : 'TURBINE_CREEP')}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                    activeFault === 'TURBINE_CREEP'
                      ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : 'bg-[#080d1a] border-[#38bdf8]/20 text-[#dee2f5] hover:border-[#38bdf8]/50'
                  }`}
                >
                  <div className="font-bold">Turbine Oxidation</div>
                  <div className="text-[10px] text-[#94a3b8]">EGT Spike +95°C</div>
                </button>

                <button
                  onClick={() => setActiveFault(activeFault === 'HIGH_VIBRATION' ? null : 'HIGH_VIBRATION')}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                    activeFault === 'HIGH_VIBRATION'
                      ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : 'bg-[#080d1a] border-[#38bdf8]/20 text-[#dee2f5] hover:border-[#38bdf8]/50'
                  }`}
                >
                  <div className="font-bold">Bearing Unbalance</div>
                  <div className="text-[10px] text-[#94a3b8]">Vibration 1.85 mils</div>
                </button>

                <button
                  onClick={() => setActiveFault(activeFault === 'FUEL_COKING' ? null : 'FUEL_COKING')}
                  className={`p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                    activeFault === 'FUEL_COKING'
                      ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                      : 'bg-[#080d1a] border-[#38bdf8]/20 text-[#dee2f5] hover:border-[#38bdf8]/50'
                  }`}
                >
                  <div className="font-bold">Fuel Nozzle Coking</div>
                  <div className="text-[10px] text-[#94a3b8]">Spray Pattern Distort</div>
                </button>
              </div>

              {activeFault ? (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/40 p-2.5 rounded-xl text-xs font-mono text-[#ef4444] flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    FADEC ADVISORY: {activeFault} triggered. Throttle restricted. Recommend throttle back to IDLE.
                  </span>
                </div>
              ) : (
                <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-xl text-xs font-mono text-[#10b981] flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>FADEC System Healthy. All channels synchronized within FAA Part 33 specs.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Telemetry Dedicated View */}
      {activeView === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
            <h2 className="font-display font-bold text-sm text-[#e0f2fe] uppercase tracking-wider mb-4">
              EGT vs Target Limit (Exhaust Gas Temperature)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[400, 850]} stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#080d1a', borderColor: '#f59e0b' }} />
                  <Area type="monotone" dataKey="egt" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="EGT (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
            <h2 className="font-display font-bold text-sm text-[#e0f2fe] uppercase tracking-wider mb-4">
              Thrust vs Fuel Flow Rate
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#080d1a', borderColor: '#38bdf8' }} />
                  <Line type="monotone" dataKey="thrust" stroke="#10b981" strokeWidth={2} name="Thrust (kN)" />
                  <Line type="monotone" dataKey="fuelFlow" stroke="#38bdf8" strokeWidth={2} name="Fuel Flow (kg/h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. Airspace Fleet Radar View */}
      {activeView === 'fleet' && (
        <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-[#38bdf8]" />
              <h2 className="font-display font-bold text-base text-[#e0f2fe] uppercase tracking-wider">
                Commercial & Defense Aviation Airspace Radar
              </h2>
            </div>
            <span className="text-xs font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-3 py-1 rounded-full border border-[#38bdf8]/30">
              5 AIRCRAFT ACTIVE IN AIRSPACE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#080d1a] border-b border-[#38bdf8]/20 text-[#94a3b8]">
                <tr>
                  <th className="py-3 px-4">TAIL NUMBER</th>
                  <th className="py-3 px-4">AIRFRAME</th>
                  <th className="py-3 px-4">ENGINE MODEL</th>
                  <th className="py-3 px-4">ALTITUDE</th>
                  <th className="py-3 px-4">AIRSPEED</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">HEALTH</th>
                  <th className="py-3 px-4">CYCLES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {airspaceFleet.map((ac) => (
                  <tr key={ac.tail} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#38bdf8]">{ac.tail}</td>
                    <td className="py-3 px-4 text-[#e0f2fe]">{ac.type}</td>
                    <td className="py-3 px-4 text-[#94a3b8]">{ac.engine}</td>
                    <td className="py-3 px-4 text-[#e0f2fe]">{ac.alt}</td>
                    <td className="py-3 px-4 text-[#38bdf8]">{ac.speed}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                        {ac.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#10b981]">{ac.health}</td>
                    <td className="py-3 px-4 text-[#94a3b8]">{ac.cycles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Airworthiness & MRO Directives View */}
      {activeView === 'maintenance' && (
        <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#38bdf8]" />
              <h2 className="font-display font-bold text-base text-[#e0f2fe] uppercase tracking-wider">
                FAA / EASA Airworthiness Directives (ADs) & Hot Section Maintenance
              </h2>
            </div>
            <span className="text-xs font-mono text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded-full border border-[#10b981]/30">
              AIRWORTHINESS STATUS: CERTIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {airworthinessDirectives.map((ad) => (
              <div key={ad.adNumber} className="bg-[#080d1a] border border-[#38bdf8]/20 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-[#38bdf8]">{ad.adNumber}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        ad.status === 'COMPLIANT' || ad.status === 'VERIFIED'
                          ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                          : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                      }`}
                    >
                      {ad.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#e0f2fe]">{ad.title}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                  <span>REMAINING CYCLES:</span>
                  <span className="font-bold text-[#e0f2fe]">{ad.dueInCycles > 0 ? `${ad.dueInCycles} CYCLES` : 'CURRENT'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Simulation / Flight Envelope View */}
      {activeView === 'simulation' && (
        <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
          <h2 className="font-display font-bold text-base text-[#e0f2fe] uppercase tracking-wider mb-4">
            Flight Envelope & Aerodynamic Density Falloff Simulation
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#080d1a] p-4 rounded-xl border border-[#38bdf8]/20 flex flex-col gap-3 font-mono text-xs">
              <span className="text-[#38bdf8] font-bold">ATMOSPHERIC PARAMETERS</span>
              <div className="flex justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[#94a3b8]">PRESSURE ALTITUDE:</span>
                <span className="text-[#e0f2fe]">{flightLevel * 100} FT</span>
              </div>
              <div className="flex justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[#94a3b8]">AMBIENT TEMP (OAT):</span>
                <span className="text-[#e0f2fe]">{oatCelsius}°C</span>
              </div>
              <div className="flex justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[#94a3b8]">MACH NUMBER:</span>
                <span className="text-[#38bdf8]">M {machSpeed}</span>
              </div>
              <div className="flex justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[#94a3b8]">AIR DENSITY (ρ):</span>
                <span className="text-[#e0f2fe]">{(1.225 * Math.pow(1 - (0.0065 * flightLevel * 30.48) / 288.15, 4.256)).toFixed(3)} kg/m³</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#080d1a] p-4 rounded-xl border border-[#38bdf8]/20 flex flex-col justify-between">
              <span className="text-xs font-mono text-[#94a3b8] mb-2">Thrust Retention Curve across Flight Levels</span>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { fl: 'FL0', thrust: 122 },
                      { fl: 'FL100', thrust: 104 },
                      { fl: 'FL200', thrust: 86 },
                      { fl: 'FL300', thrust: 68 },
                      { fl: 'FL350', thrust: 58 },
                      { fl: 'FL410', thrust: 44 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="fl" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#080d1a', borderColor: '#38bdf8' }} />
                    <Bar dataKey="thrust" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Thrust (kN)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Diagnostics Dedicated View */}
      {activeView === 'diagnostics' && (
        <div className="bg-[#101828]/90 border border-[#38bdf8]/30 rounded-2xl p-6">
          <h2 className="font-display font-bold text-base text-[#e0f2fe] uppercase tracking-wider mb-4">
            FADEC Channel Diagnostics & Excursion Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#080d1a] border border-[#38bdf8]/20 p-4 rounded-xl font-mono text-xs">
              <span className="text-[#38bdf8] font-bold block mb-2">CHANNEL A (PRIMARY)</span>
              <div className="space-y-1.5 text-[#94a3b8]">
                <div>CPU Load: <span className="text-[#10b981]">14%</span></div>
                <div>Sensor Bus: <span className="text-[#10b981]">ARINC 429 Nominal</span></div>
                <div>Actuator Current: <span className="text-[#e0f2fe]">1.42 A</span></div>
                <div>Status: <span className="text-[#10b981] font-bold">HEALTHY</span></div>
              </div>
            </div>

            <div className="bg-[#080d1a] border border-[#38bdf8]/20 p-4 rounded-xl font-mono text-xs">
              <span className="text-[#38bdf8] font-bold block mb-2">CHANNEL B (HOT STANDBY)</span>
              <div className="space-y-1.5 text-[#94a3b8]">
                <div>CPU Load: <span className="text-[#10b981]">12%</span></div>
                <div>Sensor Bus: <span className="text-[#10b981]">ARINC 429 Sync</span></div>
                <div>Actuator Current: <span className="text-[#e0f2fe]">Standby</span></div>
                <div>Status: <span className="text-[#10b981] font-bold">SYNCHRONIZED</span></div>
              </div>
            </div>

            <div className="bg-[#080d1a] border border-[#38bdf8]/20 p-4 rounded-xl font-mono text-xs">
              <span className="text-[#f59e0b] font-bold block mb-2">FADEC FAULT LOGS</span>
              <div className="space-y-1.5 text-[#94a3b8]">
                {activeFault ? (
                  <div className="text-[#ef4444] font-bold">
                    [ACTIVE] {activeFault}
                  </div>
                ) : (
                  <div className="text-[#10b981]">0 active diagnostic trouble codes.</div>
                )}
                <div>Cross-Channel Comparison: <span className="text-[#10b981]">MATCH</span></div>
                <div>Over-speed Protection: <span className="text-[#10b981]">ARMED</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AeroplaneDashboard;

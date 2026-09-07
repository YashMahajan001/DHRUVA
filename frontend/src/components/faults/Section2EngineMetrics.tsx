import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  HeartPulse,
  AlertOctagon,
  Clock,
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const Section2EngineMetrics: React.FC = () => {
  const { selectedEngine, telemetry, alerts } = useDashboard();

  // Active faults count for selected engine
  const activeFaultsCount = selectedEngine.id === 'eng-02' ? 2 : selectedEngine.id === 'eng-03' ? 3 : 0;

  // Determine color-coded state classes
  // GREEN = NORMAL, CYAN = INFORMATION, AMBER = WARNING, RED = CRITICAL
  const getHealthState = (health: number) => {
    if (health >= 90) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (health >= 75) return { label: 'WARNING', text: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/40', badge: 'bg-[#303443] text-[#b4c5ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const getFaultsState = (count: number) => {
    if (count === 0) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (count <= 2) return { label: 'WARNING', text: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/40', badge: 'bg-[#303443] text-[#b4c5ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const getRulState = (rul: number) => {
    if (rul > 100) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (rul > 25) return { label: 'INFORMATION', text: 'text-[#7df4ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/30', badge: 'bg-[#00f0ff]/15 text-[#7df4ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const getChtState = (cht: number) => {
    if (cht <= 165) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (cht <= 179.9) return { label: 'WARNING', text: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/40', badge: 'bg-[#303443] text-[#b4c5ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const getOilState = (press: number) => {
    if (press >= 4.2) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (press >= 3.8) return { label: 'WARNING', text: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/40', badge: 'bg-[#303443] text-[#b4c5ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const getVibState = (vib: number) => {
    if (vib <= 2.2) return { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' };
    if (vib <= 3.5) return { label: 'WARNING', text: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/40', badge: 'bg-[#303443] text-[#b4c5ff]' };
    return { label: 'CRITICAL', text: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/40', badge: 'bg-[#93000a] text-[#ffdad6]' };
  };

  const healthState = getHealthState(selectedEngine.healthPercent);
  const faultsState = getFaultsState(activeFaultsCount);
  const rulState = getRulState(selectedEngine.rulHours);
  const chtState = getChtState(telemetry.cht);
  const oilState = getOilState(telemetry.oilPressureBar);
  const vibState = getVibState(telemetry.vibrationRmsG);

  // 8 Exact KPI Metrics required:
  // 1. Engine Health
  // 2. Active Faults
  // 3. RUL
  // 4. RPM
  // 5. CHT
  // 6. EGT
  // 7. Oil Pressure
  // 8. Vibration
  const metrics = [
    {
      id: 'kpi-health',
      label: 'Engine Health',
      value: `${selectedEngine.healthPercent.toFixed(1)}%`,
      subtext: `Conf: ${selectedEngine.aiConfidence}%`,
      icon: HeartPulse,
      state: healthState,
      delta: selectedEngine.healthPercent < 90 ? '-4.2%' : '+0.1%',
      isNegative: selectedEngine.healthPercent < 90,
    },
    {
      id: 'kpi-faults',
      label: 'Active Faults',
      value: `${activeFaultsCount}`,
      subtext: activeFaultsCount > 0 ? 'Excursion Detected' : 'All Clear',
      icon: AlertOctagon,
      state: faultsState,
      delta: activeFaultsCount > 0 ? '+1 New' : '0',
      isNegative: activeFaultsCount > 0,
    },
    {
      id: 'kpi-rul',
      label: 'RUL',
      value: `${selectedEngine.rulHours.toFixed(1)} h`,
      subtext: 'Safe Remaining Flight',
      icon: Clock,
      state: rulState,
      delta: '-2.4h/sort',
      isNegative: selectedEngine.rulHours < 50,
    },
    {
      id: 'kpi-rpm',
      label: 'RPM',
      value: `${telemetry.rpm}`,
      subtext: 'Cruise Target 2550',
      icon: Gauge,
      state: { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' },
      delta: '±12 rpm',
      isNegative: false,
    },
    {
      id: 'kpi-cht',
      label: 'CHT',
      value: `${telemetry.cht.toFixed(1)}°C`,
      subtext: `Peak Cyl-2 (Max 180)`,
      icon: Thermometer,
      state: chtState,
      delta: `+${(telemetry.cht - telemetry.chtBaseline).toFixed(1)}°C`,
      isNegative: telemetry.cht > 170,
    },
    {
      id: 'kpi-egt',
      label: 'EGT',
      value: `${telemetry.egt}°C`,
      subtext: 'Band: 760-840°C',
      icon: Flame,
      state: { label: 'NORMAL', text: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40', badge: 'bg-[#00f0ff]/15 text-[#00f0ff]' },
      delta: '±4°C',
      isNegative: false,
    },
    {
      id: 'kpi-oil-pressure',
      label: 'Oil Pressure',
      value: `${telemetry.oilPressureBar.toFixed(2)} bar`,
      subtext: `Sump: ${telemetry.oilTempC}°C`,
      icon: Droplets,
      state: oilState,
      delta: '0.00',
      isNegative: telemetry.oilPressureBar < 4.0,
    },
    {
      id: 'kpi-vibration',
      label: 'Vibration',
      value: `${telemetry.vibrationRmsG.toFixed(2)} G`,
      subtext: `Kurtosis: ${telemetry.vibrationKurtosis || 3.1}`,
      icon: Activity,
      state: vibState,
      delta: telemetry.vibrationRmsG > 2.5 ? '+0.4 G' : 'Norm',
      isNegative: telemetry.vibrationRmsG > 2.5,
    },
  ];

  return (
    <section id="section-2-engine-metrics" className="w-full">
      {/* 8 Evenly Sized Compact KPI Cards with Exactly Aligned Heights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              id={m.id}
              className={`h-[102px] rounded-lg bg-[#161b29] border p-2.5 flex flex-col justify-between transition-all hover:border-[#00f0ff]/50 shadow-md ${m.state.border}`}
            >
              {/* Top Row: Label & Micro Badge */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono-telemetry text-[10px] text-[#849495] uppercase font-bold tracking-wider truncate">
                  {m.label}
                </span>
                <span className={`text-[8px] font-mono-telemetry font-bold px-1.5 py-0.2 rounded uppercase ${m.state.badge}`}>
                  {m.state.label}
                </span>
              </div>

              {/* Middle Row: Primary Value & Icon */}
              <div className="flex items-baseline justify-between gap-1">
                <span className={`font-mono-telemetry font-bold text-lg sm:text-xl tracking-tight ${m.state.text}`}>
                  {m.value}
                </span>
                <div className={`p-1 rounded ${m.state.bg} ${m.state.text}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Bottom Row: Subtext & Micro Delta */}
              <div className="flex items-center justify-between text-[9px] font-mono-telemetry text-[#849495] pt-1 border-t border-[#3b494b]/30">
                <span className="truncate max-w-[85px]">{m.subtext}</span>
                <span className={`font-bold flex items-center ${m.isNegative ? 'text-[#ffb4ab]' : 'text-[#00f0ff]'}`}>
                  {m.isNegative ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />}
                  {m.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { Download, Activity, CheckCircle2, AlertTriangle, ShieldAlert, Info, TrendingDown, Gauge } from 'lucide-react';

export const ComponentInspector: React.FC = () => {
  const {
    selectedSubsystem,
    telemetry,
    exportSubsystemLogs,
    toggleStressSimulation,
    stressSimulationActive
  } = useMissionDashboard();

  // Dynamic telemetry value replacement based on active subsystem and live readings
  const getSubsystemDisplayParams = () => {
    switch (selectedSubsystem.id) {
      case 'cylinder':
        return [
          {
            label: 'PEAK CHT TEMP',
            val: `${telemetry.chtPeak.toFixed(0)} °C`,
            note: 'TOLERANCE < 205°C',
            isWarning: telemetry.chtPeak > 195
          },
          {
            label: 'CHT SPREAD (VARIANCE)',
            val: `${telemetry.chtSpread.toFixed(1)} °C`,
            note: 'NOMINAL (± 6°C)',
            isWarning: telemetry.chtSpread > 6.0
          },
          {
            label: 'COMPRESSION RATIO',
            val: '10.4 : 1',
            note: 'CYL 1-4 BALANCED',
            isWarning: false
          },
          {
            label: 'VALVE CLEARANCE',
            val: `${telemetry.valveClearance.toFixed(2)} mm`,
            note: 'HYDRAULIC LIFTER OK',
            isWarning: telemetry.valveClearance > 0.2
          }
        ];
      case 'cooling':
        return [
          {
            label: 'COOLANT / AIR DELTA',
            val: `${telemetry.coolantDelta.toFixed(1)} %`,
            note: 'MARGIN REDUCED',
            isWarning: telemetry.coolantDelta < -15
          },
          {
            label: 'RADIATOR AIRFLOW',
            val: `${telemetry.radiatorAirflow.toFixed(1)} m/s`,
            note: 'RAM AIR SCOOP OPEN',
            isWarning: false
          },
          {
            label: 'PUMP RPM',
            val: `${stressSimulationActive ? '4,450' : '3,820'} RPM`,
            note: 'AUX COOLING ACTIVE',
            isWarning: false
          },
          {
            label: 'GLYCOL MIXTURE',
            val: '50 / 50',
            note: 'FREEZING -38°C',
            isWarning: false
          }
        ];
      case 'lubrication':
        return [
          {
            label: 'OIL PRESSURE',
            val: `${telemetry.oilPressure.toFixed(1)} PSI`,
            note: 'TARGET: 75-90 PSI',
            isWarning: telemetry.oilPressure < 78
          },
          {
            label: 'SUMP OIL TEMP',
            val: `${telemetry.oilTemperature.toFixed(1)} °C`,
            note: 'SAFE OPERATING RANGE',
            isWarning: telemetry.oilTemperature > 95
          },
          {
            label: 'VISCOSITY INDEX',
            val: 'SAE 15W-50',
            note: 'DEGRADATION: 2.1%',
            isWarning: false
          },
          {
            label: 'FILTER Δ PRESSURE',
            val: '3.2 PSI',
            note: 'IMPEDANCE NOMINAL',
            isWarning: false
          }
        ];
      case 'fuel':
        return [
          {
            label: 'FLOW RATE',
            val: `${telemetry.fuelFlow.toFixed(1)} L/h`,
            note: 'CRUISE FUEL BURN',
            isWarning: telemetry.fuelFlow > 40
          },
          {
            label: 'INJECTOR BALANCE',
            val: '99.2 %',
            note: 'TRIM ADJUSTED',
            isWarning: false
          },
          {
            label: 'FUEL RAIL PRESSURE',
            val: `${telemetry.fuelRailPressure.toFixed(1)} BAR`,
            note: 'CONSTANT REGULATED',
            isWarning: false
          },
          {
            label: 'AFR STOICHIOMETRY',
            val: '14.7 : 1',
            note: 'LAMBDA = 1.002',
            isWarning: false
          }
        ];
      case 'electrical':
        return [
          {
            label: 'MAGNETO DROP',
            val: '25 RPM',
            note: 'LIMIT < 150 RPM',
            isWarning: false
          },
          {
            label: 'AVIONICS DC BUS',
            val: `${telemetry.batteryVoltage.toFixed(1)} V`,
            note: 'ALTERNATOR NOMINAL',
            isWarning: false
          },
          {
            label: 'SPARK PLUG RESISTANCE',
            val: '1.2 kΩ',
            note: 'DUAL PLUG BALANCED',
            isWarning: false
          },
          {
            label: 'ECU REDUNDANCY',
            val: 'LANE A + B',
            note: 'HOT-SWAP ACTIVE',
            isWarning: false
          }
        ];
      default:
        return selectedSubsystem.params.map(p => ({ ...p, isWarning: false }));
    }
  };

  const dynamicParams = getSubsystemDisplayParams();
  const currentHealth = stressSimulationActive
    ? Math.max(54, selectedSubsystem.health - 22)
    : selectedSubsystem.health;

  // Harmonic spectrum animated bars
  const baseFftBars = [35, 42, 60, 94, 75, 48, 30, 25, 15, 18, 10, 8];
  const fftMulti = stressSimulationActive ? 1.3 : 1.0;

  return (
    <div className="xl:col-span-4 flex flex-col gap-4 select-none">
      {/* COMPONENT HEALTH CARD */}
      <div className="bg-[#161b29]/95 p-5 rounded-xl shadow-xl flex flex-col gap-4 relative overflow-hidden border border-[#3b494b]/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
              SUBSYSTEM TELEMETRY
            </span>
            <h2 id="inspector-name" className="font-['Space_Grotesk'] text-lg text-[#dee2f5] font-bold mt-0.5">
              {selectedSubsystem.name}
            </h2>
          </div>
          <div
            id="inspector-badge"
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-bold border transition-colors shrink-0 ${
              stressSimulationActive
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : currentHealth < 85
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30'
            }`}
          >
            {stressSimulationActive
              ? `STRESS // ${currentHealth}%`
              : `${currentHealth >= 90 ? 'NOMINAL' : 'ADVISORY'} // ${currentHealth}%`}
          </div>
        </div>

        {/* HEALTH PROGRESS GAUGE */}
        <div className="flex flex-col gap-1.5 bg-[#090e1b]/70 p-3 rounded-lg border border-[#3b494b]/20">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-[#849495] uppercase font-semibold">INTEGRITY MATRIX CONFIDENCE</span>
            <span id="inspector-conf-score" className="text-[#00f0ff] font-bold">
              {selectedSubsystem.confidence}
            </span>
          </div>
          <div className="w-full bg-[#303443] h-2 rounded-full overflow-hidden">
            <div
              id="inspector-bar"
              className={`h-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.3)] ${
                stressSimulationActive
                  ? 'bg-red-500'
                  : currentHealth < 85
                  ? 'bg-amber-400'
                  : 'bg-[#00f0ff]'
              }`}
              style={{ width: `${currentHealth}%` }}
            />
          </div>
        </div>

        {/* DYNAMIC KEY TELEMETRY PAIRS */}
        <div id="inspector-metrics" className="grid grid-cols-2 gap-2.5">
          {dynamicParams.map((p, idx) => (
            <div key={idx} className="bg-[#090e1b]/80 p-3 rounded-lg border border-[#3b494b]/20 flex flex-col justify-between">
              <span className="font-mono text-[9px] text-[#849495] uppercase font-semibold block truncate">
                {p.label}
              </span>
              <span
                className={`font-mono text-base font-bold block my-1 ${
                  p.isWarning ? 'text-red-400' : 'text-[#dee2f5]'
                }`}
              >
                {p.val}
              </span>
              <span
                className={`font-mono text-[9px] block truncate font-medium ${
                  p.isWarning ? 'text-red-400' : 'text-[#00dbe9]'
                }`}
              >
                {p.note}
              </span>
            </div>
          ))}
        </div>

        {/* COMPONENT DEGRADATION HISTORICAL TREND */}
        <div className="bg-[#090e1b]/80 p-3 rounded-lg flex flex-col gap-2 border border-[#3b494b]/20">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#849495] uppercase font-semibold">
              DEGRADATION TREND (LAST 50H)
            </span>
            <span className="font-mono text-[10px] text-[#00f0ff] font-bold px-1.5 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20">
              -0.4% DELTA
            </span>
          </div>
          {/* MINI SVG SPARKLINE CHART */}
          <div className="w-full h-12 flex items-end pt-1">
            <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
              <path
                d="M0,8 L20,9 L40,12 L60,11 L80,15 L100,14 L120,18 L140,19 L160,22 L180,24 L200,26"
                fill="none"
                stroke={stressSimulationActive ? '#ef4444' : '#00f0ff'}
                strokeWidth="2"
              />
              <path
                d="M0,8 L20,9 L40,12 L60,11 L80,15 L100,14 L120,18 L140,19 L160,22 L180,24 L200,26 L200,40 L0,40 Z"
                fill={stressSimulationActive ? 'rgba(239,68,68,0.1)' : 'rgba(0,240,255,0.1)'}
              />
            </svg>
          </div>
        </div>

        {/* DETECTED MICRO-ANOMALIES & DIAGNOSTIC LOG */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#849495] uppercase font-semibold">
              MICRO-FAULT DETECTION LOG
            </span>
            <span className="font-mono text-[9px] text-[#00dbe9] font-semibold">
              AUTO-EVAL
            </span>
          </div>
          <div id="inspector-fault-list" className="flex flex-col gap-1.5">
            {selectedSubsystem.faults.map((fault) => (
              <div
                key={fault.id}
                className="p-2.5 bg-[#090e1b]/80 rounded-lg flex items-start gap-2.5 border border-[#3b494b]/20"
              >
                {fault.icon === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
                ) : fault.icon === 'error' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff] shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-[#dee2f5]">
                    {fault.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#849495] mt-0.5">
                    {fault.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TACTICAL COMMAND ACTIONS */}
        <div className="pt-1 flex gap-2">
          <button
            onClick={exportSubsystemLogs}
            className="flex-1 py-2 px-3 bg-[#252a38] hover:bg-[#303443] text-[#dee2f5] font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors text-center border border-[#3b494b]/40 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-3 h-3 text-[#00f0ff]" />
            <span>EXPORT LOG</span>
          </button>
          <button
            onClick={toggleStressSimulation}
            className={`flex-1 py-2 px-3 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              stressSimulationActive
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-[#00f0ff] text-[#00363a] hover:bg-[#7df4ff]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>{stressSimulationActive ? 'NORMALIZE TEST' : 'SIMULATE STRESS'}</span>
          </button>
        </div>
      </div>

      {/* ACOUSTIC FREQUENCY SPECTRUM / FFT MINI-DOCK */}
      <div className="bg-[#161b29]/95 p-4 rounded-xl shadow-xl flex flex-col gap-2 border border-[#3b494b]/30">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#849495] uppercase font-semibold">
            FFT VIBRATION SPECTRUM
          </span>
          <span className="font-mono text-[10px] text-[#00f0ff] font-bold">
            PEAK: {telemetry.vibrationPeakHz.toFixed(1)} Hz
          </span>
        </div>
        <div className="h-16 w-full flex items-end justify-between gap-1.5 bg-[#090e1b] p-2 rounded-lg border border-[#3b494b]/20">
          {baseFftBars.map((val, i) => {
            const dynamicHeight = Math.min(100, Math.max(10, Math.round(val * fftMulti + (Math.sin(i + Date.now() * 0.002) * 8))));
            return (
              <div
                key={i}
                className="w-full bg-[#00f0ff] rounded-t transition-all duration-300"
                style={{
                  height: `${dynamicHeight}%`,
                  opacity: i === 3 ? 1 : 0.25 + (i / 12) * 0.55
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between font-mono text-[9px] text-[#849495] px-1">
          <span>0 Hz (1X)</span>
          <span>125 Hz (Harmonic)</span>
          <span>500 Hz</span>
        </div>
      </div>
    </div>
  );
};

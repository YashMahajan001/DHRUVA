import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';

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
    <div className="xl:col-span-4 flex flex-col gap-unit-md select-none">
      {/* COMPONENT HEALTH CARD */}
      <div className="bg-surface-container-low/95 p-unit-lg rounded shadow-xl flex flex-col gap-unit-md relative overflow-hidden border border-outline-variant/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
              SUBSYSTEM TELEMETRY
            </span>
            <h2 id="inspector-name" className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {selectedSubsystem.name}
            </h2>
          </div>
          <div
            id="inspector-badge"
            className={`px-unit-sm py-1 rounded font-label-tactical text-label-tactical uppercase font-bold border transition-colors ${
              stressSimulationActive
                ? 'bg-error-container text-on-error-container border-error/50 animate-pulse'
                : currentHealth < 85
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-primary/10 text-primary border-primary/30'
            }`}
          >
            {stressSimulationActive
              ? `STRESS // ${currentHealth}%`
              : `${currentHealth >= 90 ? 'NOMINAL' : 'ADVISORY'} // ${currentHealth}%`}
          </div>
        </div>

        {/* HEALTH PROGRESS GAUGE */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-label-micro text-label-micro">
            <span className="text-outline uppercase">INTEGRITY MATRIX CONFIDENCE</span>
            <span id="inspector-conf-score" className="text-primary font-bold font-mono">
              {selectedSubsystem.confidence}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
            <div
              id="inspector-bar"
              className={`h-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.3)] ${
                stressSimulationActive
                  ? 'bg-red-500'
                  : currentHealth < 85
                  ? 'bg-amber-400'
                  : 'bg-primary'
              }`}
              style={{ width: `${currentHealth}%` }}
            ></div>
          </div>
        </div>

        {/* DYNAMIC KEY TELEMETRY PAIRS */}
        <div id="inspector-metrics" className="grid grid-cols-2 gap-unit-xs">
          {dynamicParams.map((p, idx) => (
            <div key={idx} className="bg-surface-container p-unit-sm rounded border border-outline-variant/10">
              <span className="font-label-micro text-label-micro text-outline uppercase block truncate">
                {p.label}
              </span>
              <span
                className={`font-telemetry-num-md text-telemetry-num-md font-bold block ${
                  p.isWarning ? 'text-red-400' : 'text-on-surface'
                }`}
              >
                {p.val}
              </span>
              <span
                className={`font-label-micro text-label-micro block mt-0.5 truncate ${
                  p.isWarning ? 'text-red-400' : 'text-primary-fixed'
                }`}
              >
                {p.note}
              </span>
            </div>
          ))}
        </div>

        {/* COMPONENT DEGRADATION HISTORICAL TREND */}
        <div className="bg-surface-container p-unit-sm rounded flex flex-col gap-1 border border-outline-variant/10">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-outline uppercase">
              DEGRADATION TREND (LAST 50H)
            </span>
            <span className="font-label-micro text-label-micro text-primary font-mono">
              -0.4% DELTA
            </span>
          </div>
          {/* MINI SVG SPARKLINE CHART */}
          <div className="w-full h-12 flex items-end">
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
        <div className="flex flex-col gap-unit-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-outline uppercase">
              MICRO-FAULT DETECTION LOG
            </span>
            <span className="font-label-micro text-label-micro text-on-surface-variant font-mono">
              AUTO-EVAL
            </span>
          </div>
          <div id="inspector-fault-list" className="flex flex-col gap-1">
            {selectedSubsystem.faults.map((fault) => (
              <div
                key={fault.id}
                className="p-unit-xs bg-surface-container rounded flex items-start gap-unit-xs border border-outline-variant/10"
              >
                <span
                  className={`material-symbols-outlined text-xs mt-0.5 ${
                    fault.icon === 'warning'
                      ? 'text-secondary-fixed'
                      : fault.icon === 'error'
                      ? 'text-red-400'
                      : 'text-primary'
                  }`}
                >
                  {fault.icon}
                </span>
                <div className="flex flex-col">
                  <span className="font-label-tactical text-label-tactical text-on-surface">
                    {fault.title}
                  </span>
                  <span className="font-label-micro text-label-micro text-outline">
                    {fault.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TACTICAL COMMAND ACTIONS */}
        <div className="pt-unit-xs flex gap-unit-xs">
          <button
            onClick={exportSubsystemLogs}
            className="flex-1 py-unit-xs bg-surface-container-high hover:bg-surface-bright text-primary font-label-tactical text-label-tactical uppercase rounded transition-colors text-center border border-outline-variant/30 cursor-pointer"
          >
            Export Log
          </button>
          <button
            onClick={toggleStressSimulation}
            className={`flex-1 py-unit-xs font-label-tactical text-label-tactical font-bold uppercase rounded shadow-sm transition-all text-center cursor-pointer ${
              stressSimulationActive
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-primary-container text-on-primary-container hover:opacity-90'
            }`}
          >
            {stressSimulationActive ? 'Normalize Test' : 'Simulate Stress'}
          </button>
        </div>
      </div>

      {/* ACOUSTIC FREQUENCY SPECTRUM / FFT MINI-DOCK */}
      <div className="bg-surface-container-low/95 p-unit-md rounded shadow-xl flex flex-col gap-unit-xs border border-outline-variant/20">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline uppercase">
            FFT VIBRATION SPECTRUM
          </span>
          <span className="font-label-micro text-label-micro text-primary font-mono">
            PEAK: {telemetry.vibrationPeakHz.toFixed(1)} Hz
          </span>
        </div>
        <div className="h-20 w-full flex items-end justify-between gap-[2px] bg-surface-container p-1 rounded">
          {baseFftBars.map((val, i) => {
            const dynamicHeight = Math.min(100, Math.max(10, Math.round(val * fftMulti + (Math.sin(i + Date.now() * 0.002) * 8))));
            return (
              <div
                key={i}
                className="w-full bg-primary rounded-t transition-all duration-300"
                style={{
                  height: `${dynamicHeight}%`,
                  opacity: i === 3 ? 1 : 0.2 + (i / 12) * 0.6
                }}
              ></div>
            );
          })}
        </div>
        <div className="flex justify-between font-label-micro text-label-micro text-outline font-mono">
          <span>0 Hz (1X)</span>
          <span>125 Hz (Harmonic)</span>
          <span>500 Hz</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';

export const TopTelemetryStrip: React.FC = () => {
  const { selectedEngine, telemetry, stressSimulationActive } = useMissionDashboard();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-unit-xs select-none">
      {/* 1. TWIN FIDELITY */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            TWIN FIDELITY
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f0ff] animate-pulse"></span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span className="font-telemetry-num-xl text-telemetry-num-xl text-primary font-bold">
            {selectedEngine.twinFidelity.toFixed(1)}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">% SYNC</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1 mt-unit-xs rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-700 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${selectedEngine.twinFidelity}%` }}
          ></div>
        </div>
      </div>

      {/* 2. OVERALL HEALTH */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            OVERALL HEALTH
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-label-micro font-bold ${
              stressSimulationActive
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : selectedEngine.healthScore >= 90
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {stressSimulationActive ? 'CRITICAL' : selectedEngine.healthStatus}
          </span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span
            className={`font-telemetry-num-xl text-telemetry-num-xl font-bold ${
              stressSimulationActive ? 'text-red-400' : 'text-on-surface'
            }`}
          >
            {stressSimulationActive ? 68 : selectedEngine.healthScore}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">SCORE</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1 mt-unit-xs rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              stressSimulationActive ? 'bg-red-500 w-[68%]' : 'bg-primary-fixed w-[92%]'
            }`}
          ></div>
        </div>
      </div>

      {/* 3. RUL PROJECTION */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            RUL PROJECTION
          </span>
          <span className="material-symbols-outlined text-[14px] text-tertiary">
            history_toggle_off
          </span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span className="font-telemetry-num-xl text-telemetry-num-xl text-tertiary font-bold">
            {selectedEngine.rulHours}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">HOURS</span>
        </div>
        <span className="font-label-micro text-label-micro text-outline truncate">
          MTBF {selectedEngine.mtbfHours}H // OP: {selectedEngine.operatingHours.toLocaleString()}H
        </span>
      </div>

      {/* 4. AVG CHT TEMP */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            AVG CHT TEMP
          </span>
          <span className="material-symbols-outlined text-[14px] text-secondary-fixed">
            thermostat
          </span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span
            className={`font-telemetry-num-xl text-telemetry-num-xl font-bold ${
              telemetry.chtAvg > 195 ? 'text-red-400' : 'text-on-surface'
            }`}
          >
            {Math.round(telemetry.chtAvg)}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">°C</span>
        </div>
        <div className="flex items-center justify-between font-label-micro text-label-micro text-outline">
          <span>MAX: 205°C</span>
          <span className={telemetry.chtSpread > 6 ? 'text-amber-400' : 'text-primary-fixed'}>
            Δ {telemetry.chtSpread}°C
          </span>
        </div>
      </div>

      {/* 5. VIBE AMPLITUDE */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            VIBE AMPLITUDE
          </span>
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
            vibration
          </span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span
            className={`font-telemetry-num-xl text-telemetry-num-xl font-bold ${
              telemetry.vibrationAmplitude > 3.5 ? 'text-red-400' : 'text-on-surface'
            }`}
          >
            {telemetry.vibrationAmplitude.toFixed(1)}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">mm/s</span>
        </div>
        <span
          className={`font-label-micro text-label-micro ${
            telemetry.vibrationAmplitude > 3.5 ? 'text-red-400' : 'text-primary-container'
          }`}
        >
          {telemetry.vibrationAmplitude > 3.5 ? 'HARMONIC DRIFT' : 'HARMONIC BALANCE OK'}
        </span>
      </div>

      {/* 6. SENSOR BUS */}
      <div className="bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline tracking-wider uppercase">
            SENSOR BUS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f0ff]"></span>
        </div>
        <div className="flex items-baseline gap-unit-xs mt-1">
          <span className="font-telemetry-num-xl text-telemetry-num-xl text-on-surface font-bold">
            {selectedEngine.activeSensors}/{selectedEngine.totalSensors}
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant">NODES</span>
        </div>
        <span className="font-label-micro text-label-micro text-on-surface-variant">
          0 REJECTED PACKETS
        </span>
      </div>

      {/* 7. SOCKET PIPELINE */}
      <div className="col-span-2 md:col-span-4 xl:col-span-1 bg-surface-container-low/90 backdrop-blur-md p-unit-sm rounded shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider">
            SOCKET PIPELINE
          </span>
          <span className="material-symbols-outlined text-[14px] text-primary">lan</span>
        </div>
        <div className="flex items-center gap-unit-xs mt-1">
          <span className="font-label-tactical text-label-tactical text-primary font-bold">
            FASTAPI // WS
          </span>
        </div>
        <div className="flex items-center justify-between font-label-micro text-label-micro">
          <span className="text-outline">RTT: {selectedEngine.pipelineLatencyMs}ms</span>
          <span className="text-primary-fixed-dim">PORT {selectedEngine.pipelinePort}</span>
        </div>
      </div>
    </div>
  );
};

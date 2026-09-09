/**
 * DHRUVAA KPI Metric Cards Grid
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { AlertTriangle, Hourglass, Cpu, Radio, ShieldAlert } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const MetricKpiCards: React.FC = () => {
  const { engines, selectedEngine, setSelectedEngineId, openModal } = useMission();

  const criticalCount = engines.filter((e) => e.status === 'CRITICAL').length;
  const warningCount = engines.filter((e) => e.status === 'WARNING').length;
  const criticalEngine = engines.find((e) => e.status === 'CRITICAL');
  const warningEngine = engines.find((e) => e.status === 'WARNING');
  const fleetMtbur = Math.round(engines.reduce((sum, e) => sum + e.totalHours, 0) / engines.length);
  const twinFidelity = selectedEngine.twinState.modelFidelityPercent;
  const confidenceLevel = selectedEngine.twinState.confidenceLevel;
  const rulErrorBand = selectedEngine.twinState.rulErrorBandHours;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Critical Actions (Engine 03) */}
      <div
        onClick={() => {
          if (criticalEngine) setSelectedEngineId(criticalEngine.id);
        }}
        className="relative p-4 rounded bg-[#090e1b]/85 border border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.15)] flex flex-col justify-between overflow-hidden cursor-pointer hover:border-red-500 hover:bg-[#090e1b] transition-all group"
      >
        <ReticleCorner color="#ef4444" size={5} />
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl" />
        <div className="flex items-center justify-between">
          <span className="font-telemetry text-[9px] text-red-400 uppercase tracking-widest font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            CRITICAL DISPATCH
          </span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <span className="font-telemetry text-3xl font-bold text-red-400 tracking-tight">
            {String(criticalCount).padStart(2, '0')}
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 text-[10px] font-telemetry uppercase font-bold border border-red-500/30 group-hover:bg-red-900/40 transition-colors">
            {criticalEngine ? `${criticalEngine.displayId} (${criticalEngine.airframeId})` : 'NONE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>Target Grounding: IMMEDIATE</span>
          <span className="font-tactical text-[11px] text-red-400 font-bold">{criticalEngine ? `${criticalEngine.rulHours}h RUL` : '—'}</span>
        </div>
      </div>

      {/* Card 2: Impending Warnings (Engine 02) */}
      <div
        onClick={() => {
          if (warningEngine) setSelectedEngineId(warningEngine.id);
        }}
        className="relative p-4 rounded bg-[#090e1b]/85 border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.1)] flex flex-col justify-between overflow-hidden cursor-pointer hover:border-amber-400 hover:bg-[#090e1b] transition-all group"
      >
        <ReticleCorner color="#f59e0b" size={5} />
        <div className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-bl" />
        <div className="flex items-center justify-between">
          <span className="font-telemetry text-[9px] text-amber-300 uppercase tracking-widest font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            IMPENDING WARNINGS
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <span className="font-telemetry text-3xl font-bold text-amber-300 tracking-tight">
            {String(warningCount).padStart(2, '0')}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 text-[10px] font-telemetry uppercase font-bold border border-amber-500/30 group-hover:bg-amber-900/40 transition-colors">
            {warningEngine ? `${warningEngine.displayId} (${warningEngine.airframeId})` : 'NONE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>Thermal Decay Delta: {warningEngine ? `+${warningEngine.twinState.thermalDecayDeltaPercent}%` : '—'}</span>
          <span className="font-tactical text-[11px] text-amber-300 font-bold">{warningEngine ? `${warningEngine.rulHours}h RUL` : '—'}</span>
        </div>
      </div>

      {/* Card 3: Fleet MTBUR Benchmark */}
      <div className="relative p-4 rounded bg-[#090e1b]/85 border border-[#00f0ff]/30 flex flex-col justify-between overflow-hidden group hover:border-[#00f0ff]/60 transition-all">
        <ReticleCorner color="#00f0ff" size={5} />
        <div className="flex items-center justify-between">
          <span className="font-telemetry text-[9px] text-[#00dbe9] uppercase tracking-widest font-bold flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-[#00f0ff]" />
            FLEET MTBUR BENCHMARK
          </span>
          <Hourglass className="w-4 h-4 text-[#00f0ff]" />
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="font-telemetry text-3xl font-bold text-[#dee2f5] tracking-tight">
            {fleetMtbur}
          </span>
          <span className="font-headline text-lg text-[#b9cacb] font-semibold">
            HRS
          </span>
          <span className="ml-auto text-emerald-400 font-tactical text-[11px] flex items-center font-bold">
            {fleetMtbur > 450 ? `+${fleetMtbur - 450}h vs Q3` : `${fleetMtbur - 450}h vs Q3`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>Unscheduled Removals</span>
          <span className="font-tactical text-[11px] text-[#00f0ff] font-bold">TARGET: 450h</span>
        </div>
      </div>

      {/* Card 4: Twin Predictive Fidelity */}
      <div className="relative p-4 rounded bg-[#090e1b]/85 border border-[#00f0ff]/30 flex flex-col justify-between overflow-hidden group hover:border-[#00f0ff]/60 transition-all">
        <ReticleCorner color="#00f0ff" size={5} />
        <div className="flex items-center justify-between">
          <span className="font-telemetry text-[9px] text-[#00dbe9] uppercase tracking-widest font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#00f0ff]" />
            TWIN PREDICTIVE FIDELITY
          </span>
          <Cpu className="w-4 h-4 text-[#00f0ff]" />
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="font-telemetry text-3xl font-bold text-[#00f0ff] tracking-tight">
            {twinFidelity}%
          </span>
          <span className="ml-auto text-emerald-400 font-tactical text-[11px] flex items-center font-bold">
            {confidenceLevel}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>RUL Error Band</span>
          <span className="font-tactical text-[11px] text-[#dee2f5] font-bold">±{rulErrorBand} FLIGHT HRS</span>
        </div>
      </div>
    </div>
  );
};

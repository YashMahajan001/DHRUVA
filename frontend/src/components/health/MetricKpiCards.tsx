/**
 * DHRUVAA KPI Metric Cards Grid
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { AlertTriangle, Hourglass, Cpu, Radio, ShieldAlert } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const MetricKpiCards: React.FC = () => {
  const { setSelectedEngineId, openModal } = useMission();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Critical Actions (Engine 03) */}
      <div
        onClick={() => {
          setSelectedEngineId('eng-03');
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
            01
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 text-[10px] font-telemetry uppercase font-bold border border-red-500/30 group-hover:bg-red-900/40 transition-colors">
            ENGINE 03 (UAV-03)
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>Target Grounding: IMMEDIATE</span>
          <span className="font-tactical text-[11px] text-red-400 font-bold">18h RUL</span>
        </div>
      </div>

      {/* Card 2: Impending Warnings (Engine 02) */}
      <div
        onClick={() => {
          setSelectedEngineId('eng-02');
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
            01
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 text-[10px] font-telemetry uppercase font-bold border border-amber-500/30 group-hover:bg-amber-900/40 transition-colors">
            ENGINE 02 (UAV-02)
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>Thermal Decay Delta: +14%</span>
          <span className="font-tactical text-[11px] text-amber-300 font-bold">61h RUL</span>
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
            480
          </span>
          <span className="font-headline text-lg text-[#b9cacb] font-semibold">
            HRS
          </span>
          <span className="ml-auto text-emerald-400 font-tactical text-[11px] flex items-center font-bold">
            +18h vs Q3
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
            98.4%
          </span>
          <span className="ml-auto text-emerald-400 font-tactical text-[11px] flex items-center font-bold">
            CONFIDENCE L1
          </span>
        </div>

        <div className="flex items-center justify-between text-[#b9cacb] font-body text-xs border-t border-[#3b494b]/20 pt-2">
          <span>RUL Error Band</span>
          <span className="font-tactical text-[11px] text-[#dee2f5] font-bold">±1.8 FLIGHT HRS</span>
        </div>
      </div>
    </div>
  );
};

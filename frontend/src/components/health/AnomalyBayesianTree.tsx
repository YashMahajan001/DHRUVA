import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { GitBranch, BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AnomalyBayesianTree: React.FC = () => {
  const { stressSimulationActive, unreadAlertCount } = useMissionDashboard();

  const faultProbabilities = [
    {
      name: 'Cylinder Liner Scoring',
      prob: stressSimulationActive ? 24.2 : 1.8,
      isElevated: stressSimulationActive
    },
    {
      name: 'Coolant Loop Micro-Cavitation',
      prob: stressSimulationActive ? 46.8 : 8.4,
      isElevated: true
    },
    {
      name: 'Fuel Injector Nozzle Clogging',
      prob: stressSimulationActive ? 12.5 : 0.6,
      isElevated: false
    },
    {
      name: 'Magneto Drop Variance',
      prob: stressSimulationActive ? 3.4 : 0.2,
      isElevated: false
    },
    {
      name: 'Oil Scavenge Pump Backpressure',
      prob: stressSimulationActive ? 18.2 : 1.1,
      isElevated: stressSimulationActive
    }
  ];

  return (
    <div className="xl:col-span-4 bg-[#161b29]/95 p-5 rounded-xl shadow-xl flex flex-col justify-between gap-4 border border-[#3b494b]/30 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#3b494b]/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              BAYESIAN ISOLATION TREE
            </span>
            <h3 className="text-sm font-bold font-mono text-white tracking-wide">
              FAULT PROBABILITY
            </h3>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold tracking-wider border flex items-center gap-1.5 ${
            stressSimulationActive || unreadAlertCount > 0
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 animate-pulse'
              : 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
          }`}
        >
          {stressSimulationActive || unreadAlertCount > 0 ? (
            <ShieldAlert className="w-3 h-3" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          {stressSimulationActive ? 'FAULT DRIFT' : unreadAlertCount > 0 ? `${unreadAlertCount} ADVISORIES` : 'ZERO ALARMS'}
        </span>
      </div>

      {/* Probabilities List */}
      <div className="flex flex-col gap-3 my-1">
        {faultProbabilities.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 bg-[#0e1320]/60 p-2.5 rounded-lg border border-[#3b494b]/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{item.name}</span>
              <span
                className={`font-mono text-xs font-semibold ${
                  item.isElevated ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {item.prob.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-[#090e1b] h-2 rounded-full overflow-hidden border border-[#3b494b]/30">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  item.isElevated
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-gradient-to-r from-[#00f0ff]/40 to-[#00f0ff]'
                }`}
                style={{ width: `${Math.min(100, Math.max(item.prob, 3))}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Confidence Card */}
      <div className="bg-[#0e1320] p-3 rounded-lg flex items-center justify-between border border-[#3b494b]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <BrainCircuit className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              AI CONFIDENCE LEVEL
            </span>
            <span className="text-xs font-mono font-medium text-slate-200">
              MULTI-HEAD ATTENTION TWIN
            </span>
          </div>
        </div>
        <span className="text-lg font-mono font-bold text-[#00f0ff] tracking-tight">
          {stressSimulationActive ? '94.2%' : '99.8%'}
        </span>
      </div>
    </div>
  );
};

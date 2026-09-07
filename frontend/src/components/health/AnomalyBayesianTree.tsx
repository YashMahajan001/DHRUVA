import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';

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
    <div className="xl:col-span-4 bg-surface-container-low/95 p-unit-lg rounded shadow-xl flex flex-col justify-between gap-unit-md border border-outline-variant/20 select-none">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-micro text-label-micro text-outline uppercase">
            BAYESIAN ISOLATION TREE
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            FAULT PROBABILITY
          </h3>
        </div>
        <span
          className={`px-unit-sm py-0.5 rounded font-label-micro text-label-micro uppercase font-bold border ${
            stressSimulationActive || unreadAlertCount > 0
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}
        >
          {stressSimulationActive ? 'FAULT DRIFT' : unreadAlertCount > 0 ? `${unreadAlertCount} ADVISORIES` : 'ZERO ALARMS'}
        </span>
      </div>

      <div className="flex flex-col gap-unit-sm">
        {faultProbabilities.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between font-label-micro text-label-micro">
              <span className="text-on-surface">{item.name}</span>
              <span
                className={`font-mono ${
                  item.isElevated ? 'text-secondary-fixed font-bold' : 'text-outline'
                }`}
              >
                {item.prob.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  item.isElevated ? 'bg-secondary-fixed' : 'bg-primary/40'
                }`}
                style={{ width: `${Math.min(100, item.prob)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container p-unit-sm rounded flex items-center justify-between border border-outline-variant/10">
        <div className="flex flex-col">
          <span className="font-label-micro text-label-micro text-outline uppercase">
            AI CONFIDENCE LEVEL
          </span>
          <span className="font-label-tactical text-label-tactical text-on-surface">
            MULTI-HEAD ATTENTION TWIN
          </span>
        </div>
        <span className="font-telemetry-num-md text-telemetry-num-md text-primary font-bold">
          {stressSimulationActive ? '94.2%' : '99.8%'}
        </span>
      </div>
    </div>
  );
};

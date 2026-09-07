import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';

export const RankedRootCausesCard: React.FC = () => {
  const { diagnosticInsight, showToast } = useDashboard();

  return (
    <div
      id="ranked-root-causes-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
          Ranked Root Causes
        </span>
        <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
          Bayesian Probability
        </span>
      </div>

      {/* Root Causes with Progress Bars */}
      <div id="root-causes-list" className="flex flex-col gap-2">
        {(diagnosticInsight?.rankedRootCauses || []).map((cause, idx) => (
          <div
            key={idx}
            onClick={() => showToast(`Bayesian Hypothesis: ${cause.name} evaluated at ${cause.probability}% likelihood.`, 'info')}
            className="p-2 rounded bg-[#1a1f2d]/70 hover:bg-[#252a38] border border-[#3b494b]/20 flex flex-col gap-1 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs text-[#dee2f5] font-medium">
                {cause.name}
              </span>
              <span className={`font-mono-telemetry text-xs font-bold ${cause.textColorClass}`}>
                {cause.probability}%
              </span>
            </div>

            <div className="w-full bg-[#303443] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${cause.barColorClass}`}
                style={{ width: `${cause.probability}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

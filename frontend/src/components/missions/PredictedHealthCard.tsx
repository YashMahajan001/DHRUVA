/**
 * DHRUVAA — Predicted Engine Health Card (Right Column)
 */

import React from 'react';
import { Heart, Activity, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const PredictedHealthCard: React.FC = () => {
  const { twinState, telemetry } = useDashboard();

  const getStatusBadge = () => {
    switch (twinState.healthStatus) {
      case 'OPTIMAL':
        return {
          label: 'OPTIMAL',
          className: 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
        };
      case 'WATCH':
        return {
          label: 'WATCH / ADVISORY',
          className: 'bg-[#b4c5ff]/20 text-[#b4c5ff] border border-[#b4c5ff]/40'
        };
      case 'WARNING':
        return {
          label: 'WARNING ELEVATED',
          className: 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
        };
      case 'CRITICAL':
        return {
          label: 'CRITICAL DEGRADATION',
          className: 'bg-[#93000a] text-[#ffdad6] border border-[#ef4444] animate-pulse'
        };
    }
  };

  const badge = getStatusBadge();

  // Color for the health progress bar
  const getProgressBarColor = () => {
    if (twinState.healthScore >= 80) return 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]';
    if (twinState.healthScore >= 60) return 'bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]';
    return 'bg-[#ef4444] shadow-[0_0_10px_#ef4444]';
  };

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2.5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            PREDICTED ENGINE HEALTH
          </span>
        </div>
        <span className={`font-mono-telemetry text-[9px] px-2 py-0.5 rounded font-bold uppercase ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Main Health & Endurance Metrics */}
      <div className="flex items-end justify-between mt-0.5">
        <div className="flex flex-col">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            HEALTH SCORE
          </span>
          <span className={`font-mono-telemetry text-3xl font-bold leading-none ${
            twinState.healthScore >= 80 ? 'text-[#00f0ff]' : twinState.healthScore >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
          }`}>
            {twinState.healthScore.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            MISSION ENDURANCE
          </span>
          <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold">
            {twinState.missionEnduranceHours} HRS
          </span>
        </div>
      </div>

      {/* Progress Bar with High-Contrast Indicator */}
      <div className="w-full bg-[#303443] h-2 rounded overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
          style={{ width: `${twinState.healthScore}%` }}
        />
      </div>

      {/* Estimated RUL Penalty Breakdown */}
      <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            ESTIMATED RUL PENALTY
          </span>
          <span className="font-sans text-[11px] text-[#b9cacb]">
            Operating at current simulated stress
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`font-mono-telemetry text-base font-bold ${
            twinState.estimatedRulPenalty <= -50 
              ? 'text-[#ef4444]' 
              : twinState.estimatedRulPenalty <= -15 
              ? 'text-[#f59e0b]' 
              : 'text-[#00f0ff]'
          }`}>
            {twinState.estimatedRulPenalty} HRS
          </span>
          <span className="font-mono-telemetry text-[8px] text-[#849495]">
            BASE: {twinState.rulHoursRemaining}H
          </span>
        </div>
      </div>
    </div>
  );
};

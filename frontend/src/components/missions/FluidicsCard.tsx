/**
 * DHRUVAA — Fluidics, Combustion & Quick Action Bench (Right Column)
 */

import React from 'react';
import { Fuel, Droplets, Activity, Download, RefreshCw, Zap } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const FluidicsCard: React.FC = () => {
  const { 
    telemetry, 
    faults, 
    triggerAutoRecovery, 
    isRecovering, 
    exportTelemetry 
  } = useDashboard();

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2.5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            FLUIDICS & COMBUSTION
          </span>
        </div>
        <span className="font-mono-telemetry text-[9px] text-[#00f0ff] uppercase font-bold">
          REAL-TIME
        </span>
      </div>

      {/* Fuel Burn Rate & Oil Pressure */}
      <div className="grid grid-cols-2 gap-2">
        {/* Fuel Burn Rate */}
        <div className="bg-[#1a1f2d] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Fuel Burn Rate
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-telemetry text-base text-[#00f0ff] font-bold">
              {telemetry.fuelFlowRate}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">L/HR</span>
          </div>
        </div>

        {/* Oil Pressure */}
        <div className={`p-2 rounded border transition-all ${
          telemetry.oilPressure < 55 
            ? 'bg-[#252a38] border-[#ef4444]/60 shadow-[0_0_8px_rgba(239,68,68,0.25)]' 
            : 'bg-[#1a1f2d] border-[#3b494b]/20'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
              Oil Pressure
            </span>
            {telemetry.oilPressure < 55 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`font-mono-telemetry text-base font-bold ${
              telemetry.oilPressure < 55 ? 'text-[#ef4444]' : 'text-[#dee2f5]'
            }`}>
              {telemetry.oilPressure}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">PSI</span>
          </div>
        </div>
      </div>

      {/* Vibration Harmonic Spectrum (RMS) */}
      <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            Vibration Spectrum (RMS)
          </span>
          <span className={`font-mono-telemetry text-xs font-bold ${
            telemetry.vibrationRms > 4.5 ? 'text-[#ef4444]' : telemetry.vibrationRms > 3.0 ? 'text-[#f59e0b]' : 'text-[#dee2f5]'
          }`}>
            {telemetry.vibrationRms} mm/s
          </span>
        </div>

        {/* 8-Band Dynamic Spectrum Bars */}
        <div className="flex items-end gap-1 h-9 w-full px-1 pt-1">
          {telemetry.vibrationHarmonics.map((heightPercent, idx) => {
            const isSpike = (idx === 2 || idx === 4) && faults.crankshaftRotorImbalance;
            const barBg = isSpike 
              ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
              : idx % 2 === 0 
              ? 'bg-[#00f0ff]' 
              : 'bg-[#b4c5ff]';
            return (
              <div 
                key={idx}
                className="flex-1 bg-[#161b29] rounded-t overflow-hidden h-full flex items-end"
              >
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${barBg}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between font-mono-telemetry text-[8px] text-[#849495] px-1 mt-0.5">
          <span>10 Hz</span>
          <span className="text-[#00f0ff] font-semibold">CRANK 1X</span>
          <span>200 Hz</span>
        </div>
      </div>

      {/* Electrical Bus Metrics */}
      <div className="grid grid-cols-2 gap-2 bg-[#090e1b] p-2 rounded border border-[#3b494b]/20">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-[8px] text-[#849495] uppercase">BUS VOLTAGE</span>
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-bold">{telemetry.batteryVoltage} V</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#b4c5ff]" />
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-[8px] text-[#849495] uppercase">ALT CURRENT</span>
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-bold">{telemetry.alternatorCurrent} A</span>
          </div>
        </div>
      </div>

      {/* Quick Action Override Bench */}
      <div className="bg-[#161b29] rounded p-1.5 border border-[#3b494b]/20 flex items-center justify-between gap-2 mt-0.5">
        <button
          onClick={triggerAutoRecovery}
          disabled={isRecovering}
          className="flex-1 py-1.5 px-2 rounded bg-[#252a38] hover:bg-[#303443] text-[#dee2f5] font-mono-telemetry text-[10px] uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          type="button"
        >
          <RefreshCw className={`w-3 h-3 text-[#00f0ff] ${isRecovering ? 'animate-spin' : ''}`} />
          <span>{isRecovering ? 'Restoring Telemetry...' : 'AI Auto-Recovery'}</span>
        </button>

        <button
          onClick={exportTelemetry}
          className="flex items-center justify-center p-2 rounded bg-[#252a38] hover:bg-[#303443] text-[#00f0ff] hover:text-[#dee2f5] border border-[#3b494b]/30 transition-colors cursor-pointer"
          title="Export CSV Telemetry Snapshot"
          type="button"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * DHRUVAA — Engine Digital Twin Selector Modal
 */

import React from 'react';
import { X, Check, Cpu, Layers, ShieldCheck, Activity } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';
import { EngineInstance } from '../../types/simulationTypes';

export const EngineSelectorModal: React.FC = () => {
  const { 
    isEngineModalOpen, 
    setIsEngineModalOpen, 
    engines, 
    selectedEngine, 
    selectEngine 
  } = useDashboard();

  if (!isEngineModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-[#090e1b] border border-[#00f0ff]/40 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#161b29] border-b border-[#3b494b]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#00f0ff]" />
            <div className="flex flex-col">
              <span className="font-mono-telemetry text-sm font-bold text-[#dee2f5] tracking-wider uppercase">
                AERO PISTON ENGINE SELECTION
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#849495]">
                SELECT ACTIVE DIGITAL TWIN PROPULSION MODEL
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEngineModalOpen(false)}
            className="p-1 rounded hover:bg-[#252a38] text-[#849495] hover:text-[#dee2f5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Cards List */}
        <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {engines.map((engine) => {
            const isSelected = selectedEngine.id === engine.id;
            return (
              <div
                key={engine.id}
                onClick={() => selectEngine(engine)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#1a1f2d] border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-[#161b29] border-[#3b494b]/30 hover:border-[#00f0ff]/40 hover:bg-[#1a1f2d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-telemetry text-sm font-bold text-[#dee2f5]">
                      {engine.model}
                    </span>
                    <span className="font-mono-telemetry text-[10px] px-2 py-0.5 rounded bg-[#252a38] text-[#00f0ff] border border-[#00f0ff]/30">
                      {engine.id}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 font-mono-telemetry text-[10px] text-[#00f0ff] font-bold">
                      <Check className="w-3.5 h-3.5" /> ACTIVE TWIN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-telemetry text-[10px]">
                  <div className="bg-[#090e1b] p-1.5 rounded border border-[#3b494b]/20">
                    <span className="text-[#849495] block text-[8px] uppercase">ARCH</span>
                    <span className="text-[#dee2f5] font-semibold">{engine.architecture}</span>
                  </div>
                  <div className="bg-[#090e1b] p-1.5 rounded border border-[#3b494b]/20">
                    <span className="text-[#849495] block text-[8px] uppercase">POWER</span>
                    <span className="text-[#dee2f5] font-semibold">{engine.baselineHp} HP @ {engine.ratedRpm} RPM</span>
                  </div>
                  <div className="bg-[#090e1b] p-1.5 rounded border border-[#3b494b]/20">
                    <span className="text-[#849495] block text-[8px] uppercase">DISPLACEMENT</span>
                    <span className="text-[#dee2f5] font-semibold">{engine.displacement}</span>
                  </div>
                  <div className="bg-[#090e1b] p-1.5 rounded border border-[#3b494b]/20">
                    <span className="text-[#849495] block text-[8px] uppercase">HOURS</span>
                    <span className="text-[#00f0ff] font-semibold">{engine.totalOperatingHours} HRS</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono-telemetry text-[#849495] pt-1 border-t border-[#3b494b]/20">
                  <span>ASSIGNED UAV: <strong className="text-[#dee2f5]">{engine.assignedUav}</strong></span>
                  <span>COOLING: {engine.coolingType}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#161b29] border-t border-[#3b494b]/30 flex justify-end">
          <button
            onClick={() => setIsEngineModalOpen(false)}
            className="px-4 py-1.5 rounded bg-[#252a38] hover:bg-[#303443] text-[#dee2f5] font-mono-telemetry text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

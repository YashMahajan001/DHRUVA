/**
 * DHRUVAA — Synthetic Fault Injection Lab (Left Column)
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const FaultInjectionCard: React.FC = () => {
  const { faults, toggleFault, clearAllFaults } = useDashboard();

  const activeFaultsCount = Object.values(faults).filter(Boolean).length;

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2.5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            SYNTHETIC FAULT INJECTION
          </span>
        </div>
        <span className={`font-mono-telemetry text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
          activeFaultsCount > 0 
            ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 animate-pulse' 
            : 'bg-[#1a1f2d] text-[#849495]'
        }`}>
          {activeFaultsCount > 0 ? `${activeFaultsCount} ACTIVE LAB` : 'LAB STANDBY'}
        </span>
      </div>

      <p className="font-sans text-xs text-[#b9cacb] leading-relaxed">
        Stress-test real-time twin prediction models by introducing subsystem anomalies:
      </p>

      {/* Fault Injection Checkbox List */}
      <div className="flex flex-col gap-1.5 mt-0.5">
        {/* Fault 1: Cooling Jacket Degradation */}
        <label 
          htmlFor="faultCooling"
          className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer select-none border ${
            faults.coolingJacketDegradation 
              ? 'bg-[#252a38] border-[#ef4444]/60 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]' 
              : 'bg-[#1a1f2d] hover:bg-[#252a38] border-transparent'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-medium">
              Cooling Jacket Degradation
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              +18% Thermal Impedance // Heat Buildup
            </span>
          </div>
          <input
            id="faultCooling"
            type="checkbox"
            checked={faults.coolingJacketDegradation}
            onChange={() => toggleFault('coolingJacketDegradation')}
            className="w-4 h-4 rounded accent-[#00f0ff] cursor-pointer"
          />
        </label>

        {/* Fault 2: Fuel Injector #3 Clog */}
        <label 
          htmlFor="faultInjector"
          className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer select-none border ${
            faults.fuelInjectorClog 
              ? 'bg-[#252a38] border-[#f59e0b]/60 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]' 
              : 'bg-[#1a1f2d] hover:bg-[#252a38] border-transparent'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-medium">
              Fuel Injector #3 Clog
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              -14% Rail Volume // Lean AFR Spike
            </span>
          </div>
          <input
            id="faultInjector"
            type="checkbox"
            checked={faults.fuelInjectorClog}
            onChange={() => toggleFault('fuelInjectorClog')}
            className="w-4 h-4 rounded accent-[#00f0ff] cursor-pointer"
          />
        </label>

        {/* Fault 3: Lubrication Pressure Leak */}
        <label 
          htmlFor="faultOil"
          className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer select-none border ${
            faults.lubricationPressureLeak 
              ? 'bg-[#252a38] border-[#ef4444]/60 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]' 
              : 'bg-[#1a1f2d] hover:bg-[#252a38] border-transparent'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-medium">
              Lubrication Pressure Leak
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              -15 PSI Oil Relief Regulator Drop
            </span>
          </div>
          <input
            id="faultOil"
            type="checkbox"
            checked={faults.lubricationPressureLeak}
            onChange={() => toggleFault('lubricationPressureLeak')}
            className="w-4 h-4 rounded accent-[#00f0ff] cursor-pointer"
          />
        </label>

        {/* Fault 4: Crankshaft Rotor Imbalance */}
        <label 
          htmlFor="faultVibe"
          className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer select-none border ${
            faults.crankshaftRotorImbalance 
              ? 'bg-[#252a38] border-[#f59e0b]/60 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]' 
              : 'bg-[#1a1f2d] hover:bg-[#252a38] border-transparent'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-medium">
              Crankshaft Rotor Imbalance
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              Harsh 1X/2X Harmonics Spike (+3.8 mm/s)
            </span>
          </div>
          <input
            id="faultVibe"
            type="checkbox"
            checked={faults.crankshaftRotorImbalance}
            onChange={() => toggleFault('crankshaftRotorImbalance')}
            className="w-4 h-4 rounded accent-[#00f0ff] cursor-pointer"
          />
        </label>

        {/* Fault 5: CHT Thermocouple Drift */}
        <label 
          htmlFor="faultSensor"
          className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer select-none border ${
            faults.chtThermocoupleDrift 
              ? 'bg-[#252a38] border-[#00f0ff]/60 shadow-[inset_0_0_8px_rgba(0,240,255,0.2)]' 
              : 'bg-[#1a1f2d] hover:bg-[#252a38] border-transparent'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-medium">
              CHT Thermocouple Drift
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              Sensor telemetry calibration bias (+25°C)
            </span>
          </div>
          <input
            id="faultSensor"
            type="checkbox"
            checked={faults.chtThermocoupleDrift}
            onChange={() => toggleFault('chtThermocoupleDrift')}
            className="w-4 h-4 rounded accent-[#00f0ff] cursor-pointer"
          />
        </label>
      </div>

      {/* Clear All Injected Faults Button */}
      <button
        onClick={clearAllFaults}
        className="w-full mt-1 py-1.5 rounded bg-[#303443] hover:bg-[#343948] text-[#dee2f5] font-mono-telemetry text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        type="button"
      >
        <RotateCcw className="w-3 h-3 text-[#00f0ff]" />
        <span>Clear All Injected Faults</span>
      </button>
    </div>
  );
};

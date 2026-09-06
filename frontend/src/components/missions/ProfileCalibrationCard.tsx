/**
 * DHRUVAA — Profile Calibration & Flight Params (Left Column)
 */

import React from 'react';
import { Sliders } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';
import { MissionDirective } from '../../types/simulationTypes';

export const ProfileCalibrationCard: React.FC = () => {
  const {
    selectedMission,
    setDirective,
    altitude,
    setAltitude,
    ambientTemperature,
    setAmbientTemperature,
    throttleDemandPercent,
    setThrottleDemandPercent
  } = useDashboard();

  const directives: MissionDirective[] = ['ISR (Recon)', 'Loiter Orbit', 'Ferry Transit', 'CAP Intercept'];

  const getThrottleModeLabel = (throttle: number) => {
    if (throttle <= 40) return 'IDLE';
    if (throttle <= 60) return 'LOITER';
    if (throttle <= 80) return 'CRUISE';
    return 'CLIMB / WOT';
  };

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-3">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#b4c5ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            PROFILE CALIBRATION
          </span>
        </div>
        <span className="font-mono-telemetry text-[9px] text-[#b9cacb] uppercase">
          FLIGHT PARAMS
        </span>
      </div>

      {/* Mission Directive Selector */}
      <div className="flex flex-col gap-1">
        <label className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
          MISSION DIRECTIVE
        </label>
        <div className="grid grid-cols-2 gap-1 font-mono-telemetry text-[10px]">
          {directives.map((dir) => {
            const isActive = selectedMission.directive === dir;
            return (
              <button
                key={dir}
                onClick={() => setDirective(dir)}
                className={`p-1.5 rounded transition-all font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-[#303443] text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-[#1a1f2d] text-[#b9cacb] hover:bg-[#252a38] border border-transparent'
                }`}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Altitude Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label htmlFor="altSlider" className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            Target Altitude
          </label>
          <span className="font-mono-telemetry text-xs text-[#00f0ff] font-bold">
            {altitude.toLocaleString()} FT
          </span>
        </div>
        <input
          id="altSlider"
          type="range"
          min="5000"
          max="30000"
          step="500"
          value={altitude}
          onChange={(e) => setAltitude(parseInt(e.target.value, 10))}
          className="w-full accent-[#00f0ff] h-1 bg-[#303443] rounded cursor-pointer"
        />
        <div className="flex justify-between font-mono-telemetry text-[8px] text-[#849495]">
          <span>5,000</span>
          <span>FL180</span>
          <span>30,000 FT</span>
        </div>
      </div>

      {/* Ambient Air Temperature Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label htmlFor="tempSlider" className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            Ambient Air Temperature
          </label>
          <span className="font-mono-telemetry text-xs text-[#b4c5ff] font-bold">
            {ambientTemperature > 0 ? `+${ambientTemperature}` : ambientTemperature}°C
          </span>
        </div>
        <input
          id="tempSlider"
          type="range"
          min="-45"
          max="45"
          step="1"
          value={ambientTemperature}
          onChange={(e) => setAmbientTemperature(parseInt(e.target.value, 10))}
          className="w-full accent-[#b4c5ff] h-1 bg-[#303443] rounded cursor-pointer"
        />
        <div className="flex justify-between font-mono-telemetry text-[8px] text-[#849495]">
          <span>-45°C</span>
          <span>ISA 0°C</span>
          <span>+45°C</span>
        </div>
      </div>

      {/* Simulated Throttle Demand Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label htmlFor="throttleSlider" className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            Simulated Throttle Demand
          </label>
          <span className="font-mono-telemetry text-xs text-[#00f0ff] font-bold">
            {throttleDemandPercent}% ({getThrottleModeLabel(throttleDemandPercent)})
          </span>
        </div>
        <input
          id="throttleSlider"
          type="range"
          min="30"
          max="100"
          step="1"
          value={throttleDemandPercent}
          onChange={(e) => setThrottleDemandPercent(parseInt(e.target.value, 10))}
          className="w-full accent-[#00f0ff] h-1 bg-[#303443] rounded cursor-pointer"
        />
        <div className="flex justify-between font-mono-telemetry text-[8px] text-[#849495]">
          <span>IDLE 30%</span>
          <span>CRZ 75%</span>
          <span>WOT 100%</span>
        </div>
      </div>

      {/* Planned Sortie Duration */}
      <div className="flex items-center justify-between pt-1 border-t border-[#3b494b]/20">
        <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
          Planned Sortie Duration
        </span>
        <span className="font-mono-telemetry text-[11px] text-[#dee2f5] bg-[#090e1b] px-2 py-0.5 rounded border border-[#3b494b]/30 font-semibold">
          {selectedMission.plannedSortieDurationHours.toFixed(1)} HOURS
        </span>
      </div>
    </div>
  );
};

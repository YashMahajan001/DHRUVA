/**
 * DHRUVAA — Thermal Core Matrix Card (Right Column)
 */

import React from 'react';
import { Thermometer } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const ThermalMatrixCard: React.FC = () => {
  const { telemetry, faults } = useDashboard();

  // Thermal classification helpers
  const getChtStatus = (temp: number) => {
    if (temp > 220) return { label: 'CRITICAL', color: 'text-[#ef4444]' };
    if (temp > 200) return { label: 'ELEVATED', color: 'text-[#f59e0b]' };
    return { label: 'NOMINAL', color: 'text-[#00dbe9]' };
  };

  const getOilTempStatus = (temp: number) => {
    if (temp > 105) return { label: 'OVERTEMP', color: 'text-[#ef4444]' };
    if (temp > 95) return { label: 'HIGH', color: 'text-[#f59e0b]' };
    return { label: 'NORM', color: 'text-[#00dbe9]' };
  };

  const getEgtStatus = (temp: number) => {
    if (temp > 740) return { label: 'SPIKE', color: 'text-[#ef4444]' };
    if (temp > 720) return { label: 'HIGH', color: 'text-[#f59e0b]' };
    return { label: 'PEAK', color: 'text-[#00dbe9]' };
  };

  const chtStatus = getChtStatus(telemetry.chtAvg);
  const oilStatus = getOilTempStatus(telemetry.oilTemperature);
  const egtStatus = getEgtStatus(telemetry.egtPeak);

  return (
    <div className="bg-[#161b29]/80 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2.5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-[#b4c5ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            THERMAL CORE MATRIX
          </span>
        </div>
        <span className="font-mono-telemetry text-[9px] text-[#b9cacb] uppercase">
          CELSIUS
        </span>
      </div>

      {/* Thermals Primary 3-Metric Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* AVG CHT */}
        <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20 flex flex-col items-center">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            AVG CHT
          </span>
          <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold mt-0.5">
            {telemetry.chtAvg}°C
          </span>
          <span className={`font-mono-telemetry text-[9px] mt-0.5 font-semibold ${chtStatus.color}`}>
            {chtStatus.label}
          </span>
        </div>

        {/* OIL TEMP */}
        <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20 flex flex-col items-center">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            OIL TEMP
          </span>
          <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold mt-0.5">
            {telemetry.oilTemperature}°C
          </span>
          <span className={`font-mono-telemetry text-[9px] mt-0.5 font-semibold ${oilStatus.color}`}>
            {oilStatus.label}
          </span>
        </div>

        {/* EGT PEAK */}
        <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/20 flex flex-col items-center">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            EGT PEAK
          </span>
          <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold mt-0.5">
            {telemetry.egtPeak}°C
          </span>
          <span className={`font-mono-telemetry text-[9px] mt-0.5 font-semibold ${egtStatus.color}`}>
            {egtStatus.label}
          </span>
        </div>
      </div>

      {/* Cylinder Head Temperature Profile Sub-Array */}
      <div className="flex flex-col gap-1 mt-0.5">
        <div className="flex justify-between items-center">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase">
            CYLINDER HEAD TEMPERATURE PROFILE
          </span>
          {faults.fuelInjectorClog && (
            <span className="font-mono-telemetry text-[8px] text-[#ef4444] font-bold animate-pulse">
              CYL 3 LEAN ANOMALY
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {telemetry.chtCylinders.map((cylTemp, idx) => {
            const isAbnormal = (idx === 2 && faults.fuelInjectorClog) || cylTemp > 215;
            return (
              <div 
                key={idx} 
                className={`p-1.5 rounded flex flex-col items-center border transition-all ${
                  isAbnormal 
                    ? 'bg-[#252a38] border-[#ef4444]/60 shadow-[0_0_8px_rgba(239,68,68,0.25)]' 
                    : 'bg-[#1a1f2d] border-[#3b494b]/20'
                }`}
              >
                <span className="font-mono-telemetry text-[8px] text-[#849495]">
                  CYL {idx + 1}
                </span>
                <span className={`font-mono-telemetry text-sm font-bold mt-0.5 ${
                  isAbnormal ? 'text-[#ef4444]' : 'text-[#dee2f5]'
                }`}>
                  {cylTemp}°
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

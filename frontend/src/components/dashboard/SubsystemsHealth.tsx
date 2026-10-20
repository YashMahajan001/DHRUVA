import React from 'react';
import { SubsystemHealth } from '../../types';

interface SubsystemsHealthProps {
  subsystems: SubsystemHealth;
  confidence: number;
  syncStatus: string;
}

export const SubsystemsHealth: React.FC<SubsystemsHealthProps> = ({
  subsystems,
  confidence,
  syncStatus,
}) => {
  const fuel = subsystems?.fuelDelivery || 95;
  const cooling = subsystems?.coolingAirflow || 84;
  const lub = subsystems?.lubricationSump || 90;
  const elec = subsystems?.dualMagnetosSpark || 98;

  const getSubColor = (val: number) => {
    if (val < 70) return { bar: 'bg-[#ef4444]', text: 'text-[#ef4444]' };
    if (val < 85) return { bar: 'bg-[#f59e0b]', text: 'text-[#f59e0b]' };
    return { bar: 'bg-[#00f0ff]', text: 'text-[#00f0ff]' };
  };

  const fuelStyle = getSubColor(fuel);
  const coolingStyle = getSubColor(cooling);
  const lubStyle = getSubColor(lub);
  const elecStyle = { bar: 'bg-[#10b981]', text: 'text-[#10b981]' };

  return (
    <div
      id="subsystems-health-panel"
      className="bg-[#0c1220]/90 border border-[#00f0ff]/15 p-3.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#dee2f5]">
          Subsystems
        </span>
        <span className="text-[10px] text-[#00f0ff] font-medium">
          {syncStatus || 'Synced'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 my-auto">
        {/* Fuel System */}
        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-[#b9cacb]">Fuel Delivery &amp; Rails</span>
            <span className={`font-bold ${fuelStyle.text}`}>{fuel}%</span>
          </div>
          <div className="w-full bg-[#303443] h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${fuelStyle.bar}`}
              style={{ width: `${fuel}%` }}
            />
          </div>
        </div>

        {/* Cooling & Baffle Airflow */}
        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-[#b9cacb]">Cooling &amp; Baffles</span>
            <span className={`font-bold ${coolingStyle.text}`}>{cooling}%</span>
          </div>
          <div className="w-full bg-[#303443] h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${coolingStyle.bar}`}
              style={{ width: `${cooling}%` }}
            />
          </div>
        </div>

        {/* Lubrication & Sump */}
        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-[#b9cacb]">Lubrication</span>
            <span className={`font-bold ${lubStyle.text}`}>{lub}%</span>
          </div>
          <div className="w-full bg-[#303443] h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${lubStyle.bar}`}
              style={{ width: `${lub}%` }}
            />
          </div>
        </div>

        {/* Ignition / Electrical */}
        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-[#b9cacb]">Ignition &amp; Spark</span>
            <span className={`font-bold ${elecStyle.text}`}>{elec}%</span>
          </div>
          <div className="w-full bg-[#303443] h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${elecStyle.bar}`}
              style={{ width: `${elec}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#161f30]/60 border border-[#3b494b]/20 py-1 px-2 rounded-lg text-center mt-2">
        <span className="text-[10px] text-[#849495]">
          Twin confidence: <span className="font-mono text-[#dee2f5] font-semibold">{(confidence || 98.4).toFixed(1)}%</span>
        </span>
      </div>
    </div>
  );
};

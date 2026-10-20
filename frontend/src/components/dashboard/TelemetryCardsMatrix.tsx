import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Battery, Zap, Thermometer, Gauge } from 'lucide-react';
import { Telemetry } from '../../types';

interface TelemetryCardsMatrixProps {
  telemetry: Telemetry;
}

export const TelemetryCardsMatrix: React.FC<TelemetryCardsMatrixProps> = ({ telemetry }) => {
  const [showSecondary, setShowSecondary] = useState<boolean>(false);

  const rpm = Math.round(telemetry?.rpm || 2447);
  const cht = Math.round(telemetry?.cht || 178);
  const egt = Math.round(telemetry?.egt || 690);
  const oilPress = Math.round(telemetry?.oilPressure || 82);
  const fuelFlow = (telemetry?.fuelFlow || 32.5).toFixed(1);
  const vib = (telemetry?.vibration || 2.1).toFixed(1);

  // Status badges & limits
  const rpmPct = Math.min(100, Math.max(10, (rpm / 2700) * 100));
  const chtPct = Math.min(100, Math.max(10, (cht / 240) * 100));
  const egtPct = Math.min(100, Math.max(10, (egt / 850) * 100));
  const oilPct = Math.min(100, Math.max(10, (oilPress / 100) * 100));
  const fuelPct = Math.min(100, Math.max(10, (parseFloat(fuelFlow) / 45) * 100));
  const vibPct = Math.min(100, Math.max(10, (parseFloat(vib) / 5.5) * 100));

  const chtStatus = cht > 210 ? { text: 'HIGH', color: 'text-[#ef4444]' } : { text: 'NOM', color: 'text-[#10b981]' };
  const vibStatus = parseFloat(vib) > 4.0 ? { text: 'CRIT', color: 'text-[#ef4444]' } : parseFloat(vib) > 3.0 ? { text: 'WARN', color: 'text-[#f59e0b]' } : { text: 'LOW', color: 'text-[#10b981]' };
  const oilStatus = oilPress < 60 ? { text: 'WARN', color: 'text-[#f59e0b]' } : { text: 'STABLE', color: 'text-[#10b981]' };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Consolidated Engine Telemetry Panel (1 unified container instead of 6 separate cards) */}
      <div className="bg-[#0c1220]/90 border border-[#00f0ff]/15 rounded-xl p-3 sm:p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#3b494b]/20">
          {/* Metric 1: RPM */}
          <div className="px-3 py-1.5 sm:py-0 sm:first:pl-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">RPM</span>
              <span className="text-[#10b981] font-semibold text-[10px]">Nominal</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span className="font-mono text-lg md:text-xl font-bold text-[#dee2f5] tracking-tight">
                {rpm.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#849495]">rpm</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className="bg-[#00f0ff] h-full transition-all duration-300"
                style={{ width: `${rpmPct}%` }}
              />
            </div>
          </div>

          {/* Metric 2: CHT */}
          <div className="px-3 py-1.5 sm:py-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">CHT</span>
              <span className={`font-semibold text-[10px] ${chtStatus.color}`}>{chtStatus.text}</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span
                className={`font-mono text-lg md:text-xl font-bold tracking-tight ${
                  cht > 210 ? 'text-[#ffdad6]' : 'text-[#dee2f5]'
                }`}
              >
                {cht}
              </span>
              <span className="text-[10px] text-[#849495]">°C</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  cht > 210 ? 'bg-[#ef4444]' : 'bg-[#00f0ff]'
                }`}
                style={{ width: `${chtPct}%` }}
              />
            </div>
          </div>

          {/* Metric 3: EGT */}
          <div className="px-3 py-1.5 sm:py-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">EGT</span>
              <span className="text-[#10b981] font-semibold text-[10px]">Nominal</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span className="font-mono text-lg md:text-xl font-bold text-[#dee2f5] tracking-tight">
                {egt}
              </span>
              <span className="text-[10px] text-[#849495]">°C</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className="bg-[#00f0ff] h-full transition-all duration-300"
                style={{ width: `${egtPct}%` }}
              />
            </div>
          </div>

          {/* Metric 4: Oil Pressure */}
          <div className="px-3 py-1.5 sm:py-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">Oil pressure</span>
              <span className={`font-semibold text-[10px] ${oilStatus.color}`}>{oilStatus.text}</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span className="font-mono text-lg md:text-xl font-bold text-[#dee2f5] tracking-tight">
                {oilPress}
              </span>
              <span className="text-[10px] text-[#849495]">psi</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  oilPress < 60 ? 'bg-[#f59e0b]' : 'bg-[#00f0ff]'
                }`}
                style={{ width: `${oilPct}%` }}
              />
            </div>
          </div>

          {/* Metric 5: Fuel Flow */}
          <div className="px-3 py-1.5 sm:py-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">Fuel flow</span>
              <span className="text-[#10b981] font-semibold text-[10px]">Optimal</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span className="font-mono text-lg md:text-xl font-bold text-[#dee2f5] tracking-tight">
                {fuelFlow}
              </span>
              <span className="text-[10px] text-[#849495]">L/h</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className="bg-[#00f0ff] h-full transition-all duration-300"
                style={{ width: `${fuelPct}%` }}
              />
            </div>
          </div>

          {/* Metric 6: Vibration RMS */}
          <div className="px-3 py-1.5 sm:py-0 sm:last:pr-0 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#849495] text-[11px]">
              <span className="font-medium tracking-wide">Vibration</span>
              <span className={`font-semibold text-[10px] ${vibStatus.color}`}>{vibStatus.text}</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1">
              <span
                className={`font-mono text-lg md:text-xl font-bold tracking-tight ${
                  parseFloat(vib) > 4.0 ? 'text-[#ffb4ab]' : parseFloat(vib) > 3.0 ? 'text-[#f59e0b]' : 'text-[#dee2f5]'
                }`}
              >
                {vib}
              </span>
              <span className="text-[10px] text-[#849495]">mm/s</span>
            </div>
            <div className="w-full bg-[#1e2538] h-1 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  parseFloat(vib) > 4.0 ? 'bg-[#ef4444]' : parseFloat(vib) > 3.0 ? 'bg-[#f59e0b]' : 'bg-[#00f0ff]'
                }`}
                style={{ width: `${vibPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button for Secondary Electrical & Auxiliary Telemetry */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSecondary((prev) => !prev)}
          className="text-[#849495] hover:text-[#00f0ff] font-mono text-[11px] flex items-center gap-1.5 py-1 px-2.5 mt-1 rounded hover:bg-[#161b29] transition-colors cursor-pointer"
        >
          <span>{showSecondary ? 'Hide auxiliary' : 'Auxiliary bus (4)'}</span>
          {showSecondary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Auxiliary Telemetry Row (Battery, Alternator, Oil Temp, Manifold Pressure) */}
      {showSecondary && (
        <div className="bg-[#090e1a]/90 border border-[#00f0ff]/15 rounded-lg p-2.5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3b494b]/20">
            <div className="px-3 py-1 sm:py-0 sm:first:pl-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-[#f59e0b]" />
                <div>
                  <span className="text-[10px] text-[#849495] block">Oil temp</span>
                  <span className="font-mono text-xs font-bold text-[#dee2f5]">
                    {telemetry?.oilTemperature || 85} °C
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-[#10b981] font-medium">Nominal</span>
            </div>

            <div className="px-3 py-1 sm:py-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="w-3.5 h-3.5 text-[#00f0ff]" />
                <div>
                  <span className="text-[10px] text-[#849495] block">Battery</span>
                  <span className="font-mono text-xs font-bold text-[#dee2f5]">
                    {(telemetry?.batteryVoltage || 28.2).toFixed(1)} V
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-[#10b981] font-medium">28 V</span>
            </div>

            <div className="px-3 py-1 sm:py-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#00dbe9]" />
                <div>
                  <span className="text-[10px] text-[#849495] block">Alternator</span>
                  <span className="font-mono text-xs font-bold text-[#dee2f5]">
                    {(telemetry?.alternatorCurrent || 44.5).toFixed(1)} A
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-[#10b981] font-medium">62% load</span>
            </div>

            <div className="px-3 py-1 sm:py-0 sm:last:pr-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-[#7df4ff]" />
                <div>
                  <span className="text-[10px] text-[#849495] block">Manifold</span>
                  <span className="font-mono text-xs font-bold text-[#dee2f5]">
                    {(telemetry?.manifoldPressure || 24.8).toFixed(1)} inHg
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-[#10b981] font-medium">Nominal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


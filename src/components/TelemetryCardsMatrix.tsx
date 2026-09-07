import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Battery, Zap, Thermometer, Gauge } from 'lucide-react';
import { Telemetry } from '../types';

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
    <div className="flex flex-col gap-1.5 w-full">
      {/* 6 Primary Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Metric 1: RPM */}
        <div className="bg-[#252a38]/70 border border-[#3b494b]/30 p-2.5 rounded flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>CORE SPEED</span>
            <span className="text-[#10b981] font-bold">OK</span>
          </div>
          <div className="my-1">
            <span className="font-mono text-xl md:text-2xl font-bold text-[#dee2f5] block tracking-tight">
              {rpm}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">RPM (LIMIT 2700)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className="bg-[#00f0ff] h-full transition-all duration-300 shadow-[0_0_6px_#00f0ff]"
              style={{ width: `${rpmPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: CHT */}
        <div
          className={`p-2.5 rounded flex flex-col justify-between border transition-colors ${
            cht > 210
              ? 'bg-[#93000a]/20 border-[#ffb4ab]/40'
              : 'bg-[#252a38]/70 border-[#3b494b]/30 hover:border-[#00f0ff]/40'
          }`}
        >
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>CHT MAX</span>
            <span className={`font-bold ${chtStatus.color}`}>{chtStatus.text}</span>
          </div>
          <div className="my-1">
            <span
              className={`font-mono text-xl md:text-2xl font-bold block tracking-tight ${
                cht > 210 ? 'text-[#ffdad6]' : 'text-[#dee2f5]'
              }`}
            >
              {cht}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">°C (WARN &gt;210)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                cht > 210 ? 'bg-[#ef4444]' : 'bg-[#00f0ff]'
              }`}
              style={{ width: `${chtPct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: EGT */}
        <div className="bg-[#252a38]/70 border border-[#3b494b]/30 p-2.5 rounded flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>EGT EXHAUST</span>
            <span className="text-[#10b981] font-bold">NOM</span>
          </div>
          <div className="my-1">
            <span className="font-mono text-xl md:text-2xl font-bold text-[#dee2f5] block tracking-tight">
              {egt}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">°C (WARN &gt;760)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className="bg-[#00f0ff] h-full transition-all duration-300"
              style={{ width: `${egtPct}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Oil Pressure */}
        <div className="bg-[#252a38]/70 border border-[#3b494b]/30 p-2.5 rounded flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>OIL PRESSURE</span>
            <span className={`font-bold ${oilStatus.color}`}>{oilStatus.text}</span>
          </div>
          <div className="my-1">
            <span className="font-mono text-xl md:text-2xl font-bold text-[#dee2f5] block tracking-tight">
              {oilPress}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">PSI (60-90 NOM)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                oilPress < 60 ? 'bg-[#f59e0b]' : 'bg-[#00f0ff]'
              }`}
              style={{ width: `${oilPct}%` }}
            />
          </div>
        </div>

        {/* Metric 5: Fuel Flow */}
        <div className="bg-[#252a38]/70 border border-[#3b494b]/30 p-2.5 rounded flex flex-col justify-between hover:border-[#00f0ff]/40 transition-colors">
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>FUEL CONSUMPTION</span>
            <span className="text-[#10b981] font-bold">OPT</span>
          </div>
          <div className="my-1">
            <span className="font-mono text-xl md:text-2xl font-bold text-[#dee2f5] block tracking-tight">
              {fuelFlow}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">L/HR (CRUISE)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className="bg-[#00f0ff] h-full transition-all duration-300"
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </div>

        {/* Metric 6: Vibration RMS */}
        <div
          className={`p-2.5 rounded flex flex-col justify-between border transition-colors ${
            parseFloat(vib) > 4.0
              ? 'bg-[#93000a]/20 border-[#ffb4ab]/40'
              : parseFloat(vib) > 3.0
              ? 'bg-[#f59e0b]/15 border-[#f59e0b]/40'
              : 'bg-[#252a38]/70 border-[#3b494b]/30 hover:border-[#00f0ff]/40'
          }`}
        >
          <div className="flex justify-between items-center text-[#849495] font-mono text-[9px]">
            <span>VIBRATION RMS</span>
            <span className={`font-bold ${vibStatus.color}`}>{vibStatus.text}</span>
          </div>
          <div className="my-1">
            <span
              className={`font-mono text-xl md:text-2xl font-bold block tracking-tight ${
                parseFloat(vib) > 4.0 ? 'text-[#ffb4ab]' : parseFloat(vib) > 3.0 ? 'text-[#f59e0b]' : 'text-[#dee2f5]'
              }`}
            >
              {vib}
            </span>
            <span className="font-mono text-[9px] text-[#849495]">MM/S (&lt;4.5 MAX)</span>
          </div>
          <div className="w-full bg-[#303443] h-1 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                parseFloat(vib) > 4.0 ? 'bg-[#ef4444]' : parseFloat(vib) > 3.0 ? 'bg-[#f59e0b]' : 'bg-[#00f0ff]'
              }`}
              style={{ width: `${vibPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toggle Button for Secondary Electrical & Auxiliary Telemetry */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSecondary((prev) => !prev)}
          className="text-[#849495] hover:text-[#00f0ff] font-mono text-[9px] flex items-center gap-1 uppercase tracking-wider py-0.5 px-2 rounded hover:bg-[#161b29] transition-colors"
        >
          <span>{showSecondary ? 'Hide Secondary Telemetry' : 'Auxiliary Bus & Electrical Telemetry (Battery, Alternator, Oil Temp)'}</span>
          {showSecondary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Auxiliary Telemetry Row (Battery, Alternator, Oil Temp, Manifold Pressure) */}
      {showSecondary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#3b494b]/20">
          <div className="bg-[#161b29]/90 border border-[#3b494b]/30 p-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#f59e0b]" />
              <div>
                <span className="text-[9px] font-mono text-[#849495] block">OIL TEMPERATURE</span>
                <span className="font-mono text-sm font-bold text-[#dee2f5]">
                  {telemetry?.oilTemperature || 85} °C
                </span>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#10b981]">NOMINAL</span>
          </div>

          <div className="bg-[#161b29]/90 border border-[#3b494b]/30 p-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-[#00f0ff]" />
              <div>
                <span className="text-[9px] font-mono text-[#849495] block">BATTERY BUS</span>
                <span className="font-mono text-sm font-bold text-[#dee2f5]">
                  {(telemetry?.batteryVoltage || 28.2).toFixed(1)} V
                </span>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#10b981]">28V DUAL</span>
          </div>

          <div className="bg-[#161b29]/90 border border-[#3b494b]/30 p-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00dbe9]" />
              <div>
                <span className="text-[9px] font-mono text-[#849495] block">ALTERNATOR LOAD</span>
                <span className="font-mono text-sm font-bold text-[#dee2f5]">
                  {(telemetry?.alternatorCurrent || 44.5).toFixed(1)} A
                </span>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#10b981]">LOAD 62%</span>
          </div>

          <div className="bg-[#161b29]/90 border border-[#3b494b]/30 p-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#7df4ff]" />
              <div>
                <span className="text-[9px] font-mono text-[#849495] block">MANIFOLD PRESSURE</span>
                <span className="font-mono text-sm font-bold text-[#dee2f5]">
                  {(telemetry?.manifoldPressure || 24.8).toFixed(1)} in-Hg
                </span>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#10b981]">BOOST OK</span>
          </div>
        </div>
      )}
    </div>
  );
};

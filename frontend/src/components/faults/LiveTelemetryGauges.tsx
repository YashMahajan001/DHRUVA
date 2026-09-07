import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Gauge, Zap, Fuel, Activity, BatteryCharging, Wind } from 'lucide-react';

export const LiveTelemetryGauges: React.FC = () => {
  const { telemetry, selectedEngine } = useDashboard();

  return (
    <div
      id="live-telemetry-ribbon"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1"
    >
      {/* 1. RPM */}
      <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#3b494b]/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#849495] font-mono-telemetry text-[9px] uppercase">
          <span>PROP ENGINE RPM</span>
          <Gauge className="w-3.5 h-3.5 text-[#00f0ff]" />
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="font-mono-telemetry text-xl font-bold text-[#dee2f5] tracking-tight">
            {telemetry.rpm.toLocaleString()}
          </span>
          <span className="font-mono-telemetry text-[10px] text-[#849495]">RPM</span>
        </div>
        <div className="flex items-center justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>Max: 2800</span>
          <span className="text-[#00f0ff]">Cruise: 82%</span>
        </div>
      </div>

      {/* 2. Fuel Flow */}
      <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#3b494b]/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#849495] font-mono-telemetry text-[9px] uppercase">
          <span>FUEL CONSUMPTION</span>
          <Fuel className="w-3.5 h-3.5 text-[#7df4ff]" />
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="font-mono-telemetry text-xl font-bold text-[#dee2f5] tracking-tight">
            {telemetry.fuelFlowLph.toFixed(1)}
          </span>
          <span className="font-mono-telemetry text-[10px] text-[#849495]">L/hr</span>
        </div>
        <div className="flex items-center justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>Press: {telemetry.fuelPressureBar} bar</span>
          <span className="text-[#00f0ff]">3.2 bar</span>
        </div>
      </div>

      {/* 3. Manifold Pressure */}
      <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#3b494b]/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#849495] font-mono-telemetry text-[9px] uppercase">
          <span>MANIFOLD PRESS (MAP)</span>
          <Wind className="w-3.5 h-3.5 text-[#00f0ff]" />
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="font-mono-telemetry text-xl font-bold text-[#dee2f5] tracking-tight">
            {telemetry.manifoldPressureInHg.toFixed(1)}
          </span>
          <span className="font-mono-telemetry text-[10px] text-[#849495]">inHg</span>
        </div>
        <div className="flex items-center justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>Boost: +0.4 bar</span>
          <span className="text-[#00f0ff]">TURBO</span>
        </div>
      </div>

      {/* 4. Battery Voltage */}
      <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#3b494b]/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#849495] font-mono-telemetry text-[9px] uppercase">
          <span>MAIN BUS VOLTAGE</span>
          <BatteryCharging className="w-3.5 h-3.5 text-[#10b981]" />
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="font-mono-telemetry text-xl font-bold text-[#dee2f5] tracking-tight">
            {telemetry.batteryVoltageV.toFixed(1)}
          </span>
          <span className="font-mono-telemetry text-[10px] text-[#849495]">VDC</span>
        </div>
        <div className="flex items-center justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>28V Mil-STD</span>
          <span className="text-[#10b981]">NOMINAL</span>
        </div>
      </div>

      {/* 5. Alternator Current */}
      <div className="bg-[#090e1b]/80 p-2.5 rounded border border-[#3b494b]/30 flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-[#849495] font-mono-telemetry text-[9px] uppercase">
          <span>ALTERNATOR LOAD</span>
          <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="font-mono-telemetry text-xl font-bold text-[#dee2f5] tracking-tight">
            {telemetry.alternatorCurrentA.toFixed(1)}
          </span>
          <span className="font-mono-telemetry text-[10px] text-[#849495]">AMPS</span>
        </div>
        <div className="flex items-center justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>Capacity: 70A</span>
          <span className="text-[#dbfcff]">64% LOAD</span>
        </div>
      </div>
    </div>
  );
};

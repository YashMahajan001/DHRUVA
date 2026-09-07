import React from 'react';
import { X, Activity, Gauge, Zap, Thermometer, Droplets, Waves, BatteryCharging } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const LiveTelemetryModal: React.FC = () => {
  const { 
    isTelemetryModalOpen, 
    setIsTelemetryModalOpen, 
    telemetry, 
    currentEngine, 
    currentMission 
  } = useDashboard();

  if (!isTelemetryModalOpen) return null;

  // 9 Telemetry Channels definition
  const channels = [
    {
      id: 'rpm',
      name: 'Engine RPM',
      value: telemetry.rpm.toLocaleString(),
      unit: 'RPM',
      nominal: '2,200 - 2,700',
      status: telemetry.rpm > 2700 ? 'WARNING' : 'NOMINAL',
      icon: Gauge,
      pct: ((telemetry.rpm - 1800) / (3000 - 1800)) * 100,
    },
    {
      id: 'cht',
      name: 'Cylinder Head Temp (CHT)',
      value: `${telemetry.cht}°C`,
      unit: 'DEG_C',
      nominal: '< 185°C (190 Max)',
      status: telemetry.cht > 190 ? 'CRITICAL' : (telemetry.cht > 185 ? 'WARNING' : 'NOMINAL'),
      icon: Thermometer,
      pct: (telemetry.cht / 220) * 100,
    },
    {
      id: 'egt',
      name: 'Exhaust Gas Temp (EGT)',
      value: `${telemetry.egt}°C`,
      unit: 'DEG_C',
      nominal: '780 - 840°C',
      status: telemetry.egt > 850 ? 'WARNING' : 'NOMINAL',
      icon: Thermometer,
      pct: ((telemetry.egt - 700) / (900 - 700)) * 100,
    },
    {
      id: 'oil_press',
      name: 'Oil Scavenge Pressure',
      value: `${telemetry.oilPressure} PSI`,
      unit: 'PSI',
      nominal: '55 - 75 PSI',
      status: telemetry.oilPressure < 50 ? 'CRITICAL' : 'NOMINAL',
      icon: Droplets,
      pct: (telemetry.oilPressure / 100) * 100,
    },
    {
      id: 'oil_temp',
      name: 'Oil Sump Temperature',
      value: `${telemetry.oilTemp}°C`,
      unit: 'DEG_C',
      nominal: '75 - 95°C',
      status: telemetry.oilTemp > 100 ? 'WARNING' : 'NOMINAL',
      icon: Thermometer,
      pct: (telemetry.oilTemp / 120) * 100,
    },
    {
      id: 'fuel_flow',
      name: 'Brake Fuel Flow (BSFC)',
      value: `${telemetry.fuelFlow} L/h`,
      unit: 'L/H',
      nominal: '22.0 - 34.0 L/h',
      status: 'NOMINAL',
      icon: Droplets,
      pct: (telemetry.fuelFlow / 40) * 100,
    },
    {
      id: 'vibration',
      name: 'Crankshaft Vibration (Harmonics)',
      value: `${telemetry.vibration} g`,
      unit: 'G',
      nominal: '< 0.25 g (0.4 Max)',
      status: telemetry.vibration > 0.35 ? 'CRITICAL' : (telemetry.vibration > 0.25 ? 'WARNING' : 'NOMINAL'),
      icon: Waves,
      pct: (telemetry.vibration / 0.5) * 100,
    },
    {
      id: 'voltage',
      name: 'Avionics Bus Battery Voltage',
      value: `${telemetry.batteryVoltage} V`,
      unit: 'VOLTS DC',
      nominal: '27.5 - 29.0 V',
      status: telemetry.batteryVoltage < 26.0 ? 'CRITICAL' : 'NOMINAL',
      icon: BatteryCharging,
      pct: (telemetry.batteryVoltage / 32) * 100,
    },
    {
      id: 'current',
      name: 'Primary Alternator Current',
      value: `${telemetry.alternatorCurrent} A`,
      unit: 'AMPERES',
      nominal: '25 - 45 A',
      status: telemetry.alternatorCurrent > 50 ? 'WARNING' : 'NOMINAL',
      icon: Zap,
      pct: (telemetry.alternatorCurrent / 60) * 100,
    },
  ];

  return (
    <div 
      id="live-telemetry-modal-overlay"
      className="fixed inset-0 z-50 bg-[#090e1b]/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div 
        id="live-telemetry-modal-content"
        className="relative w-full max-w-4xl bg-[#161b29] border border-[#00f0ff]/40 rounded-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30">
              <Activity className="w-5 h-5 text-[#00f0ff] animate-pulse" />
            </div>
            <div>
              <h2 className="font-['Space_Grotesk'] text-lg font-bold text-[#dee2f5] tracking-wider uppercase">
                9-CHANNEL LIVE TELEMETRY MATRIX
              </h2>
              <div className="font-mono text-[10px] text-[#849495] tracking-wider uppercase">
                {currentEngine.name} // {currentMission.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTelemetryModalOpen(false)}
            className="p-1.5 rounded hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isCrit = ch.status === 'CRITICAL';
            const isWarn = ch.status === 'WARNING';

            return (
              <div
                key={ch.id}
                className={`bg-[#090e1b]/90 border rounded-lg p-3 space-y-2 ${
                  isCrit
                    ? 'border-[#ffb4ab] bg-[#93000a]/20'
                    : isWarn
                    ? 'border-[#f59e0b]/50'
                    : 'border-[#3b494b]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#849495] uppercase font-medium">
                    {ch.name}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCrit ? 'text-[#ffb4ab]' : isWarn ? 'text-[#f59e0b]' : 'text-[#00f0ff]'}`} />
                </div>

                <div className="flex items-baseline justify-between">
                  <span className={`font-mono text-xl font-bold tracking-tight ${
                    isCrit ? 'text-[#ffb4ab]' : isWarn ? 'text-[#f59e0b]' : 'text-[#00f0ff]'
                  }`}>
                    {ch.value}
                  </span>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    isCrit ? 'bg-[#93000a] text-[#ffdad6]' : isWarn ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#10b981]/20 text-[#10b981]'
                  }`}>
                    {ch.status}
                  </span>
                </div>

                {/* Range Bar */}
                <div className="w-full bg-[#252a38] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isCrit ? 'bg-[#ef4444]' : isWarn ? 'bg-[#f59e0b]' : 'bg-[#00f0ff]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, ch.pct))}%` }}
                  />
                </div>

                <div className="flex justify-between font-mono text-[8px] text-[#849495]">
                  <span>NOMINAL: {ch.nominal}</span>
                  <span>{ch.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per Cylinder Breakdown */}
        <div className="bg-[#090e1b]/80 border border-[#3b494b]/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#00f0ff] uppercase font-bold tracking-wider">
              CYLINDER HEAD THERMAL ASYMMETRY (STANAG 4586 LEVEL 4)
            </span>
            <span className="font-mono text-[9px] text-[#849495]">
              MAX PERMISSIBLE DELTA: 12.0°C
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {telemetry.cylinderCht.map((cVal, idx) => (
              <div key={idx} className="bg-[#161b29] p-2 rounded border border-[#3b494b]/20">
                <div className="font-mono text-[9px] text-[#849495]">CYLINDER #{idx + 1}</div>
                <div className="font-mono text-sm font-bold text-[#dee2f5]">{cVal}°C</div>
                <div className="font-mono text-[8px] text-[#00dbe9] mt-0.5">
                  PRESS: {telemetry.cylinderPressure[idx]} BAR
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsTelemetryModalOpen(false)}
            className="px-4 py-2 bg-[#252a38] hover:bg-[#303443] text-[#dee2f5] font-mono text-xs uppercase tracking-wider rounded border border-[#3b494b]/40 transition-colors"
          >
            DISMISS MATRIX VIEW
          </button>
        </div>
      </div>
    </div>
  );
};

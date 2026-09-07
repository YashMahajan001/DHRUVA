/**
 * DHRUVAA Live Aero Piston Engine Telemetry Matrix Strip
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Activity, Gauge, Flame, Thermometer, Droplet, Zap, BatteryCharging, Radio } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

interface MetricItem {
  id: string;
  name: string;
  acronym: string;
  value: number | string;
  unit: string;
  nominalRange: string;
  min: number;
  max: number;
  currentNum: number;
  status: 'nominal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export const LiveTelemetryStrip: React.FC = () => {
  const { selectedEngine, isSimulating, setSelectedMetric, selectedMetric } = useMission();
  const tel = selectedEngine.telemetry;

  const metrics: MetricItem[] = [
    {
      id: 'rpm',
      name: 'Engine Speed',
      acronym: 'RPM',
      value: tel.rpm,
      currentNum: tel.rpm,
      unit: 'RPM',
      nominalRange: '2400-2700',
      min: 0,
      max: 3000,
      status: tel.rpm < 2000 ? 'warning' : 'nominal',
      icon: <Gauge className="w-3.5 h-3.5" />
    },
    {
      id: 'cht',
      name: 'Cylinder Head Temp',
      acronym: 'CHT',
      value: tel.cht,
      currentNum: tel.cht,
      unit: '°C',
      nominalRange: '140-175°C',
      min: 50,
      max: 250,
      status: tel.cht > 200 ? 'critical' : tel.cht > 185 ? 'warning' : 'nominal',
      icon: <Flame className="w-3.5 h-3.5" />
    },
    {
      id: 'egt',
      name: 'Exhaust Gas Temp',
      acronym: 'EGT',
      value: tel.egt,
      currentNum: tel.egt,
      unit: '°C',
      nominalRange: '720-780°C',
      min: 400,
      max: 900,
      status: tel.egt > 820 ? 'critical' : tel.egt > 790 ? 'warning' : 'nominal',
      icon: <Thermometer className="w-3.5 h-3.5" />
    },
    {
      id: 'oilPressure',
      name: 'Oil Pressure',
      acronym: 'OIL P',
      value: tel.oilPressure,
      currentNum: tel.oilPressure,
      unit: 'PSI',
      nominalRange: '55-75 PSI',
      min: 0,
      max: 100,
      status: tel.oilPressure < 45 ? 'critical' : tel.oilPressure < 55 ? 'warning' : 'nominal',
      icon: <Droplet className="w-3.5 h-3.5" />
    },
    {
      id: 'oilTemperature',
      name: 'Oil Temperature',
      acronym: 'OIL T',
      value: tel.oilTemperature,
      currentNum: tel.oilTemperature,
      unit: '°C',
      nominalRange: '75-95°C',
      min: 30,
      max: 140,
      status: tel.oilTemperature > 105 ? 'critical' : tel.oilTemperature > 95 ? 'warning' : 'nominal',
      icon: <Thermometer className="w-3.5 h-3.5" />
    },
    {
      id: 'fuelFlow',
      name: 'Fuel Consumption',
      acronym: 'FF',
      value: tel.fuelFlow,
      currentNum: tel.fuelFlow,
      unit: 'GPH',
      nominalRange: '12.0-16.5',
      min: 0,
      max: 30,
      status: tel.fuelFlow > 20 ? 'warning' : 'nominal',
      icon: <Droplet className="w-3.5 h-3.5" />
    },
    {
      id: 'vibration',
      name: 'Harmonic Vibration',
      acronym: 'VIB',
      value: tel.vibration,
      currentNum: tel.vibration,
      unit: 'mm/s',
      nominalRange: '0.8-1.5',
      min: 0,
      max: 5,
      status: tel.vibration > 3.0 ? 'critical' : tel.vibration > 1.8 ? 'warning' : 'nominal',
      icon: <Activity className="w-3.5 h-3.5" />
    },
    {
      id: 'batteryVoltage',
      name: 'DC Bus Voltage',
      acronym: 'BATT',
      value: tel.batteryVoltage,
      currentNum: tel.batteryVoltage,
      unit: 'VDC',
      nominalRange: '27.5-28.5',
      min: 20,
      max: 32,
      status: tel.batteryVoltage < 26.5 ? 'warning' : 'nominal',
      icon: <BatteryCharging className="w-3.5 h-3.5" />
    },
    {
      id: 'alternatorCurrent',
      name: 'Alternator Load',
      acronym: 'ALT',
      value: tel.alternatorCurrent,
      currentNum: tel.alternatorCurrent,
      unit: 'AMP',
      nominalRange: '35-55A',
      min: 0,
      max: 70,
      status: tel.alternatorCurrent > 60 ? 'warning' : 'nominal',
      icon: <Zap className="w-3.5 h-3.5" />
    }
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <h3 className="font-headline text-sm text-[#dee2f5] uppercase tracking-wide font-semibold">
            LIVE PROPULSION TELEMETRY STREAM // {selectedEngine.displayId}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-telemetry text-[9px] text-[#849495] uppercase">
            CLICK METRIC TO GRAPH ON TIMELINE
          </span>
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-[#10b981] animate-pulse' : 'bg-[#f59e0b]'}`} />
        </div>
      </div>

      {/* Grid of 9 Telemetry Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {metrics.map((m) => {
          const percent = Math.min(100, Math.max(0, ((m.currentNum - m.min) / (m.max - m.min)) * 100));
          const isSelected = selectedMetric === m.id;

          const textColor =
            m.status === 'critical'
              ? 'text-red-400'
              : m.status === 'warning'
              ? 'text-amber-300'
              : 'text-[#00f0ff]';

          const barColor =
            m.status === 'critical'
              ? 'bg-red-400'
              : m.status === 'warning'
              ? 'bg-amber-400'
              : 'bg-[#00f0ff]';

          const borderColor =
            isSelected
              ? 'border-[#00f0ff] ring-1 ring-[#00f0ff]'
              : m.status === 'critical'
              ? 'border-red-500/50 hover:border-red-400'
              : m.status === 'warning'
              ? 'border-amber-500/50 hover:border-amber-400'
              : 'border-[#3b494b]/30 hover:border-[#00f0ff]/40';

          return (
            <div
              key={m.id}
              onClick={() => {
                if (m.id === 'cht' || m.id === 'egt' || m.id === 'rpm' || m.id === 'vibration' || m.id === 'oilPressure' || m.id === 'fuelFlow') {
                  setSelectedMetric(m.id as any);
                }
              }}
              className={`p-2.5 rounded bg-[#090e1b]/90 border ${borderColor} flex flex-col justify-between cursor-pointer transition-all hover:bg-[#161b29] relative overflow-hidden group`}
            >
              <ReticleCorner color={m.status === 'critical' ? '#ef4444' : m.status === 'warning' ? '#f59e0b' : '#00f0ff'} size={4} />

              <div className="flex items-center justify-between">
                <span className="font-telemetry text-[9px] text-[#849495] uppercase tracking-wider font-semibold">
                  {m.acronym}
                </span>
                <span className={`${textColor} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {m.icon}
                </span>
              </div>

              {/* Value and Unit */}
              <div className="my-1 flex items-baseline gap-1">
                <span className={`font-telemetry text-lg sm:text-xl font-bold tracking-tight ${textColor}`}>
                  {m.value}
                </span>
                <span className="font-telemetry text-[10px] text-[#849495] uppercase">
                  {m.unit}
                </span>
              </div>

              {/* Min-Max Progress Bar */}
              <div className="w-full bg-[#252a38] h-1 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Sub-label range */}
              <div className="flex items-center justify-between text-[8px] font-telemetry text-[#849495] mt-1">
                <span>{m.nominalRange}</span>
                {m.status !== 'nominal' && (
                  <span className={`font-bold ${m.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                    {m.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import {
  TrendingUp,
  Sliders,
  Thermometer,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const FleetMetricsAggregate: React.FC = () => {
  const { fleetAggregate } = useTelemetry();

  return (
    <div
      id="fleet-metrics-panel"
      className="bg-[#161b29]/95 rounded-xl p-5 shadow-xl border border-[#3b494b]/30 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3b494b]/20 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="text-[#00f0ff] w-5 h-5" />
          <span className="font-headline-sm text-[16px] text-[#dee2f5] uppercase font-bold tracking-wide">
            FLEET METRICS AGGREGATE
          </span>
        </div>
        <span className="font-label-micro text-[9px] text-[#849495] uppercase tracking-wider font-mono">
          LIVE COMPUTED
        </span>
      </div>

      {/* 4 Key Aggregate Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Total Sortie Hours */}
        <div className="p-3 bg-[#252a38]/70 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            TOTAL SORTIE HOURS
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="font-telemetry-num-xl text-[24px] text-[#dee2f5] font-mono font-bold leading-none">
              {fleetAggregate.totalSortieHours.toLocaleString()}
            </span>
            <span className="font-label-tactical text-[11px] text-[#849495] font-mono">
              HRS
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-label-micro text-[9.5px] font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>+{fleetAggregate.hoursToday} hrs today</span>
          </div>
        </div>

        {/* Metric 2: Fleet Fuel Burn */}
        <div className="p-3 bg-[#252a38]/70 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            FLEET FUEL BURN
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="font-telemetry-num-xl text-[24px] text-[#00dbe9] font-mono font-bold leading-none">
              {fleetAggregate.fleetFuelBurnLph}
            </span>
            <span className="font-label-tactical text-[11px] text-[#849495] font-mono">
              L/HR
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#b9cacb] font-label-micro text-[9.5px] font-mono">
            <Sliders className="w-3 h-3" />
            <span>Within nominal curve</span>
          </div>
        </div>

        {/* Metric 3: Avg Cylinder Temp */}
        <div className="p-3 bg-[#252a38]/70 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            AVG CYLINDER TEMP
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="font-telemetry-num-xl text-[24px] text-[#dee2f5] font-mono font-bold leading-none">
              {fleetAggregate.averageChtDegC}
            </span>
            <span className="font-label-tactical text-[11px] text-[#849495] font-mono">
              °C CHT
            </span>
          </div>
          <div className="flex items-center gap-1 text-amber-300 font-label-micro text-[9.5px] font-mono">
            <Thermometer className="w-3 h-3" />
            <span>UAV-02 skew (+18°C)</span>
          </div>
        </div>

        {/* Metric 4: Anomaly Index */}
        <div className="p-3 bg-[#252a38]/70 rounded-lg border border-[#3b494b]/30 flex flex-col justify-between">
          <span className="font-label-micro text-[8.5px] text-[#849495] uppercase font-mono">
            ANOMALY INDEX
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="font-telemetry-num-xl text-[24px] text-[#ffb4ab] font-mono font-bold leading-none">
              0{fleetAggregate.anomalyIndex.total}
            </span>
            <span className="font-label-tactical text-[11px] text-[#849495] font-mono">
              EVENTS
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#ffb4ab] font-label-micro text-[9.5px] font-mono font-bold">
            <AlertTriangle className="w-3 h-3" />
            <span>1 CRITICAL / 2 WARNING</span>
          </div>
        </div>
      </div>

      {/* Inline Fleet Health Sparkline Distribution Graph */}
      <div className="p-3 bg-[#252a38]/50 rounded-lg border border-[#3b494b]/30 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[#b9cacb] font-label-micro text-[9.5px] font-mono">
          <span>FLEET AVERAGE HEALTH INDEX TREND (LAST 12 HOURS)</span>
          <span className="text-[#00f0ff] font-bold">MEAN: {fleetAggregate.healthTrendMean}%</span>
        </div>

        <div className="h-16 w-full flex items-end pt-1">
          <svg className="w-full h-full text-[#00f0ff]" viewBox="0 0 320 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fleet-chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path
              d="M0,20 Q40,15 80,18 T160,25 T240,38 L280,45 L320,42 L320,60 L0,60 Z"
              fill="url(#fleet-chart-grad)"
            />
            <path
              d="M0,20 Q40,15 80,18 T160,25 T240,38 L280,45 L320,42"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.5"
            />
            {/* Anomaly Pin on Drop */}
            <circle cx="280" cy="45" r="4.5" fill="#ef4444" stroke="#090e1b" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex justify-between text-[#849495] font-label-micro text-[9px] font-mono">
          <span>T-12H</span>
          <span>T-8H</span>
          <span>T-4H</span>
          <span className="text-[#ffb4ab] font-bold">UAV-03 BRG TRIP</span>
          <span>NOW</span>
        </div>
      </div>
    </div>
  );
};

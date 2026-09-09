import React from 'react';
import { 
  HeartPulse, 
  Clock, 
  Plane, 
  Gauge, 
  Fuel, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const StatusBanner: React.FC = () => {
  const { currentEngine, currentMission, activeCandidate, telemetry, telemetryHistory } = useDashboard();

  // Dynamic live health from telemetry history
  const liveHealth = telemetryHistory.length > 0 
    ? telemetryHistory[telemetryHistory.length - 1].health 
    : currentEngine.currentHealth;
  const isHealthy = liveHealth >= 90;
  const isDegraded = liveHealth < 90 && liveHealth >= 75;
  const healthStatus = liveHealth >= 90 ? 'OPTIMIZED' : liveHealth >= 75 ? 'DEGRADED' : 'CRITICAL';

  // Active candidate endurance loiter calculated dynamically from active burn rate
  const activeLoiterHours = (currentMission.currentFuelLiters / activeCandidate.fuelBurnLh).toFixed(1);
  const remainingFuelPercent = Math.round((currentMission.currentFuelLiters / currentMission.fuelCapacityLiters) * 100);

  return (
    <div 
      id="mission-status-banner"
      className="bg-[#161b29]/80 border-b border-[#3b494b]/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs select-none backdrop-blur-md"
    >
      {/* Left: Engine Health Telemetry Capsule */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Overall Health Pill */}
        <div 
          id="engine-health-capsule"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#090e1b]/90 border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
        >
          <div className="relative flex items-center justify-center">
            <HeartPulse className={`w-4 h-4 ${isHealthy ? 'text-[#10b981] animate-pulse' : 'text-[#f59e0b]'}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-[#849495] uppercase tracking-wider">HEALTH:</span>
              <span className={`font-mono font-bold text-sm ${isHealthy ? 'text-[#00f0ff]' : isDegraded ? 'text-[#f59e0b]' : 'text-[#ffb4ab]'}`}>
                {liveHealth}%
              </span>
              <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isHealthy ? 'bg-[#10b981]/20 text-[#10b981]' : isDegraded ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#93000a] text-[#ffb4ab]'
              }`}>
                {healthStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Estimated RUL */}
        <div className="flex items-center gap-1.5 bg-[#090e1b]/60 px-2.5 py-1 rounded border border-[#3b494b]/20">
          <Clock className="w-3.5 h-3.5 text-[#00dbe9]" />
          <span className="font-mono text-[10px] text-[#849495] uppercase">RUL:</span>
          <span className="font-mono font-semibold text-xs text-[#dee2f5]">
            {activeCandidate.estRulHours} hrs
          </span>
          <span className="font-mono text-[9px] text-[#00f0ff]">
            ({activeCandidate.rulDeltaText || 'NOMINAL'})
          </span>
        </div>

        {/* Plant Model Details */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[#b9cacb]">
          <span className="text-[#849495]">ENGINE:</span>
          <span className="text-[#dee2f5] font-medium">{currentEngine.model}</span>
          <span className="text-[#849495] text-[10px]">[{currentEngine.serialNumber}]</span>
        </div>
      </div>

      {/* Right: Flight Mission Information & Fuel Endurance */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Mission Phase Badge */}
        <div className="flex items-center gap-1.5 bg-[#090e1b]/60 px-2.5 py-1 rounded border border-[#3b494b]/20">
          <Plane className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-mono text-[10px] text-[#849495] uppercase">PHASE:</span>
          <span className="font-mono font-bold text-[11px] text-[#00f0ff] uppercase tracking-wider">
            {currentMission.phase}
          </span>
        </div>

        {/* Altitude & Progress */}
        <div className="flex items-center gap-2 bg-[#090e1b]/60 px-2.5 py-1 rounded border border-[#3b494b]/20">
          <Gauge className="w-3.5 h-3.5 text-[#7df4ff]" />
          <span className="font-mono text-[10px] text-[#849495] uppercase">ALT:</span>
          <span className="font-mono font-semibold text-xs text-[#dee2f5]">
            {currentMission.targetAltitudeFt.toLocaleString()} FT
          </span>
          <span className="font-mono text-[#849495] text-[10px]">
            ({currentMission.progressPercent}% PROGRESS)
          </span>
        </div>

        {/* Fuel & Endurance */}
        <div className="flex items-center gap-2 bg-[#090e1b]/60 px-2.5 py-1 rounded border border-[#3b494b]/20">
          <Fuel className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span className="font-mono text-[10px] text-[#849495] uppercase">FUEL:</span>
          <span className="font-mono font-semibold text-xs text-[#dee2f5]">
            {currentMission.currentFuelLiters} L ({remainingFuelPercent}%)
          </span>
          <span className="font-mono text-[#00f0ff] text-[10px]">
            ~{activeLoiterHours}h LOITER ({activeCandidate.tag})
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { 
  Cpu, 
  HeartPulse, 
  Clock, 
  Thermometer, 
  Activity, 
  Radio, 
  Network 
} from 'lucide-react';

export const TopTelemetryStrip: React.FC = () => {
  const { selectedEngine, telemetry, stressSimulationActive } = useMissionDashboard();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 select-none">
      {/* 1. TWIN FIDELITY */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all group">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            TWIN FIDELITY
          </span>
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse" />
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="font-mono text-xl xl:text-2xl text-[#00f0ff] font-bold">
            {selectedEngine.twinFidelity.toFixed(1)}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">% SYNC</span>
        </div>
        <div className="w-full bg-[#303443] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#00f0ff] h-full transition-all duration-700 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${selectedEngine.twinFidelity}%` }}
          />
        </div>
      </div>

      {/* 2. OVERALL HEALTH */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            OVERALL HEALTH
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider ${
              stressSimulationActive
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : selectedEngine.healthScore >= 90
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {stressSimulationActive ? 'CRITICAL' : selectedEngine.healthStatus}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span
            className={`font-mono text-xl xl:text-2xl font-bold ${
              stressSimulationActive ? 'text-red-400' : 'text-[#dee2f5]'
            }`}
          >
            {stressSimulationActive ? 68 : selectedEngine.healthScore}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">SCORE</span>
        </div>
        <div className="w-full bg-[#303443] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              stressSimulationActive ? 'bg-red-500 w-[68%]' : 'bg-[#10b981] w-[92%]'
            }`}
          />
        </div>
      </div>

      {/* 3. RUL PROJECTION */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            RUL PROJECTION
          </span>
          <Clock className="w-3.5 h-3.5 text-[#00dbe9]" />
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="font-mono text-xl xl:text-2xl text-[#7df4ff] font-bold">
            {selectedEngine.rulHours}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">HOURS</span>
        </div>
        <span className="font-mono text-[9px] text-[#849495] truncate">
          MTBF {selectedEngine.mtbfHours}H // OP: {selectedEngine.operatingHours.toLocaleString()}H
        </span>
      </div>

      {/* 4. AVG CHT TEMP */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            AVG CHT TEMP
          </span>
          <Thermometer className="w-3.5 h-3.5 text-[#00f0ff]" />
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span
            className={`font-mono text-xl xl:text-2xl font-bold ${
              telemetry.chtAvg > 195 ? 'text-red-400' : 'text-[#dee2f5]'
            }`}
          >
            {Math.round(telemetry.chtAvg)}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">°C</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] text-[#849495]">
          <span>MAX: 205°C</span>
          <span className={telemetry.chtSpread > 6 ? 'text-amber-400 font-bold' : 'text-[#00f0ff]'}>
            Δ {telemetry.chtSpread}°C
          </span>
        </div>
      </div>

      {/* 5. VIBE AMPLITUDE */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            VIBE AMPLITUDE
          </span>
          <Activity className="w-3.5 h-3.5 text-[#f59e0b]" />
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span
            className={`font-mono text-xl xl:text-2xl font-bold ${
              telemetry.vibrationAmplitude > 3.5 ? 'text-red-400' : 'text-[#dee2f5]'
            }`}
          >
            {telemetry.vibrationAmplitude.toFixed(1)}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">mm/s</span>
        </div>
        <span
          className={`font-mono text-[9px] font-semibold truncate ${
            telemetry.vibrationAmplitude > 3.5 ? 'text-red-400' : 'text-[#10b981]'
          }`}
        >
          {telemetry.vibrationAmplitude > 3.5 ? 'HARMONIC DRIFT' : 'HARMONIC BALANCE OK'}
        </span>
      </div>

      {/* 6. SENSOR BUS */}
      <div className="bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            SENSOR BUS
          </span>
          <Radio className="w-3.5 h-3.5 text-[#00f0ff]" />
        </div>
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="font-mono text-xl xl:text-2xl text-[#dee2f5] font-bold">
            {selectedEngine.activeSensors}/{selectedEngine.totalSensors}
          </span>
          <span className="font-mono text-[10px] text-[#b9cacb] font-semibold">NODES</span>
        </div>
        <span className="font-mono text-[9px] text-[#10b981] font-medium truncate">
          0 REJECTED PACKETS
        </span>
      </div>

      {/* 7. SOCKET PIPELINE */}
      <div className="col-span-2 md:col-span-4 xl:col-span-1 bg-[#161b29]/90 backdrop-blur-md p-3.5 rounded-xl shadow-md flex flex-col justify-between border border-[#3b494b]/30 hover:border-[#00f0ff]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase font-semibold">
            SOCKET PIPELINE
          </span>
          <Network className="w-3.5 h-3.5 text-[#00f0ff]" />
        </div>
        <div className="flex items-center gap-1.5 my-1">
          <span className="font-mono text-xs xl:text-sm text-[#00f0ff] font-bold tracking-wider">
            FASTAPI // WS
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-[9px]">
          <span className="text-[#849495]">RTT: {selectedEngine.pipelineLatencyMs}ms</span>
          <span className="text-[#00dbe9] font-semibold">PORT {selectedEngine.pipelinePort}</span>
        </div>
      </div>
    </div>
  );
};

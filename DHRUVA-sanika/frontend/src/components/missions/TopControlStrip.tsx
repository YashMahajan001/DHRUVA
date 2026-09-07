/**
 * DHRUVAA — Mission Profile Top Control Strip
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Cpu, 
  ChevronDown 
} from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const TopControlStrip: React.FC = () => {
  const { 
    missions,
    selectedMission, 
    selectMissionById, 
    isRunning, 
    startSimulation, 
    pauseSimulation, 
    resetSimulation, 
    stepSimulation,
    simSpeed,
    setSimSpeed,
    telemetry,
    twinState
  } = useDashboard();

  return (
    <section className="w-full bg-[#090e1b]/95 backdrop-blur-xl px-6 py-2 shadow-xl border-b border-[#3b494b]/20 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30">
      {/* Left: Mission Profile Scenario Selector & Controls */}
      <div className="flex items-center gap-5 flex-wrap">
        {/* Scenario Selector Dropdown */}
        <div className="flex flex-col">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase tracking-widest">
            MISSION PROFILE SCENARIO
          </span>
          <div className="relative mt-0.5">
            <select
              value={selectedMission.id}
              onChange={(e) => selectMissionById(e.target.value)}
              className="bg-[#252a38] text-[#dee2f5] font-mono-telemetry text-xs px-3 py-1.5 rounded pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00f0ff] border border-[#3b494b]/40 hover:border-[#00f0ff]/50 transition-colors"
            >
              {missions.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#161b29] text-[#dee2f5]">
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#b9cacb] pointer-events-none" />
          </div>
        </div>

        {/* Playback Controls Ribbon */}
        <div className="flex items-center bg-[#161b29]/90 p-1 rounded border border-[#3b494b]/30 gap-1 shadow-inner">
          {/* RUN */}
          <button
            onClick={startSimulation}
            className={`flex items-center gap-1 px-3 py-1 rounded font-mono-telemetry text-xs font-bold transition-all cursor-pointer ${
              isRunning 
                ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.35)] scale-105' 
                : 'bg-[#1a1f2d] text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
            title="Run Simulation"
            type="button"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN</span>
          </button>

          {/* PAUSE */}
          <button
            onClick={pauseSimulation}
            className={`flex items-center gap-1 px-3 py-1 rounded font-mono-telemetry text-xs font-bold transition-all cursor-pointer ${
              !isRunning 
                ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.35)]' 
                : 'bg-[#1a1f2d] text-[#b9cacb] hover:bg-[#252a38] hover:text-[#dee2f5]'
            }`}
            title="Pause Simulation"
            type="button"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>PAUSE</span>
          </button>

          {/* RESET / REPLAY */}
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded bg-[#1a1f2d] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer"
            title="Replay / Reset Mission Elapsed Time"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-[#3b494b]/30 mx-1" />

          {/* Speed Buttons */}
          <div className="flex items-center bg-[#090e1b] rounded p-0.5 font-mono-telemetry text-[10px]">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  simSpeed === spd 
                    ? 'bg-[#252a38] text-[#00f0ff] font-bold shadow-[0_0_6px_rgba(0,240,255,0.3)]' 
                    : 'text-[#b9cacb] hover:text-[#dee2f5]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* STEP */}
          <button
            onClick={() => stepSimulation(10)}
            className="p-1.5 rounded bg-[#1a1f2d] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer"
            title="Step Simulation Forward (+10s)"
            type="button"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Telemetry Ticker & Operational State */}
      <div className="flex items-center gap-6">
        {/* MET Clock */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="font-mono-telemetry text-[9px] text-[#849495] tracking-wider uppercase">
              MISSION ELAPSED (MET)
            </span>
            <span className="font-mono-telemetry text-2xl text-[#00f0ff] font-bold tracking-wider leading-none">
              {telemetry.timeFormatted}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center pl-1">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-ping opacity-75' : 'bg-[#849495]'}`} />
            <span className={`font-mono-telemetry text-[8px] uppercase tracking-widest mt-1 ${isRunning ? 'text-[#00dbe9]' : 'text-[#849495]'}`}>
              {isRunning ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Twin Convergence Badge */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#252a38]/60 border border-[#3b494b]/30">
          <Cpu className="w-4 h-4 text-[#b4c5ff]" />
          <div className="flex flex-col">
            <span className="font-mono-telemetry text-[8px] text-[#849495] uppercase">
              TWIN CONVERGENCE
            </span>
            <span className="font-mono-telemetry text-xs text-[#dee2f5] font-semibold">
              {twinState.twinConvergencePercent}% {twinState.syncState}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

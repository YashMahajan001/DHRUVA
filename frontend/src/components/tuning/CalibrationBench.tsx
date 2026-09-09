import React from 'react';
import { Sliders, RotateCw, Activity, ArrowUpRight } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';
import { MapProfile, TuningParameters } from '../../types/tuningTypes';

export const CalibrationBench: React.FC = () => {
  const { 
    tuning, 
    updateTuning, 
    runSimulation, 
    isSimulating,
    currentMission,
    telemetry,
    selectCandidate,
    selectedCandidateId,
  } = useDashboard();

  // When user changes a slider or button, update tuning (auto-switches candidate to custom)
  const handleSliderChange = (params: Partial<TuningParameters>) => {
    updateTuning(params);
  };

  const handleMapProfile = (profile: MapProfile) => {
    handleSliderChange({ mapProfile: profile });
  };

  return (
    <div id="calibration-bench-column" className="flex flex-col gap-3">
      {/* Primary Calibration Card */}
      <div 
        id="calibration-bench-panel"
        className="bg-[#161b29]/90 border border-[#3b494b]/30 rounded-xl p-5 shadow-lg flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="text-[#00f0ff] w-4 h-4" />
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5] uppercase tracking-wider">
                CALIBRATION BENCH
              </h2>
            </div>
            <span 
              id="bench-slot-badge"
              className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#303443] text-[#00dbe9] border border-[#3b494b]/40 font-semibold"
            >
              SLOT: C-4
            </span>
          </div>

          <p className="text-xs text-[#b9cacb] leading-relaxed">
            Adjust injection map, ignition curvature, and thermodynamic governing setpoints.
          </p>

          <div className="space-y-3 pt-1">
            {/* PARAMETER 1: AIR/FUEL LAMBDA */}
            <div className="bg-[#090e1b]/85 border border-[#3b494b]/20 p-2.5 rounded-lg space-y-1.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-[#b9cacb] uppercase font-medium">
                  Air/Fuel Lambda (λ)
                </span>
                <span id="lambdaVal" className="font-mono text-sm font-bold text-[#00f0ff]">
                  {tuning.lambda.toFixed(2)} λ
                </span>
              </div>
              <input
                id="lambdaSlider"
                type="range"
                min="0.85"
                max="1.15"
                step="0.01"
                value={tuning.lambda}
                onChange={(e) => handleSliderChange({ lambda: parseFloat(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-[#303443] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[#849495] font-mono text-[9px] uppercase">
                <span>0.85 RICH (BURST)</span>
                <span>1.0 STOICH</span>
                <span>1.15 LEAN (ECO)</span>
              </div>
            </div>

            {/* PARAMETER 2: IGNITION ADVANCE */}
            <div className="bg-[#090e1b]/85 border border-[#3b494b]/20 p-2.5 rounded-lg space-y-1.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-[#b9cacb] uppercase font-medium">
                  Ignition Advance
                </span>
                <span id="timingVal" className="font-mono text-sm font-bold text-[#00f0ff]">
                  {tuning.timingBtdc.toFixed(1)}° BTDC
                </span>
              </div>
              <input
                id="timingSlider"
                type="range"
                min="18"
                max="28"
                step="0.5"
                value={tuning.timingBtdc}
                onChange={(e) => handleSliderChange({ timingBtdc: parseFloat(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-[#303443] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[#849495] font-mono text-[9px] uppercase">
                <span>18° RETARDED</span>
                <span>24° NOMINAL</span>
                <span>28° ADVANCED</span>
              </div>
            </div>

            {/* PARAMETER 3: RPM GOVERNOR CEILING */}
            <div className="bg-[#090e1b]/85 border border-[#3b494b]/20 p-2.5 rounded-lg space-y-1.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-[#b9cacb] uppercase font-medium">
                  RPM Governor Ceiling
                </span>
                <span id="rpmVal" className="font-mono text-sm font-bold text-[#00f0ff]">
                  {tuning.rpmCeiling.toLocaleString()} RPM
                </span>
              </div>
              <input
                id="rpmSlider"
                type="range"
                min="2200"
                max="2800"
                step="25"
                value={tuning.rpmCeiling}
                onChange={(e) => handleSliderChange({ rpmCeiling: parseInt(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-[#303443] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[#849495] font-mono text-[9px] uppercase">
                <span>2200 LOW</span>
                <span>2450 CRUISE</span>
                <span>2800 MAX CONT</span>
              </div>
            </div>

            {/* PARAMETER 4: THROTTLE / MAP PROFILE */}
            <div className="bg-[#090e1b]/85 border border-[#3b494b]/20 p-2.5 rounded-lg space-y-1.5 shadow-inner">
              <label className="font-mono text-[11px] text-[#b9cacb] uppercase font-medium block">
                Throttle / MAP Profile
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  id="map-btn-eco"
                  type="button"
                  onClick={() => handleMapProfile('eco')}
                  className={`py-1.5 px-2 text-center rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    tuning.mapProfile === 'eco'
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
                  }`}
                >
                  Eco-Dampened
                </button>
                <button
                  id="map-btn-linear"
                  type="button"
                  onClick={() => handleMapProfile('linear')}
                  className={`py-1.5 px-2 text-center rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    tuning.mapProfile === 'linear'
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
                  }`}
                >
                  Linear
                </button>
                <button
                  id="map-btn-aggr"
                  type="button"
                  onClick={() => handleMapProfile('aggr')}
                  className={`py-1.5 px-2 text-center rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    tuning.mapProfile === 'aggr'
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5]'
                  }`}
                >
                  Aggressive
                </button>
              </div>
            </div>

            {/* PARAMETER 5: COOLING SHUTTER ACTUATION */}
            <div className="bg-[#090e1b]/85 border border-[#3b494b]/20 p-2.5 rounded-lg space-y-1.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-[#b9cacb] uppercase font-medium">
                  Cowl Shutter Threshold
                </span>
                <span id="cowlVal" className="font-mono text-sm font-bold text-[#00f0ff]">
                  {tuning.cowlShutterCht}°C CHT
                </span>
              </div>
              <input
                id="cowlSlider"
                type="range"
                min="165"
                max="195"
                step="1"
                value={tuning.cowlShutterCht}
                onChange={(e) => handleSliderChange({ cowlShutterCht: parseInt(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-[#303443] rounded h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[#849495] font-mono text-[9px] uppercase">
                <span>165°C EARLY OPEN</span>
                <span>195°C DRAG-CUT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Execution Action */}
        <div className="pt-4">
          <button
            id="runSimulationBtn"
            type="button"
            onClick={runSimulation}
            disabled={isSimulating}
            className="group relative w-full overflow-hidden rounded-lg bg-[#00f0ff] px-4 py-3 text-[#00363a] transition-all hover:bg-[#7df4ff] hover:shadow-[0_0_24px_rgba(0,240,255,0.45)] cursor-pointer font-mono font-bold tracking-wider uppercase text-xs disabled:opacity-75"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <RotateCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {isSimulating ? 'SOLVING TWIN EQUATIONS...' : 'RUN DIGITAL TWIN SIMULATION'}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          </button>

          <div className="flex justify-between items-center mt-2.5 px-1 font-mono text-[9px]">
            <span className="text-[#849495] uppercase">SIM KERNEL: THERMO-TWIN V4.2</span>
            <span className={`uppercase font-semibold ${isSimulating ? 'text-[#f59e0b] animate-pulse' : 'text-[#00dbe9]'}`}>
              STATUS: {isSimulating ? 'SOLVING...' : 'READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Calibration Ambient Profile Snapshot Widget */}
      <div 
        id="ambient-profile-widget"
        className="bg-[#161b29]/90 border border-[#3b494b]/30 rounded-xl p-3.5 shadow-md space-y-2 select-none"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase">
            CALIBRATION AMBIENT PROFILE
          </span>
          <span className="font-mono text-[9px] text-[#00f0ff] font-semibold">
            BARO: {currentMission.baroInHg.toFixed(2)} INHG
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#090e1b]/80 p-2 rounded border border-[#3b494b]/20">
            <div className="font-mono text-[9px] text-[#849495]">DENSITY ALTITUDE</div>
            <div className="font-mono text-xs font-bold text-[#dee2f5]">
              {currentMission.densityAltitudeFt.toLocaleString()} FT
            </div>
          </div>

          <div className="bg-[#090e1b]/80 p-2 rounded border border-[#3b494b]/20">
            <div className="font-mono text-[9px] text-[#849495]">INTAKE AIR O₂</div>
            <div className="font-mono text-xs font-bold text-[#dee2f5]">
              {currentMission.intakeAirO2Kpa.toFixed(1)} KPA
            </div>
          </div>
        </div>

        {/* Real-time Dynamic Telemetry Ticker */}
        <div className="pt-1 flex flex-col gap-0.5 text-[10px] font-mono border-t border-[#3b494b]/20">
          <div className="flex items-center justify-between">
            <span className="text-[#849495] flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00f0ff] animate-pulse" /> LIVE TELEMETRY:
            </span>
            <span className="text-[#00f0ff] font-bold">
              {telemetry.rpm} RPM | {telemetry.cht}°C | {telemetry.fuelFlow} L/h
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#849495]">
            <span>PEAK PRESS: <strong className="text-[#7df4ff]">{Math.max(...telemetry.cylinderPressure).toFixed(1)} bar</strong></span>
            <span>VIB: <strong className="text-[#dee2f5]">{telemetry.vibration}g</strong></span>
            <span>EGT: <strong className="text-[#f59e0b]">{telemetry.egt}°C</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

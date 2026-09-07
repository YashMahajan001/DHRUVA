import React, { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const FlightProfileConsole: React.FC = () => {
  const { 
    missions, 
    selectedMissionId, 
    setSelectedMissionId, 
    engines, 
    selectedEngineId, 
    setSelectedEngineId,
    showToast 
  } = useDashboard();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    showToast('Syncing Thermodynamic Envelope...', 'Re-evaluating airframe boundary layers and ambient pressure matrix.');
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Envelope Synchronized', 'Propulsion plant model calibrated against active barometric altitude data.');
    }, 1000);
  };

  return (
    <div 
      id="flight-profile-console"
      className="relative overflow-hidden rounded-xl bg-[#161b29]/95 border border-[#3b494b]/30 p-5 shadow-xl backdrop-blur-md"
    >
      {/* Aerospace atmospheric ambient glow */}
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#00f0ff]/10 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 h-48 w-48 rounded-full bg-[#0053db]/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        {/* Left Section: Headings & Protocol Standard */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] font-mono text-[10px] tracking-widest uppercase border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
              ACTIVE TESTBENCH MATRIX // PROTOCOL 88-ALPHA
            </span>
            <span className="font-mono text-[10px] text-[#849495] tracking-wider uppercase">
              STANAG-4586 LEVEL 4 COMPLIANT
            </span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-[#dbfcff] tracking-tight">
            MISSION TUNING &amp; AERO-ENGINE OPTIMIZATION
          </h1>

          <p className="text-sm text-[#b9cacb] max-w-4xl leading-relaxed">
            Simulate, Optimize &amp; Validate Engine Calibration against Digital Twin Thermodynamic Envelopes. Real-time predictive degradation assessment for tactical UAV propulsion.
          </p>
        </div>

        {/* Right Section: Interactive Selectors & Sync Trigger */}
        <div className="flex flex-wrap items-center gap-3 bg-[#090e1b]/85 border border-[#3b494b]/30 p-2.5 rounded-lg shadow-inner">
          {/* Mission Profile Selector */}
          <div className="flex flex-col gap-1">
            <label 
              htmlFor="profileSelector"
              className="font-mono text-[9px] text-[#849495] tracking-widest uppercase font-medium"
            >
              MISSION PROFILE PROFILE_ID
            </label>
            <div className="relative">
              <select
                id="profileSelector"
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="appearance-none bg-[#252a38] text-[#dee2f5] font-mono text-xs px-3 py-2 pr-8 rounded border border-[#3b494b]/40 focus:outline-none focus:border-[#00f0ff] cursor-pointer transition-colors shadow-sm"
              >
                {missions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 text-[#00f0ff] w-4 h-4" />
            </div>
          </div>

          {/* Propulsion Plant Engine Selector */}
          <div className="flex flex-col gap-1">
            <label 
              htmlFor="engineSelector"
              className="font-mono text-[9px] text-[#849495] tracking-widest uppercase font-medium"
            >
              PROPULSION PLANT
            </label>
            <div className="relative">
              <select
                id="engineSelector"
                value={selectedEngineId}
                onChange={(e) => setSelectedEngineId(e.target.value)}
                className="appearance-none bg-[#252a38] text-[#dee2f5] font-mono text-xs px-3 py-2 pr-8 rounded border border-[#3b494b]/40 focus:outline-none focus:border-[#00f0ff] cursor-pointer transition-colors shadow-sm"
              >
                {engines.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 text-[#00f0ff] w-4 h-4" />
            </div>
          </div>

          {/* Sync Envelope Action */}
          <div className="flex flex-col justify-end">
            <button
              id="refreshMetricsBtn"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#303443]/80 hover:bg-[#343948] active:scale-95 text-[#dee2f5] rounded border border-[#3b494b]/40 font-mono text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00dbe9] ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-semibold tracking-wider">SYNC ENVELOPE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

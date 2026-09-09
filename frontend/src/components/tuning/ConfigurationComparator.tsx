import React from 'react';
import { ArrowLeftRight, Sparkles, Wrench } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';
import { CandidateId } from '../../types/tuningTypes';

export const ConfigurationComparator: React.FC = () => {
  const { 
    candidates, 
    selectedCandidateId, 
    selectCandidate, 
    syntheticCycles,
    customTuneConfig,
    tuning,
  } = useDashboard();

  const alpha = candidates.find(c => c.id === 'alpha')!;
  const beta = candidates.find(c => c.id === 'beta')!;
  const custom = customTuneConfig;

  return (
    <div id="candidate-comparator-section" className="space-y-3">
      {/* Comparator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-[#00f0ff] w-4 h-4" />
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5] uppercase tracking-wider">
              CANDIDATE CONFIGURATION COMPARATOR
            </h2>
          </div>
          <p className="text-xs text-[#b9cacb] leading-relaxed">
            Multi-objective Pareto comparison across brake specific fuel consumption, thermal envelope, and airframe persistence.
          </p>
        </div>
        <span 
          id="synthetic-cycles-counter"
          className="font-mono text-[9px] text-[#849495] uppercase self-start sm:self-center font-semibold bg-[#090e1b]/60 px-2 py-0.5 rounded border border-[#3b494b]/20"
        >
          SYNTHETIC RUNS: {syntheticCycles.toLocaleString()} CYCLES
        </span>
      </div>

      {/* 3 Configuration Cards: Alpha, Beta, Custom Tune */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ═══════════════════ ALPHA CARD ═══════════════════ */}
        <div
          id="cardAlpha"
          onClick={() => selectCandidate('alpha')}
          className={`group relative bg-[#090e1b]/90 border rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md ${
            selectedCandidateId === 'alpha'
              ? 'border-[#00f0ff] ring-1 ring-[#00f0ff]/50 scale-[1.02]'
              : 'border-[#3b494b]/30 hover:border-[#849495]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1a1f2d] text-[#b9cacb] uppercase font-semibold">
                {alpha.tag}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#849495]" />
            </div>

            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5]">
                {alpha.name}
              </h3>
              <div className="font-mono text-[9px] text-[#849495] tracking-wider uppercase">
                {alpha.subtitle}
              </div>
            </div>

            {/* Metrics Table */}
            <div className="space-y-1.5 pt-1">
              <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                <span className="font-mono font-bold text-[#dee2f5]">{alpha.fuelBurnLh} L/h</span>
              </div>
              <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Thermal (CHT)</span>
                <span className="font-mono font-bold text-[#dee2f5]">{alpha.thermalCht}°C</span>
              </div>
              <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                <span className="font-mono text-[10px] text-[#dee2f5] font-semibold uppercase">{alpha.wearRate}</span>
              </div>
              <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                <span className="font-mono font-bold text-[#dee2f5]">{alpha.estRulHours} hrs</span>
              </div>
              <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                <span className="font-mono font-bold text-[#dee2f5]">{alpha.missionLoiterHours} hrs</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-[#849495] uppercase">ENVELOPE STATUS</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#1a1f2d] text-[#7df4ff] uppercase font-bold">
                {alpha.envelopeStatus}
              </span>
            </div>
            <button
              id="select-alpha-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectCandidate('alpha');
              }}
              className={`w-full py-2 rounded font-mono text-[10px] tracking-wider uppercase transition-colors font-bold ${
                selectedCandidateId === 'alpha'
                  ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'bg-[#252a38] hover:bg-[#303443] text-[#dee2f5]'
              }`}
            >
              {selectedCandidateId === 'alpha' ? 'ACTIVE CANDIDATE' : 'SELECT FOR REVIEW'}
            </button>
          </div>
        </div>

        {/* ═══════════════════ BETA CARD ═══════════════════ */}
        <div
          id="cardBeta"
          onClick={() => selectCandidate('beta')}
          className={`group relative bg-[#1a1f2d]/95 border border-[#00f0ff]/50 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-2xl ${
            selectedCandidateId === 'beta' ? 'scale-[1.02] shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'hover:border-[#00f0ff]'
          }`}
        >
          {/* AI Recommended Tactical Floating Pill */}
          <div 
            id="ai-recommended-badge"
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00f0ff] text-[#00363a] font-mono text-[9px] font-bold px-3 py-0.5 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.5)] tracking-widest uppercase flex items-center gap-1 select-none"
          >
            <Sparkles className="w-3 h-3 text-[#00363a]" />
            AI RECOMMENDED // ADVISORY
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] uppercase font-bold border border-[#00f0ff]/30">
                {beta.tag}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
            </div>

            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#dbfcff]">
                {beta.name}
              </h3>
              <div className="font-mono text-[9px] text-[#00dbe9] tracking-wider uppercase">
                {beta.subtitle}
              </div>
            </div>

            {/* Metrics Table */}
            <div className="space-y-1.5 pt-1">
              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#00f0ff]">{beta.fuelBurnLh} L/h</span>
                  <span className="font-mono text-[9px] text-[#00f0ff] block font-semibold">{beta.fuelDeltaText}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Thermal (CHT)</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#7df4ff]">{beta.thermalCht}°C</span>
                  <span className="font-mono text-[9px] text-[#849495] block">{beta.thermalDeltaText}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                <span className="font-mono text-[10px] text-[#dee2f5] font-semibold uppercase">{beta.wearRate}</span>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#dee2f5]">{beta.estRulHours} hrs</span>
                  <span className="font-mono text-[9px] text-[#849495] block">{beta.rulDeltaText}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#00f0ff]">{beta.missionLoiterHours} hrs</span>
                  <span className="font-mono text-[9px] text-[#00f0ff] block font-semibold">{beta.loiterDeltaText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-[#849495] uppercase">SAFETY ENVELOPE</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-bold uppercase">
                {beta.envelopeStatus}
              </span>
            </div>
            <button
              id="select-beta-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectCandidate('beta');
              }}
              className={`w-full py-2 rounded font-mono text-[10px] tracking-wider uppercase font-bold transition-all ${
                selectedCandidateId === 'beta'
                  ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-[#252a38] hover:bg-[#303443] text-[#dee2f5]'
              }`}
            >
              {selectedCandidateId === 'beta' ? 'ACTIVE CANDIDATE SELECTED' : 'SELECT FOR REVIEW'}
            </button>
          </div>
        </div>

        {/* ═══════════════════ CUSTOM TUNE CARD ═══════════════════ */}
        <div
          id="cardCustom"
          onClick={() => selectCandidate('custom')}
          className={`group relative border rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md ${
            selectedCandidateId === 'custom'
              ? 'bg-[#0a1628]/95 border-[#a78bfa] ring-1 ring-[#a78bfa]/50 scale-[1.02] shadow-[0_0_16px_rgba(167,139,250,0.2)]'
              : 'bg-[#090e1b]/90 border-[#a78bfa]/30 hover:border-[#a78bfa]/60'
          }`}
        >
          {/* Custom Tune Floating Pill */}
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#a78bfa] text-[#1a0a3e] font-mono text-[9px] font-bold px-3 py-0.5 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.4)] tracking-widest uppercase flex items-center gap-1 select-none"
          >
            <Wrench className="w-3 h-3" />
            CALIBRATION BENCH OUTPUT
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] uppercase font-bold border border-[#a78bfa]/30">
                {custom.tag}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
            </div>

            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e0d4ff]">
                {custom.name}
              </h3>
              <div className="font-mono text-[9px] text-[#a78bfa]/80 tracking-wider uppercase">
                {custom.subtitle}
              </div>
            </div>

            {/* Live Tuning Input Summary */}
            <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded p-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-[8px] text-[#c4b5fd] uppercase">
              <span>λ {tuning.lambda.toFixed(2)}</span>
              <span>ADV {tuning.timingBtdc.toFixed(1)}°</span>
              <span>RPM {tuning.rpmCeiling}</span>
              <span>COWL {tuning.cowlShutterCht}°C</span>
              <span className="font-bold text-[#e0d4ff]">MAP: {tuning.mapProfile.toUpperCase()}</span>
            </div>

            {/* Metrics Table — computed from tuning */}
            <div className="space-y-1.5 pt-1">
              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#c4b5fd]">{custom.fuelBurnLh} L/h</span>
                  <span className={`font-mono text-[9px] block font-semibold ${
                    custom.fuelBurnLh < alpha.fuelBurnLh ? 'text-[#10b981]' : 'text-[#f59e0b]'
                  }`}>{custom.fuelDeltaText}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className={`font-mono text-[9px] uppercase ${!custom.envelopeValid ? 'text-[#ffb4ab] font-bold' : 'text-[#849495]'}`}>Thermal (CHT)</span>
                <div className="text-right">
                  <span className={`font-mono font-bold ${!custom.envelopeValid ? 'text-[#ffb4ab]' : 'text-[#c4b5fd]'}`}>{custom.thermalCht}°C</span>
                  <span className={`font-mono text-[9px] block ${
                    custom.thermalCht <= alpha.thermalCht ? 'text-[#10b981]' : custom.thermalCht <= 190 ? 'text-[#849495]' : 'text-[#ffb4ab]'
                  }`}>{custom.thermalDeltaText}{!custom.envelopeValid ? ' CRIT' : ''}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                <span className={`font-mono text-[10px] font-semibold uppercase ${
                  custom.wearRate === 'HIGH WEAR' ? 'text-[#ffb4ab]' : 'text-[#dee2f5]'
                }`}>{custom.wearRate}</span>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#dee2f5]">{custom.estRulHours} hrs</span>
                  <span className={`font-mono text-[9px] block ${
                    custom.estRulHours >= alpha.estRulHours ? 'text-[#10b981]' : 'text-[#f59e0b]'
                  }`}>{custom.rulDeltaText}</span>
                </div>
              </div>

              <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#c4b5fd]">{custom.missionLoiterHours} hrs</span>
                  <span className={`font-mono text-[9px] block font-semibold ${
                    custom.missionLoiterHours >= alpha.missionLoiterHours ? 'text-[#10b981]' : 'text-[#f59e0b]'
                  }`}>{custom.loiterDeltaText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-[#849495] uppercase">SAFETY ENVELOPE</span>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                custom.envelopeValid
                  ? 'bg-[#10b981]/20 text-[#10b981]'
                  : 'bg-[#93000a] text-[#ffb4ab]'
              }`}>
                {custom.envelopeStatus}
              </span>
            </div>
            <button
              id="select-custom-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectCandidate('custom');
              }}
              className={`w-full py-2 rounded font-mono text-[10px] tracking-wider uppercase font-bold transition-all ${
                selectedCandidateId === 'custom'
                  ? 'bg-[#a78bfa] text-[#1a0a3e] shadow-[0_0_12px_rgba(167,139,250,0.4)]'
                  : 'bg-[#252a38] hover:bg-[#303443] text-[#dee2f5]'
              }`}
            >
              {selectedCandidateId === 'custom' ? 'CUSTOM TUNE ACTIVE' : 'SELECT CUSTOM TUNE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

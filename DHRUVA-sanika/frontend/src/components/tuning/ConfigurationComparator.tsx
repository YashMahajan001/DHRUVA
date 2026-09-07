import React from 'react';
import { ArrowLeftRight, Sparkles, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';
import { CandidateId } from '../../types/tuningTypes';

export const ConfigurationComparator: React.FC = () => {
  const { 
    candidates, 
    selectedCandidateId, 
    selectCandidate, 
    syntheticCycles 
  } = useDashboard();

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

      {/* 3 Configuration Cards: Alpha, Beta, Gamma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidates.map((card) => {
          const isSelected = selectedCandidateId === card.id;

          // Distinctive aerospace styles matching Stitch
          if (card.id === 'alpha') {
            return (
              <div
                key={card.id}
                id="cardAlpha"
                onClick={() => selectCandidate('alpha')}
                className={`group relative bg-[#090e1b]/90 border rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md ${
                  isSelected
                    ? 'border-[#00f0ff] ring-1 ring-[#00f0ff]/50 scale-[1.02]'
                    : 'border-[#3b494b]/30 hover:border-[#849495]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1a1f2d] text-[#b9cacb] uppercase font-semibold">
                      {card.tag}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#849495]" />
                  </div>

                  <div>
                    <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5]">
                      {card.name}
                    </h3>
                    <div className="font-mono text-[9px] text-[#849495] tracking-wider uppercase">
                      {card.subtitle}
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-1.5 pt-1">
                    <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                      <span className="font-mono font-bold text-[#dee2f5]">{card.fuelBurnLh} L/h</span>
                    </div>
                    <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Thermal (CHT)</span>
                      <span className="font-mono font-bold text-[#dee2f5]">{card.thermalCht}°C</span>
                    </div>
                    <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                      <span className="font-mono text-[10px] text-[#dee2f5] font-semibold uppercase">{card.wearRate}</span>
                    </div>
                    <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                      <span className="font-mono font-bold text-[#dee2f5]">{card.estRulHours} hrs</span>
                    </div>
                    <div className="bg-[#161b29]/70 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                      <span className="font-mono font-bold text-[#dee2f5]">{card.missionLoiterHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">ENVELOPE STATUS</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#1a1f2d] text-[#7df4ff] uppercase font-bold">
                      {card.envelopeStatus}
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
                      isSelected
                        ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : 'bg-[#252a38] hover:bg-[#303443] text-[#dee2f5]'
                    }`}
                  >
                    {isSelected ? 'ACTIVE CANDIDATE' : 'SELECT FOR REVIEW'}
                  </button>
                </div>
              </div>
            );
          }

          if (card.id === 'beta') {
            return (
              <div
                key={card.id}
                id="cardBeta"
                onClick={() => selectCandidate('beta')}
                className={`group relative bg-[#1a1f2d]/95 border border-[#00f0ff]/50 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-2xl ${
                  isSelected ? 'scale-[1.02] shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'hover:border-[#00f0ff]'
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
                      {card.tag}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
                  </div>

                  <div>
                    <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#dbfcff]">
                      {card.name}
                    </h3>
                    <div className="font-mono text-[9px] text-[#00dbe9] tracking-wider uppercase">
                      {card.subtitle}
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-1.5 pt-1">
                    <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#00f0ff]">{card.fuelBurnLh} L/h</span>
                        <span className="font-mono text-[9px] text-[#00f0ff] block font-semibold">{card.fuelDeltaText}</span>
                      </div>
                    </div>

                    <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Thermal (CHT)</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#7df4ff]">{card.thermalCht}°C</span>
                        <span className="font-mono text-[9px] text-[#849495] block">{card.thermalDeltaText}</span>
                      </div>
                    </div>

                    <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                      <span className="font-mono text-[10px] text-[#dee2f5] font-semibold uppercase">{card.wearRate}</span>
                    </div>

                    <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#dee2f5]">{card.estRulHours} hrs</span>
                        <span className="font-mono text-[9px] text-[#849495] block">{card.rulDeltaText}</span>
                      </div>
                    </div>

                    <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#00f0ff]">{card.missionLoiterHours} hrs</span>
                        <span className="font-mono text-[9px] text-[#00f0ff] block font-semibold">{card.loiterDeltaText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">SAFETY ENVELOPE</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-bold uppercase">
                      {card.envelopeStatus}
                    </span>
                  </div>
                  <button
                    id="select-beta-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCandidate('beta');
                    }}
                    className="w-full py-2 rounded font-mono text-[10px] tracking-wider uppercase font-bold bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.4)] hover:bg-[#7df4ff] transition-all"
                  >
                    ACTIVE CANDIDATE SELECTED
                  </button>
                </div>
              </div>
            );
          }

          // Gamma Card: Rejected / Unsafe limits
          return (
            <div
              key={card.id}
              id="cardGamma"
              onClick={() => selectCandidate('gamma')}
              className={`group relative bg-[#93000a]/20 border rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md ${
                isSelected
                  ? 'border-[#ffb4ab] ring-1 ring-[#ffb4ab]/50 scale-[1.02]'
                  : 'border-[#ffb4ab]/30 hover:border-[#ffb4ab]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-bold uppercase border border-[#ffb4ab]/30">
                    {card.tag}
                  </span>
                  <AlertTriangle className="text-[#ffb4ab] w-4 h-4" />
                </div>

                <div>
                  <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#ffb4ab]">
                    {card.name}
                  </h3>
                  <div className="font-mono text-[9px] text-[#ffb4ab]/80 tracking-wider uppercase font-semibold">
                    {card.subtitle}
                  </div>
                </div>

                {/* Metrics Table */}
                <div className="space-y-1.5 pt-1">
                  <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">Fuel Burn</span>
                    <span className="font-mono font-bold text-[#dee2f5]">{card.fuelBurnLh} L/h</span>
                  </div>

                  <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                    <span className="font-mono text-[9px] text-[#ffb4ab] uppercase font-bold">Thermal (CHT)</span>
                    <span className="font-mono font-bold text-[#ffb4ab]">{card.thermalCht}°C CRIT</span>
                  </div>

                  <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">Wear Rate</span>
                    <span className="font-mono text-[10px] text-[#ffb4ab] font-bold uppercase">{card.wearRate}</span>
                  </div>

                  <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">Est. RUL</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#ffb4ab]">{card.estRulHours} hrs</span>
                      <span className="font-mono text-[9px] text-[#ffb4ab] block">{card.rulDeltaText}</span>
                    </div>
                  </div>

                  <div className="bg-[#090e1b]/80 p-1.5 rounded flex justify-between items-center text-xs">
                    <span className="font-mono text-[9px] text-[#849495] uppercase">Mission Loiter</span>
                    <span className="font-mono font-bold text-[#849495]">{card.loiterDeltaText}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-[#3b494b]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] text-[#849495] uppercase">SAFETY ENVELOPE</span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffb4ab] font-bold uppercase">
                    {card.envelopeStatus}
                  </span>
                </div>
                <button
                  id="select-gamma-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCandidate('gamma');
                  }}
                  className="w-full py-2 rounded font-mono text-[10px] tracking-wider uppercase font-bold bg-[#93000a]/40 text-[#ffb4ab] hover:bg-[#93000a]/60 transition-colors border border-[#ffb4ab]/30"
                >
                  INSPECT VIOLATIONS
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

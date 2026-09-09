import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Brain, 
  Lock, 
  Unlock, 
  Send, 
  PlaneTakeoff, 
  RotateCcw, 
  Sparkles,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useDashboard } from '../../context/MissionTuningContext';

export const SafetyEnvelope: React.FC = () => {
  const { 
    telemetry, 
    activeCandidate, 
    copilotResult, 
    copilotQuery, 
    askCopilot, 
    isProtocolVerified, 
    setIsProtocolVerified, 
    confirmAndExportToFadec, 
    isExportingFadec, 
    resetTuningToBaseline 
  } = useDashboard();

  const [inputQuestion, setInputQuestion] = useState('');
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(false);

  const sampleQuestions = [
    'Why is CHT increasing?',
    'What is the current RUL?',
    'Why is engine health decreasing?',
    'Are there any active faults?',
  ];

  const handleAsk = (q: string) => {
    askCopilot(q);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;
    askCopilot(inputQuestion);
    setInputQuestion('');
  };

  // Peak pressure, CHT, vibration & oil safety calculation
  const peakPress = Math.max(...telemetry.cylinderPressure);
  const peakCht = telemetry.cht;
  const isPressSafe = peakPress <= 85.0;
  const isChtSafe = peakCht <= 190.0;
  const isVibSafe = telemetry.vibration <= 0.35;
  const isOilSafe = telemetry.oilPressure >= 45.0 && telemetry.oilPressure <= 80.0;
  const allClear = isPressSafe && isChtSafe && isVibSafe && isOilSafe && activeCandidate.envelopeValid;

  return (
    <div id="safety-envelope-column" className="flex flex-col gap-3">
      {/* Primary Card */}
      <div 
        id="safety-envelope-panel"
        className="bg-[#161b29]/90 border border-[#3b494b]/30 rounded-xl p-5 shadow-lg flex-1 flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* SAFETY VALIDATION CHECKLIST */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#00f0ff] w-4 h-4" />
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#dee2f5] uppercase tracking-wider">
                  SAFETY ENVELOPE
                </h3>
              </div>
              <span 
                id="envelope-all-clear-badge"
                className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  allClear 
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 animate-pulse'
                }`}
              >
                {allClear ? 'ALL CLEAR' : 'LIMIT EXCEEDED'}
              </span>
            </div>

            <p className="text-xs text-[#b9cacb] mb-3 leading-relaxed">
              Dynamic aerospace bounds enforced by Digital Twin physics engine.
            </p>

            {/* Checklist Items */}
            <div className="space-y-1.5">
              {/* Item 1: Peak Pressure */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-[#090e1b]/70 border border-[#3b494b]/20">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isPressSafe ? 'text-[#00f0ff]' : 'text-[#ef4444]'}`} />
                <div className="flex-1">
                  <span className="font-mono text-[11px] text-[#dee2f5] block font-medium">
                    Chamber Peak Pressure
                  </span>
                  <span className={`font-mono text-[10px] ${isPressSafe ? 'text-[#00f0ff]' : 'text-[#ffb4ab]'}`}>
                    {peakPress} bar &lt; 85.0 bar Limit ({((85.0 - peakPress) / 85 * 100).toFixed(1)}% Margin)
                  </span>
                </div>
              </div>

              {/* Item 2: CHT */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-[#090e1b]/70 border border-[#3b494b]/20">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isChtSafe ? 'text-[#00f0ff]' : 'text-[#ef4444]'}`} />
                <div className="flex-1">
                  <span className="font-mono text-[11px] text-[#dee2f5] block font-medium">
                    Cylinder Head Temp (CHT)
                  </span>
                  <span className={`font-mono text-[10px] ${isChtSafe ? 'text-[#00f0ff]' : 'text-[#ffb4ab]'}`}>
                    Peak {peakCht}°C &lt; 190°C Redline ({190 - peakCht}°C Safe Margin)
                  </span>
                </div>
              </div>

              {/* Item 3: Oil Scavenge & Pressure */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-[#090e1b]/70 border border-[#3b494b]/20">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isOilSafe ? 'text-[#00f0ff]' : 'text-[#ef4444]'}`} />
                <div className="flex-1">
                  <span className="font-mono text-[11px] text-[#dee2f5] block font-medium">
                    Oil Scavenge &amp; Pressure
                  </span>
                  <span className={`font-mono text-[10px] ${isOilSafe ? 'text-[#00f0ff]' : 'text-[#ffb4ab]'}`}>
                    {telemetry.oilPressure} psi / {telemetry.oilTemp}°C (FL250 Validated)
                  </span>
                </div>
              </div>

              {/* Item 4: Torsional Resonance & Vibration */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-[#090e1b]/70 border border-[#3b494b]/20">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isVibSafe ? 'text-[#00f0ff]' : 'text-[#ef4444]'}`} />
                <div className="flex-1">
                  <span className="font-mono text-[11px] text-[#dee2f5] block font-medium">
                    Torsional Resonance &amp; Vibration
                  </span>
                  <span className={`font-mono text-[10px] ${isVibSafe ? 'text-[#00f0ff]' : 'text-[#ffb4ab]'}`}>
                    Harmonic Index {telemetry.vibration}g &lt; 0.35g Limit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AGENTIC AI RATIONALE & COPILOT PANEL */}
          <div 
            id="ai-copilot-panel"
            className="bg-[#090e1b]/85 border border-[#3b494b]/30 p-3 rounded-lg space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className="text-[#00f0ff] w-4 h-4" />
                <span className="font-mono text-[11px] text-[#00f0ff] uppercase font-bold tracking-wider">
                  AI RATIONALE MATRIX // COPILOT
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#849495] font-semibold">
                CONF: {copilotResult.confidenceScore}%
              </span>
            </div>

            {/* Quick Question Chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(q)}
                  className={`font-mono text-[9px] px-2 py-0.5 rounded border transition-colors text-left truncate max-w-full ${
                    copilotQuery === q
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40 font-bold'
                      : 'bg-[#161b29] text-[#b9cacb] border-[#3b494b]/30 hover:border-[#00f0ff]/40 hover:text-[#dee2f5]'
                  }`}
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* AI Advisory Findings (Observation, Physical Evidence, Safety Precedence) */}
            <div className="space-y-1.5 text-xs text-[#b9cacb]">
              <div className="p-2 rounded bg-[#161b29]/60 border border-[#3b494b]/20">
                <div className="font-mono text-[9px] text-[#7df4ff] uppercase tracking-wider mb-0.5 font-semibold">
                  Observation
                </div>
                <p className="text-[11px] leading-relaxed text-[#dee2f5]">
                  {copilotResult.observation}
                </p>
              </div>

              <div className="p-2 rounded bg-[#161b29]/60 border border-[#3b494b]/20">
                <div className="font-mono text-[9px] text-[#7df4ff] uppercase tracking-wider mb-0.5 font-semibold">
                  Physical Evidence
                </div>
                <p className="text-[11px] leading-relaxed text-[#dee2f5]">
                  {copilotResult.physicalEvidence}
                </p>
              </div>

              <div className="p-2 rounded bg-[#161b29]/60 border border-[#3b494b]/20">
                <div className="font-mono text-[9px] text-[#849495] uppercase tracking-wider mb-0.5 font-semibold">
                  Safety Precedence
                </div>
                <p className="text-[11px] leading-relaxed text-[#849495]">
                  {copilotResult.safetyPrecedence}
                </p>
              </div>
            </div>

            {/* Interactive Query Input */}
            <form onSubmit={handleCustomSubmit} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Query AI engineering copilot..."
                className="flex-1 bg-[#161b29] text-[#dee2f5] font-mono text-[11px] px-2.5 py-1.5 rounded border border-[#3b494b]/40 focus:outline-none focus:border-[#00f0ff] placeholder-[#849495]"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] rounded font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Send query to Copilot"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* CRITICAL SAFETY PROTOCOL VERIFICATION TOGGLE */}
          <div 
            id="safety-protocol-toggle-box"
            className="flex items-center justify-between p-2 rounded bg-[#252a38]/60 border border-[#3b494b]/30 select-none"
          >
            <div className="flex items-center gap-2">
              <input
                id="ackTerms"
                type="checkbox"
                checked={isProtocolVerified}
                onChange={(e) => setIsProtocolVerified(e.target.checked)}
                className="rounded accent-[#00f0ff] h-4 w-4 cursor-pointer"
              />
              <label 
                htmlFor="ackTerms"
                className="font-mono text-[10px] text-[#dee2f5] cursor-pointer font-semibold uppercase tracking-wider"
              >
                Aero-Safety Protocol Verified
              </label>
            </div>
            {isProtocolVerified ? (
              <Unlock className="w-4 h-4 text-[#00f0ff]" />
            ) : (
              <Lock className="w-4 h-4 text-[#849495]" />
            )}
          </div>
        </div>

        {/* HUMAN-IN-THE-LOOP ACTION BAR */}
        <div className="space-y-2 pt-4">
          <button
            id="confirmExportBtn"
            type="button"
            onClick={confirmAndExportToFadec}
            disabled={!isProtocolVerified || isExportingFadec}
            className={`w-full py-3 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isProtocolVerified && !isExportingFadec
                ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_16px_rgba(0,240,255,0.4)] hover:bg-[#7df4ff] cursor-pointer'
                : 'bg-[#303443] text-[#849495] cursor-not-allowed border border-[#3b494b]/30'
            }`}
          >
            <PlaneTakeoff className={`w-4 h-4 ${isExportingFadec ? 'animate-bounce' : ''}`} />
            {isExportingFadec ? 'EXPORTING TO FADEC BUFFER...' : 'CONFIRM & EXPORT TO FADEC'}
          </button>

          <button
            id="resetBaselineBtn"
            type="button"
            onClick={resetTuningToBaseline}
            className="w-full py-2 px-3 rounded font-mono text-[10px] text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#252a38] transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 border border-transparent hover:border-[#3b494b]/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET WORKSPACE TO BASELINE
          </button>
        </div>
      </div>

      {/* OPERATOR SESSION CONSOLE STATUS */}
      <div 
        id="operator-session-console"
        className="bg-[#161b29]/90 border border-[#3b494b]/30 rounded-xl p-3.5 flex items-center justify-between text-[#b9cacb] select-none shadow-md"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#dee2f5] font-medium">
            SESSION: L2-OPS-410 // UTC 14:28:09
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#00f0ff] uppercase font-bold tracking-widest">
          TX READY
        </span>
      </div>
    </div>
  );
};

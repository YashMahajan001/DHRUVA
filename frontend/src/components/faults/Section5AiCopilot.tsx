import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  Sparkles,
  Bot,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowDown,
  Cpu,
  History,
  Lock,
} from 'lucide-react';

export const Section5AiCopilot: React.FC = () => {
  const {
    selectedEngine,
    telemetry,
    diagnosticInsight,
    copilotMessages,
    isAiResponding,
    sendCopilotQuery,
    showToast,
  } = useDashboard();

  const [inputQuery, setInputQuery] = useState('');

  // Example Prompt Buttons strictly as requested
  const examplePrompts = [
    'Why did this fault occur?',
    'What telemetry supports this diagnosis?',
    'Is this engine safe for the next mission?',
    'What maintenance is required?',
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setInputQuery('');
    await sendCopilotQuery(queryText);
  };

  return (
    <section
      id="section-5-ai-copilot"
      className="w-full rounded-xl border border-[#00f0ff]/40 bg-[#161b29]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 shadow-[0_0_30px_rgba(0,240,255,0.08)] flex flex-col gap-5"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base tracking-wide text-[#dee2f5] uppercase">
                AI Diagnostic Copilot
              </h3>
              <span className="font-mono-telemetry text-[10px] px-2 py-0.2 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-bold">
                Advisory Mode
              </span>
            </div>
            <p className="font-mono-telemetry text-[11px] text-[#849495]">
              Unit: {selectedEngine.name} ({selectedEngine.callsign})
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center gap-2 font-mono-telemetry text-xs bg-[#090e1b] px-2.5 py-1 rounded-lg border border-[#00f0ff]/30">
          <span className="text-[#849495] text-[11px]">Confidence:</span>
          <span className="text-[#00f0ff] font-bold text-sm">
            {selectedEngine.aiConfidence.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* CORE COPILOT DIAGNOSTIC SYNTHESIS (Selected Engine & Active Fault Analysis) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left 8 Cols: Diagnosis, Supporting Telemetry & Recommended Action */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* AI Diagnosis Card */}
          <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3.5 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono-telemetry">
              <span className="text-[#00f0ff] font-bold uppercase flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Diagnostic Finding
              </span>
              <span className="text-[#849495] text-[11px]">{selectedEngine.callsign}</span>
            </div>

            <div className="text-xs space-y-1.5 pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[#849495] font-mono font-bold text-[10px] uppercase shrink-0">Finding:</span>
                <span className="text-[#dee2f5] font-medium">
                  {selectedEngine.id === 'eng-02'
                    ? 'Elevated CHT on Cylinder #2 due to localized airflow stagnation.'
                    : 'All thermal and mechanical channels operating within envelope.'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-[#849495] font-mono font-bold text-[10px] uppercase shrink-0">Evidence:</span>
                <span className="text-[#7df4ff] font-mono text-[11px]">
                  CHT {telemetry.cht}°C (+{telemetry.twinDivergenceMae}°C vs twin) · Air velocity 24.2 m/s
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-[#10b981] font-mono font-bold text-[10px] uppercase shrink-0">Action:</span>
                <span className="text-[#dee2f5]">
                  Derate climb throttle to 78%; inspect cooling baffle post-sortie.
                </span>
              </div>
            </div>

            {/* Supporting Telemetry Chips */}
            <div className="pt-2 border-t border-[#3b494b]/30 flex flex-col gap-1 font-mono-telemetry text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-0.5">
                <div className="p-1.5 rounded bg-[#161b29] border border-[#3b494b]/30">
                  <span className="text-[9px] text-[#849495] block">CHT</span>
                  <span className="text-[#ffb4ab] font-bold text-xs">{telemetry.cht}°C</span>
                </div>
                <div className="p-1.5 rounded bg-[#161b29] border border-[#3b494b]/30">
                  <span className="text-[9px] text-[#849495] block">Residual</span>
                  <span className="text-[#00f0ff] font-bold text-xs">+{telemetry.twinDivergenceMae}°C</span>
                </div>
                <div className="p-1.5 rounded bg-[#161b29] border border-[#3b494b]/30">
                  <span className="text-[9px] text-[#849495] block">Airspeed</span>
                  <span className="text-[#dee2f5] font-bold text-xs">24.2 m/s</span>
                </div>
                <div className="p-1.5 rounded bg-[#161b29] border border-[#3b494b]/30">
                  <span className="text-[9px] text-[#849495] block">Oil temp</span>
                  <span className="text-[#10b981] font-bold text-xs">{telemetry.oilTempC}°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Root Cause Candidates & Relevant Historical Faults */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Root Cause Probability Breakdown */}
          <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-4 flex flex-col gap-2.5">
            <span className="font-mono-telemetry text-xs font-bold text-[#dee2f5] uppercase">
              ROOT CAUSE CANDIDATES
            </span>
            <div className="flex flex-col gap-2 font-mono-telemetry text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#ffb4ab]">1. Cowling Air Baffle Distortion</span>
                <span className="text-[#ffb4ab] font-bold">68%</span>
              </div>
              <div className="w-full bg-[#161b29] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ffb4ab] h-full w-[68%]"></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#b4c5ff]">2. Cooling Fin Deposition</span>
                <span className="text-[#b4c5ff] font-bold">24%</span>
              </div>
              <div className="w-full bg-[#161b29] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#b4c5ff] h-full w-[24%]"></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#849495]">3. Thermocouple Drift</span>
                <span className="text-[#849495] font-bold">8%</span>
              </div>
              <div className="w-full bg-[#161b29] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#849495] h-full w-[8%]"></div>
              </div>
            </div>
          </div>

          {/* Relevant Historical Faults */}
          <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono-telemetry text-[#00f0ff] font-bold uppercase">
              <History className="w-3.5 h-3.5" />
              RELEVANT HISTORICAL FAULTS
            </div>
            <div className="flex flex-col gap-2 font-mono-telemetry text-[11px] text-[#849495]">
              <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/30">
                <span className="text-[#dee2f5] font-bold block">SORTIE-8812 (2026-06-14)</span>
                <span>Cyl 2 baffle clip fatigue caused identical +18°C CHT surge. Fixed via clip re-seat.</span>
              </div>
              <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/30">
                <span className="text-[#dee2f5] font-bold block">SORTIE-7419 (2026-03-22)</span>
                <span>Borescope detected fin shroud soot buildup. Cleared with solvent wash.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ADVISORY ASSURANCE PIPELINE */}
      <div className="rounded-lg bg-[#090e1b] border border-[#3b494b]/40 p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono-telemetry">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-bold text-[#dee2f5] uppercase tracking-wider text-[11px]">
              Assurance Pipeline
            </span>
          </div>
          <span className="text-[#849495] text-[10px]">
            Advisory mode · Read-only
          </span>
        </div>

        {/* 3-Step Flow Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Step 1: AI Recommendation */}
          <div className="p-2.5 rounded bg-[#161b29] border border-[#00f0ff]/30 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono-telemetry font-bold text-[#00f0ff]">
              <span>1. Recommendation</span>
              <Sparkles className="w-3 h-3" />
            </div>
            <p className="text-[11px] text-[#b9cacb]">
              Derate throttle to 78% ceiling.
            </p>
            <span className="font-mono-telemetry text-[9px] text-[#00f0ff]">Generated</span>
          </div>

          {/* Step 2: Safety Validation */}
          <div className="p-2.5 rounded bg-[#161b29] border border-[#b4c5ff]/30 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono-telemetry font-bold text-[#b4c5ff]">
              <span>2. Validation</span>
              <ShieldCheck className="w-3 h-3" />
            </div>
            <p className="text-[11px] text-[#b9cacb]">
              Stall margin &gt;1.45 confirmed.
            </p>
            <span className="font-mono-telemetry text-[9px] text-[#10b981]">Verified safe</span>
          </div>

          {/* Step 3: Human Approval */}
          <div className="p-2.5 rounded bg-[#161b29] border border-[#ffb4ab]/30 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono-telemetry font-bold text-[#ffb4ab]">
              <span>3. Sign-off</span>
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <p className="text-[11px] text-[#b9cacb]">
              Operator confirmation required.
            </p>
            <button
              type="button"
              onClick={() => showToast('Flight Commander Human Sign-Off logged for Throttle Derate.', 'success')}
              className="mt-0.5 py-0.5 px-2 rounded bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] font-mono-telemetry text-[9px] font-bold uppercase transition-colors text-center border border-[#00f0ff]/40 cursor-pointer"
            >
              Confirm sign-off
            </button>
          </div>
        </div>
      </div>

      {/* 3. EXAMPLE PROMPT BUTTONS & INTERACTIVE COPILOT CHAT */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-[#3b494b]/30">
        <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#849495]">
          <span className="font-bold text-[#dee2f5] uppercase">EXAMPLE OPERATOR PROMPTS:</span>
          <span>CLICK TO QUERY COPILOT</span>
        </div>

        {/* 4 Exact Requested Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="p-2.5 rounded-lg bg-[#0e1320] hover:bg-[#1a1f2d] border border-[#3b494b]/50 hover:border-[#00f0ff]/50 font-mono-telemetry text-xs text-left text-[#b9cacb] hover:text-[#00f0ff] transition-all flex items-center justify-between gap-1 shadow-sm"
            >
              <span>"{prompt}"</span>
              <ArrowRight className="w-3 h-3 shrink-0 text-[#00f0ff]" />
            </button>
          ))}
        </div>

        {/* Interactive Query Input */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputQuery);
            }}
            placeholder="Ask DHRUVAA AI Copilot anything regarding engine telemetry, RUL, or root cause..."
            className="flex-1 bg-[#090e1b] border border-[#3b494b]/60 focus:border-[#00f0ff] rounded-lg px-3.5 py-2 text-xs font-mono-telemetry text-[#dee2f5] placeholder-[#849495] outline-none transition-colors"
          />
          <button
            type="button"
            disabled={isAiResponding}
            onClick={() => handleSend(inputQuery)}
            className="px-4 py-2 rounded-lg bg-[#00f0ff] text-[#00363a] font-mono-telemetry text-xs font-bold uppercase transition-all hover:bg-[#7df4ff] disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            {isAiResponding ? (
              <span>REASONING...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>QUERY</span>
              </>
            )}
          </button>
        </div>

        {/* Copilot Latest Response Message (if any) */}
        {copilotMessages.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-[#090e1b] border border-[#00f0ff]/30 font-mono-telemetry text-xs text-[#b9cacb] max-h-40 overflow-y-auto leading-relaxed whitespace-pre-line">
            <span className="text-[#00f0ff] font-bold block mb-1">LATEST COPILOT ADVISORY:</span>
            {copilotMessages[copilotMessages.length - 1].content}
          </div>
        )}
      </div>
    </section>
  );
};

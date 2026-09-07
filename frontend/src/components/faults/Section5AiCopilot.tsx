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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base sm:text-lg tracking-wider text-[#dee2f5] uppercase">
                DHRUVAA AI DIAGNOSTIC COPILOT
              </h3>
              <span className="font-mono-telemetry text-xs px-2.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 font-bold">
                ADVISORY ENGINE
              </span>
            </div>
            <p className="font-mono-telemetry text-xs text-[#849495]">
              Autonomous Reasoning Model: DeepSeek-R1 Aerospace Invariant Reasoner // Unit: {selectedEngine.name}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center gap-2 font-mono-telemetry text-xs bg-[#090e1b] px-3 py-1.5 rounded-lg border border-[#00f0ff]/30">
          <span className="text-[#849495]">AUTONOMIC CONFIDENCE:</span>
          <span className="text-[#00f0ff] font-extrabold text-sm">
            {selectedEngine.aiConfidence.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* CORE COPILOT DIAGNOSTIC SYNTHESIS (Selected Engine & Active Fault Analysis) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left 8 Cols: Diagnosis, Supporting Telemetry & Recommended Action */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* AI Diagnosis Card */}
          <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-4 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono-telemetry">
              <span className="text-[#00f0ff] font-bold uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AUTONOMIC AI DIAGNOSIS
              </span>
              <span className="text-[#849495]">TARGET: {selectedEngine.callsign}</span>
            </div>

            <p className="font-mono-telemetry text-xs sm:text-sm text-[#dee2f5] leading-relaxed">
              {diagnosticInsight.reasoningSynthesis ||
                `Engine 02 displays localized convective stagnation on Cylinder #2 cooling fins. CHT reached 178.4°C (+26.4°C above digital twin baseline). Sump oil temperature remains nominal at 92°C, ruling out global lube system failure. Bayesian multi-signal correlator isolated cowling baffle distortion as the primary root cause with 68% probability.`}
            </p>

            {/* Supporting Telemetry Chips */}
            <div className="pt-2 border-t border-[#3b494b]/30 flex flex-col gap-1 font-mono-telemetry text-xs">
              <span className="text-[10px] text-[#849495] uppercase font-bold">SUPPORTING QUANTITATIVE TELEMETRY:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/40">
                  <span className="text-[10px] text-[#849495] block">OBSERVED CHT</span>
                  <span className="text-[#ffb4ab] font-bold">{telemetry.cht}°C (Max 180)</span>
                </div>
                <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/40">
                  <span className="text-[10px] text-[#849495] block">TWIN RESIDUAL</span>
                  <span className="text-[#00f0ff] font-bold">MAE {telemetry.twinDivergenceMae}°C</span>
                </div>
                <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/40">
                  <span className="text-[10px] text-[#849495] block">AIR VELOCITY</span>
                  <span className="text-[#dee2f5] font-bold">24.2 m/s (-29%)</span>
                </div>
                <div className="p-2 rounded bg-[#161b29] border border-[#3b494b]/40">
                  <span className="text-[10px] text-[#849495] block">OIL TEMP</span>
                  <span className="text-[#00f0ff] font-bold">{telemetry.oilTempC}°C (Nominal)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Action Card */}
          <div className="rounded-lg bg-[#0e1320] border border-[#b4c5ff]/40 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono-telemetry">
              <span className="text-[#b4c5ff] font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                RECOMMENDED OPERATIONAL DIRECTIVE
              </span>
              <span className="text-[#b4c5ff] text-[10px] font-bold px-2 py-0.5 rounded bg-[#303443]">
                ADVISORY ACTION
              </span>
            </div>

            <p className="font-mono-telemetry text-xs text-[#dee2f5] leading-relaxed">
              {diagnosticInsight.prescribedInterventions?.[0]?.action ||
                'Derate cruise throttle ceiling to 78% immediately to suppress peak thermal excursion below 172°C. Schedule post-sortie borescope inspection of cylinder baffle and cooling duct seals before next flight clearance.'}
            </p>
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

      {/* 2. ADVISORY ASSURANCE PIPELINE (Strict Requirement) */}
      {/* AI RECOMMENDATION ↓ SAFETY VALIDATION ↓ HUMAN APPROVAL */}
      <div className="rounded-lg bg-[#090e1b] border border-[#3b494b]/50 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono-telemetry">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-bold text-[#dee2f5] uppercase tracking-wider">
              AUTONOMIC ASSURANCE PIPELINE
            </span>
          </div>
          <span className="text-[#00f0ff] text-[11px]">
            ADVISORY ONLY — AUTONOMOUS FLIGHT PARAMETER OVERRIDE PREVENTED
          </span>
        </div>

        {/* 3-Step Flow Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: AI Recommendation */}
          <div className="p-3 rounded-lg bg-[#161b29] border border-[#00f0ff]/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono-telemetry font-bold text-[#00f0ff]">
              <span>1. AI RECOMMENDATION</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="font-mono-telemetry text-xs text-[#b9cacb]">
              Autonomic inference advises throttle derate to 78% cruise limit.
            </p>
            <span className="font-mono-telemetry text-[10px] text-[#00f0ff]">Status: GENERATED</span>
          </div>

          {/* Step 2: Safety Validation */}
          <div className="p-3 rounded-lg bg-[#161b29] border border-[#b4c5ff]/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono-telemetry font-bold text-[#b4c5ff]">
              <span>2. SAFETY VALIDATION</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <p className="font-mono-telemetry text-xs text-[#b9cacb]">
              Flight envelope simulation verifies stall margin remains &gt;1.45 at 78% throttle.
            </p>
            <span className="font-mono-telemetry text-[10px] text-[#00f0ff]">Status: VERIFIED SAFE</span>
          </div>

          {/* Step 3: Human Approval */}
          <div className="p-3 rounded-lg bg-[#161b29] border border-[#ffb4ab]/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono-telemetry font-bold text-[#ffb4ab]">
              <span>3. HUMAN APPROVAL</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="font-mono-telemetry text-xs text-[#b9cacb]">
              Pilot / Ground Station Commander must confirm directive before execution.
            </p>
            <button
              type="button"
              onClick={() => showToast('Flight Commander Human Sign-Off logged for Throttle Derate.', 'success')}
              className="mt-1 py-1 px-2.5 rounded bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] font-mono-telemetry text-[10px] font-bold uppercase transition-colors text-center border border-[#00f0ff]/40"
            >
              COMMANDER SIGN-OFF
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

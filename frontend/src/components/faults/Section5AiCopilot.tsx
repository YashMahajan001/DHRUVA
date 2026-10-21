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
      className="w-full rounded-xl border border-[#3b494b]/40 bg-[#0f1422]/90 backdrop-blur-md p-4 flex flex-col gap-3.5 shadow-md"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-100">
                AI Diagnostic Copilot
              </h3>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Advisory Mode
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-400">
              Target: {selectedEngine?.name || 'ENGINE'} ({selectedEngine?.callsign || 'N/A'})
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center gap-1.5 font-mono text-xs bg-[#090e1b] px-2.5 py-1 rounded border border-[#3b494b]/40">
          <span className="text-slate-400 text-[10px]">Confidence:</span>
          <span className="text-[#00f0ff] font-bold">
            {(selectedEngine?.aiConfidence ?? 94.2).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Advisory Finding & Safety Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Finding Card */}
        <div className="rounded-lg bg-[#0a0f1d] border border-[#3b494b]/30 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#00f0ff] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Advisory Summary
            </span>
            <span className="text-slate-500 text-[10px]">{selectedEngine.callsign}</span>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {selectedEngine.id === 'eng-02'
              ? 'Elevated CHT on Cylinder #2 due to localized airflow stagnation. Derate throttle to 78%.'
              : 'All thermal and mechanical channels operating within normal flight envelope.'}
          </p>

          <div className="font-mono text-[11px] text-emerald-400 pt-1 border-t border-[#3b494b]/20">
            Action: Derate climb throttle to 78%; inspect cooling baffle post-sortie.
          </div>
        </div>

        {/* Assurance Pipeline */}
        <div className="rounded-lg bg-[#0a0f1d] border border-[#3b494b]/30 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
              Safety Verification
            </span>
            <span className="text-emerald-400 text-[10px]">Stall margin &gt;1.45</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Validation passed with stall margin buffer. Operator confirmation logged for throttle derate.
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-[#3b494b]/20">
            <span className="text-[10px] font-mono text-slate-500">Sign-off status: Ready</span>
            <button
              type="button"
              onClick={() => showToast('Flight Commander Human Sign-Off logged for Throttle Derate.', 'success')}
              className="py-0.5 px-2 rounded bg-[#00f0ff]/15 hover:bg-[#00f0ff] hover:text-[#090e1b] text-[#00f0ff] font-mono text-[10px] font-semibold uppercase transition-colors border border-[#00f0ff]/30 cursor-pointer"
            >
              Confirm sign-off
            </button>
          </div>
        </div>
      </div>

      {/* Example Prompt Chips & Interactive Input */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#3b494b]/20">
        <div className="flex flex-wrap gap-1.5">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded bg-[#0a0f1d] hover:bg-[#151c2e] border border-[#3b494b]/40 hover:border-[#00f0ff]/40 font-mono text-[11px] text-slate-300 hover:text-[#00f0ff] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-3 h-3 text-[#00f0ff]" />
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputQuery);
            }}
            placeholder="Ask AI Copilot regarding engine telemetry, RUL, or root cause..."
            className="flex-1 bg-[#090e1b] border border-[#3b494b]/50 focus:border-[#00f0ff] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
          <button
            type="button"
            disabled={isAiResponding}
            onClick={() => handleSend(inputQuery)}
            className="px-3.5 py-1.5 rounded-lg bg-[#00f0ff] text-[#090e1b] font-mono text-xs font-bold uppercase transition-all hover:bg-[#7df4ff] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isAiResponding ? (
              <span>REASONING...</span>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>QUERY</span>
              </>
            )}
          </button>
        </div>

        {/* Latest Copilot Response */}
        {copilotMessages.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#090e1b] border border-[#00f0ff]/30 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-line">
            <span className="text-[#00f0ff] font-bold block mb-1">COPILOT RESPONSE:</span>
            {copilotMessages[copilotMessages.length - 1].content}
          </div>
        )}
      </div>
    </section>
  );
};

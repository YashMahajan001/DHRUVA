import React, { useState } from 'react';
import {
  Brain,
  AlertCircle,
  Wrench,
  Radar,
  Download,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquareCode,
  CheckCircle2
} from 'lucide-react';
import { useTelemetry } from '../../context/FleetContext';

export const AITacticalDispatchPanel: React.FC = () => {
  const {
    activeCopilotMessages,
    isCopilotLoading,
    sendCopilotMessage,
    executeAction,
    selectedEngine
  } = useTelemetry();

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isDialogueOpen, setIsDialogueOpen] = useState<boolean>(false);

  const cannedQuestions = [
    'Why is engine health decreasing?',
    'What is the current RUL?',
    'Why is CHT increasing?',
    'Are there any active faults?'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isCopilotLoading) return;
    sendCopilotMessage(inputQuery);
    setInputQuery('');
    setIsDialogueOpen(true);
  };

  const handleCannedClick = (q: string) => {
    sendCopilotMessage(q);
    setIsDialogueOpen(true);
  };

  return (
    <div
      id="ai-tactical-dispatch-panel"
      className="bg-[#161b29]/95 rounded-xl p-5 shadow-xl border border-[#3b494b]/30 flex flex-col gap-4 relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3b494b]/20 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="text-[#00f0ff] w-5 h-5 animate-pulse" />
          <span className="font-headline-sm text-[16px] text-[#dee2f5] uppercase font-bold tracking-wide">
            AI TACTICAL DISPATCH ADVISORY
          </span>
        </div>
        <span className="font-label-micro text-[9px] px-2 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 rounded font-mono font-bold">
          CONF: 98.4%
        </span>
      </div>

      {/* Priority AI Operational Directives */}
      <div className="flex flex-col gap-3">
        {/* Advisory 1: Emergency Recovery */}
        <div className="p-3.5 bg-[#93000a]/15 border border-[#ffb4ab]/30 rounded-lg flex gap-3 items-start">
          <AlertCircle className="text-[#ffb4ab] w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 w-full">
            <span className="font-label-tactical text-[11px] text-[#ffb4ab] font-mono font-bold uppercase">
              PRIORITY ACTION: EMERGENCY RECOVERY
            </span>
            <p className="font-body-md text-[13px] text-[#dee2f5] leading-relaxed">
              Recommend vectoring <strong className="text-[#ffb4ab] font-bold">UAV-03</strong> to{' '}
              <strong className="text-[#00f0ff] font-bold">Runway 09</strong> for immediate priority emergency landing due to Stage 2 Crankshaft Bearing RUL expiration (&lt;18 hrs remaining).
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <button
                id="btn-execute-auto-vector"
                type="button"
                onClick={() => executeAction('EXECUTE_RTB')}
                className="px-3 py-1.5 bg-[#93000a] hover:bg-[#b3141f] text-[#ffdad6] rounded font-label-tactical text-[10.5px] font-mono uppercase font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-[#ffb4ab]/40 active:scale-95"
              >
                EXECUTE AUTO-VECTOR RTB
              </button>
              <span className="font-label-micro text-[9px] text-[#849495] font-mono">
                EST. T-TOUCHDOWN: 14 MIN
              </span>
            </div>
          </div>
        </div>

        {/* Advisory 2: Scheduled Overhaul */}
        <div className="p-3.5 bg-[#252a38]/70 border border-[#3b494b]/30 rounded-lg flex gap-3 items-start">
          <Wrench className="text-amber-400 w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 w-full">
            <span className="font-label-tactical text-[11px] text-amber-300 font-mono font-bold uppercase">
              SCHEDULED OVERHAUL ADVISORY
            </span>
            <p className="font-body-md text-[13px] text-[#b9cacb] leading-relaxed">
              Recommend scheduling thermal duct inspection and injector flush for{' '}
              <strong className="text-[#dee2f5] font-semibold">UAV-02</strong> immediately upon completion of sortie 104 to prevent piston scoring.
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <button
                id="btn-queue-maintenance"
                type="button"
                onClick={() => executeAction('QUEUE_MAINTENANCE')}
                className="px-3 py-1.5 bg-[#1a1f2d] hover:bg-[#343948] text-[#dee2f5] border border-[#3b494b]/40 rounded font-label-tactical text-[10.5px] font-mono uppercase transition-colors"
              >
                QUEUE MAINTENANCE BAY 2
              </button>
              <span className="font-label-micro text-[9px] text-[#849495] font-mono">
                PRIORITY: MEDIUM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tactical Action Triggers */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          id="btn-fleet-telemetry-sweep"
          type="button"
          onClick={() => executeAction('TELEMETRY_SWEEP')}
          className="flex-1 px-3 py-2 bg-[#00f0ff]/15 hover:bg-[#00f0ff] text-[#00f0ff] hover:text-[#002022] border border-[#00f0ff]/40 rounded font-label-tactical text-[10.5px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
        >
          <Radar className="w-4 h-4" />
          COMMAND FLEET TELEMETRY SWEEP
        </button>

        <button
          id="btn-export-airworthiness"
          type="button"
          onClick={() => executeAction('EXPORT_REPORT')}
          className="flex-1 px-3 py-2 bg-[#252a38] hover:bg-[#343948] text-[#dee2f5] border border-[#3b494b]/40 rounded font-label-tactical text-[10.5px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4" />
          EXPORT AIRWORTHINESS REPORT
        </button>
      </div>

      {/* Engineering Copilot Q&A Interactive Assistant */}
      <div className="mt-2 border-t border-[#3b494b]/30 pt-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <MessageSquareCode className="w-4 h-4 text-[#00f0ff]" />
            <span className="font-label-tactical text-[11px] text-[#dee2f5] font-mono uppercase font-bold">
              ENGINEERING COPILOT // {selectedEngine.callsign}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDialogueOpen(!isDialogueOpen)}
            className="text-[#849495] hover:text-[#00f0ff] text-[11px] font-mono flex items-center gap-1"
          >
            <span>{isDialogueOpen ? 'Minimize Log' : 'View Dialogue'}</span>
            {isDialogueOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Canned Engineering Prompts */}
        <div className="flex flex-wrap gap-1.5">
          {cannedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCannedClick(q)}
              className="text-[10px] px-2 py-1 bg-[#1a1f2d] hover:bg-[#252a38] hover:text-[#00f0ff] text-[#b9cacb] border border-[#3b494b]/30 rounded font-mono transition-colors text-left"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Dialogue Scroll Window if expanded */}
        {isDialogueOpen && (
          <div className="max-h-56 overflow-y-auto flex flex-col gap-2 p-2.5 bg-[#090e1b] rounded-lg border border-[#3b494b]/40 text-left">
            {activeCopilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded text-[12px] font-mono ${
                  msg.role === 'user'
                    ? 'bg-[#1a1f2d] text-[#dbfcff] border-l-2 border-[#00f0ff]'
                    : 'bg-[#161b29] text-[#dee2f5] border-l-2 border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-[#849495] mb-1">
                  <span className="uppercase font-bold">
                    {msg.role === 'user' ? 'COMMAND OPERATOR' : 'DHRUVAA AI COPILOT'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Evidence Metrics */}
                {msg.evidence && (
                  <div className="mt-2 pt-1 border-t border-[#3b494b]/30 grid grid-cols-2 gap-1 text-[9px]">
                    {msg.evidence.map((ev, i) => (
                      <div key={i} className="bg-[#090e1b] px-1.5 py-0.5 rounded flex justify-between">
                        <span className="text-[#849495]">{ev.metric}:</span>
                        <span className="text-[#00f0ff] font-bold">{ev.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isCopilotLoading && (
              <div className="text-[11px] font-mono text-[#00f0ff] flex items-center gap-2 p-2">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping"></span>
                <span>Synthesizing multi-subsystem digital twin telemetry...</span>
              </div>
            )}
          </div>
        )}

        {/* Query Input Box */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            id="ai-copilot-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask advisory question for ${selectedEngine.callsign}...`}
            className="flex-1 bg-[#090e1b] border border-[#3b494b]/40 focus:border-[#00f0ff] rounded px-3 py-1.5 text-[12px] font-mono text-[#dee2f5] placeholder-[#849495] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50"
          />
          <button
            id="btn-send-copilot"
            type="submit"
            disabled={isCopilotLoading || !inputQuery.trim()}
            className="px-3 py-1.5 bg-[#00f0ff] hover:bg-[#00dbe9] disabled:opacity-50 text-[#002022] rounded font-mono font-bold text-[11px] transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <span className="text-[9px] text-[#849495] font-mono italic">
          * Advisory only: AI will never directly override or alter physical engine parameters.
        </span>
      </div>
    </div>
  );
};

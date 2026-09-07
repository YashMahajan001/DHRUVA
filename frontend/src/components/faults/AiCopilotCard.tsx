import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Bot, Send, Sparkles, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export const AiCopilotCard: React.FC = () => {
  const {
    copilotMessages,
    isAiResponding,
    sendCopilotQuery,
    selectedEngine,
    telemetry,
  } = useDashboard();

  const [inputQuery, setInputQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Why is engine health decreasing?',
    'What is the current RUL?',
    'Why is CHT increasing?',
    'Are there any active faults?',
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, isAiResponding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAiResponding) return;
    const q = inputQuery.trim();
    setInputQuery('');
    sendCopilotQuery(q);
  };

  return (
    <div
      id="ai-copilot-card"
      className="bg-[#161b29]/95 backdrop-blur-xl p-3.5 rounded-lg border border-[#00f0ff]/30 shadow-xl flex flex-col gap-2.5 relative"
    >
      {/* Copilot Header */}
      <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff]">
            <Bot className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-bold block leading-none">
              AI Engineering Copilot
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495]">
              Autonomous Advisory // Monitored: {selectedEngine.callsign}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded bg-[#1a1f2d] hover:bg-[#252a38] text-[#b9cacb] hover:text-[#dee2f5] border border-[#3b494b]/30 transition-colors"
          title={isExpanded ? 'Collapse Copilot Panel' : 'Expand Copilot Panel'}
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {(sampleQuestions || []).map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isAiResponding}
            onClick={() => sendCopilotQuery(q)}
            className="text-left font-mono-telemetry text-[10px] px-2 py-1 rounded bg-[#1a1f2d] hover:bg-[#00f0ff]/15 hover:text-[#00f0ff] text-[#b9cacb] border border-[#3b494b]/30 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div
        className={`flex flex-col gap-2 overflow-y-auto pr-1 transition-all duration-300 ${
          isExpanded ? 'max-h-72 min-h-56' : 'max-h-44 min-h-32'
        }`}
      >
        {(copilotMessages || []).map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`p-2 rounded font-mono-telemetry text-xs border ${
                isUser
                  ? 'bg-[#252a38]/80 border-[#00f0ff]/30 text-[#dee2f5] ml-4'
                  : 'bg-[#090e1b]/90 border-[#3b494b]/40 text-[#dbfcff] mr-2'
              }`}
            >
              <div className="flex items-center justify-between mb-1 pb-0.5 border-b border-[#3b494b]/20">
                <span className={`text-[9px] uppercase font-bold ${isUser ? 'text-[#00f0ff]' : 'text-[#7df4ff]'}`}>
                  {isUser ? 'FLIGHT CONTROLLER' : 'DHRUVAA AUTONOMIC COPILOT'}
                </span>
                <span className="text-[9px] text-[#849495]">{msg.timestamp}</span>
              </div>

              <div className="font-sans text-xs whitespace-pre-wrap leading-relaxed text-[#dee2f5]">
                {msg.content}
              </div>

              {msg.telemetrySnapshot && (
                <div className="mt-1.5 pt-1 border-t border-[#3b494b]/30 flex items-center justify-between text-[9px] font-mono-telemetry text-[#849495]">
                  <span>Telemetry Ref: {msg.telemetrySnapshot.engineId}</span>
                  <span className="text-[#00f0ff]">
                    CHT: {msg.telemetrySnapshot.cht}°C | RUL: {msg.telemetrySnapshot.rul}h
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {isAiResponding && (
          <div className="p-2 rounded bg-[#090e1b]/90 border border-[#00f0ff]/40 flex items-center gap-2 text-xs font-mono-telemetry text-[#00f0ff] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Correlating aero-thermal residuals with digital twin...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Query Input Box */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask Copilot (e.g. 'Why is CHT increasing?')..."
          className="flex-1 bg-[#090e1b] border border-[#3b494b]/40 rounded px-2.5 py-1.5 font-mono-telemetry text-xs text-[#dee2f5] placeholder-[#849495] focus:outline-none focus:border-[#00f0ff] transition-colors"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isAiResponding}
          className="p-1.5 bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] rounded transition-colors disabled:opacity-40"
          title="Send query to Copilot"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Advisory safety disclaimer */}
      <div className="flex items-center gap-1 text-[9px] font-mono-telemetry text-[#849495] leading-tight">
        <AlertCircle className="w-3 h-3 text-[#7df4ff] shrink-0" />
        <span>Advisory only. Engine parameters cannot be directly overridden by AI without Flight Authority clearance.</span>
      </div>
    </div>
  );
};

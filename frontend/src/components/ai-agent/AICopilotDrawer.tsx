import React, { useState, useRef, useEffect } from 'react';
import { useMissionDashboard } from '../../context/EngineDetailsContext';
import { Bot, X, Send, AlertTriangle, Sparkles, Terminal } from 'lucide-react';

export const AICopilotDrawer: React.FC = () => {
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    copilotMessages,
    sendCopilotQuestion,
    isCopilotThinking,
    telemetry,
    selectedEngine
  } = useMissionDashboard();

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sampleQuestions = [
    'Why is engine health decreasing?',
    'What is the current RUL?',
    'Why is CHT increasing?',
    'Are there any active faults?'
  ];

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isCopilotThinking) return;
    const query = inputQuery;
    setInputQuery('');
    await sendCopilotQuestion(query);
  };

  const handleQuickQuestion = (q: string) => {
    sendCopilotQuestion(q);
  };

  useEffect(() => {
    if (isCopilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-surface-container-lowest/95 backdrop-blur-2xl border-l border-primary/30 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 select-none">
      {/* Drawer Header */}
      <div className="p-4 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-sm text-on-surface font-bold uppercase">
                DHRUVAA AI COPILOT
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary-container text-on-primary-container font-bold">
                ENGINEERING
              </span>
            </div>
            <span className="text-[10px] font-mono text-outline">
              SYNTHETIC TWIN ADVISORY ENGINE
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCopilotOpen(false)}
          className="p-1.5 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors cursor-pointer"
          title="Close Copilot Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Advisory Mandatory Notice */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>
          ADVISORY ONLY: Model inference must never directly modify mechanical parameters or override FADEC.
        </span>
      </div>

      {/* Live Telemetry Grounding Bar */}
      <div className="bg-surface-container-low px-3 py-2 border-b border-outline-variant/20 flex items-center justify-between text-[10px] font-mono">
        <span className="text-outline">TELEMETRY GROUNDING:</span>
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold">{telemetry.rpm} RPM</span>
          <span className="text-outline">|</span>
          <span className="text-primary font-bold">{telemetry.chtAvg}°C</span>
          <span className="text-outline">|</span>
          <span className="text-primary font-bold">{selectedEngine.healthScore}% HLT</span>
          <span className="text-outline">|</span>
          <span className="text-primary font-bold">{selectedEngine.rulHours}h RUL</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-xs">
        {copilotMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[9px] text-outline">
              <span className="uppercase">{msg.sender === 'user' ? 'FLIGHT CONTROLLER' : 'AI COPILOT'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded max-w-[90%] whitespace-pre-wrap leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-primary/10 text-primary border-primary/30 font-sans'
                  : 'bg-surface-container text-on-surface border-outline-variant/20 font-sans'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isCopilotThinking && (
          <div className="flex items-center gap-2 text-primary text-xs p-2 bg-surface-container/60 rounded border border-primary/20 w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="font-mono text-[11px]">Synthesizing telemetry dynamics...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex flex-col gap-1.5">
        <span className="text-[9px] font-mono text-outline uppercase flex items-center gap-1">
          <Terminal className="w-3 h-3 text-primary" /> SAMPLE ENGINEERING QUERIES:
        </span>
        <div className="flex flex-wrap gap-1">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              disabled={isCopilotThinking}
              className="text-[10px] font-mono px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary hover:text-on-surface border border-outline-variant/30 transition-colors text-left truncate max-w-full cursor-pointer disabled:opacity-50"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-surface-container border-t border-outline-variant/30 flex gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask engineering copilot regarding telemetry..."
          disabled={isCopilotThinking}
          className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded px-3 py-2 text-xs font-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isCopilotThinking}
          className="px-3 py-2 bg-primary-container text-on-primary-container rounded font-mono text-xs font-bold flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

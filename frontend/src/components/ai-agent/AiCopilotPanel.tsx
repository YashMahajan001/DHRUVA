import React, { useRef, useEffect, useState } from 'react';
import { Bot, Send, RotateCcw, Sparkles } from 'lucide-react';
import { CopilotMessage } from '../../types';

interface AiCopilotPanelProps {
  messages: CopilotMessage[];
  isThinking: boolean;
  onSendQuery: (query: string) => void;
  onClearChat: () => void;
}

export const AiCopilotPanel: React.FC<AiCopilotPanelProps> = ({
  messages,
  isThinking,
  onSendQuery,
  onClearChat,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    onSendQuery(inputValue.trim());
    setInputValue('');
  };

  const sampleQueries = [
    'Why is Engine 02 showing a warning?',
    'Simulate this engine for high-altitude ISR',
    'What maintenance is recommended?',
    'Compare Engine 01 vs Engine 04',
    'Why is engine health decreasing?',
    'What is the current RUL?',
    'Why is CHT increasing?',
    'Are there any active faults?',
  ];

  return (
    <div
      id="ai-copilot-panel"
      className="bg-[#161b29] border border-[#3b494b]/20 p-5 rounded-xl shadow-lg flex flex-col h-[480px]"
    >
      {/* Copilot Header */}
      <div className="flex items-start justify-between pb-3 mb-3 bg-[#1a1f2d]/60 border border-[#3b494b]/15 p-3 rounded">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#00f0ff] text-[#00363a] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold text-[#dee2f5] leading-tight">
                AI COPILOT
              </span>
              <span className="font-mono text-[10px] bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded font-semibold">
                DHRUVAA LLM-AERO v3
              </span>
            </div>
            <p className="font-mono text-xs text-[#849495] tracking-tight">
              Autonomous Aero-Engine Diagnostics &amp; Advisory Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearChat}
            className="text-[#849495] hover:text-[#00f0ff] p-1 rounded hover:bg-[#252a38] transition-colors"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" title="Agent active"></span>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="bg-[#090e1b]/70 border border-[#3b494b]/15 px-3 py-1.5 rounded text-xs font-mono text-[#849495] flex items-center justify-between mb-3">
        <span className="text-[#00dbe9] flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> ADVISORY ENGINE
        </span>
        <span>READ-ONLY TELEMETRY LINK // NO DIRECT FADEC OVERRIDE</span>
      </div>

      {/* Quick Prompts Chips Bar */}
      <div className="flex flex-wrap gap-1 mb-2 max-h-16 overflow-y-auto pr-1">
        {sampleQueries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onSendQuery(query)}
            disabled={isThinking}
            className="font-mono text-xs px-3 py-1.5 rounded bg-[#252a38] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#b9cacb] border border-[#3b494b]/20 transition-colors text-left disabled:opacity-50"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Live Agentic Chat Window with Tool Outputs */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 font-sans text-xs"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="bg-[#00f0ff]/15 border border-[#00f0ff]/30 self-end p-2.5 rounded-lg max-w-[85%] text-right"
              >
                <span className="font-mono text-xs text-[#00dbe9] block font-semibold">
                  CDR. V. SHASTRI
                </span>
                <span className="text-[#dbfcff] font-medium">{msg.text}</span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className="bg-[#252a38]/85 border border-[#3b494b]/20 p-4 rounded-lg flex flex-col gap-2 shadow-md"
            >
              <div className="flex items-center justify-between text-[#849495] font-mono text-xs">
                <span className="text-[#00f0ff] font-bold tracking-wider">
                  {msg.reasoningChain ? 'AGENTIC REASONING CHAIN' : 'SYSTEM OBSERVATION'}
                </span>
                <span className="text-[#00dbe9]">{msg.timestamp}</span>
              </div>

              {msg.text && <p className="text-[#dee2f5] leading-relaxed">{msg.text}</p>}

              {msg.reasoningChain && (
                <div className="text-xs leading-relaxed flex flex-col gap-2 pt-2">
                  <div>
                    <span className="text-[#849495] uppercase text-[10px] font-mono block font-bold">
                      1. Observation
                    </span>
                    <p className="text-[#dee2f5]">{msg.reasoningChain.observation}</p>
                  </div>

                  <div>
                    <span className="text-[#849495] uppercase text-[10px] font-mono block font-bold">
                      2. Evidence &amp; Telemetry Correlation
                    </span>
                    <p className="text-[#7df4ff] font-mono text-xs bg-[#090e1b] p-2 rounded border border-[#3b494b]/20">
                      {msg.reasoningChain.evidence}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#849495] uppercase text-[10px] font-mono block font-bold">
                      3. Digital Twin Analysis
                    </span>
                    <p className="text-[#dee2f5]">{msg.reasoningChain.analysis}</p>
                  </div>

                  <div>
                    <span className="text-[#849495] uppercase text-[10px] font-mono block font-bold">
                      4. Action Recommendation
                    </span>
                    <p className="text-[#10b981] font-semibold">
                      {msg.reasoningChain.recommendation}
                    </p>
                  </div>

                  <div className="mt-2 pt-3 border-t border-[#3b494b]/20 flex justify-between items-center text-[10px] text-[#849495] font-mono">
                    <span className="text-[#00f0ff] font-semibold">
                      {msg.reasoningChain.envelope}
                    </span>
                    <span className="text-[#10b981] font-bold">CLEARANCE: GRANTED</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="bg-[#252a38]/70 border border-[#00f0ff]/30 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#00f0ff] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping"></span>
            <span>Synthesizing telemetry physics &amp; digital twin inference...</span>
          </div>
        )}
      </div>

      {/* Copilot Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 pt-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask anything about engine, mission, or telemetry..."
          disabled={isThinking}
          className="flex-1 bg-[#090e1b] border border-[#3b494b]/40 px-3 py-1.5 rounded text-[#dee2f5] text-xs font-sans focus:outline-none focus:border-[#00f0ff] placeholder:text-[#849495]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isThinking}
          className="bg-[#00f0ff] text-[#00363a] font-mono text-xs px-4 py-2 rounded font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 cursor-pointer"
        >
          <span>QUERY</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

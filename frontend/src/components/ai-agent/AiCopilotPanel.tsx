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

  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sampleQueries = [
    'Engine 02 warning?',
    'High-altitude ISR sim',
    'Maintenance plan',
    'Compare ENG-01 vs 04',
  ];

  return (
    <div
      id="ai-copilot-panel"
      className="bg-[#0c1220]/90 border border-[#00f0ff]/15 p-3.5 sm:p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col h-[480px]"
    >
      {/* Copilot Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#3b494b]/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00f0ff] text-[#00363a] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#dee2f5]">
              AI Copilot
            </span>
            <span className="font-mono text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 px-1.5 py-0.2 rounded font-semibold">
              LLM-AERO v3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Advisory Notice */}
          <span className="font-mono text-[10px] text-[#849495] flex items-center gap-1 bg-[#090e1b] px-2 py-0.5 rounded border border-[#3b494b]/20">
            <span className="text-[#00dbe9] font-semibold">Advisory mode</span>
            <span>·</span>
            <span>Read-only</span>
          </span>

          <button
            onClick={onClearChat}
            className="text-[#849495] hover:text-[#00f0ff] p-1 rounded hover:bg-[#252a38] transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" title="Agent active"></span>
        </div>
      </div>

      {/* Quick Prompts Chips Bar */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {sampleQueries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onSendQuery(query)}
            disabled={isThinking}
            className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#252a38] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#b9cacb] border border-[#3b494b]/30 transition-colors text-left disabled:opacity-50 cursor-pointer"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Live Agentic Chat Window with Tool Outputs */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 font-sans text-xs"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="bg-[#00f0ff]/15 border border-[#00f0ff]/30 self-end p-2.5 rounded-lg max-w-[85%] text-right"
              >
                <span className="font-mono text-[10px] text-[#00dbe9] block font-semibold">
                  OPERATOR
                </span>
                <span className="text-[#dbfcff] font-medium text-xs">{msg.text}</span>
              </div>
            );
          }

          const isExpanded = !!expandedDetails[msg.id];

          return (
            <div
              key={msg.id}
              className="bg-[#252a38]/85 border border-[#3b494b]/20 p-3 rounded-lg flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between text-[#849495] font-mono text-[10px]">
                <span className="text-[#00f0ff] font-semibold tracking-wider">
                  {msg.reasoningChain ? 'DIAGNOSTIC SYNTHESIS' : 'SYSTEM OBSERVATION'}
                </span>
                <span className="text-[#849495]">{msg.timestamp}</span>
              </div>

              {msg.text && <p className="text-[#dee2f5] leading-relaxed text-xs">{msg.text}</p>}

              {msg.reasoningChain && (
                <div className="text-xs flex flex-col gap-1.5 pt-1">
                  {/* Finding */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[#849495] font-mono font-bold text-[10px] uppercase shrink-0">Finding:</span>
                    <span className="text-[#dee2f5]">{msg.reasoningChain.observation}</span>
                  </div>

                  {/* Evidence */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[#849495] font-mono font-bold text-[10px] uppercase shrink-0">Evidence:</span>
                    <span className="text-[#7df4ff] font-mono text-[11px] bg-[#090e1b] px-1.5 py-0.5 rounded border border-[#3b494b]/30">
                      {msg.reasoningChain.evidence}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[#10b981] font-mono font-bold text-[10px] uppercase shrink-0">Action:</span>
                    <span className="text-[#dee2f5] font-medium">
                      {msg.reasoningChain.recommendation}
                    </span>
                  </div>

                  {/* On-demand Details */}
                  {isExpanded && (
                    <div className="mt-1.5 pt-2 border-t border-[#3b494b]/30 flex flex-col gap-1.5 bg-[#090e1b]/60 p-2 rounded">
                      <div>
                        <span className="text-[#849495] font-mono text-[9px] uppercase font-bold block">
                          Twin Analysis:
                        </span>
                        <p className="text-[#b9cacb] text-[11px] mt-0.5">{msg.reasoningChain.analysis}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#849495] pt-1">
                        <span>Envelope: <strong className="text-[#00f0ff]">{msg.reasoningChain.envelope}</strong></span>
                        <span className="text-[#10b981] font-semibold">Clearance: Granted</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleDetails(msg.id)}
                      className="font-mono text-[10px] text-[#00f0ff] hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide details ▴' : 'Show details ▾'}
                    </button>
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

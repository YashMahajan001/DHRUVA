/**
 * DHRUVAA — AI Copilot Engineering Assistant Drawer
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';
import { COPILOT_PROMPTS } from '../../services/simulationCopilotService';

export const CopilotDrawer: React.FC = () => {
  const { 
    isCopilotOpen, 
    setIsCopilotOpen, 
    copilotMessages, 
    askCopilot, 
    isCopilotThinking,
    selectedEngine,
    telemetry
  } = useDashboard();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCopilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isCopilotThinking) return;
    askCopilot(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#090e1b] border-l border-[#00f0ff]/40 h-full shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Top Header */}
        <div className="p-4 bg-[#161b29] border-b border-[#3b494b]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#252a38] border border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono-telemetry text-sm font-bold text-[#dee2f5] tracking-wider uppercase flex items-center gap-2">
                AI COPILOT // ADVISORY
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#00dbe9]">
                PROPULSION DIGITAL TWIN INFERENCE // {selectedEngine.model}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(false)}
            className="p-1.5 rounded hover:bg-[#252a38] text-[#849495] hover:text-[#dee2f5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-[#161b29]/90 px-4 py-2 border-b border-[#3b494b]/20 flex items-center gap-2 font-mono-telemetry text-[10px] text-[#b4c5ff]">
          <ShieldAlert className="w-4 h-4 text-[#00f0ff] flex-shrink-0" />
          <span>
            Advisory assistance only. Direct modification of engine throttle or mixture is prohibited by flight safety interlocks.
          </span>
        </div>

        {/* Prompt Recommendation Chips */}
        <div className="p-3 bg-[#0e1320] border-b border-[#3b494b]/20 flex flex-col gap-1.5">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase tracking-wider">
            RECOMMENDED DIAGNOSTIC QUERIES:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COPILOT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => askCopilot(prompt)}
                disabled={isCopilotThinking}
                className="font-mono-telemetry text-[10px] px-2.5 py-1 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#00f0ff]/30 text-[#00f0ff] transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 font-sans text-xs">
          {copilotMessages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[92%] ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                  isBot 
                    ? 'bg-[#161b29] border border-[#00f0ff]/40 text-[#00f0ff]' 
                    : 'bg-[#00f0ff] text-[#00363a] font-bold'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`p-3 rounded-lg flex flex-col gap-1.5 ${
                  isBot 
                    ? 'bg-[#161b29] border border-[#3b494b]/40 text-[#dee2f5]' 
                    : 'bg-[#0053db] text-white'
                }`}>
                  <div className="flex items-center justify-between gap-4 font-mono-telemetry text-[9px] text-[#849495]">
                    <span className="uppercase font-semibold">{isBot ? 'DHRUVAA AI' : 'COMMAND PILOT'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>

                  {/* Telemetry Snapshot if provided */}
                  {msg.telemetrySnapshot && (
                    <div className="bg-[#090e1b] p-2 rounded border border-[#3b494b]/30 font-mono-telemetry text-[10px] grid grid-cols-2 gap-1 mt-1 text-[#b9cacb]">
                      {Object.entries(msg.telemetrySnapshot).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-[#849495] uppercase">{k}:</span>
                          <span className="text-[#00f0ff] font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {msg.recommendedActions && msg.recommendedActions.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1 border-t border-[#3b494b]/30 pt-1.5">
                      <span className="font-mono-telemetry text-[9px] text-[#00dbe9] font-bold uppercase">
                        SUGGESTED ACTIONS:
                      </span>
                      {msg.recommendedActions.map((action, i) => (
                        <div key={i} className="flex items-center gap-1.5 font-sans text-[11px] text-[#b9cacb]">
                          <ArrowRight className="w-3 h-3 text-[#00f0ff] flex-shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isCopilotThinking && (
            <div className="self-start flex items-center gap-2 text-[#00f0ff] font-mono-telemetry text-xs p-3 bg-[#161b29] rounded border border-[#00f0ff]/30">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span>Analyzing thermodynamic boundary cycles & telemetry streams...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-[#161b29] border-t border-[#3b494b]/30 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask engineering assistant about CHT, RUL, vibration, or active faults..."
            className="flex-1 bg-[#090e1b] text-[#dee2f5] px-3 py-2 rounded border border-[#3b494b]/40 font-mono-telemetry text-xs focus:outline-none focus:border-[#00f0ff] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isCopilotThinking}
            className="p-2.5 rounded bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] transition-all disabled:opacity-40 cursor-pointer"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

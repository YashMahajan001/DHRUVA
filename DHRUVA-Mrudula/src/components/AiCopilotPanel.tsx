import React, { useRef, useEffect, useState } from 'react';
import {
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CopilotMessage } from '../types';
import { MetricCard } from './copilot/MetricCard';
import { EvidenceCard } from './copilot/EvidenceCard';
import { WhyThisAlertCard } from './copilot/WhyThisAlertCard';
import { MissionImpactCard } from './copilot/MissionImpactCard';
import { FleetRankingCard } from './copilot/FleetRankingCard';
import { ThrottleResponseCard } from './copilot/ThrottleResponseCard';
import { TuningComparisonCard } from './copilot/TuningComparisonCard';
import { RecommendationCard } from './copilot/RecommendationCard';
import { SuggestedActions } from './copilot/SuggestedActions';

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
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    'Why is ENG-03 flagged?',
    'Can ENG-03 perform a 6-hour endurance mission?',
    'Which engine needs attention first?',
    'Check throttle response',
    'Which tuning profile is better for endurance?',
    'What is the current RUL?',
  ];

  const renderPanelInner = (expandedView = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 1. COPILOT HEADER (AEROSPACE ENGINEERING CONSOLE) */}
      <div className="flex items-start justify-between pb-2 mb-1.5 bg-[#1a1f2d]/90 border border-[#3b494b]/30 p-2.5 rounded-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#00f0ff] text-[#00363a] flex items-center justify-center font-bold shadow-[0_0_12px_rgba(0,240,255,0.45)] shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display text-sm font-bold text-[#dee2f5] tracking-wide leading-none">
                DHRUVA COPILOT
              </span>
              <span className="font-mono text-[8.5px] bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 px-1 py-0.2 rounded font-semibold">
                AI ENGINEERING CONSOLE
              </span>
            </div>
            <p className="font-mono text-[8.5px] text-[#849495] tracking-tight mt-0.5">
              Multi-Source Propulsion Intelligence &amp; Advisory Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="text-[#849495] hover:text-[#00f0ff] p-1 rounded hover:bg-[#252a38] transition-colors cursor-pointer"
            title={isFullScreen ? 'Restore Docked View' : 'Expand Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClearChat}
            className="text-[#849495] hover:text-[#00f0ff] p-1 rounded hover:bg-[#252a38] transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" title="Agent active"></span>
        </div>
      </div>

      {/* 2. ADVISORY & DATA MODE BANNER */}
      <div className="bg-[#090e1b]/90 border border-[#3b494b]/40 px-2 py-1 rounded text-[8.5px] font-mono text-[#849495] flex items-center justify-between mb-1.5 shrink-0">
        <span className="text-[#00dbe9] flex items-center gap-1 font-semibold">
          <Sparkles className="w-2.5 h-2.5" /> ● DEMO ANALYTICS
        </span>
        <span className="tracking-tight text-[8px] text-[#849495]">
          READ-ONLY TELEMETRY // NO DIRECT FADEC OVERRIDE
        </span>
      </div>

      {/* 3. QUICK PROMPTS CHIPS */}
      <div className="flex flex-wrap gap-1 mb-1.5 max-h-14 overflow-y-auto pr-0.5 shrink-0">
        {sampleQueries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onSendQuery(query)}
            disabled={isThinking}
            className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-[#252a38]/90 hover:bg-[#00f0ff] hover:text-[#00363a] text-[#b9cacb] border border-[#3b494b]/40 transition-colors text-left disabled:opacity-50 cursor-pointer"
          >
            {query}
          </button>
        ))}
      </div>

      {/* 4. SCROLLABLE CHAT FEED (INTERACTIVE ENGINEERING CARDS) */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 font-sans text-xs min-h-0"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="bg-[#00f0ff]/15 border border-[#00f0ff]/35 self-end p-2 rounded-lg max-w-[85%] text-right shadow-sm"
              >
                <span className="font-mono text-[8.5px] text-[#00dbe9] block font-semibold">
                  CDR. V. SHASTRI // FLIGHT DECK
                </span>
                <span className="text-[#dbfcff] font-medium text-xs">{msg.text}</span>
              </div>
            );
          }

          const resp = msg.agentResponse;
          const chain = resp?.reasoning_chain || msg.reasoningChain;

          // Status badge styling
          const decStatus =
            resp?.decision_status ||
            (chain?.envelope?.includes('RESTRICTED') ? 'REVIEW REQUIRED' : 'NOMINAL');
          let statusBg = 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40';
          if (
            decStatus.includes('REVIEW') ||
            decStatus.includes('WARNING') ||
            decStatus.includes('DEVIATING') ||
            decStatus.includes('CONDITIONAL')
          ) {
            statusBg = 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40';
          } else if (
            decStatus.includes('NOT RECOMMENDED') ||
            decStatus.includes('CRITICAL') ||
            decStatus.includes('HIGH PRIORITY')
          ) {
            statusBg = 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40';
          }

          const showRulMetrics =
            resp?.rul_hours !== undefined ||
            (resp?.health_score !== undefined && resp?.anomaly_score !== undefined);

          return (
            <div
              key={msg.id}
              className="bg-[#252a38]/95 border border-[#3b494b]/50 p-2.5 rounded-lg flex flex-col gap-2 shadow-md"
            >
              {/* 1. DECISION HEADER BAR */}
              <div className="flex items-center justify-between pb-1 border-b border-[#3b494b]/30">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {resp?.engine_id && (
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#090e1b] text-[#00f0ff] border border-[#00f0ff]/30">
                      {resp.engine_id}
                    </span>
                  )}
                  <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${statusBg}`}>
                    {decStatus}
                  </span>
                  {resp?.health_score !== undefined && (
                    <span className="font-mono text-[8.5px] text-[#849495] bg-[#090e1b]/80 px-1 py-0.2 rounded border border-[#3b494b]/30">
                      HEALTH: <span className="text-[#dee2f5] font-bold">{resp.health_score}/100</span>
                    </span>
                  )}
                </div>
                <span className="font-mono text-[8.5px] text-[#00dbe9]">{msg.timestamp}</span>
              </div>

              {/* 2. PRIMARY FINDING */}
              {resp?.primary_finding ? (
                <div className="bg-[#1a2130]/90 px-2.5 py-1.5 rounded border-l-2 border-[#00f0ff]">
                  <span className="text-[8.5px] font-mono text-[#849495] block uppercase font-bold tracking-wide">
                    Primary Finding
                  </span>
                  <p className="text-[#dee2f5] text-[11px] font-semibold leading-snug">
                    {resp.primary_finding}
                  </p>
                </div>
              ) : msg.text && !chain ? (
                <p className="text-[#dee2f5] text-xs leading-relaxed">{msg.text}</p>
              ) : null}

              {/* 3. METRIC CARDS ROW (Visual cards for RUL/Health/Anomaly/Throttle) */}
              {showRulMetrics && !resp?.throttle_response_data && !resp?.fleet_ranking_data && (
                <div className={`grid ${expandedView ? 'grid-cols-4' : 'grid-cols-3'} gap-1 font-mono`}>
                  {resp?.health_score !== undefined && (
                    <MetricCard
                      label="HEALTH"
                      value={`${resp.health_score} / 100`}
                      status={resp.health_score < 75 ? 'warning' : 'nominal'}
                      iconType="health"
                    />
                  )}
                  {resp?.anomaly_score !== undefined && (
                    <MetricCard
                      label="ANOMALY"
                      value={resp.anomaly_score.toFixed(2)}
                      subValue={resp.anomaly_score > 0.6 ? 'ELEVATED' : 'NOMINAL'}
                      status={resp.anomaly_score > 0.6 ? 'warning' : 'nominal'}
                      iconType="vibration"
                    />
                  )}
                  {resp?.rul_hours !== undefined && (
                    <MetricCard
                      label="RUL"
                      value={`${resp.rul_hours} hrs`}
                      subValue="ESTIMATE"
                      status={resp.rul_hours < 200 ? 'warning' : 'nominal'}
                      iconType="throttle"
                    />
                  )}
                </div>
              )}

              {/* 4. EVIDENCE CARD (TELEMETRY EVIDENCE + VIEW EVIDENCE EXPANDABLE) */}
              {resp?.evidence_metrics && resp.evidence_metrics.length > 0 && (
                <EvidenceCard
                  metrics={resp.evidence_metrics}
                  rawEvidence={
                    resp.correlated_signals?.map((s) => `${s} cross-correlated against fleet loiter baseline`) || [
                      'CHT +8.4% above loiter baseline (148°C peak)',
                      'Vibration +12.1% spectral peak at 2.85 mm/s RMS',
                      'Fuel flow +9.2% steady-state delta',
                    ]
                  }
                />
              )}

              {/* 5. THROTTLE RESPONSE CARD (Interactive Visual Power Bars & Latency) */}
              {resp?.throttle_response_data && (
                <ThrottleResponseCard data={resp.throttle_response_data} />
              )}

              {/* 6. TUNING COMPARISON CARD (Profile A vs Profile B Matrix) */}
              {resp?.tuning_comparison_data && (
                <TuningComparisonCard data={resp.tuning_comparison_data} />
              )}

              {/* 7. FLEET RANKING CARD (Priority Queue + Per-Engine Detail Inspection) */}
              {resp?.fleet_ranking_data && (
                <FleetRankingCard
                  rankings={resp.fleet_ranking_data}
                  onSelectEngine={(engId) => onSendQuery(`Why is ${engId} flagged?`)}
                />
              )}

              {/* 8. MISSION IMPACT CARD */}
              {resp?.mission_impact_data ? (
                <MissionImpactCard data={resp.mission_impact_data} />
              ) : resp?.mission_impact ? (
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/25 px-2 py-1 rounded">
                  <span className="text-[8.5px] font-mono text-[#f59e0b] uppercase font-bold tracking-wider block">
                    Mission Impact
                  </span>
                  <p className="text-[#fde68a] text-[10px] font-medium leading-snug">{resp.mission_impact}</p>
                </div>
              ) : null}

              {/* 9. WHY THIS ALERT? (Observable Explainability Drawer) */}
              {resp?.why_this_alert && <WhyThisAlertCard data={resp.why_this_alert} />}

              {/* 10. ACTION RECOMMENDATION CARD */}
              {chain?.recommendation && (
                <RecommendationCard recommendation={chain.recommendation} isAdvisory={true} />
              )}

              {/* 11. CORRELATED SIGNALS */}
              {resp?.correlated_signals && resp.correlated_signals.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[8px] font-mono text-[#849495]">
                  <span className="font-bold text-[#b9cacb]">
                    {resp.correlated_signals.length} SIGNALS CORRELATED:
                  </span>
                  {resp.correlated_signals.map((sig, sIdx) => (
                    <span
                      key={sIdx}
                      className="bg-[#090e1b] px-1 py-0.2 rounded border border-[#3b494b]/30 text-[#7df4ff]"
                    >
                      {sig} ✓
                    </span>
                  ))}
                </div>
              )}

              {/* 12. SUGGESTED NEXT ACTIONS (Interactive Contextual Chips) */}
              {resp?.suggested_actions && resp.suggested_actions.length > 0 && (
                <SuggestedActions
                  actions={resp.suggested_actions}
                  onSelectAction={onSendQuery}
                  disabled={isThinking}
                />
              )}

              {/* 13. CARD FOOTER METADATA */}
              <div className="pt-1 border-t border-[#3b494b]/30 flex flex-wrap justify-between items-center gap-1 text-[8.5px] font-mono text-[#849495]">
                <span className="text-[#00f0ff] font-semibold">{chain?.envelope}</span>
                <div className="flex items-center gap-1.5">
                  {resp?.confidence && (
                    <span>
                      CONF: <span className="text-[#00f0ff] font-bold">{Math.round(resp.confidence * 100)}%</span>
                    </span>
                  )}
                  {resp?.data_mode && (
                    <span className="bg-[#090e1b] px-1 py-0.2 rounded border border-[#3b494b]/40 text-[#00dbe9]">
                      {resp.data_mode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="bg-[#252a38]/80 border border-[#00f0ff]/30 p-2 rounded-lg flex items-center gap-2 text-xs text-[#00f0ff] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping"></span>
            <span>Correlating multi-source telemetry physics &amp; digital twin state...</span>
          </div>
        )}
      </div>

      {/* 5. COPILOT INPUT FORM */}
      <form onSubmit={handleSubmit} className="mt-1.5 flex gap-1.5 pt-1 shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask DHRUVA engineering copilot..."
          disabled={isThinking}
          className="flex-1 bg-[#090e1b] border border-[#3b494b]/50 px-2.5 py-1.5 rounded text-[#dee2f5] text-xs font-sans focus:outline-none focus:border-[#00f0ff] placeholder:text-[#849495]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isThinking}
          className="bg-[#00f0ff] text-[#00363a] font-mono text-[11px] px-2.5 py-1.5 rounded font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>QUERY</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );

  if (isFullScreen) {
    return (
      <>
        {/* Dock placeholder while in fullscreen */}
        <div
          id="ai-copilot-panel"
          className="bg-[#161b29] border border-[#00f0ff]/30 p-3 rounded-xl shadow-xl flex items-center justify-center h-[480px] text-center"
        >
          <div className="flex flex-col items-center gap-2 text-[#849495] font-mono text-xs">
            <Bot className="w-8 h-8 text-[#00f0ff] animate-pulse" />
            <span className="text-[#dee2f5] font-bold">COPILOT EXPANDED TO FULLSCREEN</span>
            <button
              onClick={() => setIsFullScreen(false)}
              className="mt-2 bg-[#00f0ff] text-[#00363a] px-3 py-1 rounded font-bold text-[11px] cursor-pointer"
            >
              Restore Docked View
            </button>
          </div>
        </div>

        {/* Fullscreen Overlay Modal */}
        <div className="fixed inset-0 z-50 bg-[#090e1b]/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center">
          <div className="bg-[#161b29] border border-[#00f0ff]/50 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] w-full max-w-5xl h-[90vh] p-4 flex flex-col overflow-hidden">
            {renderPanelInner(true)}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      id="ai-copilot-panel"
      className="bg-[#161b29] border border-[#3b494b]/35 p-3 rounded-xl shadow-xl flex flex-col h-[480px] overflow-hidden"
    >
      {renderPanelInner(false)}
    </div>
  );
};

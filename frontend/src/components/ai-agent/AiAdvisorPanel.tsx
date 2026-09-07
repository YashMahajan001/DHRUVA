/**
 * DHRUVAA AI Diagnostic Advisor & Engineering Copilot Panel
 */
import React, { useState } from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Sparkles, Flame, Brain, Send, Bot, User, CornerDownRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';
import { DEFAULT_COPILOT_SUGGESTIONS } from '../../services/maintenanceAiAdvisorService';

export const AiAdvisorPanel: React.FC = () => {
  const {
    selectedEngine,
    dispatchPreventiveWO,
    copilotMessages,
    sendCopilotQuery,
    isCopilotThinking
  } = useMission();

  const [activeTab, setActiveTab] = useState<'inference' | 'copilot'>('inference');
  const [customInput, setCustomInput] = useState('');

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    sendCopilotQuery(text);
    setCustomInput('');
  };

  const currentCht = selectedEngine.telemetry.cht;
  const currentVib = selectedEngine.telemetry.vibration;
  const isEng03 = selectedEngine.id === 'eng-03';
  const isEng01 = selectedEngine.id === 'eng-01';

  return (
    <div className="flex flex-col gap-3">
      {/* Panel Top Bar with Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00f0ff]" />
          <h2 className="font-headline text-lg text-[#dee2f5] uppercase tracking-wide font-semibold">
            AI DIAGNOSTIC ADVISOR
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded bg-[#161b29] border border-[#3b494b]/30 p-0.5">
            <button
              onClick={() => setActiveTab('inference')}
              className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
                activeTab === 'inference'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              SYNTHETIC INFERENCE
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all flex items-center gap-1 ${
                activeTab === 'copilot'
                  ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5]'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>AI COPILOT</span>
            </button>
          </div>
          <span className="px-2 py-0.5 rounded font-telemetry text-[9px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 uppercase hidden sm:inline-block font-semibold">
            MODEL: AERO-TWIN-V4
          </span>
        </div>
      </div>

      {/* Main Panel Content Container */}
      <div className="p-4 rounded bg-[#090e1b]/90 border border-[#00f0ff]/30 flex flex-col gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <ReticleCorner color="#00f0ff" size={6} />

        {/* Ambient Background Graphic */}
        <div className="absolute top-2 right-2 opacity-5 pointer-events-none text-[#00f0ff]">
          <Brain className="w-36 h-36" />
        </div>

        {activeTab === 'inference' ? (
          <>
            {/* Active Alert Header Block */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-[#00f0ff]" />
              </div>
              <div className="flex flex-col">
                <span className="font-telemetry text-[9px] text-[#00f0ff] uppercase tracking-widest font-bold">
                  SYNTHETIC INFERENCE // ACTIVE ALERT
                </span>
                <h3 className="font-headline text-base sm:text-lg text-[#dee2f5] font-bold leading-tight">
                  {isEng03
                    ? '"Ultrasonic micro-spalling accelerating on Engine 03 bearing."'
                    : isEng01
                    ? '"All propulsion telemetry nominal on Engine 01."'
                    : '"Cooling degradation is accelerating on Engine 02."'}
                </h3>
              </div>
            </div>

            {/* Corroborating Evidence Matrix */}
            <div className="flex flex-col gap-1.5 bg-[#161b29]/80 p-3 rounded border border-[#3b494b]/20">
              <span className="font-telemetry text-[9px] text-[#849495] tracking-wider uppercase font-bold">
                CORROBORATING EVIDENCE MATRIX
              </span>

              {isEng03 ? (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">Ultrasonic Spall Peak</span>
                    <span className="font-telemetry text-sm text-red-400 font-bold">+19 dB @ 2.45 kHz</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">Harmonic Vibration</span>
                    <span className="font-telemetry text-sm text-red-400 font-bold">{currentVib} mm/s (CRITICAL)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-xs text-[#b9cacb]">Main Gallery Oil Press</span>
                    <span className="font-tactical text-[11px] text-red-400 font-bold">{selectedEngine.telemetry.oilPressure} PSI (-22 PSI)</span>
                  </div>
                  <p className="font-body text-[11px] text-[#849495] italic mt-1 leading-snug">
                    Acoustic harmonics verify surface spalling on bearing race #2. Friction is generating metal micro-particulates into scavenger pump.
                  </p>
                </>
              ) : isEng01 ? (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">CHT Balance Delta</span>
                    <span className="font-telemetry text-sm text-emerald-400 font-bold">±1.8°C (Nominal)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">Cooling Airflow Efficiency</span>
                    <span className="font-telemetry text-sm text-emerald-400 font-bold">99.8% Nominal</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-xs text-[#b9cacb]">Thermal/Fuel Ratio Match</span>
                    <span className="font-tactical text-[11px] text-emerald-400 font-bold">MATCH (0.99)</span>
                  </div>
                  <p className="font-body text-[11px] text-[#849495] italic mt-1 leading-snug">
                    Synthetic twin baseline models match active physical sensor telemetry across all 4 combustion chambers with 99.4% cross-correlation.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">CHT Trend vs Baseline</span>
                    <span className="font-telemetry text-sm text-amber-300 font-bold">+14% ({currentCht}°C)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#3b494b]/20">
                    <span className="font-body text-xs text-[#b9cacb]">Cooling Efficiency (last 15h)</span>
                    <span className="font-telemetry text-sm text-red-400 font-bold">-8% Decay</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-xs text-[#b9cacb]">Thermal/Fuel Ratio Match</span>
                    <span className="font-tactical text-[11px] text-amber-300 font-bold">MISMATCH (0.72)</span>
                  </div>
                  <p className="font-body text-[11px] text-[#849495] italic mt-1 leading-snug">
                    Thermal model reports fuel flow density is nominal, but cylinder head heat rejection coefficient has fallen beneath laminar flow thresholds.
                  </p>
                </>
              )}
            </div>

            {/* CHT Excursion Profile Sparkline (Exact Stitch graphic representation) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-telemetry text-[9px] text-[#b9cacb] uppercase">
                  CHT EXCURSION PROFILE (LAST 20 SORTIES)
                </span>
                <span className="font-telemetry text-[9px] text-amber-400 font-bold">
                  EXPONENTIAL FIT
                </span>
              </div>
              <div className="h-16 w-full bg-[#252a38]/40 rounded p-1.5 flex items-end relative overflow-hidden border border-[#3b494b]/20">
                <svg className="w-full h-full text-amber-400" fill="none" preserveAspectRatio="none" viewBox="0 0 200 60">
                  <line stroke="currentColor" strokeDasharray="2 2" strokeOpacity="0.3" strokeWidth="1" x1="0" x2="200" y1="45" y2="45" />
                  <path
                    d={isEng03 ? "M0,48 Q40,46 80,44 T120,38 T150,26 T200,6" : isEng01 ? "M0,45 Q50,45 100,44 T150,45 T200,44" : "M0,45 Q50,44 90,42 T130,35 T160,24 T200,8"}
                    fill="none"
                    stroke={isEng03 ? "#ef4444" : isEng01 ? "#10b981" : "#f59e0b"}
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <path
                    d={isEng03 ? "M0,48 Q40,46 80,44 T120,38 T150,26 T200,6 L200,60 L0,60 Z" : isEng01 ? "M0,45 Q50,45 100,44 T150,45 T200,44 L200,60 L0,60 Z" : "M0,45 Q50,44 90,42 T130,35 T160,24 T200,8 L200,60 L0,60 Z"}
                    fill={isEng03 ? "rgba(239, 68, 68, 0.08)" : isEng01 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)"}
                  />
                  <circle cx="200" cy={isEng03 ? 6 : isEng01 ? 44 : 8} fill={isEng03 ? "#ef4444" : isEng01 ? "#10b981" : "#ef4444"} r="3.5" />
                </svg>
              </div>
            </div>

            {/* Prescriptive Recommendation Action Box */}
            <div className="p-3 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex flex-col gap-2">
              <span className="font-telemetry text-[9px] text-[#00f0ff] uppercase font-bold tracking-wider">
                ACTIONABLE PRESCRIPTION
              </span>
              <p className="font-body text-xs text-[#dee2f5] font-medium leading-relaxed">
                {isEng03 ? (
                  <>
                    "Execute mandatory depot grounding. Disassemble crankcase, extract bearing race #2, replace with mil-spec PN-8812-C (<strong className="text-red-400">Grounding active</strong>)."
                  </>
                ) : isEng01 ? (
                  <>
                    "Maintain standard operational profile. All sensor vectors nominal (<strong className="text-emerald-400">184 flight hours remaining</strong>). Standard stage 4 servicing queued."
                  </>
                ) : (
                  <>
                    "Inspect cooling system within next scheduled maintenance window (<strong className="text-[#00f0ff]">4.5 flight hours remaining</strong>). Clean cowling duct inlet and inspect cylinder #2 baffle seals."
                  </>
                )}
              </p>
              <button
                onClick={dispatchPreventiveWO}
                className="mt-1 w-full py-2 rounded bg-[#00f0ff] text-[#00363a] font-tactical text-[11px] font-bold uppercase hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
              >
                DISPATCH PREVENTIVE SERVICE WO
              </button>
            </div>
          </>
        ) : (
          /* Interactive AI Copilot Terminal View */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-telemetry text-[9px] text-[#00f0ff] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#00f0ff]" />
                ACTIVE COPILOT SESSION // TELEMETRY LINKED
              </span>
              <span className="font-tactical text-[9px] text-[#849495]">ADVISORY ONLY</span>
            </div>

            {/* Scrollable Conversation History */}
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {copilotMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded border text-xs leading-relaxed flex flex-col gap-1.5 ${
                    msg.sender === 'user'
                      ? 'bg-[#161b29] border-[#3b494b]/40 text-[#dee2f5] ml-4'
                      : 'bg-[#090e1b] border-[#00f0ff]/30 text-[#dee2f5] mr-2'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-telemetry text-[#849495]">
                    <span className="flex items-center gap-1 text-[#00f0ff] font-bold">
                      {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {msg.sender === 'user' ? 'CDR. V. SHASTRI' : 'AERO-TWIN-V4 COPILOT'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="font-body text-xs">{msg.content}</p>

                  {/* Corroborating Metrics Tags */}
                  {msg.corroboratingMetrics && (
                    <div className="flex flex-wrap gap-1.5 mt-1 pt-1 border-t border-[#3b494b]/20">
                      {msg.corroboratingMetrics.map((m, idx) => (
                        <div
                          key={idx}
                          className={`px-1.5 py-0.5 rounded font-telemetry text-[9px] border ${
                            m.status === 'critical'
                              ? 'bg-red-950/40 text-red-400 border-red-500/40'
                              : m.status === 'warning'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          <span className="opacity-75">{m.metric}:</span> <span className="font-bold">{m.value}</span>
                          {m.delta && <span className="ml-1 opacity-90">({m.delta})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.suggestedDirective && (
                    <div className="mt-1 p-1.5 rounded bg-[#1a1f2d] border border-[#00f0ff]/30 text-[10px] text-[#00f0ff] font-tactical">
                      <strong>Directive:</strong> {msg.suggestedDirective}
                    </div>
                  )}
                </div>
              ))}

              {isCopilotThinking && (
                <div className="p-2 rounded bg-[#090e1b] border border-[#00f0ff]/30 text-xs text-[#00f0ff] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                  <span className="font-telemetry text-[10px]">Processing propulsion telemetry models...</span>
                </div>
              )}
            </div>

            {/* Quick Example Questions (Explicitly requested by user) */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-[#3b494b]/20">
              <span className="font-telemetry text-[9px] text-[#849495] uppercase tracking-wider">
                TACTICAL INQUIRIES:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_COPILOT_SUGGESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-2 py-1 rounded bg-[#161b29] hover:bg-[#252a38] border border-[#3b494b]/40 hover:border-[#00f0ff] text-[#b9cacb] hover:text-[#dee2f5] font-tactical text-[10px] text-left transition-all cursor-pointer"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(customInput);
              }}
              className="flex items-center gap-2 mt-1"
            >
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="ASK COPILOT ABOUT RPM, CHT, RUL, OIL PRESSURE..."
                className="flex-1 bg-[#161b29] border border-[#3b494b]/40 rounded px-2.5 py-1.5 text-xs text-[#dee2f5] font-tactical focus:border-[#00f0ff] focus:outline-none tracking-wide uppercase placeholder:normal-case placeholder:text-[#849495]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-[#00f0ff] text-[#00363a] font-tactical text-[11px] font-bold hover:shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>QUERY</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

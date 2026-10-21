import React, { useState } from 'react';
import { useAero } from '../context/AeroContext';
import { AeroEngineModel3D } from '../components/aeroplane/AeroEngineModel3D';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
  Wrench,
  Search,
  ExternalLink,
  Cpu,
} from 'lucide-react';

export const AeroAnalysisView: React.FC = () => {
  const {
    currentEngine,
    telemetry,
    diagnostics,
    selectedComponent,
    setSelectedComponent,
    injectedFaults,
    toggleFaultInjection,
  } = useAero();

  const [activeTab, setActiveTab] = useState<'components' | 'faults' | 'anomalies'>('faults');

  if (!currentEngine) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-6 rounded-2xl bg-[#0b1329]/80 border border-[#38bdf8]/30 shadow-xl space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#38bdf8] animate-ping" />
          </div>
          <h2 className="text-lg font-bold font-display text-[#f8fafc]">Loading Aircraft Engine Analysis...</h2>
          <p className="text-xs font-mono text-[#94a3b8]">Initializing CAD cutaway and component health models.</p>
        </div>
      </div>
    );
  }

  const components = diagnostics?.components || [];
  const hypotheses = diagnostics?.hypotheses || [];
  const anomalies = diagnostics?.anomalies || [];

  // Selected component record
  const activeCompHealth = components.find((c) => c.component_id === selectedComponent) || components[0];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#dee2f5] font-sans selection:bg-[#38bdf8] selection:text-[#080d1a]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-[#f8fafc]">
              Engine Analysis
            </h1>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800 text-xs font-mono">
          <span className="text-[#94a3b8]">OVERALL HEALTH:</span>
          <span className={`font-bold ${
            (diagnostics?.overall_health_score_pct || 100) >= 85 ? 'text-[#10b981]' : 'text-[#ef4444]'
          }`}>
            {diagnostics?.overall_health_score_pct || 100}%
          </span>
        </div>
      </div>

      {/* Main Grid: Left = 3D Engine Viewer, Right = Inspector & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Left: 3D Interactive Engine Model (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <AeroEngineModel3D
            engine={currentEngine}
            telemetry={telemetry}
            selectedComponentId={selectedComponent}
            onSelectComponent={(cId) => setSelectedComponent(cId)}
            height="560px"
          />

          {/* Quick Subsystem Selector Buttons */}
          <div className="p-3.5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl">
            <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider block mb-2">
              Inspect Component:
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {components.map((comp) => {
                const isSelected = comp.component_id === selectedComponent;
                return (
                  <button
                    key={comp.component_id}
                    onClick={() => setSelectedComponent(comp.component_id)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#38bdf8] text-[#080d1a] font-bold border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                        : comp.status === 'CRITICAL'
                        ? 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40 hover:bg-[#ef4444]/25'
                        : comp.status === 'DEGRADED'
                        ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40 hover:bg-[#f59e0b]/25'
                        : 'bg-[#0f172a] text-[#94a3b8] border-slate-800 hover:border-[#38bdf8]/40 hover:text-[#f8fafc]'
                    }`}
                  >
                    <span>{comp.component_name}</span>
                    <span className="text-[9px] opacity-75">({comp.health_score_pct}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Right: Inspector Tabs (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-[#0b1329] rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('faults')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'faults'
                  ? 'bg-[#38bdf8] text-[#080d1a] shadow-[0_0_10px_rgba(56,189,248,0.35)]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Faults ({hypotheses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('components')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'components'
                  ? 'bg-[#38bdf8] text-[#080d1a] shadow-[0_0_10px_rgba(56,189,248,0.35)]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('anomalies')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'anomalies'
                  ? 'bg-[#38bdf8] text-[#080d1a] shadow-[0_0_10px_rgba(56,189,248,0.35)]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Anomalies ({anomalies.length})</span>
            </button>
          </div>

          {/* TAB 1: FAULTS & DIAGNOSTIC HYPOTHESES */}
          {activeTab === 'faults' && (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {hypotheses.length > 0 ? (
                hypotheses.map((h) => (
                  <div
                    key={h.hypothesis_id}
                    onClick={() => setSelectedComponent(h.affected_component_id)}
                    className="p-4 rounded-xl bg-[#0b1329]/90 border border-slate-800 hover:border-[#38bdf8]/60 transition-all cursor-pointer space-y-2.5 shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          h.severity === 'CRITICAL' ? 'bg-[#ef4444] animate-ping' : 'bg-[#f59e0b]'
                        }`} />
                        <h3 className="font-bold text-sm text-[#f8fafc] group-hover:text-[#38bdf8] transition-colors">
                          {h.fault_name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-[#38bdf8] border border-slate-700">
                        {h.confidence_pct}% Conf
                      </span>
                    </div>

                    <div className="text-xs text-[#94a3b8] space-y-1 font-mono">
                      <div>Component: <strong className="text-[#e0f2fe]">{h.affected_component_name}</strong></div>
                      <div>Mechanism: <span className="text-[#cbd5e1]">{h.physical_evidence}</span></div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 text-[11px] font-mono space-y-1">
                      <div className="text-[#7dd3fc] font-bold flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Rule: {h.detection_rule}</span>
                      </div>
                      <div className="text-[#10b981] flex items-start gap-1 pt-1">
                        <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Action: {h.recommended_action}</span>
                      </div>
                    </div>

                    {h.is_injected && (
                      <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        [INJECTED SIMULATION FAULT]
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#94a3b8] font-mono bg-[#0b1329]/60 rounded-xl border border-slate-800 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto" />
                  <div className="text-sm font-bold text-[#f8fafc]">No Active Faults Detected</div>
                  <p className="text-xs text-[#64748b]">
                    Engine is operating within certified TCDS envelopes and thermodynamic baselines.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMPONENT DETAIL INSPECTOR */}
          {activeTab === 'components' && activeCompHealth && (
            <div className="p-5 rounded-xl bg-[#0b1329]/90 border border-[#38bdf8]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#f8fafc]">
                    {activeCompHealth.component_name}
                  </h3>
                  <span className="text-[10px] font-mono text-[#94a3b8]">
                    ID: {activeCompHealth.component_id}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-xl font-bold ${
                    activeCompHealth.health_score_pct >= 85 ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}>
                    {activeCompHealth.health_score_pct}%
                  </span>
                  <div className="text-[9px] text-[#94a3b8] uppercase">{activeCompHealth.status}</div>
                </div>
              </div>

              {/* Subsystem Live Metrics */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider block">
                  ASSOCIATED LIVE MEASUREMENTS:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  {Object.entries(activeCompHealth.key_metrics).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-[#0f172a] border border-slate-800">
                      <span className="text-[10px] text-[#94a3b8] block">{k}</span>
                      <span className="font-bold text-[#38bdf8] text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TCDS Reference Note */}
              <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 text-xs font-mono text-[#94a3b8] space-y-1">
                <div className="font-bold text-[#e0f2fe]">Type Certificate Provenance:</div>
                <div>{currentEngine.provenance.certification_id} ({currentEngine.provenance.issuing_authority})</div>
                <div className="text-[10px] text-[#64748b]">{currentEngine.provenance.notes}</div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY ANOMALIES STREAM */}
          {activeTab === 'anomalies' && (
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 font-mono text-xs">
              {anomalies.length > 0 ? (
                anomalies.map((a) => (
                  <div
                    key={a.anomaly_id}
                    className="p-3 rounded-xl bg-[#0b1329] border border-[#ef4444]/30 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#ef4444]">{a.signal_name}</span>
                      <span className="text-[10px] text-[#94a3b8]">{a.anomaly_id}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#cbd5e1]">
                      <span>Observed: <strong className="text-[#ef4444]">{a.observed_value} {a.unit}</strong></span>
                      <span>Expected: {a.expected_range}</span>
                    </div>
                    <div className="text-[10px] text-[#fca5a5] pt-0.5">
                      Violated: {a.rule_violated}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#94a3b8] bg-[#0b1329]/60 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
                  <span>No envelope anomalies observed in active telemetry stream.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

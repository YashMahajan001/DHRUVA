import React from 'react';
import { DashboardProvider } from '../context/FaultDiagnosticsContext';
import { ControlBar } from '../components/faults/ControlBar';
import { EngineSelectorTabs } from '../components/faults/EngineSelectorTabs';
import { MissionInfoBar } from '../components/faults/MissionInfoBar';
import { Section1DigitalTwin } from '../components/faults/Section1DigitalTwin';
import { Section2EngineMetrics } from '../components/faults/Section2EngineMetrics';
import { Section3FaultsAndTelemetry } from '../components/faults/Section3FaultsAndTelemetry';
import { Section4RootCauseAnalysis } from '../components/faults/Section4RootCauseAnalysis';
import { Section5AiCopilot } from '../components/faults/Section5AiCopilot';
import { Section6PredictiveMaintenance } from '../components/faults/Section6PredictiveMaintenance';
import { Section7DiagnosticHistory } from '../components/faults/Section7DiagnosticHistory';
import { Modals } from '../components/faults/Modals';
import { ToastNotification } from '../components/faults/ToastNotification';

import { useState } from 'react';
import { Layers, Activity, GitFork, Wrench, LayoutGrid, ArrowDown } from 'lucide-react';

type DiagnosticViewMode = 'all' | 'twin-telemetry' | 'root-cause' | 'predictive-audit';

const FaultDiagnosticsContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<DiagnosticViewMode>('all');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0e1320] text-[#dee2f5] p-4 sm:p-6 lg:p-8 tactical-grid">
      {/* Subtle Aerospace Glow Elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#ffb4ab]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* MAIN CONTENT CONTAINER */}
      <div className="w-full flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* Mission Operational Info HUD Bar */}
        <MissionInfoBar />

        {/* Top Control Bar & Action Triggers */}
        <ControlBar />

        {/* Engine Selector Tabs (Engines 01 - 04) */}
        <EngineSelectorTabs />

        {/* OPERATIONAL VIEW MODE & QUICK SECTION SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b29]/90 backdrop-blur-md p-2.5 rounded-xl border border-[#3b494b]/30 shadow-lg">
          <div className="flex items-center gap-1.5 p-1 bg-[#090e1b] rounded-lg border border-[#3b494b]/40">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Dossier (All Data)</span>
            </button>
            <button
              onClick={() => setViewMode('twin-telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'twin-telemetry'
                  ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Twin & Telemetry</span>
            </button>
            <button
              onClick={() => setViewMode('root-cause')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'root-cause'
                  ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Root-Cause & Copilot</span>
            </button>
            <button
              onClick={() => setViewMode('predictive-audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'predictive-audit'
                  ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Predictive RUL & Audit</span>
            </button>
          </div>

          {/* Quick Jump Shortcuts in 'all' mode */}
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="text-slate-500">QUICK JUMP:</span>
            <button
              onClick={() => scrollToSection('section-1-digital-twin')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #3D-Twin
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-2-engine-metrics')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #KPIs
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-3-faults-and-telemetry')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #Active-Faults
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-4-root-cause-analysis')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #Root-Cause
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-5-ai-copilot')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #Copilot
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-6-predictive-maintenance')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #RUL
            </button>
            <span>•</span>
            <button
              onClick={() => scrollToSection('section-7-diagnostic-history')}
              className="hover:text-[#00f0ff] hover:underline cursor-pointer"
            >
              #Audit-Log
            </button>
          </div>
        </div>

        {/* SECTION 1 — 3D DIGITAL TWIN / ENGINE VISUALIZATION */}
        {(viewMode === 'all' || viewMode === 'twin-telemetry') && (
          <Section1DigitalTwin />
        )}

        {/* SECTION 2 — ENGINE STATUS / KEY METRICS */}
        {(viewMode === 'all' || viewMode === 'twin-telemetry') && (
          <Section2EngineMetrics />
        )}

        {/* SECTION 3 — ACTIVE FAULTS + TELEMETRY ANALYSIS */}
        {(viewMode === 'all' || viewMode === 'twin-telemetry') && (
          <Section3FaultsAndTelemetry />
        )}

        {/* SECTION 4 — FAULT ROOT-CAUSE ANALYSIS */}
        {(viewMode === 'all' || viewMode === 'root-cause') && (
          <Section4RootCauseAnalysis />
        )}

        {/* SECTION 5 — AI DIAGNOSTIC COPILOT */}
        {(viewMode === 'all' || viewMode === 'root-cause') && (
          <Section5AiCopilot />
        )}

        {/* SECTION 6 — PREDICTIVE MAINTENANCE */}
        {(viewMode === 'all' || viewMode === 'predictive-audit') && (
          <Section6PredictiveMaintenance />
        )}

        {/* SECTION 7 — ENGINE DIAGNOSTIC HISTORY */}
        {(viewMode === 'all' || viewMode === 'predictive-audit') && (
          <Section7DiagnosticHistory />
        )}
      </div>

      {/* Global Modals (Agent Trace, Scenario Sim, Work Order, Export) */}
      <Modals />

      {/* Tactical Toast Notifications */}
      <ToastNotification />
    </div>
  );
};

export const FaultDiagnostics: React.FC = () => {
  return (
    <DashboardProvider>
      <FaultDiagnosticsContent />
    </DashboardProvider>
  );
};

export default FaultDiagnostics;

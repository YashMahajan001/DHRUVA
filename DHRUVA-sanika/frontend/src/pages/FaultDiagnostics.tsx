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

const FaultDiagnosticsContent: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#0e1320] text-[#dee2f5] p-4 sm:p-6 lg:p-8 tactical-grid">
      {/* Subtle Aerospace Glow Elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#ffb4ab]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* MAIN CONTENT CONTAINER (Approx 1200 - 1500px Desktop Width) */}
      <div className="w-full flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* Mission Operational Info HUD Bar */}
        <MissionInfoBar />

        {/* Top Control Bar & Action Triggers */}
        <ControlBar />

        {/* Engine Selector Tabs (Engines 01 - 04) */}
        <EngineSelectorTabs />

        {/* SECTION 1 — 3D DIGITAL TWIN / ENGINE VISUALIZATION (HERO - DOMINANT TOP) */}
        <Section1DigitalTwin />

        {/* SECTION 2 — ENGINE STATUS / KEY METRICS (8 EVENLY SIZED COMPACT CARDS) */}
        <Section2EngineMetrics />

        {/* SECTION 3 — ACTIVE FAULTS + TELEMETRY ANALYSIS (CLEAN 2-COLUMN WORKSPACE) */}
        <Section3FaultsAndTelemetry />

        {/* SECTION 4 — FAULT ROOT-CAUSE ANALYSIS (FULL-WIDTH BAYESIAN ENGINE) */}
        <Section4RootCauseAnalysis />

        {/* SECTION 5 — AI DIAGNOSTIC COPILOT (FULL-WIDTH ADVISORY COPILOT) */}
        <Section5AiCopilot />

        {/* SECTION 6 — PREDICTIVE MAINTENANCE (FULL-WIDTH RUL & LIFECYCLE PANEL) */}
        <Section6PredictiveMaintenance />

        {/* SECTION 7 — ENGINE DIAGNOSTIC HISTORY (FULL-WIDTH AUDIT LOG & TABLE) */}
        <Section7DiagnosticHistory />
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

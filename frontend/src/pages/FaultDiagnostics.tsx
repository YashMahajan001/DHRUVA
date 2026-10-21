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
    <div className="w-full min-h-screen bg-[#090e1b] text-[#dee2f5] p-3 sm:p-4 lg:p-5 tactical-grid">
      {/* Subtle Aerospace Background Glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#ffb4ab]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* MAIN CONTENT CONTAINER */}
      <div className="w-full flex flex-col gap-3.5 max-w-[1600px] mx-auto">
        {/* A. Flight Mission HUD Bar */}
        <MissionInfoBar />

        {/* B. Compact Page Header */}
        <ControlBar />

        {/* C. Engine Unit Selector */}
        <EngineSelectorTabs />

        {/* D. Primary Diagnostic Overview (Key Metrics & Health) */}
        <Section2EngineMetrics />

        {/* E. Main Analysis Workspace: 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column: Interactive Engine Digital Twin (7 cols) */}
          <div className="lg:col-span-7">
            <Section1DigitalTwin />
          </div>

          {/* Right Column: Prioritized Active Faults & Telemetry (5 cols) */}
          <div className="lg:col-span-5">
            <Section3FaultsAndTelemetry />
          </div>
        </div>

        {/* F. Consolidated Root Cause Analysis & AI Copilot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left: Bayesian Root-Cause Analysis (6 cols) */}
          <div className="lg:col-span-6">
            <Section4RootCauseAnalysis />
          </div>

          {/* Right: AI Diagnostic Copilot & Safety Pipeline (6 cols) */}
          <div className="lg:col-span-6">
            <Section5AiCopilot />
          </div>
        </div>

        {/* G. Predictive Maintenance & RUL */}
        <Section6PredictiveMaintenance />

        {/* H. Historical Telemetry & Audit Log (Collapsible) */}
        <Section7DiagnosticHistory />
      </div>

      {/* Global Modals (Scenario Sim, Work Order, Export) */}
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

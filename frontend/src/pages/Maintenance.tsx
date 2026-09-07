import React from 'react';
import { MissionProvider as MaintenanceContextProvider } from '../context/MaintenanceContext';
import { CommandHeader } from '../components/health/CommandHeader';
import { MetricKpiCards } from '../components/health/MetricKpiCards';
import { LiveTelemetryStrip } from '../components/health/LiveTelemetryStrip';
import { PriorityQueue } from '../components/health/PriorityQueue';
import { AiAdvisorPanel } from '../components/ai-agent/AiAdvisorPanel';
import { TelemetryChartSection } from '../components/health/TelemetryChartSection';
import { DigitalTwinCutaway } from '../components/health/DigitalTwinCutaway';
import { SortieTimeline } from '../components/health/SortieTimeline';
import { SubsystemHealthTable } from '../components/health/SubsystemHealthTable';
import { AirworthinessDirectiveModal } from '../components/common/AirworthinessDirectiveModal';
import { WorkOrderModal } from '../components/common/WorkOrderModal';
import { SensorInspectorModal } from '../components/common/SensorInspectorModal';
import { DigitalTwinModal } from '../components/common/DigitalTwinModal';
import { FutureScreenModal } from '../components/common/FutureScreenModal';

const MaintenanceContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-full pb-12 bg-[#0e1320] text-[#dee2f5]">
      {/* Top Command Bar & Engine Selector */}
      <CommandHeader />

      {/* Main Content Body */}
      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-6 max-w-[1720px] w-full mx-auto">
        {/* Row 1: KPI Cards */}
        <section aria-label="Key Performance Indicators">
          <MetricKpiCards />
        </section>

        {/* Row 2: Live Telemetry Gauges Matrix */}
        <section aria-label="Live Telemetry Gauges">
          <LiveTelemetryStrip />
        </section>

        {/* Row 3: Two-Column Aerospace Operational Command Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Priority Queue & Diagnostics */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <section aria-label="Maintenance Priority Queue">
              <PriorityQueue />
            </section>

            <section aria-label="Telemetry Chart">
              <TelemetryChartSection />
            </section>

            <section aria-label="Sortie Schedule Timeline">
              <SortieTimeline />
            </section>

            <section aria-label="Propulsion Subsystem Table">
              <SubsystemHealthTable />
            </section>
          </div>

          {/* Right Column: Digital Twin Hologram & AI Diagnostic Advisor */}
          <div className="xl:col-span-5 flex flex-col gap-6 xl:sticky xl:top-20">
            <section aria-label="Digital Twin Cutaway Viewport">
              <DigitalTwinCutaway />
            </section>

            <section aria-label="AI Diagnostic Advisor">
              <AiAdvisorPanel />
            </section>
          </div>
        </div>
      </main>

      {/* Global Tactical Modals */}
      <AirworthinessDirectiveModal />
      <WorkOrderModal />
      <SensorInspectorModal />
      <DigitalTwinModal />
      <FutureScreenModal />
    </div>
  );
};

export const Maintenance: React.FC = () => {
  return (
    <MaintenanceContextProvider>
      <MaintenanceContent />
    </MaintenanceContextProvider>
  );
};

export default Maintenance;

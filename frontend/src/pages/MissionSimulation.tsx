import React from 'react';
import { DashboardProvider as MissionSimulationProvider } from '../context/MissionSimulationContext';
import { TopControlStrip } from '../components/missions/TopControlStrip';
import { TwinSpecCard } from '../components/missions/TwinSpecCard';
import { ProfileCalibrationCard } from '../components/missions/ProfileCalibrationCard';
import { FaultInjectionCard } from '../components/missions/FaultInjectionCard';
import { TacticalMapCard } from '../components/missions/TacticalMapCard';
import { TelemetryChartCard } from '../components/missions/TelemetryChartCard';
import { TwinCutawayCard } from '../components/missions/TwinCutawayCard';
import { PredictedHealthCard } from '../components/missions/PredictedHealthCard';
import { ThermalMatrixCard } from '../components/missions/ThermalMatrixCard';
import { FluidicsCard } from '../components/missions/FluidicsCard';
import { CopilotDrawer } from '../components/missions/CopilotDrawer';
import { AlertsDrawer } from '../components/missions/AlertsDrawer';
import { EngineSelectorModal } from '../components/missions/EngineSelectorModal';

const MissionSimulationContent: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#0e1320] text-[#dee2f5] flex flex-col">
      {/* Top Mission Control Strip */}
      <TopControlStrip />

      {/* 3-Column Tactical Command Bench */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 bg-[#0e1320] flex-1">
        {/* LEFT COLUMN: Bench Config & Fault Injection (3 cols) */}
        <aside className="xl:col-span-3 flex flex-col gap-4">
          <TwinSpecCard />
          <ProfileCalibrationCard />
          <FaultInjectionCard />
        </aside>

        {/* CENTER COLUMN: Tactical Map & Profile Visualizer (6 cols) */}
        <section className="xl:col-span-6 flex flex-col gap-4">
          <TacticalMapCard />
          <TelemetryChartCard />
          <TwinCutawayCard />
        </section>

        {/* RIGHT COLUMN: Telemetry & Predictive Metrics (3 cols) */}
        <aside className="xl:col-span-3 flex flex-col gap-4">
          <PredictedHealthCard />
          <ThermalMatrixCard />
          <FluidicsCard />
        </aside>
      </div>

      {/* Interactive Overlays */}
      <CopilotDrawer />
      <AlertsDrawer />
      <EngineSelectorModal />
    </div>
  );
};

export const MissionSimulation: React.FC = () => {
  return (
    <MissionSimulationProvider>
      <MissionSimulationContent />
    </MissionSimulationProvider>
  );
};

export default MissionSimulation;

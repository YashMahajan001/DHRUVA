import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MissionDashboardProvider, useMissionDashboard } from '../context/EngineDetailsContext';
import { TopTelemetryStrip } from '../components/telemetry/TopTelemetryStrip';
import { MissionSummaryBar } from '../components/telemetry/MissionSummaryBar';
import { DigitalTwinViewport } from '../components/telemetry/DigitalTwinViewport';
import { ComponentInspector } from '../components/telemetry/ComponentInspector';
import { TelemetryWaveformChart } from '../components/telemetry/TelemetryWaveformChart';
import { AnomalyBayesianTree } from '../components/health/AnomalyBayesianTree';
import { ActiveAlertsModal } from '../components/common/ActiveAlertsModal';
import { AICopilotDrawer } from '../components/ai-agent/AICopilotDrawer';

const EngineDetailsInner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectEngine } = useMissionDashboard();

  useEffect(() => {
    if (id && selectEngine) {
      selectEngine(id);
    }
  }, [id, selectEngine]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0e1320] text-[#dee2f5] p-4 lg:p-6 space-y-6">
      {/* Top Telemetry Strip */}
      <TopTelemetryStrip />

      {/* Mission Summary & Extended Avionics Bar */}
      <MissionSummaryBar />

      {/* Main Interactive 3D Twin Viewport & Component Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[640px]">
        <DigitalTwinViewport />
        <ComponentInspector />
      </div>

      {/* Bottom Telemetry Waveform & Anomaly Isolation Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-8">
        <TelemetryWaveformChart />
        <AnomalyBayesianTree />
      </div>

      {/* Active Alerts Modal */}
      <ActiveAlertsModal />

      {/* AI Engineering Copilot Drawer */}
      <AICopilotDrawer />
    </div>
  );
};

export const EngineDetails: React.FC = () => {
  return (
    <MissionDashboardProvider>
      <EngineDetailsInner />
    </MissionDashboardProvider>
  );
};

export default EngineDetails;

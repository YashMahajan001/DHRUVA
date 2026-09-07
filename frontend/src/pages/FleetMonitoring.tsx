import React, { useState } from 'react';
import { TelemetryProvider as FleetContextProvider, useTelemetry } from '../context/FleetContext';
import { MissionSubBar } from '../components/fleet/MissionSubBar';
import { SpatialRadarView } from '../components/fleet/SpatialRadarView';
import { DigitalTwinVisual } from '../components/fleet/DigitalTwinVisual';
import { PropulsionMatrixCards } from '../components/fleet/PropulsionMatrixCards';
import { EngineTelemetryInspector } from '../components/fleet/EngineTelemetryInspector';
import { FleetMetricsAggregate } from '../components/fleet/FleetMetricsAggregate';
import { AITacticalDispatchPanel } from '../components/fleet/AITacticalDispatchPanel';
import { AirbaseReadinessPanel } from '../components/fleet/AirbaseReadinessPanel';
import { AlertsDrawerModal } from '../components/fleet/AlertsDrawerModal';
import { TacticalToast } from '../components/fleet/TacticalToast';

const FleetMonitoringContent: React.FC = () => {
  const { viewMode } = useTelemetry();
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0e1320] text-[#dee2f5]">
      {/* Sub-bar Mission Meta & Airspace Summary Header */}
      <MissionSubBar />

      {/* Main Command Tactical Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT & CENTER: Airspace Spatial Theatre Radar + Matrix Cards + Telemetry Inspector */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Spatial Radar Viewport or Digital Twin Visual */}
          {viewMode === 'radar' ? (
            <SpatialRadarView />
          ) : (
            <DigitalTwinVisual />
          )}

          {/* Squadron Alpha Detailed Propulsion Matrix Cards */}
          <PropulsionMatrixCards />

          {/* Detailed Live Engine Health & Telemetry Chart Inspector */}
          <EngineTelemetryInspector />
        </div>

        {/* RIGHT FLANK: Fleet Aggregate Telemetry & AI Tactical Advisory */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Fleet Metrics Aggregate Panel */}
          <FleetMetricsAggregate />

          {/* AI Tactical Dispatch Advisory & Copilot */}
          <AITacticalDispatchPanel />

          {/* Squadron Sortie Timeline & Airbase Summary */}
          <AirbaseReadinessPanel />
        </div>
      </div>

      {/* Interactive Alerts Modal */}
      <AlertsDrawerModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />

      {/* Tactical HUD Action Toast */}
      <TacticalToast />
    </div>
  );
};

export const FleetMonitoring: React.FC = () => {
  return (
    <FleetContextProvider>
      <FleetMonitoringContent />
    </FleetContextProvider>
  );
};

export default FleetMonitoring;

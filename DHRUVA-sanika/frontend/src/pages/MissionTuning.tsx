import React from 'react';
import { DashboardProvider as MissionTuningProvider } from '../context/MissionTuningContext';
import { StatusBanner } from '../components/tuning/StatusBanner';
import { FlightProfileConsole } from '../components/tuning/FlightProfileConsole';
import { CalibrationBench } from '../components/tuning/CalibrationBench';
import { ConfigurationComparator } from '../components/tuning/ConfigurationComparator';
import { ComparativeVisualization } from '../components/tuning/ComparativeVisualization';
import { DigitalTwinVisual } from '../components/tuning/DigitalTwinVisual';
import { SafetyEnvelope } from '../components/tuning/SafetyEnvelope';
import { LiveTelemetryModal } from '../components/tuning/LiveTelemetryModal';
import { AlertsDrawer } from '../components/tuning/AlertsDrawer';
import { CustomAssetModal } from '../components/tuning/CustomAssetModal';
import { ToastNotification } from '../components/tuning/ToastNotification';

const MissionTuningContent: React.FC = () => {
  return (
    <div id="dhruvaa-mission-tuning-page" className="flex flex-col w-full min-h-screen bg-[#0e1320] text-[#dee2f5]">
      {/* Real-time Status Banner Capsule */}
      <StatusBanner />

      {/* Main Workspace Canvas */}
      <div className="p-4 space-y-4 max-w-[1920px] mx-auto w-full">
        {/* Top Workspace Header & Flight Profile Console */}
        <FlightProfileConsole />

        {/* Primary Three-Tier Tactical Workspace Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* LEFT PANEL: Parameter Calibration Bench (3 COLS) */}
          <div className="xl:col-span-3 flex flex-col">
            <CalibrationBench />
          </div>

          {/* CENTER PANEL: Candidate Configuration Comparator (6 COLS) */}
          <div className="xl:col-span-6 flex flex-col gap-3">
            <div className="bg-[#161b29]/90 border border-[#3b494b]/30 rounded-xl p-5 shadow-lg flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Candidate Configuration Comparator Cards */}
                <ConfigurationComparator />

                {/* Comparative Visualization: Pareto vs Live Time Series */}
                <ComparativeVisualization />
              </div>

              {/* Holographic Digital Twin Cutaway HUD */}
              <DigitalTwinVisual />
            </div>
          </div>

          {/* RIGHT PANEL: Safety Validation Envelope & AI Copilot (3 COLS) */}
          <div className="xl:col-span-3 flex flex-col">
            <SafetyEnvelope />
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <LiveTelemetryModal />
      <AlertsDrawer />
      <CustomAssetModal />
      <ToastNotification />
    </div>
  );
};

export const MissionTuning: React.FC = () => {
  return (
    <MissionTuningProvider>
      <MissionTuningContent />
    </MissionTuningProvider>
  );
};

export default MissionTuning;

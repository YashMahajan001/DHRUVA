import React, { useState } from 'react';
import { useEngine } from '../context/EngineContext';
import { TacticalFlightStrip } from '../components/TacticalFlightStrip';
import { DigitalTwinHUD } from '../components/DigitalTwinHUD';
import { TelemetryCardsMatrix } from '../components/TelemetryCardsMatrix';
import { AiCopilotPanel } from '../components/AiCopilotPanel';
import { ActiveAlertsMatrix } from '../components/ActiveAlertsMatrix';
import { TelemetryTrendChart } from '../components/TelemetryTrendChart';
import { SubsystemsHealth } from '../components/SubsystemsHealth';
import { PredictiveMro } from '../components/PredictiveMro';
import { AssetReplaceModal } from '../components/AssetReplaceModal';
import { MissionSelectModal } from '../components/MissionSelectModal';

export const DashboardPage: React.FC = () => {
  const {
    engines,
    selectedEngineIndex,
    activeEngine,
    mission,
    alerts,
    mroTasks,
    telemetryHistory,
    selectedTimeRange,
    setTimeRange,
    selectedChartMetrics,
    toggleChartMetric,
    selectEngine,
    copilotMessages,
    isCopilotThinking,
    sendCopilotQuery,
    clearCopilotChat,
    dismissAlert,
    isTwinExpanded,
    setIsTwinExpanded,
    mediaViewMode,
    setMediaViewMode,
  } = useEngine();

  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState<boolean>(false);
  const [customAssetUrl, setCustomAssetUrl] = useState<string>('');

  if (!engines || engines.length === 0 || !activeEngine) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-[#00f0ff] font-mono text-sm">
        <span className="w-3 h-3 rounded-full bg-[#00f0ff] animate-ping mr-3"></span>
        INITIALIZING SYNTHETIC DIGITAL TWIN BUS...
      </div>
    );
  }

  return (
    <div id="dhruvaa-main-dashboard" className="flex flex-col w-full text-[#dee2f5]">
      {/* 1. TOP TACTICAL FLIGHT STRIP */}
      <TacticalFlightStrip
        mission={mission}
        engines={engines}
        selectedEngineIndex={selectedEngineIndex}
        onSelectEngine={selectEngine}
        onOpenMissionModal={() => setIsMissionModalOpen(true)}
      />

      {/* 2. MAIN OPERATIONAL GRID (HUD Viewport + Right AI/Alerts Dock) */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-3 p-3">
        {/* LEFT & CENTER: Cinematic Drone Viewport & Digital Twin Matrix (7 cols xl, 8 cols 2xl) */}
        <div className="xl:col-span-7 2xl:col-span-8 flex flex-col gap-3">
          {/* CINEMATIC HUD & DIGITAL TWIN OVERLAY CANVAS */}
          <DigitalTwinHUD
            engine={activeEngine}
            mission={mission}
            isExpanded={isTwinExpanded}
            onToggleExpand={() => setIsTwinExpanded(!isTwinExpanded)}
            onOpenAssetModal={() => setIsAssetModalOpen(true)}
            customAssetUrl={customAssetUrl}
            viewMode={mediaViewMode}
            onChangeViewMode={setMediaViewMode}
          />

          {/* TECHNICAL TELEMETRY CARD & COMPACT HUD PARAMETER MATRIX */}
          <TelemetryCardsMatrix telemetry={activeEngine.telemetry} />
        </div>

        {/* RIGHT DOCK: AEROSPACE AGENTIC AI COPILOT & ACTIVE ALERTS MATRIX (5 cols xl, 4 cols 2xl) */}
        <div className="xl:col-span-5 2xl:col-span-4 flex flex-col gap-3">
          {/* AI COPILOT INTERACTIVE PANEL */}
          <AiCopilotPanel
            messages={copilotMessages}
            isThinking={isCopilotThinking}
            onSendQuery={sendCopilotQuery}
            onClearChat={clearCopilotChat}
          />

          {/* ACTIVE ALERTS MATRIX */}
          <ActiveAlertsMatrix
            alerts={alerts}
            onInspectEngine={selectEngine}
            onDismissAlert={dismissAlert}
          />
        </div>
      </div>

      {/* 3. BOTTOM MULTI-PANEL DOCK: Live Historical Graph + Subsystems + Predictive Maintenance */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 -mt-1">
        {/* Live Multi-Param Historical Line Chart (6 cols) */}
        <div className="lg:col-span-6">
          <TelemetryTrendChart
            historyData={telemetryHistory}
            selectedMetrics={selectedChartMetrics}
            onToggleMetric={toggleChartMetric}
            selectedTimeRange={selectedTimeRange}
            onSelectTimeRange={setTimeRange}
          />
        </div>

        {/* Subsystem Health Breakdown (3 cols) */}
        <div className="lg:col-span-3">
          <SubsystemsHealth
            subsystems={activeEngine.twinState.subsystems}
            confidence={activeEngine.twinState.confidence}
            syncStatus={activeEngine.twinState.syncStatus}
          />
        </div>

        {/* Upcoming Predictive Maintenance Task View (3 cols) */}
        <div className="lg:col-span-3">
          <PredictiveMro tasks={mroTasks} onSelectEngine={selectEngine} />
        </div>
      </div>

      {/* MODALS */}
      <AssetReplaceModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        currentAssetUrl={customAssetUrl}
        onSaveAssetUrl={(url) => {
          setCustomAssetUrl(url);
          if (url) setMediaViewMode('uav_feed');
        }}
      />

      <MissionSelectModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        currentMission={mission}
        onUpdateMission={(updated) => {
          Object.assign(mission, updated);
        }}
      />
    </div>
  );
};

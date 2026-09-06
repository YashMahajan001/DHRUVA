import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  EngineInstance,
  Mission,
  SubsystemState,
  SubsystemId,
  TelemetryReading,
  FaultEvent,
  TimeRange,
  RenderMode,
  ViewportAssetMode,
  CopilotMessage
} from '../types/engineDetailsTypes';
import {
  INITIAL_ENGINES,
  INITIAL_MISSIONS,
  INITIAL_SUBSYSTEMS,
  INITIAL_ALERTS,
  INITIAL_TELEMETRY
} from '../services/engineDetailsTelemetryService';
import { apiService } from '../services/engineDetailsApi';
import { askEngineeringCopilot } from '../services/engineDetailsCopilotService';

interface MissionDashboardContextType {
  // Engine & Mission
  engines: EngineInstance[];
  selectedEngine: EngineInstance;
  selectEngine: (id: string) => void;
  missions: Mission[];
  selectedMission: Mission;
  selectMission: (id: string) => void;

  // Subsystems
  subsystems: Record<SubsystemId, SubsystemState>;
  selectedSubsystemId: SubsystemId;
  selectedSubsystem: SubsystemState;
  selectSubsystem: (id: SubsystemId) => void;

  // Live Telemetry
  telemetry: TelemetryReading;
  telemetryHistory: TelemetryReading[];
  isStreamPaused: boolean;
  toggleTelemetryPause: () => void;
  timeRange: TimeRange;
  setTimeRange: (tr: TimeRange) => void;

  // Visual Viewport
  cameraRotation: number;
  cameraZoom: number;
  isometricOffset: number;
  renderMode: RenderMode;
  assetMode: ViewportAssetMode;
  rotateTwin: (delta: number) => void;
  zoomTwin: (delta: number) => void;
  resetTwinView: () => void;
  setIsometricOffset: (val: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  setAssetMode: (mode: ViewportAssetMode) => void;
  customAssetUrl: string | null;
  setCustomAssetUrl: (url: string | null) => void;

  // Tactical Actions
  isCalibrating: boolean;
  runTwinCalibration: () => void;
  stressSimulationActive: boolean;
  toggleStressSimulation: () => void;

  // Alerts
  alerts: FaultEvent[];
  unreadAlertCount: number;
  acknowledgeAlert: (id: string) => void;
  isAlertsModalOpen: boolean;
  setIsAlertsModalOpen: (open: boolean) => void;

  // AI Copilot
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  copilotMessages: CopilotMessage[];
  sendCopilotQuestion: (question: string) => Promise<void>;
  isCopilotThinking: boolean;

  // Export / Diagnostic Target
  activeTargetLabel: string;
  exportSubsystemLogs: () => void;
  notificationMessage: string | null;
}

const MissionDashboardContext = createContext<MissionDashboardContextType | undefined>(undefined);

export const MissionDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [engines, setEngines] = useState<EngineInstance[]>(INITIAL_ENGINES);
  const [selectedEngine, setSelectedEngine] = useState<EngineInstance>(INITIAL_ENGINES[0]);

  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [selectedMission, setSelectedMission] = useState<Mission>(INITIAL_MISSIONS[0]);

  const [subsystems, setSubsystems] = useState<Record<SubsystemId, SubsystemState>>(INITIAL_SUBSYSTEMS);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<SubsystemId>('cylinder');

  const [telemetry, setTelemetry] = useState<TelemetryReading>(INITIAL_TELEMETRY);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryReading[]>([INITIAL_TELEMETRY]);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('10s');

  const [cameraRotation, setCameraRotation] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [isometricOffset, setIsometricOffset] = useState(0);
  const [renderMode, setRenderMode] = useState<RenderMode>('holo');
  const [assetMode, setAssetMode] = useState<ViewportAssetMode>('engine_twin');
  const [customAssetUrl, setCustomAssetUrl] = useState<string | null>(null);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [stressSimulationActive, setStressSimulationActive] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<FaultEvent[]>(INITIAL_ALERTS);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `DHRUVAA AI Copilot initialized. Monitoring Rotax 915iS digital twin in mission phase "${selectedMission.phase}". Telemetry streaming on Port 9443. How can I assist with engine health analysis?`,
      timestamp: '14:28:09 UTC'
    }
  ]);

  // Handle live telemetry subscription
  useEffect(() => {
    const unsubscribe = apiService.subscribeTelemetry((newReading) => {
      if (!isStreamPaused) {
        setTelemetry(newReading);
        setTelemetryHistory((prev) => {
          const next = [...prev, newReading];
          // Keep up to 60 readings in memory for responsive smooth charts
          return next.slice(-60);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isStreamPaused]);

  // Load initial backend data if API endpoint is configured
  useEffect(() => {
    apiService.getEngines().then(setEngines);
    apiService.getMissions().then(setMissions);
    apiService.getSubsystems().then(setSubsystems);
    apiService.getAlerts().then(setAlerts);
  }, []);

  const selectEngine = useCallback((id: string) => {
    const match = engines.find(e => e.id === id);
    if (match) {
      setSelectedEngine(match);
      setNotificationMessage(`Switched active engine to: ${match.model} (${match.id})`);
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  }, [engines]);

  const selectMission = useCallback((id: string) => {
    const match = missions.find(m => m.id === id);
    if (match) {
      setSelectedMission(match);
      setNotificationMessage(`Switched mission profile to: ${match.callsign}`);
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  }, [missions]);

  const selectSubsystem = useCallback((id: SubsystemId) => {
    setSelectedSubsystemId(id);
  }, []);

  const toggleTelemetryPause = useCallback(() => {
    setIsStreamPaused(prev => !prev);
  }, []);

  const rotateTwin = useCallback((delta: number) => {
    setCameraRotation(prev => (prev + delta) % 360);
  }, []);

  const zoomTwin = useCallback((delta: number) => {
    setCameraZoom(prev => Math.min(Math.max(0.6, prev + delta), 2.2));
  }, []);

  const resetTwinView = useCallback(() => {
    setCameraRotation(0);
    setCameraZoom(1.0);
    setIsometricOffset(0);
  }, []);

  const runTwinCalibration = useCallback(() => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setNotificationMessage('CALIBRATION SWEEP IN PROGRESS // Synchronizing Kalman filters with physical sensor nodes...');

    setTimeout(() => {
      setIsCalibrating(false);
      setNotificationMessage('CALIBRATION COMPLETE // Kalman residual verified ±0.014 V.');
      setTimeout(() => setNotificationMessage(null), 3500);
    }, 2000);
  }, [isCalibrating]);

  const toggleStressSimulation = useCallback(() => {
    const nextStress = !stressSimulationActive;
    setStressSimulationActive(nextStress);
    apiService.setStressMode(nextStress);

    if (nextStress) {
      setNotificationMessage('WARNING: SIMULATED STRESS INJECTED // High thermal load & vibration spike triggered.');
      const stressAlert: FaultEvent = {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        severity: 'CRITICAL',
        subsystem: 'cylinder',
        component: 'Cylinder #1 Combustion Chamber',
        code: 'SIM_STRESS_OVR',
        description: 'Simulated thermal overload: CHT exceeded 198°C and vibration amplitude crossed 4.5 mm/s threshold.',
        acknowledged: false,
        actionRequired: 'Simulated test event. Check cooling loop flow.'
      };
      setAlerts(prev => [stressAlert, ...prev]);
    } else {
      setNotificationMessage('Simulated stress normalized. Returning to nominal cruise parameters.');
      setTimeout(() => setNotificationMessage(null), 3500);
    }
  }, [stressSimulationActive]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    apiService.acknowledgeAlert(id);
  }, []);

  const exportSubsystemLogs = useCallback(() => {
    const subsys = subsystems[selectedSubsystemId];
    const logData = {
      engine: selectedEngine.id,
      subsystem: subsys.name,
      health: subsys.health,
      telemetrySnapshot: telemetry,
      exportTimestamp: new Date().toISOString(),
      integrityMatrixConfidence: subsys.confidence
    };
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhruvaa-${selectedEngine.id}-${subsys.id}-telemetry-log.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotificationMessage(`Exported high-frequency telemetry logs for ${subsys.name}.`);
    setTimeout(() => setNotificationMessage(null), 3000);
  }, [selectedEngine, selectedSubsystemId, subsystems, telemetry]);

  const sendCopilotQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC'
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const response = await askEngineeringCopilot(question, {
        engine: selectedEngine,
        telemetry,
        activeSubsystem: subsystems[selectedSubsystemId],
        alerts
      });

      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response,
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        telemetrySnapshot: {
          rpm: telemetry.rpm,
          cht: telemetry.chtAvg,
          health: selectedEngine.healthScore,
          rul: selectedEngine.rulHours,
          vibe: telemetry.vibrationAmplitude
        }
      };

      setCopilotMessages(prev => [...prev, assistantMsg]);
    } catch {
      setCopilotMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to complete inference with synthetic digital twin. Check local sensor bus telemetry stream.',
          timestamp: new Date().toISOString().substring(11, 19) + ' UTC'
        }
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  }, [alerts, selectedEngine, selectedSubsystemId, subsystems, telemetry]);

  const selectedSubsystem = subsystems[selectedSubsystemId] || subsystems.cylinder;
  const unreadAlertCount = alerts.filter(a => !a.acknowledged).length;
  const activeTargetLabel = isCalibrating
    ? 'CALIBRATION SWEEP IN PROGRESS...'
    : `${selectedSubsystem.name} // SUBSYS`;

  return (
    <MissionDashboardContext.Provider
      value={{
        engines,
        selectedEngine,
        selectEngine,
        missions,
        selectedMission,
        selectMission,
        subsystems,
        selectedSubsystemId,
        selectedSubsystem,
        selectSubsystem,
        telemetry,
        telemetryHistory,
        isStreamPaused,
        toggleTelemetryPause,
        timeRange,
        setTimeRange,
        cameraRotation,
        cameraZoom,
        isometricOffset,
        renderMode,
        assetMode,
        rotateTwin,
        zoomTwin,
        resetTwinView,
        setIsometricOffset,
        setRenderMode,
        setAssetMode,
        customAssetUrl,
        setCustomAssetUrl,
        isCalibrating,
        runTwinCalibration,
        stressSimulationActive,
        toggleStressSimulation,
        alerts,
        unreadAlertCount,
        acknowledgeAlert,
        isAlertsModalOpen,
        setIsAlertsModalOpen,
        isCopilotOpen,
        setIsCopilotOpen,
        copilotMessages,
        sendCopilotQuestion,
        isCopilotThinking,
        activeTargetLabel,
        exportSubsystemLogs,
        notificationMessage
      }}
    >
      {children}
    </MissionDashboardContext.Provider>
  );
};

export const useMissionDashboard = (): MissionDashboardContextType => {
  const context = useContext(MissionDashboardContext);
  if (!context) {
    throw new Error('useMissionDashboard must be used within a MissionDashboardProvider');
  }
  return context;
};

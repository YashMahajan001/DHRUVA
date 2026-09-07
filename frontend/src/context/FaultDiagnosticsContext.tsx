import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  EngineId,
  EngineInstance,
  LiveTelemetry,
  TelemetryPoint,
  TwinState,
  FaultEvent,
  Mission,
  AiDiagnosticInsight,
  SubsystemHealth,
  CopilotMessage,
} from '../types/faultTypes';
import {
  ENGINES_DATABASE,
  ACTIVE_MISSION,
  TelemetryService,
  getInitialLiveTelemetry,
} from '../services/faultTelemetryApi';

interface DashboardContextType {
  // Engines & Selection
  engines: EngineInstance[];
  selectedEngineId: EngineId;
  selectedEngine: EngineInstance;
  selectEngine: (id: EngineId) => void;

  // Mission
  mission: Mission;

  // Live Telemetry
  telemetry: LiveTelemetry;
  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;
  historicalData: TelemetryPoint[];

  // Subsystems & Twin
  subsystems: SubsystemHealth[];
  twinState: TwinState;
  activeHotspotId: number | null;
  setActiveHotspotId: (id: number | null) => void;

  // Alerts & Diagnostics
  alerts: FaultEvent[];
  diagnosticInsight: AiDiagnosticInsight;
  acknowledgeAlert: (id: string) => void;

  // Timeline Scrubber
  scrubProgressPct: number;
  setScrubProgressPct: (pct: number) => void;
  isPlaying: boolean;
  togglePlayhead: () => void;
  stepScrub: (delta: number) => void;
  focusAnomalyWindow: () => void;

  // Time Range
  timeRange: string;
  setTimeRange: (range: string) => void;

  // AI Copilot
  copilotMessages: CopilotMessage[];
  isAiResponding: boolean;
  sendCopilotQuery: (prompt: string) => Promise<void>;
  isCopilotExpanded: boolean;
  setIsCopilotExpanded: (val: boolean) => void;

  // Modals & User Feedback
  activeModal: 'agent-trace' | 'scenario-sim' | 'work-order' | 'telemetry-export' | null;
  openModal: (modal: 'agent-trace' | 'scenario-sim' | 'work-order' | 'telemetry-export') => void;
  closeModal: () => void;
  toast: { show: boolean; message: string; type?: 'info' | 'success' | 'warning' | 'error' };
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

  // Actions
  runFullSweep: () => void;
  injectScenarioFault: (scenarioName: string) => void;
  exportTelemetryLog: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Engine 02 (UAV-PT-BRAVO) as designed in the Stitch mockup
  const [selectedEngineId, setSelectedEngineId] = useState<EngineId>('eng-02');
  const [engines, setEngines] = useState<EngineInstance[]>(Object.values(ENGINES_DATABASE));
  const [mission] = useState<Mission>(ACTIVE_MISSION);

  const selectedEngine = engines.find(e => e.id === selectedEngineId) || engines[1];

  // Telemetry state
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(() => getInitialLiveTelemetry('eng-02'));
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('SORTIE');
  const [historicalData, setHistoricalData] = useState<TelemetryPoint[]>(() =>
    TelemetryService.getTelemetryHistory('eng-02', 'SORTIE')
  );

  // Subsystems & Twin
  const [subsystems, setSubsystems] = useState<SubsystemHealth[]>(() => TelemetryService.getSubsystems('eng-02'));
  const [twinState, setTwinState] = useState<TwinState>(() => TelemetryService.getTwinState('eng-02'));
  const [activeHotspotId, setActiveHotspotId] = useState<number | null>(2);

  // Diagnostics & Alerts
  const [alerts, setAlerts] = useState<FaultEvent[]>(() => TelemetryService.getActiveAlerts('eng-02'));
  const [diagnosticInsight, setDiagnosticInsight] = useState<AiDiagnosticInsight>(() =>
    TelemetryService.getDiagnosticInsight('eng-02')
  );

  // Timeline scrubber
  const [scrubProgressPct, setScrubProgressPct] = useState<number>(75);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // AI Copilot Messages
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: '14:28:44 UTC',
      content:
        'AUTONOMIC COPILOT ONLINE // Monitored: UAV-PT-BRAVO (ENG-02).\nCylinder #2 thermal acceleration anomaly flagged (Level 2 Flight Warning). Ready for engineering queries or parameter cross-checks.',
      suggestedQuestions: [
        'Why is engine health decreasing?',
        'What is the current RUL?',
        'Why is CHT increasing?',
        'Are there any active faults?',
      ],
    },
  ]);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [isCopilotExpanded, setIsCopilotExpanded] = useState<boolean>(false);

  // Modals & Toast
  const [activeModal, setActiveModal] = useState<'agent-trace' | 'scenario-sim' | 'work-order' | 'telemetry-export' | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'info' | 'success' | 'warning' | 'error' }>({
    show: false,
    message: '',
  });

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3600);
  }, []);

  // Sync state when engine changes
  const selectEngine = useCallback((engId: EngineId) => {
    setSelectedEngineId(engId);
    setTelemetry(getInitialLiveTelemetry(engId));
    setSubsystems(TelemetryService.getSubsystems(engId));
    setTwinState(TelemetryService.getTwinState(engId));
    setDiagnosticInsight(TelemetryService.getDiagnosticInsight(engId));
    setHistoricalData(TelemetryService.getTelemetryHistory(engId, timeRange));
    setActiveHotspotId(engId === 'eng-02' ? 2 : engId === 'eng-03' ? 1 : null);

    const target = ENGINES_DATABASE[engId];
    showToast(`Switched active telemetry feed to ${target.name} (${target.callsign}).`, 'info');
  }, [timeRange, showToast]);

  // Real-time live simulation ticker
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const next = TelemetryService.simulateNextTelemetry(prev, selectedEngineId);
        return next;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedEngineId]);

  // Timeline playback ticker
  useEffect(() => {
    if (!isPlaying) return;

    const playInterval = setInterval(() => {
      setScrubProgressPct(prev => {
        const next = prev + 1;
        if (next > 100) return 0;
        return next;
      });
    }, 140);

    return () => clearInterval(playInterval);
  }, [isPlaying]);

  const togglePlayhead = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stepScrub = useCallback((delta: number) => {
    setScrubProgressPct(prev => {
      const next = Math.max(0, Math.min(100, prev + delta));
      return next;
    });
  }, []);

  const focusAnomalyWindow = useCallback(() => {
    setScrubProgressPct(75);
    showToast('Playhead synchronized with primary transient anomaly trigger (T+03:22:15).', 'success');
  }, [showToast]);

  const toggleLiveStreaming = useCallback(() => {
    setIsLiveStreaming(prev => {
      const next = !prev;
      showToast(next ? 'Live telemetry stream resumed (50 Hz).' : 'Telemetry stream paused.', 'info');
      return next;
    });
  }, [showToast]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    showToast(`Fault event ${id} acknowledged by Flight Controller.`, 'info');
  }, [showToast]);

  // Send Copilot Query
  const sendCopilotQuery = useCallback(async (prompt: string) => {
    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      content: prompt,
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setIsAiResponding(true);

    try {
      // Simulate real-time reasoning delay
      await new Promise(r => setTimeout(r, 600));

      const answer = TelemetryService.generateAiResponse(
        prompt,
        selectedEngine,
        telemetry,
        diagnosticInsight
      );

      const aiMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        content: answer,
        telemetrySnapshot: {
          engineId: selectedEngine.id,
          rpm: telemetry.rpm,
          cht: telemetry.cht,
          egt: telemetry.egt,
          health: selectedEngine.healthPercent,
          rul: selectedEngine.rulHours,
        },
      };

      setCopilotMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsAiResponding(false);
    }
  }, [selectedEngine, telemetry, diagnosticInsight]);

  // Actions
  const runFullSweep = useCallback(() => {
    showToast('Autonomic Reasoner: Executing 24-channel heuristic sweep across all propulsion units...', 'info');
    setTimeout(() => {
      showToast('Sweep Complete: 0 critical bus faults. Engine 02 cylinder 2 thermal restriction confirmed.', 'success');
    }, 1200);
  }, [showToast]);

  const injectScenarioFault = useCallback((scenarioName: string) => {
    showToast(`Scenario Injected: "${scenarioName}" in synthetic Digital Twin for ${selectedEngine.callsign}.`, 'warning');
    closeModal();
  }, [selectedEngine.callsign, showToast]);

  const exportTelemetryLog = useCallback(() => {
    const exportPayload = {
      mission: ACTIVE_MISSION.code,
      engine: selectedEngine,
      latestTelemetry: telemetry,
      historyPoints: historicalData.length,
      exportedAt: new Date().toISOString(),
      format: 'DHRUVAA_AERO_TELEMETRY_V4.2',
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DHRUVAA_${selectedEngine.id.toUpperCase()}_TELEMETRY_LOG.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported telemetry log package for ${selectedEngine.name}.`, 'success');
  }, [selectedEngine, telemetry, historicalData, showToast]);

  const openModal = useCallback((modal: 'agent-trace' | 'scenario-sim' | 'work-order' | 'telemetry-export') => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        engines,
        selectedEngineId,
        selectedEngine,
        selectEngine,
        mission,
        telemetry,
        isLiveStreaming,
        toggleLiveStreaming,
        historicalData,
        subsystems,
        twinState,
        activeHotspotId,
        setActiveHotspotId,
        alerts,
        diagnosticInsight,
        acknowledgeAlert,
        scrubProgressPct,
        setScrubProgressPct,
        isPlaying,
        togglePlayhead,
        stepScrub,
        focusAnomalyWindow,
        timeRange,
        setTimeRange,
        copilotMessages,
        isAiResponding,
        sendCopilotQuery,
        isCopilotExpanded,
        setIsCopilotExpanded,
        activeModal,
        openModal,
        closeModal,
        toast,
        showToast,
        runFullSweep,
        injectScenarioFault,
        exportTelemetryLog,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

/**
 * DHRUVAA — Mission Dashboard Context & Simulation State Manager
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  EngineInstance, 
  Mission, 
  Telemetry, 
  TwinState, 
  FaultInjections, 
  FaultEvent, 
  AICopilotMessage,
  MissionDirective
} from '../types/simulationTypes';
import { MOCK_ENGINES, MOCK_MISSIONS, apiService } from '../services/simulationApiService';
import { computeSimulatedTelemetry } from '../services/engineSimulationService';
import { copilotService } from '../services/simulationCopilotService';

export type ChartMetricMode = 'ALT_BHP' | 'RPM_FUEL' | 'THERMAL' | 'VIBE_HEALTH';
export type TimeRangeMode = '5M' | '15M' | '1H' | 'ALL';

interface DashboardContextType {
  // Engine & Mission Selection
  engines: EngineInstance[];
  selectedEngine: EngineInstance;
  selectEngine: (engine: EngineInstance) => void;
  isEngineModalOpen: boolean;
  setIsEngineModalOpen: (open: boolean) => void;

  missions: Mission[];
  selectedMission: Mission;
  selectMissionById: (missionId: string) => void;
  setDirective: (directive: MissionDirective) => void;

  // Simulation Playback
  isRunning: boolean;
  simSpeed: number;
  secondsElapsed: number;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: (seconds?: number) => void;
  setSimSpeed: (speed: number) => void;

  // Flight Parameters & Environment
  altitude: number;
  setAltitude: (alt: number) => void;
  ambientTemperature: number;
  setAmbientTemperature: (temp: number) => void;
  throttleDemandPercent: number;
  setThrottleDemandPercent: (throttle: number) => void;

  // Fault Injections
  faults: FaultInjections;
  toggleFault: (faultKey: keyof FaultInjections) => void;
  clearAllFaults: () => void;
  triggerAutoRecovery: () => void;
  isRecovering: boolean;

  // Computed Telemetry & Digital Twin State
  telemetry: Telemetry;
  twinState: TwinState;
  historicalTrend: Array<{
    time: string;
    minute: string;
    altitude: number;
    engineBhp: number;
    rpm: number;
    cht: number;
    egt: number;
    oilPressure: number;
    fuelFlow: number;
    vibration: number;
    health: number;
  }>;

  // Chart Controls
  timeRange: TimeRangeMode;
  setTimeRange: (range: TimeRangeMode) => void;
  chartMetric: ChartMetricMode;
  setChartMetric: (metric: ChartMetricMode) => void;

  // Alerts
  alerts: FaultEvent[];
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
  unacknowledgedAlertsCount: number;
  acknowledgeAlert: (id: string) => void;

  // AI Copilot
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  copilotMessages: AICopilotMessage[];
  askCopilot: (question: string) => void;
  isCopilotThinking: boolean;

  // Export
  exportTelemetry: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engines] = useState<EngineInstance[]>(MOCK_ENGINES);
  const [selectedEngine, setSelectedEngine] = useState<EngineInstance>(MOCK_ENGINES[0]);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);

  const [missions] = useState<Mission[]>(MOCK_MISSIONS);
  const [selectedMission, setSelectedMission] = useState<Mission>(MOCK_MISSIONS[0]);

  // Simulation Time starts at T+02:45:13 (9913 seconds) to match Stitch screenshot
  const [secondsElapsed, setSecondsElapsed] = useState(9913);
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);

  // Calibrations
  const [altitude, setAltitude] = useState(25000);
  const [ambientTemperature, setAmbientTemperature] = useState(-22);
  const [throttleDemandPercent, setThrottleDemandPercent] = useState(75);

  // Faults
  const [faults, setFaults] = useState<FaultInjections>({
    coolingJacketDegradation: false,
    fuelInjectorClog: false,
    lubricationPressureLeak: false,
    crankshaftRotorImbalance: false,
    chtThermocoupleDrift: false
  });
  const [isRecovering, setIsRecovering] = useState(false);

  // Chart preferences
  const [timeRange, setTimeRange] = useState<TimeRangeMode>('15M');
  const [chartMetric, setChartMetric] = useState<ChartMetricMode>('ALT_BHP');

  // Drawers
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // AI Copilot Conversation
  const [copilotMessages, setCopilotMessages] = useState<AICopilotMessage[]>([
    {
      id: 'init-msg-1',
      sender: 'assistant',
      timestamp: '14:25:00',
      text: 'DHRUVAA Engineering Copilot online. Monitoring Lycoming O-320 v4.2 propulsion telemetry in real-time. Ready to assist with thermodynamic trends, anomaly localization, or mission endurance forecasts.',
      category: 'ADVISORY'
    }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Computed Telemetry
  const { telemetry, twinState } = useMemo(() => {
    return computeSimulatedTelemetry({
      secondsElapsed,
      altitude,
      ambientTemperature,
      throttleDemandPercent,
      mission: selectedMission,
      faults
    });
  }, [secondsElapsed, altitude, ambientTemperature, throttleDemandPercent, selectedMission, faults]);

  // Evaluated Alerts
  const alerts = useMemo(() => {
    return apiService.evaluateAlerts(faults, telemetry);
  }, [faults, telemetry]);

  const unacknowledgedAlertsCount = useMemo(() => {
    return alerts.filter(a => a.severity !== 'NORMAL' && !a.acknowledged).length;
  }, [alerts]);

  const acknowledgeAlert = useCallback((id: string) => {
    // In-memory acknowledgment handler
  }, []);

  // Historical trend points
  const pointsCount = useMemo(() => {
    switch (timeRange) {
      case '5M': return 10;
      case '15M': return 20;
      case '1H': return 40;
      case 'ALL': return 60;
      default: return 20;
    }
  }, [timeRange]);

  const historicalTrend = useMemo(() => {
    return apiService.generateHistoricalTrend(pointsCount, telemetry, faults);
  }, [pointsCount, telemetry, faults]);

  // Real-time ticking effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + simSpeed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, simSpeed]);

  const startSimulation = useCallback(() => setIsRunning(true), []);
  const pauseSimulation = useCallback(() => setIsRunning(false), []);
  const resetSimulation = useCallback(() => {
    setSecondsElapsed(0);
    setFaults({
      coolingJacketDegradation: false,
      fuelInjectorClog: false,
      lubricationPressureLeak: false,
      crankshaftRotorImbalance: false,
      chtThermocoupleDrift: false
    });
  }, []);

  const stepSimulation = useCallback((seconds: number = 10) => {
    setSecondsElapsed(prev => prev + seconds);
  }, []);

  const toggleFault = useCallback((faultKey: keyof FaultInjections) => {
    setFaults(prev => ({
      ...prev,
      [faultKey]: !prev[faultKey]
    }));
  }, []);

  const clearAllFaults = useCallback(() => {
    setFaults({
      coolingJacketDegradation: false,
      fuelInjectorClog: false,
      lubricationPressureLeak: false,
      crankshaftRotorImbalance: false,
      chtThermocoupleDrift: false
    });
  }, []);

  const triggerAutoRecovery = useCallback(() => {
    setIsRecovering(true);
    setTimeout(() => {
      clearAllFaults();
      setIsRecovering(false);
      
      const recoveryMsg: AICopilotMessage = {
        id: `rec-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: 'AI Auto-Recovery sequence completed. All active synthetic anomalies cleared. Fuel flow trimmed to 26.9 L/HR and thermodynamic core returned to certified cruise thresholds.',
        category: 'ADVISORY'
      };
      setCopilotMessages(prev => [...prev, recoveryMsg]);
    }, 1200);
  }, [clearAllFaults]);

  const selectEngine = useCallback((engine: EngineInstance) => {
    setSelectedEngine(engine);
    setIsEngineModalOpen(false);
  }, []);

  const selectMissionById = useCallback((missionId: string) => {
    const found = missions.find(m => m.id === missionId || m.profileScenario === missionId);
    if (found) {
      setSelectedMission(found);
      setAltitude(found.targetAltitude);
      setAmbientTemperature(found.ambientTemperature);
      setThrottleDemandPercent(found.simulatedThrottleDemand);
    }
  }, [missions]);

  const setDirective = useCallback((directive: MissionDirective) => {
    setSelectedMission(prev => ({
      ...prev,
      directive
    }));
  }, []);

  const askCopilot = useCallback((question: string) => {
    const userMsg: AICopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: question
    };
    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    setTimeout(() => {
      const reply = copilotService.generateResponse(
        question,
        telemetry,
        twinState,
        faults,
        selectedMission
      );
      setCopilotMessages(prev => [...prev, reply]);
      setIsCopilotThinking(false);
    }, 600);
  }, [telemetry, twinState, faults, selectedMission]);

  const exportTelemetry = useCallback(() => {
    apiService.exportTelemetrySnapshot(telemetry, twinState, selectedMission);
  }, [telemetry, twinState, selectedMission]);

  const value = {
    engines,
    selectedEngine,
    selectEngine,
    isEngineModalOpen,
    setIsEngineModalOpen,

    missions,
    selectedMission,
    selectMissionById,
    setDirective,

    isRunning,
    simSpeed,
    secondsElapsed,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    stepSimulation,
    setSimSpeed,

    altitude,
    setAltitude,
    ambientTemperature,
    setAmbientTemperature,
    throttleDemandPercent,
    setThrottleDemandPercent,

    faults,
    toggleFault,
    clearAllFaults,
    triggerAutoRecovery,
    isRecovering,

    telemetry,
    twinState,
    historicalTrend,

    timeRange,
    setTimeRange,
    chartMetric,
    setChartMetric,

    alerts,
    isAlertsOpen,
    setIsAlertsOpen,
    unacknowledgedAlertsCount,
    acknowledgeAlert,

    isCopilotOpen,
    setIsCopilotOpen,
    copilotMessages,
    askCopilot,
    isCopilotThinking,

    exportTelemetry
  };

  return (
    <DashboardContext.Provider value={value}>
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

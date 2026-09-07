import React, { createContext, useContext, useEffect, useState } from 'react';
import { agentService } from '../services/agentService';
import { engineService } from '../services/engineService';
import { healthService } from '../services/healthService';
import { missionService } from '../services/missionService';
import {
  INITIAL_ALERTS,
  INITIAL_ENGINES,
  INITIAL_MISSION,
  INITIAL_MRO_TASKS,
  INITIAL_TELEMETRY_HISTORY,
} from '../services/mockData';
import { TelemetryEvent, telemetryService } from '../services/telemetryService';
import {
  CopilotMessage,
  EngineInstance,
  FaultEvent,
  MaintenanceRecord,
  Mission,
  TelemetryHistoryPoint,
} from '../types';

interface EngineContextType {
  engines: EngineInstance[];
  selectedEngineIndex: number;
  activeEngine: EngineInstance;
  mission: Mission;
  alerts: FaultEvent[];
  mroTasks: MaintenanceRecord[];
  telemetryHistory: TelemetryHistoryPoint[];
  selectedTimeRange: string;
  setTimeRange: (range: string) => void;
  selectedChartMetrics: string[];
  toggleChartMetric: (metricKey: string) => void;
  selectEngine: (indexOrId: number | string) => void;
  copilotMessages: CopilotMessage[];
  isCopilotThinking: boolean;
  sendCopilotQuery: (queryText: string) => Promise<void>;
  clearCopilotChat: () => void;
  dismissAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  isStreamActive: boolean;
  toggleStream: () => void;
  isTwinExpanded: boolean;
  setIsTwinExpanded: (expanded: boolean) => void;
  mediaViewMode: 'schematic' | 'uav_feed' | 'cad_twin';
  setMediaViewMode: (mode: 'schematic' | 'uav_feed' | 'cad_twin') => void;
  updateMission: (updates: Partial<Mission>) => void;
}

const EngineContext = createContext<EngineContextType | undefined>(undefined);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engines, setEngines] = useState<EngineInstance[]>(INITIAL_ENGINES);
  const [selectedEngineIndex, setSelectedEngineIndex] = useState<number>(0);
  const [mission, setMission] = useState<Mission>(INITIAL_MISSION);
  const [alerts, setAlerts] = useState<FaultEvent[]>(INITIAL_ALERTS);
  const [mroTasks, setMroTasks] = useState<MaintenanceRecord[]>(INITIAL_MRO_TASKS);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>(INITIAL_TELEMETRY_HISTORY);
  const [selectedTimeRange, setTimeRange] = useState<string>('30m');
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<string[]>(['cht', 'rpm', 'vibration']);
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [isTwinExpanded, setIsTwinExpanded] = useState<boolean>(false);
  const [mediaViewMode, setMediaViewMode] = useState<'schematic' | 'uav_feed' | 'cad_twin'>('schematic');

  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'COPILOT',
      timestamp: '14:20:00Z',
      text: 'DHRUVAA Tactical AI Diagnostic Copilot active. CAN-bus telemetry link established. All 4 engine propulsion twins synchronized.',
      reasoningChain: {
        observation: 'UAV-01 cruising at 18,450 FT MSL in loiter orbit.',
        evidence: 'ENG 01 & ENG 04 nominal. ENG 02 cooling shroud restriction detected (+18°C CHT). ENG 03 journal bearing harmonic vibration active (4.8 mm/s).',
        analysis: 'Recommend maintaining loiter pitch. Restrict high-speed climb on Port Outboard.',
        recommendation: 'Advisory ready. Query me regarding engine health, CHT spikes, RUL, or maintenance priorities.',
        envelope: 'STATUS: ADVISORY MODE ACTIVE',
      },
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);

  // Load initial backend data if available
  useEffect(() => {
    engineService.getEngines().then(setEngines);
    missionService.getMission().then(setMission);
    healthService.getAlerts().then(setAlerts);
    healthService.getMroTasks().then(setMroTasks);
    telemetryService.getHistory().then(setTelemetryHistory);
  }, []);

  // Listen to telemetry stream
  useEffect(() => {
    if (!isStreamActive) return;

    const unsubscribe = telemetryService.subscribe((event: TelemetryEvent) => {
      setEngines((prev) => {
        const next = [...prev];
        if (next[event.engineIndex]) {
          next[event.engineIndex] = {
            ...next[event.engineIndex],
            telemetry: event.telemetry,
            health: event.health,
          };
        }
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isStreamActive]);

  const selectEngine = (indexOrId: number | string) => {
    if (typeof indexOrId === 'number') {
      if (indexOrId >= 0 && indexOrId < engines.length) {
        setSelectedEngineIndex(indexOrId);
      }
    } else {
      const idx = engines.findIndex((e) => e.id === indexOrId || e.name.toLowerCase().includes(indexOrId.toLowerCase()));
      if (idx !== -1) {
        setSelectedEngineIndex(idx);
      }
    }
  };

  const toggleChartMetric = (metricKey: string) => {
    setSelectedChartMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((k) => k !== metricKey) : [...prev, metricKey]
    );
  };

  const toggleStream = () => {
    if (isStreamActive) {
      telemetryService.stopStreaming();
      setIsStreamActive(false);
    } else {
      telemetryService.startStreaming();
      setIsStreamActive(true);
    }
  };

  const dismissAlert = (alertId: string) => {
    healthService.dismissAlert(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const acknowledgeAlert = (alertId: string) => {
    healthService.acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const updateMission = (updates: Partial<Mission>) => {
    const updated = missionService.updateMission(updates);
    setMission(updated);
  };

  const sendCopilotQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: CopilotMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'USER',
      timestamp: new Date().toISOString().substring(11, 19) + 'Z',
      text: queryText,
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const activeEng = engines[selectedEngineIndex] || engines[0];
      const botResponse = await agentService.queryCopilot(queryText, {
        activeEngine: activeEng,
        allEngines: engines,
        mission,
        alerts,
      });

      setCopilotMessages((prev) => [...prev, botResponse]);
    } catch (e) {
      console.error('Copilot query error:', e);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const clearCopilotChat = () => {
    setCopilotMessages([]);
  };

  const activeEngine = engines[selectedEngineIndex] || engines[0];

  return (
    <EngineContext.Provider
      value={{
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
        acknowledgeAlert,
        isStreamActive,
        toggleStream,
        isTwinExpanded,
        setIsTwinExpanded,
        mediaViewMode,
        setMediaViewMode,
        updateMission,
      }}
    >
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { engineApi, TelemetryUpdateEvent } from '../services/api';
import {
  CopilotMessage,
  EngineInstance,
  FaultEvent,
  Mission,
  MroTask,
  TelemetryHistoryPoint,
} from '../types';

interface EngineContextType {
  engines: EngineInstance[];
  selectedEngineIndex: number;
  activeEngine: EngineInstance;
  mission: Mission;
  alerts: FaultEvent[];
  mroTasks: MroTask[];
  telemetryHistory: TelemetryHistoryPoint[];
  selectedTimeRange: '1m' | '5m' | '15m' | '30m' | '1h';
  setTimeRange: (range: '1m' | '5m' | '15m' | '30m' | '1h') => void;
  selectedChartMetrics: string[];
  toggleChartMetric: (metric: string) => void;
  selectEngine: (index: number) => void;
  copilotMessages: CopilotMessage[];
  isCopilotThinking: boolean;
  sendCopilotQuery: (prompt: string) => Promise<void>;
  clearCopilotChat: () => void;
  dismissAlert: (id: string) => void;
  isStreamActive: boolean;
  toggleStream: () => void;
  isTwinExpanded: boolean;
  setIsTwinExpanded: (val: boolean) => void;
  mediaViewMode: 'schematic' | 'uav_feed' | 'cad_twin';
  setMediaViewMode: (mode: 'schematic' | 'uav_feed' | 'cad_twin') => void;
  isLiveBackend: boolean;
  backendUrl: string;
}

const EngineContext = createContext<EngineContextType | undefined>(undefined);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engines, setEngines] = useState<EngineInstance[]>([]);
  const [selectedEngineIndex, setSelectedEngineIndex] = useState<number>(0);
  const [mission, setMission] = useState<Mission | null>(null);
  const [alerts, setAlerts] = useState<FaultEvent[]>([]);
  const [mroTasks, setMroTasks] = useState<MroTask[]>([]);
  const [selectedTimeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '30m' | '1h'>('1m');
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<string[]>(['rpm', 'cht', 'oil']);
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [isTwinExpanded, setIsTwinExpanded] = useState<boolean>(false);
  const [mediaViewMode, setMediaViewMode] = useState<'schematic' | 'uav_feed' | 'cad_twin'>('schematic');

  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-msg-0',
      sender: 'COPILOT',
      timestamp: '19:48:10Z',
      text: 'UAV-01 propulsion telemetry is streaming nominal. Digital twin synchronization verified at 99.4% confidence. How may I assist your flight deck today?',
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);

  // Buffer for historical chart
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>(() => {
    const initial: TelemetryHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const t = now - i * 2000;
      const d = new Date(t);
      initial.push({
        timeLabel: `-${i * 2}s`,
        timeSec: t,
        rpm: 2440 + Math.sin(i * 0.4) * 20 + Math.random() * 8,
        cht: 177 + Math.cos(i * 0.3) * 3 + Math.random() * 1.5,
        egt: 688 + Math.sin(i * 0.2) * 10 + Math.random() * 4,
        oil: 82 + (Math.random() - 0.5) * 2,
        fuel: 32.5 + (Math.random() - 0.5) * 0.6,
        vibration: 2.1 + (Math.random() - 0.5) * 0.2,
        battery: 28.2,
        alternator: 44.5,
      });
    }
    return initial;
  });

  const enginesRef = useRef<EngineInstance[]>([]);
  enginesRef.current = engines;
  const selectedIndexRef = useRef<number>(selectedEngineIndex);
  selectedIndexRef.current = selectedEngineIndex;

  // Initial load
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [fetchedMission, fetchedEngines, fetchedAlerts, fetchedMro] = await Promise.all([
        engineApi.fetchMission(),
        engineApi.fetchEngines(),
        engineApi.fetchAlerts(),
        engineApi.fetchMroTasks(),
      ]);
      if (mounted) {
        setMission(fetchedMission);
        setEngines(fetchedEngines);
        setAlerts(fetchedAlerts);
        setMroTasks(fetchedMro);
      }
    };
    loadData();

    // Subscribe to telemetry stream
    const unsubscribe = engineApi.subscribeTelemetry((event: TelemetryUpdateEvent) => {
      if (!mounted) return;

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

      // If update belongs to currently selected engine, push to history
      if (event.engineIndex === selectedIndexRef.current) {
        const d = new Date(event.telemetry.timestamp);
        const timeLabel = d.toTimeString().substring(0, 8);
        setTelemetryHistory((prev) => {
          const updated = [
            ...prev.slice(Math.max(0, prev.length - 45)),
            {
              timeLabel,
              timeSec: event.telemetry.timestamp,
              rpm: event.telemetry.rpm,
              cht: event.telemetry.cht,
              egt: event.telemetry.egt,
              oil: event.telemetry.oilPressure,
              fuel: event.telemetry.fuelFlow,
              vibration: event.telemetry.vibration,
              battery: event.telemetry.batteryVoltage,
              alternator: event.telemetry.alternatorCurrent,
            },
          ];
          return updated;
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const selectEngine = (index: number) => {
    if (index >= 0 && index < engines.length) {
      setSelectedEngineIndex(index);
      // Seed fresh historical points tuned to the selected engine
      const eng = engines[index];
      if (eng) {
        const now = Date.now();
        const baseHistory: TelemetryHistoryPoint[] = [];
        for (let i = 25; i >= 0; i--) {
          baseHistory.push({
            timeLabel: `-${i * 2}s`,
            timeSec: now - i * 2000,
            rpm: eng.telemetry.rpm + (Math.random() - 0.5) * 15,
            cht: eng.telemetry.cht + (Math.random() - 0.5) * 2,
            egt: eng.telemetry.egt + (Math.random() - 0.5) * 8,
            oil: eng.telemetry.oilPressure + (Math.random() - 0.5) * 1.5,
            fuel: eng.telemetry.fuelFlow + (Math.random() - 0.5) * 0.4,
            vibration: eng.telemetry.vibration + (Math.random() - 0.5) * 0.15,
            battery: eng.telemetry.batteryVoltage,
            alternator: eng.telemetry.alternatorCurrent,
          });
        }
        setTelemetryHistory(baseHistory);
      }
    }
  };

  const toggleChartMetric = (metric: string) => {
    setSelectedChartMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const sendCopilotQuery = async (prompt: string) => {
    if (!prompt.trim() || isCopilotThinking) return;

    const userMsg: CopilotMessage = {
      id: 'usr-' + Date.now(),
      sender: 'USER',
      timestamp: new Date().toISOString().substring(11, 19) + 'Z',
      text: prompt,
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const active = engines[selectedEngineIndex] || engines[0];
      const answer = await engineApi.queryCopilot(prompt, {
        activeEngine: active,
        allEngines: engines,
        mission: mission || engineApi['mission'],
        alerts,
        mroTasks,
        telemetryHistory,
      });

      setCopilotMessages((prev) => [...prev, answer]);
    } catch (err) {
      console.error('Error querying copilot:', err);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const clearCopilotChat = () => {
    setCopilotMessages([
      {
        id: 'init-reset-' + Date.now(),
        sender: 'COPILOT',
        timestamp: new Date().toISOString().substring(11, 19) + 'Z',
        text: 'Telemetry chat log cleared. Digital twin synchronization nominal. Ready for operational queries.',
      },
    ]);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleStream = () => {
    setIsStreamActive((prev) => !prev);
  };

  const activeEngine = engines[selectedEngineIndex] || engines[0] || ({} as EngineInstance);

  return (
    <EngineContext.Provider
      value={{
        engines,
        selectedEngineIndex,
        activeEngine,
        mission: mission || ({} as Mission),
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
        isStreamActive,
        toggleStream,
        isTwinExpanded,
        setIsTwinExpanded,
        mediaViewMode,
        setMediaViewMode,
        isLiveBackend: engineApi.isLiveBackend(),
        backendUrl: engineApi.getBaseUrl(),
      }}
    >
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = (): EngineContextType => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return context;
};

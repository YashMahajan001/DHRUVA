/**
 * DHRUVAA Mission Operations Context
 * Central state for Fleet Digital Twin Telemetry, Simulation,
 * AI Copilot, Alerts, and Work-Order Management.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { EngineInstance, WorkOrder, CopilotMessage } from '../types/maintenanceEngine';
import { createInitialEngines, simulateEngineTelemetryTick, TelemetryService } from '../services/maintenanceTelemetryService';
import { generateAdvisorResponse } from '../services/maintenanceAiAdvisorService';

export type TimeRange = '15M' | '1H' | '6H' | '24H' | 'LIVE';
export type QueueFilter = 'all' | 'critical' | 'warning' | 'routine';
export type ChartMetric = 'cht' | 'egt' | 'rpm' | 'vibration' | 'oilPressure' | 'fuelFlow';

interface ToastState {
  show: boolean;
  title: string;
  message: string;
  icon?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface MissionContextType {
  engines: EngineInstance[];
  selectedEngineId: string;
  selectedEngine: EngineInstance;
  setSelectedEngineId: (id: string) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedMetric: ChartMetric;
  setSelectedMetric: (metric: ChartMetric) => void;
  queueFilter: QueueFilter;
  setQueueFilter: (filter: QueueFilter) => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  approveWorkOrder: (woId: string) => void;
  approveAllPendingOrders: () => void;
  dispatchPreventiveWO: () => void;
  syncWithERP: () => Promise<void>;
  isSyncingERP: boolean;
  activeModal: 'airworthiness' | 'workOrder' | 'twinCutaway' | 'sensorStream' | 'futureScreen' | null;
  modalData: any;
  openModal: (type: 'airworthiness' | 'workOrder' | 'twinCutaway' | 'sensorStream' | 'futureScreen', data?: any) => void;
  closeModal: () => void;
  toast: ToastState | null;
  showToast: (title: string, message: string, icon?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideToast: () => void;
  copilotMessages: CopilotMessage[];
  sendCopilotQuery: (query: string) => void;
  isCopilotThinking: boolean;
  utcTime: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engines, setEngines] = useState<EngineInstance[]>(() => createInitialEngines());
  // Default to eng-02 which is the primary focus of the AI Diagnostic Advisor in Stitch design,
  // but allows seamless switching to eng-03 (critical) or eng-01 (nominal).
  const [selectedEngineId, setSelectedEngineId] = useState<string>('eng-02');
  const [timeRange, setTimeRange] = useState<TimeRange>('LIVE');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('cht');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isSyncingERP, setIsSyncingERP] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('maintenance');

  // Modal State
  const [activeModal, setActiveModal] = useState<'airworthiness' | 'workOrder' | 'twinCutaway' | 'sensorStream' | 'futureScreen' | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // Toast State
  const [toast, setToast] = useState<ToastState | null>(null);

  // UTC clock
  const [utcTime, setUtcTime] = useState<string>('14:28:09');

  // Copilot messages
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-msg-1',
      sender: 'assistant',
      timestamp: '14:27:50 UTC',
      content: 'Aero-Twin-V4 Diagnostic Advisor online. Monitoring 3 airframe digital twins across Airworthiness Defense Cluster. Cooling degradation anomaly isolated on Engine 02 (Cylinder #2). Awaiting commander query.',
      corroboratingMetrics: [
        { metric: 'Active Nodes', value: '3 Airframes', status: 'nominal' },
        { metric: 'Twin Fidelity', value: '98.4%', status: 'nominal' }
      ]
    }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);

  // UTC Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Telemetry Simulation Stream
  useEffect(() => {
    if (!isSimulating) return;

    let elapsed = 0;
    const intervalMs = Math.max(200, Math.floor(1500 / simulationSpeed));

    const simTimer = setInterval(() => {
      elapsed += 1;
      setEngines((prev) =>
        prev.map((eng) => simulateEngineTelemetryTick(eng, elapsed))
      );
    }, intervalMs);

    return () => clearInterval(simTimer);
  }, [isSimulating, simulationSpeed]);

  const selectedEngine = useMemo(() => {
    return engines.find((e) => e.id === selectedEngineId) || engines[0];
  }, [engines, selectedEngineId]);

  const showToast = useCallback((title: string, message: string, icon = 'check_circle', type: 'info' | 'success' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, title, message, icon, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-hide toast after 4s
  useEffect(() => {
    if (!toast?.show) return;
    const t = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const openModal = useCallback((type: 'airworthiness' | 'workOrder' | 'twinCutaway' | 'sensorStream' | 'futureScreen', data?: any) => {
    setActiveModal(type);
    setModalData(data || null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => {
      const next = !prev;
      showToast(
        next ? 'TELEMETRY STREAM ACTIVE' : 'TELEMETRY PAUSED',
        next ? 'Receiving real-time digital twin sensor stream.' : 'Live sensor feed suspended on tactical hold.',
        next ? 'play_arrow' : 'pause',
        next ? 'info' : 'warning'
      );
      return next;
    });
  }, [showToast]);

  const approveWorkOrder = useCallback((woId: string) => {
    setEngines((prev) =>
      prev.map((eng) => {
        const hasWO = eng.workOrders.some((w) => w.id === woId);
        if (!hasWO) return eng;

        const updatedWOs: WorkOrder[] = eng.workOrders.map((w) =>
          w.id === woId
            ? { ...w, status: 'DISPATCHED' as const, dispatchedAt: new Date().toTimeString().substring(0, 8) + ' UTC' }
            : w
        );

        return {
          ...eng,
          workOrders: updatedWOs
        };
      })
    );
    showToast(
      'WORK ORDER APPROVED',
      `WO #${woId} dispatched to tactical hangar crew team #3. Parts reserved in Depot #2.`,
      'assignment_turned_in',
      'success'
    );
  }, [showToast]);

  const approveAllPendingOrders = useCallback(() => {
    setEngines((prev) =>
      prev.map((eng) => ({
        ...eng,
        workOrders: eng.workOrders.map((w) =>
          w.status === 'PENDING APPROVAL'
            ? { ...w, status: 'DISPATCHED' as const, dispatchedAt: new Date().toTimeString().substring(0, 8) + ' UTC' }
            : w
        )
      }))
    );
    showToast(
      'ALL ORDERS CLEARED',
      'All open predictive maintenance orders transitioned to active tactical execution.',
      'done_all',
      'success'
    );
  }, [showToast]);

  const dispatchPreventiveWO = useCallback(() => {
    approveWorkOrder('8925');
    showToast(
      'ACTION EXECUTED',
      'Cowling duct inlet cleaning work-order generated and staged for next landing.',
      'build',
      'success'
    );
  }, [approveWorkOrder, showToast]);

  const syncWithERP = useCallback(async () => {
    setIsSyncingERP(true);
    try {
      const res = await TelemetryService.syncWithERP();
      showToast(
        'ERP SYNCHRONIZED',
        res.message || 'Parts supply chain (SAP Aero) updated: Bearing PN-8812 reserved in Depot #2.',
        'cloud_done',
        'success'
      );
    } catch (e) {
      showToast('SYNC FAILED', 'Unable to reach central MRO ERP gateway.', 'error', 'error');
    } finally {
      setIsSyncingERP(false);
    }
  }, [showToast]);

  const sendCopilotQuery = useCallback((query: string) => {
    if (!query.trim()) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toTimeString().substring(0, 8) + ' UTC',
      content: query
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setIsCopilotThinking(true);

    setTimeout(() => {
      const response = generateAdvisorResponse(query, selectedEngine);
      setCopilotMessages((prev) => [...prev, response]);
      setIsCopilotThinking(false);
    }, 450);
  }, [selectedEngine]);

  const value = useMemo(() => ({
    engines,
    selectedEngineId,
    selectedEngine,
    setSelectedEngineId,
    timeRange,
    setTimeRange,
    selectedMetric,
    setSelectedMetric,
    queueFilter,
    setQueueFilter,
    isSimulating,
    toggleSimulation,
    simulationSpeed,
    setSimulationSpeed,
    approveWorkOrder,
    approveAllPendingOrders,
    dispatchPreventiveWO,
    syncWithERP,
    isSyncingERP,
    activeModal,
    modalData,
    openModal,
    closeModal,
    toast,
    showToast,
    hideToast,
    copilotMessages,
    sendCopilotQuery,
    isCopilotThinking,
    utcTime,
    activeTab,
    setActiveTab,
  }), [
    engines,
    selectedEngineId,
    selectedEngine,
    timeRange,
    selectedMetric,
    queueFilter,
    isSimulating,
    simulationSpeed,
    approveWorkOrder,
    approveAllPendingOrders,
    dispatchPreventiveWO,
    syncWithERP,
    isSyncingERP,
    activeModal,
    modalData,
    openModal,
    closeModal,
    toast,
    showToast,
    hideToast,
    copilotMessages,
    sendCopilotQuery,
    isCopilotThinking,
    utcTime,
    activeTab,
  ]);

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
};

export const useMission = (): MissionContextType => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  EngineInstance,
  Telemetry,
  TwinState,
  FaultEvent,
  Mission,
  FleetAggregate,
  TelemetryHistoryPoint,
  AICopilotMessage,
  HealthSeverity
} from '../types/fleetTypes';
import { telemetryService } from '../services/fleetApi';
import { CURRENT_MISSION, INITIAL_FLEET_AGGREGATE } from '../services/fleetMockData';

interface TelemetryContextType {
  fleet: EngineInstance[];
  selectedEngineId: string;
  selectedEngine: EngineInstance;
  telemetry: Record<string, Telemetry>;
  currentTelemetry: Telemetry;
  twinState: TwinState | null;
  alerts: FaultEvent[];
  mission: Mission;
  fleetAggregate: FleetAggregate;
  telemetryHistory: TelemetryHistoryPoint[];
  activeFilter: 'all' | 'healthy' | 'warning' | 'critical';
  timeRange: string;
  selectedChartMetric: 'cht' | 'rpm' | 'egt' | 'oilPressure' | 'vibration' | 'fuelFlow' | 'health';
  viewMode: 'radar' | 'twin-schematic';
  isTwinVisualExpanded: boolean;
  activeCopilotMessages: AICopilotMessage[];
  isCopilotLoading: boolean;
  tacticalNotification: { message: string; type: 'info' | 'warning' | 'critical'; timestamp: string } | null;
  
  // Actions
  setSelectedEngineId: (id: string) => void;
  setActiveFilter: (filter: 'all' | 'healthy' | 'warning' | 'critical') => void;
  setTimeRange: (range: string) => void;
  setSelectedChartMetric: (metric: 'cht' | 'rpm' | 'egt' | 'oilPressure' | 'vibration' | 'fuelFlow' | 'health') => void;
  setViewMode: (mode: 'radar' | 'twin-schematic') => void;
  setIsTwinVisualExpanded: (expanded: boolean) => void;
  acknowledgeAlert: (id: string) => void;
  sendCopilotMessage: (question: string) => Promise<void>;
  executeAction: (actionKey: string) => void;
  clearNotification: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fleet, setFleet] = useState<EngineInstance[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<string>('uav-01');
  const [telemetry, setTelemetry] = useState<Record<string, Telemetry>>({});
  const [twinState, setTwinState] = useState<TwinState | null>(null);
  const [alerts, setAlerts] = useState<FaultEvent[]>([]);
  const [mission, setMission] = useState<Mission>(CURRENT_MISSION);
  const [fleetAggregate, setFleetAggregate] = useState<FleetAggregate>(INITIAL_FLEET_AGGREGATE);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [timeRange, setTimeRange] = useState<string>('15m');
  const [selectedChartMetric, setSelectedChartMetric] = useState<'cht' | 'rpm' | 'egt' | 'oilPressure' | 'vibration' | 'fuelFlow' | 'health'>('cht');
  const [viewMode, setViewMode] = useState<'radar' | 'twin-schematic'>('radar');
  const [isTwinVisualExpanded, setIsTwinVisualExpanded] = useState<boolean>(false);
  const [tacticalNotification, setTacticalNotification] = useState<{ message: string; type: 'info' | 'warning' | 'critical'; timestamp: string } | null>(null);

  // Copilot dialogue history with default advisory
  const [activeCopilotMessages, setActiveCopilotMessages] = useState<AICopilotMessage[]>([
    {
      id: 'init-01',
      role: 'assistant',
      timestamp: '14:26 UTC',
      content: 'PRIORITY TACTICAL ADVISORY: Recommend vectoring UAV-03 to Runway 09 for immediate emergency recovery due to Stage 2 Crankshaft Bearing RUL expiration (<18 hrs remaining). Cylinder 2 thermal drift on UAV-02 flagged for scheduled overhaul.',
      evidence: [
        { metric: 'UAV-03 Bearing Vib', value: '0.72 g RMS', assessment: 'CRITICAL (840Hz spike)' },
        { metric: 'UAV-02 Cyl 2 CHT', value: '196°C', assessment: 'WARNING (+18°C skew)' }
      ],
      suggestedActions: [
        { label: 'EXECUTE AUTO-VECTOR RTB', actionKey: 'EXECUTE_RTB', critical: true, primary: true },
        { label: 'QUEUE MAINTENANCE BAY 2', actionKey: 'QUEUE_MAINTENANCE' }
      ]
    }
  ]);
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  // Subscribe to live telemetry stream
  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((data) => {
      setFleet(data.fleet);
      setTelemetry(data.telemetry);
      setAlerts(data.alerts);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update TwinState and History when selected engine or timerange changes
  useEffect(() => {
    telemetryService.getTwinState(selectedEngineId).then(state => {
      setTwinState(state);
    });

    const history = telemetryService.getTelemetryHistory(selectedEngineId, timeRange);
    setTelemetryHistory(history);
  }, [selectedEngineId, timeRange]);

  // Periodic subtle refresh of history to reflect live values
  useEffect(() => {
    const histTimer = setInterval(() => {
      setTelemetryHistory(telemetryService.getTelemetryHistory(selectedEngineId, timeRange));
    }, 4000);
    return () => clearInterval(histTimer);
  }, [selectedEngineId, timeRange]);

  const selectedEngine = fleet.find(e => e.id === selectedEngineId) || fleet[0] || {
    id: 'uav-01',
    callsign: 'UAV-01',
    tacticalName: 'NAGASTRA-1',
    model: 'Lycoming O-320 Twin #1',
    twinTitle: 'Lycoming O-320 Twin #1',
    healthPercentage: 92,
    healthStatus: 'NOMINAL' as HealthSeverity,
    statusLabel: 'NOMINAL // 92%',
    rulHours: 184,
    altitudeFt: 18000,
    airspeedKt: 198,
    fuelRemainingPct: 64,
    missionName: 'High-Altitude ISR (WP-03 Loiter)',
    missionPhase: 'LOITER' as const,
    anomalyCount: 0,
    mapPos: { xPct: 28, yPct: 40 },
    vectorHeadingDeg: 65,
    coordinates: { lat: 34.225, lng: 76.192 }
  };

  const currentTelemetry = telemetry[selectedEngineId] || {
    timestamp: Date.now(),
    engineId: selectedEngineId,
    rpm: 2420,
    cht: 168,
    chtPerCylinder: [166, 169, 167, 170],
    egt: 722,
    oilPressure: 68,
    oilTemperature: 82,
    fuelFlow: 24.2,
    vibration: 0.22,
    batteryVoltage: 28.2,
    alternatorCurrent: 34.1,
    manifoldPressure: 24.8,
    coolantTemp: 84
  };

  const acknowledgeAlert = useCallback((id: string) => {
    telemetryService.acknowledgeAlert(id);
    setTacticalNotification({
      message: `Alert ${id} acknowledged by Flight Controller.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString()
    });
  }, []);

  const sendCopilotMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    // Add user query
    const userMsg: AICopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      timestamp: 'JUST NOW',
      content: question
    };

    setActiveCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotLoading(true);

    try {
      // Query engineering assistant
      const response = await telemetryService.queryAICopilot(question, selectedEngineId);
      setActiveCopilotMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Copilot query failed:', err);
    } finally {
      setIsCopilotLoading(false);
    }
  }, [selectedEngineId]);

  const executeAction = useCallback((actionKey: string) => {
    const timestamp = new Date().toLocaleTimeString();
    if (actionKey === 'EXECUTE_RTB') {
      setSelectedEngineId('uav-03');
      setTacticalNotification({
        message: 'TRANSMITTED: EMERGENCY AUTO-VECTOR RTB TO RUNWAY 09 ACKNOWLEDGED BY UAV-03.',
        type: 'critical',
        timestamp
      });
    } else if (actionKey === 'QUEUE_MAINTENANCE') {
      setTacticalNotification({
        message: 'COMMAND DISPATCH: UAV-02 scheduled for Maintenance Bay 2 thermal duct flush.',
        type: 'warning',
        timestamp
      });
    } else if (actionKey === 'TELEMETRY_SWEEP') {
      setTacticalNotification({
        message: 'FLEET TELEMETRY SWEEP EXECUTED: 8 of 8 transponders synchronized with 50Hz bus.',
        type: 'info',
        timestamp
      });
    } else if (actionKey === 'EXPORT_REPORT') {
      const exportJson = JSON.stringify({
        mission: CURRENT_MISSION,
        fleet,
        telemetry,
        alerts,
        exportedAt: new Date().toISOString()
      }, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DHRUVAA_AIRWORTHINESS_REPORT_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setTacticalNotification({
        message: 'AIRWORTHINESS TELEMETRY REPORT EXPORTED TO JSON.',
        type: 'info',
        timestamp
      });
    } else {
      setTacticalNotification({
        message: `TACTICAL ACTION [${actionKey}] SENT TO MIL-STD-1553B BUS.`,
        type: 'info',
        timestamp
      });
    }
  }, [fleet, telemetry, alerts]);

  const clearNotification = useCallback(() => {
    setTacticalNotification(null);
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        fleet,
        selectedEngineId,
        selectedEngine,
        telemetry,
        currentTelemetry,
        twinState,
        alerts,
        mission,
        fleetAggregate,
        telemetryHistory,
        activeFilter,
        timeRange,
        selectedChartMetric,
        viewMode,
        isTwinVisualExpanded,
        activeCopilotMessages,
        isCopilotLoading,
        tacticalNotification,
        setSelectedEngineId,
        setActiveFilter,
        setTimeRange,
        setSelectedChartMetric,
        setViewMode,
        setIsTwinVisualExpanded,
        acknowledgeAlert,
        sendCopilotMessage,
        executeAction,
        clearNotification
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};

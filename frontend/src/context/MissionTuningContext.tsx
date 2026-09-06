/**
 * DHRUVAA Mission Dashboard Context
 * Central state orchestration for engine telemetry, tuning bench,
 * digital twin simulation, safety validation, alerts, and copilot.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  EngineInstance, 
  Mission, 
  CandidateId, 
  CandidateConfig, 
  TuningParameters, 
  Telemetry, 
  TelemetryPoint, 
  FaultEvent,
  MapProfile 
} from '../types/tuningTypes';
import { CANDIDATE_CONFIGS } from '../services/tuningMockData';
import { dhruvaaApi } from '../services/tuningApi';
import { telemetryService } from '../services/tuningTelemetryService';
import { generateCopilotResponse, CopilotAnalysisResult } from '../services/tuningCopilotService';

export type ChartMetricType = 'cht_egt' | 'rpm_fuel' | 'vibration' | 'health_trend';
export type TimeRangeType = '1m' | '5m' | '15m' | '1h';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  isError?: boolean;
}

interface DashboardContextType {
  // Engines & Missions
  engines: EngineInstance[];
  selectedEngineId: string;
  currentEngine: EngineInstance;
  setSelectedEngineId: (id: string) => void;

  missions: Mission[];
  selectedMissionId: string;
  currentMission: Mission;
  setSelectedMissionId: (id: string) => void;

  // Real-time Telemetry
  telemetry: Telemetry;
  telemetryHistory: TelemetryPoint[];

  // Candidate Configurations
  candidates: CandidateConfig[];
  selectedCandidateId: CandidateId;
  activeCandidate: CandidateConfig;
  selectCandidate: (id: CandidateId) => void;

  // Tuning Parameters
  tuning: TuningParameters;
  updateTuning: (params: Partial<TuningParameters>) => void;
  resetTuningToBaseline: () => void;

  // Simulation
  isSimulating: boolean;
  runSimulation: () => Promise<void>;
  syntheticCycles: number;

  // Safety Envelope & FADEC
  isProtocolVerified: boolean;
  setIsProtocolVerified: (verified: boolean) => void;
  isExportingFadec: boolean;
  confirmAndExportToFadec: () => Promise<void>;
  fadecExportChecksum: string | null;

  // Alerts
  alerts: FaultEvent[];
  unacknowledgedAlertsCount: number;
  isAlertsDrawerOpen: boolean;
  setIsAlertsDrawerOpen: (open: boolean) => void;
  acknowledgeAlert: (id: string) => void;

  // AI Copilot
  copilotQuery: string;
  setCopilotQuery: (q: string) => void;
  copilotResult: CopilotAnalysisResult;
  askCopilot: (query: string) => void;

  // Chart Controls
  selectedTimeRange: TimeRangeType;
  setSelectedTimeRange: (range: TimeRangeType) => void;
  selectedChartMetric: ChartMetricType;
  setSelectedChartMetric: (metric: ChartMetricType) => void;

  // Digital Twin Visual
  twinVisualMode: 'thermal' | 'wireframe' | 'fem';
  setTwinVisualMode: (mode: 'thermal' | 'wireframe' | 'fem') => void;
  customAssetUrl: string | null;
  setCustomAssetUrl: (url: string | null) => void;
  isCustomAssetModalOpen: boolean;
  setIsCustomAssetModalOpen: (open: boolean) => void;

  // Telemetry Modal
  isTelemetryModalOpen: boolean;
  setIsTelemetryModalOpen: (open: boolean) => void;

  // Toast
  toast: ToastMessage | null;
  showToast: (title: string, message: string, isError?: boolean) => void;
  clearToast: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State
  const [engines, setEngines] = useState<EngineInstance[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<string>('eng01');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('isr');
  const [alerts, setAlerts] = useState<FaultEvent[]>([]);

  // 2. Real-time Telemetry
  const [telemetry, setTelemetry] = useState<Telemetry>(telemetryService.getCurrentTelemetry());
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(telemetryService.getHistory());

  // 3. Candidates & Tuning
  const [selectedCandidateId, setSelectedCandidateId] = useState<CandidateId>('beta');
  const [tuning, setTuning] = useState<TuningParameters>({
    lambda: 0.98,
    timingBtdc: 24.0,
    rpmCeiling: 2450,
    mapProfile: 'linear',
    cowlShutterCht: 176,
  });

  // 4. Simulation & Safety
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [syntheticCycles, setSyntheticCycles] = useState<number>(1024);
  const [isProtocolVerified, setIsProtocolVerified] = useState<boolean>(false);
  const [isExportingFadec, setIsExportingFadec] = useState<boolean>(false);
  const [fadecExportChecksum, setFadecExportChecksum] = useState<string | null>(null);

  // 5. Drawer & Modals
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [twinVisualMode, setTwinVisualMode] = useState<'thermal' | 'wireframe' | 'fem'>('thermal');
  const [customAssetUrl, setCustomAssetUrl] = useState<string | null>(null);
  const [isCustomAssetModalOpen, setIsCustomAssetModalOpen] = useState<boolean>(false);

  // 6. Chart Options
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeType>('5m');
  const [selectedChartMetric, setSelectedChartMetric] = useState<ChartMetricType>('cht_egt');

  // 7. Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // 8. AI Copilot
  const [copilotQuery, setCopilotQuery] = useState<string>('Why is CHT increasing?');
  const [copilotResult, setCopilotResult] = useState<CopilotAnalysisResult>(() => ({
    headline: 'High-altitude reduced oxygen density allows stable delayed advance with 0.98 λ stoichiometry.',
    observation: 'High-altitude reduced oxygen density allows stable delayed advance with 0.98 λ stoichiometry without thermal boundary risks.',
    physicalEvidence: 'Twin simulation proves 16.3% SFC reduction while keeping exhaust valve stem temperature under 680°C threshold.',
    safetyPrecedence: 'AI recommendations are strictly ADVISORY. Autonomous flash rejected. Requires dual-credential flight controller signature.',
    confidenceScore: 99.4,
  }));

  // Toast Helper
  const showToast = useCallback((title: string, message: string, isError = false) => {
    const id = Math.random().toString();
    setToast({ id, title, message, isError });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 4500);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [engs, msns, alrts] = await Promise.all([
        dhruvaaApi.getEngines(),
        dhruvaaApi.getMissions(),
        dhruvaaApi.getActiveAlerts(),
      ]);
      if (mounted) {
        setEngines(engs);
        setMissions(msns);
        setAlerts(alrts);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Real-time telemetry subscription
  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((t, h) => {
      setTelemetry(t);
      setTelemetryHistory(h);
    });
    return () => unsubscribe();
  }, []);

  // Derived current engine & mission
  const currentEngine = useMemo(() => {
    return engines.find(e => e.id === selectedEngineId) || {
      id: 'eng01',
      name: 'PROPULSION UNIT 01 // LYCOMING O-320 MOD',
      model: 'Lycoming O-320-D2J Turbo-Normalized',
      serialNumber: 'L-29481-27A',
      type: 'Horizontal Opposed 4-Cylinder Aero Piston',
      totalFlightHours: 342.6,
      baseRulHours: 184,
      currentHealth: 94.2,
      healthStatus: 'OPTIMIZED',
      nominalRpmRange: [2200, 2700],
      nominalChtMax: 190,
      status: 'ONLINE',
    };
  }, [engines, selectedEngineId]);

  const currentMission = useMemo(() => {
    return missions.find(m => m.id === selectedMissionId) || {
      id: 'isr',
      name: 'HIGH ALTITUDE ISR (25,000 FT // -34°C COLD TEMP)',
      type: 'Intelligence, Surveillance & Reconnaissance',
      phase: 'HIGH CRUISE LOITER',
      targetAltitudeFt: 25000,
      ambientTempC: -34,
      baroInHg: 29.92,
      densityAltitudeFt: 26480,
      intakeAirO2Kpa: 11.4,
      progressPercent: 48,
      elapsedHours: 4.8,
      totalPlannedHours: 10.0,
      fuelCapacityLiters: 280,
      currentFuelLiters: 174,
      burnRateLh: 27.2,
      uavCallsign: 'DHRUV-ALPHA-07',
      linkStatus: 'MALE-LINK-01 // ENCRYPTED',
    };
  }, [missions, selectedMissionId]);

  const activeCandidate = useMemo(() => {
    return CANDIDATE_CONFIGS.find(c => c.id === selectedCandidateId) || CANDIDATE_CONFIGS[1];
  }, [selectedCandidateId]);

  const unacknowledgedAlertsCount = useMemo(() => {
    return alerts.filter(a => !a.acknowledged).length;
  }, [alerts]);

  // Update tuning handler
  const updateTuning = useCallback((params: Partial<TuningParameters>) => {
    setTuning(prev => {
      const next = { ...prev, ...params };
      telemetryService.updateTuning(next);
      return next;
    });
  }, []);

  // Candidate selection
  const selectCandidate = useCallback((id: CandidateId) => {
    setSelectedCandidateId(id);
    const candidate = CANDIDATE_CONFIGS.find(c => c.id === id);
    if (!candidate) return;

    // Apply setpoints
    updateTuning({
      lambda: candidate.lambda,
      timingBtdc: candidate.timing,
      rpmCeiling: candidate.rpm,
      cowlShutterCht: candidate.cowlCht,
    });

    if (id === 'alpha') {
      showToast('Loaded Baseline Factory Calibration', 'All setpoints restored to stock flight clearance manual.');
    } else if (id === 'beta') {
      showToast('Loaded Candidate Beta (AI Recommended)', 'Optimal endurance parameters armed for validation.');
    } else if (id === 'gamma') {
      showToast('Warning: High Lean Boundary Violation', 'Candidate Gamma exceeds thermal CHT safe criteria by +18°C.', true);
    }
  }, [updateTuning, showToast]);

  // Reset to Baseline
  const resetTuningToBaseline = useCallback(() => {
    setSelectedCandidateId('alpha');
    updateTuning({
      lambda: 1.00,
      timingBtdc: 24.0,
      rpmCeiling: 2400,
      mapProfile: 'linear',
      cowlShutterCht: 175,
    });
    setIsProtocolVerified(false);
    showToast('Workspace Reset', 'All tunable registers set to STANAG nominal factory parameters.');
  }, [updateTuning, showToast]);

  // Run Simulation
  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    showToast('Running Digital Twin Solver...', 'Simulating 1,024 thermo-fluidic piston cycles across active altitude envelope...');

    try {
      const result = await dhruvaaApi.runSimulation(tuning, selectedMissionId);
      setSyntheticCycles(result.cycles);
      setIsSimulating(false);

      if (result.passedEnvelope) {
        showToast('Simulation Validated', `Peak pressure: ${result.peakPressureBar} bar, Peak CHT: ${result.peakChtC}°C. Within STANAG-4586 limits.`);
      } else {
        showToast('Envelope Exceeded', `Peak temperature ${result.peakChtC}°C exceeds 190°C redline! Adjust tuning to restore margin.`, true);
      }
    } catch (err) {
      setIsSimulating(false);
      showToast('Simulation Error', 'Failed to execute Digital Twin solver matrix.', true);
    }
  }, [tuning, selectedMissionId, showToast]);

  // Acknowledge Alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    await dhruvaaApi.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    showToast('Alert Acknowledged', `Operator timestamped fault log for #${alertId}`);
  }, [showToast]);

  // Ask AI Copilot
  const askCopilot = useCallback((query: string) => {
    setCopilotQuery(query);
    const result = generateCopilotResponse(
      query,
      telemetry,
      currentEngine,
      currentMission,
      activeCandidate,
      alerts
    );
    setCopilotResult(result);
  }, [telemetry, currentEngine, currentMission, activeCandidate, alerts]);

  // Export to FADEC
  const confirmAndExportToFadec = useCallback(async () => {
    if (!isProtocolVerified) {
      showToast('Verification Required', 'You must verify the Aero-Safety Protocol before dispatching FADEC flash payload.', true);
      return;
    }

    setIsExportingFadec(true);
    try {
      const res = await dhruvaaApi.exportToFadec(activeCandidate, 'CDR. V. SHASTRI');
      setFadecExportChecksum(res.checksum);
      setIsExportingFadec(false);
      showToast('FADEC Flash Package Generated', `Configuration signed by CDR. V. SHASTRI [Checksum: ${res.checksum}]. Dispatched to UAV buffer.`);
    } catch (err) {
      setIsExportingFadec(false);
      showToast('FADEC Dispatch Failed', 'Unable to transmit calibration package over MALE-LINK-01.', true);
    }
  }, [isProtocolVerified, activeCandidate, showToast]);

  return (
    <DashboardContext.Provider
      value={{
        engines,
        selectedEngineId,
        currentEngine,
        setSelectedEngineId,
        missions,
        selectedMissionId,
        currentMission,
        setSelectedMissionId,
        telemetry,
        telemetryHistory,
        candidates: CANDIDATE_CONFIGS,
        selectedCandidateId,
        activeCandidate,
        selectCandidate,
        tuning,
        updateTuning,
        resetTuningToBaseline,
        isSimulating,
        runSimulation,
        syntheticCycles,
        isProtocolVerified,
        setIsProtocolVerified,
        isExportingFadec,
        confirmAndExportToFadec,
        fadecExportChecksum,
        alerts,
        unacknowledgedAlertsCount,
        isAlertsDrawerOpen,
        setIsAlertsDrawerOpen,
        acknowledgeAlert,
        copilotQuery,
        setCopilotQuery,
        copilotResult,
        askCopilot,
        selectedTimeRange,
        setSelectedTimeRange,
        selectedChartMetric,
        setSelectedChartMetric,
        twinVisualMode,
        setTwinVisualMode,
        customAssetUrl,
        setCustomAssetUrl,
        isCustomAssetModalOpen,
        setIsCustomAssetModalOpen,
        isTelemetryModalOpen,
        setIsTelemetryModalOpen,
        toast,
        showToast,
        clearToast,
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

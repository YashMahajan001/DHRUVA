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
  customTuneConfig: CandidateConfig;

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

  // Compute custom tune config from live tuning parameters + telemetry + mission context
  const customTuneConfig: CandidateConfig = useMemo(() => {
    const alpha = CANDIDATE_CONFIGS[0]; // baseline for delta comparisons (fuel 32.5, CHT 178, loiter 10.5, RUL 184)

    // 1. CHT Multi-Factor Thermodynamic Model
    const lambdaDiff = tuning.lambda - 1.00;
    const lambdaEffect = lambdaDiff >= 0 ? lambdaDiff * 48 : lambdaDiff * 34; // lean of stoich runs hotter
    const timingEffect = (tuning.timingBtdc - 24.0) * 1.2; // advance adds head heat
    const rpmEffect = (tuning.rpmCeiling - 2400) * 0.016; // continuous friction heat
    const cowlEffect = (tuning.cowlShutterCht - 175) * 0.35; // higher threshold = opens later = hotter
    const mapChtEffect = tuning.mapProfile === 'aggr' ? 3 : tuning.mapProfile === 'eco' ? -2 : 0;
    const missionTempEffect = currentMission ? (currentMission.ambientTempC - (-34)) * 0.08 : 0;

    const estCht = Math.round(178 + lambdaEffect + timingEffect + rpmEffect + cowlEffect + mapChtEffect + missionTempEffect);

    // 2. Chamber Peak Pressure Model (bars)
    const mapPressEffect = tuning.mapProfile === 'aggr' ? 2.1 : tuning.mapProfile === 'eco' ? -1.5 : 0;
    const estPeakPress = parseFloat((72.4 + (tuning.timingBtdc - 24.0) * 1.6 + (tuning.rpmCeiling - 2400) * 0.006 + mapPressEffect).toFixed(1));

    // 3. Detonation / Knock Probability Model
    const knockBase = (tuning.timingBtdc - 25.5) * 0.07;
    const knockLambda = tuning.lambda > 1.08 ? (tuning.lambda - 1.08) * 0.8 : 0;
    const estKnock = Math.max(0, parseFloat((knockBase + knockLambda).toFixed(2)));

    // 4. Fuel Burn Flow (L/h)
    // Alpha nominal baseline is 32.5 L/h
    const lambdaFuelEffect = (tuning.lambda - 1.00) * -28.0;
    const rpmFuelEffect = (tuning.rpmCeiling - 2400) * 0.011;
    const timingFuelEffect = (tuning.timingBtdc - 24.0) * -0.15;
    const mapFuelEffect = tuning.mapProfile === 'eco' ? -0.9 : tuning.mapProfile === 'aggr' ? 1.4 : 0;
    const fuelBurn = parseFloat(Math.max(16.0, 32.5 + lambdaFuelEffect + rpmFuelEffect + timingFuelEffect + mapFuelEffect).toFixed(1));

    // 5. Fuel Delta vs Alpha baseline (32.5 L/h)
    const fuelDelta = ((alpha.fuelBurnLh - fuelBurn) / alpha.fuelBurnLh * 100);
    const fuelDeltaText = fuelDelta >= 0 
      ? `+${fuelDelta.toFixed(1)}% ECON` 
      : `+${Math.abs(fuelDelta).toFixed(1)}% BURN`;

    // 6. Thermal Delta vs Alpha baseline (178°C)
    const thermalDelta = estCht - alpha.thermalCht;
    const thermalDeltaText = thermalDelta >= 0 ? `+${thermalDelta}°C` : `${thermalDelta}°C`;

    // 7. Mechanical Wear Rate & Remaining Useful Life (RUL)
    const chtPenalty = estCht > 190 ? (estCht - 190) * 3.5 + 8 : estCht > 182 ? (estCht - 182) * 1.2 : 0;
    const rpmPenalty = tuning.rpmCeiling > 2450 ? (tuning.rpmCeiling - 2450) * 0.03 : 0;
    const knockPenalty = estKnock > 0 ? estKnock * 35 : (tuning.timingBtdc > 26 ? (tuning.timingBtdc - 26) * 2.5 : 0);
    const coolingBonus = (estCht < 178 && estCht >= 168) ? (178 - estCht) * 0.8 : 0;

    const estRul = Math.max(40, Math.round(alpha.estRulHours - chtPenalty - rpmPenalty - knockPenalty + coolingBonus));
    const rulDelta = ((estRul - alpha.estRulHours) / alpha.estRulHours * 100);
    const rulDeltaText = rulDelta >= 0 ? `+${rulDelta.toFixed(1)}% DELTA` : `${rulDelta.toFixed(1)}% DELTA`;

    let wearRate = 'Nominal (+0.01%/hr)';
    if (estCht > 190 || estPeakPress > 85.0 || estKnock > 0.15) {
      wearRate = 'HIGH WEAR // CRIT';
    } else if (estCht > 185 || tuning.rpmCeiling > 2600) {
      wearRate = '+0.04%/hr WEAR';
    } else if (estCht > 180 || tuning.rpmCeiling > 2450) {
      wearRate = '+0.02%/hr WEAR';
    } else {
      wearRate = '+0.01%/hr WEAR';
    }

    // 8. Normalized Mission Loiter Endurance
    // Computed proportionally to Alpha's 10.5 hrs baseline capability
    const loiterHours = parseFloat((alpha.missionLoiterHours * (alpha.fuelBurnLh / fuelBurn)).toFixed(1));
    const loiterDelta = parseFloat((loiterHours - alpha.missionLoiterHours).toFixed(1));
    const loiterDeltaText = loiterDelta >= 0 ? `+${loiterDelta.toFixed(1)} HRS` : `${loiterDelta.toFixed(1)} HRS`;

    // 9. Aerodynamic & Structural Safety Envelope Check
    const isChtSafe = estCht <= 190;
    const isPressSafe = estPeakPress <= 85.0;
    const isKnockSafe = estKnock < 0.25;
    const envelopeValid = isChtSafe && isPressSafe && isKnockSafe;

    let envelopeStatus = 'PASS // 100% VALID';
    if (!isChtSafe) {
      envelopeStatus = `FAIL: CHT ${estCht}°C > 190°C`;
    } else if (!isPressSafe) {
      envelopeStatus = `FAIL: PRESS ${estPeakPress} > 85.0 BAR`;
    } else if (!isKnockSafe) {
      envelopeStatus = `FAIL: DETONATION RISK (${estKnock})`;
    }

    return {
      id: 'custom' as const,
      name: 'Custom Tune',
      subtitle: 'OPERATOR CALIBRATION BENCH OUTPUT',
      tag: 'CUSTOM TUNE',
      fuelBurnLh: fuelBurn,
      fuelDeltaText,
      thermalCht: estCht,
      thermalDeltaText,
      wearRate,
      estRulHours: estRul,
      rulDeltaText,
      missionLoiterHours: loiterHours,
      loiterDeltaText,
      envelopeStatus,
      envelopeValid,
      lambda: tuning.lambda,
      timing: tuning.timingBtdc,
      rpm: tuning.rpmCeiling,
      cowlCht: tuning.cowlShutterCht,
    };
  }, [tuning, currentMission]);

  const activeCandidate = useMemo(() => {
    if (selectedCandidateId === 'custom') return customTuneConfig;
    return CANDIDATE_CONFIGS.find(c => c.id === selectedCandidateId) || CANDIDATE_CONFIGS[1];
  }, [selectedCandidateId, customTuneConfig]);

  const unacknowledgedAlertsCount = useMemo(() => {
    return alerts.filter(a => !a.acknowledged).length;
  }, [alerts]);

  // Update tuning handler — auto-selects custom candidate seamlessly without toast spam
  const updateTuning = useCallback((params: Partial<TuningParameters>) => {
    setTuning(prev => {
      const next = { ...prev, ...params };
      telemetryService.updateTuning(next);
      return next;
    });
    setSelectedCandidateId('custom');
  }, []);

  // Candidate selection
  const selectCandidate = useCallback((id: CandidateId) => {
    setSelectedCandidateId(id);

    if (id === 'custom') {
      showToast('Custom Tune Active', 'Configuration reflects current Calibration Bench parameters.');
      return;
    }

    const candidate = CANDIDATE_CONFIGS.find(c => c.id === id);
    if (!candidate) return;

    // Apply setpoints directly without triggering candidate bounce
    const newTuning: Partial<TuningParameters> = {
      lambda: candidate.lambda,
      timingBtdc: candidate.timing,
      rpmCeiling: candidate.rpm,
      cowlShutterCht: candidate.cowlCht,
    };
    setTuning(prev => {
      const next = { ...prev, ...newTuning };
      telemetryService.updateTuning(next);
      return next;
    });

    if (id === 'alpha') {
      showToast('Loaded Baseline Factory Calibration', 'All setpoints restored to stock flight clearance manual.');
    } else if (id === 'beta') {
      showToast('Loaded Candidate Beta (AI Recommended)', 'Optimal endurance parameters armed for validation.');
    }
  }, [showToast]);

  // Reset to Baseline
  const resetTuningToBaseline = useCallback(() => {
    setSelectedCandidateId('alpha');
    const baselineParams: TuningParameters = {
      lambda: 1.00,
      timingBtdc: 24.0,
      rpmCeiling: 2400,
      mapProfile: 'linear',
      cowlShutterCht: 175,
    };
    setTuning(baselineParams);
    telemetryService.updateTuning(baselineParams);
    setIsProtocolVerified(false);
    showToast('Workspace Reset', 'All tunable registers set to STANAG nominal factory parameters.');
  }, [showToast]);

  // Run Simulation
  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    showToast('Running Digital Twin Solver...', 'Simulating 1,024 thermo-fluidic piston cycles across active altitude envelope...');

    try {
      const result = await dhruvaaApi.runSimulation(tuning, selectedMissionId);
      setSyntheticCycles(prev => prev + result.cycles);
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
        customTuneConfig,
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

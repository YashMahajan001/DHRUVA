import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  autoApi,
  EngineCatalogEntry,
  EngineTelemetryRecord,
  TelemetryAnomaly,
  DiagnosticHypothesis,
  SubsystemDegradation,
  AutoTuneParameters,
  TuningTestReport,
} from '../services/autoApi';

export interface SimulationParams {
  throttle: number;
  loadTorque: number;
  ambientTemp: number;
  altitude: number;
}

export interface TelemetrySample {
  time: number;
  timestamp: string;
  rpm: number;
  brake_power_kw: number;
  brake_torque_nm: number;
  boost_pressure_bar: number;
  coolant_temp_c: number;
  oil_temp_c: number;
  oil_pressure_bar: number;
  fuel_flow_lph: number;
  air_fuel_ratio: number;
}

export const DEFAULT_TUNE: AutoTuneParameters = {
  rev_limit_rpm: 6800,
  target_boost_bar: 1.2,
  ignition_timing_offset_deg: 0.0,
  target_afr: 12.8,
  throttle_sensitivity: 1.0,
  idle_rpm: 850,
  fan_trigger_temp_c: 92.0,
};

interface AutoContextType {
  // Catalog
  catalog: EngineCatalogEntry[];
  selectedEngineId: string;
  currentEngine: EngineCatalogEntry | null;
  setSelectedEngineId: (id: string) => void;
  isLoadingCatalog: boolean;
  catalogError: string | null;

  // Real-time Physics & Telemetry
  telemetry: EngineTelemetryRecord | null;
  telemetryHistory: TelemetrySample[];
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  simulationParams: SimulationParams;
  setSimulationParams: (params: Partial<SimulationParams>) => void;
  resetSimulation: () => void;

  // Intelligence & Faults
  anomalies: TelemetryAnomaly[];
  hypotheses: DiagnosticHypothesis[];
  degradations: SubsystemDegradation[];
  selectedComponent: string | null;
  setSelectedComponent: (component: string | null) => void;

  // Tuning Lab
  candidateTune: AutoTuneParameters;
  setCandidateTune: (tune: Partial<AutoTuneParameters>) => void;
  resetCandidateTune: () => void;

  // Test History
  testHistory: TuningTestReport[];
  refreshTestHistory: () => Promise<void>;

  // System & Connection
  apiConnected: boolean;
}

const AutoContext = createContext<AutoContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dhruva_selected_auto_engine';

export const AutoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Engine Catalog State
  const [catalog, setCatalog] = useState<EngineCatalogEntry[]>([]);
  const [selectedEngineId, setSelectedEngineIdState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || 'AUTO-EA888-2.0T';
  });
  const [currentEngine, setCurrentEngine] = useState<EngineCatalogEntry | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // 2. Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationParams, setSimulationParamsState] = useState<SimulationParams>({
    throttle: 0.45,
    loadTorque: 120,
    ambientTemp: 25,
    altitude: 0,
  });

  // 3. Telemetry State
  const [telemetry, setTelemetry] = useState<EngineTelemetryRecord | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>([]);
  const simTimeRef = useRef<number>(0);
  const telemetryFetchInFlight = useRef<boolean>(false);

  // 4. Intelligence & Diagnostics
  const [anomalies, setAnomalies] = useState<TelemetryAnomaly[]>([]);
  const [hypotheses, setHypotheses] = useState<DiagnosticHypothesis[]>([]);
  const [degradations, setDegradations] = useState<SubsystemDegradation[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // 5. Tuning Lab & Test History
  const [candidateTune, setCandidateTuneState] = useState<AutoTuneParameters>(DEFAULT_TUNE);
  const [testHistory, setTestHistory] = useState<TuningTestReport[]>([]);

  // 6. Resilience & Status
  const [apiConnected, setApiConnected] = useState<boolean>(true);

  // Update selected engine with persistence
  const setSelectedEngineId = useCallback((id: string) => {
    setSelectedEngineIdState(id);
    localStorage.setItem(LOCAL_STORAGE_KEY, id);
    setTelemetryHistory([]);
    simTimeRef.current = 0;
  }, []);

  const setSimulationParams = useCallback((newParams: Partial<SimulationParams>) => {
    setSimulationParamsState((prev) => ({ ...prev, ...newParams }));
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulationParamsState({
      throttle: 0.45,
      loadTorque: 120,
      ambientTemp: 25,
      altitude: 0,
    });
    setTelemetryHistory([]);
    simTimeRef.current = 0;
  }, []);

  const setCandidateTune = useCallback((updates: Partial<AutoTuneParameters>) => {
    setCandidateTuneState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetCandidateTune = useCallback(() => {
    if (currentEngine) {
      const redline = currentEngine.operating_limits.redline_rpm;
      const boost = currentEngine.aspiration.includes('TURBO') ? 1.2 : 0.0;
      setCandidateTuneState({
        ...DEFAULT_TUNE,
        rev_limit_rpm: redline,
        target_boost_bar: boost,
      });
    } else {
      setCandidateTuneState(DEFAULT_TUNE);
    }
  }, [currentEngine]);

  // Load catalog on mount
  useEffect(() => {
    setIsLoadingCatalog(true);
    autoApi
      .getCatalog()
      .then((entries) => {
        const autoEntries = entries.filter((e) => e.engine_type === 'AUTOMOBILE');
        setCatalog(autoEntries);
        setIsLoadingCatalog(false);
        setApiConnected(true);

        const existing = autoEntries.find((e) => e.engine_id === selectedEngineId);
        if (existing) {
          setCurrentEngine(existing);
        } else if (autoEntries.length > 0) {
          setSelectedEngineId(autoEntries[0].engine_id);
          setCurrentEngine(autoEntries[0]);
        }
      })
      .catch((err) => {
        setCatalogError(err.message || 'Failed to connect to backend engine catalog');
        setIsLoadingCatalog(false);
        setApiConnected(false);
      });
  }, [selectedEngineId, setSelectedEngineId]);

  // Sync currentEngine when selectedEngineId changes
  useEffect(() => {
    if (catalog.length > 0) {
      const found = catalog.find((e) => e.engine_id === selectedEngineId);
      if (found) {
        setCurrentEngine(found);
        // Preset candidate tune tailored to engine
        setCandidateTuneState({
          ...DEFAULT_TUNE,
          rev_limit_rpm: found.operating_limits.redline_rpm,
          target_boost_bar: found.aspiration.includes('TURBO') ? 1.25 : 0.0,
          idle_rpm: found.operating_limits.idle_rpm,
        });
      }
    }
  }, [selectedEngineId, catalog]);

  // Refresh test history
  const refreshTestHistory = useCallback(async () => {
    try {
      const tests = await autoApi.getTuningTests();
      setTestHistory(tests);
      setApiConnected(true);
    } catch (e) {
      console.warn('Failed to fetch test history from backend', e);
    }
  }, []);

  useEffect(() => {
    refreshTestHistory();
  }, [refreshTestHistory]);

  // Periodic Telemetry Step Simulation Loop
  useEffect(() => {
    if (!isSimulating || !currentEngine) return;

    const interval = setInterval(async () => {
      if (telemetryFetchInFlight.current) return;
      telemetryFetchInFlight.current = true;

      try {
        const rec = await autoApi.stepSimulation({
          engine_id: selectedEngineId,
          throttle: simulationParams.throttle,
          load_torque_nm: simulationParams.loadTorque,
          ambient_temp_c: simulationParams.ambientTemp,
          altitude_m: simulationParams.altitude,
          dt_s: 0.25,
        });

        simTimeRef.current += 0.25;
        setTelemetry(rec);
        setApiConnected(true);

        // Keep rolling telemetry history (capped at 40 points)
        setTelemetryHistory((prev) => {
          const sample: TelemetrySample = {
            time: Math.round(simTimeRef.current * 10) / 10,
            timestamp: new Date().toLocaleTimeString(),
            rpm: Math.round(rec.rpm),
            brake_power_kw: Math.round(rec.brake_power_kw * 10) / 10,
            brake_torque_nm: Math.round(rec.brake_torque_nm * 10) / 10,
            boost_pressure_bar: Math.round(rec.boost_pressure_bar * 100) / 100,
            coolant_temp_c: Math.round(rec.coolant_temp_c * 10) / 10,
            oil_temp_c: Math.round(rec.oil_temp_c * 10) / 10,
            oil_pressure_bar: Math.round(rec.oil_pressure_bar * 10) / 10,
            fuel_flow_lph: Math.round(rec.fuel_flow_lph * 10) / 10,
            air_fuel_ratio: Math.round(rec.air_fuel_ratio * 10) / 10,
          };
          const next = [...prev, sample];
          return next.length > 40 ? next.slice(next.length - 40) : next;
        });

        // Query anomaly detection every 4th step (~1 sec)
        if (Math.round(simTimeRef.current * 4) % 4 === 0) {
          autoApi
            .detectAnomalies(selectedEngineId, rec, simulationParams.throttle)
            .then(async (detectedAnomalies) => {
              setAnomalies(detectedAnomalies);
              if (detectedAnomalies.length > 0) {
                const diagHypotheses = await autoApi.diagnoseFaults(
                  selectedEngineId,
                  detectedAnomalies,
                  rec
                );
                setHypotheses(diagHypotheses);
              } else {
                setHypotheses([]);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        setApiConnected(false);
      } finally {
        telemetryFetchInFlight.current = false;
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isSimulating, selectedEngineId, currentEngine, simulationParams]);

  // Load Subsystem Degradation wear tracking
  useEffect(() => {
    if (!currentEngine) return;
    autoApi
      .estimateDegradation({
        engine_id: selectedEngineId,
        cumulative_hours: 450,
        mean_rpm: 3200,
        mean_oil_temp_c: 98,
        mean_coolant_temp_c: 91,
        mean_throttle: 0.42,
        high_temp_excursion_hours: 12,
      })
      .then((deg) => {
        setDegradations(deg);
      })
      .catch(() => {});
  }, [selectedEngineId, currentEngine]);

  const value = {
    catalog,
    selectedEngineId,
    currentEngine,
    setSelectedEngineId,
    isLoadingCatalog,
    catalogError,

    telemetry,
    telemetryHistory,
    isSimulating,
    setIsSimulating,
    simulationParams,
    setSimulationParams,
    resetSimulation,

    anomalies,
    hypotheses,
    degradations,
    selectedComponent,
    setSelectedComponent,

    candidateTune,
    setCandidateTune,
    resetCandidateTune,

    testHistory,
    refreshTestHistory,

    apiConnected,
  };

  return <AutoContext.Provider value={value}>{children}</AutoContext.Provider>;
};

export const useAuto = (): AutoContextType => {
  const context = useContext(AutoContext);
  if (!context) {
    throw new Error('useAuto must be used within an AutoProvider');
  }
  return context;
};

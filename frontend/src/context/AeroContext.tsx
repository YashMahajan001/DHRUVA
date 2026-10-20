import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  aeroApi,
  AeroEngineCatalogEntry,
  AeroTelemetryRecord,
  AeroDiagnosticReport,
  AeroAnomaly,
  AeroDiagnosticHypothesis,
  AeroComponentHealth,
  AeroTestReport,
  AeroCategory,
} from '../services/aeroApi';

export interface AeroFlightParams {
  throttle: number;
  altitude_m: number;
  ambient_temp_c: number;
  mach: number;
  operating_state: string;
}

export interface AeroTelemetryHistoryPoint {
  time_s: number;
  timestamp: string;
  // Category metrics
  rpm?: number;
  map_inhg?: number;
  cht_c?: number;
  egt_c?: number;
  power_bhp?: number;
  fuel_flow_gph?: number;
  ng_pct?: number;
  np_rpm?: number;
  itt_c?: number;
  torque_ft_lb?: number;
  shp?: number;
  n1_pct?: number;
  n2_pct?: number;
  spool_n_pct?: number;
  thrust_kn?: number;
  fuel_flow_kgh?: number;
  oil_press_psi?: number;
  oil_temp_c?: number;
  vibration?: number;
}

interface AeroContextType {
  // Catalog
  catalog: AeroEngineCatalogEntry[];
  selectedEngineId: string;
  currentEngine: AeroEngineCatalogEntry | null;
  setSelectedEngineId: (id: string) => void;
  isLoadingCatalog: boolean;
  catalogError: string | null;

  // Real-time Physics & Telemetry
  telemetry: AeroTelemetryRecord | null;
  telemetryHistory: AeroTelemetryHistoryPoint[];
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  flightParams: AeroFlightParams;
  setFlightParams: (params: Partial<AeroFlightParams>) => void;
  resetSimulation: () => void;

  // Injected & Detected Faults
  injectedFaults: Record<string, number>;
  toggleFaultInjection: (faultId: string, severity?: number) => void;
  clearAllFaults: () => void;

  // Diagnostics & Intelligence
  diagnostics: AeroDiagnosticReport | null;
  selectedComponent: string | null;
  setSelectedComponent: (componentId: string | null) => void;

  // Test History
  testHistory: AeroTestReport[];
  refreshTestHistory: () => Promise<void>;

  // System & Connection
  apiConnected: boolean;
}

const AeroContext = createContext<AeroContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dhruva_selected_aero_engine';

export const AeroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Catalog State
  const [catalog, setCatalog] = useState<AeroEngineCatalogEntry[]>([]);
  const [selectedEngineId, setSelectedEngineIdState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || 'AERO-CFM-CFM56-7B';
  });
  const [currentEngine, setCurrentEngine] = useState<AeroEngineCatalogEntry | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // 2. Flight & Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [flightParams, setFlightParamsState] = useState<AeroFlightParams>({
    throttle: 0.78,
    altitude_m: 10668.0, // FL350
    ambient_temp_c: -54.0,
    mach: 0.80,
    operating_state: 'CRUISE',
  });

  const [injectedFaults, setInjectedFaults] = useState<Record<string, number>>({});

  // 3. Telemetry Stream & History
  const [telemetry, setTelemetry] = useState<AeroTelemetryRecord | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<AeroTelemetryHistoryPoint[]>([]);

  // 4. Intelligence & Diagnostics
  const [diagnostics, setDiagnostics] = useState<AeroDiagnosticReport | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // 5. Test History & Connection
  const [testHistory, setTestHistory] = useState<AeroTestReport[]>([]);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  const simulationClockRef = useRef<number>(0);

  // Set selected engine ID with localStorage persistence and appropriate default flight parameters
  const setSelectedEngineId = useCallback((id: string) => {
    setSelectedEngineIdState(id);
    localStorage.setItem(LOCAL_STORAGE_KEY, id);
    setTelemetryHistory([]);
    simulationClockRef.current = 0;

    // Reset flight parameters appropriate to engine category
    const eng = catalog.find((e) => e.engine_id === id);
    if (eng) {
      if (eng.category === 'PISTON') {
        setFlightParamsState({
          throttle: 0.65,
          altitude_m: 2438.0, // 8,000 ft
          ambient_temp_c: -1.0,
          mach: 0.22,
          operating_state: 'CRUISE',
        });
      } else if (eng.category === 'TURBOPROP') {
        setFlightParamsState({
          throttle: 0.75,
          altitude_m: 6096.0, // FL200
          ambient_temp_c: -25.0,
          mach: 0.45,
          operating_state: 'CRUISE',
        });
      } else {
        setFlightParamsState({
          throttle: 0.78,
          altitude_m: 10668.0, // FL350
          ambient_temp_c: -54.0,
          mach: 0.80,
          operating_state: 'CRUISE',
        });
      }
    }
  }, [catalog]);

  const setFlightParams = useCallback((newParams: Partial<AeroFlightParams>) => {
    setFlightParamsState((prev) => ({ ...prev, ...newParams }));
  }, []);

  const toggleFaultInjection = useCallback((faultId: string, severity: number = 1.0) => {
    setInjectedFaults((prev) => {
      const next = { ...prev };
      if (next[faultId] !== undefined) {
        delete next[faultId];
      } else {
        next[faultId] = severity;
      }
      return next;
    });
  }, []);

  const clearAllFaults = useCallback(() => {
    setInjectedFaults({});
  }, []);

  const resetSimulation = useCallback(() => {
    simulationClockRef.current = 0;
    setTelemetryHistory([]);
    setInjectedFaults({});
  }, []);

  // Fetch engine catalog on mount
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      setIsLoadingCatalog(true);
      try {
        const data = await aeroApi.getCatalog();
        if (mounted) {
          setCatalog(data);
          const found = data.find((e) => e.engine_id === selectedEngineId) || data[0];
          if (found) {
            setCurrentEngine(found);
            setSelectedEngineIdState(found.engine_id);
          }
          setApiConnected(true);
          setCatalogError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setCatalogError(err.message || 'Failed to connect to aero catalog');
          setApiConnected(false);
        }
      } finally {
        if (mounted) setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // Update currentEngine when selectedEngineId changes
  useEffect(() => {
    if (catalog.length > 0) {
      const found = catalog.find((e) => e.engine_id === selectedEngineId) || catalog[0];
      setCurrentEngine(found);
    }
  }, [selectedEngineId, catalog]);

  // Fetch Test History
  const refreshTestHistory = useCallback(async () => {
    try {
      const tests = await aeroApi.getTests();
      setTestHistory(tests);
    } catch (err) {
      console.error('Failed to load aero test history', err);
    }
  }, []);

  useEffect(() => {
    refreshTestHistory();
  }, [refreshTestHistory]);

  // Real-time Physics Simulation Loop
  useEffect(() => {
    if (!isSimulating || !currentEngine) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const frame = await aeroApi.stepSimulation({
          engine_id: currentEngine.engine_id,
          throttle: flightParams.throttle,
          altitude_m: flightParams.altitude_m,
          ambient_temp_c: flightParams.ambient_temp_c,
          mach: flightParams.mach,
          operating_state: flightParams.operating_state,
          dt_s: 0.5,
          injected_faults: injectedFaults,
        });

        if (!isMounted) return;

        setTelemetry(frame);
        setApiConnected(true);
        simulationClockRef.current += 0.5;

        // Build history sample
        const sample: AeroTelemetryHistoryPoint = {
          time_s: Math.round(simulationClockRef.current * 10) / 10,
          timestamp: frame.timestamp,
          // Piston
          rpm: frame.rpm,
          map_inhg: frame.map_inhg,
          cht_c: frame.cht_c,
          egt_c: frame.egt_c,
          power_bhp: frame.power_bhp,
          fuel_flow_gph: frame.fuel_flow_gph,
          // Turboprop
          ng_pct: frame.ng_pct,
          np_rpm: frame.np_rpm,
          itt_c: frame.itt_c,
          torque_ft_lb: frame.torque_ft_lb,
          shp: frame.shp,
          // Turbofan & Turbojet
          n1_pct: frame.n1_pct,
          n2_pct: frame.n2_pct,
          spool_n_pct: frame.spool_n_pct,
          thrust_kn: frame.thrust_kn,
          fuel_flow_kgh: frame.fuel_flow_kgh,
          // Common
          oil_press_psi: frame.oil_press_psi,
          oil_temp_c: frame.oil_temp_c,
          vibration: frame.vibration_mils || frame.vibration_ips,
        };

        setTelemetryHistory((prev) => {
          const next = [...prev, sample];
          return next.slice(-60); // keep last 60 samples
        });

        // Run Diagnostics every 2 seconds
        if (Math.round(simulationClockRef.current * 2) % 4 === 0) {
          const report = await aeroApi.evaluateDiagnostics({
            engine_id: currentEngine.engine_id,
            telemetry: frame,
            injected_faults: Object.keys(injectedFaults),
          });
          if (isMounted) {
            setDiagnostics(report);
          }
        }
      } catch (err) {
        if (isMounted) setApiConnected(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSimulating, currentEngine, flightParams, injectedFaults]);

  return (
    <AeroContext.Provider
      value={{
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
        flightParams,
        setFlightParams,
        resetSimulation,
        injectedFaults,
        toggleFaultInjection,
        clearAllFaults,
        diagnostics,
        selectedComponent,
        setSelectedComponent,
        testHistory,
        refreshTestHistory,
        apiConnected,
      }}
    >
      {children}
    </AeroContext.Provider>
  );
};

export const useAero = (): AeroContextType => {
  const context = useContext(AeroContext);
  if (!context) {
    throw new Error('useAero must be used within an AeroProvider');
  }
  return context;
};

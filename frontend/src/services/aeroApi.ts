/**
 * API client and TypeScript definitions for Dhruva Aero Aircraft Engine Digital Twin.
 */

export const AeroCategory = {
  PISTON: 'PISTON',
  TURBOPROP: 'TURBOPROP',
  TURBOFAN: 'TURBOFAN',
  TURBOJET: 'TURBOJET',
} as const;

export type AeroCategory = (typeof AeroCategory)[keyof typeof AeroCategory];

export interface AeroProvenanceRecord {
  level: string;
  certification_id: string;
  issuing_authority: string;
  source_url_or_ref: string;
  verification_date: string;
  notes?: string;
}

export interface AeroOperatingLimits {
  min_oil_press_psi?: number;
  max_oil_press_psi?: number;
  min_oil_temp_c?: number;
  max_oil_temp_c?: number;
  max_rpm?: number;
  idle_rpm?: number;
  max_map_inhg?: number;
  max_cht_c?: number;
  max_egt_c?: number;
  max_n1_pct?: number;
  max_n2_pct?: number;
  max_ng_pct?: number;
  idle_ng_pct?: number;
  max_np_rpm?: number;
  max_itt_c?: number;
  max_turbine_egt_c?: number;
  max_torque_ft_lb?: number;
  max_vibration_ips?: number;
}

export interface AeroManufacturerSpecifications {
  rated_takeoff_power_shp?: number;
  rated_takeoff_power_bhp?: number;
  rated_takeoff_thrust_kn?: number;
  rated_takeoff_thrust_lbf?: number;
  continuous_power_shp?: number;
  continuous_power_bhp?: number;
  continuous_thrust_kn?: number;
  dry_weight_kg: number;
  bypass_ratio?: number;
  overall_pressure_ratio?: number;
  specific_fuel_consumption?: string;
  displacement_liters?: number;
  fuel_grade: string;
}

export interface AeroEngineCatalogEntry {
  engine_id: string;
  manufacturer: string;
  model_designation: string;
  category: AeroCategory;
  architecture: string;
  application_aircraft: string[];
  specifications: AeroManufacturerSpecifications;
  operating_limits: AeroOperatingLimits;
  provenance: AeroProvenanceRecord;
  supported_channels: string[];
  has_3d_model: boolean;
  model_completeness: string;
}

export interface TelemetrySignal {
  signal_id: string;
  display_name: string;
  value?: number;
  unit: string;
  provenance: 'SIMULATED' | 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'UNAVAILABLE';
  status: 'NORMAL' | 'CAUTION' | 'WARNING' | 'UNAVAILABLE';
  explanation?: string;
}

export interface AeroTelemetryRecord {
  engine_id: string;
  category: AeroCategory;
  timestamp: string;
  session_time_s: number;
  data_source: 'SIMULATED' | 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'UNAVAILABLE';
  operating_state: string;

  // Piston
  rpm?: number;
  map_inhg?: number;
  cht_c?: number;
  egt_c?: number;
  power_bhp?: number;
  fuel_flow_gph?: number;
  fuel_press_psi?: number;

  // Turboprop
  ng_pct?: number;
  np_rpm?: number;
  itt_c?: number;
  torque_ft_lb?: number;
  shp?: number;

  // Turbofan & Turbojet
  n1_pct?: number;
  n2_pct?: number;
  spool_n_pct?: number;
  turbine_egt_c?: number;
  thrust_kn?: number;
  thrust_lbf?: number;
  fuel_flow_kgh?: number;
  epr?: number;
  bypass_ratio_calc?: number;
  nozzle_press_ratio?: number;

  // Common
  oil_press_psi?: number;
  oil_temp_c?: number;
  vibration_ips?: number;
  vibration_mils?: number;

  // Environment
  ambient_temp_c: number;
  ambient_press_kpa: number;
  altitude_m: number;
  mach: number;

  signals: Record<string, TelemetrySignal>;
}

export interface AeroAnomaly {
  anomaly_id: string;
  signal_id: string;
  signal_name: string;
  observed_value: number;
  expected_range: string;
  unit: string;
  severity: 'INFO' | 'ADVISORY' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  rule_violated: string;
  timestamp: string;
  confidence_pct: number;
}

export interface AeroDiagnosticHypothesis {
  hypothesis_id: string;
  fault_id: string;
  fault_name: string;
  affected_component_id: string;
  affected_component_name: string;
  severity: 'INFO' | 'ADVISORY' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  confidence_pct: number;
  supporting_anomalies: string[];
  physical_evidence: string;
  detection_rule: string;
  recommended_action: string;
  is_injected: boolean;
}

export interface AeroComponentHealth {
  component_id: string;
  component_name: string;
  health_score_pct: number;
  status: 'NOMINAL' | 'MONITOR' | 'DEGRADED' | 'CRITICAL';
  active_faults_count: number;
  key_metrics: Record<string, string>;
}

export interface AeroDiagnosticReport {
  engine_id: string;
  timestamp: string;
  overall_health_score_pct: number;
  operating_status: string;
  anomalies: AeroAnomaly[];
  hypotheses: AeroDiagnosticHypothesis[];
  components: AeroComponentHealth[];
}

export interface AeroFlightScenario {
  scenario_id: string;
  title: string;
  description: string;
  duration_s: number;
  initial_altitude_m: number;
  initial_throttle: number;
  waypoints: Array<{
    time_offset_s: number;
    throttle: number;
    altitude_m: number;
    mach: number;
    ambient_temp_c: number;
    injected_fault?: string;
    phase_label: string;
  }>;
}

export interface AeroTestReport {
  test_id: string;
  engine_id: string;
  engine_name: string;
  category: AeroCategory;
  test_name: string;
  scenario_id: string;
  timestamp: string;
  duration_s: number;
  status: 'COMPLETED' | 'ANOMALY_DETECTED' | 'CRITICAL_EXCEEDANCE';
  faults_injected: string[];
  faults_detected: string[];
  health_score_pct: number;
  baseline_metrics: Record<string, number>;
  candidate_metrics: Record<string, number>;
  deltas: Record<string, number>;
  telemetry_timeline: Array<Record<string, any>>;
  model_version: string;
  model_assumptions: string;
}

const API_BASE = '/api/aero';

export const aeroApi = {
  async getCatalog(category?: AeroCategory): Promise<AeroEngineCatalogEntry[]> {
    const url = category ? `${API_BASE}/catalog?category=${category}` : `${API_BASE}/catalog`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load aero catalog (${res.status})`);
    return res.json();
  },

  async getEngine(engineId: string): Promise<AeroEngineCatalogEntry> {
    const res = await fetch(`${API_BASE}/catalog/${encodeURIComponent(engineId)}`);
    if (!res.ok) throw new Error(`Failed to load engine ${engineId} (${res.status})`);
    return res.json();
  },

  async stepSimulation(payload: {
    engine_id: string;
    throttle: number;
    ambient_temp_c?: number;
    altitude_m?: number;
    mach?: number;
    operating_state?: string;
    dt_s?: number;
    injected_faults?: Record<string, number>;
    initial_value?: number;
  }): Promise<AeroTelemetryRecord> {
    const res = await fetch(`${API_BASE}/simulate/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Simulation step failed (${res.status})`);
    return res.json();
  },

  async evaluateDiagnostics(payload: {
    engine_id: string;
    telemetry: AeroTelemetryRecord;
    injected_faults?: string[];
  }): Promise<AeroDiagnosticReport> {
    const res = await fetch(`${API_BASE}/diagnostics/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Diagnostics evaluation failed (${res.status})`);
    return res.json();
  },

  async getScenarios(): Promise<AeroFlightScenario[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error(`Failed to load scenarios (${res.status})`);
    return res.json();
  },

  async runScenario(payload: {
    engine_id: string;
    scenario_id?: string;
    injected_faults?: Record<string, number>;
    time_step_s?: number;
  }): Promise<AeroTelemetryRecord[]> {
    const res = await fetch(`${API_BASE}/simulate/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Scenario simulation failed (${res.status})`);
    return res.json();
  },

  async getTests(): Promise<AeroTestReport[]> {
    const res = await fetch(`${API_BASE}/tests`);
    if (!res.ok) throw new Error(`Failed to fetch test history (${res.status})`);
    return res.json();
  },

  async getTestReport(testId: string): Promise<AeroTestReport> {
    const res = await fetch(`${API_BASE}/tests/${encodeURIComponent(testId)}`);
    if (!res.ok) throw new Error(`Failed to fetch report ${testId} (${res.status})`);
    return res.json();
  },

  async runTest(payload: {
    engine_id: string;
    test_name: string;
    scenario_id: string;
    injected_faults?: string[];
    ambient_temp_c?: number;
    altitude_m?: number;
  }): Promise<AeroTestReport> {
    const res = await fetch(`${API_BASE}/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Test execution failed (${res.status})`);
    return res.json();
  },
};

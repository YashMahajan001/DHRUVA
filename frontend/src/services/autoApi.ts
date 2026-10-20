/**
 * API Service for Dhruva Auto Intelligence & Engineering Foundation (Phase 1 & Phase 2).
 */

const API_BASE = '/api/auto';

export interface ProvenanceRecord {
  parameter_group: string;
  level: string;
  source_citation: string;
  notes?: string;
  is_verified: boolean;
}

export interface ManufacturerSpecifications {
  rated_power_kw: number;
  rated_power_hp: number;
  rated_power_rpm: number;
  peak_torque_nm: number;
  peak_torque_rpm_min: number;
  peak_torque_rpm_max: number;
  displacement_cc: number;
  cylinder_count: number;
  bore_mm: number;
  stroke_mm: number;
  compression_ratio: number;
  valves_per_cylinder: number;
}

export interface OperatingLimits {
  min_operating_rpm: number;
  idle_rpm: number;
  redline_rpm: number;
  max_continuous_rpm: number;
  min_oil_temp_c: number;
  max_oil_temp_c: number;
  min_oil_pressure_idle_bar: number;
  min_oil_pressure_rated_bar: number;
  max_oil_pressure_bar: number;
  max_coolant_temp_c: number;
  max_egt_c: number;
  max_cht_c?: number;
  max_manifold_pressure_bar: number;
}

export interface EngineCatalogEntry {
  engine_id: string;
  name: string;
  engine_type: string;
  manufacturer: string;
  model_family: string;
  cylinder_configuration: string;
  aspiration: string;
  fuel_type: string;
  fuel_density_kg_l: number;
  fuel_lhv_mj_kg: number;
  specifications: ManufacturerSpecifications;
  operating_limits: OperatingLimits;
  assumptions: string[];
  provenance_records: ProvenanceRecord[];
}

export interface EngineTelemetryRecord {
  timestamp: string;
  engine_id: string;
  engine_type: string;
  operating_state: string;
  is_synthetic: boolean;
  rpm: number;
  throttle_pct: number;
  brake_torque_nm: number;
  brake_power_kw: number;
  fuel_flow_lph: number;
  bsfc_g_kwh: number;
  manifold_pressure_kpa: number;
  boost_pressure_bar: number;
  coolant_temp_c: number;
  oil_temp_c: number;
  oil_pressure_bar: number;
  egt_c: number;
  cht_c: number;
  air_fuel_ratio: number;
  total_fuel_consumed_kg: number;
  channel_provenance?: Record<string, string>;
}

export interface TelemetryAnomaly {
  channel: string;
  detection_method: 'RULE_BASED_LIMIT' | 'PHYSICAL_ENVELOPE' | 'STATISTICAL_TREND';
  severity: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
  measured_or_simulated_value: number;
  expected_range: [number, number];
  deviation: number;
  unit: string;
  explanation: string;
  timestamp_s: number;
}

export interface DiagnosticHypothesis {
  hypothesis_id: string;
  fault_id: string;
  fault_name: string;
  subsystem: string;
  severity: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
  confidence: number;
  uncertainty_bounds: [number, number];
  propagation_path: string[];
  supporting_evidence: string[];
  refuting_evidence: string[];
  recommended_inspections: string[];
  is_hypothesis: boolean;
}

export interface SubsystemDegradation {
  subsystem: string;
  component_name: string;
  health_percentage: number;
  cumulative_stress_hours: number;
  degradation_metric: string;
  rul_hours_estimate?: number;
  rul_uncertainty_interval?: [number, number];
  status: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
  assumptions: string[];
  required_data: string[];
}

export interface MissionScenario {
  scenario_id: string;
  name: string;
  duration_minutes: number;
  target_rpm: number;
  throttle_mean: number;
  throttle_std: number;
  ambient_temp_c: number;
  altitude_m: number;
  description: string;
}

export interface SurvivalCurvePoint {
  time_minutes: number;
  survival_probability: number;
}

export interface MonteCarloReliabilityResult {
  scenario_id: string;
  scenario_name: string;
  total_iterations: number;
  random_seed: number;
  mission_success_rate: number;
  mtbf_hours_estimate: number;
  failure_distribution_by_subsystem: Record<string, number>;
  survival_curve: SurvivalCurvePoint[];
  sensitivity_factors: Record<string, string>;
  provenance_label: string;
  assumptions_and_limitations: string[];
}

export const autoApi = {
  async getCatalog(): Promise<EngineCatalogEntry[]> {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.statusText}`);
    return res.json();
  },

  async getCatalogEngine(engineId: string): Promise<EngineCatalogEntry> {
    const res = await fetch(`${API_BASE}/catalog/${engineId}`);
    if (!res.ok) throw new Error(`Engine ${engineId} not found`);
    return res.json();
  },

  async stepSimulation(params: {
    engine_id: string;
    throttle: number;
    load_torque_nm: number;
    ambient_temp_c?: number;
    altitude_m?: number;
    dt_s?: number;
    initial_rpm?: number;
  }): Promise<EngineTelemetryRecord> {
    const res = await fetch(`${API_BASE}/simulate/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Simulation step failed: ${res.statusText}`);
    return res.json();
  },

  async detectAnomalies(
    engineId: string,
    telemetry: EngineTelemetryRecord,
    throttle: number = 0
  ): Promise<TelemetryAnomaly[]> {
    const res = await fetch(`${API_BASE}/intelligence/anomalies/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine_id: engineId,
        telemetry,
        throttle,
      }),
    });
    if (!res.ok) throw new Error(`Anomaly detection failed: ${res.statusText}`);
    return res.json();
  },

  async diagnoseFaults(
    engineId: string,
    anomalies: TelemetryAnomaly[],
    telemetry?: EngineTelemetryRecord
  ): Promise<DiagnosticHypothesis[]> {
    const res = await fetch(`${API_BASE}/intelligence/diagnostics/hypothesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine_id: engineId,
        anomalies,
        telemetry,
      }),
    });
    if (!res.ok) throw new Error(`Diagnostics failed: ${res.statusText}`);
    return res.json();
  },

  async estimateDegradation(params: {
    engine_id: string;
    cumulative_hours: number;
    mean_rpm: number;
    mean_oil_temp_c: number;
    mean_coolant_temp_c: number;
    mean_throttle: number;
    high_temp_excursion_hours?: number;
  }): Promise<SubsystemDegradation[]> {
    const res = await fetch(`${API_BASE}/intelligence/degradation/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Degradation estimation failed: ${res.statusText}`);
    return res.json();
  },

  async getMissionScenarios(): Promise<MissionScenario[]> {
    const res = await fetch(`${API_BASE}/missions/scenarios`);
    if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
    return res.json();
  },

  async simulateMissionReliability(params: {
    engine_id: string;
    scenario_id?: string;
    iterations?: number;
    random_seed?: number;
  }): Promise<MonteCarloReliabilityResult> {
    const res = await fetch(`${API_BASE}/missions/simulate-reliability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Monte Carlo simulation failed: ${res.statusText}`);
    return res.json();
  },

  async validateTune(
    engineId: string,
    tune: AutoTuneParameters
  ): Promise<TuneValidationResponse> {
    const res = await fetch(`${API_BASE}/tuning/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine_id: engineId, tune }),
    });
    if (!res.ok) throw new Error(`Tune validation failed: ${res.statusText}`);
    return res.json();
  },

  async runTuningTest(params: {
    engine_id: string;
    tune_name: string;
    tune: AutoTuneParameters;
    scenario: string;
    ambient_temp_c?: number;
    altitude_m?: number;
  }): Promise<TuningTestReport> {
    const res = await fetch(`${API_BASE}/tuning/run-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Tuning simulation test failed: ${res.statusText}`);
    return res.json();
  },

  async getTuningTests(engineId?: string, status?: string): Promise<TuningTestReport[]> {
    const query = new URLSearchParams();
    if (engineId) query.append('engine_id', engineId);
    if (status) query.append('status', status);
    const res = await fetch(`${API_BASE}/tuning/tests?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch tuning tests: ${res.statusText}`);
    return res.json();
  },

  async getTuningTestDetail(testId: string): Promise<TuningTestReport> {
    const res = await fetch(`${API_BASE}/tuning/tests/${encodeURIComponent(testId)}`);
    if (!res.ok) throw new Error(`Tuning test ${testId} not found`);
    return res.json();
  },
};

export interface AutoTuneParameters {
  rev_limit_rpm: number;
  target_boost_bar: number;
  ignition_timing_offset_deg: number;
  target_afr: number;
  throttle_sensitivity: number;
  idle_rpm: number;
  fan_trigger_temp_c: number;
}

export interface TuneViolation {
  parameter: string;
  candidate_value: number;
  limit: number;
  unit: string;
  severity: 'WARNING' | 'CRITICAL';
  explanation: string;
}

export interface TuneValidationResponse {
  status: 'FEASIBLE' | 'FEASIBLE_WITH_WARNINGS' | 'INFEASIBLE';
  violations: TuneViolation[];
  summary: string;
  model_provenance?: string;
}

export interface TuningTestReport {
  test_id: string;
  engine_id: string;
  engine_name: string;
  tune_name: string;
  scenario: string;
  timestamp: string;
  duration_seconds: number;
  status: 'COMPLETED' | 'WARNING' | 'FAILED';
  baseline_metrics: {
    peak_power_kw: number;
    peak_torque_nm: number;
    max_coolant_temp_c: number;
    max_oil_temp_c: number;
    avg_bsfc_g_kwh: number;
  };
  tuned_metrics: {
    peak_power_kw: number;
    peak_torque_nm: number;
    max_coolant_temp_c: number;
    max_oil_temp_c: number;
    avg_bsfc_g_kwh: number;
  };
  deltas: {
    power_delta_pct: number;
    torque_delta_pct: number;
    thermal_delta_c: number;
    bsfc_delta_pct: number;
  };
  dyno_curves: {
    rpm: number[];
    baseline_power_kw: number[];
    tuned_power_kw: number[];
    baseline_torque_nm: number[];
    tuned_torque_nm: number[];
  };
  fault_events: {
    fault_code: string;
    name: string;
    severity: string;
    timestamp_s: number;
    description: string;
  }[];
  tune_parameters: AutoTuneParameters;
  model_version: string;
}


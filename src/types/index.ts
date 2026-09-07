export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export interface Telemetry {
  rpm: number;
  cht: number; // Cylinder Head Temp in °C
  egt: number; // Exhaust Gas Temp in °C
  oilPressure: number; // PSI
  oilTemperature: number; // °C
  fuelFlow: number; // L/hr (cruise)
  vibration: number; // mm/s RMS
  batteryVoltage: number; // V
  alternatorCurrent: number; // A
  manifoldPressure: number; // in-Hg
  cylinderTemps: [number, number, number, number]; // CYL 1, 2, 3, 4 °C
  harmonicFreq: number; // Hz (e.g. 124.8 Hz)
  timestamp: number; // epoch ms
}

export interface SubsystemHealth {
  fuelDelivery: number; // %
  coolingAirflow: number; // %
  lubricationSump: number; // %
  dualMagnetosSpark: number; // %
}

export interface TwinState {
  confidence: number; // e.g. 99.4
  syncStatus: 'SYNCHRONIZED' | 'DRIFT_DETECTED' | 'RESYNCING';
  syntheticTwinId: string; // 'SYNTHETIC TWIN D-04'
  azimuth: number; // e.g. 114
  elevation: number; // e.g. -12.4
  frameRefreshHz: number; // e.g. 60
  latencyMs: number; // e.g. 12
  subsystems: SubsystemHealth;
}

export interface EngineInstance {
  id: string; // 'ENG 01'
  index: number;
  name: string; // 'Lycoming O-320 (Port Inboard)'
  model: string; // 'Lycoming O-320 Propulsion System'
  position: 'Port Inboard' | 'Port Outboard' | 'Starboard Inboard' | 'Starboard Outboard';
  health: number; // % 0-100
  status: string; // 'HEALTHY // OPTIMAL'
  statusColor: string; // '#10b981'
  rul: number; // Remaining Useful Life in hours
  telemetry: Telemetry;
  twinState: TwinState;
}

export interface FaultEvent {
  id: string;
  engineId: string; // 'ENG 02', 'ENG 03', etc.
  engineIndex: number;
  severity: AlertSeverity;
  title: string;
  component: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  acknowledged?: boolean;
}

export interface Mission {
  id: string;
  assetId: string; // 'UAV-01'
  missionName: string; // 'HIGH ALTITUDE ISR'
  missionType: string; // 'Autonomous Reconnaissance'
  phase: string; // 'LOITER // AUTONOMOUS'
  altitudeFt: number; // 18000
  airspeedKt: number; // 198
  fuelRemainingPct: number; // 64
  remainingTime: string; // '04h 32m'
  missionProgressPct: number; // 68
  linkStatus: string; // 'SATCOM // ENCRYPTED 256-BIT'
  cameraStatus: string; // 'FLIR INFRARED ACTIVE'
  fovDegrees: number; // 84
  stabilization: string; // '3-AXIS LOCK'
  targetLock: string; // 'DISENGAGED // RECON MATRIX'
  latLong: string; // "S 34°52', W 70°15'"
  callsign: string; // 'CDR. V. SHASTRI'
  rank: string; // 'LEVEL 2 // FLIGHT CONTROLLER'
}

export interface MroTask {
  id: string;
  engineId: string;
  engineIndex: number;
  title: string;
  component: string;
  severity: AlertSeverity;
  hoursRemaining: number;
  description: string;
  statusText: string;
}

export interface DhruvaReasoningChain {
  observation: string;
  evidence: string;
  analysis: string;
  recommendation: string;
  envelope: string;
}

export interface TelemetryEvidenceMetric {
  label: string;
  value: string;
  delta?: string;
  status?: 'nominal' | 'warning' | 'critical';
}

export interface WhyThisAlertExplanation {
  factors: string[];
  conclusion: string;
}

export interface FleetRankingItem {
  rank: number;
  engineId: string;
  engineName?: string;
  priority: 'HIGH' | 'MEDIUM' | 'NOMINAL';
  health: number;
  rulHours: number;
  vibrationMmS: number;
  chtC: number;
  urgencyScore: number;
  criticalFlags: string[];
}

export interface ThrottleResponseData {
  stepLatencyMs: number;
  nominalLatencyMs: number;
  latencyDeviationPct: number;
  powerSlewRatePctSec: number;
  responseBandwidthHz: number;
  assessment: string;
  commandPct: number;
  actualPct: number;
  isDerived: boolean;
}

export interface TuningComparisonData {
  profileA: {
    name: string;
    fuelTrend: 'up' | 'down';
    chtTrend: 'up' | 'down';
    vibTrend: 'up' | 'down';
    throttleTrend: 'up' | 'down';
    fuelLHr: number;
    chtC: number;
    latencyDeltaMs: number;
    summary: string;
  };
  profileB: {
    name: string;
    fuelTrend: 'up' | 'down';
    chtTrend: 'up' | 'down';
    vibTrend: 'up' | 'down';
    throttleTrend: 'up' | 'down';
    fuelLHr: number;
    chtC: number;
    latencyDeltaMs: number;
    summary: string;
  };
  recommended: string;
  reason: string;
}

export interface MissionImpactData {
  profileName: string;
  readiness: string;
  thermalStress: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  vibrationStress: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  rulStatus: 'ACCEPTABLE' | 'MARGINAL' | 'CRITICAL';
  factors: string[];
}

export interface SuggestedActionItem {
  label: string;
  query: string;
}

export interface DhruvaAgentResponse {
  status: 'success' | 'error' | 'warning';
  intent: string;
  engine_id: string;
  decision_status?: string;
  health_score?: number;
  primary_finding?: string;
  summary: string;
  findings: string[];
  evidence: string[];
  evidence_metrics?: TelemetryEvidenceMetric[];
  confidence: number;
  mission_impact: string;
  recommendation: string;
  why_this_alert?: WhyThisAlertExplanation;
  correlated_signals?: string[];
  fleet_ranking_data?: FleetRankingItem[];
  throttle_response_data?: ThrottleResponseData;
  tuning_comparison_data?: TuningComparisonData;
  mission_impact_data?: MissionImpactData;
  suggested_actions?: SuggestedActionItem[];
  reasoning_chain: DhruvaReasoningChain;
  tools_used: string[];
  data_mode: 'DEMO' | 'LIVE' | 'DEMO ANALYTICS' | 'DEMO ESTIMATE' | 'DEMO SIMULATION';
}

export interface CopilotMessage {
  id: string;
  sender: 'USER' | 'COPILOT';
  timestamp: string;
  text?: string;
  agentResponse?: DhruvaAgentResponse;
  reasoningChain?: DhruvaReasoningChain;
}

export interface TelemetryHistoryPoint {
  timeLabel: string;
  timeSec: number;
  rpm: number;
  cht: number;
  egt: number;
  oil: number;
  fuel: number;
  vibration: number;
  battery: number;
  alternator: number;
}

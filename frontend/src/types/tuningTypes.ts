/**
 * DHRUVAA - AI-Enabled Digital Twin Aero Engine Health Monitoring System
 * Core TypeScript Data Definitions & Domain Models
 */

export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type MissionPhase = 
  | 'PRE-FLIGHT CHECK'
  | 'TAXI & TAKEOFF'
  | 'TACTICAL INGRESS'
  | 'HIGH CRUISE LOITER'
  | 'DESCENT & EGRESS'
  | 'RECOVERY';

export type MapProfile = 'eco' | 'linear' | 'aggr';

export type CandidateId = 'alpha' | 'beta' | 'gamma';

export interface TelemetryPoint {
  timestamp: number;
  timeLabel: string;
  rpm: number;
  cht: number; // Cylinder Head Temp (°C)
  egt: number; // Exhaust Gas Temp (°C)
  oilPressure: number; // PSI
  oilTemp: number; // °C
  fuelFlow: number; // L/h
  vibration: number; // g
  batteryVoltage: number; // V
  alternatorCurrent: number; // A
  health: number; // %
}

export interface Telemetry {
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  oilTemp: number;
  fuelFlow: number;
  vibration: number;
  batteryVoltage: number;
  alternatorCurrent: number;
  // Per-cylinder breakdowns
  cylinderCht: [number, number, number, number]; // Cyl 1, 2, 3, 4
  cylinderPressure: [number, number, number, number]; // bar
  knockIndex: number; // %
  lastUpdated: number;
}

export interface FaultEvent {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  subsystem: string;
  description: string;
  acknowledged?: boolean;
  value?: string;
  threshold?: string;
}

export interface EngineInstance {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  type: string;
  totalFlightHours: number;
  baseRulHours: number;
  currentHealth: number; // 0-100%
  healthStatus: 'NOMINAL' | 'OPTIMIZED' | 'DEGRADED' | 'CRITICAL' | string;
  nominalRpmRange: [number, number] | number[];
  nominalChtMax: number;
  status: 'ONLINE' | 'STANDBY' | 'CALIBRATING' | 'WARNING' | string;
}

export interface Mission {
  id: string;
  name: string;
  type: string;
  phase: MissionPhase | string;
  targetAltitudeFt: number;
  ambientTempC: number;
  baroInHg: number;
  densityAltitudeFt: number;
  intakeAirO2Kpa: number;
  progressPercent: number;
  elapsedHours: number;
  totalPlannedHours: number;
  fuelCapacityLiters: number;
  currentFuelLiters: number;
  burnRateLh: number;
  uavCallsign: string;
  linkStatus: string;
}

export interface TuningParameters {
  lambda: number; // 0.85 to 1.15
  timingBtdc: number; // 18.0 to 28.0 deg BTDC
  rpmCeiling: number; // 2200 to 2800 RPM
  mapProfile: MapProfile;
  cowlShutterCht: number; // 165 to 195 deg C
}

export interface CandidateConfig {
  id: CandidateId;
  name: string;
  subtitle: string;
  tag: string;
  isAiRecommended?: boolean;
  isRejected?: boolean;
  fuelBurnLh: number;
  fuelDeltaText?: string;
  thermalCht: number;
  thermalDeltaText?: string;
  wearRate: string;
  estRulHours: number;
  rulDeltaText?: string;
  missionLoiterHours: number;
  loiterDeltaText?: string;
  envelopeStatus: string;
  envelopeValid: boolean;
  lambda: number;
  timing: number;
  rpm: number;
  cowlCht: number;
  safetyViolationText?: string;
}

export interface TwinState {
  engineId: string;
  missionId: string;
  activeCandidate: CandidateId;
  tuning: TuningParameters;
  simulationCycles: number;
  isSimulating: boolean;
  lastSimulatedTimestamp?: number;
  safetyEnvelopePassed: boolean;
  protocolVerified: boolean;
  fadecExported: boolean;
  confidenceScore: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  observation?: string;
  physicalEvidence?: string;
  safetyPrecedence?: string;
}

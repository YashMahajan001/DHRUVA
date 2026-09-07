/**
 * DHRUVAA - AI-Enabled Digital Twin Aero Engine Health Monitoring System
 * Unified Domain Models & TypeScript Definitions
 */

export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type MissionPhase =
  | 'PRE-FLIGHT CHECK'
  | 'PRE-FLIGHT'
  | 'TAXI & TAKEOFF'
  | 'TAKEOFF'
  | 'TACTICAL INGRESS'
  | 'CLIMB'
  | 'CRUISE'
  | 'HIGH CRUISE LOITER'
  | 'LOITER'
  | 'DESCENT & EGRESS'
  | 'DESCENT'
  | 'APPROACH'
  | 'LANDED'
  | 'RECOVERY'
  | 'LOITER // AUTONOMOUS'
  | string;

export type TimeRange = '1m' | '5m' | '15m' | '30m' | '1h' | 'SORTIE' | string;
export type RenderMode = 'wireframe' | 'solid' | 'thermal' | 'xray' | string;
export type ViewportAssetMode = 'schematic' | 'uav_feed' | 'cad_twin' | 'cad_model' | string;

export type SubsystemId =
  | 'fuelDelivery'
  | 'coolingAirflow'
  | 'lubricationSump'
  | 'dualMagnetosSpark'
  | 'ignition'
  | 'mechanical'
  | 'thermodynamics'
  | string;

export interface SubsystemState {
  id: SubsystemId;
  name: string;
  health: number;
  status: string;
  statusColor?: string;
  details?: string;
}

export interface Telemetry {
  rpm: number;
  cht: number; // Cylinder Head Temp in °C
  egt: number; // Exhaust Gas Temp in °C
  oilPressure: number; // PSI or bar
  oilTemperature?: number; // °C
  oilTemp?: number; // °C
  fuelFlow: number; // L/hr
  vibration: number; // mm/s RMS
  vibrationRmsG?: number; // G
  batteryVoltage?: number; // V
  alternatorCurrent?: number; // A
  manifoldPressure?: number; // in-Hg
  cylinderTemps?: [number, number, number, number]; // CYL 1, 2, 3, 4 °C
  cylinderCht?: [number, number, number, number];
  cylinderPressure?: [number, number, number, number];
  knockIndex?: number;
  harmonicFreq?: number; // Hz
  twinDivergenceMae?: number;
  timestamp?: number;
  lastUpdated?: number;
  [key: string]: any;
}

export type TelemetryReading = Telemetry;

export interface SubsystemHealth {
  fuelDelivery: number; // %
  coolingAirflow: number; // %
  lubricationSump: number; // %
  dualMagnetosSpark: number; // %
  [key: string]: number;
}

export interface CylinderHotspot {
  id: number;
  label: string;
  temp: number;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL' | string;
  xPercent: number;
  yPercent: number;
}

export interface TwinState {
  confidence?: number;
  syncStatus?: 'SYNCHRONIZED' | 'DRIFT_DETECTED' | 'RESYNCING' | string;
  syntheticTwinId?: string;
  azimuth?: number;
  elevation?: number;
  frameRefreshHz?: number;
  latencyMs?: number;
  subsystems?: SubsystemHealth;
  thermodynamicParametersCount?: number;
  divergenceScoreMae?: number;
  cylinderHotspots?: CylinderHotspot[];
  activeCandidate?: string;
  tuning?: TuningParameters;
  isSimulating?: boolean;
  [key: string]: any;
}

export interface EngineInstance {
  id: string; // e.g. 'eng-01' or 'ENG 01'
  index: number;
  name: string; // e.g. 'Lycoming O-320 (Port Inboard)'
  model: string; // e.g. 'Lycoming O-320 Propulsion System'
  position?: 'Port Inboard' | 'Port Outboard' | 'Starboard Inboard' | 'Starboard Outboard' | string;
  health: number; // % 0-100
  status: string; // 'HEALTHY // OPTIMAL'
  statusColor?: string; // '#10b981'
  rul: number; // Remaining Useful Life in hours
  telemetry: Telemetry;
  twinState: TwinState;
  callsign?: string;
  engineNumber?: string;
  serialNumber?: string;
  totalFlightHours?: number;
  uavId?: string;
  type?: string;
  healthScore?: number;
  healthStatus?: string;
  rulHours?: number;
  mtbfHours?: number;
  operatingHours?: number;
  twinFidelity?: number;
  pipelinePort?: number;
  [key: string]: any;
}

export interface FaultEvent {
  id: string;
  engineId: string;
  engineIndex?: number;
  severity: AlertSeverity;
  title: string;
  component: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  acknowledged?: boolean;
  subsystem?: string;
  value?: string;
  threshold?: string;
  code?: string;
  [key: string]: any;
}

export interface Mission {
  id: string;
  assetId: string; // 'UAV-01'
  missionName: string; // 'HIGH ALTITUDE ISR'
  missionType: string; // 'Autonomous Reconnaissance'
  phase: string;
  altitudeFt: number; // 18000
  airspeedKt: number; // 198
  fuelRemainingPct: number; // 64
  remainingTime: string; // '04h 32m'
  missionProgressPct: number; // 68
  linkStatus: string;
  cameraStatus?: string;
  fovDegrees?: number;
  stabilization?: string;
  targetLock?: string;
  latLong?: string;
  callsign?: string;
  rank?: string;
  targetAltitudeFt?: number;
  ambientTempC?: number;
  baroInHg?: number;
  burnRateLh?: number;
  uavCallsign?: string;
  uavTailNumber?: string;
  [key: string]: any;
}

export interface MaintenanceRecord {
  id: string;
  engineId: string;
  engineIndex?: number;
  title: string;
  component: string;
  severity: AlertSeverity;
  hoursRemaining: number;
  description: string;
  statusText: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction?: string;
  lastServiceDate?: string;
  [key: string]: any;
}

export type MroTask = MaintenanceRecord;

export interface CopilotMessage {
  id: string;
  sender: 'USER' | 'COPILOT' | 'user' | 'assistant' | 'system';
  timestamp: string;
  text?: string;
  content?: string;
  reasoningChain?: {
    observation: string;
    evidence: string;
    analysis: string;
    recommendation: string;
    envelope: string;
  };
  telemetrySnapshot?: any;
  suggestedQuestions?: string[];
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
  battery?: number;
  alternator?: number;
}

export type MapProfile = 'eco' | 'linear' | 'aggr';
export type CandidateId = 'alpha' | 'beta' | 'gamma';

export interface TuningParameters {
  lambda: number; // 0.85 to 1.15
  timingBtdc: number; // 18.0 to 28.0 deg BTDC
  rpmCeiling: number; // 2200 to 2800 RPM
  mapProfile: MapProfile;
  cowlShutterCht: number; // 165 to 195 deg C
}

export interface TuneProfile {
  id: string;
  name: string;
  description: string;
  parameters: TuningParameters;
  targetMission: string;
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

export type EngineId = 'eng-01' | 'eng-02' | 'eng-03' | 'eng-04';

export type HealthSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type MissionPhase = 
  | 'PRE-FLIGHT' 
  | 'TAKEOFF' 
  | 'CLIMB' 
  | 'CRUISE' 
  | 'LOITER' 
  | 'DESCENT' 
  | 'APPROACH' 
  | 'LANDED';

export interface EngineInstance {
  id: EngineId;
  tabKey: string;
  name: string;
  callsign: string;
  model: string;
  engineNumber: string;
  healthPercent: number;
  aiConfidence: number;
  status: HealthSeverity;
  statusTag: string;
  rulHours: number;
  totalFlightHours: number;
  missionPhase: MissionPhase;
  isTwinSynced: boolean;
  colorClass: string;
  bgStatusClass: string;
}

export interface LiveTelemetry {
  timestamp: string;
  rpm: number;
  cht: number; // Primary Cylinder Head Temp (°C)
  chtBaseline: number;
  chtCylinders: [number, number, number, number];
  egt: number; // Exhaust Gas Temp (°C)
  egtCylinders: [number, number, number, number];
  oilPressureBar: number;
  oilTempC: number;
  fuelFlowLph: number;
  fuelPressureBar: number;
  vibrationRmsG: number;
  vibrationKurtosis: number;
  batteryVoltageV: number;
  alternatorCurrentA: number;
  manifoldPressureInHg: number;
  twinDivergenceMae: number; // %
}

export interface TelemetryPoint {
  timestamp: string;
  timeSec: number;
  observedCht: number;
  twinBaselineCht: number;
  egt1: number;
  egt2: number;
  egt3: number;
  egt4: number;
  oilPressure: number;
  oilTemp: number;
  vibrationRms: number;
  rpm: number;
  fuelFlow: number;
  divergence: number;
  isAnomalyPoint?: boolean;
}

export interface SubsystemHealth {
  id: string;
  name: string;
  status: 'NOMINAL' | 'WATCH' | 'DEGRADED' | 'WARNING' | 'CRITICAL';
  icon: string;
  colorClass: string;
  detail: string;
}

export interface CylinderHotspot {
  id: number;
  label: string;
  temp: number;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  xPercent: number;
  yPercent: number;
}

export interface TwinState {
  engineId: EngineId;
  twinModelVersion: string;
  syncStatus: 'SYNCHRONIZED' | 'SYNCING' | 'DEGRADED' | 'DISCONNECTED';
  divergenceScoreMae: number;
  thermodynamicParametersCount: number;
  geometryAssetUrl?: string;
  cylinderHotspots: CylinderHotspot[];
  lastCalibrationUtc: string;
}

export interface FaultEvent {
  id: string;
  timestamp: string;
  relativeTime: string; // e.g. T+03:22:15
  component: string;
  subsystem: string;
  severity: HealthSeverity;
  title: string;
  description: string;
  timelinePct: number; // 0 - 100 on timeline scrub
  acknowledged?: boolean;
}

export interface EvidenceSignal {
  id: string;
  tag: string;
  title: string;
  desc: string;
  severity: string;
}

export interface RootCause {
  name: string;
  probability: number;
  barColorClass: string;
  textColorClass: string;
}

export interface PrescribedIntervention {
  id: string;
  type: 'IMMEDIATE' | 'POST-SORTIE' | 'LOGISTICS';
  label: string;
  action: string;
  severity: 'WARNING' | 'NORMAL' | 'CRITICAL';
  icon: string;
}

export interface AiDiagnosticInsight {
  engineId: EngineId;
  autonomicConfidence: number;
  detectedAnomaly: string;
  severityBadge: string;
  severityLevel: number;
  severityClass: string;
  evidenceChain: EvidenceSignal[];
  rankedRootCauses: RootCause[];
  prescribedInterventions: PrescribedIntervention[];
  reasoningSynthesis: string;
  toolTrace: {
    tool: string;
    payload: Record<string, unknown>;
  }[];
}

export interface Mission {
  id: string;
  code: string;
  name: string;
  callsign: string;
  uavType: string;
  tailNumber: string;
  missionType: string;
  phase: MissionPhase;
  altitudeFeet: number;
  targetAltitudeFeet: number;
  airspeedKnots: number;
  progressPercent: number;
  elapsedTime: string;
  remainingTime: string;
  fuelEnduranceHours: number;
  fuelRemainingPercent: number;
  waypoint: string;
  groundStationLink: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  content: string;
  telemetrySnapshot?: {
    engineId: string;
    rpm?: number;
    cht?: number;
    egt?: number;
    health?: number;
    rul?: number;
  };
  suggestedQuestions?: string[];
}

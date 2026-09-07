/**
 * DHRUVAA — Aero Piston Engine Digital Twin Data Architecture Types
 */

export type HealthSeverity = 
  | 'NORMAL' 
  | 'WATCH' 
  | 'WARNING' 
  | 'CRITICAL'
  | 'NOMINAL'
  | 'OPTIMAL'
  | 'DEGRADED';

export type MissionPhase = 
  | 'PRE_FLIGHT' 
  | 'TAKEOFF' 
  | 'CLIMB' 
  | 'CRUISE' 
  | 'LOITER' 
  | 'EMERGENCY_RTB' 
  | 'APPROACH' 
  | 'RECOVERY';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EngineInstance {
  id: string;
  callsign: string;
  tacticalName: string;
  model: string;
  twinTitle: string;
  healthPercentage: number;
  healthStatus: HealthSeverity;
  statusLabel: string;
  rulHours: number;
  rulNote?: string;
  altitudeFt: number;
  airspeedKt: number;
  fuelRemainingPct: number;
  missionName: string;
  missionPhase: MissionPhase;
  anomalyCount: number;
  activeFaultSnippet?: string;
  mapPos: {
    xPct: number; // percentage in radar viewport
    yPct: number;
  };
  vectorHeadingDeg: number;
  coordinates: Coordinates;
}

export interface Telemetry {
  timestamp: number;
  engineId: string;
  rpm: number;
  cht: number; // Cylinder Head Temp °C
  chtPerCylinder: [number, number, number, number];
  egt: number; // Exhaust Gas Temp °C
  oilPressure: number; // PSI
  oilTemperature: number; // °C
  fuelFlow: number; // L/hr
  vibration: number; // g RMS
  batteryVoltage: number; // V
  alternatorCurrent: number; // A
  manifoldPressure: number; // inHg
  coolantTemp: number; // °C
}

export interface TelemetryHistoryPoint {
  timestamp: string;
  timeLabel: string;
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  oilTemperature: number;
  fuelFlow: number;
  vibration: number;
  health: number;
}

export interface SubsystemStatus {
  status: HealthSeverity;
  healthScore: number;
  temperature?: number;
  parameterValue: string;
  parameterLabel: string;
}

export interface TwinState {
  engineId: string;
  lastSyncTimestamp: number;
  digitalTwinFidelity: 'HIGH_FIDELITY_FEM' | 'PHYSICS_AI_HYBRID' | 'SURROGATE_FAST_INFERENCE';
  confidenceScore: number;
  thermalEquilibrium: boolean;
  cumulativeFlightHours: number;
  subsystems: {
    cylinders: SubsystemStatus;
    crankshaftBearing: SubsystemStatus;
    fuelInjectionRail: SubsystemStatus;
    turbocharger: SubsystemStatus;
    lubricationCircuit: SubsystemStatus;
    ignitionTiming: SubsystemStatus;
  };
  syntheticSensors: {
    bearingWearCoefficient: number;
    pistonThermalStressMpa: number;
    combustionStabilityIndex: number;
    harmonicVibrationSpikeHz: number;
  };
}

export interface FaultEvent {
  id: string;
  engineId: string;
  uavCallsign: string;
  severity: HealthSeverity;
  timestamp: string;
  component: string;
  description: string;
  confidencePct: number;
  acknowledged: boolean;
  recommendedAction?: string;
}

export interface Mission {
  id: string;
  name: string;
  airspaceDomain: string;
  squadron: string;
  type: string;
  phase: MissionPhase;
  altitudeFt: number;
  ceilingFt: number;
  missionProgressPct: number;
  elapsedTime: string;
  remainingTime: string;
  totalEnduranceHrs: number;
  fuelBurnLph: number;
  tacanStation: string;
  satcomLatencyMs: number;
  radarCoverage: string;
  airBase: string;
}

export interface FleetAggregate {
  aircraftTracked: number;
  readinessRating: number;
  sortiesActive: number;
  totalSortieHours: number;
  hoursToday: number;
  fleetFuelBurnLph: number;
  averageChtDegC: number;
  anomalyIndex: {
    total: number;
    critical: number;
    warning: number;
  };
  healthTrendMean: number;
  readinessAllocation: {
    airbornePct: number;
    taxiPreflightPct: number;
    inRepairPct: number;
  };
}

export interface AICopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  content: string;
  evidence?: {
    metric: string;
    value: string;
    assessment: string;
  }[];
  suggestedActions?: {
    label: string;
    actionKey: string;
    critical?: boolean;
    primary?: boolean;
  }[];
}

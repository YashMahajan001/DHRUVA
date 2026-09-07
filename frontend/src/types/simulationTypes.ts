/**
 * DHRUVAA — AI-Enabled Digital Twin for Aero Piston Engine Health Monitoring
 * Shared Data Architecture & System Types
 */

export type HealthSeverity = 'OPTIMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type MissionDirective = 'ISR (Recon)' | 'Loiter Orbit' | 'Ferry Transit' | 'CAP Intercept';

export interface EngineInstance {
  id: string;
  model: string;
  architecture: string;
  baselineHp: number;
  ratedRpm: number;
  displacement: string;
  totalOperatingHours: number;
  serialNumber: string;
  assignedUav: string;
  status: HealthSeverity;
  compressionRatio: string;
  coolingType: string;
}

export interface Telemetry {
  timestamp: number;
  timeFormatted: string; // T+HH:MM:SS
  rpm: number;
  chtAvg: number; // Cylinder Head Temp Average in °C
  chtCylinders: [number, number, number, number]; // Cyl 1, 2, 3, 4 in °C
  oilTemperature: number; // °C
  egtPeak: number; // Exhaust Gas Temp Peak in °C
  egtCylinders: [number, number, number, number]; // Cyl 1, 2, 3, 4 in °C
  fuelFlowRate: number; // Litres per hour (L/HR)
  oilPressure: number; // PSI
  vibrationRms: number; // mm/s
  vibrationHarmonics: number[]; // 8-band frequency array for spectrum
  batteryVoltage: number; // Volts (V)
  alternatorCurrent: number; // Amperes (A)
  trueAirspeed: number; // KTAS
  groundSpeed: number; // KT
  rateOfClimb: number; // FPM
  altitude: number; // FT
  densityAltitude: number; // FT
  ambientTemperature: number; // °C
  throttleDemandPercent: number; // %
  fuelRemaining: number; // Litres
  safeRtbMarginHours: number; // Hours
  latitude: number;
  longitude: number;
  coordinatesFormatted: string;
  engineOutputHp: number;
  engineBhpPercent: number;
}

export interface TwinState {
  healthScore: number; // 0.0 - 100.0%
  healthStatus: HealthSeverity;
  rulHoursRemaining: number; // Baseline RUL in hours
  estimatedRulPenalty: number; // e.g. -4, -24, -148 hours
  missionEnduranceHours: number; // e.g. 8.6 hrs
  twinConvergencePercent: number; // e.g. 99.84%
  inferenceLatencyMs: number; // e.g. 1.42 ms
  thermodynamicEfficiency: number; // %
  boundaryLayerFrictionIndex: number;
  syncState: 'SYNCHRONOUS' | 'CONVERGING' | 'CALIBRATING';
}

export interface FaultInjections {
  coolingJacketDegradation: boolean; // +18% Thermal Impedance // Heat Buildup
  fuelInjectorClog: boolean; // -14% Rail Volume // Lean AFR Spike
  lubricationPressureLeak: boolean; // -15 PSI Oil Relief Regulator Drop
  crankshaftRotorImbalance: boolean; // Harsh 1X/2X Harmonics Spike (+3.8 mm/s)
  chtThermocoupleDrift: boolean; // Sensor telemetry calibration bias (+25°C)
}

export interface FaultEvent {
  id: string;
  severity: AlertSeverity;
  timestamp: string;
  component: string;
  description: string;
  details: string;
  subsystem: 'THERMAL' | 'FUEL' | 'LUBRICATION' | 'MECHANICAL' | 'ELECTRICAL' | 'AVIONICS';
  isActive: boolean;
  acknowledged?: boolean;
}

export interface Waypoint {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  altitude: number;
  type: 'takeoff' | 'climb' | 'loiter' | 'ingress' | 'rtb';
  status: 'passed' | 'current' | 'future';
}

export interface Mission {
  id: string;
  name: string;
  code: string;
  profileScenario: string;
  directive: MissionDirective;
  uavCallsign: string;
  targetAltitude: number;
  ambientTemperature: number;
  simulatedThrottleDemand: number;
  plannedSortieDurationHours: number;
  airspaceSector: string;
  losLinkStatus: 'STABLE' | 'DEGRADED' | 'INTERMITTENT';
  waypoints: Waypoint[];
  currentLeg: string;
  windSpeedKt: number;
  windHeadingDeg: number;
}

export interface AICopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  category?: 'DIAGNOSTIC' | 'RUL' | 'THERMAL' | 'ADVISORY' | 'HEALTH';
  telemetrySnapshot?: Partial<Telemetry>;
  recommendedActions?: string[];
}

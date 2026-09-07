/**
 * DHRUVAA — AI-Enabled Digital Twin Data Architecture
 * Aero Piston Engine Health Monitoring Types
 */

export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type EngineStatus = 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type MissionPhase = 'PRE-FLIGHT' | 'TAXI' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'PATROL' | 'LOITER' | 'DESCENT' | 'APPROACH' | 'POST-FLIGHT' | 'GROUNDED';

export interface Telemetry {
  timestamp: string; // ISO or UTC time string
  timeOffsetSec: number;
  rpm: number; // Crankshaft RPM (e.g. 2400-2700)
  cht: number; // Cylinder Head Temp in °C (Nominal 140-175°C, Warning >185°C, Critical >205°C)
  egt: number; // Exhaust Gas Temp in °C (Nominal 720-780°C)
  oilPressure: number; // PSI (Nominal 55-75 PSI)
  oilTemperature: number; // °C (Nominal 75-95°C)
  fuelFlow: number; // GPH or PPH (Nominal 12.4-16.8 GPH)
  vibration: number; // mm/s or g (Nominal 0.8-1.4, Warning >2.0, Critical >3.2)
  batteryVoltage: number; // Volts (Nominal 27.8-28.4V)
  alternatorCurrent: number; // Amperes (Nominal 38-52A)
  manifoldPressure: number; // inHg (Nominal 24-28 inHg)
}

export interface ComponentHealth {
  id: string;
  name: string;
  subsystem: 'Combustion' | 'Lubrication' | 'Mechanical' | 'Electrical' | 'Fuel/Induction' | 'Avionics';
  healthScore: number; // 0-100%
  estimatedRulHours: number; // RUL in flight hours
  lastInspected: string;
  nextServiceDueHours: number | 'IMMEDIATE';
  status: EngineStatus;
  anomalyNotes?: string;
  directiveNotes?: string;
  activeWorkOrderId?: string;
  sensorChannels: string[];
}

export interface FaultEvent {
  id: string;
  engineId: string;
  severity: AlertSeverity;
  timestamp: string;
  component: string;
  subsystem: string;
  description: string;
  recommendation: string;
  evidenceMetric?: string;
  acknowledged?: boolean;
}

export interface WorkOrder {
  id: string; // e.g. "8924", "8925"
  engineId: string;
  component: string;
  status: 'DISPATCHED' | 'PENDING APPROVAL' | 'IN PROGRESS' | 'AUTO-QUEUED' | 'COMPLETED';
  urgency: 'ROUTINE' | 'SCHEDULED' | 'IMMEDIATE';
  requiredPartNumber: string;
  depotLocation: string;
  estimatedLaborHours: number;
  notes: string;
  dispatchedAt?: string;
}

export interface Mission {
  id: string;
  callsign: string; // e.g. "UAV-01 (STRATOSPHERIC PATROL)"
  missionType: 'PATROL' | 'CARGO RELAY' | 'TACTICAL RECON' | 'SURVEILLANCE' | 'FERRY';
  phase: MissionPhase;
  altitudeFt: number;
  missionProgressPercent: number;
  remainingFlightTimeMinutes: number;
  fuelRemainingLiters: number;
  totalEnduranceHours: number;
  assignedAirframe: string;
}

export interface TwinState {
  modelFidelityPercent: number; // e.g. 98.4%
  confidenceLevel: string; // "CONFIDENCE L1"
  rulErrorBandHours: number; // ±1.8 FLIGHT HRS
  thermalDecayDeltaPercent: number; // e.g. +14%
  acousticHarmonicPeakKhz: number; // e.g. 2.45 kHz (+19 dB)
  coolingEfficiencyDecayPercent: number; // e.g. -8%
  activeInferenceAlert: string;
  lastSyncTimestamp: string;
}

export interface EngineInstance {
  id: string; // e.g. "eng-01", "eng-02", "eng-03"
  displayId: string; // "ENGINE 01", "ENGINE 02", "ENGINE 03"
  airframeId: string; // "UAV-01", "UAV-02", "UAV-03"
  airframeCallsign: string;
  model: string; // e.g. "Lycoming O-360-A4M Tactical Twin" or "Rotax 914 F Turbo Aero"
  totalHours: number;
  overallHealthPercent: number;
  status: EngineStatus;
  rulHours: number;
  missionPhase: MissionPhase;
  priorityDispatchText?: string;
  currentMission: Mission;
  twinState: TwinState;
  telemetry: Telemetry;
  telemetryHistory: Telemetry[];
  components: ComponentHealth[];
  activeAlerts: FaultEvent[];
  workOrders: WorkOrder[];
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  corroboratingMetrics?: {
    metric: string;
    value: string;
    delta?: string;
    status: 'nominal' | 'warning' | 'critical';
  }[];
  suggestedDirective?: string;
}

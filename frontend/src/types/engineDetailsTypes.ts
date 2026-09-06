export type HealthStatus = 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type SubsystemId = 'cylinder' | 'cooling' | 'lubrication' | 'fuel' | 'electrical';
export type AlertSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type TimeRange = '10s' | '1m' | '5m' | '1h';
export type RenderMode = 'holo' | 'wireframe' | 'solid';
export type ViewportAssetMode = 'engine_twin' | 'uav_airframe' | 'custom_media';

export interface TelemetryReading {
  timestamp: number;
  rpm: number;
  chtAvg: number;
  chtPeak: number;
  chtSpread: number;
  egtAvg: number;
  egtPeak: number;
  oilPressure: number;
  oilTemperature: number;
  fuelFlow: number;
  fuelRailPressure: number;
  vibrationAmplitude: number;
  vibrationPeakHz: number;
  batteryVoltage: number;
  alternatorCurrent: number;
  compressionRatio: number;
  valveClearance: number;
  radiatorAirflow: number;
  coolantDelta: number;
  manifoldPressure: number;
  residualError: number;
}

export interface SubsystemParam {
  label: string;
  val: string;
  note: string;
  status?: HealthStatus;
}

export interface MicroFault {
  id: string;
  icon: 'check_circle' | 'info' | 'warning' | 'error';
  title: string;
  desc: string;
  timestamp: string;
  severity: AlertSeverity;
}

export interface SubsystemState {
  id: SubsystemId;
  index: number;
  name: string;
  badge: string;
  health: number; // 0 - 100
  confidence: string;
  params: SubsystemParam[];
  faults: MicroFault[];
  chartTag: string;
}

export interface EngineInstance {
  id: string;
  serialNumber: string;
  model: string;
  type: string;
  displacement: string;
  maxRpm: number;
  nominalRpm: number;
  ratedPowerHp: number;
  operatingHours: number;
  mtbfHours: number;
  rulHours: number;
  healthScore: number;
  healthStatus: HealthStatus;
  twinFidelity: number;
  activeSensors: number;
  totalSensors: number;
  pipelineLatencyMs: number;
  pipelinePort: number;
}

export interface Mission {
  id: string;
  callsign: string;
  uavTailNumber: string;
  uavPlatform: string;
  missionType: string;
  phase: string;
  altitudeFt: number;
  altitudeMeters: number;
  groundSpeedKts: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  remainingSeconds: number;
  fuelCapacityLiters: number;
  fuelRemainingLiters: number;
  enduranceHoursRemaining: number;
  operator: {
    callsign: string;
    rank: string;
    role: string;
    station: string;
  };
}

export interface FaultEvent {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  subsystem: SubsystemId;
  component: string;
  code: string;
  description: string;
  acknowledged: boolean;
  actionRequired?: string;
}

export interface TwinState {
  engine: EngineInstance;
  mission: Mission;
  telemetry: TelemetryReading;
  selectedSubsystem: SubsystemId;
  activeTargetLabel: string;
  isCalibrating: boolean;
  stressSimulationActive: boolean;
  camera: {
    rotation: number;
    zoom: number;
    isometricOffset: number;
    renderMode: RenderMode;
    assetMode: ViewportAssetMode;
  };
  timeRange: TimeRange;
  isStreamPaused: boolean;
  alerts: FaultEvent[];
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  telemetrySnapshot?: {
    rpm: number;
    cht: number;
    health: number;
    rul: number;
    vibe: number;
  };
}

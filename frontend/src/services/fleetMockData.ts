import {
  EngineInstance,
  Telemetry,
  TwinState,
  FaultEvent,
  Mission,
  FleetAggregate,
  TelemetryHistoryPoint
} from '../types/fleetTypes';

export const INITIAL_FLEET: EngineInstance[] = [
  {
    id: 'uav-01',
    callsign: 'UAV-01',
    tacticalName: 'NAGASTRA-1',
    model: 'Lycoming O-320 Twin #1',
    twinTitle: 'Lycoming O-320 Twin #1',
    healthPercentage: 92,
    healthStatus: 'NOMINAL',
    statusLabel: 'NOMINAL // 92%',
    rulHours: 184,
    rulNote: 'RUL: 184 HRS',
    altitudeFt: 18000,
    airspeedKt: 198,
    fuelRemainingPct: 64,
    missionName: 'High-Altitude ISR (WP-03 Loiter)',
    missionPhase: 'LOITER',
    anomalyCount: 0,
    mapPos: { xPct: 28, yPct: 40 },
    vectorHeadingDeg: 65,
    coordinates: { lat: 34.225, lng: 76.192 }
  },
  {
    id: 'uav-02',
    callsign: 'UAV-02',
    tacticalName: 'NAGASTRA-2',
    model: 'Lycoming O-320 Twin #2',
    twinTitle: 'Lycoming O-320 Twin #2',
    healthPercentage: 74,
    healthStatus: 'WARNING',
    statusLabel: 'WARNING // 74%',
    rulHours: 61,
    rulNote: 'RUL: 61 HRS',
    altitudeFt: 22500,
    airspeedKt: 205,
    fuelRemainingPct: 48,
    missionName: 'Border Surveillance Arc 02',
    missionPhase: 'CRUISE',
    anomalyCount: 1,
    activeFaultSnippet: 'ALERT: Cylinder 2 CHT thermal drift detected (92% conf)',
    mapPos: { xPct: 62, yPct: 32 },
    vectorHeadingDeg: 110,
    coordinates: { lat: 34.312, lng: 76.328 }
  },
  {
    id: 'uav-03',
    callsign: 'UAV-03',
    tacticalName: 'NAGASTRA-3',
    model: 'Lycoming O-320 Twin #3',
    twinTitle: 'Lycoming O-320 Twin #3',
    healthPercentage: 41,
    healthStatus: 'CRITICAL',
    statusLabel: 'CRITICAL // 41%',
    rulHours: 18,
    rulNote: 'RUL: 18 HRS (EXPIRED)',
    altitudeFt: 12000,
    airspeedKt: 175,
    fuelRemainingPct: 29,
    missionName: 'EMERGENCY RTB INBOUND (RWY 09)',
    missionPhase: 'EMERGENCY_RTB',
    anomalyCount: 1,
    activeFaultSnippet: 'CRIT: Stage 2 Crankshaft Bearing acoustic resonance exceedance',
    mapPos: { xPct: 46, yPct: 58 },
    vectorHeadingDeg: 235,
    coordinates: { lat: 34.184, lng: 76.241 }
  },
  {
    id: 'uav-04',
    callsign: 'UAV-04',
    tacticalName: 'NAGASTRA-4',
    model: 'Rotax 915iS Digital Twin',
    twinTitle: 'Rotax 915iS Digital Twin',
    healthPercentage: 96,
    healthStatus: 'OPTIMAL',
    statusLabel: 'OPTIMAL // 96%',
    rulHours: 340,
    rulNote: 'RUL: 340 HRS',
    altitudeFt: 26000,
    airspeedKt: 215,
    fuelRemainingPct: 82,
    missionName: 'Long-Range Maritime Recon Sector C',
    missionPhase: 'CRUISE',
    anomalyCount: 0,
    mapPos: { xPct: 78, yPct: 22 },
    vectorHeadingDeg: 45,
    coordinates: { lat: 34.42, lng: 76.48 }
  },
  {
    id: 'uav-05',
    callsign: 'UAV-05',
    tacticalName: 'NAGASTRA-5',
    model: 'Rotax 915iS Digital Twin',
    twinTitle: 'Rotax 915iS Digital Twin #2',
    healthPercentage: 97,
    healthStatus: 'OPTIMAL',
    statusLabel: 'OPTIMAL // 97%',
    rulHours: 380,
    altitudeFt: 0,
    airspeedKt: 12,
    fuelRemainingPct: 100,
    missionName: 'Pre-flight Engine Run-up (Taxiway Delta)',
    missionPhase: 'PRE_FLIGHT',
    anomalyCount: 0,
    mapPos: { xPct: 18, yPct: 82 },
    vectorHeadingDeg: 90,
    coordinates: { lat: 34.102, lng: 76.11 }
  },
  {
    id: 'uav-06',
    callsign: 'UAV-06',
    tacticalName: 'NAGASTRA-6',
    model: 'Lycoming O-320 Twin #4',
    twinTitle: 'Lycoming O-320 Twin #4',
    healthPercentage: 94,
    healthStatus: 'NOMINAL',
    statusLabel: 'NOMINAL // 94%',
    rulHours: 290,
    altitudeFt: 0,
    airspeedKt: 8,
    fuelRemainingPct: 98,
    missionName: 'Marshalling // Sortie 105 Queue',
    missionPhase: 'PRE_FLIGHT',
    anomalyCount: 0,
    mapPos: { xPct: 24, yPct: 86 },
    vectorHeadingDeg: 90,
    coordinates: { lat: 34.098, lng: 76.115 }
  },
  {
    id: 'uav-07',
    callsign: 'UAV-07',
    tacticalName: 'NAGASTRA-7',
    model: 'Lycoming IO-360 Twin',
    twinTitle: 'Lycoming IO-360 Twin',
    healthPercentage: 68,
    healthStatus: 'WATCH',
    statusLabel: 'MAINTENANCE // 68%',
    rulHours: 42,
    altitudeFt: 0,
    airspeedKt: 0,
    fuelRemainingPct: 15,
    missionName: 'Bay 1 - Thermal Duct Inspection',
    missionPhase: 'RECOVERY',
    anomalyCount: 1,
    mapPos: { xPct: 12, yPct: 78 },
    vectorHeadingDeg: 0,
    coordinates: { lat: 34.08, lng: 76.09 }
  },
  {
    id: 'uav-08',
    callsign: 'UAV-08',
    tacticalName: 'NAGASTRA-8',
    model: 'Rotax 915iS Digital Twin',
    twinTitle: 'Rotax 915iS Digital Twin #3',
    healthPercentage: 61,
    healthStatus: 'WATCH',
    statusLabel: 'MAINTENANCE // 61%',
    rulHours: 35,
    altitudeFt: 0,
    airspeedKt: 0,
    fuelRemainingPct: 10,
    missionName: 'Bay 2 - Valve Timing Recalibration',
    missionPhase: 'RECOVERY',
    anomalyCount: 1,
    mapPos: { xPct: 10, yPct: 84 },
    vectorHeadingDeg: 0,
    coordinates: { lat: 34.075, lng: 76.085 }
  }
];

export const INITIAL_TELEMETRY: Record<string, Telemetry> = {
  'uav-01': {
    timestamp: Date.now(),
    engineId: 'uav-01',
    rpm: 2420,
    cht: 168,
    chtPerCylinder: [166, 169, 167, 170],
    egt: 722,
    oilPressure: 68,
    oilTemperature: 82,
    fuelFlow: 24.2,
    vibration: 0.22,
    batteryVoltage: 28.2,
    alternatorCurrent: 34.1,
    manifoldPressure: 24.8,
    coolantTemp: 84
  },
  'uav-02': {
    timestamp: Date.now(),
    engineId: 'uav-02',
    rpm: 2510,
    cht: 192,
    chtPerCylinder: [172, 196, 171, 174],
    egt: 765,
    oilPressure: 62,
    oilTemperature: 94,
    fuelFlow: 27.8,
    vibration: 0.38,
    batteryVoltage: 27.9,
    alternatorCurrent: 36.4,
    manifoldPressure: 25.4,
    coolantTemp: 91
  },
  'uav-03': {
    timestamp: Date.now(),
    engineId: 'uav-03',
    rpm: 2180,
    cht: 188,
    chtPerCylinder: [184, 189, 186, 193],
    egt: 790,
    oilPressure: 44,
    oilTemperature: 106,
    fuelFlow: 29.5,
    vibration: 0.72,
    batteryVoltage: 27.6,
    alternatorCurrent: 38.2,
    manifoldPressure: 22.1,
    coolantTemp: 98
  },
  'uav-04': {
    timestamp: Date.now(),
    engineId: 'uav-04',
    rpm: 2580,
    cht: 155,
    chtPerCylinder: [154, 156, 153, 157],
    egt: 710,
    oilPressure: 72,
    oilTemperature: 78,
    fuelFlow: 21.6,
    vibration: 0.16,
    batteryVoltage: 28.4,
    alternatorCurrent: 32.0,
    manifoldPressure: 26.2,
    coolantTemp: 80
  }
};

export const INITIAL_TWIN_STATES: Record<string, TwinState> = {
  'uav-01': {
    engineId: 'uav-01',
    lastSyncTimestamp: Date.now(),
    digitalTwinFidelity: 'HIGH_FIDELITY_FEM',
    confidenceScore: 99.1,
    thermalEquilibrium: true,
    cumulativeFlightHours: 482.4,
    subsystems: {
      cylinders: { status: 'NORMAL', healthScore: 94, parameterValue: '168°C Mean', parameterLabel: 'Mean CHT' },
      crankshaftBearing: { status: 'NORMAL', healthScore: 91, parameterValue: '0.22 g RMS', parameterLabel: 'Acoustic RMS' },
      fuelInjectionRail: { status: 'NORMAL', healthScore: 95, parameterValue: '48.2 PSI', parameterLabel: 'Rail Pressure' },
      turbocharger: { status: 'NORMAL', healthScore: 93, parameterValue: '1.42 PR', parameterLabel: 'Pressure Ratio' },
      lubricationCircuit: { status: 'NORMAL', healthScore: 92, parameterValue: '68 PSI', parameterLabel: 'Line Pressure' },
      ignitionTiming: { status: 'NORMAL', healthScore: 96, parameterValue: '24.5° BTDC', parameterLabel: 'Advance' }
    },
    syntheticSensors: {
      bearingWearCoefficient: 0.04,
      pistonThermalStressMpa: 42.1,
      combustionStabilityIndex: 0.98,
      harmonicVibrationSpikeHz: 120
    }
  },
  'uav-02': {
    engineId: 'uav-02',
    lastSyncTimestamp: Date.now(),
    digitalTwinFidelity: 'PHYSICS_AI_HYBRID',
    confidenceScore: 92.4,
    thermalEquilibrium: false,
    cumulativeFlightHours: 618.2,
    subsystems: {
      cylinders: { status: 'WARNING', healthScore: 68, parameterValue: '196°C [Cyl 2]', parameterLabel: 'Thermal Drift' },
      crankshaftBearing: { status: 'NORMAL', healthScore: 84, parameterValue: '0.38 g RMS', parameterLabel: 'Harmonic Vib' },
      fuelInjectionRail: { status: 'WATCH', healthScore: 75, parameterValue: '44.8 PSI', parameterLabel: 'Rail Delta' },
      turbocharger: { status: 'NORMAL', healthScore: 88, parameterValue: '1.38 PR', parameterLabel: 'Boost PR' },
      lubricationCircuit: { status: 'WATCH', healthScore: 78, parameterValue: '62 PSI', parameterLabel: 'Viscosity Slip' },
      ignitionTiming: { status: 'NORMAL', healthScore: 91, parameterValue: '25.0° BTDC', parameterLabel: 'Advance' }
    },
    syntheticSensors: {
      bearingWearCoefficient: 0.28,
      pistonThermalStressMpa: 78.6,
      combustionStabilityIndex: 0.86,
      harmonicVibrationSpikeHz: 240
    }
  },
  'uav-03': {
    engineId: 'uav-03',
    lastSyncTimestamp: Date.now(),
    digitalTwinFidelity: 'HIGH_FIDELITY_FEM',
    confidenceScore: 98.4,
    thermalEquilibrium: false,
    cumulativeFlightHours: 842.1,
    subsystems: {
      cylinders: { status: 'WATCH', healthScore: 62, parameterValue: '188°C CHT', parameterLabel: 'High Thermal' },
      crankshaftBearing: { status: 'CRITICAL', healthScore: 28, parameterValue: '0.72 g @ 840Hz', parameterLabel: 'Bearing Resonance' },
      fuelInjectionRail: { status: 'NORMAL', healthScore: 80, parameterValue: '46.1 PSI', parameterLabel: 'Rail PSI' },
      turbocharger: { status: 'WATCH', healthScore: 70, parameterValue: '1.24 PR', parameterLabel: 'Derated PR' },
      lubricationCircuit: { status: 'CRITICAL', healthScore: 32, parameterValue: '44 PSI / 106°C', parameterLabel: 'Thermal Breakdown' },
      ignitionTiming: { status: 'NORMAL', healthScore: 85, parameterValue: '23.0° BTDC', parameterLabel: 'Advance' }
    },
    syntheticSensors: {
      bearingWearCoefficient: 0.89,
      pistonThermalStressMpa: 94.2,
      combustionStabilityIndex: 0.74,
      harmonicVibrationSpikeHz: 840
    }
  },
  'uav-04': {
    engineId: 'uav-04',
    lastSyncTimestamp: Date.now(),
    digitalTwinFidelity: 'SURROGATE_FAST_INFERENCE',
    confidenceScore: 99.6,
    thermalEquilibrium: true,
    cumulativeFlightHours: 194.0,
    subsystems: {
      cylinders: { status: 'NORMAL', healthScore: 98, parameterValue: '155°C Mean', parameterLabel: 'Optimal CHT' },
      crankshaftBearing: { status: 'NORMAL', healthScore: 96, parameterValue: '0.16 g RMS', parameterLabel: 'Acoustic RMS' },
      fuelInjectionRail: { status: 'NORMAL', healthScore: 97, parameterValue: '52.0 PSI', parameterLabel: 'Dual Rail' },
      turbocharger: { status: 'NORMAL', healthScore: 95, parameterValue: '1.55 PR', parameterLabel: 'Boost Nominal' },
      lubricationCircuit: { status: 'NORMAL', healthScore: 96, parameterValue: '72 PSI / 78°C', parameterLabel: 'Nominal' },
      ignitionTiming: { status: 'NORMAL', healthScore: 98, parameterValue: '26.0° BTDC', parameterLabel: 'Dual ECU' }
    },
    syntheticSensors: {
      bearingWearCoefficient: 0.02,
      pistonThermalStressMpa: 36.4,
      combustionStabilityIndex: 0.99,
      harmonicVibrationSpikeHz: 95
    }
  }
};

export const INITIAL_ALERTS: FaultEvent[] = [
  {
    id: 'alt-001',
    engineId: 'uav-03',
    uavCallsign: 'UAV-03',
    severity: 'CRITICAL',
    timestamp: '14:26:12 UTC',
    component: 'Stage 2 Crankshaft Bearing',
    description: 'Acoustic resonance exceedance detected at 840Hz. RUL degraded to < 18 hrs.',
    confidencePct: 98.4,
    acknowledged: false,
    recommendedAction: 'Immediate vectoring to Runway 09 for emergency priority recovery.'
  },
  {
    id: 'alt-002',
    engineId: 'uav-02',
    uavCallsign: 'UAV-02',
    severity: 'WARNING',
    timestamp: '14:21:40 UTC',
    component: 'Cylinder 2 CHT',
    description: 'Thermal drift detected (+18°C above cylinder cluster mean: 196°C vs 174°C).',
    confidencePct: 92.1,
    acknowledged: false,
    recommendedAction: 'Schedule thermal duct inspection & injector flush post-sortie 104.'
  },
  {
    id: 'alt-003',
    engineId: 'uav-03',
    uavCallsign: 'UAV-03',
    severity: 'WARNING',
    timestamp: '14:24:05 UTC',
    component: 'Lubrication Circuit',
    description: 'Oil pressure decline to 44 PSI combined with oil temperature excursion to 106°C.',
    confidencePct: 89.7,
    acknowledged: false,
    recommendedAction: 'Reduce throttle to 65% power to minimize hydrodynamic bearing friction.'
  },
  {
    id: 'alt-004',
    engineId: 'uav-01',
    uavCallsign: 'UAV-01',
    severity: 'NORMAL',
    timestamp: '14:15:00 UTC',
    component: 'Fuel Injection System',
    description: 'Fuel-air equivalence ratio closed loop verified nominal at loiter cruise.',
    confidencePct: 99.4,
    acknowledged: true
  },
  {
    id: 'alt-005',
    engineId: 'uav-04',
    uavCallsign: 'UAV-04',
    severity: 'NORMAL',
    timestamp: '14:02:18 UTC',
    component: 'Digital Twin Synchronizer',
    description: 'Rotax 915iS telemetry frame latency within 18ms SLA. High correlation index 0.996.',
    confidencePct: 99.8,
    acknowledged: true
  }
];

export const CURRENT_MISSION: Mission = {
  id: 'msn-alpha-104',
  name: 'OPERATION NORTHERN VANGUARD',
  airspaceDomain: 'NORTH SECTOR THEATRE // SQUADRON ALPHA',
  squadron: 'SQUADRON ALPHA',
  type: 'MULTI-UAV ISR & BORDER ESCORT',
  phase: 'CRUISE',
  altitudeFt: 22500,
  ceilingFt: 32000,
  missionProgressPct: 62,
  elapsedTime: '03:42:15',
  remainingTime: '02:18:45',
  totalEnduranceHrs: 6.0,
  fuelBurnLph: 128.4,
  tacanStation: 'CH-88X // TAC-STATION ALPHA-LEADER',
  satcomLatencyMs: 18,
  radarCoverage: '100% OTH',
  airBase: 'SECTOR-9 TAWH'
};

export const INITIAL_FLEET_AGGREGATE: FleetAggregate = {
  aircraftTracked: 8,
  readinessRating: 87.5,
  sortiesActive: 4,
  totalSortieHours: 4892,
  hoursToday: 38.5,
  fleetFuelBurnLph: 128.4,
  averageChtDegC: 174,
  anomalyIndex: {
    total: 3,
    critical: 1,
    warning: 2
  },
  healthTrendMean: 87.5,
  readinessAllocation: {
    airbornePct: 50,
    taxiPreflightPct: 25,
    inRepairPct: 25
  }
};

/**
 * Generate historical telemetry points for charts
 */
export function generateTelemetryHistory(engineId: string, count: number = 24): TelemetryHistoryPoint[] {
  const points: TelemetryHistoryPoint[] = [];
  const base = INITIAL_TELEMETRY[engineId] || INITIAL_TELEMETRY['uav-01'];
  const baseHealth = INITIAL_FLEET.find(f => f.id === engineId)?.healthPercentage || 90;

  for (let i = count; i >= 0; i--) {
    const minutesAgo = i * 2;
    const timeLabel = `-${minutesAgo}m`;
    const noise = Math.sin(i * 0.7) * 4;
    const isDegraded = engineId === 'uav-03';
    const isWarning = engineId === 'uav-02';

    // Simulate realistic trend over time
    const healthDrop = isDegraded ? Math.min(45, (count - i) * 1.8) : (isWarning ? Math.min(18, (count - i) * 0.6) : Math.sin(i) * 1.2);
    const chtRise = isWarning ? Math.min(26, (count - i) * 0.9) : noise;
    const vibRise = isDegraded ? Math.min(0.48, (count - i) * 0.02) : 0;
    const oilDrop = isDegraded ? Math.min(22, (count - i) * 0.8) : 0;

    points.push({
      timestamp: new Date(Date.now() - minutesAgo * 60000).toISOString(),
      timeLabel,
      rpm: Math.round(base.rpm + noise * 6),
      cht: Math.round(base.cht - (isWarning ? 20 - chtRise : 0) + noise * 0.6),
      egt: Math.round(base.egt + (isDegraded ? (count - i) * 2 : 0) + noise),
      oilPressure: Math.round(base.oilPressure + (isDegraded ? (20 - oilDrop) : 0) + noise * 0.4),
      oilTemperature: Math.round(base.oilTemperature + (isDegraded ? (count - i) * 0.8 : 0) + noise * 0.5),
      fuelFlow: Number((base.fuelFlow + noise * 0.1).toFixed(1)),
      vibration: Number((base.vibration - (isDegraded ? 0.35 - vibRise : 0) + Math.abs(noise) * 0.01).toFixed(2)),
      health: Math.max(20, Math.min(100, Math.round(baseHealth + (isDegraded ? 35 - healthDrop : (isWarning ? 12 - healthDrop : noise * 0.5)))))
    });
  }

  return points;
}

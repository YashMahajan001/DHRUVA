/**
 * DHRUVAA — Aerospace Telemetry & API Service Layer
 * Abstracted interface supporting local simulation, FastAPI REST, WebSocket, or MQTT transports.
 */

import { EngineInstance, Mission, FaultEvent, FaultInjections, Telemetry, TwinState } from '../types/simulationTypes';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const MOCK_ENGINES: EngineInstance[] = [
  {
    id: 'ENG-0320-TX-42',
    model: 'Lycoming O-320 v4.2',
    architecture: '4-Cyl Horiz. Opposed',
    baselineHp: 160,
    ratedRpm: 2700,
    displacement: '320 cu in (5.24 L)',
    totalOperatingHours: 348.6,
    serialNumber: 'L-29841-39A',
    assignedUav: 'MALE-UAV TAPAS D-04',
    status: 'OPTIMAL',
    compressionRatio: '8.5:1',
    coolingType: 'Direct Air Ram + Sump Finning'
  },
  {
    id: 'ENG-0360-FX-09',
    model: 'Lycoming IO-360-M1A',
    architecture: '4-Cyl Horiz. Fuel Injected',
    baselineHp: 180,
    ratedRpm: 2700,
    displacement: '361 cu in (5.92 L)',
    totalOperatingHours: 194.2,
    serialNumber: 'L-31002-44B',
    assignedUav: 'ARCHER-RECON ALPHA',
    status: 'OPTIMAL',
    compressionRatio: '8.7:1',
    coolingType: 'High-Altitude Dual Duct'
  },
  {
    id: 'ENG-ROTAX-915-IS',
    model: 'Rotax 915 iSc A Turbo',
    architecture: '4-Cyl Boxer Turbocharged',
    baselineHp: 141,
    ratedRpm: 5800,
    displacement: '1.352 L',
    totalOperatingHours: 512.0,
    serialNumber: 'R-915-00418',
    assignedUav: 'HERON EXTENDED TACTICAL',
    status: 'WATCH',
    compressionRatio: '8.2:1',
    coolingType: 'Liquid-Cooled Heads / Air Cylinders'
  }
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'MSN-ISR-084',
    name: 'Standard High-Altitude ISR (25,000 ft)',
    code: 'AIRSPACE-04 // OPR-VALLEY-WATCH',
    profileScenario: 'isr',
    directive: 'ISR (Recon)',
    uavCallsign: 'MALE-LINK-01',
    targetAltitude: 25000,
    ambientTemperature: -22,
    simulatedThrottleDemand: 75,
    plannedSortieDurationHours: 12.0,
    airspaceSector: 'SECTOR-BRAVO 34°12\'04"N 71°45\'22"E',
    losLinkStatus: 'STABLE',
    currentLeg: 'WP-03 SURVEILLANCE PATROL',
    windSpeedKt: 18,
    windHeadingDeg: 240,
    waypoints: [
      { id: 'wp-1', name: 'WP-01 [TAKEOFF]', code: 'TKOF', x: 60, y: 260, altitude: 0, type: 'takeoff', status: 'passed' },
      { id: 'wp-2', name: 'WP-02 [CLIMB]', code: 'CLMB', x: 170, y: 180, altitude: 12000, type: 'climb', status: 'passed' },
      { id: 'wp-3', name: 'WP-03 [LOITER ORBIT]', code: 'LOIT', x: 320, y: 80, altitude: 25000, type: 'loiter', status: 'current' },
      { id: 'wp-4', name: 'WP-04 [INGRESS]', code: 'INGR', x: 460, y: 80, altitude: 25000, type: 'ingress', status: 'future' },
      { id: 'wp-5', name: 'WP-05 [RTB BASE]', code: 'RTB', x: 640, y: 240, altitude: 0, type: 'rtb', status: 'future' }
    ]
  },
  {
    id: 'MSN-DESERT-102',
    name: 'Desert Hot & High Loiter (18,000 ft // +42°C)',
    code: 'AIRSPACE-07 // OPR-DUNE-VIGIL',
    profileScenario: 'desert',
    directive: 'Loiter Orbit',
    uavCallsign: 'MALE-LINK-03',
    targetAltitude: 18000,
    ambientTemperature: 42,
    simulatedThrottleDemand: 82,
    plannedSortieDurationHours: 8.5,
    airspaceSector: 'SECTOR-DELTA 26°44\'11"N 68°12\'50"E',
    losLinkStatus: 'STABLE',
    currentLeg: 'WP-03 THERMAL LOITER',
    windSpeedKt: 24,
    windHeadingDeg: 190,
    waypoints: [
      { id: 'wp-1', name: 'WP-01 [TAKEOFF]', code: 'TKOF', x: 60, y: 260, altitude: 1200, type: 'takeoff', status: 'passed' },
      { id: 'wp-2', name: 'WP-02 [CLIMB]', code: 'CLMB', x: 190, y: 190, altitude: 10000, type: 'climb', status: 'passed' },
      { id: 'wp-3', name: 'WP-03 [HOT ORBIT]', code: 'LOIT', x: 350, y: 110, altitude: 18000, type: 'loiter', status: 'current' },
      { id: 'wp-4', name: 'WP-04 [EGRESS]', code: 'EGRS', x: 490, y: 130, altitude: 16000, type: 'ingress', status: 'future' },
      { id: 'wp-5', name: 'WP-05 [RTB FORWARD BASE]', code: 'RTB', x: 640, y: 240, altitude: 1200, type: 'rtb', status: 'future' }
    ]
  },
  {
    id: 'MSN-ARCTIC-019',
    name: 'Cold Arctic Recon (22,000 ft // -38°C)',
    code: 'AIRSPACE-01 // OPR-GLACIER-EYE',
    profileScenario: 'arctic',
    directive: 'ISR (Recon)',
    uavCallsign: 'MALE-LINK-02',
    targetAltitude: 22000,
    ambientTemperature: -38,
    simulatedThrottleDemand: 70,
    plannedSortieDurationHours: 14.0,
    airspaceSector: 'SECTOR-ALPHA 71°10\'02"N 28°30\'15"E',
    losLinkStatus: 'STABLE',
    currentLeg: 'WP-02 MARITIME PATROL',
    windSpeedKt: 32,
    windHeadingDeg: 45,
    waypoints: [
      { id: 'wp-1', name: 'WP-01 [TAKEOFF]', code: 'TKOF', x: 60, y: 260, altitude: 50, type: 'takeoff', status: 'passed' },
      { id: 'wp-2', name: 'WP-02 [COASTAL CLIMB]', code: 'CLMB', x: 180, y: 180, altitude: 14000, type: 'climb', status: 'current' },
      { id: 'wp-3', name: 'WP-03 [FJORD LOITER]', code: 'LOIT', x: 320, y: 90, altitude: 22000, type: 'loiter', status: 'future' },
      { id: 'wp-4', name: 'WP-04 [RETURN LEG]', code: 'RET', x: 470, y: 110, altitude: 20000, type: 'ingress', status: 'future' },
      { id: 'wp-5', name: 'WP-05 [BASE ICE-01]', code: 'RTB', x: 640, y: 240, altitude: 50, type: 'rtb', status: 'future' }
    ]
  },
  {
    id: 'MSN-EMERG-911',
    name: 'Emergency Single-Engine RTH Failover',
    code: 'AIRSPACE-EMERG // OPR-SAFE-RECOVERY',
    profileScenario: 'emergency',
    directive: 'Ferry Transit',
    uavCallsign: 'MALE-LINK-01',
    targetAltitude: 12000,
    ambientTemperature: -5,
    simulatedThrottleDemand: 92,
    plannedSortieDurationHours: 3.5,
    airspaceSector: 'SECTOR-EMERG 33°50\'00"N 72°10\'00"E',
    losLinkStatus: 'DEGRADED',
    currentLeg: 'WP-04 GLIDE VECTOR TO RECOVERY BASE',
    windSpeedKt: 22,
    windHeadingDeg: 310,
    waypoints: [
      { id: 'wp-1', name: 'WP-01 [INCIDENT ZONE]', code: 'FAIL', x: 80, y: 80, altitude: 24000, type: 'takeoff', status: 'passed' },
      { id: 'wp-2', name: 'WP-02 [DESCENT VECTOR]', code: 'DESC', x: 230, y: 130, altitude: 18000, type: 'climb', status: 'passed' },
      { id: 'wp-3', name: 'WP-03 [GLIDE INTERCEPT]', code: 'GLID', x: 390, y: 170, altitude: 12000, type: 'loiter', status: 'current' },
      { id: 'wp-4', name: 'WP-04 [FINAL APPROACH]', code: 'APPR', x: 530, y: 210, altitude: 4000, type: 'ingress', status: 'future' },
      { id: 'wp-5', name: 'WP-05 [EMERGENCY RUNWAY]', code: 'RWY', x: 640, y: 240, altitude: 200, type: 'rtb', status: 'future' }
    ]
  }
];

export class DhruvaaApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public async getEngines(): Promise<EngineInstance[]> {
    return MOCK_ENGINES;
  }

  public async getMissions(): Promise<Mission[]> {
    return MOCK_MISSIONS;
  }

  public evaluateAlerts(faults: FaultInjections, telemetry: Telemetry): FaultEvent[] {
    const alerts: FaultEvent[] = [];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (faults.coolingJacketDegradation) {
      alerts.push({
        id: 'FLT-THM-01',
        severity: 'CRITICAL',
        timestamp: nowTime,
        component: 'Cooling Jacket Block B',
        description: 'Thermal impedance +18% detected. Rapid CHT accumulation in cylinder bank.',
        details: `Cylinder head temperatures averaging ${telemetry.chtAvg}°C, exceeding maximum allowable thermal gradient.`,
        subsystem: 'THERMAL',
        isActive: true
      });
    }

    if (faults.fuelInjectorClog) {
      alerts.push({
        id: 'FLT-FUL-03',
        severity: 'WARNING',
        timestamp: nowTime,
        component: 'Fuel Injector Nozzle #3',
        description: 'Rail flow restriction (-14%). Severe lean AFR spike detected in Cylinder 3.',
        details: `Cylinder 3 CHT elevated to ${telemetry.chtCylinders[2]}°C with EGT peak ${telemetry.egtCylinders[2]}°C.`,
        subsystem: 'FUEL',
        isActive: true
      });
    }

    if (faults.lubricationPressureLeak) {
      alerts.push({
        id: 'FLT-LUB-02',
        severity: 'CRITICAL',
        timestamp: nowTime,
        component: 'Oil Pressure Relief Valve',
        description: 'Lubrication pressure drop below minimum threshold (-16.8 PSI).',
        details: `Main gallery oil pressure currently ${telemetry.oilPressure} PSI (Safe threshold > 55 PSI).`,
        subsystem: 'LUBRICATION',
        isActive: true
      });
    }

    if (faults.crankshaftRotorImbalance) {
      alerts.push({
        id: 'FLT-MEC-04',
        severity: 'WARNING',
        timestamp: nowTime,
        component: 'Crankshaft Bearing Assembly',
        description: 'Harmonic vibration spike at 1X/2X shaft order (+3.8 mm/s).',
        details: `Broadband vibration spectrum peaking at ${telemetry.vibrationRms} mm/s RMS. Mechanical wear accelerating.`,
        subsystem: 'MECHANICAL',
        isActive: true
      });
    }

    if (faults.chtThermocoupleDrift) {
      alerts.push({
        id: 'FLT-SNS-05',
        severity: 'WATCH',
        timestamp: nowTime,
        component: 'CHT Sensor Thermocouple Array',
        description: 'Telemetry calibration bias anomaly (+25°C deviation from digital twin estimate).',
        details: 'Discrepancy detected between raw analog sensor feed and virtual twin thermodynamic model.',
        subsystem: 'AVIONICS',
        isActive: true
      });
    }

    // Nominal baseline alert if no active faults
    if (alerts.length === 0) {
      alerts.push({
        id: 'SYS-NOM-00',
        severity: 'NORMAL',
        timestamp: nowTime,
        component: 'Propulsion Health Supervisor',
        description: 'All 4 cylinders operating within nominal limits. Zero active subsystem faults.',
        details: 'Thermodynamic cycles, fuel air mixtures, and harmonic vibration within certified envelope.',
        subsystem: 'AVIONICS',
        isActive: false
      });
    }

    return alerts;
  }

  public generateHistoricalTrend(pointsCount: number = 24, currentTelemetry: Telemetry, faults: FaultInjections) {
    const history = [];
    const now = Date.now();
    const intervalMs = 60000; // 1 minute per step

    for (let i = pointsCount - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const wave = Math.sin((pointsCount - i) * 0.4);
      const noise = (Math.random() - 0.5) * 2;

      // Calculate trend progressing toward current state
      const progressToCurrent = 1 - (i / pointsCount);
      const alt = Math.round(20000 + progressToCurrent * (currentTelemetry.altitude - 20000) + wave * 250);
      const bhp = Math.round(70 + progressToCurrent * (currentTelemetry.engineBhpPercent - 70) + wave * 3);
      const rpm = Math.round(2300 + progressToCurrent * (currentTelemetry.rpm - 2300) + noise * 10);
      const cht = Math.round(175 + progressToCurrent * (currentTelemetry.chtAvg - 175) + wave * 2);
      const egt = Math.round(690 + progressToCurrent * (currentTelemetry.egtPeak - 690) + wave * 5);
      const oilP = Number((63 + progressToCurrent * (currentTelemetry.oilPressure - 63) + noise * 0.2).toFixed(1));
      const fuelFlow = Number((24 + progressToCurrent * (currentTelemetry.fuelFlowRate - 24) + wave * 0.5).toFixed(1));
      const vibe = Number((2.0 + progressToCurrent * (currentTelemetry.vibrationRms - 2.0) + wave * 0.1).toFixed(1));

      // Health historical curve
      let health = 96.0 - progressToCurrent * (96.0 - (100 - (faults.coolingJacketDegradation ? 18 : 0) - (faults.fuelInjectorClog ? 14 : 0) - (faults.lubricationPressureLeak ? 22 : 0) - (faults.crankshaftRotorImbalance ? 19 : 0)));
      health = Math.max(20, Math.min(99, Number((health + noise * 0.3).toFixed(1))));

      history.push({
        time: timeStr,
        minute: `T-${i}m`,
        altitude: Number((alt / 1000).toFixed(1)),
        engineBhp: bhp,
        rpm,
        cht,
        egt,
        oilPressure: oilP,
        fuelFlow,
        vibration: vibe,
        health
      });
    }

    return history;
  }

  public exportTelemetrySnapshot(telemetry: Telemetry, twinState: TwinState, mission: Mission) {
    const csvRows = [
      'PARAMETER,VALUE,UNIT,DESCRIPTION',
      `TIMESTAMP,"${new Date(telemetry.timestamp).toISOString()}",UTC,Observation Time`,
      `MET,"${telemetry.timeFormatted}",T+HH:MM:SS,Mission Elapsed Time`,
      `MISSION_NAME,"${mission.name}",-,Current Active Sortie`,
      `HEALTH_SCORE,${twinState.healthScore},%,Overall Digital Twin Health`,
      `HEALTH_STATUS,"${twinState.healthStatus}",-,Predictive Classification`,
      `RUL_REMAINING,${twinState.rulHoursRemaining},HRS,Remaining Useful Life`,
      `RUL_PENALTY,${twinState.estimatedRulPenalty},HRS,Accelerated Degradation Penalty`,
      `RPM,${telemetry.rpm},RPM,Crankshaft Rotational Speed`,
      `CHT_AVG,${telemetry.chtAvg},°C,Average Cylinder Head Temperature`,
      `CHT_CYL_1,${telemetry.chtCylinders[0]},°C,Cylinder 1 Head Temperature`,
      `CHT_CYL_2,${telemetry.chtCylinders[1]},°C,Cylinder 2 Head Temperature`,
      `CHT_CYL_3,${telemetry.chtCylinders[2]},°C,Cylinder 3 Head Temperature`,
      `CHT_CYL_4,${telemetry.chtCylinders[3]},°C,Cylinder 4 Head Temperature`,
      `OIL_TEMP,${telemetry.oilTemperature},°C,Oil Sump Temperature`,
      `OIL_PRESSURE,${telemetry.oilPressure},PSI,Main Gallery Oil Pressure`,
      `EGT_PEAK,${telemetry.egtPeak},°C,Peak Exhaust Gas Temperature`,
      `FUEL_FLOW,${telemetry.fuelFlowRate},L/HR,Instantaneous Fuel Burn Rate`,
      `FUEL_REMAINING,${telemetry.fuelRemaining},LITRES,Usable Fuel In Tanks`,
      `SAFE_RTB_MARGIN,${telemetry.safeRtbMarginHours},HRS,Estimated Endurance Above PNR Reserve`,
      `VIBRATION_RMS,${telemetry.vibrationRms},mm/s,Wideband Harmonics RMS`,
      `BATTERY_VOLTAGE,${telemetry.batteryVoltage},V,Avionics Bus Voltage`,
      `ALTERNATOR_CURRENT,${telemetry.alternatorCurrent},A,Power Plant Generator Output`,
      `ALTITUDE,${telemetry.altitude},FT,Barometric Flight Altitude`,
      `DENSITY_ALTITUDE,${telemetry.densityAltitude},FT,Density Altitude Equivalent`,
      `TRUE_AIRSPEED,${telemetry.trueAirspeed},KTAS,Computed Airspeed`,
      `GROUND_SPEED,${telemetry.groundSpeed},KT,GPS Velocity Groundspeed`,
      `TWIN_CONVERGENCE,${twinState.twinConvergencePercent},%,Digital Twin Synchronization`,
      `INFERENCE_LATENCY,${twinState.inferenceLatencyMs},MS,Predictive Matrix Latency`
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DHRUVAA_Telemetry_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const apiService = new DhruvaaApiService();

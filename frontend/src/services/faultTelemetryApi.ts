import {
  EngineId,
  EngineInstance,
  LiveTelemetry,
  TelemetryPoint,
  TwinState,
  FaultEvent,
  Mission,
  AiDiagnosticInsight,
  SubsystemHealth,
} from '../types/faultTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Base static definitions for the 4 aero engines
export const ENGINES_DATABASE: Record<EngineId, EngineInstance> = {
  'eng-01': {
    id: 'eng-01',
    tabKey: 'tab-eng-1',
    name: 'ENGINE 01',
    callsign: 'UAV-PT-ALPHA',
    model: 'Rotax 915 iSC3 AERO TURBO',
    engineNumber: 'SN-A915-084',
    healthPercent: 99.4,
    aiConfidence: 99.4,
    status: 'NORMAL',
    statusTag: 'NOMINAL',
    rulHours: 194.5,
    totalFlightHours: 342.1,
    missionPhase: 'CRUISE',
    isTwinSynced: true,
    colorClass: 'text-[#00f0ff]',
    bgStatusClass: 'bg-[#303443] text-[#00f0ff]',
  },
  'eng-02': {
    id: 'eng-02',
    tabKey: 'tab-eng-2',
    name: 'ENGINE 02',
    callsign: 'UAV-PT-BRAVO',
    model: 'Rotax 915 iSC3 AERO TURBO',
    engineNumber: 'SN-B915-112',
    healthPercent: 84.0,
    aiConfidence: 92.0,
    status: 'WARNING',
    statusTag: 'WARNING // THERMAL',
    rulHours: 42.0,
    totalFlightHours: 418.6,
    missionPhase: 'CRUISE',
    isTwinSynced: true,
    colorClass: 'text-[#b4c5ff]',
    bgStatusClass: 'bg-[#303443] text-[#b4c5ff]',
  },
  'eng-03': {
    id: 'eng-03',
    tabKey: 'tab-eng-3',
    name: 'ENGINE 03',
    callsign: 'UAV-PT-CHARLIE',
    model: 'Rotax 915 iSC3 AERO TURBO',
    engineNumber: 'SN-C915-039',
    healthPercent: 58.2,
    aiConfidence: 97.8,
    status: 'CRITICAL',
    statusTag: 'CRITICAL // LOW RUL',
    rulHours: 11.5,
    totalFlightHours: 580.4,
    missionPhase: 'CRUISE',
    isTwinSynced: true,
    colorClass: 'text-[#ffb4ab]',
    bgStatusClass: 'bg-[#93000a] text-[#ffdad6]',
  },
  'eng-04': {
    id: 'eng-04',
    tabKey: 'tab-eng-4',
    name: 'ENGINE 04',
    callsign: 'UAV-PT-DELTA',
    model: 'Rotax 915 iSC3 AERO TURBO',
    engineNumber: 'SN-D915-095',
    healthPercent: 88.5,
    aiConfidence: 88.5,
    status: 'WATCH',
    statusTag: 'ADVISORY // VIB',
    rulHours: 94.0,
    totalFlightHours: 295.2,
    missionPhase: 'CRUISE',
    isTwinSynced: true,
    colorClass: 'text-[#7bd0ff]',
    bgStatusClass: 'bg-[#303443] text-[#7bd0ff]',
  },
};

export const ACTIVE_MISSION: Mission = {
  id: 'miss-recon-08',
  code: 'SORTIE-9824-BRAVO',
  name: 'OPERATION DHRUVAA RECON-IV',
  callsign: 'TAPAS-MALE-UAV-02',
  uavType: 'Medium-Altitude Long-Endurance (MALE) UAV',
  tailNumber: 'IAF-UAV-9824',
  missionType: 'Autonomous Border Patrol & Persistent Surveillance',
  phase: 'CRUISE',
  altitudeFeet: 18450,
  targetAltitudeFeet: 21000,
  airspeedKnots: 118,
  progressPercent: 68.4,
  elapsedTime: '03:22:15',
  remainingTime: '01:37:45',
  fuelEnduranceHours: 4.8,
  fuelRemainingPercent: 54.2,
  waypoint: 'WP-07 (SIBERIA SECTOR GRID 4)',
  groundStationLink: 'GCS-NORTH-RAD-01 (MALE-LINK-01)',
};

export const SUBSYSTEMS_DATABASE: Record<EngineId, SubsystemHealth[]> = {
  'eng-01': [
    { id: 'sub-1', name: 'Aero Cooling Ducts', status: 'NOMINAL', icon: 'thermostat', colorClass: 'text-[#00f0ff]', detail: 'Diffuser airflow delta nominal (+0.2 kPa)' },
    { id: 'sub-2', name: 'Fuel Injection / Rail', status: 'NOMINAL', icon: 'local_gas_station', colorClass: 'text-[#00f0ff]', detail: 'High pressure common rail 3.2 bar' },
    { id: 'sub-3', name: 'Lube Oil Scavenge', status: 'NOMINAL', icon: 'oil_barrel', colorClass: 'text-[#00f0ff]', detail: 'Return pump throughput 4.9 L/min' },
    { id: 'sub-4', name: 'Turbocharger Bypass', status: 'NOMINAL', icon: 'speed', colorClass: 'text-[#00f0ff]', detail: 'Electronic wastegate position 42%' },
  ],
  'eng-02': [
    { id: 'sub-1', name: 'Aero Cooling Ducts', status: 'DEGRADED', icon: 'thermostat', colorClass: 'text-[#b4c5ff]', detail: 'Cyl 2 cooling fin thermal gradient disparity' },
    { id: 'sub-2', name: 'Fuel Injection / Rail', status: 'NOMINAL', icon: 'local_gas_station', colorClass: 'text-[#00f0ff]', detail: 'Injection pulse width within ±1.2%' },
    { id: 'sub-3', name: 'Lube Oil Scavenge', status: 'NOMINAL', icon: 'oil_barrel', colorClass: 'text-[#00f0ff]', detail: 'Main scavenge line pressure 4.8 bar' },
    { id: 'sub-4', name: 'Turbocharger Bypass', status: 'NOMINAL', icon: 'speed', colorClass: 'text-[#00f0ff]', detail: 'Wastegate actuator responsive' },
  ],
  'eng-03': [
    { id: 'sub-1', name: 'Aero Cooling Ducts', status: 'NOMINAL', icon: 'thermostat', colorClass: 'text-[#00f0ff]', detail: 'Airflow distribution within tolerance' },
    { id: 'sub-2', name: 'Fuel Injection / Rail', status: 'NOMINAL', icon: 'local_gas_station', colorClass: 'text-[#00f0ff]', detail: 'Rail pressure 3.15 bar' },
    { id: 'sub-3', name: 'Lube Oil Scavenge', status: 'CRITICAL', icon: 'oil_barrel', colorClass: 'text-[#ffb4ab]', detail: 'Metallic particulate chip detector triggered (+47 cpm)' },
    { id: 'sub-4', name: 'Turbocharger Bypass', status: 'WATCH', icon: 'speed', colorClass: 'text-[#7bd0ff]', detail: 'Intercooler delta temp elevation' },
  ],
  'eng-04': [
    { id: 'sub-1', name: 'Aero Cooling Ducts', status: 'NOMINAL', icon: 'thermostat', colorClass: 'text-[#00f0ff]', detail: 'Baffles aligned, heat flux nominal' },
    { id: 'sub-2', name: 'Fuel Injection / Rail', status: 'NOMINAL', icon: 'local_gas_station', colorClass: 'text-[#00f0ff]', detail: 'Rail pressure stable' },
    { id: 'sub-3', name: 'Lube Oil Scavenge', status: 'NOMINAL', icon: 'oil_barrel', colorClass: 'text-[#00f0ff]', detail: 'Sump temperature 91°C' },
    { id: 'sub-4', name: 'Turbocharger Bypass', status: 'DEGRADED', icon: 'speed', colorClass: 'text-[#7bd0ff]', detail: 'Wastegate hunting: 1.2 Hz micro-oscillation' },
  ],
};

export const TWIN_STATE_DATABASE: Record<EngineId, TwinState> = {
  'eng-01': {
    engineId: 'eng-01',
    twinModelVersion: 'DHRUVAA-CADX-V4.2',
    syncStatus: 'SYNCHRONIZED',
    divergenceScoreMae: 0.94,
    thermodynamicParametersCount: 112,
    cylinderHotspots: [
      { id: 1, label: 'CYL-1', temp: 151, status: 'NOMINAL', xPercent: 38, yPercent: 32 },
      { id: 2, label: 'CYL-2', temp: 153, status: 'NOMINAL', xPercent: 54, yPercent: 34 },
      { id: 3, label: 'CYL-3', temp: 150, status: 'NOMINAL', xPercent: 36, yPercent: 58 },
      { id: 4, label: 'CYL-4', temp: 152, status: 'NOMINAL', xPercent: 56, yPercent: 60 },
    ],
    lastCalibrationUtc: '14:26:00 UTC',
  },
  'eng-02': {
    engineId: 'eng-02',
    twinModelVersion: 'DHRUVAA-CADX-V4.2',
    syncStatus: 'SYNCHRONIZED',
    divergenceScoreMae: 14.82,
    thermodynamicParametersCount: 112,
    cylinderHotspots: [
      { id: 1, label: 'CYL-1', temp: 152, status: 'NOMINAL', xPercent: 38, yPercent: 32 },
      { id: 2, label: 'CYL-2', temp: 178, status: 'WARNING', xPercent: 54, yPercent: 34 },
      { id: 3, label: 'CYL-3', temp: 154, status: 'NOMINAL', xPercent: 36, yPercent: 58 },
      { id: 4, label: 'CYL-4', temp: 153, status: 'NOMINAL', xPercent: 56, yPercent: 60 },
    ],
    lastCalibrationUtc: '14:28:44 UTC',
  },
  'eng-03': {
    engineId: 'eng-03',
    twinModelVersion: 'DHRUVAA-CADX-V4.2',
    syncStatus: 'DEGRADED',
    divergenceScoreMae: 28.90,
    thermodynamicParametersCount: 112,
    cylinderHotspots: [
      { id: 1, label: 'CYL-1', temp: 164, status: 'NOMINAL', xPercent: 38, yPercent: 32 },
      { id: 2, label: 'CYL-2', temp: 168, status: 'WARNING', xPercent: 54, yPercent: 34 },
      { id: 3, label: 'CYL-3', temp: 163, status: 'NOMINAL', xPercent: 36, yPercent: 58 },
      { id: 4, label: 'CYL-4', temp: 167, status: 'WARNING', xPercent: 56, yPercent: 60 },
    ],
    lastCalibrationUtc: '14:27:12 UTC',
  },
  'eng-04': {
    engineId: 'eng-04',
    twinModelVersion: 'DHRUVAA-CADX-V4.2',
    syncStatus: 'SYNCHRONIZED',
    divergenceScoreMae: 6.40,
    thermodynamicParametersCount: 112,
    cylinderHotspots: [
      { id: 1, label: 'CYL-1', temp: 157, status: 'NOMINAL', xPercent: 38, yPercent: 32 },
      { id: 2, label: 'CYL-2', temp: 159, status: 'NOMINAL', xPercent: 54, yPercent: 34 },
      { id: 3, label: 'CYL-3', temp: 156, status: 'NOMINAL', xPercent: 36, yPercent: 58 },
      { id: 4, label: 'CYL-4', temp: 158, status: 'NOMINAL', xPercent: 56, yPercent: 60 },
    ],
    lastCalibrationUtc: '14:28:01 UTC',
  },
};

export const DIAGNOSTIC_INSIGHTS: Record<EngineId, AiDiagnosticInsight> = {
  'eng-01': {
    engineId: 'eng-01',
    autonomicConfidence: 99.4,
    detectedAnomaly: 'All Thermodynamic & Vibrational Channels Within Baseline Envelope',
    severityBadge: 'LEVEL 0 // ALL SYSTEMS GREEN',
    severityLevel: 0,
    severityClass: 'text-[#00f0ff]',
    evidenceChain: [
      { id: 'ev-1', tag: '01', title: 'Uniform Cylinder Head Thermals', desc: 'Max cylinder delta is <3.2°C across all power states.', severity: 'NOMINAL' },
      { id: 'ev-2', tag: '02', title: 'Digital Twin Conformance', desc: 'Predictive residual stays strictly inside ±1.1% margin.', severity: 'NOMINAL' },
      { id: 'ev-3', tag: '03', title: 'Oil Viscosity Equilibrium', desc: 'Pressure delta tracking sumps within 0.1 bar of model.', severity: 'NOMINAL' },
      { id: 'ev-4', tag: '04', title: 'Spectral Density Pristine', desc: 'No harmonics detected outside baseline gearmesh frequencies.', severity: 'NOMINAL' },
    ],
    rankedRootCauses: [
      { name: '1. Baseline Operational Wear', probability: 98, barColorClass: 'bg-[#00f0ff]', textColorClass: 'text-[#00f0ff]' },
      { name: '2. Minor Calibrated Drift', probability: 2, barColorClass: 'bg-[#849495]', textColorClass: 'text-[#849495]' },
      { name: '3. Sensor Transience', probability: 0, barColorClass: 'bg-[#849495]', textColorClass: 'text-[#849495]' },
    ],
    prescribedInterventions: [
      { id: 'act-1', type: 'IMMEDIATE', label: 'IN-FLIGHT STATUS', action: 'Continue nominal mission trajectory without power derate.', severity: 'NORMAL', icon: 'flight_takeoff' },
      { id: 'act-2', type: 'POST-SORTIE', label: 'ROUTINE PRE-FLIGHT', action: 'Standard turnaround fuel filter and magneto check.', severity: 'NORMAL', icon: 'build' },
    ],
    reasoningSynthesis: 'Engine 01 demonstrates nominal combustion efficiency. All 4 cylinders track digital twin thermodynamic models within 0.8°C.',
    toolTrace: [
      { tool: 'dhruvaa_telemetry.get_engine_health', payload: { target: 'ENG_01', status: 'nominal', residual: 0.0094 } },
      { tool: 'dhruvaa_models.validate_invariants', payload: { all_pass: true, violated_rules: 0 } },
    ],
  },
  'eng-02': {
    engineId: 'eng-02',
    autonomicConfidence: 92.0,
    detectedAnomaly: 'Progressive Cooling Fin Aerodynamic Restriction & Cylinder 2 Heat Flux Degradation',
    severityBadge: 'LEVEL 2 // FLIGHT WARNING',
    severityLevel: 2,
    severityClass: 'text-[#b4c5ff]',
    evidenceChain: [
      { id: 'ev-1', tag: '01', title: 'Rising CHT Trend', desc: '+14.2% acceleration over past 4.2 flight hours', severity: 'WARNING' },
      { id: 'ev-2', tag: '02', title: 'Heat Flux Residual Decay', desc: '-8.1% vs calibrated digital twin aero-thermal model', severity: 'WARNING' },
      { id: 'ev-3', tag: '03', title: 'CHT / EGT Shift', desc: 'Correlation coefficient drifted from 0.88 down to 0.61', severity: 'WARNING' },
      { id: 'ev-4', tag: '04', title: 'Cylinder Delta Disparity', desc: 'Cylinder #2 exceeds 22°C threshold vs adjacent Cyl #1/#3', severity: 'WARNING' },
    ],
    rankedRootCauses: [
      { name: '1. Cowling Air Baffle Distortion', probability: 68, barColorClass: 'bg-[#b4c5ff]', textColorClass: 'text-[#b4c5ff]' },
      { name: '2. Cooling Fin Deposition', probability: 24, barColorClass: 'bg-[#00f0ff]', textColorClass: 'text-[#00f0ff]' },
      { name: '3. Thermocouple Drift', probability: 8, barColorClass: 'bg-[#849495]', textColorClass: 'text-[#849495]' },
    ],
    prescribedInterventions: [
      { id: 'act-1', type: 'IMMEDIATE', label: 'IMMEDIATE IN-FLIGHT', action: 'Derate cruise throttle ceiling to 78% to suppress thermal peak below 172°C.', severity: 'WARNING', icon: 'flight_takeoff' },
      { id: 'act-2', type: 'POST-SORTIE', label: 'POST-SORTIE MAINTENANCE', action: 'Borescope inspection of cylinder baffle and cooling duct seals before next sortie.', severity: 'NORMAL', icon: 'build' },
    ],
    reasoningSynthesis: 'Engine 02 displays localized convective stagnation on Cylinder 2 fins. Lack of corresponding oil sump temperature surge rules out global oil scavenge breakdown. Recommend immediate airspeed adjustment to maintain dynamic head and scheduling maintenance borescope.',
    toolTrace: [
      { tool: 'dhruvaa_telemetry.get_engine_health', payload: { target: 'ENG_02', state: 'degraded_cooling', cht_peak: 178.4, residual_deviation: 0.142, status_code: 204 } },
      { tool: 'dhruvaa_faults.get_fault_correlations', payload: { cluster: 'THERMAL_CH2', most_probable: 'COWLING_BAFFLE_RESTRICTION', confidence: 0.92, rul_impact_hours: -24.5 } },
    ],
  },
  'eng-03': {
    engineId: 'eng-03',
    autonomicConfidence: 97.8,
    detectedAnomaly: 'Premature Main Crank Journal Spalling & Rapid Bearing Remaining Useful Life Decay',
    severityBadge: 'LEVEL 3 // IMMEDIATE ABORT ADVISORY',
    severityLevel: 3,
    severityClass: 'text-[#ffb4ab]',
    evidenceChain: [
      { id: 'ev-1', tag: '01', title: 'Metallic Particulate Indication', desc: 'Inductive chip detector detected +47 count per minute.', severity: 'CRITICAL' },
      { id: 'ev-2', tag: '02', title: 'RUL Prediction Degradation', desc: 'Remaining Useful Life dropped from 140h to <11.5 flight hours.', severity: 'CRITICAL' },
      { id: 'ev-3', tag: '03', title: 'High-Frequency Kurtosis Spike', desc: 'Triaxial accelerometer registers 2.8 kHz defect tone harmonic.', severity: 'CRITICAL' },
      { id: 'ev-4', tag: '04', title: 'Lube Pressure Residual Drop', desc: 'Main gallery pressure dropped 1.1 bar below digital twin curve.', severity: 'CRITICAL' },
    ],
    rankedRootCauses: [
      { name: '1. Bearing Raceway Fatigue Spall', probability: 84, barColorClass: 'bg-[#ef4444]', textColorClass: 'text-[#ffb4ab]' },
      { name: '2. Oil Scavenge Pump Cavitation', probability: 12, barColorClass: 'bg-[#7bd0ff]', textColorClass: 'text-[#7bd0ff]' },
      { name: '3. Viscosity Thermal Thinning', probability: 4, barColorClass: 'bg-[#849495]', textColorClass: 'text-[#849495]' },
    ],
    prescribedInterventions: [
      { id: 'act-1', type: 'IMMEDIATE', label: 'IMMEDIATE FLIGHT ABORT', action: 'Execute immediate RTB (Return to Base). Limit G-loading and avoid abrupt throttle transients.', severity: 'CRITICAL', icon: 'flight_land' },
      { id: 'act-2', type: 'POST-SORTIE', label: 'CRITICAL GROUND OVERHAUL', action: 'Engine removal for teardown inspection; replace main crank bearings.', severity: 'CRITICAL', icon: 'warning' },
    ],
    reasoningSynthesis: 'High vibration kurtosis combined with inductive chip count indicates subsurface micro-spalling on the main crankshaft journal. Rapid RUL depletion requires mission curtailment.',
    toolTrace: [
      { tool: 'dhruvaa_telemetry.get_vibration_spectra', payload: { target: 'ENG_03', kurtosis: 6.4, rms_g: 4.85, defect_freq: '2.8kHz' } },
      { tool: 'dhruvaa_diagnostics.evaluate_rul', payload: { baseline_rul: 140.0, current_rul: 11.5, confidence: 0.978 } },
    ],
  },
  'eng-04': {
    engineId: 'eng-04',
    autonomicConfidence: 88.5,
    detectedAnomaly: 'Turbocharger Wastegate Actuator Micro-Oscillation & Intermittent Backpressure',
    severityBadge: 'LEVEL 1 // OPERATIONAL ADVISORY',
    severityLevel: 1,
    severityClass: 'text-[#7bd0ff]',
    evidenceChain: [
      { id: 'ev-1', tag: '01', title: 'Manifold Pressure Hunting', desc: 'MAP oscillates at 1.2 Hz during fixed 80% throttle command.', severity: 'WATCH' },
      { id: 'ev-2', tag: '02', title: 'Pneumatic Actuator Hysteresis', desc: 'Stepper feedback delay recorded at +140ms beyond spec.', severity: 'WATCH' },
      { id: 'ev-3', tag: '03', title: 'EGT Minor Wavefront', desc: 'All cylinders demonstrate synchronized 6°C fluctuation.', severity: 'WATCH' },
      { id: 'ev-4', tag: '04', title: 'Turbine RPM Jitter', desc: 'Exducer speed delta ±850 RPM without altitude variation.', severity: 'WATCH' },
    ],
    rankedRootCauses: [
      { name: '1. Pneumatic Wastegate Carbonization', probability: 59, barColorClass: 'bg-[#7bd0ff]', textColorClass: 'text-[#7bd0ff]' },
      { name: '2. MAP Sensor Sampling Lag', probability: 26, barColorClass: 'bg-[#00f0ff]', textColorClass: 'text-[#00f0ff]' },
      { name: '3. Actuator Linkage Play', probability: 15, barColorClass: 'bg-[#849495]', textColorClass: 'text-[#849495]' },
    ],
    prescribedInterventions: [
      { id: 'act-1', type: 'IMMEDIATE', label: 'OPERATIONAL MONITORING', action: 'Set fixed throttle bias at 76% to bypass harmonic oscillation window.', severity: 'NORMAL', icon: 'tune' },
      { id: 'act-2', type: 'POST-SORTIE', label: 'INSPECTION SERVICE', action: 'Inspect wastegate pneumatic solenoid and clean carbon deposit on bypass butterfly.', severity: 'NORMAL', icon: 'build' },
    ],
    reasoningSynthesis: 'Slight MAP oscillation detected due to actuator hysteresis in turbo bypass loop. Overall mechanical integrity remains stable with minimal RUL impact.',
    toolTrace: [
      { tool: 'dhruvaa_telemetry.get_manifold_pressure', payload: { target: 'ENG_04', map_oscillation_hz: 1.2, actuator_lag_ms: 140 } },
    ],
  },
};

export const ACTIVE_FAULTS_LIST: FaultEvent[] = [
  {
    id: 'flt-01',
    timestamp: '13:50:12 UTC',
    relativeTime: 'T+03:22:15',
    component: 'Cylinder #2 Fin Assembly',
    subsystem: 'Aero Cooling Ducts',
    severity: 'WARNING',
    title: '13:50:12 // CHT SPIKE',
    description: 'Cyl 2 CHT exceeded 174°C under 82% cruise',
    timelinePct: 75,
  },
  {
    id: 'flt-02',
    timestamp: '12:28:40 UTC',
    relativeTime: 'T+02:00:43',
    component: 'Digital Twin Residual',
    subsystem: 'Thermodynamic Baseline',
    severity: 'WATCH',
    title: '12:28:40 // RESIDUAL DELTA',
    description: 'Model heat flux residual drifted -4.2%',
    timelinePct: 45,
  },
  {
    id: 'flt-03',
    timestamp: '11:15:20 UTC',
    relativeTime: 'T+00:47:23',
    component: 'Engine 01 Spark Synchronizer',
    subsystem: 'Ignition / CDI',
    severity: 'NORMAL',
    title: '11:15:20 // MAGNETO TEST',
    description: 'Autonomous CDI dual ignition switch pass (RPM drop <40)',
    timelinePct: 18,
  },
  {
    id: 'flt-04',
    timestamp: '14:05:30 UTC',
    relativeTime: 'T+03:37:33',
    component: 'Engine 02 Throttle Derate Advisory',
    subsystem: 'Autonomic Reasoner',
    severity: 'WARNING',
    title: '14:05:30 // ADVISORY ISSUED',
    description: 'Recommended throttle derate to 78% cruise limit',
    timelinePct: 88,
  },
];

// Generate deterministic historical telemetry for charts
export function generateHistoricalTelemetry(engineId: EngineId, range: string = 'SORTIE'): TelemetryPoint[] {
  const pointsCount = 40;
  const data: TelemetryPoint[] = [];
  const baseTemp = engineId === 'eng-02' ? 152 : engineId === 'eng-03' ? 162 : 150;
  const isEng2 = engineId === 'eng-02';
  const isEng3 = engineId === 'eng-03';

  for (let i = 0; i < pointsCount; i++) {
    const progress = i / (pointsCount - 1);
    const timeSec = Math.round(progress * 16200); // 4.5 hours in seconds
    const hours = Math.floor(timeSec / 3600);
    const mins = Math.floor((timeSec % 3600) / 60);
    const secs = timeSec % 60;
    const timeStr = `${String(10 + hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Baseline twin curve
    const baselineCht = baseTemp + Math.sin(progress * Math.PI) * 4;

    // Observed CHT with divergence if Engine 02
    let observedCht = baselineCht + (Math.sin(i * 0.4) * 1.2);
    if (isEng2) {
      if (progress > 0.65) {
        // Divergence spike up to 178.4°C
        const factor = (progress - 0.65) / 0.35;
        observedCht += factor * 26.4;
      }
    } else if (isEng3) {
      observedCht += Math.sin(i * 0.8) * 3 + (progress * 12);
    }

    // EGTs
    const baseEgt = 780 + Math.sin(progress * 3) * 5;
    const egt1 = Math.round(baseEgt + (Math.sin(i) * 3));
    const egt2 = isEng2 && progress > 0.65 ? Math.round(baseEgt + 42 + (Math.sin(i) * 2)) : Math.round(baseEgt + 2);
    const egt3 = Math.round(baseEgt + 4 + (Math.cos(i) * 3));
    const egt4 = Math.round(baseEgt + (Math.sin(i * 1.5) * 2));

    // Oil pressure (bar)
    let oilPress = 4.8 + Math.sin(i * 0.2) * 0.15;
    if (isEng3 && progress > 0.6) {
      oilPress -= (progress - 0.6) * 1.8;
    }

    // Vibration (G)
    let vibe = 1.4 + Math.abs(Math.sin(i * 0.5)) * 0.4;
    if (isEng3) {
      vibe = 2.0 + progress * 2.85;
    }

    data.push({
      timestamp: timeStr,
      timeSec,
      observedCht: parseFloat(observedCht.toFixed(1)),
      twinBaselineCht: parseFloat(baselineCht.toFixed(1)),
      egt1,
      egt2,
      egt3,
      egt4,
      oilPressure: parseFloat(oilPress.toFixed(2)),
      oilTemp: Math.round(88 + progress * 8),
      vibrationRms: parseFloat(vibe.toFixed(2)),
      rpm: Math.round(2500 + Math.sin(i * 0.3) * 35),
      fuelFlow: parseFloat((25.4 + Math.sin(i * 0.2) * 1.2).toFixed(1)),
      divergence: parseFloat((observedCht - baselineCht).toFixed(1)),
      isAnomalyPoint: isEng2 && progress > 0.7 && progress < 0.85,
    });
  }

  return data;
}

// Generate base live telemetry state
export function getInitialLiveTelemetry(engineId: EngineId): LiveTelemetry {
  const isEng2 = engineId === 'eng-02';
  const isEng3 = engineId === 'eng-03';
  const isEng4 = engineId === 'eng-04';

  return {
    timestamp: '14:28:44 UTC',
    rpm: isEng4 ? 2515 : 2540,
    cht: isEng2 ? 178.4 : isEng3 ? 168.1 : isEng4 ? 158.3 : 151.2,
    chtBaseline: 152.0,
    chtCylinders: isEng2 ? [152, 178, 154, 153] : isEng3 ? [164, 168, 163, 167] : isEng4 ? [157, 159, 156, 158] : [151, 153, 150, 152],
    egt: isEng2 ? 826 : isEng3 ? 812 : isEng4 ? 801 : 775,
    egtCylinders: isEng2 ? [784, 826, 789, 781] : isEng3 ? [810, 812, 808, 814] : isEng4 ? [795, 801, 792, 798] : [772, 775, 770, 774],
    oilPressureBar: isEng3 ? 3.7 : 4.8,
    oilTempC: isEng2 ? 92 : isEng3 ? 98 : 89,
    fuelFlowLph: 26.2,
    fuelPressureBar: 3.2,
    vibrationRmsG: isEng3 ? 4.85 : isEng4 ? 2.35 : 1.82,
    vibrationKurtosis: isEng3 ? 6.4 : 3.12,
    batteryVoltageV: 28.4,
    alternatorCurrentA: 44.8,
    manifoldPressureInHg: isEng4 ? 28.9 : 29.4,
    twinDivergenceMae: isEng2 ? 14.82 : isEng3 ? 28.90 : isEng4 ? 6.40 : 0.94,
  };
}

// Service methods
export const TelemetryService = {
  getApiBaseUrl: () => API_BASE_URL,

  getEngines(): EngineInstance[] {
    return Object.values(ENGINES_DATABASE);
  },

  getEngineById(id: EngineId): EngineInstance | null {
    return ENGINES_DATABASE[id] || null;
  },

  getActiveMission(): Mission {
    return ACTIVE_MISSION;
  },

  getSubsystems(engineId: EngineId): SubsystemHealth[] {
    return SUBSYSTEMS_DATABASE[engineId] || SUBSYSTEMS_DATABASE['eng-01'];
  },

  getTwinState(engineId: EngineId): TwinState {
    return TWIN_STATE_DATABASE[engineId] || TWIN_STATE_DATABASE['eng-01'];
  },

  getActiveAlerts(engineId?: EngineId): FaultEvent[] {
    return ACTIVE_FAULTS_LIST;
  },

  getDiagnosticInsight(engineId: EngineId): AiDiagnosticInsight {
    return DIAGNOSTIC_INSIGHTS[engineId] || DIAGNOSTIC_INSIGHTS['eng-01'];
  },

  getTelemetryHistory(engineId: EngineId, timeRange: string = 'SORTIE'): TelemetryPoint[] {
    return generateHistoricalTelemetry(engineId, timeRange);
  },

  // Simulated Telemetry Stream with jitter
  simulateNextTelemetry(prev: LiveTelemetry, engineId: EngineId): LiveTelemetry {
    const isEng2 = engineId === 'eng-02';
    const isEng3 = engineId === 'eng-03';
    const isEng4 = engineId === 'eng-04';

    // Micro jitter
    const rpmJitter = (Math.random() - 0.49) * 12;
    const chtJitter = (Math.random() - 0.48) * 0.3;
    const egtJitter = (Math.random() - 0.48) * 1.5;
    const oilJitter = (Math.random() - 0.5) * 0.02;
    const fuelJitter = (Math.random() - 0.5) * 0.1;
    const vibeJitter = (Math.random() - 0.5) * 0.04;

    const baseCht = isEng2 ? 178.4 : isEng3 ? 168.1 : isEng4 ? 158.3 : 151.2;
    const newCht = parseFloat(Math.max(140, Math.min(195, baseCht + chtJitter)).toFixed(1));

    const egtCyl1 = Math.round((isEng2 ? 784 : 772) + egtJitter);
    const egtCyl2 = Math.round((isEng2 ? 826 : 775) + egtJitter);
    const egtCyl3 = Math.round((isEng2 ? 789 : 770) + egtJitter);
    const egtCyl4 = Math.round((isEng2 ? 781 : 774) + egtJitter);

    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;

    return {
      ...prev,
      timestamp: timeStr,
      rpm: Math.round(prev.rpm + rpmJitter),
      cht: newCht,
      egt: isEng2 ? egtCyl2 : egtCyl1,
      egtCylinders: [egtCyl1, egtCyl2, egtCyl3, egtCyl4],
      chtCylinders: isEng2 
        ? [152, Math.round(newCht), 154, 153] 
        : isEng3 
          ? [164, 168, 163, 167] 
          : [151, 153, 150, 152],
      oilPressureBar: parseFloat(Math.max(2.0, Math.min(6.5, prev.oilPressureBar + oilJitter)).toFixed(2)),
      oilTempC: Math.round(prev.oilTempC + (Math.random() - 0.5) * 0.2),
      fuelFlowLph: parseFloat(Math.max(18, Math.min(36, prev.fuelFlowLph + fuelJitter)).toFixed(1)),
      vibrationRmsG: parseFloat(Math.max(0.8, Math.min(8.0, prev.vibrationRmsG + vibeJitter)).toFixed(2)),
      batteryVoltageV: parseFloat((28.4 + (Math.random() - 0.5) * 0.1).toFixed(1)),
      alternatorCurrentA: parseFloat((44.8 + (Math.random() - 0.5) * 0.4).toFixed(1)),
      manifoldPressureInHg: parseFloat((29.4 + (Math.random() - 0.5) * 0.2).toFixed(1)),
      twinDivergenceMae: parseFloat(Math.max(0.2, prev.twinDivergenceMae + (Math.random() - 0.5) * 0.08).toFixed(2)),
    };
  },

  // AI Advisory Reasoning Generator
  generateAiResponse(
    query: string,
    engine: EngineInstance,
    telemetry: LiveTelemetry,
    insight: AiDiagnosticInsight
  ): string {
    const q = query.toLowerCase();

    if (q.includes('why is engine health decreasing') || q.includes('health decreasing')) {
      if (engine.id === 'eng-02') {
        return `[AUTONOMIC ANALYSIS // ENGINE 02]\nEngine health is assessed at ${engine.healthPercent}% (AI Conf: ${engine.aiConfidence}%) due to progressive thermal divergence on Cylinder #2. The CHT is currently ${telemetry.cht}°C (+${(telemetry.cht - telemetry.chtBaseline).toFixed(1)}°C above Digital Twin nominal baseline of 152°C). Corroborating evidence points with 68% Bayesian probability to cowling air baffle distortion restricting convective fin heat dissipation.`;
      }
      if (engine.id === 'eng-03') {
        return `[CRITICAL ANOMALY // ENGINE 03]\nEngine health has degraded to ${engine.healthPercent}% due to severe mechanical bearing wear. Inductive chip detector indicates +47 metallic particulate counts/min, and vibration kurtosis is at ${telemetry.vibrationKurtosis} (critical threshold >5.0).`;
      }
      return `[DIAGNOSTIC STATUS // ${engine.name}]\nEngine health is nominal at ${engine.healthPercent}%. All thermodynamic and vibrational parameters track within the digital twin ±1.1% margin.`;
    }

    if (q.includes('current rul') || q.includes('rul')) {
      return `[PREDICTIVE REMAINING USEFUL LIFE]\nCurrent estimated RUL for ${engine.callsign} (${engine.name}) is ${engine.rulHours} Flight Hours under current operating conditions. At current cruise throttle (82%), thermal stress accelerates component fatigue. Implementing the recommended throttle derate to 78% will extend safe RUL by approximately +28 hours.`;
    }

    if (q.includes('why is cht increasing') || q.includes('cht')) {
      return `[THERMAL DIVERGENCE AUDIT]\nCylinder Head Temperature is currently ${telemetry.cht}°C (Max operational ceiling: 180°C).\nPrimary factors:\n1. Cylinder 2 heat flux residual has decayed -8.1% against the virtual aero-thermal model.\n2. CHT/EGT correlation coefficient dropped from 0.88 to 0.61, indicating a cooling-side bottleneck rather than an over-fueling event.\n3. Oil sump temperature remains stable at ${telemetry.oilTempC}°C, isolating the fault to external cowling baffle bypass.`;
    }

    if (q.includes('active fault') || q.includes('faults')) {
      return `[ACTIVE TELEMETRY ALERTS]\nCurrently 2 active events on the sortie timeline:\n- 13:50:12 UTC: CHT spike on Cyl #2 (Exceeded 174°C, reached peak ${telemetry.cht}°C) [WARNING]\n- 12:28:40 UTC: Model heat flux residual drifted -4.2% [WATCH]\n- Status: Autonomic reasoner recommends applying immediate in-flight throttle derate to 78%.`;
    }

    // Default contextual advisory response
    return `[DHRUVAA AUTONOMIC COPILOT // ${engine.callsign}]\nCurrent telemetry review: RPM ${telemetry.rpm}, CHT ${telemetry.cht}°C, EGT ${telemetry.egt}°C, Lube Press ${telemetry.oilPressureBar} bar. Digital Twin MAE Divergence is ${telemetry.twinDivergenceMae}%. System is advisory only and will never directly override pilot or flight-control commands. Recommended action: ${insight.prescribedInterventions[0]?.action || 'Continue mission monitoring.'}`;
  },
};

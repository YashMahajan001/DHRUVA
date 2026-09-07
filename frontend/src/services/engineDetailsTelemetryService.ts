import {
  EngineInstance,
  Mission,
  SubsystemState,
  TelemetryReading,
  FaultEvent,
  SubsystemId
} from '../types/engineDetailsTypes';

export const INITIAL_ENGINES: EngineInstance[] = [
  {
    id: 'UAV-ENG-99418',
    serialNumber: 'SN-ROTAX-915-084',
    model: 'Rotax 915iS / AERO-TWIN',
    type: 'Turbocharged 4-Cylinder Boxer',
    displacement: '1,352 cc',
    maxRpm: 5800,
    nominalRpm: 3200,
    ratedPowerHp: 141,
    operatingHours: 1842,
    mtbfHours: 420,
    rulHours: 184,
    healthScore: 92,
    healthStatus: 'NOMINAL',
    twinFidelity: 99.4,
    activeSensors: 18,
    totalSensors: 18,
    pipelineLatencyMs: 14,
    pipelinePort: 9443
  },
  {
    id: 'UAV-ENG-88204',
    serialNumber: 'SN-ROTAX-915-052',
    model: 'Rotax 915iS / MOD-B',
    type: 'Turbocharged 4-Cylinder Boxer',
    displacement: '1,352 cc',
    maxRpm: 5800,
    nominalRpm: 3400,
    ratedPowerHp: 141,
    operatingHours: 2310,
    mtbfHours: 350,
    rulHours: 112,
    healthScore: 86,
    healthStatus: 'WATCH',
    twinFidelity: 98.8,
    activeSensors: 18,
    totalSensors: 18,
    pipelineLatencyMs: 19,
    pipelinePort: 9443
  },
  {
    id: 'UAV-ENG-10291',
    serialNumber: 'SN-ROTAX-912-119',
    model: 'Rotax 912iS Sport',
    type: 'Naturally Aspirated 4-Cylinder Boxer',
    displacement: '1,211 cc',
    maxRpm: 5800,
    nominalRpm: 3000,
    ratedPowerHp: 100,
    operatingHours: 940,
    mtbfHours: 600,
    rulHours: 320,
    healthScore: 97,
    healthStatus: 'NOMINAL',
    twinFidelity: 99.7,
    activeSensors: 16,
    totalSensors: 16,
    pipelineLatencyMs: 12,
    pipelinePort: 9443
  }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'MSN-GARUDA-04',
    callsign: 'OPERATION GARUDA-IV',
    uavTailNumber: 'UAV-TAPAS-07',
    uavPlatform: 'MALE Tactical UAV System',
    missionType: 'Extended ISR & Autonomous Perimeter Recon',
    phase: 'High-Altitude Cruise',
    altitudeFt: 18500,
    altitudeMeters: 5638,
    groundSpeedKts: 114,
    elapsedSeconds: 14820, // 4h 07m
    totalDurationSeconds: 28800, // 8h
    remainingSeconds: 13980, // 3h 53m
    fuelCapacityLiters: 190,
    fuelRemainingLiters: 124.6,
    enduranceHoursRemaining: 3.8,
    operator: {
      callsign: 'CDR. V. SHASTRI',
      rank: 'WING COMMANDER',
      role: 'LEVEL 2 // FLIGHT CONTROLLER',
      station: 'GCS-NORTH-TACTICAL-ALPHA'
    }
  },
  {
    id: 'MSN-SURYA-09',
    callsign: 'OPERATION SURYA-IX',
    uavTailNumber: 'UAV-RUSTOM-12',
    uavPlatform: 'High-Altitude Strategic Drone',
    missionType: 'Thermal Border Surveillance',
    phase: 'Stationary Loiter',
    altitudeFt: 22000,
    altitudeMeters: 6705,
    groundSpeedKts: 92,
    elapsedSeconds: 7200,
    totalDurationSeconds: 21600,
    remainingSeconds: 14400,
    fuelCapacityLiters: 210,
    fuelRemainingLiters: 168.2,
    enduranceHoursRemaining: 5.2,
    operator: {
      callsign: 'SQN. LDR. K. MENON',
      rank: 'SQUADRON LEADER',
      role: 'LEVEL 2 // FLIGHT CONTROLLER',
      station: 'GCS-DESERT-OUTPOST'
    }
  },
  {
    id: 'MSN-VAYU-PATROL',
    callsign: 'OPERATION VAYU-PATROL',
    uavTailNumber: 'UAV-ARCHER-03',
    uavPlatform: 'Maritime Patrol Platform',
    missionType: 'Coastal Sensor Sweep & EEZ Defense',
    phase: 'Climb to Transit',
    altitudeFt: 12400,
    altitudeMeters: 3780,
    groundSpeedKts: 128,
    elapsedSeconds: 2400,
    totalDurationSeconds: 18000,
    remainingSeconds: 15600,
    fuelCapacityLiters: 175,
    fuelRemainingLiters: 159.0,
    enduranceHoursRemaining: 4.9,
    operator: {
      callsign: 'LT. CDR. S. PATEL',
      rank: 'LIEUTENANT COMMANDER',
      role: 'LEVEL 2 // FLIGHT CONTROLLER',
      station: 'GCS-COASTAL-COMMAND'
    }
  }
];

export const INITIAL_SUBSYSTEMS: Record<SubsystemId, SubsystemState> = {
  cylinder: {
    id: 'cylinder',
    index: 1,
    name: 'CYLINDER ASSEMBLY',
    badge: 'NOMINAL // 91%',
    health: 91,
    confidence: '98.2%',
    chartTag: 'CYLINDER HEAD TRANSIENT DYNAMICS',
    params: [
      { label: 'PEAK CHT TEMP', val: '182 °C', note: 'TOLERANCE < 205°C' },
      { label: 'CHT SPREAD (VARIANCE)', val: '4.0 °C', note: 'NOMINAL (± 6°C)' },
      { label: 'COMPRESSION RATIO', val: '10.4 : 1', note: 'CYL 1-4 BALANCED' },
      { label: 'VALVE CLEARANCE', val: '0.18 mm', note: 'HYDRAULIC LIFTER OK' }
    ],
    faults: [
      {
        id: 'mf-1',
        icon: 'check_circle',
        title: 'CHT Thermal Gradient Normal',
        desc: 'Deviation within ±2.2% of flight baseline.',
        timestamp: '14:24:12 UTC',
        severity: 'NORMAL'
      },
      {
        id: 'mf-2',
        icon: 'info',
        title: 'Piston Ring Acoustic Trace Cleared',
        desc: 'Harmonic FFT matched synthetic twin profile.',
        timestamp: '14:18:05 UTC',
        severity: 'NORMAL'
      }
    ]
  },
  cooling: {
    id: 'cooling',
    index: 2,
    name: 'COOLING SYSTEM',
    badge: 'ADVISORY // 84%',
    health: 84,
    confidence: '94.6%',
    chartTag: 'HEAT EXCHANGER THERMAL FLUX',
    params: [
      { label: 'COOLANT / AIR DELTA', val: '-12.4 %', note: 'MARGIN REDUCED' },
      { label: 'RADIATOR AIRFLOW', val: '42.0 m/s', note: 'RAM AIR SCOOP OPEN' },
      { label: 'PUMP RPM', val: '3,820 RPM', note: 'AUX COOLING ACTIVE' },
      { label: 'GLYCOL MIXTURE', val: '50 / 50', note: 'FREEZING -38°C' }
    ],
    faults: [
      {
        id: 'mf-3',
        icon: 'warning',
        title: 'Micro-Cavitation Detected in Loop B',
        desc: 'Transient acoustic spike at high thermal gradient.',
        timestamp: '14:21:40 UTC',
        severity: 'WATCH'
      },
      {
        id: 'mf-4',
        icon: 'check_circle',
        title: 'Thermostat Bypass Valve Responsive',
        desc: 'Flow rate verified within nominal bounds.',
        timestamp: '14:05:11 UTC',
        severity: 'NORMAL'
      }
    ]
  },
  lubrication: {
    id: 'lubrication',
    index: 3,
    name: 'LUBRICATION SYSTEM',
    badge: 'OPTIMAL // 94%',
    health: 94,
    confidence: '99.1%',
    chartTag: 'OIL RAIL PRESSURE PULSATION',
    params: [
      { label: 'OIL PRESSURE', val: '82.4 PSI', note: 'TARGET: 75-90 PSI' },
      { label: 'SUMP OIL TEMP', val: '88.2 °C', note: 'SAFE OPERATING RANGE' },
      { label: 'VISCOSITY INDEX', val: 'SAE 15W-50', note: 'DEGRADATION: 2.1%' },
      { label: 'FILTER Δ PRESSURE', val: '3.2 PSI', note: 'IMPEDANCE NOMINAL' }
    ],
    faults: [
      {
        id: 'mf-5',
        icon: 'check_circle',
        title: 'Pressure Relief Valve Calibrated',
        desc: 'No flutter observed across RPM sweep.',
        timestamp: '14:12:00 UTC',
        severity: 'NORMAL'
      },
      {
        id: 'mf-6',
        icon: 'check_circle',
        title: 'Debris Spectrometry Clean',
        desc: 'Zero ferrous wear particles logged.',
        timestamp: '13:58:33 UTC',
        severity: 'NORMAL'
      }
    ]
  },
  fuel: {
    id: 'fuel',
    index: 4,
    name: 'FUEL INJECTION SYSTEM',
    badge: 'OPTIMAL // 96%',
    health: 96,
    confidence: '98.9%',
    chartTag: 'INJECTOR PULSE WIDTH & RAIL STABILITY',
    params: [
      { label: 'FLOW RATE', val: '32.5 L/h', note: 'CRUISE FUEL BURN' },
      { label: 'INJECTOR BALANCE', val: '99.2 %', note: 'TRIM ADJUSTED' },
      { label: 'FUEL RAIL PRESSURE', val: '3.1 BAR', note: 'CONSTANT REGULATED' },
      { label: 'AFR STOICHIOMETRY', val: '14.7 : 1', note: 'LAMBDA = 1.002' }
    ],
    faults: [
      {
        id: 'mf-7',
        icon: 'check_circle',
        title: 'Injection Timing Synchronized',
        desc: 'Hall-sensor sync deviation < 0.2 deg.',
        timestamp: '14:26:02 UTC',
        severity: 'NORMAL'
      },
      {
        id: 'mf-8',
        icon: 'info',
        title: 'Vapor Purge Routine Scheduled',
        desc: 'Standby for post-flight descent phase.',
        timestamp: '14:15:30 UTC',
        severity: 'NORMAL'
      }
    ]
  },
  electrical: {
    id: 'electrical',
    index: 5,
    name: 'IGNITION / BUS',
    badge: 'OPTIMAL // 98%',
    health: 98,
    confidence: '99.8%',
    chartTag: 'PRIMARY IGNITION VOLTAGE TRANSIENTS',
    params: [
      { label: 'MAGNETO DROP', val: '25 RPM', note: 'LIMIT < 150 RPM' },
      { label: 'AVIONICS DC BUS', val: '28.4 V', note: 'ALTERNATOR NOMINAL' },
      { label: 'SPARK PLUG RESISTANCE', val: '1.2 kΩ', note: 'DUAL PLUG BALANCED' },
      { label: 'ECU REDUNDANCY', val: 'LANE A + B', note: 'HOT-SWAP ACTIVE' }
    ],
    faults: [
      {
        id: 'mf-9',
        icon: 'check_circle',
        title: 'Both Lanes Healthy',
        desc: 'Dual FADEC synchronization verified.',
        timestamp: '14:22:15 UTC',
        severity: 'NORMAL'
      },
      {
        id: 'mf-10',
        icon: 'check_circle',
        title: 'Spark Duration Constant',
        desc: 'Arc discharge within 1.4ms specification.',
        timestamp: '14:02:45 UTC',
        severity: 'NORMAL'
      }
    ]
  }
};

export const INITIAL_ALERTS: FaultEvent[] = [
  {
    id: 'ALT-1092',
    timestamp: '14:21:40 UTC',
    severity: 'WATCH',
    subsystem: 'cooling',
    component: 'Coolant Loop B Heat Exchanger',
    code: 'COOL_CAV_08',
    description: 'Micro-cavitation signature logged in coolant loop B. Acoustic amplitude elevated by 4.2 dB above synthetic baseline.',
    acknowledged: false,
    actionRequired: 'Monitor coolant return temp; switch auxiliary fan stage 2 if CHT delta exceeds 8°C.'
  },
  {
    id: 'ALT-1088',
    timestamp: '14:05:18 UTC',
    severity: 'NORMAL',
    subsystem: 'cylinder',
    component: 'Cylinder 3 Head Thermocouple',
    code: 'CYL3_TC_CAL',
    description: 'Synthetic twin calibration cycle completed with Kalman residual 0.014V. Sensor matrix validated.',
    acknowledged: true
  },
  {
    id: 'ALT-1079',
    timestamp: '13:42:01 UTC',
    severity: 'WATCH',
    subsystem: 'fuel',
    component: 'Rail Pressure Sensor Bank 2',
    code: 'FUEL_PRS_JIT',
    description: 'Transient pressure ripple detected during altitude step change from 16,000 to 18,500 ft.',
    acknowledged: true
  }
];

export function generateTelemetryTick(
  base: TelemetryReading,
  stressActive: boolean = false
): TelemetryReading {
  const jitter = (range: number) => (Math.random() - 0.5) * range;

  const stressRpm = stressActive ? 4600 + jitter(120) : 3200 + jitter(35);
  const stressCht = stressActive ? 198 + jitter(4) : 178 + jitter(1.5);
  const stressPeak = stressActive ? 208 + jitter(3) : 182 + jitter(1.8);
  const stressEgt = stressActive ? 875 + jitter(15) : 812 + jitter(8);
  const stressVibe = stressActive ? 4.8 + jitter(0.4) : 2.1 + jitter(0.15);
  const stressFuel = stressActive ? 44.2 + jitter(1.2) : 32.5 + jitter(0.4);

  return {
    timestamp: Date.now(),
    rpm: Math.round(stressRpm),
    chtAvg: Number(stressCht.toFixed(1)),
    chtPeak: Number(stressPeak.toFixed(1)),
    chtSpread: Number((stressPeak - stressCht + 2.5 + jitter(0.5)).toFixed(1)),
    egtAvg: Math.round(stressEgt),
    egtPeak: Math.round(stressEgt + 24 + jitter(5)),
    oilPressure: Number((stressActive ? 76.2 + jitter(2.5) : 82.4 + jitter(0.8)).toFixed(1)),
    oilTemperature: Number((stressActive ? 98.6 + jitter(1.5) : 88.2 + jitter(0.6)).toFixed(1)),
    fuelFlow: Number(stressFuel.toFixed(1)),
    fuelRailPressure: Number((stressActive ? 2.9 + jitter(0.2) : 3.1 + jitter(0.05)).toFixed(2)),
    vibrationAmplitude: Number(stressVibe.toFixed(2)),
    vibrationPeakHz: Number((stressActive ? 164.2 + jitter(10) : 124.8 + jitter(4)).toFixed(1)),
    batteryVoltage: Number((28.4 + jitter(0.1)).toFixed(1)),
    alternatorCurrent: Number((stressActive ? 42.1 + jitter(1.5) : 34.2 + jitter(0.8)).toFixed(1)),
    compressionRatio: 10.4,
    valveClearance: Number((0.18 + (stressActive ? 0.04 : 0)).toFixed(2)),
    radiatorAirflow: Number((stressActive ? 36.5 + jitter(2) : 42.0 + jitter(1.2)).toFixed(1)),
    coolantDelta: Number((stressActive ? -18.6 + jitter(1.5) : -12.4 + jitter(0.6)).toFixed(1)),
    manifoldPressure: Number((stressActive ? 38.2 + jitter(1.2) : 29.8 + jitter(0.5)).toFixed(1)),
    residualError: Number((stressActive ? 0.042 + jitter(0.01) : 0.014 + jitter(0.003)).toFixed(3))
  };
}

export const INITIAL_TELEMETRY: TelemetryReading = {
  timestamp: Date.now(),
  rpm: 3200,
  chtAvg: 178,
  chtPeak: 182,
  chtSpread: 4.0,
  egtAvg: 812,
  egtPeak: 836,
  oilPressure: 82.4,
  oilTemperature: 88.2,
  fuelFlow: 32.5,
  fuelRailPressure: 3.1,
  vibrationAmplitude: 2.1,
  vibrationPeakHz: 124.8,
  batteryVoltage: 28.4,
  alternatorCurrent: 34.2,
  compressionRatio: 10.4,
  valveClearance: 0.18,
  radiatorAirflow: 42.0,
  coolantDelta: -12.4,
  manifoldPressure: 29.8,
  residualError: 0.014
};

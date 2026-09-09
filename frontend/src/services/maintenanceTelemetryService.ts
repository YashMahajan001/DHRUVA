/**
 * DHRUVAA Telemetry Service Layer
 * Supports Simulated Engine Dynamics and provides an abstraction
 * layer ready for FastAPI, WebSockets, or MQTT endpoints.
 */

import { EngineInstance, Telemetry, ComponentHealth, FaultEvent, WorkOrder } from '../types/maintenanceEngine';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export const INITIAL_COMPONENTS_ENG03: ComponentHealth[] = [
  {
    id: 'comp-03-bearing',
    name: 'Crankshaft Main Bearings (#2 Spall)',
    subsystem: 'Mechanical',
    healthScore: 41,
    estimatedRulHours: 18,
    lastInspected: '8 hrs ago',
    nextServiceDueHours: 'IMMEDIATE',
    status: 'CRITICAL',
    anomalyNotes: 'Ultrasonic acoustic signature shows metal-to-metal micro-spalling. Harmonic vibration peak @ 2.45 kHz (+19 dB).',
    directiveNotes: 'Remove engine from service immediately; complete overhaul required before next flight.',
    activeWorkOrderId: '8924',
    sensorChannels: ['VIB-ACC-Z1', 'ACOUSTIC-ULTRA-02', 'OIL-DEBRIS-P03']
  },
  {
    id: 'comp-03-cooler',
    name: 'Oil Cooler & Heat Exchanger',
    subsystem: 'Lubrication',
    healthScore: 68,
    estimatedRulHours: 24,
    lastInspected: '14 hrs ago',
    nextServiceDueHours: 'IMMEDIATE',
    status: 'WARNING',
    anomalyNotes: 'Increased scavenger line resistance and metallic particulate contamination.',
    sensorChannels: ['OIL-P-TRANSDUCER', 'OIL-T-CORE']
  },
  {
    id: 'comp-03-cyl',
    name: 'Cylinder 1-4 Assemblies',
    subsystem: 'Combustion',
    healthScore: 78,
    estimatedRulHours: 42,
    lastInspected: '20 hrs ago',
    nextServiceDueHours: 30,
    status: 'WATCH',
    sensorChannels: ['CHT-T1', 'CHT-T2', 'EGT-T1', 'EGT-T2']
  },
  {
    id: 'comp-03-mag',
    name: 'Dual Magnetos & Spark Array',
    subsystem: 'Electrical',
    healthScore: 92,
    estimatedRulHours: 220,
    lastInspected: '35 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    sensorChannels: ['MAG-L-PULSE', 'MAG-R-PULSE', 'IGN-BUS-V']
  }
];

export const INITIAL_COMPONENTS_ENG02: ComponentHealth[] = [
  {
    id: 'comp-02-cyl2',
    name: 'Cylinder #2 Cooling Fin Assembly & Baffle',
    subsystem: 'Combustion',
    healthScore: 64,
    estimatedRulHours: 61,
    lastInspected: '12 hrs ago',
    nextServiceDueHours: 50,
    status: 'WARNING',
    anomalyNotes: 'Progressive thermal dissipation decay (+14% CHT relative to baseline at 75% throttle).',
    directiveNotes: 'Borescope inspect cowling baffles and thermal dissipation fins at next 50-hour window.',
    activeWorkOrderId: '8925',
    sensorChannels: ['CHT-T2-EX', 'COWLING-PRESS-DELTA', 'BAFFLE-SEAL-MON']
  },
  {
    id: 'comp-02-cooler',
    name: 'Oil Cooler & Heat Exchanger',
    subsystem: 'Lubrication',
    healthScore: 84,
    estimatedRulHours: 61,
    lastInspected: '12 hrs ago',
    nextServiceDueHours: 50,
    status: 'WATCH',
    anomalyNotes: 'Minor thermal accumulation under continuous cruise throttle.',
    sensorChannels: ['OIL-P-TRANSDUCER', 'OIL-T-CORE']
  },
  {
    id: 'comp-02-cyl',
    name: 'Cylinder 1-4 Assemblies',
    subsystem: 'Combustion',
    healthScore: 82,
    estimatedRulHours: 85,
    lastInspected: '22 hrs ago',
    nextServiceDueHours: 100,
    status: 'WATCH',
    sensorChannels: ['CHT-T1', 'CHT-T3', 'CHT-T4']
  },
  {
    id: 'comp-02-mag',
    name: 'Dual Magnetos & Spark Array',
    subsystem: 'Electrical',
    healthScore: 96,
    estimatedRulHours: 280,
    lastInspected: '20 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    sensorChannels: ['MAG-PRIMARY', 'SPARK-ENERGY-02']
  }
];

export const INITIAL_COMPONENTS_ENG01: ComponentHealth[] = [
  {
    id: 'comp-01-cyl',
    name: 'Cylinder 1-4 Assemblies',
    subsystem: 'Combustion',
    healthScore: 91,
    estimatedRulHours: 184,
    lastInspected: '42 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    anomalyNotes: 'Combustion chamber pressures balanced across all cylinders within ±2.1%.',
    sensorChannels: ['CHT-T1-4', 'EGT-T1-4', 'MAP-SENSE']
  },
  {
    id: 'comp-01-cooler',
    name: 'Oil Cooler & Heat Exchanger',
    subsystem: 'Lubrication',
    healthScore: 94,
    estimatedRulHours: 190,
    lastInspected: '42 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    sensorChannels: ['OIL-P-MON', 'OIL-T-MON']
  },
  {
    id: 'comp-01-crank',
    name: 'Crankshaft Main Bearings & Journal',
    subsystem: 'Mechanical',
    healthScore: 97,
    estimatedRulHours: 240,
    lastInspected: '42 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    sensorChannels: ['VIB-ACC-X', 'VIB-ACC-Y']
  },
  {
    id: 'comp-01-mag',
    name: 'Dual Magnetos & Spark Array',
    subsystem: 'Electrical',
    healthScore: 98,
    estimatedRulHours: 310,
    lastInspected: '25 hrs ago',
    nextServiceDueHours: 100,
    status: 'NOMINAL',
    anomalyNotes: 'Standard maintenance cycle. Next scheduled interval at 100 flight hours.',
    directiveNotes: 'Standard 100-hour oil spectrometry and magneto point inspection.',
    sensorChannels: ['MAG-PRIMARY-L', 'MAG-PRIMARY-R', 'SPARK-TIMING']
  }
];

function generateHistoricalTelemetry(base: Telemetry, count: number = 20, degradationTrend: 'none' | 'cht_up' | 'vib_up' = 'none'): Telemetry[] {
  const history: Telemetry[] = [];
  const now = Date.now();
  const stepMs = 60 * 1000; // 1 min increments

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * stepMs).toISOString().substring(11, 19);
    const noise = (Math.random() - 0.5);
    const progressRatio = (count - i) / count; // 0 to 1

    let cht = base.cht + noise * 1.5;
    let vib = base.vibration + noise * 0.05;
    let oilP = base.oilPressure + noise * 0.8;

    if (degradationTrend === 'cht_up') {
      // Exponential fit as in stitch graphic
      cht = base.cht - 14 * (1 - Math.pow(progressRatio, 2)) + noise * 1.2;
    } else if (degradationTrend === 'vib_up') {
      vib = base.vibration - 1.8 * (1 - Math.pow(progressRatio, 1.8)) + noise * 0.08;
      oilP = base.oilPressure + 12 * (1 - progressRatio) + noise * 0.6;
    }

    history.push({
      timestamp: time,
      timeOffsetSec: -i * 60,
      rpm: Math.round(base.rpm + (Math.random() - 0.5) * 15),
      cht: parseFloat(cht.toFixed(1)),
      egt: Math.round(base.egt + (Math.random() - 0.5) * 4),
      oilPressure: parseFloat(oilP.toFixed(1)),
      oilTemperature: parseFloat((base.oilTemperature + noise * 0.7).toFixed(1)),
      fuelFlow: parseFloat((base.fuelFlow + noise * 0.2).toFixed(2)),
      vibration: parseFloat(vib.toFixed(2)),
      batteryVoltage: parseFloat((base.batteryVoltage + noise * 0.05).toFixed(1)),
      alternatorCurrent: parseFloat((base.alternatorCurrent + noise * 0.4).toFixed(1)),
      manifoldPressure: parseFloat((base.manifoldPressure + noise * 0.2).toFixed(1)),
    });
  }

  return history;
}

export function createInitialEngines(): EngineInstance[] {
  // Engine 03: Critical Grounding
  const eng03Telemetry: Telemetry = {
    timestamp: '14:28:09',
    timeOffsetSec: 0,
    rpm: 2380,
    cht: 178.4,
    egt: 762,
    oilPressure: 44.2, // Low
    oilTemperature: 98.6, // Elevated
    fuelFlow: 15.2,
    vibration: 3.42, // Critical vibration (micro spall)
    batteryVoltage: 27.6,
    alternatorCurrent: 49.2,
    manifoldPressure: 24.8,
  };

  const eng02Telemetry: Telemetry = {
    timestamp: '14:28:09',
    timeOffsetSec: 0,
    rpm: 2540,
    cht: 192.0, // High CHT (+14%)
    egt: 754,
    oilPressure: 61.5,
    oilTemperature: 91.2,
    fuelFlow: 14.1,
    vibration: 1.35,
    batteryVoltage: 28.0,
    alternatorCurrent: 46.1,
    manifoldPressure: 26.2,
  };

  const eng01Telemetry: Telemetry = {
    timestamp: '14:28:09',
    timeOffsetSec: 0,
    rpm: 2520,
    cht: 158.2, // Nominal
    egt: 738,
    oilPressure: 68.4,
    oilTemperature: 82.5,
    fuelFlow: 13.8,
    vibration: 1.05, // Normal
    batteryVoltage: 28.2,
    alternatorCurrent: 43.8,
    manifoldPressure: 26.5,
  };

  return [
    {
      id: 'eng-03',
      displayId: 'ENGINE 03',
      airframeId: 'UAV-03',
      airframeCallsign: 'UAV-03 (TACTICAL RECON)',
      model: 'Lycoming O-360-A4M Mil-Twin',
      totalHours: 642,
      overallHealthPercent: 41,
      status: 'CRITICAL',
      rulHours: 18,
      missionPhase: 'GROUNDED',
      priorityDispatchText: 'URGENT // IMMEDIATE ACTION',
      currentMission: {
        id: 'msn-773',
        callsign: 'RECON-ORBIT-X7',
        missionType: 'TACTICAL RECON',
        phase: 'GROUNDED',
        altitudeFt: 0,
        missionProgressPercent: 12,
        remainingFlightTimeMinutes: 0,
        fuelRemainingLiters: 110,
        totalEnduranceHours: 0,
        assignedAirframe: 'UAV-03'
      },
      twinState: {
        modelFidelityPercent: 98.4,
        confidenceLevel: 'CONFIDENCE L1',
        rulErrorBandHours: 1.8,
        thermalDecayDeltaPercent: 4.2,
        acousticHarmonicPeakKhz: 2.45,
        coolingEfficiencyDecayPercent: 2.1,
        activeInferenceAlert: 'Ultrasonic micro-spalling signature detected on crankshaft journal #2. RUL collapsed below safe floor (30h). Grounding directive issued.',
        lastSyncTimestamp: '14:28:07'
      },
      telemetry: eng03Telemetry,
      telemetryHistory: generateHistoricalTelemetry(eng03Telemetry, 25, 'vib_up'),
      components: INITIAL_COMPONENTS_ENG03,
      activeAlerts: [
        {
          id: 'alt-03-01',
          engineId: 'eng-03',
          severity: 'CRITICAL',
          timestamp: '14:18:22 UTC',
          component: 'Crankshaft Bearing #2',
          subsystem: 'Mechanical',
          description: 'Harmonic vibration spike +19 dB at 2.45 kHz. Metal micro-spall threshold breached.',
          recommendation: 'Ground UAV immediately. Disassemble crankcase and replace bearing race before engine restart.',
          evidenceMetric: 'VIB: 3.42 mm/s (Peak +19dB)'
        },
        {
          id: 'alt-03-02',
          engineId: 'eng-03',
          severity: 'WARNING',
          timestamp: '14:20:05 UTC',
          component: 'Oil Pressure Circuit',
          subsystem: 'Lubrication',
          description: 'Main oil gallery pressure dropped to 44.2 PSI during mid-throttle test.',
          recommendation: 'Check oil filter chip detector for metal particulate debris.',
          evidenceMetric: 'P_OIL: 44.2 PSI'
        }
      ],
      workOrders: [
        {
          id: '8924',
          engineId: 'eng-03',
          component: 'Crankshaft Main Bearing #2',
          status: 'DISPATCHED',
          urgency: 'IMMEDIATE',
          requiredPartNumber: 'PN-8812-C',
          depotLocation: 'Depot #2 (Tactical Bay 4)',
          estimatedLaborHours: 14.5,
          notes: 'Mandatory bearing extraction and borescope journal clearance calibration.',
          dispatchedAt: '14:22:00 UTC'
        }
      ]
    },
    {
      id: 'eng-02',
      displayId: 'ENGINE 02',
      airframeId: 'UAV-02',
      airframeCallsign: 'UAV-02 (CARGO RELAY)',
      model: 'Rotax 914 F Turbo Charged Twin',
      totalHours: 418,
      overallHealthPercent: 76,
      status: 'WARNING',
      rulHours: 61,
      missionPhase: 'CRUISE',
      priorityDispatchText: 'SCHEDULED ATTENTION // WARNING',
      currentMission: {
        id: 'msn-772',
        callsign: 'CARGO-LIFT-94',
        missionType: 'CARGO RELAY',
        phase: 'CRUISE',
        altitudeFt: 14200,
        missionProgressPercent: 58,
        remainingFlightTimeMinutes: 84,
        fuelRemainingLiters: 148,
        totalEnduranceHours: 4.8,
        assignedAirframe: 'UAV-02'
      },
      twinState: {
        modelFidelityPercent: 98.4,
        confidenceLevel: 'CONFIDENCE L1',
        rulErrorBandHours: 1.8,
        thermalDecayDeltaPercent: 14.0,
        acousticHarmonicPeakKhz: 0.85,
        coolingEfficiencyDecayPercent: 8.0,
        activeInferenceAlert: 'Cooling degradation is accelerating on Engine 02. Cylinder #2 heat rejection coefficient beneath laminar threshold.',
        lastSyncTimestamp: '14:28:09'
      },
      telemetry: eng02Telemetry,
      telemetryHistory: generateHistoricalTelemetry(eng02Telemetry, 25, 'cht_up'),
      components: INITIAL_COMPONENTS_ENG02,
      activeAlerts: [
        {
          id: 'alt-02-01',
          engineId: 'eng-02',
          severity: 'WARNING',
          timestamp: '14:15:30 UTC',
          component: 'Cylinder #2 Cowling Baffle',
          subsystem: 'Combustion',
          description: 'Progressive thermal dissipation decay: +14% CHT (192°C) vs baseline at 75% throttle.',
          recommendation: 'Inspect cowling duct inlet and inspect cylinder #2 baffle seals at next landing (within 4.5 flight hours).',
          evidenceMetric: 'CHT: 192°C (+14%)'
        },
        {
          id: 'alt-02-02',
          engineId: 'eng-02',
          severity: 'WATCH',
          timestamp: '14:24:12 UTC',
          component: 'Oil Cooler Fin Assembly',
          subsystem: 'Lubrication',
          description: 'Thermal accumulation delta +6°C across cooler inlet/outlet manifold.',
          recommendation: 'Check cooler fins for particulate fouling during pre-flight servicing.',
          evidenceMetric: 'T_OIL: 91.2°C'
        }
      ],
      workOrders: [
        {
          id: '8925',
          engineId: 'eng-02',
          component: 'Cylinder #2 Cooling Fin Assembly & Baffle',
          status: 'PENDING APPROVAL',
          urgency: 'SCHEDULED',
          requiredPartNumber: 'PN-4409-SEAL',
          depotLocation: 'Line Maintenance Hangar 1',
          estimatedLaborHours: 3.0,
          notes: 'Borescope inspection of cowling baffle seals and fin duct clearance.',
          dispatchedAt: undefined
        }
      ]
    },
    {
      id: 'eng-01',
      displayId: 'ENGINE 01',
      airframeId: 'UAV-01',
      airframeCallsign: 'UAV-01 (STRATOSPHERIC PATROL)',
      model: 'Rotax 914 F Turbo Charged Twin',
      totalHours: 288,
      overallHealthPercent: 96,
      status: 'NOMINAL',
      rulHours: 184,
      missionPhase: 'PATROL',
      priorityDispatchText: 'NOMINAL // PREVENTIVE',
      currentMission: {
        id: 'msn-771',
        callsign: 'PATROL-SENTINEL-01',
        missionType: 'PATROL',
        phase: 'PATROL',
        altitudeFt: 22500,
        missionProgressPercent: 44,
        remainingFlightTimeMinutes: 320,
        fuelRemainingLiters: 260,
        totalEnduranceHours: 9.5,
        assignedAirframe: 'UAV-01'
      },
      twinState: {
        modelFidelityPercent: 98.4,
        confidenceLevel: 'CONFIDENCE L1',
        rulErrorBandHours: 1.8,
        thermalDecayDeltaPercent: 0.4,
        acousticHarmonicPeakKhz: 0.12,
        coolingEfficiencyDecayPercent: 0.2,
        activeInferenceAlert: 'All propulsion parameters tracking nominal synthetic twin baseline within ±1.2%.',
        lastSyncTimestamp: '14:28:09'
      },
      telemetry: eng01Telemetry,
      telemetryHistory: generateHistoricalTelemetry(eng01Telemetry, 25, 'none'),
      components: INITIAL_COMPONENTS_ENG01,
      activeAlerts: [
        {
          id: 'alt-01-01',
          engineId: 'eng-01',
          severity: 'NORMAL',
          timestamp: '14:00:00 UTC',
          component: 'Propulsion Array',
          subsystem: 'System-Wide',
          description: 'Standard cruise telemetry check complete. Fuel air mixture and ignition timing balanced.',
          recommendation: 'Proceed on patrol corridor at current cruise power settings.',
          evidenceMetric: 'HEALTH: 96%'
        }
      ],
      workOrders: [
        {
          id: '8910',
          engineId: 'eng-01',
          component: 'Oil Filter & Magneto Timers',
          status: 'AUTO-QUEUED',
          urgency: 'ROUTINE',
          requiredPartNumber: 'PN-OIL-KIT-100',
          depotLocation: 'Depot Scheduled Bay',
          estimatedLaborHours: 2.0,
          notes: 'Standard 100-hour oil spectrometry and magneto point inspection.',
          dispatchedAt: undefined
        }
      ]
    }
  ];
}

/**
 * Simulates a continuous live physics tick for an aero piston engine.
 */
export function simulateEngineTelemetryTick(engine: EngineInstance, elapsedSec: number): EngineInstance {
  const current = engine.telemetry;
  const jitter = (range: number) => (Math.random() - 0.5) * range;

  // Base physics dynamics according to engine health state
  let rpmDelta = jitter(12);
  let chtDelta = jitter(0.4);
  let egtDelta = jitter(2.5);
  let oilPDelta = jitter(0.3);
  let oilTDelta = jitter(0.2);
  let fuelDelta = jitter(0.08);
  let vibDelta = jitter(0.03);

  // If Engine 02 (thermal decay), CHT has a slow positive drift if flight is active
  if (engine.id === 'eng-02') {
    chtDelta += 0.04; // Slight upward thermal creep
  }

  // If Engine 03 (bearing micro-spall), vibration has episodic harmonics
  if (engine.id === 'eng-03') {
    vibDelta += Math.random() > 0.8 ? 0.08 : -0.04;
  }

  const newRpm = Math.max(0, Math.min(3000, Math.round(current.rpm + rpmDelta)));
  const newCht = parseFloat(Math.max(80, Math.min(240, current.cht + chtDelta)).toFixed(1));
  const newEgt = Math.max(400, Math.min(850, Math.round(current.egt + egtDelta)));
  const newOilP = parseFloat(Math.max(10, Math.min(90, current.oilPressure + oilPDelta)).toFixed(1));
  const newOilT = parseFloat(Math.max(40, Math.min(130, current.oilTemperature + oilTDelta)).toFixed(1));
  const newFuelFlow = parseFloat(Math.max(4, Math.min(28, current.fuelFlow + fuelDelta)).toFixed(2));
  const newVibration = parseFloat(Math.max(0.2, Math.min(6.0, current.vibration + vibDelta)).toFixed(2));
  const newBattery = parseFloat((current.batteryVoltage + jitter(0.03)).toFixed(1));
  const newAlternator = parseFloat((current.alternatorCurrent + jitter(0.25)).toFixed(1));
  const newMap = parseFloat((current.manifoldPressure + jitter(0.1)).toFixed(1));

  const now = new Date();
  const timeStr = now.toTimeString().substring(0, 8);

  const newTelemetry: Telemetry = {
    timestamp: timeStr,
    timeOffsetSec: elapsedSec,
    rpm: newRpm,
    cht: newCht,
    egt: newEgt,
    oilPressure: newOilP,
    oilTemperature: newOilT,
    fuelFlow: newFuelFlow,
    vibration: newVibration,
    batteryVoltage: newBattery,
    alternatorCurrent: newAlternator,
    manifoldPressure: newMap
  };

  // Append to history, keeping max 40 points for responsive graphing
  const newHistory = [...engine.telemetryHistory.slice(-39), newTelemetry];

  return {
    ...engine,
    telemetry: newTelemetry,
    telemetryHistory: newHistory,
    twinState: {
      ...engine.twinState,
      lastSyncTimestamp: timeStr
    }
  };
}

/**
 * Service API methods with endpoints support for future FastAPI / WebSocket / MQTT backend
 */
export const TelemetryService = {
  isExternalApiConfigured(): boolean {
    return Boolean(API_BASE_URL && API_BASE_URL.length > 0);
  },

  getApiBaseUrl(): string {
    return API_BASE_URL;
  },

  async fetchEngines(): Promise<EngineInstance[]> {
    const baseList = createInitialEngines();
    if (this.isExternalApiConfigured()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/engines`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            return raw.map((item: any, idx: number) => {
              const fb = baseList[idx % baseList.length] || baseList[0];
              return {
                ...fb,
                id: item.id || fb.id,
                model: item.engine_model?.name || item.name || fb.model,
                totalHours: item.total_hours ?? fb.totalHours,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Backend API unreachable, falling back to tactical local engine simulation:', err);
      }
    }
    return baseList;
  },

  async syncWithERP(): Promise<{ success: boolean; message: string; timestamp: string }> {
    if (this.isExternalApiConfigured()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/mro/sync`, { method: 'POST' });
        if (res.ok) return await res.json();
      } catch (err) {
        // Fallback
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    return {
      success: true,
      message: 'Parts supply chain (SAP Aero) updated: Bearing PN-8812-C reserved in Depot #2.',
      timestamp: new Date().toISOString()
    };
  }
};

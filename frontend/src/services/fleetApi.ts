/**
 * DHRUVAA — API and Telemetry Stream Service Layer
 * Supports both high-fidelity client simulation and remote FastAPI / WebSocket / MQTT endpoints.
 */

import {
  EngineInstance,
  Telemetry,
  TwinState,
  FaultEvent,
  Mission,
  FleetAggregate,
  TelemetryHistoryPoint,
  AICopilotMessage
} from '../types/fleetTypes';

import {
  INITIAL_FLEET,
  INITIAL_TELEMETRY,
  INITIAL_TWIN_STATES,
  INITIAL_ALERTS,
  CURRENT_MISSION,
  INITIAL_FLEET_AGGREGATE,
  generateTelemetryHistory
} from './fleetMockData';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

class TelemetryService {
  private fleet: EngineInstance[] = [...INITIAL_FLEET];
  private telemetryData: Record<string, Telemetry> = { ...INITIAL_TELEMETRY };
  private twinStates: Record<string, TwinState> = { ...INITIAL_TWIN_STATES };
  private alerts: FaultEvent[] = [...INITIAL_ALERTS];
  private mission: Mission = { ...CURRENT_MISSION };
  private fleetAggregate: FleetAggregate = { ...INITIAL_FLEET_AGGREGATE };
  private listeners: Set<(data: { fleet: EngineInstance[]; telemetry: Record<string, Telemetry>; alerts: FaultEvent[] }) => void> = new Set();
  private timer: number | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    this.startSimulationStream();
  }

  // REST API Methods (with mock fallback or remote fetch)
  async getFleet(): Promise<EngineInstance[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fleet`);
        if (res.ok) {
          const data = await res.json();
          let rawList: any[] = [];
          if (Array.isArray(data)) {
            rawList = data;
          } else if (data && Array.isArray(data.engines)) {
            rawList = data.engines;
          }

          if (rawList.length > 0) {
            return rawList.map((raw: any, index: number) => {
              const fallback = this.fleet[index % this.fleet.length] || INITIAL_FLEET[0];
              const healthScore = typeof raw.health_score === 'number' ? raw.health_score : (raw.healthPercentage ?? fallback.healthPercentage);
              const healthStatus = raw.health_status || (healthScore > 85 ? 'NOMINAL' : healthScore > 70 ? 'WARNING' : 'CRITICAL');
              return {
                ...fallback,
                id: raw.engine_id || raw.id || fallback.id,
                callsign: raw.name || fallback.callsign,
                tacticalName: raw.name || fallback.tacticalName,
                healthPercentage: healthScore,
                healthStatus: healthStatus as any,
                statusLabel: `${healthStatus} // ${Math.round(healthScore)}%`,
                rulHours: raw.total_hours ? Math.max(0, 1900 - raw.total_hours) : fallback.rulHours,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Remote API failed, falling back to local simulation:', err);
      }
    }
    return this.fleet;
  }

  async getEngine(id: string): Promise<EngineInstance | undefined> {
    const list = await this.getFleet();
    return Array.isArray(list) ? list.find(e => e.id === id) : undefined;
  }

  async getTelemetry(id: string): Promise<Telemetry> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/telemetry/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Remote API failed, falling back to local simulation:', err);
      }
    }
    return this.telemetryData[id] || this.telemetryData['uav-01'];
  }

  async getTwinState(id: string): Promise<TwinState> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/twin/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Remote API failed, falling back to local simulation:', err);
      }
    }
    return this.twinStates[id] || this.twinStates['uav-01'];
  }

  async getAlerts(): Promise<FaultEvent[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Remote API failed, falling back to local simulation:', err);
      }
    }
    return this.alerts;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
    this.notifyListeners();
  }

  async getMission(): Promise<Mission> {
    return this.mission;
  }

  async getFleetAggregate(): Promise<FleetAggregate> {
    return this.fleetAggregate;
  }

  getTelemetryHistory(engineId: string, timeRange: string = '15m'): TelemetryHistoryPoint[] {
    const count = timeRange === '1m' ? 12 : timeRange === '5m' ? 20 : timeRange === '15m' ? 30 : timeRange === '1h' ? 40 : 60;
    return generateTelemetryHistory(engineId, count);
  }

  // AI Engineering Copilot Advisory
  async queryAICopilot(question: string, activeEngineId: string): Promise<AICopilotMessage> {
    const engine = this.fleet.find(e => e.id === activeEngineId) || this.fleet[0];
    const telemetry = this.telemetryData[activeEngineId] || this.telemetryData['uav-01'];
    const twin = this.twinStates[activeEngineId] || this.twinStates['uav-01'];
    const activeAlerts = this.alerts.filter(a => a.engineId === activeEngineId && !a.acknowledged);

    const q = question.toLowerCase();

    // Contextual responses based on live simulation
    if (q.includes('health decreasing') || q.includes('why is health') || q.includes('health dropping')) {
      if (engine.id === 'uav-03') {
        return {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          timestamp: 'JUST NOW',
          content: `Digital Twin analysis indicates severe acoustic resonance at 840Hz in the Stage 2 Crankshaft Bearing on ${engine.callsign}. High mechanical shear stress has degraded hydrodynamic oil film thickness, causing localized metal-on-metal contact. Oil pressure has dropped to ${telemetry.oilPressure} PSI with oil temperature rising to ${telemetry.oilTemperature}°C. Bearing remaining useful life has expired below safe margin.`,
          evidence: [
            { metric: 'Bearing Vibration', value: `${telemetry.vibration} g RMS`, assessment: 'CRITICAL (Normal < 0.30g)' },
            { metric: 'Oil Pressure', value: `${telemetry.oilPressure} PSI`, assessment: 'CRITICAL (Floor 50 PSI)' },
            { metric: 'Acoustic Peak', value: '840 Hz', assessment: 'Resonance Exceedance' }
          ],
          suggestedActions: [
            { label: 'EXECUTE AUTO-VECTOR RTB', actionKey: 'EXECUTE_RTB', critical: true, primary: true },
            { label: 'THROTTLE DERATE TO 60%', actionKey: 'DERATE_ENGINE' }
          ]
        };
      } else if (engine.id === 'uav-02') {
        return {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          timestamp: 'JUST NOW',
          content: `${engine.callsign} shows a health index degradation to ${engine.healthPercentage}% driven by a progressive thermal divergence on Cylinder 2. While Cylinders 1, 3, and 4 maintain a nominal 172°C average, Cylinder 2 is running at ${telemetry.chtPerCylinder[1]}°C (+18°C skew). Synthetic physics models attribute this to a partial injector spray pattern bias or thermal duct aerodynamic wake disturbance.`,
          evidence: [
            { metric: 'Cyl 2 CHT', value: `${telemetry.chtPerCylinder[1]}°C`, assessment: 'WARNING (+18°C Skew)' },
            { metric: 'Combustion Stability', value: '0.86', assessment: 'Mild Lean Variance' }
          ],
          suggestedActions: [
            { label: 'QUEUE MAINTENANCE BAY 2', actionKey: 'QUEUE_MAINTENANCE', primary: true },
            { label: 'AUTO-TRIM FUEL MIXTURE', actionKey: 'TRIM_MIXTURE' }
          ]
        };
      } else {
        return {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          timestamp: 'JUST NOW',
          content: `${engine.callsign} (${engine.model}) maintains a high health index of ${engine.healthPercentage}%. Minor natural cyclic variance of ~1.2% is within expected boundaries for high-altitude loiter. Combustion chamber thermal balance and crankcase oil pressure remain well within FAA/MIL-STD design envelopes.`,
          evidence: [
            { metric: 'Overall Health', value: `${engine.healthPercentage}%`, assessment: 'NOMINAL' },
            { metric: 'Vibration RMS', value: `${telemetry.vibration} g`, assessment: 'OPTIMAL' }
          ]
        };
      }
    }

    if (q.includes('rul') || q.includes('remaining useful life')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        timestamp: 'JUST NOW',
        content: `Current Remaining Useful Life (RUL) estimation for ${engine.callsign} is ${engine.rulHours} operational hours. The physics-AI hybrid twin predicts:
- Subsystem with lowest RUL: ${engine.id === 'uav-03' ? 'Stage 2 Crankshaft Bearing (<18 hrs - EXPIRED)' : engine.id === 'uav-02' ? 'Cylinder 2 Exhaust Valve (~61 hrs)' : 'Standard overhaul cycle (184+ hrs)'}.
- Confidence score: ${twin.confidenceScore}%. Continued loiter under current torque demands will maintain this gradient.`,
        evidence: [
          { metric: 'Calculated RUL', value: `${engine.rulHours} Hours`, assessment: engine.rulHours < 20 ? 'CRITICAL' : engine.rulHours < 80 ? 'WARNING' : 'HEALTHY' },
          { metric: 'Model Confidence', value: `${twin.confidenceScore}%`, assessment: 'HIGH FIDELITY' }
        ]
      };
    }

    if (q.includes('cht') || q.includes('cylinder') || q.includes('temperature')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        timestamp: 'JUST NOW',
        content: `Cylinder Head Temperature telemetry for ${engine.callsign}:
- CHT Mean: ${telemetry.cht}°C
- Cylinder Distribution: [C1: ${telemetry.chtPerCylinder[0]}°C | C2: ${telemetry.chtPerCylinder[1]}°C | C3: ${telemetry.chtPerCylinder[2]}°C | C4: ${telemetry.chtPerCylinder[3]}°C]
${engine.id === 'uav-02' ? 'ALERT: Cylinder 2 is running in warning thermal zone (+18°C above peer cylinders). High risk of piston ring micro-scoring if prolonged.' : 'All cylinders are well within redline limits (max rated 235°C).'}`
      };
    }

    if (q.includes('active faults') || q.includes('fault') || q.includes('alerts')) {
      if (activeAlerts.length === 0) {
        return {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          timestamp: 'JUST NOW',
          content: `Zero active critical or warning faults detected on ${engine.callsign}. Digital twin telemetry correlation is locked at ${twin.confidenceScore}%. All sensors operating within nominal bounds.`
        };
      }
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        timestamp: 'JUST NOW',
        content: `${activeAlerts.length} active anomalies logged for ${engine.callsign}:
${activeAlerts.map(a => `• [${a.severity}] ${a.component}: ${a.description}`).join('\n')}

Advisory Note: Recommended actions must be confirmed by Command Air Operations. This AI system operates in advisory supervisory mode.`
      };
    }

    // Generic engineering assistant response
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      timestamp: 'JUST NOW',
      content: `DHRUVAA Engine Advisory System online for ${engine.callsign} (${engine.model}). Live state: RPM ${telemetry.rpm}, CHT ${telemetry.cht}°C, EGT ${telemetry.egt}°C, Oil ${telemetry.oilPressure} PSI / ${telemetry.oilTemperature}°C. Vibration signature is ${telemetry.vibration} g RMS. All diagnostic inferences reflect real-time 50Hz digital twin telemetry streams.`,
      evidence: [
        { metric: 'Sensor Feed', value: 'MIL-STD-1553B Active', assessment: '18ms Latency' },
        { metric: 'Digital Twin Model', value: twin.digitalTwinFidelity, assessment: 'Synchronized' }
      ]
    };
  }

  // Live real-time simulation stream
  private startSimulationStream() {
    this.timer = window.setInterval(() => {
      this.tick();
    }, 1500); // 1.5s interval update for realistic live feel
  }

  private tick() {
    // 1. Telemetry jitter & gradual dynamic changes
    const updatedTelemetry: Record<string, Telemetry> = {};

    Object.keys(this.telemetryData).forEach(id => {
      const prev = this.telemetryData[id];
      const rpmJitter = Math.floor((Math.random() - 0.5) * 16);
      const chtJitter = Number(((Math.random() - 0.5) * 0.8).toFixed(1));
      const egtJitter = Math.floor((Math.random() - 0.5) * 4);
      const oilPresJitter = Number(((Math.random() - 0.5) * 0.4).toFixed(1));
      const vibJitter = Number(((Math.random() - 0.5) * 0.02).toFixed(2));
      const fuelJitter = Number(((Math.random() - 0.5) * 0.1).toFixed(1));

      // Specific behaviors per UAV
      const isUav3 = id === 'uav-03';
      const isUav2 = id === 'uav-02';

      const nextRpm = Math.max(1800, Math.min(2700, prev.rpm + rpmJitter));
      const nextCht = Math.max(140, Math.min(220, prev.cht + chtJitter));
      const nextEgt = Math.max(680, Math.min(840, prev.egt + egtJitter));
      const nextOilPres = Math.max(38, Math.min(80, prev.oilPressure + oilPresJitter));
      const nextOilTemp = Math.max(70, Math.min(115, prev.oilTemperature + (isUav3 ? 0.1 : 0) + (Math.random() - 0.5) * 0.3));
      const nextVib = Number(Math.max(0.1, prev.vibration + vibJitter).toFixed(2));
      const nextFuelFlow = Number(Math.max(18, prev.fuelFlow + fuelJitter).toFixed(1));

      const cyl2Offset = isUav2 ? 22 : 0;
      const cylChts: [number, number, number, number] = [
        Math.round(nextCht - 2 + (Math.random() - 0.5) * 2),
        Math.round(nextCht + cyl2Offset + (Math.random() - 0.5) * 2),
        Math.round(nextCht - 1 + (Math.random() - 0.5) * 2),
        Math.round(nextCht + 1 + (Math.random() - 0.5) * 2)
      ];

      updatedTelemetry[id] = {
        ...prev,
        timestamp: Date.now(),
        rpm: nextRpm,
        cht: Math.round(nextCht),
        chtPerCylinder: cylChts,
        egt: nextEgt,
        oilPressure: Number(nextOilPres.toFixed(1)),
        oilTemperature: Math.round(nextOilTemp),
        fuelFlow: nextFuelFlow,
        vibration: nextVib,
        batteryVoltage: Number((28.0 + (Math.random() - 0.5) * 0.3).toFixed(1)),
        alternatorCurrent: Number((34.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
        manifoldPressure: Number((24.5 + (Math.random() - 0.5) * 0.4).toFixed(1))
      };
    });

    this.telemetryData = updatedTelemetry;

    // 2. Micro-drift in UAV coordinates / altitudes
    this.fleet = this.fleet.map(uav => {
      if (uav.altitudeFt > 0) {
        // Airborne UAVs micro-shift
        const altChange = uav.id === 'uav-03' ? -15 : Math.round((Math.random() - 0.5) * 20);
        const speedChange = Math.round((Math.random() - 0.5) * 2);
        return {
          ...uav,
          altitudeFt: Math.max(1000, uav.altitudeFt + altChange),
          airspeedKt: Math.max(120, Math.min(250, uav.airspeedKt + speedChange)),
          fuelRemainingPct: Math.max(5, Number((uav.fuelRemainingPct - 0.01).toFixed(2)))
        };
      }
      return uav;
    });

    // 3. Update aggregate metrics from live fleet state
    const airborne = this.fleet.filter(f => f.altitudeFt > 0);
    const preflight = this.fleet.filter(f => f.altitudeFt === 0 && f.missionPhase === 'PRE_FLIGHT');
    const inRepair = this.fleet.filter(f => f.missionPhase === 'RECOVERY');
    const avgCht = Math.round(
      airborne.reduce((acc, u) => acc + (this.telemetryData[u.id]?.cht || 170), 0) / (airborne.length || 1)
    );

    const activeAlerts = this.alerts.filter(a => !a.acknowledged);
    const critAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
    const warnAlerts = activeAlerts.filter(a => a.severity === 'WARNING').length;

    const totalUavs = this.fleet.length || 1;
    const healthyUavs = this.fleet.filter(f => f.healthStatus === 'NOMINAL' || f.healthStatus === 'OPTIMAL');
    const avgHealth = Math.round(this.fleet.reduce((acc, u) => acc + u.healthPercentage, 0) / totalUavs * 10) / 10;

    this.fleetAggregate = {
      ...this.fleetAggregate,
      aircraftTracked: this.fleet.length,
      sortiesActive: airborne.length,
      readinessRating: Math.round((healthyUavs.length / totalUavs) * 100 * 10) / 10,
      averageChtDegC: avgCht,
      fleetFuelBurnLph: Number((128.0 + (Math.random() - 0.5) * 1.2).toFixed(1)),
      healthTrendMean: avgHealth,
      anomalyIndex: {
        total: activeAlerts.length,
        critical: critAlerts,
        warning: warnAlerts
      },
      readinessAllocation: {
        airbornePct: Math.round((airborne.length / totalUavs) * 100),
        taxiPreflightPct: Math.round((preflight.length / totalUavs) * 100),
        inRepairPct: Math.round((inRepair.length / totalUavs) * 100)
      }
    };

    this.notifyListeners();
  }

  subscribe(callback: (data: { fleet: EngineInstance[]; telemetry: Record<string, Telemetry>; alerts: FaultEvent[] }) => void) {
    this.listeners.add(callback);
    // Initial emit
    callback({
      fleet: this.fleet,
      telemetry: this.telemetryData,
      alerts: this.alerts
    });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const payload = {
      fleet: this.fleet,
      telemetry: this.telemetryData,
      alerts: this.alerts
    };
    this.listeners.forEach(cb => cb(payload));
  }
}

export const telemetryService = new TelemetryService();

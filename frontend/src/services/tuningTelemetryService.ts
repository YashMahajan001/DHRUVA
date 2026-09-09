/**
 * Telemetry Stream Service
 * Provides real-time simulated telemetry updates, event dispatching,
 * and clean abstraction ready for WebSocket / MQTT transport layers.
 */

import { Telemetry, TelemetryPoint, TuningParameters } from '../types/tuningTypes';
import { INITIAL_TELEMETRY, generateInitialTelemetryHistory } from './tuningMockData';

type TelemetryListener = (telemetry: Telemetry, history: TelemetryPoint[]) => void;

class TelemetryService {
  private currentTelemetry: Telemetry = { ...INITIAL_TELEMETRY };
  private history: TelemetryPoint[] = generateInitialTelemetryHistory(30);
  private listeners: Set<TelemetryListener> = new Set();
  private intervalId: number | null = null;
  private tuning: TuningParameters = {
    lambda: 0.98,
    timingBtdc: 24.0,
    rpmCeiling: 2450,
    mapProfile: 'linear',
    cowlShutterCht: 176,
  };
  private isConnected = true;

  constructor() {
    this.startSimulation();
  }

  public updateTuning(tuning: Partial<TuningParameters>) {
    this.tuning = { ...this.tuning, ...tuning };
  }

  public getCurrentTelemetry(): Telemetry {
    return { ...this.currentTelemetry };
  }

  public getHistory(): TelemetryPoint[] {
    return [...this.history];
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial data
    listener(this.currentTelemetry, this.history);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private startSimulation() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 2000); // 2 second telemetry refresh rate for high realism
  }

  private tick() {
    const now = Date.now();
    const date = new Date(now);
    const timeLabel = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;

    // Jitter & physics derivation based on tuning
    const rpmTarget = this.tuning.rpmCeiling;
    const rpmJitter = (Math.random() - 0.5) * 16;
    const rpm = Math.round(rpmTarget + rpmJitter);

    // Multi-factor CHT physics
    const lambdaEffect = (this.tuning.lambda - 1.00) * (this.tuning.lambda >= 1.00 ? 48 : 34);
    const timingChtEffect = (this.tuning.timingBtdc - 24.0) * 1.2;
    const rpmChtEffect = (rpm - 2400) * 0.016;
    const cowlEffect = (this.tuning.cowlShutterCht - 175) * 0.35;
    const mapChtEffect = this.tuning.mapProfile === 'aggr' ? 3 : this.tuning.mapProfile === 'eco' ? -2 : 0;
    const baseCht = 178 + lambdaEffect + timingChtEffect + rpmChtEffect + cowlEffect + mapChtEffect + (Math.random() - 0.5) * 1.5;

    // EGT: rises when timing is retarded (combustion in exhaust stroke) or slightly lean
    const timingEgtEffect = (24.0 - this.tuning.timingBtdc) * 5.5;
    const lambdaEgtEffect = (this.tuning.lambda - 1.00) * 65;
    const egt = Math.round(815 + timingEgtEffect + lambdaEgtEffect + (Math.random() - 0.5) * 4);

    // Oil pressure drops slightly as oil temp rises
    const oilTemp = parseFloat((84.5 + (baseCht - 178) * 0.16 + (Math.random() - 0.5) * 0.4).toFixed(1));
    const oilPressure = parseFloat((64.2 - (oilTemp - 84.5) * 0.12 + (Math.random() - 0.5) * 0.3).toFixed(1));

    // Fuel flow: drops as lambda rises, rises with RPM ceiling, affected by MAP profile and timing
    const lambdaFuelEffect = (this.tuning.lambda - 1.00) * -28.0;
    const rpmFuelEffect = (rpm - 2400) * 0.011;
    const timingFuelEffect = (this.tuning.timingBtdc - 24.0) * -0.15;
    const mapFuelEffect = this.tuning.mapProfile === 'eco' ? -0.9 : this.tuning.mapProfile === 'aggr' ? 1.4 : 0;
    const fuelFlow = parseFloat(Math.max(16.0, 32.5 + lambdaFuelEffect + rpmFuelEffect + timingFuelEffect + mapFuelEffect + (Math.random() - 0.5) * 0.2).toFixed(1));

    // Vibration in g: affected by timing advance offset and high RPM
    const timingVib = Math.abs(this.tuning.timingBtdc - 24.0) * 0.022;
    const rpmVib = Math.max(0, (rpm - 2450) * 0.00018);
    const vibration = parseFloat((0.18 + timingVib + rpmVib + (Math.random() - 0.5) * 0.02).toFixed(2));

    // Electrical
    const batteryVoltage = parseFloat((28.4 + (Math.random() - 0.5) * 0.08).toFixed(1));
    const alternatorCurrent = parseFloat((34.6 + (Math.random() - 0.5) * 0.6).toFixed(1));

    // Cylinder distributions
    const cyl1 = Math.round(baseCht - 3 + (Math.random() - 0.5) * 1.2);
    const cyl2 = Math.round(baseCht + (Math.random() - 0.5) * 1.5);
    const cyl3 = Math.round(baseCht - 1 + (Math.random() - 0.5) * 1.2);
    const cyl4 = Math.round(baseCht - 2 + (Math.random() - 0.5) * 1.2);

    // Peak Chamber Pressure (bars)
    const mapPress = this.tuning.mapProfile === 'aggr' ? 2.1 : this.tuning.mapProfile === 'eco' ? -1.5 : 0;
    const pressBase = 72.4 + (this.tuning.timingBtdc - 24.0) * 1.6 + (rpm - 2400) * 0.006 + mapPress;
    const p1 = parseFloat((pressBase - 0.6 + (Math.random() - 0.5) * 0.3).toFixed(1));
    const p2 = parseFloat((pressBase + (Math.random() - 0.5) * 0.4).toFixed(1));
    const p3 = parseFloat((pressBase - 0.5 + (Math.random() - 0.5) * 0.3).toFixed(1));
    const p4 = parseFloat((pressBase - 0.3 + (Math.random() - 0.5) * 0.3).toFixed(1));

    // Knock index
    const knockBase = (this.tuning.timingBtdc - 25.5) * 0.07;
    const knockLambda = this.tuning.lambda > 1.08 ? (this.tuning.lambda - 1.08) * 0.8 : 0;
    const knockIndex = parseFloat(Math.max(0, (knockBase + knockLambda + Math.random() * 0.01)).toFixed(2));

    // Health calculation
    const isOverTemp = baseCht > 190;
    const isOverPress = pressBase > 85.0;
    const isKnocking = knockIndex > 0.15;
    const healthPenalty = (isOverTemp ? 8 : (baseCht > 183 ? 1.8 : 0)) + 
                          (isOverPress ? 5 : 0) + 
                          (isKnocking ? knockIndex * 20 : 0);
    const health = parseFloat(Math.max(50, Math.min(100, 94.2 - healthPenalty + (Math.random() - 0.5) * 0.1)).toFixed(1));

    this.currentTelemetry = {
      rpm,
      cht: Math.round(baseCht),
      egt,
      oilPressure,
      oilTemp,
      fuelFlow,
      vibration,
      batteryVoltage,
      alternatorCurrent,
      cylinderCht: [cyl1, cyl2, cyl3, cyl4],
      cylinderPressure: [p1, p2, p3, p4],
      knockIndex,
      lastUpdated: now,
    };

    const newPoint: TelemetryPoint = {
      timestamp: now,
      timeLabel,
      rpm,
      cht: Math.round(baseCht),
      egt,
      oilPressure,
      oilTemp,
      fuelFlow: Math.max(15, fuelFlow),
      vibration,
      batteryVoltage,
      alternatorCurrent,
      health,
    };

    // Keep fixed window (last 1800 points, 1 hour at 2s intervals)
    this.history = [...this.history.slice(-1799), newPoint];

    // Dispatch to all subscribers
    this.listeners.forEach(cb => {
      try {
        cb(this.currentTelemetry, this.history);
      } catch (err) {
        console.error('Error notifying telemetry listener:', err);
      }
    });
  }

  public stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const telemetryService = new TelemetryService();

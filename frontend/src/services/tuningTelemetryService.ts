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

    // Lambda effect: leaner (higher lambda) increases CHT
    const lambdaEffect = (this.tuning.lambda - 0.98) * 45;
    const cowlEffect = (176 - this.tuning.cowlShutterCht) * 0.3;
    const baseCht = 182 + lambdaEffect + cowlEffect + (Math.random() - 0.5) * 1.5;

    // EGT responds inversely to rich vs lean
    const egt = Math.round(810 + (this.tuning.lambda - 0.98) * 80 + (Math.random() - 0.5) * 4);

    // Oil pressure drops slightly as oil temp rises
    const oilTemp = parseFloat((84.5 + (baseCht - 182) * 0.15 + (Math.random() - 0.5) * 0.4).toFixed(1));
    const oilPressure = parseFloat((64.2 - (oilTemp - 84.5) * 0.1 + (Math.random() - 0.5) * 0.3).toFixed(1));

    // Fuel flow drops as lambda rises (leaner burn)
    const fuelFlow = parseFloat((27.2 - (this.tuning.lambda - 0.98) * 12 + (rpm - 2450) * 0.008 + (Math.random() - 0.5) * 0.2).toFixed(1));

    // Vibration in g
    const vibration = parseFloat((0.18 + Math.abs(this.tuning.timingBtdc - 24.0) * 0.015 + (Math.random() - 0.5) * 0.02).toFixed(2));

    // Electrical
    const batteryVoltage = parseFloat((28.4 + (Math.random() - 0.5) * 0.08).toFixed(1));
    const alternatorCurrent = parseFloat((34.6 + (Math.random() - 0.5) * 0.6).toFixed(1));

    // Cylinder distributions
    const cyl1 = Math.round(baseCht - 3 + (Math.random() - 0.5) * 1.2);
    const cyl2 = Math.round(baseCht + (Math.random() - 0.5) * 1.5);
    const cyl3 = Math.round(baseCht - 1 + (Math.random() - 0.5) * 1.2);
    const cyl4 = Math.round(baseCht - 2 + (Math.random() - 0.5) * 1.2);

    const pressBase = 72.4 + (this.tuning.timingBtdc - 24) * 0.4;
    const p1 = parseFloat((pressBase - 0.6 + (Math.random() - 0.5) * 0.3).toFixed(1));
    const p2 = parseFloat((pressBase + (Math.random() - 0.5) * 0.4).toFixed(1));
    const p3 = parseFloat((pressBase - 0.5 + (Math.random() - 0.5) * 0.3).toFixed(1));
    const p4 = parseFloat((pressBase - 0.3 + (Math.random() - 0.5) * 0.3).toFixed(1));

    // Health calculation
    const isOverTemp = baseCht > 190;
    const isOverPress = pressBase > 85;
    const healthPenalty = isOverTemp ? 8 : (baseCht > 185 ? 1.5 : 0);
    const health = parseFloat(Math.max(50, Math.min(100, 94.2 - healthPenalty + (Math.random() - 0.5) * 0.1)).toFixed(1));

    this.currentTelemetry = {
      rpm,
      cht: Math.round(baseCht),
      egt,
      oilPressure,
      oilTemp,
      fuelFlow: Math.max(15, fuelFlow),
      vibration,
      batteryVoltage,
      alternatorCurrent,
      cylinderCht: [cyl1, cyl2, cyl3, cyl4],
      cylinderPressure: [p1, p2, p3, p4],
      knockIndex: parseFloat((Math.max(0, (this.tuning.timingBtdc - 26) * 0.05 + (Math.random() * 0.01))).toFixed(2)),
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

    // Keep fixed window (last 40 points)
    this.history = [...this.history.slice(-39), newPoint];

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

import { Telemetry, TelemetryHistoryPoint } from '../types';
import { apiClient } from './api';
import { INITIAL_ENGINES, INITIAL_TELEMETRY_HISTORY } from './mockData';

export interface TelemetryEvent {
  engineIndex: number;
  engineId: string;
  telemetry: Telemetry;
  health: number;
}

class TelemetryService {
  private history: TelemetryHistoryPoint[] = [...INITIAL_TELEMETRY_HISTORY];
  private subscribers: Set<(event: TelemetryEvent) => void> = new Set();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    this.startStreaming();
  }

  public subscribe(callback: (event: TelemetryEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public async getHistory(): Promise<TelemetryHistoryPoint[]> {
    return apiClient.get<TelemetryHistoryPoint[]>('/api/v1/telemetry/history', this.history);
  }

  public startStreaming() {
    if (this.timerId) return;

    // Check for live WebSocket
    if (apiClient.isLive() && typeof window !== 'undefined') {
      try {
        const wsUrl = apiClient.getBaseUrl().replace(/^http/, 'ws') + '/ws/telemetry';
        this.ws = new WebSocket(wsUrl);
        this.ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data && typeof data.engineIndex === 'number') {
              this.broadcast(data);
            }
          } catch (err) {
            console.error('Error parsing WS telemetry packet:', err);
          }
        };
      } catch (err) {
        console.info('WS telemetry unavailable, running autonomous twin simulation loop:', err);
      }
    }

    // High fidelity autonomous twin simulation stream
    this.timerId = setInterval(() => {
      INITIAL_ENGINES.forEach((eng, idx) => {
        const jitterRpm = (Math.random() - 0.5) * 8;
        const jitterCht = (Math.random() - 0.5) * 0.4;
        const jitterEgt = (Math.random() - 0.5) * 1.5;
        const jitterOil = (Math.random() - 0.5) * 0.3;
        const jitterFuel = (Math.random() - 0.5) * 0.08;
        const jitterVib = (Math.random() - 0.5) * 0.04;
        const jitterFreq = (Math.random() - 0.5) * 0.3;

        const newRpm = Math.round(Math.max(1800, Math.min(2650, eng.telemetry.rpm + jitterRpm)));
        const newCht = +(Math.max(140, Math.min(240, eng.telemetry.cht + jitterCht))).toFixed(1);
        const newEgt = +(Math.max(550, Math.min(780, eng.telemetry.egt + jitterEgt))).toFixed(1);
        const newOil = +(Math.max(40, Math.min(95, eng.telemetry.oilPressure + jitterOil))).toFixed(1);
        const newFuel = +(Math.max(25, Math.min(42, eng.telemetry.fuelFlow + jitterFuel))).toFixed(1);
        const newVib = +(Math.max(1.2, Math.min(5.5, eng.telemetry.vibration + jitterVib))).toFixed(2);
        const newFreq = +(Math.max(115, Math.min(135, (eng.telemetry.harmonicFreq || 124.8) + jitterFreq))).toFixed(1);

        eng.telemetry = {
          ...eng.telemetry,
          rpm: newRpm,
          cht: newCht,
          egt: newEgt,
          oilPressure: newOil,
          fuelFlow: newFuel,
          vibration: newVib,
          harmonicFreq: newFreq,
          timestamp: Date.now(),
          cylinderTemps: [
            newCht,
            +(newCht - 3 + Math.random() * 2).toFixed(1),
            +(newCht + 2 + Math.random() * 2).toFixed(1),
            +(newCht - 1 + Math.random() * 2).toFixed(1),
          ],
        };

        this.broadcast({
          engineIndex: idx,
          engineId: eng.id,
          telemetry: eng.telemetry,
          health: eng.health,
        });
      });
    }, 850);
  }

  public stopStreaming() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private broadcast(event: TelemetryEvent) {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error broadcasting telemetry to listener:', err);
      }
    });
  }
}

export const telemetryService = new TelemetryService();

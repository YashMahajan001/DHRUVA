import {
  CopilotMessage,
  EngineInstance,
  FaultEvent,
  Mission,
  MroTask,
  Telemetry,
  TelemetryHistoryPoint,
} from '../types';
import {
  INITIAL_ALERTS,
  INITIAL_ENGINES,
  INITIAL_MISSION,
  INITIAL_MRO_TASKS,
} from './mockData';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL as string)) || '';

export interface TelemetryUpdateEvent {
  engineIndex: number;
  telemetry: Telemetry;
  health: number;
}

export class AeroEngineApiService {
  private engines: EngineInstance[] = JSON.parse(JSON.stringify(INITIAL_ENGINES));
  private mission: Mission = { ...INITIAL_MISSION };
  private alerts: FaultEvent[] = [...INITIAL_ALERTS];
  private mroTasks: MroTask[] = [...INITIAL_MRO_TASKS];
  private subscribers: Set<(event: TelemetryUpdateEvent) => void> = new Set();
  private streamIntervalId: ReturnType<typeof setInterval> | null = null;
  private wsConnection: WebSocket | null = null;

  constructor() {
    this.initStream();
  }

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  public isLiveBackend(): boolean {
    return Boolean(API_BASE_URL && API_BASE_URL.trim().length > 0);
  }

  public async fetchMission(): Promise<Mission> {
    if (this.isLiveBackend()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/mission`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error fetching mission, falling back to local twin state:', err);
      }
    }
    return this.mission;
  }

  public async fetchEngines(): Promise<EngineInstance[]> {
    if (this.isLiveBackend()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/engines`);
        if (res.ok) {
          this.engines = await res.json();
          return this.engines;
        }
      } catch (err) {
        console.warn('API error fetching engines, falling back to local twin store:', err);
      }
    }
    return this.engines;
  }

  public async fetchAlerts(): Promise<FaultEvent[]> {
    if (this.isLiveBackend()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error fetching alerts:', err);
      }
    }
    return this.alerts;
  }

  public async fetchMroTasks(): Promise<MroTask[]> {
    if (this.isLiveBackend()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/mro`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error fetching MRO tasks:', err);
      }
    }
    return this.mroTasks;
  }

  public subscribeTelemetry(callback: (event: TelemetryUpdateEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private initStream() {
    // If backend URL provided with websocket capability
    if (this.isLiveBackend() && typeof window !== 'undefined') {
      try {
        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/telemetry';
        this.wsConnection = new WebSocket(wsUrl);
        this.wsConnection.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data && typeof data.engineIndex === 'number') {
              this.notifySubscribers(data);
            }
          } catch (e) {
            console.error('Failed to parse WS telemetry:', e);
          }
        };
        this.wsConnection.onerror = () => {
          console.info('WS disconnected or not available; maintaining local telemetry engine.');
        };
      } catch (e) {
        console.info('WebSocket connection fallback:', e);
      }
    }

    // High-fidelity local aerospace telemetry simulation loop
    this.streamIntervalId = setInterval(() => {
      // Pick random or cyclically update engines
      this.engines.forEach((eng, idx) => {
        const jitterRpm = (Math.random() - 0.5) * 8;
        const jitterCht = (Math.random() - 0.5) * 0.4;
        const jitterEgt = (Math.random() - 0.5) * 1.5;
        const jitterOil = (Math.random() - 0.5) * 0.3;
        const jitterFuel = (Math.random() - 0.5) * 0.08;
        const jitterVib = (Math.random() - 0.5) * 0.04;
        const jitterFreq = (Math.random() - 0.5) * 0.3;

        // Bounded realistic limits
        const newRpm = Math.round(Math.max(1800, Math.min(2650, eng.telemetry.rpm + jitterRpm)));
        const newCht = +(Math.max(140, Math.min(240, eng.telemetry.cht + jitterCht))).toFixed(1);
        const newEgt = +(Math.max(550, Math.min(780, eng.telemetry.egt + jitterEgt))).toFixed(1);
        const newOil = +(Math.max(40, Math.min(95, eng.telemetry.oilPressure + jitterOil))).toFixed(1);
        const newFuel = +(Math.max(25, Math.min(42, eng.telemetry.fuelFlow + jitterFuel))).toFixed(1);
        const newVib = +(Math.max(1.2, Math.min(5.5, eng.telemetry.vibration + jitterVib))).toFixed(2);
        const newFreq = +(Math.max(115, Math.min(135, eng.telemetry.harmonicFreq + jitterFreq))).toFixed(1);

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

        this.notifySubscribers({
          engineIndex: idx,
          telemetry: eng.telemetry,
          health: eng.health,
        });
      });
    }, 850);
  }

  private notifySubscribers(event: TelemetryUpdateEvent) {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in telemetry subscriber callback:', err);
      }
    });
  }

  public async queryCopilot(
    query: string,
    context: {
      activeEngine: EngineInstance;
      allEngines: EngineInstance[];
      mission: Mission;
      alerts: FaultEvent[];
      mroTasks?: MroTask[];
      telemetryHistory?: TelemetryHistoryPoint[];
    }
  ): Promise<CopilotMessage> {
    const { agentService } = await import('./agentService');
    return agentService.queryCopilot(query, context);
  }

  public destroy() {
    if (this.streamIntervalId) {
      clearInterval(this.streamIntervalId);
      this.streamIntervalId = null;
    }
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscribers.clear();
  }
}

export const engineApi = new AeroEngineApiService();

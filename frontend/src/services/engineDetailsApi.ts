import {
  EngineInstance,
  Mission,
  TelemetryReading,
  FaultEvent,
  SubsystemState,
  SubsystemId
} from '../types/engineDetailsTypes';
import {
  INITIAL_ENGINES,
  INITIAL_MISSIONS,
  INITIAL_SUBSYSTEMS,
  INITIAL_ALERTS,
  INITIAL_TELEMETRY,
  generateTelemetryTick
} from './engineDetailsTelemetryService';

const API_BASE_URL = (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } })?.env?.VITE_API_BASE_URL || '';

export class DHRUVAA_ApiService {
  private static instance: DHRUVAA_ApiService;
  private wsConnection: WebSocket | null = null;
  private telemetrySubscribers: Array<(data: TelemetryReading) => void> = [];
  private simulationInterval: number | null = null;
  private currentTelemetry: TelemetryReading = { ...INITIAL_TELEMETRY };
  private isStressMode: boolean = false;

  private constructor() {}

  public static getInstance(): DHRUVAA_ApiService {
    if (!DHRUVAA_ApiService.instance) {
      DHRUVAA_ApiService.instance = new DHRUVAA_ApiService();
    }
    return DHRUVAA_ApiService.instance;
  }

  public getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  public isUsingRemoteApi(): boolean {
    return Boolean(API_BASE_URL && API_BASE_URL.trim().length > 0);
  }

  // REST endpoints with fallback to local aerospace simulation
  public async getEngines(): Promise<EngineInstance[]> {
    if (this.isUsingRemoteApi()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/engines`);
        if (res.ok) {
          const rawList = await res.json();
          if (Array.isArray(rawList) && rawList.length > 0) {
            return rawList.map((raw: any, idx: number) => {
              const fb = INITIAL_ENGINES[idx % INITIAL_ENGINES.length] || INITIAL_ENGINES[0];
              return {
                ...fb,
                id: raw.id || fb.id,
                model: raw.engine_model?.name || raw.name || fb.model,
                operatingHours: raw.total_hours ?? fb.operatingHours,
              };
            });
          }
        }
      } catch (err) {
        console.warn('[DHRUVAA API] Failed to fetch remote engines, using local digital twin store:', err);
      }
    }
    return Promise.resolve(INITIAL_ENGINES);
  }

  public async getMissions(): Promise<Mission[]> {
    if (this.isUsingRemoteApi()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/missions`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            return raw.map((m: any, idx: number) => {
              const fb = INITIAL_MISSIONS[idx % INITIAL_MISSIONS.length] || INITIAL_MISSIONS[0];
              return {
                ...fb,
                ...m,
                id: m.id || fb.id,
                callsign: m.callsign || fb.callsign,
              };
            });
          }
        }
      } catch (err) {
        console.warn('[DHRUVAA API] Failed to fetch remote missions, using local store:', err);
      }
    }
    return Promise.resolve(INITIAL_MISSIONS);
  }

  public async getSubsystems(): Promise<Record<SubsystemId, SubsystemState>> {
    if (this.isUsingRemoteApi()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/subsystems`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[DHRUVAA API] Failed to fetch remote subsystems, using local store:', err);
      }
    }
    return Promise.resolve(INITIAL_SUBSYSTEMS);
  }

  public async getAlerts(): Promise<FaultEvent[]> {
    if (this.isUsingRemoteApi()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[DHRUVAA API] Failed to fetch remote alerts, using local store:', err);
      }
    }
    return Promise.resolve(INITIAL_ALERTS);
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (this.isUsingRemoteApi()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/ack`, {
          method: 'POST'
        });
        return res.ok;
      } catch (err) {
        console.warn('[DHRUVAA API] Failed to ack alert on remote backend:', err);
      }
    }
    return true;
  }

  // Telemetry stream subscription (supports WebSocket or local simulation loop)
  public subscribeTelemetry(callback: (data: TelemetryReading) => void): () => void {
    this.telemetrySubscribers.push(callback);

    if (this.isUsingRemoteApi() && !this.wsConnection) {
      this.initWebSocket();
    } else if (!this.simulationInterval && !this.wsConnection) {
      this.startLocalSimulation();
    }

    return () => {
      this.telemetrySubscribers = this.telemetrySubscribers.filter(sub => sub !== callback);
      if (this.telemetrySubscribers.length === 0) {
        this.stopSimulation();
      }
    };
  }

  private initWebSocket() {
    try {
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/telemetry';
      this.wsConnection = new WebSocket(wsUrl);
      this.wsConnection.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.broadcastTelemetry(parsed);
        } catch {
          // ignore parsing error
        }
      };
      this.wsConnection.onerror = () => {
        console.warn('[DHRUVAA WS] Telemetry socket disconnected. Falling back to synthetic twin stream.');
        this.startLocalSimulation();
      };
    } catch {
      this.startLocalSimulation();
    }
  }

  private startLocalSimulation() {
    if (this.simulationInterval) return;
    this.simulationInterval = window.setInterval(() => {
      this.currentTelemetry = generateTelemetryTick(this.currentTelemetry, this.isStressMode);
      this.broadcastTelemetry(this.currentTelemetry);
    }, 1000);
  }

  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  public setStressMode(active: boolean) {
    this.isStressMode = active;
  }

  private broadcastTelemetry(reading: TelemetryReading) {
    this.telemetrySubscribers.forEach(sub => sub(reading));
  }
}

export const apiService = DHRUVAA_ApiService.getInstance();

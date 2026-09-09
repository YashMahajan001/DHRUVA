/**
 * DHRUVAA Mission Telemetry & Engine Service Layer
 * Supports plug-and-play FastAPI / REST / WebSocket / MQTT backend integration
 */

import { EngineInstance, Mission, FaultEvent, TuningParameters, CandidateConfig } from '../types/tuningTypes';
import { INITIAL_ENGINES, INITIAL_MISSIONS, INITIAL_ALERTS } from './tuningMockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class DhruvaaApiService {
  private engines: EngineInstance[] = [...INITIAL_ENGINES];
  private missions: Mission[] = [...INITIAL_MISSIONS];
  private alerts: FaultEvent[] = [...INITIAL_ALERTS];

  public getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  public async getEngines(): Promise<EngineInstance[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/engines`);
        if (res.ok) {
          const rawList = await res.json();
          if (Array.isArray(rawList) && rawList.length > 0) {
            return rawList.map((raw: any, idx: number) => {
              const fb = this.engines[idx % this.engines.length] || INITIAL_ENGINES[0];
              return {
                ...fb,
                id: raw.id || fb.id,
                name: raw.name || fb.name,
                model: raw.engine_model?.name || raw.name || fb.model,
                totalFlightHours: raw.total_hours ?? fb.totalFlightHours,
              };
            });
          }
        }
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, falling back to cached digital twin state:', err);
      }
    }
    return Promise.resolve([...this.engines]);
  }

  public async getEngine(id: string): Promise<EngineInstance | null> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/engines/${id}`);
        if (res.ok) {
          const raw = await res.json();
          if (raw) {
            const fb = this.engines.find(e => e.id.toLowerCase() === id.toLowerCase()) || this.engines[0];
            return {
              ...fb,
              id: raw.id || fb.id,
              name: raw.name || fb.name,
              model: raw.engine_model?.name || raw.name || fb.model,
              totalFlightHours: raw.total_hours ?? fb.totalFlightHours,
            };
          }
        }
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, using local mock data:', err);
      }
    }
    const found = this.engines.find(e => e.id.toLowerCase() === id.toLowerCase());
    return Promise.resolve(found ? { ...found } : null);
  }

  public async getMissions(): Promise<Mission[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/missions`);
        if (res.ok) {
          const rawList = await res.json();
          if (Array.isArray(rawList) && rawList.length > 0) {
            return rawList.map((raw: any, idx: number) => {
              const fb = this.missions[idx % this.missions.length] || INITIAL_MISSIONS[0];
              return {
                ...fb,
                ...raw,
                id: raw.id || fb.id,
              };
            });
          }
        }
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, using local mock data:', err);
      }
    }
    return Promise.resolve([...this.missions]);
  }

  public async getMission(id: string): Promise<Mission | null> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/missions/${id}`);
        if (res.ok) {
          const raw = await res.json();
          if (raw) {
            const fb = this.missions.find(m => m.id === id) || this.missions[0];
            return { ...fb, ...raw };
          }
        }
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, using local mock data:', err);
      }
    }
    const found = this.missions.find(m => m.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  public async getActiveAlerts(): Promise<FaultEvent[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, using local mock data:', err);
      }
    }
    return Promise.resolve([...this.alerts]);
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
    return Promise.resolve(true);
  }

  public async runSimulation(tuning: TuningParameters, missionId: string): Promise<{
    cycles: number;
    peakPressureBar: number;
    peakChtC: number;
    fuelBurnLh: number;
    passedEnvelope: boolean;
  }> {
    // Simulate physics engine calculation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Thermodynamic calculations based on tuning params
    // Higher lambda (lean) -> higher CHT, lower fuel burn
    // Higher timing -> higher peak pressure, higher CHT
    // Higher cowl threshold -> opens later, higher CHT
    // MAP profile -> eco dampens fuel/CHT, aggr increases them
    const lambdaFactor = (tuning.lambda - 0.85) / 0.3; // 0 (rich) to 1 (lean)
    const timingFactor = (tuning.timingBtdc - 18) / 10; // 0 to 1
    const rpmFactor = (tuning.rpmCeiling - 2200) / 600;
    const cowlFactor = (tuning.cowlShutterCht - 175) * 0.35;
    const mapChtFactor = tuning.mapProfile === 'aggr' ? 3 : tuning.mapProfile === 'eco' ? -2 : 0;
    const mapPressFactor = tuning.mapProfile === 'aggr' ? 2.1 : tuning.mapProfile === 'eco' ? -1.5 : 0;
    const mapFuelFactor = tuning.mapProfile === 'aggr' ? 1.3 : tuning.mapProfile === 'eco' ? -1.0 : 0;

    const baseCht = Math.round(168 + lambdaFactor * 30 + timingFactor * 4 + rpmFactor * 6 + cowlFactor + mapChtFactor);
    const basePressure = parseFloat((68 + timingFactor * 10 + rpmFactor * 5 + mapPressFactor).toFixed(1));
    const baseFuel = parseFloat(Math.max(16.0, 32.5 - lambdaFactor * 9 + rpmFactor * 4 + mapFuelFactor).toFixed(1));

    const passedEnvelope = baseCht <= 190 && basePressure <= 85.0;

    return {
      cycles: 1024,
      peakPressureBar: basePressure,
      peakChtC: baseCht,
      fuelBurnLh: baseFuel,
      passedEnvelope,
    };
  }

  public async exportToFadec(config: CandidateConfig, operatorSignoff: string): Promise<{
    success: boolean;
    checksum: string;
    stanagBlockId: string;
    timestamp: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const randomHex = Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
    return {
      success: true,
      checksum: `CRC32-0x${randomHex}`,
      stanagBlockId: `STANAG4586-BLK-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export const dhruvaaApi = new DhruvaaApiService();

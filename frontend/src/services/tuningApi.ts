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
        if (res.ok) return await res.json();
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
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[Dhruvaa API] Remote endpoint unavailable, using local mock data:', err);
      }
    }
    const found = this.engines.find(e => e.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  public async getMissions(): Promise<Mission[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/missions`);
        if (res.ok) return await res.json();
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
        if (res.ok) return await res.json();
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
    // Higher timing -> higher peak pressure
    const lambdaFactor = (tuning.lambda - 0.85) / 0.3; // 0 (rich) to 1 (lean)
    const timingFactor = (tuning.timingBtdc - 18) / 10; // 0 to 1
    const rpmFactor = (tuning.rpmCeiling - 2200) / 600;

    const baseCht = 168 + lambdaFactor * 42 + rpmFactor * 8;
    const basePressure = 68 + timingFactor * 9 + rpmFactor * 7;
    const baseFuel = 34 - lambdaFactor * 8 + rpmFactor * 5;

    const passedEnvelope = baseCht <= 190 && basePressure <= 85;

    return {
      cycles: 1024,
      peakPressureBar: parseFloat(basePressure.toFixed(1)),
      peakChtC: Math.round(baseCht),
      fuelBurnLh: parseFloat(baseFuel.toFixed(1)),
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

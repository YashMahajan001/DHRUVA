import { EngineInstance, TwinState } from '../types';
import { apiClient } from './api';
import { INITIAL_ENGINES } from './mockData';
import { adaptEngineInstance, adaptFleetResponse } from '../utils/engineAdapter';

class EngineService {
  private engines: EngineInstance[] = JSON.parse(JSON.stringify(INITIAL_ENGINES));

  public async getEngines(): Promise<EngineInstance[]> {
    const raw = await apiClient.get<any>('/api/v1/engines', this.engines);
    const adapted = adaptFleetResponse(raw);
    if (adapted && adapted.length > 0) {
      this.engines = adapted;
    }
    return this.engines;
  }

  public async getEngineById(id: string): Promise<EngineInstance | undefined> {
    const found = this.engines.find(
      (e) => e.id.toLowerCase() === id.toLowerCase() || e.name.toLowerCase().includes(id.toLowerCase())
    );
    if (found) return found;

    const raw = await apiClient.get<any>(`/api/v1/engines/${id}`, this.engines[0]);
    if (raw) {
      return adaptEngineInstance(raw, 0);
    }
    return this.engines[0];
  }

  public async getTwinState(engineId: string): Promise<TwinState | undefined> {
    const eng = await this.getEngineById(engineId);
    return eng?.twinState;
  }

  public updateEngine(id: string, updates: Partial<EngineInstance>): EngineInstance | undefined {
    const idx = this.engines.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.engines[idx] = { ...this.engines[idx], ...updates };
      return this.engines[idx];
    }
    return undefined;
  }
}

export const engineService = new EngineService();

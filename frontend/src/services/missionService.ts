import { Mission } from '../types';
import { apiClient } from './api';
import { INITIAL_MISSION } from './mockData';
import { adaptMission } from '../utils/engineAdapter';

class MissionService {
  private mission: Mission = { ...INITIAL_MISSION };

  public async getMission(): Promise<Mission> {
    const raw = await apiClient.get<any>('/api/v1/mission', this.mission);
    const adapted = adaptMission(raw);
    this.mission = adapted;
    return adapted;
  }

  public updateMission(updates: Partial<Mission>): Mission {
    this.mission = { ...this.mission, ...updates };
    return this.mission;
  }
}

export const missionService = new MissionService();

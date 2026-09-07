import { Mission } from '../types';
import { apiClient } from './api';
import { INITIAL_MISSION } from './mockData';

class MissionService {
  private mission: Mission = { ...INITIAL_MISSION };

  public async getMission(): Promise<Mission> {
    return apiClient.get<Mission>('/api/v1/mission', this.mission);
  }

  public updateMission(updates: Partial<Mission>): Mission {
    this.mission = { ...this.mission, ...updates };
    return this.mission;
  }
}

export const missionService = new MissionService();

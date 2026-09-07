import { FaultEvent, MaintenanceRecord } from '../types';
import { apiClient } from './api';
import { INITIAL_ALERTS, INITIAL_MRO_TASKS } from './mockData';

class HealthService {
  private alerts: FaultEvent[] = [...INITIAL_ALERTS];
  private mroTasks: MaintenanceRecord[] = [...INITIAL_MRO_TASKS];

  public async getAlerts(): Promise<FaultEvent[]> {
    return apiClient.get<FaultEvent[]>('/api/v1/alerts', this.alerts);
  }

  public async getMroTasks(): Promise<MaintenanceRecord[]> {
    return apiClient.get<MaintenanceRecord[]>('/api/v1/maintenance', this.mroTasks);
  }

  public dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
  }

  public acknowledgeAlert(alertId: string): void {
    const al = this.alerts.find((a) => a.id === alertId);
    if (al) al.acknowledged = true;
  }
}

export const healthService = new HealthService();

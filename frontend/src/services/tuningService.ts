import { CandidateConfig, TuningParameters } from '../types';
import { apiClient } from './api';
import { INITIAL_CANDIDATE_CONFIGS } from './mockData';

class TuningService {
  private candidates: CandidateConfig[] = JSON.parse(JSON.stringify(INITIAL_CANDIDATE_CONFIGS));
  private activeCandidateId: string = 'alpha';

  public async getCandidates(): Promise<CandidateConfig[]> {
    return apiClient.get<CandidateConfig[]>('/api/v1/tuning/candidates', this.candidates);
  }

  public getActiveCandidate(): CandidateConfig {
    return this.candidates.find((c) => c.id === this.activeCandidateId) || this.candidates[0];
  }

  public setActiveCandidate(id: string): CandidateConfig | undefined {
    const found = this.candidates.find((c) => c.id === id);
    if (found) {
      this.activeCandidateId = id;
      return found;
    }
    return undefined;
  }

  public validateSafetyEnvelope(params: TuningParameters): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    if (params.lambda > 1.12) {
      violations.push('Lambda exceeds lean-burn detonation threshold (1.12 max).');
    }
    if (params.timingBtdc > 26.5) {
      violations.push('Ignition advance timing exceeds cylinder pressure safety limit.');
    }
    if (params.rpmCeiling > 2700) {
      violations.push('RPM ceiling exceeds continuous rated crankshaft power band.');
    }
    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

export const tuningService = new TuningService();

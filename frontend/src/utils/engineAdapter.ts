import { EngineInstance, Mission, SubsystemHealth, Telemetry, TwinState } from '../types';
import { INITIAL_ENGINES, INITIAL_MISSION } from '../services/mockData';

/**
 * Normalizes an incoming engine object from backend (or mock) into a fully populated EngineInstance
 * that is safe against undefined property access in UI components.
 */
export function adaptEngineInstance(raw: any, index: number = 0): EngineInstance {
  const fallback = INITIAL_ENGINES[index % INITIAL_ENGINES.length] || INITIAL_ENGINES[0];
  if (!raw) {
    return { ...fallback, index };
  }

  const rawId = raw.id || raw.engineId || raw.engine_id || fallback.id;
  const matchMock = INITIAL_ENGINES.find(
    (e) => e.id.toLowerCase() === String(rawId).toLowerCase() || e.index === index
  ) || fallback;

  // Derive status and colors
  const healthScore = typeof raw.health === 'number' 
    ? raw.health 
    : typeof raw.health_score === 'number'
    ? raw.health_score
    : matchMock.health;

  let status = raw.status || raw.health_status || matchMock.status;
  let statusColor = matchMock.statusColor || '#10b981';
  if (healthScore >= 90) {
    status = status || 'HEALTHY // OPTIMAL';
    statusColor = '#10b981';
  } else if (healthScore >= 75) {
    status = status || 'WATCH // ELEVATED CHT';
    statusColor = '#f59e0b';
  } else {
    status = status || 'WARNING // HIGH HARMONIC VIB';
    statusColor = '#ef4444';
  }

  // Subsystems fallback
  const rawSubsystems = raw.twinState?.subsystems || raw.subsystems;
  const subsystems: SubsystemHealth = {
    fuelDelivery: rawSubsystems?.fuelDelivery ?? matchMock.twinState.subsystems?.fuelDelivery ?? 95,
    coolingAirflow: rawSubsystems?.coolingAirflow ?? matchMock.twinState.subsystems?.coolingAirflow ?? 92,
    lubricationSump: rawSubsystems?.lubricationSump ?? matchMock.twinState.subsystems?.lubricationSump ?? 94,
    dualMagnetosSpark: rawSubsystems?.dualMagnetosSpark ?? matchMock.twinState.subsystems?.dualMagnetosSpark ?? 98,
  };

  // TwinState fallback
  const twinState: TwinState = {
    ...matchMock.twinState,
    ...(raw.twinState || {}),
    confidence: raw.twinState?.confidence ?? raw.confidence_score ?? matchMock.twinState.confidence ?? 99.2,
    syncStatus: raw.twinState?.syncStatus ?? matchMock.twinState.syncStatus ?? 'SYNCHRONIZED',
    syntheticTwinId: raw.twinState?.syntheticTwinId ?? matchMock.twinState.syntheticTwinId ?? `SYNTHETIC TWIN D-0${index + 1}`,
    subsystems,
    cylinderHotspots: raw.twinState?.cylinderHotspots || matchMock.twinState.cylinderHotspots || [],
  };

  // Telemetry fallback
  const rawTel = raw.telemetry || {};
  const telemetry: Telemetry = {
    ...matchMock.telemetry,
    ...rawTel,
    rpm: rawTel.rpm ?? raw.rpm ?? matchMock.telemetry.rpm,
    cht: rawTel.cht ?? raw.cht ?? raw.temperature ?? matchMock.telemetry.cht,
    egt: rawTel.egt ?? raw.egt ?? matchMock.telemetry.egt,
    oilPressure: rawTel.oilPressure ?? raw.oil_pressure ?? matchMock.telemetry.oilPressure,
    oilTemperature: rawTel.oilTemperature ?? raw.oil_temp ?? matchMock.telemetry.oilTemperature,
    fuelFlow: rawTel.fuelFlow ?? raw.fuel_flow ?? matchMock.telemetry.fuelFlow,
    vibration: rawTel.vibration ?? matchMock.telemetry.vibration,
    vibrationRmsG: rawTel.vibrationRmsG ?? matchMock.telemetry.vibrationRmsG,
    batteryVoltage: rawTel.batteryVoltage ?? matchMock.telemetry.batteryVoltage,
    alternatorCurrent: rawTel.alternatorCurrent ?? matchMock.telemetry.alternatorCurrent,
    manifoldPressure: rawTel.manifoldPressure ?? matchMock.telemetry.manifoldPressure,
    cylinderTemps: rawTel.cylinderTemps || matchMock.telemetry.cylinderTemps || [174, 172, 176, 173],
    harmonicFreq: rawTel.harmonicFreq ?? matchMock.telemetry.harmonicFreq,
    twinDivergenceMae: rawTel.twinDivergenceMae ?? matchMock.telemetry.twinDivergenceMae,
    timestamp: rawTel.timestamp || Date.now(),
  };

  // RUL hours
  const rul = typeof raw.rul === 'number' 
    ? raw.rul 
    : typeof raw.rul_hours === 'number' 
    ? raw.rul_hours 
    : (raw.rul?.hoursRemaining ?? matchMock.rul ?? 200);

  return {
    ...matchMock,
    ...raw,
    id: String(rawId),
    index: typeof raw.index === 'number' ? raw.index : index,
    name: raw.name || matchMock.name,
    model: raw.model || raw.engine_model?.name || matchMock.model,
    position: raw.position || matchMock.position,
    health: healthScore,
    status,
    statusColor,
    rul,
    telemetry,
    twinState,
    totalFlightHours: raw.total_hours ?? raw.totalFlightHours ?? matchMock.totalFlightHours,
  };
}

/**
 * Adapts raw fleet API payload (which might be an array or an object { engines: [...] })
 */
export function adaptFleetResponse(raw: any): EngineInstance[] {
  if (!raw) return INITIAL_ENGINES;
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => adaptEngineInstance(item, idx));
  }
  if (Array.isArray(raw.engines)) {
    return raw.engines.map((item: any, idx: number) => adaptEngineInstance(item, idx));
  }
  if (raw.items && Array.isArray(raw.items)) {
    return raw.items.map((item: any, idx: number) => adaptEngineInstance(item, idx));
  }
  return INITIAL_ENGINES;
}

/**
 * Adapts raw mission payload to safe Mission object
 */
export function adaptMission(raw: any): Mission {
  if (!raw) return INITIAL_MISSION;

  return {
    ...INITIAL_MISSION,
    ...raw,
    id: raw.id || raw.missionId || raw.mission_id || INITIAL_MISSION.id,
    assetId: raw.assetId || raw.asset_id || INITIAL_MISSION.assetId,
    missionName: raw.missionName || raw.mission_name || INITIAL_MISSION.missionName,
    missionType: raw.missionType || raw.mission_type || INITIAL_MISSION.missionType,
    phase: raw.phase || INITIAL_MISSION.phase,
    altitudeFt: raw.altitudeFt ?? raw.altitude ?? INITIAL_MISSION.altitudeFt,
    airspeedKt: raw.airspeedKt ?? raw.airspeed ?? INITIAL_MISSION.airspeedKt,
    fuelRemainingPct: raw.fuelRemainingPct ?? raw.fuel_remaining_pct ?? INITIAL_MISSION.fuelRemainingPct,
    remainingTime: raw.remainingTime || raw.remaining_time || INITIAL_MISSION.remainingTime,
    missionProgressPct: raw.missionProgressPct ?? raw.progress_pct ?? INITIAL_MISSION.missionProgressPct,
    linkStatus: raw.linkStatus || raw.link_status || INITIAL_MISSION.linkStatus,
  };
}

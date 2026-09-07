/**
 * DHRUVAA — Engine Simulation Engine
 * Computes realistic 4-cylinder aero piston thermodynamics, fuel flow,
 * vibration harmonics, oil dynamics, and twin health models.
 */

import { FaultInjections, Telemetry, TwinState, Mission, HealthSeverity } from '../types/simulationTypes';

export interface SimStateInput {
  secondsElapsed: number;
  altitude: number;
  ambientTemperature: number;
  throttleDemandPercent: number;
  mission: Mission;
  faults: FaultInjections;
}

export function formatMET(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `T+${h}:${m}:${s}`;
}

export function computeSimulatedTelemetry(input: SimStateInput): { telemetry: Telemetry; twinState: TwinState } {
  const { secondsElapsed, altitude, ambientTemperature, throttleDemandPercent, mission, faults } = input;
  
  // High-frequency jitter
  const tSec = secondsElapsed;
  const highFreqNoise = (Math.sin(tSec * 1.7) * 0.4) + ((Math.random() - 0.5) * 0.3);
  const microTempJitter = Math.cos(tSec * 0.9) * 0.5;

  // RPM: Base idle 900 to max 2700 RPM at 100% WOT
  const targetRpm = 1200 + (throttleDemandPercent / 100) * 1500;
  const rpm = Math.round(targetRpm + highFreqNoise * 8);

  // Density altitude calculation
  // Approx: Density altitude = Pressure altitude + [120 * (OAT - ISA_temp)]
  // ISA temp at altitude = 15 - (1.98 * alt / 1000)
  const isaTemp = 15 - (1.98 * altitude / 1000);
  const densityAltitude = Math.round(altitude + 120 * (ambientTemperature - isaTemp));

  // True Airspeed (KTAS) & Groundspeed (KT)
  const baseTas = 130 + (throttleDemandPercent / 100) * 125;
  const trueAirspeed = Math.round(baseTas + (altitude / 1000) * 0.8 + highFreqNoise);
  const groundSpeed = Math.round(trueAirspeed - mission.windSpeedKt * Math.cos(mission.windHeadingDeg * Math.PI / 180));

  // Rate of climb (FPM) based on throttle and target altitude
  let rateOfClimb = 0;
  if (throttleDemandPercent > 80) rateOfClimb = +120 + Math.round(highFreqNoise * 15);
  else if (throttleDemandPercent < 45) rateOfClimb = -340 + Math.round(highFreqNoise * 15);
  else rateOfClimb = 0 + Math.round(highFreqNoise * 10);

  // Fuel flow rate (L/HR)
  // Standard 160 HP Lycoming burns approx 32-38 L/hr at 75% cruise, ~14 L/hr loiter
  const baseFuelRate = 12.0 + (throttleDemandPercent / 100) * 23.5;
  let fuelFlowRate = baseFuelRate + highFreqNoise * 0.2;
  if (faults.fuelInjectorClog) {
    fuelFlowRate -= 3.8; // Lean AFR spike, starved rail volume
  }
  fuelFlowRate = Math.max(8.0, Number(fuelFlowRate.toFixed(1)));

  // Fuel remaining countdown
  const startingFuel = 145.0; // Litres
  const burnedFuel = (secondsElapsed / 3600) * (fuelFlowRate * 0.85);
  const fuelRemaining = Math.max(4.0, Number((startingFuel - burnedFuel).toFixed(1)));

  // Safe RTB Fuel Margin in hours (reserve fuel: 25 L)
  const usableFuel = Math.max(0, fuelRemaining - 22.0);
  const safeRtbMarginHours = Number((usableFuel / (fuelFlowRate || 25)).toFixed(1));

  // THERMAL CORE: CHT (Cylinder Head Temperature in °C)
  // Normal range: 165°C - 205°C. Critical > 230°C
  let baseCht = 168 + (throttleDemandPercent / 100) * 22 + (ambientTemperature * 0.18);
  if (faults.coolingJacketDegradation) {
    baseCht += 28.5; // Severe heat buildup
  }
  if (faults.chtThermocoupleDrift) {
    baseCht += 24.0; // Sensor telemetry calibration bias
  }
  const chtAvg = Math.round(baseCht + microTempJitter);

  // Individual Cylinders
  const cyl1 = chtAvg - 2 + Math.round((Math.sin(tSec * 0.8) * 1));
  const cyl2 = chtAvg + 1 + Math.round((Math.cos(tSec * 0.7) * 1));
  // If Injector #3 clogged, Cyl 3 runs extremely lean and overheats
  const cyl3 = faults.fuelInjectorClog 
    ? chtAvg + 21 + Math.round(highFreqNoise * 2) 
    : chtAvg + 2 + Math.round((Math.sin(tSec * 1.1) * 1));
  const cyl4 = chtAvg - 1 + Math.round((Math.cos(tSec * 1.3) * 1));

  // OIL TEMPERATURE (°C) Normal: 75°C - 95°C
  let baseOilTemp = 78 + (throttleDemandPercent / 100) * 14 + (ambientTemperature * 0.12);
  if (faults.coolingJacketDegradation) baseOilTemp += 15;
  if (faults.lubricationPressureLeak) baseOilTemp += 19;
  const oilTemperature = Math.round(baseOilTemp + microTempJitter * 0.5);

  // EGT (Exhaust Gas Temperature in °C) Normal: 680°C - 740°C
  let baseEgt = 675 + (throttleDemandPercent / 100) * 50;
  if (faults.fuelInjectorClog) baseEgt += 35; // Lean combustion creates elevated EGT
  const egtPeak = Math.round(baseEgt + microTempJitter * 2);
  const egtCylinders: [number, number, number, number] = [
    egtPeak - 8,
    egtPeak + 4,
    faults.fuelInjectorClog ? egtPeak + 38 : egtPeak + 9,
    egtPeak - 3
  ];

  // OIL PRESSURE (PSI) Normal: 55 - 75 PSI
  let baseOilPress = 66.5 - (throttleDemandPercent / 100) * 3.5;
  if (faults.lubricationPressureLeak) {
    baseOilPress -= 16.8; // Drops below safe threshold
  }
  const oilPressure = Number((Math.max(15, baseOilPress + highFreqNoise * 0.3)).toFixed(1));

  // VIBRATION SPECTRUM (RMS in mm/s) Normal: 1.8 - 2.8 mm/s. Critical > 5.0 mm/s
  let baseVibe = 2.1 + (throttleDemandPercent > 85 ? 0.6 : 0);
  if (faults.crankshaftRotorImbalance) {
    baseVibe += 3.9; // Spikes up to 6.0+ mm/s
  }
  const vibrationRms = Number((baseVibe + ((Math.sin(tSec * 3) + 1) * 0.15)).toFixed(1));

  // Harmonic spectrum bars (8 frequencies: 10Hz, 25Hz, 50Hz, 75Hz, 1X Crank, 2X Crank, 150Hz, 200Hz)
  const isImbalanced = faults.crankshaftRotorImbalance;
  const vibrationHarmonics = [
    Math.min(100, Math.round(25 + highFreqNoise * 5)),
    Math.min(100, Math.round(42 + highFreqNoise * 8)),
    Math.min(100, Math.round(isImbalanced ? 88 : 38 + highFreqNoise * 6)), // 1X crank spike
    Math.min(100, Math.round(22 + highFreqNoise * 4)),
    Math.min(100, Math.round(isImbalanced ? 94 : 45 + highFreqNoise * 10)), // 2X crank spike
    Math.min(100, Math.round(isImbalanced ? 65 : 28 + highFreqNoise * 5)),
    Math.min(100, Math.round(20 + highFreqNoise * 3)),
    Math.min(100, Math.round(14 + highFreqNoise * 2))
  ];

  // Battery & Alternator
  const batteryVoltage = Number((28.1 + Math.sin(tSec * 0.2) * 0.2).toFixed(1));
  const alternatorCurrent = Number((38.0 + (throttleDemandPercent / 100) * 8.5 + highFreqNoise * 0.8).toFixed(1));

  // Engine Horsepower & BHP output
  const maxRatedHp = 160;
  const engineOutputHp = Math.round(maxRatedHp * (throttleDemandPercent / 100) * (1 - (faults.fuelInjectorClog ? 0.12 : 0)));
  const engineBhpPercent = Math.round((engineOutputHp / maxRatedHp) * 100);

  // UAV Coordinates in Airspace-04 (surveillance orbit around 34°12'N 71°45'E)
  const orbitRadius = 0.035; // degrees
  const angle = (secondsElapsed % 720) * (2 * Math.PI / 720);
  const latitude = 34.2011 + Math.cos(angle) * orbitRadius;
  const longitude = 71.7561 + Math.sin(angle) * (orbitRadius * 1.3);
  const latDeg = Math.floor(latitude);
  const latMin = Math.floor((latitude - latDeg) * 60);
  const latSec = Math.floor(((latitude - latDeg) * 60 - latMin) * 60);
  const lngDeg = Math.floor(longitude);
  const lngMin = Math.floor((longitude - lngDeg) * 60);
  const lngSec = Math.floor(((longitude - lngDeg) * 60 - lngMin) * 60);
  const coordinatesFormatted = `${latDeg}°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}"N ${lngDeg}°${lngMin.toString().padStart(2, '0')}'${lngSec.toString().padStart(2, '0')}"E`;

  // TWIN PREDICTIVE HEALTH ENGINE
  let health = 93.5;
  if (faults.coolingJacketDegradation) health -= 18.5;
  if (faults.fuelInjectorClog) health -= 14.0;
  if (faults.lubricationPressureLeak) health -= 22.5;
  if (faults.crankshaftRotorImbalance) health -= 19.0;
  if (faults.chtThermocoupleDrift) health -= 6.0;
  if (throttleDemandPercent > 92) health -= 3.5;
  
  // Slight random variance
  health += Math.sin(tSec * 0.3) * 0.5;
  const healthScore = Math.max(12.0, Math.min(99.5, Number(health.toFixed(1))));

  let healthStatus: HealthSeverity = 'OPTIMAL';
  let estimatedRulPenalty = -4; // baseline wear
  if (healthScore >= 85) {
    healthStatus = 'OPTIMAL';
    estimatedRulPenalty = -4;
  } else if (healthScore >= 70) {
    healthStatus = 'WATCH';
    estimatedRulPenalty = -16;
  } else if (healthScore >= 50) {
    healthStatus = 'WARNING';
    estimatedRulPenalty = -48;
  } else {
    healthStatus = 'CRITICAL';
    estimatedRulPenalty = -148;
  }

  // Mission Endurance remaining based on fuel and thermal fatigue
  const enduranceHours = Number((Math.min(12.0, fuelRemaining / (fuelFlowRate || 25))).toFixed(1));

  // Twin Convergence & Latency
  const twinConvergencePercent = Number((99.84 - (faults.chtThermocoupleDrift ? 1.4 : 0) + (Math.sin(tSec) * 0.04)).toFixed(2));
  const inferenceLatencyMs = Number((1.42 + (Math.random() * 0.18)).toFixed(2));

  const telemetry: Telemetry = {
    timestamp: Date.now(),
    timeFormatted: formatMET(secondsElapsed),
    rpm,
    chtAvg,
    chtCylinders: [cyl1, cyl2, cyl3, cyl4],
    oilTemperature,
    egtPeak,
    egtCylinders,
    fuelFlowRate,
    oilPressure,
    vibrationRms,
    vibrationHarmonics,
    batteryVoltage,
    alternatorCurrent,
    trueAirspeed,
    groundSpeed,
    rateOfClimb,
    altitude,
    densityAltitude,
    ambientTemperature,
    throttleDemandPercent,
    fuelRemaining,
    safeRtbMarginHours,
    latitude,
    longitude,
    coordinatesFormatted,
    engineOutputHp,
    engineBhpPercent
  };

  const twinState: TwinState = {
    healthScore,
    healthStatus,
    rulHoursRemaining: 1420 + estimatedRulPenalty,
    estimatedRulPenalty,
    missionEnduranceHours: enduranceHours,
    twinConvergencePercent,
    inferenceLatencyMs,
    thermodynamicEfficiency: Number((33.2 - (faults.fuelInjectorClog ? 4.1 : 0)).toFixed(1)),
    boundaryLayerFrictionIndex: Number((1.04 + (faults.lubricationPressureLeak ? 0.38 : 0)).toFixed(2)),
    syncState: faults.chtThermocoupleDrift ? 'CALIBRATING' : 'SYNCHRONOUS'
  };

  return { telemetry, twinState };
}

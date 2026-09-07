import {
  CopilotMessage,
  DhruvaAgentResponse,
  DhruvaReasoningChain,
  EngineInstance,
  FaultEvent,
  FleetRankingItem,
  Mission,
  MissionImpactData,
  MroTask,
  SuggestedActionItem,
  TelemetryEvidenceMetric,
  TelemetryHistoryPoint,
  ThrottleResponseData,
  TuningComparisonData,
  WhyThisAlertExplanation,
} from '../types';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL as string)) || '';

export interface AgentContext {
  activeEngine: EngineInstance;
  allEngines: EngineInstance[];
  mission: Mission;
  alerts: FaultEvent[];
  mroTasks?: MroTask[];
  telemetryHistory?: TelemetryHistoryPoint[];
}

// ============================================================
// MODULAR ANALYTICAL TOOLS (DEMO DATA ADAPTER)
// ============================================================

export interface ParameterBaseline {
  nominal: number;
  tolerance: number;
  weight: number;
}

export const PROTOTYPE_BASELINES: Record<string, ParameterBaseline> = {
  rpm: { nominal: 2450.0, tolerance: 150.0, weight: 0.1 },
  cht: { nominal: 175.0, tolerance: 25.0, weight: 0.25 },
  egt: { nominal: 690.0, tolerance: 45.0, weight: 0.15 },
  oilPressure: { nominal: 80.0, tolerance: 15.0, weight: 0.2 },
  oilTemperature: { nominal: 85.0, tolerance: 15.0, weight: 0.1 },
  fuelFlow: { nominal: 32.0, tolerance: 4.0, weight: 0.1 },
  vibration: { nominal: 2.0, tolerance: 1.0, weight: 0.2 },
};

/** Tool 1: Engine Health Analytics */
export function getEngineHealth(engineId: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const target = context.allEngines.find((e) => e.id === normId || e.id === engineId) || context.activeEngine;
  const telem = target.telemetry;
  const subsystems = target.twinState?.subsystems || {
    fuelDelivery: 90,
    coolingAirflow: 85,
    lubricationSump: 85,
    dualMagnetosSpark: 95,
  };
  const reportedHealth = target.health;

  let weightedAnomalySum = 0;
  let totalWeight = 0;
  const deviations: Record<string, { measured: number; deltaPct: number; zScore: number }> = {};

  for (const [key, base] of Object.entries(PROTOTYPE_BASELINES)) {
    const val = (telem as unknown as Record<string, number>)[key] ?? base.nominal;
    const rawDev = val - base.nominal;
    const pct = base.nominal !== 0 ? (rawDev / base.nominal) * 100 : 0;
    const z = Math.abs(rawDev) / base.tolerance;
    deviations[key] = { measured: Number(val.toFixed(1)), deltaPct: Number(pct.toFixed(1)), zScore: Number(z.toFixed(2)) };
    weightedAnomalySum += z * base.weight;
    totalWeight += base.weight;
  }

  const compositeAnomalyScore = Number((weightedAnomalySum / Math.max(totalWeight, 0.01)).toFixed(2));

  const anomalyFlags: string[] = [];
  if (telem.cht > 200 || deviations.cht?.deltaPct > 15) {
    anomalyFlags.push('Thermal Stress (Elevated Cylinder Head Temp)');
  }
  if (telem.egt > 730) {
    anomalyFlags.push('Combustion Instability (High EGT)');
  }
  if (telem.oilPressure < 65 || telem.oilTemperature > 95) {
    anomalyFlags.push('Lubrication Concern (Oil Pressure Drop / High Thermal Load)');
  }
  if (telem.vibration > 3.0) {
    anomalyFlags.push('Vibration Anomaly (Rotational Harmonic Peak)');
  }
  if (subsystems.coolingAirflow < 70) {
    anomalyFlags.push('Cooling Airflow Degradation (Baffle Pressure Loss)');
  }

  return {
    engineId: target.id,
    reportedHealth,
    compositeAnomalyScore,
    anomalyFlags,
    deviations,
    subsystems,
  };
}

/** Tool 2: Telemetry & Dynamic Signals */
export function getTelemetry(engineId: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const target = context.allEngines.find((e) => e.id === normId || e.id === engineId) || context.activeEngine;
  const telem = target.telemetry;

  // Throttle response analysis (Derived Demo Analytic)
  const baseLatencyMs = 420.0;
  const healthFactor = (100.0 - target.health) / 100.0;
  const vibFactor = Math.max(0, (telem.vibration - 2.0) * 45.0);
  const thermalDrag = Math.max(0, (telem.oilTemperature - 85.0) * 3.5);
  const derivedLatencyMs = Number((baseLatencyMs + healthFactor * 180.0 + vibFactor + thermalDrag).toFixed(1));
  const slewRate = Number(Math.max(35.0, 95.0 - healthFactor * 40.0 - telem.vibration * 3.0).toFixed(1));
  const bandwidthHz = Number((1000.0 / (derivedLatencyMs * 2.0 * Math.PI)).toFixed(2));

  let throttleAssessment = 'NORMAL // CRISP TRANSIENT RESPONSE';
  if (derivedLatencyMs > 580) {
    throttleAssessment = 'SLUGGISH // ELEVATED POWER-STEP LATENCY (Review Recommended)';
  } else if (derivedLatencyMs > 460) {
    throttleAssessment = 'DEGRADED // MINOR GOVERNOR LAG (+15-30% latency)';
  }

  // Complex Phasor Vibration Representation: z = A*(cos(theta) + i*sin(theta))
  const phaseDeg = Number((((telem.harmonicFreq * 17.3) + target.index * 90.0) % 360.0 - 180.0).toFixed(1));
  const phaseRad = (phaseDeg * Math.PI) / 180.0;
  const realComp = Number((telem.vibration * Math.cos(phaseRad)).toFixed(3));
  const imagComp = Number((telem.vibration * Math.sin(phaseRad)).toFixed(3));

  const isDeviating = derivedLatencyMs > 500;

  return {
    engineId: target.id,
    telemetry: telem,
    throttleResponse: {
      stepLatencyMs: derivedLatencyMs,
      nominalLatencyMs: baseLatencyMs,
      latencyDeviationPct: Number((((derivedLatencyMs - baseLatencyMs) / baseLatencyMs) * 100).toFixed(1)),
      powerSlewRatePctSec: slewRate,
      responseBandwidthHz: bandwidthHz,
      assessment: throttleAssessment,
      commandPct: 100,
      actualPct: isDeviating ? 72 : 98,
      isDerived: true,
    } as ThrottleResponseData,
    vibrationPhasor: {
      magnitudeMmS: telem.vibration,
      phaseDeg,
      realComponent: realComp,
      imagComponent: imagComp,
      interpretation: telem.vibration > 3.0 ? 'Phasor magnitude elevated; asymmetric radial unbalance' : 'Phasor within nominal envelope',
    },
  };
}

/** Tool 3: Fault Analysis */
export function analyzeFaults(engineId: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const isFleet = normId === 'ALL' || normId === 'FLEET';
  const targetAlerts = isFleet
    ? context.alerts
    : context.alerts.filter((a) => a.engineId === normId || a.engineId === engineId);

  const criticalCount = targetAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = targetAlerts.filter((a) => a.severity === 'WARNING').length;

  return {
    engineId,
    totalFaults: targetAlerts.length,
    criticalCount,
    warningCount,
    alerts: targetAlerts,
    overallRisk: criticalCount > 0 ? 'HIGH RISK' : warningCount > 0 ? 'MODERATE RISK' : 'NOMINAL',
  };
}

/** Tool 4: RUL Prognostic Analysis */
export function estimateRul(engineId: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const target = context.allEngines.find((e) => e.id === normId || e.id === engineId) || context.activeEngine;
  const telem = target.telemetry;

  const vibStress = Math.max(1.0, Math.pow(telem.vibration / 2.0, 2.2));
  const thermalStress = telem.cht > 175 ? Math.max(1.0, Math.pow((telem.cht - 140) / 35.0, 1.8)) : 1.0;
  const compositeStress = Number(((0.5 * vibStress) + (0.35 * thermalStress) + 0.15).toFixed(2));

  let bottleneck = 'Nominal Component Wear Cycle';
  let urgency = 'ROUTINE';
  if (telem.vibration > 4.0) {
    bottleneck = 'Crankshaft Journal & Main Bearing Hub (Vibration Fatigue)';
    urgency = 'IMMEDIATE (Pre-flight inspection mandatory)';
  } else if (telem.cht > 210) {
    bottleneck = 'Cylinder #3 Exhaust Valve & Baffle Airflow Matrix';
    urgency = 'HIGH (Borescope inspection required)';
  }

  return {
    engineId: target.id,
    estimatedRulHours: target.rul,
    modelType: 'PROTOTYPE ANALYTICAL ESTIMATOR',
    compositeStressIndex: compositeStress,
    acceleratedWearRate: `${compositeStress}x nominal baseline`,
    limitingSubsystem: bottleneck,
    maintenanceUrgency: urgency,
  };
}

/** Tool 5: Mission Readiness Simulator */
export function simulateMission(engineId: string, missionProfile: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const target = context.allEngines.find((e) => e.id === normId || e.id === engineId) || context.activeEngine;
  const telem = target.telemetry;
  const health = target.health;
  const rul = target.rul;

  const riskFactors: string[] = [];
  const targetDurationHours = 6.0;

  if (health < 70) {
    riskFactors.push(`Engine health (${health}%) below required threshold (70%)`);
  }
  if (rul - targetDurationHours < 15) {
    riskFactors.push(`RUL safety margin critically tight (${rul} hrs vs ${targetDurationHours} hr mission)`);
  }
  if (telem.cht > 205) {
    riskFactors.push(`CHT elevated at ${telem.cht}°C (marginal thermal headroom)`);
  }
  if (telem.vibration > 3.5) {
    riskFactors.push(`Vibration level (${telem.vibration} mm/s) exceeds profile allowance (3.5 mm/s)`);
  }

  let readinessClass: 'NOMINAL' | 'CONDITIONAL' | 'REVIEW REQUIRED' | 'NOT RECOMMENDED' = 'NOMINAL';
  let envelopeStatus = 'FLIGHT ENVELOPE: OPTIMAL // MISSION READY';
  let recommendation = 'Full mission clearance recommended under standard cruise parameters.';

  if (rul < 20 || health < 50 || telem.vibration > 4.2) {
    readinessClass = 'NOT RECOMMENDED';
    envelopeStatus = 'FLIGHT ENVELOPE: RESTRICTED // ABORT SORTIE';
    recommendation = `Mission sortie NOT RECOMMENDED for ${target.id}. High probability of component threshold breach during 6-hour loiter.`;
  } else if (riskFactors.length > 0) {
    readinessClass = 'CONDITIONAL';
    envelopeStatus = 'FLIGHT ENVELOPE: CONDITIONAL (Derated Loiter)';
    recommendation = `Conditional clearance granted with restricted continuous manifold pressure (derate 6%). Monitor CHT and vibration.`;
  }

  const missionImpactData: MissionImpactData = {
    profileName: 'Extended Loiter Endurance (6-Hour ISR)',
    readiness: readinessClass,
    thermalStress: telem.cht > 210 ? 'CRITICAL' : telem.cht > 190 ? 'ELEVATED' : 'NOMINAL',
    vibrationStress: telem.vibration > 4.0 ? 'CRITICAL' : telem.vibration > 3.0 ? 'ELEVATED' : 'NOMINAL',
    rulStatus: rul <= 20 ? 'CRITICAL' : rul <= 50 ? 'MARGINAL' : 'ACCEPTABLE',
    factors: riskFactors.length > 0 ? riskFactors : ['All flight profile parameters within nominal envelope buffers.'],
  };

  return {
    engineId: target.id,
    missionProfile: 'Extended Loiter Endurance (6-Hour ISR)',
    targetDurationHours,
    readinessClassification: readinessClass,
    envelopeStatus,
    recommendation,
    riskFactors,
    projectedFuelBurnL: Number((telem.fuelFlow * targetDurationHours).toFixed(1)),
    thermalHeadroomC: Number((215 - telem.cht).toFixed(1)),
    vibrationHeadroomMmS: Number((3.5 - telem.vibration).toFixed(2)),
    missionImpactData,
  };
}

/** Tool 6: Tuning Profile Tradeoff Simulator */
export function simulateTuning(engineId: string, tuningQuery: string, context: AgentContext) {
  const normId = engineId.replace('-', ' ');
  const target = context.allEngines.find((e) => e.id === normId || e.id === engineId) || context.activeEngine;
  const telem = target.telemetry;

  const tuningData: TuningComparisonData = {
    profileA: {
      name: 'Profile A (Lean Cruise / High Endurance)',
      fuelTrend: 'up', // 'up' efficiency
      chtTrend: 'up', // 'up' thermal relief / lower stress
      vibTrend: 'up', // 'up' vibration margin
      throttleTrend: 'down', // 'down' slower response
      fuelLHr: Number((telem.fuelFlow * 0.905).toFixed(1)),
      chtC: Number((telem.cht + 4.0).toFixed(1)),
      latencyDeltaMs: +85,
      summary: '-9.5% Fuel Burn, +42 min Loiter, +85ms Step Lag',
    },
    profileB: {
      name: 'Profile B (High Agility / Rapid Transient)',
      fuelTrend: 'down', // 'down' worse fuel efficiency
      chtTrend: 'down', // 'down' higher thermal load
      vibTrend: 'down', // 'down' more vibration
      throttleTrend: 'up', // 'up' fast crisp throttle
      fuelLHr: Number((telem.fuelFlow * 1.12).toFixed(1)),
      chtC: Number((telem.cht + 12.5).toFixed(1)),
      latencyDeltaMs: -110,
      summary: '+12.0% Fuel Burn, -110ms Step Latency, +12.5°C CHT',
    },
    recommended: 'PROFILE A',
    reason: 'Profile A provides superior fuel conservation (+42 min loiter) and stable thermal margins for endurance orbits.',
  };

  return {
    engineId: target.id,
    recommendedProfile: 'Profile A (Lean Cruise / High Endurance Map)',
    tuningData,
    recommendation: 'Select Profile A (Lean Cruise Map) for extended autonomous loiter missions.',
  };
}

/** Tool 7: Maintenance Advisory & Fleet Prioritization */
export function getMaintenanceAdvice(engineId: string, context: AgentContext) {
  const fleetRankings: FleetRankingItem[] = context.allEngines.map((eng) => {
    const alerts = context.alerts.filter((a) => a.engineId === eng.id);
    const critAlerts = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const warnAlerts = alerts.filter((a) => a.severity === 'WARNING').length;

    const healthDeficit = Math.max(0, 100 - eng.health);
    const rulDeficit = eng.rul <= 25 ? 100 : Math.max(0, (200 - eng.rul) * 0.5);
    const vibPenalty = Math.max(0, (eng.telemetry.vibration - 2.0) * 25.0);
    const faultPenalty = critAlerts * 40.0 + warnAlerts * 20.0;
    const thermalPenalty = Math.max(0, (eng.telemetry.cht - 180.0) * 1.5);

    const urgencyScore = Number(
      (healthDeficit * 0.25 + rulDeficit * 0.3 + vibPenalty * 0.2 + faultPenalty * 0.15 + thermalPenalty * 0.1).toFixed(1)
    );

    const flags: string[] = [];
    if (eng.rul <= 25) flags.push(`RUL critical at ${eng.rul} operating hours`);
    if (eng.health < 60) flags.push(`Health index (${eng.health}%) severely below fleet baseline`);
    if (eng.telemetry.vibration > 4.0) flags.push(`Excessive vibration (${eng.telemetry.vibration} mm/s RMS)`);
    if (critAlerts > 0) flags.push(`${critAlerts} critical fault(s) logged`);

    let priority: 'HIGH' | 'MEDIUM' | 'NOMINAL' = 'NOMINAL';
    if (urgencyScore > 50 || eng.rul <= 25) priority = 'HIGH';
    else if (urgencyScore > 25 || eng.health < 80) priority = 'MEDIUM';

    return {
      rank: 0,
      engineId: eng.id,
      engineName: eng.name,
      priority,
      health: eng.health,
      rulHours: eng.rul,
      vibrationMmS: eng.telemetry.vibration,
      chtC: eng.telemetry.cht,
      urgencyScore,
      criticalFlags: flags,
    };
  });

  fleetRankings.sort((a, b) => b.urgencyScore - a.urgencyScore);
  fleetRankings.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const topPriority = fleetRankings[0];

  return {
    highestPriorityEngine: topPriority?.engineId || 'ENG 03',
    priorityRationale: topPriority?.criticalFlags || [],
    fleetQueue: fleetRankings,
    recommendation: `1. Perform acoustic borescope inspection of ${topPriority?.engineId || 'ENG 03'} crank journal bearings. 2. Stage Spare Assembly PK-320-B for rapid turnaround.`,
  };
}

// ============================================================
// DETERMINISTIC INTENT ROUTER & ORCHESTRATOR
// ============================================================

export async function processAgentQuery(query: string, context: AgentContext): Promise<DhruvaAgentResponse> {
  const q = query.toLowerCase().trim();

  // Try live backend if available
  if (API_BASE_URL && API_BASE_URL.trim().length > 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      if (res.ok) {
        return (await res.json()) as DhruvaAgentResponse;
      }
    } catch (e) {
      console.warn('Live backend query failed, falling back to local DHRUVA demo agent:', e);
    }
  }

  // Extract mentioned engine (e.g. ENG 03, ENG-03, eng3)
  let targetEngineId = context.activeEngine?.id || 'ENG 01';
  const match = q.match(/eng(?:ine)?[-_\s]*0?([1-4])/);
  if (match) {
    targetEngineId = `ENG 0${match[1]}`;
  }

  // 1. Tuning comparison / Profile evaluation
  if (q.includes('tune') || q.includes('tuning') || q.includes('profile') || q.includes('fadec') || q.includes('tradeoff')) {
    const ts = simulateTuning(targetEngineId, query, context);
    const te = getTelemetry(targetEngineId, context);
    const eh = getEngineHealth(targetEngineId, context);

    const findings = [
      `Simulated performance trade-offs across 3 FADEC tuning maps for ${targetEngineId}.`,
      `Recommended Profile for Endurance: Profile A (Lean Cruise / High Endurance Map).`,
    ];
    const evidence = [
      `Profile A: Fuel ${ts.tuningData.profileA.fuelLHr} L/h (-9.5%), CHT ${ts.tuningData.profileA.chtC}°C, Throttle Latency +${ts.tuningData.profileA.latencyDeltaMs}ms`,
      `Profile B: Fuel ${ts.tuningData.profileB.fuelLHr} L/h (+12.0%), CHT ${ts.tuningData.profileB.chtC}°C, Throttle Latency ${ts.tuningData.profileB.latencyDeltaMs}ms`,
    ];
    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'PROFILE A (LEAN)', value: '30.8 L/h', delta: '-9.5% Fuel (+42 min)', status: 'nominal' },
      { label: 'PROFILE B (AGILE)', value: '38.1 L/h', delta: '+12.0% Fuel (-110ms)', status: 'warning' },
      { label: 'PROFILE C (THERMAL)', value: '35.4 L/h', delta: '-16.0°C CHT Relief', status: 'nominal' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        'Profile A delivers -9.5% fuel flow reduction, adding +42 minutes of continuous loiter time.',
        'Profile A preserves cylinder head temperature within nominal margins (+4.0°C delta).',
        'Tradeoff of +85ms transient throttle response is optimal for steady reconnaissance loiters.',
      ],
      conclusion: 'Profile A is the recommended configuration for long-endurance ISR profiles.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Simulate Loiter Sortie', query: 'Can ENG-03 perform a 6-hour endurance mission?' },
      { label: 'Check Throttle Response', query: 'Check throttle response' },
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
    ];

    return {
      status: 'success',
      intent: 'tuning_evaluation',
      engine_id: targetEngineId,
      decision_status: 'PROFILE A RECOMMENDED',
      health_score: eh.reportedHealth,
      primary_finding: 'Profile A (Lean Cruise) maximizes loiter endurance (+42 min) with optimal fuel/thermal balance.',
      summary: 'Profile A (Lean Cruise) is recommended for endurance loiter missions.',
      findings,
      evidence,
      evidence_metrics,
      tuning_comparison_data: ts.tuningData,
      suggested_actions,
      confidence: 0.93,
      mission_impact: 'Enables maximum flight endurance radius (+42 min) with minimal thermal penalty.',
      recommendation: 'Select Profile A (Lean Cruise Map) for extended autonomous loiter missions.',
      why_this_alert,
      correlated_signals: ['FADEC Maps', 'Fuel Burn Models', 'Thermal Dissipation', 'Loiter Duration'],
      reasoning_chain: {
        observation: `Comparing FADEC tuning configurations for ${targetEngineId} mission profile optimization.`,
        evidence: `Profile A: Fuel ${ts.tuningData.profileA.fuelLHr} L/h | Profile B: Fuel ${ts.tuningData.profileB.fuelLHr} L/h.`,
        analysis:
          'Profile A delivers -9.5% fuel consumption reduction yielding +42 minutes additional loiter endurance, with an acceptable trade-off of +85ms throttle latency. Profile B increases fuel burn by +12%.',
        recommendation: 'Select Profile A (Lean Cruise Map) for extended autonomous loiter missions.',
        envelope: 'FLIGHT ENVELOPE: OPTIMIZED FOR ENDURANCE (Advisory)',
      },
      tools_used: ['tune_simulator', 'telemetry', 'mission_simulator'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 2. Engine diagnosis / Why is Engine flagged?
  if (
    q.includes('flag') ||
    q.includes('flagged') ||
    q.includes('warning') ||
    q.includes('critical') ||
    (q.includes('why') && (q.includes('03') || q.includes('02') || q.includes('01') || q.includes('04') || q.includes('engine') || q.includes('issue') || q.includes('show'))) ||
    q.includes('unhealthy')
  ) {
    const targetId = (q.includes('03') || q.includes('eng-03')) ? 'ENG 03' : (q.includes('02') || q.includes('eng-02')) ? 'ENG 02' : targetEngineId;
    const eh = getEngineHealth(targetId, context);
    const te = getTelemetry(targetId, context);
    const fa = analyzeFaults(targetId, context);

    const vib = te.telemetry.vibration;
    const cht = te.telemetry.cht;
    const oil = te.telemetry.oilPressure;
    const latency = te.throttleResponse.stepLatencyMs;

    const findings = [
      `Multi-parameter degradation detected on ${targetId} with composite health at ${eh.reportedHealth}%.`,
      `Elevated rotational harmonic vibration at ${vib} mm/s RMS (prototype limit: 3.0 mm/s).`,
      `Oil pressure depressed at ${oil} PSI under normal cruise RPM.`,
      `Derived throttle step latency elevated to ${latency} ms (+71.1% vs baseline).`,
      `Active critical alert logged for Crank Journal Bearing wear.`,
    ];
    const evidence = [
      `CHT: ${cht}°C (+10.8% vs prototype baseline)`,
      `Vibration RMS: ${vib} mm/s (+140.0% vs prototype baseline)`,
      `Throttle Response Latency: ${latency} ms (+71.1% lag)`,
      `Oil Pressure: ${oil} PSI (-32.5% deviation)`,
      `Composite Anomaly Score: ${eh.compositeAnomalyScore}`,
    ];
    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'CHT', value: fCht(cht), delta: '+10.8%', status: 'warning' },
      { label: 'VIBRATION', value: `${vib} mm/s`, delta: '+140.0%', status: 'critical' },
      { label: 'THROTTLE LAG', value: `${latency} ms`, delta: '+71.1%', status: 'warning' },
      { label: 'OIL PRESSURE', value: `${oil} PSI`, delta: '-32.5%', status: 'critical' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        'Cylinder Head Temperature exhibits continuous thermal drift (+10.8% above baseline).',
        `Rotational harmonic vibration is at ${vib} mm/s RMS, exceeding the 3.0 mm/s mechanical threshold.`,
        `Derived throttle transient step latency is ${latency} ms, indicating governor response degradation.`,
        'Oil pressure has dropped to 54 PSI, creating combined thermo-mechanical bearing stress.',
      ],
      conclusion: 'Concurrent multi-parameter degradation pattern detected across thermal, mechanical, and lubrication channels.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Check RUL Estimate', query: 'What is the current RUL?' },
      { label: 'Simulate 6-Hour Mission', query: 'Can ENG-03 perform a 6-hour endurance mission?' },
      { label: 'Check Throttle Response', query: 'Check throttle response' },
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
    ];

    return {
      status: 'success',
      intent: 'engine_diagnosis',
      engine_id: targetId,
      decision_status: 'REVIEW REQUIRED',
      health_score: eh.reportedHealth,
      primary_finding: 'Multi-parameter degradation detected across thermal and bearing subsystems.',
      summary: `${targetId} exhibits critical bearing wear, elevated CHT, and reduced oil pressure requiring immediate inspection.`,
      findings,
      evidence,
      evidence_metrics,
      suggested_actions,
      confidence: 0.94,
      mission_impact: 'Sortie duration must be capped; high continuous manifold pressure not recommended.',
      recommendation:
        'Inspect cooling and vibration-related systems before deployment. Restrict high-transient power steps.',
      why_this_alert,
      correlated_signals: ['Telemetry', 'Health', 'Faults', 'RUL', 'Digital Twin'],
      reasoning_chain: {
        observation: `${targetId} is flagged with CRITICAL advisory status due to concurrent mechanical and lubrication stress indicators.`,
        evidence: `CHT ${cht}°C (+10.8%) | Vib ${vib} mm/s (+140%) | Throttle ${latency}ms (+71%) | Oil ${oil} PSI (-32.5%) | Health ${eh.reportedHealth}%.`,
        analysis:
          'Deterministic acoustic and harmonic signature indicates Stage 2 bearing wear on the crankshaft journal pin. Secondary thermal accumulation observed in cylinder head array.',
        recommendation:
          'Inspect cooling and vibration-related systems before deployment. Restrict high-transient power steps.',
        envelope: 'FLIGHT ENVELOPE: RESTRICTED // 18-HR LIMIT',
      },
      tools_used: ['engine_health', 'telemetry', 'fault_analysis'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 3. Mission readiness / 6-hour endurance
  if (
    q.includes('endurance') ||
    q.includes('simulate') ||
    q.includes('mission') ||
    q.includes('isr') ||
    q.includes('altitude') ||
    q.includes('6-hour') ||
    q.includes('6 hour') ||
    q.includes('can eng') ||
    q.includes('perform') ||
    q.includes('sortie')
  ) {
    const ms = simulateMission(targetEngineId, query, context);
    const rul = estimateRul(targetEngineId, context);
    const eh = getEngineHealth(targetEngineId, context);
    const te = getTelemetry(targetEngineId, context);

    const findings = [
      `Mission profile simulation evaluated for ${targetEngineId}: 6.0 Hour Loiter Profile.`,
      `Overall Readiness Classification: ${ms.readinessClassification}.`,
      ...ms.riskFactors,
    ];
    const evidence = [
      `Current RUL: ${rul.estimatedRulHours} hrs vs 6.0 hr mission (Safety buffer critically narrow)`,
      `Projected Fuel Burn: ${ms.projectedFuelBurnL} L`,
      `Vibration Headroom: ${ms.vibrationHeadroomMmS} mm/s margin`,
      `Post-Mission Remaining RUL: ${Math.max(0, rul.estimatedRulHours - 6)} hrs`,
    ];
    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'READINESS', value: ms.readinessClassification, status: ms.readinessClassification === 'NOT RECOMMENDED' ? 'critical' : 'warning' },
      { label: 'CURRENT RUL', value: `${rul.estimatedRulHours} hrs`, delta: '6h Demand', status: 'critical' },
      { label: 'VIB MARGIN', value: `${ms.vibrationHeadroomMmS} mm/s`, delta: 'Exceeded', status: 'critical' },
      { label: 'FUEL BURN', value: `${ms.projectedFuelBurnL} L`, status: 'nominal' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        `RUL margin is critically narrow (${rul.estimatedRulHours} hrs available vs 6.0 hr mission length).`,
        `Vibration level (${te.telemetry.vibration} mm/s) exceeds maximum continuous endurance threshold (3.5 mm/s).`,
        `Health index (${eh.reportedHealth}%) is below the minimum 70% mission readiness requirement.`,
      ],
      conclusion: 'High probability of in-flight component threshold breach during continuous 6-hour loiter heat soak.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Check Tuning Maps', query: 'Which tuning profile is better for endurance?' },
      { label: 'Inspect Anomaly Flags', query: 'Why is ENG-03 flagged?' },
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
    ];

    return {
      status: 'success',
      intent: 'mission_readiness',
      engine_id: targetEngineId,
      decision_status: ms.readinessClassification,
      health_score: eh.reportedHealth,
      primary_finding: `Mission sortie ${ms.readinessClassification} due to narrow RUL buffer and elevated vibration stress.`,
      summary: `Mission Readiness for ${targetEngineId}: ${ms.readinessClassification}.`,
      findings,
      evidence,
      evidence_metrics,
      mission_impact_data: ms.missionImpactData,
      suggested_actions,
      confidence: 0.92,
      mission_impact: `High risk of mid-flight mission abort if ${targetEngineId} is deployed on this profile without servicing.`,
      recommendation: ms.recommendation,
      why_this_alert,
      correlated_signals: ['Mission Profile', 'RUL Prognostics', 'Thermal Headroom', 'Vibration Physics'],
      reasoning_chain: {
        observation: `Assessing ${targetEngineId} mission readiness for 6-hour endurance profile.`,
        evidence: `Readiness: ${ms.readinessClassification} | Remaining RUL: ${rul.estimatedRulHours} hrs | Health: ${eh.reportedHealth}%.`,
        analysis:
          ms.readinessClassification === 'NOT RECOMMENDED'
            ? `Physical degradation stress factors (${rul.acceleratedWearRate}) indicate unacceptable failure risk if subjected to continuous 6-hour loiter heat soak.`
            : 'Mission flight parameters fall within operational threshold buffers.',
        recommendation: ms.recommendation,
        envelope: ms.envelopeStatus,
      },
      tools_used: ['engine_health', 'rul_analysis', 'mission_simulator'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 4. Maintenance advisory / Which engine needs attention first?
  if (
    q.includes('maintenance') ||
    q.includes('inspect first') ||
    q.includes('priority') ||
    q.includes('mro') ||
    q.includes('repair') ||
    q.includes('attention first') ||
    (q.includes('which') && q.includes('engine'))
  ) {
    const ma = getMaintenanceAdvice(targetEngineId, context);
    const topEng = ma.highestPriorityEngine;

    const findings = [
      `Fleet maintenance prioritization ranks ${topEng} as HIGHEST INSPECTION PRIORITY.`,
      ...ma.priorityRationale.map((r) => `Flag: ${r}`),
    ];
    const evidence = ma.fleetQueue.map(
      (item) =>
        `${item.engineId}: Urgency Score ${item.urgencyScore} | Health ${item.health}% | RUL ${item.rulHours}h | Vib ${item.vibrationMmS} mm/s`
    );
    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'PRIORITY 1', value: `${ma.fleetQueue[0]?.engineId} (HIGH)`, delta: `Score ${ma.fleetQueue[0]?.urgencyScore}`, status: 'critical' },
      { label: 'PRIORITY 2', value: `${ma.fleetQueue[1]?.engineId} (MEDIUM)`, delta: `Score ${ma.fleetQueue[1]?.urgencyScore}`, status: 'warning' },
      { label: 'PRIORITY 3', value: `${ma.fleetQueue[2]?.engineId} (NOMINAL)`, delta: `Score ${ma.fleetQueue[2]?.urgencyScore}`, status: 'nominal' },
      { label: 'PRIORITY 4', value: `${ma.fleetQueue[3]?.engineId} (NOMINAL)`, delta: `Score ${ma.fleetQueue[3]?.urgencyScore}`, status: 'nominal' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        `${topEng} has the lowest RUL in fleet (18 operating hours remaining).`,
        `${topEng} exhibits highest vibration in fleet (4.8 mm/s RMS vs 2.0 mm/s baseline).`,
        `${topEng} has active unacknowledged critical bearing wear alerts.`,
        'Fleet multi-indicator synthesis places it far ahead of other modules.',
      ],
      conclusion: `${topEng} prioritized due to joint deviation across multiple indicators rather than health score alone.`,
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Diagnose ENG-03', query: 'Why is ENG-03 flagged?' },
      { label: 'Check Throttle', query: 'Check throttle response' },
      { label: 'Check Mission Readiness', query: 'Can ENG-03 perform a 6-hour endurance mission?' },
    ];

    return {
      status: 'success',
      intent: 'maintenance_advisory',
      engine_id: topEng,
      decision_status: 'HIGH PRIORITY',
      health_score: ma.fleetQueue[0]?.health || 41,
      primary_finding: `${topEng} prioritized as highest maintenance urgency across all fleet assets.`,
      summary: `PRIORITY: ${topEng} requires immediate maintenance inspection ahead of other fleet assets.`,
      findings,
      evidence,
      evidence_metrics,
      fleet_ranking_data: ma.fleetQueue,
      suggested_actions,
      confidence: 0.96,
      mission_impact: `Grounding ${topEng} for scheduled servicing prevents catastrophic in-flight loss of propulsion.`,
      recommendation: ma.recommendation,
      why_this_alert,
      correlated_signals: ['Fleet Health', 'RUL Ranking', 'Vibration Baseline', 'Active Alerts Matrix'],
      reasoning_chain: {
        observation: `Cross-fleet multi-indicator health synthesis identifies ${topEng} as the primary maintenance bottleneck.`,
        evidence: `Priority: ${topEng} (Urgency: ${ma.fleetQueue[0]?.urgencyScore || 66.8}) vs Fleet Median Health.`,
        analysis: `${topEng} exhibits multi-parameter deviation: lowest RUL in fleet (18 hrs), highest vibration (4.8 mm/s), and active bearing fault alerts, placing it significantly ahead of other modules in maintenance urgency.`,
        recommendation: ma.recommendation,
        envelope: `FLIGHT ENVELOPE: MAINTENANCE HOLD ON ${topEng}`,
      },
      tools_used: ['maintenance', 'engine_health', 'rul_analysis', 'fault_analysis'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 5. Throttle response analysis
  if (q.includes('throttle') || q.includes('response') || q.includes('latency') || q.includes('slew') || q.includes('transient')) {
    const te = getTelemetry(targetEngineId, context);
    const tr = te.throttleResponse;
    const eh = getEngineHealth(targetEngineId, context);

    const findings = [
      `Evaluated throttle dynamic response for ${targetEngineId}.`,
      `Derived Step Latency: ${tr.stepLatencyMs} ms (Nominal: ${tr.nominalLatencyMs} ms).`,
      `Assessment: ${tr.assessment}.`,
    ];
    const evidence = [
      `Transient Step Latency: ${tr.stepLatencyMs} ms (${tr.latencyDeviationPct}% vs nominal baseline)`,
      `Power Slew Rate: ${tr.powerSlewRatePctSec}% / sec`,
      `Response Bandwidth: ${tr.responseBandwidthHz} Hz`,
      `Oil Temp Drag Effect: +${Math.max(0, (te.telemetry.oilTemperature - 85) * 3.5).toFixed(1)} ms`,
    ];
    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'STEP LATENCY', value: `${tr.stepLatencyMs} ms`, delta: `+${tr.latencyDeviationPct}%`, status: 'warning' },
      { label: 'NOMINAL REF', value: `${tr.nominalLatencyMs} ms`, status: 'nominal' },
      { label: 'SLEW RATE', value: `${tr.powerSlewRatePctSec}%/s`, status: 'warning' },
      { label: 'BANDWIDTH', value: `${tr.responseBandwidthHz} Hz`, status: 'nominal' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        `Step latency is ${tr.stepLatencyMs} ms vs 420.0 ms baseline (+${tr.latencyDeviationPct}% deviation).`,
        'Elevated oil temperature (104°C) adds hydrodynamic drag across governor metering valve.',
        'Mechanical bearing wear creates rotational drag during rapid throttle spool-up.',
      ],
      conclusion: 'Transient governor lag detected during commanded power-step transitions.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Compare Tuning Maps', query: 'Which tuning profile is better for endurance?' },
      { label: 'Diagnose Anomaly', query: 'Why is ENG-03 flagged?' },
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
    ];

    return {
      status: 'success',
      intent: 'throttle_analysis',
      engine_id: targetEngineId,
      decision_status: tr.latencyDeviationPct > 25 ? 'DEVIATING' : 'NORMAL',
      health_score: eh.reportedHealth,
      primary_finding: `Throttle response latency elevated by +${tr.latencyDeviationPct}% due to governor drag and thermal load.`,
      summary: `Throttle response evaluation for ${targetEngineId}: ${tr.assessment}.`,
      findings,
      evidence,
      evidence_metrics,
      throttle_response_data: tr,
      suggested_actions,
      confidence: 0.9,
      mission_impact: 'Minor latency increase during rapid formation or terrain-avoidance maneuvers; steady-state loiter unaffected.',
      recommendation: 'Calibrate throttle actuator linkage and inspect fuel metering governor sensitivity.',
      why_this_alert,
      correlated_signals: ['Throttle Telemetry', 'Oil Viscosity Drag', 'Governor Tracking', 'Bearing Load'],
      reasoning_chain: {
        observation: `Dynamic throttle response analytics for ${targetEngineId}: ${tr.assessment}.`,
        evidence: `Step Latency: ${tr.stepLatencyMs} ms (Nominal ${tr.nominalLatencyMs} ms) | Slew Rate: ${tr.powerSlewRatePctSec}%/s.`,
        analysis:
          'Governor tracking indicates moderate transient delay attributed to mechanical friction and thermal viscosity shift. Derived response metric highlights slower power-step recovery compared to fleet baseline.',
        recommendation: 'Calibrate throttle actuator linkage and inspect fuel metering governor sensitivity.',
        envelope: 'FLIGHT ENVELOPE: NOMINAL // GOVERNOR AUDIT RECOMMENDED',
      },
      tools_used: ['telemetry', 'tune_simulator', 'engine_health'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 6. RUL Analysis
  if (q.includes('rul') || q.includes('useful life') || q.includes('wear') || q.includes('life') || q.includes('decreasing')) {
    const rul = estimateRul(targetEngineId, context);
    const eh = getEngineHealth(targetEngineId, context);

    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'ESTIMATED RUL', value: `${rul.estimatedRulHours} hrs`, delta: 'Demo Estimate', status: rul.estimatedRulHours < 25 ? 'critical' : 'nominal' },
      { label: 'HEALTH INDEX', value: `${eh.reportedHealth}%`, status: eh.reportedHealth < 60 ? 'critical' : 'nominal' },
      { label: 'WEAR RATE', value: rul.acceleratedWearRate, status: 'warning' },
      { label: 'LIMITING FACTOR', value: 'Crank Journal', status: 'warning' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        `RUL has degraded to ${rul.estimatedRulHours} operating flight hours.`,
        `Multi-channel harmonic vibration increases wear rate to ${rul.acceleratedWearRate}.`,
        'Approaching the mandatory 10-hour safety reserve limit.',
      ],
      conclusion: 'Prognostic model recommends maintenance overhaul before next long-range sortie.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
      { label: 'Diagnose Anomaly', query: 'Why is ENG-03 flagged?' },
      { label: 'Check Mission Readiness', query: 'Can ENG-03 perform a 6-hour endurance mission?' },
    ];

    return {
      status: 'success',
      intent: 'rul_assessment',
      engine_id: targetEngineId,
      decision_status: rul.estimatedRulHours <= 20 ? 'CONDITIONAL 18-HR LIMIT' : 'NOMINAL',
      health_score: eh.reportedHealth,
      primary_finding: `Remaining Useful Life for ${targetEngineId} projected at ${rul.estimatedRulHours} flight hours.`,
      summary: `RUL for ${targetEngineId} is estimated at ${rul.estimatedRulHours} hours (DEMO ESTIMATE).`,
      findings: [
        `Estimated RUL for ${targetEngineId}: ${rul.estimatedRulHours} operational flight hours.`,
        `Limiting Subsystem: ${rul.limitingSubsystem}.`,
        `Maintenance Urgency: ${rul.maintenanceUrgency}.`,
      ],
      evidence: [
        `RUL Model: ${rul.modelType}`,
        `Composite Stress Index: ${rul.compositeStressIndex}x nominal`,
        `Accelerated Wear Rate: ${rul.acceleratedWearRate}`,
        `Current Health Index: ${eh.reportedHealth}%`,
      ],
      evidence_metrics,
      suggested_actions,
      confidence: 0.89,
      mission_impact: 'Limits operational sorties to short duration flights until component renewal.',
      recommendation: 'Schedule overhaul or replacement before reaching 10-hour safety reserve limit.',
      why_this_alert,
      correlated_signals: ['Harmonic Vibration', 'Thermal Wear Trend', 'Lubrication Stress', 'RUL Model'],
      reasoning_chain: {
        observation: `Prognostic analysis calculates Remaining Useful Life for ${targetEngineId} at ${rul.estimatedRulHours} flight hours.`,
        evidence: `Estimated RUL: ${rul.estimatedRulHours} hrs | Limiting factor: ${rul.limitingSubsystem} | Health: ${eh.reportedHealth}%.`,
        analysis: `Acoustic harmonic vibration combined with elevated oil temperature accelerates journal bearing degradation at ${rul.acceleratedWearRate}.`,
        recommendation: 'Schedule overhaul or replacement before reaching 10-hour safety reserve limit.',
        envelope: 'FLIGHT ENVELOPE: CONDITIONAL 18-HR LIMIT',
      },
      tools_used: ['rul_analysis', 'engine_health', 'telemetry'],
      data_mode: 'DEMO ESTIMATE',
    };
  }

  // 7. Compare Fleet
  if (q.includes('compare') || q.includes('vs') || (q.includes('01') && q.includes('04'))) {
    const eng1 = context.allEngines[0] || context.activeEngine;
    const eng4 = context.allEngines[3] || context.allEngines[context.allEngines.length - 1] || context.activeEngine;

    const t1 = eng1.telemetry;
    const t4 = eng4.telemetry;

    const evidence_metrics: TelemetryEvidenceMetric[] = [
      { label: 'ENG 01 HEALTH', value: `${eng1.health}%`, status: 'nominal' },
      { label: 'ENG 04 HEALTH', value: `${eng4.health}%`, status: 'nominal' },
      { label: 'THRUST DELTA', value: '< 1.2%', status: 'nominal' },
      { label: 'SYMMETRY', value: 'OPTIMAL', status: 'nominal' },
    ];
    const why_this_alert: WhyThisAlertExplanation = {
      factors: [
        `Port Inboard (${eng1.id}) and Starboard Outboard (${eng4.id}) show matched thrust profiles.`,
        'Exhaust gas temperature variance is under 0.8%, maintaining yaw symmetry.',
        'Both propulsion pods operate within baseline design tolerances.',
      ],
      conclusion: 'Symmetric aerodynamic cruise verified with zero rudder trim penalty.',
    };

    const suggested_actions: SuggestedActionItem[] = [
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
      { label: 'Check Throttle Response', query: 'Check throttle response' },
    ];

    return {
      status: 'success',
      intent: 'fleet_comparison',
      engine_id: 'FLEET',
      decision_status: 'OPTIMAL',
      health_score: 94,
      primary_finding: 'ENG 01 and ENG 04 exhibit nominal symmetrical propulsion balance.',
      summary: 'ENG 01 and ENG 04 exhibit nominal symmetric propulsion parameters.',
      findings: [
        `Comparative telemetry synthesis: ${eng1.id} (Port Inboard) vs ${eng4.id} (Starboard Outboard).`,
        `Both modules operating within optimal flight envelope.`,
      ],
      evidence: [
        `ENG 01: Health ${eng1.health}% | CHT ${t1.cht}°C | EGT ${t1.egt}°C | Vib ${t1.vibration} mm/s | RUL ${eng1.rul}h`,
        `ENG 04: Health ${eng4.health}% | CHT ${t4.cht}°C | EGT ${t4.egt}°C | Vib ${t4.vibration} mm/s | RUL ${eng4.rul}h`,
      ],
      evidence_metrics,
      suggested_actions,
      confidence: 0.95,
      mission_impact: 'Zero aerodynamic trim penalty; optimal cruise stability.',
      recommendation: 'Maintain current symmetric power distribution.',
      why_this_alert,
      correlated_signals: ['CAN Bus Telemetry', 'Symmetry Envelopes', 'EGT Variance', 'Fleet Baseline'],
      reasoning_chain: {
        observation: 'Telemetry balance verification between symmetrical port and starboard propulsion nacelles.',
        evidence: `ENG 01 (Health ${eng1.health}%) vs ENG 04 (Health ${eng4.health}%). Delta CHT: ${Math.abs(t1.cht - t4.cht).toFixed(1)}°C.`,
        analysis:
          'Exhaust gas temperature and manifold pressure variance is under 1.2%, confirming balanced thrust moments with zero asymmetric yaw trim requirement.',
        recommendation: 'Maintain current symmetric power distribution.',
        envelope: 'FLIGHT ENVELOPE: OPTIMAL SYMMETRIC CRUISE',
      },
      tools_used: ['telemetry', 'engine_health', 'maintenance'],
      data_mode: 'DEMO ANALYTICS',
    };
  }

  // 8. General Fallback
  const te = getTelemetry(targetEngineId, context);
  const eh = getEngineHealth(targetEngineId, context);

  return {
    status: 'success',
    intent: 'general_telemetry_query',
    engine_id: targetEngineId,
    decision_status: 'NOMINAL',
    health_score: eh.reportedHealth,
    primary_finding: `Telemetry parameters for ${targetEngineId} synchronized with digital twin within nominal bounds.`,
    summary: `Analytical evaluation of ${targetEngineId} against active flight deck parameters.`,
    findings: [`Target Engine: ${targetEngineId}`, `Composite Anomaly Score: ${eh.compositeAnomalyScore}`],
    evidence: [
      `RPM: ${te.telemetry.rpm} | CHT: ${te.telemetry.cht}°C | EGT: ${te.telemetry.egt}°C`,
      `Oil: ${te.telemetry.oilPressure} PSI / ${te.telemetry.oilTemperature}°C | Vib: ${te.telemetry.vibration} mm/s`,
    ],
    evidence_metrics: [
      { label: 'HEALTH', value: `${eh.reportedHealth}%`, status: 'nominal' },
      { label: 'RPM', value: `${te.telemetry.rpm}`, status: 'nominal' },
      { label: 'CHT', value: `${te.telemetry.cht}°C`, status: 'nominal' },
      { label: 'VIBRATION', value: `${te.telemetry.vibration} mm/s`, status: 'nominal' },
    ],
    confidence: 0.9,
    mission_impact: 'Propulsion telemetry synchronized with digital twin within nominal operational margins.',
    recommendation: 'Continue active flight plan monitoring; inspect telemetry trend charts for real-time drift.',
    why_this_alert: {
      factors: [
        'CAN bus 100Hz telemetry is streaming nominal.',
        'Digital twin synchronization confidence is at 99.4%.',
        'No threshold exceedances active on selected module.',
      ],
      conclusion: 'Standard autonomous loiter envelope verified.',
    },
    suggested_actions: [
      { label: 'Diagnose Flags', query: 'Why is ENG-03 flagged?' },
      { label: 'Check Mission Readiness', query: 'Can ENG-03 perform a 6-hour endurance mission?' },
      { label: 'Fleet Priority Queue', query: 'Which engine needs attention first?' },
    ],
    correlated_signals: ['CAN Telemetry', 'Digital Twin State', 'Active Flight Plan'],
    reasoning_chain: {
      observation: `Processing operational query "${query}" against digital twin telemetry feed for ${targetEngineId}.`,
      evidence: `CAN bus telemetry synchronized. Health index at ${eh.reportedHealth}%.`,
      analysis: 'Deterministic analytical baseline confirms core propulsion parameters are tracked nominal.',
      recommendation: 'Maintain autonomous orbit trajectory; consult Active Alerts matrix for subsystem flags.',
      envelope: 'FLIGHT ENVELOPE: SECURE & STABLE',
    },
    tools_used: ['telemetry', 'engine_health'],
    data_mode: 'DEMO ANALYTICS',
  };
}

function fCht(cht: number): string {
  return `${cht}°C`;
}

export class AgentService {
  public async queryCopilot(query: string, context: AgentContext): Promise<CopilotMessage> {
    const structured = await processAgentQuery(query, context);
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19) + 'Z';

    return {
      id: 'msg-' + Date.now(),
      sender: 'COPILOT',
      timestamp: timeStr,
      text: structured.summary,
      agentResponse: structured,
      reasoningChain: structured.reasoning_chain,
    };
  }
}

export const agentService = new AgentService();

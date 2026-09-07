/**
 * DHRUVAA AI Diagnostic Copilot Service
 * Aerospace engineering advisory engine operating on real-time twin telemetry.
 * Advisory only — cannot alter physical actuator states.
 */

import { EngineInstance, CopilotMessage } from '../types/maintenanceEngine';

export const DEFAULT_COPILOT_SUGGESTIONS = [
  'Why is engine health decreasing?',
  'What is the current RUL?',
  'Why is CHT increasing?',
  'Are there any active faults?'
];

export function generateAdvisorResponse(query: string, engine: EngineInstance): CopilotMessage {
  const q = query.toLowerCase();
  const tel = engine.telemetry;
  const twin = engine.twinState;
  const time = new Date().toTimeString().substring(0, 8) + ' UTC';

  if (q.includes('why is engine health decreasing') || q.includes('health decreasing') || q.includes('health down')) {
    if (engine.id === 'eng-03') {
      return {
        id: `resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: time,
        content: `Synthetic twin telemetry confirms Engine 03 health degradation is driven by severe micro-spalling on Crankshaft Main Bearing #2. Harmonic vibration has accelerated to ${tel.vibration} mm/s (+19 dB @ 2.45 kHz), degrading overall health to ${engine.overallHealthPercent}%. Mechanical friction is lowering main gallery oil pressure (${tel.oilPressure} PSI). Grounding is required immediately.`,
        corroboratingMetrics: [
          { metric: 'Harmonic Vibration', value: `${tel.vibration} mm/s`, delta: '+19 dB @ 2.45kHz', status: 'critical' },
          { metric: 'Oil Pressure', value: `${tel.oilPressure} PSI`, delta: '-22 PSI below baseline', status: 'critical' },
          { metric: 'RUL Floor Status', value: `${engine.rulHours}h`, delta: '< 30h floor threshold', status: 'critical' }
        ],
        suggestedDirective: 'Execute emergency grounding notice AD-2025-08-E3 and pull engine for Depot re-fit.'
      };
    } else if (engine.id === 'eng-02') {
      return {
        id: `resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: time,
        content: `Engine 02 health is declining (currently ${engine.overallHealthPercent}%) due to progressive thermal dissipation decay in Cylinder #2. Cowling baffle seals have developed aeromechanical bypass, causing CHT to rise to ${tel.cht}°C (+14% above baseline). Cooling efficiency has decayed by 8% over the last 15 flight hours.`,
        corroboratingMetrics: [
          { metric: 'CHT vs Baseline', value: `${tel.cht}°C`, delta: '+14% drift', status: 'warning' },
          { metric: 'Cooling Efficiency', value: '-8% Decay', delta: 'Last 15 Sorties', status: 'warning' },
          { metric: 'Thermal/Fuel Match', value: 'MISMATCH 0.72', delta: 'Nominal is 1.00', status: 'warning' }
        ],
        suggestedDirective: 'Borescope inspect cowling baffles and clean cooling fin air ducts within 4.5 flight hours.'
      };
    } else {
      return {
        id: `resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: time,
        content: `Engine 01 is currently maintaining nominal airworthiness at ${engine.overallHealthPercent}% health. Slight normal wear is accounted for by 288 total flight hours, but all combustion, lubrication, and electrical subsystems are well within OEM tolerances.`,
        corroboratingMetrics: [
          { metric: 'Engine Health', value: `${engine.overallHealthPercent}%`, delta: 'Nominal', status: 'nominal' },
          { metric: 'RUL Remaining', value: `${engine.rulHours} hrs`, delta: 'Full clearance', status: 'nominal' }
        ],
        suggestedDirective: 'Continue mission profile. Next scheduled 100-hour servicing in 184 flight hours.'
      };
    }
  }

  if (q.includes('rul') || q.includes('remaining useful life')) {
    const statusType = engine.rulHours < 30 ? 'critical' : engine.rulHours < 75 ? 'warning' : 'nominal';
    return {
      id: `resp-${Date.now()}`,
      sender: 'assistant',
      timestamp: time,
      content: `The current estimated Remaining Useful Life (RUL) for ${engine.displayId} (${engine.airframeCallsign}) is ${engine.rulHours} flight hours (Model Fidelity: ${twin.modelFidelityPercent}%, Confidence: ${twin.confidenceLevel}, Error Band: ±${twin.rulErrorBandHours}h). ${
        engine.rulHours < 30
          ? 'CRITICAL ALERT: This is below the minimum safe airworthiness floor of 30 hours. Mandatory grounding in effect.'
          : engine.rulHours < 75
          ? 'ADVISORY: Inspection window approaches at T+4.5h. Maintenance action recommended prior to expiration.'
          : 'Airframe holds full operational clearance for all scheduled sorties.'
      }`,
      corroboratingMetrics: [
        { metric: 'Estimated RUL', value: `${engine.rulHours} hrs`, delta: `Target floor: 30h`, status: statusType },
        { metric: 'Twin Fidelity', value: `${twin.modelFidelityPercent}%`, delta: twin.confidenceLevel, status: 'nominal' },
        { metric: 'Error Margin', value: `±${twin.rulErrorBandHours}h`, delta: 'Calibrated', status: 'nominal' }
      ]
    };
  }

  if (q.includes('cht') || q.includes('temperature') || q.includes('cooling')) {
    const isHigh = tel.cht > 185;
    return {
      id: `resp-${Date.now()}`,
      sender: 'assistant',
      timestamp: time,
      content: `Current Cylinder Head Temperature on ${engine.displayId} is ${tel.cht}°C (EGT: ${tel.egt}°C). ${
        isHigh
          ? `Synthetic inference confirms cooling degradation on Cylinder #2 (+14% relative to baseline at 75% throttle). While fuel flow density is nominal at ${tel.fuelFlow} GPH, convective heat dissipation has fallen beneath laminar flow thresholds.`
          : `Thermal readings are within optimal operational envelopes (140°C–175°C). Cooling air mass flow is adequate across all 4 cylinders.`
      }`,
      corroboratingMetrics: [
        { metric: 'Cylinder Head Temp (CHT)', value: `${tel.cht}°C`, delta: isHigh ? '+14% Excursion' : 'Nominal', status: isHigh ? 'warning' : 'nominal' },
        { metric: 'Exhaust Gas Temp (EGT)', value: `${tel.egt}°C`, delta: 'Balanced', status: 'nominal' },
        { metric: 'Fuel Flow Rate', value: `${tel.fuelFlow} GPH`, delta: 'Nominal mixture', status: 'nominal' }
      ],
      suggestedDirective: isHigh ? 'Inspect cowling duct inlet and inspect cylinder #2 baffle seals before next sortie.' : undefined
    };
  }

  if (q.includes('fault') || q.includes('alert') || q.includes('warning') || q.includes('anomaly')) {
    const alerts = engine.activeAlerts;
    if (alerts.length === 0) {
      return {
        id: `resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: time,
        content: `No active anomalous faults detected on ${engine.displayId}. All subsystem health vectors are reporting nominal status.`,
        corroboratingMetrics: [
          { metric: 'Active Alerts', value: '0 Found', status: 'nominal' }
        ]
      };
    }

    const descriptions = alerts.map((a) => `[${a.severity}] ${a.component}: ${a.description}`).join(' | ');
    return {
      id: `resp-${Date.now()}`,
      sender: 'assistant',
      timestamp: time,
      content: `Identified ${alerts.length} active event(s) for ${engine.displayId}: ${descriptions}. Advisory protocol recommends reviewing corresponding work orders.`,
      corroboratingMetrics: alerts.map((a) => ({
        metric: a.component,
        value: a.evidenceMetric || a.severity,
        status: a.severity === 'CRITICAL' ? 'critical' : a.severity === 'WARNING' ? 'warning' : 'nominal'
      }))
    };
  }

  // Default contextual answer for general inquiries
  return {
    id: `resp-${Date.now()}`,
    sender: 'assistant',
    timestamp: time,
    content: `Engineering Advisory Analysis for ${engine.displayId} (${engine.airframeCallsign}): Engine operating state is currently ${engine.status} with ${engine.overallHealthPercent}% health index and ${engine.rulHours} hours RUL. Real-time parameters: RPM ${tel.rpm}, CHT ${tel.cht}°C, Oil Pressure ${tel.oilPressure} PSI, Vibration ${tel.vibration} mm/s. Twin model confidence is ${engine.twinState.confidenceLevel}. Advisory system is ready for subsystem diagnostics or maintenance window scheduling.`,
    corroboratingMetrics: [
      { metric: 'Engine Status', value: engine.status, status: engine.status === 'CRITICAL' ? 'critical' : engine.status === 'WARNING' ? 'warning' : 'nominal' },
      { metric: 'Health Index', value: `${engine.overallHealthPercent}%`, status: engine.overallHealthPercent < 50 ? 'critical' : 'nominal' },
      { metric: 'RUL Remaining', value: `${engine.rulHours}h`, status: engine.rulHours < 30 ? 'critical' : 'nominal' }
    ]
  };
}

/**
 * DHRUVAA — AI Copilot Engineering Advisory Service
 * Diagnostic reasoning engine operating on real-time propulsion telemetry and digital twin models.
 */

import { AICopilotMessage, FaultInjections, Telemetry, TwinState, Mission } from '../types/simulationTypes';

export const COPILOT_PROMPTS = [
  'Why is engine health decreasing?',
  'What is the current RUL?',
  'Why is CHT increasing?',
  'Are there any active faults?'
];

export class CopilotService {
  public generateResponse(
    query: string,
    telemetry: Telemetry,
    twinState: TwinState,
    faults: FaultInjections,
    mission: Mission
  ): AICopilotMessage {
    const lower = query.toLowerCase().trim();
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Question: Why is engine health decreasing?
    if (lower.includes('health decreasing') || lower.includes('health score') || lower.includes('why is health')) {
      const activeAnomalies: string[] = [];
      if (faults.coolingJacketDegradation) activeAnomalies.push('Cooling jacket thermal impedance (+18%)');
      if (faults.fuelInjectorClog) activeAnomalies.push('Cylinder 3 fuel starvation & lean AFR spike');
      if (faults.lubricationPressureLeak) activeAnomalies.push(`Low oil pressure (${telemetry.oilPressure} PSI vs nominal 65 PSI)`);
      if (faults.crankshaftRotorImbalance) activeAnomalies.push(`Crankshaft harmonic vibration spike (${telemetry.vibrationRms} mm/s)`);
      if (telemetry.throttleDemandPercent > 85) activeAnomalies.push(`High throttle demand (${telemetry.throttleDemandPercent}%) at ${telemetry.altitude} FT`);

      let text = '';
      if (activeAnomalies.length > 0) {
        text = `Engine health is currently indexed at **${twinState.healthScore}% (${twinState.healthStatus})**. The degradation vector is driven by ${activeAnomalies.join(', ')}. Virtual thermodynamic cycles indicate accelerated thermal/mechanical wear, deducting ${Math.abs(twinState.estimatedRulPenalty)} hours from baseline RUL.`;
      } else {
        text = `Engine health is currently nominal at **${twinState.healthScore}% (${twinState.healthStatus})**. All 4 cylinders and fluidic systems are operating within the certified aerospace envelope. Minor variance is attributed to standard cruise duty cycle wear.`;
      }

      return {
        id,
        sender: 'assistant',
        timestamp,
        text,
        category: 'HEALTH',
        telemetrySnapshot: {
          rpm: telemetry.rpm,
          chtAvg: telemetry.chtAvg,
          oilPressure: telemetry.oilPressure,
          vibrationRms: telemetry.vibrationRms
        },
        recommendedActions: [
          faults.coolingJacketDegradation ? 'Increase airspeed to enhance ram-air cooling' : 'Maintain cruise throttle at 75%',
          faults.lubricationPressureLeak ? 'Prepare emergency divert profile to nearest landing strip' : 'Continue mission loiter surveillance'
        ]
      };
    }

    // Question: What is the current RUL?
    if (lower.includes('rul') || lower.includes('remaining useful life') || lower.includes('useful life') || lower.includes('endurance')) {
      const text = `The digital twin projects **Remaining Useful Life (RUL)** at **${twinState.rulHoursRemaining} operating hours**, with an active stress penalty of **${twinState.estimatedRulPenalty} HRS**. 
- Mission Fuel Endurance: **${twinState.missionEnduranceHours} hours** (Usable fuel: ${telemetry.fuelRemaining} L).
- Safe RTB Fuel Margin: **+${telemetry.safeRtbMarginHours} hours** above Point of No Return.
- Convergence Confidence: **${twinState.twinConvergencePercent}% synchronous** at ${twinState.inferenceLatencyMs} ms latency.`;

      return {
        id,
        sender: 'assistant',
        timestamp,
        text,
        category: 'RUL',
        telemetrySnapshot: {
          fuelRemaining: telemetry.fuelRemaining,
          safeRtbMarginHours: telemetry.safeRtbMarginHours,
          trueAirspeed: telemetry.trueAirspeed
        },
        recommendedActions: [
          'Log predictive RUL delta into Fleet Maintenance ledger',
          'Monitor fuel burn curve against Point-of-No-Return (PNR) threshold'
        ]
      };
    }

    // Question: Why is CHT increasing?
    if (lower.includes('cht') || lower.includes('cylinder head') || lower.includes('thermal') || lower.includes('temperature')) {
      let text = '';
      if (faults.coolingJacketDegradation) {
        text = `Cylinder Head Temperatures (CHT) are elevated at an average of **${telemetry.chtAvg}°C** (Cylinders: [1: ${telemetry.chtCylinders[0]}°, 2: ${telemetry.chtCylinders[1]}°, 3: ${telemetry.chtCylinders[2]}°, 4: ${telemetry.chtCylinders[3]}°C]). This is directly caused by **Cooling Jacket Thermal Degradation (+18% impedance)**, impeding heat dissipation into the ram air stream.`;
      } else if (faults.fuelInjectorClog) {
        text = `CHT in **Cylinder 3 (${telemetry.chtCylinders[2]}°C)** is significantly higher than adjacent cylinders due to **Fuel Injector #3 restriction**. The lean Air-Fuel Ratio (AFR) elevates flame-front combustion temperatures, driving localized thermal stress.`;
      } else if (faults.chtThermocoupleDrift) {
        text = `Analog CHT readings reflect an artificial +25°C calibration bias due to **Thermocouple Sensor Drift**. The digital twin virtual model estimates true mechanical CHT at **${telemetry.chtAvg - 25}°C**, which is within normal tolerance.`;
      } else {
        text = `Average CHT is currently **${telemetry.chtAvg}°C**, which is within the certified nominal range (165°C – 205°C). Temperature fluctuations correlate with throttle demand (${telemetry.throttleDemandPercent}%) and ambient air temperature (${telemetry.ambientTemperature}°C).`;
      }

      return {
        id,
        sender: 'assistant',
        timestamp,
        text,
        category: 'THERMAL',
        telemetrySnapshot: {
          chtAvg: telemetry.chtAvg,
          egtPeak: telemetry.egtPeak,
          oilTemperature: telemetry.oilTemperature
        },
        recommendedActions: [
          faults.fuelInjectorClog ? 'Enrich mixture or reduce power setting below 65%' : 'Monitor thermal gradient across cylinder pairs',
          'Verify cowl flap positioning and airspeed dissipation'
        ]
      };
    }

    // Question: Are there any active faults?
    if (lower.includes('fault') || lower.includes('alert') || lower.includes('anomal') || lower.includes('failure')) {
      const activeFaultList = [];
      if (faults.coolingJacketDegradation) activeFaultList.push('CRITICAL: Cooling Jacket Degradation (+18% Heat Buildup)');
      if (faults.fuelInjectorClog) activeFaultList.push('WARNING: Fuel Injector #3 Clog (-14% Rail Volume)');
      if (faults.lubricationPressureLeak) activeFaultList.push('CRITICAL: Lubrication Pressure Leak (-16.8 PSI Regulator Drop)');
      if (faults.crankshaftRotorImbalance) activeFaultList.push('WARNING: Crankshaft Rotor Imbalance (+3.8 mm/s Harmonics)');
      if (faults.chtThermocoupleDrift) activeFaultList.push('WATCH: CHT Thermocouple Sensor Drift (+25°C Bias)');

      let text = '';
      if (activeFaultList.length > 0) {
        text = `Identified **${activeFaultList.length} active anomalies** in propulsion telemetry:\n\n` + 
          activeFaultList.map((f, i) => `${i + 1}. **${f}**`).join('\n') +
          `\n\n**Advisory Note:** Propulsion supervisor interlocks are active. The digital twin recommends tactical review before initiating mission ingress.`;
      } else {
        text = `**Zero active faults detected.** All telemetry parameters (RPM, CHT, EGT, Oil Pressure, Fuel Flow, Vibration) are functioning within nominal parameters for flight sector **${mission.airspaceSector}**.`;
      }

      return {
        id,
        sender: 'assistant',
        timestamp,
        text,
        category: 'DIAGNOSTIC',
        telemetrySnapshot: {
          oilPressure: telemetry.oilPressure,
          vibrationRms: telemetry.vibrationRms,
          chtAvg: telemetry.chtAvg
        },
        recommendedActions: activeFaultList.length > 0
          ? ['Execute AI Auto-Recovery routine or acknowledge alerts', 'Notify mission ground controller']
          : ['Maintain planned reconnaissance profile']
      };
    }

    // Generic Engineering Assistant response
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `Engineering Assistant telemetry review for **${mission.uavCallsign}** [${telemetry.timeFormatted}]: Engine status is **${twinState.healthStatus} (${twinState.healthScore}%)** at ${telemetry.altitude} FT. Fuel burn is ${telemetry.fuelFlowRate} L/HR with ${twinState.missionEnduranceHours} hrs endurance. All parameter evaluations remain advisory only.`,
      category: 'ADVISORY',
      telemetrySnapshot: {
        rpm: telemetry.rpm,
        chtAvg: telemetry.chtAvg,
        oilPressure: telemetry.oilPressure,
        fuelFlowRate: telemetry.fuelFlowRate
      },
      recommendedActions: [
        'Reference flight operational handbook for Lycoming O-320 v4.2',
        'Check Tactical Map Airspace-04 parameters'
      ]
    };
  }
}

export const copilotService = new CopilotService();

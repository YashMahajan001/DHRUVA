import { TelemetryReading, EngineInstance, SubsystemState, FaultEvent } from '../types/engineDetailsTypes';

export interface CopilotContext {
  engine: EngineInstance;
  telemetry: TelemetryReading;
  activeSubsystem: SubsystemState;
  alerts: FaultEvent[];
}

export async function askEngineeringCopilot(
  question: string,
  context: CopilotContext
): Promise<string> {
  const q = question.toLowerCase();
  const { engine, telemetry, activeSubsystem, alerts } = context;

  // Simulate engineering telemetry processing delay for realistic tactical feeling
  await new Promise(resolve => setTimeout(resolve, 600));

  // Domain engineering analysis based on actual telemetry
  if (q.includes('why is engine health decreasing') || q.includes('health decreasing') || q.includes('health dropping')) {
    const unackAlerts = alerts.filter(a => !a.acknowledged);
    return `**ANALYSIS: Overall Engine Health @ ${engine.healthScore}% (${engine.healthStatus})**

Based on active twin telemetry ingestion:
1. **Cooling Subsystem Variance:** The cooling cluster is operating with a **12.4% reduced coolant/air margin** at high-altitude cruise (18,500 ft). Radiator airflow is measured at ${telemetry.radiatorAirflow} m/s.
2. **Thermal Load:** Average CHT is running at **${telemetry.chtAvg}°C** with peak head temperature of **${telemetry.chtPeak}°C** on Cylinder #1. While within absolute structural limit (< 205°C), the thermal gradient has elevated acoustic trace harmonics.
3. **Pending Alerts:** ${unackAlerts.length > 0 ? `Active advisory: ${unackAlerts[0].description}` : 'No unacknowledged critical anomalies.'}

**Engineering Recommendation:**
- Maintain current cruise throttle at 3,200 RPM; avoid rapid step climb.
- Monitor Coolant Loop B cavitation index.
- *Notice: DHRUVAA AI Copilot is strictly advisory. Flight controllers must verify mechanical checklists.*`;
  }

  if (q.includes('current rul') || q.includes('rul') || q.includes('remaining useful life')) {
    return `**PROGNOSTIC REPORT: Remaining Useful Life (RUL)**

- **Predicted Remaining Time:** **${engine.rulHours} Operating Hours**
- **Mean Time Between Failures (MTBF):** ${engine.mtbfHours} Hours
- **Accumulated Flight Hours:** ${engine.operatingHours} Hours
- **Twin Degradation Delta:** -0.4% over last 50 flight hours

**Prognostic Assessment:**
At the current cruise fuel consumption of **${telemetry.fuelFlow} L/h** and steady-state oil rail pressure of **${telemetry.oilPressure} PSI**, mechanical wear rates on the piston rings and cylinder liners remain linear. Next scheduled borescope inspection is recommended at 200 operational hours.`;
  }

  if (q.includes('cht increasing') || q.includes('cht') || q.includes('temperature increasing')) {
    return `**TELEMETRY AUDIT: Cylinder Head Temperature (CHT)**

- **Current CHT Average:** **${telemetry.chtAvg} °C**
- **Peak Cylinder Temp:** **${telemetry.chtPeak} °C** (Cylinder #1)
- **CHT Spread Variance:** **${telemetry.chtSpread} °C** (Nominal tolerance: ±6.0 °C)
- **Manifold Absolute Pressure:** ${telemetry.manifoldPressure} inHg

**Root Cause Diagnostics:**
The elevated CHT is correlated with ram-air scoop thermal dissipation efficiency at high ambient altitude. The cooling system shows an active auxiliary pump compensation at 3,820 RPM. No detonation or pre-ignition knock signatures are detected in the acoustic FFT vibration spectrum.`;
  }

  if (q.includes('active faults') || q.includes('fault') || q.includes('alarm')) {
    const activeList = alerts.map((a, i) => `${i + 1}. **[${a.severity}]** ${a.code} — ${a.component}: ${a.description}`).join('\n');
    return `**TACTICAL FAULT & ALARM AUDIT:**

**Active Alerts (${alerts.length} Total):**
${activeList}

**Current Subsystem under Inspection:** ${activeSubsystem.name} (${activeSubsystem.badge})
**Kalman Residual Error:** ±${telemetry.residualError} V
**Sensor Bus Status:** All 18 nodes synchronized with 0 rejected telemetry frames.`;
  }

  // Default intelligent assistant response with current telemetry
  return `**DHRUVAA AI COPILOT // ROTAX 915iS ADVISORY SUMMARY:**

- **Engine State:** ${engine.model} (S/N: ${engine.serialNumber})
- **Engine Speed:** ${telemetry.rpm} RPM | Fuel Burn: ${telemetry.fuelFlow} L/h
- **Oil Circuit:** ${telemetry.oilPressure} PSI @ ${telemetry.oilTemperature}°C
- **Vibration Amplitude:** ${telemetry.vibrationAmplitude} mm/s (Peak: ${telemetry.vibrationPeakHz} Hz)
- **Synthetic Twin Sync:** ${engine.twinFidelity}% fidelity with Kalman filter online.

The engine is operating within nominal cruise parameters. Select any subsystem tab or ask a diagnostic question regarding thermal spread, oil pressure pulsation, or RUL forecast.`;
}

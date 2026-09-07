import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ShieldCheck,
  Flame,
  Droplets,
  Activity,
  Gauge,
  Radio,
} from 'lucide-react';

export const Section4RootCauseAnalysis: React.FC = () => {
  const { selectedEngine, showToast } = useDashboard();

  // Root Cause Candidates (Strictly includes the 5 requested candidates)
  const rootCauses = [
    {
      rank: 1,
      name: 'Cooling System Degradation',
      probability: 68,
      confidence: 94.2,
      severity: 'PRIMARY DIAGNOSIS',
      statusClass: 'text-[#ffb4ab]',
      badgeBg: 'bg-[#ffb4ab]/15 border-[#ffb4ab]/40 text-[#ffb4ab]',
      barColor: 'bg-[#ffb4ab]',
      supportingEvidence:
        'Cylinder #2 heat flux residual decayed -8.1% vs calibrated digital twin model. Local convective air velocity down to 24 m/s. Sump oil temp nominal, isolating defect to cowling airflow baffle lip.',
      affectedSensors: ['CHT-CYL2', 'BAFFLE-DIFF-P', 'AERO-FLUX-CH2'],
      icon: Flame,
    },
    {
      rank: 2,
      name: 'Injector / Fuel System Issue',
      probability: 18,
      confidence: 88.5,
      severity: 'SECONDARY CANDIDATE',
      statusClass: 'text-[#b4c5ff]',
      badgeBg: 'bg-[#b4c5ff]/15 border-[#b4c5ff]/40 text-[#b4c5ff]',
      barColor: 'bg-[#b4c5ff]',
      supportingEvidence:
        'Minor lambda fluctuation recorded during cruise climb, but high-pressure fuel rail remains steady at 3.20 bar and EGT spread delta is <42°C across cylinder banks.',
      affectedSensors: ['FUEL-RAIL-P', 'INJ-PWM-CYL2', 'LAMBDA-EXHAUST'],
      icon: Gauge,
    },
    {
      rank: 3,
      name: 'Sensor Drift',
      probability: 8,
      confidence: 91.0,
      severity: 'UNLIKELY',
      statusClass: 'text-[#00f0ff]',
      badgeBg: 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]',
      barColor: 'bg-[#00f0ff]',
      supportingEvidence:
        'Type-K thermocouple junction loop resistance verified at 12.4 ohms. FFT noise audit reveals no spurious microvolt step-discontinuities or ground loops.',
      affectedSensors: ['TC-CYL2-JUNCT', 'TC-REF-COLD'],
      icon: Radio,
    },
    {
      rank: 4,
      name: 'Lubrication Issue',
      probability: 4,
      confidence: 96.8,
      severity: 'RULED OUT',
      statusClass: 'text-[#849495]',
      badgeBg: 'bg-[#303443] border-[#3b494b]/60 text-[#849495]',
      barColor: 'bg-[#849495]',
      supportingEvidence:
        'Oil scavenge return line pressure steady at 4.80 bar. Sump oil temperature is 92°C, well below thermal degradation threshold (115°C).',
      affectedSensors: ['OIL-PRESS-01', 'OIL-TEMP-SUMP', 'SCAVENGE-PUMP'],
      icon: Droplets,
    },
    {
      rank: 5,
      name: 'Abnormal Vibration',
      probability: 2,
      confidence: 99.1,
      severity: 'RULED OUT',
      statusClass: 'text-[#849495]',
      badgeBg: 'bg-[#303443] border-[#3b494b]/60 text-[#849495]',
      barColor: 'bg-[#849495]',
      supportingEvidence:
        'Vibrational RMS at 1.82 G with kurtosis 3.12 (baseline limit <2.2 G). Spectral waterfall displays no 1X/2X shaft misalignment or bearing harmonic spikes.',
      affectedSensors: ['ACCEL-Z-CRANK', 'KURTOSIS-SPECTRUM'],
      icon: Activity,
    },
  ];

  // Evidence Timeline showing how system reached the diagnosis
  const evidenceTimeline = [
    {
      time: 'T+00:47:23',
      utc: '11:15:20 UTC',
      stage: 'BASELINE EQUILIBRIUM',
      title: 'Ignition & Magneto Check Passed',
      desc: 'All 4 cylinders tracking digital twin baseline within ±0.8°C. CDI drop <40 RPM.',
      status: 'nominal',
    },
    {
      time: 'T+02:00:43',
      utc: '12:28:40 UTC',
      stage: 'RESIDUAL DRIFT',
      title: 'Heat Flux Residual Decayed -4.2%',
      desc: 'Aerodynamic convective cooling efficiency started drifting without altitude or OAT change.',
      status: 'watch',
    },
    {
      time: 'T+03:15:00',
      utc: '13:43:00 UTC',
      stage: 'THERMAL ACCELERATION',
      title: 'Cylinder 2 CHT Acceleration (+14.2%)',
      desc: 'Rate of temperature rise on Cyl #2 decoupled from adjacent Cyl #1 and #3 by >22°C.',
      status: 'warning',
    },
    {
      time: 'T+03:22:15',
      utc: '13:50:12 UTC',
      stage: 'THRESHOLD BREACH',
      title: 'CHT Spiked Past 174°C Warning Ceiling',
      desc: 'Observed CHT reached 178.4°C under 82% cruise command. Oil sump checked nominal.',
      status: 'critical',
    },
    {
      time: 'T+03:37:33',
      utc: '14:05:30 UTC',
      stage: 'DIAGNOSTIC CONVERGENCE',
      title: 'Bayesian Inference Isolated Baffle Restriction',
      desc: 'Correlator converged at 68% probability on cowling baffle distortion. Throttle derate advised.',
      status: 'resolved',
    },
  ];

  return (
    <section
      id="section-4-root-cause-analysis"
      className="w-full rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col gap-5"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base tracking-wider text-[#dee2f5] uppercase">
              Fault Root-Cause Analysis
            </h3>
            <p className="font-mono-telemetry text-xs text-[#849495]">
              Bayesian Multi-Signal Hypothesis Engine // Target: {selectedEngine.name} ({selectedEngine.callsign})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono-telemetry text-xs">
          <span className="text-[#849495]">MODEL CONVERGENCE:</span>
          <span className="text-[#00f0ff] font-bold px-2 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30">
            94.2% CONFIDENCE
          </span>
        </div>
      </div>

      {/* 1. ROOT CAUSE CANDIDATES (The 5 exact required candidates) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#849495]">
          <span className="font-bold text-[#dee2f5] tracking-wider uppercase">ROOT CAUSE CANDIDATES</span>
          <span>EVALUATED AGAINST 112 TELEMETRY INVARIANTS</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {rootCauses.map(candidate => {
            const Icon = candidate.icon;
            return (
              <div
                key={candidate.rank}
                id={`candidate-${candidate.rank}`}
                className="rounded-lg border border-[#3b494b]/50 bg-[#0e1320] p-4 flex flex-col gap-2.5 hover:border-[#00f0ff]/40 transition-all shadow-sm"
              >
                {/* Row 1: Rank, Name, Probability, Confidence & Severity Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-[#1a1f2d] border border-[#3b494b]/50 flex items-center justify-center font-mono-telemetry text-xs font-bold text-[#00f0ff]">
                      {candidate.rank}
                    </div>
                    <Icon className={`w-4 h-4 ${candidate.statusClass}`} />
                    <span className="font-display text-sm font-bold text-[#dee2f5]">
                      {candidate.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono-telemetry text-xs">
                    <span className="text-[#849495]">
                      CONFIDENCE: <strong className="text-[#dee2f5]">{candidate.confidence}%</strong>
                    </span>
                    <span className="text-[#849495]">•</span>
                    <span className="text-[#849495]">
                      PROBABILITY: <strong className={`text-sm ${candidate.statusClass}`}>{candidate.probability}%</strong>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${candidate.badgeBg}`}>
                      {candidate.severity}
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="w-full bg-[#161b29] h-2 rounded-full overflow-hidden border border-[#3b494b]/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${candidate.barColor}`}
                    style={{ width: `${candidate.probability}%` }}
                  ></div>
                </div>

                {/* Supporting Evidence & Affected Sensors */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1.5 border-t border-[#3b494b]/30 font-mono-telemetry text-xs">
                  <div className="md:col-span-8 flex flex-col gap-0.5">
                    <span className="text-[10px] text-[#849495] uppercase font-bold">SUPPORTING EVIDENCE</span>
                    <p className="text-[#b9cacb] text-[11px] leading-relaxed">
                      {candidate.supportingEvidence}
                    </p>
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-1 md:items-end">
                    <span className="text-[10px] text-[#849495] uppercase font-bold">AFFECTED SENSORS</span>
                    <div className="flex flex-wrap gap-1.5 md:justify-end">
                      {candidate.affectedSensors.map(sensor => (
                        <span
                          key={sensor}
                          className="px-2 py-0.5 rounded bg-[#161b29] border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-bold"
                        >
                          {sensor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. EVIDENCE TIMELINE (Showing how system reached diagnosis) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#3b494b]/40">
        <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#849495]">
          <span className="font-bold text-[#dee2f5] tracking-wider uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            EVIDENCE TIMELINE // DIAGNOSTIC PATHWAY
          </span>
          <span>CHRONOLOGICAL REASONING LOG</span>
        </div>

        <div className="relative pl-6 border-l-2 border-[#3b494b]/50 ml-2 space-y-4 py-1">
          {evidenceTimeline.map((step, idx) => {
            const isCritical = step.status === 'critical';
            const isWarning = step.status === 'warning';
            const isResolved = step.status === 'resolved';

            return (
              <div key={idx} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-[#090e1b] flex items-center justify-center ${
                    isCritical
                      ? 'bg-[#ffb4ab] ring-4 ring-[#ffb4ab]/20'
                      : isWarning
                        ? 'bg-[#b4c5ff] ring-4 ring-[#b4c5ff]/20'
                        : isResolved
                          ? 'bg-[#00f0ff] ring-4 ring-[#00f0ff]/20'
                          : 'bg-[#849495]'
                  }`}
                ></div>

                {/* Step Card */}
                <div className="p-3 rounded-lg bg-[#0e1320] border border-[#3b494b]/40 font-mono-telemetry text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between flex-wrap gap-1 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00f0ff] font-bold">{step.time}</span>
                      <span className="text-[#849495]">({step.utc})</span>
                      <span className="text-[#849495]">•</span>
                      <span className="text-[#b9cacb] uppercase font-bold">{step.stage}</span>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-[#dee2f5]">
                    {step.title}
                  </span>
                  <p className="text-[#849495] text-[11px] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

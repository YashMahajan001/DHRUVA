import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Wrench,
  Eye,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Info,
} from 'lucide-react';
import { useAuto } from '../../context/AutoContext';
import { AutoDigitalTwin3D } from './AutoDigitalTwin3D';
import { DiagnosticHypothesis, TelemetryAnomaly } from '../../services/autoApi';

export const AutoAnalysisView: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentEngine,
    telemetry,
    anomalies,
    hypotheses,
    degradations,
    selectedComponent,
    setSelectedComponent,
    isSimulating,
    testHistory,
  } = useAuto();

  // Active severity filter
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'>('ALL');
  const [selectedHypothesis, setSelectedHypothesis] = useState<DiagnosticHypothesis | null>(null);

  // Component details dictionary
  const componentInfoMap: Record<
    string,
    {
      name: string;
      subsystem: string;
      function: string;
      telemetrySignals: string[];
      healthMetric: string;
      designLimit: string;
    }
  > = {
    block: {
      name: 'Engine Block & Cylinder Bores',
      subsystem: 'Structural / Crankcase',
      function: 'Houses pistons, combustion chambers, cylinder liners, and integral coolant galleries.',
      telemetrySignals: ['Coolant Temp', 'Bore Distortion Strain', 'Vibration (Crankcase)'],
      healthMetric: 'Thermal fatigue cycle envelope',
      designLimit: 'Max bore temperature 125°C',
    },
    pistons: {
      name: 'Pistons & Connecting Rods',
      subsystem: 'Power Assembly',
      function: 'Transfers high-pressure combustion gas work from crown to crankshaft journal via H-beam rods.',
      telemetrySignals: ['Engine RPM', 'Brake Torque', 'Brake Power', 'Peak Cylinder Pressure'],
      healthMetric: 'Piston ring pack micro-welding & pin bore clearance',
      designLimit: `Redline ${currentEngine ? currentEngine.operating_limits.redline_rpm : 6800} RPM`,
    },
    crankshaft: {
      name: 'Forged Steel Crankshaft & Counterweights',
      subsystem: 'Reciprocating / Rotational',
      function: 'Converts reciprocating piston motion into continuous shaft torque driving the flywheel.',
      telemetrySignals: ['Shaft Speed (RPM)', 'Torsional Deflection', 'Instantaneous Torque'],
      healthMetric: 'Journal hydrodynamic oil film thickness',
      designLimit: 'Torsional resonance at 7,400 RPM',
    },
    valvetrain: {
      name: 'DOHC Valvetrain, Camshafts & Timing Chain',
      subsystem: 'Air Induction & Gas Exchange',
      function: 'Controls precision lift and timing of intake and exhaust poppet valves with dual variable valve timing.',
      telemetrySignals: ['Cam Phaser Angle', 'Intake Air Mass', 'Exhaust Gas Temp (EGT)'],
      healthMetric: 'Cam follower hydraulic lash & chain tensioner travel',
      designLimit: 'Valve spring seat pressure 650 N',
    },
    cooling: {
      name: 'Front Cooling Radiator Core & Electric Fan',
      subsystem: 'Thermal Management',
      function: 'Rejects rejected engine heat flux to atmosphere through cross-flow aluminum core and 7-blade fan.',
      telemetrySignals: ['Coolant Temp', 'Fan Duty Cycle', 'Core Delta-T'],
      healthMetric: 'Heat exchanger thermal rejection effectiveness',
      designLimit: `Max coolant temp ${currentEngine ? currentEngine.operating_limits.max_coolant_temp_c : 105}°C`,
    },
    transmission: {
      name: 'Transaxle Gearbox, Shafts & Differential',
      subsystem: 'Drivetrain Transmission',
      function: 'Multi-ratio gear reduction, synchronizer engagement, and differential torque split to half-shafts.',
      telemetrySignals: ['Output Speed', 'Shaft Torque', 'Gearbox Oil Temp'],
      healthMetric: 'Synchronizer ring brass friction coefficient & gear tooth contact wear',
      designLimit: `Max input torque ${currentEngine ? currentEngine.specifications.peak_torque_nm * 1.3 : 450} Nm`,
    },
    fuel: {
      name: 'High-Pressure Direct Fuel Injection Rail',
      subsystem: 'Fuel Metering',
      function: 'Pressurizes and atomizes liquid fuel directly into combustion chamber up to 350 bar.',
      telemetrySignals: ['Fuel Flow Rate (L/h)', 'Air-Fuel Ratio (AFR)', 'Rail Pressure (bar)'],
      healthMetric: 'Piezo injector nozzle spray pattern uniformity',
      designLimit: 'Target AFR 12.8 (WOT)',
    },
    turbo: {
      name: 'Twin-Scroll Turbocharger & Wastegate',
      subsystem: 'Forced Induction',
      function: 'Recovers exhaust enthalpy to drive compressor wheel, boosting intake air charge density.',
      telemetrySignals: ['Boost Pressure (bar)', 'Manifold Absolute Pressure', 'EGT (°C)'],
      healthMetric: 'Compressor surge margin & turbine journal shaft bearing clearance',
      designLimit: `Max boost ${currentEngine ? currentEngine.operating_limits.max_manifold_pressure_bar : 2.5} bar`,
    },
  };

  const activeCompInfo = selectedComponent ? componentInfoMap[selectedComponent] : null;

  // Filtered hypotheses
  const filteredHypotheses = hypotheses.filter((h) => {
    if (severityFilter === 'ALL') return true;
    return h.severity === severityFilter;
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto text-[#dee2f5]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#3b494b]/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#dee2f5] uppercase">
              Engine Analysis & Faults
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40">
              3D DIGITAL TWIN & DTC DIAGNOSTICS
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#849495] mt-1 font-mono">
            Interactive kinematic cutaway visualization, component inspection, root-cause fault hypotheses & degradation wear tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#849495]">Selected Engine:</span>
          <span className="px-2.5 py-1 rounded bg-[#121829] border border-[#f59e0b]/40 text-xs font-mono font-bold text-[#f59e0b]">
            {currentEngine ? currentEngine.name : 'VW EA888 2.0 TSI'}
          </span>
        </div>
      </div>

      {/* 2. Main Viewport: Large 3D Digital Twin Viewer */}
      <div className="w-full">
        <AutoDigitalTwin3D
          telemetry={telemetry}
          activeFaultSubsystem={selectedComponent}
          cylinderCount={currentEngine ? currentEngine.specifications.cylinder_count : 4}
          cylinderConfig={currentEngine ? currentEngine.cylinder_configuration : 'INLINE'}
          isSimulating={isSimulating}
        />
      </div>

      {/* 3. Bottom Inspection & Faults Deck (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Component Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
              <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] font-bold uppercase">
                <Wrench className="w-4 h-4" />
                <span>Component Inspector</span>
              </div>
              <span className="text-[10px] font-mono text-[#849495]">
                {selectedComponent ? selectedComponent.toUpperCase() : 'CLICK 3D PART TO INSPECT'}
              </span>
            </div>

            {activeCompInfo ? (
              <div className="flex flex-col gap-3 my-3">
                <div className="p-3 rounded-lg bg-[#090e1b] border border-[#f59e0b]/40">
                  <div className="text-sm font-bold text-[#dee2f5]">{activeCompInfo.name}</div>
                  <div className="text-[10px] font-mono text-[#f59e0b] mt-0.5">Subsystem: {activeCompInfo.subsystem}</div>
                  <p className="text-xs text-[#b9cacb] mt-2 font-sans leading-relaxed">{activeCompInfo.function}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                    <div className="text-[10px] font-mono text-[#849495] uppercase">Health Metric</div>
                    <div className="text-xs font-bold text-[#dee2f5] mt-1">{activeCompInfo.healthMetric}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                    <div className="text-[10px] font-mono text-[#849495] uppercase">Design Limit</div>
                    <div className="text-xs font-bold text-rose-400 mt-1">{activeCompInfo.designLimit}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                  <div className="text-[10px] font-mono text-[#849495] uppercase mb-1.5">Associated Telemetry Signals</div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCompInfo.telemetrySignals.map((sig) => (
                      <span key={sig} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161b29] border border-[#3b494b]/50 text-[#38bdf8]">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-6 p-6 rounded-lg bg-[#090e1b] border border-[#3b494b]/30 flex flex-col items-center justify-center text-center gap-2">
                <Eye className="w-8 h-8 text-[#849495]" />
                <div className="font-bold text-xs text-[#dee2f5]">No Component Currently Selected</div>
                <p className="text-[11px] text-[#849495] max-w-[280px]">
                  Click directly on any moving powertrain component in the 3D cutaway viewer above to inspect its real-time telemetry, operational bounds, and diagnostic health.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                  {Object.keys(componentInfoMap).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSelectedComponent(k)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161b29] border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] transition-colors"
                    >
                      {componentInfoMap[k].name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#3b494b]/30 flex items-center justify-between text-[10px] font-mono text-[#849495]">
            <span>Verified CAD/Physics Kinematic Representation</span>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-[#f59e0b] hover:underline"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Fault Analysis & DTC Diagnostics Panel (7 cols) */}
        <div className="lg:col-span-7 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#3b494b]/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#f59e0b]" />
                <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
                  Diagnostic Fault Hypotheses & DTC Codes
                </span>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {(['ALL', 'CRITICAL', 'WARNING', 'ADVISORY'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                      severityFilter === sev
                        ? 'bg-[#f59e0b] text-[#090e1b] font-bold border-[#f59e0b]'
                        : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Hypotheses List */}
            <div className="flex flex-col gap-2.5 my-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredHypotheses.length > 0 ? (
                filteredHypotheses.map((hyp) => {
                  const isSelected = selectedHypothesis?.hypothesis_id === hyp.hypothesis_id;
                  return (
                    <div
                      key={hyp.hypothesis_id}
                      onClick={() => {
                        setSelectedHypothesis(hyp);
                        // Map subsystem to component if possible
                        if (hyp.subsystem.toLowerCase().includes('cool')) setSelectedComponent('cooling');
                        else if (hyp.subsystem.toLowerCase().includes('boost') || hyp.subsystem.toLowerCase().includes('turbo')) setSelectedComponent('turbo');
                        else if (hyp.subsystem.toLowerCase().includes('valve')) setSelectedComponent('valvetrain');
                        else if (hyp.subsystem.toLowerCase().includes('fuel')) setSelectedComponent('fuel');
                        else if (hyp.subsystem.toLowerCase().includes('crank')) setSelectedComponent('crankshaft');
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-[#090e1b] border-[#3b494b]/40 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              {hyp.fault_id}
                            </span>
                            <span className="font-bold text-xs text-[#dee2f5]">{hyp.fault_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/15 text-rose-400">
                              {hyp.severity}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#849495] mt-1">
                            Subsystem: <span className="text-[#dee2f5]">{hyp.subsystem}</span> • Confidence:{' '}
                            <span className="text-amber-400 font-bold">{(hyp.confidence * 100).toFixed(0)}%</span> (bounds:{' '}
                            {(hyp.uncertainty_bounds[0] * 100).toFixed(0)}%–{(hyp.uncertainty_bounds[1] * 100).toFixed(0)}%)
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-[#38bdf8] hover:underline">
                          {isSelected ? 'Selected' : 'View Evidence'}
                        </span>
                      </div>

                      {/* Expanded Evidence & Inspection details if selected */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-[#3b494b]/30 flex flex-col gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-[#849495] uppercase">Supporting Telemetry Evidence:</span>
                            <ul className="list-disc list-inside text-[11px] text-[#b9cacb] mt-0.5">
                              {hyp.supporting_evidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono text-[#849495] uppercase">Recommended Diagnostic Action:</span>
                            <ul className="list-disc list-inside text-[11px] text-amber-300 mt-0.5">
                              {hyp.recommended_inspections.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : anomalies.length > 0 ? (
                anomalies.map((a, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#090e1b] border border-amber-500/30 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">{a.channel}</span>
                      <span className="text-[10px] text-[#849495]">{a.detection_method}</span>
                    </div>
                    <div className="text-[#dee2f5] mt-1">{a.explanation}</div>
                    <div className="text-[10px] text-[#849495] mt-1">
                      Observed: {a.measured_or_simulated_value.toFixed(1)} {a.unit} (Expected: {a.expected_range[0]}–{a.expected_range[1]})
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-lg bg-[#090e1b] border border-emerald-500/20 text-center text-xs font-mono text-emerald-300 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>No active DTC diagnostic faults or telemetry anomalies detected.</span>
                  <span className="text-[10px] text-[#849495]">
                    Run higher throttle/boost in the Tuning Lab to simulate thermal excursion and fault generation.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subsystem Health Deg summaries */}
          <div className="pt-2 border-t border-[#3b494b]/30 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#849495]">
            <span>Bayesian Powertrain Dependency Graph v2.4</span>
            <button
              onClick={() => navigate('/auto/tests')}
              className="text-[#f59e0b] hover:underline flex items-center gap-1 font-bold"
            >
              <span>View Faults in Test History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Subsystem Physical Degradation & Wear Progress Bars */}
      {degradations.length > 0 && (
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
            <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
              Subsystem Physical Wear & Remaining Useful Life (RUL)
            </span>
            <span className="text-[10px] font-mono text-[#849495]">
              Miner Cumulative Damage & Arrhenius Thermal Kinetics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            {degradations.slice(0, 4).map((deg, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#090e1b] border border-[#3b494b]/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#dee2f5]">
                  <span>{deg.component_name}</span>
                  <span
                    className={
                      deg.health_percentage < 70
                        ? 'text-rose-400'
                        : deg.health_percentage < 85
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {deg.health_percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-[#161b29] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      deg.health_percentage < 70
                        ? 'bg-rose-500'
                        : deg.health_percentage < 85
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${deg.health_percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#849495] mt-1">
                  <span>RUL: {deg.rul_hours_estimate ? `${deg.rul_hours_estimate.toFixed(0)} hrs` : 'N/A'}</span>
                  <span>{deg.degradation_metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

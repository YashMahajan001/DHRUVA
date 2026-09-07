import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Terminal, X, Check, Orbit, ClipboardList, ShieldAlert, Cpu, Download } from 'lucide-react';

export const Modals: React.FC = () => {
  const {
    activeModal,
    closeModal,
    diagnosticInsight,
    selectedEngine,
    injectScenarioFault,
    exportTelemetryLog,
    showToast,
  } = useDashboard();

  const [selectedScenario, setSelectedScenario] = useState('thermal-excursion');

  if (!activeModal) return null;

  return (
    <div
      id="global-tactical-modal"
      className="fixed inset-0 bg-[#090e1b]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* 1. AGENT AUTONOMOUS EXECUTION TRACE MODAL (Exact match from Stitch design) */}
      {activeModal === 'agent-trace' && (
        <div className="bg-[#161b29] border border-[#00f0ff]/40 p-6 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#3b494b]/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#00f0ff]" />
              <span className="font-display text-base sm:text-lg text-[#dee2f5] font-bold">
                AI Agent Autonomous Execution Trace
              </span>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-1 text-[#b9cacb] hover:text-[#dee2f5] rounded bg-[#1a1f2d] hover:bg-[#252a38] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 font-mono-telemetry text-xs max-h-[60vh] overflow-y-auto pr-1">
            {/* Tool Invocations */}
            {(diagnosticInsight?.toolTrace || []).map((trace, idx) => (
              <div key={idx} className="p-3 rounded bg-[#090e1b] border border-[#3b494b]/30 flex flex-col gap-1">
                <span className="text-[#00f0ff] font-bold text-[10px]">
                  TOOL INVOCATION: {trace.tool}
                </span>
                <pre className="text-[#b9cacb] text-[11px] overflow-x-auto bg-[#161b29]/60 p-2 rounded">
                  {JSON.stringify(trace.payload, null, 2)}
                </pre>
              </div>
            ))}

            {/* Agent Reasoning Synthesis */}
            <div className="p-3 rounded bg-[#1a1f2d] border border-[#00f0ff]/30 flex flex-col gap-1 mt-1">
              <span className="text-[#7df4ff] font-bold text-[10px] uppercase tracking-wider">
                AGENT REASONING SYNTHESIS
              </span>
              <p className="font-sans text-xs text-[#dee2f5] leading-relaxed">
                "{diagnosticInsight.reasoningSynthesis}"
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#3b494b]/30">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] font-mono-telemetry text-xs uppercase font-bold rounded shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-colors"
            >
              Acknowledge &amp; Return
            </button>
          </div>
        </div>
      )}

      {/* 2. SCENARIO SIMULATION INJECTOR MODAL */}
      {activeModal === 'scenario-sim' && (
        <div className="bg-[#161b29] border border-[#00f0ff]/40 p-6 rounded-xl shadow-2xl max-w-xl w-full flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#3b494b]/30">
            <div className="flex items-center gap-2">
              <Orbit className="w-5 h-5 text-[#00f0ff]" />
              <span className="font-display text-base sm:text-lg text-[#dee2f5] font-bold">
                Synthetic Digital Twin Scenario Injector
              </span>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-1 text-[#b9cacb] hover:text-[#dee2f5] rounded bg-[#1a1f2d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="font-sans text-xs text-[#b9cacb]">
            Inject realistic thermodynamic and mechanical fault signatures into the virtual digital twin of {selectedEngine.name} ({selectedEngine.callsign}) to evaluate real-time autonomic response.
          </p>

          <div className="flex flex-col gap-2 font-mono-telemetry text-xs">
            {[
              {
                id: 'thermal-excursion',
                title: 'Cylinder #2 Cooling Baffle Choke',
                desc: 'Simulate +26.4°C thermal elevation with -8.1% heat flux residual decay.',
                severity: 'WARNING',
              },
              {
                id: 'scavenge-cavitation',
                title: 'Oil Scavenge Pump Cavitation & Bearing Spall',
                desc: 'Drops oil pressure to 3.2 bar, elevates kurtosis to 6.4 G, drops RUL to 11h.',
                severity: 'CRITICAL',
              },
              {
                id: 'wastegate-hunting',
                title: 'Turbocharger Wastegate 1.2 Hz Micro-Oscillation',
                desc: 'Injects manifold pressure jitter and periodic turbine RPM harmonics.',
                severity: 'WATCH',
              },
              {
                id: 'nominal-recovery',
                title: 'Optimal Aerodynamic Clearance (Nominal)',
                desc: 'Restores airflow uniformity, clears thermal gradients, aligns all twin states.',
                severity: 'NORMAL',
              },
            ].map((sc) => (
              <label
                key={sc.id}
                className={`p-3 rounded border cursor-pointer flex items-start gap-3 transition-colors ${
                  selectedScenario === sc.id
                    ? 'bg-[#252a38] border-[#00f0ff]'
                    : 'bg-[#1a1f2d]/60 border-[#3b494b]/30 hover:bg-[#1a1f2d]'
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={sc.id}
                  checked={selectedScenario === sc.id}
                  onChange={() => setSelectedScenario(sc.id)}
                  className="mt-1 accent-[#00f0ff]"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#dee2f5]">{sc.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#303443] text-[#00f0ff]">
                      {sc.severity}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-[#849495] mt-0.5">{sc.desc}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#3b494b]/30">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 bg-[#1a1f2d] text-[#b9cacb] hover:text-[#dee2f5] font-mono-telemetry text-xs uppercase rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => injectScenarioFault(selectedScenario)}
              className="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] font-mono-telemetry text-xs uppercase font-bold rounded shadow-lg transition-colors"
            >
              Inject Into Flight Twin
            </button>
          </div>
        </div>
      )}

      {/* 3. WORK ORDER GENERATION MODAL */}
      {activeModal === 'work-order' && (
        <div className="bg-[#161b29] border border-[#00f0ff]/40 p-6 rounded-xl shadow-2xl max-w-lg w-full flex flex-col gap-4 font-mono-telemetry">
          <div className="flex items-center justify-between pb-1 border-b border-[#3b494b]/30">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#00f0ff]" />
              <span className="font-display text-base text-[#dee2f5] font-bold">
                Work Order #WO-8924 Generated
              </span>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-1 text-[#b9cacb] hover:text-[#dee2f5] rounded bg-[#1a1f2d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#090e1b] p-3.5 rounded border border-[#3b494b]/30 flex flex-col gap-2 text-xs">
            <div className="flex justify-between border-b border-[#3b494b]/20 pb-1">
              <span className="text-[#849495]">ORDER ID:</span>
              <span className="text-[#00f0ff] font-bold">WO-8924-AERO</span>
            </div>
            <div className="flex justify-between border-b border-[#3b494b]/20 pb-1">
              <span className="text-[#849495]">TARGET UNIT:</span>
              <span className="text-[#dee2f5]">{selectedEngine.name} ({selectedEngine.callsign})</span>
            </div>
            <div className="flex justify-between border-b border-[#3b494b]/20 pb-1">
              <span className="text-[#849495]">ENGINE SERIAL:</span>
              <span className="text-[#dee2f5]">{selectedEngine.engineNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[#3b494b]/20 pb-1">
              <span className="text-[#849495]">PRIORITY:</span>
              <span className="text-[#b4c5ff] font-bold">LEVEL 2 // FLIGHT WARNING</span>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[#849495]">DIRECTIVES:</span>
              <p className="font-sans text-xs text-[#dee2f5]">
                1. Conduct borescope visual inspection of Cylinder #2 cooling fin baffle seals.
                <br />
                2. Verify thermocouple probe calibration against certified test block.
                <br />
                3. Transmit post-inspection clearance to Base Logistics Queue before Sortie 9825.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#3b494b]/30">
            <button
              type="button"
              onClick={() => {
                showToast('Work Order #WO-8924 dispatched to Base Maintenance Command.', 'success');
                closeModal();
              }}
              className="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#00dbe9] text-[#00363a] text-xs uppercase font-bold rounded shadow-lg transition-colors"
            >
              Transmit to Base Logistics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

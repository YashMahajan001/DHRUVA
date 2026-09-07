import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  PlaneTakeoff,
  Wrench,
  Orbit,
  ClipboardList,
  Bot,
  AlertTriangle,
} from 'lucide-react';

export const PrescribedInterventionsCard: React.FC = () => {
  const {
    diagnosticInsight,
    openModal,
    showToast,
  } = useDashboard();

  return (
    <div
      id="prescribed-interventions-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
        Prescribed Interventions
      </span>

      {/* Intervention Directives */}
      <div className="flex flex-col gap-1.5">
        {(diagnosticInsight?.prescribedInterventions || []).map(item => {
          const isImmediate = item.type === 'IMMEDIATE';
          const isCritical = item.severity === 'CRITICAL';

          return (
            <div
              key={item.id}
              className={`p-2 rounded flex items-start gap-2 border ${
                isCritical
                  ? 'bg-[#93000a]/20 border-[#ef4444]/40 text-[#ffdad6]'
                  : isImmediate
                    ? 'bg-[#b4c5ff]/15 border-[#b4c5ff]/30 text-[#dee2f5]'
                    : 'bg-[#1a1f2d]/70 border-[#3b494b]/20 text-[#dee2f5]'
              }`}
            >
              {isImmediate ? (
                <PlaneTakeoff className="w-4 h-4 text-[#b4c5ff] shrink-0 mt-0.5" />
              ) : (
                <Wrench className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
              )}

              <div className="flex flex-col">
                <span
                  className={`font-mono-telemetry text-[10px] font-bold ${
                    isCritical ? 'text-[#ffb4ab]' : isImmediate ? 'text-[#b4c5ff]' : 'text-[#00f0ff]'
                  }`}
                >
                  {item.label}
                </span>
                <span className="font-sans text-xs mt-0.5 leading-snug">
                  {item.action}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tactical CTAs matching Stitch */}
      <div className="flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => openModal('scenario-sim')}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#00f0ff]/15 hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#00f0ff]/40 transition-colors shadow-sm font-semibold"
        >
          <Orbit className="w-4 h-4" />
          <span>Simulate Fault in Flight Twin</span>
        </button>

        <button
          type="button"
          onClick={() => openModal('work-order')}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#1a1f2d] hover:bg-[#252a38] text-[#dee2f5] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#3b494b]/40 transition-colors"
        >
          <ClipboardList className="w-4 h-4 text-[#7df4ff]" />
          <span>Create Work Order #WO-8924</span>
        </button>

        <button
          type="button"
          onClick={() => openModal('agent-trace')}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#303443] hover:bg-[#343948] text-[#00f0ff] font-mono-telemetry text-xs uppercase tracking-wider rounded border border-[#00f0ff]/30 transition-colors"
        >
          <Bot className="w-4 h-4" />
          <span>Verify with AI Agent</span>
        </button>
      </div>
    </div>
  );
};

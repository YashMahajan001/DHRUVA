import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { ShieldCheck, Layers } from 'lucide-react';

export const EvidenceChainCard: React.FC = () => {
  const { diagnosticInsight, showToast } = useDashboard();

  return (
    <div
      id="evidence-chain-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
          Structured Evidence Chain
        </span>
        <span className="font-mono-telemetry text-[9px] text-[#849495]">
          {(diagnosticInsight?.evidenceChain || []).length} CORROBORATED SIGNALS
        </span>
      </div>

      {/* Signal List */}
      <div id="evidence-chain-list" className="flex flex-col gap-1.5">
        {(diagnosticInsight?.evidenceChain || []).map(ev => (
          <div
            key={ev.id}
            onClick={() => showToast(`Corroborated Signal [${ev.tag}]: ${ev.title} - ${ev.desc}`, 'info')}
            className="p-2 rounded bg-[#1a1f2d]/70 hover:bg-[#252a38] border border-[#3b494b]/20 flex items-start gap-2 cursor-pointer transition-colors group"
          >
            <span className="font-mono-telemetry text-[9px] font-bold text-[#b4c5ff] px-1.5 py-0.5 rounded bg-[#303443] mt-0.5 shrink-0">
              {ev.tag}
            </span>

            <div className="flex flex-col">
              <span className="font-sans text-xs text-[#dee2f5] font-semibold group-hover:text-[#dbfcff]">
                {ev.title}
              </span>
              <span className="font-mono-telemetry text-[9px] text-[#849495] mt-0.5 leading-tight">
                {ev.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

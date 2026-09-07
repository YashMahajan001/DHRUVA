import React, { useState } from 'react';
import { CalendarClock, Download, FileText, X } from 'lucide-react';
import { MroTask } from '../types';

interface PredictiveMroProps {
  tasks: MroTask[];
  onSelectEngine: (index: number) => void;
}

export const PredictiveMro: React.FC<PredictiveMroProps> = ({ tasks, onSelectEngine }) => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const handleExportAudit = () => {
    setIsAuditModalOpen(true);
  };

  const downloadAuditJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DHRUVAA_MRO_Audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      id="predictive-mro-panel"
      className="bg-[#161b29] border border-[#3b494b]/30 p-3.5 rounded-xl shadow-lg flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-base font-bold text-[#dee2f5] uppercase tracking-wide">
          Predictive MRO
        </span>
        <CalendarClock className="w-4 h-4 text-[#849495]" />
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          const isCrit = task.severity === 'CRITICAL';
          const isWarn = task.severity === 'WARNING';
          const badgeColor = isCrit
            ? 'text-[#ef4444]'
            : isWarn
            ? 'text-[#f59e0b]'
            : 'text-[#10b981]';

          return (
            <div
              key={task.id}
              onClick={() => onSelectEngine(task.engineIndex)}
              className="bg-[#252a38]/60 hover:bg-[#252a38] border border-[#3b494b]/30 p-2.5 rounded transition-colors cursor-pointer group"
              title={`Click to inspect ${task.engineId} telemetry`}
            >
              <div className="flex justify-between items-center font-mono text-[10px] text-[#849495]">
                <span className="group-hover:text-[#00f0ff] transition-colors">
                  {task.title}
                </span>
                <span className={`font-bold font-mono ${badgeColor}`}>
                  {task.statusText}
                </span>
              </div>
              <span className="text-xs text-[#dee2f5] block mt-0.5 leading-snug">
                {task.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Export Button */}
      <button
        id="btn-export-mro"
        onClick={handleExportAudit}
        className="w-full mt-2 py-2 bg-[#252a38] hover:bg-[#343948] border border-[#3b494b]/40 text-[#dee2f5] font-mono text-[11px] rounded transition-colors text-center uppercase tracking-wider font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5 text-[#00f0ff]" />
        <span>EXPORT COMPLETE MRO AUDIT</span>
      </button>

      {/* Complete MRO Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b29] border border-[#00f0ff]/40 rounded-xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#3b494b]/30">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00f0ff]" />
                <span className="font-display font-bold text-base text-[#dee2f5]">
                  DHRUVAA MRO AUDIT &amp; AIRWORTHINESS LOG
                </span>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-[#849495] hover:text-[#dee2f5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#dee2f5] flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              <div className="bg-[#090e1b] p-3 rounded border border-[#3b494b]/30 font-mono text-[11px]">
                <p className="text-[#00f0ff] font-bold mb-1">PROPULSION OVERVIEW: UAV-01</p>
                <p>CERTIFICATE AUTHORITY: DGCA / DEF-AERO PROTOCOL SPEC 4B</p>
                <p>FLEET OPERATIONAL TIME: 1,480 COMBINED FLIGHT HOURS</p>
                <p>NEXT BASE GROUND TURNAROUND: 18 HOURS REMAINING (CRITICAL LIMIT)</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-[#849495] uppercase font-bold">
                  Scheduled Work Orders:
                </span>
                {tasks.map((task) => (
                  <div key={task.id} className="bg-[#252a38] p-2.5 rounded border border-[#3b494b]/30">
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-[#00f0ff] font-bold">{task.title}</span>
                      <span className="font-bold">{task.statusText}</span>
                    </div>
                    <p className="text-xs text-[#b9cacb]">{task.description}</p>
                    <div className="mt-1 text-[10px] font-mono text-[#849495]">
                      WO-ID: {task.id} // COMPONENT: {task.component}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#3b494b]/30">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3 py-1.5 rounded font-mono text-xs text-[#849495] hover:text-[#dee2f5]"
              >
                CLOSE
              </button>
              <button
                onClick={downloadAuditJSON}
                className="px-4 py-1.5 rounded bg-[#00f0ff] text-[#00363a] font-mono text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD LOG (.JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

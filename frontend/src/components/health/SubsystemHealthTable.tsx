/**
 * DHRUVAA Propulsion Subsystem Health & Telemetry Log Table
 */
import React, { useState } from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { CheckSquare, Search, AlertTriangle, Eye, ShieldCheck, Activity } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const SubsystemHealthTable: React.FC = () => {
  const { selectedEngine, openModal, approveWorkOrder } = useMission();
  const [searchTerm, setSearchTerm] = useState('');

  const components = selectedEngine.components;

  const filteredComponents = components.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.subsystem.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-3 bg-[#090e1b]/80 p-4 rounded border border-[#3b494b]/30 relative shadow-[0_0_20px_rgba(0,0,0,0.35)]">
      <ReticleCorner color="#00f0ff" size={6} />

      {/* Table Header & Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#00f0ff]" />
          <h2 className="font-headline text-base sm:text-lg text-[#dee2f5] uppercase tracking-wide font-semibold">
            PROPULSION SUBSYSTEM HEALTH &amp; TELEMETRY LOG // {selectedEngine.displayId}
          </h2>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <input
            type="text"
            id="componentSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH SUBSYSTEM / COMPONENT..."
            className="bg-[#161b29] border border-[#3b494b]/40 rounded px-3 py-1 text-[#dee2f5] font-tactical text-[11px] focus:border-[#00f0ff] focus:outline-none w-64 uppercase tracking-wider placeholder:normal-case placeholder:text-[#849495]"
          />
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-[#849495] pointer-events-none" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="mroTable">
          <thead>
            <tr className="border-b border-[#3b494b]/30 font-telemetry text-[9px] text-[#849495] uppercase tracking-wider bg-[#161b29]/40">
              <th className="py-2 px-3">COMPONENT</th>
              <th className="py-2 px-3">SUBSYSTEM</th>
              <th className="py-2 px-3">HEALTH %</th>
              <th className="py-2 px-3">EST. RUL</th>
              <th className="py-2 px-3">LAST INSPECTED</th>
              <th className="py-2 px-3">NEXT SERVICE DUE</th>
              <th className="py-2 px-3">STATUS</th>
              <th className="py-2 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b494b]/15 font-body text-xs">
            {filteredComponents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[#849495] font-tactical text-xs">
                  NO PROPULSION SUBSYSTEMS MATCH SEARCH QUERY
                </td>
              </tr>
            ) : (
              filteredComponents.map((comp) => {
                const isCritical = comp.status === 'CRITICAL';
                const isWarning = comp.status === 'WARNING';
                const isWatch = comp.status === 'WATCH';

                const rowBg = isCritical
                  ? 'bg-red-500/10 hover:bg-red-500/15'
                  : isWarning
                  ? 'bg-amber-500/5 hover:bg-amber-500/10'
                  : 'hover:bg-[#1a1f2d]/50';

                const barColor = isCritical
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-amber-400'
                  : 'bg-emerald-400';

                return (
                  <tr key={comp.id} className={`${rowBg} transition-colors`}>
                    {/* Component Name */}
                    <td className="py-2.5 px-3 font-tactical text-[11px] text-[#dee2f5] font-bold">
                      <div className="flex items-center gap-1.5">
                        {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className={isCritical ? 'text-red-400' : ''}>{comp.name}</span>
                      </div>
                    </td>

                    {/* Subsystem */}
                    <td className="py-2.5 px-3 text-[#b9cacb] font-telemetry text-[10px]">
                      {comp.subsystem}
                    </td>

                    {/* Health % Bar */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#252a38] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor}`}
                            style={{ width: `${comp.healthScore}%` }}
                          />
                        </div>
                        <span
                          className={`font-telemetry text-[11px] font-bold ${
                            isCritical
                              ? 'text-red-400'
                              : isWarning
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {comp.healthScore}%
                        </span>
                      </div>
                    </td>

                    {/* Est RUL */}
                    <td className="py-2.5 px-3 font-telemetry text-[11px] text-[#dee2f5]">
                      <span className={isCritical ? 'text-red-400 font-bold' : isWarning ? 'text-amber-300 font-bold' : ''}>
                        {comp.estimatedRulHours} hrs
                      </span>
                    </td>

                    {/* Last Inspected */}
                    <td className="py-2.5 px-3 text-[#b9cacb] font-telemetry text-[10px]">
                      {comp.lastInspected}
                    </td>

                    {/* Next Service Due */}
                    <td className="py-2.5 px-3 font-telemetry text-[11px]">
                      {comp.nextServiceDueHours === 'IMMEDIATE' ? (
                        <span className="text-red-400 font-bold uppercase tracking-wider animate-pulse">
                          IMMEDIATE
                        </span>
                      ) : (
                        <span className={isWarning ? 'text-amber-400 font-bold' : 'text-[#b9cacb]'}>
                          {comp.nextServiceDueHours} hrs
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-telemetry text-[9px] font-bold uppercase border ${
                          isCritical
                            ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : isWatch
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {comp.status === 'WARNING' ? 'INSPECTION DUE' : comp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      {comp.activeWorkOrderId ? (
                        <button
                          onClick={() => openModal('workOrder', { woId: comp.activeWorkOrderId, engine: selectedEngine })}
                          className={`hover:underline font-tactical text-[10px] uppercase font-bold cursor-pointer ${
                            isCritical ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {isCritical ? `VIEW ORDER #${comp.activeWorkOrderId}` : `AUDIT BAFFLE`}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            openModal('sensorStream', {
                              engineId: selectedEngine.id,
                              component: comp.name,
                              subsystem: comp.subsystem
                            })
                          }
                          className="text-[#00f0ff] hover:underline font-tactical text-[10px] uppercase font-bold cursor-pointer"
                        >
                          VIEW SENSORS
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

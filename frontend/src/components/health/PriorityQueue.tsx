/**
 * DHRUVAA Maintenance Priority Queue
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { LineChart, CheckCircle, Wrench, Eye, ShieldAlert, AlertTriangle } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const PriorityQueue: React.FC = () => {
  const {
    engines,
    queueFilter,
    setQueueFilter,
    setSelectedEngineId,
    selectedEngineId,
    approveWorkOrder,
    openModal,
    showToast
  } = useMission();

  const criticalCount = engines.filter((e) => e.status === 'CRITICAL').length;
  const warningCount = engines.filter((e) => e.status === 'WARNING').length;
  const routineCount = engines.filter((e) => e.status === 'NOMINAL').length;

  const filteredEngines = engines.filter((eng) => {
    if (queueFilter === 'critical') return eng.status === 'CRITICAL';
    if (queueFilter === 'warning') return eng.status === 'WARNING';
    if (queueFilter === 'routine') return eng.status === 'NOMINAL';
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-[#00f0ff]" />
          <h2 className="font-headline text-lg text-[#dee2f5] uppercase tracking-wide font-semibold">
            MAINTENANCE PRIORITY QUEUE
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setQueueFilter('all')}
            className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
              queueFilter === 'all'
                ? 'border border-[#00f0ff] text-[#dee2f5] bg-[#1a1f2d] font-bold'
                : 'border border-transparent text-[#b9cacb] hover:border-[#00f0ff]/40'
            }`}
          >
            ALL ({engines.length})
          </button>
          <button
            onClick={() => setQueueFilter('critical')}
            className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
              queueFilter === 'critical'
                ? 'border border-red-500 text-red-400 bg-red-950/40 font-bold'
                : 'border border-transparent text-red-400 hover:border-red-400/40'
            }`}
          >
            CRITICAL ({criticalCount})
          </button>
          <button
            onClick={() => setQueueFilter('warning')}
            className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
              queueFilter === 'warning'
                ? 'border border-amber-500 text-amber-300 bg-amber-950/40 font-bold'
                : 'border border-transparent text-amber-300 hover:border-amber-400/40'
            }`}
          >
            WARNING ({warningCount})
          </button>
          <button
            onClick={() => setQueueFilter('routine')}
            className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase transition-all ${
              queueFilter === 'routine'
                ? 'border border-[#00f0ff]/50 text-emerald-400 bg-emerald-950/40 font-bold'
                : 'border border-transparent text-[#b9cacb] hover:border-[#00f0ff]/40'
            }`}
          >
            ROUTINE ({routineCount})
          </button>
        </div>
      </div>

      {/* Cards Stack */}
      <div className="flex flex-col gap-3">
        {filteredEngines.map((eng) => {
          const isSelected = eng.id === selectedEngineId;

          if (eng.id === 'eng-03') {
            const wo = eng.workOrders.find((w) => w.id === '8924') || eng.workOrders[0];
            const isApproved = wo?.status === 'DISPATCHED';

            return (
              <div
                key={eng.id}
                onClick={() => setSelectedEngineId(eng.id)}
                className={`p-4 rounded bg-[#090e1b]/90 border border-red-500/50 shadow-[inset_0_0_16px_rgba(239,68,68,0.12)] flex flex-col gap-3 relative transition-all ${
                  isSelected ? 'ring-1 ring-red-400' : ''
                }`}
              >
                <ReticleCorner color="#ef4444" size={5} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-headline text-lg text-[#dee2f5] font-bold">
                      {eng.displayId}
                    </span>
                    <span className="font-tactical text-[11px] text-[#b9cacb] uppercase">
                      AIRFRAME: {eng.airframeCallsign}
                    </span>
                    <span className="px-2 py-0.5 rounded font-telemetry text-[9px] bg-red-500/20 text-red-400 border border-red-500/50 tracking-wider animate-pulse uppercase font-bold">
                      URGENT // IMMEDIATE ACTION
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                      DISPATCH:
                    </span>
                    <span
                      id="badge-8924"
                      className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase font-bold border ${
                        isApproved
                          ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isApproved ? 'WO #8924 [DISPATCHED]' : `WO #8924 [${wo?.status || 'PENDING'}]`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#161b29]/60 p-3 rounded border border-[#3b494b]/20">
                  <div className="md:col-span-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#3b494b]/20 pb-2 md:pb-0 md:pr-3">
                    <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                      REMAINING USEFUL LIFE
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-telemetry text-2xl text-red-400 font-bold">
                        {eng.rulHours}
                      </span>
                      <span className="font-tactical text-[11px] text-[#b9cacb]">
                        HRS
                      </span>
                    </div>
                    <span className="font-telemetry text-[9px] text-red-400 uppercase mt-1">
                      BELOW SAFE FLOOR (30h)
                    </span>
                  </div>

                  <div className="md:col-span-6 flex flex-col justify-center">
                    <div className="font-telemetry text-[9px] text-[#00dbe9] uppercase font-semibold">
                      AFFECTED COMPONENT: CRANKSHAFT MAIN BEARING #2
                    </div>
                    <p className="font-body text-xs text-[#dee2f5] mt-1 leading-relaxed">
                      <strong className="text-red-400">Anomaly:</strong> Ultrasonic acoustic signature shows metal-to-metal micro-spalling. Harmonic vibration peak @ 2.45 kHz (+19 dB). Current vibration: {eng.telemetry.vibration} mm/s.
                    </p>
                    <p className="font-body text-[11px] text-red-400/90 mt-1 leading-relaxed">
                      <strong>Directive:</strong> Remove engine from service immediately; complete overhaul required before next flight.
                    </p>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('workOrder', { woId: '8924', engine: eng });
                      }}
                      className="w-full py-1.5 px-3 rounded bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all font-tactical text-[11px] uppercase font-bold text-center cursor-pointer"
                    >
                      MANAGE WO #8924
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('twinCutaway', { engineId: eng.id, highlightComponent: 'bearing' });
                      }}
                      className="w-full py-1.5 px-3 rounded bg-[#1a1f2d] border border-[#3b494b]/40 text-[#dee2f5] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 font-tactical text-[11px] uppercase text-center transition-all cursor-pointer"
                    >
                      3D TWIN CUTAWAY
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (eng.id === 'eng-02') {
            const wo = eng.workOrders.find((w) => w.id === '8925') || eng.workOrders[0];
            const isApproved = wo?.status === 'DISPATCHED';

            return (
              <div
                key={eng.id}
                onClick={() => setSelectedEngineId(eng.id)}
                className={`p-4 rounded bg-[#090e1b]/90 border border-amber-500/40 flex flex-col gap-3 relative transition-all ${
                  isSelected ? 'ring-1 ring-amber-400' : ''
                }`}
              >
                <ReticleCorner color="#f59e0b" size={5} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-headline text-lg text-[#dee2f5] font-bold">
                      {eng.displayId}
                    </span>
                    <span className="font-tactical text-[11px] text-[#b9cacb] uppercase">
                      AIRFRAME: {eng.airframeCallsign}
                    </span>
                    <span className="px-2 py-0.5 rounded font-telemetry text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/40 tracking-wider uppercase font-bold">
                      SCHEDULED ATTENTION // WARNING
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                      DISPATCH:
                    </span>
                    <span
                      id="badge-8925"
                      className={`px-2 py-0.5 rounded font-telemetry text-[9px] uppercase font-bold border ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isApproved ? 'WO #8925 [APPROVED & DISPATCHED]' : 'WO #8925 [PENDING APPROVAL]'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#161b29]/60 p-3 rounded border border-[#3b494b]/20">
                  <div className="md:col-span-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#3b494b]/20 pb-2 md:pb-0 md:pr-3">
                    <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                      REMAINING USEFUL LIFE
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-telemetry text-2xl text-amber-300 font-bold">
                        {eng.rulHours}
                      </span>
                      <span className="font-tactical text-[11px] text-[#b9cacb]">
                        HRS
                      </span>
                    </div>
                    <span className="font-telemetry text-[9px] text-amber-400 uppercase mt-1">
                      INSPECTION DUE &lt; 50H
                    </span>
                  </div>

                  <div className="md:col-span-6 flex flex-col justify-center">
                    <div className="font-telemetry text-[9px] text-[#00dbe9] uppercase font-semibold">
                      AFFECTED COMPONENT: CYLINDER #2 COOLING FIN ASSEMBLY &amp; BAFFLE
                    </div>
                    <p className="font-body text-xs text-[#dee2f5] mt-1 leading-relaxed">
                      <strong className="text-amber-300">Anomaly:</strong> Progressive thermal dissipation decay (+14% CHT relative to baseline at 75% throttle). Current CHT: {eng.telemetry.cht}°C.
                    </p>
                    <p className="font-body text-[11px] text-[#b9cacb] mt-1 leading-relaxed">
                      <strong>Directive:</strong> Borescope inspect cowling baffles and thermal dissipation fins at next 50-hour window.
                    </p>
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-center items-end gap-2">
                    <button
                      id="btnAction-8925"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isApproved) approveWorkOrder('8925');
                      }}
                      disabled={isApproved}
                      className={`w-full py-1.5 px-3 rounded font-tactical text-[11px] uppercase font-bold text-center transition-all ${
                        isApproved
                          ? 'bg-[#1a1f2d] border border-[#3b494b]/40 text-[#849495] cursor-not-allowed'
                          : 'bg-amber-500/20 border border-amber-500/60 text-amber-300 hover:bg-amber-500 hover:text-black cursor-pointer'
                      }`}
                    >
                      {isApproved ? 'DISPATCHED' : 'APPROVE WO #8925'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('sensorStream', { engineId: eng.id, component: 'Cylinder #2 Cooling Fin' });
                      }}
                      className="w-full py-1.5 px-3 rounded bg-[#1a1f2d] border border-[#3b494b]/40 text-[#dee2f5] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 font-tactical text-[11px] uppercase text-center transition-all cursor-pointer"
                    >
                      CORROBORATING DATA
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Engine 01 (Routine)
          return (
            <div
              key={eng.id}
              onClick={() => setSelectedEngineId(eng.id)}
              className={`p-4 rounded bg-[#090e1b]/90 border border-[#3b494b]/30 flex flex-col gap-3 relative transition-all ${
                isSelected ? 'ring-1 ring-emerald-400' : ''
              }`}
            >
              <ReticleCorner color="#10b981" size={5} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-headline text-lg text-[#dee2f5] font-bold">
                    {eng.displayId}
                  </span>
                  <span className="font-tactical text-[11px] text-[#b9cacb] uppercase">
                    AIRFRAME: {eng.airframeCallsign}
                  </span>
                  <span className="px-2 py-0.5 rounded font-telemetry text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 tracking-wider uppercase font-bold">
                    NOMINAL // PREVENTIVE
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                    DISPATCH:
                  </span>
                  <span className="px-2 py-0.5 rounded font-telemetry text-[9px] bg-[#252a38] text-[#b9cacb] border border-[#3b494b]/40 uppercase font-bold">
                    SCHEDULED STAGE 4
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#161b29]/60 p-3 rounded border border-[#3b494b]/20">
                <div className="md:col-span-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#3b494b]/20 pb-2 md:pb-0 md:pr-3">
                  <span className="font-telemetry text-[9px] text-[#849495] uppercase">
                    REMAINING USEFUL LIFE
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-telemetry text-2xl text-emerald-400 font-bold">
                      {eng.rulHours}
                    </span>
                    <span className="font-tactical text-[11px] text-[#b9cacb]">
                      HRS
                    </span>
                  </div>
                  <span className="font-telemetry text-[9px] text-emerald-400 uppercase mt-1">
                    FULL CLEARANCE
                  </span>
                </div>

                <div className="md:col-span-6 flex flex-col justify-center">
                  <div className="font-telemetry text-[9px] text-[#00dbe9] uppercase font-semibold">
                    AFFECTED COMPONENT: OIL FILTER &amp; MAGNETO TIMERS
                  </div>
                  <p className="font-body text-xs text-[#dee2f5] mt-1 leading-relaxed">
                    Standard maintenance cycle. Next scheduled interval at 100 flight hours. All systems green.
                  </p>
                  <p className="font-body text-[11px] text-[#b9cacb] mt-1 leading-relaxed">
                    <strong>Directive:</strong> Standard 100-hour oil spectrometry and magneto point inspection.
                  </p>
                </div>

                <div className="md:col-span-3 flex flex-col justify-center items-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast('ENG-01 STATUS', 'Engine 01 is nominal; Stage 4 servicing queued in scheduled MRO depot.', 'check_circle');
                    }}
                    className="w-full py-1.5 px-3 rounded bg-[#252a38]/60 border border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dee2f5] font-tactical text-[11px] uppercase text-center transition-all cursor-pointer"
                  >
                    AUTO-QUEUED
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('sensorStream', { engineId: eng.id, component: 'Cylinder 1-4 Assemblies' });
                    }}
                    className="w-full py-1.5 px-3 rounded bg-[#1a1f2d] border border-[#3b494b]/40 text-[#dee2f5] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 font-tactical text-[11px] uppercase text-center transition-all cursor-pointer"
                  >
                    VIEW SENSORS
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

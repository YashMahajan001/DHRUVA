/**
 * DHRUVAA Interactive Sortie Schedule & Predictive Maintenance Windows Timeline
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Calendar, Ban, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const SortieTimeline: React.FC = () => {
  const { setSelectedEngineId, openModal, showToast } = useMission();

  const timeMarkers = [
    'T+00h',
    'T+06h',
    'T+12h',
    'T+18h [CRIT]',
    'T+24h',
    'T+30h',
    'T+36h',
    'T+42h',
    'T+48h',
    'T+54h',
    'T+60h',
    'T+66h'
  ];

  return (
    <div className="flex flex-col gap-3 bg-[#090e1b]/80 p-4 rounded border border-[#3b494b]/30 relative shadow-[0_0_20px_rgba(0,0,0,0.35)]">
      <ReticleCorner color="#00f0ff" size={6} />

      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#3b494b]/30">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00f0ff]" />
          <h2 className="font-headline text-base sm:text-lg text-[#dee2f5] uppercase tracking-wide font-semibold">
            SORTIE SCHEDULE &amp; PREDICTIVE MAINTENANCE WINDOWS
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[#b9cacb] font-telemetry text-[10px] uppercase flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0053db]" />
            <span>ACTIVE SORTIE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>PREDICTIVE INSPECTION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 animate-pulse" />
            <span>FORCED GROUNDING (OVERHAUL)</span>
          </div>
        </div>
      </div>

      {/* Timeline Grid & Tracks */}
      <div className="flex flex-col gap-2 pt-1 overflow-x-auto">
        {/* Time Axis Markers */}
        <div className="grid grid-cols-12 text-center font-telemetry text-[9px] text-[#849495] uppercase pb-1.5 border-b border-[#3b494b]/20 min-w-[750px]">
          {timeMarkers.map((tm, idx) => (
            <div
              key={idx}
              className={tm.includes('CRIT') ? 'text-red-400 font-bold' : ''}
            >
              {tm}
            </div>
          ))}
        </div>

        {/* Engine 01 Track */}
        <div
          onClick={() => setSelectedEngineId('eng-01')}
          className="grid grid-cols-12 items-center gap-2 min-w-[750px] h-11 hover:bg-[#161b29]/40 rounded p-1 transition-colors cursor-pointer"
        >
          <div className="col-span-2 font-tactical text-[11px] text-[#dee2f5] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ENG-01 (UAV-01)</span>
          </div>
          <div className="col-span-10 relative h-8 bg-[#1a1f2d] rounded flex items-center p-1">
            {/* Sortie Block */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                showToast('SORTIE #771', 'Stratospheric Patrol sortie active. Remaining flight time: 24.0 hours.', 'flight_takeoff');
              }}
              className="h-full w-2/5 bg-[#0053db]/80 hover:bg-[#0053db] transition-colors rounded border border-[#b4c5ff]/40 text-[10px] font-telemetry text-[#dee2f5] px-2.5 flex items-center justify-between shadow-sm"
            >
              <span>SORTIE #771 - PATROL</span>
              <span className="font-bold">24h FLIGHT</span>
            </div>
            {/* Standby buffer */}
            <div className="h-full w-1/4 ml-2 bg-[#252a38]/40 rounded flex items-center justify-center font-telemetry text-[9px] text-[#849495]">
              STANDBY BUFFER
            </div>
            {/* Planned 100h MRO */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                openModal('workOrder', { woId: '8910' });
              }}
              className="h-full w-1/5 ml-auto bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 transition-colors border border-[#00f0ff] text-[#00f0ff] rounded flex items-center justify-center font-telemetry text-[10px] font-bold"
            >
              PLANNED 100H MRO
            </div>
          </div>
        </div>

        {/* Engine 02 Track */}
        <div
          onClick={() => setSelectedEngineId('eng-02')}
          className="grid grid-cols-12 items-center gap-2 min-w-[750px] h-11 hover:bg-[#161b29]/40 rounded p-1 transition-colors cursor-pointer"
        >
          <div className="col-span-2 font-tactical text-[11px] text-[#dee2f5] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>ENG-02 (UAV-02)</span>
          </div>
          <div className="col-span-10 relative h-8 bg-[#1a1f2d] rounded flex items-center p-1">
            {/* Sortie Block */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                showToast('SORTIE #772', 'Cargo Relay flight active. Approaching inspection window at T+4.5H.', 'flight_takeoff');
              }}
              className="h-full w-1/6 bg-[#0053db]/80 rounded border border-[#b4c5ff]/40 text-[10px] font-telemetry text-[#dee2f5] px-2 flex items-center justify-center"
            >
              SORTIE #772
            </div>
            {/* Required Inspection Window before T+50h */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                openModal('workOrder', { woId: '8925' });
              }}
              className="h-full w-1/3 ml-4 bg-amber-500/25 hover:bg-amber-500/35 transition-colors border border-amber-400 text-amber-300 rounded px-2.5 flex items-center justify-between font-telemetry text-[10px] shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
            >
              <span>WO #8925: BAFFLE &amp; FIN INSPECTION</span>
              <span className="font-bold">WINDOW: T+4.5H</span>
            </div>
            {/* Grounded clearance notice */}
            <div className="h-full w-1/4 ml-auto bg-[#252a38]/50 rounded flex items-center justify-center font-telemetry text-[10px] text-[#b9cacb]">
              FLIGHT CLEARANCE PENDING WO
            </div>
          </div>
        </div>

        {/* Engine 03 Track (Immediate Grounding) */}
        <div
          onClick={() => setSelectedEngineId('eng-03')}
          className="grid grid-cols-12 items-center gap-2 min-w-[750px] h-11 hover:bg-[#161b29]/40 rounded p-1 transition-colors cursor-pointer"
        >
          <div className="col-span-2 font-tactical text-[11px] text-[#dee2f5] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>ENG-03 (UAV-03)</span>
          </div>
          <div className="col-span-10 relative h-8 bg-[#1a1f2d] rounded flex items-center p-1">
            {/* Full Grounding Block */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                openModal('airworthiness');
              }}
              className="h-full w-full bg-red-500/25 hover:bg-red-500/35 transition-colors border border-red-500 text-red-400 rounded px-3 flex items-center justify-between font-telemetry text-xs shadow-[inset_0_0_12px_rgba(239,68,68,0.3)] cursor-pointer"
            >
              <span className="font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-red-400" />
                NO-GO FLIGHT HOLD // CRANKSHAFT BEARING REMOVAL ORDER ACTIVE
              </span>
              <span className="font-telemetry text-xs font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                DEPOT RE-FIT REQUIRED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

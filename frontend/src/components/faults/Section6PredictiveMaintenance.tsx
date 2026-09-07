import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  Wrench,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const Section6PredictiveMaintenance: React.FC = () => {
  const { selectedEngine, openModal, showToast } = useDashboard();

  // Dynamic values based on selected engine
  const isEng2 = selectedEngine.id === 'eng-02';
  const isEng3 = selectedEngine.id === 'eng-03';

  const rulHours = selectedEngine.rulHours;
  const nextMaintenance = isEng2
    ? 'Post-Sortie Turnaround / Within 14 Flight Hours'
    : isEng3
      ? 'Immediate Grounding / 0 Flight Hours'
      : 'Scheduled 100-Hour Phase Check / 58 Flight Hours';

  const maintenancePriority = isEng2
    ? 'HIGH (P2 - EXPEDITE INSPECTION)'
    : isEng3
      ? 'CRITICAL (P1 - IMMEDIATE OVERHAUL)'
      : 'ROUTINE (P4 - STANDARD TURNAROUND)';

  const priorityColor = isEng2
    ? 'text-[#b4c5ff] bg-[#303443] border-[#b4c5ff]/50'
    : isEng3
      ? 'text-[#ffdad6] bg-[#93000a] border-[#ef4444]'
      : 'text-[#00f0ff] bg-[#00f0ff]/15 border-[#00f0ff]/40';

  const affectedComponent = isEng2
    ? 'Cylinder #2 Cooling Baffle & Shroud Assembly'
    : isEng3
      ? 'Main Crankshaft Bearing Journal #2'
      : 'None (All Components Nominal)';

  const recommendedMaintenance = isEng2
    ? 'Direct borescope inspection of cylinder baffle and cooling duct seals; re-seat and re-torque acoustic baffle retaining clips.'
    : isEng3
      ? 'Full engine teardown, magnetic particle bearing analysis, and crankcase oil scavenge pump flush.'
      : 'Standard turnaround magneto check and oil level top-up.';

  const lastService = isEng2
    ? '38.5 Flight Hours Ago (100-Hour Scheduled Phase Check)'
    : isEng3
      ? '124.0 Flight Hours Ago'
      : '22.0 Flight Hours Ago';

  const serviceWindow = isEng2
    ? '02:30 UTC - 04:00 UTC (1.5 Hours Ground Time)'
    : isEng3
      ? 'Immediate (Estimated 48 Hours Downtime)'
      : 'Next Scheduled Depot Cycle (4.0 Hours)';

  const confidenceRating = isEng2 ? '94.6% Weibull Reliability' : isEng3 ? '98.2% Acoustic Fatigue' : '99.4% Nominal';

  // Maintenance Timeline steps
  const timelineSteps = [
    {
      label: 'LAST SERVICE',
      sublabel: lastService,
      hours: '-38.5 FH',
      status: 'completed',
      desc: '100-hr phase check passed',
    },
    {
      label: 'CURRENT STATUS',
      sublabel: 'Active Sortie Recon-IV',
      hours: 'NOW (418.6 FH)',
      status: 'active',
      desc: isEng2 ? 'Cyl-2 thermal stress detected' : 'Operating normally',
    },
    {
      label: 'OPTIMAL WINDOW',
      sublabel: 'Post-Sortie Turnaround',
      hours: '+14.0 FH',
      status: 'target',
      desc: 'Borescope inspection window',
    },
    {
      label: 'FATIGUE THRESHOLD',
      sublabel: 'Accelerated Aging Boundary',
      hours: '+32.0 FH',
      status: 'warning',
      desc: 'Thermal wear limit if not derated',
    },
    {
      label: 'CRITICAL RUL LIMIT',
      sublabel: 'Hard Airworthiness Ceiling',
      hours: `+${rulHours.toFixed(1)} FH`,
      status: 'critical',
      desc: 'Maximum allowable flight hours',
    },
  ];

  return (
    <section
      id="section-6-predictive-maintenance"
      className="w-full rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col gap-5"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base tracking-wider text-[#dee2f5] uppercase">
              Predictive Maintenance & Asset Lifecycle
            </h3>
            <p className="font-mono-telemetry text-xs text-[#849495]">
              Weibull Component Degradation Model // Target: {selectedEngine.name} ({selectedEngine.callsign})
            </p>
          </div>
        </div>

        {/* Action Button: Generate Work Order */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              openModal('work-order');
              showToast('Opened DEF-FORM-712 Work Order Dispatch Form.', 'info');
            }}
            className="py-1.5 px-3 rounded-lg bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-mono-telemetry text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>GENERATE WORK ORDER // DEF-712</span>
          </button>
        </div>
      </div>

      {/* 1. KEY METRICS GRID (All 8 exact required fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-telemetry">
        {/* Metric 1: Remaining Useful Life */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">REMAINING USEFUL LIFE (RUL)</span>
          <span className="text-xl font-bold text-[#00f0ff]">{rulHours.toFixed(1)} Flight Hours</span>
          <span className="text-[10px] text-[#7df4ff]">Extension via Derate: +28.0 FH</span>
        </div>

        {/* Metric 2: Next Maintenance */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">NEXT MAINTENANCE</span>
          <span className="text-xs font-bold text-[#dee2f5]">{nextMaintenance}</span>
          <span className="text-[10px] text-[#849495]">Turnaround Action Required</span>
        </div>

        {/* Metric 3: Maintenance Priority */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">MAINTENANCE PRIORITY</span>
          <span className={`text-xs font-bold px-2 py-1 rounded border inline-block w-fit ${priorityColor}`}>
            {maintenancePriority}
          </span>
          <span className="text-[10px] text-[#849495]">Dispatch Level</span>
        </div>

        {/* Metric 4: Confidence */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">CONFIDENCE</span>
          <span className="text-base font-bold text-[#dee2f5]">{confidenceRating}</span>
          <span className="text-[10px] text-[#849495]">Based on 4,200 fleet hours</span>
        </div>

        {/* Metric 5: Affected Component */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">AFFECTED COMPONENT</span>
          <span className="text-xs font-bold text-[#ffb4ab]">{affectedComponent}</span>
          <span className="text-[10px] text-[#849495]">Part Ref: CYL2-SHR-04</span>
        </div>

        {/* Metric 6: Last Service */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">LAST SERVICE</span>
          <span className="text-xs font-bold text-[#dee2f5]">{lastService}</span>
          <span className="text-[10px] text-[#849495]">Base Station AF-North</span>
        </div>

        {/* Metric 7: Estimated Service Window */}
        <div className="sm:col-span-2 rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col justify-between gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">ESTIMATED SERVICE WINDOW</span>
          <span className="text-xs font-bold text-[#dee2f5]">{serviceWindow}</span>
          <span className="text-[10px] text-[#849495]">Technicians: 2 Certified Powerplant Specialists</span>
        </div>

        {/* Metric 8: Recommended Maintenance (Span full width) */}
        <div className="sm:col-span-2 lg:col-span-4 rounded-lg bg-[#0e1320] border border-[#3b494b]/50 p-3.5 flex flex-col gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">RECOMMENDED MAINTENANCE</span>
          <p className="text-xs text-[#dee2f5] leading-relaxed">
            {recommendedMaintenance}
          </p>
        </div>
      </div>

      {/* 2. MAINTENANCE TIMELINE */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#3b494b]/40">
        <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#849495]">
          <span className="font-bold text-[#dee2f5] uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            MAINTENANCE MILESTONE TIMELINE
          </span>
          <span>WEIBULL FATIGUE PROJECTION</span>
        </div>

        {/* Horizontal Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono-telemetry text-xs">
          {timelineSteps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex flex-col justify-between gap-1.5 ${
                step.status === 'completed'
                  ? 'bg-[#0e1320] border-[#3b494b]/40 text-[#849495]'
                  : step.status === 'active'
                    ? 'bg-[#161b29] border-[#00f0ff]/50 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : step.status === 'target'
                      ? 'bg-[#0e1320] border-[#b4c5ff]/50'
                      : step.status === 'warning'
                        ? 'bg-[#0e1320] border-[#b4c5ff]/40'
                        : 'bg-[#0e1320] border-[#ef4444]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#849495] uppercase">{step.label}</span>
                <span
                  className={`text-[10px] font-bold ${
                    step.status === 'active'
                      ? 'text-[#00f0ff]'
                      : step.status === 'critical'
                        ? 'text-[#ffb4ab]'
                        : 'text-[#dee2f5]'
                  }`}
                >
                  {step.hours}
                </span>
              </div>
              <span className="text-xs font-bold text-[#dee2f5]">{step.sublabel}</span>
              <p className="text-[10px] text-[#849495] leading-tight">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

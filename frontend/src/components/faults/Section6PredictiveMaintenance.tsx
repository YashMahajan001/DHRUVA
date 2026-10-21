import React, { useState } from 'react';
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
  const [showExtendedTimeline, setShowExtendedTimeline] = useState(false);

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
      className="w-full rounded-xl border border-[#3b494b]/40 bg-[#161b29]/95 backdrop-blur-md p-4 shadow-xl flex flex-col gap-4"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base tracking-wider text-[#dee2f5] uppercase">
              Predictive Maintenance
            </h3>
            <p className="font-mono text-xs text-[#849495]">
              Target: {selectedEngine?.name || 'ENGINE'} ({selectedEngine?.callsign || 'N/A'})
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
            className="py-1.5 px-3 rounded-lg bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>GENERATE WORK ORDER // DEF-712</span>
          </button>
        </div>
      </div>

      {/* 1. COMPACT ALIGNED METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* RUL */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3 flex flex-col gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">REMAINING USEFUL LIFE</span>
          <span className="text-lg font-bold text-[#00f0ff]">{rulHours.toFixed(1)} Flight Hours</span>
          <span className="text-[10px] text-[#7df4ff]">±3.2 FH Confidence (95% CI)</span>
        </div>

        {/* Priority */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3 flex flex-col gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">MAINTENANCE PRIORITY</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-block w-fit mt-0.5 ${priorityColor}`}>
            {maintenancePriority}
          </span>
          <span className="text-[10px] text-[#849495]">Component: {affectedComponent.split(' ')[0]}</span>
        </div>

        {/* Confidence & Uncertainty */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3 flex flex-col gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">PREDICTION UNCERTAINTY</span>
          <span className="text-sm font-bold text-[#dee2f5]">{confidenceRating}</span>
          <span className="text-[10px] text-[#849495]">Calibrated on 4,200 fleet hrs</span>
        </div>

        {/* Service Window */}
        <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3 flex flex-col gap-1">
          <span className="text-[10px] text-[#849495] uppercase font-bold">RECOMMENDED WINDOW</span>
          <span className="text-xs font-bold text-[#dee2f5] truncate">{nextMaintenance}</span>
          <span className="text-[10px] text-[#849495] truncate">{serviceWindow}</span>
        </div>
      </div>

      {/* 2. RELEVANT RECOMMENDATION BANNER */}
      <div className="rounded-lg bg-[#0e1320] border border-[#3b494b]/40 p-3 flex items-start justify-between gap-3 font-mono text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#10b981] uppercase font-bold">ACTIONABLE RECOMMENDATION</span>
          <p className="text-xs text-[#dee2f5] leading-relaxed">
            {recommendedMaintenance}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExtendedTimeline(!showExtendedTimeline)}
          className="shrink-0 text-xs text-[#00f0ff] hover:text-[#7df4ff] px-2.5 py-1 rounded bg-[#161b29] border border-[#3b494b]/50 transition-colors cursor-pointer"
        >
          {showExtendedTimeline ? '▲ Hide Milestones' : '▼ Timeline Milestones'}
        </button>
      </div>

      {/* 3. COLLAPSIBLE EXTENDED TIMELINE */}
      {showExtendedTimeline && (
        <div className="flex flex-col gap-3 pt-2 border-t border-[#3b494b]/30">
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
      )}
    </section>
  );
};

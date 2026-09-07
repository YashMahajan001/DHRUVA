import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react';

export const SortieFaultTimelineCard: React.FC = () => {
  const {
    scrubProgressPct,
    setScrubProgressPct,
    alerts,
    showToast,
  } = useDashboard();

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    setScrubProgressPct(pct);
  };

  return (
    <div
      id="sortie-fault-timeline-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
          Sortie Fault Timeline
        </span>
        <span className="font-mono-telemetry text-[9px] text-[#b9cacb] bg-[#1a1f2d] px-2 py-0.5 rounded border border-[#3b494b]/30">
          T-MINUS 04:30:00
        </span>
      </div>

      {/* Scrub Bar Track */}
      <div className="relative w-full py-2.5 flex flex-col gap-2">
        <div
          id="timeline-bar"
          onClick={handleTrackClick}
          className="relative w-full h-2.5 bg-[#303443] rounded cursor-pointer group select-none"
          title="Click to scrub sortie timeline"
        >
          {/* Progress bar */}
          <div
            id="scrub-progress"
            className="absolute left-0 top-0 h-full bg-[#00f0ff]/80 rounded transition-all duration-100"
            style={{ width: `${scrubProgressPct}%` }}
          ></div>

          {/* Markers */}
          <div
            className="absolute left-[18%] -top-1 w-1.5 h-4.5 bg-[#00f0ff] rounded cursor-pointer"
            title="T+00:45 Steady climb cruise (CDI Check)"
            onClick={(e) => { e.stopPropagation(); setScrubProgressPct(18); }}
          ></div>
          <div
            className="absolute left-[45%] -top-1 w-1.5 h-4.5 bg-[#7bd0ff] rounded cursor-pointer"
            title="T+02:00 Incline step anomaly (-4.2% residual)"
            onClick={(e) => { e.stopPropagation(); setScrubProgressPct(45); }}
          ></div>
          <div
            className="absolute left-[75%] -top-1.5 w-2 h-5.5 bg-[#b4c5ff] rounded shadow-[0_0_8px_#b4c5ff] cursor-pointer animate-pulse"
            title="T+03:22 Cylinder #2 divergence detected"
            onClick={(e) => { e.stopPropagation(); setScrubProgressPct(75); }}
          ></div>
          <div
            className="absolute left-[88%] -top-1 w-1.5 h-4.5 bg-[#849495] rounded cursor-pointer"
            title="T+04:05 Throttle derate advisory"
            onClick={(e) => { e.stopPropagation(); setScrubProgressPct(88); }}
          ></div>

          {/* Scrubber Head */}
          <div
            id="scrub-head"
            className="absolute -top-2 w-3.5 h-6 bg-[#00f0ff] rounded shadow-[0_0_10px_#00f0ff] -translate-x-1/2 flex items-center justify-center transition-all duration-100 z-10"
            style={{ left: `${scrubProgressPct}%` }}
          >
            <div className="w-0.5 h-3 bg-[#00363a]"></div>
          </div>
        </div>

        {/* Labels under scrubber */}
        <div className="flex justify-between font-mono-telemetry text-[9px] text-[#849495]">
          <span>00:00:00 (TAKEOFF)</span>
          <span>02:15:00</span>
          <span className="text-[#00f0ff] font-semibold">03:22:15 (TRIGGER)</span>
          <span>NOW</span>
        </div>
      </div>

      {/* Timestamp Anomaly List */}
      <div className="flex flex-col gap-1.5 font-mono-telemetry text-xs">
        {/* Anomaly 1 */}
        <div
          onClick={() => {
            setScrubProgressPct(75);
            showToast('Jumped to T+03:22:15 // CHT Spike trigger point.', 'warning');
          }}
          className="p-2 rounded bg-[#1a1f2d]/60 hover:bg-[#252a38] border border-[#3b494b]/20 flex items-start justify-between cursor-pointer transition-colors group"
        >
          <div>
            <div className="text-[#b4c5ff] font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#b4c5ff]" />
              <span>13:50:12 // CHT SPIKE</span>
            </div>
            <div className="text-[#b9cacb] font-sans text-xs mt-0.5 group-hover:text-[#dee2f5]">
              Cyl 2 CHT exceeded 174°C under 82% cruise
            </div>
          </div>
          <span className="font-mono-telemetry text-[9px] text-[#849495] bg-[#090e1b] px-1.5 py-0.5 rounded">
            T+03:22
          </span>
        </div>

        {/* Anomaly 2 */}
        <div
          onClick={() => {
            setScrubProgressPct(45);
            showToast('Jumped to T+02:00 // Model Heat Flux Residual Delta.', 'info');
          }}
          className="p-2 rounded bg-[#1a1f2d]/30 hover:bg-[#252a38] border border-[#3b494b]/20 flex items-start justify-between cursor-pointer transition-colors group"
        >
          <div>
            <div className="text-[#00f0ff] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>12:28:40 // RESIDUAL DELTA</span>
            </div>
            <div className="text-[#b9cacb] font-sans text-xs mt-0.5 group-hover:text-[#dee2f5]">
              Model heat flux residual drifted -4.2%
            </div>
          </div>
          <span className="font-mono-telemetry text-[9px] text-[#849495] bg-[#090e1b] px-1.5 py-0.5 rounded">
            T+02:00
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import { Thermometer, Fuel, Droplets, Gauge } from 'lucide-react';

export const SubsystemMatrixCard: React.FC = () => {
  const { subsystems, selectedEngine, showToast } = useDashboard();

  const getSubsystemIcon = (iconName: string) => {
    switch (iconName) {
      case 'thermostat':
        return <Thermometer className="w-4 h-4 text-[#b4c5ff]" />;
      case 'local_gas_station':
        return <Fuel className="w-4 h-4 text-[#00f0ff]" />;
      case 'oil_barrel':
        return <Droplets className="w-4 h-4 text-[#00f0ff]" />;
      case 'speed':
      default:
        return <Gauge className="w-4 h-4 text-[#00f0ff]" />;
    }
  };

  return (
    <div
      id="subsystem-matrix-card"
      className="bg-[#161b29]/85 backdrop-blur-xl p-3.5 rounded-lg border border-[#3b494b]/30 shadow-lg flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#00f0ff] font-semibold">
          Subsystem Matrix
        </span>
        <span
          id="subsystem-node-id"
          className="font-mono-telemetry text-[9px] text-[#849495] uppercase bg-[#1a1f2d] px-2 py-0.5 rounded border border-[#3b494b]/30"
        >
          {selectedEngine.callsign}
        </span>
      </div>

      {/* Subsystem List */}
      <div id="subsystem-matrix-list" className="flex flex-col gap-1.5">
        {(subsystems || []).map(sub => {
          let statusBadgeClass = 'text-[#00f0ff] bg-[#303443]/50';
          if (sub.status === 'DEGRADED') {
            statusBadgeClass = 'text-[#b4c5ff] bg-[#303443] font-bold shadow-[0_0_8px_rgba(180,197,255,0.2)]';
          } else if (sub.status === 'CRITICAL') {
            statusBadgeClass = 'text-[#ffb4ab] bg-[#93000a] font-bold animate-pulse';
          } else if (sub.status === 'WATCH') {
            statusBadgeClass = 'text-[#7bd0ff] bg-[#303443] font-bold';
          }

          return (
            <div
              key={sub.id}
              onClick={() => showToast(`${sub.name}: ${sub.detail}`, 'info')}
              className="p-2 rounded bg-[#1a1f2d]/70 hover:bg-[#252a38] border border-[#3b494b]/20 flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center p-1 rounded bg-[#090e1b]/60">
                  {getSubsystemIcon(sub.icon)}
                </span>
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-[#dee2f5] font-medium group-hover:text-[#dbfcff]">
                    {sub.name}
                  </span>
                  <span className="font-mono-telemetry text-[9px] text-[#849495] truncate max-w-[170px]">
                    {sub.detail}
                  </span>
                </div>
              </div>

              <span className={`font-mono-telemetry text-[9px] px-2 py-0.5 rounded uppercase tracking-wider ${statusBadgeClass}`}>
                {sub.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

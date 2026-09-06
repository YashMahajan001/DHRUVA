import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Orbit,
  Sliders,
  Radar,
  Wrench,
  Settings,
  Terminal,
} from 'lucide-react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'engine-details', name: 'Engine Details', icon: Cpu, path: '/engine-details' },
  { id: 'fault-diagnostics', name: 'Fault Diagnostics', icon: Activity, path: '/fault-diagnostics' },
  { id: 'mission-simulation', name: 'Mission Simulation', icon: Orbit, path: '/mission-simulation' },
  { id: 'mission-tuning', name: 'Mission Tuning', icon: Sliders, path: '/mission-tuning' },
  { id: 'fleet-monitoring', name: 'Fleet Monitoring', icon: Radar, path: '/fleet-monitoring' },
  { id: 'maintenance', name: 'Maintenance', icon: Wrench, path: '/maintenance' },
];

export const Sidebar: React.FC<{ activeRoute?: string; onNavigate?: (route: string) => void }> = ({
  activeRoute = 'fault-diagnostics',
  onNavigate,
}) => {
  const { isLiveStreaming, showToast } = useDashboard();

  return (
    <aside
      id="tactical-sidebar"
      className="fixed left-0 top-0 h-full w-20 bg-[#090e1b]/95 backdrop-blur-xl border-r border-[#3b494b]/30 z-50 flex flex-col justify-between items-center py-3 select-none"
    >
      {/* Top Emblem */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div
          id="sidebar-emblem"
          className="w-10 h-10 rounded border border-[#00f0ff]/30 bg-[#252a38]/60 flex items-center justify-center cursor-pointer hover:border-[#00f0ff] transition-all"
          title="DHRUVAA Telemetry Core"
          onClick={() => showToast('DHRUVAA Autonomic Kernel: Online. All twin matrices active.', 'info')}
        >
          <Terminal className="w-5 h-5 text-[#00dbe9]" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 items-center w-full px-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                type="button"
                title={item.name}
                onClick={() => {
                  if (onNavigate) onNavigate(item.id);
                  if (item.id !== 'fault-diagnostics' && item.id !== 'dashboard') {
                    showToast(`${item.name} module is locked in sortie-active mission mode. Focusing Main Mission Dashboard.`, 'info');
                  }
                }}
                className={`group relative flex items-center justify-center w-12 h-12 rounded transition-all ${
                  isActive
                    ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5]' : ''}`} />

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-[#1a1f2d] border border-[#3b494b] text-[#dbfcff] font-mono-telemetry text-xs uppercase tracking-wider rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-3 w-full px-1.5">
        <button
          id="nav-settings-btn"
          type="button"
          title="System Configuration"
          onClick={() => showToast('Telemetry Configuration: Sampling 50Hz, Protocol MALE-V4, Baud 115200.', 'info')}
          className="group relative flex items-center justify-center w-12 h-12 rounded text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5] transition-all"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-[#1a1f2d] border border-[#3b494b] text-[#dbfcff] font-mono-telemetry text-xs uppercase tracking-wider rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Settings
          </span>
        </button>

        <div className="w-8 h-[1px] bg-[#3b494b]/30"></div>

        {/* Live TX/RX Beacon */}
        <div
          className="flex flex-col items-center cursor-pointer group"
          title={isLiveStreaming ? 'TX/RX Telemetry: Active Broadcast' : 'TX/RX: Standby'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isLiveStreaming
                ? 'bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]'
                : 'bg-[#849495]'
            }`}
          ></span>
          <span className="font-mono-telemetry text-[9px] text-[#849495] tracking-widest mt-1">TX/RX</span>
        </div>
      </div>
    </aside>
  );
};

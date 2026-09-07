import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Gauge,
  LayoutDashboard,
  Radar,
  Radio,
  Settings,
  Sliders,
  Terminal,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
  isStreamActive: boolean;
  onToggleStream: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isStreamActive,
  onToggleStream,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'engine-details', label: 'Engine Details', icon: Gauge },
    { id: 'fault-diagnostics', label: 'Fault Diagnostics', icon: Activity },
    { id: 'mission-simulation', label: 'Mission Simulation', icon: Cpu },
    { id: 'mission-tuning', label: 'Mission Tuning', icon: Sliders },
    { id: 'fleet-monitoring', label: 'Fleet Monitoring', icon: Radar },
    { id: 'maintenance', label: 'Maintenance (MRO)', icon: Wrench },
  ];

  return (
    <aside
      id="aerospace-sidebar"
      className="fixed left-0 top-0 h-full w-20 bg-[#090e1b]/95 backdrop-blur-xl border-r border-[#3b494b]/30 z-50 flex flex-col justify-between items-center py-3"
    >
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Terminal Emblem Top */}
        <div
          className="w-10 h-10 rounded border border-[#00f0ff]/40 bg-[#252a38]/80 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer hover:border-[#00f0ff] transition-all"
          title="DHRUVAA Core Avionics Terminal"
          onClick={() => onNavigate('dashboard')}
        >
          <Terminal className="w-5 h-5 text-[#00f0ff]" />
        </div>

        {/* Primary Navigation Rail */}
        <nav className="flex flex-col gap-1 items-center w-full px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_14px_rgba(0,240,255,0.45)]'
                      : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                </button>

                {/* Tactical Hover Tooltip */}
                {hoveredTab === item.id && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#dee2f5] border border-[#00f0ff]/40 px-2.5 py-1 rounded text-xs font-mono tracking-wider uppercase z-50 shadow-xl pointer-events-none whitespace-nowrap">
                    {item.label}
                    {item.id !== 'dashboard' && (
                      <span className="ml-1.5 text-[9px] text-[#00f0ff]">[INTEGRATION SPEC]</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Settings, Telemetry Feed Status */}
      <div className="flex flex-col items-center gap-3 w-full px-1">
        <div className="relative group w-full flex justify-center">
          <button
            id="nav-btn-settings"
            onClick={() => onNavigate('settings')}
            className={`flex items-center justify-center w-12 h-12 rounded transition-all ${
              activeTab === 'settings'
                ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
            }`}
            title="Avionics Link & System Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="w-8 h-[1px] bg-[#3b494b]/30"></div>

        {/* Real-time TX/RX Beacon */}
        <button
          onClick={onToggleStream}
          className="flex flex-col items-center p-1 rounded hover:bg-[#1a1f2d] transition-colors cursor-pointer group"
          title={isStreamActive ? 'Telemetry Stream Active (Click to Pause)' : 'Telemetry Stream Paused (Click to Resume)'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isStreamActive
                ? 'bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]'
                : 'bg-[#f59e0b]'
            }`}
          ></span>
          <span className="font-mono text-[9px] text-[#849495] group-hover:text-[#00f0ff] tracking-wider mt-1 font-semibold">
            {isStreamActive ? 'TX/RX' : 'PAUSED'}
          </span>
        </button>
      </div>
    </aside>
  );
};

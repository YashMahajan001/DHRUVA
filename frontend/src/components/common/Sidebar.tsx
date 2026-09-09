import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Cpu,
  Gauge,
  LayoutDashboard,
  Radar,
  Sliders,
  Terminal,
  Wrench,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isStreamActive: boolean;
  onToggleStream: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isStreamActive,
  onToggleStream,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    { path: '/overview', label: 'Executive Overview', icon: BarChart3 },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/engine/eng-01', label: 'Engine Details', icon: Gauge, matchPrefix: '/engine' },
    { path: '/faults', label: 'Fault Diagnostics', icon: Activity },
    { path: '/mission-simulation', label: 'Mission Simulation', icon: Cpu },
    { path: '/mission-tuning', label: 'Mission Tuning', icon: Sliders },
    { path: '/fleet', label: 'Fleet Monitoring', icon: Radar },
    { path: '/maintenance', label: 'Maintenance (MRO)', icon: Wrench },
  ];

  return (
    <aside
      id="aerospace-sidebar"
      className="fixed left-0 top-0 h-full w-20 bg-[#090e1b]/95 backdrop-blur-xl border-r border-[#3b494b]/15 z-50 flex flex-col justify-between items-center py-4"
    >
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Terminal Emblem Top */}
        <div
          className="w-10 h-10 rounded border border-[#00f0ff]/40 bg-[#252a38]/80 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer hover:border-[#00f0ff] transition-all"
          title="DHRUVAA Core Avionics Terminal"
          onClick={() => navigate('/dashboard')}
        >
          <Terminal className="w-5 h-5 text-[#00f0ff]" />
        </div>

        {/* Primary Navigation Rail */}
        <nav className="flex flex-col gap-1 items-center w-full px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.matchPrefix)
              : location.pathname === item.path;

            return (
              <div key={item.path} className="relative group w-full flex justify-center">
                <button
                  id={`nav-btn-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredTab(item.label)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00f0ff] text-[#00363a] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                      : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                </button>

                {hoveredTab === item.label && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#dee2f5] border border-[#00f0ff]/20 px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase z-50 shadow-lg pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Auth gateway button & Telemetry TX/RX Beacon */}
      <div className="flex flex-col items-center gap-3 w-full px-1">
        <div className="relative group w-full flex justify-center">
          <button
            id="nav-btn-security"
            onClick={() => navigate('/login')}
            className={`flex items-center justify-center w-12 h-12 rounded transition-all ${
              location.pathname === '/login'
                ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'text-[#b9cacb] hover:bg-[#1a1f2d] hover:text-[#dee2f5]'
            }`}
            title="Tactical Security Clearance Gateway"
            aria-label="Security"
          >
            <Shield className="w-5 h-5" />
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
          <span className="font-mono text-[10px] text-[#849495] group-hover:text-[#00f0ff] tracking-wider mt-1.5 font-semibold">
            {isStreamActive ? 'TX/RX' : 'PAUSED'}
          </span>
        </button>
      </div>
    </aside>
  );
};

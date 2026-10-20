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
  Radio,
  Wrench,
  Layers,
} from 'lucide-react';

interface DroneSidebarProps {
  isStreamActive?: boolean;
  onToggleStream?: () => void;
}

export const DroneSidebar: React.FC<DroneSidebarProps> = ({
  isStreamActive = true,
  onToggleStream,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const droneNavItems = [
    { path: '/overview', altPath: '/drone/overview', label: 'Executive Overview', icon: BarChart3 },
    { path: '/dashboard', altPath: '/drone/dashboard', label: 'Tactical Dashboard', icon: LayoutDashboard },
    { path: '/engine/eng-01', altPath: '/drone/engine/eng-01', label: 'Engine Details', icon: Gauge, matchPrefix: '/engine' },
    { path: '/faults', altPath: '/drone/faults', label: 'Fault Diagnostics', icon: Activity },
    { path: '/mission-simulation', altPath: '/drone/simulation', label: 'Mission Simulation', icon: Cpu },
    { path: '/mission-tuning', altPath: '/drone/tuning', label: 'Mission Tuning', icon: Sliders },
    { path: '/fleet', altPath: '/drone/fleet', label: 'Fleet Airspace Radar', icon: Radar },
    { path: '/maintenance', altPath: '/drone/maintenance', label: 'Maintenance (MRO)', icon: Wrench },
  ];

  return (
    <aside
      id="drone-sidebar"
      className="hidden md:flex fixed left-3 top-3 bottom-3 w-16 bg-[#090e1b]/95 backdrop-blur-xl border border-[#00f0ff]/20 rounded-2xl z-50 flex-col justify-between items-center py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all"
    >
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Tactical UAV Radio Emblem */}
        <div
          className="w-11 h-11 rounded-xl border border-[#00f0ff]/50 bg-[#161b29] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.35)] cursor-pointer hover:border-[#00f0ff] hover:scale-105 transition-all group"
          title="DHRUVA Drone Core Console (Click for Dashboard)"
          onClick={() => navigate('/dashboard')}
        >
          <Radio className="w-5 h-5 text-[#00f0ff] group-hover:scale-110 transition-transform" />
        </div>

        {/* Primary Drone Navigation Rail */}
        <nav className="flex flex-col gap-1.5 items-center w-full px-1">
          {droneNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.matchPrefix) || location.pathname.includes('/engine')
              : location.pathname === item.path || location.pathname === item.altPath;

            return (
              <div key={item.path} className="relative group w-full flex justify-center">
                <button
                  id={`drone-nav-btn-${item.label.toLowerCase().replace(/[\s\(\)]+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredTab(item.label)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'text-[#b9cacb] hover:bg-[#161b29] hover:text-[#00f0ff] hover:border hover:border-[#00f0ff]/30'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00f0ff] rounded-r-full shadow-[0_0_8px_#00f0ff]" />
                  )}
                </button>

                {hoveredTab === item.label && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#dee2f5] border border-[#00f0ff]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap">
                    <span className="text-[#00f0ff] font-bold">DRONE: </span>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Switch System & Telemetry Link */}
      <div className="flex flex-col items-center gap-3 w-full px-1">
        {/* Switch System Button */}
        <div className="relative group w-full flex justify-center">
          <button
            id="drone-btn-switch-system"
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#161b29] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#090e1b] transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
            title="Switch Engine System (Automotive / Drone / Aeroplane)"
            aria-label="Switch Engine System"
          >
            <Layers className="w-5 h-5" />
          </button>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#00f0ff] border border-[#00f0ff]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            SWITCH SYSTEM
          </div>
        </div>

        <div className="w-8 h-[1px] bg-[#00f0ff]/20" />

        {/* Real-time UAV CAN-Bus Stream Beacon */}
        <button
          onClick={onToggleStream}
          className="flex flex-col items-center p-1.5 rounded-lg hover:bg-[#161b29] transition-colors cursor-pointer group"
          title={isStreamActive ? 'CAN-bus Telemetry Active (Click to Pause)' : 'Telemetry Paused (Click to Resume)'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isStreamActive
                ? 'bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]'
                : 'bg-[#f59e0b]'
            }`}
          />
          <span className="font-mono text-[9px] text-[#849495] group-hover:text-[#00f0ff] tracking-wider mt-1 font-bold">
            {isStreamActive ? 'UAV-TX' : 'PAUSED'}
          </span>
        </button>
      </div>
    </aside>
  );
};

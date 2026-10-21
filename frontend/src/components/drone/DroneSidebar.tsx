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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

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
  const { isExpanded, toggleSidebar } = useSidebar();
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
      className={`hidden md:flex fixed left-3 top-3 bottom-3 ${
        isExpanded ? 'w-64 px-3' : 'w-16 px-1.5'
      } bg-[#090e1b]/95 backdrop-blur-xl border border-[#00f0ff]/20 rounded-2xl z-50 flex-col justify-between py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out motion-reduce:transition-none`}
    >
      {/* Top Header & Navigation Section */}
      <div className="flex flex-col gap-3 w-full">
        {/* Expanded Mode: Header Row with Brand & Dedicated Collapse Toggle */}
        {isExpanded ? (
          <div className="flex items-center justify-between w-full px-1.5 pb-2 border-b border-[#00f0ff]/15">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
              title="DHRUVA Drone Core Console"
            >
              <div className="w-9 h-9 rounded-xl border border-[#00f0ff]/50 bg-[#161b29] flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.35)] group-hover:border-[#00f0ff] transition-all shrink-0">
                <Radio className="w-4 h-4 text-[#00f0ff]" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-bold text-sm text-[#dee2f5] tracking-wider uppercase leading-tight">
                  DHRUVA DRONE
                </span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg bg-[#161b29] border border-[#3b494b]/40 text-[#849495] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Mode: Tactical UAV Emblem + Dedicated Expand Toggle */
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              className="w-11 h-11 rounded-xl border border-[#00f0ff]/50 bg-[#161b29] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.35)] cursor-pointer hover:border-[#00f0ff] hover:scale-105 transition-all group"
              title="DHRUVA Drone Core Console (Click for Dashboard)"
              onClick={() => navigate('/dashboard')}
            >
              <Radio className="w-5 h-5 text-[#00f0ff] group-hover:scale-110 transition-transform" />
            </div>

            {/* Dedicated Expand Button */}
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg bg-[#161b29] border border-[#00f0ff]/30 text-[#849495] hover:text-[#00f0ff] hover:border-[#00f0ff] flex items-center justify-center transition-all cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Drone Navigation Items */}
        <nav className="flex flex-col gap-1 w-full mt-1">
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
                  className={`relative flex items-center ${
                    isExpanded ? 'justify-start px-3 py-2 gap-3 w-full' : 'justify-center w-11 h-11'
                  } rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#00f0ff] text-[#090e1b] font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'text-[#b9cacb] hover:bg-[#161b29] hover:text-[#00f0ff] hover:border hover:border-[#00f0ff]/30'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isExpanded && (
                    <span className="font-sans text-xs font-medium tracking-wide whitespace-nowrap truncate">
                      {item.label}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00f0ff] rounded-r-full shadow-[0_0_8px_#00f0ff]" />
                  )}
                </button>

                {/* Hover Tooltip (Shown in Collapsed Mode) */}
                {!isExpanded && hoveredTab === item.label && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#dee2f5] border border-[#00f0ff]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider z-50 shadow-2xl pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Switch System & Telemetry Link */}
      <div className="flex flex-col gap-2.5 w-full">
        {isExpanded ? (
          /* Expanded Mode: Full Platform Switcher & Live Stream Widget */
          <div className="flex flex-col gap-2 w-full pt-2 border-t border-[#00f0ff]/15">
            {/* Switch Platform Button */}
            <button
              id="drone-btn-switch-system"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl bg-[#161b29] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#090e1b] transition-all cursor-pointer group"
              title="Switch Platform"
              aria-label="Switch Platform"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold leading-tight">Switch Platform</span>
            </button>

            {/* CAN-BUS Stream Status & Pause/Resume Control */}
            <div className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl bg-[#161b29]/80 border border-[#3b494b]/30">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isStreamActive
                      ? 'bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]'
                      : 'bg-[#f59e0b]'
                  }`}
                />
                <span className="font-mono text-[10px] text-[#dee2f5] font-semibold leading-tight">
                  {isStreamActive ? 'CAN-BUS LIVE' : 'STREAM PAUSED'}
                </span>
              </div>

              {onToggleStream && (
                <button
                  onClick={onToggleStream}
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#252a38] hover:bg-[#00f0ff] hover:text-[#090e1b] text-[#00f0ff] transition-all cursor-pointer"
                  title={isStreamActive ? 'Pause CAN-bus Telemetry' : 'Resume CAN-bus Telemetry'}
                >
                  {isStreamActive ? 'PAUSE' : 'RESUME'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Mode: Compact Icon Buttons */
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Switch System Button */}
            <div className="relative group w-full flex justify-center">
              <button
                id="drone-btn-switch-system"
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#161b29] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#090e1b] transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
                title="Switch Engine Platform (Automotive / Drone / Aeroplane)"
                aria-label="Switch Engine Platform"
              >
                <Layers className="w-5 h-5" />
              </button>
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#090e1b] text-[#00f0ff] border border-[#00f0ff]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                SWITCH PLATFORM
              </div>
            </div>

            <div className="w-8 h-[1px] bg-[#00f0ff]/20" />

            {/* Real-time UAV CAN-Bus Stream Beacon */}
            <button
              onClick={onToggleStream}
              className="flex flex-col items-center p-1 rounded-lg hover:bg-[#161b29] transition-colors cursor-pointer group"
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
        )}
      </div>
    </aside>
  );
};

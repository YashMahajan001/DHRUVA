import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gauge,
  Activity,
  Sliders,
  History,
  Plane,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';
import { useAero } from '../../context/AeroContext';
import { useSidebar } from '../../context/SidebarContext';

export const AeroSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggleSidebar } = useSidebar();
  const { currentEngine, diagnostics } = useAero();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const aeroNavItems = [
    {
      path: '/aero/dashboard',
      aliases: ['/aeroplane', '/aeroplane/dashboard', '/aero'],
      label: 'Cockpit Dashboard',
      subtitle: 'Telemetry & KPIs',
      icon: Gauge,
    },
    {
      path: '/aero/analysis',
      aliases: ['/aeroplane/analysis', '/aeroplane/diagnostics', '/aero/diagnostics'],
      label: 'Engine Analysis',
      subtitle: '3D Twin & Faults',
      icon: Activity,
      badge: diagnostics && diagnostics.hypotheses.length > 0 ? diagnostics.hypotheses.length : undefined,
    },
    {
      path: '/aero/simulation',
      aliases: ['/aeroplane/simulation', '/aero/simulation-lab'],
      label: 'Simulation Lab',
      subtitle: 'Scenarios & Delta',
      icon: Sliders,
    },
    {
      path: '/aero/tests',
      aliases: ['/aeroplane/tests', '/aero/history'],
      label: 'Test History',
      subtitle: 'Audit Reports',
      icon: History,
    },
  ];

  const isLinkActive = (item: typeof aeroNavItems[0]) => {
    if (location.pathname === item.path) return true;
    return item.aliases.some((alias) => location.pathname === alias || location.pathname.startsWith(alias + '/'));
  };

  return (
    <aside
      id="aero-sidebar"
      className={`hidden md:flex fixed left-3 top-3 bottom-3 ${
        isExpanded ? 'w-64 px-3' : 'w-16 px-1.5'
      } bg-[#080d1a]/95 backdrop-blur-xl border border-[#38bdf8]/20 rounded-2xl z-50 flex-col justify-between py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out motion-reduce:transition-none`}
    >
      {/* 1. Top Section: Aero Emblem & Navigation */}
      <div className="flex flex-col gap-3 w-full">
        {/* Expanded Mode: Header Row with Brand & Dedicated Collapse Toggle */}
        {isExpanded ? (
          <div className="flex items-center justify-between w-full px-1.5 pb-2 border-b border-[#38bdf8]/20">
            <div
              onClick={() => navigate('/aero/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
              title="DHRUVA Aero Digital Twin (Cockpit)"
            >
              <div className="w-9 h-9 rounded-xl border border-[#38bdf8]/50 bg-[#0f172a] flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.35)] group-hover:border-[#38bdf8] transition-all shrink-0">
                <Plane className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-bold text-sm text-[#dee2f5] tracking-wider uppercase leading-tight">
                  DHRUVA AERO
                </span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg bg-[#0f172a] border border-[#3b494b]/40 text-[#94a3b8] hover:text-[#38bdf8] hover:border-[#38bdf8]/50 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Mode: Supersonic Plane Emblem + Dedicated Expand Toggle */
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              className="w-11 h-11 rounded-xl border border-[#38bdf8]/50 bg-[#0f172a] flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.35)] cursor-pointer hover:border-[#38bdf8] hover:scale-105 transition-all group"
              title="DHRUVA Aero Digital Twin (Cockpit)"
              onClick={() => navigate('/aero/dashboard')}
            >
              <Plane className="w-5 h-5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
            </div>

            {/* Dedicated Expand Button */}
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg bg-[#0f172a] border border-[#38bdf8]/30 text-[#94a3b8] hover:text-[#38bdf8] hover:border-[#38bdf8] flex items-center justify-center transition-all cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Primary Aviation Navigation Items */}
        <nav className="flex flex-col gap-1 w-full mt-1">
          {aeroNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(item);

            return (
              <div key={item.path} className="relative group w-full flex justify-center">
                <button
                  id={`aero-nav-btn-${item.label.toLowerCase().replace(/[\s&]+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredTab(item.label)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center ${
                    isExpanded ? 'justify-start px-3 py-2 gap-3 w-full' : 'justify-center w-11 h-11'
                  } rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-[#38bdf8] to-[#0284c7] text-[#080d1a] font-bold shadow-[0_0_18px_rgba(56,189,248,0.45)]'
                      : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#38bdf8] hover:border hover:border-[#38bdf8]/30'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />

                  {/* Expanded mode text */}
                  {isExpanded && (
                    <div className="flex items-center justify-between min-w-0 flex-1 overflow-hidden text-left">
                      <span className="font-sans text-xs font-semibold tracking-wide whitespace-nowrap truncate">
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#ef4444] text-white font-mono text-[9px] font-bold shrink-0 ml-1.5">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#38bdf8] rounded-r-full shadow-[0_0_8px_#38bdf8]" />
                  )}

                  {/* Collapsed Mode Badge */}
                  {!isExpanded && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-white font-mono text-[9px] flex items-center justify-center font-bold border border-[#080d1a]">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Hover Tooltip in Collapsed Mode */}
                {!isExpanded && hoveredTab === item.label && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#0b1329] text-[#f8fafc] border border-[#38bdf8]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider z-50 shadow-2xl pointer-events-none whitespace-nowrap">
                    <div className="text-[#38bdf8] font-bold">{item.label}</div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Controls: Platform Switcher & Engine Info */}
      <div className="flex flex-col gap-2.5 w-full">
        {isExpanded ? (
          /* Expanded Mode: Full Platform Switcher & Active Engine Details */
          <div className="flex flex-col gap-2 w-full pt-2 border-t border-[#38bdf8]/20">
            {/* Switch Platform Button */}
            <button
              id="aero-btn-switch-system"
              onClick={() => navigate('/select-engine')}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl bg-[#0f172a] border border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#080d1a] transition-all cursor-pointer group"
              title="Switch Platform"
              aria-label="Switch Platform"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold leading-tight">Switch Platform</span>
            </button>

            {/* Active Engine Category Pill Banner */}
            <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl bg-[#0f172a]/90 border border-[#38bdf8]/20">
              <div className="flex items-center gap-2 overflow-hidden">
                <Plane className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-mono text-[10px] text-[#f8fafc] font-semibold truncate leading-tight">
                    {currentEngine?.model_designation || 'CFM LEAP-1B'}
                  </span>
                  <span className="text-[9px] text-[#94a3b8] leading-tight">
                    {currentEngine?.manufacturer || 'Aero Propulsion'}
                  </span>
                </div>
              </div>

              <span className="font-mono text-[9px] font-bold text-[#38bdf8] px-1.5 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 shrink-0">
                {currentEngine?.category || 'AERO'}
              </span>
            </div>
          </div>
        ) : (
          /* Collapsed Mode: Compact Icon Buttons */
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Active Engine Category Pill */}
            <div
              className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#38bdf8]/20 flex flex-col items-center justify-center text-[8px] font-mono text-[#7dd3fc]"
              title={`Active Engine Category: ${currentEngine?.category || 'AERO'}`}
            >
              <span className="font-bold text-[8.5px]">CAT</span>
              <span className="text-[7.5px] text-[#38bdf8] truncate max-w-[34px]">
                {currentEngine ? currentEngine.category.slice(0, 4) : 'AERO'}
              </span>
            </div>

            <div className="w-8 h-[1px] bg-[#38bdf8]/20" />

            {/* Switch Platform Button */}
            <div className="relative group w-full flex justify-center">
              <button
                id="aero-btn-switch-system"
                onClick={() => navigate('/select-engine')}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#0f172a] border border-[#38bdf8]/30 text-[#94a3b8] hover:text-[#38bdf8] hover:border-[#38bdf8] hover:scale-105 transition-all cursor-pointer shadow-md"
                title="Switch Propulsion System (Drone / Aero / Auto)"
                aria-label="Switch Propulsion System"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#0b1329] text-[#38bdf8] border border-[#38bdf8]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                SWITCH PLATFORM
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

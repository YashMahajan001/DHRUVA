import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Sliders,
  History,
  Layers,
  Car,
  Activity,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuto } from '../../context/AutoContext';
import { useSidebar } from '../../context/SidebarContext';

interface AutoSidebarProps {
  isSimulating?: boolean;
  onToggleSimulating?: () => void;
}

export const AutoSidebar: React.FC<AutoSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const { currentEngine, telemetry, anomalies, apiConnected } = useAuto();

  const totalAnomalies = anomalies?.length || 0;

  const autoNavItems = [
    {
      id: 'dashboard',
      paths: ['/auto/dashboard', '/automobile/dashboard'],
      targetPath: '/auto/dashboard',
      label: 'Telemetry Dashboard',
      shortLabel: 'DASHBOARD',
      icon: LayoutDashboard,
      desc: 'Live 3D CAD simulation, sensor telemetry & limits',
      badge: telemetry ? `${Math.round(telemetry.rpm)} RPM` : 'STANDBY',
      badgeColor: '#f59e0b',
    },
    {
      id: 'analysis',
      paths: ['/auto/analysis', '/automobile/analysis', '/automobile/diagnostics', '/automobile/faults'],
      targetPath: '/auto/analysis',
      label: 'Engine Cutaway & Health',
      shortLabel: 'ANALYSIS',
      icon: Cpu,
      desc: '3D Cutaway Digital Twin, fault isolation & RUL',
      badge: totalAnomalies > 0 ? `${totalAnomalies} ALERTS` : 'NOMINAL',
      badgeColor: totalAnomalies > 0 ? '#f43f5e' : '#10b981',
      hasAlert: totalAnomalies > 0,
    },
    {
      id: 'tuning',
      paths: ['/auto/tuning', '/automobile/tuning'],
      targetPath: '/auto/tuning',
      label: 'Dyno Tuning Lab',
      shortLabel: 'TUNING',
      icon: Sliders,
      desc: 'Full-RPM dynamometer sweep & ECU calibration',
      badge: 'DYNO BENCH',
      badgeColor: '#38bdf8',
    },
    {
      id: 'tests',
      paths: ['/auto/tests', '/automobile/tests'],
      targetPath: '/auto/tests',
      label: 'Verification & Reliability',
      shortLabel: 'TEST RUNS',
      icon: History,
      desc: 'Monte Carlo mission scenarios & test history',
      badge: 'VERIFIED',
      badgeColor: '#a855f7',
    },
  ];

  const isLinkActive = (item: (typeof autoNavItems)[0]) => {
    if (item.id === 'dashboard') {
      return (
        location.pathname === '/auto' ||
        location.pathname === '/auto/' ||
        location.pathname === '/automobile' ||
        location.pathname === '/automobile/' ||
        location.pathname === '/auto/dashboard' ||
        location.pathname === '/automobile/dashboard' ||
        location.pathname.startsWith('/auto/dashboard/') ||
        location.pathname.startsWith('/automobile/dashboard/')
      );
    }
    return item.paths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  // Cylinder layout badge (e.g. V8, I6, I4, CRDI)
  const engineBadge = currentEngine
    ? currentEngine.cylinder_configuration.includes('V8')
      ? 'V8'
      : currentEngine.cylinder_configuration.includes('INLINE_6')
      ? 'I-6'
      : currentEngine.fuel_type.includes('HYBRID')
      ? 'HYB'
      : currentEngine.fuel_type.includes('DIESEL')
      ? 'CRDi'
      : 'I-4'
    : 'AUTO';

  return (
    <aside
      id="auto-sidebar"
      className={`hidden md:flex fixed left-3 top-3 bottom-3 ${
        isExpanded ? 'w-64 px-3' : 'w-16 px-1.5'
      } bg-gradient-to-b from-[#090e1b] via-[#070b16] to-[#04070e] backdrop-blur-2xl border border-[#f59e0b]/25 rounded-2xl z-50 flex-col justify-between py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.7)] transition-all duration-300 ease-in-out motion-reduce:transition-none select-none`}
    >
      {/* 1. Top Section: Automotive Emblem & Navigation */}
      <div className="flex flex-col gap-3 w-full">
        {/* Expanded Mode: Header Row with Brand & Dedicated Collapse Toggle */}
        {isExpanded ? (
          <div className="flex items-center justify-between w-full px-1.5 pb-2 border-b border-[#f59e0b]/20">
            <div
              onClick={() => navigate('/auto/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
              title="DHRUVA Auto Engineering Platform"
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b2338] to-[#0c1222] border border-[#f59e0b]/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:border-[#f59e0b] transition-all shrink-0">
                <Car className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-bold text-sm text-[#dee2f5] tracking-wider uppercase leading-tight">
                  DHRUVA AUTO
                </span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg bg-[#121829] border border-[#3b494b]/40 text-[#8fa1a2] hover:text-[#f59e0b] hover:border-[#f59e0b]/50 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Mode: Emblem + Dedicated Expand Toggle */
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              onClick={() => navigate('/auto/dashboard')}
              className="relative group cursor-pointer flex flex-col items-center gap-1"
              title="DHRUVA Auto Engineering Platform"
            >
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#1b2338] to-[#0c1222] border border-[#f59e0b]/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:border-[#f59e0b] group-hover:scale-105 transition-all">
                <Car className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="px-1 py-0.2 rounded text-[7.5px] font-mono font-bold tracking-wider bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                AUTO
              </span>
            </div>

            {/* Dedicated Expand Button */}
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg bg-[#121829] border border-[#f59e0b]/30 text-[#8fa1a2] hover:text-[#f59e0b] hover:border-[#f59e0b] flex items-center justify-center transition-all cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Primary Automotive Navigation Items */}
        <nav className="flex flex-col gap-1 w-full mt-1">
          {autoNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(item);

            return (
              <div
                key={item.id}
                className="relative group w-full flex justify-center"
                onMouseEnter={() => setHoveredTabId(item.id)}
                onMouseLeave={() => setHoveredTabId(null)}
              >
                <button
                  id={`auto-nav-btn-${item.id}`}
                  onClick={() => navigate(item.targetPath)}
                  className={`relative flex items-center ${
                    isExpanded ? 'justify-start px-3 py-2 gap-3 w-full' : 'justify-center w-11 h-11'
                  } rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-[#090e1b] font-bold shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                      : 'bg-[#121829]/60 border border-[#3b494b]/30 text-[#8fa1a2] hover:bg-[#1a233a] hover:text-[#f59e0b] hover:border-[#f59e0b]/40'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                      isActive ? 'stroke-[2.4]' : 'group-hover:scale-110'
                    }`}
                  />

                  {/* Expanded mode text */}
                  {isExpanded && (
                    <div className="flex items-center justify-between min-w-0 flex-1 overflow-hidden text-left">
                      <span className="font-sans text-xs font-semibold tracking-wide whitespace-nowrap truncate">
                        {item.label}
                      </span>
                      <span
                        className="px-1.5 py-0.2 rounded text-[8px] font-bold border shrink-0 ml-1.5"
                        style={{
                          backgroundColor: isActive ? '#090e1b' : `${item.badgeColor}15`,
                          borderColor: isActive ? '#090e1b' : `${item.badgeColor}40`,
                          color: isActive ? '#f59e0b' : item.badgeColor,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Active Left Indicator Bar */}
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#f59e0b] rounded-r-full shadow-[0_0_10px_#f59e0b]" />
                  )}

                  {/* Alert Ping Indicator */}
                  {item.hasAlert && !isActive && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
                    </span>
                  )}
                </button>

                {/* Collapsed Mode Hover Tooltip */}
                {!isExpanded && hoveredTabId === item.id && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#090e1b]/95 backdrop-blur-2xl text-[#dee2f5] border border-[#f59e0b]/40 px-3.5 py-2 rounded-xl text-xs font-mono z-50 shadow-[0_12px_35px_rgba(0,0,0,0.85)] pointer-events-none whitespace-nowrap min-w-[190px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[#f59e0b] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
                        {item.shortLabel}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold border"
                        style={{
                          backgroundColor: `${item.badgeColor}15`,
                          borderColor: `${item.badgeColor}40`,
                          color: item.badgeColor,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-sans font-medium text-[#dee2f5]">
                      {item.label}
                    </div>
                    <div className="text-[9.5px] text-[#849495] mt-0.5 font-mono">
                      {item.desc}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Controls: Engine Platform Switcher & Telemetry Status */}
      <div className="flex flex-col gap-2.5 w-full">
        {isExpanded ? (
          /* Expanded Mode: Full Platform Switcher & Active Powertrain Details */
          <div className="flex flex-col gap-2 w-full pt-2 border-t border-[#f59e0b]/20">
            {/* Switch Platform Button */}
            <button
              id="auto-btn-switch-system"
              onClick={() => navigate('/select-engine')}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl bg-[#121829] border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] transition-all cursor-pointer group"
              title="Switch to Drone / Aircraft Propulsion Domains"
              aria-label="Switch Platform"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold leading-tight">Switch Platform</span>
            </button>

            {/* Powertrain Sync Status Banner */}
            <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl bg-[#0e1322]/80 border border-[#3b494b]/30">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    !apiConnected
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      : 'bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]'
                  }`}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#dee2f5] font-semibold leading-tight">
                    {apiConnected ? 'TELEMETRY SYNCED' : 'OFFLINE / STANDBY'}
                  </span>
                  <span className="text-[9px] text-[#849495] leading-tight">
                    {currentEngine?.name || 'Automotive Engine'}
                  </span>
                </div>
              </div>

              <span className="font-mono text-[9px] font-bold text-[#f59e0b] px-1.5 py-0.5 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/30">
                {engineBadge}
              </span>
            </div>
          </div>
        ) : (
          /* Collapsed Mode: Compact Icon Controls */
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Switch Platform Icon Button */}
            <div className="relative group w-full flex justify-center">
              <button
                id="auto-btn-switch-system"
                onClick={() => navigate('/select-engine')}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#121829] border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
                title="Switch to Drone / Aircraft Propulsion Domains"
                aria-label="Switch Engine Propulsion Domain"
              >
                <Layers className="w-5 h-5" />
              </button>

              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#090e1b]/95 backdrop-blur-2xl text-[#f59e0b] border border-[#f59e0b]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                SWITCH PLATFORM
              </div>
            </div>

            <div className="w-8 h-[1px] bg-[#f59e0b]/20" />

            {/* Powertrain Status Beacon */}
            <div
              className="flex flex-col items-center px-1.5 py-1 rounded-lg bg-[#0e1322]/80 border border-[#3b494b]/30 w-full"
              title={apiConnected ? 'Real-time Telemetry Pipeline Active' : 'Offline / Standby'}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    !apiConnected
                      ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                      : 'bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]'
                  }`}
                />
                <span className="font-mono text-[8px] font-bold text-[#b9cacb] uppercase">
                  {apiConnected ? 'SYNC' : 'DISC'}
                </span>
              </div>
              <span className="font-mono text-[7.5px] font-bold text-[#f59e0b] mt-0.5 tracking-wider">
                {engineBadge}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

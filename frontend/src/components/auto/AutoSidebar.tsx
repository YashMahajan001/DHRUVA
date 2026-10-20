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
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuto } from '../../context/AutoContext';

interface AutoSidebarProps {
  isSimulating?: boolean;
  onToggleSimulating?: () => void;
}

export const AutoSidebar: React.FC<AutoSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-gradient-to-b from-[#090e1b] via-[#070b16] to-[#04070e] backdrop-blur-2xl border-r border-[#f59e0b]/25 z-50 flex-col justify-between items-center py-4 shadow-[6px_0_35px_rgba(0,0,0,0.7)] transition-all select-none"
    >
      {/* 1. Top Section: Automotive Emblem & Domain Badge */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          onClick={() => navigate('/auto/dashboard')}
          className="relative group cursor-pointer flex flex-col items-center gap-1.5"
          title="DHRUVA Auto Engineering Platform"
        >
          {/* Hexagonal/Rounded Ambient Icon Container */}
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b2338] to-[#0c1222] border border-[#f59e0b]/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:border-[#f59e0b] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-all duration-300">
            {/* Ambient Corner Accents */}
            <span className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#f59e0b]/70" />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#f59e0b]/70" />
            <Car className="w-6 h-6 text-[#f59e0b] group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </div>

          {/* Domain Pill Badge */}
          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            AUTO
          </span>
        </div>

        {/* Subtle Horizontal Amber Divider */}
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-[#f59e0b]/35 to-transparent my-1" />

        {/* 2. Primary Automotive Navigation Rail */}
        <nav className="flex flex-col gap-2.5 items-center w-full px-2">
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
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-[#090e1b] font-bold shadow-[0_0_22px_rgba(245,158,11,0.55)] scale-105'
                      : 'bg-[#121829]/60 border border-[#3b494b]/30 text-[#8fa1a2] hover:bg-[#1a233a] hover:text-[#f59e0b] hover:border-[#f59e0b]/40 hover:scale-105 active:scale-95'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'stroke-[2.4]' : 'group-hover:scale-110'
                    }`}
                  />

                  {/* Active Left Indicator Bar */}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#f59e0b] rounded-r-full shadow-[0_0_12px_#f59e0b]" />
                  )}

                  {/* Alert Ping Indicator for Analysis/Diagnostics */}
                  {item.hasAlert && !isActive && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                    </span>
                  )}
                </button>

                {/* Luxury Glassmorphic Tooltip Card */}
                {hoveredTabId === item.id && (
                  <div className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-[#090e1b]/95 backdrop-blur-2xl text-[#dee2f5] border border-[#f59e0b]/40 px-3.5 py-2.5 rounded-xl text-xs font-mono z-50 shadow-[0_12px_35px_rgba(0,0,0,0.85)] pointer-events-none whitespace-nowrap min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
                    {/* Left Caret Arrow */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#090e1b] border-l border-b border-[#f59e0b]/40 rotate-45" />

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

      {/* 3. Bottom Controls: Engine Domain Switcher & Telemetry Telemetry Beacon */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Subtle Horizontal Amber Divider */}
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-[#f59e0b]/35 to-transparent" />

        {/* Engine Domain Switcher Button */}
        <div className="relative group w-full flex justify-center">
          <button
            id="auto-btn-switch-system"
            onClick={() => navigate('/select-engine')}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#121829] border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Switch to Drone / Aircraft Propulsion Domains"
            aria-label="Switch Engine Propulsion Domain"
          >
            <Layers className="w-5 h-5 transition-transform group-hover:rotate-12" />
          </button>

          {/* Switch System Tooltip */}
          <div className="absolute left-[68px] top-1/2 -translate-y-1/2 bg-[#090e1b]/95 backdrop-blur-2xl text-[#f59e0b] border border-[#f59e0b]/40 px-3 py-2 rounded-xl text-xs font-mono tracking-wider uppercase z-50 shadow-[0_12px_35px_rgba(0,0,0,0.85)] pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity min-w-[170px]">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#090e1b] border-l border-b border-[#f59e0b]/40 rotate-45" />
            <div className="font-bold text-[10px] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#f59e0b]" />
              PROPULSION DOMAINS
            </div>
            <div className="text-[9px] text-[#849495] mt-0.5 normal-case font-mono">
              Switch to Drone or Aeroplane
            </div>
          </div>
        </div>

        {/* Live Synchronized Telemetry Status Beacon */}
        <div
          className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-[#0e1322]/80 border border-[#3b494b]/30 w-full"
          title={apiConnected ? 'Real-time Telemetry Pipeline Active' : 'Offline / Standby'}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                !apiConnected
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]'
              }`}
            />
            <span className="font-mono text-[8px] font-bold text-[#b9cacb] uppercase">
              {apiConnected ? 'SYNC' : 'DISC'}
            </span>
          </div>

          <span className="font-mono text-[7.5px] font-black text-[#f59e0b] mt-0.5 tracking-wider">
            {engineBadge}
          </span>
        </div>
      </div>
    </aside>
  );
};

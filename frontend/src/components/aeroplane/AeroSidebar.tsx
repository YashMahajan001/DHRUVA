import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gauge,
  Activity,
  Sliders,
  History,
  ArrowLeftRight,
  Plane,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAero } from '../../context/AeroContext';

export const AeroSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-[#080d1a]/95 backdrop-blur-xl border-r border-[#38bdf8]/20 z-50 flex-col justify-between items-center py-4 shadow-[4px_0_24px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Supersonic Plane Emblem */}
        <div
          className="w-11 h-11 rounded-xl border border-[#38bdf8]/50 bg-[#0f172a] flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.35)] cursor-pointer hover:border-[#38bdf8] hover:scale-105 transition-all group"
          title="DHRUVA Aero Digital Twin (Cockpit)"
          onClick={() => navigate('/aero/dashboard')}
        >
          <Plane className="w-5 h-5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
        </div>

        {/* Primary Aviation Navigation Rail */}
        <nav className="flex flex-col gap-2 items-center w-full px-2">
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
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-[#38bdf8] to-[#0284c7] text-[#080d1a] font-bold shadow-[0_0_18px_rgba(56,189,248,0.45)]'
                      : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#38bdf8] hover:border hover:border-[#38bdf8]/30'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#38bdf8] rounded-r-full shadow-[0_0_8px_#38bdf8]" />
                  )}

                  {/* Notification Badge */}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-white font-mono text-[9px] flex items-center justify-center font-bold border border-[#080d1a]">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Hover Tooltip */}
                {hoveredTab === item.label && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0b1329] text-[#f8fafc] border border-[#38bdf8]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap">
                    <div className="text-[#38bdf8] font-bold">{item.label}</div>
                    <div className="text-[10px] text-[#94a3b8] normal-case">{item.subtitle}</div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Switch Platform & Category Badge */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Active Engine Category Pill */}
        <div
          className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#38bdf8]/20 flex flex-col items-center justify-center text-[8px] font-mono text-[#7dd3fc]"
          title={`Active Engine Category: ${currentEngine?.category || 'AERO'}`}
        >
          <span className="font-bold text-[9px]">CAT</span>
          <span className="text-[8px] text-[#38bdf8] truncate max-w-[34px]">
            {currentEngine ? currentEngine.category.slice(0, 4) : 'AERO'}
          </span>
        </div>

        {/* Switch Platform Button */}
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigate('/select-engine')}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#0f172a] border border-[#38bdf8]/30 text-[#94a3b8] hover:text-[#38bdf8] hover:border-[#38bdf8] hover:scale-105 transition-all cursor-pointer shadow-md"
            title="Switch Propulsion System (Drone / Aero / Auto)"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plane,
  Gauge,
  Activity,
  Sliders,
  Radar,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface AeroplaneSidebarProps {
  isStreamActive?: boolean;
  onToggleStream?: () => void;
}

export const AeroplaneSidebar: React.FC<AeroplaneSidebarProps> = ({
  isStreamActive = true,
  onToggleStream,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const aeroNavItems = [
    { path: '/aeroplane', label: 'Turbofan Cockpit', icon: Plane },
    { path: '/aeroplane/telemetry', label: 'Turbofan Telemetry', icon: Gauge },
    { path: '/aeroplane/diagnostics', label: 'FADEC Diagnostics', icon: Activity },
    { path: '/aeroplane/simulation', label: 'Flight Envelope', icon: Sliders },
    { path: '/aeroplane/fleet', label: 'Airspace Fleet Radar', icon: Radar },
    { path: '/aeroplane/maintenance', label: 'Airworthiness & MRO', icon: ShieldCheck },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/aeroplane') {
      return location.pathname === '/aeroplane' || location.pathname === '/aeroplane/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <aside
      id="aeroplane-sidebar"
      className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-[#080d1a]/95 backdrop-blur-xl border-r border-[#38bdf8]/20 z-50 flex-col justify-between items-center py-4 shadow-[4px_0_20px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Supersonic Plane Emblem */}
        <div
          className="w-11 h-11 rounded-xl border border-[#38bdf8]/50 bg-[#101828] flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.35)] cursor-pointer hover:border-[#38bdf8] hover:scale-105 transition-all group"
          title="DHRUVA Aviation Console (Click for Cockpit)"
          onClick={() => navigate('/aeroplane')}
        >
          <Plane className="w-5 h-5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
        </div>

        {/* Primary Aviation Navigation Rail */}
        <nav className="flex flex-col gap-1.5 items-center w-full px-1">
          {aeroNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(item.path);

            return (
              <div key={item.path} className="relative group w-full flex justify-center">
                <button
                  id={`aero-nav-btn-${item.label.toLowerCase().replace(/[\s&]+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredTab(item.label)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#38bdf8] text-[#080d1a] font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                      : 'text-[#b9cacb] hover:bg-[#101828] hover:text-[#38bdf8] hover:border hover:border-[#38bdf8]/30'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#38bdf8] rounded-r-full shadow-[0_0_8px_#38bdf8]" />
                  )}
                </button>

                {hoveredTab === item.label && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#080d1a] text-[#dee2f5] border border-[#38bdf8]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap">
                    <span className="text-[#38bdf8] font-bold">AERO: </span>
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
            id="aero-btn-switch-system"
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#101828] border border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#080d1a] transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] cursor-pointer"
            title="Switch Engine System (Automotive / Drone / Aeroplane)"
            aria-label="Switch Engine System"
          >
            <Layers className="w-5 h-5" />
          </button>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#080d1a] text-[#38bdf8] border border-[#38bdf8]/40 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase z-50 shadow-2xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            SWITCH SYSTEM
          </div>
        </div>

        <div className="w-8 h-[1px] bg-[#38bdf8]/20" />

        {/* Real-time FADEC Stream Beacon */}
        <button
          onClick={onToggleStream}
          className="flex flex-col items-center p-1.5 rounded-lg hover:bg-[#101828] transition-colors cursor-pointer group"
          title={isStreamActive ? 'FADEC Telemetry Stream Active (Click to Pause)' : 'FADEC Telemetry Paused'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isStreamActive
                ? 'bg-[#38bdf8] animate-pulse shadow-[0_0_10px_#38bdf8]'
                : 'bg-[#64748b]'
            }`}
          />
          <span className="font-mono text-[9px] text-[#849495] group-hover:text-[#38bdf8] tracking-wider mt-1 font-bold">
            {isStreamActive ? 'FADEC-TX' : 'PAUSED'}
          </span>
        </button>
      </div>
    </aside>
  );
};

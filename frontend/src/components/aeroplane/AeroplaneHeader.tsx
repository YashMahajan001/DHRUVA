import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plane,
  Bell,
  Clock,
  Layers,
  Menu,
  X,
  Gauge,
  Sliders,
  Activity,
  ShieldCheck,
  Radar,
  User,
  LogOut,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AeroplaneHeaderProps {
  selectedAeroEngine?: string;
  onSelectAeroEngine?: (engineId: string) => void;
  activeAnomaliesCount?: number;
}

export const AeroplaneHeader: React.FC<AeroplaneHeaderProps> = ({
  selectedAeroEngine = 'CFM56-7B-TURBOFAN',
  onSelectAeroEngine,
  activeAnomaliesCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [currentEngine, setCurrentEngine] = useState<string>(selectedAeroEngine);

  const aeroEngineOptions = [
    { id: 'CFM56-7B-TURBOFAN', name: 'CFM56-7B High-Bypass Turbofan (27,300 lbf)' },
    { id: 'AE300-CLASS', name: 'Austro AE300 Jet-A Turboprop (170 HP)' },
    { id: 'O320-CLASS', name: 'Lycoming O-320 Aviation Piston (100 HP)' },
  ];

  useEffect(() => {
    setCurrentEngine(selectedAeroEngine);
  }, [selectedAeroEngine]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`UTC ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const aeroNavLinks = [
    { path: '/aeroplane', label: 'Turbofan Cockpit', icon: Plane },
    { path: '/aeroplane/telemetry', label: 'Turbofan Telemetry', icon: Gauge },
    { path: '/aeroplane/diagnostics', label: 'FADEC Diagnostics', icon: Activity },
    { path: '/aeroplane/simulation', label: 'Flight Envelope', icon: Sliders },
    { path: '/aeroplane/fleet', label: 'Airspace Radar', icon: Radar },
    { path: '/aeroplane/maintenance', label: 'Airworthiness & MRO', icon: ShieldCheck },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/aeroplane') {
      return location.pathname === '/aeroplane' || location.pathname === '/aeroplane/dashboard';
    }
    return location.pathname === path;
  };

  const handleEngineChange = (engineId: string) => {
    setCurrentEngine(engineId);
    if (onSelectAeroEngine) {
      onSelectAeroEngine(engineId);
    }
    window.dispatchEvent(new CustomEvent('dhruva-aero-engine-change', { detail: { engineId } }));
  };

  return (
    <>
      <header
        id="aeroplane-header"
        className="fixed top-0 left-0 md:left-20 right-0 h-16 bg-[#080d1a]/95 backdrop-blur-xl border-b border-[#38bdf8]/25 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-[0_4px_25px_rgba(56,189,248,0.1)]"
      >
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="aero-mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg lg:hidden text-[#b9cacb] hover:text-[#38bdf8] hover:bg-[#161b29] border border-[#38bdf8]/30 transition-colors"
            title="Toggle Aeroplane Navigation Menu"
            aria-label="Toggle Aeroplane Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#38bdf8]" /> : <Menu className="w-5 h-5 text-[#38bdf8]" />}
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => navigate('/aeroplane')}
            title="DHRUVA Commercial & Defense Aviation Console"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#080d1a] rounded-[6px] flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#38bdf8]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
                  DHRUVA AEROPLANE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40">
                  AVIATION TWIN
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#849495] tracking-widest uppercase">
                Turbofan Propulsion Deck
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block" />

          {/* Aviation Engine Selector & Flight Envelope Badge */}
          <div className="hidden xl:flex items-center gap-2">
            <select
              id="aero-header-engine-select"
              value={currentEngine}
              onChange={(e) => handleEngineChange(e.target.value)}
              className="bg-[#101828] border border-[#38bdf8]/40 hover:border-[#38bdf8] text-[#dee2f5] font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none transition-colors cursor-pointer"
            >
              {aeroEngineOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>

            <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-[#38bdf8]" />
              <span>FL350 // M 0.82</span>
            </span>

            <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              FADEC CH-A/B
            </span>
          </div>
        </div>

        {/* Aeroplane Horizontal Navigation (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Switch System Button */}
          <button
            id="aero-btn-switch-platform"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.15)]"
            title="Switch System (Automotive / Drone / Aeroplane)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-bold">SWITCH SYSTEM</span>
          </button>

          <nav
            id="aero-header-nav"
            className="flex items-center gap-1 px-1.5 py-1 bg-[#101828]/90 rounded-lg border border-[#38bdf8]/20"
          >
            {aeroNavLinks.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <button
                  key={item.path}
                  id={`aero-tab-${item.label.toLowerCase().replace(/[\s&]+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'text-[#080d1a] bg-[#38bdf8] font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                      : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#1a2333]/70'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Flight Deck Security & Captain Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Safety / Excursion Bell */}
          <button
            id="aero-btn-alerts"
            onClick={() => navigate('/aeroplane/diagnostics')}
            className="relative p-2 rounded-lg bg-[#101828] hover:bg-[#1e293b] border border-[#38bdf8]/30 text-[#b9cacb] hover:text-[#38bdf8] transition-all cursor-pointer"
            title={`${activeAnomaliesCount} Aviation Excursions / Alerts`}
            type="button"
          >
            <Bell className="w-4 h-4 text-[#dee2f5]" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1 font-mono text-[9px] bg-[#ef4444] text-white border border-[#ef4444]/60 px-1 rounded-full font-bold animate-pulse">
                {activeAnomaliesCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-[#3b494b]/30 hidden sm:block" />

          {/* Captain Profile */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right hidden sm:flex leading-tight">
              <span className="font-mono text-xs text-[#dee2f5] font-semibold tracking-wide truncate max-w-[130px]">
                CAPT. A. MEHTA
              </span>
              <span className="font-mono text-[9px] text-[#38bdf8] uppercase tracking-wider">
                FLIGHT TEST
              </span>
            </div>

            <div
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.25)] cursor-pointer hover:bg-[#38bdf8] hover:text-[#080d1a] transition-all"
              title="Aviation Flight Test Pilot"
            >
              <User className="w-4 h-4" />
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Return to System Selection"
                className="p-1.5 rounded text-[#849495] hover:text-[#ffb4ab] transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/80 backdrop-blur-md lg:hidden flex flex-col"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-[#080d1a] border-b border-[#38bdf8]/40 p-4 shadow-2xl flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30 text-xs font-mono text-[#849495]">
              <span className="text-[#38bdf8] font-bold">AEROPLANE COCKPIT NAVIGATION</span>
              <span>{utcTime}</span>
            </div>

            <button
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/50 text-[#38bdf8] font-mono text-xs uppercase tracking-wider flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-bold">SWITCH ENGINE SYSTEM</span>
              </div>
              <span className="text-[10px] text-[#849495]">ALL 3 SYSTEMS</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {aeroNavLinks.map((item) => {
                const active = isLinkActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg text-left flex items-center justify-between transition-all ${
                      active
                        ? 'text-[#080d1a] bg-[#38bdf8] font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                        : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#101828]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#080d1a]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

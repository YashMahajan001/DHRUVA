import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  Radio,
  Layers,
  Menu,
  X,
  User,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEngine } from '../../context/EngineContext';

interface DroneHeaderProps {
  unreadAlertsCount?: number;
  onOpenAlerts?: () => void;
}

export const DroneHeader: React.FC<DroneHeaderProps> = ({
  unreadAlertsCount = 0,
  onOpenAlerts,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { operatorId, clearanceLevel, logout, isAuthenticated } = useAuth();
  const { isStreamActive, toggleStream } = useEngine();
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  const droneNavLinks = [
    { path: '/overview', altPath: '/drone/overview', label: 'Overview' },
    { path: '/dashboard', altPath: '/drone/dashboard', label: 'Dashboard' },
    { path: '/engine/eng-01', altPath: '/drone/engine/eng-01', label: 'Engine Details', matchPrefix: '/engine' },
    { path: '/faults', altPath: '/drone/faults', label: 'Diagnostics' },
    { path: '/mission-simulation', altPath: '/drone/simulation', label: 'Mission Sim' },
    { path: '/mission-tuning', altPath: '/drone/tuning', label: 'Tuning' },
    { path: '/fleet', altPath: '/drone/fleet', label: 'Fleet Radar' },
    { path: '/maintenance', altPath: '/drone/maintenance', label: 'Maintenance' },
  ];

  const isLinkActive = (item: typeof droneNavLinks[0]) => {
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix) || location.pathname.includes('/engine');
    }
    return location.pathname === item.path || location.pathname === item.altPath;
  };

  return (
    <>
      <header
        id="drone-header"
        className="fixed top-0 left-0 md:left-20 right-0 h-16 bg-[#090e1b]/95 backdrop-blur-xl border-b border-[#00f0ff]/20 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
      >
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="drone-mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded lg:hidden text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#161b29] border border-[#00f0ff]/30 transition-colors"
            title="Toggle Drone Navigation Menu"
            aria-label="Toggle Drone Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#00f0ff]" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
            title="DHRUVA UAV Drone Console"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0053db] p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090e1b] rounded-[6px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
                  DHRUVA DRONE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                  UAV TWIN
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#849495] tracking-widest uppercase">
                Tactical Propulsion System
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block" />

          {/* UTC Clock & Telemetry Status */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#b9cacb] bg-[#161b29]/80 px-2.5 py-1 rounded border border-[#3b494b]/20">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>{utcTime || 'UTC 12:00:00'}</span>
            </div>
            <div
              onClick={toggleStream}
              className={`flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold border cursor-pointer transition-all ${
                isStreamActive
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                  : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40'
              }`}
              title="Click to toggle Drone Telemetry link"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isStreamActive ? 'bg-[#10b981] animate-ping' : 'bg-[#f59e0b]'}`} />
              <span>{isStreamActive ? 'CAN-BUS ONLINE' : 'STREAM PAUSED'}</span>
            </div>
          </div>
        </div>

        {/* Drone Horizontal Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Switch System Button */}
          <button
            id="drone-btn-switch-platform"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.15)]"
            title="Switch System (Automotive / Drone / Aeroplane)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-bold">SWITCH SYSTEM</span>
          </button>

          <nav
            id="drone-header-nav"
            className="flex items-center gap-1 px-1.5 py-1 bg-[#161b29]/80 rounded-lg border border-[#3b494b]/30"
          >
            {droneNavLinks.map((item) => {
              const active = isLinkActive(item);
              return (
                <button
                  key={item.path}
                  id={`drone-tab-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`px-2.5 py-1 font-mono text-xs uppercase tracking-wider rounded transition-all whitespace-nowrap ${
                    active
                      ? 'text-[#090e1b] bg-[#00f0ff] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#1a1f2d]/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Flight Deck Security & Operator Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Anomaly Alerts Bell */}
          <button
            id="drone-btn-alerts"
            onClick={onOpenAlerts || (() => navigate('/faults'))}
            className="relative p-2 rounded-lg bg-[#161b29] hover:bg-[#252a38] border border-[#00f0ff]/30 text-[#b9cacb] hover:text-[#00f0ff] transition-all cursor-pointer"
            title={`${unreadAlertsCount} Active UAV Anomalies`}
            type="button"
          >
            <Bell className="w-4 h-4 text-[#dee2f5]" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 font-mono text-[9px] bg-[#ef4444] text-white border border-[#ef4444]/60 px-1 rounded-full font-bold animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-[#3b494b]/30 hidden sm:block" />

          {/* UAV Operator Badge */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right hidden sm:flex leading-tight">
              <span className="font-mono text-xs text-[#dee2f5] font-semibold tracking-wide truncate max-w-[130px]">
                {operatorId ? operatorId.replace(/\s*\[.*\]/, '') : 'CDR. V. SHASTRI'}
              </span>
              <span className="font-mono text-[9px] text-[#00f0ff] uppercase tracking-wider">
                UAV CONTROLLER
              </span>
            </div>

            <div
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer hover:bg-[#00f0ff] hover:text-[#090e1b] transition-all"
              title="Drone Flight Deck Controller"
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
          className="fixed inset-0 top-16 z-30 bg-black/75 backdrop-blur-md lg:hidden flex flex-col"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-[#090e1b] border-b border-[#00f0ff]/30 p-4 shadow-2xl flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30 text-xs font-mono text-[#849495]">
              <span className="text-[#00f0ff] font-bold">DRONE TACTICAL NAVIGATION</span>
              <span>{utcTime}</span>
            </div>

            <button
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/50 text-[#00f0ff] font-mono text-xs uppercase tracking-wider flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00f0ff]" />
                <span className="font-bold">SWITCH ENGINE SYSTEM</span>
              </div>
              <span className="text-[10px] text-[#849495]">ALL 3 SYSTEMS</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {droneNavLinks.map((item) => {
                const active = isLinkActive(item);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2.5 font-mono text-xs uppercase tracking-wider rounded-lg text-left flex items-center justify-between transition-all ${
                      active
                        ? 'text-[#090e1b] bg-[#00f0ff] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#161b29]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#090e1b]" />}
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

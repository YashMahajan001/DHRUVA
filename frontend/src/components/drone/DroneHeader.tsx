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
        className="fixed top-3 left-3 md:left-[84px] right-3 h-14 bg-[#090e1b]/95 backdrop-blur-xl border border-[#00f0ff]/20 rounded-xl z-40 flex items-center justify-between px-3 sm:px-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      >
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="drone-mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg lg:hidden text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#161b29] border border-[#00f0ff]/30 transition-colors"
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0053db] p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.35)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090e1b] rounded-[6px] flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xs sm:text-sm font-bold text-[#dee2f5] tracking-wide uppercase">
                  DHRUVA DRONE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                  UAV-01
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#849495] tracking-wider uppercase">
                Propulsion Twin
              </span>
            </div>
          </div>
        </div>

        {/* Center Utility Cluster: Switch System, Clock, and Connection Status (Replaces Duplicate Page Nav) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Switch System Button */}
          <button
            id="drone-btn-switch-platform"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161b29] hover:bg-[#252a38] border border-[#00f0ff]/30 hover:border-[#00f0ff]/60 text-[#00f0ff] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            title="Switch Platform (Drone / Auto / Aero)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold">SWITCH SYSTEM</span>
          </button>

          {/* UTC Clock */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#b9cacb] bg-[#161b29]/90 px-2.5 py-1 rounded-lg border border-[#3b494b]/30">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>{utcTime || 'UTC 12:00:00'}</span>
          </div>

          {/* CAN-BUS Stream Status */}
          <div
            onClick={toggleStream}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold border cursor-pointer transition-all ${
              isStreamActive
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40'
            }`}
            title="Toggle Drone Telemetry Stream"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isStreamActive ? 'bg-[#10b981] animate-ping' : 'bg-[#f59e0b]'}`} />
            <span>{isStreamActive ? 'CAN-BUS ONLINE' : 'STREAM PAUSED'}</span>
          </div>
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

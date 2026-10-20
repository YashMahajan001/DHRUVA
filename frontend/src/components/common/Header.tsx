import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Clock, ShieldCheck, User, LogOut, Menu, X, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  unreadAlertsCount: number;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlertsCount,
  onOpenAlerts,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { operatorId, clearanceLevel, logout, isAuthenticated } = useAuth();
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

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/overview', label: 'Overview' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/engine/eng-01', label: 'Engine Details' },
    { path: '/faults', label: 'Fault Diagnostics' },
    { path: '/mission-simulation', label: 'Mission Simulation' },
    { path: '/mission-tuning', label: 'Mission Tuning' },
    { path: '/fleet', label: 'Fleet Monitoring' },
    { path: '/maintenance', label: 'Maintenance' },
  ];

  return (
    <>
      <header
        id="aerospace-header"
        className="fixed top-0 left-0 md:left-20 right-0 h-16 bg-[#090e1b]/95 backdrop-blur-xl border-b border-[#3b494b]/15 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6"
      >
        {/* Brand & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile menu toggle (visible on small/medium screens where desktop tabs hide) */}
          <button
            id="btn-mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded lg:hidden text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#161b29] border border-[#3b494b]/30 transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#00f0ff]" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
            title="DHRUVAA — Mission Command Hub"
          >
            {/* Tactical DHRUVAA Hex-Shield Vector Icon */}
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00f0ff] to-[#0053db] p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090e1b] rounded flex items-center justify-center">
                <span className="font-mono font-bold text-xs text-[#00f0ff] tracking-tighter">
                  DH
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm sm:text-base xl:text-lg font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
                DHRUVA
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#849495] tracking-widest uppercase">
                AI DIGITAL TWIN SYSTEM
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block"></div>

          <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs xl:text-sm text-[#b9cacb] bg-[#161b29]/80 px-2.5 py-1 rounded border border-[#3b494b]/15">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>{utcTime || 'UTC 14:28:09'}</span>
          </div>
        </div>

        {/* Primary Aerospace Horizontal Navigation Bar (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Switch Engine Platform Button */}
          <button
            id="btn-switch-engine-platform"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 hover:border-[#00f0ff] text-[#00f0ff] font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            title="Switch Engine Platform (Drone / Aeroplane / Automobile)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ENGINES</span>
          </button>

          {/* Quick Auto Powertrain Twin Navigation */}
          <button
            id="btn-goto-automobile"
            onClick={() => navigate('/automobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
              location.pathname === '/automobile'
                ? 'bg-[#f59e0b] text-[#090e1b] font-bold border-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border-[#f59e0b]/30 text-[#f59e0b]'
            }`}
            title="Automobile Powertrain Digital Twin & Intelligence"
          >
            <span>AUTO TWIN</span>
          </button>

          <nav
            id="header-nav-tabs"
            className="flex items-center gap-1 px-1.5 py-1 bg-[#161b29]/80 rounded border border-[#3b494b]/15"
          >
            {navLinks.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path.startsWith('/engine') && location.pathname.startsWith('/engine'));
              return (
                <button
                  key={item.path}
                  id={`tab-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`px-2.5 py-1 font-mono text-xs uppercase tracking-wider rounded transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-[#dee2f5] bg-[#252a38] border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                      : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#1a1f2d]/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Flight Deck Security & Operator Identity */}
        <div className="flex items-center gap-2 shrink-0 pr-1 sm:pr-2">
          {/* Notifications Bell with Anomaly Badge */}
          <button
            id="btn-alerts-bell"
            onClick={onOpenAlerts || (() => navigate('/faults'))}
            className="relative p-1.5 rounded bg-[#1a1f2d]/60 hover:bg-[#252a38] border border-[#3b494b]/30 text-[#b9cacb] hover:text-[#dee2f5] transition-colors"
            title={`${unreadAlertsCount} Flagged Anomalies`}
            type="button"
          >
            <Bell className="w-4 h-4 text-[#dee2f5]" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 font-mono text-[9px] bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 px-1 rounded-full font-bold animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-[#3b494b]/30 hidden sm:block"></div>

          {/* Flight Controller Profile & Auth */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col text-right hidden sm:flex leading-tight">
              <span className="font-mono text-xs text-[#dee2f5] font-semibold tracking-wide truncate max-w-[130px]">
                {operatorId ? operatorId.replace(/\s*\[.*\]/, '') : 'CDR. V. SHASTRI'}
              </span>
              <span className="font-mono text-[9px] text-[#00dbe9] uppercase tracking-wider">
                {clearanceLevel ? clearanceLevel.split('//')[0].trim() : 'LEVEL 2'}
              </span>
            </div>

            <div
              onClick={() => navigate('/')}
              className="w-7 h-7 rounded-full bg-[#00f0ff] flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.4)] cursor-pointer shrink-0 hover:scale-105 transition-transform"
              title="Switch Engine Platform (Drone, Aeroplane, Automobile)"
            >
              <User className="w-3.5 h-3.5 text-[#00363a]" />
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Return to Engine Selection"
                className="p-1 rounded text-[#849495] hover:text-[#ffb4ab] transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Drawer Navigation (overlay when toggled on small screens) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/70 backdrop-blur-md lg:hidden flex flex-col"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-[#090e1b] border-b border-[#00f0ff]/30 p-4 shadow-2xl flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/20 text-xs font-mono text-[#849495]">
              <span>COMMAND NAVIGATION</span>
              <span className="text-[#00f0ff]">{utcTime}</span>
            </div>

            <button
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="w-full mt-1 px-3 py-2.5 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs uppercase tracking-wider flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00f0ff]" />
                <span className="font-bold">SWITCH ENGINE PLATFORM</span>
              </div>
              <span className="text-[10px] text-[#849495]">3 DOMAINS</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {navLinks.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path.startsWith('/engine') && location.pathname.startsWith('/engine'));
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2.5 font-mono text-xs uppercase tracking-wider rounded text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'text-[#dee2f5] bg-[#252a38] border border-[#00f0ff]/40 font-bold'
                        : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#161b29]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />}
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


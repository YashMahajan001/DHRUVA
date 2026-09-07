import React, { useEffect, useState } from 'react';
import { Bell, Clock, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  unreadAlertsCount,
  onOpenAlerts,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

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

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'engine-details', label: 'Engine Details' },
    { id: 'fault-diagnostics', label: 'Fault Diagnostics' },
    { id: 'mission-simulation', label: 'Mission Simulation' },
    { id: 'mission-tuning', label: 'Mission Tuning' },
    { id: 'fleet-monitoring', label: 'Fleet Monitoring' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <header
      id="aerospace-header"
      className="fixed top-0 left-20 right-0 h-16 bg-[#090e1b]/90 backdrop-blur-xl border-b border-[#3b494b]/30 z-40 flex items-center justify-between px-6"
    >
      {/* Brand & Live Zulu Clock */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onNavigate('dashboard')}
          title="DHRUVAA — Mission Command Hub"
        >
          {/* Tactical DHRUVAA Hex-Shield Vector Icon */}
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00f0ff] to-[#0053db] p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#090e1b] rounded flex items-center justify-center">
              <span className="font-mono font-bold text-xs text-[#00f0ff] tracking-tighter">
                DH
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
              DHRUVAA
            </span>
            <span className="font-mono text-[9px] text-[#849495] tracking-widest uppercase">
              AI DIGITAL TWIN SYSTEM
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block"></div>

        <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] text-[#b9cacb] bg-[#161b29]/80 px-2 py-1 rounded border border-[#3b494b]/20">
          <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>{utcTime || 'UTC 14:28:09'}</span>
        </div>
      </div>

      {/* Primary Aerospace Horizontal Navigation Bar */}
      <nav
        id="header-nav-tabs"
        className="hidden lg:flex items-center gap-1 px-1.5 py-1 bg-[#161b29]/80 rounded border border-[#3b494b]/30"
      >
        {navLinks.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-link-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded transition-all ${
                isActive
                  ? 'text-[#dee2f5] bg-[#252a38] border border-[#00f0ff]/50 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#1a1f2d]/60'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Flight Deck Security & Operator Identity */}
      <div className="flex items-center gap-3">
        {/* Secure Link Token */}
        <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 bg-[#161b29]/90 border border-[#00f0ff]/30 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse"></span>
          <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-mono text-[9px] text-[#00f0ff] tracking-widest uppercase font-semibold">
            SECURE // MALE-LINK-01
          </span>
        </div>

        {/* Notifications Bell with Anomaly Badge */}
        <button
          id="btn-alerts-bell"
          onClick={onOpenAlerts}
          className="relative p-1.5 rounded bg-[#1a1f2d]/60 hover:bg-[#252a38] border border-[#3b494b]/30 text-[#b9cacb] hover:text-[#dee2f5] transition-colors"
          title={`${unreadAlertsCount} Flagged Anomalies`}
          type="button"
        >
          <Bell className="w-5 h-5 text-[#dee2f5]" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 font-mono text-[9px] bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 px-1 rounded-full font-bold animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        <div className="h-6 w-[1px] bg-[#3b494b]/30 hidden sm:block"></div>

        {/* Flight Controller Profile */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-mono text-[11px] text-[#dee2f5] font-semibold tracking-wider leading-tight">
              CDR. V. SHASTRI
            </span>
            <span className="font-mono text-[9px] text-[#00dbe9] uppercase tracking-widest">
              LEVEL 2 // FLIGHT CONTROLLER
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00f0ff] flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
            <User className="w-4 h-4 text-[#00363a]" />
          </div>
        </div>
      </div>
    </header>
  );
};

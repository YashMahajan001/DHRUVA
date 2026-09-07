import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  User,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'fault-diagnostics',
  onTabChange,
}) => {
  const { alerts, showToast, isLiveStreaming, toggleLiveStreaming } = useDashboard();
  const [utcTime, setUtcTime] = useState<string>('UTC 14:28:44');

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`UTC ${h}:${m}:${s}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'engine-details', label: 'Engine Details' },
    { id: 'fault-diagnostics', label: 'Fault Diagnostics' },
    { id: 'mission-simulation', label: 'Mission Simulation' },
    { id: 'mission-tuning', label: 'Mission Tuning' },
    { id: 'fleet-monitoring', label: 'Fleet Monitoring' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  const unacknowledgedAlertsCount = alerts.filter(a => !a.acknowledged).length || 3;

  return (
    <header
      id="main-tactical-header"
      className="fixed top-0 left-20 right-0 h-16 bg-[#090e1b]/90 backdrop-blur-xl border-b border-[#3b494b]/30 z-40 flex items-center justify-between px-6 select-none"
    >
      {/* Left Branding & Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Aerospace Tactical Emblem */}
          <div
            id="brand-emblem"
            className="w-8 h-8 rounded bg-[#161b29] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer"
            onClick={() => showToast('DHRUVAA Aero Piston Engine Digital Twin // Model CAD-X V4', 'info')}
          >
            <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          </div>

          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
              DHRUVAA
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#849495] tracking-widest uppercase">
              AI DIGITAL TWIN SYSTEM
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block"></div>

        {/* Live UTC Clock */}
        <div
          id="utc-clock-badge"
          className="hidden xl:flex items-center gap-1.5 font-mono-telemetry text-xs text-[#b9cacb] bg-[#161b29]/60 px-2.5 py-1 rounded border border-[#3b494b]/30"
          title="Synchronized Mission Universal Time"
        >
          <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>{utcTime}</span>
        </div>
      </div>

      {/* Center Nav Bar (Matching Stitch prototype exactly) */}
      <nav
        id="header-nav-tabs"
        className="hidden lg:flex items-center gap-1 px-1.5 py-1 bg-[#161b29]/70 rounded border border-[#3b494b]/30"
      >
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`header-tab-${item.id}`}
              type="button"
              onClick={() => {
                if (onTabChange) onTabChange(item.id);
                if (item.id !== 'fault-diagnostics' && item.id !== 'dashboard') {
                  showToast(`Selected module: ${item.label}. (Main Mission Dashboard view remains focused).`, 'info');
                }
              }}
              className={`px-3 py-1 font-mono-telemetry text-xs transition-colors uppercase rounded ${
                isActive
                  ? 'text-[#dee2f5] bg-[#252a38]/90 border border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)] font-semibold'
                  : 'text-[#b9cacb] hover:text-[#dee2f5] hover:bg-[#1a1f2d]/50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Network telemetry link */}
        <div
          id="network-link-status"
          onClick={toggleLiveStreaming}
          className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 bg-[#161b29]/80 border border-[#00f0ff]/30 rounded cursor-pointer hover:border-[#00f0ff] transition-all"
          title="Click to toggle live telemetry feed"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveStreaming ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse' : 'bg-[#ef4444]'
            }`}
          ></span>
          <span className="font-mono-telemetry text-[10px] text-[#dbfcff] tracking-wider uppercase">
            {isLiveStreaming ? 'SYSTEM SECURE // NET: MALE-LINK-01' : 'TELEMETRY STREAM: PAUSED'}
          </span>
        </div>

        {/* Notifications */}
        <button
          id="alerts-dropdown-btn"
          type="button"
          onClick={() => showToast(`Flight Alert Matrix: ${unacknowledgedAlertsCount} active alert events logged for Sortie 9824.`, 'warning')}
          className="relative p-2 rounded bg-[#1a1f2d]/60 hover:bg-[#252a38] border border-[#3b494b]/30 text-[#b9cacb] hover:text-[#dee2f5] transition-colors"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {unacknowledgedAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 font-mono-telemetry text-[9px] bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40 px-1 rounded-full font-bold">
              {unacknowledgedAlertsCount}
            </span>
          )}
        </button>

        <div className="h-6 w-[1px] bg-[#3b494b]/30 hidden sm:block"></div>

        {/* Flight Controller Profile */}
        <div
          id="controller-profile-card"
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => showToast('Authenticated Officer: CDR. V. SHASTRI (Role: Flight Controller Level 2)', 'info')}
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-mono-telemetry text-xs text-[#dee2f5] tracking-wider leading-tight font-semibold">
              CDR. V. SHASTRI
            </span>
            <span className="font-mono-telemetry text-[9px] text-[#00dbe9] uppercase tracking-widest">
              LEVEL 2 // FLIGHT CONTROLLER
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center text-[#dbfcff] group-hover:bg-[#00f0ff]/30 transition-colors shadow-[0_0_8px_rgba(0,240,255,0.25)]">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

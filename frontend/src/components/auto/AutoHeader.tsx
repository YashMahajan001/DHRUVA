import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  Bell,
  Clock,
  Menu,
  X,
  Gauge,
  Sliders,
  Cpu,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuto } from '../../context/AutoContext';

interface AutoHeaderProps {
  activeAnomaliesCount?: number;
}

export const AutoHeader: React.FC<AutoHeaderProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    catalog,
    selectedEngineId,
    setSelectedEngineId,
    currentEngine,
    apiConnected,
    telemetry,
    anomalies,
    hypotheses,
  } = useAuto();

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

  const autoNavLinks = [
    { path: '/auto/dashboard', label: 'Dashboard', icon: Gauge },
    { path: '/auto/analysis', label: 'Engine Analysis & Faults', icon: Cpu },
    { path: '/auto/tuning', label: 'Tuning Lab', icon: Sliders },
    { path: '/auto/tests', label: 'Test History', icon: History },
  ];

  const totalFaults = hypotheses.length > 0 ? hypotheses.length : anomalies.length;

  return (
    <>
      <header
        id="auto-header"
        className="fixed top-3 left-3 md:left-[84px] right-3 h-14 bg-[#090e1b]/95 backdrop-blur-xl border border-[#f59e0b]/25 rounded-xl z-40 flex items-center justify-between px-3 sm:px-4 shadow-[0_4px_24px_rgba(245,158,11,0.08)]"
      >
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="auto-mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg md:hidden text-[#b9cacb] hover:text-[#f59e0b] hover:bg-[#161b29] border border-[#f59e0b]/30 transition-colors"
            title="Toggle Automotive Navigation Menu"
            aria-label="Toggle Automotive Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#f59e0b]" /> : <Menu className="w-5 h-5 text-[#f59e0b]" />}
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => navigate('/auto/dashboard')}
            title="DHRUVA Auto Engineering Platform"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#b45309] p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090e1b] rounded-[6px] flex items-center justify-center">
                <Car className="w-4 h-4 text-[#f59e0b]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold text-[#dee2f5] tracking-wider leading-none uppercase">
                  DHRUVA AUTO
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40">
                  ENGINEERING
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#849495] tracking-widest uppercase">
                Multi-Domain Platform
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#3b494b]/30 mx-1 hidden xl:block" />

          {/* Quick Engine Selector Pill */}
          <div className="hidden xl:flex items-center gap-2">
            <select
              id="auto-header-engine-select"
              value={selectedEngineId}
              onChange={(e) => setSelectedEngineId(e.target.value)}
              className="bg-[#121829] border border-[#f59e0b]/40 hover:border-[#f59e0b] text-[#dee2f5] font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none transition-colors cursor-pointer max-w-[280px] truncate"
            >
              {catalog.map((eng) => (
                <option key={eng.engine_id} value={eng.engine_id}>
                  {eng.manufacturer} — {eng.name}
                </option>
              ))}
            </select>

            {currentEngine && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#161b29] border border-[#3b494b]/60 text-[#b9cacb]">
                {currentEngine.fuel_type.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Status & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Telemetry Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#121829] border border-[#3b494b]/40">
            <span
              className={`w-2 h-2 rounded-full ${
                !apiConnected
                  ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                  : telemetry
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-xs text-[#b9cacb]">
              {!apiConnected ? 'Disconnected' : telemetry ? 'Connected' : 'Data Unavailable'}
            </span>
          </div>

          {/* Fault Alerts Badge */}
          <button
            onClick={() => navigate('/auto/analysis')}
            className="relative p-1.5 rounded-lg bg-[#121829] border border-[#3b494b]/50 hover:border-[#f59e0b]/50 text-[#b9cacb] hover:text-[#f59e0b] transition-all cursor-pointer"
            title={`${totalFaults} Active Diagnostics / Anomalies`}
          >
            <Bell className="w-4 h-4" />
            {totalFaults > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-mono font-bold text-[#090e1b] ring-2 ring-[#090e1b]">
                {totalFaults}
              </span>
            )}
          </button>

          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#849495] bg-[#121829]/60 px-2.5 py-1 rounded-md border border-[#3b494b]/30">
            <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{utcTime}</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#090e1b]/80 backdrop-blur-md z-50 md:hidden flex flex-col pt-16 px-4 pb-6"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-[#121829] border border-[#f59e0b]/30 rounded-xl p-4 flex flex-col gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
              <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
                DHRUVA AUTO NAVIGATION
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-[#849495]" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {autoNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#f59e0b] text-[#090e1b] font-bold'
                        : 'text-[#dee2f5] hover:bg-[#161b29] hover:text-[#f59e0b]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#3b494b]/30 flex flex-col gap-2">
              <label className="text-[10px] font-mono text-[#849495] uppercase">Select Engine</label>
              <select
                value={selectedEngineId}
                onChange={(e) => setSelectedEngineId(e.target.value)}
                className="bg-[#090e1b] border border-[#f59e0b]/40 text-[#dee2f5] font-mono text-xs p-2 rounded-lg"
              >
                {catalog.map((eng) => (
                  <option key={eng.engine_id} value={eng.engine_id}>
                    {eng.manufacturer} — {eng.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  navigate('/select-engine');
                  setIsMobileMenuOpen(false);
                }}
                className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#161b29] border border-[#f59e0b]/30 text-xs text-[#f59e0b] font-mono font-bold"
              >
                <Layers className="w-4 h-4" />
                <span>Return to Engine Domains</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

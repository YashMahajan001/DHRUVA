import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plane, Car, Radio, Sparkles, Clock } from 'lucide-react';

interface EngineDomain {
  id: 'drone' | 'aeroplane' | 'automobile';
  title: string;
  subtitle: string;
  status: 'active' | 'coming-soon';
  statusBadge: string;
  buttonText: string;
  route?: string;
  accent: 'cyan' | 'sky' | 'amber';
}

export const EngineSelection: React.FC = () => {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);

  const domains: EngineDomain[] = [
    {
      id: 'drone',
      title: 'Drone Engines',
      subtitle: 'UAV & Tactical Drone Propulsion',
      status: 'active',
      statusBadge: 'Active',
      buttonText: 'Launch Dashboard',
      route: '/dashboard',
      accent: 'cyan',
    },
    {
      id: 'aeroplane',
      title: 'Aeroplane Engines',
      subtitle: 'Commercial & Defense Aviation',
      status: 'active',
      statusBadge: 'Phase 3 Live',
      buttonText: 'Launch Dashboard',
      route: '/aero/dashboard',
      accent: 'sky',
    },
    {
      id: 'automobile',
      title: 'Automobile Engines',
      subtitle: 'High-Performance & Hybrid Powertrains',
      status: 'active',
      statusBadge: 'Phase 2 Live',
      buttonText: 'Launch Dashboard',
      route: '/automobile',
      accent: 'amber',
    },
  ];

  const handleSelect = (domain: EngineDomain) => {
    if (domain.status === 'active' && domain.route) {
      navigate(domain.route);
    } else {
      setNotice(`${domain.title} dashboard is in development and will be available soon.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <div
      id="engine-selection-page"
      className="relative min-h-screen w-full bg-[#090e1b] text-[#dee2f5] flex flex-col justify-between aerospace-grid selection:bg-[#00f0ff] selection:text-[#090e1b]"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#00f0ff]/10 via-[#0053db]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Clean Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-[#3b494b]/30 bg-[#090e1b]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0053db] p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.35)] flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#090e1b] rounded-[6px] flex items-center justify-center">
              <span className="font-mono font-bold text-xs text-[#00f0ff] tracking-tighter">
                DH
              </span>
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-base text-[#dbfcff] tracking-wider uppercase block leading-tight">
              DHRUVA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#849495] bg-[#161b29] border border-[#3b494b]/30 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>3 Systems Platform</span>
        </div>
      </header>

      {/* Main Choice Viewport */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Header Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#dbfcff] tracking-tight leading-tight">
            Choose Your Engine System
          </h1>
        </div>

        {/* 3 Domain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {domains.map((domain) => {
            const isActive = domain.status === 'active';

            return (
              <div
                key={domain.id}
                id={`card-${domain.id}`}
                onClick={() => handleSelect(domain)}
                className={`relative group flex flex-col justify-between p-7 sm:p-8 rounded-2xl border transition-all duration-300 select-none ${
                  isActive
                    ? 'bg-[#161b29]/90 border-[#00f0ff]/40 shadow-[0_4px_30px_rgba(0,0,0,0.6)] hover:border-[#00f0ff] hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] hover:-translate-y-2 cursor-pointer'
                    : 'bg-[#161b29]/60 border-[#3b494b]/40 hover:border-[#3b494b]/80 hover:bg-[#161b29]/80 cursor-pointer'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-8">
                  <span
                    className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-[#849495]/15 text-[#849495] border-[#849495]/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#10b981] animate-ping' : 'bg-[#849495]'
                      }`}
                    />
                    {domain.statusBadge}
                  </span>
                </div>

                {/* Central Icon & Title */}
                <div className="flex flex-col items-center text-center my-4">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                      isActive
                        ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.25)] group-hover:scale-110 group-hover:bg-[#00f0ff]/20'
                        : domain.id === 'aeroplane'
                        ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 group-hover:scale-105'
                        : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 group-hover:scale-105'
                    }`}
                  >
                    {domain.id === 'drone' ? (
                      <Radio className="w-10 h-10 animate-pulse" />
                    ) : domain.id === 'aeroplane' ? (
                      <Plane className="w-10 h-10" />
                    ) : (
                      <Car className="w-10 h-10" />
                    )}
                  </div>

                  <h2 className="font-display font-bold text-2xl text-[#dee2f5] group-hover:text-[#dbfcff] transition-colors mb-2">
                    {domain.title}
                  </h2>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-8 pt-6 border-t border-[#3b494b]/20">
                  <button
                    type="button"
                    id={`btn-select-${domain.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(domain);
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#00f0ff] hover:bg-[#dbfcff] text-[#090e1b] shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]'
                        : 'bg-[#1a1f2d] hover:bg-[#252a38] text-[#849495] hover:text-[#dee2f5] border border-[#3b494b]/40'
                    }`}
                  >
                    <span>{domain.buttonText}</span>
                    {isActive ? (
                      <ArrowRight className="w-4 h-4 text-[#090e1b] transition-transform group-hover:translate-x-1" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#849495]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Notification Toast for Coming Soon */}
        {notice && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#161b29] border border-[#00f0ff]/40 text-[#dee2f5] px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl font-mono text-xs flex items-center gap-3 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span>{notice}</span>
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs font-mono text-[#849495] border-t border-[#3b494b]/20 bg-[#090e1b]/60">
        <span>PROJECT DHRUVA</span>
        <span className="mx-2 text-[#3b494b]">•</span>
        <span>Unified Engine Simulation & Monitoring System</span>
      </footer>
    </div>
  );
};

export default EngineSelection;

import React, { useState } from 'react';
import { useAero } from '../../context/AeroContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  Plane,
  ChevronDown,
  Search,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AeroHeader: React.FC = () => {
  const { isExpanded } = useSidebar();
  const {
    catalog,
    selectedEngineId,
    currentEngine,
    setSelectedEngineId,
    isSimulating,
    setIsSimulating,
    flightParams,
    setFlightParams,
    resetSimulation,
    diagnostics,
    injectedFaults,
    apiConnected,
  } = useAero();

  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredCatalog = catalog.filter((engine) => {
    const matchesSearch =
      engine.model_designation.toLowerCase().includes(searchFilter.toLowerCase()) ||
      engine.manufacturer.toLowerCase().includes(searchFilter.toLowerCase()) ||
      engine.application_aircraft.some((a) => a.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || engine.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const activeFaultsCount =
    (diagnostics?.hypotheses.length || 0) + Object.keys(injectedFaults).length;

  const operatingStates = ['IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT'];

  return (
    <header className={`fixed top-3 left-3 ${isExpanded ? 'md:left-[276px]' : 'md:left-[84px]'} right-3 h-14 bg-[#080d1a]/95 backdrop-blur-xl border border-[#38bdf8]/20 rounded-xl z-40 px-3 sm:px-4 flex items-center justify-between text-[#dee2f5] shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out motion-reduce:transition-none`}>
      {/* 1. Left: Identity & Engine Selector Dropdown */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] p-0.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] flex items-center justify-center">
            <Plane className="w-4 h-4 text-[#080d1a]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-widest text-[#e0f2fe] uppercase">
                DHRUVA AERO
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 font-mono font-semibold">
                TWIN
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#7dd3fc]/80 tracking-wider hidden sm:block">
              AIRCRAFT PROPULSION HEALTH & SIMULATION
            </span>
          </div>
        </div>

        {/* Engine Dropdown Selector */}
        <div className="relative">
          <button
            id="aero-engine-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/30 hover:border-[#38bdf8]/60 text-xs font-mono transition-all cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">
                {currentEngine?.category || 'PROPULSION'}
              </span>
              <span className="font-bold text-[#f8fafc] text-xs">
                {currentEngine ? `${currentEngine.manufacturer} ${currentEngine.model_designation}` : 'Select Engine'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#7dd3fc] ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-[#0b1329] border border-[#38bdf8]/40 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-[#131d38] rounded-lg border border-[#38bdf8]/20">
                <Search className="w-3.5 h-3.5 text-[#7dd3fc]" />
                <input
                  type="text"
                  placeholder="Search aircraft engine, model, or aircraft..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#f8fafc] outline-none placeholder:text-[#64748b]"
                  autoFocus
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1 mb-2 overflow-x-auto pb-1 text-[10px] font-mono">
                {['ALL', 'PISTON', 'TURBOPROP', 'TURBOFAN', 'TURBOJET'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-1 rounded transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#38bdf8] text-[#080d1a] font-bold'
                        : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Engine List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {filteredCatalog.map((eng) => {
                  const isSelected = eng.engine_id === selectedEngineId;
                  return (
                    <div
                      key={eng.engine_id}
                      onClick={() => {
                        setSelectedEngineId(eng.engine_id);
                        setDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#f8fafc]'
                          : 'bg-[#0f172a]/60 border-slate-800 hover:border-[#38bdf8]/40 hover:bg-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#e0f2fe]">
                          {eng.manufacturer} {eng.model_designation}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-[#38bdf8] font-mono">
                          {eng.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] truncate">
                        Apps: {eng.application_aircraft.slice(0, 2).join(', ')}
                      </div>
                      <div className="text-[9px] font-mono text-[#0284c7] mt-0.5">
                        {eng.provenance.certification_id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right: Data Provenance Pill, Flight State, Faults, and Simulation Controls */}
      <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
        {/* Strict Data Provenance Badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f172a] border border-[#38bdf8]/30 text-[10px] text-[#7dd3fc]"
          title="Data Provenance: Validated Digital Twin simulation running deterministically."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="font-bold">PROVENANCE:</span>
          <span className="text-[#38bdf8]">SIMULATED</span>
        </div>

        {/* Operating State Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-slate-800">
          <span className="text-[9px] text-[#64748b] uppercase px-1.5">STATE:</span>
          {operatingStates.map((st) => (
            <button
              key={st}
              onClick={() => {
                let th = flightParams.throttle;
                if (st === 'IDLE') th = 0.05;
                if (st === 'TAKEOFF') th = 1.0;
                if (st === 'CLIMB') th = 0.88;
                if (st === 'CRUISE') th = 0.78;
                if (st === 'DESCENT') th = 0.25;
                setFlightParams({ operating_state: st, throttle: th });
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                flightParams.operating_state === st
                  ? 'bg-[#38bdf8] text-[#080d1a] shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Active Faults Alarm Badge */}
        {activeFaultsCount > 0 ? (
          <button
            onClick={() => navigate('/aero/analysis')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ef4444]/15 border border-[#ef4444]/60 text-[#ef4444] animate-pulse cursor-pointer"
            title={`${activeFaultsCount} active faults detected / injected. Click to inspect.`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
            <span className="font-bold text-[11px]">{activeFaultsCount} FAULTS</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL SYSTEMS NOMINAL</span>
          </div>
        )}

        {/* Simulation Play / Pause / Reset Controls */}
        <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#38bdf8]/30">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isSimulating
                ? 'bg-[#38bdf8] text-[#080d1a] shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                : 'bg-slate-800 text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title={isSimulating ? 'Pause Telemetry Simulation' : 'Resume Telemetry Simulation'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded bg-slate-800 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-slate-700 transition-colors cursor-pointer"
            title="Reset Simulation Clock and Telemetry History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* API Link Pill */}
        <div
          className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' : 'bg-[#ef4444]'}`}
          title={apiConnected ? 'Connected to Dhruva Aero FastAPI Backend' : 'Offline / Reconnecting'}
        />
      </div>
    </header>
  );
};

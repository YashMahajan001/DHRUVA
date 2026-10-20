import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  Sliders,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Flame,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  Cpu,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuto, TelemetrySample } from '../../context/AutoContext';
import { AutoEngineModel3D } from './AutoEngineModel3D';

export const AutoDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const {
    catalog,
    selectedEngineId,
    setSelectedEngineId,
    currentEngine,
    telemetry,
    telemetryHistory,
    isSimulating,
    simulationParams,
    setSimulationParams,
    anomalies,
    hypotheses,
    apiConnected,
  } = useAuto();

  // Search & Filters for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL');
  const [selectedFuel, setSelectedFuel] = useState('ALL');

  // Active Graph Signals
  const [activeSignals, setActiveSignals] = useState<{
    rpm: boolean;
    power: boolean;
    torque: boolean;
    boost: boolean;
    coolant: boolean;
    afr: boolean;
  }>({
    rpm: true,
    power: true,
    torque: false,
    boost: true,
    coolant: true,
    afr: false,
  });

  // Extract unique manufacturers and fuel types
  const manufacturers = useMemo(() => {
    const list = Array.from(new Set(catalog.map((e) => e.manufacturer)));
    return ['ALL', ...list];
  }, [catalog]);

  const fuelTypes = useMemo(() => {
    const list = Array.from(new Set(catalog.map((e) => e.fuel_type)));
    return ['ALL', ...list];
  }, [catalog]);

  // Filtered engine list
  const filteredCatalog = useMemo(() => {
    return catalog.filter((eng) => {
      const matchSearch =
        eng.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.engine_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMfr = selectedManufacturer === 'ALL' || eng.manufacturer === selectedManufacturer;
      const matchFuel = selectedFuel === 'ALL' || eng.fuel_type === selectedFuel;
      return matchSearch && matchMfr && matchFuel;
    });
  }, [catalog, searchQuery, selectedManufacturer, selectedFuel]);

  const activeFaultCount = hypotheses.length > 0 ? hypotheses.length : anomalies.length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto text-[#dee2f5]">
      {/* 1. Header & Engine Selection Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#3b494b]/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#dee2f5] uppercase">
              Automotive Engine Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40">
              TELEMETRY & SPECS
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#849495] mt-1 font-mono">
            Powertrain physics & real-time telemetry.
          </p>
        </div>
      </div>

      {/* 2. Searchable Engine Selector & Specification Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Engine Selector Card (5 cols) */}
        <div className="xl:col-span-5 bg-[#121829]/90 border border-[#f59e0b]/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
            <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] font-bold uppercase">
              <Search className="w-4 h-4" />
              <span>Select Engine ({filteredCatalog.length} Available)</span>
            </div>
            <span className="text-[10px] font-mono text-[#849495]">
              {selectedManufacturer} / {selectedFuel}
            </span>
          </div>

          {/* Search bar & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1">
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="w-full bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg focus:border-[#f59e0b]"
              >
                {manufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ALL' ? 'All Makers' : m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg focus:border-[#f59e0b]"
              >
                {fuelTypes.map((f) => (
                  <option key={f} value={f}>
                    {f === 'ALL' ? 'All Fuels' : f.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Engine Cards Carousel / List */}
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {filteredCatalog.map((eng) => {
              const isSelected = eng.engine_id === selectedEngineId;
              return (
                <div
                  key={eng.engine_id}
                  onClick={() => setSelectedEngineId(eng.engine_id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#f59e0b]/15 border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-[#161b29]/60 border-[#3b494b]/40 hover:border-[#f59e0b]/40 hover:bg-[#161b29]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#dee2f5]">{eng.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#090e1b] border border-[#3b494b]/60 text-[#f59e0b]">
                        {eng.manufacturer}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#849495] font-mono mt-0.5">
                      <span>{eng.specifications.displacement_cc} cc</span>
                      <span>•</span>
                      <span>{eng.specifications.cylinder_count}-Cyl</span>
                      <span>•</span>
                      <span>{eng.aspiration}</span>
                      <span>•</span>
                      <span className="text-[#38bdf8]">{eng.fuel_type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-[#dee2f5]">
                      {eng.specifications.rated_power_hp} HP
                    </div>
                    <div className="text-[10px] text-[#849495] font-mono">
                      {eng.specifications.peak_torque_nm} Nm
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Precision 3D Engine Simulation Viewport (7 cols) - Highlighted Dashboard Area */}
        <div className="xl:col-span-7 flex flex-col">
          {currentEngine ? (
            <AutoEngineModel3D
              engine={currentEngine}
              telemetry={telemetry}
              isSimulating={isSimulating}
            />
          ) : (
            <div className="w-full h-[410px] bg-[#121829] border border-[#3b494b]/40 rounded-xl flex items-center justify-center">
              <span className="font-mono text-sm text-[#849495]">Loading engine 3D simulation model...</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Key Telemetry Metrics Grid (6 Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* RPM */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>ENGINE RPM</span>
            <Activity className="w-3.5 h-3.5 text-[#f59e0b]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? Math.round(telemetry.rpm) : '—'}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#849495] mt-1">
            <span>Redline: {currentEngine ? currentEngine.operating_limits.redline_rpm : 6800}</span>
            <span className={telemetry && currentEngine && telemetry.rpm > currentEngine.operating_limits.max_continuous_rpm ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {telemetry && currentEngine && telemetry.rpm > currentEngine.operating_limits.max_continuous_rpm ? 'HIGH' : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Brake Power */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>BRAKE POWER</span>
            <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? telemetry.brake_power_kw.toFixed(1) : '—'}{' '}
            <span className="text-xs font-normal text-[#849495]">kW</span>
          </div>
          <div className="text-[10px] font-mono text-[#849495] mt-1">
            {telemetry ? (telemetry.brake_power_kw * 1.341).toFixed(0) : '—'} BHP
          </div>
        </div>

        {/* Brake Torque */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>BRAKE TORQUE</span>
            <Gauge className="w-3.5 h-3.5 text-[#f59e0b]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? telemetry.brake_torque_nm.toFixed(1) : '—'}{' '}
            <span className="text-xs font-normal text-[#849495]">Nm</span>
          </div>
          <div className="text-[10px] font-mono text-[#849495] mt-1">
            Load: {telemetry ? Math.round(simulationParams.loadTorque) : 0} Nm
          </div>
        </div>

        {/* Boost Pressure */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>BOOST / MAP</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#a855f7]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? telemetry.boost_pressure_bar.toFixed(2) : '—'}{' '}
            <span className="text-xs font-normal text-[#849495]">bar</span>
          </div>
          <div className="text-[10px] font-mono text-[#849495] mt-1">
            {telemetry ? telemetry.manifold_pressure_kpa.toFixed(0) : '—'} kPa absolute
          </div>
        </div>

        {/* Coolant Temp */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>COOLANT TEMP</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? telemetry.coolant_temp_c.toFixed(1) : '—'}{' '}
            <span className="text-xs font-normal text-[#849495]">°C</span>
          </div>
          <div className="text-[10px] font-mono text-[#849495] mt-1">
            Limit: {currentEngine ? currentEngine.operating_limits.max_coolant_temp_c : 108}°C
          </div>
        </div>

        {/* Oil Gallery Pressure */}
        <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-3.5 flex flex-col shadow">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>OIL PRESSURE</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#dee2f5] mt-1">
            {telemetry ? telemetry.oil_pressure_bar.toFixed(1) : '—'}{' '}
            <span className="text-xs font-normal text-[#849495]">bar</span>
          </div>
          <div className="text-[10px] font-mono text-[#849495] mt-1">
            Oil Temp: {telemetry ? telemetry.oil_temp_c.toFixed(1) : '—'}°C
          </div>
        </div>
      </div>

      {/* 4. Combined Telemetry Time-Series Graph */}
      <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
              Telemetry Stream
            </span>
            <span className="text-[10px] font-mono text-[#849495] hidden md:inline">
              (40 samples · 250ms)
            </span>
          </div>

          {/* Signal Selector Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveSignals((s) => ({ ...s, rpm: !s.rpm }))}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeSignals.rpm
                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                  : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
              }`}
            >
              RPM
            </button>
            <button
              onClick={() => setActiveSignals((s) => ({ ...s, power: !s.power }))}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeSignals.power
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                  : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
              }`}
            >
              Power (kW)
            </button>
            <button
              onClick={() => setActiveSignals((s) => ({ ...s, torque: !s.torque }))}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeSignals.torque
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400'
                  : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
              }`}
            >
              Torque (Nm)
            </button>
            <button
              onClick={() => setActiveSignals((s) => ({ ...s, boost: !s.boost }))}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeSignals.boost
                  ? 'bg-purple-400/20 text-purple-300 border-purple-400'
                  : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
              }`}
            >
              Boost (bar)
            </button>
            <button
              onClick={() => setActiveSignals((s) => ({ ...s, coolant: !s.coolant }))}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeSignals.coolant
                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400'
                  : 'bg-[#090e1b] text-[#849495] border-[#3b494b]/40'
              }`}
            >
              Coolant (°C)
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-[280px] w-full mt-3">
          {telemetryHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263339" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1b',
                    borderColor: '#f59e0b',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                {activeSignals.rpm && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="rpm"
                    name="RPM"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {activeSignals.power && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="brake_power_kw"
                    name="Power (kW)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {activeSignals.torque && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="brake_torque_nm"
                    name="Torque (Nm)"
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {activeSignals.boost && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="boost_pressure_bar"
                    name="Boost (bar)"
                    stroke="#c084fc"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {activeSignals.coolant && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="coolant_temp_c"
                    name="Coolant (°C)"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#849495]">
              Awaiting telemetry stream frames...
            </div>
          )}
        </div>
      </div>

      {/* 5. Health & Fault Summary & Physics Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Health & Fault Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
              <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
                HEALTH & FAULT STATUS
              </span>
              <button
                onClick={() => navigate('/auto/analysis')}
                className="flex items-center gap-1 text-[11px] font-mono text-[#38bdf8] hover:underline"
              >
                <span>Full Diagnostics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 my-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  activeFaultCount > 0
                    ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400'
                    : 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-400'
                }`}
              >
                {activeFaultCount > 0 ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="font-bold text-sm text-[#dee2f5]">
                  {activeFaultCount > 0
                    ? `${activeFaultCount} Active Diagnostic Anomalies Detected`
                    : 'All Subsystems Nominal'}
                </div>
                <div className="text-[11px] text-[#849495] font-mono mt-0.5">
                  {activeFaultCount > 0
                    ? 'Thermodynamic boundary breach or sensor drift observed.'
                    : 'Engine operating within validated physical limits.'}
                </div>
              </div>
            </div>

            {/* List top hypotheses or anomalies */}
            {hypotheses.length > 0 ? (
              <div className="flex flex-col gap-2 mt-2">
                {hypotheses.slice(0, 2).map((hyp) => (
                  <div
                    key={hyp.hypothesis_id}
                    onClick={() => navigate('/auto/analysis')}
                    className="p-2.5 rounded-lg bg-[#090e1b] border border-amber-500/30 flex items-start justify-between cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400">
                          {hyp.fault_id}
                        </span>
                        <span className="text-xs font-bold text-[#dee2f5]">{hyp.fault_name}</span>
                      </div>
                      <div className="text-[10px] text-[#849495] font-mono mt-1">
                        Confidence: {(hyp.confidence * 100).toFixed(0)}% • Subsystem: {hyp.subsystem}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#090e1b] border border-emerald-500/20 text-xs font-mono text-emerald-300">
                ✓ No active DTC fault codes registered for current simulation session.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#3b494b]/30 flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>Model: Physical Thermodynamic SI Twin</span>
            <span className="text-emerald-400">Status: {apiConnected ? 'Online' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Physics Simulation Input Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
            <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
              Dynamometer Controls
            </span>
            <span className="text-[10px] font-mono text-[#849495]">Actuation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            {/* Throttle Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Throttle:</span>
                <span className="font-bold text-[#f59e0b]">{(simulationParams.throttle * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParams.throttle}
                onChange={(e) => setSimulationParams({ throttle: parseFloat(e.target.value) })}
                className="w-full accent-[#f59e0b] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                <span>Idle (0%)</span>
                <span>Part (50%)</span>
                <span>WOT (100%)</span>
              </div>
            </div>

            {/* Load Torque Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Absorber Torque:</span>
                <span className="font-bold text-[#38bdf8]">{simulationParams.loadTorque.toFixed(0)} Nm</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={simulationParams.loadTorque}
                onChange={(e) => setSimulationParams({ loadTorque: parseFloat(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                <span>Freewheel (0)</span>
                <span>Cruise (150)</span>
                <span>Full Climb (500)</span>
              </div>
            </div>

            {/* Ambient Temperature */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Ambient Temp:</span>
                <span className="font-bold text-emerald-400">{simulationParams.ambientTemp.toFixed(0)}°C</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="1"
                value={simulationParams.ambientTemp}
                onChange={(e) => setSimulationParams({ ambientTemp: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Altitude */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Altitude:</span>
                <span className="font-bold text-purple-400">{simulationParams.altitude.toFixed(0)} m</span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="50"
                value={simulationParams.altitude}
                onChange={(e) => setSimulationParams({ altitude: parseFloat(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#3b494b]/30 flex items-center justify-between text-[11px] font-mono text-[#849495]">
            <span>Euler numerical integration (dt = 0.25s).</span>
            <button
              onClick={() => navigate('/auto/tuning')}
              className="text-[#f59e0b] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Open Tuning Lab</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useAero } from '../context/AeroContext';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  Flame,
  Activity,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ChevronRight,
  TrendingUp,
  Info,
  Layers,
  ArrowUpRight,
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
import { AeroCategory } from '../services/aeroApi';
import { AeroEngineModel3D } from '../components/aeroplane/AeroEngineModel3D';

export const AeroDashboardView: React.FC = () => {
  const {
    currentEngine,
    telemetry,
    telemetryHistory,
    isSimulating,
    setIsSimulating,
    flightParams,
    setFlightParams,
    resetSimulation,
    diagnostics,
    injectedFaults,
  } = useAero();

  const navigate = useNavigate();

  // Signals available for graph plotting based on category
  const availableSignals = useMemo(() => {
    if (!currentEngine) return [];
    if (currentEngine.category === 'PISTON') {
      return [
        { key: 'rpm', name: 'RPM', color: '#38bdf8', unit: 'RPM' },
        { key: 'map_inhg', name: 'Manifold Pressure', color: '#a855f7', unit: 'inHg' },
        { key: 'cht_c', name: 'Cylinder Head Temp', color: '#ef4444', unit: '°C' },
        { key: 'egt_c', name: 'Exhaust Gas Temp', color: '#f97316', unit: '°C' },
        { key: 'power_bhp', name: 'Power (BHP)', color: '#10b981', unit: 'BHP' },
        { key: 'fuel_flow_gph', name: 'Fuel Flow', color: '#eab308', unit: 'GPH' },
      ];
    }
    if (currentEngine.category === 'TURBOPROP') {
      return [
        { key: 'ng_pct', name: 'Gas Gen Speed (Ng)', color: '#38bdf8', unit: '%' },
        { key: 'np_rpm', name: 'Prop Speed (Np)', color: '#06b6d4', unit: 'RPM' },
        { key: 'itt_c', name: 'Inter-Turbine Temp (ITT)', color: '#ef4444', unit: '°C' },
        { key: 'torque_ft_lb', name: 'Shaft Torque', color: '#a855f7', unit: 'ft-lb' },
        { key: 'shp', name: 'Shaft Horsepower', color: '#10b981', unit: 'SHP' },
        { key: 'fuel_flow_kgh', name: 'Fuel Flow', color: '#eab308', unit: 'kg/h' },
      ];
    }
    if (currentEngine.category === 'TURBOJET') {
      return [
        { key: 'spool_n_pct', name: 'Rotor Speed (N)', color: '#38bdf8', unit: '%' },
        { key: 'egt_c', name: 'Exhaust Gas Temp (EGT)', color: '#ef4444', unit: '°C' },
        { key: 'thrust_kn', name: 'Net Thrust', color: '#10b981', unit: 'kN' },
        { key: 'fuel_flow_kgh', name: 'Fuel Flow', color: '#eab308', unit: 'kg/h' },
        { key: 'oil_press_psi', name: 'Oil Pressure', color: '#f59e0b', unit: 'PSI' },
      ];
    }
    // Default Turbofan
    return [
      { key: 'n1_pct', name: 'Fan Speed (N1)', color: '#38bdf8', unit: '%' },
      { key: 'n2_pct', name: 'Core Speed (N2)', color: '#0284c7', unit: '%' },
      { key: 'egt_c', name: 'Exhaust Gas Temp (EGT)', color: '#ef4444', unit: '°C' },
      { key: 'thrust_kn', name: 'Net Thrust', color: '#10b981', unit: 'kN' },
      { key: 'fuel_flow_kgh', name: 'Fuel Flow', color: '#eab308', unit: 'kg/h' },
      { key: 'oil_press_psi', name: 'Oil Pressure', color: '#f59e0b', unit: 'PSI' },
    ];
  }, [currentEngine]);

  const [activeSignals, setActiveSignals] = useState<string[]>(['n1_pct', 'egt_c', 'thrust_kn', 'rpm', 'ng_pct', 'spool_n_pct']);

  const toggleSignal = (key: string) => {
    setActiveSignals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectedSignals = availableSignals.filter((s) => activeSignals.includes(s.key));

  if (!currentEngine) {
    return (
      <div className="p-8 text-center text-[#94a3b8] font-mono">
        Loading Dhruva Aero Aircraft Propulsion Catalog...
      </div>
    );
  }

  const category = currentEngine.category;
  const healthScore = diagnostics?.overall_health_score_pct || 100.0;
  const isHealthy = healthScore >= 85.0;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#dee2f5] font-sans selection:bg-[#38bdf8] selection:text-[#080d1a]">
      {/* 1. Header Overview Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-[#f8fafc]">
              {currentEngine.manufacturer} {currentEngine.model_designation}
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 font-mono font-bold">
              {currentEngine.category}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#94a3b8]">
            <span>Arch: <strong className="text-[#e0f2fe]">{currentEngine.architecture.replace(/_/g, ' ')}</strong></span>
            <span>Cert: <strong className="text-[#38bdf8]">{currentEngine.provenance.certification_id}</strong></span>
            <span>Authority: <strong className="text-[#94a3b8]">{currentEngine.provenance.issuing_authority}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => navigate('/aero/analysis')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/40 text-xs font-mono font-bold text-[#38bdf8] transition-all cursor-pointer shadow-md"
          >
            <Activity className="w-4 h-4" />
            <span>3D Analysis & Faults</span>
          </button>

          <button
            onClick={() => navigate('/aero/simulation')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] hover:text-[#080d1a] text-xs font-mono font-bold text-[#f8fafc] transition-all cursor-pointer shadow-lg"
          >
            <Sliders className="w-4 h-4" />
            <span>Simulation Lab</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {category === 'TURBOFAN' && (
          <>
            <KPICard
              title="LOW-PRESSURE SPOOL (N1)"
              value={telemetry?.n1_pct ? `${telemetry.n1_pct}%` : '22.0%'}
              nominal="22 - 102%"
              limit={`Max ${currentEngine.operating_limits.max_n1_pct || 104}%`}
              provenance="SIMULATED"
              status={telemetry?.n1_pct && telemetry.n1_pct > 103 ? 'WARNING' : 'NORMAL'}
            />
            <KPICard
              title="HIGH-PRESSURE SPOOL (N2)"
              value={telemetry?.n2_pct ? `${telemetry.n2_pct}%` : '62.0%'}
              nominal="60 - 105%"
              limit={`Max ${currentEngine.operating_limits.max_n2_pct || 105}%`}
              provenance="SIMULATED"
              status="NORMAL"
            />
            <KPICard
              title="EXHAUST GAS TEMP (EGT)"
              value={telemetry?.turbine_egt_c ? `${telemetry.turbine_egt_c} °C` : '440 °C'}
              nominal="420 - 900 °C"
              limit={`Max ${currentEngine.operating_limits.max_turbine_egt_c || 950} °C`}
              provenance="CALCULATED"
              status={telemetry?.turbine_egt_c && telemetry.turbine_egt_c > 900 ? 'WARNING' : 'NORMAL'}
            />
            <KPICard
              title="NET THRUST"
              value={telemetry?.thrust_kn ? `${telemetry.thrust_kn} kN` : '12.0 kN'}
              nominal="Rated Takeoff"
              limit={`${currentEngine.specifications.rated_takeoff_thrust_kn || 120} kN`}
              provenance="ESTIMATED"
              status="NORMAL"
            />
            <KPICard
              title="FUEL MASS FLOW"
              value={telemetry?.fuel_flow_kgh ? `${telemetry.fuel_flow_kgh} kg/h` : '420 kg/h'}
              nominal="FADEC Scheduled"
              limit="Jet A / SAF"
              provenance="MEASURED"
              status="NORMAL"
            />
            <KPICard
              title="MAIN OIL PRESSURE"
              value={telemetry?.oil_press_psi ? `${telemetry.oil_press_psi} PSI` : '50 PSI'}
              nominal="35 - 95 PSI"
              limit={`Min ${currentEngine.operating_limits.min_oil_press_psi || 35} PSI`}
              provenance="MEASURED"
              status={telemetry?.oil_press_psi && telemetry.oil_press_psi < 35 ? 'CRITICAL' : 'NORMAL'}
            />
          </>
        )}

        {category === 'TURBOPROP' && (
          <>
            <KPICard
              title="GAS GENERATOR (Ng)"
              value={telemetry?.ng_pct ? `${telemetry.ng_pct}%` : '64.0%'}
              nominal="64 - 104%"
              limit={`Max ${currentEngine.operating_limits.max_ng_pct || 104}%`}
              provenance="SIMULATED"
              status="NORMAL"
            />
            <KPICard
              title="PROPELLER SPEED (Np)"
              value={telemetry?.np_rpm ? `${telemetry.np_rpm} RPM` : '1050 RPM'}
              nominal="1000 - 1700 RPM"
              limit={`Max ${currentEngine.operating_limits.max_np_rpm || 1700} RPM`}
              provenance="SIMULATED"
              status="NORMAL"
            />
            <KPICard
              title="INTER-TURBINE TEMP (ITT)"
              value={telemetry?.itt_c ? `${telemetry.itt_c} °C` : '480 °C'}
              nominal="450 - 780 °C"
              limit={`Max ${currentEngine.operating_limits.max_itt_c || 800} °C`}
              provenance="CALCULATED"
              status={telemetry?.itt_c && telemetry.itt_c > 800 ? 'WARNING' : 'NORMAL'}
            />
            <KPICard
              title="SHAFT TORQUE"
              value={telemetry?.torque_ft_lb ? `${telemetry.torque_ft_lb} ft-lb` : '350 ft-lb'}
              nominal="Gearbox Limit"
              limit={`Max ${currentEngine.operating_limits.max_torque_ft_lb || 3690} ft-lb`}
              provenance="CALCULATED"
              status="NORMAL"
            />
            <KPICard
              title="SHAFT HORSEPOWER"
              value={telemetry?.shp ? `${telemetry.shp} SHP` : '120 SHP'}
              nominal="Flat-rated"
              limit={`${currentEngine.specifications.rated_takeoff_power_shp || 1200} SHP`}
              provenance="CALCULATED"
              status="NORMAL"
            />
            <KPICard
              title="OIL PRESSURE"
              value={telemetry?.oil_press_psi ? `${telemetry.oil_press_psi} PSI` : '75 PSI'}
              nominal="60 - 135 PSI"
              limit={`Min ${currentEngine.operating_limits.min_oil_press_psi || 60} PSI`}
              provenance="MEASURED"
              status={telemetry?.oil_press_psi && telemetry.oil_press_psi < 60 ? 'CRITICAL' : 'NORMAL'}
            />
          </>
        )}

        {category === 'PISTON' && (
          <>
            <KPICard
              title="ENGINE SPEED (RPM)"
              value={telemetry?.rpm ? `${telemetry.rpm} RPM` : '850 RPM'}
              nominal="650 - 2700 RPM"
              limit={`Redline ${currentEngine.operating_limits.max_rpm || 2700} RPM`}
              provenance="SIMULATED"
              status="NORMAL"
            />
            <KPICard
              title="MANIFOLD PRESSURE"
              value={telemetry?.map_inhg ? `${telemetry.map_inhg} inHg` : '15.0 inHg'}
              nominal="12 - 29.5 inHg"
              limit={`Max ${currentEngine.operating_limits.max_map_inhg || 29.5} inHg`}
              provenance="MEASURED"
              status="NORMAL"
            />
            <KPICard
              title="CYLINDER HEAD TEMP"
              value={telemetry?.cht_c ? `${telemetry.cht_c} °C` : '85 °C'}
              nominal="100 - 200 °C"
              limit={`Max ${currentEngine.operating_limits.max_cht_c || 243} °C`}
              provenance="CALCULATED"
              status={telemetry?.cht_c && telemetry.cht_c > 240 ? 'CRITICAL' : 'NORMAL'}
            />
            <KPICard
              title="EXHAUST GAS TEMP (EGT)"
              value={telemetry?.egt_c ? `${telemetry.egt_c} °C` : '550 °C'}
              nominal="500 - 850 °C"
              limit="Peak Mixture"
              provenance="MEASURED"
              status="NORMAL"
            />
            <KPICard
              title="BRAKE POWER"
              value={telemetry?.power_bhp ? `${telemetry.power_bhp} BHP` : '140 BHP'}
              nominal="Rated 100%"
              limit={`${currentEngine.specifications.rated_takeoff_power_bhp || 200} BHP`}
              provenance="ESTIMATED"
              status="NORMAL"
            />
            <KPICard
              title="FUEL FLOW"
              value={telemetry?.fuel_flow_gph ? `${telemetry.fuel_flow_gph} GPH` : '11.0 GPH'}
              nominal="100LL Avgas"
              limit="Best Economy"
              provenance="MEASURED"
              status="NORMAL"
            />
          </>
        )}

        {category === 'TURBOJET' && (
          <>
            <KPICard
              title="SPOOL ROTOR (N)"
              value={telemetry?.spool_n_pct ? `${telemetry.spool_n_pct}%` : '50.0%'}
              nominal="48 - 100%"
              limit="Max 100%"
              provenance="SIMULATED"
              status="NORMAL"
            />
            <KPICard
              title="EXHAUST GAS TEMP (EGT)"
              value={telemetry?.turbine_egt_c ? `${telemetry.turbine_egt_c} °C` : '420 °C'}
              nominal="380 - 730 °C"
              limit={`Max ${currentEngine.operating_limits.max_turbine_egt_c || 730} °C`}
              provenance="CALCULATED"
              status={telemetry?.turbine_egt_c && telemetry.turbine_egt_c > 730 ? 'WARNING' : 'NORMAL'}
            />
            <KPICard
              title="JET THRUST"
              value={telemetry?.thrust_kn ? `${telemetry.thrust_kn} kN` : '15.0 kN'}
              nominal="Dry / Reheat"
              limit={`${currentEngine.specifications.rated_takeoff_thrust_kn || 22.2} kN`}
              provenance="ESTIMATED"
              status="NORMAL"
            />
            <KPICard
              title="FUEL MASS FLOW"
              value={telemetry?.fuel_flow_kgh ? `${telemetry.fuel_flow_kgh} kg/h` : '850 kg/h'}
              nominal="Axial Burner"
              limit="JP-8 / Jet A"
              provenance="MEASURED"
              status="NORMAL"
            />
            <KPICard
              title="NOZZLE PRESSURE RATIO"
              value={telemetry?.nozzle_press_ratio ? `${telemetry.nozzle_press_ratio}` : '1.8'}
              nominal="Choked Nozzle"
              limit="2.4"
              provenance="CALCULATED"
              status="NORMAL"
            />
            <KPICard
              title="OIL PRESSURE"
              value={telemetry?.oil_press_psi ? `${telemetry.oil_press_psi} PSI` : '35 PSI'}
              nominal="20 - 55 PSI"
              limit={`Min ${currentEngine.operating_limits.min_oil_press_psi || 20} PSI`}
              provenance="MEASURED"
              status={telemetry?.oil_press_psi && telemetry.oil_press_psi < 20 ? 'CRITICAL' : 'NORMAL'}
            />
          </>
        )}
      </div>

      {/* 2.5 Real-Time 3D Engine Digital Twin Simulation Viewport */}
      {currentEngine && (
        <div className="w-full">
          <AeroEngineModel3D
            engine={currentEngine}
            telemetry={telemetry}
            height="460px"
            onSelectComponent={(compId) => navigate(`/aero/analysis?component=${compId}`)}
          />
        </div>
      )}

      {/* 3. Middle Section: Telemetry Graph & Live Flight Context */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Telemetry Time-Series Chart (3 Cols) */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-[#f8fafc] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#38bdf8]" />
                MULTI-CHANNEL TELEMETRY TIME-SERIES
              </h2>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                Real-time synchronized flight recorder stream • 60-sample window
              </span>
            </div>

            {/* Signal Selector Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              {availableSignals.map((sig) => {
                const isSelected = activeSignals.includes(sig.key);
                return (
                  <button
                    key={sig.key}
                    onClick={() => toggleSignal(sig.key)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-transparent font-bold'
                        : 'bg-[#0f172a] text-[#64748b] border-slate-800 hover:text-[#94a3b8]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${sig.color}25` : undefined,
                      color: isSelected ? sig.color : undefined,
                      borderColor: isSelected ? sig.color : undefined,
                    }}
                  >
                    {sig.name} ({sig.unit})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Area */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time_s" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit="s" />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#38bdf8',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                {selectedSignals.map((sig) => (
                  <Line
                    key={sig.key}
                    type="monotone"
                    dataKey={sig.key}
                    name={`${sig.name} (${sig.unit})`}
                    stroke={sig.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flight Environment & State Panel (1 Col) */}
        <div className="p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5 mb-3">
              <Wind className="w-4 h-4" />
              FLIGHT ENVELOPE CONTEXT
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800">
                <div className="flex justify-between text-[#94a3b8] text-[10px]">
                  <span>ALTITUDE (PRESSURE):</span>
                  <span className="text-[#38bdf8] font-bold">
                    {Math.round(flightParams.altitude_m)} m ({Math.round(flightParams.altitude_m * 3.28084)} ft)
                  </span>
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5">
                  FL{Math.round((flightParams.altitude_m * 3.28084) / 100)}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800">
                <div className="flex justify-between text-[#94a3b8] text-[10px]">
                  <span>AIRSPEED / MACH:</span>
                  <span className="text-[#38bdf8] font-bold">Mach {flightParams.mach}</span>
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5">
                  TAS ~{Math.round(flightParams.mach * 580)} kts
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800">
                <div className="flex justify-between text-[#94a3b8] text-[10px]">
                  <span>STATIC AIR TEMP (OAT):</span>
                  <span className="text-[#38bdf8] font-bold">{flightParams.ambient_temp_c} °C</span>
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5">
                  ISA Dev: {flightParams.ambient_temp_c - (15 - 0.0065 * flightParams.altitude_m) > 0 ? '+' : ''}
                  {Math.round(flightParams.ambient_temp_c - (15 - 0.0065 * flightParams.altitude_m))} °C
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800">
                <div className="flex justify-between text-[#94a3b8] text-[10px]">
                  <span>THROTTLE (PLA):</span>
                  <span className="text-[#38bdf8] font-bold">{Math.round(flightParams.throttle * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-[#38bdf8] h-1.5 rounded-full"
                    style={{ width: `${flightParams.throttle * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/aero/simulation')}
            className="w-full py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/30 hover:border-[#38bdf8] text-xs font-mono font-bold text-[#38bdf8] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Modify Flight Regime</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Health & Anomaly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model Derived Health Score */}
        <div className="p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider block">
              MODEL-DERIVED HEALTH INDEX
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-display ${isHealthy ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {healthScore}%
              </span>
              <span className="text-xs font-mono text-[#94a3b8]">
                {isHealthy ? 'AIRWORTHY' : 'ANOMALY DETECTED'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Derived from multi-channel physical baseline envelope models.
            </p>
          </div>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
            isHealthy
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
              : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] animate-pulse'
          }`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        {/* Active Detected / Injected Faults */}
        <div className="p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider">
              ACTIVE DETECTED FAULTS
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] border border-slate-800">
              {diagnostics?.hypotheses.length || 0} ACTIVE
            </span>
          </div>

          {diagnostics && diagnostics.hypotheses.length > 0 ? (
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {diagnostics.hypotheses.map((h) => (
                <div
                  key={h.hypothesis_id}
                  onClick={() => navigate('/aero/analysis')}
                  className="p-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-between text-xs font-mono cursor-pointer hover:bg-[#ef4444]/20 transition-colors"
                >
                  <span className="text-[#ef4444] font-bold truncate max-w-[180px]">{h.fault_name}</span>
                  <span className="text-[10px] text-[#fca5a5]">{h.confidence_pct}% Conf</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs font-mono text-[#10b981] flex items-center gap-1.5 py-3">
              <span>✓ No abnormal thermodynamic drift or envelope exceedances detected.</span>
            </div>
          )}
        </div>

        {/* Quick Navigation to Tests History */}
        <div className="p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider">
                FLIGHT EXPERIMENT RECORDS
              </span>
              <span className="text-[10px] font-mono text-[#38bdf8]">PERSISTENT AUDIT</span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Review certified simulation runs, baseline comparisons, and fault evidence timelines.
            </p>
          </div>

          <button
            onClick={() => navigate('/aero/tests')}
            className="w-full py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/30 hover:border-[#38bdf8] text-xs font-mono font-bold text-[#f8fafc] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Open Test History</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#38bdf8]" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  nominal: string;
  limit: string;
  provenance: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, nominal, limit, provenance, status }) => {
  const isWarn = status === 'WARNING';
  const isCrit = status === 'CRITICAL';

  return (
    <div
      className={`p-3.5 rounded-xl bg-[#0b1329]/90 border transition-all ${
        isCrit
          ? 'border-[#ef4444] bg-[#ef4444]/10 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
          : isWarn
          ? 'border-[#f59e0b] bg-[#f59e0b]/10'
          : 'border-[#38bdf8]/20 hover:border-[#38bdf8]/50'
      }`}
    >
      <div className="flex items-center justify-between text-[9px] font-mono text-[#94a3b8] mb-1">
        <span className="truncate max-w-[110px]">{title}</span>
        <span
          className={`px-1 py-0.2 rounded text-[8px] font-bold ${
            provenance === 'SIMULATED'
              ? 'bg-[#38bdf8]/15 text-[#38bdf8]'
              : provenance === 'MEASURED'
              ? 'bg-[#10b981]/15 text-[#10b981]'
              : 'bg-[#a855f7]/15 text-[#a855f7]'
          }`}
        >
          {provenance.slice(0, 3)}
        </span>
      </div>

      <div className={`text-lg md:text-xl font-black font-display tracking-tight my-1 ${
        isCrit ? 'text-[#ef4444]' : isWarn ? 'text-[#f59e0b]' : 'text-[#f8fafc]'
      }`}>
        {value}
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-[#64748b] border-t border-slate-800/80 pt-1 mt-1">
        <span>{nominal}</span>
        <span className="text-[#94a3b8]">{limit}</span>
      </div>
    </div>
  );
};

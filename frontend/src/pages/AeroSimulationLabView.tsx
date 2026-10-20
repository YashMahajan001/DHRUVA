import React, { useState, useEffect } from 'react';
import { useAero } from '../context/AeroContext';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Flame,
  Wind,
  Layers,
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
import {
  aeroApi,
  AeroFlightScenario,
  AeroTelemetryRecord,
  AeroTestReport,
} from '../services/aeroApi';

export const AeroSimulationLabView: React.FC = () => {
  const {
    currentEngine,
    flightParams,
    setFlightParams,
    injectedFaults,
    toggleFaultInjection,
    clearAllFaults,
    refreshTestHistory,
  } = useAero();

  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState<AeroFlightScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCEN-AERO-TAKEOFF');
  const [isRunningScenario, setIsRunningScenario] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<AeroTelemetryRecord[]>([]);
  const [candidateReport, setCandidateReport] = useState<AeroTestReport | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Available fault definitions for current engine category
  const categoryFaults = [
    { id: 'FAULT-TURBINE-CREEP', name: 'Turbine Blade Thermal Creep', desc: 'Increases EGT, erodes thrust and fuel efficiency' },
    { id: 'FAULT-COMPRESSOR-STALL', name: 'High-Pressure Compressor Stall', desc: 'Severe N2 oscillation and vibration spike' },
    { id: 'FAULT-OIL-LOSS', name: 'Lubrication Sump Scavenge Failure', desc: 'Rapid drop in oil pressure and temperature rise' },
    { id: 'FAULT-NOZZLE-CLOG', name: 'Fuel Injector Nozzle Coking', desc: 'Combustor hot streaks and fuel flow deviation' },
    { id: 'FAULT-SENSOR-DRIFT', name: 'Thermocouple Calibration Drift', desc: 'False indicated EGT with nominal core behavior' },
    { id: 'FAULT-CHT-DETONATION', name: 'Cylinder Head Detonation (Piston)', desc: 'Rapid CHT rise beyond 240°C limit' },
  ];

  // Fetch scenarios
  useEffect(() => {
    async function loadScenarios() {
      try {
        const scens = await aeroApi.getScenarios();
        setScenarios(scens);
      } catch (e) {
        console.error('Failed to load scenarios', e);
      }
    }
    loadScenarios();
  }, []);

  if (!currentEngine) {
    return <div className="p-8 text-center text-[#94a3b8] font-mono">Loading Simulation Lab...</div>;
  }

  // Execute Scenario Simulation Run
  const handleExecuteScenario = async () => {
    if (!currentEngine) return;
    setIsRunningScenario(true);
    setSaveStatus(null);
    try {
      // 1. Run time-series simulation
      const records = await aeroApi.runScenario({
        engine_id: currentEngine.engine_id,
        scenario_id: selectedScenarioId,
        injected_faults: injectedFaults,
        time_step_s: 1.0,
      });
      setSimResults(records);

      // 2. Generate baseline vs candidate test report
      const rep = await aeroApi.runTest({
        engine_id: currentEngine.engine_id,
        test_name: `Scenario Lab: ${selectedScenarioId}`,
        scenario_id: selectedScenarioId,
        injected_faults: Object.keys(injectedFaults),
        ambient_temp_c: flightParams.ambient_temp_c,
        altitude_m: flightParams.altitude_m,
      });
      setCandidateReport(rep);
      await refreshTestHistory();
    } catch (e: any) {
      console.error('Simulation execution failed', e);
    } finally {
      setIsRunningScenario(false);
    }
  };

  const activeScenario = scenarios.find((s) => s.scenario_id === selectedScenarioId) || scenarios[0];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#dee2f5] font-sans selection:bg-[#38bdf8] selection:text-[#080d1a]">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-[#f8fafc]">
              AEROSPACE SIMULATION LAB & TEST EXPERIMENTS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 font-mono font-bold">
              PHYSICS ENGINE
            </span>
          </div>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">
            Configure flight regimes, inject certified aerospace fault modes, and benchmark baseline vs candidate behavior.
          </p>
        </div>

        <button
          onClick={handleExecuteScenario}
          disabled={isRunningScenario}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#38bdf8] hover:to-[#0284c7] text-[#080d1a] font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {isRunningScenario ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunningScenario ? 'EXECUTING SIMULATION...' : 'RUN SCENARIO'}</span>
        </button>
      </div>

      {/* 2. Configuration & Fault Injection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* A. Flight Envelope Settings (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl space-y-4">
          <h2 className="font-bold text-sm text-[#f8fafc] flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-[#38bdf8]" />
            FLIGHT REGIME PARAMETERS
          </h2>

          <div className="space-y-4 font-mono text-xs">
            {/* Throttle (PLA) */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">THROTTLE (PLA):</span>
                <span className="text-[#38bdf8] font-bold">{Math.round(flightParams.throttle * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={flightParams.throttle}
                onChange={(e) => setFlightParams({ throttle: parseFloat(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>

            {/* Altitude */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">ALTITUDE:</span>
                <span className="text-[#38bdf8] font-bold">{Math.round(flightParams.altitude_m)} m</span>
              </div>
              <input
                type="range"
                min="0"
                max="12000"
                step="250"
                value={flightParams.altitude_m}
                onChange={(e) => setFlightParams({ altitude_m: parseFloat(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
              <div className="text-[10px] text-[#64748b]">
                ~FL{Math.round((flightParams.altitude_m * 3.28084) / 100)} ({Math.round(flightParams.altitude_m * 3.28084)} ft)
              </div>
            </div>

            {/* Static Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">STATIC TEMP (OAT):</span>
                <span className="text-[#38bdf8] font-bold">{flightParams.ambient_temp_c} °C</span>
              </div>
              <input
                type="range"
                min="-60"
                max="45"
                step="1"
                value={flightParams.ambient_temp_c}
                onChange={(e) => setFlightParams({ ambient_temp_c: parseFloat(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>

            {/* Mach Speed */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">AIRSPEED / MACH:</span>
                <span className="text-[#38bdf8] font-bold">Mach {flightParams.mach}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.86"
                step="0.02"
                value={flightParams.mach}
                onChange={(e) => setFlightParams({ mach: parseFloat(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* B. Scenario Selector & Mission Profiles (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl space-y-3">
          <h2 className="font-bold text-sm text-[#f8fafc] flex items-center gap-2 border-b border-slate-800 pb-2">
            <Wind className="w-4 h-4 text-[#38bdf8]" />
            SELECT MISSION SCENARIO
          </h2>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {scenarios.map((scen) => {
              const isSelected = scen.scenario_id === selectedScenarioId;
              return (
                <div
                  key={scen.scenario_id}
                  onClick={() => setSelectedScenarioId(scen.scenario_id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#f8fafc] shadow-md'
                      : 'bg-[#0f172a] border-slate-800 hover:border-[#38bdf8]/40 hover:bg-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#e0f2fe] mb-1">
                    <span>{scen.title}</span>
                    <span className="text-[10px] font-mono text-[#38bdf8]">{scen.duration_s}s</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] line-clamp-2">{scen.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Fault Injection Matrix (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-bold text-sm text-[#f8fafc] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              FAULT INJECTION MATRIX
            </h2>
            {Object.keys(injectedFaults).length > 0 && (
              <button
                onClick={clearAllFaults}
                className="text-[10px] font-mono text-[#ef4444] hover:underline"
              >
                Clear Injections
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
            {categoryFaults.map((f) => {
              const isInjected = injectedFaults[f.id] !== undefined;
              return (
                <div
                  key={f.id}
                  onClick={() => toggleFaultInjection(f.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isInjected
                      ? 'bg-[#ef4444]/15 border-[#ef4444] text-[#f8fafc] shadow-sm'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 text-[#94a3b8]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`font-bold block ${isInjected ? 'text-[#ef4444]' : 'text-[#e0f2fe]'}`}>
                      {f.name}
                    </span>
                    <span className="text-[10px] text-[#64748b] block">{f.desc}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isInjected ? 'bg-[#ef4444] text-white' : 'bg-slate-800 text-[#64748b]'
                  }`}>
                    {isInjected ? 'INJECTED' : 'NOMINAL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Baseline vs Candidate Comparison Section */}
      {candidateReport && (
        <div className="p-6 rounded-2xl bg-[#0b1329]/90 backdrop-blur-xl border border-[#38bdf8]/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-[#38bdf8] font-bold">BENCHMARK AUDIT:</span>
                <h3 className="font-bold text-lg text-[#f8fafc]">
                  Baseline Nominal vs Injected Fault Candidate
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                Test ID: {candidateReport.test_id} • Status: <strong className="text-[#38bdf8]">{candidateReport.status}</strong>
              </p>
            </div>

            <button
              onClick={() => navigate(`/aero/tests/${candidateReport.test_id}`)}
              className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/40 text-xs font-mono font-bold text-[#38bdf8] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Full Audit Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Deltas Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            {Object.entries(candidateReport.deltas).map(([k, v]) => (
              <div key={k} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider block">
                  {k.replace(/_/g, ' ')}
                </span>
                <div className={`text-2xl font-black font-display my-1 ${
                  v > 0 && k.includes('egt') ? 'text-[#ef4444]' : v < 0 && k.includes('thrust') ? 'text-[#ef4444]' : 'text-[#38bdf8]'
                }`}>
                  {v > 0 ? `+${v}` : v}
                </div>
                <div className="text-[10px] text-[#64748b]">Absolute delta vs baseline model</div>
              </div>
            ))}
          </div>

          {/* Time Series Telemetry Timeline Plot */}
          {candidateReport.telemetry_timeline.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#94a3b8] uppercase">
                SCENARIO TELEMETRY EXECUTION TIMELINE:
              </span>
              <div className="w-full h-64 bg-[#060a14] p-3 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={candidateReport.telemetry_timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time_s" stroke="#64748b" tick={{ fontSize: 10 }} unit="s" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#38bdf8', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="thrust_kn" stroke="#10b981" strokeWidth={2} name="Thrust (kN)" dot={false} />
                    <Line type="monotone" dataKey="egt" stroke="#ef4444" strokeWidth={2} name="EGT (°C)" dot={false} />
                    <Line type="monotone" dataKey="n1" stroke="#38bdf8" strokeWidth={2} name="N1 (%)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

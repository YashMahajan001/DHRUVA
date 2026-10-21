import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  TrendingUp,
  Gauge,
  Play,
  RotateCcw,
  Save,
  Download,
  Clock,
  ChevronRight,
  ShieldAlert,
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
import { useAuto, DEFAULT_TUNE } from '../../context/AutoContext';
import {
  autoApi,
  AutoTuneParameters,
  TuneValidationResponse,
  TuningTestReport,
} from '../../services/autoApi';

export const AutoTuningLabView: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentEngine,
    candidateTune,
    setCandidateTune,
    resetCandidateTune,
    refreshTestHistory,
  } = useAuto();

  // Tune Profile Name
  const [tuneName, setTuneName] = useState<string>('Custom Stage 1 Cal');

  // Backend Validation State
  const [validationResult, setValidationResult] = useState<TuneValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Long-Duration Simulation Runner State
  const [scenario, setScenario] = useState<string>('WOT Dyno Sweep');
  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [altitude, setAltitude] = useState<number>(0);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [lastTestReport, setLastTestReport] = useState<TuningTestReport | null>(null);

  // Validate Tune when parameters change
  useEffect(() => {
    if (!currentEngine) return;
    setIsValidating(true);
    const timer = setTimeout(() => {
      autoApi
        .validateTune(currentEngine.engine_id, candidateTune)
        .then((res) => {
          setValidationResult(res);
          setIsValidating(false);
        })
        .catch(() => {
          setIsValidating(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [candidateTune, currentEngine]);

  // Execute Simulation Test (Dyno Sweep / Long-Duration Test)
  const handleRunSimulationTest = async () => {
    if (!currentEngine || isTestRunning) return;
    if (validationResult?.status === 'INFEASIBLE') return;

    setIsTestRunning(true);
    setTestProgress(10);

    const progressInterval = setInterval(() => {
      setTestProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return p + 20;
      });
    }, 200);

    try {
      const report = await autoApi.runTuningTest({
        engine_id: currentEngine.engine_id,
        tune_name: tuneName,
        tune: candidateTune,
        scenario: scenario,
        ambient_temp_c: ambientTemp,
        altitude_m: altitude,
      });

      clearInterval(progressInterval);
      setTestProgress(100);
      setLastTestReport(report);
      await refreshTestHistory();
    } catch (err) {
      console.error('Test run failed', err);
    } finally {
      setTimeout(() => {
        setIsTestRunning(false);
        setTestProgress(0);
      }, 500);
    }
  };

  // Prepare Dyno Comparison Chart Data
  const dynoChartData = useMemo(() => {
    if (!currentEngine) return [];

    // If we have a completed test run for this tune, use its curves
    if (lastTestReport && lastTestReport.dyno_curves?.rpm) {
      const c = lastTestReport.dyno_curves;
      return c.rpm.map((r, i) => ({
        rpm: r,
        basePower: c.baseline_power_kw[i] || 0,
        tunedPower: c.tuned_power_kw[i] || 0,
        baseTorque: c.baseline_torque_nm[i] || 0,
        tunedTorque: c.tuned_torque_nm[i] || 0,
      }));
    }

    // Otherwise, generate live preview curves based on current candidateTune
    const redline = currentEngine.operating_limits.redline_rpm;
    const idle = currentEngine.operating_limits.idle_rpm;
    const baseKw = currentEngine.specifications.rated_power_kw;
    const baseNm = currentEngine.specifications.peak_torque_nm;

    const isTurbo = currentEngine.aspiration.includes('TURBO');
    const boostMult = isTurbo ? 1.0 + (candidateTune.target_boost_bar - 1.1) * 0.4 : 1.0;
    const timingMult = 1.0 + candidateTune.ignition_timing_offset_deg * 0.015;
    const afrMult = 1.0 + (13.0 - candidateTune.target_afr) * 0.02;
    const totalMult = Math.max(0.7, Math.min(1.4, boostMult * timingMult * afrMult));

    const points = [];
    for (let r = idle + 500; r <= redline; r += 500) {
      const frac = (r - idle) / (redline - idle);
      const tFactor = 4.0 * frac * (1.0 - frac * 0.7);
      const bNm = Math.round(baseNm * tFactor * 0.95);
      const tNm = Math.round(bNm * totalMult);
      const bKw = Math.round((bNm * 2 * Math.PI * r) / 60000);
      const tKw = Math.round((tNm * 2 * Math.PI * r) / 60000);

      points.push({
        rpm: r,
        basePower: bKw,
        tunedPower: tKw,
        baseTorque: bNm,
        tunedTorque: tNm,
      });
    }
    return points;
  }, [currentEngine, candidateTune, lastTestReport]);

  const powerGain = useMemo(() => {
    if (!currentEngine || dynoChartData.length === 0) return { kw: 0, pct: 0 };
    const maxBase = Math.max(...dynoChartData.map((d) => d.basePower));
    const maxTuned = Math.max(...dynoChartData.map((d) => d.tunedPower));
    const delta = maxTuned - maxBase;
    const pct = maxBase > 0 ? (delta / maxBase) * 100 : 0;
    return { kw: Math.round(delta * 10) / 10, pct: Math.round(pct * 10) / 10 };
  }, [dynoChartData, currentEngine]);

  const torqueGain = useMemo(() => {
    if (!currentEngine || dynoChartData.length === 0) return { nm: 0, pct: 0 };
    const maxBase = Math.max(...dynoChartData.map((d) => d.baseTorque));
    const maxTuned = Math.max(...dynoChartData.map((d) => d.tunedTorque));
    const delta = maxTuned - maxBase;
    const pct = maxBase > 0 ? (delta / maxBase) * 100 : 0;
    return { nm: Math.round(delta * 10) / 10, pct: Math.round(pct * 10) / 10 };
  }, [dynoChartData, currentEngine]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto text-[#dee2f5]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#3b494b]/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#dee2f5]">
              Tuning Lab
            </h1>
          </div>
        </div>

        {/* Tune Profile Name & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={tuneName}
            onChange={(e) => setTuneName(e.target.value)}
            className="bg-[#121829] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs px-3 py-1.5 rounded-lg focus:border-[#f59e0b]"
            placeholder="Tune Name..."
          />
          <button
            onClick={resetCandidateTune}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#849495] hover:text-[#dee2f5] bg-[#161b29] border border-[#3b494b]/40 hover:border-[#f59e0b]/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Top Split: Tuning Parameter Controls (6 cols) & Tune Validation (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tuning Controls (6 cols) */}
        <div className="lg:col-span-6 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
              <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
                ECU Calibration
              </span>
              <span className="text-[10px] font-mono text-[#849495]">
                Target: {currentEngine ? currentEngine.name : 'EA888'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
              {/* Rev Limit */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Rev Limit (Redline):</span>
                  <span className="font-bold text-[#f59e0b]">{candidateTune.rev_limit_rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="4000"
                  max="9000"
                  step="50"
                  value={candidateTune.rev_limit_rpm}
                  onChange={(e) => setCandidateTune({ rev_limit_rpm: parseFloat(e.target.value) })}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                  <span>OEM: {currentEngine ? currentEngine.operating_limits.redline_rpm : 6800}</span>
                  <span>Max: 9000</span>
                </div>
              </div>

              {/* Boost Target */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Target Boost:</span>
                  <span className="font-bold text-[#38bdf8]">{candidateTune.target_boost_bar.toFixed(2)} bar</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.5"
                  step="0.05"
                  value={candidateTune.target_boost_bar}
                  onChange={(e) => setCandidateTune({ target_boost_bar: parseFloat(e.target.value) })}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                  <span>Stock: {currentEngine?.aspiration.includes('TURBO') ? '1.1 bar' : '0 bar'}</span>
                  <span>Max Limit: 2.2 bar</span>
                </div>
              </div>

              {/* Ignition Timing Offset */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Ignition Advance:</span>
                  <span className="font-bold text-amber-400">
                    {candidateTune.ignition_timing_offset_deg >= 0 ? '+' : ''}
                    {candidateTune.ignition_timing_offset_deg.toFixed(1)}° BTDC
                  </span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="8.0"
                  step="0.5"
                  value={candidateTune.ignition_timing_offset_deg}
                  onChange={(e) => setCandidateTune({ ignition_timing_offset_deg: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                  <span>Retard (-6°)</span>
                  <span>Base (0°)</span>
                  <span>Advance (+8°)</span>
                </div>
              </div>

              {/* Target AFR (WOT) */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Target AFR (WOT):</span>
                  <span className="font-bold text-purple-400">{candidateTune.target_afr.toFixed(2)}:1</span>
                </div>
                <input
                  type="range"
                  min="10.5"
                  max="15.0"
                  step="0.1"
                  value={candidateTune.target_afr}
                  onChange={(e) => setCandidateTune({ target_afr: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#849495]">
                  <span>Rich (10.5)</span>
                  <span>Stoich (14.7)</span>
                  <span>Lean (15.0)</span>
                </div>
              </div>

              {/* Throttle Sensitivity Multiplier */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Drive-by-Wire Map:</span>
                  <span className="font-bold text-emerald-400">{candidateTune.throttle_sensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.05"
                  value={candidateTune.throttle_sensitivity}
                  onChange={(e) => setCandidateTune({ throttle_sensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Electric Fan Trigger Temp */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#090e1b] border border-[#3b494b]/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">Cooling Fan Trigger:</span>
                  <span className="font-bold text-cyan-400">{candidateTune.fan_trigger_temp_c.toFixed(0)}°C</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="105"
                  step="1"
                  value={candidateTune.fan_trigger_temp_c}
                  onChange={(e) => setCandidateTune({ fan_trigger_temp_c: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#3b494b]/30 flex items-center justify-between text-[10px] font-mono text-[#849495]">
            <span>Continuous parameters bound within safe ECU calibration ranges.</span>
          </div>
        </div>

        {/* Tune Validation Results (6 cols) */}
        <div className="lg:col-span-6 bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
              <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
                Feasibility Validation
              </span>
              <span className="text-[10px] font-mono text-[#849495]">
                {isValidating ? 'Validating...' : 'Real-time Checked'}
              </span>
            </div>

            {/* Status Banner */}
            <div
              className={`p-3 rounded-lg border my-3 flex items-center gap-3 ${
                validationResult?.status === 'INFEASIBLE'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                  : validationResult?.status === 'FEASIBLE_WITH_WARNINGS'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
              }`}
            >
              {validationResult?.status === 'INFEASIBLE' ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              ) : validationResult?.status === 'FEASIBLE_WITH_WARNINGS' ? (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              )}

              <div>
                <div className="font-bold text-xs uppercase tracking-wider font-mono">
                  {validationResult ? validationResult.status.replace(/_/g, ' ') : 'VALIDATING'}
                </div>
                <div className="text-[11px] font-sans mt-0.5">
                  {validationResult?.summary || 'Checking thermodynamic limits and mechanical stresses...'}
                </div>
              </div>
            </div>

            {/* Violations / Warnings List */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {validationResult && validationResult.violations.length > 0 ? (
                validationResult.violations.map((v, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs font-mono ${
                      v.severity === 'CRITICAL'
                        ? 'bg-[#090e1b] border-rose-500/40 text-rose-300'
                        : 'bg-[#090e1b] border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{v.parameter}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161b29]">
                        {v.candidate_value} {v.unit} (Limit: {v.limit} {v.unit})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#dee2f5] mt-1 font-sans leading-snug">{v.explanation}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-[#090e1b] border border-emerald-500/20 text-center text-xs font-mono text-emerald-300">
                  ✓ All candidate calibration settings are within modeled structural, knock & thermal margins.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#3b494b]/30 flex items-center justify-between text-[10px] font-mono text-[#849495]">
            <span>Provenance: {validationResult?.model_provenance || 'Dhruva Auto v2.4'}</span>
            {validationResult?.status === 'INFEASIBLE' && (
              <span className="text-rose-400 font-bold">Execution Blocked</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Baseline-versus-Tuned Performance Comparison (Dyno Curves) */}
      <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/30">
          <div>
            <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
              Dyno Comparison · Baseline vs Candidate
            </span>
            <div className="text-[10px] font-mono text-[#849495] mt-0.5">
              WOT sweep idle to redline.
            </div>
          </div>

          {/* Delta KPI Badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1 rounded-lg bg-[#090e1b] border border-[#38bdf8]/40">
              <span className="text-[#849495]">Peak Power: </span>
              <span className={`font-bold ${powerGain.kw >= 0 ? 'text-[#38bdf8]' : 'text-rose-400'}`}>
                {powerGain.kw >= 0 ? '+' : ''}
                {powerGain.kw} kW ({powerGain.pct >= 0 ? '+' : ''}
                {powerGain.pct}%)
              </span>
            </div>

            <div className="px-3 py-1 rounded-lg bg-[#090e1b] border border-[#f59e0b]/40">
              <span className="text-[#849495]">Peak Torque: </span>
              <span className={`font-bold ${torqueGain.nm >= 0 ? 'text-[#f59e0b]' : 'text-rose-400'}`}>
                {torqueGain.nm >= 0 ? '+' : ''}
                {torqueGain.nm} Nm ({torqueGain.pct >= 0 ? '+' : ''}
                {torqueGain.pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Dyno Curves Chart */}
        <div className="h-[300px] w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dynoChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263339" vertical={false} />
              <XAxis dataKey="rpm" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" RPM" />
              <YAxis
                yAxisId="power"
                stroke="#38bdf8"
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                unit=" kW"
              />
              <YAxis
                yAxisId="torque"
                orientation="right"
                stroke="#f59e0b"
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                unit=" Nm"
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
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

              {/* Baseline Curves (Dashed) */}
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="basePower"
                name="Baseline Power (kW)"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="torque"
                type="monotone"
                dataKey="baseTorque"
                name="Baseline Torque (Nm)"
                stroke="#78716c"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />

              {/* Tuned Curves (Solid) */}
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="tunedPower"
                name="Tuned Power (kW)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="torque"
                type="monotone"
                dataKey="tunedTorque"
                name="Tuned Torque (Nm)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Long-Duration Test Runner & Simulation Trigger */}
      <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col gap-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/30">
          <div>
            <span className="font-mono text-xs text-[#f59e0b] font-bold uppercase">
              EXECUTE SIMULATION TEST RUN
            </span>
            <div className="text-[10px] font-mono text-[#849495] mt-0.5">
              Runs endurance duty cycles or high-load sweeps and records to persistent Test History.
            </div>
          </div>

          <button
            onClick={handleRunSimulationTest}
            disabled={isTestRunning || validationResult?.status === 'INFEASIBLE'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
              validationResult?.status === 'INFEASIBLE'
                ? 'bg-[#161b29] text-[#849495] border border-[#3b494b]/40 cursor-not-allowed'
                : isTestRunning
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500 animate-pulse'
                : 'bg-[#f59e0b] hover:bg-[#d97706] text-[#090e1b] shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{isTestRunning ? `RUNNING TEST (${testProgress}%)` : 'EXECUTE SIMULATION TEST'}</span>
          </button>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#849495] uppercase">Test Scenario:</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg"
            >
              <option value="WOT Dyno Sweep">WOT Dyno Sweep (30s Full Power)</option>
              <option value="Track Day Endurance">Track Day Endurance (120s High Thermal Load)</option>
              <option value="High-Load Mountain Pass">High-Load Mountain Pass (Elevated Gradient)</option>
              <option value="Highway Cruise Efficiency">Highway Cruise Efficiency (Fuel Economy)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#849495] uppercase">Ambient Temp (°C):</label>
            <input
              type="number"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 25)}
              className="bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#849495] uppercase">Elevation (m):</label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
              className="bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs p-2 rounded-lg"
            />
          </div>
        </div>

        {/* Last Test Result Flash Banner */}
        {lastTestReport && (
          <div className="p-3 rounded-lg bg-[#090e1b] border border-[#f59e0b]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#f59e0b]">
                  {lastTestReport.test_id}
                </span>
                <span className="text-xs font-bold text-[#dee2f5]">
                  {lastTestReport.tune_name} — {lastTestReport.scenario}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    lastTestReport.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {lastTestReport.status}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#849495] mt-1">
                Power: {lastTestReport.tuned_metrics.peak_power_kw} kW (+{lastTestReport.deltas.power_delta_pct}%) • Torque:{' '}
                {lastTestReport.tuned_metrics.peak_torque_nm} Nm (+{lastTestReport.deltas.torque_delta_pct}%) • Max Coolant:{' '}
                {lastTestReport.tuned_metrics.max_coolant_temp_c}°C
              </div>
            </div>

            <button
              onClick={() => navigate('/auto/tests')}
              className="flex items-center gap-1 text-xs font-mono text-[#f59e0b] hover:underline font-bold"
            >
              <span>View Full Report in Test History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

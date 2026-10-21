import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  ChevronRight,
  ExternalLink,
  Layers,
  Calendar,
  Zap,
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
import { useAuto } from '../../context/AutoContext';
import { TuningTestReport } from '../../services/autoApi';

export const AutoTestHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const { testHistory, currentEngine } = useAuto();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'WARNING' | 'FAILED'>('ALL');
  const [engineFilter, setEngineFilter] = useState<string>('ALL');

  // Selected Test for Detail Modal
  const [activeReport, setActiveReport] = useState<TuningTestReport | null>(null);

  // Extract unique engines in test history
  const engineOptions = useMemo(() => {
    const ids = Array.from(new Set(testHistory.map((t) => t.engine_name)));
    return ['ALL', ...ids];
  }, [testHistory]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return testHistory.filter((t) => {
      const matchSearch =
        t.test_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.engine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tune_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.scenario.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchEngine = engineFilter === 'ALL' || t.engine_name === engineFilter;
      return matchSearch && matchStatus && matchEngine;
    });
  }, [testHistory, searchQuery, statusFilter, engineFilter]);

  // Export JSON Report
  const handleExportJson = (report: TuningTestReport) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.test_id}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto text-[#dee2f5]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#3b494b]/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#dee2f5] uppercase">
              Simulation Test History
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40">
              AUDIT TRAIL
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/auto/tuning')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#f59e0b] text-[#090e1b] hover:bg-[#d97706] shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
        >
          <span>Run New Simulation</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#849495] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Test ID, Engine, or Tune Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs pl-9 pr-3 py-2 rounded-lg focus:border-[#f59e0b]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <select
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
            className="bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs px-2.5 py-2 rounded-lg"
          >
            {engineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'ALL' ? 'All Engines' : opt}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#090e1b] border border-[#3b494b]/50 text-[#dee2f5] font-mono text-xs px-2.5 py-2 rounded-lg"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="WARNING">Warning</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* 3. Test History Table */}
      <div className="bg-[#121829]/90 border border-[#3b494b]/40 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#090e1b] border-b border-[#3b494b]/40 text-[#849495] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Tune Configuration</th>
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Power Delta</th>
                <th className="py-3 px-4 text-right">Torque Delta</th>
                <th className="py-3 px-4 text-center">Faults</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b494b]/20">
              {filteredTests.length > 0 ? (
                filteredTests.map((t) => (
                  <tr
                    key={t.test_id}
                    className="hover:bg-[#161b29]/80 transition-colors cursor-pointer group"
                    onClick={() => setActiveReport(t)}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#f59e0b]">{t.test_id}</td>
                    <td className="py-3.5 px-4 text-[#dee2f5] font-medium">{t.engine_name}</td>
                    <td className="py-3.5 px-4 text-[#b9cacb]">{t.tune_name}</td>
                    <td className="py-3.5 px-4 text-[#849495]">{t.scenario}</td>
                    <td className="py-3.5 px-4 text-[#849495] text-[11px]">
                      {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                            : t.status === 'WARNING'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#38bdf8]">
                      {t.deltas.power_delta_pct >= 0 ? '+' : ''}
                      {t.deltas.power_delta_pct}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#fbbf24]">
                      {t.deltas.torque_delta_pct >= 0 ? '+' : ''}
                      {t.deltas.torque_delta_pct}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {t.fault_events.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                          {t.fault_events.length}
                        </span>
                      ) : (
                        <span className="text-[#849495]">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReport(t);
                        }}
                        className="p-1 rounded bg-[#090e1b] border border-[#3b494b]/50 hover:border-[#f59e0b] text-[#f59e0b] transition-colors"
                        title="View Detailed Test Report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#849495] font-mono">
                    No simulation test runs match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Detailed Test Report Modal */}
      {activeReport && (
        <div
          className="fixed inset-0 bg-[#090e1b]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveReport(null)}
        >
          <div
            className="bg-[#121829] border border-[#f59e0b]/40 rounded-2xl w-full max-w-4xl p-6 flex flex-col gap-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#3b494b]/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
                    {activeReport.test_id}
                  </span>
                  <h2 className="text-lg font-bold text-[#dee2f5]">{activeReport.tune_name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      activeReport.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {activeReport.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#849495] mt-1">
                  Engine: <span className="text-[#dee2f5] font-bold">{activeReport.engine_name}</span> • Scenario:{' '}
                  <span className="text-[#dee2f5]">{activeReport.scenario}</span> • Recorded:{' '}
                  {new Date(activeReport.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportJson(activeReport)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#161b29] border border-[#f59e0b]/40 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#090e1b] transition-all"
                  title="Export Test Report to JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1.5 rounded-lg text-[#849495] hover:text-[#dee2f5] bg-[#161b29]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Performance Comparison KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40">
                <div className="text-[10px] text-[#849495] uppercase">Peak Power</div>
                <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                  {activeReport.tuned_metrics.peak_power_kw} kW{' '}
                  <span className="text-xs text-emerald-400 font-normal">
                    (+{activeReport.deltas.power_delta_pct}%)
                  </span>
                </div>
                <div className="text-[10px] text-[#849495]">Stock: {activeReport.baseline_metrics.peak_power_kw} kW</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40">
                <div className="text-[10px] text-[#849495] uppercase">Peak Torque</div>
                <div className="text-base font-bold text-[#f59e0b] mt-0.5">
                  {activeReport.tuned_metrics.peak_torque_nm} Nm{' '}
                  <span className="text-xs text-emerald-400 font-normal">
                    (+{activeReport.deltas.torque_delta_pct}%)
                  </span>
                </div>
                <div className="text-[10px] text-[#849495]">Stock: {activeReport.baseline_metrics.peak_torque_nm} Nm</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40">
                <div className="text-[10px] text-[#849495] uppercase">Max Coolant Temp</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {activeReport.tuned_metrics.max_coolant_temp_c}°C
                </div>
                <div className="text-[10px] text-[#849495]">
                  Delta: +{activeReport.deltas.thermal_delta_c}°C
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40">
                <div className="text-[10px] text-[#849495] uppercase">BSFC Efficiency</div>
                <div className="text-base font-bold text-[#dee2f5] mt-0.5">
                  {activeReport.tuned_metrics.avg_bsfc_g_kwh} g/kWh
                </div>
                <div className="text-[10px] text-[#849495]">
                  Delta: +{activeReport.deltas.bsfc_delta_pct}%
                </div>
              </div>
            </div>

            {/* Overlaid Dyno Curve in Modal */}
            {activeReport.dyno_curves?.rpm && (
              <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40 flex flex-col gap-2">
                <div className="text-xs font-mono font-bold text-[#f59e0b]">
                  DYNAMOMETER RPM SWEEP COMPARISON
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activeReport.dyno_curves.rpm.map((r, i) => ({
                        rpm: r,
                        basePower: activeReport.dyno_curves.baseline_power_kw[i],
                        tunedPower: activeReport.dyno_curves.tuned_power_kw[i],
                        baseTorque: activeReport.dyno_curves.baseline_torque_nm[i],
                        tunedTorque: activeReport.dyno_curves.tuned_torque_nm[i],
                      }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#263339" vertical={false} />
                      <XAxis dataKey="rpm" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" RPM" />
                      <YAxis
                        yAxisId="p"
                        stroke="#38bdf8"
                        domain={[0, 'auto']}
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        yAxisId="t"
                        orientation="right"
                        stroke="#f59e0b"
                        domain={[0, 'auto']}
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090e1b',
                          borderColor: '#f59e0b',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                        }}
                      />
                      <Line yAxisId="p" type="monotone" dataKey="basePower" name="Base Power" stroke="#64748b" strokeDasharray="3 3" dot={false} />
                      <Line yAxisId="p" type="monotone" dataKey="tunedPower" name="Tuned Power" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      <Line yAxisId="t" type="monotone" dataKey="baseTorque" name="Base Torque" stroke="#78716c" strokeDasharray="3 3" dot={false} />
                      <Line yAxisId="t" type="monotone" dataKey="tunedTorque" name="Tuned Torque" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Generated Fault Events */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono font-bold text-[#f59e0b] uppercase">
                Diagnostic Fault Events Logged During Test ({activeReport.fault_events.length})
              </span>
              {activeReport.fault_events.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {activeReport.fault_events.map((fe, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#090e1b] border border-amber-500/40 text-xs font-mono">
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                            {fe.fault_code}
                          </span>
                          <span className="text-[#dee2f5]">{fe.name}</span>
                        </div>
                        <span className="text-[10px] text-[#849495]">@ t = {fe.timestamp_s}s</span>
                      </div>
                      <p className="text-[11px] text-[#b9cacb] mt-1 font-sans">{fe.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#090e1b] border border-emerald-500/30 text-xs font-mono text-emerald-300">
                  ✓ No DTC fault events or thermal envelope excursions logged during this test cycle.
                </div>
              )}
            </div>

            {/* Calibration Parameters Summary */}
            <div className="p-3 rounded-xl bg-[#090e1b] border border-[#3b494b]/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-[#849495]">Rev Limit:</span>{' '}
                <span className="font-bold text-[#dee2f5]">{activeReport.tune_parameters.rev_limit_rpm} RPM</span>
              </div>
              <div>
                <span className="text-[#849495]">Boost Target:</span>{' '}
                <span className="font-bold text-[#dee2f5]">{activeReport.tune_parameters.target_boost_bar} bar</span>
              </div>
              <div>
                <span className="text-[#849495]">Timing Offset:</span>{' '}
                <span className="font-bold text-[#dee2f5]">{activeReport.tune_parameters.ignition_timing_offset_deg}°</span>
              </div>
              <div>
                <span className="text-[#849495]">Target AFR:</span>{' '}
                <span className="font-bold text-[#dee2f5]">{activeReport.tune_parameters.target_afr}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

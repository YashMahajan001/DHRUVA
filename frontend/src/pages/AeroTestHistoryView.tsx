import React, { useState, useEffect } from 'react';
import { useAero } from '../context/AeroContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  ShieldAlert,
  Cpu,
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
import { aeroApi, AeroTestReport } from '../services/aeroApi';

export const AeroTestHistoryView: React.FC = () => {
  const { testHistory, refreshTestHistory } = useAero();
  const { testId } = useParams<{ testId?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<AeroTestReport | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // If URL has :testId, load it
  useEffect(() => {
    if (testId) {
      setIsLoadingDetail(true);
      aeroApi
        .getTestReport(testId)
        .then((rep) => setSelectedReport(rep))
        .catch((err) => console.error(err))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setSelectedReport(null);
    }
  }, [testId]);

  const filteredTests = testHistory.filter((test) => {
    const matchesSearch =
      test.test_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.engine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Detailed Report View
  if (selectedReport) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto text-[#dee2f5] font-sans selection:bg-[#38bdf8] selection:text-[#080d1a]">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/aero/tests')}
          className="flex items-center gap-2 text-xs font-mono text-[#38bdf8] hover:underline cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Test Records</span>
        </button>

        {/* Report Header */}
        <div className="p-6 rounded-2xl bg-[#0b1329]/90 backdrop-blur-xl border border-[#38bdf8]/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#38bdf8] font-bold">
                  TEST AUDIT RECORD:
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-[#cbd5e1]">
                  {selectedReport.test_id}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  selectedReport.status === 'COMPLETED'
                    ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                    : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 animate-pulse'
                }`}>
                  {selectedReport.status}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black font-display text-[#f8fafc] mt-1">
                {selectedReport.test_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#94a3b8] mt-2">
                <span>Engine: <strong className="text-[#e0f2fe]">{selectedReport.engine_name}</strong></span>
                <span>Scenario: <strong className="text-[#38bdf8]">{selectedReport.scenario_id}</strong></span>
                <span>Duration: <strong>{selectedReport.duration_s}s</strong></span>
                <span>Timestamp: <strong>{new Date(selectedReport.timestamp).toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="text-right font-mono p-3 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="text-[10px] text-[#94a3b8] uppercase block">HEALTH SCORE:</span>
              <span className={`text-2xl font-bold ${
                selectedReport.health_score_pct >= 85 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}>
                {selectedReport.health_score_pct}%
              </span>
            </div>
          </div>

          {/* Faults Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-[#94a3b8] uppercase block font-bold">
                INJECTED FAULT SCENARIOS:
              </span>
              {selectedReport.faults_injected.length > 0 ? (
                <div className="space-y-1">
                  {selectedReport.faults_injected.map((f) => (
                    <span key={f} className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] mr-1">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#10b981]">None (Nominal Baseline Run)</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-[#94a3b8] uppercase block font-bold">
                DIAGNOSTIC ANOMALIES DETECTED:
              </span>
              {selectedReport.faults_detected.length > 0 ? (
                <div className="space-y-1">
                  {selectedReport.faults_detected.map((f) => (
                    <span key={f} className="inline-block px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] mr-1">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#10b981]">✓ Zero Exceedances or Envelope Violations</span>
              )}
            </div>
          </div>

          {/* Baseline vs Candidate Deltas */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#38bdf8] uppercase font-bold">
              PERFORMANCE DELTA BENCHMARK:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              {Object.entries(selectedReport.deltas).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                  <span className="text-[10px] text-[#94a3b8] uppercase block">{k.replace(/_/g, ' ')}</span>
                  <span className={`text-xl font-bold my-1 block ${
                    v > 0 && k.includes('egt') ? 'text-[#ef4444]' : 'text-[#38bdf8]'
                  }`}>
                    {v > 0 ? `+${v}` : v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Timeline Chart */}
          {selectedReport.telemetry_timeline.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-[#38bdf8] uppercase font-bold">
                SYNCHRONIZED TELEMETRY TIMELINE:
              </span>
              <div className="w-full h-72 bg-[#060a14] p-3 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedReport.telemetry_timeline}>
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

          {/* Model Assumptions & Disclaimers */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 text-xs font-mono text-[#94a3b8] space-y-1">
            <div className="font-bold text-[#e0f2fe] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Model Assumptions & Aerospace Engineering Boundaries:</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1]">{selectedReport.model_assumptions}</p>
            <div className="text-[10px] text-[#64748b] pt-1">
              Model Version: {selectedReport.model_version} • Certified TCDS Digital Twin Prototype.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table View (All Tests)
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#dee2f5] font-sans selection:bg-[#38bdf8] selection:text-[#080d1a]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-[#f8fafc]">
              PERSISTENT FLIGHT TEST & SIMULATION HISTORY
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 font-mono font-bold">
              AUDIT LOG
            </span>
          </div>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">
            Certified record of simulated flight regimes, injected faults, and diagnostic anomaly reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/aero/simulation')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/40 text-xs font-mono font-bold text-[#38bdf8] transition-all cursor-pointer shadow-md"
        >
          <span>Run New Experiment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <Search className="w-4 h-4 text-[#7dd3fc]" />
          <input
            type="text"
            placeholder="Search by Test ID, engine, or scenario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#f8fafc] outline-none placeholder:text-[#64748b] font-mono"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] text-[#64748b] uppercase mr-1">STATUS:</span>
          {['ALL', 'COMPLETED', 'ANOMALY_DETECTED', 'CRITICAL_EXCEEDANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[10px] ${
                statusFilter === st
                  ? 'bg-[#38bdf8] text-[#080d1a] font-bold'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc] border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Test Records Table */}
      <div className="p-1 rounded-2xl bg-[#0b1329]/80 backdrop-blur-xl border border-[#38bdf8]/20 shadow-xl overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-[#7dd3fc] uppercase">
              <th className="py-3 px-4">Test ID</th>
              <th className="py-3 px-4">Engine Model</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Scenario</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Faults Injected / Detected</th>
              <th className="py-3 px-4">Health</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <tr
                  key={test.test_id}
                  className="hover:bg-[#0f172a]/60 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/aero/tests/${test.test_id}`)}
                >
                  <td className="py-3 px-4 font-bold text-[#38bdf8]">
                    {test.test_id}
                  </td>
                  <td className="py-3 px-4 text-[#f8fafc] font-bold">
                    {test.engine_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-[#cbd5e1] border border-slate-700">
                      {test.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#94a3b8]">
                    {test.scenario_id}
                  </td>
                  <td className="py-3 px-4 text-[#94a3b8]">
                    {test.duration_s}s
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      test.status === 'COMPLETED'
                        ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#94a3b8]">
                    <span>{test.faults_injected.length} Inj / </span>
                    <strong className={test.faults_detected.length > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>
                      {test.faults_detected.length} Det
                    </strong>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#f8fafc]">
                    {test.health_score_pct}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/aero/tests/${test.test_id}`);
                      }}
                      className="px-2.5 py-1 rounded bg-[#0f172a] hover:bg-[#38bdf8] text-[#38bdf8] hover:text-[#080d1a] border border-[#38bdf8]/40 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Report</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#94a3b8] font-mono">
                  No simulation test records match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

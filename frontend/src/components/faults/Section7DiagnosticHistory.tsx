import React, { useState } from 'react';
import { useDashboard } from '../../context/FaultDiagnosticsContext';
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface DiagnosticHistoryRecord {
  id: string;
  timestamp: string;
  faultId: string;
  component: string;
  severity: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  diagnosis: string;
  action: string;
  status: 'ACTIVE' | 'RESOLVED' | 'MONITORED' | 'CLEARED';
}

export const Section7DiagnosticHistory: React.FC = () => {
  const { showToast } = useDashboard();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [componentFilter, setComponentFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('CURRENT_SORTIE');

  // Comprehensive historical diagnostics dataset
  const records: DiagnosticHistoryRecord[] = [
    {
      id: 'rec-1',
      timestamp: '2026-09-06 13:50:12 UTC',
      faultId: 'FLT-9824-01',
      component: 'Cylinder #2 Fin Assembly',
      severity: 'WARNING',
      diagnosis: 'Convective heat dissipation stagnation; CHT peaked at 178.4°C.',
      action: 'Advised cruise throttle derate to 78%; scheduled borescope.',
      status: 'ACTIVE',
    },
    {
      id: 'rec-2',
      timestamp: '2026-09-06 12:28:40 UTC',
      faultId: 'FLT-9824-02',
      component: 'Cowling Air Baffle',
      severity: 'WATCH',
      diagnosis: 'Heat flux residual decayed -4.2% vs twin baseline envelope.',
      action: 'Autonomous logging triggered; air velocity monitored.',
      status: 'MONITORED',
    },
    {
      id: 'rec-3',
      timestamp: '2026-09-06 11:15:20 UTC',
      faultId: 'FLT-9824-00',
      component: 'Spark CDI Magneto',
      severity: 'NORMAL',
      diagnosis: 'Autonomous CDI dual ignition switch pass (RPM drop <40).',
      action: 'Ignition airworthiness certified for flight sortie.',
      status: 'CLEARED',
    },
    {
      id: 'rec-4',
      timestamp: '2026-08-28 09:42:15 UTC',
      faultId: 'FLT-8812-04',
      component: 'Right Bank Baffle Clip',
      severity: 'WARNING',
      diagnosis: 'Vibrational loosening of acoustic baffle retainer clip.',
      action: 'Re-torqued fastener to 8.5 Nm; safety wire replaced.',
      status: 'RESOLVED',
    },
    {
      id: 'rec-5',
      timestamp: '2026-08-14 16:20:00 UTC',
      faultId: 'FLT-7419-02',
      component: 'Cylinder #2 Fin Shroud',
      severity: 'WATCH',
      diagnosis: 'Micro-soot deposition in fin channels restricting airflow.',
      action: 'Ultrasonic solvent wash conducted at depot turnaround.',
      status: 'RESOLVED',
    },
    {
      id: 'rec-6',
      timestamp: '2026-07-22 14:05:33 UTC',
      faultId: 'FLT-6912-01',
      component: 'Wastegate Pneumatic Solenoid',
      severity: 'WARNING',
      diagnosis: 'Actuator hysteresis delay of +140ms in bypass loop.',
      action: 'Pneumatic line cleaned and solenoid seal replaced.',
      status: 'RESOLVED',
    },
    {
      id: 'rec-7',
      timestamp: '2026-06-11 08:30:10 UTC',
      faultId: 'FLT-5104-03',
      component: 'Lube Scavenge Filter',
      severity: 'CRITICAL',
      diagnosis: 'Filter differential pressure exceeded 0.85 bar threshold.',
      action: 'Filter element replaced; chip detector inspected.',
      status: 'RESOLVED',
    },
  ];

  // Filtering Logic
  const filteredRecords = records.filter(rec => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      rec.faultId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.action.toLowerCase().includes(searchTerm.toLowerCase());

    // Severity filter
    const matchesSeverity =
      severityFilter === 'ALL' || rec.severity === severityFilter;

    // Component filter
    const matchesComponent =
      componentFilter === 'ALL' ||
      (componentFilter === 'CYLINDER' && rec.component.toLowerCase().includes('cylinder')) ||
      (componentFilter === 'BAFFLE' && rec.component.toLowerCase().includes('baffle')) ||
      (componentFilter === 'IGNITION' && rec.component.toLowerCase().includes('spark')) ||
      (componentFilter === 'LUBE' && rec.component.toLowerCase().includes('lube'));

    // Date range filter
    const matchesDate =
      dateRange === 'ALL' ||
      (dateRange === 'CURRENT_SORTIE' && rec.timestamp.startsWith('2026-09-06')) ||
      (dateRange === 'LAST_30_DAYS' && (rec.timestamp.includes('2026-09') || rec.timestamp.includes('2026-08')));

    return matchesSearch && matchesSeverity && matchesComponent && matchesDate;
  });

  const exportCsv = () => {
    const headers = ['Timestamp,Fault ID,Component,Severity,Diagnosis,Action,Status'];
    const rows = filteredRecords.map(
      r => `"${r.timestamp}","${r.faultId}","${r.component}","${r.severity}","${r.diagnosis}","${r.action}","${r.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DHRUVAA_Diagnostic_History_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported diagnostic history to CSV.', 'success');
  };

  return (
    <section
      id="section-7-diagnostic-history"
      className="w-full rounded-xl border border-[#3b494b]/50 bg-[#161b29]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col gap-4"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base tracking-wider text-[#dee2f5] uppercase">
              Engine Diagnostic History
            </h3>
            <p className="font-mono-telemetry text-xs text-[#849495]">
              Full-Mission Historical Telemetry Log &amp; Maintenance Audit Archive
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={exportCsv}
          className="py-1.5 px-3 rounded-lg bg-[#090e1b] hover:bg-[#1a1f2d] border border-[#3b494b]/60 text-[#dee2f5] hover:text-[#00f0ff] font-mono-telemetry text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>EXPORT AUDIT LOG (CSV)</span>
        </button>
      </div>

      {/* SEARCH & FILTER BAR (Strictly includes: Search, Filter, Date range, Severity filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 font-mono-telemetry text-xs">
        {/* 1. Search Box (5 Cols) */}
        <div className="lg:col-span-5 relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#849495] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Fault ID, Component, or Diagnosis..."
            className="w-full bg-[#090e1b] border border-[#3b494b]/60 focus:border-[#00f0ff] rounded-lg pl-9 pr-3 py-2 text-xs text-[#dee2f5] placeholder-[#849495] outline-none transition-colors"
          />
        </div>

        {/* 2. Severity Filter (2 Cols) */}
        <div className="lg:col-span-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-[#090e1b] border border-[#3b494b]/60 focus:border-[#00f0ff] rounded-lg px-3 py-2 text-xs text-[#dee2f5] outline-none cursor-pointer uppercase font-bold"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="WATCH">WATCH</option>
            <option value="NORMAL">NORMAL</option>
          </select>
        </div>

        {/* 3. Component Filter (2 Cols) */}
        <div className="lg:col-span-2">
          <select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            className="w-full bg-[#090e1b] border border-[#3b494b]/60 focus:border-[#00f0ff] rounded-lg px-3 py-2 text-xs text-[#dee2f5] outline-none cursor-pointer uppercase font-bold"
          >
            <option value="ALL">ALL COMPONENTS</option>
            <option value="CYLINDER">CYLINDER HEADS</option>
            <option value="BAFFLE">COOLING BAFFLES</option>
            <option value="IGNITION">IGNITION / CDI</option>
            <option value="LUBE">LUBRICATION / OIL</option>
          </select>
        </div>

        {/* 4. Date Range Selector (3 Cols) */}
        <div className="lg:col-span-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-[#090e1b] border border-[#3b494b]/60 focus:border-[#00f0ff] rounded-lg px-3 py-2 text-xs text-[#dee2f5] outline-none cursor-pointer uppercase font-bold"
          >
            <option value="CURRENT_SORTIE">CURRENT SORTIE (TODAY)</option>
            <option value="LAST_30_DAYS">LAST 30 DAYS</option>
            <option value="ALL">ALL MISSIONS (FLEET ARCHIVE)</option>
          </select>
        </div>
      </div>

      {/* FULL-WIDTH HISTORICAL DIAGNOSTICS TABLE */}
      {/* Required Columns: Timestamp, Fault ID, Component, Severity, Diagnosis, Action, Status */}
      <div className="w-full overflow-x-auto rounded-lg border border-[#3b494b]/50 bg-[#0e1320]">
        <table className="w-full text-left font-mono-telemetry text-xs border-collapse">
          <thead>
            <tr className="bg-[#161b29] border-b border-[#3b494b]/60 text-[#849495] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">TIMESTAMP</th>
              <th className="py-3 px-4">FAULT ID</th>
              <th className="py-3 px-4">COMPONENT</th>
              <th className="py-3 px-4">SEVERITY</th>
              <th className="py-3 px-4">DIAGNOSIS</th>
              <th className="py-3 px-4">ACTION</th>
              <th className="py-3 px-4">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b494b]/30 text-[#dee2f5]">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#849495]">
                  No historical diagnostic events matching current filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => {
                const isCritical = record.severity === 'CRITICAL';
                const isWarning = record.severity === 'WARNING';
                const isWatch = record.severity === 'WATCH';

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-[#161b29]/80 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#849495] whitespace-nowrap text-[11px]">
                      {record.timestamp}
                    </td>

                    {/* Fault ID */}
                    <td className="py-3 px-4 text-[#00f0ff] font-bold whitespace-nowrap">
                      {record.faultId}
                    </td>

                    {/* Component */}
                    <td className="py-3 px-4 text-[#dee2f5] font-semibold whitespace-nowrap">
                      {record.component}
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isCritical
                            ? 'bg-[#93000a] text-[#ffdad6] border-[#ef4444]'
                            : isWarning
                              ? 'bg-[#303443] text-[#b4c5ff] border-[#b4c5ff]/60'
                              : isWatch
                                ? 'bg-[#161b29] text-[#7df4ff] border-[#00f0ff]/30'
                                : 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                        }`}
                      >
                        {record.severity}
                      </span>
                    </td>

                    {/* Diagnosis */}
                    <td className="py-3 px-4 text-[#b9cacb] max-w-xs truncate text-[11px]" title={record.diagnosis}>
                      {record.diagnosis}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-[#dee2f5] max-w-xs truncate text-[11px]" title={record.action}>
                      {record.action}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.status === 'ACTIVE'
                            ? 'text-[#ffb4ab] bg-[#ffb4ab]/15'
                            : record.status === 'MONITORED'
                              ? 'text-[#b4c5ff] bg-[#303443]'
                              : 'text-[#00f0ff] bg-[#00f0ff]/10'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between font-mono-telemetry text-[11px] text-[#849495] pt-1">
        <span>SHOWING {filteredRecords.length} OF {records.length} HISTORICAL RECORDS</span>
        <span>DATABASE COMPLIANCE: MIL-STD-1553B TELEMETRY BUS</span>
      </div>
    </section>
  );
};

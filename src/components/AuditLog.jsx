import React, { useState } from 'react';
import { FileText, Download, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AuditLog({ logs = [], tempUnit, convertTemp }) {
  const [filter, setFilter] = useState('all');

  const filteredLogs = logs.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'breach') return item.type === 'breach' || item.type === 'excursion';
    if (filter === 'normal') return item.type === 'normal';
    return true;
  });

  const downloadCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Timestamp", "Time", "Event", "Temperature (°C)", "Humidity (%)", "Lid Status", "Distance (cm)", "Status"];
    const rows = logs.map(l => [
      l.timestamp || new Date().toISOString(),
      l.time || '',
      `"${l.message || ''}"`,
      l.temperature !== undefined ? l.temperature : '',
      l.humidity !== undefined ? l.humidity : '',
      l.lid || '',
      l.distance !== undefined ? l.distance : '',
      l.status || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cold_chain_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 sm:p-6 mb-6">
      
      {/* Title & CSV download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Audit Trail & Event Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological inspection log for quality assurance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md ${filter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('breach')}
              className={`px-2.5 py-1 rounded-md ${filter === 'breach' ? 'bg-rose-950/50 text-rose-300 font-medium' : 'text-slate-400'}`}
            >
              Excursions
            </button>
            <button
              onClick={() => setFilter('normal')}
              className={`px-2.5 py-1 rounded-md ${filter === 'normal' ? 'bg-emerald-950/50 text-emerald-300 font-medium' : 'text-slate-400'}`}
            >
              Nominal
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Event Description</th>
              <th className="py-2.5 px-3">Temp</th>
              <th className="py-2.5 px-3">Humidity</th>
              <th className="py-2.5 px-3">Lid</th>
              <th className="py-2.5 px-3">Distance</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-500">
                  No log entries recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.slice(-15).reverse().map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {log.time}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-200">
                    <span className="flex items-center gap-1.5">
                      {log.type === 'breach' || log.type === 'excursion' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      {log.message}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {log.temperature !== undefined ? `${convertTemp(log.temperature).toFixed(1)}°${tempUnit}` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {log.humidity !== undefined ? `${log.humidity.toFixed(1)}%` : '--'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${
                      log.lid === 'open' 
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-800/80' 
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/80'
                    }`}>
                      {log.lid || '--'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {log.distance !== undefined ? `${log.distance.toFixed(1)} cm` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-sans font-medium text-[10px] px-2 py-0.5 rounded ${
                      log.status === 'CRITICAL' 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800' 
                        : log.status === 'WARNING'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    }`}>
                      {log.status || 'LOG'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {logs.length > 15 && (
        <div className="mt-2 text-right text-[11px] text-slate-500 font-mono">
          Displaying most recent 15 entries
        </div>
      )}
    </div>
  );
}

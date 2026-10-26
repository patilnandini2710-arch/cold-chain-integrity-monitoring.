import React from 'react';
import { Award, Activity, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ComplianceAnalytics({
  integrityScore = 98.4,
  mkt = 4.2,
  tempUnit = 'C',
  convertTemp,
  totalOpenDurationSeconds = 0,
  excursionCount = 0,
  dataPointsCount = 0,
  minTemp,
  maxTemp
}) {
  const formatDuration = (totalSecs) => {
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-400" />
            GDP Compliance & Analytical Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pharmaceutical & biological cold distribution standards
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
          WHO Standard
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-2">
        
        {/* Integrity Score */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Integrity Score
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${
              integrityScore >= 95 ? 'text-emerald-400' : integrityScore >= 80 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {integrityScore.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                integrityScore >= 95 ? 'bg-emerald-500' : integrityScore >= 80 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${integrityScore}%` }}
            />
          </div>
        </div>

        {/* Mean Kinetic Temperature (MKT) */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Mean Kinetic Temp
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {isNaN(mkt) ? '--' : convertTemp(mkt).toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-400">
              &deg;{tempUnit}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 truncate">
            Arrhenius thermal load index
          </p>
        </div>

        {/* Total Lid Breach Duration */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Lid Open Duration
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-200">
            {formatDuration(totalOpenDurationSeconds)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Access cycle duration
          </p>
        </div>

        {/* Excursion Events Count */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              Excursions
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-200">
            {excursionCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Recorded deviations
          </p>
        </div>

      </div>

      {/* Compliance Verdict Badge */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Carrier Verification:</span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
          integrityScore >= 95 
            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/80' 
            : 'bg-rose-950/40 text-rose-300 border border-rose-800/80'
        }`}>
          {integrityScore >= 95 ? 'Passed — Valid to Distribute' : 'Requires Quality Review'}
        </span>
      </div>
    </div>
  );
}

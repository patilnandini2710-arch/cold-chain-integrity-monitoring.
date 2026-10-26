import React from 'react';
import { AlertTriangle, ThermometerSnowflake, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function AlertBanner({ 
  isLoading,
  firebaseError,
  temperature, 
  maxTemp = 8, 
  minTemp = 2, 
  formattedTimestamp,
  isStale,
  lastSeenText,
  tempUnit,
  convertTemp
}) {
  // 1. Firebase Error Banner
  if (firebaseError) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 flex items-start gap-3.5 text-rose-300">
        <div className="p-2 rounded-lg bg-rose-900/40 border border-rose-800 text-rose-400 flex-shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-sm text-rose-200">
            Firebase Realtime Database Error
          </div>
          <div className="text-xs text-rose-300/80 mt-0.5">
            {firebaseError}
          </div>
          <div className="text-[11px] text-rose-400/90 mt-2">
            Target path: <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded">/coldchain/latest</code>. Please ensure your Firebase RTDB Security Rules permit read access.
          </div>
        </div>
      </div>
    );
  }

  // 2. Initial Loading Banner
  if (isLoading || temperature === null) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-slate-300 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <div className="font-semibold text-sm text-slate-200">
              Connecting to Firebase Realtime Database...
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Listening to <code className="font-mono text-slate-300">/coldchain/latest</code> for live ESP32 sensor packets.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTempExcursion = temperature > maxTemp || temperature < minTemp;

  return (
    <div className="mb-6 space-y-3">
      
      {/* Stale Reading Warning (if ESP32 has not uploaded recently) */}
      {isStale && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-slate-200">ESP32 Hardware Inactive:</span> Showing last recorded reading from{' '}
              <span className="font-mono font-medium text-slate-200">{formattedTimestamp}</span> ({lastSeenText}).
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            Awaiting Next Upload
          </span>
        </div>
      )}

      {/* Temperature Excursion Alert */}
      {isTempExcursion ? (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-800 text-amber-400 flex-shrink-0">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Temperature Excursion Warning
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded bg-amber-900/60 border border-amber-800 text-amber-300">
                  Out of Limit
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Current cargo temperature is {convertTemp(temperature).toFixed(1)}&deg;{tempUnit}. Safe operating range for vaccine cold chain is {convertTemp(minTemp).toFixed(1)}&deg;{tempUnit} to {convertTemp(maxTemp).toFixed(1)}&deg;{tempUnit}.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono">
              Deviation
            </div>
            <div className="text-base font-semibold font-mono text-amber-200">
              {temperature > maxTemp 
                ? `+${(temperature - maxTemp).toFixed(1)}°C Above 8°C` 
                : `-${(minTemp - temperature).toFixed(1)}°C Below 2°C`}
            </div>
          </div>
        </div>
      ) : (
        /* Temperature Safe Banner */
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100">
                Temperature Within Safe Range
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Current reading of {convertTemp(temperature).toFixed(1)}&deg;{tempUnit} is safely maintained inside the 2.0&deg;C &ndash; 8.0&deg;C cold chain threshold.
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-medium rounded bg-emerald-950/40 border border-emerald-800/80 text-emerald-300">
            Safe (2–8°C)
          </span>
        </div>
      )}

    </div>
  );
}

import React from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  Info,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Sparkles
} from 'lucide-react';

export default function SystemStatusPanel({
  listenerStatus,
  errorMessage,
  hasReceivedData,
  isTemperatureValid,
  isHumidityValid,
  temperature,
  humidity,
  timestamp,
  lastReceivedAt,
  freshness,
  secondsSinceLastUpdate,
  staleThresholdSeconds = 15,
  isSimulated = false
}) {
  // Format update timestamps
  const effectiveTimestamp = timestamp || lastReceivedAt;
  const formattedAbsoluteTime = effectiveTimestamp
    ? new Date(effectiveTimestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : 'None recorded';

  const formattedRelativeTime = secondsSinceLastUpdate !== null && secondsSinceLastUpdate !== undefined
    ? secondsSinceLastUpdate === 0
      ? 'Just now'
      : `${secondsSinceLastUpdate}s ago`
    : 'No data received';

  // Determine current primary diagnostic state (distinguishing the states)
  let diagnosticState = {
    code: 'NO_DATA',
    title: 'No Reading Received',
    message: 'The Firebase listener is active, but no telemetry packet exists at /coldchain/latest yet.',
    level: 'info',
    badge: 'NO DATA',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  if (isSimulated) {
    diagnosticState = {
      code: 'SIMULATION_ACTIVE',
      title: 'Virtual Sensor Simulation Engine Active',
      message: 'Dashboard is operating in Simulation Mode. Telemetry is synthesized in browser memory to test temperature excursion alerts, lid breaches, and charts without physical ESP32 hardware. Production Firebase is safe and untouched.',
      level: 'simulation',
      badge: 'SIMULATION ACTIVE',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800'
    };
  } else if (listenerStatus === 'permission_denied') {
    diagnosticState = {
      code: 'PERMISSION_DENIED',
      title: 'Firebase Access Denied',
      message: 'Database security rules prohibited read access to /coldchain/latest. Update your Firebase Realtime Database rules.',
      level: 'error',
      badge: 'ACCESS DENIED',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800'
    };
  } else if (listenerStatus === 'error' || listenerStatus === 'disconnected') {
    diagnosticState = {
      code: 'LISTENER_ERROR',
      title: 'Firebase Connection Error',
      message: errorMessage || 'Network error subscribing to Firebase Realtime Database endpoint.',
      level: 'error',
      badge: 'OFFLINE',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800'
    };
  } else if (!hasReceivedData) {
    diagnosticState = {
      code: 'NO_DATA',
      title: 'Awaiting Initial Sensor Reading',
      message: 'Firebase listener connected. Awaiting initial payload upload from the ESP32 node.',
      level: 'info',
      badge: 'NO DATA',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700'
    };
  } else if (!isTemperatureValid || !isHumidityValid) {
    diagnosticState = {
      code: 'FIELD_INVALID',
      title: 'Sensor Field Missing or Invalid',
      message: `DHT11 payload incomplete: ${!isTemperatureValid ? 'Temperature' : ''}${!isTemperatureValid && !isHumidityValid ? ' and ' : ''}${!isHumidityValid ? 'Humidity' : ''} reading is missing or not a valid number.`,
      level: 'warning',
      badge: 'INVALID FIELDS',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800'
    };
  } else if (freshness === 'STALE') {
    diagnosticState = {
      code: 'DATA_STALE',
      title: 'Sensor Data Exists but is Stale',
      message: `Last telemetry packet was received ${secondsSinceLastUpdate}s ago, which exceeds the ${staleThresholdSeconds}s stale threshold. The ESP32 node may be unpowered, disconnected from Wi-Fi, or paused.`,
      level: 'warning',
      badge: 'STALE DATA',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800'
    };
  } else {
    diagnosticState = {
      code: 'LIVE_OK',
      title: 'Firebase Connected & Telemetry Live',
      message: `Firebase listener active and streaming live updates from ESP32 (~3s cadence). Freshness verified within ${staleThresholdSeconds}s threshold.`,
      level: 'success',
      badge: 'LIVE STREAM',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    };
  }

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 sm:p-6 mb-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              System Health & Diagnostics Panel
            </h2>
            <p className="text-xs text-slate-400">
              {isSimulated 
                ? 'Simulation mode diagnostics and virtual telemetry engine verification'
                : 'Live verification of cloud listener, hardware cadence, and telemetry integrity'}
            </p>
          </div>
        </div>

        {/* Global Diagnostic Badge */}
        <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border flex items-center gap-1.5 self-start sm:self-auto ${diagnosticState.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${
            diagnosticState.level === 'simulation' ? 'bg-amber-400 animate-pulse' :
            diagnosticState.level === 'success' ? 'bg-emerald-400 animate-pulse' :
            diagnosticState.level === 'warning' ? 'bg-amber-400' :
            diagnosticState.level === 'error' ? 'bg-rose-400' : 'bg-slate-400'
          }`} />
          {diagnosticState.badge}
        </span>
      </div>

      {/* Diagnostic Callout */}
      <div className={`p-4 rounded-lg border mb-5 flex items-start gap-3.5 ${
        diagnosticState.level === 'simulation' ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' :
        diagnosticState.level === 'success' ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' :
        diagnosticState.level === 'warning' ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' :
        diagnosticState.level === 'error' ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' :
        'bg-slate-950/60 border-slate-800 text-slate-300'
      }`}>
        <div className="mt-0.5 flex-shrink-0">
          {diagnosticState.level === 'simulation' && <Sparkles className="w-5 h-5 text-amber-400" />}
          {diagnosticState.level === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {diagnosticState.level === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          {diagnosticState.level === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
          {diagnosticState.level === 'info' && <Info className="w-5 h-5 text-sky-400" />}
        </div>
        <div>
          <div className="text-sm font-semibold">
            {diagnosticState.title}
          </div>
          <div className="text-xs opacity-90 mt-1 leading-relaxed">
            {diagnosticState.message}
          </div>
        </div>
      </div>

      {/* Grid of Key System Telemetry Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Source / Listener */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>{isSimulated ? 'Telemetry Engine' : 'Firebase Listener'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${
              isSimulated ? 'bg-amber-400' :
              listenerStatus === 'connected' ? 'bg-emerald-400' : 
              listenerStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
            }`} />
            <span className="font-mono text-sm font-bold uppercase text-slate-100">
              {isSimulated ? 'VIRTUAL SENSOR' : listenerStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 truncate">
            {isSimulated ? 'In-Memory (Firebase Safe)' : 'Path: /coldchain/latest'}
          </p>
        </div>

        {/* Metric 2: Freshness & Cadence */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Reading Freshness</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
              isSimulated ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
              freshness === 'LIVE' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
              freshness === 'STALE' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
              'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isSimulated ? 'SIMULATED LIVE' : freshness}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isSimulated ? 'every ~3s' : formattedRelativeTime}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {isSimulated 
              ? 'Synthesized 3-second cycle' 
              : `Stale threshold: ${staleThresholdSeconds}s (ESP32 cadence ~3s)`}
          </p>
        </div>

        {/* Metric 3: Sensor Data Validation */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>{isSimulated ? 'Simulated Sensor Feed' : 'DHT11 Sensor Validation'}</span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Temp:</span>
              <span className={isTemperatureValid ? (isSimulated ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium') : 'text-rose-400'}>
                {isTemperatureValid ? `${temperature.toFixed(1)}°C ${isSimulated ? '(Sim)' : '(Valid)'}` : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Humidity:</span>
              <span className={isHumidityValid ? (isSimulated ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium') : 'text-rose-400'}>
                {isHumidityValid ? `${humidity.toFixed(1)}% ${isSimulated ? '(Sim)' : '(Valid)'}` : 'Unavailable'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {isSimulated ? 'Virtual Hardware Synthesizer' : 'GPIO 4 • DHT11 Digital Stream'}
          </p>
        </div>

        {/* Metric 4: Last Update */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Sensor Update</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-200 mt-2 truncate">
            {isSimulated ? `${formattedAbsoluteTime} (Tick)` : formattedAbsoluteTime}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {isSimulated ? 'Source: Virtual Clock Generator' : timestamp ? 'Firebase Server Timestamp' : 'Browser Arrival Time'}
          </p>
        </div>

      </div>

      {/* Educational Technical Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 bg-slate-950/30 px-3 py-2 rounded-lg">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <span>
          {isSimulated ? (
            <span>
              <strong className="text-amber-300">Simulation Mode:</strong> Generated in browser memory for demonstration and test purposes. To monitor actual physical hardware, switch to <strong className="text-slate-200">Live Hardware Mode</strong> in the header.
            </span>
          ) : (
            <span>
              <strong className="text-slate-300">Technical Note:</strong> A successful Firebase cloud connection verifies network accessibility to the Realtime Database. Real-time verification of the ESP32 hardware relies strictly on timestamp freshness (&le;{staleThresholdSeconds} seconds).
            </span>
          )}
        </span>
      </div>

    </div>
  );
}

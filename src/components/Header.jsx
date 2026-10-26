import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  Volume2, 
  VolumeX, 
  Settings, 
  RefreshCw,
  Box,
  Clock,
  Sparkles,
  Cpu,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function Header({
  operatingMode = 'simulation', // 'simulation' | 'live'
  setOperatingMode,
  listenerStatus,
  freshness,
  timestamp,
  lastReceivedAt,
  secondsSinceLastUpdate,
  tempUnit,
  setTempUnit,
  soundEnabled,
  setSoundEnabled,
  onOpenSettings,
  onRefresh,
  overallStatus = 'nominal'
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Clock tick every second for clean date/time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isSimulated = operatingMode === 'simulation';

  // Format last successful reading time
  const formatLastUpdate = () => {
    if (isSimulated) {
      return 'Simulated Stream (~3s)';
    }

    const timeToFormat = timestamp || lastReceivedAt;
    if (!timeToFormat) return 'Awaiting initial packet';
    
    const formatted = new Date(timeToFormat).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    if (secondsSinceLastUpdate !== null && secondsSinceLastUpdate !== undefined) {
      if (secondsSinceLastUpdate === 0) return `${formatted} (Just now)`;
      if (secondsSinceLastUpdate < 60) return `${formatted} (${secondsSinceLastUpdate}s ago)`;
      const mins = Math.floor(secondsSinceLastUpdate / 60);
      return `${formatted} (${mins}m ago)`;
    }
    return formatted;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Cold Chain Integrity Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm transition-colors ${
            isSimulated 
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-400' 
              : 'bg-slate-800 border-slate-700 text-sky-400'
          }`}>
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
                Cold Chain Integrity
              </h1>
              
              {/* Visible Operating Mode Indicator Badge */}
              {isSimulated ? (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  SIMULATION MODE
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-sky-950/80 text-sky-300 border border-sky-800/80 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-400" />
                  LIVE HARDWARE MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Real-Time Environmental Monitoring &bull;{' '}
              {isSimulated ? (
                <span className="text-amber-300/90 font-mono text-[11px]">In-Memory Virtual Sensor Stream</span>
              ) : (
                <code className="font-mono text-slate-300 text-[11px]">/coldchain/latest (Firebase RTDB)</code>
              )}
            </p>
          </div>
        </div>

        {/* Operating Mode Selector & Status Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Operating Mode Switcher Pill */}
          <div className="flex p-0.5 bg-slate-950/90 rounded-lg border border-slate-700/80 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setOperatingMode('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                isSimulated
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulation Mode: Virtual sensor telemetry for testing without physical ESP32"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulation Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setOperatingMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                !isSimulated
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Hardware Mode: Streams actual ESP32 sensor data from Firebase RTDB"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Hardware Mode</span>
            </button>
          </div>

          {/* Database / Engine Connection Indicator */}
          {isSimulated ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-amber-950/30 border-amber-800/60 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Virtual Engine: Active</span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              listenerStatus === 'connected'
                ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                : listenerStatus === 'connecting'
                ? 'bg-amber-950/40 border-amber-800/70 text-amber-300'
                : 'bg-rose-950/40 border-rose-800/70 text-rose-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                listenerStatus === 'connected' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : listenerStatus === 'connecting' 
                  ? 'bg-amber-400 animate-ping' 
                  : 'bg-rose-400'
              }`} />
              <span>
                {listenerStatus === 'connected'
                  ? 'Firebase: Connected'
                  : listenerStatus === 'connecting'
                  ? 'Firebase: Connecting...'
                  : listenerStatus === 'permission_denied'
                  ? 'Firebase: Access Denied'
                  : 'Firebase: Disconnected'}
              </span>
            </div>
          )}

          {/* ESP32 Freshness Indicator */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            isSimulated 
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              : freshness === 'LIVE'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : freshness === 'STALE'
              ? 'bg-amber-950/40 border-amber-800/70 text-amber-300'
              : 'bg-slate-800/70 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isSimulated
                ? 'bg-amber-400 animate-pulse'
                : freshness === 'LIVE'
                ? 'bg-emerald-400'
                : freshness === 'STALE'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-500'
            }`} />
            <span>
              {isSimulated
                ? 'Telemetry: SIMULATED'
                : freshness === 'LIVE'
                ? 'ESP32: LIVE'
                : freshness === 'STALE'
                ? `ESP32: STALE (${secondsSinceLastUpdate}s)`
                : 'ESP32: NO DATA'}
            </span>
          </div>

          {/* Last Reading Time */}
          <div 
            title="Last successful telemetry reading"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300"
          >
            <span className="text-slate-400 text-[11px]">Last:</span>
            <span className="font-mono text-slate-200 text-[11px] font-medium">
              {formatLastUpdate()}
            </span>
          </div>

          {/* Unit Toggle Button */}
          <button
            onClick={() => setTempUnit(prev => prev === 'C' ? 'F' : 'C')}
            title="Toggle Temperature Unit (°C / °F)"
            className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            &deg;{tempUnit}
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Mute Audio Alerts' : 'Enable Audio Alerts'}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition-colors ${
              soundEnabled 
                ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700' 
                : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Settings & Threshold Configuration"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Re-sync / Retry Action */}
          <button
            onClick={onRefresh}
            title={isSimulated ? "Reset virtual telemetry stream" : "Recheck Firebase connection (does not fabricate data)"}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
}

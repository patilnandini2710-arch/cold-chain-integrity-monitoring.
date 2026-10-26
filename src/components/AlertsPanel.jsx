import React from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldAlert, 
  Bell,
  HelpCircle,
  Unlock,
  Sparkles
} from 'lucide-react';

export default function AlertsPanel({
  isTemperatureValid,
  isHumidityValid,
  temperature,
  humidity,
  lidOpen,
  minTemp = 2.0,
  maxTemp = 8.0,
  freshness = 'NO_DATA',
  secondsSinceLastUpdate,
  staleThresholdSeconds = 15,
  listenerStatus,
  errorMessage,
  hasReceivedData,
  tempUnit = 'C',
  convertTemp,
  isSimulated = false
}) {
  // Collect actual alerts from real available data (or simulated scenario)
  const activeAlerts = [];

  // 1. Firebase Errors (only active in Live Hardware Mode)
  if (!isSimulated) {
    if (listenerStatus === 'permission_denied') {
      activeAlerts.push({
        id: 'fb-permission',
        severity: 'CRITICAL',
        title: 'Firebase Permission Denied',
        message: 'Realtime Database read access to /coldchain/latest was denied by security rules.',
        category: 'System'
      });
    } else if (listenerStatus === 'error' || listenerStatus === 'disconnected') {
      activeAlerts.push({
        id: 'fb-connection',
        severity: 'CRITICAL',
        title: 'Firebase Connection Error',
        message: errorMessage || 'Failed to maintain real-time subscription to cloud database.',
        category: 'System'
      });
    }

    // Stale Sensor Data (Live Hardware Mode only)
    if (freshness === 'STALE') {
      activeAlerts.push({
        id: 'stale-data',
        severity: 'WARNING',
        title: 'Stale Telemetry Data',
        message: `No new telemetry packet received for ${secondsSinceLastUpdate}s (exceeds ${staleThresholdSeconds}s stale threshold). ESP32 node may be unpowered or experiencing Wi-Fi loss.`,
        category: 'Hardware'
      });
    }

    // Missing Temperature or Humidity Readings (Live Hardware Mode only)
    if (hasReceivedData && (!isTemperatureValid || !isHumidityValid)) {
      const missingFields = [
        !isTemperatureValid ? 'Temperature' : null,
        !isHumidityValid ? 'Humidity' : null
      ].filter(Boolean).join(' and ');

      activeAlerts.push({
        id: 'missing-sensor-data',
        severity: 'WARNING',
        title: 'Missing Sensor Data',
        message: `DHT11 stream is missing a valid numeric ${missingFields} reading. Verify sensor wiring on GPIO 4.`,
        category: 'Hardware'
      });
    }
  }

  // 2. Temperature Alerts (Below 2 °C or Above 8 °C)
  if (isTemperatureValid) {
    if (temperature < minTemp) {
      activeAlerts.push({
        id: 'temp-low',
        severity: 'CRITICAL',
        title: isSimulated ? 'LOW TEMPERATURE ALERT (SIMULATED)' : 'LOW TEMPERATURE ALERT',
        message: `${isSimulated ? '[Simulated] ' : ''}Measured temperature is ${convertTemp(temperature).toFixed(1)}°${tempUnit}, which is below the safe cold chain lower limit of ${convertTemp(minTemp).toFixed(1)}°${tempUnit}.`,
        category: isSimulated ? 'Simulated Excursion' : 'Environmental'
      });
    } else if (temperature > maxTemp) {
      activeAlerts.push({
        id: 'temp-high',
        severity: 'CRITICAL',
        title: isSimulated ? 'HIGH TEMPERATURE ALERT (SIMULATED)' : 'HIGH TEMPERATURE ALERT',
        message: `${isSimulated ? '[Simulated] ' : ''}Measured temperature is ${convertTemp(temperature).toFixed(1)}°${tempUnit}, which exceeds the maximum allowable threshold of ${convertTemp(maxTemp).toFixed(1)}°${tempUnit}.`,
        category: isSimulated ? 'Simulated Excursion' : 'Environmental'
      });
    }
  }

  // 3. Simulated Lid Breach Testing (Simulation Mode only)
  if (isSimulated && (lidOpen === 'open' || lidOpen === true)) {
    activeAlerts.push({
      id: 'sim-lid-breach',
      severity: 'CRITICAL',
      title: 'LID BREACH ALERT (SIMULATED)',
      message: '[Simulated] Container lid position is detected OPEN. Thermal hermetic seal is compromised.',
      category: 'Simulated Breach'
    });
  }

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 sm:p-6 mb-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            activeAlerts.length > 0 
              ? 'bg-rose-950/60 text-rose-400 border-rose-800' 
              : 'bg-slate-800 text-sky-400 border-slate-700'
          }`}>
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                System Alerts & Integrity Notifications
              </h2>
              {isSimulated && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SIMULATED
                </span>
              )}
              {activeAlerts.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {activeAlerts.length} Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isSimulated 
                ? 'Alert engine responding to virtual simulation scenario'
                : 'Evaluated strictly from confirmed live data streams'}
            </p>
          </div>
        </div>

        {/* Hardware Status Note */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          {isSimulated ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulation Test Harness Active</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Lid alerts: Awaiting sensor integration</span>
            </span>
          )}
        </div>
      </div>

      {/* Alerts List or Empty State */}
      {activeAlerts.length === 0 ? (
        // Clear Empty State when no alerts are active
        <div className="py-6 px-4 rounded-lg bg-emerald-950/20 border border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-2.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-300">
                {isSimulated ? 'All Simulated Parameters Normal' : 'All Monitored Parameters Normal'}
              </div>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                {isSimulated 
                  ? `Virtual temperature is safely maintained within ${convertTemp(minTemp).toFixed(0)}°${tempUnit} – ${convertTemp(maxTemp).toFixed(0)}°${tempUnit}. Use the scenario buttons to test excursion alerts.`
                  : `Temperature is safely within the ${convertTemp(minTemp).toFixed(0)}°${tempUnit} – ${convertTemp(maxTemp).toFixed(0)}°${tempUnit} safe range. Cloud connection and hardware cadence are nominal.`}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono whitespace-nowrap">
            Status: Optimal
          </span>
        </div>
      ) : (
        // Active Alerts List
        <div className="space-y-3">
          {activeAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md border mt-0.5 ${
                    isCritical
                      ? 'bg-rose-900/60 border-rose-700 text-rose-300'
                      : 'bg-amber-900/60 border-amber-700 text-amber-300'
                  }`}>
                    {isCritical ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {alert.title}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                        isCritical ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'
                      }`}>
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    isCritical
                      ? 'bg-rose-950 border-rose-800 text-rose-300'
                      : 'bg-amber-950 border-amber-800 text-amber-300'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

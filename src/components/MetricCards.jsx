import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Lock, 
  Unlock, 
  HelpCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Ruler,
  Layers,
  Sparkles
} from 'lucide-react';

export default function MetricCards({
  temperature,
  humidity,
  lidOpen,
  distance,
  timestamp,
  lastReceivedAt,
  isTemperatureValid,
  isHumidityValid,
  isDistanceValid,
  tempUnit = 'C',
  convertTemp,
  minTemp = 2.0,
  maxTemp = 8.0,
  freshness = 'NO_DATA',
  isSimulated = false
}) {
  // Format update time string
  const formatUpdateTime = () => {
    if (isSimulated) {
      return 'Simulated Tick (~3s)';
    }
    const time = timestamp || lastReceivedAt;
    if (!time) return 'Awaiting telemetry';
    return new Date(time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const updateTimeStr = formatUpdateTime();

  // -------------------------------------------------------------
  // B. TEMPERATURE MONITORING CARD LOGIC
  // -------------------------------------------------------------
  // Rules:
  // - Below 2 °C: LOW TEMPERATURE ALERT
  // - From 2 °C through 8 °C inclusive: WITHIN RANGE
  // - Above 8 °C: HIGH TEMPERATURE ALERT
  // - Missing or invalid reading: DATA UNAVAILABLE
  // -------------------------------------------------------------
  let tempEvaluation = {
    code: 'DATA_UNAVAILABLE',
    label: 'DATA UNAVAILABLE',
    icon: HelpCircle,
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    cardBorder: 'border-slate-800',
    iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
    textColor: 'text-slate-400',
    gaugeColor: 'bg-slate-600',
    description: isSimulated ? 'No simulated reading' : 'No valid reading from Firebase'
  };

  if (isTemperatureValid) {
    if (temperature < minTemp) {
      tempEvaluation = {
        code: 'LOW_TEMP_ALERT',
        label: 'LOW TEMPERATURE ALERT',
        icon: AlertTriangle,
        badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-800',
        cardBorder: 'border-sky-800/80',
        iconBg: 'bg-sky-950/70 text-sky-400 border-sky-800',
        textColor: 'text-sky-300',
        gaugeColor: 'bg-sky-400',
        description: `Below target minimum (${convertTemp(minTemp).toFixed(1)}°${tempUnit})`
      };
    } else if (temperature <= maxTemp) {
      tempEvaluation = {
        code: 'WITHIN_RANGE',
        label: 'WITHIN RANGE',
        icon: CheckCircle2,
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        cardBorder: 'border-emerald-800/80',
        iconBg: 'bg-emerald-950/70 text-emerald-400 border-emerald-800',
        textColor: 'text-emerald-300',
        gaugeColor: 'bg-emerald-500',
        description: `Maintained within 2.0°C – 8.0°C safe envelope`
      };
    } else {
      tempEvaluation = {
        code: 'HIGH_TEMP_ALERT',
        label: 'HIGH TEMPERATURE ALERT',
        icon: AlertOctagon,
        badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800',
        cardBorder: 'border-rose-800/80',
        iconBg: 'bg-rose-950/70 text-rose-400 border-rose-800',
        textColor: 'text-rose-300',
        gaugeColor: 'bg-rose-500',
        description: `Exceeds target maximum (${convertTemp(maxTemp).toFixed(1)}°${tempUnit})`
      };
    }
  }

  // Visual gauge percentage: maps -5°C (0%) to 35°C (100%)
  const gaugeMin = -5;
  const gaugeMax = 35;
  const tempGaugePercent = isTemperatureValid
    ? Math.min(Math.max(((temperature - gaugeMin) / (gaugeMax - gaugeMin)) * 100, 2), 100)
    : 0;
  const safeZoneLeft = Math.max(((minTemp - gaugeMin) / (gaugeMax - gaugeMin)) * 100, 0);
  const safeZoneWidth = Math.min(((maxTemp - minTemp) / (gaugeMax - gaugeMin)) * 100, 100 - safeZoneLeft);

  const displayTemp = isTemperatureValid ? convertTemp(temperature).toFixed(1) : '--';

  // -------------------------------------------------------------
  // C. HUMIDITY MONITORING CARD LOGIC
  // -------------------------------------------------------------
  const displayHum = isHumidityValid ? humidity.toFixed(1) : '--';
  const humGaugePercent = isHumidityValid ? Math.min(Math.max(humidity, 0), 100) : 0;

  // -------------------------------------------------------------
  // D. LID STATUS CARD LOGIC
  // -------------------------------------------------------------
  let lidEvaluation = {
    status: 'AWAITING_INTEGRATION',
    displayTitle: 'Awaiting sensor integration',
    subtitle: isSimulated 
      ? 'Virtual lid sensor standing by' 
      : 'Lid detection sensor not integrated in current ESP32 build',
    badge: isSimulated ? 'Virtual' : 'Hardware Pending',
    badgeBg: 'bg-slate-800/80 text-slate-400 border-slate-700',
    icon: HelpCircle,
    iconBg: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  if (lidOpen !== undefined && lidOpen !== null) {
    if (typeof lidOpen === 'boolean') {
      if (lidOpen) {
        lidEvaluation = {
          status: 'OPEN',
          displayTitle: 'OPEN',
          subtitle: isSimulated ? 'Simulated container lid unsealed' : 'Thermal containment seal opened',
          badge: 'Breached',
          badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: Unlock,
          iconBg: 'bg-rose-950/70 text-rose-400 border-rose-800'
        };
      } else {
        lidEvaluation = {
          status: 'CLOSED',
          displayTitle: 'CLOSED',
          subtitle: isSimulated ? 'Simulated container sealed' : 'Container latched and sealed',
          badge: 'Secured',
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          icon: Lock,
          iconBg: 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
        };
      }
    } else if (typeof lidOpen === 'string') {
      const lower = lidOpen.toLowerCase().trim();
      if (lower === 'open' || lower === 'breach' || lower === 'true') {
        lidEvaluation = {
          status: 'OPEN',
          displayTitle: 'OPEN',
          subtitle: isSimulated ? 'Simulated container lid unsealed' : 'Thermal containment seal opened',
          badge: 'Breached',
          badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: Unlock,
          iconBg: 'bg-rose-950/70 text-rose-400 border-rose-800'
        };
      } else if (lower === 'closed' || lower === 'sealed' || lower === 'secure' || lower === 'false') {
        lidEvaluation = {
          status: 'CLOSED',
          displayTitle: 'CLOSED',
          subtitle: isSimulated ? 'Simulated container sealed' : 'Container latched and sealed',
          badge: 'Secured',
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          icon: Lock,
          iconBg: 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
        };
      } else {
        lidEvaluation = {
          status: 'UNKNOWN',
          displayTitle: 'UNKNOWN / SENSOR UNAVAILABLE',
          subtitle: `Unrecognized sensor response: "${lidOpen}"`,
          badge: 'Uncertain',
          badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          icon: AlertTriangle,
          iconBg: 'bg-amber-950/70 text-amber-400 border-amber-800'
        };
      }
    }
  }

  // -------------------------------------------------------------
  // E. DISTANCE MONITORING CARD LOGIC
  // -------------------------------------------------------------
  const hasValidDistance = isDistanceValid && typeof distance === 'number';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. TEMPERATURE MONITORING CARD */}
      <div className={`rounded-xl bg-slate-900 border p-5 transition-all relative overflow-hidden ${tempEvaluation.cardBorder}`}>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${tempEvaluation.iconBg}`}>
              <Thermometer className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Temperature
              </span>
              {isSimulated && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SIMULATED
                </span>
              )}
            </div>
          </div>

          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border flex items-center gap-1 ${tempEvaluation.badgeBg}`}>
            <tempEvaluation.icon className="w-3 h-3" />
            <span>{tempEvaluation.label}</span>
          </span>
        </div>

        {/* Primary Value Display */}
        <div className="flex items-baseline gap-1.5 my-2">
          <span className={`text-4xl font-extrabold tracking-tight font-mono ${tempEvaluation.textColor}`}>
            {displayTemp}
          </span>
          <span className="text-lg font-semibold text-slate-400">
            &deg;{tempUnit}
          </span>
        </div>

        {/* 2 - 8 °C Range Indicator & Gauge */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Range: {convertTemp(minTemp).toFixed(0)}&deg; &ndash; {convertTemp(maxTemp).toFixed(0)}&deg;{tempUnit}</span>
            <span className="font-mono text-slate-300 font-medium truncate ml-2">
              {tempEvaluation.description}
            </span>
          </div>

          {/* Progress / Gauge Bar */}
          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            {/* Safe zone envelope highlight (2 to 8 °C) */}
            <div 
              className="absolute top-0 bottom-0 bg-emerald-950/80 border-x border-emerald-600/50"
              style={{
                left: `${safeZoneLeft}%`,
                width: `${safeZoneWidth}%`
              }}
              title="Safe zone: 2.0°C - 8.0°C"
            />
            {/* Reading position bar */}
            {isTemperatureValid && (
              <div 
                className={`h-full transition-all duration-300 ${tempEvaluation.gaugeColor}`}
                style={{ width: `${tempGaugePercent}%` }}
              />
            )}
          </div>
        </div>

        {/* Update timestamp footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Updated:
          </span>
          <span className="text-slate-300">{updateTimeStr}</span>
        </div>
      </div>

      {/* 2. HUMIDITY MONITORING CARD */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Humidity
              </span>
              {isSimulated && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SIMULATED
                </span>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 border border-slate-700 text-slate-300">
            {isSimulated ? 'Simulated RH' : 'Measured Value'}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 my-2">
          <span className="text-4xl font-extrabold tracking-tight font-mono text-slate-100">
            {displayHum}
          </span>
          <span className="text-lg font-semibold text-slate-400">
            % RH
          </span>
        </div>

        {/* Subtle Progress Visualization */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Relative Humidity (0–100%)</span>
            <span className="font-mono text-slate-300">{displayHum !== '--' ? `${displayHum}%` : '--'}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${humGaugePercent}%` }}
            />
          </div>
        </div>

        {/* Update timestamp footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Updated:
          </span>
          <span className="text-slate-300">{updateTimeStr}</span>
        </div>
      </div>

      {/* 3. LID STATUS CARD */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${lidEvaluation.iconBg}`}>
              <lidEvaluation.icon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Lid Status
              </span>
              {isSimulated && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SIMULATED
                </span>
              )}
            </div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${lidEvaluation.badgeBg}`}>
            {lidEvaluation.badge}
          </span>
        </div>

        <div className="my-2 min-h-[48px] flex flex-col justify-center">
          <div className={`font-bold tracking-tight ${
            lidEvaluation.status === 'AWAITING_INTEGRATION'
              ? 'text-lg text-slate-400 italic'
              : lidEvaluation.status === 'OPEN'
              ? 'text-3xl text-rose-300 font-mono'
              : lidEvaluation.status === 'CLOSED'
              ? 'text-3xl text-emerald-300 font-mono'
              : 'text-xl text-amber-300'
          }`}>
            {lidEvaluation.displayTitle}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lidEvaluation.subtitle}
          </p>
        </div>

        {/* Extensibility notice */}
        <div className="mt-3 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
          <span>Field: <code className="font-mono text-slate-300">lid</code> &bull; </span>
          <span className="text-slate-500">
            {isSimulated 
              ? 'Virtual switch engine active' 
              : lidEvaluation.status !== 'AWAITING_INTEGRATION' 
              ? 'Active stream detected' 
              : 'Awaiting hardware update'}
          </span>
        </div>

        {/* Update timestamp footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            State:
          </span>
          <span className={lidEvaluation.status !== 'AWAITING_INTEGRATION' ? 'text-slate-200 font-medium' : 'text-slate-400'}>
            {isSimulated 
              ? `Simulated (${lidEvaluation.displayTitle})` 
              : lidEvaluation.status !== 'AWAITING_INTEGRATION' 
              ? lidEvaluation.displayTitle 
              : 'Not Uploaded'}
          </span>
        </div>
      </div>

      {/* 4. DISTANCE MONITORING CARD */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              <Ruler className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Distance
              </span>
              {isSimulated && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  SIMULATED
                </span>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 border border-slate-700 text-slate-400">
            {isSimulated 
              ? 'Simulated Depth' 
              : hasValidDistance 
              ? 'Distance Received' 
              : 'Hardware Pending'}
          </span>
        </div>

        <div className="my-2 min-h-[48px] flex flex-col justify-center">
          {hasValidDistance ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tracking-tight font-mono text-slate-100">
                {distance.toFixed(1)}
              </span>
              <span className="text-lg font-semibold text-slate-400">
                cm
              </span>
            </div>
          ) : (
            <div>
              <div className="text-lg font-medium text-slate-400 italic">
                Awaiting sensor integration
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ultrasonic sensor not integrated in current ESP32 build
              </p>
            </div>
          )}
        </div>

        {/* Distance Status Detail */}
        <div className="mt-3 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
          <span>Field: <code className="font-mono text-slate-300">distance</code> &bull; </span>
          <span className="text-slate-500">
            {isSimulated 
              ? 'Virtual ultrasonic measurement' 
              : hasValidDistance 
              ? 'Live measurement active' 
              : 'Awaiting hardware update'}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            Sensor:
          </span>
          <span className="text-slate-400">
            {isSimulated 
              ? 'Simulated Stream' 
              : hasValidDistance 
              ? 'Numeric Stream' 
              : 'Not Integrated'}
          </span>
        </div>
      </div>

    </div>
  );
}

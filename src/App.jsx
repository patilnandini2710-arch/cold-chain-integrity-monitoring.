import React, { useState, useEffect, useRef } from 'react';
import { useColdChainData } from './hooks/useColdChainData';
import { useSimulationData } from './hooks/useSimulationData';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import SystemStatusPanel from './components/SystemStatusPanel';
import AlertsPanel from './components/AlertsPanel';
import ChartsSection from './components/ChartsSection';
import SettingsModal from './components/SettingsModal';
import { playAlertBeep } from './utils/soundAlert';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Operating Mode: 'simulation' (default when hardware unavailable) or 'live'
  const [operatingMode, setOperatingModeState] = useState(() => {
    return localStorage.getItem('coldchain_operating_mode') || 'simulation';
  });

  const setOperatingMode = (newMode) => {
    setOperatingModeState(newMode);
    localStorage.setItem('coldchain_operating_mode', newMode);
    // Reset session chart buffer on mode transition to keep buffers clean
    setHistoryData([]);
    lastLoggedTimestampRef.current = null;
  };

  const isSimulated = operatingMode === 'simulation';

  // Configurable parameters
  const [staleThresholdSeconds, setStaleThresholdSeconds] = useState(15);
  const [minTemp, setMinTemp] = useState(2.0);
  const [maxTemp, setMaxTemp] = useState(8.0);
  const [cargoName, setCargoName] = useState('Lot #VXC-ColdChain-01 (Vaccine Carrier)');

  // UI preferences
  const [tempUnit, setTempUnit] = useState('C');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Hook 1: Live Firebase Realtime Database telemetry (Live Hardware Mode)
  const liveData = useColdChainData(staleThresholdSeconds);

  // Hook 2: In-Memory Virtual Sensor Telemetry (Simulation Mode)
  const simData = useSimulationData(isSimulated);

  // Active telemetry source based on selected operating mode
  const activeData = isSimulated ? simData : liveData;

  // In-memory buffer for locally observed session readings ("Session History")
  const [historyData, setHistoryData] = useState([]);
  const lastLoggedTimestampRef = useRef(null);

  // Convert temperature to selected unit (°C or °F)
  const convertTemp = (tempC) => {
    if (tempC === null || tempC === undefined || isNaN(tempC)) return tempC;
    return tempUnit === 'F' ? (tempC * 9) / 5 + 32 : tempC;
  };

  // Temperature excursion flag
  const isTempExcursion = activeData.isTemperatureValid && (activeData.temperature < minTemp || activeData.temperature > maxTemp);

  // Overall status classification for header badge
  let overallStatus = 'nominal';
  if (isSimulated) {
    overallStatus = isTempExcursion ? 'alert' : 'nominal';
  } else {
    if (liveData.listenerStatus === 'permission_denied' || liveData.listenerStatus === 'error' || liveData.listenerStatus === 'disconnected') {
      overallStatus = 'error';
    } else if (liveData.listenerStatus === 'connecting' && !liveData.hasReceivedData) {
      overallStatus = 'connecting';
    } else if (isTempExcursion) {
      overallStatus = 'alert';
    } else if (liveData.freshness === 'STALE' || !liveData.isTemperatureValid || !liveData.isHumidityValid) {
      overallStatus = 'warning';
    }
  }

  // Accumulate readings into Session History buffer whenever a new packet/tick arrives
  useEffect(() => {
    if (!activeData.hasReceivedData || !activeData.isTemperatureValid) return;

    const currentTs = activeData.timestamp || activeData.lastReceivedAt || Date.now();

    // Prevent duplicate entries for identical timestamp
    if (lastLoggedTimestampRef.current === currentTs) return;
    lastLoggedTimestampRef.current = currentTs;

    const timeLabel = new Date(currentTs).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    setHistoryData((prev) => {
      const nextPoint = {
        time: timeLabel,
        timestamp: currentTs,
        temperature: activeData.temperature,
        humidity: activeData.isHumidityValid ? activeData.humidity : null,
      };
      const updated = [...prev, nextPoint];
      return updated.slice(-120); // Keep last 120 points in memory
    });
  }, [
    activeData.hasReceivedData, 
    activeData.timestamp, 
    activeData.lastReceivedAt, 
    activeData.temperature, 
    activeData.humidity, 
    activeData.isTemperatureValid, 
    activeData.isHumidityValid,
    isSimulated
  ]);

  // Audio alert on temperature excursion transitions
  const prevExcursionRef = useRef(false);
  useEffect(() => {
    if (isTempExcursion && !prevExcursionRef.current) {
      if (soundEnabled) {
        playAlertBeep('critical');
      }
    }
    prevExcursionRef.current = isTempExcursion;
  }, [isTempExcursion, soundEnabled]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white">
      
      {/* 1. Professional Header with Operating Mode Switcher */}
      <Header
        operatingMode={operatingMode}
        setOperatingMode={setOperatingMode}
        listenerStatus={activeData.listenerStatus}
        freshness={activeData.freshness}
        timestamp={activeData.timestamp}
        lastReceivedAt={activeData.lastReceivedAt}
        secondsSinceLastUpdate={activeData.secondsSinceLastUpdate}
        tempUnit={tempUnit}
        setTempUnit={setTempUnit}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={isSimulated ? () => simData.applyScenario('normal') : liveData.retryConnection}
        overallStatus={overallStatus}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Shipment Metadata Strip */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSimulated ? 'bg-amber-400' : 'bg-sky-400'}`}></span>
            <span className="text-slate-400 font-medium">Monitored Shipment:</span>
            <span className="text-slate-100 font-semibold font-mono">{cargoName}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Target Profile: <strong className="text-slate-200 font-medium">Vaccine Cold Chain ({convertTemp(minTemp).toFixed(0)}&deg; &ndash; {convertTemp(maxTemp).toFixed(0)}&deg;{tempUnit})</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="hidden sm:inline">
              Source: <strong className={`font-medium font-mono ${isSimulated ? 'text-amber-300' : 'text-slate-200'}`}>
                {isSimulated ? 'Simulation Engine (Browser RAM)' : 'ESP32 • DHT11 (GPIO 4)'}
              </strong>
            </span>
          </div>
        </div>

        {/* Simulation Mode Scenario Testing Controls (visible only in Simulation Mode) */}
        {isSimulated && (
          <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-amber-200 flex items-center gap-2">
                  <span>Simulation Mode Active</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-800">
                    Virtual Sensors
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Test temperature threshold alerts, lid breach alarms, and live charts without physical ESP32 hardware.
                </p>
              </div>
            </div>

            {/* Preset scenario triggers */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
              <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Test Scenarios:</span>
              <button
                type="button"
                onClick={() => simData.applyScenario('normal')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs border transition-all ${
                  simData.scenario === 'normal'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-200 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                ✓ Nominal (4.5°C)
              </button>
              <button
                type="button"
                onClick={() => simData.applyScenario('heat_spike')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs border transition-all ${
                  simData.scenario === 'heat_spike'
                    ? 'bg-rose-950 border-rose-600 text-rose-200 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                ▲ High Temp (9.8°C)
              </button>
              <button
                type="button"
                onClick={() => simData.applyScenario('freeze')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs border transition-all ${
                  simData.scenario === 'freeze'
                    ? 'bg-sky-950 border-sky-600 text-sky-200 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                ▼ Freeze (1.2°C)
              </button>
              <button
                type="button"
                onClick={() => simData.applyScenario('lid_breach')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs border transition-all ${
                  simData.scenario === 'lid_breach'
                    ? 'bg-amber-950 border-amber-600 text-amber-200 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                🔓 Lid Breach (Open)
              </button>
            </div>
          </div>
        )}

        {/* Telemetry Monitoring Cards */}
        <MetricCards
          temperature={activeData.temperature}
          humidity={activeData.humidity}
          lidOpen={activeData.lidOpen}
          distance={activeData.distance}
          timestamp={activeData.timestamp}
          lastReceivedAt={activeData.lastReceivedAt}
          isTemperatureValid={activeData.isTemperatureValid}
          isHumidityValid={activeData.isHumidityValid}
          isDistanceValid={activeData.isDistanceValid}
          tempUnit={tempUnit}
          convertTemp={convertTemp}
          minTemp={minTemp}
          maxTemp={maxTemp}
          freshness={activeData.freshness}
          isSimulated={isSimulated}
        />

        {/* System Status Panel */}
        <SystemStatusPanel
          listenerStatus={activeData.listenerStatus}
          errorMessage={activeData.errorMessage}
          hasReceivedData={activeData.hasReceivedData}
          isTemperatureValid={activeData.isTemperatureValid}
          isHumidityValid={activeData.isHumidityValid}
          temperature={activeData.temperature}
          humidity={activeData.humidity}
          timestamp={activeData.timestamp}
          lastReceivedAt={activeData.lastReceivedAt}
          freshness={activeData.freshness}
          secondsSinceLastUpdate={activeData.secondsSinceLastUpdate}
          staleThresholdSeconds={staleThresholdSeconds}
          isSimulated={isSimulated}
        />

        {/* Alerts Panel */}
        <AlertsPanel
          isTemperatureValid={activeData.isTemperatureValid}
          isHumidityValid={activeData.isHumidityValid}
          temperature={activeData.temperature}
          humidity={activeData.humidity}
          lidOpen={activeData.lidOpen}
          minTemp={minTemp}
          maxTemp={maxTemp}
          freshness={activeData.freshness}
          secondsSinceLastUpdate={activeData.secondsSinceLastUpdate}
          staleThresholdSeconds={staleThresholdSeconds}
          listenerStatus={activeData.listenerStatus}
          errorMessage={activeData.errorMessage}
          hasReceivedData={activeData.hasReceivedData}
          tempUnit={tempUnit}
          convertTemp={convertTemp}
          isSimulated={isSimulated}
        />

        {/* Recent Readings Chart (Session History) */}
        <ChartsSection
          historyData={historyData}
          tempUnit={tempUnit}
          convertTemp={convertTemp}
          minTemp={minTemp}
          maxTemp={maxTemp}
          isSimulated={isSimulated}
        />

      </main>

      {/* Professional Dashboard Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Cold Chain Integrity &bull; Real-Time Environmental Telemetry &copy; {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isSimulated 
                  ? 'bg-amber-400' 
                  : liveData.listenerStatus === 'connected' 
                  ? 'bg-emerald-400' 
                  : 'bg-slate-500'
              }`} />
              {isSimulated ? 'Simulation Engine Isolated' : 'Firebase RTDB: /coldchain/latest'}
            </span>
            <span>&bull;</span>
            <span className="font-mono text-slate-400">
              {isSimulated ? 'Virtual Sensor Mode' : 'ESP32 DHT11 Node'}
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        minTemp={minTemp}
        maxTemp={maxTemp}
        onSaveLimits={(min, max) => {
          setMinTemp(min);
          setMaxTemp(max);
        }}
        staleThresholdSeconds={staleThresholdSeconds}
        onSaveStaleThreshold={(sec) => setStaleThresholdSeconds(sec)}
        cargoName={cargoName}
        onSaveCargoName={(name) => setCargoName(name)}
      />

    </div>
  );
}

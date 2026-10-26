import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom React Hook for Simulation Mode
 * 
 * Generates realistic simulated sensor telemetry in browser memory.
 * - Periodic updates every 3 seconds (matching ESP32 upload cadence)
 * - Simulates realistic drift for Temperature, Humidity, Distance, and Lid State
 * - Built-in scenarios to test High Temp Excursions, Freezing, and Lid Breaches
 * - NEVER writes to production Firebase database
 */
export function useSimulationData(isEnabled = false) {
  // Scenario: 'normal' | 'heat_spike' | 'freeze' | 'lid_breach' | 'random_walk'
  const [scenario, setScenario] = useState('normal');

  const [telemetry, setTelemetry] = useState({
    temperature: 4.6,
    humidity: 54.2,
    distance: 8.5,
    lidOpen: 'closed',
    timestamp: Date.now(),
  });

  const [lastReceivedAt, setLastReceivedAt] = useState(Date.now());
  const [secondsSinceLastUpdate, setSecondsSinceLastUpdate] = useState(0);

  // Scenario presets
  const applyScenario = useCallback((scenarioName) => {
    setScenario(scenarioName);
    const now = Date.now();
    setLastReceivedAt(now);
    setSecondsSinceLastUpdate(0);

    if (scenarioName === 'heat_spike') {
      setTelemetry({
        temperature: 9.8,
        humidity: 61.5,
        distance: 8.7,
        lidOpen: 'closed',
        timestamp: now,
      });
    } else if (scenarioName === 'freeze') {
      setTelemetry({
        temperature: 1.2,
        humidity: 49.0,
        distance: 8.4,
        lidOpen: 'closed',
        timestamp: now,
      });
    } else if (scenarioName === 'lid_breach') {
      setTelemetry({
        temperature: 7.8,
        humidity: 58.0,
        distance: 68.4,
        lidOpen: 'open',
        timestamp: now,
      });
    } else {
      // Normal nominal safe operation (2-8°C WHO safe target)
      setTelemetry({
        temperature: 4.5,
        humidity: 52.0,
        distance: 8.5,
        lidOpen: 'closed',
        timestamp: now,
      });
    }
  }, []);

  // Periodic simulation tick every 3 seconds
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setLastReceivedAt(now);
      setSecondsSinceLastUpdate(0);

      setTelemetry((prev) => {
        let newTemp = prev.temperature;
        let newHum = prev.humidity;
        let newDist = prev.distance;
        let newLid = prev.lidOpen;

        if (scenario === 'heat_spike') {
          // Stay above 8°C (between 8.5 and 11.5°C)
          newTemp = Math.min(11.5, Math.max(8.5, newTemp + (Math.random() * 0.4 - 0.15)));
          newHum = Math.min(70, Math.max(50, newHum + (Math.random() * 0.8 - 0.4)));
        } else if (scenario === 'freeze') {
          // Stay below 2°C (between 0.4 and 1.8°C)
          newTemp = Math.min(1.8, Math.max(0.4, newTemp + (Math.random() * 0.3 - 0.15)));
          newHum = Math.min(65, Math.max(45, newHum + (Math.random() * 0.8 - 0.4)));
        } else if (scenario === 'lid_breach') {
          // Lid is open, distance large, temp slowly rising
          newLid = 'open';
          newDist = Math.min(95, Math.max(55, newDist + (Math.random() * 2 - 1)));
          newTemp = Math.min(10.5, newTemp + 0.15); // thermal leakage
          newHum = Math.min(75, Math.max(45, newHum + (Math.random() * 1 - 0.5)));
        } else {
          // Normal WHO cold chain conditions (drift gently within 3.8°C - 5.5°C)
          newTemp = Math.min(5.8, Math.max(3.6, newTemp + (Math.random() * 0.2 - 0.1)));
          newHum = Math.min(62, Math.max(46, newHum + (Math.random() * 0.6 - 0.3)));
          newDist = Math.min(9.5, Math.max(7.5, newDist + (Math.random() * 0.2 - 0.1)));
          newLid = 'closed';
        }

        return {
          temperature: Number(newTemp.toFixed(1)),
          humidity: Number(newHum.toFixed(1)),
          distance: Number(newDist.toFixed(1)),
          lidOpen: newLid,
          timestamp: now,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isEnabled, scenario]);

  // Elapsed second counter
  useEffect(() => {
    if (!isEnabled) return;
    const secondTimer = setInterval(() => {
      setSecondsSinceLastUpdate((prev) => (prev !== null ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(secondTimer);
  }, [isEnabled]);

  // Reset or manual control
  const setManualTelemetry = useCallback((custom) => {
    const now = Date.now();
    setLastReceivedAt(now);
    setSecondsSinceLastUpdate(0);
    setTelemetry((prev) => ({
      ...prev,
      ...custom,
      timestamp: now,
    }));
  }, []);

  return {
    ...telemetry,
    isTemperatureValid: true,
    isHumidityValid: true,
    isDistanceValid: true,
    isLidValid: true,
    listenerStatus: 'connected',
    errorMessage: null,
    hasReceivedData: true,
    lastReceivedAt,
    freshness: 'LIVE',
    secondsSinceLastUpdate: secondsSinceLastUpdate || 0,
    isSimulated: true,
    scenario,
    applyScenario,
    setManualTelemetry,
  };
}

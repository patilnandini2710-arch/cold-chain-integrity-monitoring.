import { useState, useEffect, useRef, useCallback } from 'react';
import { db, ref, onValue, FIREBASE_DB_PATH, SENSOR_FIELDS } from '../firebase';

/**
 * Custom React Hook to manage live subscription to Firebase RTDB
 * 
 * Handles:
 * - Realtime listener subscription & clean unmount
 * - Configurable database path and expected sensor field names
 * - 15-second stale data threshold tracking
 * - Reading validation (temperature, humidity, timestamp)
 * - Connection status (connected, connecting, permission_denied, error)
 * - Manual retry/reconnect action
 * - Preserves live hardware data without fabricating values
 */
export function useColdChainData(staleThresholdSeconds = 15, customPath = null) {
  // Telemetry raw data state
  const [telemetry, setTelemetry] = useState({
    temperature: null,
    humidity: null,
    timestamp: null,
    distance: undefined,
    lidOpen: undefined,
    rawPayload: null,
  });

  // Diagnostic & connection state
  const [listenerStatus, setListenerStatus] = useState('connecting'); // 'connecting' | 'connected' | 'permission_denied' | 'error' | 'disconnected'
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [lastReceivedAt, setLastReceivedAt] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Freshness calculation state
  const [secondsSinceLastUpdate, setSecondsSinceLastUpdate] = useState(null);
  const [freshness, setFreshness] = useState('NO_DATA'); // 'LIVE' | 'STALE' | 'NO_DATA'

  // Ref to store unsubscribe callback
  const unsubscribeRef = useRef(null);

  // Active database path
  const activePath = customPath || FIREBASE_DB_PATH;

  // Subscribe to Firebase RTDB active path
  useEffect(() => {
    setListenerStatus('connecting');
    setErrorMessage(null);

    const targetRef = ref(db, activePath);

    try {
      const unsub = onValue(
        targetRef,
        (snapshot) => {
          setListenerStatus('connected');
          setErrorMessage(null);

          const val = snapshot.val();
          const arrivalTime = Date.now();
          setLastReceivedAt(arrivalTime);

          if (val === null || val === undefined) {
            setHasReceivedData(false);
            setTelemetry({
              temperature: null,
              humidity: null,
              timestamp: null,
              distance: undefined,
              lidOpen: undefined,
              rawPayload: null,
            });
            setFreshness('NO_DATA');
            return;
          }

          setHasReceivedData(true);

          // Configurable field name lookups
          const tempField = SENSOR_FIELDS.temperature;
          const humField = SENSOR_FIELDS.humidity;
          const distField = SENSOR_FIELDS.distance;
          const lidField = SENSOR_FIELDS.lid;
          const lidOpenField = SENSOR_FIELDS.lidOpen;
          const tsField = SENSOR_FIELDS.timestamp;

          // Parse temperature
          let parsedTemp = null;
          const rawTemp = val[tempField];
          if (typeof rawTemp === 'number') {
            parsedTemp = rawTemp;
          } else if (rawTemp !== undefined && rawTemp !== null) {
            const num = parseFloat(rawTemp);
            if (!isNaN(num)) parsedTemp = num;
          }

          // Parse humidity
          let parsedHum = null;
          const rawHum = val[humField];
          if (typeof rawHum === 'number') {
            parsedHum = rawHum;
          } else if (rawHum !== undefined && rawHum !== null) {
            const num = parseFloat(rawHum);
            if (!isNaN(num)) parsedHum = num;
          }

          // Parse timestamp (Firebase server timestamp is in milliseconds)
          let parsedTimestamp = null;
          const rawTs = val[tsField];
          if (typeof rawTs === 'number') {
            parsedTimestamp = rawTs < 10000000000 ? rawTs * 1000 : rawTs;
          } else if (typeof rawTs === 'string') {
            const parsed = Date.parse(rawTs);
            if (!isNaN(parsed)) parsedTimestamp = parsed;
          }

          // Parse distance only if a valid numeric field is provided
          let parsedDistance = undefined;
          const rawDist = val[distField];
          if (typeof rawDist === 'number' && !isNaN(rawDist)) {
            parsedDistance = rawDist;
          }

          // Parse lidOpen field (supports lidOpen or lid, boolean or string)
          let parsedLidOpen = undefined;
          const rawLid = (val[lidOpenField] !== undefined && val[lidOpenField] !== null) 
            ? val[lidOpenField] 
            : val[lidField];
          if (rawLid !== undefined && rawLid !== null) {
            parsedLidOpen = rawLid;
          }

          setTelemetry({
            temperature: parsedTemp,
            humidity: parsedHum,
            timestamp: parsedTimestamp,
            distance: parsedDistance,
            lidOpen: parsedLidOpen,
            rawPayload: val,
          });
        },
        (error) => {
          console.error('Firebase onValue error:', error);
          if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            setListenerStatus('permission_denied');
            setErrorMessage('Firebase RTDB permission denied. Check database security rules.');
          } else {
            setListenerStatus('error');
            setErrorMessage(error.message || 'Error subscribing to Firebase RTDB');
          }
        }
      );

      unsubscribeRef.current = unsub;
    } catch (err) {
      console.error('Failed to attach Firebase listener:', err);
      setListenerStatus('error');
      setErrorMessage(err.message || 'Failed to attach listener');
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [activePath, refreshTrigger]);

  // Track freshness and elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasReceivedData) {
        setFreshness('NO_DATA');
        setSecondsSinceLastUpdate(null);
        return;
      }

      // Use the Firebase timestamp when it is a valid number, otherwise fall back to arrival time
      const refTime = (typeof telemetry.timestamp === 'number' && telemetry.timestamp > 0)
        ? telemetry.timestamp
        : lastReceivedAt;

      if (!refTime) {
        setFreshness('NO_DATA');
        setSecondsSinceLastUpdate(null);
        return;
      }

      const elapsedMs = Math.max(0, Date.now() - refTime);
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setSecondsSinceLastUpdate(elapsedSec);

      if (elapsedSec <= staleThresholdSeconds) {
        setFreshness('LIVE');
      } else {
        setFreshness('STALE');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasReceivedData, telemetry.timestamp, lastReceivedAt, staleThresholdSeconds]);

  // Safe manual retry action (re-attaches listener and checks connection without inventing data)
  const retryConnection = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setListenerStatus('connecting');
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Validation flags
  const isTemperatureValid = typeof telemetry.temperature === 'number' && !isNaN(telemetry.temperature);
  const isHumidityValid = typeof telemetry.humidity === 'number' && !isNaN(telemetry.humidity);
  const isDistanceValid = typeof telemetry.distance === 'number' && !isNaN(telemetry.distance);
  const isLidValid = telemetry.lidOpen !== undefined && telemetry.lidOpen !== null;

  return {
    ...telemetry,
    isTemperatureValid,
    isHumidityValid,
    isDistanceValid,
    isLidValid,
    listenerStatus,
    errorMessage,
    hasReceivedData,
    lastReceivedAt,
    freshness,
    secondsSinceLastUpdate,
    staleThresholdSeconds,
    activePath,
    retryConnection,
    isSimulated: false,
  };
}

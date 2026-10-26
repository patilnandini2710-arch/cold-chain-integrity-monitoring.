import React, { useState } from 'react';
import { X, UploadCloud, RefreshCw, Cpu, Flame, Snowflake, Unlock, Lock } from 'lucide-react';
import { db, ref, set } from '../firebase';

export default function SimulatorModal({
  isOpen,
  onClose,
  currentTemp,
  currentHum,
  currentDistance,
  isLidOpen,
  onSimulateLocal
}) {
  if (!isOpen) return null;

  const [simTemp, setSimTemp] = useState(currentTemp || 4.5);
  const [simHum, setSimHum] = useState(currentHum || 55);
  const [simDist, setSimDist] = useState(currentDistance || 6.2);
  const [simLid, setSimLid] = useState(isLidOpen ? 'open' : 'closed');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);

  // Push to actual Firebase RTDB node
  const pushToFirebase = async (data) => {
    setIsPushing(true);
    setPushStatus(null);
    try {
      const payload = {
        temperature: Number(Number(data.temperature).toFixed(1)),
        humidity: Number(Number(data.humidity).toFixed(1)),
        lid: data.lid,
        distance: Number(Number(data.distance).toFixed(1)),
        timestamp: Date.now()
      };
      
      await set(ref(db, 'coldchain/latest'), payload);
      setPushStatus({ type: 'success', msg: 'Updated Firebase RTDB successfully' });
      if (onSimulateLocal) onSimulateLocal(payload);
    } catch (err) {
      console.error(err);
      setPushStatus({ type: 'error', msg: `Firebase push failed: ${err.message}` });
    } finally {
      setIsPushing(false);
    }
  };

  const handleQuickAction = (action) => {
    let newTemp = simTemp;
    let newHum = simHum;
    let newDist = simDist;
    let newLid = simLid;

    if (action === 'open-lid') {
      newLid = 'open';
      newDist = 125.4;
      setSimLid('open');
      setSimDist(125.4);
    } else if (action === 'close-lid') {
      newLid = 'closed';
      newDist = 6.5;
      setSimLid('closed');
      setSimDist(6.5);
    } else if (action === 'heat-spike') {
      newTemp = 24.8;
      setSimTemp(24.8);
    } else if (action === 'cold-optimal') {
      newTemp = 4.2;
      setSimTemp(4.2);
    }

    pushToFirebase({
      temperature: newTemp,
      humidity: newHum,
      distance: newDist,
      lid: newLid
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">ESP32 Hardware Simulator</h2>
              <p className="text-xs text-slate-400">Inject test telemetry directly into Firebase RTDB</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Test Actions */}
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
              Preset Test Conditions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction('open-lid')}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/80 text-rose-300 hover:bg-rose-950/50 text-xs font-medium transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Trigger Lid Open</span>
              </button>

              <button
                onClick={() => handleQuickAction('close-lid')}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/80 text-emerald-300 hover:bg-emerald-950/50 text-xs font-medium transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Trigger Lid Closed</span>
              </button>

              <button
                onClick={() => handleQuickAction('heat-spike')}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/80 text-amber-300 hover:bg-amber-950/50 text-xs font-medium transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate Heat Spike (24.8°C)</span>
              </button>

              <button
                onClick={() => handleQuickAction('cold-optimal')}
                disabled={isPushing}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>Simulate Safe Chill (4.2°C)</span>
              </button>
            </div>
          </div>

          {/* Custom Values */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
              Manual Telemetry Packet
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Temperature (&deg;C)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={simTemp}
                  onChange={(e) => setSimTemp(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Humidity (%)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={simHum}
                  onChange={(e) => setSimHum(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Distance (cm)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={simDist}
                  onChange={(e) => setSimDist(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Lid State</label>
                <select
                  value={simLid}
                  onChange={(e) => setSimLid(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="closed">closed (Latched)</option>
                  <option value="open">open (Breached)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => pushToFirebase({
                temperature: Number(simTemp),
                humidity: Number(simHum),
                distance: Number(simDist),
                lid: simLid
              })}
              disabled={isPushing}
              className="w-full mt-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {isPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Transmit to Firebase Database</span>
            </button>
          </div>

          {/* Feedback message */}
          {pushStatus && (
            <div className={`p-2 rounded text-xs font-medium border ${
              pushStatus.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              {pushStatus.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

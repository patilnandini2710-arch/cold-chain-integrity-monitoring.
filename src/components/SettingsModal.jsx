import React, { useState } from 'react';
import { X, Sliders, Check, Clock } from 'lucide-react';

const PRESETS = [
  {
    id: 'vaccines',
    name: 'Vaccines & Biologics (WHO GDP)',
    minTemp: 2,
    maxTemp: 8,
    desc: 'WHO standard for vaccines, insulin, and sensitive biologics'
  },
  {
    id: 'frozen',
    name: 'Frozen Biologics (-25°C to -15°C)',
    minTemp: -25,
    maxTemp: -15,
    desc: 'Frozen plasma, varicella, certain enzymes'
  },
  {
    id: 'ambient',
    name: 'Controlled Room Temp (+15°C to +25°C)',
    minTemp: 15,
    maxTemp: 25,
    desc: 'Standard pills, medical devices, dry goods'
  },
  {
    id: 'fresh',
    name: 'Perishables (+0°C to +4°C)',
    minTemp: 0,
    maxTemp: 4,
    desc: 'Cold produce, dairy, biological specimens'
  }
];

export default function SettingsModal({
  isOpen,
  onClose,
  minTemp = 2.0,
  maxTemp = 8.0,
  onSaveLimits,
  staleThresholdSeconds = 15,
  onSaveStaleThreshold,
  cargoName = 'Lot #VXC-ColdChain-01 (Vaccine Carrier)',
  onSaveCargoName
}) {
  if (!isOpen) return null;

  const [localMin, setLocalMin] = useState(minTemp);
  const [localMax, setLocalMax] = useState(maxTemp);
  const [localStale, setLocalStale] = useState(staleThresholdSeconds);
  const [localCargo, setLocalCargo] = useState(cargoName);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setLocalMin(preset.minTemp);
    setLocalMax(preset.maxTemp);
  };

  const handleSave = () => {
    if (onSaveLimits) onSaveLimits(Number(localMin), Number(localMax));
    if (onSaveStaleThreshold) onSaveStaleThreshold(Number(localStale));
    if (onSaveCargoName) onSaveCargoName(localCargo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Cold Chain Configuration</h2>
              <p className="text-xs text-slate-400">Target thresholds and telemetry parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 py-4 max-h-[75vh] overflow-y-auto">
          
          {/* Cargo Label */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
              Shipment / Lot Identifier
            </label>
            <input 
              type="text" 
              value={localCargo}
              onChange={(e) => setLocalCargo(e.target.value)}
              placeholder="e.g. Lot #VXC-ColdChain-01"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-600 font-mono"
            />
          </div>

          {/* Compliance Presets */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
              Compliance Standard Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedPreset === p.id 
                      ? 'bg-slate-800 border-sky-600 text-slate-100' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-slate-200 flex items-center justify-between">
                    <span>{p.name}</span>
                    {selectedPreset === p.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <div className="text-[11px] text-sky-400 font-mono mt-0.5">
                    [{p.minTemp}°C to {p.maxTemp}°C]
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Limits Input */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min Safe Temp (&deg;C)
              </label>
              <input 
                type="number" 
                step="0.5"
                value={localMin}
                onChange={(e) => {
                  setLocalMin(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Safe Temp (&deg;C)
              </label>
              <input 
                type="number" 
                step="0.5"
                value={localMax}
                onChange={(e) => {
                  setLocalMax(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
              />
            </div>
          </div>

          {/* Configurable Stale Data Threshold (15s Default) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Stale-Data Threshold
              </label>
              <span className="text-xs font-mono text-sky-400 font-bold">{localStale} seconds</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Mark telemetry as STALE if no new packet is received within this duration (ESP32 upload cadence is ~3s).
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 30, 60].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLocalStale(val)}
                  className={`py-1.5 rounded-md text-xs font-mono border transition-colors ${
                    Number(localStale) === val
                      ? 'bg-sky-950/80 border-sky-700 text-sky-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {val}s {val === 15 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Layers, Info, Sparkles } from 'lucide-react';

export default function ChartsSection({
  historyData = [],
  tempUnit = 'C',
  convertTemp,
  minTemp = 2.0,
  maxTemp = 8.0,
  isSimulated = false
}) {
  const [viewMode, setViewMode] = useState('combined'); // 'combined' | 'temperature' | 'humidity'
  const [sampleLimit, setSampleLimit] = useState(30);

  // Take the most recent samples for the chart
  const displayData = historyData.slice(-sampleLimit).map((pt) => ({
    ...pt,
    displayTemp: typeof pt.temperature === 'number' ? Number(convertTemp(pt.temperature).toFixed(1)) : null,
    displayHum: typeof pt.humidity === 'number' ? Number(pt.humidity.toFixed(1)) : null,
  }));

  const convertedMinTemp = Number(convertTemp(minTemp).toFixed(1));
  const convertedMaxTemp = Number(convertTemp(maxTemp).toFixed(1));

  // Custom tooltips with exact values and time
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-400 border-b border-slate-800 pb-1 mb-2 flex items-center justify-between">
            <span>Time: <span className="text-slate-200">{label}</span></span>
            {isSimulated && (
              <span className="text-[9px] text-amber-400 font-bold uppercase">SIMULATED</span>
            )}
          </div>
          {payload.map((item, idx) => (
            <div key={`tip-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold text-slate-100">
                {item.value} {item.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 sm:p-6 mb-6">
      
      {/* Chart Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Session History
            </h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              isSimulated 
                ? 'bg-amber-950/80 border-amber-800 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              {isSimulated ? 'Simulated Buffer' : 'In-Memory Buffer'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSimulated
              ? 'In-memory buffer of simulated telemetry observations (test scenarios)'
              : 'Locally observed live readings from active Firebase stream (/coldchain/latest)'}
          </p>
        </div>

        {/* View Mode & Sample Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'combined'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setViewMode('temperature')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'temperature'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Temperature
            </button>
            <button
              onClick={() => setViewMode('humidity')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'humidity'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Humidity
            </button>
          </div>

          {/* Sample Window Limit */}
          <select
            value={sampleLimit}
            onChange={(e) => setSampleLimit(Number(e.target.value))}
            className="h-7 px-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none focus:border-slate-600"
          >
            <option value={15}>15 samples</option>
            <option value={30}>30 samples</option>
            <option value={60}>60 samples</option>
            <option value={120}>120 samples</option>
          </select>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-72 w-full">
        {displayData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
            <Layers className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
            <span>Awaiting telemetry stream packets to begin plotting Session History...</span>
            <span className="text-xs text-slate-600 mt-1">
              {isSimulated ? 'Virtual generator is initializing...' : 'Readings will plot dynamically as ESP32 updates Firebase (~3s cadence)'}
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isSimulated ? "#f59e0b" : "#0284c7"} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={isSimulated ? "#f59e0b" : "#0284c7"} stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
              />

              {/* Left Y Axis: Temperature */}
              <YAxis 
                yAxisId="temp" 
                stroke={isSimulated ? "#f59e0b" : "#0284c7"} 
                fontSize={11} 
                domain={['auto', 'auto']}
                unit={`°${tempUnit}`}
                tickLine={false}
                hide={viewMode === 'humidity'}
              />

              {/* Right Y Axis: Humidity */}
              <YAxis 
                yAxisId="hum" 
                orientation="right" 
                stroke="#38bdf8" 
                fontSize={11} 
                domain={[0, 100]}
                unit="%"
                tickLine={false}
                hide={viewMode === 'temperature'}
              />

              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} 
              />

              {/* Safe Range Reference Threshold Lines */}
              {viewMode !== 'humidity' && (
                <>
                  <ReferenceLine 
                    yAxisId="temp" 
                    y={convertedMaxTemp} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: `Max Safe Limit (${convertedMaxTemp}°${tempUnit})`, 
                      fill: '#ef4444', 
                      fontSize: 10, 
                      position: 'insideTopLeft' 
                    }} 
                  />
                  <ReferenceLine 
                    yAxisId="temp" 
                    y={convertedMinTemp} 
                    stroke="#38bdf8" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: `Min Safe Limit (${convertedMinTemp}°${tempUnit})`, 
                      fill: '#38bdf8', 
                      fontSize: 10, 
                      position: 'insideBottomLeft' 
                    }} 
                  />
                </>
              )}

              {/* Temperature Area */}
              {viewMode !== 'humidity' && (
                <Area 
                  yAxisId="temp"
                  type="monotone" 
                  dataKey="displayTemp" 
                  name={`Temperature (°${tempUnit})${isSimulated ? ' [Sim]' : ''}`} 
                  stroke={isSimulated ? "#f59e0b" : "#0284c7"} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#tempGradient)" 
                />
              )}

              {/* Humidity Area */}
              {viewMode !== 'temperature' && (
                <Area 
                  yAxisId="hum"
                  type="monotone" 
                  dataKey="displayHum" 
                  name={`Humidity (%)${isSimulated ? ' [Sim]' : ''}`} 
                  stroke="#38bdf8" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#humGradient)" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer with Architectural Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>
            {isSimulated 
              ? 'Simulation Mode: Plotting virtual in-memory sensor observations. Production Firebase RTDB is untouched.'
              : 'Firebase RTDB node provides the latest reading at /coldchain/latest. Plotted points represent observed stream readings.'}
          </span>
        </div>
        <div className="font-mono text-slate-400 self-end sm:self-auto">
          {displayData.length} observations in memory
        </div>
      </div>

    </div>
  );
}

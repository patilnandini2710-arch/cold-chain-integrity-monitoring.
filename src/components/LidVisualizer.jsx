import React from 'react';
import { Box, Lock, Unlock, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function LidVisualizer({ isLidOpen, distance, temperature, humidity }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Box className="w-4 h-4 text-slate-400" />
            Physical Container State & Seal Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ultrasonic clearance & mechanical seal integrity
          </p>
        </div>

        <div className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 border ${
          isLidOpen 
            ? 'bg-rose-950/40 text-rose-300 border-rose-800' 
            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
        }`}>
          {isLidOpen ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isLidOpen ? 'Seal Breached' : 'Seal Intact'}</span>
        </div>
      </div>

      {/* Container Diagram */}
      <div className="relative my-3 flex items-center justify-center min-h-[200px] bg-slate-950/50 rounded-lg p-5 border border-slate-800/80">
        
        <div className="relative w-full max-w-xs flex flex-col items-center">
          
          {/* LID (Rotates or translates up when OPEN) */}
          <div 
            className={`w-60 h-7 rounded-t-lg transition-all duration-500 ease-out flex items-center justify-center border shadow-sm relative z-20 ${
              isLidOpen 
                ? '-translate-y-8 rotate-[-12deg] bg-slate-800 border-rose-700 text-rose-200' 
                : 'translate-y-0 rotate-0 bg-slate-800 border-slate-600 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide">
              {isLidOpen ? <Unlock className="w-3.5 h-3.5 text-rose-400" /> : <Lock className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isLidOpen ? 'Lid Position: Open / Ajar' : 'Lid Position: Closed & Latched'}</span>
            </div>
            
            {/* Top Handle */}
            <div className="absolute -top-2.5 w-14 h-2.5 bg-slate-700 rounded-t-sm border-t border-x border-slate-600"></div>
          </div>

          {/* Clearance gap indicator */}
          {isLidOpen ? (
            <div className="w-52 h-8 relative flex items-center justify-center my-0.5 border-x border-dashed border-rose-800/60 bg-rose-950/10">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-rose-800/80 text-rose-300">
                Gap: {distance ? distance.toFixed(1) : '--'} cm
              </span>
            </div>
          ) : (
            <div className="w-52 h-0.5 my-0.5 bg-emerald-600"></div>
          )}

          {/* CONTAINER BODY (Box) */}
          <div className="w-60 h-32 rounded-b-lg bg-slate-800/70 border border-slate-700 flex flex-col justify-between p-3 relative shadow-inner">
            
            {/* Top info strip */}
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-400" /> ESP32 Node
              </span>
              <span>Insulated Chamber</span>
            </div>

            {/* Internal Chamber Readings */}
            <div className="bg-slate-900/90 rounded border border-slate-700/80 p-2 flex items-center justify-around">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Temp</div>
                <div className={`text-xs font-semibold font-mono ${isLidOpen ? 'text-rose-300' : 'text-slate-100'}`}>
                  {temperature ? `${temperature.toFixed(1)}°C` : '--'}
                </div>
              </div>
              <div className="h-5 w-px bg-slate-800"></div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Humidity</div>
                <div className="text-xs font-semibold font-mono text-slate-100">
                  {humidity ? `${humidity.toFixed(1)}%` : '--'}
                </div>
              </div>
              <div className="h-5 w-px bg-slate-800"></div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Clearance</div>
                <div className="text-xs font-semibold font-mono text-slate-300">
                  {distance ? `${distance.toFixed(0)} cm` : '--'}
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Hermetic Gasket</span>
              <span className={isLidOpen ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
                {isLidOpen ? 'Thermal Leakage Active' : 'Passive Cooling Maintained'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Explanatory telemetry footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Sensor: <span className="text-slate-300 font-mono">HC-SR04 Ultrasonic</span>
        </div>
        <div className="text-right">
          State: <strong className={isLidOpen ? 'text-rose-300' : 'text-emerald-300'}>{isLidOpen ? 'Unsealed' : 'Sealed'}</strong>
        </div>
      </div>
    </div>
  );
}

/**
 * DHRUVAA Component High-Frequency Sensor Stream Inspector Modal
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Activity, X, Radio, Layers, Volume2, Flame, Gauge } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SensorInspectorModal: React.FC = () => {
  const { activeModal, modalData, closeModal, selectedEngine } = useMission();

  if (activeModal !== 'sensorStream') return null;

  const componentName = modalData?.component || 'Crankshaft Bearing Race #2';
  const isBearing = componentName.toLowerCase().includes('bearing');
  const isCylinder = componentName.toLowerCase().includes('cylinder');

  // Generate synthetic high-frequency FFT / oscilloscope data points
  const waveformData = Array.from({ length: 30 }, (_, i) => {
    const baseFreq = i * 0.2;
    const noise = Math.sin(baseFreq * 3.5) * 4;
    const spike = isBearing && i > 18 && i < 24 ? 18.5 : 0;
    const heatSpike = isCylinder ? 12 + Math.sin(i * 0.8) * 3 : 0;

    return {
      time: `+${(i * 2.5).toFixed(1)}ms`,
      amplitude: parseFloat((noise + spike + (isBearing ? 14 : 6)).toFixed(2)),
      temperature: parseFloat((165 + heatSpike + (i * 0.4)).toFixed(1)),
      pressure: parseFloat((62 - (isBearing && i > 15 ? 8 : 0) + Math.sin(i) * 2).toFixed(1))
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded bg-[#090e1b] border border-[#00f0ff]/50 p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col gap-4 relative">
        <ReticleCorner color="#00f0ff" size={8} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#00f0ff] animate-pulse" />
            <div>
              <span className="font-headline text-lg text-[#dee2f5] uppercase font-bold tracking-wide">
                HIGH-FREQUENCY SENSOR STREAM // {componentName}
              </span>
              <span className="text-[10px] text-[#00dbe9] font-telemetry block uppercase">
                TARGET AIRFRAME: {selectedEngine.airframeCallsign} • SAMPLING: 50 kHz
              </span>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-[#b9cacb] hover:text-[#dee2f5] transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live FFT / Oscilloscope Waveform Display */}
        <div className="h-56 w-full bg-[#050811] rounded border border-[#3b494b]/40 p-2 relative">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-3 font-telemetry text-[9px] text-[#849495]">
            <span className="text-[#00f0ff] font-bold">FFT HARMONIC SPECTROGRAM</span>
            <span>FILTER: BAND-PASS 1.2 kHz - 15 kHz</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waveformData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#3b494b" strokeOpacity={0.3} />
              <XAxis dataKey="time" stroke="#849495" tick={{ fill: '#849495', fontSize: 9 }} tickLine={false} />
              <YAxis stroke="#849495" tick={{ fill: '#849495', fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#161b29', borderColor: '#00f0ff', fontSize: '10px' }}
                labelStyle={{ color: '#849495' }}
              />
              <Line
                type="monotone"
                dataKey="amplitude"
                stroke={isBearing ? '#ef4444' : '#00f0ff'}
                strokeWidth={2}
                dot={false}
                name="Acoustic Vib (dB)"
              />
              {isCylinder && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Thermal Flux (°C)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry Interpretation Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-telemetry text-xs">
          <div className="p-2.5 rounded bg-[#161b29]/80 border border-[#3b494b]/30 flex flex-col">
            <span className="text-[#849495] text-[9px] uppercase">Peak Harmonic Frequency</span>
            <span className="text-[#dee2f5] font-bold text-sm mt-1">
              {isBearing ? '2.45 kHz (+19 dB Spall)' : '1.18 kHz (Nominal)'}
            </span>
            <span className={isBearing ? 'text-red-400 text-[10px]' : 'text-emerald-400 text-[10px]'}>
              {isBearing ? 'Surface micro-fracture profile' : 'Balanced rotational tone'}
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#161b29]/80 border border-[#3b494b]/30 flex flex-col">
            <span className="text-[#849495] text-[9px] uppercase">Thermal Gradient</span>
            <span className="text-[#dee2f5] font-bold text-sm mt-1">
              {isCylinder ? '+14% Excursion (192°C)' : '162.4°C (Normal)'}
            </span>
            <span className={isCylinder ? 'text-amber-400 text-[10px]' : 'text-emerald-400 text-[10px]'}>
              {isCylinder ? 'Restricted boundary layer' : 'Laminar cooling flow'}
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#161b29]/80 border border-[#3b494b]/30 flex flex-col">
            <span className="text-[#849495] text-[9px] uppercase">Digital Twin Concordance</span>
            <span className="text-[#00f0ff] font-bold text-sm mt-1">98.4% Confidence</span>
            <span className="text-[#b9cacb] text-[10px]">Real-time Kalman convergence</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[#3b494b]/30">
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded bg-[#161b29] hover:bg-[#252a38] text-[#dee2f5] font-tactical text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            DISMISS SENSOR STREAM
          </button>
        </div>
      </div>
    </div>
  );
};

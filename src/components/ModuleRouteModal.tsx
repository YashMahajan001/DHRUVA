import React from 'react';
import { Layers, Terminal, X, ArrowLeft, ShieldAlert } from 'lucide-react';

interface ModuleRouteModalProps {
  moduleName: string;
  onClose: () => void;
}

export const ModuleRouteModal: React.FC<ModuleRouteModalProps> = ({ moduleName, onClose }) => {
  const moduleDetails: Record<
    string,
    { title: string; route: string; description: string; telemetryHooks: string }
  > = {
    'engine-details': {
      title: 'ENGINE DETAILS MODULE',
      route: '/engine-details',
      description:
        'Deep-dive component breakdown for Lycoming O-320: single-cylinder compression curves, ignition magneto timing drift, spark plug fouling detection, and manifold vacuum harmonics.',
      telemetryHooks: 'Hooked to CAN bus channel 0x400 - 0x4FF',
    },
    'fault-diagnostics': {
      title: 'FAULT DIAGNOSTICS MODULE',
      route: '/fault-diagnostics',
      description:
        'Aero-engine failure mode and effects analysis (FMEA), spectrogram FFT vibrational decomposition, and automatic fault isolation tree (FIT).',
      telemetryHooks: 'Hooked to FFT Acoustic Sensor Matrix [120 Hz - 2.4 kHz]',
    },
    'mission-simulation': {
      title: 'MISSION SIMULATION MODULE',
      route: '/mission-simulation',
      description:
        'Synthetic flight envelope stress test. Simulates extreme altitude (up to 32,000 FT MSL), icing conditions, turbocharger wastegate failures, and single-engine out (OEI) glide descent.',
      telemetryHooks: 'Connected to High-Altitude ISA Atmospheric Model',
    },
    'mission-tuning': {
      title: 'MISSION TUNING MODULE',
      route: '/mission-tuning',
      description:
        'FADEC air-fuel mixture optimization, RPM pitch governor calibration, fuel economy optimization curves, and acoustic signature dampening.',
      telemetryHooks: 'Ready for bidirectional FADEC serial telemetry handshake',
    },
    'fleet-monitoring': {
      title: 'FLEET MONITORING MODULE',
      route: '/fleet-monitoring',
      description:
        'Multi-UAV synchronized fleet overview. Tracks UAV-01 through UAV-08 propulsion health indices, fleet-wide component wear standard deviation, and squadron readiness.',
      telemetryHooks: 'Multi-Asset MQTT Broker subscription active',
    },
    maintenance: {
      title: 'MAINTENANCE (MRO) WORK ORDERS',
      route: '/maintenance',
      description:
        'Airframe and powerplant maintenance tracking, scheduled overhaul intervals, parts inventory, and digital logbook sign-offs conforming to aerospace airworthiness standards.',
      telemetryHooks: 'Integrated with Predictive MRO Audit Engine',
    },
    settings: {
      title: 'AVIONICS LINK & SYSTEM SETTINGS',
      route: '/settings',
      description:
        'Telemetry baud rate, FastAPI / WebSocket backend URL endpoint configuration, encryption keys, and sensor calibration offsets.',
      telemetryHooks: 'Local & Cloud Run ingress gateway',
    },
  };

  const current = moduleDetails[moduleName] || {
    title: moduleName.toUpperCase(),
    route: `/${moduleName}`,
    description: 'Upcoming modular screen of the DHRUVAA aerospace suite.',
    telemetryHooks: 'Standard telemetry bus',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b29] border border-[#00f0ff]/50 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#3b494b]/30">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#00f0ff]" />
            <span className="font-display font-bold text-base text-[#dee2f5]">
              {current.title}
            </span>
          </div>
          <button onClick={onClose} className="text-[#849495] hover:text-[#dee2f5]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="bg-[#090e1b] p-3 rounded border border-[#3b494b]/40 font-mono text-[11px] flex flex-col gap-1">
            <div className="text-[#00f0ff] font-bold">ROUTE INTEGRATION STATUS: READY</div>
            <div className="text-[#849495]">ASSIGNED ENDPOINT: {current.route}</div>
            <div className="text-[#10b981]">ARCHITECTURE: COMPATIBLE WITH CURRENT MISSION BUS</div>
          </div>

          <p className="text-[#dee2f5] leading-relaxed">{current.description}</p>

          <div className="bg-[#252a38]/80 p-2.5 rounded border border-[#3b494b]/30 text-[11px] font-mono text-[#b9cacb]">
            <span className="text-[#00dbe9] block font-bold mb-0.5">TELEMETRY HOOK:</span>
            {current.telemetryHooks}
          </div>

          <div className="p-2.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[11px] text-[#dbfcff]">
            As specified in the DHRUVAA mission blueprint, the <strong>Main Mission Dashboard</strong> is currently active and fully operational. This module will integrate seamlessly into this state architecture in the next phase.
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#3b494b]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#00f0ff] text-[#00363a] font-mono text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

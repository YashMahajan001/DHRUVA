/**
 * DHRUVAA Airworthiness Directive Generator Modal
 */
import React, { useState } from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { ShieldAlert, X, FileCheck, Key, Lock, CheckCircle } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const AirworthinessDirectiveModal: React.FC = () => {
  const { activeModal, closeModal, showToast } = useMission();
  const [isSigning, setIsSigning] = useState(false);

  if (activeModal !== 'airworthiness') return null;

  const handleSignAndTransmit = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      closeModal();
      showToast(
        'DIRECTIVE ISSUED',
        'AD-2025-08-E3 cryptographically signed and broadcast to tactical fleet ground stations and MRO hub.',
        'shield',
        'success'
      );
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded bg-[#090e1b] border border-[#00f0ff]/50 p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col gap-4 relative">
        <ReticleCorner color="#00f0ff" size={8} />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span className="font-headline text-lg text-[#dee2f5] uppercase font-bold tracking-wide">
              MRO DIRECTIVE // AD-2025-08-E3
            </span>
          </div>
          <button
            onClick={closeModal}
            className="text-[#b9cacb] hover:text-[#dee2f5] transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Notice Block */}
        <div className="p-3 rounded bg-red-950/40 border border-red-500/50 text-[#dee2f5]">
          <div className="flex items-center gap-2 text-red-400 font-tactical text-xs uppercase font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>EMERGENCY FLIGHT RESTRICTION NOTICE</span>
          </div>
          <p className="mt-1.5 font-body text-xs text-[#dee2f5]/90 leading-relaxed">
            Based on synthetic inference #ENG-03-VIB-99 and ultrasonic micro-spall acoustic evidence, Engine 03 (UAV-03) has breached the minimum safe operational airworthiness limit (Current RUL: <strong className="text-red-400">18h &lt; Floor: 30h</strong>).
          </p>
        </div>

        {/* Detailed Directive Specifications */}
        <div className="flex flex-col gap-2 font-body text-xs text-[#b9cacb] bg-[#161b29]/60 p-3 rounded border border-[#3b494b]/30">
          <div>
            <strong className="text-[#dee2f5] font-tactical text-[11px] uppercase">Affected Tail:</strong>{' '}
            <span>UAV-03 (Tactical Recon Quad-Turbine // Lycoming O-360-A4M)</span>
          </div>
          <div>
            <strong className="text-[#dee2f5] font-tactical text-[11px] uppercase">Mandatory Corrective Action:</strong>{' '}
            <span>Disassemble crankcase, extract bearing race #2, replace with mil-spec PN-8812-C, and complete hot-section borescope calibration.</span>
          </div>
          <div>
            <strong className="text-[#dee2f5] font-tactical text-[11px] uppercase">Authority:</strong>{' '}
            <span>DHRUVAA Predictive Airworthiness Engine v4.2 // Certified Controller: CDR V. SHASTRI</span>
          </div>
          <div>
            <strong className="text-[#dee2f5] font-tactical text-[11px] uppercase">Cryptographic Stamp:</strong>{' '}
            <span className="font-telemetry text-[10px] text-[#00f0ff]">SHA-256: e89a...77b0-SECURE-CHAIN</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3b494b]/30">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded bg-[#161b29] hover:bg-[#252a38] text-[#dee2f5] font-tactical text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            DISMISS
          </button>
          <button
            onClick={handleSignAndTransmit}
            disabled={isSigning}
            className="px-5 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-tactical text-xs uppercase font-bold tracking-wider transition-all shadow-[0_0_16px_rgba(239,68,68,0.4)] flex items-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isSigning ? 'TRANSMITTING DIRECTIVE...' : 'CRYPTOGRAPHICALLY SIGN & TRANSMIT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

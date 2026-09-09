/**
 * DHRUVAA Work Order Management Modal
 */
import React from 'react';
import { useMission } from '../../context/MaintenanceContext';
import { Wrench, X, CheckCircle, Package, Truck, UserCheck, AlertTriangle } from 'lucide-react';
import { ReticleCorner } from '../common/ReticleCorner';

export const WorkOrderModal: React.FC = () => {
  const { activeModal, modalData, closeModal, approveWorkOrder, showToast } = useMission();

  if (activeModal !== 'workOrder') return null;

  const woId = modalData?.woId || '8924';
  const is8924 = woId === '8924';
  const is8925 = woId === '8925';

  // Read actual WO from engine context if available
  const contextEngine = modalData?.engine;
  const contextWo = contextEngine?.workOrders?.find((w: any) => w.id === woId);

  const order = {
    id: woId,
    title: is8924
      ? 'Emergency Bearing Race Overhaul & Crankcase Disassembly'
      : is8925
      ? 'Cylinder #2 Cooling Baffle Audit & Heat Exchanger Clean'
      : 'Scheduled 100-Hour Magneto & Filter Service',
    priority: is8924 ? 'CRITICAL // IMMEDIATE' : is8925 ? 'HIGH // PREVENTIVE' : 'ROUTINE',
    engine: is8924 ? 'ENGINE 03 (UAV-03)' : is8925 ? 'ENGINE 02 (UAV-02)' : 'ENGINE 01 (UAV-01)',
    technician: is8924 ? 'TECH SGT. K. RAMAN // CHIEF PROPULSION SPEC' : 'SENIOR TECH M. PETROV',
    parts: is8924
      ? [
          { name: 'Crankshaft Bearing Race #2', partNo: 'PN-8812-C', status: 'IN STOCK (DEPOT 4)' },
          { name: 'High-Temp Fluorosilicone O-Ring Set', partNo: 'OR-440-HT', status: 'RESERVED' },
          { name: 'Scavenge Screen Magnetic Trap', partNo: 'SC-991', status: 'IN STOCK' }
        ]
      : [
          { name: 'Cylinder #2 Silicone Baffle Gasket Seal', partNo: 'BG-44-A', status: 'IN STOCK (DEPOT 2)' },
          { name: 'Thermal Dissipation Fin Cleaner Solvent', partNo: 'SL-770', status: 'IN STOCK' }
        ],
    status: contextWo?.status || (is8924 ? 'DISPATCHED' : 'PENDING APPROVAL'),
    estimatedLaborHours: contextWo?.estimatedLaborHours ? `${contextWo.estimatedLaborHours} Hours` : (is8924 ? '8.5 Hours' : '3.0 Hours')
  };

  const handleApprove = () => {
    approveWorkOrder(woId);
    closeModal();
  };

  const handleExpedite = () => {
    showToast('LOGISTICS DISPATCH', `Expedited courier priority allocated for ${order.parts[0].partNo} to Tactical Hangar 4.`, 'truck', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded bg-[#090e1b] border border-[#00f0ff]/50 p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col gap-4 relative">
        <ReticleCorner color="#00f0ff" size={8} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/30 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#00f0ff]" />
            <span className="font-headline text-lg text-[#dee2f5] uppercase font-bold tracking-wide">
              MRO WORK ORDER // WO #{order.id}
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

        {/* Title & Priority Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#161b29]/80 rounded border border-[#3b494b]/30">
          <div>
            <span className="font-telemetry text-[9px] text-[#849495] uppercase">
              WORK ORDER SCOPE
            </span>
            <h3 className="font-headline text-base text-[#dee2f5] font-bold">
              {order.title}
            </h3>
            <span className="font-tactical text-xs text-[#00f0ff] uppercase mt-0.5 block">
              TARGET: {order.engine}
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded font-telemetry text-[10px] font-bold uppercase border ${
              is8924
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            }`}
          >
            {order.priority}
          </span>
        </div>

        {/* Assignment & Bill of Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#161b29]/50 rounded border border-[#3b494b]/20 flex flex-col gap-2">
            <span className="font-telemetry text-[9px] text-[#849495] uppercase font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
              CREW DISPATCH
            </span>
            <div className="font-body text-[#dee2f5]">
              <strong>Lead Specialist:</strong> {order.technician}
            </div>
            <div className="font-body text-[#b9cacb]">
              <strong>Est. Labor Duration:</strong> {order.estimatedLaborHours}
            </div>
            <div className="font-body text-[#b9cacb]">
              <strong>Hangar Allocation:</strong> Depot Bay Delta-2
            </div>
          </div>

          <div className="p-3 bg-[#161b29]/50 rounded border border-[#3b494b]/20 flex flex-col gap-2">
            <span className="font-telemetry text-[9px] text-[#849495] uppercase font-bold flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-[#00f0ff]" />
              PARTS &amp; TOOLING ALLOCATION
            </span>
            <div className="flex flex-col gap-1.5">
              {order.parts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-telemetry border-b border-[#3b494b]/20 pb-1">
                  <span className="text-[#dee2f5]">{p.name} ({p.partNo})</span>
                  <span className="text-[#00f0ff] font-bold">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3b494b]/30">
          <button
            onClick={closeModal}
            className="px-3 py-2 rounded bg-[#161b29] hover:bg-[#252a38] text-[#dee2f5] font-tactical text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            CLOSE
          </button>
          <button
            onClick={handleExpedite}
            className="px-3 py-2 rounded bg-[#252a38] hover:bg-[#32394c] border border-[#00f0ff]/40 text-[#00f0ff] font-tactical text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>EXPEDITE PARTS</span>
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 rounded bg-[#00f0ff] hover:bg-[#7df4ff] text-[#00363a] font-tactical text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>APPROVE &amp; DISPATCH</span>
          </button>
        </div>
      </div>
    </div>
  );
};

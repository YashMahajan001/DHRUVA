import React, { useState } from 'react';
import { Compass, Plane, Shield, X, Check } from 'lucide-react';
import { Mission } from '../../types';

interface MissionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMission: Mission;
  onUpdateMission: (updated: Partial<Mission>) => void;
}

export const MissionSelectModal: React.FC<MissionSelectModalProps> = ({
  isOpen,
  onClose,
  currentMission,
  onUpdateMission,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<string>(
    currentMission.missionName || 'HIGH ALTITUDE ISR'
  );
  const [altitude, setAltitude] = useState<number>(currentMission.altitudeFt || 18000);
  const [phase, setPhase] = useState<string>(currentMission.phase || 'LOITER // AUTONOMOUS');

  if (!isOpen) return null;

  const missionProfiles = [
    {
      name: 'HIGH ALTITUDE ISR',
      type: 'Autonomous Strategic Reconnaissance',
      alt: 18000,
      phase: 'LOITER // AUTONOMOUS',
      speed: 198,
      fov: 84,
      fuelBurn: 32.5,
    },
    {
      name: 'TACTICAL BORDER PATROL',
      type: 'Low-Radar Perimeter Scan',
      alt: 12500,
      phase: 'INGRESS // STEALTH CRUISE',
      speed: 175,
      fov: 92,
      fuelBurn: 28.2,
    },
    {
      name: 'MARITIME SEARCH & TRACK',
      type: 'Synthetic Aperture Radar Sweeps',
      alt: 8500,
      phase: 'SURVEILLANCE // ACTIVE SAR',
      speed: 160,
      fov: 110,
      fuelBurn: 26.0,
    },
  ];

  const handleApply = () => {
    const matched = missionProfiles.find((p) => p.name === selectedProfile);
    onUpdateMission({
      missionName: selectedProfile,
      missionType: matched?.type || currentMission.missionType,
      altitudeFt: altitude,
      phase: phase,
      airspeedKt: matched?.speed || currentMission.airspeedKt,
      fovDegrees: matched?.fov || currentMission.fovDegrees,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b29] border border-[#00f0ff]/40 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#3b494b]/30">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00f0ff]" />
            <span className="font-display font-bold text-base text-[#dee2f5]">
              MISSION PROFILE &amp; FLIGHT ENVELOPE
            </span>
          </div>
          <button onClick={onClose} className="text-[#849495] hover:text-[#dee2f5]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[10px] text-[#849495] uppercase font-bold">
            Select Active Tactical Mission:
          </span>

          <div className="flex flex-col gap-2">
            {missionProfiles.map((p) => {
              const isSelected = selectedProfile === p.name;
              return (
                <div
                  key={p.name}
                  onClick={() => {
                    setSelectedProfile(p.name);
                    setAltitude(p.alt);
                    setPhase(p.phase);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#252a38] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                      : 'bg-[#090e1b]/70 border-[#3b494b]/30 hover:border-[#3b494b]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-[#dee2f5]">{p.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#00f0ff]" />}
                  </div>
                  <p className="text-[11px] text-[#b9cacb] mb-1.5">{p.type}</p>
                  <div className="flex gap-3 text-[10px] font-mono text-[#849495]">
                    <span>ALT: {p.alt.toLocaleString()} FT</span>
                    <span>SPD: {p.speed} KT</span>
                    <span>EST BURN: {p.fuelBurn} L/H</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-[#849495] uppercase font-bold">
                Assigned Altitude (FT):
              </label>
              <input
                type="number"
                value={altitude}
                step={500}
                onChange={(e) => setAltitude(parseInt(e.target.value, 10) || 10000)}
                className="bg-[#090e1b] border border-[#3b494b]/40 px-3 py-1.5 rounded text-xs font-mono text-[#dee2f5] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-[#849495] uppercase font-bold">
                Operational Phase:
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="bg-[#090e1b] border border-[#3b494b]/40 px-3 py-1.5 rounded text-xs font-mono text-[#dee2f5] focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="LOITER // AUTONOMOUS">LOITER // AUTONOMOUS</option>
                <option value="INGRESS // STEALTH CRUISE">INGRESS // STEALTH CRUISE</option>
                <option value="EGRESS // RECOVERY">EGRESS // RECOVERY</option>
                <option value="HOLDING // ORBIT">HOLDING // ORBIT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#3b494b]/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded font-mono text-xs text-[#849495] hover:text-[#dee2f5]"
          >
            CANCEL
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 rounded bg-[#00f0ff] text-[#00363a] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
          >
            UPDATE MISSION
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * DHRUVAA — Tactical Mission Theatre Airspace Map (Center Column)
 */

import React from 'react';
import { Radar, Compass } from 'lucide-react';
import { useDashboard } from '../../context/MissionSimulationContext';

export const TacticalMapCard: React.FC = () => {
  const { telemetry, selectedMission, secondsElapsed } = useDashboard();

  // Compute animated UAV position in orbit around WP-03 (320, 80)
  const orbitAngle = (secondsElapsed % 360) * (Math.PI / 180);
  const uavX = 320 + Math.cos(orbitAngle) * 45;
  const uavY = 80 + Math.sin(orbitAngle) * 25;
  // Heading vector pointing tangent to the ellipse
  const headVecX = -Math.sin(orbitAngle) * 20;
  const headVecY = Math.cos(orbitAngle) * 12;

  return (
    <div className="relative bg-[#161b29]/90 rounded-lg p-3.5 shadow-md border border-[#3b494b]/20 flex flex-col gap-2.5 overflow-hidden">
      {/* Module Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <Radar className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-mono-telemetry text-xs text-[#dee2f5] uppercase tracking-wider font-semibold">
            TACTICAL MISSION THEATRE // AIRSPACE-04
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono-telemetry text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#1a1f2d] text-[#00f0ff] border border-[#3b494b]/30">
            {telemetry.coordinatesFormatted}
          </span>
          <span className={`px-2 py-0.5 rounded font-semibold ${
            selectedMission.losLinkStatus === 'STABLE'
              ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30'
              : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30'
          }`}>
            LOS LINK: {selectedMission.losLinkStatus}
          </span>
        </div>
      </div>

      {/* Tactical Map Viewport with Calibrated Grid & SVG Vectors */}
      <div className="relative w-full h-80 rounded bg-[#090e1b] overflow-hidden flex items-center justify-center border border-[#3b494b]/30">
        {/* Background Atmospheric Military Aerial Imagery */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage: `url('/tactical_uav_bg.jpg')`
          }}
        />

        {/* Calibrated Tactical Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tacticalGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f0ff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tacticalGridPattern)" />
        </svg>

        {/* Dynamic Flight Route & Animated UAV SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 700 320" preserveAspectRatio="none">
          {/* Planned Future Flight Route (Dashed Navy) */}
          <path
            d="M 60 260 L 170 180 L 320 80 L 460 80 L 580 150 L 640 240"
            fill="none"
            stroke="#0053db"
            strokeWidth="2"
            strokeDasharray="6,4"
            opacity="0.65"
          />

          {/* Active Flown Flight Route (Cyan Solid Glow) */}
          <path
            d="M 60 260 L 170 180 L 320 80"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="3"
            filter="drop-shadow(0 0 6px #00f0ff)"
          />

          {/* WP-01 TAKEOFF */}
          <circle cx="60" cy="260" r="4" fill="#00f0ff" />
          <text x="60" y="280" fill="#dee2f5" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle">
            WP-01 [TAKEOFF]
          </text>

          {/* WP-02 CLIMB */}
          <circle cx="170" cy="180" r="4" fill="#00f0ff" />
          <text x="170" y="200" fill="#dee2f5" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle">
            WP-02 [CLIMB]
          </text>

          {/* WP-03 LOITER ORBIT */}
          <circle cx="320" cy="80" r="5" fill="#00f0ff" />
          <text x="320" y="52" fill="#00f0ff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="middle">
            WP-03 [LOITER ORBIT]
          </text>

          {/* Loiter Orbit Ellipse */}
          <ellipse
            cx="320"
            cy="80"
            rx="45"
            ry="25"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.2"
            strokeDasharray="4,3"
            opacity="0.6"
          />

          {/* WP-04 INGRESS */}
          <circle cx="460" cy="80" r="4" fill="#849495" />
          <text x="460" y="58" fill="#849495" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle">
            WP-04 [INGRESS]
          </text>

          {/* WP-05 RTB BASE */}
          <circle cx="640" cy="240" r="4" fill="#849495" />
          <text x="640" y="260" fill="#849495" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle">
            WP-05 [RTB BASE]
          </text>

          {/* Point of No Return (PNR) Fuel Safety Line */}
          <line x1="510" y1="40" x2="510" y2="280" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x="515" y="55" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold">
            FUEL PNR LIMIT (NO-RETURN)
          </text>

          {/* Animated UAV Marker */}
          <g transform={`translate(${uavX.toFixed(1)}, ${uavY.toFixed(1)})`}>
            {/* Pulsing Target Reticle */}
            <circle cx="0" cy="0" r="16" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.75" className="animate-ping" />
            <circle cx="0" cy="0" r="6" fill="#00f0ff" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#00363a" strokeWidth="1.5" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#00363a" strokeWidth="1.5" />
            {/* Heading Vector */}
            <line x1="0" y1="0" x2={headVecX.toFixed(1)} y2={headVecY.toFixed(1)} stroke="#00f0ff" strokeWidth="2.5" />
          </g>
        </svg>

        {/* Top-Right Tactical Map Overlay HUD */}
        <div className="absolute top-3 right-3 bg-[#090e1b]/85 backdrop-blur-md p-2 rounded border border-[#3b494b]/40 shadow flex flex-col gap-1 z-20">
          <div className="flex items-center justify-between gap-4 font-mono-telemetry text-[10px]">
            <span className="text-[#849495]">GS:</span>
            <span className="text-[#dee2f5] font-bold">{telemetry.groundSpeed} KT</span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono-telemetry text-[10px]">
            <span className="text-[#849495]">WIND:</span>
            <span className="text-[#dee2f5]">
              {selectedMission.windSpeedKt} KT @ {selectedMission.windHeadingDeg}°
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono-telemetry text-[10px]">
            <span className="text-[#849495]">DENSITY ALT:</span>
            <span className="text-[#00f0ff] font-semibold">{telemetry.densityAltitude.toLocaleString()} FT</span>
          </div>
        </div>

        {/* Bottom Left Mission Status HUD */}
        <div className="absolute bottom-3 left-3 bg-[#090e1b]/85 backdrop-blur-md px-2.5 py-1.5 rounded border border-[#3b494b]/40 shadow flex items-center gap-2 z-20">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
          <span className="font-mono-telemetry text-[10px] text-[#dee2f5] uppercase tracking-wider font-semibold">
            CURRENT LEG: {selectedMission.currentLeg}
          </span>
        </div>
      </div>

      {/* Real-Time Flight Telemetry Ribbon Under Map */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-[#1a1f2d] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            True Airspeed (TAS)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold">
              {telemetry.trueAirspeed}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">KTAS</span>
          </div>
        </div>

        <div className="bg-[#1a1f2d] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Rate of Climb
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`font-mono-telemetry text-base font-bold ${
              telemetry.rateOfClimb >= 0 ? 'text-[#00f0ff]' : 'text-[#f59e0b]'
            }`}>
              {telemetry.rateOfClimb > 0 ? `+${telemetry.rateOfClimb}` : telemetry.rateOfClimb}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">FPM</span>
          </div>
        </div>

        <div className="bg-[#1a1f2d] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Fuel Remaining
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-telemetry text-base text-[#dee2f5] font-bold">
              {telemetry.fuelRemaining}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">LITRES</span>
          </div>
        </div>

        <div className="bg-[#1a1f2d] p-2 rounded border border-[#3b494b]/20">
          <span className="font-mono-telemetry text-[9px] text-[#849495] uppercase block">
            Safe RTB Fuel Margin
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`font-mono-telemetry text-base font-bold ${
              telemetry.safeRtbMarginHours > 2.0 ? 'text-[#00f0ff]' : 'text-[#ef4444]'
            }`}>
              {telemetry.safeRtbMarginHours > 0 ? `+${telemetry.safeRtbMarginHours}` : telemetry.safeRtbMarginHours}
            </span>
            <span className="font-mono-telemetry text-[10px] text-[#b9cacb]">HOURS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

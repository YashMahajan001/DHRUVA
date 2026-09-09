import React, { useRef, useEffect } from 'react';

export interface CylinderTelemetryState {
  id: number;
  name?: string;
  temp?: number;
  status?: string;
  isFault?: boolean;
}

interface DynamicEngineTwinProps {
  zoomLevel?: number;
  isThermalMode?: boolean;
  rpm?: number;
  activeHotspotId?: number;
  onRotationChange?: (yaw: number, pitch: number) => void;
  className?: string;
  cameraRotationDeg?: number;
  explodedOffset?: number;
  renderMode?: 'schematic' | 'wireframe' | 'exploded' | 'holo' | 'solid';
  selectedSubsystemId?: string;
  cylinders?: CylinderTelemetryState[];
  chtPeak?: number;
  chtAvg?: number;
  chtSpread?: number;
  isStressed?: boolean;
}

export const DynamicEngineTwin: React.FC<DynamicEngineTwinProps> = ({
  zoomLevel = 1,
  isThermalMode = false,
  rpm = 2450,
  activeHotspotId = 2,
  onRotationChange,
  className = '',
  cameraRotationDeg,
  explodedOffset = 0,
  renderMode = 'schematic',
  selectedSubsystemId,
  cylinders,
  chtPeak,
  chtAvg,
  chtSpread,
  isStressed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D rotation state (in radians) stored in ref for uninterrupted 60 FPS rendering
  const rotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: 0.58, // ~33 deg isometric view
    pitch: -0.28, // ~-16 deg down-angle
  });
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoRotateRef = useRef<boolean>(true);
  const idleTimerRef = useRef<any>(null);
  const lastNotifiedDegRef = useRef<{ yaw: number; pitch: number }>({ yaw: -999, pitch: -999 });

  // Sync with external camera rotation buttons (e.g. from Telemetry Viewport dock)
  const prevCameraRotRef = useRef<number>(cameraRotationDeg || 0);
  useEffect(() => {
    if (cameraRotationDeg !== undefined && cameraRotationDeg !== prevCameraRotRef.current) {
      const deltaDeg = cameraRotationDeg - prevCameraRotRef.current;
      prevCameraRotRef.current = cameraRotationDeg;
      rotationRef.current.yaw += (deltaDeg * Math.PI) / 180;
    }
  }, [cameraRotationDeg]);

  // Modern Unified Pointer Handlers with Pointer Capture & full 3D orbital freedom
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only primary mouse button (left-click) or touch/pen
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    velocityRef.current = { x: 0, y: 0 };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0072;
    const deltaYaw = dx * sensitivity;
    const deltaPitch = -dy * sensitivity;

    // Free 360° continuous yaw rotation without artificial boundary
    rotationRef.current.yaw += deltaYaw;
    // Expansive pitch range: -1.48 to +1.48 rad (~85° up/down) for full top/bottom inspection
    rotationRef.current.pitch = Math.max(-1.48, Math.min(1.48, rotationRef.current.pitch + deltaPitch));

    // Smooth inertia tracking
    velocityRef.current = {
      x: velocityRef.current.x * 0.35 + deltaYaw * 0.65,
      y: velocityRef.current.y * 0.35 + deltaPitch * 0.65,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      autoRotateRef.current = true;
    }, 4500);
  };

  // Main 3D Canvas Photorealistic Engine Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    // Convection sparks & intake airflow particles
    const sparks: { x: number; y: number; z: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
    const airParticles: { x: number; y: number; z: number; speed: number }[] = [];

    for (let i = 0; i < 40; i++) {
      airParticles.push({
        x: (Math.random() - 0.5) * 180,
        y: -150 - Math.random() * 90,
        z: -100 + Math.random() * 200,
        speed: 2 + Math.random() * 3.5,
      });
    }

    const render = () => {
      time += 0.022;

      // Dynamic inertia glide and gentle auto-orbit oscillation when idle
      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current.x) > 0.00004 || Math.abs(velocityRef.current.y) > 0.00004) {
          rotationRef.current.yaw += velocityRef.current.x;
          rotationRef.current.pitch = Math.max(
            -1.48,
            Math.min(1.48, rotationRef.current.pitch + velocityRef.current.y)
          );
          velocityRef.current.x *= 0.92;
          velocityRef.current.y *= 0.92;
        } else {
          velocityRef.current.x = 0;
          velocityRef.current.y = 0;
          if (autoRotateRef.current) {
            rotationRef.current.yaw += Math.sin(time * 0.35) * 0.0018;
          }
        }
      }

      const curYaw = rotationRef.current.yaw;
      const curPitch = rotationRef.current.pitch;

      // Sync orientation HUD with normalized angle values
      if (onRotationChange) {
        const normYawDeg = Math.round((((curYaw * 180) / Math.PI) % 360 + 540) % 360 - 180);
        const normPitchDeg = Math.round((curPitch * 180) / Math.PI);
        if (
          normYawDeg !== lastNotifiedDegRef.current.yaw ||
          normPitchDeg !== lastNotifiedDegRef.current.pitch
        ) {
          lastNotifiedDegRef.current = { yaw: normYawDeg, pitch: normPitchDeg };
          onRotationChange(normYawDeg, normPitchDeg);
        }
      }

      // Handle Retina DPI scaling
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 760;
      const height = rect.height || 500;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 10;
      const zoom = zoomLevel * 1.18;

      // 3D rotation trigonometric constants
      const cosY = Math.cos(curYaw);
      const sinY = Math.sin(curYaw);
      const cosP = Math.cos(curPitch);
      const sinP = Math.sin(curPitch);

      // Key light direction for metallic diffuse & specular shading
      const lightDir = { x: -0.55, y: -0.75, z: -0.5 };
      const lightLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
      const lx = lightDir.x / lightLen;
      const ly = lightDir.y / lightLen;
      const lz = lightDir.z / lightLen;

      // Full 3D Camera Projection function
      const project = (x: number, y: number, z: number) => {
        // Yaw around Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Pitch around X
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        // Perspective distance
        const fov = 780;
        const scale = fov / (fov + z2);
        return {
          x: cx + x1 * scale * zoom,
          y: cy + y2 * scale * zoom,
          z: z2,
          scale: scale * zoom,
          rx: x1,
          ry: y2,
          rz: z2,
        };
      };

      // Calculate 3D surface normal lighting intensity (0 to 1)
      const getLightIntensity = (nx: number, ny: number, nz: number) => {
        // Rotate normal to camera space
        const nx1 = nx * cosY - nz * sinY;
        const nz1 = nx * sinY + nz * cosY;
        const ny2 = ny * cosP - nz1 * sinP;
        const nz2 = ny * sinP + nz1 * cosP;
        const dot = -(nx1 * lx + ny2 * ly + nz2 * lz);
        return Math.max(0.18, Math.min(1.0, dot * 0.85 + 0.35));
      };

      // 4-Stroke Combustion Engine Timing
      const cycleSpeed = (rpm / 60) * 0.5;
      const cyclePhase = time * cycleSpeed * Math.PI * 2;
      const shaftAngle = time * (rpm / 60) * Math.PI * 2;

      // Exploded offset factor (0 to 1)
      const explode = (explodedOffset || 0) / 100;
      const isWire = renderMode === 'wireframe';
      const isHolo = renderMode === 'holo' || isThermalMode;

      // Global Color Tokens
      const cyan = '#00f0ff';
      const wireCyan = isHolo ? 'rgba(0, 180, 255, 0.45)' : isWire ? 'rgba(0, 240, 255, 0.95)' : 'rgba(0, 240, 255, 0.7)';
      const hotRed = isHolo ? '#ff1e1e' : '#ff3b30';
      const hotOrange = isHolo ? '#ff8c00' : '#ff9500';

      // ── 1. GROUND BED / REFLECTIVE AEROSPACE MOUNTING SHADOW ──
      const shadowCenter = project(0, 155, 0);
      const shadowGrad = ctx.createRadialGradient(
        shadowCenter.x,
        shadowCenter.y,
        15,
        shadowCenter.x,
        shadowCenter.y,
        240 * shadowCenter.scale
      );
      shadowGrad.addColorStop(0, isThermalMode ? 'rgba(255, 60, 0, 0.16)' : 'rgba(0, 240, 255, 0.12)');
      shadowGrad.addColorStop(0.6, isThermalMode ? 'rgba(255, 30, 0, 0.04)' : 'rgba(0, 240, 255, 0.03)');
      shadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(shadowCenter.x, shadowCenter.y, 250 * shadowCenter.scale, 85 * shadowCenter.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. ENGINE MOUNTING CRADLE (DYNAFOCAL TUBULAR FRAME) ──
      const cradleNodes = [
        project(-120, 85, 120),
        project(120, 85, 120),
        project(140, -45, 130),
        project(-140, -45, 130),
      ];
      ctx.strokeStyle = '#253549';
      ctx.lineWidth = 3.5 * shadowCenter.scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cradleNodes[0].x, cradleNodes[0].y);
      ctx.lineTo(cradleNodes[1].x, cradleNodes[1].y);
      ctx.lineTo(cradleNodes[2].x, cradleNodes[2].y);
      ctx.lineTo(cradleNodes[3].x, cradleNodes[3].y);
      ctx.closePath();
      ctx.stroke();

      // Rubber isolation mounts on cradle corners
      cradleNodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8 * node.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#0f1724';
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // ── 3. MAIN CAST ALUMINUM CRANKCASE & INTERNAL CRANKSHAFT CORE ──
      const bw = 88;
      const bh = 92;
      const bd = 135;
      const crankCenterY = -12;
      const crankRadius = 22;

      // ── 3A. INTERNAL FORGED CRANKSHAFT, COUNTERWEIGHTS & JOURNAL BEARINGS ──
      // 1. Central Longitudinal Crankshaft Main Axis (Forged 4340 Chrome-Moly)
      const crankFront = project(0, crankCenterY, -bd + 10);
      const crankRear = project(0, crankCenterY, bd - 10);
      ctx.beginPath();
      ctx.moveTo(crankFront.x, crankFront.y);
      ctx.lineTo(crankRear.x, crankRear.y);
      ctx.strokeStyle = isThermalMode ? '#667799' : '#8fa4be';
      ctx.lineWidth = 15 * crankFront.scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // High-pressure internal oil gallery pressurized conduit
      ctx.beginPath();
      ctx.moveTo(crankFront.x, crankFront.y);
      ctx.lineTo(crankRear.x, crankRear.y);
      ctx.strokeStyle = isThermalMode ? 'rgba(255, 140, 0, 0.75)' : 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 2.5 * crankFront.scale;
      ctx.stroke();

      // 2. Main Journal Bearings in structural bulkheads (Front, Center, Rear)
      [-bd + 26, 0, bd - 26].forEach((mbZ) => {
        const mbPos = project(0, crankCenterY, mbZ);
        ctx.beginPath();
        ctx.arc(mbPos.x, mbPos.y, 16 * mbPos.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#1b2a3d';
        ctx.fill();
        ctx.strokeStyle = isThermalMode ? '#ffaa00' : '#00f0ff';
        ctx.lineWidth = 2 * mbPos.scale;
        ctx.stroke();

        // Hex bolt pairs on main bearing saddle caps
        [-1, 1].forEach((sign) => {
          const capBolt = project(sign * 18, crankCenterY + 14, mbZ);
          ctx.beginPath();
          ctx.arc(capBolt.x, capBolt.y, 2.5 * capBolt.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#dee2f5';
          ctx.fill();
        });
      });

      // 3. Forged Crank Throws & Precision Counterweights
      // Front pair (Cyl 1 & 2 at Z = -52) and Rear pair (Cyl 3 & 4 at Z = +52)
      const crankThrows = [
        { z: -52, angle: shaftAngle },
        { z: 52, angle: shaftAngle + Math.PI },
      ];

      crankThrows.forEach((ct) => {
        const cpX = Math.cos(ct.angle) * crankRadius;
        const cpY = crankCenterY + Math.sin(ct.angle) * crankRadius;
        const cpProj = project(cpX, cpY, ct.z);

        // Counterweight (crescent mass opposite crankpin)
        const cwAngle = ct.angle + Math.PI;
        const cwRadius = crankRadius + 20;
        const cwP1 = project(Math.cos(cwAngle - 0.5) * cwRadius, crankCenterY + Math.sin(cwAngle - 0.5) * cwRadius, ct.z - 8);
        const cwP2 = project(Math.cos(cwAngle) * (cwRadius + 6), crankCenterY + Math.sin(cwAngle) * (cwRadius + 6), ct.z);
        const cwP3 = project(Math.cos(cwAngle + 0.5) * cwRadius, crankCenterY + Math.sin(cwAngle + 0.5) * cwRadius, ct.z + 8);
        const cwCenter = project(0, crankCenterY, ct.z);

        ctx.beginPath();
        ctx.moveTo(cwCenter.x, cwCenter.y);
        ctx.lineTo(cwP1.x, cwP1.y);
        ctx.lineTo(cwP2.x, cwP2.y);
        ctx.lineTo(cwP3.x, cwP3.y);
        ctx.closePath();
        ctx.fillStyle = isThermalMode ? '#283852' : '#3d4f66';
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Crankpin journal (hardened polished steel pin)
        ctx.beginPath();
        ctx.arc(cpProj.x, cpProj.y, 7 * cpProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      // ── 3B. SEMI-TRANSLUCENT METALLIC CRANKCASE STRUCTURAL SHELL ──
      // 3D Hexagonal faceted vertices
      const v = [
        project(-bw, -bh, -bd), // 0: Top-Left-Front
        project(bw, -bh, -bd),  // 1: Top-Right-Front
        project(bw, bh, -bd),   // 2: Bot-Right-Front
        project(-bw, bh, -bd),  // 3: Bot-Left-Front
        project(-bw, -bh, bd),  // 4: Top-Left-Rear
        project(bw, -bh, bd),   // 5: Top-Right-Rear
        project(bw, bh, bd),    // 6: Bot-Right-Rear
        project(-bw, bh, bd),   // 7: Bot-Left-Rear
      ];

      // Draw faceted 3D face with realistic metallic shading & aero cutaway translucency
      const draw3DFace = (
        i1: number,
        i2: number,
        i3: number,
        i4: number,
        nx: number,
        ny: number,
        nz: number,
        baseColor: [number, number, number]
      ) => {
        const light = getLightIntensity(nx, ny, nz);
        const r = Math.round(baseColor[0] * light);
        const g = Math.round(baseColor[1] * light);
        const b = Math.round(baseColor[2] * light);

        ctx.beginPath();
        ctx.moveTo(v[i1].x, v[i1].y);
        ctx.lineTo(v[i2].x, v[i2].y);
        ctx.lineTo(v[i3].x, v[i3].y);
        ctx.lineTo(v[i4].x, v[i4].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.74)`;
        ctx.fill();
        ctx.strokeStyle = isThermalMode ? '#0066aa' : '#1e3046';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Edge specular wireframe
        ctx.strokeStyle = wireCyan;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(v[i1].x, v[i1].y);
        ctx.lineTo(v[i2].x, v[i2].y);
        ctx.stroke();
      };

      const alloy: [number, number, number] = isThermalMode ? [20, 35, 70] : [32, 44, 62];
      const alloyDark: [number, number, number] = isThermalMode ? [12, 22, 45] : [20, 28, 42];

      // Rear, Bottom, Sides, Top, Front (Painter's algorithm sorting)
      draw3DFace(4, 5, 6, 7, 0, 0, 1, alloyDark);   // Rear
      draw3DFace(3, 2, 6, 7, 0, 1, 0, alloyDark);   // Bottom
      draw3DFace(0, 4, 7, 3, -1, 0, 0, alloy);      // Left
      draw3DFace(1, 5, 6, 2, 1, 0, 0, alloy);       // Right
      draw3DFace(0, 1, 5, 4, 0, -1, 0, [45, 62, 85]); // Top Deck (brighter)
      draw3DFace(0, 1, 2, 3, 0, 0, -1, alloy);      // Front

      // Centerline split seam with machined flange & hex bolt pairs
      const seamFrontTop = project(0, -bh - 4, -bd);
      const seamFrontBot = project(0, bh + 4, -bd);
      ctx.beginPath();
      ctx.moveTo(seamFrontTop.x, seamFrontTop.y);
      ctx.lineTo(seamFrontBot.x, seamFrontBot.y);
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      for (let yOff = -bh + 15; yOff <= bh - 15; yOff += 28) {
        const bL = project(-10, yOff, -bd - 1);
        const bR = project(10, yOff, -bd - 1);
        [bL, bR].forEach((bp) => {
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, 3 * bp.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#dee2f5';
          ctx.fill();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // Stiffener ribs along crankcase sides
      for (let zOff = -bd + 35; zOff <= bd - 35; zOff += 32) {
        const ribT = project(-bw - 3, -bh + 16, zOff);
        const ribB = project(-bw - 3, bh - 16, zOff);
        ctx.beginPath();
        ctx.moveTo(ribT.x, ribT.y);
        ctx.lineTo(ribB.x, ribB.y);
        ctx.strokeStyle = wireCyan;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const ribRT = project(bw + 3, -bh + 16, zOff);
        const ribRB = project(bw + 3, bh - 16, zOff);
        ctx.beginPath();
        ctx.moveTo(ribRT.x, ribRT.y);
        ctx.lineTo(ribRB.x, ribRB.y);
        ctx.strokeStyle = wireCyan;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // ── 4. PSRU PROPELLER REDUCTION GEARBOX HOUSING (FRONT CONICAL NOSE) ──
      const noseLength = 65;
      const noseFrontZ = -bd - noseLength;
      const noseTip = project(0, 0, noseFrontZ);
      const noseBase = project(0, 0, -bd);

      // Conical gearbox shell
      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y);
      ctx.lineTo(noseTip.x - 30 * noseTip.scale, noseTip.y - 25 * noseTip.scale);
      ctx.lineTo(noseTip.x + 30 * noseTip.scale, noseTip.y - 25 * noseTip.scale);
      ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[2].x, v[2].y);
      ctx.lineTo(noseTip.x + 30 * noseTip.scale, noseTip.y + 25 * noseTip.scale);
      ctx.lineTo(noseTip.x - 30 * noseTip.scale, noseTip.y + 25 * noseTip.scale);
      ctx.lineTo(v[3].x, v[3].y);
      ctx.closePath();
      ctx.fillStyle = isThermalMode ? '#101d3a' : '#1b263a';
      ctx.fill();
      ctx.strokeStyle = wireCyan;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Front bearing retainer ring
      ctx.beginPath();
      ctx.arc(noseTip.x, noseTip.y, 34 * noseTip.scale, 0, Math.PI * 2);
      ctx.fillStyle = isThermalMode ? '#182b52' : '#22324d';
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Spinning propeller drive shaft & splined flange
      const shaftZ = noseFrontZ - 28;
      const shaftCenter = project(0, 0, shaftZ);

      // Heavy chromed drive shaft
      ctx.beginPath();
      ctx.moveTo(noseTip.x, noseTip.y);
      ctx.lineTo(shaftCenter.x, shaftCenter.y);
      ctx.strokeStyle = '#dee2f5';
      ctx.lineWidth = 16 * shaftCenter.scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Propeller drive flange disc
      ctx.beginPath();
      ctx.arc(shaftCenter.x, shaftCenter.y, 29 * shaftCenter.scale, 0, Math.PI * 2);
      const flangeGrad = ctx.createRadialGradient(shaftCenter.x, shaftCenter.y, 4, shaftCenter.x, shaftCenter.y, 29 * shaftCenter.scale);
      flangeGrad.addColorStop(0, '#ffffff');
      flangeGrad.addColorStop(0.5, '#4b6182');
      flangeGrad.addColorStop(1, '#1b263a');
      ctx.fillStyle = flangeGrad;
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating drive bolts & drive lugs
      for (let b = 0; b < 6; b++) {
        const bAngle = shaftAngle + (b * Math.PI) / 3;
        const bx = shaftCenter.x + Math.cos(bAngle) * 20 * shaftCenter.scale;
        const by = shaftCenter.y + Math.sin(bAngle) * 20 * shaftCenter.scale;
        ctx.beginPath();
        ctx.arc(bx, by, 3.5 * shaftCenter.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Propeller central locknut
      ctx.beginPath();
      ctx.arc(shaftCenter.x, shaftCenter.y, 8 * shaftCenter.scale, 0, Math.PI * 2);
      ctx.fillStyle = cyan;
      ctx.fill();

      // ── 5. ROTAX 915 TURBOCHARGER INDUCTION SYSTEM (REAR) ──
      const turboZ = bd + 38;
      const turboCenter = project(0, 15, turboZ);

      // Exhaust turbine snail housing
      ctx.beginPath();
      ctx.arc(turboCenter.x, turboCenter.y, 32 * turboCenter.scale, 0, Math.PI * 2);
      const turboGrad = ctx.createRadialGradient(turboCenter.x, turboCenter.y, 5, turboCenter.x, turboCenter.y, 32 * turboCenter.scale);
      turboGrad.addColorStop(0, isThermalMode ? '#ff5500' : '#4a2810');
      turboGrad.addColorStop(0.7, isThermalMode ? '#cc3300' : '#2d1a0b');
      turboGrad.addColorStop(1, '#0e1624');
      ctx.fillStyle = turboGrad;
      ctx.fill();
      ctx.strokeStyle = '#ff9500';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spinning internal compressor wheel blades
      for (let bl = 0; bl < 8; bl++) {
        const blAngle = -shaftAngle * 1.8 + (bl * Math.PI) / 4;
        const blX = turboCenter.x + Math.cos(blAngle) * 24 * turboCenter.scale;
        const blY = turboCenter.y + Math.sin(blAngle) * 24 * turboCenter.scale;
        ctx.beginPath();
        ctx.moveTo(turboCenter.x, turboCenter.y);
        ctx.lineTo(blX, blY);
        ctx.strokeStyle = isThermalMode ? '#ffbb00' : 'rgba(0, 240, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Wastegate actuator canister
      const wgPos = project(38, -15, turboZ - 10);
      ctx.beginPath();
      ctx.arc(wgPos.x, wgPos.y, 11 * wgPos.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#223249';
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Boost charge air pipe arching over top of crankcase
      const boostIn = project(0, -10, turboZ);
      const boostArch = project(0, -bh - 48, 0);
      const boostOut = project(0, -bh - 35, -bd + 30);
      ctx.beginPath();
      ctx.moveTo(boostIn.x, boostIn.y);
      ctx.quadraticCurveTo(boostArch.x, boostArch.y - 20, boostOut.x, boostOut.y);
      ctx.strokeStyle = '#00dbe9';
      ctx.lineWidth = 11 * boostArch.scale;
      ctx.lineCap = 'round';
      ctx.stroke();

      // ── 6. 4-CYLINDER HORIZONTALLY OPPOSED BOXER ASSEMBLIES ──
      // Dynamic 4-cylinder layout derived from live telemetry & system diagnostics
      const defaultCyls = [
        { id: 1, name: 'CYL-1', side: -1, zOff: -52, phase: 0 },
        { id: 2, name: 'CYL-2', side: 1, zOff: -52, phase: Math.PI },
        { id: 3, name: 'CYL-3', side: -1, zOff: 52, phase: Math.PI * 0.5 },
        { id: 4, name: 'CYL-4', side: 1, zOff: 52, phase: Math.PI * 1.5 },
      ];

      const cylConfigs = defaultCyls.map((dc) => {
        const passed = cylinders?.find((c) => c.id === dc.id);
        let temp = passed?.temp;
        let isFault = false;
        let isWarning = false;

        if (passed) {
          const st = (passed.status || '').toUpperCase();
          isFault = st === 'CRITICAL' || (passed.isFault ?? false) || (temp !== undefined && temp > 198);
          isWarning = !isFault && (st === 'WARNING' || st === 'WATCH' || (temp !== undefined && temp > 188));
          if (temp === undefined) temp = isFault ? 205 : isWarning ? 192 : 165;
        } else if (chtAvg !== undefined) {
          const spread = chtSpread || 4.2;
          const offsets = [-0.25, 0.35, -0.15, 0.1];
          temp = Math.round(chtAvg + offsets[dc.id - 1] * spread + (isStressed && dc.id === 1 ? 28 : 0));
          isFault = (isStressed && dc.id === 1) || temp > 198 || (chtPeak !== undefined && chtPeak > 202 && dc.id === 1);
          isWarning = !isFault && (temp > 188 || (chtPeak !== undefined && chtPeak > 192 && dc.id === 1));
        } else {
          temp = 168;
          isFault = false;
          isWarning = false;
        }

        return {
          ...dc,
          temp,
          isFault,
          isWarning,
        };
      });

      // Depth sort so rear cylinders render behind front cylinders
      const sortedCyls = [...cylConfigs].sort((a, b) => {
        const pA = project(a.side * 150, 0, a.zOff);
        const pB = project(b.side * 150, 0, b.zOff);
        return pB.z - pA.z;
      });

      sortedCyls.forEach((cyl) => {
        const side = cyl.side;
        const zOff = cyl.zOff;
        const isFault = cyl.isFault;
        const isWarning = cyl.isWarning;

        // 4-Stroke True Boxer Kinematics: opposed cylinder motion
        const cylAngle = zOff < 0 ? shaftAngle : shaftAngle + Math.PI;
        const cpX = side * Math.cos(cylAngle) * crankRadius;
        const cpY = crankCenterY + Math.sin(cylAngle) * crankRadius;

        // Kinematic con-rod calculation & wrist pin position along lateral X axis
        const conRodLength = 76;
        const dy = cpY - crankCenterY;
        const strokeOffset = Math.sqrt(Math.max(10, conRodLength * conRodLength - dy * dy)) + cpX * 0.45;
        const explodeDist = explode * 45;
        const wristPinX = side * (bw + 20 + strokeOffset * 0.4 + explodeDist);
        const wristPinY = crankCenterY;

        const barrelStartX = side * (bw - 4 + explodeDist * 0.5);
        const barrelEndX = side * (bw + 96 + explodeDist * 1.4);
        const barrelCenterY = crankCenterY;

        const bStart = project(barrelStartX, barrelCenterY, zOff);
        const bEnd = project(barrelEndX, barrelCenterY, zOff);

        // ── 6A. INTERNAL CYLINDER SLEEVE & HONED BORE (CROSS-HATCHED) ──
        ctx.beginPath();
        ctx.moveTo(bStart.x, bStart.y);
        ctx.lineTo(bEnd.x, bEnd.y);
        ctx.strokeStyle = isFault
          ? (isThermalMode ? '#661100' : 'rgba(58, 26, 26, 0.85)')
          : isWarning
          ? (isThermalMode ? '#663300' : 'rgba(58, 38, 20, 0.85)')
          : isThermalMode ? 'rgba(12, 34, 66, 0.85)' : 'rgba(20, 32, 50, 0.85)';
        ctx.lineWidth = 50 * bStart.scale;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // 45° cross-hatch precision cylinder wall honing lines
        ctx.strokeStyle = isThermalMode ? 'rgba(255, 140, 0, 0.18)' : 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let h = -3; h <= 3; h++) {
          const hX = barrelStartX + (barrelEndX - barrelStartX) * (0.5 + h * 0.12);
          const pTop = project(hX - 10, barrelCenterY - 20, zOff);
          const pBot = project(hX + 10, barrelCenterY + 20, zOff);
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pBot.x, pBot.y);
          ctx.stroke();
        }

        // ── 6B. ARTICULATING H-BEAM CONNECTING ROD (FORGED 4340 CHROMOLY) ──
        const cpProj = project(cpX, cpY, zOff);
        const pinProj = project(wristPinX, wristPinY, zOff);

        // Rod Beam (Forged I/H-Beam profile)
        ctx.beginPath();
        ctx.moveTo(cpProj.x, cpProj.y);
        ctx.lineTo(pinProj.x, pinProj.y);
        ctx.strokeStyle = isThermalMode ? '#cbd5e1' : '#94a3b8';
        ctx.lineWidth = 8 * cpProj.scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Inner milled lightening channel of H-Beam
        ctx.beginPath();
        ctx.moveTo(cpProj.x, cpProj.y);
        ctx.lineTo(pinProj.x, pinProj.y);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5 * cpProj.scale;
        ctx.stroke();

        // Con-rod big-end journal bearing & ARP rod bolts
        ctx.beginPath();
        ctx.arc(cpProj.x, cpProj.y, 9 * cpProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Rod bolt heads
        [-1, 1].forEach((sign) => {
          const boltPos = project(cpX, cpY + sign * 7, zOff);
          ctx.beginPath();
          ctx.arc(boltPos.x, boltPos.y, 2 * boltPos.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#dee2f5';
          ctx.fill();
        });

        // Con-rod small-end bronze wrist pin bushing
        ctx.beginPath();
        ctx.arc(pinProj.x, pinProj.y, 6.5 * pinProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706'; // Phosphor bronze
        ctx.fill();
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // ── 6C. 3D PRECISION PISTON ASSEMBLY (CROWN, RINGS, SKIRT & WRIST PIN) ──
        const crownX = wristPinX + side * 14;
        const skirtX = wristPinX - side * 14;
        const pTopLeft = project(Math.min(crownX, skirtX), barrelCenterY - 18, zOff);
        const pBotRight = project(Math.max(crownX, skirtX), barrelCenterY + 18, zOff);

        // Piston body (moly-coated aerospace alloy)
        ctx.beginPath();
        ctx.rect(
          Math.min(pTopLeft.x, pBotRight.x),
          Math.min(pTopLeft.y, pBotRight.y),
          Math.abs(pBotRight.x - pTopLeft.x),
          Math.abs(pBotRight.y - pTopLeft.y)
        );
        ctx.fillStyle = isFault
          ? (isThermalMode ? 'rgba(255, 60, 0, 0.85)' : 'rgba(80, 25, 25, 0.9)')
          : isWarning
          ? 'rgba(75, 45, 20, 0.9)'
          : isThermalMode ? 'rgba(30, 80, 150, 0.85)' : 'rgba(38, 52, 72, 0.9)';
        ctx.fill();
        ctx.strokeStyle = isFault ? hotRed : isWarning ? '#f59e0b' : cyan;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hardened steel wrist pin (gudgeon pin) through center
        ctx.beginPath();
        ctx.arc(pinProj.x, pinProj.y, 4 * pinProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Piston Crown Face with Valve Relief Indentations
        [-8, 8].forEach((vReliefY) => {
          const relief = project(crownX, barrelCenterY + vReliefY, zOff);
          ctx.beginPath();
          ctx.arc(relief.x, relief.y, 4.5 * relief.scale, 0, Math.PI * 2);
          ctx.fillStyle = isFault ? '#ff3b30' : '#1b263b';
          ctx.fill();
          ctx.strokeStyle = wireCyan;
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // 3 Circumferential Piston Rings (Top Compression, Scraper, Oil Control Ring)
        [-6, -2, 2].forEach((rOffset, rIdx) => {
          const ringX = crownX - side * (4 + rIdx * 3.5);
          const rTop = project(ringX, barrelCenterY - 18, zOff);
          const rBot = project(ringX, barrelCenterY + 18, zOff);
          ctx.beginPath();
          ctx.moveTo(rTop.x, rTop.y);
          ctx.lineTo(rBot.x, rBot.y);
          ctx.strokeStyle = rIdx === 0
            ? (isFault ? '#ffdd55' : '#ffffff') // Top chrome compression ring
            : rIdx === 1
            ? '#94a3b8' // Taper ductile iron scraper
            : '#38bdf8'; // Multi-piece oil ring
          ctx.lineWidth = 2 * rTop.scale;
          ctx.stroke();
        });

        // ── 6D. AERODYNAMIC COOLING FINS (SEMI-CUTAWAY CASING) ──
        const finCount = 14;
        for (let f = 0; f < finCount; f++) {
          const ratio = (f + 1) / (finCount + 1);
          const finX = barrelStartX + ratio * (barrelEndX - barrelStartX);
          const finCenter = project(finX, barrelCenterY, zOff);

          const baseRadius = (34 + (f < 5 ? f * 1.5 : (finCount - f) * 1.1)) * finCenter.scale;
          const finLight = getLightIntensity(side, -0.4, 0);

          ctx.beginPath();
          ctx.ellipse(finCenter.x, finCenter.y, baseRadius * 0.42, baseRadius, 0, 0, Math.PI * 2);

          if (isFault) {
            const heatIntensity = Math.sin(time * 5 + f * 0.3) * 0.15 + 0.85;
            const rVal = Math.round(255 * heatIntensity);
            const gVal = Math.round((70 + f * 12) * heatIntensity);
            const bVal = Math.round(15 * heatIntensity);

            ctx.fillStyle = isThermalMode
              ? `rgba(${rVal}, ${gVal}, 0, 0.82)`
              : `rgba(${rVal}, ${Math.min(255, gVal + 30)}, 20, 0.72)`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 230, 120, ${heatIntensity * 0.95})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
          } else if (isWarning) {
            ctx.fillStyle = isThermalMode ? 'rgba(245, 158, 11, 0.65)' : 'rgba(217, 119, 6, 0.55)';
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            const shadeR = Math.round(28 * finLight);
            const shadeG = Math.round(44 * finLight);
            const shadeB = Math.round(65 * finLight);
            ctx.fillStyle = isThermalMode ? `rgba(0, 140, 255, 0.42)` : `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.65)`;
            ctx.fill();
            ctx.strokeStyle = wireCyan;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }

        // ── 6E. INTERNAL VALVETRAIN (POPPET VALVES & COILED SPRINGS) ──
        const headX = side * (bw + 104);
        const headPos = project(headX, barrelCenterY, zOff);

        const valveConfigs = [
          { name: 'INT', yOff: -11, isOpening: Math.sin(cyclePhase + cylAngle) > 0.5 },
          { name: 'EXH', yOff: 11, isOpening: Math.sin(cyclePhase + cylAngle + Math.PI) > 0.5 },
        ];

        valveConfigs.forEach((valve) => {
          const vSeatX = headX - side * 6;
          const vStemTipX = headX + side * (16 + (valve.isOpening ? 4 : 0));
          const vY = barrelCenterY + valve.yOff;

          const seatProj = project(vSeatX - side * (valve.isOpening ? 4 : 0), vY, zOff);
          const stemTipProj = project(vStemTipX, vY, zOff);

          // Mushroom valve head (poppet)
          ctx.beginPath();
          ctx.ellipse(seatProj.x, seatProj.y, 3.5 * seatProj.scale, 7 * seatProj.scale, 0, 0, Math.PI * 2);
          ctx.fillStyle = valve.name === 'EXH' ? (isFault ? '#ff4400' : '#f59e0b') : '#94a3b8';
          ctx.fill();
          ctx.strokeStyle = cyan;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Hardened valve stem sliding through phosphor bronze guide
          ctx.beginPath();
          ctx.moveTo(seatProj.x, seatProj.y);
          ctx.lineTo(stemTipProj.x, stemTipProj.y);
          ctx.strokeStyle = '#dee2f5';
          ctx.lineWidth = 2.4 * seatProj.scale;
          ctx.stroke();

          // Coiled Dual Helical Valve Spring (5 coils)
          ctx.beginPath();
          const springStart = project(headX + side * 2, vY, zOff);
          const springEnd = project(vStemTipX - side * 2, vY, zOff);
          const coils = 5;
          ctx.moveTo(springStart.x, springStart.y);
          for (let c = 1; c <= coils; c++) {
            const frac = c / coils;
            const coilX = (headX + side * 2) + frac * ((vStemTipX - side * 2) - (headX + side * 2));
            const coilY = vY + (c % 2 === 0 ? -5 : 5);
            const cp = project(coilX, coilY, zOff);
            ctx.lineTo(cp.x, cp.y);
          }
          ctx.lineTo(springEnd.x, springEnd.y);
          ctx.strokeStyle = isFault && valve.name === 'EXH' ? '#ffaa00' : '#38bdf8';
          ctx.lineWidth = 1.8 * seatProj.scale;
          ctx.stroke();

          // Titanium valve spring retainer disc
          ctx.beginPath();
          ctx.ellipse(stemTipProj.x, stemTipProj.y, 2 * stemTipProj.scale, 5 * stemTipProj.scale, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        });

        // ── 6F. DIRECT ELECTRONIC FUEL INJECTORS (BOSCH EFI) ──
        const injX = side * (bw + 60);
        const injY = barrelCenterY - 26;
        const injBase = project(injX, injY, zOff);
        const injNozzle = project(side * (bw + 82), barrelCenterY - 14, zOff);

        // Injector body
        ctx.beginPath();
        ctx.moveTo(injBase.x, injBase.y);
        ctx.lineTo(injNozzle.x, injNozzle.y);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 5 * injBase.scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Injector electrical solenoid connector clip
        ctx.beginPath();
        ctx.arc(injBase.x, injBase.y, 3 * injBase.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Fuel atomization spray cone (active on intake stroke)
        if (Math.sin(cyclePhase + cylAngle) > 0.45) {
          const sprayTip = project(side * (bw + 94), barrelCenterY - 10, zOff);
          const sprayGrad = ctx.createRadialGradient(injNozzle.x, injNozzle.y, 2, sprayTip.x, sprayTip.y, 14 * injNozzle.scale);
          sprayGrad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
          sprayGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sprayGrad;
          ctx.beginPath();
          ctx.moveTo(injNozzle.x, injNozzle.y);
          ctx.lineTo(sprayTip.x - 4, sprayTip.y - 6);
          ctx.lineTo(sprayTip.x + 4, sprayTip.y + 6);
          ctx.closePath();
          ctx.fill();
        }

        // ── 6G. COMBUSTION CHAMBER & DUAL SPARK PLUG ELECTRODES ──
        // Ignition spark flash in combustion chamber at peak compression
        const isCompressionTDC = side * (crownX - barrelStartX) > (barrelEndX - barrelStartX) * 0.72;
        if (isCompressionTDC) {
          const sparkOrigin = project(side * (bw + 92), barrelCenterY, zOff);
          const sparkGlow = ctx.createRadialGradient(
            sparkOrigin.x,
            sparkOrigin.y,
            3,
            sparkOrigin.x,
            sparkOrigin.y,
            46 * sparkOrigin.scale
          );
          sparkGlow.addColorStop(0, '#ffffff');
          sparkGlow.addColorStop(0.3, isFault ? '#ff3b30' : '#00f0ff');
          sparkGlow.addColorStop(0.7, isFault ? 'rgba(255, 140, 0, 0.4)' : 'rgba(0, 240, 255, 0.3)');
          sparkGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = sparkGlow;
          ctx.beginPath();
          ctx.arc(sparkOrigin.x, sparkOrigin.y, 46 * sparkOrigin.scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cylinder Head Cast Cap
        ctx.beginPath();
        ctx.ellipse(headPos.x, headPos.y, 15 * headPos.scale, 30 * headPos.scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = isFault
          ? (isThermalMode ? '#ff2a00' : '#331215')
          : isWarning
          ? '#4a2610'
          : isThermalMode ? '#003377' : '#172439';
        ctx.fill();
        ctx.strokeStyle = isFault ? hotRed : isWarning ? '#f59e0b' : cyan;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Dual Rocker Arm Valve Cover (Outboard)
        const rockerPos = project(side * (bw + 116), barrelCenterY, zOff);
        ctx.beginPath();
        ctx.rect(
          rockerPos.x - 7 * rockerPos.scale,
          rockerPos.y - 20 * rockerPos.scale,
          14 * rockerPos.scale,
          40 * rockerPos.scale
        );
        ctx.fillStyle = isFault ? '#551111' : isWarning ? '#3d2510' : '#1e2c40';
        ctx.fill();
        ctx.strokeStyle = isFault ? hotOrange : isWarning ? '#f59e0b' : wireCyan;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Dual Spark Plugs with Ground & Center Electrodes
        [-14, 14].forEach((pY) => {
          const plugBase = project(side * (bw + 98), barrelCenterY + pY, zOff);
          const plugTip = project(side * (bw + 120), barrelCenterY + pY * 1.3, zOff);
          ctx.beginPath();
          ctx.moveTo(plugBase.x, plugBase.y);
          ctx.lineTo(plugTip.x, plugTip.y);
          ctx.strokeStyle = isFault ? '#ffb4ab' : isWarning ? '#fde68a' : '#7df4ff';
          ctx.lineWidth = 3 * headPos.scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(plugTip.x, plugTip.y, 3 * headPos.scale, 0, Math.PI * 2);
          ctx.fillStyle = isFault ? '#ff2200' : isWarning ? '#f59e0b' : '#00f0ff';
          ctx.fill();

          // Spark gap electrode hook
          const electrodeTip = project(side * (bw + 94), barrelCenterY + pY * 0.9, zOff);
          ctx.beginPath();
          ctx.moveTo(plugBase.x, plugBase.y);
          ctx.lineTo(electrodeTip.x, electrodeTip.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });

        // ── CYLINDER 2 OVERHEATING VOLUMETRIC AURA & RIPPLES ──
        if (isFault) {
          // Large radiating thermal plume
          const heatGlow = ctx.createRadialGradient(
            headPos.x,
            headPos.y,
            12,
            headPos.x,
            headPos.y,
            90 * headPos.scale
          );
          heatGlow.addColorStop(0, isThermalMode ? 'rgba(255, 30, 0, 0.85)' : 'rgba(255, 60, 0, 0.65)');
          heatGlow.addColorStop(0.4, isThermalMode ? 'rgba(255, 140, 0, 0.45)' : 'rgba(255, 120, 0, 0.3)');
          heatGlow.addColorStop(1, 'transparent');

          ctx.fillStyle = heatGlow;
          ctx.beginPath();
          ctx.arc(headPos.x, headPos.y, 90 * headPos.scale, 0, Math.PI * 2);
          ctx.fill();

          // Concentric thermal expansion wavefront ripples
          for (let w = 0; w < 3; w++) {
            const rippleR = (((time * 28 + w * 25) % 75) + 15) * headPos.scale;
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, rippleR, 0, Math.PI * 2);
            const fade = Math.max(0, 1 - rippleR / (90 * headPos.scale));
            ctx.strokeStyle = `rgba(255, 140, 20, ${fade * 0.75})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }

          // Thermal convection sparks floating upwards
          if (Math.random() < 0.35) {
            sparks.push({
              x: headX + (Math.random() - 0.5) * 40,
              y: barrelCenterY + (Math.random() - 0.5) * 30,
              z: zOff + (Math.random() - 0.5) * 30,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.8 - Math.random() * 1.5,
              life: 0,
              maxLife: 35 + Math.random() * 25,
            });
          }
        } else if (isWarning) {
          // Warm amber glow for elevated warning temperature
          const warnGlow = ctx.createRadialGradient(
            headPos.x,
            headPos.y,
            10,
            headPos.x,
            headPos.y,
            55 * headPos.scale
          );
          warnGlow.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          warnGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
          warnGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = warnGlow;
          ctx.beginPath();
          ctx.arc(headPos.x, headPos.y, 55 * headPos.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ── 7. RENDER & UPDATE THERMAL CONVECTION SPARKS ──
      for (let s = sparks.length - 1; s >= 0; s--) {
        const sp = sparks[s];
        sp.life++;
        sp.x += sp.vx;
        sp.y += sp.vy;
        if (sp.life >= sp.maxLife) {
          sparks.splice(s, 1);
          continue;
        }

        const spPos = project(sp.x, sp.y, sp.z);
        const sparkAlpha = 1 - sp.life / sp.maxLife;
        ctx.beginPath();
        ctx.arc(spPos.x, spPos.y, 2 * spPos.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${sparkAlpha})`;
        ctx.shadowColor = '#ff3d00';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── 8. TOP INTAKE AIRBOX & DUAL MANIFOLD RUNNERS ──
      const plenumY = -bh - 32;
      const plenumBox1 = project(-55, plenumY, -bd + 20);
      const plenumBox2 = project(55, plenumY, -bd + 20);
      const plenumBox3 = project(55, plenumY, bd - 20);
      const plenumBox4 = project(-55, plenumY, bd - 20);

      // Central intake airbox
      ctx.beginPath();
      ctx.moveTo(plenumBox1.x, plenumBox1.y);
      ctx.lineTo(plenumBox2.x, plenumBox2.y);
      ctx.lineTo(plenumBox3.x, plenumBox3.y);
      ctx.lineTo(plenumBox4.x, plenumBox4.y);
      ctx.closePath();
      ctx.fillStyle = isThermalMode ? '#0a1a36' : '#142035';
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top dual throttle bodies
      [-30, 30].forEach((zOff) => {
        const tbPos = project(0, plenumY - 14, zOff);
        ctx.beginPath();
        ctx.arc(tbPos.x, tbPos.y, 14 * tbPos.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#22324b';
        ctx.fill();
        ctx.strokeStyle = '#00dbe9';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });

      // Curved runner tubes branching from plenum into each cylinder head
      [-52, 52].forEach((zOff) => {
        const topCenter = project(0, plenumY, zOff);
        const lPort = project(-bw - 65, -18, zOff);
        const rPort = project(bw + 65, -18, zOff);

        ctx.beginPath();
        ctx.moveTo(lPort.x, lPort.y);
        ctx.quadraticCurveTo(topCenter.x - 25, topCenter.y, topCenter.x, topCenter.y);
        ctx.quadraticCurveTo(topCenter.x + 25, topCenter.y, rPort.x, rPort.y);
        ctx.strokeStyle = '#00dbe9';
        ctx.lineWidth = 5.5 * topCenter.scale;
        ctx.stroke();
      });

      // ── 9. DYNAMIC AIRFLOW PARTICLES INTO INTAKE SYSTEM ──
      airParticles.forEach((ap) => {
        ap.y += ap.speed;
        if (ap.y > plenumY + 10) {
          ap.y = -bh - 120;
          ap.x = (Math.random() - 0.5) * 140;
          ap.z = (Math.random() - 0.5) * 160;
        }

        const apPos = project(ap.x, ap.y, ap.z);
        ctx.beginPath();
        ctx.arc(apPos.x, apPos.y, 2.2 * apPos.scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── 10. EXHAUST HEADERS (HEAT-TEMPERED INCONEL TUBES) ──
      [-52, 52].forEach((zOff) => {
        const exLHead = project(-bw - 70, 30, zOff);
        const exRHead = project(bw + 70, 30, zOff);
        const exCollector = project(0, bh + 25, bd + 20);

        ctx.beginPath();
        ctx.moveTo(exLHead.x, exLHead.y);
        ctx.lineTo(exCollector.x - 20, exCollector.y);
        ctx.strokeStyle = isThermalMode ? '#cc5500' : '#d97706';
        ctx.lineWidth = 4.5 * exLHead.scale;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(exRHead.x, exRHead.y);
        ctx.lineTo(exCollector.x + 20, exCollector.y);
        ctx.strokeStyle = isThermalMode ? '#ff3300' : '#d97706';
        ctx.lineWidth = 4.5 * exRHead.scale;
        ctx.stroke();
      });

      // ── 11. CAST ALLOY OIL SUMP & SIGHT GLASS (BOTTOM) ──
      const s1 = project(-bw + 20, bh, -bd + 25);
      const s2 = project(bw - 20, bh, -bd + 25);
      const s3 = project(bw - 20, bh + 36, bd - 25);
      const s4 = project(-bw + 20, bh + 36, bd - 25);

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(s3.x, s3.y);
      ctx.lineTo(s4.x, s4.y);
      ctx.closePath();
      ctx.fillStyle = isThermalMode ? '#081226' : '#0c1626';
      ctx.fill();
      ctx.strokeStyle = '#3b494b';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Oil level sight glass with amber fluid indication
      const sight = project(0, bh + 20, -bd + 25);
      ctx.beginPath();
      ctx.arc(sight.x, sight.y, 7 * sight.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── 12. HOLOGRAPHIC BLUEPRINT TARGET RETICLES & CENTERLINE AXIS ──
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 1;

      // Front shaft crosshair
      ctx.beginPath();
      ctx.moveTo(shaftCenter.x - 16, shaftCenter.y);
      ctx.lineTo(shaftCenter.x + 16, shaftCenter.y);
      ctx.moveTo(shaftCenter.x, shaftCenter.y - 16);
      ctx.lineTo(shaftCenter.x, shaftCenter.y + 16);
      ctx.stroke();

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [zoomLevel, isThermalMode, rpm, activeHotspotId, onRotationChange, cameraRotationDeg, explodedOffset, renderMode, selectedSubsystemId, cylinders, chtPeak, chtAvg, chtSpread, isStressed]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full max-h-[520px] object-contain select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        title="Interactive 3D Aero Piston Digital Twin. Click and drag freely to orbit / inspect from any angle."
      />
    </div>
  );
};

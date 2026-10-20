import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Eye,
  Flame,
  Play,
  Pause,
  Compass,
  Zap,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { EngineTelemetryRecord } from '../../services/autoApi';

export type TwinStyleMode = 'metallic_cutaway' | 'thermal_flir' | 'cad_blueprint';
export type CameraAngle = 'reference_cutaway' | 'cooling_radiator' | 'transmission_gearbox' | 'valvetrain' | 'crankcase';

interface AutoDigitalTwin3DProps {
  telemetry: EngineTelemetryRecord | null;
  activeFaultSubsystem?: string | null;
  cylinderCount?: number;
  cylinderConfig?: string;
  isSimulating?: boolean;
  className?: string;
}

export const AutoDigitalTwin3D: React.FC<AutoDigitalTwin3DProps> = ({
  telemetry,
  activeFaultSubsystem = null,
  cylinderCount = 4,
  cylinderConfig = 'INLINE',
  isSimulating = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // User Interactive View Controls (Defaults to Photorealistic Metallic Cutaway)
  const [styleMode, setStyleMode] = useState<TwinStyleMode>('metallic_cutaway');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('reference_cutaway');
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [showCombustion, setShowCombustion] = useState<boolean>(true);
  const [showOilChannels, setShowOilChannels] = useState<boolean>(true);
  const [showExhaustGlow, setShowExhaustGlow] = useState<boolean>(true);

  // Three.js Core References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const engineAssemblyGroupRef = useRef<THREE.Group | null>(null);

  // Moving Kinematic Parts References (ONLY NECESSARY PARTS MOVE)
  const crankAssemblyRef = useRef<THREE.Group | null>(null);
  const intakeCamRef = useRef<THREE.Group | null>(null);
  const exhaustCamRef = useRef<THREE.Group | null>(null);

  // Cooling System Kinematic References
  const radiatorFanRef = useRef<THREE.Group | null>(null);

  // Transmission Gearbox Kinematic References
  const transInputShaftRef = useRef<THREE.Group | null>(null);
  const transCounterShaftRef = useRef<THREE.Group | null>(null);
  const transDiffRef = useRef<THREE.Group | null>(null);
  const transAxlesRef = useRef<THREE.Group | null>(null);

  // Per-Cylinder Moving Elements
  const pistonMeshesRef = useRef<THREE.Group[]>([]);
  const conRodMeshesRef = useRef<THREE.Group[]>([]);
  const valvesRef = useRef<
    {
      stemGroup: THREE.Group;
      springMesh: THREE.Mesh;
      isExhaust: boolean;
      cylinderIndex: number;
      restY: number;
    }[]
  >([]);

  // Combustion Flash & Spark Ignitions
  const combustionFlashesRef = useRef<
    {
      flameMesh: THREE.Mesh;
      sparkMesh: THREE.Mesh;
      light: THREE.PointLight;
    }[]
  >([]);

  // Dynamic Thermal Materials
  const exhaustMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const oilGalleryMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Kinematic crank angle accumulator
  const crankAngleRef = useRef<number>(0);

  // Camera Presets
  // Camera Presets
  const applyCameraPreset = (angle: CameraAngle) => {
    setCameraAngle(angle);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.autoRotate = false;
    setAutoOrbit(false);

    switch (angle) {
      case 'reference_cutaway':
        // Full Powertrain View: Radiator with Fan on left, Cutaway Engine in middle, Transmission Gearbox with Axles on right
        camera.position.set(0.0, 7.8, 27.5);
        controls.target.set(0.5, 4.5, 0.0);
        break;
      case 'cooling_radiator':
        // Zoom into Front Cooling System, Radiator Core, Spinning Electric Fan & Hoses
        camera.position.set(-15.5, 7.5, 8.5);
        controls.target.set(-9.6, 5.0, 0.0);
        break;
      case 'transmission_gearbox':
        // Zoom into Cutaway Transmission Gearbox, Helical Gear Train, Synchronizers, Differential & Axles
        camera.position.set(16.5, 5.5, 11.5);
        controls.target.set(9.5, 2.0, 0.0);
        break;
      case 'valvetrain':
        camera.position.set(0, 18.0, 10.0);
        controls.target.set(0.0, 9.5, 0.0);
        break;
      case 'crankcase':
        camera.position.set(0, -9.0, 14.0);
        controls.target.set(0.0, 1.0, 0.0);
        break;
    }
    controls.update();
  };

  // Helper: Create Counterweight Geometry
  const createCounterweightGeometry = (radius: number, thickness: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.7, 0.4);
    shape.lineTo(-1.6, -1.1);
    shape.absarc(0, -0.2, radius, -Math.PI * 0.72, -Math.PI * 0.28, false);
    shape.lineTo(1.6, -1.1);
    shape.lineTo(0.7, 0.4);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
  };

  // Helper: Create Toothed Sprocket/Pulley
  const createToothedSprocketGroup = (
    radius: number,
    thickness: number,
    teethCount: number,
    spokeCount: number,
    rimMat: THREE.Material,
    toothMat: THREE.Material
  ) => {
    const group = new THREE.Group();

    // Outer rim cylinder
    const rimGeo = new THREE.CylinderGeometry(radius, radius, thickness, 36);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.z = Math.PI / 2;
    group.add(rimMesh);

    // Teeth along outer circumference
    const toothGeo = new THREE.BoxGeometry(thickness * 0.96, radius * 0.12, 0.18);
    for (let t = 0; t < teethCount; t++) {
      const angle = (t / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(0, Math.cos(angle) * (radius + 0.06), Math.sin(angle) * (radius + 0.06));
      tooth.rotation.x = -angle;
      group.add(tooth);
    }

    // Center hub
    const hubRadius = radius * 0.35;
    const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, thickness * 1.25, 24);
    const hubMesh = new THREE.Mesh(hubGeo, rimMat);
    hubMesh.rotation.z = Math.PI / 2;
    group.add(hubMesh);

    // Center retaining nut
    const nutGeo = new THREE.CylinderGeometry(hubRadius * 0.45, hubRadius * 0.45, thickness * 1.5, 6);
    const nutMesh = new THREE.Mesh(nutGeo, toothMat);
    nutMesh.rotation.z = Math.PI / 2;
    nutMesh.position.set(thickness * 0.2, 0, 0);
    group.add(nutMesh);

    // Radial spokes
    if (spokeCount > 0) {
      const spokeLength = radius - hubRadius;
      const spokeGeo = new THREE.BoxGeometry(thickness * 0.7, spokeLength, radius * 0.12);
      for (let s = 0; s < spokeCount; s++) {
        const spokeAngle = (s / spokeCount) * Math.PI * 2;
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        const dist = hubRadius + spokeLength / 2;
        spoke.position.set(0, Math.cos(spokeAngle) * dist, Math.sin(spokeAngle) * dist);
        spoke.rotation.x = -spokeAngle;
        group.add(spoke);
      }
    }

    return group;
  };

  // Helper: Helical Wire Valve Spring
  const createSpringGeometry = (radius: number, height: number, turns: number) => {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const phi = t * turns * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(phi) * radius, t * height - height / 2, Math.sin(phi) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 54, 0.075, 8, false);
  };

  // Helper: Precision Transmission Helical Gear Mesh
  const createHelicalGearMesh = (
    radius: number,
    thickness: number,
    teethCount: number,
    material: THREE.Material,
    accentMat?: THREE.Material
  ) => {
    const group = new THREE.Group();
    const gearGeo = new THREE.CylinderGeometry(radius, radius, thickness, 32);
    const gearMesh = new THREE.Mesh(gearGeo, material);
    gearMesh.rotation.z = Math.PI / 2;
    group.add(gearMesh);

    // Helical teeth ridges along perimeter
    const toothGeo = new THREE.BoxGeometry(thickness * 0.98, radius * 0.16, 0.14);
    for (let t = 0; t < teethCount; t++) {
      const angle = (t / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, accentMat || material);
      tooth.position.set(0, Math.cos(angle) * (radius + 0.07), Math.sin(angle) * (radius + 0.07));
      tooth.rotation.x = -angle + 0.25; // angled helical tooth cut
      group.add(tooth);
    }

    // Hub recess
    const hubGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, thickness * 1.1, 20);
    const hub = new THREE.Mesh(hubGeo, accentMat || material);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);

    return group;
  };

  // Helper: Multi-Blade Aerodynamic Electric Cooling Fan
  const createCoolingFanGroup = (
    radius: number,
    bladeCount: number,
    bladeMat: THREE.Material,
    hubMat: THREE.Material
  ) => {
    const group = new THREE.Group();
    // Center electric motor hub
    const hubGeo = new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, 0.6, 24);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);

    // Aerodynamic curved fan blades
    for (let b = 0; b < bladeCount; b++) {
      const angle = (b / bladeCount) * Math.PI * 2;
      const bladeGeo = new THREE.BoxGeometry(0.12, radius * 0.74, radius * 0.28);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      const dist = radius * 0.58;
      blade.position.set(0, Math.cos(angle) * dist, Math.sin(angle) * dist);
      blade.rotation.x = -angle + 0.42; // aerodynamic blade attack angle
      blade.rotation.y = 0.15;
      group.add(blade);
    }
    return group;
  };

  // ---------------------------------------------------------------------------
  // Build Photorealistic Cutaway Engine Assembly
  // Matches the user's reference image:
  // - Left: Timing chain & sprockets
  // - Center: Exposed cutaway cylinders with pistons, rods, crankshaft, DOHC, valves
  // - Right: Glowing exhaust manifold
  // - Bottom: Glowing orange oil line
  // ---------------------------------------------------------------------------
  const buildEngineAssembly = useCallback((scene: THREE.Scene, numCylinders: number, isV8: boolean) => {
    // Clear only existing engine assembly group, preserving studio environment & lights!
    if (engineAssemblyGroupRef.current) {
      scene.remove(engineAssemblyGroupRef.current);
    }
    const engineGroup = new THREE.Group();
    engineAssemblyGroupRef.current = engineGroup;
    scene.add(engineGroup);

    pistonMeshesRef.current = [];
    conRodMeshesRef.current = [];
    valvesRef.current = [];
    combustionFlashesRef.current = [];

    const effectiveCylinders = isV8 ? 8 : Math.max(2, Math.min(6, numCylinders));
    const cylPitch = 2.8;
    const crankRadius = 1.35; // Stroke = 2.7
    const rodLength = 4.65;
    const boreRadius = 1.35;

    // Arrange engine along X axis: Timing drive on LEFT (xLeft), Exhaust on RIGHT (xRight)
    const xTiming = -((effectiveCylinders - 1) * cylPitch) / 2 - 2.2; // Left side
    const xCylStart = -((effectiveCylinders - 1) * cylPitch) / 2; // Cylinder 1 position
    const totalLength = effectiveCylinders * cylPitch;

    // -------------------------------------------------------------------------
    // MASTER MATERIALS
    // -------------------------------------------------------------------------
    // 1. Cast Aluminum Engine Block (Brushed metallic with micro-roughness)
    const engineBlockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.65,
      roughness: 0.42,
    });

    // 2. Cutaway Chamfer Lip (Darker precision milled alloy)
    const cutawayRimMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 3. Mirror-Polished Cylinder Bore Sleeves (High specular reflection)
    const boreSleeveMat = new THREE.MeshStandardMaterial({
      color: 0xcfdbe6,
      metalness: 0.92,
      roughness: 0.12,
    });

    // 4. Forged Steel Crankshaft & Counterweights
    const crankSteelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 5. Polished Crankpin & Main Journals
    const journalPolishMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.98,
      roughness: 0.05,
    });

    // 6. Machined Aluminum Pistons (Crown & Skirt)
    const pistonAlloyMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      metalness: 0.85,
      roughness: 0.18,
    });

    // 7. Forged H-Beam Connecting Rods
    const conRodMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.82,
      roughness: 0.25,
    });

    // 8. Polished Camshafts & Cam Lobes
    const camshaftMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.12,
    });

    // 9. Hardened Valve Springs (Tempered Spring Steel)
    const valveSpringMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.88,
      roughness: 0.22,
    });

    // 10. Stainless Steel Valve Stems & Poppet Heads
    const valveMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.08,
    });

    // 11. Timing Sprockets & Pulleys
    const sprocketMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.22,
    });

    // 12. Dynamic Glowing Lower Oil Gallery (Matches the glowing orange-gold line in the photo!)
    const oilGalleryMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.3,
    });
    oilGalleryMaterialRef.current = oilGalleryMat;

    // 13. Dynamic Thermal Glowing Exhaust Manifold (Matches incandescent header in the photo!)
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0xff4500,
      emissiveIntensity: 1.4,
      metalness: 0.7,
      roughness: 0.3,
    });
    exhaustMaterialRef.current = exhaustMat;

    // 14. Translucent Air Intake Swirl
    const intakeAirMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
    });

    // 15. Radiator Core Fin Matrix (Aluminum micro-fins)
    const radiatorFinMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.82,
      roughness: 0.35,
    });

    // 16. Radiator End-Tanks & Fan Shroud
    const radiatorTankMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.3,
    });

    // 17. Coolant Overflow Fluid (Translucent Cyan Glow)
    const coolantFluidMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
    });

    // 18. EPDM Reinforced Flexible Coolant Hoses
    const coolantHoseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.15,
      roughness: 0.75,
    });

    // 19. Electric Cooling Fan Blades (Lightweight Composite)
    const fanBladeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.55,
      roughness: 0.22,
    });

    // 20. Transmission Cast Aluminum Gearbox Case
    const gearboxCaseMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.35,
    });

    // 21. Hardened Steel Transmission Helical Gears
    const transGearSteelMat = new THREE.MeshStandardMaterial({
      color: 0xcfdbe6,
      metalness: 0.92,
      roughness: 0.15,
    });

    // 22. Brass Synchronizer Rings
    const synchroBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.2,
    });

    // 23. Drive Axle CV Boots (Pleated Rubber)
    const cvBootMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.1,
      roughness: 0.85,
    });

    // =========================================================================
    // PART A: STATIC ENGINE CASING & CUTAWAY BLOCK (STAYS COMPLETELY ANCHORED!)
    // Strictly behind the cylinder bores so it NEVER blocks the moving parts!
    // =========================================================================
    const staticBlockGroup = new THREE.Group();
    engineGroup.add(staticBlockGroup);

    // 1. Cutaway Main Cylinder Block Rear Wall (Strictly at Z < -1.4, behind cylinders)
    const blockWidth = totalLength + 3.0;
    const blockBackGeo = new THREE.BoxGeometry(blockWidth, 6.8, 1.8);
    const blockBack = new THREE.Mesh(blockBackGeo, engineBlockMat);
    blockBack.position.set(0.2, 4.4, -2.4);
    staticBlockGroup.add(blockBack);

    // Lower Crankcase Bedplate (Rear Half)
    const bedplateGeo = new THREE.BoxGeometry(blockWidth, 2.6, 2.2);
    const bedplate = new THREE.Mesh(bedplateGeo, engineBlockMat);
    bedplate.position.set(0.2, -0.6, -1.8);
    staticBlockGroup.add(bedplate);

    // Bottom Oil Sump Pan (Anchored below crankshaft)
    const oilPanGeo = new THREE.BoxGeometry(blockWidth - 0.6, 1.4, 3.6);
    const oilPan = new THREE.Mesh(oilPanGeo, cutawayRimMat);
    oilPan.position.set(0.2, -2.6, -0.8);
    staticBlockGroup.add(oilPan);

    // 2. Open Cutaway Cylinder Sleeves (Half-cylinder cups facing camera)
    for (let i = 0; i < effectiveCylinders; i++) {
      const cx = xCylStart + i * cylPitch;

      // Cylinder Bore Inner Polished Wall (Open Front Half Cutaway)
      // Angle: 0 to PI facing backwards, so the front half (Z > 0) is 100% open!
      const sleeveGeo = new THREE.CylinderGeometry(boreRadius * 1.05, boreRadius * 1.05, 5.6, 32, 1, true, Math.PI / 2, Math.PI);
      const sleeve = new THREE.Mesh(sleeveGeo, boreSleeveMat);
      sleeve.position.set(cx, 4.8, 0);
      staticBlockGroup.add(sleeve);

      // Top Deck Chamfer Ring
      const deckRingGeo = new THREE.CylinderGeometry(boreRadius * 1.2, boreRadius * 1.2, 0.35, 24);
      const deckRing = new THREE.Mesh(deckRingGeo, cutawayRimMat);
      deckRing.position.set(cx, 7.8, 0);
      staticBlockGroup.add(deckRing);

      // Structural web between cylinders (Rear half only)
      if (i > 0) {
        const webGeo = new THREE.BoxGeometry(0.35, 4.0, 1.6);
        const web = new THREE.Mesh(webGeo, engineBlockMat);
        web.position.set(cx - cylPitch / 2, 4.6, -1.4);
        staticBlockGroup.add(web);
      }
    }

    // 3. Cylinder Head Structure (Top Deck Y = 8.0 to 12.0)
    const headGeo = new THREE.BoxGeometry(blockWidth, 3.6, 3.2);
    const headMesh = new THREE.Mesh(headGeo, engineBlockMat);
    headMesh.position.set(0.2, 9.8, -1.6);
    staticBlockGroup.add(headMesh);

    // Camshaft Bearing Saddles on top of cylinder head
    for (let i = 0; i <= effectiveCylinders; i++) {
      const jx = xCylStart + i * cylPitch - cylPitch / 2;
      const saddleGeo = new THREE.BoxGeometry(0.5, 1.8, 4.0);
      const saddle = new THREE.Mesh(saddleGeo, cutawayRimMat);
      saddle.position.set(jx, 10.8, -0.2);
      staticBlockGroup.add(saddle);
    }

    // 4. Photorealistic Lower Glowing Oil Gallery Channel (Matches orange line in reference photo!)
    // Runs along bottom front edge of bedplate, curves up into timing case and main journals
    const oilPathPoints = [
      new THREE.Vector3(xTiming + 0.6, -1.8, 1.2),
      new THREE.Vector3(xTiming + 1.2, -0.6, 1.6),
      new THREE.Vector3(xTiming + 1.6, 0.4, 1.4),
      new THREE.Vector3(xCylStart - 0.8, 0.4, 1.4),
      new THREE.Vector3(xCylStart + totalLength - 0.8, 0.4, 1.4),
      new THREE.Vector3(xCylStart + totalLength - 0.4, -1.4, 1.6),
      new THREE.Vector3(xCylStart + totalLength + 0.2, -1.8, 1.2),
    ];
    const oilCurve = new THREE.CatmullRomCurve3(oilPathPoints);
    const oilChannelGeo = new THREE.TubeGeometry(oilCurve, 40, 0.16, 12, false);
    const oilChannel = new THREE.Mesh(oilChannelGeo, oilGalleryMat);
    staticBlockGroup.add(oilChannel);

    // Glowing oil channel branch risers up to each main bearing
    for (let i = 0; i <= effectiveCylinders; i++) {
      const jx = xCylStart + i * cylPitch - cylPitch / 2;
      const riserGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
      const riser = new THREE.Mesh(riserGeo, oilGalleryMat);
      riser.position.set(jx, -0.6, 1.4);
      staticBlockGroup.add(riser);
    }

    // 5. Exhaust Manifold Runners & Collector (Right/Exhaust Side: Z > 0, branches to +X)
    // Matches the glowing exhaust headers in the photo!
    const exhaustCollectorGroup = new THREE.Group();
    staticBlockGroup.add(exhaustCollectorGroup);

    const xExhaustExit = xCylStart + totalLength + 1.8;

    for (let i = 0; i < effectiveCylinders; i++) {
      const cx = xCylStart + i * cylPitch;
      const runnerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx, 7.8, 1.4),
        new THREE.Vector3(cx, 7.2, 2.6),
        new THREE.Vector3(xExhaustExit - (effectiveCylinders - i) * 0.4, 5.8, 3.8),
        new THREE.Vector3(xExhaustExit, 5.2, 4.4),
      ]);
      const runnerGeo = new THREE.TubeGeometry(runnerCurve, 24, 0.42, 12, false);
      const runnerMesh = new THREE.Mesh(runnerGeo, exhaustMat);
      exhaustCollectorGroup.add(runnerMesh);
    }

    // Main Exhaust Downpipe Collector extending to right (+X)
    const downpipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xExhaustExit, 5.2, 4.4),
      new THREE.Vector3(xExhaustExit + 1.2, 4.4, 4.8),
      new THREE.Vector3(xExhaustExit + 2.4, 3.6, 5.2),
    ]);
    const downpipeGeo = new THREE.TubeGeometry(downpipeCurve, 20, 0.72, 16, false);
    const downpipeMesh = new THREE.Mesh(downpipeGeo, exhaustMat);
    exhaustCollectorGroup.add(downpipeMesh);

    // 6. Air Intake Runner with Atmospheric Swirl (Top/Intake Side: Z < 0)
    // Matches the cool air intake in the reference photo!
    const intakePlenumGeo = new THREE.CylinderGeometry(0.9, 0.9, blockWidth - 1.0, 20);
    const intakePlenum = new THREE.Mesh(intakePlenumGeo, intakeAirMat);
    intakePlenum.rotation.z = Math.PI / 2;
    intakePlenum.position.set(0.2, 12.0, -2.8);
    staticBlockGroup.add(intakePlenum);

    for (let i = 0; i < effectiveCylinders; i++) {
      const cx = xCylStart + i * cylPitch;
      const intakeRunnerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx, 12.0, -2.8),
        new THREE.Vector3(cx, 10.6, -2.2),
        new THREE.Vector3(cx, 8.4, -1.4),
      ]);
      const runnerGeo = new THREE.TubeGeometry(intakeRunnerCurve, 16, 0.38, 10, false);
      const runner = new THREE.Mesh(runnerGeo, intakeAirMat);
      staticBlockGroup.add(runner);
    }

    // Front Timing Cover Cutaway (Left side of engine at xTiming)
    const timingCoverGeo = new THREE.BoxGeometry(0.4, 13.0, 5.6);
    const timingCover = new THREE.Mesh(timingCoverGeo, cutawayRimMat);
    timingCover.position.set(xTiming - 0.4, 5.2, -0.6);
    staticBlockGroup.add(timingCover);

    // =========================================================================
    // PART B: MOVING KINEMATIC COMPONENTS (CRANK, PISTONS, RODS, CAMS, VALVES)
    // ONLY THESE COMPONENTS MOVE!
    // =========================================================================

    // 1. ROTATING CRANKSHAFT ASSEMBLY (Bottom Axis: Y = 0, Z = 0)
    const crankAssembly = new THREE.Group();
    crankAssemblyRef.current = crankAssembly;
    crankAssembly.position.set(0, 0, 0);
    engineGroup.add(crankAssembly);

    // Main Bearing Journals along crankshaft center axis
    for (let i = 0; i <= effectiveCylinders; i++) {
      const jx = xCylStart + i * cylPitch - cylPitch / 2;
      const journalGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.7, 24);
      const journalMesh = new THREE.Mesh(journalGeo, journalPolishMat);
      journalMesh.rotation.z = Math.PI / 2;
      journalMesh.position.set(jx, 0, 0);
      crankAssembly.add(journalMesh);
    }

    // Crank Throws & Heavy Counterweight Webs for each cylinder
    for (let i = 0; i < effectiveCylinders; i++) {
      const cx = xCylStart + i * cylPitch;
      // Flat-plane 4-cylinder firing phase offset: [0, PI, PI, 0]
      const phase = isV8 ? (i % 4) * (Math.PI / 2) : i === 0 || i === 3 ? 0 : Math.PI;

      const throwGroup = new THREE.Group();
      throwGroup.rotation.x = phase;
      throwGroup.position.set(cx, 0, 0);
      crankAssembly.add(throwGroup);

      // Crankpin Journal (offset by crankRadius along +Y in throw space)
      const pinGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.95, 20);
      const pinMesh = new THREE.Mesh(pinGeo, journalPolishMat);
      pinMesh.rotation.z = Math.PI / 2;
      pinMesh.position.set(0, crankRadius, 0);
      throwGroup.add(pinMesh);

      // Two Heavy Counterweight Lobes flanking the pin (opposite side: -Y)
      const cwGeo = createCounterweightGeometry(2.35, 0.4);
      const cwMesh1 = new THREE.Mesh(cwGeo, crankSteelMat);
      cwMesh1.position.set(-0.55, 0, 0);
      cwMesh1.rotation.y = Math.PI / 2;
      throwGroup.add(cwMesh1);

      const cwMesh2 = new THREE.Mesh(cwGeo, crankSteelMat);
      cwMesh2.position.set(0.15, 0, 0);
      cwMesh2.rotation.y = Math.PI / 2;
      throwGroup.add(cwMesh2);
    }

    // Rear Flywheel on Right (+X)
    const xFlywheel = xCylStart + totalLength + 0.4;
    const flywheelGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 36);
    const flywheelMesh = new THREE.Mesh(flywheelGeo, crankSteelMat);
    flywheelMesh.rotation.z = Math.PI / 2;
    flywheelMesh.position.set(xFlywheel, 0, 0);
    crankAssembly.add(flywheelMesh);

    // Starter Ring Gear on Flywheel
    const fwRingGeo = new THREE.CylinderGeometry(4.36, 4.36, 0.35, 48);
    const fwRingMesh = new THREE.Mesh(fwRingGeo, sprocketMat);
    fwRingMesh.rotation.z = Math.PI / 2;
    fwRingMesh.position.set(xFlywheel, 0, 0);
    crankAssembly.add(fwRingMesh);

    // 2. FRONT HARMONIC BALANCER CRANK PULLEY (No useless swinging parts!)
    const crankPulleyGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.7, 32);
    const crankPulley = new THREE.Mesh(crankPulleyGeo, sprocketMat);
    crankPulley.rotation.z = Math.PI / 2;
    crankPulley.position.set(xTiming, 0, 0);
    crankAssembly.add(crankPulley);

    // Billet retaining center bolt
    const centerBoltGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 6);
    const centerBolt = new THREE.Mesh(centerBoltGeo, journalPolishMat);
    centerBolt.rotation.z = Math.PI / 2;
    centerBolt.position.set(xTiming - 0.3, 0, 0);
    crankAssembly.add(centerBolt);

    // =========================================================================
    // PART COOLING: RADIATOR CORE, DUAL ELECTRIC FAN, SHROUD, HOSES & EXPANSION TANK
    // Positioned at the front of the vehicle engine bay (Left, X = -9.6)
    // =========================================================================
    const coolingGroup = new THREE.Group();
    engineGroup.add(coolingGroup);

    const xRadiator = -9.6;

    // 1. Radiator Core Fin Matrix
    const radCoreGeo = new THREE.BoxGeometry(0.7, 9.8, 7.6);
    const radCoreMesh = new THREE.Mesh(radCoreGeo, radiatorFinMat);
    radCoreMesh.position.set(xRadiator, 5.0, 0);
    coolingGroup.add(radCoreMesh);

    // 2. Top & Bottom End-Tanks
    const topTankGeo = new THREE.BoxGeometry(1.1, 0.85, 7.8);
    const topTank = new THREE.Mesh(topTankGeo, radiatorTankMat);
    topTank.position.set(xRadiator, 10.0, 0);
    coolingGroup.add(topTank);

    const bottomTankGeo = new THREE.BoxGeometry(1.1, 0.85, 7.8);
    const bottomTank = new THREE.Mesh(bottomTankGeo, radiatorTankMat);
    bottomTank.position.set(xRadiator, 0.0, 0);
    coolingGroup.add(bottomTank);

    // Radiator Pressure Cap (Polished Billet with decal)
    const radCapGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 18);
    const radCap = new THREE.Mesh(radCapGeo, journalPolishMat);
    radCap.position.set(xRadiator, 10.6, 2.2);
    coolingGroup.add(radCap);

    // 3. Molded Electric Fan Shroud
    const shroudGeo = new THREE.BoxGeometry(0.35, 7.8, 6.8);
    const shroud = new THREE.Mesh(shroudGeo, radiatorTankMat);
    shroud.position.set(xRadiator + 0.5, 5.0, 0);
    coolingGroup.add(shroud);

    // Fan Shroud Circular Duct Ring
    const ductGeo = new THREE.TorusGeometry(2.4, 0.12, 12, 32);
    const ductMesh = new THREE.Mesh(ductGeo, cutawayRimMat);
    ductMesh.rotation.y = Math.PI / 2;
    ductMesh.position.set(xRadiator + 0.68, 5.0, 0);
    coolingGroup.add(ductMesh);

    // 4. Electric Cooling Fan (Kinematic Moving Blade Assembly)
    const fanGroup = createCoolingFanGroup(2.3, 7, fanBladeMat, journalPolishMat);
    fanGroup.position.set(xRadiator + 0.65, 5.0, 0);
    engineGroup.add(fanGroup);
    radiatorFanRef.current = fanGroup;

    // 5. Reinforced Coolant Hoses (Upper Hot Hose & Lower Return Hose)
    // Upper Radiator Hose: from Top Tank to Cylinder Head Thermostat
    const upperHoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xRadiator + 0.5, 9.6, 2.0),
      new THREE.Vector3(-7.2, 9.8, 2.4),
      new THREE.Vector3(-5.8, 9.4, 1.4),
      new THREE.Vector3(xCylStart - 0.6, 9.2, 0.4),
    ]);
    const upperHoseGeo = new THREE.TubeGeometry(upperHoseCurve, 24, 0.36, 12, false);
    const upperHose = new THREE.Mesh(upperHoseGeo, coolantHoseMat);
    coolingGroup.add(upperHose);

    // Lower Radiator Hose: from Bottom Tank to Engine Water Pump
    const lowerHoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xRadiator + 0.5, 0.4, -2.0),
      new THREE.Vector3(-7.2, 0.3, -2.2),
      new THREE.Vector3(-5.8, 0.7, -1.5),
      new THREE.Vector3(xCylStart - 0.6, 1.0, -0.6),
    ]);
    const lowerHoseGeo = new THREE.TubeGeometry(lowerHoseCurve, 24, 0.38, 12, false);
    const lowerHose = new THREE.Mesh(lowerHoseGeo, coolantHoseMat);
    coolingGroup.add(lowerHose);

    // 6. Translucent Coolant Expansion / Overflow Reservoir
    const bottleGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.6, 18);
    const bottle = new THREE.Mesh(bottleGeo, coolantFluidMat);
    bottle.position.set(-7.8, 8.4, -3.2);
    coolingGroup.add(bottle);

    const bottleCapGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12);
    const bottleCap = new THREE.Mesh(bottleCapGeo, radiatorTankMat);
    bottleCap.position.set(-7.8, 9.8, -3.2);
    coolingGroup.add(bottleCap);

    // 3. DUAL OVERHEAD CAMSHAFTS (DOHC) WITH REAL EGG-SHAPED CAM LOBES
    const camShaftLength = totalLength + 3.0;

    const intakeCamGroup = new THREE.Group();
    intakeCamGroup.position.set(0, 10.8, -1.4);
    engineGroup.add(intakeCamGroup);
    intakeCamRef.current = intakeCamGroup;

    const exhaustCamGroup = new THREE.Group();
    exhaustCamGroup.position.set(0, 10.8, 1.4);
    engineGroup.add(exhaustCamGroup);
    exhaustCamRef.current = exhaustCamGroup;

    // Intake central shaft
    const intakeShaftGeo = new THREE.CylinderGeometry(0.44, 0.44, camShaftLength, 20);
    const intakeShaft = new THREE.Mesh(intakeShaftGeo, camshaftMat);
    intakeShaft.rotation.z = Math.PI / 2;
    intakeShaft.position.set(0.2, 0, 0);
    intakeCamGroup.add(intakeShaft);

    // Exhaust central shaft
    const exhaustShaft = new THREE.Mesh(intakeShaftGeo, camshaftMat);
    exhaustShaft.rotation.z = Math.PI / 2;
    exhaustShaft.position.set(0.2, 0, 0);
    exhaustCamGroup.add(exhaustShaft);

    // Cam Lobes positioned directly over valves
    for (let i = 0; i < effectiveCylinders; i++) {
      const cx = xCylStart + i * cylPitch;
      const phase = isV8 ? (i % 4) * (Math.PI / 2) : i === 0 || i === 3 ? 0 : Math.PI;

      for (const dx of [-0.55, 0.55]) {
        // Intake cam lobe
        const intakeLobeGroup = new THREE.Group();
        intakeLobeGroup.position.set(cx + dx, 0, 0);
        intakeLobeGroup.rotation.x = phase / 2;
        intakeCamGroup.add(intakeLobeGroup);

        const lobeGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.38, 18);
        const lobeMesh = new THREE.Mesh(lobeGeo, journalPolishMat);
        lobeMesh.rotation.z = Math.PI / 2;
        intakeLobeGroup.add(lobeMesh);

        const tipGeo = new THREE.BoxGeometry(0.38, 0.72, 0.52);
        const tipMesh = new THREE.Mesh(tipGeo, journalPolishMat);
        tipMesh.position.set(0, 0.36, 0);
        intakeLobeGroup.add(tipMesh);

        // Exhaust cam lobe
        const exhaustLobeGroup = new THREE.Group();
        exhaustLobeGroup.position.set(cx + dx, 0, 0);
        exhaustLobeGroup.rotation.x = phase / 2 + Math.PI;
        exhaustCamGroup.add(exhaustLobeGroup);

        const exLobeMesh = new THREE.Mesh(lobeGeo, journalPolishMat);
        exLobeMesh.rotation.z = Math.PI / 2;
        exhaustLobeGroup.add(exLobeMesh);

        const exTipMesh = new THREE.Mesh(tipGeo, journalPolishMat);
        exTipMesh.position.set(0, 0.36, 0);
        exhaustLobeGroup.add(exTipMesh);
      }
    }

    // 4. PISTONS, CONNECTING RODS & COMBUSTION FLAME / SPARK PLUGS
    for (let i = 0; i < effectiveCylinders; i++) {
      const xPos = xCylStart + i * cylPitch;

      // PISTON ASSEMBLY
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(xPos, 5.0, 0);
      engineGroup.add(pistonGroup);
      pistonMeshesRef.current.push(pistonGroup);

      // Piston Crown & Skirt (Machined aluminum with ring grooves)
      const pistonBodyGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, 1.85, 28);
      const pistonBody = new THREE.Mesh(pistonBodyGeo, pistonAlloyMat);
      pistonGroup.add(pistonBody);

      // 3 Compression Rings
      for (const ry of [0.45, 0.65, 0.85]) {
        const ringGeo = new THREE.CylinderGeometry(boreRadius * 1.02, boreRadius * 1.02, 0.05, 28);
        const ring = new THREE.Mesh(ringGeo, cutawayRimMat);
        ring.position.y = ry;
        pistonGroup.add(ring);
      }

      // Hollow Wrist Pin passing through piston horizontally
      const wristPinGeo = new THREE.CylinderGeometry(0.38, 0.38, boreRadius * 1.7, 18);
      const wristPin = new THREE.Mesh(wristPinGeo, journalPolishMat);
      wristPin.rotation.x = Math.PI / 2;
      pistonGroup.add(wristPin);

      // CONNECTING ROD ASSEMBLY (Forged H-Beam Design)
      const conRodGroup = new THREE.Group();
      conRodGroup.position.set(xPos, 5.0, 0);
      engineGroup.add(conRodGroup);
      conRodMeshesRef.current.push(conRodGroup);

      // Small-End Wrist Pin Eyelet at origin (0, 0, 0)
      const smallEndGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.55, 20);
      const smallEnd = new THREE.Mesh(smallEndGeo, conRodMat);
      smallEnd.rotation.x = Math.PI / 2;
      conRodGroup.add(smallEnd);

      // H-Beam Shank (Extends down from y = 0 to y = -rodLength)
      const shankLength = rodLength - 1.1;
      const rodWebGeo = new THREE.BoxGeometry(0.26, shankLength, 0.16);
      const rodWeb = new THREE.Mesh(rodWebGeo, conRodMat);
      rodWeb.position.y = -rodLength / 2;
      conRodGroup.add(rodWeb);

      const flangeGeo = new THREE.BoxGeometry(0.52, shankLength, 0.12);
      const flange1 = new THREE.Mesh(flangeGeo, conRodMat);
      flange1.position.set(0, -rodLength / 2, -0.15);
      conRodGroup.add(flange1);

      const flange2 = new THREE.Mesh(flangeGeo, conRodMat);
      flange2.position.set(0, -rodLength / 2, 0.15);
      conRodGroup.add(flange2);

      // Big-End Bearing Journal & Cap at y = -rodLength
      const bigEndGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.6, 24);
      const bigEnd = new THREE.Mesh(bigEndGeo, conRodMat);
      bigEnd.rotation.z = Math.PI / 2;
      bigEnd.position.y = -rodLength;
      conRodGroup.add(bigEnd);

      // Visible Big-End Rod Bolts
      for (const bz of [-0.64, 0.64]) {
        const boltGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
        const bolt = new THREE.Mesh(boltGeo, journalPolishMat);
        bolt.position.set(0, -rodLength, bz);
        conRodGroup.add(bolt);
      }

      // COMBUSTION CHAMBER VOLUMETRIC FLAME & SPARK PLUG
      // Matches the flame explosion and spark flash in the photo!
      const flameGeo = new THREE.CylinderGeometry(boreRadius * 0.95, boreRadius * 0.9, 1.4, 20);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.0,
      });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      flameMesh.position.set(xPos, 7.4, 0);
      engineGroup.add(flameMesh);

      // Electric Spark Electrode at top center
      const sparkGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.0,
      });
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
      sparkMesh.position.set(xPos, 8.1, 0);
      engineGroup.add(sparkMesh);

      const flashLight = new THREE.PointLight(0xff7700, 0, 8);
      flashLight.position.set(xPos, 7.6, 0);
      engineGroup.add(flashLight);

      combustionFlashesRef.current.push({ flameMesh, sparkMesh, light: flashLight });

      // 5. 16 POPPET VALVES WITH DUAL HELICAL SPRINGS (4 per cylinder)
      const valveConfigs = [
        { isExhaust: false, zOffset: -1.4, dx: -0.55 }, // Intake Valve 1
        { isExhaust: false, zOffset: -1.4, dx: 0.55 }, // Intake Valve 2
        { isExhaust: true, zOffset: 1.4, dx: -0.55 }, // Exhaust Valve 1
        { isExhaust: true, zOffset: 1.4, dx: 0.55 }, // Exhaust Valve 2
      ];

      for (const vc of valveConfigs) {
        const vx = xPos + vc.dx;
        const vz = vc.zOffset;
        const restY = 7.8;

        const stemGroup = new THREE.Group();
        stemGroup.position.set(vx, restY, vz);
        engineGroup.add(stemGroup);

        // Slender valve stem
        const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12);
        const stemMesh = new THREE.Mesh(stemGeo, valveMat);
        stemMesh.position.y = 1.3;
        stemGroup.add(stemMesh);

        // Mushroom poppet head at bottom
        const headGeo = new THREE.CylinderGeometry(0.68, 0.16, 0.35, 18);
        const headMesh = new THREE.Mesh(headGeo, valveMat);
        headMesh.position.y = -0.2;
        stemGroup.add(headMesh);

        // Top retainer washer / bucket follower
        const capGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 16);
        const capMesh = new THREE.Mesh(capGeo, journalPolishMat);
        capMesh.position.y = 2.75;
        stemGroup.add(capMesh);

        // Helical wire valve spring
        const springGeo = createSpringGeometry(0.38, 1.85, 6.5);
        const springMesh = new THREE.Mesh(springGeo, valveSpringMat);
        springMesh.position.set(vx, restY + 1.45, vz);
        engineGroup.add(springMesh);

        valvesRef.current.push({
          stemGroup,
          springMesh,
          isExhaust: vc.isExhaust,
          cylinderIndex: i,
          restY,
        });
      }
    }

    // =========================================================================
    // PART TRANSMISSION: BELLHOUSING, CUTAWAY GEARBOX, SHAFTS, GEARS & DIFFERENTIAL
    // Bolted to rear flywheel side (+X from 5.4 to 13.5)
    // =========================================================================
    const transGroup = new THREE.Group();
    engineGroup.add(transGroup);

    const xTransStart = xCylStart + totalLength + 0.8; // ~ 5.4

    // 1. Transmission Bellhousing (Cone transitioning from engine block to gearbox)
    const bellGeo = new THREE.CylinderGeometry(2.8, 4.2, 1.8, 28, 1, true);
    const bellMesh = new THREE.Mesh(bellGeo, gearboxCaseMat);
    bellMesh.rotation.z = Math.PI / 2;
    bellMesh.position.set(xTransStart + 0.9, 0, 0);
    transGroup.add(bellMesh);

    // Bellhousing flange bolts
    for (let b = 0; b < 8; b++) {
      const bAngle = (b / 8) * Math.PI * 2;
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 6), journalPolishMat);
      bMesh.rotation.z = Math.PI / 2;
      bMesh.position.set(xTransStart + 0.1, Math.cos(bAngle) * 4.0, Math.sin(bAngle) * 4.0);
      transGroup.add(bMesh);
    }

    // 2. Cutaway Gearbox Main Housing (Open Front Cutaway at Z > 0 to reveal internal gear train!)
    const boxLength = 6.2;
    const boxCenter = xTransStart + 1.8 + boxLength / 2; // ~ 10.3

    // Rear Half Shell of Gearbox (Z < 0)
    const gearCaseGeo = new THREE.BoxGeometry(boxLength, 5.2, 2.2);
    const gearCaseMesh = new THREE.Mesh(gearCaseGeo, gearboxCaseMat);
    gearCaseMesh.position.set(boxCenter, -0.6, -1.1);
    transGroup.add(gearCaseMesh);

    // Bottom transmission oil sump reservoir
    const transPanGeo = new THREE.BoxGeometry(boxLength - 0.4, 1.0, 3.2);
    const transPanMesh = new THREE.Mesh(transPanGeo, cutawayRimMat);
    transPanMesh.position.set(boxCenter, -3.2, 0);
    transGroup.add(transPanMesh);

    // End-Plate & Structural Reinforcement Ribs
    const endPlateGeo = new THREE.BoxGeometry(0.4, 5.2, 3.8);
    const endPlate = new THREE.Mesh(endPlateGeo, cutawayRimMat);
    endPlate.position.set(xTransStart + 1.8 + boxLength, -0.6, 0);
    transGroup.add(endPlate);

    // Top Shifter Turret & Linkage
    const turretGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16);
    const turret = new THREE.Mesh(turretGeo, cutawayRimMat);
    turret.position.set(boxCenter - 1.2, 2.6, 0);
    transGroup.add(turret);

    const shiftRodGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.8, 12);
    const shiftRod = new THREE.Mesh(shiftRodGeo, journalPolishMat);
    shiftRod.rotation.z = Math.PI / 2;
    shiftRod.position.set(boxCenter - 0.8, 1.4, 0.8);
    transGroup.add(shiftRod);

    // 3. KINEMATIC TRANSMISSION SHAFTS & HELICAL GEAR CLUSTERS

    // A. Main Input Shaft (Rotates at Engine Theta)
    const inputShaftGroup = new THREE.Group();
    inputShaftGroup.position.set(0, 0, 0);
    engineGroup.add(inputShaftGroup);
    transInputShaftRef.current = inputShaftGroup;

    const inShaftGeo = new THREE.CylinderGeometry(0.38, 0.38, boxLength + 1.2, 20);
    const inShaftMesh = new THREE.Mesh(inShaftGeo, journalPolishMat);
    inShaftMesh.rotation.z = Math.PI / 2;
    inShaftMesh.position.set(boxCenter - 0.4, 0, 0);
    inputShaftGroup.add(inShaftMesh);

    // Input Helical Gears: 1st, 2nd, 3rd, 4th, 5th
    const gearXPositions = [
      boxCenter - 2.2, // 1st gear
      boxCenter - 1.3, // 2nd gear
      boxCenter - 0.4, // 3rd gear
      boxCenter + 0.5, // 4th gear
      boxCenter + 1.4, // 5th gear
    ];

    const inputRadii = [0.85, 1.05, 1.25, 1.45, 1.65];
    const counterRadii = [1.85, 1.65, 1.45, 1.25, 1.05];

    for (let g = 0; g < gearXPositions.length; g++) {
      const inGear = createHelicalGearMesh(inputRadii[g], 0.65, 18 + g * 3, transGearSteelMat, cutawayRimMat);
      inGear.position.set(gearXPositions[g], 0, 0);
      inputShaftGroup.add(inGear);
    }

    // B. Countershaft / Layshaft (Rotates proportionally: -theta * 0.72)
    const counterShaftGroup = new THREE.Group();
    counterShaftGroup.position.set(0, -1.6, -0.4);
    engineGroup.add(counterShaftGroup);
    transCounterShaftRef.current = counterShaftGroup;

    const counterShaftGeo = new THREE.CylinderGeometry(0.38, 0.38, boxLength + 0.8, 20);
    const counterShaftMesh = new THREE.Mesh(counterShaftGeo, journalPolishMat);
    counterShaftMesh.rotation.z = Math.PI / 2;
    counterShaftMesh.position.set(boxCenter - 0.4, 0, 0);
    counterShaftGroup.add(counterShaftMesh);

    // Countershaft Mating Gears
    for (let g = 0; g < gearXPositions.length; g++) {
      const ctGear = createHelicalGearMesh(counterRadii[g], 0.65, 34 - g * 3, transGearSteelMat, cutawayRimMat);
      ctGear.position.set(gearXPositions[g], 0, 0);
      counterShaftGroup.add(ctGear);

      // Brass Synchronizer Rings between gears
      if (g % 2 === 1) {
        const synchroGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.3, 20);
        const synchroMesh = new THREE.Mesh(synchroGeo, synchroBrassMat);
        synchroMesh.rotation.z = Math.PI / 2;
        synchroMesh.position.set(gearXPositions[g] + 0.45, 0, 0);
        counterShaftGroup.add(synchroMesh);
      }
    }

    // C. Final Drive Differential Assembly (At X = boxCenter + 2.2, Y = -1.0, Z = 0)
    const diffGroup = new THREE.Group();
    diffGroup.position.set(boxCenter + 2.2, -1.0, 0);
    engineGroup.add(diffGroup);
    transDiffRef.current = diffGroup;

    // Large Helical Crown Ring Gear
    const crownGear = createHelicalGearMesh(2.2, 0.75, 42, transGearSteelMat, cutawayRimMat);
    diffGroup.add(crownGear);

    // Differential Carrier Casing
    const diffCaseGeo = new THREE.SphereGeometry(1.35, 16, 16);
    const diffCaseMesh = new THREE.Mesh(diffCaseGeo, cutawayRimMat);
    diffCaseMesh.scale.set(0.8, 1.0, 1.0);
    diffGroup.add(diffCaseMesh);

    // D. Output Drive Axles / Half-Shafts with Pleated CV Boots
    const axlesGroup = new THREE.Group();
    axlesGroup.position.set(boxCenter + 2.2, -1.0, 0);
    engineGroup.add(axlesGroup);
    transAxlesRef.current = axlesGroup;

    for (const side of [-1, 1]) {
      const zAxleDist = 3.6 * side;

      // Steel Half-Shaft
      const axleGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.2, 16);
      const axleMesh = new THREE.Mesh(axleGeo, journalPolishMat);
      axleMesh.rotation.x = Math.PI / 2;
      axleMesh.position.set(0, 0, zAxleDist / 2);
      axlesGroup.add(axleMesh);

      // Pleated Rubber CV Boots (Inner and Outer)
      for (const bz of [side * 1.1, side * 3.1]) {
        const bootGeo = new THREE.CylinderGeometry(0.55, 0.38, 0.75, 14);
        const bootMesh = new THREE.Mesh(bootGeo, cvBootMat);
        bootMesh.rotation.x = Math.PI / 2;
        bootMesh.position.set(0, 0, bz);
        axlesGroup.add(bootMesh);
      }

      // Wheel Hub Flange
      const hubGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.25, 20);
      const hubMesh = new THREE.Mesh(hubGeo, cutawayRimMat);
      hubMesh.rotation.x = Math.PI / 2;
      hubMesh.position.set(0, 0, zAxleDist);
      axlesGroup.add(hubMesh);
    }
  }, []);

  // Update Visual Materials based on Selected Style Mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (styleMode === 'metallic_cutaway') {
      const isV8 = cylinderConfig === 'V_ENGINE' || cylinderCount === 8;
      buildEngineAssembly(scene, cylinderCount, isV8);
      return;
    }

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (styleMode === 'cad_blueprint') {
          obj.material = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.88,
          });
        } else if (styleMode === 'thermal_flir') {
          obj.material = new THREE.MeshStandardMaterial({
            color: 0xff3b30,
            emissive: 0x990000,
            emissiveIntensity: 0.7,
            roughness: 0.3,
            metalness: 0.6,
            wireframe: false,
          });
        }
      }
    });
  }, [styleMode, cylinderConfig, cylinderCount, buildEngineAssembly]);

  // Main Three.js Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090e1b); // Deep sleek dark studio background

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 200);
    // Camera position: perfectly frames the full powertrain (Radiator + Engine + Gearbox)
    camera.position.set(0.0, 7.8, 27.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 55;
    controls.minDistance = 6;
    controls.target.set(0.0, 5.0, 0.0);
    controlsRef.current = controls;

    // 3. Multi-Point Studio Lighting (Creates the bright specular glints from reference photo)
    const ambLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambLight);

    // Front Key Light (bright direct illumination on pistons, cylinders, and rods)
    const frontKeyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    frontKeyLight.position.set(4, 16, 20);
    scene.add(frontKeyLight);

    // Direct frontal illumination flooding into the open cutaway cylinder bores
    const directFrontLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directFrontLight.position.set(0, 5, 20);
    scene.add(directFrontLight);

    // Left Fill Light (illuminates timing chain & sprockets)
    const leftFillLight = new THREE.DirectionalLight(0xbfdbfe, 3.2);
    leftFillLight.position.set(-16, 12, 14);
    scene.add(leftFillLight);

    // Right Rim Light (highlights exhaust manifold)
    const rightRimLight = new THREE.DirectionalLight(0xfed7aa, 3.0);
    rightRimLight.position.set(16, 14, 12);
    scene.add(rightRimLight);

    // Top Overhead Light (illuminates DOHC and valve springs)
    const topLight = new THREE.DirectionalLight(0xffffff, 3.2);
    topLight.position.set(0, 24, 0);
    scene.add(topLight);

    // Underside Fill Light (illuminates crankshaft & oil gallery)
    const bottomFill = new THREE.DirectionalLight(0xffffff, 2.2);
    bottomFill.position.set(0, -10, 8);
    scene.add(bottomFill);

    // Ground Grid Matrix
    const grid = new THREE.GridHelper(45, 45, 0x1e293b, 0x0f172a);
    grid.position.y = -3.6;
    scene.add(grid);

    // 4. Build Engine Cutaway Assembly
    const isV8 = cylinderConfig === 'V_ENGINE' || cylinderCount === 8;
    buildEngineAssembly(scene, cylinderCount, isV8);

    // 5. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Real-Time Kinematic Animation Loop (Strictly Moving Only Necessary Parts)
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      controls.autoRotate = autoOrbit;
      controls.autoRotateSpeed = 0.8;
      controls.update();

      // Kinematic Speed Driven by Live Backend Telemetry RPM
      const baseRpm = telemetry?.rpm ?? 850;
      const currentRpm = isPaused ? 0 : baseRpm * simSpeed;
      const radPerSec = (currentRpm * 2 * Math.PI) / 60;
      if (isSimulating && !isPaused) {
        crankAngleRef.current += radPerSec * dt;
      }
      const theta = crankAngleRef.current;

      // 1. ROTATE CRANKSHAFT around its main longitudinal X-axis (ONLY CRANKSHAFT SPINS)
      if (crankAssemblyRef.current) {
        crankAssemblyRef.current.rotation.x = theta;
      }

      // 2. ROTATE OVERHEAD CAMSHAFTS at Exactly 1/2 Crankshaft Speed (theta / 2)
      if (intakeCamRef.current) {
        intakeCamRef.current.rotation.x = theta / 2;
      }
      if (exhaustCamRef.current) {
        exhaustCamRef.current.rotation.x = theta / 2;
      }

      // 3. ROTATE ELECTRIC COOLING FAN DYNAMICALLY (Speed scales with Coolant Temp & Engine RPM)
      if (radiatorFanRef.current && !isPaused) {
        const coolantC = telemetry?.coolant_temp_c ?? 90;
        const fanSpeed = (coolantC / 85) * (currentRpm * 0.12 + 18);
        radiatorFanRef.current.rotation.x += fanSpeed * dt;
      }

      // 4. KINEMATIC ROTATION OF TRANSMISSION GEAR TRAIN
      // Input shaft rotates with engine crankshaft
      if (transInputShaftRef.current) {
        transInputShaftRef.current.rotation.x = theta;
      }

      // Countershaft / layshaft rotates opposite at current gear reduction ratio
      if (transCounterShaftRef.current) {
        transCounterShaftRef.current.rotation.x = -theta * 0.72;
      }

      // Final drive differential & axle half-shafts rotate at final drive reduction ratio
      if (transDiffRef.current) {
        transDiffRef.current.rotation.x = -theta * 0.28;
      }
      if (transAxlesRef.current) {
        transAxlesRef.current.rotation.x = -theta * 0.28;
      }

      // 4. SLIDER-CRANK KINEMATICS FOR PISTONS & CONNECTING RODS
      const crankR = 1.35;
      const rodL = 4.65;
      const yCrankZero = 0.0;
      const pistons = pistonMeshesRef.current;
      const conRods = conRodMeshesRef.current;
      const flashes = combustionFlashesRef.current;

      const engineLoad = telemetry ? Math.min(1.0, (telemetry.brake_torque_nm / 350) + 0.2) : 0.4;

      for (let i = 0; i < pistons.length; i++) {
        // Flat-plane 4-cylinder firing phase offset: [0, PI, PI, 0]
        const phase = isV8 ? (i % 4) * (Math.PI / 2) : i === 0 || i === 3 ? 0 : Math.PI;
        const theta_i = theta + phase;

        // Exact Crankpin coordinates in Y-Z plane
        const yPin = Math.cos(theta_i) * crankR;
        const zPin = Math.sin(theta_i) * crankR;

        // Exact slider-crank piston position: y = yPin + sqrt(L^2 - zPin^2)
        const discriminant = Math.max(0, rodL * rodL - zPin * zPin);
        const yPiston = yCrankZero + yPin + Math.sqrt(discriminant);

        // Update Piston position (Slides strictly vertically in cylinder bore)
        if (pistons[i]) {
          pistons[i].position.y = yPiston;
        }

        // Update Connecting Rod orientation & position
        // Pinned at wrist pin -> Big end locks to crankpin with mathematically zero drift!
        if (conRods[i]) {
          conRods[i].position.y = yPiston;
          const rodAngle = Math.atan2(-zPin, yPiston - yPin);
          conRods[i].rotation.x = rodAngle;
        }

        // 4-Stroke Combustion Powerstroke Fire & Spark (At TDC once every 2 revolutions)
        if (flashes[i] && showCombustion) {
          const cycleAngle = ((theta_i % (Math.PI * 4)) + Math.PI * 4) % (Math.PI * 4);

          // Spark fires right at TDC (-0.05 to 0.15 rad)
          const isSparking = cycleAngle < 0.22 || (cycleAngle > Math.PI * 2 && cycleAngle < Math.PI * 2 + 0.22);
          // Flame expands during power stroke (0 to 1.1 rad)
          const isPowerStroke = cycleAngle < 1.1 || (cycleAngle > Math.PI * 2 && cycleAngle < Math.PI * 2 + 1.1);

          const flameIntensity = isPowerStroke ? Math.max(0.1, 1.0 - (cycleAngle % (Math.PI * 2)) / 1.1) : 0.0;
          const sparkAlpha = isSparking ? 1.0 : 0.0;

          (flashes[i].flameMesh.material as THREE.MeshBasicMaterial).opacity = flameIntensity * 0.92;
          (flashes[i].sparkMesh.material as THREE.MeshBasicMaterial).opacity = sparkAlpha;
          flashes[i].light.intensity = flameIntensity * (3.0 + engineLoad * 4.5);

          // Scaled flame expansion
          flashes[i].flameMesh.scale.set(1.0 + flameIntensity * 0.15, 0.8 + flameIntensity * 0.4, 1.0 + flameIntensity * 0.15);
        }
      }

      // 5. 4-STROKE VALVETRAIN DYNAMIC LIFT & HELICAL SPRING COMPRESSION
      const valves = valvesRef.current;
      for (let v = 0; v < valves.length; v++) {
        const valve = valves[v];
        // 4-stroke cycle phase offset per cylinder: 1-3-4-2 firing order
        const cylPhase = isV8
          ? (valve.cylinderIndex % 4) * Math.PI
          : valve.cylinderIndex === 0
          ? 0
          : valve.cylinderIndex === 1
          ? 3 * Math.PI
          : valve.cylinderIndex === 2
          ? Math.PI
          : 2 * Math.PI;

        const cyclePhase = ((theta + cylPhase) % (Math.PI * 4) + Math.PI * 4) % (Math.PI * 4);

        // Intake stroke: [0, PI] -> Intake valve plunges down
        // Exhaust stroke: [3*PI, 4*PI] -> Exhaust valve plunges down
        // Compression & Power: [PI, 3*PI] -> Valves completely shut on their seats!
        let lift = 0.0;
        if (!valve.isExhaust && cyclePhase < Math.PI) {
          lift = Math.sin(cyclePhase) * 0.72;
        } else if (valve.isExhaust && cyclePhase >= 3 * Math.PI) {
          lift = Math.sin(cyclePhase - 3 * Math.PI) * 0.72;
        }

        // Move valve stem down
        valve.stemGroup.position.y = valve.restY - lift;

        // Compress helical spring dynamically
        const springCompression = 1.0 - (lift / 0.72) * 0.3;
        valve.springMesh.scale.y = springCompression;
        valve.springMesh.position.y = valve.restY + 1.45 - lift / 2;
      }

      // 6. DYNAMIC REFLECTION OF BACKEND DATA ON THERMAL GLOWS
      // A. Exhaust Manifold Heat & Color (Scales with EGT and Load)
      if (exhaustMaterialRef.current && showExhaustGlow) {
        const egt = telemetry?.egt_c ?? 650;
        const egtNorm = Math.min(1.0, Math.max(0.2, (egt - 300) / 600));
        exhaustMaterialRef.current.emissiveIntensity = egtNorm * (1.2 + engineLoad * 0.6);
        if (egt > 850) {
          exhaustMaterialRef.current.emissive.setHex(0xff2200);
        } else {
          exhaustMaterialRef.current.emissive.setHex(0xff5500);
        }
      }

      // B. Oil Gallery Temperature & Pressure
      if (oilGalleryMaterialRef.current && showOilChannels) {
        const oilTemp = telemetry?.oil_temp_c ?? 95;
        const oilPress = telemetry?.oil_pressure_bar ?? 3.8;

        if (oilPress < 1.5) {
          // Low oil pressure warning pulse
          const pulse = (Math.sin(time * 0.008) + 1) * 0.5;
          oilGalleryMaterialRef.current.emissive.setHex(0xef4444);
          oilGalleryMaterialRef.current.emissiveIntensity = 0.6 + pulse * 1.5;
        } else {
          // Healthy golden amber oil flow
          oilGalleryMaterialRef.current.emissive.setHex(0xff6600);
          oilGalleryMaterialRef.current.emissiveIntensity = 1.4 + (oilTemp / 120) * 0.5;
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [cylinderCount, cylinderConfig, showCombustion, showOilChannels, showExhaustGlow, simSpeed, isPaused, autoOrbit, buildEngineAssembly]);

  return (
    <div
      id="auto-digital-twin-viewport"
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-[#090e1b] border border-[#f59e0b]/30 shadow-2xl flex flex-col ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Glass HUD Bar: Style Modes & Camera Presets */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Style Modes */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080f1e]/90 backdrop-blur-md border border-[#f59e0b]/30 pointer-events-auto shadow-lg">
          <button
            id="btn-style-metallic"
            onClick={() => setStyleMode('metallic_cutaway')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              styleMode === 'metallic_cutaway'
                ? 'bg-[#f59e0b] text-[#080f1e] shadow-md shadow-[#f59e0b]/40 font-extrabold'
                : 'text-[#94a3b8] hover:text-[#f59e0b] hover:bg-[#121c2e]'
            }`}
            title="Photorealistic Metallic Cutaway Engine Assembly"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Cutaway Twin</span>
          </button>

          <button
            id="btn-style-thermal"
            onClick={() => setStyleMode('thermal_flir')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              styleMode === 'thermal_flir'
                ? 'bg-[#ef4444] text-white shadow-md shadow-[#ef4444]/40 font-extrabold'
                : 'text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#121c2e]'
            }`}
            title="Thermal Infrared FLIR Heat Radiation"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>FLIR Heat</span>
          </button>

          <button
            id="btn-style-cad"
            onClick={() => setStyleMode('cad_blueprint')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              styleMode === 'cad_blueprint'
                ? 'bg-[#00f0ff] text-[#080f1e] shadow-md shadow-[#00f0ff]/40 font-extrabold'
                : 'text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#121c2e]'
            }`}
            title="CAD Blueprint Wireframe Model"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>CAD Wireframe</span>
          </button>
        </div>

        {/* Camera Presets & Orbit Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080f1e]/90 backdrop-blur-md border border-[#f59e0b]/30 pointer-events-auto shadow-lg">
          <button
            id="btn-preset-reference"
            onClick={() => applyCameraPreset('reference_cutaway')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              cameraAngle === 'reference_cutaway' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Full Powertrain: Radiator Fan + Engine + Gearbox"
          >
            Full Powertrain
          </button>

          <button
            id="btn-preset-cooling"
            onClick={() => applyCameraPreset('cooling_radiator')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              cameraAngle === 'cooling_radiator' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Cooling System, Radiator & Spinning Electric Fan"
          >
            Cooling & Fan
          </button>

          <button
            id="btn-preset-transmission"
            onClick={() => applyCameraPreset('transmission_gearbox')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              cameraAngle === 'transmission_gearbox' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Cutaway Transmission Gearbox, Helical Gears & Axles"
          >
            Gearbox & Axles
          </button>

          <button
            id="btn-preset-valvetrain"
            onClick={() => applyCameraPreset('valvetrain')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              cameraAngle === 'valvetrain' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Overhead Camshafts & Valve Springs"
          >
            Valvetrain
          </button>

          <button
            id="btn-preset-crankcase"
            onClick={() => applyCameraPreset('crankcase')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              cameraAngle === 'crankcase' ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Crankshaft & Rods Underside"
          >
            Crankcase
          </button>

          <button
            id="btn-toggle-orbit"
            onClick={() => setAutoOrbit(!autoOrbit)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              autoOrbit ? 'bg-[#f59e0b]/30 text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'
            }`}
            title="Toggle 360° Auto Turntable Orbit"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Kinematics Play/Pause, Speed, and Glow Toggles (Bottom Left) */}
      <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-[#080f1e]/90 backdrop-blur-md border border-[#f59e0b]/30 flex items-center gap-2.5 shadow-lg pointer-events-auto">
        <button
          id="btn-toggle-play-pause"
          onClick={() => setIsPaused(!isPaused)}
          className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            isPaused
              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
              : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
          }`}
          title={isPaused ? 'Resume Motion' : 'Freeze Kinematics for Static Inspection'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Speed Multiplier */}
        <div className="flex items-center gap-1">
          {[0.25, 0.5, 1.0, 1.5].map((spd) => (
            <button
              key={spd}
              id={`btn-speed-${spd.toString().replace('.', '')}x`}
              onClick={() => setSimSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                simSpeed === spd ? 'bg-[#f59e0b] text-[#080f1e]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-[#3b494b]/60" />

        {/* Dynamic Combustion Toggle */}
        <button
          onClick={() => setShowCombustion(!showCombustion)}
          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            showCombustion ? 'bg-[#ffaa00]/25 text-[#ffaa00] border border-[#ffaa00]/40' : 'text-[#94a3b8] hover:text-white'
          }`}
          title="Toggle Combustion Chamber Sparks & Fire"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fire</span>
        </button>

        {/* Exhaust Glow Toggle */}
        <button
          onClick={() => setShowExhaustGlow(!showExhaustGlow)}
          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            showExhaustGlow ? 'bg-[#ef4444]/25 text-[#ef4444] border border-[#ef4444]/40' : 'text-[#94a3b8] hover:text-white'
          }`}
          title="Toggle Thermal Exhaust Glow"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Exhaust</span>
        </button>
      </div>

      {/* Live Backend Telemetry HUD Badge (Bottom Right) */}
      <div className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-[#080f1e]/90 backdrop-blur-md border border-[#f59e0b]/30 flex items-center gap-4 shadow-lg pointer-events-auto">
        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Crank Speed</span>
          <span className="text-base font-mono font-extrabold text-[#f59e0b]">
            {telemetry ? Math.round(telemetry.rpm) : 850}{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">RPM</span>
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#3b494b]/60" />

        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Oil Pressure</span>
          <span className="text-base font-mono font-extrabold text-[#10b981]">
            {telemetry ? telemetry.oil_pressure_bar.toFixed(1) : '3.8'}{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">BAR</span>
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#3b494b]/60" />

        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Exhaust EGT</span>
          <span className={`text-base font-mono font-extrabold ${telemetry && telemetry.egt_c > 800 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
            {telemetry ? Math.round(telemetry.egt_c) : 650}{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">°C</span>
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#3b494b]/60" />

        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Coolant Temp</span>
          <span className="text-base font-mono font-extrabold text-[#38bdf8]">
            {telemetry ? telemetry.coolant_temp_c.toFixed(1) : '90.0'}{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">°C</span>
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#3b494b]/60" />

        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Radiator Fan</span>
          <span className="text-base font-mono font-extrabold text-[#00f0ff]">
            {telemetry && telemetry.coolant_temp_c > 85 ? 'ACTIVE 1450' : 'ECO 600'}{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">RPM</span>
          </span>
        </div>

        <div className="h-7 w-[1px] bg-[#3b494b]/60" />

        <div>
          <span className="text-[10px] font-mono text-[#94a3b8] uppercase block">Gearbox Ratio</span>
          <span className="text-base font-mono font-extrabold text-[#a855f7]">
            3RD{' '}
            <span className="text-[10px] font-normal text-[#94a3b8]">1.4:1</span>
          </span>
        </div>
      </div>

      {/* Active Fault Subsystem Callout */}
      {activeFaultSubsystem && (
        <div className="absolute top-16 left-3 p-2.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/60 backdrop-blur-md flex items-center gap-2.5 shadow-xl animate-pulse pointer-events-auto">
          <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
          <div>
            <div className="text-[10px] font-mono font-bold text-[#fca5a5] uppercase tracking-wider">
              Diagnostic Fault Highlight
            </div>
            <div className="text-xs font-mono font-extrabold text-white">
              SUBSYSTEM: {activeFaultSubsystem.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

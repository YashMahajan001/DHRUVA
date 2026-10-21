import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SubsystemId } from '../../types/engineDetailsTypes';

export type DroneViewPreset = 'iso' | 'front_prop' | 'cylinder_heads' | 'turbo' | 'top_plan';
export type DroneRenderStyle = 'metallic_pbr' | 'clay_cad' | 'holo';

interface DroneEngineModel3DProps {
  rpm?: number;
  chtPeak?: number;
  chtAvg?: number;
  chtSpread?: number;
  selectedSubsystemId?: SubsystemId | string;
  onSelectSubsystem?: (id: SubsystemId) => void;
  renderMode?: 'pbr' | 'clay' | 'holo' | 'wireframe' | string;
  explodedOffset?: number;
  isStressed?: boolean;
  className?: string;
  height?: string;
}

export const DroneEngineModel3D: React.FC<DroneEngineModel3DProps> = ({
  rpm = 2450,
  chtPeak = 182,
  chtAvg = 174,
  chtSpread = 4.2,
  selectedSubsystemId = 'cylinder',
  onSelectSubsystem,
  renderMode,
  explodedOffset = 0,
  isStressed = false,
  className = '',
  height = '500px'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewPreset, setViewPreset] = useState<DroneViewPreset>('iso');
  const [renderStyle, setRenderStyle] = useState<DroneRenderStyle>(
    renderMode === 'holo' ? 'holo' : renderMode === 'clay' ? 'clay_cad' : 'metallic_pbr'
  );
  const [localExploded, setLocalExploded] = useState<number>(explodedOffset);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync renderMode prop when changed
  useEffect(() => {
    if (renderMode === 'holo') setRenderStyle('holo');
    else if (renderMode === 'clay') setRenderStyle('clay_cad');
    else if (renderMode === 'pbr') setRenderStyle('metallic_pbr');
  }, [renderMode]);

  // Sync prop changes into local state
  useEffect(() => {
    if (explodedOffset !== undefined) {
      setLocalExploded(explodedOffset);
    }
  }, [explodedOffset]);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const engineRootRef = useRef<THREE.Group | null>(null);

  // Moving Parts Ref
  const movingPartsRef = useRef<{
    propellerGroup?: THREE.Group;
    crankshaft?: THREE.Group;
    pistons?: THREE.Mesh[];
    conRods?: THREE.Mesh[];
    pistonBores?: { x: number; y: number; z: number; dir: number }[];
  }>({});

  // Subsystem Mesh Groups for Highlights
  const subsystemGroupsRef = useRef<Record<string, THREE.Group>>({});

  // Camera Orbit & Pan Controls State
  const controlsRef = useRef<{
    isDragging: boolean;
    prevX: number;
    prevY: number;
    targetRotX: number;
    targetRotY: number;
    zoom: number;
    targetPanX: number;
    targetPanY: number;
  }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    targetRotX: 0.32,
    targetRotY: -0.65,
    zoom: 7.2,
    targetPanX: 0,
    targetPanY: 0
  });

  // Track live RPM in ref so the animation loop doesn't require effect restart
  const rpmRef = useRef<number>(rpm);
  useEffect(() => {
    rpmRef.current = rpm;
  }, [rpm]);

  // Track CHT & stress in ref
  const thermalRef = useRef({ chtPeak, chtAvg, chtSpread, isStressed });
  useEffect(() => {
    thermalRef.current = { chtPeak, chtAvg, chtSpread, isStressed };
  }, [chtPeak, chtAvg, chtSpread, isStressed]);

  // Track selected subsystem in ref
  const selectedSubsystemRef = useRef<string>(selectedSubsystemId || 'cylinder');
  useEffect(() => {
    selectedSubsystemRef.current = selectedSubsystemId || 'cylinder';
    updateSubsystemHighlights();
  }, [selectedSubsystemId]);

  // Update subsystem highlight glow materials
  const updateSubsystemHighlights = () => {
    const activeSub = selectedSubsystemRef.current;
    Object.entries(subsystemGroupsRef.current).forEach(([key, group]) => {
      const isSelected = key === activeSub;
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissive = new THREE.Color(key === 'cylinder' ? 0x00f0ff : 0x38bdf8);
            mat.emissiveIntensity = 0.45;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });
  };

  // Helper: Create PBR Materials
  const createMaterials = (style: DroneRenderStyle) => {
    if (style === 'clay_cad') {
      return {
        crankcase: new THREE.MeshStandardMaterial({ color: 0x3a4454, roughness: 0.55, metalness: 0.2 }),
        cylinder: new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.6, metalness: 0.3 }),
        cylinderHead: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.25 }),
        fins: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.2 }),
        piston: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.4 }),
        propeller: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.1 }),
        spinner: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.5 }),
        exhaust: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.4 }),
        turbo: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.45, metalness: 0.35 }),
        intake: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.2 }),
        spark: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.1 }),
      };
    }

    if (style === 'holo') {
      return {
        crankcase: new THREE.MeshStandardMaterial({ color: 0x00f0ff, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        cylinder: new THREE.MeshStandardMaterial({ color: 0x00d2ff, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        cylinderHead: new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        fins: new THREE.MeshStandardMaterial({ color: 0x00f0ff, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        piston: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        propeller: new THREE.MeshStandardMaterial({ color: 0x0284c7, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        spinner: new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        exhaust: new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        turbo: new THREE.MeshStandardMaterial({ color: 0xf97316, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        intake: new THREE.MeshStandardMaterial({ color: 0x00f0ff, wireframe: true, roughness: 0.2, metalness: 0.9 }),
        spark: new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, roughness: 0.2, metalness: 0.9 }),
      };
    }

    // Default: 'metallic_pbr' (Studio Aircraft Engineering Quality)
    return {
      crankcase: new THREE.MeshStandardMaterial({
        color: 0x5a6578,
        metalness: 0.82,
        roughness: 0.28,
      }),
      cylinder: new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        metalness: 0.75,
        roughness: 0.35,
      }),
      cylinderHead: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.85,
        roughness: 0.22,
      }),
      fins: new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.9,
        roughness: 0.3,
      }),
      piston: new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.92,
        roughness: 0.15,
      }),
      propeller: new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.3,
        roughness: 0.45,
      }),
      spinner: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        metalness: 0.88,
        roughness: 0.18,
      }),
      exhaust: new THREE.MeshStandardMaterial({
        color: 0xa16207,
        metalness: 0.8,
        roughness: 0.4,
      }),
      turbo: new THREE.MeshStandardMaterial({
        color: 0x9a3412,
        metalness: 0.75,
        roughness: 0.32,
      }),
      intake: new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        metalness: 0.65,
        roughness: 0.28,
      }),
      spark: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.1,
        roughness: 0.1,
      }),
    };
  };

  // Build the Opposed 4-Cylinder Drone Boxer Engine Model (Rotax 915iS / Lycoming Architecture)
  const buildDroneEngine = (materials: ReturnType<typeof createMaterials>, explode: number) => {
    const engineRoot = new THREE.Group();
    subsystemGroupsRef.current = {};

    const cylinderGroup = new THREE.Group();
    const coolingGroup = new THREE.Group();
    const lubricationGroup = new THREE.Group();
    const fuelGroup = new THREE.Group();
    const electricalGroup = new THREE.Group();
    const turboGroup = new THREE.Group();

    subsystemGroupsRef.current['cylinder'] = cylinderGroup;
    subsystemGroupsRef.current['cooling'] = coolingGroup;
    subsystemGroupsRef.current['lubrication'] = lubricationGroup;
    subsystemGroupsRef.current['fuel'] = fuelGroup;
    subsystemGroupsRef.current['electrical'] = electricalGroup;
    subsystemGroupsRef.current['turbocharger'] = turboGroup;

    // 1. SPLIT ALUMINUM CRANKCASE
    const crankcaseGeo = new THREE.BoxGeometry(1.8, 1.4, 2.8);
    const crankcaseMesh = new THREE.Mesh(crankcaseGeo, materials.crankcase);
    crankcaseMesh.castShadow = true;
    crankcaseMesh.receiveShadow = true;
    engineRoot.add(crankcaseMesh);

    // Crankcase structural ribs
    for (let z = -1.1; z <= 1.1; z += 0.55) {
      const ribGeo = new THREE.BoxGeometry(1.88, 1.46, 0.08);
      const ribMesh = new THREE.Mesh(ribGeo, materials.crankcase);
      ribMesh.position.set(0, 0, z);
      engineRoot.add(ribMesh);
    }

    // Front Gearbox Housing (Reduction Box: Rotax 2.43:1 ratio)
    const gearboxGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.8, 24);
    gearboxGeo.rotateX(Math.PI / 2);
    const gearboxMesh = new THREE.Mesh(gearboxGeo, materials.crankcase);
    gearboxMesh.position.set(0, 0.1, 1.7);
    gearboxMesh.castShadow = true;
    engineRoot.add(gearboxMesh);

    // Bottom Wet/Dry Sump Pan (Lubrication Subsystem)
    const sumpGeo = new THREE.BoxGeometry(1.5, 0.5, 2.4);
    const sumpMesh = new THREE.Mesh(sumpGeo, materials.crankcase);
    sumpMesh.position.set(0, -0.9, -0.1);
    lubricationGroup.add(sumpMesh);

    // Spin-on Oil Filter Canister
    const oilFilterGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20);
    const oilFilterMesh = new THREE.Mesh(oilFilterGeo, materials.spinner);
    oilFilterMesh.position.set(0.65, -0.85, 0.8);
    oilFilterMesh.rotateZ(0.3);
    lubricationGroup.add(oilFilterMesh);

    // 2. HORIZONTALLY OPPOSED CYLINDERS & MOVING PISTONS
    // Cyl 1 & 3 on Left (-X), Cyl 2 & 4 on Right (+X)
    const pistonsArray: THREE.Mesh[] = [];
    const conRodsArray: THREE.Mesh[] = [];
    const pistonBores: { x: number; y: number; z: number; dir: number }[] = [];

    const cylinderSpecs = [
      { id: 1, xSign: -1, z: 0.6, name: 'CYLINDER 1' },
      { id: 2, xSign: 1, z: 0.35, name: 'CYLINDER 2' },
      { id: 3, xSign: -1, z: -0.45, name: 'CYLINDER 3' },
      { id: 4, xSign: 1, z: -0.7, name: 'CYLINDER 4' },
    ];

    cylinderSpecs.forEach((cyl) => {
      const explodeOffset = (explode / 100) * 0.9 * cyl.xSign;
      const baseX = (0.9 + 0.65) * cyl.xSign + explodeOffset;
      const baseY = 0.05;
      const baseZ = cyl.z;

      // Cylinder Jug Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.3, 24);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrelMesh = new THREE.Mesh(barrelGeo, materials.cylinder);
      barrelMesh.position.set(baseX, baseY, baseZ);
      barrelMesh.castShadow = true;
      barrelMesh.receiveShadow = true;
      cylinderGroup.add(barrelMesh);

      // High-Density Annular Cooling Fins (10 radial rings per cylinder)
      for (let finIdx = -0.5; finIdx <= 0.5; finIdx += 0.11) {
        const finGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.025, 24);
        finGeo.rotateZ(Math.PI / 2);
        const finMesh = new THREE.Mesh(finGeo, materials.fins);
        finMesh.position.set(baseX + finIdx, baseY, baseZ);
        cylinderGroup.add(finMesh);
      }

      // Cylinder Head with Rocker Box Cover
      const headGeo = new THREE.BoxGeometry(0.45, 1.15, 1.15);
      const headMesh = new THREE.Mesh(headGeo, materials.cylinderHead);
      headMesh.position.set(baseX + 0.72 * cyl.xSign, baseY, baseZ);
      headMesh.castShadow = true;
      cylinderGroup.add(headMesh);

      // Spark Plugs (Dual Ignition System)
      const sparkGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12);
      sparkGeo.rotateZ(Math.PI / 2);
      const sparkMeshTop = new THREE.Mesh(sparkGeo, materials.spark);
      sparkMeshTop.position.set(baseX + 0.92 * cyl.xSign, baseY + 0.35, baseZ + 0.2);
      electricalGroup.add(sparkMeshTop);

      const sparkMeshBottom = new THREE.Mesh(sparkGeo, materials.spark);
      sparkMeshBottom.position.set(baseX + 0.92 * cyl.xSign, baseY - 0.35, baseZ - 0.2);
      electricalGroup.add(sparkMeshBottom);

      // Piston (Inside the cylinder bore)
      const pistonGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.42, 24);
      pistonGeo.rotateZ(Math.PI / 2);
      const pistonMesh = new THREE.Mesh(pistonGeo, materials.piston);
      pistonMesh.position.set(baseX - 0.2 * cyl.xSign, baseY, baseZ);
      pistonMesh.castShadow = true;
      cylinderGroup.add(pistonMesh);
      pistonsArray.push(pistonMesh);

      // Connecting Rod
      const conRodGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12);
      conRodGeo.rotateZ(Math.PI / 2);
      const conRodMesh = new THREE.Mesh(conRodGeo, materials.piston);
      conRodMesh.position.set(baseX - 0.6 * cyl.xSign, baseY, baseZ);
      cylinderGroup.add(conRodMesh);
      conRodsArray.push(conRodMesh);

      pistonBores.push({
        x: baseX,
        y: baseY,
        z: baseZ,
        dir: cyl.xSign
      });
    });

    movingPartsRef.current.pistons = pistonsArray;
    movingPartsRef.current.conRods = conRodsArray;
    movingPartsRef.current.pistonBores = pistonBores;

    // 3. PROPELLER & SPINNER ASSEMBLY (Front Drive)
    const propellerGroup = new THREE.Group();
    propellerGroup.position.set(0, 0.1, 2.15);

    // Machined Center Spinner Nose Cone
    const spinnerGeo = new THREE.ConeGeometry(0.42, 0.9, 32);
    spinnerGeo.rotateX(Math.PI / 2);
    const spinnerMesh = new THREE.Mesh(spinnerGeo, materials.spinner);
    spinnerMesh.castShadow = true;
    propellerGroup.add(spinnerMesh);

    // Propeller Hub Flange
    const hubGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.25, 32);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, materials.crankcase);
    hubMesh.position.set(0, 0, -0.15);
    propellerGroup.add(hubMesh);

    // 3-Blade Aerodynamic Carbon Propeller
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = angle;

      const bladeGeo = new THREE.BoxGeometry(0.24, 2.6, 0.05);
      const bladeMesh = new THREE.Mesh(bladeGeo, materials.propeller);
      bladeMesh.position.set(0, 1.35, -0.05);
      bladeMesh.rotation.y = 0.22; // Aerodynamic pitch angle
      bladeMesh.castShadow = true;

      // Blade Yellow Tip Warning Stripe
      const tipGeo = new THREE.BoxGeometry(0.242, 0.35, 0.052);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.set(0, 2.5, -0.05);
      tipMesh.rotation.y = 0.22;

      bladePivot.add(bladeMesh);
      bladePivot.add(tipMesh);
      propellerGroup.add(bladePivot);
    }

    engineRoot.add(propellerGroup);
    movingPartsRef.current.propellerGroup = propellerGroup;

    // 4. TURBOCHARGER ASSEMBLY (Aft Exhaust Core)
    const turboExplode = (explode / 100) * 0.7;
    const turboAnchor = new THREE.Group();
    turboAnchor.position.set(0, 0.45, -1.8 - turboExplode);

    // Turbine Casing (Cast Iron Scroll)
    const turbineScrollGeo = new THREE.TorusGeometry(0.38, 0.16, 16, 32);
    turbineScrollGeo.rotateY(Math.PI / 2);
    const turbineMesh = new THREE.Mesh(turbineScrollGeo, materials.turbo);
    turbineMesh.castShadow = true;
    turboAnchor.add(turbineMesh);

    // Compressor Casing (Billet Aluminum Scroll)
    const compScrollGeo = new THREE.TorusGeometry(0.42, 0.18, 16, 32);
    compScrollGeo.rotateY(Math.PI / 2);
    const compMesh = new THREE.Mesh(compScrollGeo, materials.intake);
    compMesh.position.set(0.35, 0, 0);
    compMesh.castShadow = true;
    turboAnchor.add(compMesh);

    // Wastegate Actuator Canister & Control Rod
    const wastegateGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
    wastegateGeo.rotateX(Math.PI / 2);
    const wastegateMesh = new THREE.Mesh(wastegateGeo, materials.crankcase);
    wastegateMesh.position.set(-0.35, 0.25, -0.15);
    turboAnchor.add(wastegateMesh);

    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const rodMesh = new THREE.Mesh(rodGeo, materials.spinner);
    rodMesh.position.set(-0.35, 0.05, 0.05);
    turboAnchor.add(rodMesh);

    turboGroup.add(turboAnchor);

    // 5. INTAKE & FUEL SYSTEM (Top Manifold & Injectors)
    const intakePlenumGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 24);
    intakePlenumGeo.rotateX(Math.PI / 2);
    const intakePlenumMesh = new THREE.Mesh(intakePlenumGeo, materials.intake);
    intakePlenumMesh.position.set(0, 0.9, 0);
    fuelGroup.add(intakePlenumMesh);

    // Individual Runner Tubes to Cylinder Heads
    cylinderSpecs.forEach((cyl) => {
      const runnerGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16);
      runnerGeo.rotateZ(0.6 * cyl.xSign);
      const runnerMesh = new THREE.Mesh(runnerGeo, materials.intake);
      runnerMesh.position.set(0.55 * cyl.xSign, 0.5, cyl.z);
      fuelGroup.add(runnerMesh);
    });

    // 6. TUNED EXHAUST SYSTEM (Headers Wrapping Beneath)
    cylinderSpecs.forEach((cyl) => {
      const headerGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.4, 16);
      headerGeo.rotateZ(-0.45 * cyl.xSign);
      headerGeo.rotateX(-0.3);
      const headerMesh = new THREE.Mesh(headerGeo, materials.exhaust);
      headerMesh.position.set(0.65 * cyl.xSign, -0.55, cyl.z - 0.2);
      headerMesh.castShadow = true;
      coolingGroup.add(headerMesh);
    });

    // Add all subsystem groups into engine root
    engineRoot.add(cylinderGroup);
    engineRoot.add(coolingGroup);
    engineRoot.add(lubricationGroup);
    engineRoot.add(fuelGroup);
    engineRoot.add(electricalGroup);
    engineRoot.add(turboGroup);

    return engineRoot;
  };

  // Re-build or update engine model when style or exploded view changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing engine model if present
    if (engineRootRef.current) {
      scene.remove(engineRootRef.current);
      engineRootRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Build new engine model
    const materials = createMaterials(renderStyle);
    const newEngine = buildDroneEngine(materials, localExploded);
    engineRootRef.current = newEngine;
    scene.add(newEngine);

    updateSubsystemHighlights();
  }, [renderStyle, localExploded]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070b16);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 1.5, controlsRef.current.zoom);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Key Light (Warm Studio Key Spotlight)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.0);
    keyLight.position.set(-6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (Cool Drone Tactical Cyan Fill)
    const fillLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    fillLight.position.set(7, 4, -4);
    scene.add(fillLight);

    // Top Overhead Rim Light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // Bottom Ambient Floor Bounce Light
    const groundBounce = new THREE.DirectionalLight(0x0053db, 0.9);
    groundBounce.position.set(0, -6, 2);
    scene.add(groundBounce);

    // Ground Shadow Plate
    const shadowGeo = new THREE.CircleGeometry(4.8, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x020408, transparent: true, opacity: 0.65 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -1.35, 0);
    scene.add(shadowMesh);

    // 5. Initial Engine Build
    const materials = createMaterials(renderStyle);
    const engineRoot = buildDroneEngine(materials, localExploded);
    engineRootRef.current = engineRoot;
    scene.add(engineRoot);
    updateSubsystemHighlights();

    // 6. Mouse / Touch Orbit Interaction
    const handleMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevX;
      const deltaY = e.clientY - controlsRef.current.prevY;
      controlsRef.current.targetRotY += deltaX * 0.007;
      controlsRef.current.targetRotX += deltaY * 0.007;
      controlsRef.current.targetRotX = Math.max(-0.6, Math.min(1.1, controlsRef.current.targetRotX));
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.zoom = Math.min(14, Math.max(3.8, controlsRef.current.zoom + e.deltaY * 0.006));
    };

    // Touch event support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        controlsRef.current.isDragging = true;
        controlsRef.current.prevX = e.touches[0].clientX;
        controlsRef.current.prevY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!controlsRef.current.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - controlsRef.current.prevX;
      const deltaY = e.touches[0].clientY - controlsRef.current.prevY;
      controlsRef.current.targetRotY += deltaX * 0.008;
      controlsRef.current.targetRotX += deltaY * 0.008;
      controlsRef.current.targetRotX = Math.max(-0.6, Math.min(1.1, controlsRef.current.targetRotX));
      controlsRef.current.prevX = e.touches[0].clientX;
      controlsRef.current.prevY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      controlsRef.current.isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. 60 FPS Render & Animation Loop
    let crankAngle = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Compute dynamic rotation speed from live telemetry RPM
      const currentRpm = rpmRef.current || 2450;
      const rotationSpeed = (currentRpm / 60) * 0.06;
      crankAngle += rotationSpeed;

      // Rotate Propeller (Rotax reduction gearbox ratio 2.43:1)
      if (movingPartsRef.current.propellerGroup) {
        movingPartsRef.current.propellerGroup.rotation.z += rotationSpeed / 2.43;
      }

      // Reciprocate Opposed Pistons & Connecting Rods
      const pistons = movingPartsRef.current.pistons;
      const conRods = movingPartsRef.current.conRods;
      const bores = movingPartsRef.current.pistonBores;

      if (pistons && bores && conRods) {
        const strokeAmplitude = 0.18; // Stroke length
        pistons.forEach((piston, idx) => {
          const bore = bores[idx];
          if (bore) {
            // Cylinders 1&2 vs 3&4 are phased 180 degrees apart
            const phase = idx % 2 === 0 ? 0 : Math.PI;
            const displacement = Math.cos(crankAngle + phase) * strokeAmplitude * bore.dir;
            piston.position.x = bore.x + displacement;

            // Connecting rod tracks piston pin
            if (conRods[idx]) {
              conRods[idx].position.x = bore.x + displacement * 0.5 - 0.4 * bore.dir;
              conRods[idx].rotation.z = Math.sin(crankAngle + phase) * 0.12 * bore.dir;
            }
          }
        });
      }

      // Smooth Camera Positioning & Orbit Interpolation
      const ctrl = controlsRef.current;
      const cam = cameraRef.current;
      if (cam) {
        const radius = ctrl.zoom;
        const targetX = radius * Math.sin(ctrl.targetRotY) * Math.cos(ctrl.targetRotX);
        const targetY = radius * Math.sin(ctrl.targetRotX);
        const targetZ = radius * Math.cos(ctrl.targetRotY) * Math.cos(ctrl.targetRotX);

        cam.position.x += (targetX - cam.position.x) * 0.12;
        cam.position.y += (targetY - cam.position.y) * 0.12;
        cam.position.z += (targetZ - cam.position.z) * 0.12;
        cam.lookAt(ctrl.targetPanX, ctrl.targetPanY + 0.1, 0);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanup resources
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  // View Preset Handler
  const handleApplyPreset = (preset: DroneViewPreset) => {
    setViewPreset(preset);
    const ctrl = controlsRef.current;
    switch (preset) {
      case 'iso':
        ctrl.targetRotX = 0.32;
        ctrl.targetRotY = -0.65;
        ctrl.zoom = 7.2;
        break;
      case 'front_prop':
        ctrl.targetRotX = 0.05;
        ctrl.targetRotY = 0.0;
        ctrl.zoom = 5.8;
        break;
      case 'cylinder_heads':
        ctrl.targetRotX = 0.2;
        ctrl.targetRotY = -Math.PI / 2;
        ctrl.zoom = 5.2;
        break;
      case 'turbo':
        ctrl.targetRotX = 0.35;
        ctrl.targetRotY = Math.PI - 0.3;
        ctrl.zoom = 5.6;
        break;
      case 'top_plan':
        ctrl.targetRotX = 1.05;
        ctrl.targetRotY = 0.0;
        ctrl.zoom = 8.0;
        break;
    }
  };

  const handleResetCamera = () => {
    handleApplyPreset('iso');
  };

  const handleExplodeToggle = () => {
    setLocalExploded((prev) => (prev > 0 ? 0 : 55));
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#070b16] border border-[#00f0ff]/30 shadow-2xl flex flex-col select-none ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 1. TOP TACTICAL HUD CONTROL STRIP */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Engine Architecture Badge & Live RPM */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#090e1b]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#00f0ff]/30 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <span className="font-mono text-xs font-bold text-[#dee2f5] tracking-wider uppercase">
            ROTAX 915 iS // BOXER-4
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-bold">
            {rpm.toLocaleString()} RPM
          </span>
        </div>

        {/* Right: Presets, Styles, Explode & Reset */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#090e1b]/90 backdrop-blur-md p-1 rounded-xl border border-[#3b494b]/40 shadow-lg">
          {/* Preset Selector */}
          <div className="flex items-center gap-1 border-r border-[#3b494b]/40 pr-1.5">
            <button
              onClick={() => handleApplyPreset('iso')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                viewPreset === 'iso' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Isometric 3D View"
            >
              ISO
            </button>
            <button
              onClick={() => handleApplyPreset('front_prop')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                viewPreset === 'front_prop' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Front Propeller Drive"
            >
              PROP
            </button>
            <button
              onClick={() => handleApplyPreset('cylinder_heads')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                viewPreset === 'cylinder_heads' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Opposed Cylinder Heads"
            >
              CYLS
            </button>
            <button
              onClick={() => handleApplyPreset('turbo')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                viewPreset === 'turbo' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Aft Turbocharger"
            >
              TURBO
            </button>
          </div>

          {/* Render Style Toggle */}
          <div className="flex items-center gap-1 border-r border-[#3b494b]/40 pr-1.5">
            <button
              onClick={() => setRenderStyle('metallic_pbr')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                renderStyle === 'metallic_pbr' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="PBR Studio Shading"
            >
              PBR
            </button>
            <button
              onClick={() => setRenderStyle('clay_cad')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                renderStyle === 'clay_cad' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Clay CAD Studio View"
            >
              CLAY
            </button>
            <button
              onClick={() => setRenderStyle('holo')}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                renderStyle === 'holo' ? 'bg-[#00f0ff] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
              title="Holographic Wireframe"
            >
              HOLO
            </button>
          </div>

          {/* Exploded View Toggle */}
          <button
            onClick={handleExplodeToggle}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              localExploded > 0 ? 'bg-[#f59e0b] text-[#090e1b]' : 'text-[#849495] hover:text-[#dee2f5]'
            }`}
            title="Toggle Exploded Assembly View"
          >
            EXPLODE
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="p-1 rounded text-[#849495] hover:text-[#00f0ff] transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-[#849495] hover:text-[#00f0ff] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. THREE.JS WEBGL CANVAS VIEWPORT */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* 3. BOTTOM SUBSYSTEM QUICK SELECTOR BAR */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Quick Component Highlights */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto bg-[#090e1b]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#3b494b]/40 shadow-lg">
          <span className="font-mono text-[9px] text-[#849495] uppercase font-bold px-1.5">
            COMPONENTS:
          </span>
          {[
            { id: 'cylinder', label: 'Cylinders' },
            { id: 'cooling', label: 'Cooling Fins' },
            { id: 'lubrication', label: 'Oil Sump' },
            { id: 'fuel', label: 'Fuel Rail' },
            { id: 'electrical', label: 'Dual Spark' },
            { id: 'turbocharger', label: 'Turbo Core' },
          ].map((sub) => {
            const isSelected = selectedSubsystemId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubsystem && onSelectSubsystem(sub.id as SubsystemId)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00f0ff] text-[#090e1b] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-[#849495] hover:text-[#dee2f5] hover:bg-[#161b29]'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>

        {/* Telemetry Micro-Stat */}
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto bg-[#090e1b]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-[#3b494b]/40 shadow-lg text-[10px] font-mono text-[#849495]">
          <span>CHT PEAK: <strong className="text-[#00f0ff]">{Math.round(chtPeak)}°C</strong></span>
          <span>SPREAD: <strong className="text-[#38bdf8]">±{chtSpread.toFixed(1)}°C</strong></span>
        </div>
      </div>
    </div>
  );
};

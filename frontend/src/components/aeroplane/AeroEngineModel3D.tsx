import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  AeroCategory,
  AeroEngineCatalogEntry,
  AeroTelemetryRecord,
} from '../../services/aeroApi';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Info,
  Flame,
  Gauge,
  Camera,
  Compass,
  Tag,
  CheckCircle2,
  Sliders,
  Zap,
} from 'lucide-react';

interface AeroEngineModel3DProps {
  engine: AeroEngineCatalogEntry;
  telemetry: AeroTelemetryRecord | null;
  selectedComponentId?: string | null;
  onSelectComponent?: (componentId: string) => void;
  height?: string;
}

export type AeroViewPreset =
  | 'iso'
  | 'front_fan'
  | 'core_combustor'
  | 'turbines'
  | 'accessories'
  | 'side_profile'
  | 'top_plan';

export type AeroRenderStyle = 'metallic_pbr' | 'clay_cad' | 'xray_ghost';

interface EngineFeatureCallout {
  title: string;
  badge: string;
  color: string;
  description: string;
  componentId: string;
}

const AERO_ARCHITECTURE_CALLOUTS: Record<string, EngineFeatureCallout[]> = {
  'AERO-CFM-CFM56-7B': [
    { title: '24 Wide-Chord Titanium Fan', badge: '24 Titanium Fan Blades', color: '#38bdf8', description: 'Solid titanium wide-chord fan blades with white painted anti-bird vortex spiral on nose spinner.', componentId: 'fan_assembly' },
    { title: '9-Stage HP Compressor & VSVs', badge: '9-Stage Axial HPC + VSV', color: '#0284c7', description: 'Variable stator vane (VSV) unison rings regulating pressure ratio up to 32.7:1.', componentId: 'high_pressure_compressor' },
    { title: 'Annular Low-Emissions Combustor', badge: 'Annular Combustor (20 Nozzles)', color: '#f59e0b', description: 'Dual-cone fuel spray nozzles providing low-smoke, high-temperature combustion core.', componentId: 'combustor' },
    { title: '1-Stage HPT + 4-Stage LPT', badge: 'Single-Crystal HPT Rotor', color: '#ef4444', description: 'Internally air-cooled turbine blades with ceramic thermal barrier coatings (TBC).', componentId: 'high_pressure_turbine' },
    { title: 'Full Accessory Gearbox (AGB)', badge: 'Fan-Mounted AGB & IDG', color: '#10b981', description: 'Radial drive shaft transferring core power to fuel pump, IDG alternator, and oil scavenge unit.', componentId: 'lubrication_system' },
  ],
  'AERO-CFM-LEAP-1A': [
    { title: '18 3D-Woven RTM Carbon Blades', badge: '3D Woven Carbon Fiber Fan', color: '#38bdf8', description: 'Ultra-lightweight resin transfer molded (RTM) composite fan with polished titanium leading edges.', componentId: 'fan_assembly' },
    { title: 'Twin-Annular Pre-Swirl (TAPS II)', badge: 'TAPS II Low-NOx Combustor', color: '#f59e0b', description: 'Lean-burn pre-mixing technology slashing NOx emissions by 50% below CAEP/6.', componentId: 'combustor' },
    { title: 'Ceramic Matrix Composite Shrouds', badge: 'CMC Turbine Shrouds', color: '#10b981', description: 'Revolutionary silicon carbide matrix enduring 1300°C without cooling air penalty.', componentId: 'high_pressure_turbine' },
    { title: 'Aerodynamic Chevron Nacelle', badge: 'Serrated Chevron Nozzle', color: '#06b6d4', description: 'Noise-suppressing trailing-edge chevrons mixing core and bypass streams smoothly.', componentId: 'exhaust_nozzle' },
    { title: 'Perforated Acoustic Barrel', badge: 'Composite Acoustic Liner', color: '#818cf8', description: 'Sound-dampening micro-perforated composite liner lining the fan intake barrel.', componentId: 'nacelle_cowling' },
  ],
  'AERO-PW-1100G': [
    { title: 'Fan Drive Gear System (FDGS)', badge: '3:1 Planetary Gearbox', color: '#f59e0b', description: 'High-power epicyclic reduction gear decoupling low-speed fan from high-speed turbine.', componentId: 'fan_assembly' },
    { title: 'Ultra-High Bypass 81" Rotor', badge: '12.5:1 Bypass Ratio', color: '#38bdf8', description: 'Enormous cold bypass airflow delivering 16% fuel burn reduction on A320neo.', componentId: 'fan_assembly' },
    { title: 'High-Speed 3-Stage LPT', badge: 'High-Speed Compact LPT', color: '#ef4444', description: 'Fewer turbine stages spinning at 3x higher RPM for unprecedented efficiency.', componentId: 'low_pressure_turbine' },
    { title: 'Talon X Combustor Core', badge: 'Talon X Low-Smoke Core', color: '#f97316', description: 'Advanced fuel staging injectors preventing coking and emissions.', componentId: 'combustor' },
  ],
  'AERO-GE-GE90-115B': [
    { title: 'World Record 128" Composite Fan', badge: '128-Inch Swept Fan', color: '#38bdf8', description: 'Massive 3D curved carbon-composite fan blades producing up to 115,300 lbf thrust.', componentId: 'fan_assembly' },
    { title: '10-Stage High Pressure Drum', badge: '10-Stage High-Pressure Core', color: '#0284c7', description: 'High-compression titanium rotor drum generating an overall pressure ratio of 42:1.', componentId: 'high_pressure_compressor' },
    { title: 'Heavy-Duty 777 Pylon Struts', badge: 'Forged Titanium Mounts', color: '#94a3b8', description: 'Reinforced forged titanium engine mounts transferring massive forward thrust.', componentId: 'nacelle_cowling' },
    { title: '6-Stage Low-Pressure Turbine', badge: '6-Stage Giant LPT Drum', color: '#ef4444', description: 'Expansive multi-stage low-pressure turbine extracting peak thermodynamic energy.', componentId: 'low_pressure_turbine' },
  ],
  'AERO-PWC-PT6A-67P': [
    { title: 'Reverse-Flow Airflow Architecture', badge: 'Reverse-Flow Air Inlet', color: '#38bdf8', description: 'Air enters through protective screen at the REAR and flows forward to combustion.', componentId: 'gas_generator' },
    { title: 'Bifurcated Exhaust Stubs', badge: 'Twin Forward Exhaust Stubs', color: '#f59e0b', description: 'Dual stainless steel exhaust pipes exiting forward on left and right fuselage sides.', componentId: 'combustor' },
    { title: '5-Blade Hartzell Composite Prop', badge: '5-Blade Hartzell Scimitar', color: '#10b981', description: 'Full-feathering reversible constant-speed propeller with electric de-ice boots and spinner.', componentId: 'propeller_assembly' },
    { title: 'Two-Stage Free Power Turbine', badge: 'Independent Power Turbine', color: '#ef4444', description: 'Thermally driven power turbine mechanically isolated from compressor spool.', componentId: 'power_turbine' },
    { title: 'Front Planetary Reduction Gear', badge: 'Torquemeter Gearbox (RGB)', color: '#06b6d4', description: 'Helical epicyclic planetary reduction stepping 30,000 RPM down to 1700 prop RPM.', componentId: 'reduction_gearbox' },
  ],
  'AERO-HON-TPE331': [
    { title: 'Single-Shaft Direct Drive', badge: 'Fixed-Shaft Turboprop', color: '#f59e0b', description: 'Compressor, turbine, and reduction gears coupled on a rigid single mechanical shaft.', componentId: 'gas_generator' },
    { title: 'Direct Chin Ram Air Intake', badge: 'Forward Chin Scoop', color: '#38bdf8', description: 'Direct frontal air scoop routing high-energy ram air into first centrifugal impeller.', componentId: 'gas_generator' },
    { title: 'Dual Centrifugal Compressors', badge: '2-Stage Centrifugal Impellers', color: '#0284c7', description: 'Tough titanium centrifugal impellers resistant to dust and foreign object damage.', componentId: 'gas_generator' },
    { title: 'Negative Torque Sensing (NTS)', badge: 'NTS Safety Gearbox', color: '#ef4444', description: 'Automatic mechanical feathering sensor guarding against in-flight engine drag.', componentId: 'reduction_gearbox' },
  ],
  'AERO-GE-CATALYST': [
    { title: '3D-Printed Titanium Architecture', badge: 'Additive Manufactured Core', color: '#38bdf8', description: 'Over 850 individual components consolidated into complex organic 3D-printed titanium casings.', componentId: 'gas_generator' },
    { title: 'Full FADEC Prop & Engine Control', badge: 'Single-Lever FADEC Control', color: '#10b981', description: 'Cockpit electronic jet-like single lever governing power, prop pitch, and fuel flow.', componentId: 'fadec_sensors' },
    { title: '4-Stage Axial + 1 Centrifugal', badge: '16:1 Overall Pressure Ratio', color: '#0284c7', description: 'Modern aerodynamics delivering 18% lower SFC than legacy turboprops.', componentId: 'gas_generator' },
    { title: 'Cooled High-Pressure Turbine', badge: 'Cooled HPT Stage', color: '#ef4444', description: 'First turboprop in its class to feature cooled single-crystal turbine blades.', componentId: 'power_turbine' },
  ],
  'AERO-LYC-IO360': [
    { title: '4 Horizontally Opposed Cylinders', badge: 'Air-Cooled Finned Barrels', color: '#38bdf8', description: 'Dense aluminum cooling fins dissipating combustion heat via dynamic prop wash.', componentId: 'cylinders' },
    { title: 'Bendix RSA Fuel Injection Spider', badge: 'Continuous Multiport Spider', color: '#10b981', description: 'Underbody fuel metering servo delivering precise fuel via spider lines to each head.', componentId: 'induction_manifold' },
    { title: 'Dual Slick Aircraft Magnetos', badge: 'Dual Independent Magnetos', color: '#f59e0b', description: 'Completely engine-driven self-powered ignition independent of aircraft battery.', componentId: 'pistons_crank' },
    { title: 'Tuned Stainless 4-into-1 Headers', badge: 'Stainless Exhaust Collector', color: '#f43f5e', description: 'Tubular stainless exhaust runners converging into cabin heat shroud and muffler.', componentId: 'exhaust_system' },
    { title: 'Dual Top & Bottom Spark Plugs', badge: '8 Shielded Spark Plugs', color: '#818cf8', description: 'Two spark plugs per cylinder head wired through copper braided ignition harness conduits.', componentId: 'cylinders' },
  ],
  'AERO-CONT-O200': [
    { title: 'Classic Flat-4 Naturally Aspirated', badge: 'Classic 100 BHP Boxer', color: '#38bdf8', description: 'Direct drive 2750 RPM lightweight crankcase powering Cessna 150 trainers.', componentId: 'cylinders' },
    { title: 'Bottom Updraft Carburetor', badge: 'Marvel-Schebler Carburetor', color: '#f59e0b', description: 'Updraft float-type carburetor with intake spider runner tubes below crankcase.', componentId: 'induction_manifold' },
    { title: 'Chrome Pushrod Shroud Tubes', badge: 'Cadmium Pushrod Tubes', color: '#cbd5e1', description: 'Overhead valve pushrod shrouds routing from central camshaft to cylinder heads.', componentId: 'pistons_crank' },
    { title: 'Fixed-Pitch Wood/Alloy Propeller', badge: '2-Blade Sensenich Prop', color: '#10b981', description: 'Fixed-pitch aerodynamic propeller with safety-wired hub bolts.', componentId: 'cylinders' },
  ],
  'AERO-ROTAX-915IS': [
    { title: 'Liquid-Cooled Heads + Air Barrels', badge: 'Dual Radiator Liquid Cooling', color: '#06b6d4', description: 'Water-cooled cylinder heads with front radiator, fan, and coolant expansion bottle.', componentId: 'cylinders' },
    { title: 'Turbocharger & Intercooler', badge: 'Garrett Turbo + Intercooler', color: '#ef4444', description: 'Exhaust turbocharger maintaining full 141 BHP sea-level power up to 15,000 ft.', componentId: 'induction_manifold' },
    { title: 'Integrated Reduction Gearbox', badge: '2.54:1 Slipper Gearbox', color: '#f59e0b', description: 'High-RPM engine (5800 RPM) stepped down to smooth 2280 propeller RPM.', componentId: 'pistons_crank' },
    { title: 'Dry Sump External Oil Reservoir', badge: 'Dry Sump Tank & Hoses', color: '#10b981', description: 'External aluminum oil tank with silicone lines preventing oil starvation in G-turns.', componentId: 'lubrication_system' },
    { title: 'Redundant Dual FADEC ECUs', badge: 'Lane A / Lane B FADEC', color: '#10b981', description: 'Dual electronic engine control computers with multi-pin aeronautical gold connectors.', componentId: 'induction_manifold' },
  ],
  'AERO-GE-J85-21': [
    { title: 'Supersonic Afterburner Augmentor', badge: 'Reheat Stage & Spray Bars', color: '#ef4444', description: 'Radial fuel spray rings and V-gutter flameholders injecting raw fuel into jet exhaust.', componentId: 'exhaust_nozzle' },
    { title: 'Articulated Convergent Nozzle', badge: '16 Variable Titanium Petals', color: '#f59e0b', description: 'Hydraulically actuated overlapping petals modulating exhaust throat area.', componentId: 'exhaust_nozzle' },
    { title: '8-Stage Axial Compressor Drum', badge: '8-Stage Axial Drum + Bleeds', color: '#38bdf8', description: 'High power-to-weight ratio axial compressor drum spinning up to 16,500 RPM.', componentId: 'axial_compressor' },
    { title: 'Inlet Guide Vanes & Bullet Cone', badge: 'Variable IGV Bullet Ring', color: '#0284c7', description: 'Center fairing bullet with anti-ice strut and variable inlet guide vanes.', componentId: 'inlet_guide_vanes' },
  ],
  'AERO-RR-VIPER-601': [
    { title: 'Cast Magnesium Air Intake Ring', badge: 'Magnesium Inlet Bullet', color: '#94a3b8', description: 'Aerodynamic central starter bullet surrounded by fixed inlet guide vanes.', componentId: 'inlet_guide_vanes' },
    { title: 'Annular Vaporizer Combustor', badge: '24 Walking-Stick Vaporizers', color: '#f59e0b', description: 'Classic British J-shaped fuel vaporizer tubes promoting complete combustion.', componentId: 'combustor' },
    { title: 'Fixed Conical Jet Exhaust Pipe', badge: 'Conical Stainless Jet Pipe', color: '#0284c7', description: 'Straight-through high-velocity propulsion nozzle without afterburner complexity.', componentId: 'exhaust_nozzle' },
    { title: 'Single-Stage High-Temp Turbine', badge: 'Air-Cooled HPT Rotor', color: '#ef4444', description: 'Solid nickel alloy turbine with high creep-strength blades.', componentId: 'turbine_stage' },
  ],
};

export const AeroEngineModel3D: React.FC<AeroEngineModel3DProps> = ({
  engine,
  telemetry,
  selectedComponentId,
  onSelectComponent,
  height = '530px',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedView, setExplodedView] = useState(false);
  const [explodeFactor, setExplodeFactor] = useState(0.0);
  const [showNacelle, setShowNacelle] = useState(true);
  const [renderStyle, setRenderStyle] = useState<AeroRenderStyle>('metallic_pbr');
  const [showCalloutPins, setShowCalloutPins] = useState(true);
  const [useSchematicFallback, setUseSchematicFallback] = useState(false);
  const [viewPreset, setViewPreset] = useState<AeroViewPreset>('iso');

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rootEngineGroupRef = useRef<THREE.Group | null>(null);

  // Component meshes registry for highlighting and diagnostics
  const interactivePartsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Exploded transform registration
  const explodablePartsRef = useRef<Array<{
    object: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
    maxDist: number;
  }>>([]);

  // Rotating & dynamic mechanical parts
  const fanGroupRef = useRef<THREE.Group | null>(null);
  const fanGearboxRef = useRef<THREE.Group | null>(null);
  const coreSpoolRef = useRef<THREE.Group | null>(null);
  const propGroupRef = useRef<THREE.Group | null>(null);
  const crankGroupRef = useRef<THREE.Group | null>(null);
  const pistonsRef = useRef<Array<{ mesh: THREE.Mesh; sign: number; phase: number; baseX: number }>>([]);
  const flameCoreRef = useRef<THREE.Mesh | null>(null);
  const combustorLightRef = useRef<THREE.PointLight | null>(null);
  const afterburnerGlowRef = useRef<THREE.PointLight | null>(null);
  const afterburnerShockDiamondsRef = useRef<THREE.Group | null>(null);
  const nozzlePetalsRef = useRef<Array<{ mesh: THREE.Mesh; baseRotX: number }>>([]);

  // Orbit camera controls state
  const controlsRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 4.2,
    radius: 9.2,
    targetTheta: Math.PI / 4,
    targetPhi: Math.PI / 4.2,
    targetRadius: 9.2,
  });

  const category = engine.category;
  const engineId = engine.engine_id;
  const callouts = AERO_ARCHITECTURE_CALLOUTS[engineId] || AERO_ARCHITECTURE_CALLOUTS['AERO-CFM-CFM56-7B'];

  // Handle Explode Animation Factor
  useEffect(() => {
    let animId: number;
    const target = explodedView ? 1.0 : 0.0;
    const step = () => {
      setExplodeFactor((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * 0.12;
      });
      if (Math.abs(target - explodeFactor) >= 0.01) {
        animId = requestAnimationFrame(step);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [explodedView]);

  // Apply Exploded Offset to Registered Meshes
  useEffect(() => {
    explodablePartsRef.current.forEach((item) => {
      const offset = item.explodeDir.clone().multiplyScalar(item.maxDist * explodeFactor);
      item.object.position.copy(item.basePos.clone().add(offset));
    });
  }, [explodeFactor]);

  // Highlight selected component in 3D
  useEffect(() => {
    if (!rootEngineGroupRef.current) return;
    interactivePartsRef.current.forEach((part, name) => {
      const isSelected = selectedComponentId === name;
      part.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (isSelected) {
              mesh.userData.origEmissive = mesh.userData.origEmissive || mat.emissive?.getHex() || 0x000000;
              mesh.userData.origEmissiveIntensity = mesh.userData.origEmissiveIntensity ?? mat.emissiveIntensity;
              mat.emissive = new THREE.Color(0x00f0ff);
              mat.emissiveIntensity = 0.85;
            } else if (mesh.userData.origEmissive !== undefined) {
              mat.emissive = new THREE.Color(mesh.userData.origEmissive);
              mat.emissiveIntensity = mesh.userData.origEmissiveIntensity;
            }
          }
        }
      });
    });
  }, [selectedComponentId]);

  // Apply Camera Presets
  const applyCameraPreset = (preset: AeroViewPreset) => {
    setViewPreset(preset);
    const c = controlsRef.current;
    if (preset === 'iso') {
      c.targetTheta = Math.PI / 4;
      c.targetPhi = Math.PI / 4.2;
      c.targetRadius = 9.2;
    } else if (preset === 'front_fan') {
      c.targetTheta = 0.02;
      c.targetPhi = Math.PI / 2.05;
      c.targetRadius = 5.8;
    } else if (preset === 'core_combustor') {
      c.targetTheta = Math.PI / 2.3;
      c.targetPhi = Math.PI / 3.0;
      c.targetRadius = 5.4;
    } else if (preset === 'turbines') {
      c.targetTheta = Math.PI * 0.95;
      c.targetPhi = Math.PI / 2.4;
      c.targetRadius = 6.2;
    } else if (preset === 'accessories') {
      c.targetTheta = -Math.PI / 3.0;
      c.targetPhi = Math.PI / 1.7;
      c.targetRadius = 5.0;
    } else if (preset === 'side_profile') {
      c.targetTheta = Math.PI / 2;
      c.targetPhi = Math.PI / 2;
      c.targetRadius = 8.5;
    } else if (preset === 'top_plan') {
      c.targetTheta = 0.01;
      c.targetPhi = 0.12;
      c.targetRadius = 9.5;
    }
  };

  // 1. Build and Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container || useSchematicFallback) return;

    // A. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      rendererRef.current = renderer;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init failed, using schematic fallback', e);
      setUseSchematicFallback(true);
      return;
    }

    // B. Aerospace Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.95);
    scene.add(ambientLight);

    const keySun = new THREE.DirectionalLight(0xffffff, 2.8);
    keySun.position.set(8, 12, 10);
    keySun.castShadow = true;
    keySun.shadow.mapSize.width = 1024;
    keySun.shadow.mapSize.height = 1024;
    scene.add(keySun);

    const fillCyan = new THREE.DirectionalLight(0x38bdf8, 1.8);
    fillCyan.position.set(-10, -3, -6);
    scene.add(fillCyan);

    const rimWhite = new THREE.DirectionalLight(0xffffff, 2.0);
    rimWhite.position.set(0, 10, -12);
    scene.add(rimWhite);

    const underWarm = new THREE.DirectionalLight(0xf59e0b, 1.1);
    underWarm.position.set(0, -6, 2);
    scene.add(underWarm);

    // Dynamic combustion thermal point light
    const combLight = new THREE.PointLight(0xff5500, 2.4, 8, 1.8);
    combLight.position.set(0, 0, -0.4);
    scene.add(combLight);
    combustorLightRef.current = combLight;

    // Afterburner reheat glow light
    const abLight = new THREE.PointLight(0x00f0ff, 0.0, 12, 1.5);
    abLight.position.set(0, 0, -2.8);
    scene.add(abLight);
    afterburnerGlowRef.current = abLight;

    // Floor Reflection Grid
    const floorGrid = new THREE.GridHelper(22, 36, 0x0284c7, 0x1e293b);
    floorGrid.position.y = -2.6;
    scene.add(floorGrid);

    // Ground Contact Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(4.8, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x02040a, transparent: true, opacity: 0.65 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -2.58;
    scene.add(shadowMesh);

    // C. Aerospace Materials Library
    const isClay = renderStyle === 'clay_cad';
    const isGhost = renderStyle === 'xray_ghost';

    const matPolishedChrome = new THREE.MeshStandardMaterial({
      color: isClay ? 0xd1d5db : 0xf8fafc,
      metalness: isClay ? 0.2 : 0.98,
      roughness: isClay ? 0.6 : 0.08,
      wireframe: isGhost,
      transparent: isGhost,
      opacity: isGhost ? 0.45 : 1.0,
    });

    const matTitaniumFan = new THREE.MeshStandardMaterial({
      color: isClay ? 0x9ca3af : 0x94a3b8,
      metalness: isClay ? 0.2 : 0.88,
      roughness: isClay ? 0.7 : 0.22,
      wireframe: isGhost,
      transparent: isGhost,
      opacity: isGhost ? 0.5 : 1.0,
    });

    const matCarbonComposite = new THREE.MeshStandardMaterial({
      color: isClay ? 0x4b5563 : 0x18181b,
      metalness: isClay ? 0.1 : 0.35,
      roughness: 0.5,
      wireframe: isGhost,
    });

    const matGoldAlloy = new THREE.MeshStandardMaterial({
      color: isClay ? 0xf59e0b : 0xd97706,
      metalness: isClay ? 0.3 : 0.88,
      roughness: isClay ? 0.5 : 0.22,
    });

    const matHeatBlued = new THREE.MeshStandardMaterial({
      color: isClay ? 0x64748b : 0x312e81, // Tempered heat-blued titanium
      metalness: 0.92,
      roughness: 0.22,
    });

    const matCombustorLiner = new THREE.MeshStandardMaterial({
      color: isClay ? 0x94a3b8 : 0x475569,
      metalness: 0.8,
      roughness: 0.35,
    });

    const matCeramicTBC = new THREE.MeshStandardMaterial({
      color: isClay ? 0xe2e8f0 : 0xfef08a, // Pale ivory / ceramic thermal barrier coating
      metalness: 0.25,
      roughness: 0.45,
    });

    const matNacelle = new THREE.MeshStandardMaterial({
      color: 0x0a1128,
      metalness: 0.45,
      roughness: 0.32,
      transparent: true,
      opacity: showNacelle ? 0.28 : 0.04,
      side: THREE.DoubleSide,
      wireframe: isGhost,
    });

    const matFlame = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff4500,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.88,
    });

    const matStainlessTubing = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });

    const matOrangeWiring = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.15,
      roughness: 0.4,
    });

    const matRotaxRed = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Rotax powder-coated rocker red
      metalness: 0.55,
      roughness: 0.3,
    });

    const matPropYellowTip = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Yellow high-vis blade tips
      metalness: 0.2,
      roughness: 0.4,
    });

    // Reset Registries
    interactivePartsRef.current.clear();
    explodablePartsRef.current = [];
    pistonsRef.current = [];
    nozzlePetalsRef.current = [];

    const rootEngineGroup = new THREE.Group();
    rootEngineGroup.name = 'EngineRoot';
    scene.add(rootEngineGroup);
    rootEngineGroupRef.current = rootEngineGroup;

    // Helper: Register Explodable Component
    const registerExplodable = (
      obj: THREE.Object3D,
      dir: THREE.Vector3,
      maxDist: number
    ) => {
      explodablePartsRef.current.push({
        object: obj,
        basePos: obj.position.clone(),
        explodeDir: dir.normalize(),
        maxDist,
      });
    };

    // Helper: Procedural Aerofoil Blade
    const createAerofoilBlade = (
      length: number,
      rootChord: number,
      tipChord: number,
      twistAngleRad: number,
      mat: THREE.Material
    ) => {
      const bladeGroup = new THREE.Group();
      const segments = 6;
      for (let s = 0; s < segments; s++) {
        const t = s / segments;
        const segChord = rootChord * (1 - t) + tipChord * t;
        const segLen = length / segments;
        const segGeo = new THREE.BoxGeometry(segChord, segLen, 0.035 * (1 - t * 0.4));
        const segMesh = new THREE.Mesh(segGeo, mat);
        segMesh.position.y = (s + 0.5) * segLen;
        segMesh.rotation.y = t * twistAngleRad;
        segMesh.castShadow = true;
        bladeGroup.add(segMesh);
      }
      return bladeGroup;
    };

    // Helper: Procedural White Painted Vortex Spiral on Spinner Cone
    const addSpinnerSpiral = (parent: THREE.Object3D, radius: number, length: number) => {
      const points: THREE.Vector3[] = [];
      const turns = 2.4;
      const count = 48;
      for (let p = 0; p <= count; p++) {
        const u = p / count;
        const angle = u * Math.PI * 2 * turns;
        const r = (1 - u) * radius * 0.95;
        const z = u * length;
        points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.015, 6, false);
      const spiralMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const spiralMesh = new THREE.Mesh(tubeGeo, spiralMat);
      parent.add(spiralMesh);
    };

    // -------------------------------------------------------------------------
    // D. HIGH-FIDELITY ENGINE GEOMETRY IMPLEMENTATIONS
    // -------------------------------------------------------------------------

    if (category === AeroCategory.TURBOFAN) {
      // -----------------------------------------------------------------------
      // TURBOFAN ENGINES (CFM56-7B, LEAP-1A, PW1100G GTF, GE90-115B)
      // -----------------------------------------------------------------------
      const isLeap = engineId === 'AERO-CFM-LEAP-1A';
      const isGtf = engineId === 'AERO-PW-1100G';
      const isGe90 = engineId === 'AERO-GE-GE90-115B';

      const fanRadius = isGe90 ? 2.6 : isGtf ? 2.35 : isLeap ? 2.25 : 2.05;
      const bladeCount = isLeap ? 18 : isGtf ? 20 : isGe90 ? 22 : 24;

      // 1. Nacelle Cowling & Acoustic Liner Barrel
      const nacelleGroup = new THREE.Group();
      nacelleGroup.name = 'nacelle_cowling';

      // Outer Fan Cowl
      const nacelleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(fanRadius + 0.32, fanRadius + 0.12, 5.8, 48, 1, true),
        matNacelle
      );
      nacelleMesh.rotation.x = Math.PI / 2;
      nacelleGroup.add(nacelleMesh);

      // Polished Aluminum Intake Lip Ring
      const lipRing = new THREE.Mesh(
        new THREE.TorusGeometry(fanRadius + 0.32, 0.14, 20, 48),
        matPolishedChrome
      );
      lipRing.position.z = 2.9;
      nacelleGroup.add(lipRing);

      // Acoustic Liner Honeycomb Ring (Inside Fan Case)
      const acousticLiner = new THREE.Mesh(
        new THREE.CylinderGeometry(fanRadius + 0.02, fanRadius + 0.02, 1.2, 36, 1, true),
        matCarbonComposite
      );
      acousticLiner.rotation.x = Math.PI / 2;
      acousticLiner.position.z = 2.2;
      nacelleGroup.add(acousticLiner);

      // Outlet Guide Vanes (OGVs) - 36 Aerodynamic Stator Vanes across bypass duct
      for (let v = 0; v < 36; v++) {
        const ogv = new THREE.Mesh(new THREE.BoxGeometry(0.04, fanRadius * 0.42, 0.45), matTitaniumFan);
        const a = (v / 36) * Math.PI * 2;
        ogv.position.set(Math.cos(a) * (fanRadius - 0.35), Math.sin(a) * (fanRadius - 0.35), 0.9);
        ogv.rotation.z = a;
        ogv.rotation.x = 0.08;
        nacelleGroup.add(ogv);
      }

      // LEAP-1A Signature Noise Chevrons on Trailing Edge
      if (isLeap) {
        for (let c = 0; c < 24; c++) {
          const chev = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 3), matTitaniumFan);
          const ca = (c / 24) * Math.PI * 2;
          chev.position.set(Math.cos(ca) * (fanRadius + 0.12), Math.sin(ca) * (fanRadius + 0.12), -2.9);
          chev.rotation.z = ca + Math.PI;
          chev.rotation.x = -Math.PI / 2;
          nacelleGroup.add(chev);
        }
      }

      // Boeing 777 Pylon Strut Brackets (GE90)
      if (isGe90) {
        const pylonStrut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 3.2), matTitaniumFan);
        pylonStrut.position.set(0, fanRadius + 0.6, 0.2);
        nacelleGroup.add(pylonStrut);
      }

      rootEngineGroup.add(nacelleGroup);
      interactivePartsRef.current.set('nacelle_cowling', nacelleGroup);
      registerExplodable(nacelleGroup, new THREE.Vector3(0, 1, 0.3), 1.6);

      // 2. High-Fidelity Fan Assembly (N1 Spool)
      const fanGroup = new THREE.Group();
      fanGroup.name = 'fan_assembly';
      fanGroup.position.z = 2.3;

      // Titanium Fan Rotor Hub Disk
      const fanHubDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.4, 32), matTitaniumFan);
      fanHubDisk.rotation.x = Math.PI / 2;
      fanGroup.add(fanHubDisk);

      // Aerodynamic Elliptical Nose Spinner Cone
      const spinnerGroup = new THREE.Group();
      const spinnerMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.58, 1.45, 32),
        isLeap ? matCarbonComposite : matPolishedChrome
      );
      spinnerMesh.rotation.x = Math.PI / 2;
      spinnerMesh.position.z = 0.72;
      spinnerGroup.add(spinnerMesh);
      addSpinnerSpiral(spinnerGroup, 0.58, 1.45);
      fanGroup.add(spinnerGroup);

      // Precision Aerofoil Fan Blades with Progressive Twist & Dovetail Roots
      const bladeMat = isLeap || isGe90 ? matCarbonComposite : matTitaniumFan;
      const bladeLength = fanRadius * 0.94;
      for (let i = 0; i < bladeCount; i++) {
        const angle = (i / bladeCount) * Math.PI * 2;
        const blade = createAerofoilBlade(bladeLength, 0.32, 0.18, 0.42, bladeMat);
        blade.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0);
        blade.rotation.z = angle - Math.PI / 2;
        blade.rotation.x = 0.12;

        // LEAP-1A Titanium Leading-Edge Sheath Strip
        if (isLeap) {
          const titaniumEdge = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, bladeLength, 0.04),
            matPolishedChrome
          );
          titaniumEdge.position.set(0.12, bladeLength * 0.5, 0.02);
          blade.add(titaniumEdge);
        }

        // CFM56 Mid-Span Snubbers / Damper Pads
        if (!isLeap && !isGe90 && !isGtf) {
          const snubber = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.05), matTitaniumFan);
          snubber.position.set(0, bladeLength * 0.58, 0);
          blade.add(snubber);
        }

        fanGroup.add(blade);
      }
      rootEngineGroup.add(fanGroup);
      fanGroupRef.current = fanGroup;
      interactivePartsRef.current.set('fan_assembly', fanGroup);
      registerExplodable(fanGroup, new THREE.Vector3(0, 0, 1), 2.2);

      // PW1100G Fan Drive Gear System (FDGS) - 3:1 Planetary Gearbox
      if (isGtf) {
        const gearGroup = new THREE.Group();
        gearGroup.name = 'fan_gearbox';
        gearGroup.position.z = 1.45;

        const ringGear = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.12, 16, 32), matGoldAlloy);
        gearGroup.add(ringGear);

        // Sun Gear Center
        const sunGear = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 20), matTitaniumFan);
        sunGear.rotation.x = Math.PI / 2;
        gearGroup.add(sunGear);

        // 5 Epicyclic Planetary Gears
        for (let g = 0; g < 5; g++) {
          const ga = (g / 5) * Math.PI * 2;
          const planetGear = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 18), matPolishedChrome);
          planetGear.rotation.x = Math.PI / 2;
          planetGear.position.set(Math.cos(ga) * 0.46, Math.sin(ga) * 0.46, 0);
          gearGroup.add(planetGear);
        }
        rootEngineGroup.add(gearGroup);
        fanGearboxRef.current = gearGroup;
        registerExplodable(gearGroup, new THREE.Vector3(0, 0, 1), 1.4);
      }

      // 3. Core Low-Pressure Booster (LPC) & Splitter Fairing
      const boosterGroup = new THREE.Group();
      boosterGroup.position.z = 1.35;
      const splitterFairing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.78, 0.6, 32, 1, true),
        matTitaniumFan
      );
      splitterFairing.rotation.x = Math.PI / 2;
      boosterGroup.add(splitterFairing);

      // 3 Booster Blisk Stages
      for (let bs = 0; bs < 3; bs++) {
        const bDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 24), matTitaniumFan);
        bDisc.rotation.x = Math.PI / 2;
        bDisc.position.z = 0.15 - bs * 0.14;
        boosterGroup.add(bDisc);
      }
      rootEngineGroup.add(boosterGroup);
      registerExplodable(boosterGroup, new THREE.Vector3(0, 0, 1), 1.1);

      // 4. High-Pressure Compressor (HPC Drum Spool) + Variable Stator Vanes (VSVs)
      const hpcGroup = new THREE.Group();
      hpcGroup.name = 'high_pressure_compressor';
      hpcGroup.position.z = 0.45;

      const compShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.6, 24), matPolishedChrome);
      compShaft.rotation.x = Math.PI / 2;
      hpcGroup.add(compShaft);

      // 9-Stage or 10-Stage Axial Compression Discs
      const hpcStages = isGe90 ? 10 : 9;
      for (let s = 0; s < hpcStages; s++) {
        const zPos = 0.8 - s * 0.16;
        const rDisc = 0.92 - s * 0.038;
        const discMesh = new THREE.Mesh(new THREE.CylinderGeometry(rDisc, rDisc, 0.09, 28), matTitaniumFan);
        discMesh.rotation.x = Math.PI / 2;
        discMesh.position.z = zPos;
        hpcGroup.add(discMesh);

        // Blisk Blades on Disc Periphery
        for (let b = 0; b < 24; b++) {
          const ba = (b / 24) * Math.PI * 2;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.08), matTitaniumFan);
          blade.position.set(Math.cos(ba) * (rDisc + 0.06), Math.sin(ba) * (rDisc + 0.06), zPos);
          blade.rotation.z = ba + 0.35;
          hpcGroup.add(blade);
        }
      }

      // External Variable Stator Vane (VSV) Unison Rings & Actuator Linkages
      const vsvGroup = new THREE.Group();
      for (let v = 0; v < 4; v++) {
        const vz = 0.7 - v * 0.18;
        const vsvRing = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.025, 8, 36), matGoldAlloy);
        vsvRing.position.z = vz;
        vsvGroup.add(vsvRing);

        // Hydraulic Actuator Pushrod along top
        const pushrod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), matPolishedChrome);
        pushrod.position.set(0, 1.05, vz);
        vsvGroup.add(pushrod);
      }
      hpcGroup.add(vsvGroup);

      // 5th and 9th Stage Bleed Air Manifold Ducts
      const bleedDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 12), matStainlessTubing);
      bleedDuct.rotation.x = Math.PI / 2;
      bleedDuct.position.set(-0.85, 0.45, 0.1);
      hpcGroup.add(bleedDuct);

      rootEngineGroup.add(hpcGroup);
      coreSpoolRef.current = hpcGroup;
      interactivePartsRef.current.set('high_pressure_compressor', hpcGroup);

      // 5. Annular Combustion Chamber, Fuel Manifold & Igniters
      const combGroup = new THREE.Group();
      combGroup.name = 'combustor';
      combGroup.position.z = -0.65;

      const combustorLiner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.76, 0.72, 1.1, 32, 1, true),
        isLeap ? matCeramicTBC : matCombustorLiner
      );
      combustorLiner.rotation.x = Math.PI / 2;
      combGroup.add(combustorLiner);

      // Turbulent Combustion Flame Core
      const flameCore = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.16, 16, 32), matFlame);
      combGroup.add(flameCore);
      flameCoreRef.current = flameCore;

      // Fuel Distribution Manifold Ring + 20 Dual-Cone Spray Nozzles
      const fuelRing = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.035, 12, 36), matStainlessTubing);
      combGroup.add(fuelRing);

      for (let n = 0; n < 20; n++) {
        const ang = (n / 20) * Math.PI * 2;
        const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.28, 10), matGoldAlloy);
        noz.position.set(Math.cos(ang) * 0.82, Math.sin(ang) * 0.82, 0);
        noz.rotation.z = ang;
        combGroup.add(noz);
      }

      // Dual High-Energy Spark Igniter Plugs (at 4 & 8 o'clock) with Orange Cables
      const igniter1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), matPolishedChrome);
      igniter1.position.set(0.65, -0.65, 0.1);
      igniter1.rotation.z = -Math.PI / 4;
      combGroup.add(igniter1);

      const igniter2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), matPolishedChrome);
      igniter2.position.set(-0.65, -0.65, 0.1);
      igniter2.rotation.z = Math.PI / 4;
      combGroup.add(igniter2);

      const cableOrange = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.02, 6, 24), matOrangeWiring);
      cableOrange.position.z = 0.05;
      combGroup.add(cableOrange);

      rootEngineGroup.add(combGroup);
      interactivePartsRef.current.set('combustor', combGroup);
      registerExplodable(combGroup, new THREE.Vector3(0, 0, -1), 0.7);

      // 6. High-Pressure Turbine (HPT Single-Crystal Rotor)
      const hptGroup = new THREE.Group();
      hptGroup.name = 'high_pressure_turbine';
      hptGroup.position.z = -1.4;

      const hptDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.24, 32), matGoldAlloy);
      hptDisc.rotation.x = Math.PI / 2;
      hptGroup.add(hptDisc);

      // Single-Crystal Turbine Blades with Tip Shrouds
      for (let b = 0; b < 36; b++) {
        const tb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.15), isLeap ? matCeramicTBC : matGoldAlloy);
        const ta = (b / 36) * Math.PI * 2;
        tb.position.set(Math.cos(ta) * 0.86, Math.sin(ta) * 0.86, 0);
        tb.rotation.z = ta + 0.48;
        hptGroup.add(tb);
      }

      // HPT Active Clearance Control (HPTACC) Cooling Tubes
      const hptaccRing = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.03, 8, 32), matStainlessTubing);
      hptGroup.add(hptaccRing);

      rootEngineGroup.add(hptGroup);
      interactivePartsRef.current.set('high_pressure_turbine', hptGroup);
      registerExplodable(hptGroup, new THREE.Vector3(0, 0, -1), 1.2);

      // 7. Low-Pressure Turbine (LPT Drum Spool)
      const lptGroup = new THREE.Group();
      lptGroup.name = 'low_pressure_turbine';
      lptGroup.position.z = -2.05;

      const lptStages = isGtf ? 3 : isGe90 ? 6 : 4;
      for (let lp = 0; lp < lptStages; lp++) {
        const lptStage = new THREE.Mesh(
          new THREE.CylinderGeometry(0.88 + lp * 0.05, 0.88 + lp * 0.05, 0.14, 28),
          matTitaniumFan
        );
        lptStage.rotation.x = Math.PI / 2;
        lptStage.position.z = -lp * 0.18;
        lptGroup.add(lptStage);
      }
      rootEngineGroup.add(lptGroup);
      interactivePartsRef.current.set('low_pressure_turbine', lptGroup);
      registerExplodable(lptGroup, new THREE.Vector3(0, 0, -1), 1.8);

      // 8. Turbine Rear Frame & Exhaust Nozzle Centerbody Plug
      const exhGroup = new THREE.Group();
      exhGroup.name = 'exhaust_nozzle';
      exhGroup.position.z = -2.9;

      // Conical Tail Centerbody
      const exhaustCone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.85, 32), matHeatBlued);
      exhaustCone.rotation.x = -Math.PI / 2;
      exhGroup.add(exhaustCone);

      // Turbine Rear Frame (TRF) 8 Radial Struts
      for (let s = 0; s < 8; s++) {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.25), matTitaniumFan);
        const sa = (s / 8) * Math.PI * 2;
        strut.position.set(Math.cos(sa) * 0.65, Math.sin(sa) * 0.65, 0.4);
        strut.rotation.z = sa;
        exhGroup.add(strut);
      }
      rootEngineGroup.add(exhGroup);
      interactivePartsRef.current.set('exhaust_nozzle', exhGroup);
      registerExplodable(exhGroup, new THREE.Vector3(0, 0, -1), 2.5);

      // 9. Full Accessory Gearbox (AGB) & Dressing on Fan Casing Flank
      const agbGroup = new THREE.Group();
      agbGroup.name = 'lubrication_system';
      agbGroup.position.set(-fanRadius * 0.82, -fanRadius * 0.52, 0.3);

      // Cast Aluminum Gearbox Housing with Structural Ribs
      const agbBox = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 1.3), matTitaniumFan);
      agbGroup.add(agbBox);

      // Integrated Drive Generator (IDG Alternator)
      const idg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 16), matPolishedChrome);
      idg.rotation.z = Math.PI / 2;
      idg.position.set(0.2, 0.15, 0.3);
      agbGroup.add(idg);

      // Engine Driven Fuel Pump & Hydromechanical Unit (HMU)
      const hmu = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.4), matGoldAlloy);
      hmu.position.set(-0.25, -0.1, -0.2);
      agbGroup.add(hmu);

      // Air Turbine Starter Motor + Gold Air Duct
      const starter = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 14), matGoldAlloy);
      starter.position.set(0.1, -0.22, -0.3);
      agbGroup.add(starter);

      // Dual-Channel FADEC / EEC Box with Cooling Fins
      const fadecBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.25), matCarbonComposite);
      fadecBox.position.set(-0.1, 0.45, 0.1);
      agbGroup.add(fadecBox);

      // Oil Reservoir Tank & Scavenge Lines
      const oilTank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 16), matPolishedChrome);
      oilTank.position.set(0.35, -0.35, 0.1);
      agbGroup.add(oilTank);

      rootEngineGroup.add(agbGroup);
      interactivePartsRef.current.set('lubrication_system', agbGroup);
      registerExplodable(agbGroup, new THREE.Vector3(-1, -1, 0), 1.5);
    } else if (category === AeroCategory.TURBOPROP) {
      // -----------------------------------------------------------------------
      // TURBOPROP ENGINES (PT6A-67P, TPE331-10, Catalyst 1300)
      // -----------------------------------------------------------------------
      const isPt6a = engineId === 'AERO-PWC-PT6A-67P';
      const isTpe331 = engineId === 'AERO-HON-TPE331';
      const isCatalyst = engineId === 'AERO-GE-CATALYST';

      // 1. High-Precision Propeller Assembly (Hartzell 5-Blade / Dowty 4-Blade)
      const propGroup = new THREE.Group();
      propGroup.name = 'propeller_assembly';
      propGroup.position.z = 2.85;

      // Chrome Aerodynamic Spinner Dome
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.45, 32), matPolishedChrome);
      spinner.rotation.x = Math.PI / 2;
      propGroup.add(spinner);

      // Propeller Hub Flange with Pitch Counterweights & Bolts
      const propHub = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.35, 24), matPolishedChrome);
      propHub.rotation.x = Math.PI / 2;
      propHub.position.z = -0.3;
      propGroup.add(propHub);

      // Propeller Blades (5-Blade Hartzell Scimitar or 4-Blade Dowty)
      const bladeCount = isTpe331 ? 4 : 5;
      for (let b = 0; b < bladeCount; b++) {
        const ang = (b / bladeCount) * Math.PI * 2;
        const blade = createAerofoilBlade(2.8, 0.26, 0.16, 0.42, matCarbonComposite);
        blade.position.set(Math.cos(ang) * 0.4, Math.sin(ang) * 0.4, -0.2);
        blade.rotation.z = ang - Math.PI / 2;
        blade.rotation.x = 0.12;

        // Yellow High-Visibility Safety Tip
        const tipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.04), matPropYellowTip);
        tipMesh.position.set(0, 2.65, 0);
        blade.add(tipMesh);

        // Black Rubber Electric De-Ice Boot Strip on Leading Edge
        const deice = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.045), matCarbonComposite);
        deice.position.set(-0.08, 1.1, 0);
        blade.add(deice);

        propGroup.add(blade);
      }
      rootEngineGroup.add(propGroup);
      propGroupRef.current = propGroup;
      interactivePartsRef.current.set('propeller_assembly', propGroup);
      registerExplodable(propGroup, new THREE.Vector3(0, 0, 1), 2.2);

      // 2. Reduction Gearbox (RGB) with Torquemeter Boss
      const rgbGroup = new THREE.Group();
      rgbGroup.name = 'reduction_gearbox';
      rgbGroup.position.z = 1.75;

      const rgbCase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.84, 1.2, 28),
        isCatalyst ? matTitaniumFan : matPolishedChrome
      );
      rgbCase.rotation.x = Math.PI / 2;
      rgbGroup.add(rgbCase);

      // Propeller Governor & Beta Valve Control Rods
      const govRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), matPolishedChrome);
      govRod.position.set(0.65, 0.45, 0.1);
      rgbGroup.add(govRod);

      // Electronic Torquemeter Pressure Sensor Chamber
      const torqueSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 12), matGoldAlloy);
      torqueSensor.position.set(0.72, 0.25, 0);
      rgbGroup.add(torqueSensor);

      rootEngineGroup.add(rgbGroup);
      interactivePartsRef.current.set('reduction_gearbox', rgbGroup);
      registerExplodable(rgbGroup, new THREE.Vector3(0, 0, 1), 1.3);

      // 3. Bifurcated Twin Forward-Facing Exhaust Stubs (PT6A Signature Architecture!)
      if (isPt6a) {
        const exhLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.95, 20), matHeatBlued);
        exhLeft.position.set(-0.85, 0.25, 0.95);
        exhLeft.rotation.z = -Math.PI / 3.8;
        exhLeft.rotation.x = Math.PI / 5;
        rootEngineGroup.add(exhLeft);

        const exhRight = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.95, 20), matHeatBlued);
        exhRight.position.set(0.85, 0.25, 0.95);
        exhRight.rotation.z = Math.PI / 3.8;
        exhRight.rotation.x = Math.PI / 5;
        rootEngineGroup.add(exhRight);

        // Welded Heat Blankets
        const clampL = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 20), matGoldAlloy);
        clampL.position.copy(exhLeft.position);
        rootEngineGroup.add(clampL);
      }

      // TPE331 Forward Ram Air Chin Scoop
      if (isTpe331) {
        const chinScoop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 1.4), matTitaniumFan);
        chinScoop.position.set(0, -0.85, 1.1);
        rootEngineGroup.add(chinScoop);
      }

      // 4. Free Power Turbine (PT) Assembly
      const ptGroup = new THREE.Group();
      ptGroup.name = 'power_turbine';
      ptGroup.position.z = 0.65;

      const ptDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.48, 28), matGoldAlloy);
      ptDisc.rotation.x = Math.PI / 2;
      ptGroup.add(ptDisc);

      // Turbine Blades
      for (let b = 0; b < 28; b++) {
        const ba = (b / 28) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.12), matGoldAlloy);
        blade.position.set(Math.cos(ba) * 0.82, Math.sin(ba) * 0.82, 0);
        blade.rotation.z = ba + 0.45;
        ptGroup.add(blade);
      }

      // Interstage Turbine Temperature (ITT) Thermocouple Harness Ring
      const ittHarness = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.025, 8, 28), matStainlessTubing);
      ptGroup.add(ittHarness);

      rootEngineGroup.add(ptGroup);
      interactivePartsRef.current.set('power_turbine', ptGroup);
      registerExplodable(ptGroup, new THREE.Vector3(0, 0, 1), 0.6);

      // 5. Reverse-Flow Annular Combustion Chamber
      const rfComb = new THREE.Group();
      rfComb.name = 'combustor';
      rfComb.position.z = -0.35;

      const combTorus = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.34, 20, 32), matHeatBlued);
      rfComb.add(combTorus);

      const rfFlame = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.16, 14, 28), matFlame);
      rfComb.add(rfFlame);
      flameCoreRef.current = rfFlame;

      // 14 Circumferential Reverse-Flow Fuel Nozzles
      for (let n = 0; n < 14; n++) {
        const na = (n / 14) * Math.PI * 2;
        const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), matGoldAlloy);
        noz.position.set(Math.cos(na) * 0.98, Math.sin(na) * 0.98, 0);
        noz.rotation.z = na;
        rfComb.add(noz);
      }

      rootEngineGroup.add(rfComb);
      interactivePartsRef.current.set('combustor', rfComb);
      registerExplodable(rfComb, new THREE.Vector3(0, 0, -1), 0.5);

      // 6. Gas Generator Compressor Spool (Ng) & Rear Inertial Air Inlet Screen
      const ggGroup = new THREE.Group();
      ggGroup.name = 'gas_generator';
      ggGroup.position.z = -1.55;

      const ggDrum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.78, 0.66, 1.5, 28),
        isCatalyst ? matCarbonComposite : matTitaniumFan
      );
      ggDrum.rotation.x = Math.PI / 2;
      ggGroup.add(ggDrum);

      // Titanium Centrifugal Impeller Scroll Housing
      const impellerScroll = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.22, 16, 32), matTitaniumFan);
      impellerScroll.position.z = 0.35;
      ggGroup.add(impellerScroll);

      // Rear Air Intake Wire Mesh Protective Screen (Inertial Separator)
      const intakeScreen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 0.92, 0.55, 32, 1, true),
        matPolishedChrome
      );
      intakeScreen.rotation.x = Math.PI / 2;
      intakeScreen.position.z = -0.95;
      ggGroup.add(intakeScreen);

      // Rear Accessory Drive Housing (Starter-Gen, Fuel Control Unit)
      const rearAgb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.7), matTitaniumFan);
      rearAgb.position.z = -1.45;
      ggGroup.add(rearAgb);

      // Starter-Generator Cylindrical Unit
      const starterGen = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 16), matCarbonComposite);
      starterGen.position.set(0.3, 0.25, -1.55);
      starterGen.rotation.x = Math.PI / 2;
      ggGroup.add(starterGen);

      rootEngineGroup.add(ggGroup);
      coreSpoolRef.current = ggGroup;
      interactivePartsRef.current.set('gas_generator', ggGroup);
      registerExplodable(ggGroup, new THREE.Vector3(0, 0, -1), 1.5);
    } else if (category === AeroCategory.PISTON) {
      // -----------------------------------------------------------------------
      // AIRCRAFT PISTON ENGINES (Lycoming IO-360, Continental O-200, Rotax 915 iS)
      // -----------------------------------------------------------------------
      const isRotax = engineId === 'AERO-ROTAX-915IS';
      const isConti = engineId === 'AERO-CONT-O200';

      // 1. Central Split Crankcase
      const crankcase = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.96, 2.4),
        isRotax ? matTitaniumFan : matPolishedChrome
      );
      crankcase.name = 'pistons_crank';
      rootEngineGroup.add(crankcase);

      // Front Propeller Hub Flange with Drive Bushings & Ring Gear
      const propFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.42, 24), matPolishedChrome);
      propFlange.rotation.x = Math.PI / 2;
      propFlange.position.z = 1.4;
      rootEngineGroup.add(propFlange);

      const starterRingGear = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 12, 36), matGoldAlloy);
      starterRingGear.position.z = 1.25;
      rootEngineGroup.add(starterRingGear);

      // Propeller (2-Blade Metal Constant-Speed / 3-Blade Composite Rotax)
      const pistonPropGroup = new THREE.Group();
      pistonPropGroup.name = 'propeller_assembly';
      pistonPropGroup.position.z = 1.65;

      const pSpinner = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 24), matPolishedChrome);
      pSpinner.rotation.x = Math.PI / 2;
      pistonPropGroup.add(pSpinner);

      const pBlades = isRotax ? 3 : 2;
      for (let pb = 0; pb < pBlades; pb++) {
        const pa = (pb / pBlades) * Math.PI * 2;
        const pBlade = createAerofoilBlade(2.2, 0.22, 0.14, 0.35, isRotax ? matCarbonComposite : matPolishedChrome);
        pBlade.position.set(Math.cos(pa) * 0.3, Math.sin(pa) * 0.3, -0.15);
        pBlade.rotation.z = pa - Math.PI / 2;
        pBlade.rotation.x = 0.12;

        if (isRotax) {
          const whiteWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.04), matPolishedChrome);
          whiteWinglet.position.set(0, 2.1, 0);
          pBlade.add(whiteWinglet);
        } else {
          const yellowTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.25, 0.04), matPropYellowTip);
          yellowTip.position.set(0, 2.1, 0);
          pBlade.add(yellowTip);
        }

        pistonPropGroup.add(pBlade);
      }
      rootEngineGroup.add(pistonPropGroup);
      propGroupRef.current = pistonPropGroup;
      interactivePartsRef.current.set('propeller_assembly', pistonPropGroup);
      registerExplodable(pistonPropGroup, new THREE.Vector3(0, 0, 1), 1.8);

      // 2. Opposed Finned Cylinders (4-Cylinder Boxer Architecture)
      const cylPositions = [
        { x: -0.95, y: 0.08, z: 0.65, sign: -1, phase: 0 },
        { x: -0.95, y: 0.08, z: -0.55, sign: -1, phase: Math.PI },
        { x: 0.95, y: -0.08, z: 0.35, sign: 1, phase: Math.PI * 0.5 },
        { x: 0.95, y: -0.08, z: -0.85, sign: 1, phase: Math.PI * 1.5 },
      ];

      const cylGroupRoot = new THREE.Group();
      cylGroupRoot.name = 'cylinders';

      cylPositions.forEach((pos, idx) => {
        const cylGroup = new THREE.Group();
        cylGroup.position.set(pos.x, pos.y, pos.z);

        // Machined Cylinder Barrel with 12 Deep Aluminum Cooling Fins
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.9, 20),
          isRotax ? matCarbonComposite : matTitaniumFan
        );
        barrel.rotation.z = pos.sign * (Math.PI / 2);
        cylGroup.add(barrel);

        for (let f = -0.36; f <= 0.36; f += 0.065) {
          const fin = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 6, 24), matTitaniumFan);
          fin.rotation.y = Math.PI / 2;
          fin.position.x = pos.sign * f;
          cylGroup.add(fin);
        }

        // Valve Rocker Cover (Rotax Red / Lycoming Silver / Continental Charcoal)
        const coverMat = isRotax ? matRotaxRed : isConti ? matTitaniumFan : matPolishedChrome;
        const headCover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.74, 0.74), coverMat);
        headCover.position.x = pos.sign * 0.58;
        cylGroup.add(headCover);

        // Dual Spark Plugs (Top & Bottom Plugs) with Orange/Copper Wire Conduits
        const plugTop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), matPolishedChrome);
        plugTop.position.set(pos.sign * 0.68, 0.25, 0);
        plugTop.rotation.z = pos.sign * (Math.PI / 4);
        cylGroup.add(plugTop);

        const plugBot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), matPolishedChrome);
        plugBot.position.set(pos.sign * 0.68, -0.25, 0);
        plugBot.rotation.z = -pos.sign * (Math.PI / 4);
        cylGroup.add(plugBot);

        // Chrome Pushrod Shroud Tubes
        const pushrodTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), matPolishedChrome);
        pushrodTop.position.set(-pos.sign * 0.15, 0.32, 0.12);
        pushrodTop.rotation.z = pos.sign * (Math.PI / 2);
        cylGroup.add(pushrodTop);

        const pushrodBot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), matPolishedChrome);
        pushrodBot.position.set(-pos.sign * 0.15, -0.32, 0.12);
        pushrodBot.rotation.z = pos.sign * (Math.PI / 2);
        cylGroup.add(pushrodBot);

        // Reciprocating Piston inside barrel
        const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16), matGoldAlloy);
        pMesh.rotation.z = pos.sign * (Math.PI / 2);
        cylGroup.add(pMesh);
        pistonsRef.current.push({ mesh: pMesh, sign: pos.sign, phase: pos.phase, baseX: 0 });

        cylGroupRoot.add(cylGroup);
        registerExplodable(cylGroup, new THREE.Vector3(pos.sign, 0, 0), 0.9);
      });

      rootEngineGroup.add(cylGroupRoot);
      interactivePartsRef.current.set('cylinders', cylGroupRoot);

      // 3. Induction Manifold & Fuel Injection Spider / Carburetor
      const plenumGroup = new THREE.Group();
      plenumGroup.name = 'induction_manifold';

      if (isConti) {
        // Continental Updraft Carburetor & 4 Curved Intake Spider Pipes Underneath
        const carbBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), matGoldAlloy);
        carbBox.position.set(0, -0.85, 0.1);
        plenumGroup.add(carbBox);

        for (let cp = 0; cp < 4; cp++) {
          const csign = cp < 2 ? -1 : 1;
          const cz = cp % 2 === 0 ? 0.5 : -0.5;
          const curvePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12), matPolishedChrome);
          curvePipe.position.set(csign * 0.55, -0.55, cz);
          curvePipe.rotation.z = csign * (Math.PI / 4);
          plenumGroup.add(curvePipe);
        }
      } else {
        // Lycoming Bendix RSA Continuous Fuel Injection Servo Underneath
        const fuelServo = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.52), matGoldAlloy);
        fuelServo.position.set(0, -0.78, 0.2);
        plenumGroup.add(fuelServo);

        // Top Fuel Spider Manifold Block & 4 Radiating Capillary Lines to Cylinders
        const spiderBlock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), matGoldAlloy);
        spiderBlock.position.set(0, 0.65, 0);
        plenumGroup.add(spiderBlock);

        for (let l = 0; l < 4; l++) {
          const lsign = l < 2 ? -1 : 1;
          const lz = l % 2 === 0 ? 0.55 : -0.55;
          const line = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 8), matStainlessTubing);
          line.position.set(lsign * 0.48, 0.52, lz * 0.5);
          line.rotation.z = lsign * (Math.PI / 3.5);
          line.rotation.y = lz > 0 ? 0.3 : -0.3;
          plenumGroup.add(line);
        }
      }

      rootEngineGroup.add(plenumGroup);
      interactivePartsRef.current.set('induction_manifold', plenumGroup);
      registerExplodable(plenumGroup, new THREE.Vector3(0, 1, 0), 0.7);

      // 4. Tuned Stainless Steel 4-into-1 Crossover Exhaust Headers & Heat Muffler
      const exhGroup = new THREE.Group();
      exhGroup.name = 'exhaust_system';
      exhGroup.position.y = -0.72;

      const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.8, 16), matHeatBlued);
      muffler.rotation.x = Math.PI / 2;
      muffler.position.set(0, 0, -0.3);
      exhGroup.add(muffler);

      // 4 Sweeping Header Runners
      for (let h = 0; h < 4; h++) {
        const hsign = h < 2 ? -1 : 1;
        const hz = h % 2 === 0 ? 0.55 : -0.55;
        const runner = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.75, 12), matHeatBlued);
        runner.position.set(hsign * 0.55, 0.2, hz);
        runner.rotation.z = -hsign * (Math.PI / 4);
        exhGroup.add(runner);
      }

      rootEngineGroup.add(exhGroup);
      interactivePartsRef.current.set('exhaust_system', exhGroup);
      registerExplodable(exhGroup, new THREE.Vector3(0, -1, 0), 0.8);

      // 5. Dual Slick Aircraft Magnetos on Rear Accessory Pad
      const magLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 16), matCarbonComposite);
      magLeft.position.set(-0.38, 0.32, -1.42);
      magLeft.rotation.x = Math.PI / 2;
      rootEngineGroup.add(magLeft);

      const magRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 16), matCarbonComposite);
      magRight.position.set(0.38, 0.32, -1.42);
      magRight.rotation.x = Math.PI / 2;
      rootEngineGroup.add(magRight);

      // 6. Rotax 915 iS Turbocharger, Intercooler & Dual Radiators
      if (isRotax) {
        const turboGroup = new THREE.Group();
        turboGroup.position.set(0, 0.92, -0.65);

        // Garrett Turbocharger Compressor Scroll
        const turboScroll = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.1, 14, 20), matPolishedChrome);
        turboGroup.add(turboScroll);

        // Wastegate Pneumatic Canister
        const wastegate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12), matGoldAlloy);
        wastegate.position.set(0.28, 0.15, 0);
        turboGroup.add(wastegate);

        // Top-Mounted Charge Air Intercooler with Aluminum End Tanks
        const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.48, 0.24), matTitaniumFan);
        intercooler.position.set(0, 0.15, 0.95);
        turboGroup.add(intercooler);

        // Front Coolant Radiator with Electric Fan
        const radiator = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.14), matCarbonComposite);
        radiator.position.set(0, -0.45, 1.85);
        turboGroup.add(radiator);

        rootEngineGroup.add(turboGroup);
        registerExplodable(turboGroup, new THREE.Vector3(0, 1, 0), 1.2);
      }
    } else {
      // -----------------------------------------------------------------------
      // MILITARY TURBOJET ENGINES (GE J85-GE-21 / Rolls-Royce Viper 601)
      // -----------------------------------------------------------------------
      const isJ85 = engineId === 'AERO-GE-J85-21';

      // 1. Variable Inlet Guide Vanes (IGV) & Titanium Nose Bullet
      const bulletGroup = new THREE.Group();
      bulletGroup.name = 'inlet_guide_vanes';
      bulletGroup.position.z = 2.5;

      const bulletCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.35, 28), matTitaniumFan);
      bulletCone.rotation.x = Math.PI / 2;
      bulletGroup.add(bulletCone);

      // 16 Variable Inlet Guide Vanes
      for (let ig = 0; ig < 16; ig++) {
        const igv = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.18), matPolishedChrome);
        const iga = (ig / 16) * Math.PI * 2;
        igv.position.set(Math.cos(iga) * 0.58, Math.sin(iga) * 0.58, -0.35);
        igv.rotation.z = iga;
        igv.rotation.x = 0.15;
        bulletGroup.add(igv);
      }
      rootEngineGroup.add(bulletGroup);
      interactivePartsRef.current.set('inlet_guide_vanes', bulletGroup);
      registerExplodable(bulletGroup, new THREE.Vector3(0, 0, 1), 2.2);

      // 2. 8-Stage Axial Compressor Drum & Circumferential Bleed Band
      const compGroup = new THREE.Group();
      compGroup.name = 'axial_compressor';
      compGroup.position.z = 1.15;

      const compDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.6, 2.1, 28), matTitaniumFan);
      compDrum.rotation.x = Math.PI / 2;
      compGroup.add(compDrum);

      // 8 Rotor Discs with Micro Blades
      for (let st = 0; st < 8; st++) {
        const stZ = 0.85 - st * 0.24;
        const stR = 0.74 - st * 0.02;
        const stDisc = new THREE.Mesh(new THREE.CylinderGeometry(stR, stR, 0.08, 24), matPolishedChrome);
        stDisc.rotation.x = Math.PI / 2;
        stDisc.position.z = stZ;
        compGroup.add(stDisc);
      }

      // Stage 3 Bleed Valve Band
      const bleedRing = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 8, 28), matGoldAlloy);
      bleedRing.position.z = 0.25;
      compGroup.add(bleedRing);

      rootEngineGroup.add(compGroup);
      coreSpoolRef.current = compGroup;
      interactivePartsRef.current.set('axial_compressor', compGroup);
      registerExplodable(compGroup, new THREE.Vector3(0, 0, 1), 1.1);

      // 3. Annular Combustor with Vaporizer Tubes / Duplex Nozzles
      const jetComb = new THREE.Group();
      jetComb.name = 'combustor';
      jetComb.position.z = -0.5;

      const combCasing = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.74, 1.15, 28), matHeatBlued);
      combCasing.rotation.x = Math.PI / 2;
      jetComb.add(combCasing);

      const jetFlame = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.95, 20), matFlame);
      jetFlame.rotation.x = Math.PI / 2;
      jetComb.add(jetFlame);
      flameCoreRef.current = jetFlame;

      // 24 Walking-Stick Vaporizer Tubes (Viper) or 12 Duplex Injectors (J85)
      const nozzleCount = isJ85 ? 12 : 24;
      for (let jn = 0; jn < nozzleCount; jn++) {
        const jna = (jn / nozzleCount) * Math.PI * 2;
        const jnoz = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8), matGoldAlloy);
        jnoz.position.set(Math.cos(jna) * 0.82, Math.sin(jna) * 0.82, 0);
        jnoz.rotation.z = jna;
        jetComb.add(jnoz);
      }

      rootEngineGroup.add(jetComb);
      interactivePartsRef.current.set('combustor', jetComb);
      registerExplodable(jetComb, new THREE.Vector3(0, 0, -1), 0.6);

      // 4. Two-Stage Axial Turbine
      const turbStage = new THREE.Group();
      turbStage.name = 'turbine_stage';
      turbStage.position.z = -1.35;

      const tDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.45, 28), matGoldAlloy);
      tDisc.rotation.x = Math.PI / 2;
      turbStage.add(tDisc);

      for (let tb = 0; tb < 32; tb++) {
        const tba = (tb / 32) * Math.PI * 2;
        const tblade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.14), matGoldAlloy);
        tblade.position.set(Math.cos(tba) * 0.82, Math.sin(tba) * 0.82, 0);
        tblade.rotation.z = tba + 0.45;
        turbStage.add(tblade);
      }

      rootEngineGroup.add(turbStage);
      interactivePartsRef.current.set('turbine_stage', turbStage);
      registerExplodable(turbStage, new THREE.Vector3(0, 0, -1), 1.2);

      // 5. Augmentor / Afterburner Section (J85 Supersonic Reheat Duct & 16 Variable Petals)
      const nozzleGroup = new THREE.Group();
      nozzleGroup.name = 'exhaust_nozzle';
      nozzleGroup.position.z = -2.5;

      if (isJ85) {
        // Stainless Afterburner Augmentor Duct
        const abTube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.76, 0.78, 1.9, 28, 1, true),
          matHeatBlued
        );
        abTube.rotation.x = Math.PI / 2;
        abTube.position.z = 0.55;
        nozzleGroup.add(abTube);

        // 3 Concentric Reheat Spray Rings + V-Gutter Flameholders
        for (let r = 0; r < 3; r++) {
          const rr = 0.38 + r * 0.16;
          const sprayRing = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.025, 8, 28), matStainlessTubing);
          sprayRing.position.z = 0.65 - r * 0.15;
          nozzleGroup.add(sprayRing);
        }

        // Radial V-Gutter Flameholders
        for (let fg = 0; fg < 8; fg++) {
          const fga = (fg / 8) * Math.PI * 2;
          const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.15), matTitaniumFan);
          gutter.position.set(Math.cos(fga) * 0.48, Math.sin(fga) * 0.48, 0.35);
          gutter.rotation.z = fga;
          nozzleGroup.add(gutter);
        }

        // Supersonic Shock Diamond Flame Core
        const shockDiamonds = new THREE.Group();
        for (let sd = 0; sd < 4; sd++) {
          const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.24 - sd * 0.04, 0), matFlame);
          diamond.position.z = -0.3 - sd * 0.45;
          shockDiamonds.add(diamond);
        }
        nozzleGroup.add(shockDiamonds);
        afterburnerShockDiamondsRef.current = shockDiamonds;

        // 16 Articulated Variable Convergent-Divergent Titanium Exhaust Petals
        for (let p = 0; p < 16; p++) {
          const petalGeo = new THREE.BoxGeometry(0.16, 0.95, 0.04);
          const petal = new THREE.Mesh(petalGeo, matTitaniumFan);
          const ang = (p / 16) * Math.PI * 2;
          petal.position.set(Math.cos(ang) * 0.74, Math.sin(ang) * 0.74, -0.5);
          petal.rotation.z = ang;
          petal.rotation.x = 0.22; // Throat convergence
          nozzleGroup.add(petal);
          nozzlePetalsRef.current.push({ mesh: petal, baseRotX: 0.22 });
        }
      } else {
        // Rolls-Royce Viper Conical Jet Pipe
        const jetPipe = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.2, 28, 1, true), matHeatBlued);
        jetPipe.rotation.x = Math.PI / 2;
        jetPipe.position.z = 0.3;
        nozzleGroup.add(jetPipe);
      }

      rootEngineGroup.add(nozzleGroup);
      interactivePartsRef.current.set('exhaust_nozzle', nozzleGroup);
      registerExplodable(nozzleGroup, new THREE.Vector3(0, 0, -1), 2.2);
    }

    // E. Camera Position & Orbit Controls
    const updateCamera = () => {
      const { theta, phi, radius } = controlsRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const dx = e.clientX - controlsRef.current.prevX;
      const dy = e.clientY - controlsRef.current.prevY;

      // Natural CAD Orbit (non-inverted)
      controlsRef.current.targetTheta += dx * 0.007;
      controlsRef.current.targetPhi = Math.max(
        0.08,
        Math.min(Math.PI - 0.08, controlsRef.current.targetPhi - dy * 0.007)
      );

      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.targetRadius = Math.max(
        3.2,
        Math.min(22.0, controlsRef.current.targetRadius + e.deltaY * 0.008)
      );
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Component Raycasting
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(rootEngineGroup.children, true);

      if (intersects.length > 0) {
        let hit: THREE.Object3D | null = intersects[0].object;
        while (hit && hit !== rootEngineGroup) {
          if (hit.name && interactivePartsRef.current.has(hit.name)) {
            if (onSelectComponent) onSelectComponent(hit.name);
            break;
          }
          hit = hit.parent;
        }
      }
    };
    dom.addEventListener('click', onClick);

    // F. 60 FPS Mechanical Animation Loop Synchronized with Telemetry
    let clock = 0;
    const animate = () => {
      clock += 0.016;

      // Camera Damping
      controlsRef.current.theta += (controlsRef.current.targetTheta - controlsRef.current.theta) * 0.12;
      controlsRef.current.phi += (controlsRef.current.targetPhi - controlsRef.current.phi) * 0.12;
      controlsRef.current.radius += (controlsRef.current.targetRadius - controlsRef.current.radius) * 0.12;
      updateCamera();

      // Telemetry Speeds
      const n1 = telemetry?.n1_pct || 22.0;
      const n2 = telemetry?.n2_pct || telemetry?.spool_n_pct || 62.0;
      const np = telemetry?.np_rpm || 1050.0;
      const rpm = telemetry?.rpm || 900.0;
      const egt = telemetry?.turbine_egt_c || telemetry?.egt_c || 450.0;
      const thrust = telemetry?.thrust_kn || 0.0;

      // 1. Dual-Spool Dynamic Rotation
      if (fanGroupRef.current) {
        fanGroupRef.current.rotation.z += (n1 / 100.0) * 0.32;
      }
      if (fanGearboxRef.current) {
        // Planetary gearbox spins at stepped ratio
        fanGearboxRef.current.rotation.z += (n1 / 100.0) * 0.11;
      }
      if (propGroupRef.current) {
        propGroupRef.current.rotation.z += (np / 1700.0) * 0.38;
      }
      if (coreSpoolRef.current) {
        coreSpoolRef.current.rotation.z += (n2 / 100.0) * 0.46;
      }

      // 2. Harmonic Reciprocating Pistons (Piston Engines)
      if (pistonsRef.current.length === 4) {
        const crankAngle = clock * (rpm / 60.0) * Math.PI * 2;
        pistonsRef.current.forEach((item) => {
          const stroke = Math.sin(crankAngle + item.phase) * 0.18;
          item.mesh.position.x = item.baseX + item.sign * stroke;
        });
      }

      // 3. Flame Core Heat Flickering
      if (combustorLightRef.current) {
        combustorLightRef.current.intensity = 1.6 + Math.sin(clock * 14.0) * 0.4 + (egt / 1000.0) * 1.2;
      }
      if (flameCoreRef.current) {
        const flameScale = 1.0 + Math.sin(clock * 16.0) * 0.05;
        flameCoreRef.current.scale.set(flameScale, flameScale, flameScale);
      }

      // 4. Afterburner Petal Modulation & Shock Diamonds (J85 Turbojet)
      const isReheat = thrust > 18.0;
      if (afterburnerGlowRef.current) {
        afterburnerGlowRef.current.intensity = isReheat ? 3.5 + Math.sin(clock * 22.0) * 0.8 : 0.0;
      }
      if (afterburnerShockDiamondsRef.current) {
        afterburnerShockDiamondsRef.current.visible = isReheat;
        if (isReheat) {
          afterburnerShockDiamondsRef.current.rotation.z += 0.05;
        }
      }
      nozzlePetalsRef.current.forEach((petal) => {
        petal.mesh.rotation.x = isReheat ? 0.05 : petal.baseRotX;
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [engine, renderStyle, showNacelle, useSchematicFallback]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-[#060913] border border-[#38bdf8]/30 shadow-2xl flex flex-col select-none"
      style={{ height }}
    >
      {/* 1. TOP CAD TOOLBAR: Shading, View Presets, Exploded Mode, Callout Pins */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#060913]/90 backdrop-blur-md border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#f1f5f9] tracking-wider">
            {engine.model_designation}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40">
            {category} • TCDS {engine.provenance.certification_id}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          {/* View Presets */}
          <div className="flex items-center bg-[#090e1b] rounded-lg p-0.5 border border-[#3b494b]/40">
            <button
              onClick={() => applyCameraPreset('iso')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'iso' ? 'bg-[#38bdf8] text-[#060913] font-bold' : 'text-[#849495] hover:text-[#f1f5f9]'
              }`}
            >
              ISO 3/4
            </button>
            <button
              onClick={() => applyCameraPreset('front_fan')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'front_fan' ? 'bg-[#38bdf8] text-[#060913] font-bold' : 'text-[#849495] hover:text-[#f1f5f9]'
              }`}
            >
              INTAKE/FAN
            </button>
            <button
              onClick={() => applyCameraPreset('core_combustor')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'core_combustor' ? 'bg-[#38bdf8] text-[#060913] font-bold' : 'text-[#849495] hover:text-[#f1f5f9]'
              }`}
            >
              CORE/HPC
            </button>
            <button
              onClick={() => applyCameraPreset('turbines')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'turbines' ? 'bg-[#38bdf8] text-[#060913] font-bold' : 'text-[#849495] hover:text-[#f1f5f9]'
              }`}
            >
              TURBINES
            </button>
            <button
              onClick={() => applyCameraPreset('accessories')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'accessories' ? 'bg-[#38bdf8] text-[#060913] font-bold' : 'text-[#849495] hover:text-[#f1f5f9]'
              }`}
            >
              AGB
            </button>
          </div>

          {/* Explode CAD Animation Toggle */}
          <button
            onClick={() => setExplodedView(!explodedView)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-colors ${
              explodedView
                ? 'bg-[#f59e0b] border-[#f59e0b] text-[#060913] font-bold shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#090e1b] border-[#3b494b]/40 text-[#849495] hover:text-[#dee2f5]'
            }`}
            title="Exploded CAD Inspection View"
          >
            <Layers className="w-3 h-3" />
            <span>EXPLODE</span>
          </button>

          {/* Cowl Opacity Toggle */}
          {category === AeroCategory.TURBOFAN && (
            <button
              onClick={() => setShowNacelle(!showNacelle)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-colors ${
                showNacelle
                  ? 'bg-[#090e1b] border-[#3b494b]/40 text-[#849495] hover:text-[#dee2f5]'
                  : 'bg-[#0284c7]/20 border-[#0284c7] text-[#38bdf8]'
              }`}
              title="Toggle Cowling Cutaway"
            >
              {showNacelle ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>COWL</span>
            </button>
          )}

          {/* Shading Style Cycler */}
          <button
            onClick={() => {
              const next: AeroRenderStyle =
                renderStyle === 'metallic_pbr'
                  ? 'clay_cad'
                  : renderStyle === 'clay_cad'
                  ? 'xray_ghost'
                  : 'metallic_pbr';
              setRenderStyle(next);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#090e1b] border border-[#3b494b]/40 text-[#849495] hover:text-[#38bdf8] text-[10px]"
            title="Cycle PBR Metal / Clay CAD / X-Ray Ghost"
          >
            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
            <span className="uppercase">{renderStyle.replace('_', ' ')}</span>
          </button>
        </div>
      </div>

      {/* 2. WebGL 3D Canvas Mount */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* 3. Floating Distinctive Architecture Badges */}
      <div className="absolute bottom-12 left-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none max-w-[85%]">
        {callouts.map((feat, idx) => {
          const isSelected = selectedComponentId === feat.componentId;
          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectComponent) onSelectComponent(feat.componentId);
              }}
              className={`pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-md shadow-lg transition-all ${
                isSelected
                  ? 'bg-[#38bdf8]/25 border border-[#38bdf8] scale-105'
                  : 'bg-[#090e1b]/85 border border-[#3b494b]/60 hover:border-[#38bdf8]/50'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: feat.color, boxShadow: `0 0 6px ${feat.color}` }}
              />
              <span className="font-mono text-[9px] font-bold text-[#f1f5f9]">
                {feat.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Bottom Engineering Status HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 bg-[#060913]/90 backdrop-blur-md border-t border-[#3b494b]/40 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#849495]">Manufacturer:</span>
            <span className="text-[#f1f5f9] font-bold">{engine.manufacturer}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#849495]">Architecture:</span>
            <span className="text-[#38bdf8] font-bold">{engine.architecture}</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="text-[#849495]">Dry Weight:</span>
            <span className="text-[#dee2f5] font-bold">{engine.specifications.dry_weight_kg} kg</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#849495]">
          <span>Rotate: Left Drag • Zoom: Scroll • Component: Click Mesh</span>
        </div>
      </div>
    </div>
  );
};

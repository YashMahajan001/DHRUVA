import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, RotateCcw, Eye, Layers, Compass, Sparkles, Activity, Tag, CheckCircle2 } from 'lucide-react';
import { EngineCatalogEntry, EngineTelemetryRecord } from '../../services/autoApi';

interface AutoEngineModel3DProps {
  engine: EngineCatalogEntry;
  telemetry: EngineTelemetryRecord | null;
  isSimulating?: boolean;
  className?: string;
}

export type ViewPreset = 'iso' | 'front_belt' | 'headers' | 'transmission' | 'top_cover';
export type RenderStyle = 'clay_cad' | 'metallic';

// Architecture feature callout metadata for each engine
interface EngineFeatureCallout {
  title: string;
  badge: string;
  color: string;
  description: string;
}

const ENGINE_ARCHITECTURE_CALLOUTS: Record<string, EngineFeatureCallout[]> = {
  'AUTO-M177-4.0V8': [
    { title: 'Hot-Inside V Twin Turbos', badge: 'Hot-V Twin Turbos', color: '#f59e0b', description: 'Dual BorgWarner turbochargers mounted in the 90° cylinder bank valley.' },
    { title: '90° V8 Double Bank', badge: '90° V8 Dual Bank', color: '#38bdf8', description: 'Dual angled aluminum cylinder heads with 8 valves per bank.' },
    { title: 'Dual 4-into-1 Exhaust Headers', badge: '8 Exhaust Runners', color: '#f43f5e', description: 'Symmetrical sweeping tubular stainless headers on both flanks.' },
  ],
  'AUTO-B58-3.0T': [
    { title: 'Longitudinal Inline-6 Block', badge: 'Long 3.0L I-6 Block', color: '#38bdf8', description: 'Long 6-cylinder block with 6 sweeping header tubes.' },
    { title: 'Liquid Water-to-Air Intercooler', badge: 'Water-Air Intercooler', color: '#0284c7', description: 'Top-mounted billet aluminum charge air cooler with dual coolant feed lines.' },
    { title: 'BMW M-Power Tricolor Cover', badge: 'M-Power Carbon Cover', color: '#f59e0b', description: 'Longitudinal beauty cover with signature tri-color stripe decal.' },
  ],
  'AUTO-HONDA-K20C1': [
    { title: 'Championship Red Wrinkle Head', badge: 'Championship Red Head', color: '#ef4444', description: 'Iconic Honda Type R high-temperature wrinkle finish valve cover.' },
    { title: 'VTEC Turbo Scavenge System', badge: 'VTEC Turbo Plaque', color: '#f59e0b', description: 'Exhaust cam variable valve lift with high-flow mono-scroll turbo.' },
    { title: 'Blued Stainless Headers', badge: 'Heat-Blued 4-into-1', color: '#38bdf8', description: 'Polished tubular stainless steel manifold with visible titanium heat tint.' },
  ],
  'AUTO-TOYOTA-M20A-FXS': [
    { title: 'High-Voltage Safety Orange Bus', badge: '600V Orange HV Bus', color: '#f97316', description: 'Thick shielded high-voltage orange conduit routing to top inverter.' },
    { title: 'Electric Cyan Hybrid Cover', badge: 'Hybrid Synergy Drive', color: '#06b6d4', description: 'Atkinson-cycle 41% thermal efficiency Dynamic Force head styling.' },
    { title: 'Beltless Front Drive Module', badge: 'Electric Water Pump', color: '#10b981', description: 'Electric water pump & e-CVT planetary motor drive without mechanical belt drag.' },
  ],
  'AUTO-TOYOTA-2GD-FTV': [
    { title: 'Top-Mounted Intercooler Core', badge: 'Top-Mount Intercooler', color: '#38bdf8', description: 'Hilux/Fortuner signature air-to-air intercooler with cast aluminum feed ducts.' },
    { title: 'Viscous Mechanical 9-Blade Fan', badge: 'Viscous 9-Blade Fan', color: '#eab308', description: 'Heavy-duty viscous clutch cooling fan with yellow perimeter safety ring.' },
    { title: 'Rugged Cast-Iron Deep Pan', badge: 'Heavy-Duty Cast Block', color: '#94a3b8', description: 'Reinforced block ribs and deep stamped oil sump for 4x4 reliability.' },
  ],
  'AUTO-HYUNDAI-KAPPA-1.2': [
    { title: '4-Horn Arching Intake Plenum', badge: '4-Horn High-Rise Intake', color: '#10b981', description: 'High-flow curved polymer intake runner horns arching gracefully over the valve cover.' },
    { title: 'Naturally Aspirated (No Turbo)', badge: 'Naturally Aspirated', color: '#f59e0b', description: 'Linear throttle response, lightweight aluminum build, zero turbo lag.' },
    { title: 'Direct-Coupled Catalytic Canister', badge: 'Direct Catalytic Canister', color: '#cbd5e1', description: 'Vertical stainless catalytic converter mounted right under exhaust ports with gold O2 sensor.' },
  ],
  'AUTO-HYUNDAI-1.6CRDI': [
    { title: '1800-Bar Chrome Common Rail', badge: '1800-Bar Common Rail', color: '#ffffff', description: 'Solid mirror-chrome high-pressure fuel rail with 4 metal injector feed lines.' },
    { title: 'CRDi 16V Acoustic Shroud', badge: 'CRDi Acoustic Shroud', color: '#94a3b8', description: 'Matte dark charcoal sound-damping engine cover with silver badging.' },
    { title: 'Variable Geometry Turbo (VGT)', badge: 'VGT Turbo + EGR Cooler', color: '#38bdf8', description: 'Electronic stepper-driven turbine vanes and side stainless EGR cooler.' },
  ],
  'AUTO-EA888-2.0T': [
    { title: 'Crimson Red Audi R8 Coil Packs', badge: 'Red R8 Ignition Coils', color: '#ef4444', description: '4 vibrant red ignition coils inserted into the spark plug channels.' },
    { title: 'Two-Tone TSI Beauty Cover', badge: 'EA888 Gen 3 TSI Cover', color: '#cbd5e1', description: 'Piano black and satin silver split engine beauty cover.' },
    { title: 'IHI IS20 Turbocharger', badge: 'IHI IS20 Turbocharger', color: '#f59e0b', description: 'Water-cooled mono-scroll turbo with electronic wastegate actuator.' },
  ],
  'AUTO-VW-EA288-2.0TDI': [
    { title: 'TDI Clean Diesel DPF Canister', badge: 'DPF Clean Diesel System', color: '#38bdf8', description: 'Cylindrical particulate filter and dual-circuit EGR cooler.' },
    { title: 'Toothed Timing Belt Drive', badge: 'Exposed Timing Belt', color: '#f59e0b', description: 'Modular diesel matrix timing belt cover with tensioner pulley.' },
    { title: 'Integrated Intake Intercooler', badge: '2000-Bar Common Rail', color: '#ffffff', description: 'Ultra-high pressure solenoid common rail fuel delivery.' },
  ],
  'AUTO-SUZUKI-K15B': [
    { title: 'SHVS Copper-Wound ISG Motor', badge: 'SHVS Copper ISG Motor', color: '#b45309', description: 'Integrated Starter Generator with exposed copper stator windings and dual tensioner.' },
    { title: '12V Hybrid Battery Conduit', badge: '12V Hybrid Bus Wire', color: '#f97316', description: 'Lightweight orange electrical assist bus connecting to smart lithium unit.' },
    { title: 'DualJet Compact Alloy Block', badge: 'DualJet Alloy Block', color: '#38bdf8', description: 'Twin-injector per cylinder head with fluorescent green coolant expansion bottle.' },
  ],
  'AUTO-HONDA-1.5-IDTEC': [
    { title: 'All-Aluminum Open-Deck Diesel', badge: 'All-Aluminum Diesel', color: '#10b981', description: 'Lightweight thin-walled aluminum cylinder block with cast-iron liners.' },
    { title: 'Earth Dreams Eco Plaque', badge: 'Earth Dreams Plaque', color: '#22c55e', description: 'Brushed aluminum cover with emerald green Eco Technology badge.' },
    { title: 'Compact Forward-Mount Turbo', badge: 'Forward-Mount VGT Turbo', color: '#38bdf8', description: 'Low-inertia turbocharger positioned close to exhaust ports for fast response.' },
  ],
};

export const AutoEngineModel3D: React.FC<AutoEngineModel3DProps> = ({
  engine,
  telemetry,
  isSimulating = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>('iso');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('clay_cad');
  const [showCalloutPins, setShowCalloutPins] = useState<boolean>(true);

  // Animation & Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Moving Part Objects
  const rotatingPartsRef = useRef<{
    crankPulley?: THREE.Object3D;
    waterPumpPulley?: THREE.Object3D;
    altPulley?: THREE.Object3D;
    radiatorFan?: THREE.Object3D;
    timingPulley?: THREE.Object3D;
  }>({});

  // 3D Callout Pin Mesh Group
  const calloutPinsGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit Controls
  // Default isometric perspective where the front accessory drive, valve cover, and left flank exhaust are in full view
  const controlsRef = useRef<{
    isDragging: boolean;
    prevX: number;
    prevY: number;
    targetRotX: number;
    targetRotY: number;
    zoom: number;
  }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    targetRotX: 0.28,
    targetRotY: -2.25,
    zoom: 7.6,
  });

  const engineGroupRef = useRef<THREE.Group | null>(null);

  // Get active feature callouts
  const featureCallouts = ENGINE_ARCHITECTURE_CALLOUTS[engine.engine_id] || [
    { title: 'Precision Engine Block', badge: `${engine.cylinder_configuration}`, color: '#f59e0b', description: `${engine.aspiration} propulsion system.` },
    { title: 'Fuel Delivery Architecture', badge: `${engine.fuel_type.replace('_', ' ')}`, color: '#38bdf8', description: `${engine.specifications.displacement_cc} cc displacement.` },
    { title: 'Tuned Exhaust System', badge: `${engine.specifications.rated_power_hp} HP Output`, color: '#10b981', description: `${engine.specifications.peak_torque_nm} Nm peak torque.` },
  ];

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 410;

    // 1. Scene & Studio Backdrop
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer with soft PCF shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambientLight);

    // Key Light (warm studio spotlight)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    keyLight.position.set(-7, 9, -5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (cool blue fill from opposite side)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.5);
    fillLight.position.set(7, 6, 6);
    scene.add(fillLight);

    // Top Overhead Rim Light
    const topRimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    topRimLight.position.set(0, 10, 0);
    scene.add(topRimLight);

    // Warm Under-Engine Amber Glow Light
    const underLight = new THREE.DirectionalLight(0xf59e0b, 0.85);
    underLight.position.set(-2, -5, -3);
    scene.add(underLight);

    // Contact Ground Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(4.2, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x020408, transparent: true, opacity: 0.7 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -1.25, 0);
    scene.add(shadowMesh);

    // Build the Engine Mesh Group based on selected engine
    const engineGroup = buildEngineModel(engine, renderStyle, showCalloutPins);
    engineGroupRef.current = engineGroup;
    scene.add(engineGroup);

    // Mouse Interaction Handlers
    const handleMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevX;
      const deltaY = e.clientY - controlsRef.current.prevY;
      controlsRef.current.targetRotY -= deltaX * 0.008;
      controlsRef.current.targetRotX += deltaY * 0.008;
      controlsRef.current.targetRotX = Math.max(-0.4, Math.min(1.2, controlsRef.current.targetRotX));
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.zoom = Math.max(4.0, Math.min(13.0, controlsRef.current.zoom + e.deltaY * 0.005));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Resize observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let currentRotX = controlsRef.current.targetRotX;
    let currentRotY = controlsRef.current.targetRotY;
    let currentDist = controlsRef.current.zoom;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth camera orbit damping
      currentRotX += (controlsRef.current.targetRotX - currentRotX) * 0.1;
      currentRotY += (controlsRef.current.targetRotY - currentRotY) * 0.1;
      currentDist += (controlsRef.current.zoom - currentDist) * 0.1;

      camera.position.x = currentDist * Math.sin(currentRotY) * Math.cos(currentRotX);
      camera.position.y = currentDist * Math.sin(currentRotX);
      camera.position.z = currentDist * Math.cos(currentRotY) * Math.cos(currentRotX);
      camera.lookAt(0, 0.25, 0);

      // Rotate moving parts in accordance with RPM
      const rpm = telemetry?.rpm || (isSimulating ? 850 : 0);
      const radPerFrame = (rpm * 2 * Math.PI) / (60 * 60);

      if (rotatingPartsRef.current.crankPulley) {
        rotatingPartsRef.current.crankPulley.rotation.z += radPerFrame;
      }
      if (rotatingPartsRef.current.waterPumpPulley) {
        rotatingPartsRef.current.waterPumpPulley.rotation.z -= radPerFrame * 0.95;
      }
      if (rotatingPartsRef.current.altPulley) {
        rotatingPartsRef.current.altPulley.rotation.z += radPerFrame * 1.8;
      }
      if (rotatingPartsRef.current.radiatorFan) {
        rotatingPartsRef.current.radiatorFan.rotation.z += radPerFrame * 1.2;
      }
      if (rotatingPartsRef.current.timingPulley) {
        rotatingPartsRef.current.timingPulley.rotation.z += radPerFrame * 0.5;
      }

      // Gentle floating pulsing animation for 3D Callout Pins
      if (calloutPinsGroupRef.current) {
        const time = Date.now() * 0.003;
        calloutPinsGroupRef.current.children.forEach((child, idx) => {
          child.position.y += Math.sin(time + idx * 1.5) * 0.0015;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [engine, renderStyle, showCalloutPins]);

  // Handle Camera Presets
  const applyViewPreset = (preset: ViewPreset) => {
    setViewPreset(preset);
    if (preset === 'iso') {
      controlsRef.current.targetRotX = 0.28;
      controlsRef.current.targetRotY = -2.25;
      controlsRef.current.zoom = 7.6;
    } else if (preset === 'front_belt') {
      controlsRef.current.targetRotX = 0.12;
      controlsRef.current.targetRotY = -3.14;
      controlsRef.current.zoom = 6.4;
    } else if (preset === 'headers') {
      controlsRef.current.targetRotX = 0.25;
      controlsRef.current.targetRotY = -1.57;
      controlsRef.current.zoom = 6.8;
    } else if (preset === 'transmission') {
      controlsRef.current.targetRotX = 0.3;
      controlsRef.current.targetRotY = 0.55;
      controlsRef.current.zoom = 7.2;
    } else if (preset === 'top_cover') {
      controlsRef.current.targetRotX = 1.05;
      controlsRef.current.targetRotY = -2.25;
      controlsRef.current.zoom = 6.5;
    }
  };

  return (
    <div className={`relative w-full h-[410px] bg-[#070b14] rounded-xl overflow-hidden border border-[#f59e0b]/40 shadow-2xl flex flex-col ${className}`}>
      {/* 1. Header Toolbar with Engine Title & Camera Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#090e1b]/90 backdrop-blur-md border-b border-[#3b494b]/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#dee2f5] tracking-wide">
            {engine.name}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40">
            {engine.cylinder_configuration} • {engine.fuel_type.replace('_', ' ')}
          </span>
        </div>

        {/* View Presets & Shading Modes */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="flex items-center bg-[#090e1b] rounded-lg p-0.5 border border-[#3b494b]/40">
            <button
              onClick={() => applyViewPreset('iso')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'iso' ? 'bg-[#f59e0b] text-[#090e1b] font-bold' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              ISO 3/4
            </button>
            <button
              onClick={() => applyViewPreset('front_belt')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'front_belt' ? 'bg-[#f59e0b] text-[#090e1b] font-bold' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              FRONT DRIVE
            </button>
            <button
              onClick={() => applyViewPreset('headers')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'headers' ? 'bg-[#f59e0b] text-[#090e1b] font-bold' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              EXHAUST
            </button>
            <button
              onClick={() => applyViewPreset('top_cover')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'top_cover' ? 'bg-[#f59e0b] text-[#090e1b] font-bold' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              TOP HEAD
            </button>
            <button
              onClick={() => applyViewPreset('transmission')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                viewPreset === 'transmission' ? 'bg-[#f59e0b] text-[#090e1b] font-bold' : 'text-[#849495] hover:text-[#dee2f5]'
              }`}
            >
              GEARBOX
            </button>
          </div>

          <button
            onClick={() => setShowCalloutPins(!showCalloutPins)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-colors ${
              showCalloutPins
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                : 'bg-[#090e1b] border-[#3b494b]/40 text-[#849495] hover:text-[#dee2f5]'
            }`}
            title="Toggle 3D Feature Hotspot Pins"
          >
            <Tag className="w-3 h-3" />
            <span>PINS</span>
          </button>

          <button
            onClick={() => setRenderStyle(renderStyle === 'clay_cad' ? 'metallic' : 'clay_cad')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#090e1b] border border-[#3b494b]/40 text-[#849495] hover:text-[#f59e0b] text-[10px]"
            title="Toggle Clay CAD / Metallic Shader"
          >
            <Layers className="w-3 h-3" />
            <span className="uppercase">{renderStyle === 'clay_cad' ? 'Clay CAD' : 'Metallic'}</span>
          </button>
        </div>
      </div>

      {/* 2. WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* 3. Distinctive Architecture Feature Badges (Floating Callouts above bottom HUD) */}
      <div className="absolute bottom-12 left-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
        {featureCallouts.map((feat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#090e1b]/90 border border-[#3b494b]/70 backdrop-blur-md shadow-lg"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: feat.color, boxShadow: `0 0 6px ${feat.color}` }}
            />
            <span className="font-mono text-[9px] font-bold text-[#dee2f5]">
              {feat.badge}
            </span>
          </div>
        ))}
      </div>

      {/* 4. Bottom HUD Overlay: Real-time Operating Limits & Live Telemetry */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#090e1b]/90 backdrop-blur-md border-t border-[#3b494b]/40 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#849495]">Displacement:</span>
            <span className="text-[#dee2f5] font-bold">{engine.specifications.displacement_cc} cc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#849495]">Power:</span>
            <span className="text-[#38bdf8] font-bold">{engine.specifications.rated_power_hp} HP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#849495]">Torque:</span>
            <span className="text-[#f59e0b] font-bold">{engine.specifications.peak_torque_nm} Nm</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="text-[#849495]">Compression:</span>
            <span className="text-[#dee2f5] font-bold">{engine.specifications.compression_ratio}:1</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#849495]">
          <span>Drag to Orbit • Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Three.js Procedural Engine Model Builder
  // Unique Architecture for EVERY engine in the catalog:
  // - V8: 90° dual cylinder banks, Hot-V twin turbos, dual 4-into-1 exhaust headers, AMG plaque.
  // - BMW B58 I6: Long 3.6m block, BMW TwinPower cover with M tricolor stripes, 6 header pipes, top liquid intercooler.
  // - Honda K20C1: Championship Red wrinkle cover, VTEC Turbo plaque, heat-blued stainless headers, red cold-air intake cone.
  // - Toyota M20A Hybrid: Electric Cyan Blue cover, twin safety orange 600V HV conduit cables, aluminum inverter box, beltless drive.
  // - Toyota 2GD Diesel: Giant Top-Mounted Air-to-Air Intercooler with aluminum ducts, white 9-blade viscous mechanical fan, heavy cast block.
  // - Hyundai Kappa 1.2 NA: 4 sweeping high-rise black polymer intake horns arching over top, NO turbo, vertical catalytic converter with gold O2 sensor.
  // - Hyundai 1.6 CRDi Diesel: Mirror chrome 1800-bar Common Rail tube with 4 metal injector lines, VGT turbo, EGR cooler, acoustic cover.
  // - VW EA888 2.0 TSI: Two-tone TSI cover with 4 bright crimson red Audi R8 ignition coils, IHI IS20 turbocharger.
  // - VW EA288 2.0 TDI: TDI Clean Diesel cover, exposed toothed timing belt and tensioner, cylindrical DPF canister.
  // - Suzuki K15B Hybrid: Exposed copper-wound SHVS ISG motor, dual-tensioner belt, orange 12V hybrid bus wire, translucent green coolant bottle.
  // - Honda 1.5 i-DTEC Diesel: All-aluminum lightweight diesel block, Earth Dreams eco plaque, forward-mounted low-lag turbo.
  // ---------------------------------------------------------------------------
  function buildEngineModel(engineEntry: EngineCatalogEntry, style: RenderStyle, enablePins: boolean): THREE.Group {
    const root = new THREE.Group();
    rotatingPartsRef.current = {};

    const id = engineEntry.engine_id.toUpperCase();
    const isV8 = engineEntry.cylinder_configuration.includes('V8');
    const isI6 = engineEntry.cylinder_configuration.includes('INLINE_6') || engineEntry.cylinder_configuration.includes('I6');
    const isHybrid = engineEntry.fuel_type.includes('HYBRID');
    const isDiesel = engineEntry.fuel_type.includes('DIESEL');
    const isTurbo = engineEntry.aspiration.includes('TURBO');

    // Specific Engine Identifiers
    const isHondaTypeR = id.includes('K20C1');
    const isSuzukiHybrid = id.includes('SUZUKI-K15B');
    const isToyotaHybrid = id.includes('TOYOTA-M20A');
    const isToyotaTruckDiesel = id.includes('TOYOTA-2GD');
    const isHyundaiKappaNA = id.includes('KAPPA-1.2');
    const isHyundaiDiesel = id.includes('HYUNDAI-1.6CRDI');
    const isVwTsi = id.includes('EA888');
    const isVwTdi = id.includes('EA288');
    const isBmwI6 = id.includes('B58');
    const isAmgV8 = id.includes('M177') || isV8;
    const isHondaDiesel = id.includes('IDTEC');

    const isClay = style === 'clay_cad';

    // Materials Palette with authentic automotive textures and distinguishable colors
    const matCastIron = new THREE.MeshStandardMaterial({
      color: isClay ? 0x9ba2af : 0x2b303c,
      roughness: isClay ? 0.48 : 0.45,
      metalness: isClay ? 0.28 : 0.65,
    });

    const matAluminum = new THREE.MeshStandardMaterial({
      color: isClay ? 0xcbd0d8 : 0xa1a1aa,
      roughness: isClay ? 0.42 : 0.35,
      metalness: isClay ? 0.32 : 0.8,
    });

    // Unmistakable Valve Cover Colors
    let valveCoverColor = 0xcfd4dc;
    if (isHondaTypeR) {
      valveCoverColor = 0xdc2626; // Brilliant Championship Red
    } else if (isAmgV8) {
      valveCoverColor = isClay ? 0x94a3b8 : 0x1e293b; // Satin Graphite Black
    } else if (isBmwI6) {
      valveCoverColor = isClay ? 0x94a3b8 : 0x0f172a; // Deep BMW Slate / Anthracite
    } else if (isToyotaHybrid) {
      valveCoverColor = 0x0284c7; // Striking Electric Cyan Blue
    } else if (isHyundaiDiesel) {
      valveCoverColor = isClay ? 0x64748b : 0x27272a; // Deep Matte Charcoal CRDi
    } else if (isVwTdi) {
      valveCoverColor = isClay ? 0x64748b : 0x1e293b; // Deep Slate Blue TDI
    } else if (isVwTsi) {
      valveCoverColor = isClay ? 0x94a3b8 : 0x18181b; // Piano Black TSI Cover
    } else if (isToyotaTruckDiesel) {
      valveCoverColor = isClay ? 0x78716c : 0x334155; // Rugged Heavy-Duty Cast Iron
    } else if (isHyundaiKappaNA) {
      valveCoverColor = isClay ? 0xd1d5db : 0xa1a1aa; // Natural Cast Raw Aluminum
    } else if (isSuzukiHybrid) {
      valveCoverColor = isClay ? 0xcbd5e1 : 0x94a3b8; // Compact DualJet Silver
    } else if (isHondaDiesel) {
      valveCoverColor = isClay ? 0xcbd5e1 : 0x94a3b8; // Earth Dreams Lightweight Silver
    }

    const matValveCover = new THREE.MeshStandardMaterial({
      color: valveCoverColor,
      roughness: isHondaTypeR ? 0.55 : 0.38,
      metalness: isHondaTypeR ? 0.35 : isClay ? 0.28 : 0.55,
    });

    const matExhaustPipes = new THREE.MeshStandardMaterial({
      color: isHondaTypeR
        ? (isClay ? 0xcfd4dc : 0xe4e4e7) // Polished Stainless Header for Type R
        : (isClay ? 0xb4bcc8 : 0x71717a),
      roughness: isClay ? 0.42 : 0.25,
      metalness: isClay ? 0.36 : 0.85,
    });

    const matBeltRubber = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.05,
    });

    const matRadiatorCore = new THREE.MeshStandardMaterial({
      color: isClay ? 0x8b93a0 : 0x3f3f46,
      roughness: 0.75,
      metalness: 0.35,
    });

    // High Voltage Safety Orange (Toyota M20A, Suzuki SHVS)
    const matOrangeHV = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.3,
      metalness: 0.15,
    });

    // Solid Mirror Chrome (Common Rail, Emblems, Oil Caps)
    const matChrome = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.98,
    });

    // Performance Red (Audi/VW Coil packs, Type R filters)
    const matRedCoils = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.25,
      metalness: 0.2,
    });

    // Copper for ISG Motor Windings
    const matCopper = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Gold/Titanium for Wastegates & O2 Sensors
    const matTitaniumGold = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.25,
      metalness: 0.85,
    });

    // Heat-blued Exhaust Welds
    const matHeatBlued = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Eco Green Accent (Honda Earth Dreams)
    const matEcoGreen = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.4,
    });

    // Fluorescent Green Coolant Fluid
    const matCoolantFluid = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    // BMW M-Tricolor Materials
    const matBmwCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const matBmwNavy = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const matBmwRed = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    // -------------------------------------------------------------------------
    // 1. ENGINE BLOCK & SIZING PROPORTIONS
    // V8 is 2.6m long & 1.85m wide!
    // Inline-6 (BMW B58) is 3.6m long (50% longer than 4-cylinders)!
    // Truck Diesel (2GD) is 2.3m long & 1.55m tall with deep sump!
    // Standard I-4 is 2.0m long & 1.1m wide.
    // -------------------------------------------------------------------------
    const blockLength = isBmwI6 ? 3.6 : isAmgV8 ? 2.6 : isToyotaTruckDiesel ? 2.3 : isHyundaiKappaNA ? 1.85 : 2.0;
    const blockWidth = isAmgV8 ? 1.85 : isToyotaTruckDiesel ? 1.25 : 1.1;
    const blockHeight = isToyotaTruckDiesel ? 1.55 : 1.3;

    const blockGeo = new THREE.BoxGeometry(blockWidth, blockHeight, blockLength);
    const blockMesh = new THREE.Mesh(blockGeo, matCastIron);
    blockMesh.position.set(0, 0, 0);
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    root.add(blockMesh);

    // Deep Ribbed Oil Pan below block
    const oilPanHeight = isToyotaTruckDiesel ? 0.65 : 0.45;
    const oilPanGeo = new THREE.BoxGeometry(blockWidth * 0.85, oilPanHeight, blockLength * 0.9);
    const oilPanMesh = new THREE.Mesh(oilPanGeo, isToyotaTruckDiesel ? matCastIron : matAluminum);
    oilPanMesh.position.set(0, -blockHeight / 2 - oilPanHeight / 2, 0);
    root.add(oilPanMesh);

    // Oil pan longitudinal cooling fins
    for (let f = -3; f <= 3; f++) {
      const fGeo = new THREE.BoxGeometry(blockWidth * 0.82, 0.04, 0.06);
      const fMesh = new THREE.Mesh(fGeo, matAluminum);
      fMesh.position.set(0, -blockHeight / 2 - oilPanHeight + 0.05, f * 0.2);
      root.add(fMesh);
    }

    // -------------------------------------------------------------------------
    // 2. CYLINDER HEADS, VALVE COVERS & ENGINE-SPECIFIC ARCHITECTURE
    // -------------------------------------------------------------------------
    if (isAmgV8) {
      // -----------------------------------------------------------------------
      // 90° V8 ARCHITECTURE: Dual Angled Cylinder Banks & Hot-V Twin Turbos
      // -----------------------------------------------------------------------
      [-1, 1].forEach((side) => {
        const headGroup = new THREE.Group();
        const headGeo = new THREE.BoxGeometry(0.75, 0.45, blockLength);
        const headMesh = new THREE.Mesh(headGeo, matAluminum);
        headGroup.add(headMesh);

        // Angled valve cover with longitudinal cooling ribs
        const coverGeo = new THREE.BoxGeometry(0.68, 0.35, blockLength * 0.95);
        const coverMesh = new THREE.Mesh(coverGeo, matValveCover);
        coverMesh.position.set(0, 0.38, 0);
        headGroup.add(coverMesh);

        // Stamped brand emblem plaque: "///AMG V8 BITURBO"
        const badgeGeo = new THREE.BoxGeometry(0.58, 0.08, 0.85);
        const badgeMesh = new THREE.Mesh(badgeGeo, matAluminum);
        badgeMesh.position.set(0, 0.56, 0);
        headGroup.add(badgeMesh);

        // Longitudinal cooling ribs across cover
        for (let r = -4; r <= 4; r++) {
          const ribGeo = new THREE.BoxGeometry(0.55, 0.04, 0.08);
          const ribMesh = new THREE.Mesh(ribGeo, matAluminum);
          ribMesh.position.set(0, 0.58, r * 0.24);
          headGroup.add(ribMesh);
        }

        // Oil filler cap on bank 1
        if (side === -1) {
          const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
          const capMesh = new THREE.Mesh(capGeo, matChrome);
          capMesh.position.set(0, 0.62, -blockLength * 0.35);
          headGroup.add(capMesh);
        }

        headGroup.rotation.z = (side * Math.PI) / 4;
        headGroup.position.set(side * 0.68, 0.75, 0);
        root.add(headGroup);
      });

      // "HOT-V" TWIN TURBOCHARGERS MOUNTED RIGHT IN THE CENTRAL VALLEY!
      const hotVGroup = new THREE.Group();
      [-0.28, 0.28].forEach((xOffset) => {
        const tScrollGeo = new THREE.TorusGeometry(0.24, 0.1, 16, 24);
        const tScrollMesh = new THREE.Mesh(tScrollGeo, matTitaniumGold);
        tScrollMesh.position.set(xOffset, 0, 0);
        hotVGroup.add(tScrollMesh);

        // Golden wastegate actuator
        const wgGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
        wgGeo.rotateZ(Math.PI / 2);
        const wgMesh = new THREE.Mesh(wgGeo, matChrome);
        wgMesh.position.set(xOffset * 1.5, 0.2, 0.1);
        hotVGroup.add(wgMesh);
      });

      // Twin Carbon/Aluminum Charge Air Inlets from front
      [-0.25, 0.25].forEach((xOff) => {
        const inletPipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 16);
        inletPipeGeo.rotateX(Math.PI / 2);
        const inletMesh = new THREE.Mesh(inletPipeGeo, matCastIron);
        inletMesh.position.set(xOff, 0.28, -0.4);
        hotVGroup.add(inletMesh);

        // Conical air intake filters at front
        const coneFilterGeo = new THREE.ConeGeometry(0.15, 0.35, 16);
        coneFilterGeo.rotateX(-Math.PI / 2);
        const coneFilterMesh = new THREE.Mesh(coneFilterGeo, matRedCoils);
        coneFilterMesh.position.set(xOff, 0.28, -0.9);
        hotVGroup.add(coneFilterMesh);
      });

      hotVGroup.position.set(0, 0.88, -0.1);
      root.add(hotVGroup);
    } else if (isBmwI6) {
      // -----------------------------------------------------------------------
      // BMW B58 INLINE-6 ARCHITECTURE: Long Block with Top Water-to-Air Intercooler
      // -----------------------------------------------------------------------
      const headGeo = new THREE.BoxGeometry(blockWidth * 0.95, 0.45, blockLength);
      const headMesh = new THREE.Mesh(headGeo, matAluminum);
      headMesh.position.set(0, 0.85, 0);
      root.add(headMesh);

      // Sleek Longitudinal Engine Beauty Cover
      const coverGeo = new THREE.BoxGeometry(blockWidth * 0.88, 0.32, blockLength * 0.95);
      const coverMesh = new THREE.Mesh(coverGeo, matValveCover);
      coverMesh.position.set(0, 1.2, 0);
      root.add(coverMesh);

      // Silver "BMW TwinPower Turbo" Plaque
      const plaqueGeo = new THREE.BoxGeometry(blockWidth * 0.55, 0.06, blockLength * 0.65);
      const plaqueMesh = new THREE.Mesh(plaqueGeo, matAluminum);
      plaqueMesh.position.set(0, 1.37, 0);
      root.add(plaqueMesh);

      // Iconic BMW M-Power Tricolor Stripes (Cyan, Navy, Red)
      const stripeW = 0.05;
      const stripeL = blockLength * 0.55;
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 0.08, stripeL), matBmwCyan);
      cMesh.position.set(-0.1, 1.38, 0);
      root.add(cMesh);

      const nMesh = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 0.08, stripeL), matBmwNavy);
      nMesh.position.set(-0.04, 1.38, 0);
      root.add(nMesh);

      const rMesh = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 0.08, stripeL), matBmwRed);
      rMesh.position.set(0.02, 1.38, 0);
      root.add(rMesh);

      // Liquid Water-to-Air Intercooler Box on Front-Left
      const icBoxGeo = new THREE.BoxGeometry(0.55, 0.4, blockLength * 0.45);
      const icBoxMesh = new THREE.Mesh(icBoxGeo, matAluminum);
      icBoxMesh.position.set(-blockWidth / 2 - 0.22, 1.15, -0.2);
      root.add(icBoxMesh);

      // Dual blue-anodized mini coolant hoses
      for (let h = -1; h <= 1; h += 2) {
        const miniHose = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8);
        miniHose.rotateZ(Math.PI / 2);
        const mhMesh = new THREE.Mesh(miniHose, matBeltRubber);
        mhMesh.position.set(-blockWidth / 2 - 0.52, 1.25, -0.2 + h * 0.25);
        root.add(mhMesh);
      }
    } else if (isToyotaTruckDiesel) {
      // -----------------------------------------------------------------------
      // TOYOTA 2GD-FTV DIESEL: Top-Mounted Air-to-Air Intercooler Core
      // -----------------------------------------------------------------------
      const headGeo = new THREE.BoxGeometry(blockWidth * 0.95, 0.45, blockLength);
      const headMesh = new THREE.Mesh(headGeo, matAluminum);
      headMesh.position.set(0, 0.85, 0);
      root.add(headMesh);

      const coverGeo = new THREE.BoxGeometry(blockWidth * 0.85, 0.32, blockLength * 0.95);
      const coverMesh = new THREE.Mesh(coverGeo, matValveCover);
      coverMesh.position.set(0, 1.2, 0);
      root.add(coverMesh);

      // Massive Top-Mounted Air-to-Air Intercooler (Hilux/Fortuner signature)
      const topIcCoreGeo = new THREE.BoxGeometry(0.95, 0.22, 1.3);
      const topIcMesh = new THREE.Mesh(topIcCoreGeo, matRadiatorCore);
      topIcMesh.position.set(0, 1.58, 0.1);
      root.add(topIcMesh);

      // Intercooler Aluminum End Tanks
      [-0.7, 0.7].forEach((zP) => {
        const tankGeo = new THREE.BoxGeometry(1.0, 0.25, 0.16);
        const tankMesh = new THREE.Mesh(tankGeo, matAluminum);
        tankMesh.position.set(0, 1.58, 0.1 + zP);
        root.add(tankMesh);
      });

      // Cast Aluminum Air Feed Duct looping into top intercooler
      const ductCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-blockWidth / 2 - 0.4, 0.5, -0.4),
        new THREE.Vector3(-blockWidth / 2 - 0.3, 1.4, -0.2),
        new THREE.Vector3(-0.35, 1.62, -0.1),
      ]);
      const ductGeo = new THREE.TubeGeometry(ductCurve, 14, 0.09, 10, false);
      const ductMesh = new THREE.Mesh(ductGeo, matAluminum);
      root.add(ductMesh);
    } else if (isHyundaiKappaNA) {
      // -----------------------------------------------------------------------
      // HYUNDAI KAPPA 1.2: Naturally Aspirated 4-Horn Arching Intake Plenum
      // -----------------------------------------------------------------------
      const headGeo = new THREE.BoxGeometry(blockWidth * 0.95, 0.42, blockLength);
      const headMesh = new THREE.Mesh(headGeo, matAluminum);
      headMesh.position.set(0, 0.82, 0);
      root.add(headMesh);

      const coverGeo = new THREE.BoxGeometry(blockWidth * 0.85, 0.28, blockLength * 0.95);
      const coverMesh = new THREE.Mesh(coverGeo, matValveCover);
      coverMesh.position.set(0, 1.15, 0);
      root.add(coverMesh);

      // Silver "1.2 DUAL VTVT" Plaque
      const plaqueGeo = new THREE.BoxGeometry(blockWidth * 0.55, 0.05, 0.7);
      const plaqueMesh = new THREE.Mesh(plaqueGeo, matAluminum);
      plaqueMesh.position.set(0, 1.3, 0);
      root.add(plaqueMesh);

      // 4 Sweeping Black Polymer Intake Horns Arching Overhead
      for (let r = 0; r < 4; r++) {
        const zP = -blockLength * 0.35 + r * (blockLength * 0.7 / 3);
        const hornCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(blockWidth / 2 + 0.25, 0.7, zP),
          new THREE.Vector3(blockWidth / 2 + 0.1, 1.5, zP),
          new THREE.Vector3(-0.1, 1.58, zP),
          new THREE.Vector3(-blockWidth / 2 - 0.1, 1.35, zP),
        ]);
        const hornGeo = new THREE.TubeGeometry(hornCurve, 18, 0.06, 10, false);
        const hornMesh = new THREE.Mesh(hornGeo, matCastIron);
        root.add(hornMesh);
      }

      // Front Throttle Body & Conical Sport Intake Filter
      const tbGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
      tbGeo.rotateX(Math.PI / 2);
      const tbMesh = new THREE.Mesh(tbGeo, matAluminum);
      tbMesh.position.set(-blockWidth / 2 - 0.15, 1.35, -blockLength * 0.45);
      root.add(tbMesh);

      const airFilterGeo = new THREE.ConeGeometry(0.16, 0.35, 16);
      airFilterGeo.rotateX(-Math.PI / 2);
      const airFilterMesh = new THREE.Mesh(airFilterGeo, matRedCoils);
      airFilterMesh.position.set(-blockWidth / 2 - 0.15, 1.35, -blockLength * 0.45 - 0.3);
      root.add(airFilterMesh);

      // Vertical Stainless Catalytic Converter directly under exhaust manifold (NO TURBO!)
      const catGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.7, 16);
      const catMesh = new THREE.Mesh(catGeo, matExhaustPipes);
      catMesh.position.set(-blockWidth / 2 - 0.45, -0.2, 0.1);
      root.add(catMesh);

      // Upstream Oxygen Sensor with Brass Nut & Titanium Probe
      const o2Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8);
      o2Geo.rotateZ(Math.PI / 2);
      const o2Mesh = new THREE.Mesh(o2Geo, matTitaniumGold);
      o2Mesh.position.set(-blockWidth / 2 - 0.3, 0.1, 0.1);
      root.add(o2Mesh);
    } else {
      // -----------------------------------------------------------------------
      // STANDARD INLINE-4 / CRDi / TSI / VTEC / HYBRID ARCHITECTURES
      // -----------------------------------------------------------------------
      const headGeo = new THREE.BoxGeometry(blockWidth * 0.95, 0.45, blockLength);
      const headMesh = new THREE.Mesh(headGeo, matAluminum);
      headMesh.position.set(0, 0.85, 0);
      root.add(headMesh);

      // Distinctive Valve Cover
      const coverGeo = new THREE.BoxGeometry(blockWidth * 0.85, 0.32, blockLength * 0.95);
      const coverMesh = new THREE.Mesh(coverGeo, matValveCover);
      coverMesh.position.set(0, 1.2, 0);
      root.add(coverMesh);

      // Custom Plaque per Engine Brand
      const badgeGeo = new THREE.BoxGeometry(blockWidth * 0.65, 0.06, 0.85);
      const badgeMesh = new THREE.Mesh(
        badgeGeo,
        isHondaTypeR ? matAluminum : isToyotaHybrid ? matAluminum : isHondaDiesel ? matEcoGreen : matAluminum
      );
      badgeMesh.position.set(0, 1.37, 0);
      root.add(badgeMesh);

      // Cooling fins across valve cover
      for (let f = 0; f < 5; f++) {
        const finGeo = new THREE.BoxGeometry(blockWidth * 0.75, 0.03, 0.06);
        const finMesh = new THREE.Mesh(finGeo, matAluminum);
        finMesh.position.set(0, 1.38, -blockLength * 0.4 + f * (blockLength * 0.8 / 5));
        root.add(finMesh);
      }

      // Oil filler cap
      const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
      const capMesh = new THREE.Mesh(capGeo, isHondaTypeR ? matRedCoils : matChrome);
      capMesh.position.set(-0.2, 1.45, -blockLength * 0.35);
      root.add(capMesh);

      // Spark Plug / Ignition Coils (Bright Crimson Red on VW EA888 TSI!)
      for (let c = 0; c < 4; c++) {
        const zPos = -blockLength * 0.38 + c * (blockLength * 0.76 / 3);
        const coilGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12);
        const coilMesh = new THREE.Mesh(coilGeo, isVwTsi ? matRedCoils : isHondaTypeR ? matRedCoils : matCastIron);
        coilMesh.position.set(0.15, 1.45, zPos);
        root.add(coilMesh);
      }
    }

    // -------------------------------------------------------------------------
    // 3. COMMON RAIL DIESEL SYSTEM (Hyundai 1.6 CRDi, VW EA288 TDI, Honda i-DTEC, Toyota 2GD)
    // -------------------------------------------------------------------------
    if (isDiesel) {
      // Solid Mirror Chrome Common Rail High-Pressure Tube
      const railGeo = new THREE.CylinderGeometry(0.06, 0.06, blockLength * 0.8, 16);
      railGeo.rotateX(Math.PI / 2);
      const railMesh = new THREE.Mesh(railGeo, matChrome);
      railMesh.position.set(-0.35, 1.38, 0);
      root.add(railMesh);

      // 4 Metal Injector Feed Lines to cylinders
      for (let i = 0; i < 4; i++) {
        const zP = -blockLength * 0.3 + i * (blockLength * 0.6 / 3);
        const lineCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.35, 1.38, zP),
          new THREE.Vector3(-0.25, 1.52, zP + 0.04),
          new THREE.Vector3(-0.1, 1.42, zP),
        ]);
        const lineGeo = new THREE.TubeGeometry(lineCurve, 10, 0.02, 8, false);
        const lineMesh = new THREE.Mesh(lineGeo, matChrome);
        root.add(lineMesh);
      }

      // Cylindrical Stainless EGR Cooler Assembly on left flank
      const egrGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.15, 16);
      egrGeo.rotateX(Math.PI / 2);
      const egrMesh = new THREE.Mesh(egrGeo, matAluminum);
      egrMesh.position.set(-blockWidth / 2 - 0.42, 0.55, 0.1);
      root.add(egrMesh);

      // If VW TDI, add prominent Diesel Particulate Filter (DPF) Canister
      if (isVwTdi) {
        const dpfGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.85, 16);
        const dpfMesh = new THREE.Mesh(dpfGeo, matCastIron);
        dpfMesh.position.set(-blockWidth / 2 - 0.55, -0.2, 0.3);
        root.add(dpfMesh);
      }
    }

    // -------------------------------------------------------------------------
    // 4. SMART HYBRID ISG / HIGH-VOLTAGE ARCHITECTURE (Toyota M20A, Suzuki K15B)
    // -------------------------------------------------------------------------
    if (isHybrid) {
      if (isToyotaHybrid) {
        // Toyota M20A Dynamic Force: Inverter / Power Electronics Module on Top-Left
        const invBoxGeo = new THREE.BoxGeometry(0.65, 0.38, 0.85);
        const invBoxMesh = new THREE.Mesh(invBoxGeo, matAluminum);
        invBoxMesh.position.set(-blockWidth / 2 - 0.15, 1.3, 0.1);
        root.add(invBoxMesh);

        // Aluminum heat sink cooling fins on inverter
        for (let fin = -3; fin <= 3; fin++) {
          const invFinGeo = new THREE.BoxGeometry(0.62, 0.05, 0.05);
          const invFinMesh = new THREE.Mesh(invFinGeo, matAluminum);
          invFinMesh.position.set(-blockWidth / 2 - 0.15, 1.51, 0.1 + fin * 0.1);
          root.add(invFinMesh);
        }

        // Twin Bright Safety Orange High-Voltage 600V Conduit Cables!
        [-0.08, 0.08].forEach((offset) => {
          const hvCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-blockWidth / 2 - 0.15 + offset, 1.25, -0.3),
            new THREE.Vector3(-blockWidth / 2 - 0.2 + offset, 0.8, -blockLength / 2 + 0.1),
            new THREE.Vector3(-0.3 + offset, 0.2, -blockLength / 2 - 0.15),
          ]);
          const hvGeo = new THREE.TubeGeometry(hvCurve, 20, 0.055, 10, false);
          const hvMesh = new THREE.Mesh(hvGeo, matOrangeHV);
          root.add(hvMesh);
        });
      } else if (isSuzukiHybrid) {
        // Maruti Suzuki K15B: Exposed Copper-Wound ISG Motor on Front Accessory Drive
        const isgGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.38, 24);
        isgGeo.rotateX(Math.PI / 2);
        const isgMesh = new THREE.Mesh(isgGeo, matCopper);
        isgMesh.position.set(blockWidth / 2 + 0.28, -0.05, -blockLength / 2 - 0.05);
        root.add(isgMesh);

        // Slotted ISG housing cover showing copper stator through slits
        const isgCoverGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 24);
        isgCoverGeo.rotateX(Math.PI / 2);
        const isgCover = new THREE.Mesh(isgCoverGeo, matAluminum);
        isgCover.position.set(blockWidth / 2 + 0.28, -0.05, -blockLength / 2 + 0.15);
        root.add(isgCover);

        // 12V Hybrid Orange Battery Bus Line
        const busCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(blockWidth / 2 + 0.28, 0.1, -blockLength / 2 - 0.05),
          new THREE.Vector3(blockWidth / 2 + 0.15, 0.6, 0.0),
          new THREE.Vector3(blockWidth / 2 + 0.1, 0.95, blockLength / 2),
        ]);
        const busGeo = new THREE.TubeGeometry(busCurve, 16, 0.04, 8, false);
        const busMesh = new THREE.Mesh(busGeo, matOrangeHV);
        root.add(busMesh);

        // Translucent coolant expansion bottle with fluorescent green coolant
        const bottleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16);
        const bottleMesh = new THREE.Mesh(bottleGeo, matCoolantFluid);
        bottleMesh.position.set(-blockWidth / 2 - 0.4, 0.9, -blockLength / 2 + 0.4);
        root.add(bottleMesh);
      }
    }

    // -------------------------------------------------------------------------
    // 5. EXHAUST SYSTEM: CURVED TUBULAR HEADERS & TURBOCHARGERS
    // -------------------------------------------------------------------------
    if (!isHyundaiKappaNA) {
      const runnerCount = isAmgV8 ? 4 : isBmwI6 ? 6 : 4;
      const headerGroup = new THREE.Group();

      for (let r = 0; r < runnerCount; r++) {
        const zPort = -blockLength * 0.38 + r * (blockLength * 0.76 / (runnerCount - 1));

        // Sweeping tubular runner swooping down into collector
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-blockWidth / 2 - 0.05, 0.65, zPort),
          new THREE.Vector3(-blockWidth / 2 - 0.48, 0.4, zPort * 0.85),
          new THREE.Vector3(-blockWidth / 2 - 0.58, -0.15, zPort * 0.45),
          new THREE.Vector3(-blockWidth / 2 - 0.5, -0.42, 0.4),
        ]);

        const runnerGeo = new THREE.TubeGeometry(curve, 22, 0.07, 12, false);
        const runnerMesh = new THREE.Mesh(runnerGeo, matExhaustPipes);
        runnerMesh.castShadow = true;
        headerGroup.add(runnerMesh);

        // Port flange plate bolted to cylinder head
        const flangeGeo = new THREE.BoxGeometry(0.04, 0.2, 0.2);
        const flangeMesh = new THREE.Mesh(flangeGeo, matCastIron);
        flangeMesh.position.set(-blockWidth / 2 - 0.04, 0.65, zPort);
        headerGroup.add(flangeMesh);

        // If Honda K20C1 Type R, add heat-blued titanium weld bands around each runner!
        if (isHondaTypeR) {
          const weldRingGeo = new THREE.TorusGeometry(0.076, 0.012, 12, 16);
          const weldRing = new THREE.Mesh(weldRingGeo, matHeatBlued);
          weldRing.position.set(-blockWidth / 2 - 0.28, 0.52, zPort * 0.92);
          headerGroup.add(weldRing);
        }
      }

      // Long collector pipe merging all runners
      const collectorGeo = new THREE.CylinderGeometry(0.13, 0.15, 1.4, 16);
      collectorGeo.rotateX(Math.PI / 2);
      const collectorMesh = new THREE.Mesh(collectorGeo, matExhaustPipes);
      collectorMesh.position.set(-blockWidth / 2 - 0.5, -0.45, 0.95);
      headerGroup.add(collectorMesh);

      root.add(headerGroup);

      // If V8, mirror headers on opposite side
      if (isAmgV8) {
        const headerGroup2 = headerGroup.clone();
        headerGroup2.scale.x = -1;
        root.add(headerGroup2);
      }

      // Turbocharger housing (if turbo engine and not V8 Hot-V)
      if (isTurbo && !isAmgV8) {
        const turboGroup = new THREE.Group();

        // Turbine exhaust scroll
        const turbineGeo = new THREE.TorusGeometry(0.24, 0.12, 16, 24);
        const turbineMesh = new THREE.Mesh(turbineGeo, matCastIron);
        turboGroup.add(turbineMesh);

        // Compressor cold-side scroll
        const compGeo = new THREE.TorusGeometry(0.22, 0.11, 16, 24);
        const compMesh = new THREE.Mesh(compGeo, matAluminum);
        compMesh.position.set(0, 0, 0.22);
        turboGroup.add(compMesh);

        // Wastegate actuator canister (Gold on Type R/TSI, chrome on others)
        const wgGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
        wgGeo.rotateZ(Math.PI / 2);
        const wgMesh = new THREE.Mesh(wgGeo, isHondaTypeR || isVwTsi ? matTitaniumGold : matChrome);
        wgMesh.position.set(-0.28, 0.18, 0.1);
        turboGroup.add(wgMesh);

        turboGroup.position.set(-blockWidth / 2 - 0.54, 0.15, -0.1);
        root.add(turboGroup);
      }

      // If Honda Type R, add cold-air intake pipe with high-flow red cone filter!
      if (isHondaTypeR) {
        const caiCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-blockWidth / 2 - 0.54, 0.15, 0.12),
          new THREE.Vector3(-blockWidth / 2 - 0.35, 0.65, -0.4),
          new THREE.Vector3(-blockWidth / 2 - 0.2, 0.8, -blockLength / 2 - 0.3),
        ]);
        const caiGeo = new THREE.TubeGeometry(caiCurve, 16, 0.08, 10, false);
        const caiMesh = new THREE.Mesh(caiGeo, matAluminum);
        root.add(caiMesh);

        const coneFilterGeo = new THREE.ConeGeometry(0.18, 0.38, 16);
        coneFilterGeo.rotateX(-Math.PI / 2);
        const coneFilterMesh = new THREE.Mesh(coneFilterGeo, matRedCoils);
        coneFilterMesh.position.set(-blockWidth / 2 - 0.2, 0.8, -blockLength / 2 - 0.5);
        root.add(coneFilterMesh);
      }
    }

    // -------------------------------------------------------------------------
    // 6. FRONT ACCESSORY DRIVE: PULLEYS, SERPENTINE BELT & ALTERNATOR
    // (Notice: positioned cleanly on front face so it is NOT blocked by radiator!)
    // -------------------------------------------------------------------------
    const frontZ = -blockLength / 2 - 0.12;

    // Harmonic Balancer / Crank Pulley
    const crankPulleyGroup = new THREE.Group();
    const crankGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 32);
    crankGeo.rotateX(Math.PI / 2);
    const crankMesh = new THREE.Mesh(crankGeo, matCastIron);
    crankPulleyGroup.add(crankMesh);
    crankPulleyGroup.position.set(0, -0.35, frontZ);
    root.add(crankPulleyGroup);
    rotatingPartsRef.current.crankPulley = crankPulleyGroup;

    // Water Pump Pulley (Beltless electric water pump on Toyota Dynamic Force Hybrid!)
    if (!isToyotaHybrid) {
      const wpPulleyGroup = new THREE.Group();
      const wpGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24);
      wpGeo.rotateX(Math.PI / 2);
      const wpMesh = new THREE.Mesh(wpGeo, matAluminum);
      wpPulleyGroup.add(wpMesh);
      wpPulleyGroup.position.set(0, 0.4, frontZ);
      root.add(wpPulleyGroup);
      rotatingPartsRef.current.waterPumpPulley = wpPulleyGroup;
    }

    // Alternator with cooling slots
    const altGroup = new THREE.Group();
    const altCasingGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.35, 24);
    altCasingGeo.rotateX(Math.PI / 2);
    const altMesh = new THREE.Mesh(altCasingGeo, matAluminum);
    altGroup.add(altMesh);

    // Stator cooling vents
    for (let v = 0; v < 8; v++) {
      const vAngle = (v * Math.PI * 2) / 8;
      const slitGeo = new THREE.BoxGeometry(0.04, 0.14, 0.28);
      slitGeo.rotateZ(vAngle);
      const slitMesh = new THREE.Mesh(slitGeo, matCastIron);
      slitMesh.position.set((Math.sin(vAngle) * 0.28), (Math.cos(vAngle) * 0.28), 0);
      altGroup.add(slitMesh);
    }

    // Alternator Pulley
    const altPulleyGroup = new THREE.Group();
    const altPulleyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20);
    altPulleyGeo.rotateX(Math.PI / 2);
    const altPulleyMesh = new THREE.Mesh(altPulleyGeo, matCastIron);
    altPulleyGroup.add(altPulleyMesh);
    altPulleyGroup.position.set(0, 0, -0.22);
    altGroup.add(altPulleyGroup);
    rotatingPartsRef.current.altPulley = altPulleyGroup;

    altGroup.position.set(blockWidth / 2 + 0.25, 0.25, frontZ + 0.15);
    root.add(altGroup);

    // Serpentine Belt wrapping around pulleys
    const beltCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.73, frontZ),
      new THREE.Vector3(blockWidth / 2 + 0.43, 0.25, frontZ),
      new THREE.Vector3(0, 0.7, frontZ),
      new THREE.Vector3(-blockWidth / 2 - 0.1, 0.1, frontZ),
      new THREE.Vector3(0, -0.73, frontZ),
    ]);
    const beltGeo = new THREE.TubeGeometry(beltCurve, 32, 0.035, 8, true);
    const beltMesh = new THREE.Mesh(beltGeo, matBeltRubber);
    root.add(beltMesh);

    // If VW TDI, add visible toothed timing belt cover on upper front
    if (isVwTdi) {
      const tbCasingGeo = new THREE.BoxGeometry(0.7, 0.6, 0.12);
      const tbCasingMesh = new THREE.Mesh(tbCasingGeo, matCastIron);
      tbCasingMesh.position.set(0, 0.8, frontZ + 0.06);
      root.add(tbCasingMesh);

      const tensionerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.14, 16);
      tensionerGeo.rotateX(Math.PI / 2);
      const tensionerMesh = new THREE.Mesh(tensionerGeo, matAluminum);
      tensionerMesh.position.set(0.25, 0.85, frontZ - 0.02);
      root.add(tensionerMesh);
      rotatingPartsRef.current.timingPulley = tensionerMesh;
    }

    // -------------------------------------------------------------------------
    // 7. FRONT COOLING RADIATOR & FAN
    // Positioned forward & offset to the left flank, exactly matching CAD reference image!
    // This leaves the front accessory drive (belt, pulleys, alternator) 100% visible!
    // -------------------------------------------------------------------------
    const radZ = frontZ - 1.45;
    const radX = -0.65; // Offset to the left foreground!
    const radWidth = isAmgV8 ? 2.3 : isToyotaTruckDiesel ? 2.2 : 1.9;
    const radHeight = 1.85;

    const radiatorGroup = new THREE.Group();

    // Radiator Core
    const radCoreGeo = new THREE.BoxGeometry(radWidth, radHeight, 0.14);
    const radCoreMesh = new THREE.Mesh(radCoreGeo, matRadiatorCore);
    radCoreMesh.position.set(0, 0.3, 0);
    radiatorGroup.add(radCoreMesh);

    // Vertical cooling fins in radiator core
    for (let fin = -6; fin <= 6; fin++) {
      const vFinGeo = new THREE.BoxGeometry(0.02, radHeight * 0.95, 0.16);
      const vFinMesh = new THREE.Mesh(vFinGeo, matAluminum);
      vFinMesh.position.set(fin * (radWidth / 15), 0.3, 0);
      radiatorGroup.add(vFinMesh);
    }

    // Upper Tank with Pressure Cap
    const radTopGeo = new THREE.BoxGeometry(radWidth * 1.04, 0.2, 0.22);
    const radTopMesh = new THREE.Mesh(radTopGeo, matCastIron);
    radTopMesh.position.set(0, 0.3 + radHeight / 2 + 0.1, 0);
    radiatorGroup.add(radTopMesh);

    const radCapGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    const radCapMesh = new THREE.Mesh(radCapGeo, matChrome);
    radCapMesh.position.set(-radWidth * 0.32, 0.3 + radHeight / 2 + 0.22, 0);
    radiatorGroup.add(radCapMesh);

    // Cooling Fan: Viscous Mechanical 9-Blade Fan for Toyota Truck Diesel, or 7-Blade Electric Fan
    const fanGroup = new THREE.Group();
    const bladeCount = isToyotaTruckDiesel ? 9 : 7;
    const bladeRadius = isToyotaTruckDiesel ? 0.75 : 0.62;
    const fanHubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
    fanHubGeo.rotateX(Math.PI / 2);
    const fanHub = new THREE.Mesh(fanHubGeo, isToyotaTruckDiesel ? matAluminum : matBeltRubber);
    fanGroup.add(fanHub);

    // Fan Blades (Bright white blades with yellow safety ring for truck diesel!)
    for (let b = 0; b < bladeCount; b++) {
      const angle = (b * Math.PI * 2) / bladeCount;
      const bladeGeo = new THREE.BoxGeometry(0.14, bladeRadius, 0.02);
      bladeGeo.rotateZ(angle);
      const bladeMesh = new THREE.Mesh(bladeGeo, isToyotaTruckDiesel ? matChrome : matBeltRubber);
      bladeMesh.position.set((Math.sin(angle) * bladeRadius) / 2, (Math.cos(angle) * bladeRadius) / 2, 0);
      fanGroup.add(bladeMesh);
    }

    // Yellow perimeter safety ring for Toyota Diesel fan
    if (isToyotaTruckDiesel) {
      const ringGeo = new THREE.TorusGeometry(bladeRadius * 0.98, 0.025, 8, 24);
      const ringMesh = new THREE.Mesh(ringGeo, matTitaniumGold);
      fanGroup.add(ringMesh);
    }

    fanGroup.position.set(0, 0.3, 0.14);
    radiatorGroup.add(fanGroup);
    rotatingPartsRef.current.radiatorFan = fanGroup;

    // Molded Shroud around fan
    const shroudGeo = new THREE.CylinderGeometry(bladeRadius * 1.08, bladeRadius * 1.08, 0.22, 24, 1, true);
    shroudGeo.rotateX(Math.PI / 2);
    const shroudMesh = new THREE.Mesh(shroudGeo, matCastIron);
    shroudMesh.position.set(0, 0.3, 0.18);
    radiatorGroup.add(shroudMesh);

    // Position & Angle Radiator to the left foreground
    radiatorGroup.position.set(radX, 0, radZ);
    radiatorGroup.rotation.y = 0.22; // slight angle matching Dodge CAD reference image!
    root.add(radiatorGroup);

    // Upper and Lower Flexible Coolant Hoses connecting radiator to engine block
    const upperHoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(radX, 0.3 + radHeight / 2, radZ),
      new THREE.Vector3(radX * 0.5, 0.3 + radHeight / 2 - 0.2, frontZ - 0.5),
      new THREE.Vector3(-0.15, 0.75, frontZ + 0.1),
    ]);
    const upperHoseGeo = new THREE.TubeGeometry(upperHoseCurve, 16, 0.08, 10, false);
    const upperHoseMesh = new THREE.Mesh(upperHoseGeo, matBeltRubber);
    root.add(upperHoseMesh);

    const lowerHoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(radX, -0.4, radZ),
      new THREE.Vector3(radX * 0.6, -0.5, frontZ - 0.5),
      new THREE.Vector3(-0.2, -0.4, frontZ + 0.1),
    ]);
    const lowerHoseGeo = new THREE.TubeGeometry(lowerHoseCurve, 16, 0.08, 10, false);
    const lowerHoseMesh = new THREE.Mesh(lowerHoseGeo, matBeltRubber);
    root.add(lowerHoseMesh);

    // -------------------------------------------------------------------------
    // 8. REAR TRANSMISSION / GEARBOX CASING
    // (Long ZF 8HP on BMW I6, AMG 9G on V8, transverse manual/DSG on I-4s)
    // -------------------------------------------------------------------------
    const transZ = blockLength / 2;
    const transGroup = new THREE.Group();

    const bellRadius = isAmgV8 ? 0.95 : isBmwI6 ? 0.88 : isToyotaTruckDiesel ? 0.85 : 0.75;
    const bellGeo = new THREE.CylinderGeometry(bellRadius, bellRadius * 0.8, 0.6, 24);
    bellGeo.rotateX(Math.PI / 2);
    const bellMesh = new THREE.Mesh(bellGeo, matAluminum);
    bellMesh.position.set(0, -0.15, 0.3);
    transGroup.add(bellMesh);

    // Transmission Casing
    const caseLength = isBmwI6 ? 1.6 : isAmgV8 ? 1.4 : isToyotaTruckDiesel ? 1.3 : 1.0;
    const caseGeo = new THREE.BoxGeometry(0.9, 0.75, caseLength);
    const caseMesh = new THREE.Mesh(caseGeo, matCastIron);
    caseMesh.position.set(0, -0.2, 0.3 + caseLength / 2);
    transGroup.add(caseMesh);

    // Longitudinal cooling fins on gearbox case
    for (let g = 0; g < 6; g++) {
      const finG = new THREE.BoxGeometry(0.04, 0.45, caseLength * 0.8);
      const finMesh = new THREE.Mesh(finG, matAluminum);
      finMesh.position.set(-0.47, -0.2, 0.5 + g * 0.15);
      transGroup.add(finMesh);
    }

    // Rear output tailshaft flange
    const tailLength = isBmwI6 ? 1.0 : isAmgV8 ? 0.85 : 0.65;
    const tailGeo = new THREE.CylinderGeometry(0.24, 0.18, tailLength, 16);
    tailGeo.rotateX(Math.PI / 2);
    const tailMesh = new THREE.Mesh(tailGeo, matAluminum);
    tailMesh.position.set(0, -0.25, 0.3 + caseLength + tailLength / 2);
    transGroup.add(tailMesh);

    transGroup.position.set(0, 0, transZ);
    root.add(transGroup);

    // -------------------------------------------------------------------------
    // 9. 3D INTERACTIVE ARCHITECTURE FEATURE CALLOUT PINS
    // (Rendered directly in the 3D scene when Pins toggle is ON!)
    // -------------------------------------------------------------------------
    if (enablePins) {
      const pinsGroup = new THREE.Group();
      calloutPinsGroupRef.current = pinsGroup;

      const pinLocations: { x: number; y: number; z: number; color: number }[] = [];

      if (isAmgV8) {
        pinLocations.push({ x: 0, y: 1.6, z: -0.1, color: 0xf59e0b }); // Hot-V Turbos
        pinLocations.push({ x: -1.0, y: 1.2, z: 0.1, color: 0x38bdf8 }); // 90° Bank
        pinLocations.push({ x: -1.2, y: 0.2, z: 0.4, color: 0xf43f5e }); // Exhaust Headers
      } else if (isBmwI6) {
        pinLocations.push({ x: 0, y: 1.65, z: 0.2, color: 0x38bdf8 }); // I-6 Long Cover
        pinLocations.push({ x: -0.65, y: 1.5, z: -0.2, color: 0x0284c7 }); // Liquid Intercooler
        pinLocations.push({ x: -1.0, y: 0.1, z: -0.1, color: 0xf59e0b }); // TwinPower Turbo
      } else if (isHondaTypeR) {
        pinLocations.push({ x: 0, y: 1.65, z: 0.0, color: 0xef4444 }); // Championship Red Head
        pinLocations.push({ x: -1.15, y: 0.2, z: 0.35, color: 0x38bdf8 }); // Blued Headers
        pinLocations.push({ x: -0.8, y: 1.1, z: -blockLength / 2 - 0.4, color: 0xf59e0b }); // Red Cold Air Intake
      } else if (isToyotaHybrid) {
        pinLocations.push({ x: -0.65, y: 1.7, z: 0.1, color: 0x06b6d4 }); // Hybrid Inverter
        pinLocations.push({ x: -0.5, y: 1.1, z: -0.3, color: 0xf97316 }); // Orange HV Cables
        pinLocations.push({ x: 0, y: 1.6, z: 0.2, color: 0x10b981 }); // Dynamic Force Head
      } else if (isToyotaTruckDiesel) {
        pinLocations.push({ x: 0, y: 2.0, z: 0.1, color: 0x38bdf8 }); // Top-Mount Intercooler
        pinLocations.push({ x: radX, y: 1.3, z: radZ + 0.14, color: 0xeab308 }); // Viscous Fan
        pinLocations.push({ x: -0.35, y: 1.6, z: -0.1, color: 0xffffff }); // Common Rail
      } else if (isHyundaiKappaNA) {
        pinLocations.push({ x: 0, y: 1.85, z: 0.0, color: 0x10b981 }); // 4-Horn Intake
        pinLocations.push({ x: -blockWidth / 2 - 0.45, y: 0.4, z: 0.1, color: 0xeab308 }); // Direct Catalytic Canister
        pinLocations.push({ x: -blockWidth / 2 - 0.15, y: 1.6, z: -blockLength * 0.45 - 0.3, color: 0xef4444 }); // Sport Filter
      } else if (isHyundaiDiesel) {
        pinLocations.push({ x: -0.35, y: 1.65, z: 0.0, color: 0xffffff }); // 1800-Bar Common Rail
        pinLocations.push({ x: -blockWidth / 2 - 0.54, y: 0.5, z: -0.1, color: 0x38bdf8 }); // VGT Turbo
        pinLocations.push({ x: 0, y: 1.55, z: 0.2, color: 0x94a3b8 }); // CRDi Cover
      } else if (isVwTsi) {
        pinLocations.push({ x: 0.15, y: 1.7, z: 0.0, color: 0xef4444 }); // Red Audi R8 Coils
        pinLocations.push({ x: 0, y: 1.55, z: 0.2, color: 0xcbd5e1 }); // TSI Cover
        pinLocations.push({ x: -blockWidth / 2 - 0.54, y: 0.5, z: -0.1, color: 0xf59e0b }); // IHI Turbo
      } else if (isVwTdi) {
        pinLocations.push({ x: -blockWidth / 2 - 0.55, y: 0.4, z: 0.3, color: 0x38bdf8 }); // DPF System
        pinLocations.push({ x: 0, y: 1.25, z: frontZ + 0.06, color: 0xf59e0b }); // Timing Belt Drive
        pinLocations.push({ x: -0.35, y: 1.65, z: 0.0, color: 0xffffff }); // Common Rail
      } else if (isSuzukiHybrid) {
        pinLocations.push({ x: blockWidth / 2 + 0.28, y: 0.45, z: -blockLength / 2 - 0.05, color: 0xb45309 }); // Copper ISG Motor
        pinLocations.push({ x: -blockWidth / 2 - 0.4, y: 1.35, z: -blockLength / 2 + 0.4, color: 0x22c55e }); // Coolant Bottle
        pinLocations.push({ x: 0, y: 1.55, z: 0.0, color: 0x38bdf8 }); // DualJet Head
      } else {
        pinLocations.push({ x: 0, y: 1.6, z: 0.0, color: 0x10b981 }); // Earth Dreams Plaque
        pinLocations.push({ x: -blockWidth / 2 - 0.54, y: 0.5, z: -0.1, color: 0x38bdf8 }); // Forward Turbo
      }

      pinLocations.forEach((loc) => {
        const pinSubGroup = new THREE.Group();

        // Stem vertical line
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
        const stemMat = new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.75 });
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.position.set(0, 0.2, 0);
        pinSubGroup.add(stemMesh);

        // Glowing sphere beacon on top
        const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: loc.color,
          emissive: loc.color,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.3,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.position.set(0, 0.45, 0);
        pinSubGroup.add(sphereMesh);

        // Outer pulsing ring around beacon
        const haloGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16);
        haloGeo.rotateX(Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.6 });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.set(0, 0.45, 0);
        pinSubGroup.add(haloMesh);

        pinSubGroup.position.set(loc.x, loc.y, loc.z);
        pinsGroup.add(pinSubGroup);
      });

      root.add(pinsGroup);
    }

    return root;
  }
};

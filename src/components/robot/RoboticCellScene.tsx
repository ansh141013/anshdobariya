/**
 * RoboticCellScene.tsx — Production Interactive 8-DOF Robotic Cell Anatomy
 *
 * Integrated into Ansh Dobariya's Robotics Portfolio Hero Section.
 * Features:
 * - L-shaped perpendicular conveyor workcell (Conveyor A along X, Conveyor B along Z)
 * - Continuous industrial box transport flow (new box every ~8.8s) with anti-collision queuing
 * - 11-stage deterministic pick-and-place state machine with quintic S-curve kinematics
 * - 100% collision-free vertical lift clearance and clean destination release
 * - Interactive Anatomy part inspection with smooth hover & click isolation
 * - Precision monochrome CAD technical drawing aesthetic seamlessly integrated with the hero
 */

import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Eye, Play, Pause, ChevronRight } from 'lucide-react';

import { ProceduralRobotCell, type ProceduralRobotCellHandle } from './ProceduralRobotCell';
import { BoxTransportSystem, type ConveyorBox } from './BoxTransportSystem';
import { CellAnimationFSM, type PickPlaceState } from './CellAnimationFSM';
import { CellAnatomySystem, type SelectedPartInfo } from './CellAnatomySystem';
import { CELL, CELL_PARTS } from './cellConfig';

// ── Motion Accessibility Hook ──
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ── Responsive Camera Controller ──
function ResponsiveCamera() {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1100;

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      if (isMobile) {
        camera.fov = aspect < 0.85 ? 38 : 35;
        camera.position.set(5.2, 4.6, 5.0);
      } else if (isTablet) {
        camera.fov = 34;
        camera.position.set(5.0, 4.2, 4.8);
      } else {
        camera.fov = 34;
        camera.position.set(CELL.camera.position[0], CELL.camera.position[1], CELL.camera.position[2]);
      }
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect, isMobile, isTablet]);

  return null;
}

// ── Inner 3D WebGL Canvas Content ──
function CellSceneInner({
  transport,
  animFSM,
  anatomySystem,
  isInspecting,
  isPlaying,
  onPartSelect,
  onPartHover,
  prefersReduced,
}: {
  transport: BoxTransportSystem;
  animFSM: CellAnimationFSM;
  anatomySystem: CellAnatomySystem;
  isInspecting: boolean;
  isPlaying: boolean;
  onPartSelect: (info: SelectedPartInfo | null) => void;
  onPartHover: (partId: string | null) => void;
  prefersReduced: boolean;
}) {
  const cellRef = useRef<ProceduralRobotCellHandle>(null);
  const [jointAngles, setJointAngles] = useState<number[]>(animFSM.currentAngles);
  const [boxes, setBoxes] = useState<ConveyorBox[]>(transport.boxes);

  const { camera, raycaster, pointer, gl } = useThree();
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Register physical parts into the Anatomy inspection system
  useEffect(() => {
    if (!cellRef.current) return;
    const h = cellRef.current;

    const reg = (id: string, ref: React.RefObject<THREE.Group | null>, offset?: THREE.Vector3) => {
      if (ref.current) {
        anatomySystem.registerPart(id, ref.current, offset);
      }
    };

    reg('cell-subframe', h.subframeRef, new THREE.Vector3(0, -0.22, 0));
    reg('robot-riser', h.riserRef, new THREE.Vector3(0, 0.22, -0.15));
    reg('robot-j1-turret', h.j1Ref, new THREE.Vector3(0, 0.28, 0));
    reg('robot-j2-shoulder', h.j2Ref, new THREE.Vector3(0, 0.25, 0.15));
    reg('robot-j4-elbow', h.j4Ref, new THREE.Vector3(0, 0.25, 0));
    reg('robot-wrist', h.wristRef, new THREE.Vector3(0, 0.18, 0.12));
    reg('robot-gripper', h.gripperRef, new THREE.Vector3(0, 0.22, 0));
    reg('conveyor-a', h.conveyorARef, new THREE.Vector3(-0.35, 0.12, 0));
    reg('conveyor-b', h.conveyorBRef, new THREE.Vector3(0, 0.12, 0.35));
  }, [anatomySystem]);

  // Frame animation loop
  useFrame((_, delta) => {
    if (prefersReduced) return;

    const shouldPause = isInspecting || !isPlaying;

    // 1. Advance continuous conveyor transport simulation
    transport.update(delta, shouldPause);

    // 2. Advance 11-stage pick-and-place kinematic trajectory
    const angles = animFSM.update(delta, shouldPause);

    // 3. React state synchronizations
    setJointAngles([...angles]);
    setBoxes([...transport.boxes]);

    // 4. Update anatomy explode / inspection transitions
    anatomySystem.update(delta);
  });

  // Pointer interaction handlers
  const handlePointerDown = useCallback((e: THREE.Event & { nativeEvent?: PointerEvent }) => {
    isPointerDown.current = true;
    isDragging.current = false;
    if (e.nativeEvent) {
      lastPointerPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    }
  }, []);

  const handlePointerMove = useCallback((e: THREE.Event & { nativeEvent?: PointerEvent }) => {
    if (isPointerDown.current && e.nativeEvent) {
      const dx = e.nativeEvent.clientX - lastPointerPos.current.x;
      const dy = e.nativeEvent.clientY - lastPointerPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        isDragging.current = true;
      }
    }

    if (isInspecting) {
      raycaster.setFromCamera(pointer, camera);
      const hitId = anatomySystem.raycast(raycaster);
      anatomySystem.setHovered(hitId);
      onPartHover(hitId);
      gl.domElement.style.cursor = hitId ? 'pointer' : 'default';
    }
  }, [camera, raycaster, pointer, anatomySystem, isInspecting, onPartHover, gl]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current && isInspecting) {
      raycaster.setFromCamera(pointer, camera);
      const hitId = anatomySystem.raycast(raycaster);
      anatomySystem.selectPart(hitId);
      onPartSelect(anatomySystem.getSelectedPart());
    }
    isPointerDown.current = false;
    isDragging.current = false;
  }, [camera, raycaster, pointer, anatomySystem, isInspecting, onPartSelect]);

  const { size } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1100;
  const sceneScale = isMobile ? 0.78 : isTablet ? 0.90 : 1.0;

  return (
    <>
      {/* ── Studio Lighting for Precision Monochrome CAD ── */}
      <ambientLight intensity={0.72} />

      {/* Main Key Light with full cell shadow volume */}
      <directionalLight
        position={[5.5, 7.0, 5.0]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
      />

      {/* Cool technical fill light */}
      <directionalLight position={[-4.0, 3.5, -2.5]} intensity={0.55} color="#e5e9f0" />

      {/* Soft upward bounce light */}
      <directionalLight position={[0, -2.0, 2.0]} intensity={0.2} color="#ffffff" />

      {/* Point accent light near L-junction transfer corner */}
      <pointLight position={[0, 2.4, 0.4]} intensity={0.35} color="#ffffff" />

      {/* ── Interactive 8-DOF Robotic Cell ── */}
      <group
        position={[0, -0.38 * sceneScale, 0]}
        scale={sceneScale}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <ProceduralRobotCell
          ref={cellRef}
          jointAngles={jointAngles}
          boxes={boxes}
        />

        {/* Soft grounding contact shadow strictly beneath the conveyor frames and base */}
        <ContactShadows
          position={[-0.40, 0.005, 0.60]}
          opacity={0.18}
          scale={10}
          blur={1.8}
          far={0.9}
          resolution={1024}
          color="#111111"
        />
      </group>

      {/* ── Orbit Camera Controls ── */}
      <OrbitControls
        makeDefault
        target={[
          CELL.camera.target[0] * sceneScale,
          CELL.camera.target[1] * sceneScale,
          CELL.camera.target[2] * sceneScale,
        ]}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2.4}
        maxDistance={9.5}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.44}
        dampingFactor={0.06}
        enableDamping={true}
        panSpeed={0.6}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
      />
    </>
  );
}

// ── Exported Hero Scene Component ──
export function RoboticCellScene() {
  const prefersReduced = usePrefersReducedMotion();
  const transport = useMemo(() => new BoxTransportSystem(), []);
  const animFSM = useMemo(() => new CellAnimationFSM(transport), [transport]);
  const anatomySystem = useMemo(() => new CellAnatomySystem(), []);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SelectedPartInfo | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [currentStepLabel, setCurrentStepLabel] = useState<string>('WAITING FOR INFEED PACKAGE');

  // Synchronize state changes to status pill
  useEffect(() => {
    animFSM.onStateChange = (_, label) => {
      setCurrentStepLabel(label);
    };

    return () => {
      animFSM.reset();
      transport.reset();
      anatomySystem.dispose();
    };
  }, [animFSM, transport, anatomySystem]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Toggle Part Inspection Mode
  const toggleInspecting = useCallback(() => {
    setIsInspecting((prev) => {
      const next = !prev;
      if (next) {
        setIsPlaying(false);
      } else {
        anatomySystem.resetAll();
        setSelectedPart(null);
        setIsPlaying(true);
      }
      return next;
    });
  }, [anatomySystem]);

  // Reset Animation & Assembly
  const resetAll = useCallback(() => {
    animFSM.reset();
    transport.reset();
    anatomySystem.resetAll();
    setSelectedPart(null);
    setIsInspecting(false);
    setIsPlaying(true);
  }, [animFSM, transport, anatomySystem]);

  const hoveredMeta = useMemo(() => {
    if (!hoveredPartId) return null;
    return CELL_PARTS.find((p) => p.id === hoveredPartId);
  }, [hoveredPartId]);

  return (
    <div className="hero-canvas relative w-full h-full select-none pointer-events-auto">
      <Canvas
        camera={{
          position: CELL.camera.position,
          fov: CELL.camera.fov,
          near: 0.1,
          far: 50,
        }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
        }}
        style={{ background: 'transparent', pointerEvents: 'auto' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.setClearColor(0x000000, 0); // Transparent canvas blending directly with hero background
        }}
      >
        <ResponsiveCamera />
        <Suspense fallback={null}>
          <CellSceneInner
            transport={transport}
            animFSM={animFSM}
            anatomySystem={anatomySystem}
            isInspecting={isInspecting}
            isPlaying={isPlaying}
            onPartSelect={setSelectedPart}
            onPartHover={setHoveredPartId}
            prefersReduced={prefersReduced}
          />
        </Suspense>
      </Canvas>

      {/* ── Status Telemetry Pill (Top Left) ── */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/92 backdrop-blur-md border border-black/10 shadow-sm pointer-events-none z-10 font-mono text-[9px] sm:text-[10px] tracking-wider text-black/70 max-w-[calc(100%-24px)] truncate">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isInspecting ? 'bg-[#3b82f6]' : isPlaying ? 'bg-[#FF6A00] animate-pulse' : 'bg-black/40'
          }`}
        />
        <span className="truncate">
          {isInspecting ? 'ANATOMY INSPECT MODE' : currentStepLabel}
        </span>
      </div>

      {/* ── Floating Controls Bar (Bottom Center) ── */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 pointer-events-auto max-w-[95%] justify-center">
        {/* Play / Pause Toggle */}
        <button
          onClick={togglePlay}
          className="inline-flex items-center gap-1 sm:gap-1.5 border border-black/10 bg-white/95 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] text-black/70 cursor-pointer shadow-sm transition-all duration-200 hover:border-black/30 hover:text-black hover:shadow-md active:scale-95"
          aria-label={isPlaying ? 'Pause animation' : 'Resume animation'}
        >
          {isPlaying ? <Pause size={11} aria-hidden="true" /> : <Play size={11} aria-hidden="true" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Anatomy Inspect Toggle */}
        <button
          onClick={toggleInspecting}
          className={`inline-flex items-center gap-1.5 sm:gap-2 border px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] cursor-pointer shadow-sm transition-all duration-200 active:scale-95 ${
            isInspecting
              ? 'bg-[#0c0d0e] text-white border-[#0c0d0e] hover:bg-black'
              : 'bg-white/95 text-black/75 border-black/10 hover:border-black/30 hover:text-black hover:shadow-md'
          }`}
          aria-label={isInspecting ? 'Exit anatomy inspection' : 'Enter anatomy inspection'}
        >
          <Eye size={12} aria-hidden="true" />
          <span>{isInspecting ? 'EXIT INSPECT' : 'INSPECT ANATOMY'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-1 sm:gap-1.5 border border-black/10 bg-white/95 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] text-black/60 cursor-pointer shadow-sm transition-all duration-200 hover:border-black/30 hover:text-black active:scale-95"
          aria-label="Reset workcell simulation"
        >
          <RotateCcw size={11} aria-hidden="true" />
          <span>RESET</span>
        </button>
      </div>

      {/* ── Hover Tooltip (In Inspect Mode) ── */}
      {isInspecting && hoveredMeta && !selectedPart && (
        <div className="absolute top-4 right-4 max-w-[200px] px-3 py-2 bg-white/95 backdrop-blur-md rounded-lg border border-black/10 shadow-sm font-mono text-[10px] text-black/80 pointer-events-none z-10">
          <div className="font-semibold text-black/90">{hoveredMeta.name}</div>
          <div className="text-[9px] text-black/50 mt-0.5">CLICK TO ISOLATE</div>
        </div>
      )}

      {/* ── Selected Part Detail Card (In Inspect Mode) ── */}
      {isInspecting && selectedPart && (
        <div className="absolute top-4 right-4 w-[280px] p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-black/10 font-mono text-[11px] text-black/85 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-black/10">
            <span className="font-bold text-[10px] tracking-wider text-[#FF6A00]">
              PART INSPECTION
            </span>
            <button
              onClick={() => {
                anatomySystem.selectPart(null);
                setSelectedPart(null);
              }}
              className="text-[9px] px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black/60 transition-colors"
            >
              CLOSE
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-black/45 text-[9px] uppercase tracking-wider">COMPONENT</div>
              <strong className="text-[12px] font-semibold text-black/90">
                {selectedPart.meta.name}
              </strong>
            </div>

            <div>
              <div className="text-black/45 text-[9px] uppercase tracking-wider">ASSEMBLY</div>
              <div className="text-[10px] text-black/75 capitalize">
                {selectedPart.meta.parentAssembly.replace('-', ' ')}
              </div>
            </div>

            <div className="pt-2 border-t border-black/8 text-[10px] text-black/65 leading-relaxed">
              {selectedPart.meta.description}
            </div>

            <div className="pt-2 flex items-center justify-between text-[9px] text-black/45 border-t border-black/5">
              <span>STATUS: ISOLATED</span>
              <span className="text-[#FF6A00] font-semibold flex items-center">
                ACTIVE FOCUS <ChevronRight size={10} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

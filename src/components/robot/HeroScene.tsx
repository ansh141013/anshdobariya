import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MousePointer2, Settings2 } from 'lucide-react';
import { RobotArm } from './RobotArm';
import { HERO_ROBOT_SCALE, CAD_UNIT_SCALE, BASE_CENTER_OFFSET_MM } from './robotRigConfig';
import { RoboticCellScene } from './RoboticCellScene';
import { getHeroModelPreference, setHeroModelPreference, type HeroModelType } from './cellConfig';

interface HeroSceneProps {
  picked: boolean;
  setPicked: (v: boolean) => void;
}

interface TelemetryData {
  angles: number[];
  tcpPos: [number, number, number];
  distance: number;
  isClamped: boolean;
}

// World coordinates calculated from CAD rest pose
const REST_TCP_WORLD = new THREE.Vector3(1.936, -0.138, 1.059);

// Touch demo pick-and-place waypoints in world space
const DEMO_WAYPOINTS = {
  rest: REST_TCP_WORLD,
  pickApproach: new THREE.Vector3(1.73, 0.22, 0.48),
  pickGrip: new THREE.Vector3(1.73, -0.28, 0.48),
  placeApproach: new THREE.Vector3(1.05, 0.22, 1.15),
  placeRelease: new THREE.Vector3(1.05, -0.28, 1.15),
};

/**
 * Interactive workspace plane and target controller.
 * Converts screen pointer (desktop mouse & mobile touch) into a 3D target in the robot workspace.
 * Also coordinates the autonomous pick-and-place loop on touch devices when idle.
 */
function InteractionPlane({
  targetWorldPos,
  isInteractingRef,
  picked,
  setPicked,
}: {
  targetWorldPos: React.MutableRefObject<THREE.Vector3>;
  isInteractingRef: React.MutableRefObject<boolean>;
  picked: boolean;
  setPicked: (v: boolean) => void;
}) {
  const { camera, raycaster, pointer } = useThree();
  const targetMeshRef = useRef<THREE.Group>(null);

  // Plane facing the camera, passing through the reachable workspace centroid
  const workspacePlane = useMemo(() => {
    const centroid = new THREE.Vector3(1.45, 0.0, 0.85);
    const normal = camera.position.clone().sub(centroid).normalize();
    return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, centroid);
  }, [camera]);

  const smoothedPos = useRef(REST_TCP_WORLD.clone());
  const hitPoint = useRef(new THREE.Vector3());
  const touchEndTimeRef = useRef(0);
  const demoCycleTimeRef = useRef(0);

  // Detect touch device
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  useFrame((_, delta) => {
    const now = performance.now();
    const isActivelyInteracting = isInteractingRef.current;

    if (isActivelyInteracting) {
      // State B: User Active (mouse dragging/hover or mobile touch)
      raycaster.setFromCamera(pointer, camera);
      const intersected = raycaster.ray.intersectPlane(workspacePlane, hitPoint.current);

      if (intersected) {
        const damp = 1 - Math.exp(-12 * delta);
        smoothedPos.current.lerp(hitPoint.current, damp);
        targetWorldPos.current.copy(smoothedPos.current);
      }
    } else {
      // Idle state:
      if (isTouchDevice && now - touchEndTimeRef.current > 1800) {
        // State C: Autonomous Pick-and-Place loop on touch devices
        demoCycleTimeRef.current += delta;
        const cyclePeriod = 10.0; // 10 second cycle
        const t = demoCycleTimeRef.current % cyclePeriod;

        let curTarget = REST_TCP_WORLD;
        if (t < 1.8) {
          // Approach pick
          const f = (1 - Math.cos((t / 1.8) * Math.PI)) / 2;
          curTarget = REST_TCP_WORLD.clone().lerp(DEMO_WAYPOINTS.pickApproach, f);
        } else if (t < 2.8) {
          // Lower to pick
          const f = (1 - Math.cos(((t - 1.8) / 1.0) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.pickApproach.clone().lerp(DEMO_WAYPOINTS.pickGrip, f);
          if (t > 2.6 && !picked) setPicked(true);
        } else if (t < 3.8) {
          // Lift with payload
          const f = (1 - Math.cos(((t - 2.8) / 1.0) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.pickGrip.clone().lerp(DEMO_WAYPOINTS.pickApproach, f);
        } else if (t < 6.0) {
          // Carry across to place approach
          const f = (1 - Math.cos(((t - 3.8) / 2.2) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.pickApproach.clone().lerp(DEMO_WAYPOINTS.placeApproach, f);
        } else if (t < 7.0) {
          // Lower to place
          const f = (1 - Math.cos(((t - 6.0) / 1.0) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.placeApproach.clone().lerp(DEMO_WAYPOINTS.placeRelease, f);
          if (t > 6.8 && picked) setPicked(false);
        } else if (t < 8.0) {
          // Retract
          const f = (1 - Math.cos(((t - 7.0) / 1.0) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.placeRelease.clone().lerp(DEMO_WAYPOINTS.placeApproach, f);
        } else {
          // Return to rest pose
          const f = (1 - Math.cos(((t - 8.0) / 2.0) * Math.PI)) / 2;
          curTarget = DEMO_WAYPOINTS.placeApproach.clone().lerp(REST_TCP_WORLD, f);
        }

        const damp = 1 - Math.exp(-6 * delta);
        smoothedPos.current.lerp(curTarget, damp);
        targetWorldPos.current.copy(smoothedPos.current);
      } else {
        // State A: Desktop Neutral Rest - smoothly return to stationary CAD posture
        const damp = 1 - Math.exp(-6 * delta);
        smoothedPos.current.lerp(REST_TCP_WORLD, damp);
        targetWorldPos.current.copy(smoothedPos.current);
      }
    }

    if (targetMeshRef.current) {
      targetMeshRef.current.position.copy(targetWorldPos.current);
      targetMeshRef.current.visible = isActivelyInteracting;
    }
  });

  return (
    <>
      {/* Invisible interaction plane covering the entire hero canvas */}
      <mesh
        position={[1.45, 0.0, 0.85]}
        visible={false}
        onPointerEnter={() => {
          isInteractingRef.current = true;
        }}
        onPointerLeave={() => {
          isInteractingRef.current = false;
          touchEndTimeRef.current = performance.now();
        }}
        onPointerDown={() => {
          isInteractingRef.current = true;
        }}
        onPointerUp={() => {
          touchEndTimeRef.current = performance.now();
          if (isTouchDevice) {
            isInteractingRef.current = false;
          }
        }}
      >
        <planeGeometry args={[12, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Interactive target indicator (subtle crosshair dot when active) */}
      <group ref={targetMeshRef} position={REST_TCP_WORLD.toArray()} visible={false}>
        <mesh>
          <ringGeometry args={[0.022, 0.028, 24]} />
          <meshBasicMaterial color="#111111" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.006, 16]} />
          <meshBasicMaterial color="#FF6A00" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

/**
 * Original 6-DOF Robot Arm Hero Scene (preserved intact)
 */
function OriginalHeroScene({ picked, setPicked }: HeroSceneProps) {
  const targetWorldPos = useRef(REST_TCP_WORLD.clone());
  const isInteractingRef = useRef(false);

  // Calibration debug overlay (?robotDebug=1)
  const [debugMode, setDebugMode] = useState(() => {
    try {
      return (
        window.location.search.includes('robotDebug=1') ||
        sessionStorage.getItem('robot_debug') === '1'
      );
    } catch {
      return false;
    }
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    angles: [0, 0, 0, 0, 0, 0],
    tcpPos: [0, 0, 0],
    distance: 0,
    isClamped: false,
  });

  useEffect(() => {
    try {
      if (debugMode) sessionStorage.setItem('robot_debug', '1');
      else sessionStorage.removeItem('robot_debug');
    } catch {
      // ignore
    }
  }, [debugMode]);

  return (
    <div className="hero-canvas relative w-full h-full">
      <Canvas
        camera={{ position: [2.8, 1.8, 3.6], fov: 32 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
        onPointerDown={() => {
          isInteractingRef.current = true;
        }}
        onPointerUp={() => {
          // Touch ends
          isInteractingRef.current = false;
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[4, 5, 4]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#b0c4de" />
        <pointLight position={[0, 2, 2]} intensity={0.4} color="#ffffff" />

        <Suspense fallback={null}>
          {/* Robot Assembly Group with CAD-to-meter scaling and hero orientation */}
          <group
            position={[0.25, -0.65, 0]}
            rotation={[0, -Math.PI * 0.72, 0]}
            scale={HERO_ROBOT_SCALE * CAD_UNIT_SCALE}
          >
            <RobotArm
              targetWorldPos={targetWorldPos.current}
              isInteracting={isInteractingRef.current}
              picked={picked}
              debug={debugMode}
              onTelemetryUpdate={setTelemetry}
            />
          </group>

          {/* Contact shadows placed directly beneath the robot base */}
          <ContactShadows
            position={[0.25, -0.65, 0]}
            opacity={0.25}
            scale={1.4}
            blur={1.8}
            far={1.5}
            color="#000000"
          />

          {/* 3D Interaction Plane */}
          <InteractionPlane
            targetWorldPos={targetWorldPos}
            isInteractingRef={isInteractingRef}
            picked={picked}
            setPicked={setPicked}
          />
        </Suspense>
      </Canvas>

      {/* Main Interactive Button */}
      <button
        className="interaction-hint"
        onClick={() => setPicked(!picked)}
        aria-label="Toggle robot end effector interaction"
      >
        <MousePointer2 size={13} aria-hidden="true" />
        <span>{picked ? 'GRIPPER ENGAGED' : 'MOVE THE END EFFECTOR'}</span>
      </button>

      {/* Development Debug & Calibration Toggle Button */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/5 hover:bg-black/10 text-[11px] font-mono font-medium text-black/70 backdrop-blur-sm transition-colors border border-black/10 z-10"
        title="Toggle 6-DOF Rig Calibration Mode (?robotDebug=1)"
      >
        <Settings2 size={12} />
        <span>{debugMode ? 'CALIBRATION ON' : 'RIG DEBUG'}</span>
      </button>

      {/* Real-time 6-DOF Calibration & Telemetry Overlay */}
      {debugMode && (
        <div className="absolute bottom-14 right-3 p-3.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-black/10 font-mono text-[11px] text-black/85 z-20 min-w-[240px] pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 font-bold text-[11px] text-[#ff6a00]">
            <span>6-DOF RIG TELEMETRY</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff6a00]/10 text-[#ff6a00]">
              {telemetry.isClamped ? 'CLAMPED' : 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2.5">
            <div>
              <span className="text-black/50 text-[10px]">J1 (Yaw):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[0]}°</strong>
            </div>
            <div>
              <span className="text-black/50 text-[10px]">J2 (Shoulder):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[1]}°</strong>
            </div>
            <div>
              <span className="text-black/50 text-[10px]">J3 (Elbow):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[2]}°</strong>
            </div>
            <div>
              <span className="text-black/50 text-[10px]">J4 (Forearm):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[3]}°</strong>
            </div>
            <div>
              <span className="text-black/50 text-[10px]">J5 (Wrist):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[4]}°</strong>
            </div>
            <div>
              <span className="text-black/50 text-[10px]">J6 (Flange):</span>{' '}
              <strong className="font-semibold">{telemetry.angles[5]}°</strong>
            </div>
          </div>

          <div className="text-[10px] text-black/60 pt-1.5 border-t border-black/10 space-y-0.5">
            <div>
              TCP (mm): [{telemetry.tcpPos.join(', ')}]
            </div>
            <div>Error Dist: {telemetry.distance} mm</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HeroScene — Model switcher component
 *
 * Configuration priority:
 *   1. URL param: ?heroModel=cell | ?heroModel=original
 *   2. localStorage: 'ansh_hero_model'
 *   3. Default: 'cell' (new 8-DOF robotic cell)
 *
 * The original 6-DOF robot arm is fully preserved and can be restored at any time.
 */
export function HeroScene({ picked, setPicked }: HeroSceneProps) {
  const [activeModel, setActiveModel] = useState<HeroModelType>(() => getHeroModelPreference());
  const visualWrapperRef = useRef<HTMLDivElement>(null);

  // Scroll-driven fade & subtle depth perspective transition
  useEffect(() => {
    const heroEl = document.getElementById('home');
    if (!heroEl || !visualWrapperRef.current) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReduced = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReduced = e.matches;
      if (isReduced && visualWrapperRef.current) {
        visualWrapperRef.current.style.opacity = '1';
        visualWrapperRef.current.style.transform = 'none';
      }
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!heroEl || !visualWrapperRef.current) return;

        if (isReduced) {
          visualWrapperRef.current.style.opacity = '1';
          visualWrapperRef.current.style.transform = 'none';
          return;
        }

        const rect = heroEl.getBoundingClientRect();
        const heroHeight = rect.height;

        // When rect.top is 0 (initial position at top): progress = 0
        // As user scrolls down, -rect.top increases.
        const scrollDistance = Math.max(0, -rect.top);
        const fadeThreshold = Math.max(heroHeight * 0.70, 320);
        const progress = Math.min(1, Math.max(0, scrollDistance / fadeThreshold));

        // Smooth cubic easing (Hermite S-curve) for perceptually natural transition
        const fadeProgress = progress * progress * (3 - 2 * progress);

        // Opacity smoothly drops from 1.0 to 0.0
        const opacity = (1 - fadeProgress).toFixed(3);
        // Scale subtly reduces by ~6% (1.0 -> 0.94) for gentle sense of depth
        const scale = (1 - 0.06 * fadeProgress).toFixed(4);
        // Translate subtly upward/backward (-20px)
        const translateY = (-20 * fadeProgress).toFixed(1);

        const el = visualWrapperRef.current;
        el.style.opacity = opacity;
        el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        el.style.pointerEvents = Number(opacity) < 0.35 ? 'none' : 'auto';
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Dev toggle (only visible in debug mode or ?robotDebug=1)
  const showModelToggle = useMemo(() => {
    try {
      return (
        window.location.search.includes('robotDebug=1') ||
        window.location.search.includes('heroModel=') ||
        sessionStorage.getItem('robot_debug') === '1'
      );
    } catch {
      return false;
    }
  }, []);

  const switchModel = useCallback(() => {
    const next: HeroModelType = activeModel === 'cell' ? 'original' : 'cell';
    setActiveModel(next);
    setHeroModelPreference(next);
  }, [activeModel]);

  return (
    <div
      ref={visualWrapperRef}
      className="w-full h-full relative pointer-events-auto"
      style={{
        willChange: 'transform, opacity',
        transition: 'transform 0.06s linear, opacity 0.06s linear',
      }}
    >
      {activeModel === 'cell' ? (
        <RoboticCellScene />
      ) : (
        <OriginalHeroScene picked={picked} setPicked={setPicked} />
      )}

      {/* Model Toggle (dev only — hidden from public hero UI) */}
      {showModelToggle && (
        <button
          onClick={switchModel}
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/5 hover:bg-black/10 text-[10px] font-mono font-medium text-black/60 backdrop-blur-sm transition-colors border border-black/10 z-20"
          title="Switch between 8-DOF Cell and original 6-DOF Arm"
        >
          <Settings2 size={11} />
          <span>{activeModel === 'cell' ? 'SHOW 6-DOF ARM' : 'SHOW 8-DOF CELL'}</span>
        </button>
      )}
    </div>
  );
}

/**
 * ProceduralRobotCell.tsx — Production 8-DOF Robotic Cell with L-Shaped Perpendicular Conveyors
 *
 * Mechanical Architecture:
 * - Conveyor A (Infeed):  Along X axis, advancing incoming packages to pickup zone.
 * - Conveyor B (Outfeed): Along Z axis (perpendicular 90 deg), carrying transferred packages away.
 * - L-Shaped Subframe: Welded structural steel tubes uniting both conveyors and robot riser.
 * - 8-DOF Articulated Arm: Counterbalanced shoulder/elbow, internal wiring conduit, and 2-jaw parallel gripper.
 * - Dynamic Package Pool: Renders all queued, carried, and exiting packages with zero jumping.
 */

import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { CELL } from './cellConfig';
import { type ConveyorBox } from './BoxTransportSystem';

// ── Shared Monochrome CAD Engineering Materials ──
function useCellMaterials() {
  return useMemo(() => {
    // Light industrial pearl enamel for robot castings & conveyor frames
    const castBody = new THREE.MeshStandardMaterial({
      color: '#f6f7f9',
      roughness: 0.35,
      metalness: 0.15,
    });

    // Structural metal for brackets, gussets & subframe
    const structuralFrame = new THREE.MeshStandardMaterial({
      color: '#e2e5e9',
      roughness: 0.38,
      metalness: 0.28,
    });

    // Machined precision stainless steel for bearings, guide rods, rollers & shafts
    const machinedSteel = new THREE.MeshStandardMaterial({
      color: '#cbd1d8',
      roughness: 0.2,
      metalness: 0.78,
    });

    // Dark graphite slate for electric drive motors, belts & conduit
    const darkHardware = new THREE.MeshStandardMaterial({
      color: '#262930',
      roughness: 0.5,
      metalness: 0.45,
    });

    // Flexible cable conduit
    const cableConduit = new THREE.MeshStandardMaterial({
      color: '#1a1f26',
      roughness: 0.65,
      metalness: 0.15,
    });

    // Polyurethane finger grip contact pads
    const gripPad = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.88,
      metalness: 0.05,
    });

    // Natural kraft corrugated cardboard
    const kraftCardboard = new THREE.MeshStandardMaterial({
      color: '#d6be9a',
      roughness: 0.88,
      metalness: 0.02,
    });

    // Packaging tape seam
    const tapeSeam = new THREE.MeshStandardMaterial({
      color: '#c2a57c',
      roughness: 0.75,
      metalness: 0.05,
    });

    // Sensor optic lens
    const sensorLens = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      roughness: 0.15,
      metalness: 0.1,
    });

    return {
      castBody,
      structuralFrame,
      machinedSteel,
      darkHardware,
      cableConduit,
      gripPad,
      kraftCardboard,
      tapeSeam,
      sensorLens,
    };
  }, []);
}

// ── Reusable Hex Bolt ──
function HexBolt({
  position,
  rotation = [0, 0, 0],
  radius = 0.008,
  height = 0.007,
  mat,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  height?: number;
  mat: THREE.Material;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mat} castShadow>
        <cylinderGeometry args={[radius, radius, height, 6]} />
      </mesh>
    </group>
  );
}

// ── Reusable Bolt Circle ──
function BoltRing({
  radius,
  count,
  y,
  mat,
}: {
  radius: number;
  count: number;
  y: number;
  mat: THREE.Material;
}) {
  const bolts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const theta = (i / count) * Math.PI * 2;
      return [Math.cos(theta) * radius, y, Math.sin(theta) * radius] as [number, number, number];
    });
  }, [radius, count, y]);

  return (
    <>
      {bolts.map((pos, i) => (
        <HexBolt key={i} position={pos} radius={0.0055} height={0.005} mat={mat} />
      ))}
    </>
  );
}

// ── Optical Sensor Mast ──
function SensorMast({
  position,
  materials,
}: {
  position: [number, number, number];
  materials: ReturnType<typeof useCellMaterials>;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} material={materials.structuralFrame} castShadow>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
      </mesh>
      <mesh position={[0, 0.012, 0]} material={materials.machinedSteel} castShadow>
        <boxGeometry args={[0.038, 0.024, 0.038]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={materials.darkHardware} castShadow>
        <boxGeometry args={[0.028, 0.038, 0.028]} />
      </mesh>
      <mesh position={[0, 0.18, 0.015]} rotation={[Math.PI / 2, 0, 0]} material={materials.sensorLens}>
        <cylinderGeometry args={[0.006, 0.006, 0.004, 16]} />
      </mesh>
    </group>
  );
}

// ── L-Shaped Structural Steel Subframe ──
function LShapedSubframe({
  materials,
  groupRef,
}: {
  materials: ReturnType<typeof useCellMaterials>;
  groupRef?: React.Ref<THREE.Group>;
}) {
  const h = CELL.subframe.height;
  const b = CELL.subframe.beamWidth;

  return (
    <group ref={groupRef} position={[0, h / 2, 0]}>
      {/* ── Wing A (Under Conveyor A, along X from X = -2.35 to X = -0.30) ── */}
      <mesh position={[-1.325, 0, 0.42 - 0.22]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[2.05, h, b]} />
      </mesh>
      <mesh position={[-1.325, 0, 0.42 + 0.22]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[2.05, h, b]} />
      </mesh>
      <mesh position={[-2.30, 0, 0.42]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[b, h, 0.44]} />
      </mesh>

      {/* ── Wing B (Under Conveyor B, along Z from Z = 0.30 to Z = 2.35) ── */}
      <mesh position={[0.42 - 0.22, 0, 1.325]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[b, h, 2.05]} />
      </mesh>
      <mesh position={[0.42 + 0.22, 0, 1.325]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[b, h, 2.05]} />
      </mesh>
      <mesh position={[0.42, 0, 2.30]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[0.44, h, b]} />
      </mesh>

      {/* ── Central Corner Box (Under Robot Pedestal) ── */}
      <mesh position={[-0.05, 0, -0.22]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[0.56, h, 0.56]} />
      </mesh>
      {/* Gusset ties connecting corner box to Wing A and Wing B */}
      <mesh position={[-0.28, 0, 0.10]} rotation={[0, -Math.PI / 4, 0]} material={materials.structuralFrame} castShadow>
        <boxGeometry args={[0.42, h, b]} />
      </mesh>
      <mesh position={[0.18, 0, 0.10]} rotation={[0, Math.PI / 4, 0]} material={materials.structuralFrame} castShadow>
        <boxGeometry args={[0.42, h, b]} />
      </mesh>

      {/* Swivel Leveling Feet */}
      {[
        [-2.30, 0.42 - 0.22],
        [-2.30, 0.42 + 0.22],
        [-0.45, 0.42 + 0.22],
        [0.42 + 0.22, 0.45],
        [0.42 - 0.22, 2.30],
        [0.42 + 0.22, 2.30],
        [-0.30, -0.45],
        [0.20, -0.45],
      ].map(([fx, fz], idx) => (
        <group key={`subfoot-${idx}`} position={[fx, -0.02, fz]}>
          <mesh material={materials.machinedSteel} castShadow>
            <cylinderGeometry args={[0.034, 0.038, 0.016, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Conveyor Assembly (Configurable Orientation: along X or along Z) ──
function StraightConveyor({
  position,
  rotationY = 0,
  length,
  width,
  height,
  materials,
  groupRef,
  sensorOffset = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  length: number;
  width: number;
  height: number;
  materials: ReturnType<typeof useCellMaterials>;
  groupRef?: React.Ref<THREE.Group>;
  sensorOffset?: number;
}) {
  const halfLen = length / 2;
  const halfW = width / 2;
  const rollerCount = 18;

  const rollers = useMemo(() => {
    const list: number[] = [];
    const span = length - 0.16;
    const step = span / (rollerCount - 1);
    for (let i = 0; i < rollerCount; i++) {
      list.push(-span / 2 + i * step);
    }
    return list;
  }, [length, rollerCount]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} ref={groupRef}>
      {/* Front rail with T-slot */}
      <group position={[0, height, halfW - 0.022]}>
        <mesh material={materials.castBody} castShadow receiveShadow>
          <boxGeometry args={[length, 0.07, 0.04]} />
        </mesh>
        <mesh position={[0, 0, 0.021]} material={materials.darkHardware}>
          <boxGeometry args={[length - 0.02, 0.01, 0.003]} />
        </mesh>
      </group>

      {/* Rear rail with T-slot */}
      <group position={[0, height, -halfW + 0.022]}>
        <mesh material={materials.castBody} castShadow receiveShadow>
          <boxGeometry args={[length, 0.07, 0.04]} />
        </mesh>
        <mesh position={[0, 0, -0.021]} material={materials.darkHardware}>
          <boxGeometry args={[length - 0.02, 0.01, 0.003]} />
        </mesh>
      </group>

      {/* Slat/Belt bed */}
      <mesh position={[0, height + 0.028, 0]} material={materials.darkHardware} receiveShadow>
        <boxGeometry args={[length - 0.06, 0.008, width - 0.08]} />
      </mesh>

      {/* Rollers across the belt width */}
      {rollers.map((rx, idx) => (
        <mesh
          key={`roller-${idx}`}
          position={[rx, height + 0.026, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.machinedSteel}
          castShadow
        >
          <cylinderGeometry args={[0.014, 0.014, width - 0.075, 12]} />
        </mesh>
      ))}

      {/* End tensioner bearing blocks */}
      {[-halfLen + 0.03, halfLen - 0.03].map((ex, i) => (
        <group key={`endplate-${i}`} position={[ex, height, 0]}>
          <mesh position={[0, 0, halfW - 0.01]} material={materials.structuralFrame} castShadow>
            <boxGeometry args={[0.065, 0.075, 0.016]} />
          </mesh>
          <mesh position={[0, 0, -halfW + 0.01]} material={materials.structuralFrame} castShadow>
            <boxGeometry args={[0.065, 0.075, 0.016]} />
          </mesh>
          <HexBolt position={[0, 0.016, halfW + 0.002]} mat={materials.machinedSteel} />
          <HexBolt position={[0, -0.016, halfW + 0.002]} mat={materials.machinedSteel} />
        </group>
      ))}

      {/* Under-hung Electric Motor & Worm Gearbox */}
      <group position={[-halfLen + 0.20, height - 0.10, halfW - 0.10]}>
        <mesh material={materials.darkHardware} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.09]} />
        </mesh>
        <mesh position={[0.10, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.darkHardware} castShadow>
          <cylinderGeometry args={[0.042, 0.042, 0.12, 16]} />
        </mesh>
      </group>

      {/* Extruded Support Legs */}
      {[
        [-halfLen + 0.12, halfW - 0.035],
        [-halfLen + 0.12, -halfW + 0.035],
        [halfLen - 0.12, halfW - 0.035],
        [halfLen - 0.12, -halfW + 0.035],
      ].map(([lx, lz], i) => (
        <group key={`leg-${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, height / 2, 0]} material={materials.castBody} castShadow>
            <boxGeometry args={[0.044, height, 0.044]} />
          </mesh>
          <mesh position={[0, 0.012, 0]} material={materials.machinedSteel} castShadow>
            <cylinderGeometry args={[0.034, 0.038, 0.02, 16]} />
          </mesh>
        </group>
      ))}

      {/* Optical Sensor Mast */}
      <SensorMast
        position={[sensorOffset, height + 0.035, halfW + 0.02]}
        materials={materials}
      />
      <SensorMast
        position={[sensorOffset, height + 0.035, -halfW - 0.02]}
        materials={materials}
      />
    </group>
  );
}

// ── Corrugated Cardboard Package Component ──
function CardboardBoxMesh({
  position,
  rotationY = 0,
  materials,
}: {
  position: [number, number, number];
  rotationY?: number;
  materials: ReturnType<typeof useCellMaterials>;
}) {
  const { x, y, z } = CELL.boxSize;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={materials.kraftCardboard} castShadow receiveShadow>
        <boxGeometry args={[x, y, z]} />
      </mesh>
      {/* Center packaging tape along length */}
      <mesh position={[0, y / 2 + 0.001, 0]} material={materials.tapeSeam}>
        <boxGeometry args={[x * 0.99, 0.002, 0.042]} />
      </mesh>
      {/* Cross flap seam */}
      <mesh position={[0, y / 2 + 0.001, 0]} material={materials.tapeSeam}>
        <boxGeometry args={[0.003, 0.002, z * 0.96]} />
      </mesh>
      {/* Barcode shipping label */}
      <mesh position={[x * 0.22, y / 2 + 0.002, z * 0.22]} material={materials.castBody}>
        <boxGeometry args={[0.065, 0.0015, 0.048]} />
      </mesh>
    </group>
  );
}

// ── 2-Jaw Parallel Gripper Assembly (J8) ──
function ParallelGripper({
  jawSpread = 0.055,
  materials,
}: {
  jawSpread: number;
  materials: ReturnType<typeof useCellMaterials>;
}) {
  return (
    <group>
      {/* Tool Flange adapter */}
      <mesh material={materials.machinedSteel} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
      </mesh>
      <BoltRing radius={0.04} count={6} y={-0.011} mat={materials.machinedSteel} />

      {/* Pneumatic cylinder housing */}
      <group position={[0, 0.045, 0]}>
        <mesh material={materials.castBody} castShadow>
          <boxGeometry args={[0.26, 0.068, 0.075]} />
        </mesh>
        <mesh position={[0, 0.018, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machinedSteel}>
          <cylinderGeometry args={[0.008, 0.008, 0.28, 16]} />
        </mesh>
      </group>

      {/* Left sliding jaw carriage */}
      <group position={[-jawSpread - 0.1335, 0.098, 0]}>
        <mesh material={materials.machinedSteel} castShadow>
          <boxGeometry args={[0.03, 0.04, 0.058]} />
        </mesh>
        <mesh position={[0, 0.052, 0]} material={materials.darkHardware} castShadow>
          <boxGeometry args={[0.02, 0.075, 0.048]} />
        </mesh>
        <mesh position={[0.011, 0.052, 0]} material={materials.gripPad}>
          <boxGeometry args={[0.005, 0.068, 0.042]} />
        </mesh>
      </group>

      {/* Right sliding jaw carriage */}
      <group position={[jawSpread + 0.1335, 0.098, 0]}>
        <mesh material={materials.machinedSteel} castShadow>
          <boxGeometry args={[0.03, 0.04, 0.058]} />
        </mesh>
        <mesh position={[0, 0.052, 0]} material={materials.darkHardware} castShadow>
          <boxGeometry args={[0.02, 0.075, 0.048]} />
        </mesh>
        <mesh position={[-0.011, 0.052, 0]} material={materials.gripPad}>
          <boxGeometry args={[0.005, 0.068, 0.042]} />
        </mesh>
      </group>
    </group>
  );
}

// ── Heavy Central Robot Riser Pedestal ──
function RobotRiserPedestal({
  materials,
  groupRef,
}: {
  materials: ReturnType<typeof useCellMaterials>;
  groupRef?: React.Ref<THREE.Group>;
}) {
  const { riserHeight, riserBaseWidth, riserTopWidth } = CELL.robotBase;

  return (
    <group ref={groupRef}>
      {/* Bottom square anchor flange */}
      <mesh position={[0, 0.014, 0]} material={materials.structuralFrame} castShadow receiveShadow>
        <boxGeometry args={[riserBaseWidth, 0.028, riserBaseWidth]} />
      </mesh>

      {/* Corner anchor bolts */}
      {[
        [-riserBaseWidth / 2 + 0.045, -riserBaseWidth / 2 + 0.045],
        [-riserBaseWidth / 2 + 0.045, riserBaseWidth / 2 - 0.045],
        [riserBaseWidth / 2 - 0.045, -riserBaseWidth / 2 + 0.045],
        [riserBaseWidth / 2 - 0.045, riserBaseWidth / 2 - 0.045],
      ].map(([bx, bz], i) => (
        <HexBolt key={`riser-bolt-${i}`} position={[bx, 0.032, bz]} radius={0.011} height={0.012} mat={materials.machinedSteel} />
      ))}

      {/* Central welded riser column */}
      <mesh position={[0, riserHeight / 2 + 0.015, 0]} material={materials.castBody} castShadow receiveShadow>
        <boxGeometry args={[riserTopWidth, riserHeight, riserTopWidth]} />
      </mesh>

      {/* Four heavy triangular stiffener gussets */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={`gusset-${i}`} rotation={[0, angle, 0]}>
          <mesh position={[riserTopWidth / 2 + 0.038, riserHeight / 2, 0]} material={materials.castBody} castShadow>
            <boxGeometry args={[0.075, riserHeight - 0.03, 0.016]} />
          </mesh>
        </group>
      ))}

      {/* Top circular slewing mounting flange */}
      <mesh position={[0, riserHeight + 0.025, 0]} material={materials.machinedSteel} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.026, 32]} />
      </mesh>
      <BoltRing radius={0.165} count={12} y={riserHeight + 0.04} mat={materials.machinedSteel} />
    </group>
  );
}

// ── Complete 8-DOF Robotic Cell Handle Interface ──
export interface ProceduralRobotCellHandle {
  subframeRef: React.RefObject<THREE.Group | null>;
  riserRef: React.RefObject<THREE.Group | null>;
  conveyorARef: React.RefObject<THREE.Group | null>;
  conveyorBRef: React.RefObject<THREE.Group | null>;
  gripperRef: React.RefObject<THREE.Group | null>;
  j1Ref: React.RefObject<THREE.Group | null>;
  j2Ref: React.RefObject<THREE.Group | null>;
  j4Ref: React.RefObject<THREE.Group | null>;
  wristRef: React.RefObject<THREE.Group | null>;
}

export const ProceduralRobotCell = forwardRef<ProceduralRobotCellHandle, {
  jointAngles: number[];
  boxes: ConveyorBox[];
}>(({ jointAngles, boxes }, ref) => {
  const materials = useCellMaterials();

  const j1Ref = useRef<THREE.Group>(null);
  const j2Ref = useRef<THREE.Group>(null);
  const j3Ref = useRef<THREE.Group>(null);
  const j4Ref = useRef<THREE.Group>(null);
  const j5Ref = useRef<THREE.Group>(null);
  const j6Ref = useRef<THREE.Group>(null);
  const j7Ref = useRef<THREE.Group>(null);
  const gripperRef = useRef<THREE.Group>(null);

  const subframeRef = useRef<THREE.Group>(null);
  const riserRef = useRef<THREE.Group>(null);
  const conveyorARef = useRef<THREE.Group>(null);
  const conveyorBRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({
    subframeRef,
    riserRef,
    conveyorARef,
    conveyorBRef,
    gripperRef,
    j1Ref,
    j2Ref,
    j4Ref,
    wristRef,
  }));

  // Apply kinematic joint rotations
  useEffect(() => {
    if (j1Ref.current) j1Ref.current.rotation.y = jointAngles[0] ?? 0;
    if (j2Ref.current) j2Ref.current.rotation.x = jointAngles[1] ?? 0;
    if (j3Ref.current) j3Ref.current.rotation.y = jointAngles[2] ?? 0;
    if (j4Ref.current) j4Ref.current.rotation.x = jointAngles[3] ?? 0;
    if (j5Ref.current) j5Ref.current.rotation.y = jointAngles[4] ?? 0;
    if (j6Ref.current) j6Ref.current.rotation.x = jointAngles[5] ?? 0;
    if (j7Ref.current) j7Ref.current.rotation.y = jointAngles[6] ?? 0;
  }, [jointAngles]);

  const gripperJawSpread = jointAngles[7] ?? 0.055;
  const { arm } = CELL;

  return (
    <group>
      {/* ═══ 1. L-Shaped Structural Steel Subframe ═══ */}
      <LShapedSubframe materials={materials} groupRef={subframeRef} />

      {/* ═══ 2. Conveyor A (Incoming, Along X Axis) ═══ */}
      <StraightConveyor
        position={[CELL.conveyorA.x, CELL.conveyorA.y, CELL.conveyorA.z]}
        rotationY={0} // Along X
        length={CELL.conveyorA.length}
        width={CELL.conveyorA.width}
        height={CELL.conveyorA.height}
        materials={materials}
        groupRef={conveyorARef}
        sensorOffset={CELL.conveyorA.pickupX - CELL.conveyorA.x}
      />

      {/* ═══ 3. Conveyor B (Outgoing, Along Z Axis - Perpendicular 90 Deg!) ═══ */}
      <StraightConveyor
        position={[CELL.conveyorB.x, CELL.conveyorB.y, CELL.conveyorB.z]}
        rotationY={Math.PI / 2} // Rotated 90 deg along Z!
        length={CELL.conveyorB.length}
        width={CELL.conveyorB.width}
        height={CELL.conveyorB.height}
        materials={materials}
        groupRef={conveyorBRef}
        sensorOffset={-(CELL.conveyorB.placeZ - CELL.conveyorB.z)}
      />

      {/* ═══ 4. Continuous Box Pool (Queued on A, Carried, Moving on B) ═══ */}
      {boxes.map((b) => (
        <CardboardBoxMesh
          key={b.id}
          position={[b.position.x, b.position.y, b.position.z]}
          rotationY={b.rotationY}
          materials={materials}
        />
      ))}

      {/* ═══ 5. Central Robot Pedestal & 8-DOF Kinematic Arm ═══ */}
      <group position={[CELL.robotBase.x, CELL.robotBase.y, CELL.robotBase.z]}>
        <RobotRiserPedestal materials={materials} groupRef={riserRef} />

        {/* ── J1: Base Slewing Turntable (Yaw) ── */}
        <group ref={j1Ref} position={[0, CELL.robotBase.riserHeight + 0.04, 0]}>
          <mesh position={[0, 0.06, 0]} material={materials.castBody} castShadow>
            <cylinderGeometry args={[0.18, 0.20, 0.12, 32]} />
          </mesh>
          <mesh position={[0, 0.09, -0.09]} material={materials.castBody} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.16]} />
          </mesh>

          {/* ── J2: Shoulder Pivot (Pitch) ── */}
          <group ref={j2Ref} position={[0, arm.turretHeight, 0]}>
            <mesh position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machinedSteel} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.026, 24]} />
            </mesh>
            <mesh position={[-0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machinedSteel} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.026, 24]} />
            </mesh>

            {/* Main Upper Arm Boom with wiring harness */}
            <group position={[0, arm.upperArmLength / 2, 0]}>
              <mesh material={materials.castBody} castShadow>
                <boxGeometry args={[0.10, arm.upperArmLength, 0.12]} />
              </mesh>
              <mesh position={[0.052, 0, 0]} material={materials.darkHardware}>
                <boxGeometry args={[0.005, arm.upperArmLength * 0.72, 0.05]} />
              </mesh>
              <mesh position={[-0.062, 0, 0]} material={materials.cableConduit} castShadow>
                <cylinderGeometry args={[0.014, 0.014, arm.upperArmLength * 0.9, 12]} />
              </mesh>
              {[-0.18, 0, 0.18].map((sy, idx) => (
                <mesh key={`saddle-${idx}`} position={[-0.058, sy, 0]} material={materials.machinedSteel}>
                  <boxGeometry args={[0.022, 0.018, 0.038]} />
                </mesh>
              ))}
            </group>

            {/* ── J3: Upper Arm Roll ── */}
            <group ref={j3Ref} position={[0, arm.upperArmLength, 0]}>
              {/* ── J4: Articulated Elbow Joint (Pitch) ── */}
              <group ref={j4Ref} position={[0, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={materials.castBody} castShadow>
                  <cylinderGeometry args={[0.068, 0.068, 0.16, 24]} />
                </mesh>
                <mesh position={[0.084, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machinedSteel}>
                  <cylinderGeometry args={[0.048, 0.048, 0.012, 20]} />
                </mesh>
                <mesh position={[-0.084, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machinedSteel}>
                  <cylinderGeometry args={[0.048, 0.048, 0.012, 20]} />
                </mesh>

                {/* Forearm Assembly */}
                <group position={[0, arm.forearmLength / 2, 0]}>
                  <mesh material={materials.castBody} castShadow>
                    <boxGeometry args={[0.08, arm.forearmLength, 0.09]} />
                  </mesh>
                  <mesh position={[-0.048, 0, 0]} material={materials.cableConduit} castShadow>
                    <cylinderGeometry args={[0.012, 0.012, arm.forearmLength * 0.85, 12]} />
                  </mesh>
                </group>

                {/* ── J5: Forearm Roll ── */}
                <group ref={j5Ref} position={[0, arm.forearmLength, 0]}>
                  {/* ── J6: 3-Axis Wrist (Pitch) ── */}
                  <group ref={j6Ref} position={[0, 0, 0]}>
                    <group ref={wristRef}>
                      <mesh rotation={[0, 0, Math.PI / 2]} material={materials.castBody} castShadow>
                        <cylinderGeometry args={[0.048, 0.048, 0.10, 20]} />
                      </mesh>
                      <mesh position={[0, 0.035, 0]} material={materials.machinedSteel} castShadow>
                        <boxGeometry args={[0.065, 0.05, 0.065]} />
                      </mesh>
                    </group>

                    {/* ── J7: Wrist Flange (Roll) ── */}
                    <group ref={j7Ref} position={[0, arm.wristPitchLength, 0]}>
                      {/* ── J8: Parallel Gripper ── */}
                      <group ref={gripperRef} position={[0, 0, 0]}>
                        <ParallelGripper
                          jawSpread={gripperJawSpread}
                          materials={materials}
                        />
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

ProceduralRobotCell.displayName = 'ProceduralRobotCell';

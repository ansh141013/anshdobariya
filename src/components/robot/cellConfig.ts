/**
 * cellConfig.ts — Engineering configuration and layout for the
 * 8-DOF Robotic Conveyor-Transfer Cell (L-Shaped Perpendicular Layout)
 *
 * Conveyor A (Infeed):  Runs along the X-axis (boxes travel +X towards pickup).
 * Conveyor B (Outfeed): Runs along the Z-axis (boxes travel +Z towards exit).
 * Robot Base: Positioned behind the inside corner of the L-junction.
 */

export interface CellPartMeta {
  id: string;
  name: string;
  parentAssembly: 'robot' | 'conveyor-source' | 'conveyor-dest' | 'subframe' | 'payload';
  jointIndex?: number;
  description: string;
  selectable: boolean;
}

// ── Workcell Geometry & Layout (Meters) ──
export const CELL = {
  // L-Shaped Subframe Weldment
  subframe: {
    height: 0.07,
    beamWidth: 0.08,
  },

  // Central robot riser pedestal (behind the inside corner of the L-junction)
  robotBase: {
    x: -0.05,
    y: 0.07,
    z: -0.22,
    riserHeight: 0.36,
    riserBaseWidth: 0.52,
    riserTopWidth: 0.40,
  },

  // Conveyor A (Incoming / Source): Along X axis
  // Center of conveyor: X = -1.30, Z = 0.42
  // Extends from X = -2.25 to X = -0.35 (Length = 1.90m)
  conveyorA: {
    x: -1.30,
    y: 0.07,
    z: 0.42,
    length: 1.90,
    width: 0.50,
    height: 0.44, // frame height from subframe
    beltY: 0.52,   // top surface of belt in world coordinates
    pickupX: -0.48, // exact repeatable pickup stop coordinate
    pickupZ: 0.42,
    startX: -2.20, // spawn coordinate
  },

  // Conveyor B (Outgoing / Destination): Along Z axis (Perpendicular, 90 deg rotation!)
  // Center of conveyor: X = 0.42, Z = 1.30
  // Extends from Z = 0.35 to Z = 2.25 (Length = 1.90m)
  conveyorB: {
    x: 0.42,
    y: 0.07,
    z: 1.30,
    length: 1.90,
    width: 0.50,
    height: 0.44,
    beltY: 0.52,
    placeX: 0.42, // exact dropoff place coordinate
    placeZ: 0.48,
    endZ: 2.20,  // despawn exit coordinate
  },

  // Cardboard transfer package dimensions
  boxSize: {
    x: 0.30,
    y: 0.22,
    z: 0.24,
  },

  // Box transport system timing & speeds
  transport: {
    speedA: 0.16, // m/s on incoming belt (~10s from spawn to pickup)
    speedB: 0.18, // m/s on outgoing belt
    spawnInterval: 8.8, // seconds between normal box arrivals
    minBoxSpacing: 0.50, // minimum distance between queued boxes
    pickupTolerance: 0.015, // m
  },

  // Robot Arm segment lengths & kinematic pivots (8 Articulated DOF)
  arm: {
    turretHeight: 0.18,      // from base plate to shoulder pivot
    upperArmLength: 0.54,    // J2 shoulder to J4 elbow
    forearmLength: 0.46,     // J4 elbow to J6 wrist pitch
    wristPitchLength: 0.08,  // J6 wrist to J7 flange
    wristRollLength: 0.06,   // J7 flange offset
    flangeToTcp: 0.16,       // J7 flange to gripper TCP center
    jawOpenWidth: 0.055,     // half-width open (jaws spread 0.37m)
    jawClampedWidth: 0.00,   // half-width clamped (jaws touch box sides)
  },

  // Camera composition: Isometric three-quarter view showing complete L-cell
  camera: {
    // Balanced isometric three-quarter view centered on the entire L-cell work volume
    position: [4.8, 4.0, 4.6] as [number, number, number],
    target: [-0.35, -0.06, 0.35] as [number, number, number],
    fov: 34,
  },
};

// ── 8-DOF Joint Definitions ──
export interface Joint8DOF {
  id: string;
  name: string;
  axis: 'x' | 'y' | 'z';
  limits: [number, number];
  restAngle: number;
}

export const JOINTS_8DOF: Joint8DOF[] = [
  { id: 'J1', name: 'Base Turntable Yaw', axis: 'y', limits: [-Math.PI * 0.95, Math.PI * 0.95], restAngle: 0 },
  { id: 'J2', name: 'Shoulder Pitch',     axis: 'x', limits: [-Math.PI * 0.2, Math.PI * 0.8],   restAngle: 0.65 },
  { id: 'J3', name: 'Upper Arm Roll',     axis: 'y', limits: [-Math.PI * 0.5, Math.PI * 0.5],   restAngle: 0 },
  { id: 'J4', name: 'Elbow Pitch',        axis: 'x', limits: [-Math.PI * 0.2, Math.PI * 0.95],  restAngle: 1.05 },
  { id: 'J5', name: 'Forearm Roll',       axis: 'y', limits: [-Math.PI * 0.7, Math.PI * 0.7],   restAngle: 0 },
  { id: 'J6', name: 'Wrist Pitch',        axis: 'x', limits: [-Math.PI * 0.2, Math.PI * 0.95],  restAngle: 1.44 },
  { id: 'J7', name: 'Wrist Tool Roll',    axis: 'y', limits: [-Math.PI * 0.95, Math.PI * 0.95], restAngle: 0 },
  { id: 'J8', name: 'Parallel Gripper',   axis: 'x', limits: [0, 0.06],                          restAngle: 0.055 },
];

// ── Complete Part Catalog for Anatomy Inspection ──
export const CELL_PARTS: CellPartMeta[] = [
  { id: 'cell-subframe',         name: 'L-Shaped Base Weldment',     parentAssembly: 'subframe',         description: 'Heavy structural tubular steel weldment tying infeed and outfeed conveyors to robot pedestal', selectable: true },
  { id: 'robot-riser',           name: 'Pedestal Riser Assembly',    parentAssembly: 'robot',            description: 'Precision cast steel riser with 4 triangular stiffener gussets & anchor flange',  selectable: true },
  { id: 'robot-j1-turret',       name: 'J1 Slewing Turret Base',     parentAssembly: 'robot', jointIndex: 0, description: 'Continuous harmonic drive base yaw assembly with bearing shroud', selectable: true },
  { id: 'robot-j2-shoulder',     name: 'J2 Shoulder Dual Actuator',  parentAssembly: 'robot', jointIndex: 1, description: 'High-torque shoulder pitch casting with concentric side bearing plates', selectable: true },
  { id: 'robot-upper-arm',       name: 'Upper Arm Boom & Conduit',   parentAssembly: 'robot', jointIndex: 2, description: 'Sculpted lightweight cast boom with integrated wiring harness & saddle clamps', selectable: true },
  { id: 'robot-j4-elbow',        name: 'J4 Articulated Elbow',       parentAssembly: 'robot', jointIndex: 3, description: 'Counterbalanced concentric elbow joint with sealed bearing covers', selectable: true },
  { id: 'robot-forearm',         name: 'Forearm Link & Drive Pod',   parentAssembly: 'robot', jointIndex: 4, description: 'Machined forearm housing internal servo drives and cable conduit guides', selectable: true },
  { id: 'robot-wrist',           name: '3-Axis Orthogonal Wrist',    parentAssembly: 'robot', jointIndex: 5, description: 'Precision compact spherical wrist with J5 roll, J6 pitch, and J7 flange roll', selectable: true },
  { id: 'robot-gripper',         name: 'Parallel 2-Jaw Gripper',     parentAssembly: 'robot', jointIndex: 7, description: 'Pneumatic parallel slide gripper with dual guide rods & polyurethane finger pads', selectable: true },
  { id: 'conveyor-a',            name: 'Conveyor A (Infeed Along X)',parentAssembly: 'conveyor-source',  description: 'Infeed roller belt conveyor advancing incoming packages along X to pickup stop', selectable: true },
  { id: 'conveyor-b',            name: 'Conveyor B (Outfeed Along Z)',parentAssembly: 'conveyor-dest',   description: 'Perpendicular outfeed conveyor moving placed packages along Z toward exit', selectable: true },
  { id: 'transfer-box',          name: 'Corrugated Package Payload', parentAssembly: 'payload',          description: 'Industrial cardboard package with tape seams, barcode shipping label, and dynamic queue state', selectable: true },
];

export type HeroModelType = 'cell' | 'original';
export const DEFAULT_HERO_MODEL: HeroModelType = 'cell';

export function getHeroModelPreference(): HeroModelType {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlPref = params.get('heroModel');
    if (urlPref === 'original' || urlPref === 'cell') return urlPref;

    const stored = localStorage.getItem('ansh_hero_model');
    if (stored === 'original' || stored === 'cell') return stored;
  } catch {
    // SSR / storage unavailable
  }
  return DEFAULT_HERO_MODEL;
}

export function setHeroModelPreference(model: HeroModelType): void {
  try {
    localStorage.setItem('ansh_hero_model', model);
  } catch {
    // ignore
  }
}

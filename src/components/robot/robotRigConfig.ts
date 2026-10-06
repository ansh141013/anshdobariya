import * as THREE from 'three';

export interface JointConfig {
  id: string;
  name: string;
  pivot: [number, number, number]; // mm in CAD coordinates
  axis: [number, number, number];  // normalized unit axis
  limits: [number, number];        // [min, max] in radians
  zeroOffset: number;              // calibration offset in radians
}

export const ROBOT_MODEL_URL = '/assets/6dof-robot-arm-web-graphite.glb';

/**
 * CAD-derived pivot centers and rotation axes for all 6 degrees of freedom.
 * Source: 6dof robot assembly.step analysis.
 */
export const ROBOT_JOINTS: JointConfig[] = [
  {
    id: 'J1',
    name: 'Base Yaw',
    pivot: [-5.3, 37.4, -5.3],
    axis: [0, 1, 0],
    limits: [-Math.PI * 0.85, Math.PI * 0.85], // ~ -153° to +153°
    zeroOffset: 0,
  },
  {
    id: 'J2',
    name: 'Shoulder Pitch',
    pivot: [16.9, 67.2, -21.2],
    axis: [0.814, 0, -0.581],
    limits: [-Math.PI * 0.45, Math.PI * 0.5],  // ~ -81° to +90°
    zeroOffset: 0,
  },
  {
    id: 'J3',
    name: 'Elbow Pitch',
    pivot: [-14.9, 79.5, -163.9],
    axis: [-0.755, -0.383, 0.533],
    limits: [-Math.PI * 0.55, Math.PI * 0.55], // ~ -99° to +99°
    zeroOffset: 0,
  },
  {
    id: 'J4',
    name: 'Forearm Roll',
    pivot: [-39.4, 100.1, -294.8],
    axis: [0.650, 0.589, -0.480],
    limits: [-Math.PI * 0.7, Math.PI * 0.7],   // ~ -126° to +126°
    zeroOffset: 0,
  },
  {
    id: 'J5',
    name: 'Wrist Pitch',
    pivot: [-37.3, 111.0, -330.9],
    axis: [0.504, 0.139, 0.852],
    limits: [-Math.PI * 0.5, Math.PI * 0.5],   // ~ -90° to +90°
    zeroOffset: 0,
  },
  {
    id: 'J6',
    name: 'Tool Roll',
    pivot: [-51.2, 79.8, -347.1],
    axis: [0.044, 0.982, -0.186],
    limits: [-Math.PI * 0.85, Math.PI * 0.85], // ~ -153° to +153°
    zeroOffset: 0,
  },
];

/** Tool Center Point (End Effector tip) in mm */
export const DEFAULT_TCP_MM: [number, number, number] = [-55.0, 78.0, -385.0];

/** Component occurrence names assigned to each kinematic link */
export const LINK_COMPONENT_MAP: Record<string, string[]> = {
  base: ['base_1', 'base_spacer_1', 'MG90S_4'],
  link1: ['base_rotor_1', 'drivebig_1', 'MG996R_servo_1810421404.214_2'],
  link2: [
    'drivebig_rotor_1',
    'connector_corner_1',
    'connector_straight_1',
    'drivebig_rotor_3', // distal coupler on link 2 bridging connector_straight_1 and drivebig_2
    'drivebig_2',
    'MG996R_servo_1810421404.214_6',
  ],
  link3: [
    'drivebig_rotor_2',
    'connector_corner_2',
    'connector_straight_2',
    'drivesmall_2',
    'MG90S_3',
  ],
  link4: ['drivesmall_rotor_3', 'drivesmall_3', 'MG90S_2'],
  link5: ['drivesmall_rotor_2', 'drivesmall_1', 'MG90S_1'],
  link6: ['drivesmall_rotor_1'],
};

/**
 * Base bottom center offset in CAD mm coordinates.
 * Moving robotRoot by this offset places the bottom of base_1 at local Y = 0
 * and the center of the base at (0, 0).
 */
export const BASE_CENTER_OFFSET_MM: [number, number, number] = [5.3, 20.5, 5.3];

/**
 * Workspace reach envelope limits in CAD mm coordinates.
 * Shoulder pivot is at [16.9, 67.2, -21.2].
 */
export const WORKSPACE_BOUNDS_MM = {
  shoulderPivot: [16.9, 67.2, -21.2] as [number, number, number],
  minRadius: 115, // minimum distance from shoulder pivot to prevent self-collision
  maxRadius: 365, // ~95% of theoretical max arm reach (382 mm)
  minY: 15,       // safe floor clearance in CAD mm
  maxY: 375,      // safe overhead clearance in CAD mm
  minZ: -415,
  maxZ: 50,
};

/** Default CAD pose scale: converts mm to scene units */
export const CAD_UNIT_SCALE = 0.001;

/** Overall visual scale of the robot in the hero 3D scene */
export const HERO_ROBOT_SCALE = 5.2;


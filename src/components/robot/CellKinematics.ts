/**
 * CellKinematics.ts — Analytical Kinematics & Quintic Trajectory Planner
 *
 * For the 8-DOF Articulated Robotic Transfer Cell.
 * Guarantees zero singularity explosions, exact mathematical convergence,
 * and smooth S-curve acceleration/deceleration.
 */

import * as THREE from 'three';
import { CELL, JOINTS_8DOF } from './cellConfig';

export interface RobotPose {
  angles: number[]; // [J1, J2, J3, J4, J5, J6, J7, J8]
  tcp: THREE.Vector3;
}

export class CellKinematics {
  // Segment lengths
  private L1 = CELL.arm.upperArmLength;     // 0.54
  private L2 = CELL.arm.forearmLength;      // 0.46
  private Lw = CELL.arm.wristPitchLength + CELL.arm.flangeToTcp; // 0.10 + 0.18 = 0.28
  private shoulderBase = new THREE.Vector3(
    CELL.robotBase.x,
    CELL.robotBase.y + CELL.robotBase.riserHeight + 0.04 + CELL.arm.turretHeight,
    CELL.robotBase.z
  );

  /**
   * Analytical Inverse Kinematics for vertical-tool pick-and-place.
   *
   * @param targetTcp World position of the gripper TCP (between jaw pads)
   * @param toolRoll J7 rotation angle in radians (e.g. 0 for Conveyor A, PI/2 for Conveyor B)
   * @param jawSpread J8 gripper half-width (0.00 = clamped, 0.055 = open)
   * @returns 8 joint angles [J1..J8] in radians/meters
   */
  public solveIK(
    targetTcp: THREE.Vector3,
    toolRoll: number = 0,
    jawSpread: number = 0.055
  ): number[] {
    // 1. Solve J1 (Turntable base yaw)
    const dx = targetTcp.x - this.shoulderBase.x;
    const dz = targetTcp.z - this.shoulderBase.z;
    // Base yaw angle: facing the target in horizontal XZ plane
    // Turret rotates around Y. In our convention, rotation.y rotates X towards Z or vice-versa.
    // When J1 = 0, arm points in -Z. When J1 rotates, it aims at (dx, dz).
    const j1 = Math.atan2(dx, dz);

    // 2. Horizontal distance from shoulder axis to target TCP
    const r = Math.sqrt(dx * dx + dz * dz);

    // 3. Wrist center position
    // Since the tool points straight DOWN (-Y world), the wrist center is exactly Lw above targetTcp!
    const rw = r;
    const yw = (targetTcp.y + this.Lw) - this.shoulderBase.y;

    // 4. 2-Link Planar Kinematics (L1 = upper arm, L2 = forearm)
    const D2 = rw * rw + yw * yw;
    const d = Math.sqrt(D2);

    // Reachability clamp with safe margin
    const maxReach = (this.L1 + this.L2) * 0.985;
    const minReach = Math.abs(this.L1 - this.L2) * 1.05;
    const clampedD = Math.max(minReach, Math.min(d, maxReach));
    const clampedD2 = clampedD * clampedD;

    // Law of cosines for elbow angle J4
    let cosElbow = (clampedD2 - this.L1 * this.L1 - this.L2 * this.L2) / (2 * this.L1 * this.L2);
    cosElbow = THREE.MathUtils.clamp(cosElbow, -1.0, 1.0);
    // Elbow-up configuration: relative angle is interior elbow angle
    const elbowAngle = Math.acos(cosElbow);
    const j4 = elbowAngle;

    // Shoulder angle J2
    const phi = Math.atan2(yw, rw); // angle to wrist center from horizontal
    const cosAlpha = (clampedD2 + this.L1 * this.L1 - this.L2 * this.L2) / (2 * clampedD * this.L1);
    const alpha = Math.acos(THREE.MathUtils.clamp(cosAlpha, -1.0, 1.0));
    // Since arm is built along +Y, J2 rotation around horizontal axis rotates from +Y:
    // angle from vertical: (PI/2 - (phi + alpha))
    const j2 = Math.PI / 2 - (phi + alpha);

    // 5. Wrist pitch J6: ensures the gripper tool axis points strictly vertically down (-Y world)
    // Arm pitch angles sum to PI: j2 + j4 + j6 = PI
    const j6 = Math.PI - (j2 + j4);

    // 6. Joint limits enforcement
    const angles = [
      THREE.MathUtils.clamp(j1, JOINTS_8DOF[0].limits[0], JOINTS_8DOF[0].limits[1]),
      THREE.MathUtils.clamp(j2, JOINTS_8DOF[1].limits[0], JOINTS_8DOF[1].limits[1]),
      0, // J3 upper arm roll
      THREE.MathUtils.clamp(j4, JOINTS_8DOF[3].limits[0], JOINTS_8DOF[3].limits[1]),
      0, // J5 forearm roll
      THREE.MathUtils.clamp(j6, JOINTS_8DOF[5].limits[0], JOINTS_8DOF[5].limits[1]),
      THREE.MathUtils.clamp(toolRoll, JOINTS_8DOF[6].limits[0], JOINTS_8DOF[6].limits[1]),
      THREE.MathUtils.clamp(jawSpread, JOINTS_8DOF[7].limits[0], JOINTS_8DOF[7].limits[1]),
    ];

    return angles;
  }

  /**
   * S-Curve (Quintic Polynomial) Trajectory Interpolation.
   * s(t) = 10t^3 - 15t^4 + 6t^5
   * Guarantees C2 continuity (zero velocity and zero acceleration at both endpoints).
   */
  public static quinticStep(t: number): number {
    const ct = THREE.MathUtils.clamp(t, 0, 1);
    return ct * ct * ct * (10 + ct * (-15 + 6 * ct));
  }

  /**
   * Interpolate between two joint arrays using quintic S-curve.
   */
  public static interpolateJoints(from: number[], to: number[], t: number): number[] {
    const s = CellKinematics.quinticStep(t);
    const result = new Array(8);
    for (let i = 0; i < 8; i++) {
      result[i] = from[i] + (to[i] - from[i]) * s;
    }
    return result;
  }
}

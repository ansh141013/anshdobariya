/**
 * CellAnimationFSM.ts — Deterministic 11-State Pick-and-Place Machine
 *
 * Sequence:
 * WAIT_FOR_BOX -> APPROACH_PICK -> ALIGN_GRIPPER -> CLOSE_GRIPPER ->
 * LIFT_BOX -> TRANSFER -> APPROACH_PLACE -> LOWER_BOX ->
 * RELEASE_BOX -> RETRACT -> RETURN_HOME
 */

import * as THREE from 'three';
import { CELL } from './cellConfig';
import { CellKinematics } from './CellKinematics';
import { BoxTransportSystem, type ConveyorBox } from './BoxTransportSystem';

export type PickPlaceState =
  | 'WAIT_FOR_BOX'
  | 'APPROACH_PICK'
  | 'ALIGN_GRIPPER'
  | 'CLOSE_GRIPPER'
  | 'LIFT_BOX'
  | 'TRANSFER'
  | 'APPROACH_PLACE'
  | 'LOWER_BOX'
  | 'RELEASE_BOX'
  | 'RETRACT'
  | 'RETURN_HOME';

export class CellAnimationFSM {
  public currentState: PickPlaceState = 'WAIT_FOR_BOX';
  public currentAngles: number[] = [0, 0.65, 0, 1.05, 0, 1.44, 0, 0.055];
  public tcpWorldPos = new THREE.Vector3();
  public toolYaw = 0;

  private kinematics: CellKinematics;
  private transport: BoxTransportSystem;
  private stateTimer = 0;
  private targetBox: ConveyorBox | null = null;
  public cycleCount = 0;

  // Waypoint joint sets
  private poseHome: number[];
  private poseApproachPick: number[];
  private posePick: number[];
  private posePickClamped: number[];
  private poseLift: number[];
  private poseTransferClearance: number[];
  private poseApproachPlace: number[];
  private posePlace: number[];
  private posePlaceOpen: number[];
  private poseRetract: number[];

  // Trajectory interpolation endpoints
  private startAngles: number[] = [];
  private targetAngles: number[] = [];
  private stateDuration = 1.0;

  // State change callback for UI telemetry
  public onStateChange?: (state: PickPlaceState, label: string) => void;

  constructor(transport: BoxTransportSystem) {
    this.transport = transport;
    this.kinematics = new CellKinematics();

    // ── Pre-calculate Collision-Free Analytical Kinematic Waypoints ──
    const beltY = CELL.conveyorA.beltY;
    const boxH = CELL.boxSize.y;
    const boxCenterY = beltY + boxH / 2;
    const pickX = CELL.conveyorA.pickupX;
    const pickZ = CELL.conveyorA.pickupZ;
    const placeX = CELL.conveyorB.placeX;
    const placeZ = CELL.conveyorB.placeZ;

    const shoulderX = CELL.robotBase.x;
    const shoulderZ = CELL.robotBase.z;
    const j1A = Math.atan2(pickX - shoulderX, pickZ - shoulderZ);
    const j1B = Math.atan2(placeX - shoulderX, placeZ - shoulderZ);

    const rollPick = Math.PI / 2 - j1A;
    const rollPlace = -j1B;
    const rollHome = 0;

    // 1. Home / Standby TCP
    this.poseHome = this.kinematics.solveIK(
      new THREE.Vector3(0, 0.88, 0.30),
      rollHome,
      0.055
    );

    // 2. Approach Pick (vertical clearance above Conveyor A)
    this.poseApproachPick = this.kinematics.solveIK(
      new THREE.Vector3(pickX, boxCenterY + 0.24, pickZ),
      rollPick,
      0.055
    );

    // 3. Align Gripper around Box (open jaws hovering at box grip line)
    this.posePick = this.kinematics.solveIK(
      new THREE.Vector3(pickX, boxCenterY, pickZ),
      rollPick,
      0.055
    );

    // 4. Clamped at Box (symmetric contact on opposite box sides)
    this.posePickClamped = this.kinematics.solveIK(
      new THREE.Vector3(pickX, boxCenterY, pickZ),
      rollPick,
      0.00
    );

    // 5. Vertical Lift Clearance (+0.28m straight up)
    this.poseLift = this.kinematics.solveIK(
      new THREE.Vector3(pickX, boxCenterY + 0.28, pickZ),
      rollPick,
      0.00
    );

    // 6. Transfer Mid-flight Clearance
    this.poseTransferClearance = this.kinematics.solveIK(
      new THREE.Vector3((pickX + placeX) / 2, boxCenterY + 0.32, (pickZ + placeZ) / 2),
      (rollPick + rollPlace) / 2,
      0.00
    );

    // 7. Approach Place (directly above Conveyor B at safe clearance)
    this.poseApproachPlace = this.kinematics.solveIK(
      new THREE.Vector3(placeX, boxCenterY + 0.24, placeZ),
      rollPlace,
      0.00
    );

    // 8. Lowered Box onto Conveyor B
    this.posePlace = this.kinematics.solveIK(
      new THREE.Vector3(placeX, boxCenterY, placeZ),
      rollPlace,
      0.00
    );

    // 9. Open Jaws at Conveyor B
    this.posePlaceOpen = this.kinematics.solveIK(
      new THREE.Vector3(placeX, boxCenterY, placeZ),
      rollPlace,
      0.055
    );

    // 10. Retract vertically above Conveyor B
    this.poseRetract = this.kinematics.solveIK(
      new THREE.Vector3(placeX, boxCenterY + 0.24, placeZ),
      rollPlace,
      0.055
    );

    this.reset();
  }

  public reset(): void {
    this.currentState = 'WAIT_FOR_BOX';
    this.currentAngles = [...this.poseHome];
    this.startAngles = [...this.poseHome];
    this.targetAngles = [...this.poseHome];
    this.stateTimer = 0;
    this.stateDuration = 0.5;
    this.targetBox = null;
    this.cycleCount = 0;
    this.toolYaw = 0;
    this.updateTcpPosition(this.currentAngles);
    this.notifyState();
  }

  private notifyState(): void {
    const labels: Record<PickPlaceState, string> = {
      WAIT_FOR_BOX: 'WAITING FOR INFEED PACKAGE',
      APPROACH_PICK: 'APPROACHING PICKUP ZONE',
      ALIGN_GRIPPER: 'ALIGNING PARALLEL GRIPPER',
      CLOSE_GRIPPER: 'ENGAGING GRIPPER JAWS',
      LIFT_BOX: 'VERTICAL LIFT CLEARANCE',
      TRANSFER: 'TRANSFER TRAJECTORY ACROSS CELL',
      APPROACH_PLACE: 'POSITIONING OVER CONVEYOR B',
      LOWER_BOX: 'LOWERING TO CONVEYOR SURFACE',
      RELEASE_BOX: 'RELEASING PACKAGE TO BELT',
      RETRACT: 'VERTICAL CLEARANCE RETRACT',
      RETURN_HOME: 'RETURNING TO STANDBY POSTURE',
    };
    this.onStateChange?.(this.currentState, labels[this.currentState]);
  }

  private transitionTo(nextState: PickPlaceState, fromAngles: number[], toAngles: number[], duration: number): void {
    this.currentState = nextState;
    this.startAngles = [...fromAngles];
    this.targetAngles = [...toAngles];
    this.stateTimer = 0;
    this.stateDuration = Math.max(duration, 0.1);
    this.notifyState();
  }

  /**
   * Main state machine frame update.
   */
  public update(delta: number, isPaused: boolean = false): number[] {
    if (isPaused) return this.currentAngles;

    this.stateTimer += delta;
    const progress = Math.min(this.stateTimer / this.stateDuration, 1.0);

    // Interpolate current joint angles using Quintic S-Curve
    this.currentAngles = CellKinematics.interpolateJoints(this.startAngles, this.targetAngles, progress);
    this.updateTcpPosition(this.currentAngles);

    // Update carried box world transform if a box is gripped
    if (
      this.currentState === 'LIFT_BOX' ||
      this.currentState === 'TRANSFER' ||
      this.currentState === 'APPROACH_PLACE' ||
      this.currentState === 'LOWER_BOX'
    ) {
      if (this.currentState === 'TRANSFER') {
        this.toolYaw = (Math.PI / 2) * CellKinematics.quinticStep(progress);
      } else if (this.currentState === 'LIFT_BOX') {
        this.toolYaw = 0;
      } else {
        this.toolYaw = Math.PI / 2;
      }
      this.transport.updateCarriedBox(this.tcpWorldPos, this.toolYaw);
    }

    // State transitions upon completion of trajectory
    if (progress >= 1.0) {
      switch (this.currentState) {
        case 'WAIT_FOR_BOX': {
          const readyBox = this.transport.getBoxAtPickup();
          if (readyBox) {
            this.targetBox = readyBox;
            this.transitionTo('APPROACH_PICK', this.poseHome, this.poseApproachPick, 1.2);
          }
          break;
        }

        case 'APPROACH_PICK': {
          this.transitionTo('ALIGN_GRIPPER', this.poseApproachPick, this.posePick, 0.8);
          break;
        }

        case 'ALIGN_GRIPPER': {
          this.transitionTo('CLOSE_GRIPPER', this.posePick, this.posePickClamped, 0.5);
          break;
        }

        case 'CLOSE_GRIPPER': {
          if (this.targetBox) {
            this.transport.attachToGripper(this.targetBox.id);
          }
          this.transitionTo('LIFT_BOX', this.posePickClamped, this.poseLift, 0.9);
          break;
        }

        case 'LIFT_BOX': {
          this.transitionTo('TRANSFER', this.poseLift, this.poseApproachPlace, 2.0);
          break;
        }

        case 'TRANSFER': {
          this.transitionTo('LOWER_BOX', this.poseApproachPlace, this.posePlace, 0.9);
          break;
        }

        case 'LOWER_BOX': {
          this.transitionTo('RELEASE_BOX', this.posePlace, this.posePlaceOpen, 0.5);
          break;
        }

        case 'RELEASE_BOX': {
          if (this.targetBox) {
            this.transport.releaseToConveyorB(this.targetBox.id);
            this.targetBox = null;
          }
          this.transitionTo('RETRACT', this.posePlaceOpen, this.poseRetract, 0.8);
          break;
        }

        case 'RETRACT': {
          this.transitionTo('RETURN_HOME', this.poseRetract, this.poseHome, 1.4);
          break;
        }

        case 'RETURN_HOME': {
          this.cycleCount++;
          this.transitionTo('WAIT_FOR_BOX', this.poseHome, this.poseHome, 0.3);
          break;
        }
      }
    }

    return this.currentAngles;
  }

  /**
   * Approximate forward kinematics for TCP position and tool yaw.
   */
  private updateTcpPosition(angles: number[]): void {
    const j1 = angles[0];
    const j2 = angles[1];
    const j4 = angles[3];
    const j7 = angles[6];

    this.toolYaw = j1 + j7;

    const shoulderY = CELL.robotBase.y + CELL.robotBase.riserHeight + 0.04 + CELL.arm.turretHeight;
    const r1 = CELL.arm.upperArmLength * Math.sin(j2);
    const y1 = CELL.arm.upperArmLength * Math.cos(j2);

    const pitch2 = j2 + j4;
    const r2 = CELL.arm.forearmLength * Math.sin(pitch2);
    const y2 = CELL.arm.forearmLength * Math.cos(pitch2);

    const totalR = r1 + r2;
    const totalY = shoulderY + y1 + y2 - (CELL.arm.wristPitchLength + CELL.arm.flangeToTcp);

    this.tcpWorldPos.set(
      CELL.robotBase.x + totalR * Math.sin(j1),
      totalY,
      CELL.robotBase.z + totalR * Math.cos(j1)
    );
  }
}

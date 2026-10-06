import * as THREE from 'three';
import { ROBOT_JOINTS, DEFAULT_TCP_MM, WORKSPACE_BOUNDS_MM } from './robotRigConfig';

export class RobotIKController {
  public rootGroup: THREE.Group;
  public jointPivots: THREE.Group[] = [];
  public jointLinks: THREE.Group[] = [];
  public endEffector: THREE.Group;

  public targetAngles: number[] = [0, 0, 0, 0, 0, 0];
  public currentAngles: number[] = [0, 0, 0, 0, 0, 0];
  public zeroOffsets: number[] = [0, 0, 0, 0, 0, 0];

  public lastErrorDistance: number = 0;
  public iterationCount: number = 0;
  public isClamped: boolean = false;

  private tempVecA = new THREE.Vector3();
  private tempQuat = new THREE.Quaternion();

  private axesVectors: THREE.Vector3[];
  private pivotVectors: THREE.Vector3[];

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'robotRoot';

    this.axesVectors = ROBOT_JOINTS.map((j) => new THREE.Vector3(...j.axis).normalize());
    this.pivotVectors = ROBOT_JOINTS.map((j) => new THREE.Vector3(...j.pivot));

    // Build the kinematic pivot hierarchy:
    // rootGroup -> J1Pivot -> J2Pivot -> J3Pivot -> J4Pivot -> J5Pivot -> J6Pivot -> endEffector
    let currentParent: THREE.Object3D = this.rootGroup;

    for (let i = 0; i < ROBOT_JOINTS.length; i++) {
      const pivotGroup = new THREE.Group();
      pivotGroup.name = `pivot_${ROBOT_JOINTS[i].id}`;

      if (i === 0) {
        pivotGroup.position.copy(this.pivotVectors[0]);
      } else {
        pivotGroup.position.copy(this.pivotVectors[i].clone().sub(this.pivotVectors[i - 1]));
      }

      // Link group inside pivot where the actual meshes are attached
      const linkGroup = new THREE.Group();
      linkGroup.name = `link_${ROBOT_JOINTS[i].id}`;
      pivotGroup.add(linkGroup);

      currentParent.add(pivotGroup);
      this.jointPivots.push(pivotGroup);
      this.jointLinks.push(linkGroup);

      currentParent = pivotGroup;
    }

    // End effector TCP
    this.endEffector = new THREE.Group();
    this.endEffector.name = 'endEffector_TCP';
    const tcpVec = new THREE.Vector3(...DEFAULT_TCP_MM);
    this.endEffector.position.copy(tcpVec.clone().sub(this.pivotVectors[5]));
    this.jointPivots[5].add(this.endEffector);

    this.rootGroup.updateMatrixWorld(true);
  }

  /**
   * Clamps target coordinates to physical workspace envelope (in mm).
   * Uses spherical projection around the shoulder pivot to guarantee safe reachable configurations.
   */
  public clampWorkspaceTarget(target: THREE.Vector3): THREE.Vector3 {
    const clamped = target.clone();
    const bounds = WORKSPACE_BOUNDS_MM;
    const shoulder = new THREE.Vector3(...bounds.shoulderPivot);

    const toTarget = clamped.clone().sub(shoulder);
    const dist = toTarget.length();

    let wasClamped = false;

    // Spherically clamp radius around shoulder pivot
    if (dist > bounds.maxRadius) {
      toTarget.multiplyScalar(bounds.maxRadius / (dist || 1));
      clamped.copy(shoulder).add(toTarget);
      wasClamped = true;
    } else if (dist < bounds.minRadius && dist > 1e-4) {
      toTarget.multiplyScalar(bounds.minRadius / dist);
      clamped.copy(shoulder).add(toTarget);
      wasClamped = true;
    }

    // Floor and ceiling height bounds
    if (clamped.y < bounds.minY) {
      clamped.y = bounds.minY;
      wasClamped = true;
    } else if (clamped.y > bounds.maxY) {
      clamped.y = bounds.maxY;
      wasClamped = true;
    }

    // Z reach bounds
    if (clamped.z < bounds.minZ) {
      clamped.z = bounds.minZ;
      wasClamped = true;
    } else if (clamped.z > bounds.maxZ) {
      clamped.z = bounds.maxZ;
      wasClamped = true;
    }

    this.isClamped = wasClamped;
    return clamped;
  }

  /**
   * Solve 6-DOF kinematics using Damped Least Squares (DLS) Jacobian IK.
   * Features fast 3x3 closed-form matrix inversion, zero singularity explosion,
   * and strict mechanical joint limit enforcement.
   */
  public solveIK(targetWorldPos: THREE.Vector3, maxIterations = 6, lambda = 14.0): void {
    const target = targetWorldPos;
    this.iterationCount = maxIterations;
    const curTcp = new THREE.Vector3();

    for (let iter = 0; iter < maxIterations; iter++) {
      this.rootGroup.updateMatrixWorld(true);
      this.endEffector.getWorldPosition(curTcp);

      const err = target.clone().sub(curTcp);
      this.lastErrorDistance = err.length();
      if (this.lastErrorDistance < 0.4) break; // within 0.4 mm

      // Compute Jacobian columns J_i = axis_i x (TCP - pivot_i)
      const J: THREE.Vector3[] = [];
      for (let i = 0; i < 6; i++) {
        this.jointPivots[i].getWorldQuaternion(this.tempQuat);
        const axis = this.axesVectors[i].clone().applyQuaternion(this.tempQuat).normalize();
        const center = this.jointPivots[i].getWorldPosition(this.tempVecA);
        const r = curTcp.clone().sub(center);
        J.push(new THREE.Vector3().crossVectors(axis, r));
      }

      // Compute A = J * J^T + lambda^2 * I (3x3 symmetric matrix)
      let A00 = lambda * lambda, A01 = 0, A02 = 0;
      let A10 = 0, A11 = lambda * lambda, A12 = 0;
      let A20 = 0, A21 = 0, A22 = lambda * lambda;

      for (let i = 0; i < 6; i++) {
        const c = J[i];
        A00 += c.x * c.x; A01 += c.x * c.y; A02 += c.x * c.z;
        A10 += c.y * c.x; A11 += c.y * c.y; A12 += c.y * c.z;
        A20 += c.z * c.x; A21 += c.z * c.y; A22 += c.z * c.z;
      }

      // Invert 3x3 matrix A using analytic cofactor method
      const det = A00 * (A11 * A22 - A12 * A21) -
                  A01 * (A10 * A22 - A12 * A20) +
                  A02 * (A10 * A21 - A11 * A20);

      if (Math.abs(det) < 1e-6) break;
      const invDet = 1.0 / det;

      const i00 = (A11 * A22 - A12 * A21) * invDet;
      const i01 = (A02 * A21 - A01 * A22) * invDet;
      const i02 = (A01 * A12 - A02 * A11) * invDet;
      const i10 = (A12 * A20 - A10 * A22) * invDet;
      const i11 = (A00 * A22 - A02 * A20) * invDet;
      const i12 = (A02 * A10 - A00 * A12) * invDet;
      const i20 = (A10 * A21 - A11 * A20) * invDet;
      const i21 = (A01 * A20 - A00 * A21) * invDet;
      const i22 = (A00 * A11 - A01 * A10) * invDet;

      // alpha = invA * err
      const alphaX = i00 * err.x + i01 * err.y + i02 * err.z;
      const alphaY = i10 * err.x + i11 * err.y + i12 * err.z;
      const alphaZ = i20 * err.x + i21 * err.y + i22 * err.z;
      const alpha = new THREE.Vector3(alphaX, alphaY, alphaZ);

      // deltaTheta_i = J_i^T * alpha
      for (let i = 0; i < 6; i++) {
        let dTheta = J[i].dot(alpha);
        // Clamp maximum angle adjustment per iteration to prevent overshoot
        dTheta = THREE.MathUtils.clamp(dTheta, -0.22, 0.22);

        const limits = ROBOT_JOINTS[i].limits;
        this.targetAngles[i] = THREE.MathUtils.clamp(
          this.targetAngles[i] + dTheta,
          limits[0],
          limits[1]
        );

        this.jointPivots[i].quaternion.setFromAxisAngle(
          this.axesVectors[i],
          this.targetAngles[i] + this.zeroOffsets[i]
        );
      }
    }
  }

  /**
   * Smoothly interpolates the physical arm towards the solved target angles.
   * Call inside useFrame().
   */
  public update(delta: number, smoothSpeed = 7.5): void {
    const dampFactor = 1 - Math.exp(-smoothSpeed * delta);
    const maxVelocity = 4.0 * delta; // max radians per frame to prevent snapping

    for (let i = 0; i < 6; i++) {
      const diff = this.targetAngles[i] - this.currentAngles[i];
      const step = THREE.MathUtils.clamp(diff * dampFactor, -maxVelocity, maxVelocity);
      this.currentAngles[i] += step;

      this.jointPivots[i].quaternion.setFromAxisAngle(
        this.axesVectors[i],
        this.currentAngles[i] + this.zeroOffsets[i]
      );
    }

    this.rootGroup.updateMatrixWorld(true);
  }

  /**
   * Resets all joint angles back to original CAD posture
   */
  public resetToCadPose(): void {
    for (let i = 0; i < 6; i++) {
      this.targetAngles[i] = 0;
      this.currentAngles[i] = 0;
      this.jointPivots[i].quaternion.setFromAxisAngle(this.axesVectors[i], this.zeroOffsets[i]);
    }
    this.rootGroup.updateMatrixWorld(true);
  }

  /**
   * Returns current joint angles in degrees for debugging and telemetry
   */
  public getJointAnglesDeg(): number[] {
    return this.currentAngles.map((a) => +(a * (180 / Math.PI)).toFixed(1));
  }
}

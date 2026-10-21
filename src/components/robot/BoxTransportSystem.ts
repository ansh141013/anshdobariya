/**
 * BoxTransportSystem.ts — Continuous Industrial Conveyor Transport & Queue Manager
 *
 * Coordinates:
 * - Dynamic box arrival (every 8 to 10 seconds under normal operation)
 * - Anti-collision queuing on incoming Conveyor A (along X)
 * - Repeatable pickup-zone detection and holding
 * - Authoritative ownership handoff to gripper and Conveyor B
 * - Continuous outfeed movement on Conveyor B (along Z) and graceful disposal
 */

import * as THREE from 'three';
import { CELL } from './cellConfig';

export interface ConveyorBox {
  id: string;
  conveyor: 'A' | 'gripper' | 'B';
  position: THREE.Vector3;
  rotationY: number;
  state: 'moving_A' | 'queued_A' | 'at_pickup' | 'clamped' | 'carried' | 'released' | 'moving_B' | 'exited';
}

export class BoxTransportSystem {
  public boxes: ConveyorBox[] = [];
  private nextId = 1;
  private spawnTimer = 0;
  private beltY = CELL.conveyorA.beltY + CELL.boxSize.y / 2;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.boxes = [];
    this.nextId = 1;
    this.spawnTimer = 0;

    // Initialize with 1 box already waiting at the pickup zone for immediate interaction
    this.boxes.push({
      id: `box-${this.nextId++}`,
      conveyor: 'A',
      position: new THREE.Vector3(CELL.conveyorA.pickupX, this.beltY, CELL.conveyorA.pickupZ),
      rotationY: 0,
      state: 'at_pickup',
    });

    // And 1 upstream box advancing on Conveyor A
    this.boxes.push({
      id: `box-${this.nextId++}`,
      conveyor: 'A',
      position: new THREE.Vector3(CELL.conveyorA.pickupX - 0.70, this.beltY, CELL.conveyorA.pickupZ),
      rotationY: 0,
      state: 'moving_A',
    });
  }

  /**
   * Spawns a new package on Conveyor A if timing and clearance permit.
   */
  private trySpawnBox(): void {
    const startX = CELL.conveyorA.startX;
    // Check if the most upstream box on Conveyor A is too close
    const boxesOnA = this.boxes.filter((b) => b.conveyor === 'A');
    const tooClose = boxesOnA.some((b) => Math.abs(b.position.x - startX) < CELL.transport.minBoxSpacing);

    if (!tooClose) {
      this.boxes.push({
        id: `box-${this.nextId++}`,
        conveyor: 'A',
        position: new THREE.Vector3(startX, this.beltY, CELL.conveyorA.pickupZ),
        rotationY: 0,
        state: 'moving_A',
      });
      this.spawnTimer = 0;
    }
  }

  /**
   * Advance the transport simulation by delta seconds.
   */
  public update(delta: number, isPaused: boolean = false): void {
    if (isPaused) return;

    // 1. Spawner timer update
    this.spawnTimer += delta;
    if (this.spawnTimer >= CELL.transport.spawnInterval) {
      this.trySpawnBox();
    }

    const speedA = CELL.transport.speedA;
    const speedB = CELL.transport.speedB;
    const pickupX = CELL.conveyorA.pickupX;
    const minSpacing = CELL.transport.minBoxSpacing;

    // 2. Update Conveyor A boxes (from right to left in order of progress)
    const boxesOnA = this.boxes
      .filter((b) => b.conveyor === 'A')
      .sort((a, b) => b.position.x - a.position.x);

    for (let i = 0; i < boxesOnA.length; i++) {
      const box = boxesOnA[i];

      if (i === 0) {
        // Leading box on Conveyor A
        if (box.position.x < pickupX) {
          box.position.x = Math.min(pickupX, box.position.x + speedA * delta);
          if (Math.abs(box.position.x - pickupX) <= CELL.transport.pickupTolerance) {
            box.position.x = pickupX;
            box.state = 'at_pickup';
          } else {
            box.state = 'moving_A';
          }
        } else {
          box.position.x = pickupX;
          box.state = 'at_pickup';
        }
      } else {
        // Trailing queued box
        const leadBox = boxesOnA[i - 1];
        const maxAllowedX = leadBox.position.x - minSpacing;

        if (box.position.x < maxAllowedX) {
          box.position.x = Math.min(maxAllowedX, box.position.x + speedA * delta);
          box.state = 'moving_A';
        } else {
          box.position.x = maxAllowedX;
          box.state = 'queued_A';
        }
      }
    }

    // 3. Update Conveyor B boxes (moving along +Z)
    for (const box of this.boxes) {
      if (box.conveyor === 'B') {
        box.position.z += speedB * delta;
        box.state = 'moving_B';
      }
    }

    // 4. Remove exited boxes that have fallen off the end of Conveyor B
    this.boxes = this.boxes.filter((b) => !(b.conveyor === 'B' && b.position.z > CELL.conveyorB.endZ));
  }

  /**
   * Get the box currently ready at the designated pickup zone.
   */
  public getBoxAtPickup(): ConveyorBox | null {
    return this.boxes.find((b) => b.conveyor === 'A' && b.state === 'at_pickup') || null;
  }

  /**
   * Hand off box from Conveyor A to the Robot Gripper.
   */
  public attachToGripper(boxId: string): void {
    const box = this.boxes.find((b) => b.id === boxId);
    if (box) {
      box.conveyor = 'gripper';
      box.state = 'carried';
    }
  }

  /**
   * Hand off box from the Robot Gripper onto Conveyor B.
   */
  public releaseToConveyorB(boxId: string): void {
    const box = this.boxes.find((b) => b.id === boxId);
    if (box) {
      box.conveyor = 'B';
      box.state = 'moving_B';
      box.position.set(CELL.conveyorB.placeX, this.beltY, CELL.conveyorB.placeZ);
      box.rotationY = Math.PI / 2; // Aligned with the Z conveyor axis
    }
  }

  /**
   * Updates the carried box's world transform while attached to the robot gripper.
   */
  public updateCarriedBox(tcpWorldPos: THREE.Vector3, toolYaw: number): void {
    const carried = this.boxes.find((b) => b.conveyor === 'gripper');
    if (carried) {
      // The box center coincides with the gripper TCP center
      carried.position.copy(tcpWorldPos);
      carried.rotationY = toolYaw;
    }
  }
}

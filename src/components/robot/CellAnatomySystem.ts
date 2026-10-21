/**
 * CellAnatomySystem.ts — Part inspection and anatomy interaction system
 *
 * Manages hover highlighting, click selection, component isolation/explode,
 * and reset-to-assembled state for the robotic cell.
 */

import * as THREE from 'three';
import { CELL_PARTS, type CellPartMeta } from './cellConfig';

export interface SelectedPartInfo {
  partId: string;
  meta: CellPartMeta;
  mesh: THREE.Object3D;
}

interface PartRecord {
  meta: CellPartMeta;
  object: THREE.Object3D;
  originalPosition: THREE.Vector3;
  originalQuaternion: THREE.Quaternion;
  inspectOffset: THREE.Vector3; // direction to move when inspecting
}

export class CellAnatomySystem {
  private parts = new Map<string, PartRecord>();
  private selectedPartId: string | null = null;
  private hoveredPartId: string | null = null;
  private isExploded = false;
  private explodeProgress = 0;

  // Animation targets
  private targetExplodeProgress = 0;

  // Outline/highlight materials
  private highlightColor = new THREE.Color('#FF6A00');
  private originalMaterials = new Map<string, THREE.Material | THREE.Material[]>();

  /**
   * Register a part's Object3D with its metadata
   */
  registerPart(partId: string, object: THREE.Object3D, inspectDirection?: THREE.Vector3): void {
    const meta = CELL_PARTS.find(p => p.id === partId);
    if (!meta) return;

    const inspectOffset = inspectDirection || this.getDefaultInspectOffset(partId);

    this.parts.set(partId, {
      meta,
      object,
      originalPosition: object.position.clone(),
      originalQuaternion: object.quaternion.clone(),
      inspectOffset,
    });
  }

  private getDefaultInspectOffset(partId: string): THREE.Vector3 {
    // Assign sensible inspection offsets based on assembly
    if (partId.startsWith('source-')) return new THREE.Vector3(-0.4, 0.2, 0);
    if (partId.startsWith('dest-')) return new THREE.Vector3(0.4, 0.2, 0);
    if (partId.includes('base')) return new THREE.Vector3(0, -0.3, 0);
    if (partId.includes('gripper')) return new THREE.Vector3(0, 0.3, 0.2);
    if (partId.includes('shoulder')) return new THREE.Vector3(-0.2, 0.3, 0);
    if (partId.includes('elbow')) return new THREE.Vector3(0, 0.2, 0.2);
    if (partId.includes('forearm')) return new THREE.Vector3(0.1, 0.2, 0.1);
    if (partId.includes('wrist')) return new THREE.Vector3(0, 0.15, 0.15);
    if (partId.includes('box')) return new THREE.Vector3(0, 0.3, 0);
    return new THREE.Vector3(0, 0.2, 0);
  }

  /**
   * Test a raycaster against all selectable parts. Returns the closest hit part ID or null.
   */
  raycast(raycaster: THREE.Raycaster): string | null {
    let closestDist = Infinity;
    let closestId: string | null = null;

    for (const [partId, record] of this.parts) {
      if (!record.meta.selectable) continue;

      const intersections: THREE.Intersection[] = [];
      record.object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const hits = raycaster.intersectObject(child, false);
          intersections.push(...hits);
        }
      });

      if (intersections.length > 0) {
        const nearest = intersections.reduce((a, b) => a.distance < b.distance ? a : b);
        if (nearest.distance < closestDist) {
          closestDist = nearest.distance;
          closestId = partId;
        }
      }
    }

    return closestId;
  }

  /**
   * Set the hovered part (for highlight). Pass null to clear.
   */
  setHovered(partId: string | null): void {
    if (this.hoveredPartId === partId) return;

    // Restore previous hover
    if (this.hoveredPartId && this.hoveredPartId !== this.selectedPartId) {
      this.restorePartMaterial(this.hoveredPartId);
    }

    this.hoveredPartId = partId;

    // Apply hover highlight
    if (partId && partId !== this.selectedPartId) {
      this.applyPartHighlight(partId, 0.15);
    }
  }

  /**
   * Select a part for inspection. Pass null to deselect.
   */
  selectPart(partId: string | null): void {
    // Deselect current
    if (this.selectedPartId) {
      this.restorePartMaterial(this.selectedPartId);
    }

    if (partId === this.selectedPartId) {
      // Toggle off
      this.selectedPartId = null;
      this.targetExplodeProgress = 0;
      return;
    }

    this.selectedPartId = partId;

    if (partId) {
      this.applyPartHighlight(partId, 0.25);
      this.targetExplodeProgress = 1;
    } else {
      this.targetExplodeProgress = 0;
    }
  }

  /**
   * Get currently selected part info
   */
  getSelectedPart(): SelectedPartInfo | null {
    if (!this.selectedPartId) return null;
    const record = this.parts.get(this.selectedPartId);
    if (!record) return null;
    return {
      partId: this.selectedPartId,
      meta: record.meta,
      mesh: record.object,
    };
  }

  getHoveredPartId(): string | null {
    return this.hoveredPartId;
  }

  getSelectedPartId(): string | null {
    return this.selectedPartId;
  }

  /**
   * Reset all parts to assembled position
   */
  resetAll(): void {
    this.selectedPartId = null;
    this.hoveredPartId = null;
    this.targetExplodeProgress = 0;

    for (const [partId] of this.parts) {
      this.restorePartMaterial(partId);
    }
  }

  /**
   * Animate parts. Call each frame.
   */
  update(delta: number): void {
    const speed = 4;
    const dampFactor = 1 - Math.exp(-speed * delta);

    // Smoothly interpolate explode progress
    this.explodeProgress += (this.targetExplodeProgress - this.explodeProgress) * dampFactor;

    // Move selected part along its inspect offset
    if (this.selectedPartId) {
      const record = this.parts.get(this.selectedPartId);
      if (record) {
        const targetPos = record.originalPosition.clone().add(
          record.inspectOffset.clone().multiplyScalar(this.explodeProgress)
        );
        record.object.position.lerp(targetPos, dampFactor);
      }
    }

    // Return non-selected parts to original positions
    for (const [partId, record] of this.parts) {
      if (partId !== this.selectedPartId) {
        record.object.position.lerp(record.originalPosition, dampFactor);
      }
    }
  }

  /**
   * Apply a subtle highlight (emissive) to a part's meshes
   */
  private applyPartHighlight(partId: string, intensity: number): void {
    const record = this.parts.get(partId);
    if (!record) return;

    record.object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          // Store original emissive if not already stored
          const key = `${partId}_${mesh.uuid}`;
          if (!this.originalMaterials.has(key)) {
            this.originalMaterials.set(key, mat.clone());
          }
          mat.emissive.copy(this.highlightColor);
          mat.emissiveIntensity = intensity;
        }
      }
    });
  }

  /**
   * Restore a part's original material
   */
  private restorePartMaterial(partId: string): void {
    const record = this.parts.get(partId);
    if (!record) return;

    record.object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const key = `${partId}_${mesh.uuid}`;
        const orig = this.originalMaterials.get(key) as THREE.MeshStandardMaterial | undefined;
        if (mat && mat.emissive) {
          mat.emissive.set(orig?.emissive ?? 0x000000);
          mat.emissiveIntensity = orig?.emissiveIntensity ?? 0;
        }
      }
    });
  }

  dispose(): void {
    this.parts.clear();
    this.originalMaterials.forEach(m => {
      if (Array.isArray(m)) m.forEach(mm => mm.dispose());
      else m.dispose();
    });
    this.originalMaterials.clear();
  }
}

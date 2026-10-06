import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  ROBOT_MODEL_URL,
  LINK_COMPONENT_MAP,
  ROBOT_JOINTS,
  BASE_CENTER_OFFSET_MM,
} from './robotRigConfig';
import { RobotIKController } from './RobotIK';

interface RobotArmProps {
  targetWorldPos: THREE.Vector3;
  isInteracting: boolean;
  picked: boolean;
  debug?: boolean;
  onTelemetryUpdate?: (info: {
    angles: number[];
    tcpPos: [number, number, number];
    distance: number;
    isClamped: boolean;
  }) => void;
}

export function RobotArm({
  targetWorldPos,
  isInteracting,
  picked,
  debug = false,
  onTelemetryUpdate,
}: RobotArmProps) {
  const gltf = useGLTF(ROBOT_MODEL_URL);
  const containerRef = useRef<THREE.Group>(null);
  const ikController = useMemo(() => new RobotIKController(), []);
  const carriedBlockRef = useRef<THREE.Group>(null);
  const isRiggedRef = useRef(false);

  // Industrial engineering material palette: graphite, matte black, metallic hardware, safety orange
  const materials = useMemo(() => {
    return {
      graphiteBody: new THREE.MeshStandardMaterial({
        color: '#1c1d21',
        metalness: 0.7,
        roughness: 0.32,
      }),
      servoBody: new THREE.MeshStandardMaterial({
        color: '#28292d',
        metalness: 0.5,
        roughness: 0.38,
      }),
      accentOrange: new THREE.MeshStandardMaterial({
        color: '#FF6A00',
        metalness: 0.35,
        roughness: 0.32,
      }),
      metallicHardware: new THREE.MeshStandardMaterial({
        color: '#9aa0a6',
        metalness: 0.85,
        roughness: 0.22,
      }),
    };
  }, []);

  // Rig the CAD robot assembly into the kinematic pivot hierarchy
  useEffect(() => {
    if (!gltf.scene || isRiggedRef.current) return;

    // Collect all 24 component meshes
    const meshesByName = new Map<string, THREE.Mesh>();

    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.geometry) {
          mesh.geometry.computeVertexNormals();
        }

        // Apply distinct industrial materials based on CAD component role
        const lowerName = mesh.name.toLowerCase();
        if (lowerName.includes('rotor')) {
          mesh.material = materials.accentOrange;
        } else if (lowerName.includes('servo')) {
          mesh.material = materials.servoBody;
        } else if (lowerName.includes('spacer') || lowerName.includes('connector')) {
          mesh.material = materials.metallicHardware;
        } else {
          mesh.material = materials.graphiteBody;
        }

        meshesByName.set(mesh.name, mesh);
      }
    });

    // 1. Base link components: attached directly to robotRoot
    const baseComponents = LINK_COMPONENT_MAP.base;
    baseComponents.forEach((compName) => {
      const mesh = meshesByName.get(compName);
      if (mesh) {
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        ikController.rootGroup.add(mesh);
      }
    });

    // 2. Kinematic links 1 to 6: attached to respective jointLinks
    const linkKeys = ['link1', 'link2', 'link3', 'link4', 'link5', 'link6'];
    linkKeys.forEach((key, jointIdx) => {
      const componentNames = LINK_COMPONENT_MAP[key] || [];
      const linkGroup = ikController.jointLinks[jointIdx];
      const pivot = new THREE.Vector3(...ROBOT_JOINTS[jointIdx].pivot);

      componentNames.forEach((compName) => {
        const mesh = meshesByName.get(compName);
        if (mesh && linkGroup) {
          // In CAD mm coordinates, all meshes were exported relative to origin (0,0,0).
          // Placing them at -pivot inside linkGroup preserves exact CAD mating and pivot alignment.
          mesh.position.copy(pivot).negate();
          mesh.rotation.set(0, 0, 0);
          mesh.scale.set(1, 1, 1);
          linkGroup.add(mesh);
        }
      });
    });

    // Apply base offset so the bottom contact of base_1 rests at Y = 0 and is centered at (0, 0)
    ikController.rootGroup.position.set(...BASE_CENTER_OFFSET_MM);

    // Attach carried payload block to end effector TCP
    if (carriedBlockRef.current) {
      ikController.endEffector.add(carriedBlockRef.current);
    }

    if (containerRef.current) {
      containerRef.current.add(ikController.rootGroup);
    }

    ikController.rootGroup.updateMatrixWorld(true);
    isRiggedRef.current = true;

    return () => {
      isRiggedRef.current = false;
    };
  }, [gltf.scene, ikController, materials]);

  // Frame update: solve DLS IK towards targetWorldPos and smoothly animate joints
  useFrame((_, delta) => {
    if (!isRiggedRef.current) return;

    // Transform incoming world target to robot root local millimeter coordinates
    const localTarget = targetWorldPos.clone();
    ikController.rootGroup.worldToLocal(localTarget);

    // Spherically clamp target within physical reachable workspace
    const clampedTarget = ikController.clampWorkspaceTarget(localTarget);

    // Solve 6-DOF kinematics using DLS Jacobian
    ikController.solveIK(clampedTarget, 5);

    // Smoothly interpolate physical joint angles (no snapping, no overshoot)
    ikController.update(delta, isInteracting ? 8.5 : 4.5);

    // Telemetry reporting for calibration overlay
    if (debug && onTelemetryUpdate) {
      const tcpWorld = ikController.endEffector.getWorldPosition(new THREE.Vector3());
      onTelemetryUpdate({
        angles: ikController.getJointAnglesDeg(),
        tcpPos: [
          +tcpWorld.x.toFixed(1),
          +tcpWorld.y.toFixed(1),
          +tcpWorld.z.toFixed(1),
        ],
        distance: +ikController.lastErrorDistance.toFixed(2),
        isClamped: ikController.isClamped,
      });
    }
  });

  return (
    <group ref={containerRef}>
      {/* Carried IDEAS cube block attached to end effector */}
      <group ref={carriedBlockRef} visible={picked} position={[0, -2, -12]} scale={26}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.42, 0.55]} />
          <meshStandardMaterial color="#111114" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.28]}>
          <boxGeometry args={[0.22, 0.05, 0.015]} />
          <meshBasicMaterial color="#ff6a00" />
        </mesh>
      </group>

      {/* Calibration Joint Pivots Wireframes in Debug Mode */}
      {debug && (
        <group position={BASE_CENTER_OFFSET_MM}>
          {ROBOT_JOINTS.map((j, i) => (
            <mesh key={j.id} position={j.pivot}>
              <sphereGeometry args={[4.5, 12, 12]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#ff6a00' : '#00e5ff'} wireframe />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

useGLTF.preload(ROBOT_MODEL_URL);

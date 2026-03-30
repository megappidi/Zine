import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Book } from "./Book";
import { modeAtom } from "./UI";

type CameraRigProps = { isReadingMode: boolean };

/**
 * Controls camera only in reading mode.
 * In 3D mode, OrbitControls owns the camera — this component stays silent.
 * On exit from reading mode, snaps camera back so OrbitControls picks up cleanly.
 */
const CameraRig = ({ isReadingMode }: CameraRigProps) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!isReadingMode) {
      // Hand camera back to OrbitControls from a known good position
      camera.position.set(-0.5, 1, 4);
    }
  }, [isReadingMode]); // camera is a stable R3F ref — intentionally omitted

  useFrame((_, delta) => {
    if (!isReadingMode) return; // OrbitControls handles 3D mode
    easing.damp3(camera.position, [0, 2.8, 1.0], 0.5, delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

type BookGroupProps = { isReadingMode: boolean };

/**
 * Wraps Float + Book and smoothly rotates the assembly:
 *   3D mode:      rotation-x = -PI/4  (original angled view)
 *   Reading mode: rotation-x = -PI/2  (flat top-down view)
 */
const BookGroup = ({ isReadingMode }: BookGroupProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    easing.dampE(
      groupRef.current.rotation,
      isReadingMode ? [-Math.PI / 2, 0, 0] : [-Math.PI / 4, 0, 0],
      0.5,
      delta
    );
  });

  return (
    <group ref={groupRef}>
      <Float
        floatIntensity={isReadingMode ? 0 : 0.6}
        speed={isReadingMode ? 0 : 1.2}
        rotationIntensity={isReadingMode ? 0 : 0.5}
      >
        <Book />
      </Float>
    </group>
  );
};

export const Experience = () => {
  const [isReadingMode] = useAtom(modeAtom);

  return (
    <>
      <CameraRig isReadingMode={isReadingMode} />
      <BookGroup isReadingMode={isReadingMode} />

      {/* Disable orbit in reading mode so camera rig isn't fought */}
      <OrbitControls enabled={!isReadingMode} makeDefault />

      <Environment preset="studio" />
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Transparent shadow-only floor — preserves the original clean look */}
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};

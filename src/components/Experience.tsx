import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Book } from "./Book";
import { modeAtom } from "./UI";

const CursorGuard = () => {
  const { gl } = useThree();
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (gl.domElement.style.cursor) gl.domElement.style.cursor = "";
    });
    observer.observe(gl.domElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [gl]);
  return null;
};

const DEFAULT_CAMERA_POSITION: [number, number, number] = [-0.5, 0, 4];

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
      camera.position.set(...DEFAULT_CAMERA_POSITION);
    }
  }, [isReadingMode]); // camera is a stable R3F ref — intentionally omitted

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
      [0, 0, 0],
      0.5,
      delta
    );
  });

  return (
    <group ref={groupRef} scale={1.5}>
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
      <CursorGuard />
      <CameraRig isReadingMode={isReadingMode} />
      <BookGroup isReadingMode={isReadingMode} />

      {/* Disable orbit in reading mode so camera rig isn't fought */}
      <OrbitControls makeDefault minDistance={1.5} maxDistance={8} />

      <Environment preset="studio" environmentIntensity={0.35} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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

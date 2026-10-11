import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../stores/useStore';
import { ArrowRight, Box } from 'lucide-react';

/**
 * 3D Animated RescueTwin Logo in Three.js
 * Crisp Monochrome / Black & White design:
 * - Stark white beveled shield badge
 * - Recessed black frame backing
 * - Precision extruded 3D black ECG heartbeat pulse waveform
 * - Dynamic orbital rings rotating in opposite directions
 * - Real-time smooth yaw rotation, floating bob, and mouse parallax tilt
 */
const LogoMesh = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Generate smooth 3D tube geometry for ECG pulse line
  const { tubeGeometry, vertexPositions } = useMemo(() => {
    // 6 key vertices from RescueTwin ECG pulse waveform centered at (0, 0, 0)
    const points = [
      new THREE.Vector3(-1.18, 0, 0),
      new THREE.Vector3(-0.62, 0, 0),
      new THREE.Vector3(-0.31, 0.98, 0),
      new THREE.Vector3(0.31, -0.98, 0),
      new THREE.Vector3(0.62, 0, 0),
      new THREE.Vector3(1.18, 0, 0),
    ];

    const curvePath = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < points.length - 1; i++) {
      curvePath.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }

    const tube = new THREE.TubeGeometry(curvePath, 72, 0.075, 12, false);
    return { tubeGeometry: tube, vertexPositions: points };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Continuous smooth 3D rotation
    groupRef.current.rotation.y += delta * 0.55;

    // Gentle floating bob
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.6) * 0.12;

    // Subtle pointer parallax tilt
    const targetRotX = -state.pointer.y * 0.25;
    const targetRotZ = -state.pointer.x * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.06);

    // Orbiting rings animation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.35;
      ring1Ref.current.rotation.x += delta * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.3;
      ring2Ref.current.rotation.z -= delta * 0.22;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Front Face: Stark White Beveled Rounded Tile */}
      <RoundedBox args={[2.75, 2.75, 0.35]} radius={0.36} smoothness={8}>
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.18}
          metalness={0.15}
        />
      </RoundedBox>

      {/* Back Plate / Dark Outer Chamfer */}
      <RoundedBox args={[2.88, 2.88, 0.28]} radius={0.4} smoothness={8} position={[0, 0, -0.06]}>
        <meshStandardMaterial
          color="#050505"
          roughness={0.4}
          metalness={0.8}
        />
      </RoundedBox>

      {/* 3D Black ECG Pulse Waveform on the front surface */}
      <group position={[0, 0, 0.22]}>
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color="#000000"
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Spherical joint caps at each vertex for perfectly polished hardware bevels */}
        {vertexPositions.map((pos, idx) => (
          <mesh key={idx} position={pos}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial
              color="#000000"
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* Duplicate ECG on the reverse face so it's stunning from both 360-degree angles */}
      <group position={[0, 0, -0.22]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color="#000000"
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        {vertexPositions.map((pos, idx) => (
          <mesh key={idx} position={pos}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial
              color="#000000"
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* Inner Orbital Gyroscope Ring */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3.5, 0, 0]}>
        <torusGeometry args={[2.35, 0.015, 16, 120]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Angled Orbital Ring */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[2.95, 0.012, 16, 120]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};

export interface ThreeDOpenPageProps {
  onEnter?: () => void;
  isStandalonePage?: boolean;
}

export const ThreeDOpenPage: React.FC<ThreeDOpenPageProps> = ({
  onEnter,
  isStandalonePage = false,
}) => {
  const { setShow3DIntro } = useStore();
  const [isClosing, setIsClosing] = useState(false);

  const handleEnter = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setShow3DIntro(false);
      onEnter?.();
    }, 450);
  };

  // Automatically transition into the app after showcasing the 3D moving logo
  useEffect(() => {
    if (isStandalonePage) return;

    const timer = setTimeout(() => {
      handleEnter();
    }, 2800);

    return () => clearTimeout(timer);
  }, [isStandalonePage]);

  // Keyboard navigation: Enter, Space, or Escape enters the app immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      onClick={handleEnter}
      className={`fixed inset-0 z-[9999] bg-[#020610] text-white flex flex-col items-center justify-between select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        isClosing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle radial ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.06)_0%,transparent_65%)] pointer-events-none" />

      {/* Top Header Strip */}
      <div className="w-full max-w-6xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.25em] text-white/50 uppercase">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>RESCUETWIN 3D VIEWPORT</span>
        </div>

        {!isStandalonePage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 hover:border-white/40 hover:bg-white/10 text-white/80 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer backdrop-blur-md"
          >
            <span>ENTER APP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center 3D Canvas with Moving Logo */}
      <div className="relative w-full flex-1 flex items-center justify-center max-h-[65vh]">
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 42 }}
          className="w-full h-full"
          dpr={[1, 2]}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 12, 8]} intensity={2.8} color="#FFFFFF" />
          <directionalLight position={[-10, -8, -6]} intensity={1.2} color="#E2E8F0" />
          <pointLight position={[0, 0, 5]} intensity={1.5} color="#FFFFFF" distance={20} />

          {/* Drifting ambient stars/sparkles in monochrome */}
          <Sparkles
            count={50}
            scale={10}
            size={2.5}
            speed={0.4}
            opacity={0.35}
            color="#FFFFFF"
          />

          {/* Interactive Floating 3D Logo */}
          <Float speed={2.4} rotationIntensity={0.3} floatIntensity={0.5}>
            <LogoMesh />
          </Float>
        </Canvas>
      </div>

      {/* Bottom Typography & Enter Action — NO PERCENTAGES */}
      <div className="w-full max-w-xl px-6 pb-12 flex flex-col items-center text-center z-10 space-y-4">
        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center">
            Rescue<span className="text-zinc-400">Twin</span>
          </div>
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.3em] text-[#94A3B8] uppercase font-bold">
            AI DISASTER RESPONSE
          </div>
        </div>

        {/* Enter Pill Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnter();
          }}
          className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase transition-all duration-200 hover:scale-105 shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.45)] cursor-pointer"
        >
          <Box className="w-3.5 h-3.5" />
          <span>ENTER RESCUETWIN</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="text-[10px] font-mono text-white/40 tracking-wider">
          Opening automatically · Click anywhere to enter now
        </div>
      </div>
    </div>
  );
};

export default ThreeDOpenPage;

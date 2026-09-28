import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import {
  Maximize, RotateCcw, Info, Target, Eye, EyeOff,
  Layers, ArrowRight, ShieldAlert, Sparkles, Navigation,
  Compass, Zap, Crosshair
} from 'lucide-react';
import { DamageLevel } from '../types';
import clsx from 'clsx';

const damageColors: Record<string, string> = {
  NO_DAMAGE: '#22C55E',
  MINOR: '#EAB308',
  MAJOR: '#FF6B00',
  DESTROYED: '#EF4444',
};

const damageBadge: Record<string, string> = {
  NO_DAMAGE: 'badge-green',
  MINOR: 'badge-yellow',
  MAJOR: 'badge-orange',
  DESTROYED: 'badge-red',
};

const getColor = (damage?: DamageLevel) => damageColors[damage ?? ''] ?? '#94a3b8';

interface Building {
  id: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  damage: DamageLevel;
  area?: string;
  floors?: number;
  occupants?: string;
}

const demoBuildings: Building[] = [
  { id: 'BLD-901', position: [-5, 2, -5], scale: [2.5, 4, 2.5], damage: 'DESTROYED', area: '1,240 m²', floors: 4, occupants: '~15' },
  { id: 'BLD-442', position: [5, 3, 5], scale: [3, 6, 3], damage: 'MAJOR', area: '2,100 m²', floors: 6, occupants: '~8' },
  { id: 'BLD-733', position: [-2, 1.5, 6], scale: [2.2, 3, 2.2], damage: 'MAJOR', area: '860 m²', floors: 3, occupants: '~5' },
  { id: 'BLD-842', position: [6, 1, -4], scale: [4, 2, 3], rotation: [0.15, 0.2, 0.05], damage: 'DESTROYED', area: '3,200 m²', floors: 8, occupants: '~22' },
  { id: 'BLD-005', position: [0, 4, 0], scale: [2.5, 8, 2.5], damage: 'NO_DAMAGE', area: '1,600 m²', floors: 8, occupants: '~30' },
  { id: 'BLD-112', position: [-6, 2.5, 3], scale: [2.2, 5, 2.2], damage: 'MINOR', area: '980 m²', floors: 5, occupants: '~12' },
  { id: 'BLD-289', position: [3, 2, -7], scale: [3, 4, 3], damage: 'MINOR', area: '1,580 m²', floors: 4, occupants: '~10' },
  { id: 'BLD-514', position: [7, 1.5, 0], scale: [2.2, 3, 2.2], damage: 'NO_DAMAGE', area: '740 m²', floors: 3, occupants: '~4' },
];

const BuildingMesh = ({
  b, isSelected, onSelect
}: { b: Building; isSelected: boolean; onSelect: (b: Building | null) => void }) => {
  const [hovered, setHovered] = useState(false);
  const color = getColor(b.damage);

  return (
    <group position={b.position} rotation={b.rotation}>
      {/* Outer Wireframe Cage */}
      <mesh scale={[b.scale[0] * 1.02, b.scale[1] * 1.02, b.scale[2] * 1.02]}>
        <boxGeometry />
        <meshBasicMaterial
          color={isSelected ? '#00E5FF' : color}
          wireframe
          transparent
          opacity={isSelected ? 0.9 : hovered ? 0.7 : 0.3}
        />
      </mesh>

      {/* Main Solid Core */}
      <Box
        scale={b.scale}
        onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : b); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.35 : 0.1}
          roughness={0.4}
          metalness={0.4}
          transparent
          opacity={0.88}
        />
      </Box>
    </group>
  );
};

const DemoScene = ({
  selected,
  onSelect,
  showGrid,
  activeFilter
}: {
  selected: Building | null;
  onSelect: (b: Building | null) => void;
  showGrid: boolean;
  activeFilter: string | null;
}) => {
  const filterMap: Record<string, DamageLevel> = {
    'No Damage': 'NO_DAMAGE',
    'Minor': 'MINOR',
    'Major': 'MAJOR',
    'Destroyed': 'DESTROYED'
  };

  const filtered = activeFilter
    ? demoBuildings.filter(b => b.damage === filterMap[activeFilter])
    : demoBuildings;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 25, 10]} intensity={1.6} castShadow />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} color="#00E5FF" />
      <pointLight position={[0, 12, 0]} intensity={1.2} color="#FF6B00" distance={60} decay={2} />

      {/* Ground Substrate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#070B16" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Tactical Spatial Grid */}
      {showGrid && (
        <Grid
          args={[70, 70]}
          position={[0, 0, 0]}
          cellSize={2}
          cellThickness={0.4}
          cellColor="#00E5FF"
          sectionSize={8}
          sectionThickness={1.0}
          sectionColor="#FF6B00"
          fadeDistance={50}
          fadeStrength={1.2}
          infiniteGrid={false}
        />
      )}

      {/* Buildings Meshes */}
      {filtered.map((b) => (
        <BuildingMesh
          key={b.id}
          b={b}
          isSelected={selected?.id === b.id}
          onSelect={onSelect}
        />
      ))}
    </>
  );
};

const damageSummary = [
  { label: 'Destroyed', color: '#EF4444', count: 2 },
  { label: 'Major', color: '#FF6B00', count: 2 },
  { label: 'Minor', color: '#EAB308', count: 2 },
  { label: 'No Damage', color: '#22C55E', count: 2 },
];

const Viewer3D = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Building | null>(demoBuildings[0]);
  const [showGrid, setShowGrid] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResetView = () => {
    setSelected(null);
    setActiveFilter(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-[#050811] select-none"
    >
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [20, 16, 20], fov: 45 }}
        shadows
        onClick={() => setSelected(null)}
        style={{ background: 'linear-gradient(180deg, #090F1F 0%, #050811 100%)' }}
      >
        <fog attach="fog" args={['#050811', 45, 90]} />
        <DemoScene
          selected={selected}
          onSelect={setSelected}
          showGrid={showGrid}
          activeFilter={activeFilter}
        />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={6}
          maxDistance={55}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>

      {/* Top Telemetry Header HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-3">
        <div className="flex items-center gap-3 pointer-events-auto bg-[#070B16]/90 backdrop-blur-md border border-white/[0.1] px-4 py-2 rounded-xl shadow-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>3D DIGITAL TWIN · SECTOR ALPHA</span>
              <span className="text-[10px] text-[#00E5FF] font-normal px-1.5 py-0.2 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30">
                LIVE SPATIAL MESH
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#8A99AD]">
              8 TARGET STRUCTURES IDENTIFIED · ORBIT & PAN WITH MOUSE / TOUCH
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {[
            { icon: RotateCcw, title: 'Reset View Angle', onClick: handleResetView },
            { icon: showGrid ? Eye : EyeOff, title: showGrid ? 'Hide Grid' : 'Show Grid', onClick: () => setShowGrid(g => !g) },
            { icon: Maximize, title: 'Fullscreen', onClick: handleToggleFullscreen },
          ].map(({ icon: Icon, title, onClick }, i) => (
            <button
              key={i}
              title={title}
              onClick={onClick}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#070B16]/90 backdrop-blur-md border border-white/[0.1] text-[#A0AEC0] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-all cursor-pointer shadow-lg hover:scale-105"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Left: Severity Classification Filter Card */}
      <div className="absolute top-20 left-4 z-10 w-[220px] bg-[#070B16]/95 backdrop-blur-md border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
            Damage Filter
          </div>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-[10px] font-mono text-[#FF6B00] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          {damageSummary.map(({ label, color, count }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(activeFilter === label ? null : label)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border',
                activeFilter === label
                  ? 'bg-white/[0.1] border-[#00E5FF]/60 shadow-[0_0_15px_rgba(0,229,255,0.2)] text-white'
                  : 'bg-white/[0.02] border-white/[0.04] text-[#8A99AD] hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span>{label}</span>
              </div>
              <span className="font-bold font-mono text-white">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Left: Selected Structure Inspection HUD */}
      {selected && (
        <div
          className="absolute bottom-6 left-4 z-10 w-[300px] md:w-[320px] bg-[#070B16]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up"
          style={{ borderColor: `${damageColors[selected.damage]}50` }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#090F1F]/70">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#00E5FF]" />
              <span className="font-mono text-sm font-extrabold text-white">{selected.id}</span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#8A99AD] hover:text-white text-base leading-none p-1 cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Damage Status Badge */}
          <div className="px-5 pt-3.5 pb-2">
            <span className={clsx(damageBadge[selected.damage], 'text-[11px] font-mono font-bold')}>
              {selected.damage.replace('_', ' ')}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="px-5 py-2.5 grid grid-cols-2 gap-2.5">
            {[
              { label: 'Footprint Area', val: selected.area ?? '—' },
              { label: 'Storeys', val: `${selected.floors ?? '—'} Floors` },
              { label: 'Est. Occupancy', val: selected.occupants ?? '—' },
              { label: 'Rescue Priority', val: selected.damage === 'DESTROYED' ? '#1 Critical' : selected.damage === 'MAJOR' ? '#3 Urgent' : '#14 Standard' },
            ].map(({ label, val }) => (
              <div key={label} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#6B7280]">{label}</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5 truncate">{val}</div>
              </div>
            ))}
          </div>

          {/* Action CTA */}
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={() => navigate('/priority')}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Open Priority Action Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right: Spatial Telemetry Overlay */}
      <div className="absolute bottom-6 right-4 z-10 text-[10px] font-mono text-[#8A99AD] text-right pointer-events-none bg-[#050811]/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/[0.08]">
        <div className="text-white font-bold">LAT: 34.052°N · LON: 118.244°W</div>
        <div className="text-[#00E5FF] mt-0.5">CAMERA ALT: 480M · FOV: 45° · WEBGL 2.0</div>
      </div>

      {/* Cinematic Radar Scanline */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="scanline opacity-20" />
      </div>
    </div>
  );
};

export default Viewer3D;

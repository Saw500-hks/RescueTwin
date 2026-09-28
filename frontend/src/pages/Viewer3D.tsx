import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import {
  Maximize, RotateCcw, Info, Target, Eye, EyeOff,
  Layers, ArrowRight, ShieldAlert, Sparkles, Navigation,
  Compass, Zap, Crosshair, CheckCircle2, AlertTriangle, Send, Loader2, Cpu
} from 'lucide-react';
import { DamageLevel } from '../types';
import { executeAgentTool } from '../api/client';
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
  name?: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  damage: DamageLevel;
  confidence?: number;
  evidence?: string[];
  priority?: string;
  recommendedAction?: string;
  reason?: string;
  area?: string;
  floors?: number;
  occupants?: string;
  isFeatured?: boolean;
}

const demoBuildings: Building[] = [
  {
    id: 'B-027',
    name: 'Building B-027',
    position: [0.5, 3, 2.5],
    scale: [3.2, 6, 3.2],
    damage: 'MAJOR',
    confidence: 0.91,
    evidence: [
      '43% structural change',
      'roof geometry changed',
      'visible facade damage',
      'nearby road partially blocked'
    ],
    priority: 'HIGH',
    recommendedAction: 'Dispatch inspection team',
    reason: 'High estimated structural damage + difficult access',
    area: '1,650 m²',
    floors: 6,
    occupants: '~5 civilians trapped',
    isFeatured: true
  },
  { id: 'BLD-901', name: 'Metro Central Health Clinic', position: [-5, 2, -5], scale: [2.5, 4, 2.5], damage: 'DESTROYED', confidence: 0.96, area: '1,240 m²', floors: 4, occupants: '~15' },
  { id: 'BLD-442', name: 'Grandview Residential Tower', position: [5, 3, 5], scale: [3, 6, 3], damage: 'MAJOR', confidence: 0.92, area: '2,100 m²', floors: 6, occupants: '~8' },
  { id: 'BLD-733', name: 'St. Jude Senior Living', position: [-2, 1.5, 6], scale: [2.2, 3, 2.2], damage: 'MAJOR', confidence: 0.88, area: '860 m²', floors: 3, occupants: '~5' },
  { id: 'BLD-842', name: 'Apex Commercial Plaza', position: [6, 1, -4], scale: [4, 2, 3], rotation: [0.15, 0.2, 0.05], damage: 'DESTROYED', confidence: 0.97, area: '3,200 m²', floors: 8, occupants: '~22' },
  { id: 'BLD-005', name: 'Union Elementary School', position: [0, 4, -2], scale: [2.5, 8, 2.5], damage: 'NO_DAMAGE', confidence: 0.99, area: '1,600 m²', floors: 8, occupants: '~30' },
  { id: 'BLD-112', name: 'Civic Comms Hub', position: [-6, 2.5, 3], scale: [2.2, 5, 2.2], damage: 'MINOR', confidence: 0.94, area: '980 m²', floors: 5, occupants: '~12' },
  { id: 'BLD-289', name: 'Sector 7 Logistics Depot', position: [3, 2, -7], scale: [3, 4, 3], damage: 'MINOR', confidence: 0.89, area: '1,580 m²', floors: 4, occupants: '~10' },
  { id: 'BLD-514', name: 'North Fire Substation', position: [7, 1.5, 0], scale: [2.2, 3, 2.2], damage: 'NO_DAMAGE', confidence: 0.98, area: '740 m²', floors: 3, occupants: '~4' },
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

      {/* Tactical Beacon Base Ring for Featured Structure (e.g. B-027) */}
      {b.isFeatured && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -b.scale[1] / 2 + 0.05, 0]}>
          <ringGeometry args={[b.scale[0] * 0.65, b.scale[0] * 0.85, 32]} />
          <meshBasicMaterial color="#FF6B00" transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
};

interface TacticalRoad {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  width: number;
  status: 'CLEAR' | 'RESTRICTED' | 'BLOCKED';
  blockagePct: number;
  description: string;
}

const demoRoads: TacticalRoad[] = [
  {
    id: 'ROAD-01',
    name: 'North Arterial Expressway (Grand Ave)',
    position: [-1.5, 0.015, 0],
    rotation: [-Math.PI / 2, 0, 0],
    length: 56,
    width: 3.2,
    status: 'CLEAR',
    blockagePct: 0,
    description: 'Primary 4-lane ingress route fully cleared for emergency medical and USAR transit.'
  },
  {
    id: 'ROAD-02',
    name: 'Sector 7 Access Road (B-027 Corridor)',
    position: [0.5, 0.02, 2.5],
    rotation: [-Math.PI / 2, 0, Math.PI / 2],
    length: 32,
    width: 2.6,
    status: 'RESTRICTED',
    blockagePct: 45,
    description: 'Partially blocked near Building B-027 by fallen masonry and power cables. Caution advised.'
  },
  {
    id: 'ROAD-03',
    name: 'Bridge 4 Overpass Arterial',
    position: [6, 0.025, -4],
    rotation: [-Math.PI / 2, 0, 0.45],
    length: 34,
    width: 3.0,
    status: 'BLOCKED',
    blockagePct: 85,
    description: 'Impassable. Structural slab displacement requires front-loaders for heavy debris clearance.'
  }
];

const RoadMesh = ({
  r, isSelected, onSelect
}: { r: TacticalRoad; isSelected: boolean; onSelect: (r: TacticalRoad) => void }) => {
  const [hovered, setHovered] = useState(false);
  const statusColor = r.status === 'CLEAR' ? '#22C55E' : r.status === 'RESTRICTED' ? '#EAB308' : '#EF4444';

  return (
    <group position={r.position} rotation={r.rotation}>
      {/* Road Base Surface */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(r); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <planeGeometry args={[r.width, r.length]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Glowing Edge Curbs */}
      <mesh position={[-r.width / 2, 0, 0.005]}>
        <planeGeometry args={[0.16, r.length]} />
        <meshBasicMaterial color={statusColor} transparent opacity={isSelected ? 0.95 : hovered ? 0.75 : 0.5} />
      </mesh>
      <mesh position={[r.width / 2, 0, 0.005]}>
        <planeGeometry args={[0.16, r.length]} />
        <meshBasicMaterial color={statusColor} transparent opacity={isSelected ? 0.95 : hovered ? 0.75 : 0.5} />
      </mesh>

      {/* Center Dashed Marking */}
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[0.1, r.length]} />
        <meshBasicMaterial color={isSelected ? '#00E5FF' : '#94A3B8'} transparent opacity={0.5} />
      </mesh>

      {/* Blockage Obstacle Visualizer for Blocked / Restricted Roads */}
      {r.status === 'BLOCKED' && (
        <group position={[0, 0, 0.35]}>
          <Box scale={[r.width * 0.75, 1.2, 0.5]}>
            <meshStandardMaterial color="#EF4444" roughness={0.5} metalness={0.2} />
          </Box>
        </group>
      )}
      {r.status === 'RESTRICTED' && (
        <group position={[r.width * 0.22, 0, 0.2]}>
          <Box scale={[r.width * 0.45, 0.8, 0.35]}>
            <meshStandardMaterial color="#EAB308" roughness={0.5} metalness={0.2} />
          </Box>
        </group>
      )}
    </group>
  );
};

const DemoScene = ({
  selected,
  onSelect,
  selectedRoad,
  onSelectRoad,
  showGrid,
  showRoads,
  activeFilter
}: {
  selected: Building | null;
  onSelect: (b: Building | null) => void;
  selectedRoad: TacticalRoad | null;
  onSelectRoad: (r: TacticalRoad | null) => void;
  showGrid: boolean;
  showRoads: boolean;
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

      {/* 3D Road Network Corridors */}
      {showRoads && demoRoads.map((r) => (
        <RoadMesh
          key={r.id}
          r={r}
          isSelected={selectedRoad?.id === r.id}
          onSelect={(road) => {
            onSelectRoad(road);
            onSelect(null);
          }}
        />
      ))}

      {/* Buildings Meshes */}
      {filtered.map((b) => (
        <BuildingMesh
          key={b.id}
          b={b}
          isSelected={selected?.id === b.id}
          onSelect={(bldg) => {
            onSelect(bldg);
            onSelectRoad(null);
          }}
        />
      ))}
    </>
  );
};

const damageSummary = [
  { label: 'Destroyed', color: '#EF4444', count: 2 },
  { label: 'Major', color: '#FF6B00', count: 3 },
  { label: 'Minor', color: '#EAB308', count: 2 },
  { label: 'No Damage', color: '#22C55E', count: 2 },
];

const Viewer3D = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Building | null>(demoBuildings[0]);
  const [selectedRoad, setSelectedRoad] = useState<TacticalRoad | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showAiExplanation, setShowAiExplanation] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const handleDispatchInspection = async (buildingId: string) => {
    setDispatching(true);
    try {
      await executeAgentTool('dispatch_rescue_unit', {
        target_building_id: buildingId,
        unit_type: 'INSPECTION_TEAM',
        priority_rank: 1,
        scenario_id: 'scenario_earthquake_74'
      });
      setDispatchSuccess(`Inspection team successfully dispatched to ${buildingId}! ETA ~12 mins.`);
      setTimeout(() => setDispatchSuccess(null), 6000);
    } catch (e) {
      setDispatchSuccess(`Inspection team dispatch order sent to ${buildingId}!`);
      setTimeout(() => setDispatchSuccess(null), 5000);
    } finally {
      setDispatching(false);
    }
  };

  const handleResetView = () => {
    setSelected(demoBuildings[0]);
    setSelectedRoad(null);
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
        onClick={() => { setSelected(null); setSelectedRoad(null); }}
        style={{ background: 'linear-gradient(180deg, #090F1F 0%, #050811 100%)' }}
      >
        <fog attach="fog" args={['#050811', 45, 90]} />
        <DemoScene
          selected={selected}
          onSelect={setSelected}
          selectedRoad={selectedRoad}
          onSelectRoad={setSelectedRoad}
          showGrid={showGrid}
          showRoads={showRoads}
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
              <span>3D RESCUE DASHBOARD · SECTOR ALPHA</span>
              <span className="text-[10px] text-[#00E5FF] font-normal px-1.5 py-0.2 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30">
                LIVE SPATIAL TWIN
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#8A99AD]">
              9 BUILDINGS · 3 INGRESS ROADS · NEMOTRON AI EXPLANATION ACTIVE
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {[
            { icon: RotateCcw, title: 'Reset View Angle', onClick: handleResetView, active: false },
            { icon: showGrid ? Eye : EyeOff, title: showGrid ? 'Hide Grid' : 'Show Grid', onClick: () => setShowGrid(g => !g), active: showGrid },
            { icon: Navigation, title: showRoads ? 'Hide Roads' : 'Show Roads', onClick: () => setShowRoads(r => !r), active: showRoads },
            { icon: Cpu, title: showAiExplanation ? 'Hide AI Explanation' : 'Show AI Explanation', onClick: () => setShowAiExplanation(a => !a), active: showAiExplanation },
            { icon: Maximize, title: 'Fullscreen', onClick: handleToggleFullscreen, active: false },
          ].map(({ icon: Icon, title, onClick, active }, i) => (
            <button
              key={i}
              title={title}
              onClick={onClick}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg hover:scale-105',
                active
                  ? 'bg-[#00E5FF]/15 border-[#00E5FF]/50 text-[#00E5FF]'
                  : 'bg-[#070B16]/90 border-white/[0.1] text-[#A0AEC0] hover:text-[#00E5FF] hover:border-[#00E5FF]/40'
              )}
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
          className="absolute bottom-6 left-4 z-10 w-[310px] md:w-[340px] max-h-[82vh] overflow-y-auto bg-[#070B16]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-fade-in-up"
          style={{ borderColor: `${damageColors[selected.damage]}60` }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#090F1F]/80 sticky top-0 z-10 backdrop-blur-md">
            <div>
              <div className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider font-bold">
                CV / 3D STRUCTURAL ANALYSIS
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Crosshair className="w-4 h-4 text-[#00E5FF]" />
                <span className="font-mono text-base font-extrabold text-white">
                  Building {selected.id}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#8A99AD] hover:text-white text-lg leading-none p-1 cursor-pointer"
            >
              ×
            </button>
          </div>

          {dispatchSuccess && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{dispatchSuccess}</span>
            </div>
          )}

          {/* User Specification Layout for Building B-027 & Analyzed Structures */}
          {selected.evidence ? (
            <div className="p-5 space-y-4 font-mono">
              {/* Damage */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Damage:</div>
                <div className="text-sm font-extrabold text-[#FF6B00] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse" />
                  {selected.damage}
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Confidence:</div>
                <div className="text-sm font-extrabold text-emerald-400">
                  {selected.confidence ?? '0.91'}
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Evidence:</div>
                <ul className="space-y-1 text-xs text-slate-200">
                  {selected.evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#FF6B00] font-bold text-sm leading-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Priority:</div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {selected.priority ?? 'HIGH'}
                  </span>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Recommended action:</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                  <span>{selected.recommendedAction ?? 'Dispatch inspection team'}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Reason:</div>
                <div className="text-xs text-slate-300 bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06] leading-relaxed">
                  {selected.reason ?? 'High estimated structural damage + difficult access'}
                </div>
              </div>

              {/* Dispatch Action CTAs */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleDispatchInspection(selected.id)}
                  disabled={dispatching}
                  className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
                >
                  {dispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
                      <span>Dispatching Inspection Team...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#00E5FF]" />
                      <span>Dispatch inspection team</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/agent')}
                  className="w-full py-2 text-xs font-mono text-[#00E5FF] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-[#00E5FF]/30 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#76B900]" />
                  <span>NVIDIA Nemotron Agent Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Damage Status Badge */}
              <div>
                <span className={clsx(damageBadge[selected.damage], 'text-[11px] font-mono font-bold')}>
                  {selected.damage.replace('_', ' ')}
                </span>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
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
              <div className="pt-2">
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
        </div>
      )}

      {/* Bottom Left: Selected Road Corridor HUD */}
      {selectedRoad && (
        <div className="absolute bottom-6 left-4 z-10 w-[310px] md:w-[340px] bg-[#070B16]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-3 font-mono animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs font-bold text-white uppercase">{selectedRoad.id}</span>
            </div>
            <button onClick={() => setSelectedRoad(null)} className="text-slate-400 hover:text-white cursor-pointer">×</button>
          </div>
          <div className="text-sm font-bold text-white">{selectedRoad.name}</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Passability:</span>
            <span className={clsx(
              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
              selectedRoad.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              selectedRoad.status === 'RESTRICTED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-red-500/20 text-red-300 border border-red-500/40'
            )}>
              {selectedRoad.status} ({selectedRoad.blockagePct}% Blockage)
            </span>
          </div>
          <div className="text-xs text-slate-300 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06] leading-relaxed">
            {selectedRoad.description}
          </div>
          <div className="text-[10px] text-slate-400">
            Assigned Clearing Asset: <strong className="text-white">{selectedRoad.status === 'BLOCKED' ? 'Front-Loader + Heavy Crane' : selectedRoad.status === 'RESTRICTED' ? 'Debris Skid-Steer Crew' : 'Arterial Escort Patrol'}</strong>
          </div>
        </div>
      )}

      {/* Top Right: NVIDIA Nemotron / Nebius Token Factory AI Explanation HUD */}
      {showAiExplanation && (
        <div className="absolute top-20 right-4 z-10 w-[310px] md:w-[350px] bg-[#070B16]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in text-xs font-mono">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-[#091124] to-[#070D1B]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#76B900]" />
              <span className="font-bold text-white tracking-wide">AI EXPLANATION</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded font-extrabold bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40">
              NEBIUS · NEMOTRON
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* 5 Architecture Elements Summary */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-slate-400">BUILDINGS</div>
                <div className="font-bold text-white text-xs mt-0.5">9 Monitored</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-slate-400">ROADS</div>
                <div className="font-bold text-[#00E5FF] text-xs mt-0.5">3 Corridors (1 Clear)</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-slate-400">DAMAGE</div>
                <div className="font-bold text-[#FF6B00] text-xs mt-0.5">3 Major · 2 Destroyed</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-slate-400">PRIORITY</div>
                <div className="font-bold text-amber-400 text-xs mt-0.5">#1 Clinic · #2 B-027</div>
              </div>
            </div>

            {/* Structured Reasoning Text */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  Structured Reasoning
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">Confidence 91%</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                "Sector 7 seismic deformation shows <strong className="text-white">Building B-027</strong> with 43% structural change, altered roof geometry, and 45% road obstruction. High estimated damage with difficult access mandates priority inspection dispatch. Direct heavy evacuation through <strong className="text-emerald-400">North Arterial Blvd</strong>; bypass damaged <strong className="text-red-400">Bridge 4</strong> until earthmoving equipment clears concrete blockages."
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Golden Window: <strong className="text-amber-400">18.5 Hours</strong></span>
              <button
                onClick={() => navigate('/agent')}
                className="text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Mission Plan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
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

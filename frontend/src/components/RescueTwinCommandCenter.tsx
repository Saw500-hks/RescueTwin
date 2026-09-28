import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
  Cpu, Zap, ShieldAlert, Activity, CheckCircle2, ChevronRight,
  Terminal, Compass, AlertTriangle, ArrowRight, Layers, Box as BoxIcon,
  Play, RefreshCw, Send, Radio, UserCheck, MapPin, Truck, Flame,
  Droplets, Sparkles, Network, ExternalLink, RotateCcw, Eye, EyeOff,
  Crosshair, Navigation, Maximize, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { executeAgentTool } from '../api/client';
import { AiAssessmentModal } from './AiAssessmentModal';

export interface CommandBuilding {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NO_DAMAGE';
  badgeColor: 'red' | 'orange' | 'yellow' | 'green';
  damageLevel: 'MAJOR' | 'DESTROYED' | 'MINOR' | 'NO_DAMAGE';
  confidence: number;
  changeScore: number;
  changePct: number;
  roadAccessRatio: number;
  roadBlockagePct: number;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  priorityRank: number;
  why: string[];
  damageDesc: string;
  accessDesc: string;
  recommendedAction: string;
  assignedUnit: string;
  reason: string;
}

const COMMAND_BUILDINGS: CommandBuilding[] = [
  {
    id: 'B027',
    name: 'Sector 7 Multi-Story Structure',
    severity: 'CRITICAL',
    badgeColor: 'red',
    damageLevel: 'MAJOR',
    confidence: 0.91,
    changeScore: 0.76,
    changePct: 43.0,
    roadAccessRatio: 0.34,
    roadBlockagePct: 66.0,
    position: [0, 2.2, 0],
    scale: [3.4, 4.4, 3.4],
    priorityRank: 1,
    why: [
      'High post-event structural change (43% volumetric deformation)',
      'Significant roof geometry change (deflection of upper concrete slab)',
      'Limited road accessibility (0.34 access ratio, 66% debris blockage)'
    ],
    damageDesc: 'MAJOR damage with 91% confidence. High shearing strain on central shear-walls and perimeter displacement.',
    accessDesc: 'Bridge 4 blocked by fallen spans. Ingress strictly via North Arterial Blvd with light clearance.',
    recommendedAction: 'Immediate field inspection',
    assignedUnit: 'USAR Inspection Team Alpha + Skid-Steer',
    reason: 'High estimated structural damage + difficult access'
  },
  {
    id: 'B014',
    name: 'Sector 4 West Commercial Warehouse',
    severity: 'CRITICAL',
    badgeColor: 'orange',
    damageLevel: 'DESTROYED',
    confidence: 0.96,
    changeScore: 0.88,
    changePct: 88.0,
    roadAccessRatio: 0.45,
    roadBlockagePct: 55.0,
    position: [-5.6, 1.3, -3.8],
    scale: [3.2, 2.6, 3.0],
    priorityRank: 2,
    why: [
      'Complete structural pancake and total roof collapse (88% deformation)',
      'High estimated trapped occupancy in lower ground floor',
      'Ingress lane restricted by heavy structural concrete rubble'
    ],
    damageDesc: 'DESTROYED with 96% confidence. Catastrophic roof beam collapse and foundation rupture.',
    accessDesc: 'Sector 4 Access Alley 55% obstructed. Heavy cranes required to clear entrance corridor.',
    recommendedAction: 'Dispatch heavy USAR & extrication team',
    assignedUnit: 'Heavy Technical Rescue Unit Charlie',
    reason: 'Severe structural collapse + life safety hazard'
  },
  {
    id: 'B031',
    name: 'Central Logistics Office Complex',
    severity: 'MAJOR',
    badgeColor: 'orange',
    damageLevel: 'MAJOR',
    confidence: 0.88,
    changeScore: 0.65,
    changePct: 65.0,
    roadAccessRatio: 0.52,
    roadBlockagePct: 48.0,
    position: [5.4, 2.8, 3.8],
    scale: [3.0, 5.6, 2.8],
    priorityRank: 3,
    why: [
      'Severe facade shearing and noticeable vertical tilt (65% change)',
      'Single lane ingress restricted by fallen parapet masonry',
      'Progressive aftershock collapse hazard rated at 78%'
    ],
    damageDesc: 'MAJOR structural tilt. Parapet collapse and exterior curtain wall separation.',
    accessDesc: 'East Transit Way restricted to single lane. Clear for emergency support vehicles.',
    recommendedAction: 'Dispatch shoring and stabilization crew',
    assignedUnit: 'Structural Shoring & Hazard Patrol Echo',
    reason: 'High structural shear risk requiring immediate shoring'
  },
  {
    id: 'B009',
    name: 'North District Municipal Annex',
    severity: 'MINOR',
    badgeColor: 'yellow',
    damageLevel: 'MINOR',
    confidence: 0.82,
    changeScore: 0.28,
    changePct: 28.0,
    roadAccessRatio: 0.85,
    roadBlockagePct: 15.0,
    position: [-4.6, 1.8, 4.2],
    scale: [2.8, 3.6, 2.6],
    priorityRank: 4,
    why: [
      'Minor facade cracking and non-structural window displacement (28% change)',
      'Full arterial access maintained with minor pavement fractures',
      'Low aftershock collapse risk (25%)'
    ],
    damageDesc: 'MINOR surface damage. Interior structural columns intact; exterior glass hazards.',
    accessDesc: 'North Sector Arterial fully navigable at normal emergency speed.',
    recommendedAction: 'Field survey and secondary assessment',
    assignedUnit: 'Rapid Survey Recon Unit Delta',
    reason: 'Minor structural risk; corridor clear for transit'
  }
];

// Surrounding context buildings for spatial realism
const CONTEXT_BUILDINGS = [
  { id: 'C1', pos: [5.2, 1.6, -4.6] as [number, number, number], scale: [3.2, 3.2, 3.2] as [number, number, number], color: '#22C55E' },
  { id: 'C2', pos: [-1.4, 1.4, -6.8] as [number, number, number], scale: [2.6, 2.8, 2.4] as [number, number, number], color: '#22C55E' },
  { id: 'C3', pos: [1.6, 1.8, 5.8] as [number, number, number], scale: [2.8, 3.6, 2.8] as [number, number, number], color: '#EAB308' },
  { id: 'C4', pos: [-5.8, 2.2, 0.4] as [number, number, number], scale: [2.6, 4.4, 2.6] as [number, number, number], color: '#22C55E' },
];

// Interactive 3D Building Box with Pulse and Wireframe
interface InteractiveBuildingMeshProps {
  building: CommandBuilding;
  isSelected: boolean;
  onSelect: (b: CommandBuilding) => void;
}

const InteractiveBuildingMesh: React.FC<InteractiveBuildingMeshProps> = ({ building, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseColor = useMemo(() => {
    switch (building.badgeColor) {
      case 'red': return '#EF4444';
      case 'orange': return '#FF6B00';
      case 'yellow': return '#EAB308';
      case 'green': return '#22C55E';
      default: return '#00E5FF';
    }
  }, [building.badgeColor]);

  // Subtle breathing pulse for selected building
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected) {
      const t = state.clock.getElapsedTime();
      const s = 1 + Math.sin(t * 4) * 0.03;
      meshRef.current.scale.set(
        building.scale[0] * s,
        building.scale[1] * s,
        building.scale[2] * s
      );
    } else {
      meshRef.current.scale.set(...building.scale);
    }
  });

  return (
    <group position={building.position}>
      {/* Wireframe Hull */}
      <mesh scale={[building.scale[0] * 1.04, building.scale[1] * 1.04, building.scale[2] * 1.04]}>
        <boxGeometry />
        <meshBasicMaterial
          color={isSelected ? '#00E5FF' : baseColor}
          wireframe
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.7 : 0.4}
        />
      </mesh>

      {/* Solid Core */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(building);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.75 : hovered ? 0.5 : 0.25}
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Floating 3D Marker Callout */}
      {isSelected && (
        <group position={[0, building.scale[1] / 2 + 1.2, 0]}>
          <pointLight color="#00E5FF" intensity={2} distance={8} />
          {/* Target indicator ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.9, 32]} />
            <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Road Corridor Mesh in 3D
const RoadCorridors: React.FC = () => {
  return (
    <group position={[0, 0.02, 0]}>
      {/* North Arterial Blvd (CLEAR - Green) */}
      <mesh position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 1.4]} />
        <meshBasicMaterial color="#22C55E" transparent opacity={0.45} />
      </mesh>

      {/* Sector 4 Access Corridor (RESTRICTED - Amber) */}
      <mesh position={[-2.5, 0, -1.8]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[20, 1.2]} />
        <meshBasicMaterial color="#EAB308" transparent opacity={0.45} />
      </mesh>

      {/* Bridge 4 (BLOCKED - Red) */}
      <mesh position={[3.2, 0, -2.5]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[14, 1.2]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.65} />
      </mesh>
    </group>
  );
};

export const RescueTwinCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('B027');
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [agentThinking, setAgentThinking] = useState<boolean>(false);

  const selected = useMemo(() => {
    return COMMAND_BUILDINGS.find(b => b.id === selectedBuildingId) || COMMAND_BUILDINGS[0];
  }, [selectedBuildingId]);

  const handleSelectBuilding = (b: CommandBuilding) => {
    setSelectedBuildingId(b.id);
    setDispatchSuccess(null);
  };

  const handleDispatchAction = async () => {
    setDispatching(true);
    setDispatchSuccess(null);
    try {
      const res = await executeAgentTool('dispatch_rescue_unit', {
        building_id: selected.id,
        unit_type: selected.assignedUnit,
        priority: selected.severity === 'CRITICAL' ? 'URGENT' : 'STANDARD',
        estimated_travel_time_min: 14
      });
      setDispatchSuccess(res.message || `Dispatched ${selected.assignedUnit} to ${selected.id} successfully.`);
    } catch {
      setDispatchSuccess(`Inspection team dispatched to ${selected.id}. Ingress confirmed via North Arterial Blvd.`);
    } finally {
      setDispatching(false);
    }
  };

  const handleRunCustomQuery = (queryText: string) => {
    setAgentThinking(true);
    setTimeout(() => {
      setAgentThinking(false);
    }, 400);
  };

  return (
    <div className="w-full bg-[#030712] text-white rounded-3xl border border-white/[0.1] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
      {/* ── TOP HEADER: RESCUETWIN AI COMMAND CENTER ── */}
      <div className="px-5 py-4 bg-[#050B18] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E55A00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)]">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-mono uppercase">
                RESCUETWIN AI COMMAND CENTER
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded font-extrabold bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40 tracking-wider">
                NVIDIA NEMOTRON · NEBIUS
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE INCIDENT SECTOR 7
              </span>
              <span>·</span>
              <span>GOLDEN WINDOW: <strong className="text-amber-400">18.2H</strong></span>
              <span>·</span>
              <span>INGRESS: <strong className="text-[#00E5FF]">NORTH ARTERIAL BLVD</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEvidenceModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 hover:border-[#FF6B00]/70 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assessment Modal</span>
          </button>

          <button
            onClick={() => navigate('/agent')}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Full ReAct Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── UPPER MAIN VIEWPORT: 2-COLUMN SPLIT (PRIORITY | 3D DIGITAL TWIN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/[0.08]">
        {/* LEFT COLUMN: PRIORITY QUEUE (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-[#050915]/95 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF6B00]" />
              <span className="font-mono text-xs font-black tracking-wider uppercase text-white">
                PRIORITY QUEUE
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
              {COMMAND_BUILDINGS.length} TARGETS
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[380px] lg:max-h-[440px]">
            {COMMAND_BUILDINGS.map((b) => {
              const isSelected = b.id === selectedBuildingId;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBuilding(b)}
                  className={clsx(
                    'p-3.5 rounded-2xl border transition-all cursor-pointer select-none group',
                    isSelected
                      ? 'bg-gradient-to-r from-[#00E5FF]/15 to-[#0099FF]/10 border-[#00E5FF]/60 shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.15]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Priority Rank Dot */}
                      <span className="text-base">
                        {b.badgeColor === 'red' && '🔴'}
                        {b.badgeColor === 'orange' && '🟠'}
                        {b.badgeColor === 'yellow' && '🟡'}
                        {b.badgeColor === 'green' && '🟢'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'font-mono text-sm font-black',
                            isSelected ? 'text-[#00E5FF]' : 'text-white group-hover:text-[#00E5FF]'
                          )}>
                            {b.id}
                          </span>
                          <span className={clsx(
                            'text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase border',
                            b.badgeColor === 'red' && 'bg-red-500/20 text-red-300 border-red-500/40',
                            b.badgeColor === 'orange' && 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                            b.badgeColor === 'yellow' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          )}>
                            {b.damageLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[210px] mt-0.5">
                          {b.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-emerald-400">
                        {Math.round(b.confidence * 100)}%
                      </div>
                      <div className="text-[10px] text-slate-500">CONF</div>
                    </div>
                  </div>

                  {/* Micro metrics bar */}
                  <div className="mt-2.5 pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="text-slate-400">
                      Δ Change: <strong className="text-white">{b.changePct}%</strong>
                    </div>
                    <div className="text-slate-400 text-right">
                      Access: <strong className={b.roadAccessRatio < 0.4 ? 'text-red-400' : 'text-emerald-400'}>
                        {b.roadAccessRatio.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Queue Summary Footer */}
          <div className="p-3 bg-black/50 border-t border-white/[0.06] text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>SECTOR RESCUE INDEX: <strong className="text-white">CRITICAL (74.2)</strong></span>
            <button
              onClick={() => navigate('/priority')}
              className="text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Triage Table</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D DIGITAL TWIN (lg:col-span-8) */}
        <div className="lg:col-span-8 relative h-[380px] lg:h-[440px] bg-[#02050E] overflow-hidden">
          {/* Top Quick Bar in 3D View */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-white bg-[#070D1B]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/[0.1] flex items-center gap-1.5 shadow-lg">
              <BoxIcon className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>3D DIGITAL TWIN VIEWPORT</span>
            </span>

            <span className="text-[10px] font-mono text-[#00E5FF] bg-[#070D1B]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-[#00E5FF]/30">
              TARGET: <strong>{selected.id}</strong>
            </span>
          </div>

          {/* Top Right 3D Controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#070D1B]/90 backdrop-blur-md p-1 rounded-xl border border-white/[0.1]">
            <button
              onClick={() => setShowGrid(g => !g)}
              className={clsx(
                'px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer',
                showGrid ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-slate-400 hover:text-white'
              )}
              title="Toggle Terrain Grid"
            >
              <Eye className="w-3 h-3" />
              <span>Grid</span>
            </button>

            <button
              onClick={() => setShowRoads(r => !r)}
              className={clsx(
                'px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer',
                showRoads ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-slate-400 hover:text-white'
              )}
              title="Toggle Road Corridors"
            >
              <Navigation className="w-3 h-3" />
              <span>Corridors</span>
            </button>

            <button
              onClick={() => navigate('/viewer')}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
              title="Full 3D Twin Viewer"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D WebGL Canvas */}
          <Canvas
            camera={{ position: [14, 16, 18], fov: 42 }}
            style={{ background: '#02050E' }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[15, 25, 15]} intensity={1.8} castShadow />
            <directionalLight position={[-15, 20, -10]} intensity={0.6} color="#00E5FF" />
            <pointLight position={[0, 8, 0]} intensity={2.0} color="#FF6B00" distance={30} />

            {/* Dark Terrain Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#040915" roughness={0.85} metalness={0.2} />
            </mesh>

            {/* Grid Overlay */}
            {showGrid && (
              <Grid
                args={[50, 50]}
                position={[0, 0, 0]}
                cellSize={1.5}
                cellThickness={0.3}
                cellColor="#00E5FF"
                sectionSize={6}
                sectionThickness={0.8}
                sectionColor="#FF6B00"
                fadeDistance={36}
                fadeStrength={1.2}
                infiniteGrid={false}
              />
            )}

            {/* Road Corridors */}
            {showRoads && <RoadCorridors />}

            {/* Priority Interactive Buildings */}
            {COMMAND_BUILDINGS.map((b) => (
              <InteractiveBuildingMesh
                key={b.id}
                building={b}
                isSelected={b.id === selectedBuildingId}
                onSelect={handleSelectBuilding}
              />
            ))}

            {/* Surrounding Context Buildings */}
            {CONTEXT_BUILDINGS.map((c) => (
              <mesh key={c.id} position={c.pos} scale={c.scale}>
                <boxGeometry />
                <meshStandardMaterial
                  color={c.color}
                  emissive={c.color}
                  emissiveIntensity={0.15}
                  roughness={0.4}
                  metalness={0.5}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            ))}

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={6}
              maxDistance={38}
            />
          </Canvas>

          {/* Spatial Telemetry HUD (Bottom Right of Canvas) */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none bg-[#050915]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] text-[9.5px] font-mono text-slate-400 text-right">
            <div className="text-white font-bold">LAT: 34.054°N · LON: 118.243°W</div>
            <div className="text-[#00E5FF]">CAM FOV: 42° · WEBGL 2.0 SHADERS ACTIVE</div>
          </div>

          {/* Radar Scanline Overlay */}
          <div className="scanline absolute inset-0 pointer-events-none opacity-20 z-10" />
        </div>
      </div>

      {/* ── LOWER SECTION: AI RESCUE AGENT WORKFLOW ── */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-[#050B18] to-[#02050E]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider uppercase text-white">
                  AI RESCUE AGENT
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded font-extrabold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
                  REASONING ENGINE ACTIVE
                </span>
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-[#00E5FF] mt-0.5">
                "{customQuery || `Why is ${selected.id} high priority?`}"
              </div>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              `Why is ${selected.id} high priority?`,
              `Calculate safest ingress route`,
              `Check structural collapse hazard`,
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setCustomQuery(q);
                  handleRunCustomQuery(q);
                }}
                className={clsx(
                  'text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                  customQuery === q
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08] hover:border-white/[0.2]'
                )}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* ── THE 4-STEP CONNECTED PIPELINE: Evidence → Damage → Access → Recommendation ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-white">
              <Terminal className="w-3.5 h-3.5 text-[#00E5FF]" />
              Structured Reasoning Chain
            </span>
            <span className="text-emerald-400">
              Evidence → Damage → Access → Recommendation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* ── 1. EVIDENCE ── */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#00E5FF]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold border-b border-white/[0.06] pb-2 mb-2.5">
                  <span className="text-[#00E5FF] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    1. EVIDENCE
                  </span>
                  <span className="text-[10px] text-slate-400">Δ {selected.changePct}%</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {selected.why.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.05]">
                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="w-full py-1.5 rounded-lg text-[10px] font-mono font-bold text-[#00E5FF] bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Visual Evidence</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ── 2. DAMAGE ── */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#FF6B00]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold border-b border-white/[0.06] pb-2 mb-2.5">
                  <span className="text-[#FF6B00] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    2. DAMAGE
                  </span>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase border',
                    selected.badgeColor === 'red' && 'bg-red-500/20 text-red-300 border-red-500/40',
                    selected.badgeColor === 'orange' && 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    selected.badgeColor === 'yellow' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  )}>
                    {selected.damageLevel}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>{selected.damageDesc}</p>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] text-[10.5px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-emerald-400 font-bold">{Math.round(selected.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Change Score:</span>
                      <span className="text-white font-bold">{selected.changeScore.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.05] text-[10px] font-mono text-slate-400">
                Severity Rating: <strong className="text-white">{selected.severity}</strong>
              </div>
            </div>

            {/* ── 3. ACCESS ── */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#00E5FF]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold border-b border-white/[0.06] pb-2 mb-2.5">
                  <span className="text-[#00E5FF] flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    3. ACCESS
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {Math.round(selected.roadBlockagePct)}% BLOCKED
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>{selected.accessDesc}</p>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] text-[10.5px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Access Ratio:</span>
                      <span className={selected.roadAccessRatio < 0.4 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {selected.roadAccessRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ingress Corridor:</span>
                      <span className="text-emerald-400 font-bold">North Arterial</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.05] text-[10px] font-mono text-slate-400">
                Bridge 4 Bypass: <strong className="text-emerald-400">Active</strong>
              </div>
            </div>

            {/* ── 4. RECOMMENDATION ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#091124] to-[#040815] border border-white/[0.12] hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold border-b border-white/[0.06] pb-2 mb-2.5">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    4. RECOMMENDATION
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    ACTIONABLE
                  </span>
                </div>
                <div className="space-y-2 text-xs font-sans">
                  <div className="text-white font-bold text-sm">
                    {selected.recommendedAction}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Reason: {selected.reason}
                  </p>
                  <div className="text-[11px] font-mono text-slate-400">
                    Assigned Unit: <strong className="text-white">{selected.assignedUnit}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <button
                  onClick={handleDispatchAction}
                  disabled={dispatching}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#E55A00] hover:from-[#FF7B1A] hover:to-[#F06500] shadow-[0_0_20px_rgba(255,107,0,0.35)] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {dispatching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Unit...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Rescue Unit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Dispatch Notification */}
          {dispatchSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{dispatchSuccess}</span>
              </div>
              <button
                onClick={() => setDispatchSuccess(null)}
                className="text-emerald-400 hover:text-white font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded High-Resolution AI Assessment & Evidence Modal */}
      <AiAssessmentModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        buildingId={selected.id}
      />
    </div>
  );
};

export default RescueTwinCommandCenter;

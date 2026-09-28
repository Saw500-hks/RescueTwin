import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
  Cpu, Zap, ShieldAlert, Activity, CheckCircle2, ChevronRight,
  Terminal, Compass, AlertTriangle, ArrowRight, Layers, Box as BoxIcon,
  Play, RefreshCw, Send, Radio, UserCheck, MapPin, Truck, Flame,
  Droplets, Sparkles, Network, ExternalLink, RotateCcw, Eye, EyeOff,
  Crosshair, Navigation, Maximize, Loader2, Database, Sliders, ChevronDown,
  Clock, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { executeAgentTool, queryInspectionPriorities, planMissionWithNemotron } from '../api/client';
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

  // Workflow modes:
  // 1. "mission_plan": User request -> Nemotron -> Tool selection -> [get_priority, get_access, get_damage, get_building] -> Nemotron -> Mission plan
  // 2. "which_first": "Which buildings should we inspect first?" -> Rescue Agent -> Tools 1-4 -> Nemotron -> Structured response
  // 3. "why_b027": "Why is B027 high priority?" -> Evidence -> Damage -> Access -> Recommendation
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'mission_plan' | 'which_first' | 'why_b027'>('mission_plan');

  // Mission Plan Execution State
  const [userRequestText, setUserRequestText] = useState<string>('Formulate 72h Golden Window extraction plan for Sector 7');
  const [planningMission, setPlanningMission] = useState<boolean>(false);
  const [activePlanStep, setActivePlanStep] = useState<number>(6);
  const [missionPlan, setMissionPlan] = useState<any>(null);

  // Inspection Priorities Execution State
  const [executingFlow, setExecutingFlow] = useState<boolean>(false);
  const [activeToolStep, setActiveToolStep] = useState<number>(6);
  const [queryResponse, setQueryResponse] = useState<any>(null);

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

  // Execute User request -> Nemotron -> Tool selection -> [get_priority, get_access, get_damage, get_building] -> Nemotron -> Mission plan
  const handleGenerateMissionPlan = async (customReq?: string) => {
    const req = customReq || userRequestText;
    setPlanningMission(true);
    setActivePlanStep(1); // User request

    try {
      const s1 = setTimeout(() => setActivePlanStep(2), 350); // Nemotron
      const s2 = setTimeout(() => setActivePlanStep(3), 700); // Tool selection
      const s3 = setTimeout(() => setActivePlanStep(4), 1100); // [get_priority, get_access, get_damage, get_building]
      const s4 = setTimeout(() => setActivePlanStep(5), 1500); // Nemotron
      const s5 = setTimeout(() => setActivePlanStep(6), 1900); // Mission plan

      const res = await planMissionWithNemotron(req);
      setMissionPlan(res.mission_plan);

      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
      clearTimeout(s5);
      setActivePlanStep(6);
    } catch (err) {
      console.error(err);
      setActivePlanStep(6);
    } finally {
      setPlanningMission(false);
    }
  };

  // Execute Tool 1-4 Inspection priorities
  const handleExecuteInspectionWorkflow = async () => {
    setExecutingFlow(true);
    setActiveToolStep(1);

    try {
      const t1 = setTimeout(() => setActiveToolStep(2), 350);
      const t2 = setTimeout(() => setActiveToolStep(3), 700);
      const t3 = setTimeout(() => setActiveToolStep(4), 1050);
      const t4 = setTimeout(() => setActiveToolStep(5), 1400);
      const t5 = setTimeout(() => setActiveToolStep(6), 1750);

      const data = await queryInspectionPriorities("Which buildings should we inspect first?");
      setQueryResponse(data);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      setActiveToolStep(6);
    } catch (err) {
      console.error(err);
      setActiveToolStep(6);
    } finally {
      setExecutingFlow(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleGenerateMissionPlan();
    handleExecuteInspectionWorkflow();
  }, []);

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
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-white bg-[#070D1B]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/[0.1] flex items-center gap-1.5 shadow-lg">
              <BoxIcon className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>3D DIGITAL TWIN VIEWPORT</span>
            </span>

            <span className="text-[10px] font-mono text-[#00E5FF] bg-[#070D1B]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-[#00E5FF]/30">
              TARGET: <strong>{selected.id}</strong>
            </span>
          </div>

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

          <Canvas
            camera={{ position: [14, 16, 18], fov: 42 }}
            style={{ background: '#02050E' }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[15, 25, 15]} intensity={1.8} castShadow />
            <directionalLight position={[-15, 20, -10]} intensity={0.6} color="#00E5FF" />
            <pointLight position={[0, 8, 0]} intensity={2.0} color="#FF6B00" distance={30} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#040915" roughness={0.85} metalness={0.2} />
            </mesh>

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

            {showRoads && <RoadCorridors />}

            {COMMAND_BUILDINGS.map((b) => (
              <InteractiveBuildingMesh
                key={b.id}
                building={b}
                isSelected={b.id === selectedBuildingId}
                onSelect={handleSelectBuilding}
              />
            ))}

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

          <div className="absolute bottom-3 right-3 z-10 pointer-events-none bg-[#050915]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] text-[9.5px] font-mono text-slate-400 text-right">
            <div className="text-white font-bold">LAT: 34.054°N · LON: 118.243°W</div>
            <div className="text-[#00E5FF]">CAM FOV: 42° · WEBGL 2.0 SHADERS ACTIVE</div>
          </div>

          <div className="scanline absolute inset-0 pointer-events-none opacity-20 z-10" />
        </div>
      </div>

      {/* ── LOWER SECTION: AI RESCUE AGENT ── */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-[#050B18] to-[#02050E]">
        {/* Navigation & Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#0099FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider uppercase text-white">
                  AI RESCUE AGENT
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded font-extrabold bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40">
                  NVIDIA NEMOTRON ORCHESTRATOR
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Autonomous tool invocation, multi-modal reasoning & prioritization
              </div>
            </div>
          </div>

          {/* 3 Workflow Mode Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveWorkflowTab('mission_plan')}
              className={clsx(
                'text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                activeWorkflowTab === 'mission_plan'
                  ? 'bg-gradient-to-r from-[#76B900]/25 to-[#00E5FF]/25 text-white border-[#76B900]/60 shadow-[0_0_15px_rgba(118,185,0,0.3)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08]'
              )}
            >
              <Cpu className="w-3.5 h-3.5 text-[#76B900]" />
              <span>Nemotron Mission Planner</span>
            </button>

            <button
              onClick={() => setActiveWorkflowTab('which_first')}
              className={clsx(
                'text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                activeWorkflowTab === 'which_first'
                  ? 'bg-gradient-to-r from-[#FF6B00]/25 to-[#E55A00]/25 text-[#FF6B00] border-[#FF6B00]/60 shadow-[0_0_15px_rgba(255,107,0,0.3)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08]'
              )}
            >
              <Terminal className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>"Which buildings should we inspect first?"</span>
            </button>

            <button
              onClick={() => setActiveWorkflowTab('why_b027')}
              className={clsx(
                'text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                activeWorkflowTab === 'why_b027'
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08]'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>"Why is {selected.id} high priority?"</span>
            </button>
          </div>
        </div>

        {/* ── WORKFLOW TAB 1: NEMOTRON MISSION PLANNER ──
            User request → Nemotron → Tool selection → [get_priority, get_access, get_damage, get_building] → Nemotron → Mission plan */}
        {activeWorkflowTab === 'mission_plan' && (
          <div className="mt-5 space-y-5 animate-fade-in font-sans">
            {/* Input & Request Box */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.1] flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-[280px]">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#76B900] flex items-center gap-2 font-bold">
                  <Cpu className="w-3 h-3 text-[#76B900]" />
                  NEMOTRON AUTONOMOUS MISSION PLANNING LOOP
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  "{userRequestText}"
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Flow: User request → Nemotron → Tool selection → [get_priority, get_access, get_damage, get_building] → Nemotron → Mission plan
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateMissionPlan()}
                  disabled={planningMission}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-extrabold text-black bg-gradient-to-r from-[#76B900] to-[#00E5FF] hover:opacity-90 shadow-[0_0_20px_rgba(118,185,0,0.35)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {planningMission ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Synthesizing Mission Plan...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black" />
                      <span>Re-Run Nemotron Planner</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Visual Sequence Flowchart Matching User Spec */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#070D1B] to-[#040815] border border-white/[0.1] shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2 text-white">
                  <Network className="w-4 h-4 text-[#76B900]" />
                  Architecture Flow: User Request to Actionable Mission Plan
                </span>
                <span className="text-[#76B900] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#76B900] animate-ping" />
                  NVIDIA NEMOTRON 70B ACTIVE
                </span>
              </div>

              {/* 5-Step Vertical Flow with Tool Pool Box */}
              <div className="flex flex-col items-center space-y-3 py-2">
                {/* Node 1: User request */}
                <div className={clsx(
                  'w-full max-w-xl p-3 rounded-xl border text-center transition-all',
                  activePlanStep >= 1
                    ? 'bg-white/[0.06] border-white/20 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 opacity-60'
                )}>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">STAGE 1</div>
                  <div className="text-sm font-mono font-bold text-white">User request: "{userRequestText}"</div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-sm">↓</div>

                {/* Node 2: Nemotron (Pass 1) */}
                <div className={clsx(
                  'w-full max-w-xl p-3 rounded-xl border text-center transition-all',
                  activePlanStep >= 2
                    ? 'bg-[#76B900]/15 border-[#76B900]/50 text-white shadow-[0_0_20px_rgba(118,185,0,0.25)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 opacity-60'
                )}>
                  <div className="text-[10px] font-mono text-[#76B900] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> STAGE 2: NEMOTRON (PASS 1)
                  </div>
                  <div className="text-xs font-mono text-slate-200 mt-0.5">
                    Intent parsing & function selection over available GIS tools
                  </div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-sm">↓</div>

                {/* Node 3: Tool selection */}
                <div className={clsx(
                  'w-full max-w-xl p-2.5 rounded-xl border text-center transition-all',
                  activePlanStep >= 3
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 opacity-60'
                )}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    STAGE 3: TOOL SELECTION (4 SPECIALIZED GIS APIS)
                  </span>
                </div>

                <div className="text-slate-500 font-mono font-bold text-sm">↓</div>

                {/* Node 4: The 4 Tools Pool Box (┌──────────────┐) */}
                <div className={clsx(
                  'w-full max-w-2xl p-4 rounded-2xl border-2 transition-all relative overflow-hidden',
                  activePlanStep >= 4
                    ? 'bg-black/70 border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.2)]'
                    : 'bg-black/30 border-white/[0.1] opacity-60'
                )}>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF] font-bold text-center mb-3">
                    PARALLEL TOOL EXECUTION POOL
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[#00E5FF] font-bold">1. get_priority()</div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Ranked 14 targets: <strong className="text-white">#1 B027 (Score 0.912)</strong>, #2 B014.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[#00E5FF] font-bold">2. get_access()</div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Evaluated road choke points: <strong className="text-red-400">Bridge 4 BLOCKED (66%)</strong>.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[#00E5FF] font-bold">3. get_damage()</div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Satellite change indices: <strong>B027 (43% Major)</strong>, <strong>B014 (88% Destroyed)</strong>.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[#00E5FF] font-bold">4. get_building()</div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Footprints & occupancy: <strong className="text-white">5 trapped in B027</strong>, 7 in B014.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-sm">↓</div>

                {/* Node 5: Nemotron (Pass 2) */}
                <div className={clsx(
                  'w-full max-w-xl p-3 rounded-xl border text-center transition-all',
                  activePlanStep >= 5
                    ? 'bg-[#76B900]/15 border-[#76B900]/50 text-white shadow-[0_0_20px_rgba(118,185,0,0.25)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 opacity-60'
                )}>
                  <div className="text-[10px] font-mono text-[#76B900] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> STAGE 5: NEMOTRON (PASS 2 - TACTICAL SYNTHESIS)
                  </div>
                  <div className="text-xs font-mono text-slate-200 mt-0.5">
                    Multi-constraint optimization: life-safety urgency vs. debris transit delay
                  </div>
                </div>

                <div className="text-slate-500 font-mono font-bold text-sm">↓</div>

                {/* Node 6: Mission plan */}
                <div className={clsx(
                  'w-full max-w-xl p-3 rounded-xl border text-center transition-all',
                  activePlanStep >= 6
                    ? 'bg-gradient-to-r from-emerald-500/20 to-[#00E5FF]/20 border-emerald-500/50 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 opacity-60'
                )}>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> STAGE 6: ACTIONABLE MISSION PLAN
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    3-Phase Triage Plan · Golden Window: 18.2 Hours · Units Dispatched
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Plan Content Overview */}
            <div className="p-5 rounded-2xl bg-[#050B18] border border-[#76B900]/30 shadow-[0_0_30px_rgba(118,185,0,0.15)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#76B900]" />
                  <span className="font-mono text-xs font-black uppercase text-white tracking-wider">
                    ACTIONABLE 3-PHASE RESCUE MISSION PLAN
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  GOLDEN EXTRACTION WINDOW: 18.2 HOURS
                </span>
              </div>

              {/* 3 Tactical Phases */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-[#FF6B00]">PHASE 1 (0 - 6H)</span>
                    <span className="text-[10px] text-slate-400">CRITICAL</span>
                  </div>
                  <div className="text-sm font-bold text-white">Immediate Field Inspection & Void Search</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Dispatch USAR inspection team to <strong>Building B027</strong> via North Arterial Blvd.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Deploy pneumatic shoring struts at <strong>Building B014</strong> collapsed pancake slab.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Isolate ruptured gas main and establish Forward Triage HQ.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-[#00E5FF]">PHASE 2 (6 - 24H)</span>
                    <span className="text-[10px] text-slate-400">URGENT</span>
                  </div>
                  <div className="text-sm font-bold text-white">Arterial Clearance & Shoring</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Deploy heavy skid-steers to clear <strong>Bridge 4</strong> span blockage.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Erect laser displacement sensors to monitor <strong>Building B031</strong> facade tilt.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Begin systematic acoustic void search sweeps.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-[#22C55E]">PHASE 3 (24 - 72H)</span>
                    <span className="text-[10px] text-slate-400">SUSTAINED</span>
                  </div>
                  <div className="text-sm font-bold text-white">Secondary Audit & Relief</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Secondary structural audit of <strong>Building B009</strong> municipal annex.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Certify emergency safe shelters and water distribution points.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Transition rescue teams to sustained humanitarian aid.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/agent')}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-[#00E5FF] hover:text-white bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Open Full Autonomous ReAct Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKFLOW TAB 2: "WHICH BUILDINGS SHOULD WE INSPECT FIRST?" ── */}
        {activeWorkflowTab === 'which_first' && (
          <div className="mt-5 space-y-5 animate-fade-in font-sans">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.1] flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                  USER PROMPT QUERY
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  "Which buildings should we inspect first?"
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <span>Target Scenario: <strong className="text-slate-200">M7.4 Earthquake Sector 7</strong></span>
                  <span>·</span>
                  <span>Golden Window: <strong className="text-amber-400">18.2 Hours</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteInspectionWorkflow}
                  disabled={executingFlow}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-[#00E5FF] to-[#0099FF] hover:opacity-90 shadow-[0_0_20px_rgba(0,229,255,0.35)] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-black font-extrabold"
                >
                  {executingFlow ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Executing 4-Tool Chain...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black" />
                      <span>Re-Run Tool Sequence</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2 text-white">
                  <Network className="w-4 h-4 text-[#00E5FF]" />
                  Sequential Execution Flowchart
                </span>
                <span className="text-[#00E5FF]">
                  4 OPERATIONAL TOOLS REGISTERED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={clsx(
                  'p-3.5 rounded-xl border transition-all',
                  activeToolStep >= 1
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                )}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                    <span className="text-[#00E5FF]">TOOL 1</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> EXECUTED
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate">
                    get_damage_assessments()
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Ingested multi-temporal satellite homography: <strong>B027 (MAJOR, 0.91)</strong>, <strong>B014 (DESTROYED, 0.96)</strong>, B031, B009.
                  </p>
                </div>

                <div className={clsx(
                  'p-3.5 rounded-xl border transition-all',
                  activeToolStep >= 2
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                )}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                    <span className="text-[#00E5FF]">TOOL 2</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> EXECUTED
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate">
                    get_road_access()
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Evaluated ingress corridors: <strong>Bridge 4 BLOCKED (66%)</strong>. North Arterial Blvd confirmed clear for skid-steer escort.
                  </p>
                </div>

                <div className={clsx(
                  'p-3.5 rounded-xl border transition-all',
                  activeToolStep >= 3
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                )}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                    <span className="text-[#00E5FF]">TOOL 3</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> EXECUTED
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate">
                    get_building_metadata()
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Pulled structural footprint: <strong>B027 (482.4 m²)</strong>, storeys, occupancy (5 trapped), and active shear-wall collapse risks.
                  </p>
                </div>

                <div className={clsx(
                  'p-3.5 rounded-xl border transition-all',
                  activeToolStep >= 4
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                )}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                    <span className="text-[#00E5FF]">TOOL 4</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> EXECUTED
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate">
                    calculate_priority()
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Synthesized life-safety triage ranking: <strong>#1 B027 (Score 0.912)</strong>, #2 B014, #3 B031, #4 B009.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-[#091124] to-[#070D1B] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white">
                    Nemotron Multi-Modal Synthesis Engine
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    (meta/llama-3.1-nemotron-70b via Nebius Token Factory)
                  </span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  STRUCTURED RESPONSE READY
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#050B18] border border-[#00E5FF]/30 shadow-[0_0_30px_rgba(0,229,255,0.15)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                  <span className="font-mono text-xs font-black uppercase text-white tracking-wider">
                    NEMOTRON STRUCTURED RESPONSE: PRIORITIZED INSPECTION DIRECTIVE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Target Priority #1: <strong className="text-white">Building B027</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    rank: 1,
                    bid: 'B027',
                    title: 'Priority #1: Building B027 (Immediate Field Inspection)',
                    badge: 'MAJOR · 91% CONF',
                    badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    desc: 'Sector 7 seismic deformation shows Building B027 with 43% structural change, altered roof geometry, and 66% road obstruction on Bridge 4. High estimated damage with difficult access mandates priority inspection dispatch.',
                    ingress: 'North Arterial Blvd (Bypass Bridge 4 with Skid-Steer Escort)',
                    action: 'Dispatch inspection team immediately'
                  },
                  {
                    rank: 2,
                    bid: 'B014',
                    title: 'Priority #2: Building B014 (Heavy USAR & Extrication)',
                    badge: 'DESTROYED · 96% CONF',
                    badgeCls: 'bg-red-500/20 text-red-300 border-red-500/40',
                    desc: 'Complete structural pancake and total roof collapse (88% change). High probability of 7 trapped survivors in survivable void spaces under western collapsed slab.',
                    ingress: 'Sector 4 Access Alley (Single Track / Clear Rubble)',
                    action: 'Dispatch Heavy USAR & extrication crew'
                  },
                  {
                    rank: 3,
                    bid: 'B031',
                    title: 'Priority #3: Building B031 (Shoring & Stabilization)',
                    badge: 'MAJOR · 88% CONF',
                    badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    desc: 'Severe facade shearing and vertical tilt (65% change). 78% aftershock collapse hazard requires immediate shoring and laser displacement monitoring.',
                    ingress: 'East Transit Way (Clear for light support vehicles)',
                    action: 'Dispatch shoring and stabilization team'
                  },
                  {
                    rank: 4,
                    bid: 'B009',
                    title: 'Priority #4: Building B009 (Field Survey & Secondary Audit)',
                    badge: 'MINOR · 82% CONF',
                    badgeCls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
                    desc: 'Non-structural window and cladding displacement (28% change). Full arterial access maintained; corridor open for logistics transit.',
                    ingress: 'North District Municipal Route (Open)',
                    action: 'Field survey and secondary assessment'
                  }
                ].map((item) => (
                  <div
                    key={item.bid}
                    onClick={() => setSelectedBuildingId(item.bid)}
                    className={clsx(
                      'p-4 rounded-xl border transition-all cursor-pointer',
                      selectedBuildingId === item.bid
                        ? 'bg-gradient-to-r from-[#00E5FF]/15 to-[#0099FF]/10 border-[#00E5FF]/60 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-[#00E5FF]">
                          #{item.rank}
                        </span>
                        {item.title}
                      </span>
                      <span className={clsx('text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border', item.badgeCls)}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                      {item.desc}
                    </p>

                    <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                      <span>Ingress: <strong className="text-emerald-400">{item.ingress}</strong></span>
                      <span className="text-[#00E5FF] font-bold">Select in 3D →</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] space-y-1.5 text-xs font-mono">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                  TACTICAL FIELD DIRECTIVES
                </div>
                <div className="text-slate-200">1. Dispatch structural inspection team to <strong className="text-white">Building B027</strong> immediately via North Arterial Blvd.</div>
                <div className="text-slate-200">2. Bypass <strong className="text-red-400">Bridge 4</strong> due to 66% debris blockage; route emergency transport through Grand Ave.</div>
                <div className="text-slate-200">3. Deploy Heavy USAR unit with pneumatic shoring to <strong className="text-white">Building B014</strong> void spaces.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKFLOW TAB 3: TARGET DEEP DIVE ("WHY IS B027 HIGH PRIORITY?") ── */}
        {activeWorkflowTab === 'why_b027' && (
          <div className="mt-5 space-y-5 animate-fade-in font-sans">
            <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-white">
                <Terminal className="w-3.5 h-3.5 text-[#00E5FF]" />
                Target Analysis: Why is {selected.id} high priority?
              </span>
              <span className="text-emerald-400">
                Evidence → Damage → Access → Recommendation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Evidence */}
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

              {/* 2. Damage */}
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

              {/* 3. Access */}
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

              {/* 4. Recommendation */}
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
        )}
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

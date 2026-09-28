/**
 * DigitalTwin Component — 3D Building Intelligence Viewer
 *
 * Wraps the Three.js/React-Three-Fiber 3D viewer with proper
 * data integrity labeling. The 3D view shows DEMO DATA buildings
 * from the evidence store (scenario_earthquake_74).
 *
 * To view real buildings: upload pre/post imagery through the
 * Analysis pipeline to generate real building footprints.
 */
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import {
  Box as BoxIcon, RotateCcw, Info, Eye, Layers, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import EvidencePanel, { EvidenceItem } from '../EvidencePanel';

// Re-export damage colors for consistency
export const DAMAGE_COLORS: Record<string, string> = {
  NO_DAMAGE: '#22C55E',
  MINOR: '#EAB308',
  MAJOR: '#FF6B00',
  DESTROYED: '#EF4444',
  UNKNOWN: '#94A3B8',
};

export interface Building3D {
  id: string;
  name: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  damage: keyof typeof DAMAGE_COLORS;
  confidence?: number | null;
  area?: string;
  floors?: number;
  dataStatus?: string;
  evidence?: EvidenceItem[];
  assessmentConclusion?: string;
}

const BuildingMesh: React.FC<{
  building: Building3D;
  isSelected: boolean;
  onSelect: (b: Building3D | null) => void;
}> = ({ building, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const color = DAMAGE_COLORS[building.damage] ?? '#94A3B8';

  return (
    <group position={building.position} rotation={building.rotation}>
      {/* Outer glow when selected */}
      {isSelected && (
        <Box
          args={[
            building.scale[0] + 0.4,
            building.scale[1] + 0.4,
            building.scale[2] + 0.4,
          ]}
        >
          <meshBasicMaterial color={color} transparent opacity={0.06} wireframe />
        </Box>
      )}
      {/* Main building mesh */}
      <Box
        args={building.scale}
        onClick={() => onSelect(isSelected ? null : building)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered ? 0.9 : 0.75}
          roughness={0.3}
          metalness={0.2}
        />
      </Box>
    </group>
  );
};

const DigitalTwin: React.FC<{
  buildings?: Building3D[];
  dataStatus?: string;
  className?: string;
}> = ({
  buildings = [],
  dataStatus = 'DEMO DATA',
  className,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<Building3D | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const dataStatusColors: Record<string, string> = {
    'DEMO DATA': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    'MODEL OUTPUT': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'UNAVAILABLE': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    'SIMULATION': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    'VERIFIED DATA': 'bg-green-500/15 text-green-400 border-green-500/25',
  };

  return (
    <div className={clsx('flex h-full relative', className)}>
      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 10, 20], fov: 55 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.0} />
          <pointLight position={[-10, 10, -10]} intensity={0.3} color="#00E5FF" />

          {showGrid && <Grid infiniteGrid fadeDistance={80} fadeStrength={4} cellColor="#1e3a5f" sectionColor="#0f2a4a" />}

          {buildings.map((b) => (
            <BuildingMesh
              key={b.id}
              building={b}
              isSelected={selectedBuilding?.id === b.id}
              onSelect={setSelectedBuilding}
            />
          ))}

          <OrbitControls makeDefault dampingFactor={0.06} enableZoom rotateSpeed={0.6} />
        </Canvas>

        {/* Data Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', dataStatusColors[dataStatus] || dataStatusColors['UNAVAILABLE'])}>
            {dataStatus}
          </span>
          {dataStatus === 'DEMO DATA' && (
            <span className="text-[9px] text-slate-500">Scenario earthquake_74 simulation</span>
          )}
        </div>

        {/* Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={clsx(
              'p-1.5 rounded-lg border text-[10px] transition-all',
              showGrid ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-black/50 border-white/10 text-slate-500 backdrop-blur'
            )}
          >
            <Layers className="w-3 h-3" />
          </button>
          {selectedBuilding && (
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={clsx(
                'p-1.5 rounded-lg border text-[10px] transition-all',
                showEvidence ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-black/50 border-white/10 text-slate-400 backdrop-blur'
              )}
            >
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Damage Legend */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 p-2 rounded-lg backdrop-blur"
          style={{ background: 'rgba(5,10,20,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {Object.entries(DAMAGE_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[9.5px] text-slate-400 capitalize">{level.replace('_', ' ')}</span>
            </div>
          ))}
        </div>

        {/* No buildings message */}
        {buildings.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <BoxIcon className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-sm text-slate-500 font-medium mb-1">No Buildings Loaded</p>
            <p className="text-[11px] text-slate-600 max-w-xs">
              Upload pre and post-event imagery through the Analysis page to generate real building footprints,
              or view the demo scenario in the 3D Twin page.
            </p>
          </div>
        )}
      </div>

      {/* Selected Building + Evidence Panel */}
      {selectedBuilding && showEvidence && (
        <aside className="w-[280px] flex-shrink-0 border-l border-white/[0.07] overflow-hidden"
          style={{ background: 'rgba(5,10,20,0.97)' }}>
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-xs font-bold text-slate-200">{selectedBuilding.name}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedBuilding.id}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                style={{
                  background: `${DAMAGE_COLORS[selectedBuilding.damage]}15`,
                  color: DAMAGE_COLORS[selectedBuilding.damage],
                  borderColor: `${DAMAGE_COLORS[selectedBuilding.damage]}35`,
                }}
              >
                {selectedBuilding.damage.replace('_', ' ')}
              </span>
              {selectedBuilding.confidence != null && (
                <span className="text-[9px] text-slate-400">
                  {(selectedBuilding.confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
            <EvidencePanel
              buildingId={selectedBuilding.id}
              buildingName={selectedBuilding.name}
              items={selectedBuilding.evidence}
              assessmentConclusion={selectedBuilding.assessmentConclusion}
              conclusionDataStatus={selectedBuilding.dataStatus}
            />
          </div>
        </aside>
      )}
    </div>
  );
};

export default DigitalTwin;

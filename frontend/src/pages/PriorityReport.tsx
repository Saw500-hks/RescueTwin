import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Navigation, ShieldAlert, CheckCircle2, AlertTriangle,
  MapPin, Clock, Users, ChevronDown, ChevronUp, Satellite,
  Check, Share2, Box, Radio, AlertOctagon, HeartHandshake,
  Truck, ArrowRight, Zap, Crosshair
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';

interface PriorityItem {
  id: string;
  rank: number;
  score: number;
  level: 'DESTROYED' | 'MAJOR' | 'MINOR' | 'NO_DAMAGE';
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  access: boolean;
  priorityReason: string;
  notes: string;
  coords: string;
  estimatedOccupancy: string;
  responseTime: string;
  color: string;
  recommendedUnits: string;
}

const priorities: PriorityItem[] = [
  {
    id: 'Building B-027',
    rank: 1,
    score: 96,
    level: 'MAJOR',
    tier: 'HIGH',
    access: false,
    priorityReason: 'High estimated structural damage + difficult access. Evidence: 43% structural change, roof geometry changed, visible facade damage, nearby road partially blocked.',
    notes: 'Recommended action: Dispatch inspection team. 43% structural deformation detected via CV/3D analysis. Confidence: 0.91.',
    coords: '34.054°N, 118.243°W',
    estimatedOccupancy: '~5',
    responseTime: '8 min',
    color: '#FF6B00',
    recommendedUnits: '1x Structural Inspection Team + 1x Debris Clearance Unit',
  },
  {
    id: 'BLD-901',
    rank: 2,
    score: 98,
    level: 'DESTROYED',
    tier: 'HIGH',
    access: true,
    priorityReason: 'Complete multistory pancake collapse with ~15 trapped civilian occupants. Structural voids identified for immediate extrication.',
    notes: 'Primary ingress clear for heavy rescue crane access via Western Corridor. High seismic aftershock vulnerability.',
    coords: '34.052°N, 118.244°W',
    estimatedOccupancy: '~15',
    responseTime: '6 min',
    color: '#EF4444',
    recommendedUnits: '2x USAR Heavy Squads + 1x Trauma Ambulance',
  },
  {
    id: 'BLD-842',
    rank: 2,
    score: 95,
    level: 'DESTROYED',
    tier: 'HIGH',
    access: false,
    priorityReason: 'Total structural collapse with 22 occupants reported. ACCESS BLOCKED: Debris blockage at primary intersection.',
    notes: 'Requires front-end loader or bulldozer team for road clearance before ambulance transport is feasible.',
    coords: '34.059°N, 118.252°W',
    estimatedOccupancy: '~22',
    responseTime: '18 min',
    color: '#EF4444',
    recommendedUnits: '1x Earthmoving Team + 2x Search Teams',
  },
  {
    id: 'BLD-331',
    rank: 3,
    score: 87,
    level: 'MAJOR',
    tier: 'HIGH',
    access: true,
    priorityReason: 'Major roof & upper-tier floor failure. Imminent risk of secondary collapse onto neighboring residential structures.',
    notes: 'Emergency shoring and temporary supports required immediately before search operations inside lower ground floor.',
    coords: '34.063°N, 118.242°W',
    estimatedOccupancy: '~8',
    responseTime: '11 min',
    color: '#FF6B00',
    recommendedUnits: '1x Structural Shoring Unit + 4x Medics',
  },
  {
    id: 'BLD-442',
    rank: 4,
    score: 79,
    level: 'MAJOR',
    tier: 'MEDIUM',
    access: true,
    priorityReason: 'Heavy shear wall cracking on east elevation. Gas line severed in basement.',
    notes: 'Hazmat isolation zone declared. Evacuate 50m perimeter until gas shutoff is confirmed.',
    coords: '34.058°N, 118.250°W',
    estimatedOccupancy: '~8',
    responseTime: '14 min',
    color: '#FF6B00',
    recommendedUnits: '1x Hazmat Squad + 1x Fire Engine',
  },
  {
    id: 'BLD-733',
    rank: 5,
    score: 72,
    level: 'MAJOR',
    tier: 'MEDIUM',
    access: true,
    priorityReason: 'Stairwell column damage restricting egress for remaining 5 occupants on upper floors.',
    notes: 'Aerial ladder truck required for external window-based occupant evacuation.',
    coords: '34.061°N, 118.240°W',
    estimatedOccupancy: '~5',
    responseTime: '16 min',
    color: '#FF6B00',
    recommendedUnits: '1x Aerial Platform Ladder + 2x Medics',
  },
  {
    id: 'BLD-112',
    rank: 6,
    score: 48,
    level: 'MINOR',
    tier: 'LOW',
    access: true,
    priorityReason: 'Minor facade spalling and glass breakage. Structure remains habitably sound.',
    notes: 'Perform secondary welfare check once critical red-tier sectors are resolved.',
    coords: '34.047°N, 118.255°W',
    estimatedOccupancy: '~12',
    responseTime: '35 min',
    color: '#EAB308',
    recommendedUnits: '1x Community Support Officer',
  },
  {
    id: 'BLD-289',
    rank: 7,
    score: 36,
    level: 'MINOR',
    tier: 'LOW',
    access: true,
    priorityReason: 'Non-structural masonry cracks. Utility power disrupted.',
    notes: 'Advise occupants to shelter in place until grid stabilization.',
    coords: '34.055°N, 118.248°W',
    estimatedOccupancy: '~10',
    responseTime: '45 min',
    color: '#22C55E',
    recommendedUnits: 'Utility Restoration Crew',
  },
];

const pieData = [
  { name: 'High Priority (Urgent)', value: 12, color: '#EF4444' },
  { name: 'Medium Priority', value: 45, color: '#FF6B00' },
  { name: 'Low Priority (Standard)', value: 89, color: '#EAB308' },
  { name: 'Safe / Intact', value: 240, color: '#22C55E' },
];

const badgeCls: Record<string, string> = {
  DESTROYED: 'badge-red',
  MAJOR: 'badge-orange',
  MINOR: 'badge-yellow',
  NO_DAMAGE: 'badge-green',
};

const CustomPieTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#070B16]/95 border border-[#00E5FF]/30 backdrop-blur-md rounded-xl p-3 shadow-xl">
      <div className="text-[10px] font-mono text-[#8A99AD] mb-1">{payload[0].name}</div>
      <div className="text-xl font-extrabold font-mono" style={{ color: payload[0].payload.color }}>
        {payload[0].value} <span className="text-xs text-[#8A99AD] font-normal">sites</span>
      </div>
    </div>
  );
};

const PriorityCard = ({
  item,
  expanded,
  onToggle,
  onNavigateMap,
}: {
  item: PriorityItem;
  expanded: boolean;
  onToggle: () => void;
  onNavigateMap: () => void;
}) => (
  <div
    className="hud-card overflow-hidden transition-all duration-300"
    style={{
      borderColor: expanded ? `${item.color}70` : 'rgba(255,255,255,0.08)',
      boxShadow: expanded ? `0 0 30px ${item.color}20` : 'none',
    }}
  >
    {/* Header Line */}
    <div
      onClick={onToggle}
      className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-start md:items-center gap-4">
        {/* Priority Rank Circle */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black font-mono flex-shrink-0"
          style={{
            background: `${item.color}20`,
            border: `2px solid ${item.color}70`,
            color: item.color,
            boxShadow: `0 0 16px ${item.color}35`,
          }}
        >
          #{item.rank}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-white font-mono">{item.id}</span>
            <span className={clsx(badgeCls[item.level], 'text-[10px] font-mono font-bold')}>
              {item.level.replace('_', ' ')}
            </span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                background: item.tier === 'HIGH' ? 'rgba(239,68,68,0.15)' : item.tier === 'MEDIUM' ? 'rgba(255,107,0,0.15)' : 'rgba(34,197,94,0.15)',
                borderColor: item.tier === 'HIGH' ? 'rgba(239,68,68,0.4)' : item.tier === 'MEDIUM' ? 'rgba(255,107,0,0.4)' : 'rgba(34,197,94,0.4)',
                color: item.color,
              }}
            >
              {item.tier} PRIORITY
            </span>
            {!item.access && (
              <span className="badge-red text-[10px] flex items-center gap-1 font-bold">
                <AlertOctagon className="w-3 h-3" /> ROAD BLOCKED
              </span>
            )}
          </div>

          {/* Prominent Primary Reason for Prioritization */}
          <p className="text-xs md:text-sm text-white font-medium line-clamp-2">
            <span className="text-[#00E5FF] font-mono font-bold">REASON: </span>
            {item.priorityReason}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
        <div className="text-left md:text-right">
          <div className="text-2xl font-black font-mono leading-none" style={{ color: item.color }}>
            {item.score}<span className="text-xs text-[#8A99AD] font-normal">/100</span>
          </div>
          <div className="text-[9px] uppercase tracking-wider font-mono text-[#6B7280] mt-0.5">
            Severity Index
          </div>
        </div>

        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-[#8A99AD]">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </div>

    {/* Expanded Action Telemetry */}
    {expanded && (
      <div className="px-5 pb-5 pt-2 border-t border-white/[0.08] bg-[#070B16]/60 space-y-4 animate-fade-in-up">
        {/* Severity Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-[#8A99AD]">AI RESCUE URGENCY METRIC</span>
            <span className="font-bold" style={{ color: item.color }}>{item.score}% CRITICAL</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${item.score}%`,
                background: `linear-gradient(90deg, ${item.color}, #00E5FF)`,
                boxShadow: `0 0 12px ${item.color}80`,
              }}
            />
          </div>
        </div>

        {/* Telemetry Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MapPin, label: 'Coordinates', val: item.coords, color: '#00E5FF' },
            { icon: Clock, label: 'Response Target', val: item.responseTime, color: '#FF6B00' },
            { icon: Users, label: 'Est. Occupants', val: `${item.estimatedOccupancy} Trapped`, color: '#EF4444' },
            { icon: item.access ? CheckCircle2 : AlertOctagon, label: 'Vehicle Ingress', val: item.access ? 'Route Clear' : 'Debris Blockage', color: item.access ? '#22C55E' : '#EF4444' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Icon className="w-4 h-4 mb-1" style={{ color }} />
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#6B7280]">{label}</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">{val}</div>
            </div>
          ))}
        </div>

        {/* Recommended Rescue Task Force */}
        <div className="p-3.5 rounded-xl bg-[#00E5FF]/08 border border-[#00E5FF]/25 flex items-start gap-3">
          <Truck className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#00E5FF] font-bold">
              Dispatch Recommendation:
            </div>
            <div className="text-xs text-white font-semibold mt-0.5">{item.recommendedUnits}</div>
          </div>
        </div>

        {/* Field Tactical Notes */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#A0AEC0]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold block mb-1">
            Tactical Situation Summary:
          </span>
          {item.notes}
        </div>

        {/* Mission Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onNavigateMap}
            className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            <Navigation className="w-4 h-4" />
            <span>Target on 3D Digital Twin</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Tactical Dossier</span>
          </button>
        </div>
      </div>
    )}
  </div>
);

const PriorityReport = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string>('BLD-901');
  const [copied, setCopied] = useState(false);
  const [activeTier, setActiveTier] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredPriorities = priorities.filter(
    p => activeTier === 'ALL' || p.tier === activeTier
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Operational Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-red flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3 h-3 text-[#EF4444]" />
              COMMAND PRIORITY DIRECTIVE
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">SECTOR-ALPHA // ACTIVE DISASTER MISSION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Rescue Prioritization Report
          </h1>
          <p className="text-xs md:text-sm text-[#8A99AD] mt-1">
            Automated ranking of collapsed and compromised structures derived from occupancy heuristics, damage severity, and access road status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="btn-secondary flex items-center gap-2 text-xs md:text-sm py-2.5 px-4 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Share2 className="w-4 h-4 text-[#00E5FF]" />}
            <span>{copied ? 'Link Copied!' : 'Share Dossier'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-xs md:text-sm py-2.5 px-4 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Action Plan</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      <div
        className="p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(255,107,0,0.06) 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 30px rgba(239,68,68,0.1)',
        }}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#EF4444] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-[#EF4444]">IMMEDIATE RED-TIER DISPATCH REQUIRED</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                2 SITES ACTIVE
              </span>
            </h3>
            <p className="text-xs text-[#D1D5DB] mt-1 max-w-3xl">
              Structures <span className="text-[#EF4444] font-bold font-mono">BLD-901</span> and <span className="text-[#EF4444] font-bold font-mono">BLD-842</span> have suffered catastrophic pancake collapses with an estimated <strong className="text-white font-mono">37 civilian occupants trapped</strong>. Allocate heavy search & rescue teams immediately.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/viewer')}
          className="btn-primary text-xs font-bold py-2.5 px-4 flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center cursor-pointer"
        >
          <Box className="w-4 h-4" />
          <span>Inspect 3D Twin</span>
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Categorized Priority List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Priority Tier Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#00E5FF]" />
              <h2 className="text-sm font-bold text-white">Actionable Structures ({filteredPriorities.length})</h2>
            </div>

            <div className="flex gap-1.5 bg-[#090F1F] p-1 rounded-xl border border-white/[0.08]">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={clsx(
                    'text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTier === tier
                      ? 'bg-[#00E5FF] text-[#050811] shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                      : 'text-[#8A99AD] hover:text-white'
                  )}
                >
                  {tier} PRIORITY
                </button>
              ))}
            </div>
          </div>

          {/* Priority Cards */}
          <div className="space-y-3">
            {filteredPriorities.map(item => (
              <PriorityCard
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(prev => prev === item.id ? '' : item.id)}
                onNavigateMap={() => navigate('/viewer')}
              />
            ))}
          </div>
        </div>

        {/* Right Col: Radar Heatmap & Allocation Summary */}
        <div className="space-y-5">
          {/* Donut Chart: Priority Distribution */}
          <div className="hud-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08] bg-[#090F1F]/60">
              <h3 className="text-sm font-bold text-white">Priority Distribution</h3>
              <p className="text-[11px] text-[#8A99AD] mt-0.5">386 assessed buildings in sector</p>
            </div>

            <div className="p-5">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-3 pt-3 border-t border-white/[0.08]">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[#A0AEC0]">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector Heatmap Radar */}
          <div className="hud-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08] bg-[#090F1F]/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Sector Radar Heatmap</h3>
                <p className="text-[11px] text-[#8A99AD] mt-0.5">High-risk epicenter overlays</p>
              </div>
              <span className="text-[10px] font-mono text-[#00E5FF] px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30">
                LIVE SWEEP
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.1] bg-[#070B16]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,229,255,0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,229,255,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '22px 22px',
                }}
              >
                {/* 4x4 Sector Grid */}
                <div className="grid grid-cols-4 grid-rows-4 w-full h-full">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const isHot = i === 5 || i === 6;
                    const isWarm = i === 9 || i === 10;
                    return (
                      <div
                        key={i}
                        className="relative border border-white/[0.05] flex items-center justify-center"
                      >
                        {isHot && <div className="absolute inset-0 bg-[#EF4444] opacity-25 animate-pulse" />}
                        {isWarm && <div className="absolute inset-0 bg-[#FF6B00] opacity-15" />}
                        <span className="text-[8px] font-mono text-[#6B7280]">S{i + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Pulsing Hotspot Markers */}
                <div
                  className="absolute top-[34%] left-[38%] w-4 h-4 rounded-full bg-[#EF4444] pulse-dot cursor-pointer"
                  style={{ boxShadow: '0 0 16px rgba(239,68,68,0.9)' }}
                  title="Epicenter BLD-901"
                />
                <div
                  className="absolute top-[38%] left-[54%] w-3 h-3 rounded-full bg-[#EF4444]"
                  style={{ boxShadow: '0 0 10px rgba(239,68,68,0.8)' }}
                  title="Epicenter BLD-842"
                />
                <div
                  className="absolute top-[56%] left-[45%] w-2.5 h-2.5 rounded-full bg-[#FF6B00]"
                  style={{ boxShadow: '0 0 8px rgba(255,107,0,0.8)' }}
                  title="Epicenter BLD-331"
                />

                {/* Corner Coordinates */}
                <div className="absolute top-1.5 left-2 text-[8px] font-mono text-[#00E5FF]">34.062°N</div>
                <div className="absolute bottom-1.5 right-2 text-[8px] font-mono text-[#00E5FF]">118.260°W</div>
              </div>

              <button
                onClick={() => navigate('/viewer')}
                className="btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Box className="w-4 h-4 text-[#00E5FF]" />
                <span>Open Full 3D Map View</span>
              </button>
            </div>
          </div>

          {/* Resource Taskforce Recommendations */}
          <div className="hud-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#00E5FF]" />
              Allocated Rescue Assets
            </h3>
            <div className="space-y-2.5 pt-1">
              {[
                { label: 'Heavy USAR Search Units', val: '4 Squads (Active)', color: '#EF4444' },
                { label: 'Emergency Trauma Medics', val: '18 Personnel Dispatched', color: '#FF6B00' },
                { label: 'Heavy Extraction Cranes', val: '2 Units Mobilized', color: '#EAB308' },
                { label: 'Canine Search Teams', val: '3 Handlers on Site', color: '#00E5FF' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8A99AD]">{label}</span>
                  <span className="font-bold" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityReport;

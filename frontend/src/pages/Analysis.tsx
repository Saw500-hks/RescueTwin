import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Download, Filter, SlidersHorizontal, ChevronUp, ChevronDown,
  ArrowRight, Satellite, Box, ExternalLink, ShieldAlert,
  Layers, CheckCircle2, AlertTriangle, Crosshair, Sparkles,
  Search, RefreshCw
} from 'lucide-react';
import clsx from 'clsx';

const damageData = [
  { name: 'No Damage', count: 766, color: '#22C55E', pct: 61.4 },
  { name: 'Minor', count: 312, color: '#EAB308', pct: 25.0 },
  { name: 'Major', count: 128, color: '#FF6B00', pct: 10.2 },
  { name: 'Destroyed', count: 42, color: '#EF4444', pct: 3.4 },
];

const buildings = [
  { id: 'BLD-901', level: 'DESTROYED', conf: 98.5, change: 0.92, rank: 1, lat: '34.052°N', lon: '118.244°W', sector: 'Sector 4-B' },
  { id: 'B-027', level: 'MAJOR', conf: 91.0, change: 0.43, rank: 2, lat: '34.054°N', lon: '118.243°W', sector: 'Sector 7-A', evidence: '43% structural change, roof geometry changed, visible facade damage, nearby road partially blocked', action: 'Dispatch inspection team' },
  { id: 'BLD-842', level: 'DESTROYED', conf: 95.8, change: 0.89, rank: 3, lat: '34.059°N', lon: '118.252°W', sector: 'Sector 4-C' },
  { id: 'BLD-331', level: 'MAJOR', conf: 89.4, change: 0.71, rank: 4, lat: '34.063°N', lon: '118.242°W', sector: 'Sector 3-B' },
  { id: 'BLD-442', level: 'MAJOR', conf: 87.2, change: 0.74, rank: 14, lat: '34.058°N', lon: '118.250°W', sector: 'Sector 2-A' },
  { id: 'BLD-733', level: 'MAJOR', conf: 83.1, change: 0.69, rank: 22, lat: '34.061°N', lon: '118.240°W', sector: 'Sector 3-C' },
  { id: 'BLD-112', level: 'MINOR', conf: 91.0, change: 0.35, rank: 156, lat: '34.047°N', lon: '118.255°W', sector: 'Sector 1-D' },
  { id: 'BLD-289', level: 'MINOR', conf: 76.3, change: 0.31, rank: 201, lat: '34.055°N', lon: '118.248°W', sector: 'Sector 2-C' },
  { id: 'BLD-005', level: 'NO_DAMAGE', conf: 99.1, change: 0.02, rank: 890, lat: '34.044°N', lon: '118.260°W', sector: 'Sector 5-A' },
];

const dmgConfig: Record<string, { badgeCls: string; color: string; border: string }> = {
  DESTROYED: { badgeCls: 'badge-red', color: '#EF4444', border: 'border-[#EF4444]/40' },
  MAJOR: { badgeCls: 'badge-orange', color: '#FF6B00', border: 'border-[#FF6B00]/40' },
  MINOR: { badgeCls: 'badge-yellow', color: '#EAB308', border: 'border-[#EAB308]/40' },
  NO_DAMAGE: { badgeCls: 'badge-green', color: '#22C55E', border: 'border-[#22C55E]/40' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#070B16]/95 border border-[#00E5FF]/30 backdrop-blur-md rounded-xl p-3 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
      <div className="text-[10px] font-mono text-[#8A99AD] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-extrabold font-mono" style={{ color: payload[0].fill }}>
        {payload[0].value} <span className="text-xs text-[#8A99AD] font-normal">structures</span>
      </div>
      <div className="text-[10px] text-[#00E5FF] font-mono mt-1">Confidence ~94.8%</div>
    </div>
  );
};

const SatelliteDamageWorkspace = ({ mode, onOpen3D }: { mode: 'pre' | 'post'; onOpen3D: () => void }) => {
  const [activeHover, setActiveHover] = useState<string | null>(null);

  return (
    <div className="relative w-full h-[380px] md:h-[440px] rounded-2xl overflow-hidden flex items-center justify-center bg-[#070B16] border border-white/[0.08]">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radar Scanline Animation */}
      <div className="scanline opacity-25" />

      {/* Corner crosshairs */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#00E5FF]/60" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#00E5FF]/60" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#00E5FF]/60" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#00E5FF]/60" />

      {/* Spatial telemetry coordinates */}
      <div className="absolute top-3 left-10 text-[10px] font-mono text-[#8A99AD] bg-[#050811]/80 px-2 py-0.5 rounded border border-white/[0.06]">
        FOV: 1.2 KM² · RES: 0.35M/PX · SENSOR: WV-3
      </div>
      <div className="absolute top-3 right-10 text-[10px] font-mono text-[#00E5FF] bg-[#050811]/80 px-2 py-0.5 rounded border border-[#00E5FF]/30">
        AI BOUNDING CONFIDENCE: 98.4%
      </div>

      {mode === 'post' ? (
        <div className="absolute inset-0">
          {/* Destroyed 1 */}
          <div
            onMouseEnter={() => setActiveHover('BLD-901 (Destroyed)')}
            onMouseLeave={() => setActiveHover(null)}
            className="absolute rounded-md cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
              top: '22%',
              left: '26%',
              width: '74px',
              height: '74px',
              border: '2px solid #EF4444',
              background: 'rgba(239,68,68,0.22)',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
            }}
          >
            <div className="absolute -top-5 left-0 bg-[#EF4444] text-white text-[9px] font-mono px-1 rounded font-bold">
              BLD-901 · 98%
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
            </div>
          </div>

          {/* Destroyed 2 */}
          <div
            onMouseEnter={() => setActiveHover('BLD-842 (Destroyed)')}
            onMouseLeave={() => setActiveHover(null)}
            className="absolute rounded-md cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
              top: '46%',
              left: '60%',
              width: '88px',
              height: '68px',
              border: '2px solid #EF4444',
              background: 'rgba(239,68,68,0.22)',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
            }}
          >
            <div className="absolute -top-5 left-0 bg-[#EF4444] text-white text-[9px] font-mono px-1 rounded font-bold">
              BLD-842 · 95%
            </div>
          </div>

          {/* Major */}
          <div
            onMouseEnter={() => setActiveHover('BLD-442 (Major Damage)')}
            onMouseLeave={() => setActiveHover(null)}
            className="absolute rounded-md cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
              top: '36%',
              left: '42%',
              width: '80px',
              height: '90px',
              border: '2px solid #FF6B00',
              background: 'rgba(255,107,0,0.18)',
              boxShadow: '0 0 15px rgba(255,107,0,0.3)',
            }}
          >
            <div className="absolute -top-5 left-0 bg-[#FF6B00] text-white text-[9px] font-mono px-1 rounded font-bold">
              BLD-442 · 87%
            </div>
          </div>

          {/* Minor */}
          <div
            onMouseEnter={() => setActiveHover('BLD-112 (Minor Damage)')}
            onMouseLeave={() => setActiveHover(null)}
            className="absolute rounded-md cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
              top: '64%',
              left: '18%',
              width: '56px',
              height: '56px',
              border: '2px solid #EAB308',
              background: 'rgba(234,179,8,0.14)',
            }}
          >
            <div className="absolute -top-5 left-0 bg-[#EAB308] text-[#050811] text-[9px] font-mono px-1 rounded font-bold">
              BLD-112 · 91%
            </div>
          </div>

          {/* No damage */}
          <div
            className="absolute rounded-md"
            style={{
              top: '25%',
              left: '72%',
              width: '64px',
              height: '50px',
              border: '1.5px solid #22C55E',
              background: 'rgba(34,197,94,0.1)',
            }}
          >
            <div className="absolute -top-5 left-0 bg-[#22C55E] text-[#050811] text-[9px] font-mono px-1 rounded font-bold">
              BLD-005 · SAFE
            </div>
          </div>

          <div
            className="absolute rounded-md"
            style={{
              top: '72%',
              left: '74%',
              width: '52px',
              height: '60px',
              border: '1.5px solid #22C55E',
              background: 'rgba(34,197,94,0.1)',
            }}
          />
        </div>
      ) : (
        <div className="text-center p-6 z-10">
          <Satellite className="w-12 h-12 text-[#00E5FF]/40 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Pre-Disaster Satellite Baseline</h4>
          <p className="text-xs text-[#8A99AD] max-w-sm mx-auto">
            Zero structural anomalies detected in archival reference pass.
          </p>
        </div>
      )}

      {/* Center Action Dock */}
      {mode === 'post' && (
        <div className="relative z-20 text-center flex flex-col items-center gap-3">
          <div className="bg-[#050811]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/[0.12] shadow-2xl">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00E5FF]" />
              {activeHover ? activeHover : 'AI DAMAGE OVERLAY ACTIVE (1,248 FOOTPRINTS)'}
            </div>
          </div>
          <button
            onClick={onOpen3D}
            className="btn-primary text-xs font-bold py-2.5 px-5 flex items-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.4)] cursor-pointer"
          >
            <Box className="w-4 h-4" />
            Inspect in 3D Digital Twin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Legend Box */}
      {mode === 'post' && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 p-3 rounded-xl bg-[#050811]/95 border border-white/[0.1] backdrop-blur-md shadow-xl">
          {[
            { color: '#EF4444', label: 'Destroyed (100% Failure)' },
            { color: '#FF6B00', label: 'Major Structural Damage' },
            { color: '#EAB308', label: 'Minor / Superficial' },
            { color: '#22C55E', label: 'Intact / Safe' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-[10px] font-mono text-[#A0AEC0]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Analysis = () => {
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<string>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [mapMode, setMapMode] = useState<'pre' | 'post'>('post');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = buildings
    .filter(b => filterLevel === 'ALL' || b.level === filterLevel)
    .filter(b => searchQuery === '' || b.id.toLowerCase().includes(searchQuery.toLowerCase()) || b.sector.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const av = (a as any)[sortCol], bv = (b as any)[sortCol];
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const SortIcon = ({ col }: { col: string }) => (
    <span className="inline-flex flex-col ml-1 opacity-60">
      <ChevronUp className={clsx('w-2.5 h-2.5 -mb-0.5', sortCol === col && sortDir === 'asc' ? 'text-[#00E5FF]' : 'text-gray-600')} />
      <ChevronDown className={clsx('w-2.5 h-2.5', sortCol === col && sortDir === 'desc' ? 'text-[#00E5FF]' : 'text-gray-600')} />
    </span>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Tactical Mission Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-orange flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-[#FF6B00]" />
              OPERATIONAL INTELLIGENCE
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">JOB REF: #job_8f72c3a1 · INFERENCE TIME 1.4s</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Damage Assessment & Intelligence
          </h1>
          <p className="text-xs md:text-sm text-[#8A99AD] mt-1">
            Volumetric structural damage analysis over 1,248 target structures synthesized from multi-spectral passes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/viewer')}
            className="btn-secondary flex items-center gap-2 text-xs md:text-sm py-2.5 px-4 cursor-pointer"
          >
            <Box className="w-4 h-4 text-[#00E5FF]" />
            <span>Open 3D Twin</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-xs md:text-sm py-2.5 px-4 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Mission Report</span>
          </button>
        </div>
      </div>

      {/* 5-Stage Computer Vision & Geospatial Pipeline Trace */}
      <div className="hud-card p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="badge-cyan text-[10px] font-mono">PIPELINE TRACE</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              5-Stage CV & Geospatial Execution Pipeline
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL 5 STAGES VERIFIED (END-TO-END CONVERGED)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: '1',
              title: 'Input images',
              model: 'WV-3 / Sentinel-2',
              stat: '0.35m/px Resolution',
              status: 'INGESTED',
              badge: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40',
              details: 'Pre/Post optical bands calibrated'
            },
            {
              step: '2',
              title: 'Building detection',
              model: 'YOLOv8x-Footprint',
              stat: '1,248 Segmented',
              status: '98.4% CONF',
              badge: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40',
              details: 'B-027 footprint registered'
            },
            {
              step: '3',
              title: 'Pre/post alignment',
              model: 'ORB + RANSAC',
              stat: '2.4px Mean Shift',
              status: 'LOCKED',
              badge: 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40',
              details: 'Homography warp aligned'
            },
            {
              step: '4',
              title: 'Damage classification',
              model: 'SiameseDamageNet',
              stat: 'B-027: MAJOR (43%)',
              status: 'CLASSIFIED',
              badge: 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40',
              details: '42 Destroyed · 128 Major'
            },
            {
              step: '5',
              title: 'Road/access analysis',
              model: 'Arterial Obstruction',
              stat: '1 Ingress / 2 Restricted',
              status: 'COMPUTED',
              badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              details: 'North Arterial Blvd Clear'
            },
          ].map((st) => (
            <div key={st.step} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 relative group hover:border-[#00E5FF]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold">STAGE {st.step}</span>
                <span className={clsx('text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border', st.badge)}>
                  {st.status}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{st.title}</div>
                <div className="text-[10px] font-mono text-[#00E5FF] mt-0.5">{st.model}</div>
              </div>
              <div className="text-[11px] font-bold text-slate-200 font-mono">
                {st.stat}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {st.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {damageData.map((d) => (
          <div
            key={d.name}
            className="hud-card p-5 flex flex-col justify-between group transition-all duration-300 hover:border-[#00E5FF]/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-[#8A99AD] uppercase tracking-wider">{d.name}</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: d.color, boxShadow: `0 0 10px ${d.color}90` }}
              />
            </div>
            <div className="text-3xl md:text-4xl font-black font-mono my-1 tracking-tight" style={{ color: d.color }}>
              {d.count}
            </div>
            <div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.pct}%`, background: d.color, boxShadow: `0 0 8px ${d.color}80` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#8A99AD]">
                <span>{d.pct}% of sector</span>
                <span className="text-white">Active Class</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workspace: Map + Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Satellite Imagery Window */}
        <div className="lg:col-span-2 hud-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#090F1F]/60">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00E5FF]" />
                Spatial Damage Footprint
              </h3>
              <p className="text-[11px] text-[#8A99AD] mt-0.5">High-resolution segmentation mask overlay</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMapMode('pre')}
                className={clsx(
                  'text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
                  mapMode === 'pre'
                    ? 'bg-white/[0.15] text-white border-white/[0.3]'
                    : 'bg-white/[0.04] text-[#8A99AD] border-white/[0.08] hover:text-white'
                )}
              >
                Pre-Disaster
              </button>
              <button
                onClick={() => setMapMode('post')}
                className={clsx(
                  'text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
                  mapMode === 'post'
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-white/[0.04] text-[#8A99AD] border-white/[0.08] hover:text-white'
                )}
              >
                Post + AI Overlay
              </button>
            </div>
          </div>

          <div className="p-4 md:p-5 flex-1 flex flex-col">
            <SatelliteDamageWorkspace mode={mapMode} onOpen3D={() => navigate('/viewer')} />
          </div>
        </div>

        {/* Damage Distribution Recharts Bar Chart */}
        <div className="hud-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.08] bg-[#090F1F]/60">
            <h3 className="text-sm font-bold text-white">Severity Spectrum</h3>
            <p className="text-[11px] text-[#8A99AD] mt-0.5">Building count by damage threshold</p>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={damageData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={76}
                    tick={{ fill: '#A0AEC0', fontSize: 11, fontFamily: 'inherit' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,229,255,0.05)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {damageData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Matrix Breakdown */}
            <div className="space-y-2 pt-3 border-t border-white/[0.08]">
              {damageData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-[#A0AEC0]">{d.name}</span>
                  </div>
                  <span className="font-bold text-white">{d.count} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Assessments Intelligence Table */}
      <div className="hud-card overflow-hidden">
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#090F1F]/60">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#FF6B00]" />
              Detailed Structural Assessments
            </h3>
            <p className="text-[11px] text-[#8A99AD] mt-0.5">
              Showing {filtered.length} targets · Sorted by {sortCol.toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search building ID / sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#050811] border border-white/[0.1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:border-[#00E5FF] focus:outline-none w-48 md:w-56"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-[#050811] p-1 rounded-lg border border-white/[0.08]">
              {['ALL', 'DESTROYED', 'MAJOR', 'MINOR', 'NO_DAMAGE'].map(l => (
                <button
                  key={l}
                  onClick={() => setFilterLevel(l)}
                  className={clsx(
                    'text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all cursor-pointer',
                    filterLevel === l
                      ? 'bg-[#00E5FF] text-[#050811] shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : 'text-[#8A99AD] hover:text-white'
                  )}
                >
                  {l.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#070B16]">
                {[
                  { col: 'id', label: 'Structure ID' },
                  { col: 'level', label: 'Classification' },
                  { col: 'conf', label: 'AI Confidence' },
                  { col: 'change', label: 'Change Index' },
                  { col: 'rank', label: 'Rescue Priority' },
                  { col: 'sector', label: 'Sector / Lat Lon' },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-[#8A99AD] font-bold cursor-pointer hover:text-[#00E5FF] select-none transition-colors"
                  >
                    <span className="flex items-center">
                      {label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-[#8A99AD]">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((row) => {
                const cfg = dmgConfig[row.level] || dmgConfig.NO_DAMAGE;
                return (
                  <tr
                    key={row.id}
                    onClick={() => navigate('/viewer')}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                      {row.id}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx(cfg.badgeCls, 'text-[10px] font-mono font-bold')}>
                        {row.level.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#A0AEC0]">
                      {row.conf}%
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#A0AEC0]">
                      {row.change.toFixed(2)} Δ
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: row.rank <= 5 ? '#EF4444' : '#00E5FF' }}>
                      #{row.rank}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#8A99AD]">
                      {row.sector} ({row.lat}, {row.lon})
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/viewer'); }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:text-white transition-colors cursor-pointer"
                      >
                        <span>3D Twin</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

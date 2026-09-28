import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Box as BoxIcon,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crosshair,
  FileText,
  Globe,
  Layers,
  Map as MapIcon,
  Maximize2,
  Navigation,
  Radio,
  RotateCcw,
  Ruler,
  Satellite,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

// ── Interactive 3D Canvas Scene for 3D Digital Twin Card ─────────────────────
const DigitalTwin3DScene = () => {
  const buildings = [
    { id: 'B-1042', pos: [0, 2.2, 0] as [number, number, number], scale: [3.2, 4.4, 3.2] as [number, number, number], color: '#FF8A00', isEpicenter: true },
    { id: 'B-1001', pos: [-5.5, 2.6, -4] as [number, number, number], scale: [2.8, 5.2, 2.8] as [number, number, number], color: '#FF3B30' },
    { id: 'B-1002', pos: [5.5, 1.6, -4.5] as [number, number, number], scale: [3.4, 3.2, 3.2] as [number, number, number], color: '#00D2FF' },
    { id: 'B-1003', pos: [-4.8, 1.8, 4.8] as [number, number, number], scale: [2.8, 3.6, 2.6] as [number, number, number], color: '#FACC15' },
    { id: 'B-1004', pos: [5, 3, 4.2] as [number, number, number], scale: [2.6, 6, 2.6] as [number, number, number], color: '#FF8A00' },
    { id: 'B-1005', pos: [-1.2, 1.4, -6.5] as [number, number, number], scale: [2.4, 2.8, 2.4] as [number, number, number], color: '#00D2FF' },
    { id: 'B-1006', pos: [1.8, 1.8, 5.5] as [number, number, number], scale: [2.8, 3.6, 2.8] as [number, number, number], color: '#00D2FF' },
  ];

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 24, 12]} intensity={1.8} />
      <directionalLight position={[-12, 16, -10]} intensity={0.6} color="#00D2FF" />
      <pointLight position={[0, 10, 0]} intensity={1.8} color="#FF8A00" distance={40} />

      {/* Dark Terrain Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#030814" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Blue Grid Overlay */}
      <Grid
        args={[40, 40]}
        position={[0, 0, 0]}
        cellSize={1.6}
        cellThickness={0.3}
        cellColor="#00D2FF"
        sectionSize={6.4}
        sectionThickness={0.8}
        sectionColor="#FF8A00"
        fadeDistance={32}
        fadeStrength={1.2}
        infiniteGrid={false}
      />

      {/* 3D Buildings with Wireframe Cages */}
      {buildings.map((b) => (
        <group key={b.id} position={b.pos}>
          {/* Wireframe Outline */}
          <mesh scale={[b.scale[0] * 1.02, b.scale[1] * 1.02, b.scale[2] * 1.02]}>
            <boxGeometry />
            <meshBasicMaterial
              color={b.color}
              wireframe
              transparent
              opacity={b.isEpicenter ? 1 : 0.45}
            />
          </mesh>

          {/* Solid Core */}
          <Box scale={b.scale}>
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={b.isEpicenter ? 0.75 : 0.2}
              roughness={0.35}
              metalness={0.5}
              transparent
              opacity={0.9}
            />
          </Box>
        </group>
      ))}
    </>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020811] text-white pb-20 select-none overflow-x-hidden">
      {/* ── 1. HERO SECTION ── */}
      <section className="relative px-3.5 sm:px-6 lg:px-10 pt-4 sm:pt-8 lg:pt-12 max-w-[1540px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Hero Content & CTAs */}
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-4 z-20">
            {/* Orange Outline Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-[#FF6B00]/60 bg-[#FF6B00]/10 text-[#FF8A3D] text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.15em] sm:tracking-[0.2em]">
              <Crosshair className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FF6B00]" />
              <span>DISASTER RESPONSE MISSION</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[clamp(2.6rem,4.6vw,4.2rem)] font-extrabold leading-tight lg:leading-[0.94] tracking-tight text-white break-words">
              See damage.
              <br />
              <span className="bg-gradient-to-r from-[#00A3FF] via-[#00D2FF] to-[#38BDF8] bg-clip-text text-transparent">
                Prioritize rescue.
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm lg:text-[15px] text-[#94A3B8] max-w-md leading-relaxed font-normal">
              AI-powered satellite damage assessment, 3D digital twins, and rescue prioritization for disaster response.
            </p>

            {/* Action Buttons - Full width on mobile for easy one-thumb tap */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary text-xs sm:text-sm py-3 px-5 sm:px-6 gap-2 sm:gap-2.5 font-bold shadow-[0_0_25px_rgba(0,163,255,0.45)] cursor-pointer justify-center touch-manipulation"
              >
                <Zap className="w-4 h-4 fill-current flex-shrink-0" />
                <span>Explore the System</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate('/map')}
                className="btn-secondary text-xs sm:text-sm py-3 px-5 sm:px-6 gap-2 sm:gap-2.5 font-semibold cursor-pointer justify-center touch-manipulation"
              >
                <MapIcon className="w-4 h-4 text-[#00D2FF] flex-shrink-0" />
                <span>Open Live Map</span>
              </button>
            </div>

            {/* Technical Indicators - Clean 3-col grid on mobile */}
            <div className="pt-2 sm:pt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4 text-[10px] sm:text-[11px] font-mono border-t border-white/05 sm:border-0">
              <div className="flex flex-col bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/05 sm:border-0">
                <span className="text-[#64748B] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">SATELLITE</span>
                <span className="text-[#00D2FF] font-bold mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px]">
                  LIVE <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
                </span>
              </div>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <div className="flex flex-col bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/05 sm:border-0">
                <span className="text-[#64748B] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">ENGINE</span>
                <span className="text-[#22C55E] font-bold mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> ONLINE
                </span>
              </div>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <div className="flex flex-col bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/05 sm:border-0">
                <span className="text-[#64748B] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">DETECTION</span>
                <span className="text-[#FF8A3D] font-bold mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D] animate-pulse" /> ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Cinematic Satellite & Disaster Visual */}
          <div className="lg:col-span-7 relative mt-2 lg:mt-0">
            <div className="relative w-full h-[320px] sm:h-[460px] lg:h-[580px] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#00A3FF]/30 shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,163,255,0.18)] bg-[#030712] group">
              {/* Authentic High-Resolution Satellite Night Topography Image */}
              <img
                src="/assets/hero_satellite.jpg"
                alt="Satellite Topography Disaster Response"
                className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />

              {/* Ambient dark radial edge vignette to blend seamlessly */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(2, 8, 17, 0.7) 80%, rgba(2, 8, 17, 0.95) 100%),
                    linear-gradient(to bottom, rgba(2, 8, 17, 0.2) 0%, transparent 30%, transparent 70%, rgba(2, 8, 17, 0.85) 100%)
                  `,
                }}
              />

              {/* Glowing Red Pulsing Hazard Rings */}
              <div
                className="absolute rounded-full border border-red-500/80 bg-red-500/15 pointer-events-none animate-ping"
                style={{ top: '56%', left: '68%', width: '100px', height: '100px', transform: 'translate(-50%, -50%)' }}
              />
              <div
                className="absolute rounded-full border border-orange-500/60 bg-orange-500/10 pointer-events-none"
                style={{ top: '38%', left: '48%', width: '80px', height: '80px', transform: 'translate(-50%, -50%)' }}
              />
              <div
                className="absolute rounded-full border border-red-500/70 bg-red-500/10 pointer-events-none"
                style={{ top: '65%', left: '32%', width: '70px', height: '70px', transform: 'translate(-50%, -50%)' }}
              />

              {/* Red Alert Interactive Markers with pulse */}
              <div
                onClick={() => navigate('/viewer')}
                className="absolute top-[38%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group/pin"
                title="Critical Building B-1042"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF3B30]/30 border border-[#FF3B30] flex items-center justify-center text-white shadow-[0_0_15px_#FF3B30] animate-bounce">
                  <span className="font-mono text-[10px] sm:text-xs font-bold">!</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/viewer')}
                className="absolute top-[65%] left-[32%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                title="Critical Building B-1088"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FF3B30]/30 border border-[#FF3B30] flex items-center justify-center text-white shadow-[0_0_12px_#FF3B30]">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold">!</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/viewer')}
                className="absolute top-[56%] left-[68%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                title="Damaged Building B-1004"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FF8A00]/30 border border-[#FF8A00] flex items-center justify-center text-white shadow-[0_0_12px_#FF8A00]">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold">▲</span>
                </div>
              </div>

              {/* Red HUD Callout Box Pointing to Building B-1042 */}
              <div className="absolute top-4 right-4 sm:top-8 sm:right-32 z-30 p-2.5 sm:p-3 rounded-xl bg-[#040916]/95 border border-[#FF3B30]/80 shadow-[0_0_30px_rgba(255,59,48,0.45)] backdrop-blur-md pointer-events-none text-[9px] sm:text-[10px]">
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#FF3B30] mb-0.5 sm:mb-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF3B30] animate-ping" />
                  <span>BUILDING ID: B-1042</span>
                </div>
                <div className="space-y-0.5 font-mono text-white text-[8.5px] sm:text-[10px]">
                  <div>DAMAGE: <span className="text-[#FF8A00] font-bold">MAJOR</span></div>
                  <div>PRIORITY: <span className="text-[#FF3B30] font-bold">HIGH</span></div>
                  <div>CONFIDENCE: <span className="text-[#00D2FF] font-bold">94.2%</span></div>
                </div>
              </div>

              {/* Map Legend Overlay (Far Right) */}
              <div className="absolute top-24 right-4 z-30 p-3 rounded-xl bg-[#040916]/92 border border-white/15 backdrop-blur-md hidden sm:flex flex-col gap-2.5 text-[10px] font-mono shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-[#00D2FF] bg-[#00D2FF]/20 shadow-[0_0_6px_#00D2FF]" />
                  <span className="text-[#CBD5E1]">Normal Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-[#FF8A00] bg-[#FF8A00]/30 shadow-[0_0_6px_#FF8A00]" />
                  <span className="text-[#CBD5E1]">Damaged Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-[#FF3B30] bg-[#FF3B30]/40 shadow-[0_0_8px_#FF3B30]" />
                  <span className="text-white font-bold">Critical Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FF8A00]" />
                  <span className="text-[#CBD5E1]">Hazard Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#22C55E]/30 border border-[#22C55E] flex items-center justify-center text-[7px] text-[#22C55E]">●</div>
                  <span className="text-[#CBD5E1]">Rescue Point</span>
                </div>
              </div>

              {/* Map Zoom Controls (Bottom Right) */}
              <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-1.5">
                <button
                  onClick={() => navigate('/map')}
                  className="w-8 h-8 rounded-lg bg-[#040916]/90 border border-white/15 text-white flex items-center justify-center text-sm font-bold hover:bg-[#00A3FF]/30 cursor-pointer shadow-lg transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => navigate('/map')}
                  className="w-8 h-8 rounded-lg bg-[#040916]/90 border border-white/15 text-white flex items-center justify-center text-sm font-bold hover:bg-[#00A3FF]/30 cursor-pointer shadow-lg transition-colors"
                >
                  −
                </button>
                <button
                  onClick={() => navigate('/map')}
                  className="w-8 h-8 rounded-lg bg-[#040916]/90 border border-white/15 text-[#00D2FF] flex items-center justify-center hover:bg-[#00A3FF]/30 cursor-pointer shadow-lg transition-colors"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Radar Scanline effect */}
              <div className="scanline absolute inset-0 pointer-events-none opacity-25 z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FOUR-STAGE CONNECTED WORKFLOW: DETECT → VISUALIZE → ASSESS → PRIORITIZE ── */}
      <section className="px-3.5 sm:px-6 lg:px-10 pt-10 sm:pt-16 max-w-[1540px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
          {[
            {
              step: 'DETECT',
              title: 'Satellite Imagery',
              desc: 'Compare pre & post-disaster images',
              icon: Satellite,
              link: '/upload',
              color: '#00A3FF'
            },
            {
              step: 'VISUALIZE',
              title: '3D Digital Twin',
              desc: 'Reconstruct affected areas in 3D',
              icon: BoxIcon,
              link: '/viewer',
              color: '#00D2FF'
            },
            {
              step: 'ASSESS',
              title: 'Damage Detection',
              desc: 'AI classifies and measures damage',
              icon: Activity,
              link: '/analysis',
              color: '#FF8A00'
            },
            {
              step: 'PRIORITIZE',
              title: 'Rescue Prioritization',
              desc: 'Rank locations for immediate action',
              icon: Target,
              link: '/priority',
              color: '#FF3B30'
            },
          ].map((item, index) => (
            <div
              key={item.step}
              onClick={() => navigate(item.link)}
              className="hud-card p-4 sm:p-5 rounded-xl sm:rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:border-[#00D2FF]/50 cursor-pointer relative overflow-hidden flex items-center justify-between touch-manipulation"
            >
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0"
                  style={{ background: `${item.color}15`, border: `1px solid ${item.color}40` }}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
                </div>

                <div>
                  <div className="text-[11px] sm:text-[12px] font-mono font-bold tracking-wider" style={{ color: item.color }}>
                    {item.step}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00D2FF] transition-colors mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>

              {index < 3 && (
                <div className="hidden lg:block text-slate-600 font-bold ml-2">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. THREE OPERATIONAL PANELS: DAMAGE ANALYSIS | 3D DIGITAL TWIN | RESCUE PRIORITY ── */}
      <section className="px-3.5 sm:px-6 lg:px-10 pt-10 sm:pt-16 max-w-[1540px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Panel 1: DAMAGE ANALYSIS (4 Cols) */}
          <div className="lg:col-span-4 hud-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-white/10 space-y-4">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <FileText className="w-4 h-4 text-[#00D2FF]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                  DAMAGE ANALYSIS
                </h3>
              </div>

              {/* Side-by-side Dual Satellite Panels with Real Imagery */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 my-3 relative">
                {/* Pre-Disaster Image Box */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#071120] h-28 sm:h-36 flex flex-col justify-between p-2 group">
                  <img
                    src="/assets/pre_disaster.jpg"
                    alt="Pre Disaster Aerial Satellite"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="relative z-10 text-[8px] sm:text-[9px] font-mono font-bold text-[#00D2FF] bg-black/70 px-1.5 py-0.5 rounded w-fit backdrop-blur-sm">
                    PRE-DISASTER
                  </span>
                </div>

                {/* VS Badge in center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#020811] border border-white/30 flex items-center justify-center font-mono text-[8px] sm:text-[9px] font-bold text-white shadow-xl">
                  VS
                </div>

                {/* Post-Disaster Image Box */}
                <div className="relative rounded-xl overflow-hidden border border-red-500/50 bg-[#071120] h-28 sm:h-36 flex flex-col justify-between p-2 group">
                  <img
                    src="/assets/post_disaster.jpg"
                    alt="Post Disaster Aerial Damage Overlay"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="relative z-10 text-[8px] sm:text-[9px] font-mono font-bold text-[#FF3B30] bg-black/70 px-1.5 py-0.5 rounded w-fit border border-[#FF3B30]/40 backdrop-blur-sm">
                    POST-DISASTER
                  </span>
                </div>
              </div>

              {/* AI Analysis Results Telemetry */}
              <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                <span className="text-[9px] sm:text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-wider block mb-1">
                  AI ANALYSIS RESULTS
                </span>

                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono py-1 border-b border-white/05">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#00D2FF]" />
                    <span className="text-[#CBD5E1]">Detected Buildings</span>
                  </div>
                  <span className="font-bold text-white">342</span>
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono py-1 border-b border-white/05">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#FF3B30]" />
                    <span className="text-[#CBD5E1]">Damage Areas</span>
                  </div>
                  <span className="font-bold text-[#FF3B30]">156</span>
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono py-1 border-b border-white/05">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#00D2FF]" />
                    <span className="text-[#CBD5E1]">AI Confidence</span>
                  </div>
                  <span className="font-bold text-[#00D2FF]">94.2%</span>
                </div>
              </div>

              {/* Damage Classification Breakdown */}
              <div className="mt-2.5 sm:mt-3 pt-1 sm:pt-2">
                <span className="text-[9px] sm:text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-wider block mb-1.5 sm:mb-2">
                  Damage Classification
                </span>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs font-mono">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] border border-white/05">
                    <div className="flex items-center justify-center gap-1 text-[#FACC15] text-[9px] sm:text-[10px] font-bold">
                      <span>●</span> Minor
                    </div>
                    <div className="font-bold text-white mt-0.5 text-xs sm:text-sm">62</div>
                  </div>

                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] border border-white/05">
                    <div className="flex items-center justify-center gap-1 text-[#FF8A00] text-[9px] sm:text-[10px] font-bold">
                      <span>▲</span> Major
                    </div>
                    <div className="font-bold text-white mt-0.5 text-xs sm:text-sm">78</div>
                  </div>

                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] border border-white/05">
                    <div className="flex items-center justify-center gap-1 text-[#FF3B30] text-[9px] sm:text-[10px] font-bold">
                      <span>!</span> Destroyed
                    </div>
                    <div className="font-bold text-white mt-0.5 text-xs sm:text-sm">16</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Action */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00D2FF]" />
                <div>
                  <div className="text-white font-bold text-[10px] sm:text-[11px]">Analysis Completed</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500">2m 34s</div>
                </div>
              </div>

              <button
                onClick={() => navigate('/analysis')}
                className="btn-secondary text-[10px] sm:text-[11px] py-1.5 px-2.5 sm:px-3 gap-1 cursor-pointer touch-manipulation"
              >
                <span>Report</span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Panel 2: 3D DIGITAL TWIN (5 Cols) */}
          <div className="lg:col-span-5 hud-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-white/10 space-y-3 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BoxIcon className="w-4 h-4 text-[#00D2FF]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                  3D DIGITAL TWIN
                </h3>
              </div>

              <button
                onClick={() => navigate('/viewer')}
                className="btn-secondary text-[10px] py-1 px-2.5 gap-1 cursor-pointer touch-manipulation"
              >
                <span>Layer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* High-Fidelity 3D Digital Twin City View with HUD Callout & Controls */}
            <div className="relative h-[230px] sm:h-[280px] lg:h-[310px] rounded-xl overflow-hidden bg-[#030712] border border-white/10 group">
              <img
                src="/assets/twin_3d_city.jpg"
                alt="3D Digital Twin City Model"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Red Target Callout Box */}
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 p-2 sm:p-2.5 rounded-xl bg-[#040916]/95 border border-[#FF3B30]/70 shadow-[0_0_20px_rgba(255,59,48,0.45)] backdrop-blur-md pointer-events-none text-[8.5px] sm:text-[9.5px] font-mono">
                <div className="text-[#FF3B30] font-bold">BUILDING ID: B-1042</div>
                <div className="text-white mt-0.5">DAMAGE: <span className="text-[#FF8A00] font-bold">MAJOR</span></div>
                <div className="text-white">CONFIDENCE: <span className="text-[#00D2FF] font-bold">94.2%</span></div>
                <div className="text-white">PRIORITY: <span className="text-[#FF3B30] font-bold">HIGH</span></div>
              </div>

              {/* Toolbar on Right */}
              <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-20 flex flex-col gap-1.5">
                <button onClick={() => navigate('/viewer')} className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#00A3FF]/20 transition-colors touch-manipulation">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => navigate('/viewer')} className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#00A3FF]/20 transition-colors touch-manipulation">
                  <Crosshair className="w-3.5 h-3.5 text-[#00D2FF]" />
                </button>
                <button onClick={() => navigate('/viewer')} className="w-7 h-7 rounded bg-black/80 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#00A3FF]/20 transition-colors touch-manipulation">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-black/80 border border-white/15 font-mono text-[8px] sm:text-[9px] text-[#00D2FF] backdrop-blur-sm">
                SPATIAL TWIN ACTIVE
              </div>
            </div>
          </div>

          {/* Panel 3: RESCUE PRIORITY (3 Cols) */}
          <div className="lg:col-span-3 hud-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-white/10 space-y-3">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Target className="w-4 h-4 text-[#FF3B30]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                  RESCUE PRIORITY
                </h3>
              </div>

              {/* Three Priority Cards */}
              <div className="space-y-2.5 sm:space-y-3 my-2.5 sm:my-3">
                {/* HIGH PRIORITY */}
                <div
                  onClick={() => navigate('/priority')}
                  className="p-3 sm:p-3.5 rounded-xl border border-[#FF3B30]/60 bg-[#FF3B30]/08 hover:bg-[#FF3B30]/15 transition-all cursor-pointer flex items-center justify-between shadow-[0_0_15px_rgba(255,59,48,0.15)] group touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30] flex items-center justify-center text-[#FF3B30] flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs font-bold font-mono text-[#FF3B30]">HIGH PRIORITY</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300">Immediate inspection</div>
                      <div className="text-[9px] sm:text-[10px] font-mono text-[#FF3B30] font-bold mt-0.5">12 locations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF3B30] transition-transform group-hover:translate-x-1" />
                </div>

                {/* MEDIUM PRIORITY */}
                <div
                  onClick={() => navigate('/priority')}
                  className="p-3 sm:p-3.5 rounded-xl border border-[#FF8A00]/50 bg-[#FF8A00]/08 hover:bg-[#FF8A00]/15 transition-all cursor-pointer flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF8A00]/20 border border-[#FF8A00] flex items-center justify-center text-[#FF8A00] flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs font-bold font-mono text-[#FF8A00]">MEDIUM PRIORITY</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300">Secondary assessment</div>
                      <div className="text-[9px] sm:text-[10px] font-mono text-[#FF8A00] font-bold mt-0.5">28 locations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF8A00] transition-transform group-hover:translate-x-1" />
                </div>

                {/* LOW PRIORITY */}
                <div
                  onClick={() => navigate('/priority')}
                  className="p-3 sm:p-3.5 rounded-xl border border-[#00D2FF]/40 bg-[#00D2FF]/08 hover:bg-[#00D2FF]/15 transition-all cursor-pointer flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00D2FF]/20 border border-[#00D2FF] flex items-center justify-center text-[#00D2FF] flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs font-bold font-mono text-[#00D2FF]">LOW PRIORITY</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300">Monitor</div>
                      <div className="text-[9px] sm:text-[10px] font-mono text-[#00D2FF] font-bold mt-0.5">42 locations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00D2FF] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Bottom Full-Width Action Button */}
            <button
              onClick={() => navigate('/priority')}
              className="btn-secondary w-full py-2.5 text-xs font-bold justify-center touch-manipulation cursor-pointer"
            >
              <span>View Priority Report →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER TELEMETRY STRIP ── */}
      <footer className="mt-12 sm:mt-20 border-t border-white/10 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-10 max-w-[1540px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs font-mono text-slate-500 text-center sm:text-left">
          <div>
            <span className="text-white font-bold">RescueTwin</span> · AI DISASTER RESPONSE
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>AI SPATIAL INTELLIGENCE · ACTIVE</span>
          </div>
          <div className="hidden sm:block">FASTER INSIGHTS / SAFER COMMUNITIES</div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

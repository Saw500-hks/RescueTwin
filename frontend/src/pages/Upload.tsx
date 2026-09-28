import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud, Image as ImageIcon, Satellite, Loader2,
  CheckCircle2, Circle, ChevronRight, Zap, Layers, X, FileImage,
  ShieldAlert, Sparkles, Crosshair, ArrowUpRight, Cpu, Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../stores/useStore';
import clsx from 'clsx';

type Mode = 'quick' | 'reconstruction';

interface DropZoneProps {
  label: string;
  sublabel: string;
  tag: string;
  icon: any;
  file: File | null;
  accentColor: string;
  getRootProps: any;
  getInputProps: any;
  onClear: () => void;
}

const DropZone = ({ label, sublabel, tag, icon: Icon, file, accentColor, getRootProps, getInputProps, onClear }: DropZoneProps) => (
  <div
    {...getRootProps()}
    className={clsx(
      'relative flex flex-col items-center justify-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 min-h-[280px] group overflow-hidden',
      file ? 'border' : 'border border-dashed'
    )}
    style={file ? {
      borderColor: accentColor,
      background: `linear-gradient(180deg, ${accentColor}12 0%, rgba(11,18,36,0.85) 100%)`,
      boxShadow: `0 0 30px ${accentColor}20, inset 0 0 20px ${accentColor}10`,
    } : {
      borderColor: 'rgba(255,255,255,0.12)',
      background: 'linear-gradient(180deg, rgba(13,20,40,0.6) 0%, rgba(7,11,22,0.8) 100%)',
    }}
  >
    <input {...getInputProps()} />

    {/* Background tactical radar grid in zone */}
    <div
      className="absolute inset-0 pointer-events-none opacity-20 transition-opacity group-hover:opacity-40"
      style={{
        backgroundImage: `linear-gradient(${accentColor}30 1px, transparent 1px), linear-gradient(90deg, ${accentColor}30 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}
    />

    {/* Hover highlight overlay */}
    <div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ background: `radial-gradient(circle at center, ${accentColor}15 0%, transparent 70%)` }}
    />

    {/* Header tag */}
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      <span
        className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded border"
        style={{
          background: `${accentColor}15`,
          borderColor: `${accentColor}40`,
          color: accentColor,
        }}
      >
        {tag}
      </span>
    </div>

    {file ? (
      <div className="relative z-10 text-center w-full max-w-[240px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
          style={{ background: `${accentColor}25`, border: `1.5px solid ${accentColor}60`, boxShadow: `0 0 20px ${accentColor}40` }}
        >
          <FileImage style={{ width: '28px', height: '28px', color: accentColor }} />
        </div>
        <p className="text-[14px] font-bold text-white mb-1 truncate">{file.name}</p>
        <p className="text-[11px] font-mono text-[#00E5FF]">{(file.size / 1024 / 1024).toFixed(2)} MB · READY</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="mt-4 inline-flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-white px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
        >
          <X style={{ width: '12px', height: '12px' }} /> Replace Image
        </button>
      </div>
    ) : (
      <div className="relative z-10 text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Icon style={{ width: '26px', height: '26px', color: accentColor }} />
        </div>
        <h3 className="text-[16px] font-bold text-white mb-1">{label}</h3>
        <p className="text-[12px] text-[#8A99AD] mb-4">{sublabel}</p>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all"
          style={{
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}50`,
            color: '#FFFFFF',
          }}
        >
          <UploadCloud style={{ width: '13px', height: '13px', color: accentColor }} />
          Select or drop file here
        </div>
      </div>
    )}

    {/* Corner tactical crosshairs */}
    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: `${accentColor}60` }} />
    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: `${accentColor}60` }} />
    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: `${accentColor}60` }} />
    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: `${accentColor}60` }} />
  </div>
);

const processingSteps = [
  { label: 'Satellite Telemetry Ingestion', desc: 'Validating resolution, sensor bands & GeoTIFF headers' },
  { label: 'Spatial Segmentation Engine', desc: 'Isolating structural footprints & building contours' },
  { label: 'Deep Damage Classification', desc: 'Computing structural failure index across pre/post imagery' },
  { label: 'Rescue Priority Matrix', desc: 'Evaluating life safety, hazard radius & road navigability' },
  { label: '3D Spatial Twin Compilation', desc: 'Synthesizing interactive wireframes & operational telemetry' },
];

const Upload = () => {
  const [mode, setMode] = useState<Mode>('quick');
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(-1);
  const navigate = useNavigate();
  const { setCurrentJob } = useStore();

  const onDropPre = useCallback((f: File[]) => setPreFile(f[0]), []);
  const onDropPost = useCallback((f: File[]) => setPostFile(f[0]), []);
  const onDropMulti = useCallback((f: File[]) => setMultiFiles(p => [...p, ...f]), []);

  const { getRootProps: getRPre, getInputProps: getIPre } = useDropzone({ onDrop: onDropPre, accept: { 'image/*': [] }, maxFiles: 1 });
  const { getRootProps: getRPost, getInputProps: getIPost } = useDropzone({ onDrop: onDropPost, accept: { 'image/*': [] }, maxFiles: 1 });
  const { getRootProps: getRMulti, getInputProps: getIMulti } = useDropzone({ onDrop: onDropMulti, accept: { 'image/*': [] } });

  const handleProcess = async () => {
    setProcessing(true);
    processingSteps.forEach((_, i) => {
      setTimeout(() => setStep(i), i * 1400);
    });
    setTimeout(() => {
      const jId = 'job_' + Math.random().toString(36).slice(2, 10);
      setCurrentJob({ job_id: jId, jobId: jId, status: 'completed', progress: 100, created_at: new Date().toISOString() });
      navigate(mode === 'quick' ? '/analysis' : '/viewer');
    }, processingSteps.length * 1400 + 400);
  };

  const canProceed = mode === 'quick' ? (!!preFile && !!postFile) : multiFiles.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-cyan flex items-center gap-1.5">
              <Satellite className="w-3 h-3 text-[#00E5FF]" />
              MISSION INGESTION
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">SECTOR-ALPHA // LAT 34.052°N</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Satellite Imagery Ingestion
          </h1>
          <p className="text-sm text-[#8A99AD] mt-1 max-w-2xl">
            Upload pre and post-disaster high-resolution optical or SAR satellite passes for automated 3D reconstruction and damage severity profiling.
          </p>
        </div>

        {/* Technical indicator */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.08] bg-[#0B1224]/80">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <div className="text-left font-mono">
            <div className="text-[10px] uppercase text-[#6B7280]">AI Model</div>
            <div className="text-[12px] font-bold text-white">RescueTwin-Vision v2.5</div>
          </div>
        </div>
      </div>

      {!processing ? (
        <>
          {/* Analysis Mode Selector */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#090F1F]/90 border border-white/[0.08] w-fit">
            {([
              { id: 'quick', label: 'Dual-Pass Analysis', desc: 'Pre + Post Pair Assessment', icon: Zap },
              { id: 'reconstruction', label: 'Multi-View 3D Twin', desc: 'Photogrammetric Dense Mesh', icon: Layers },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={clsx(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer',
                  mode === m.id
                    ? 'bg-gradient-to-r from-[#00E5FF] to-[#0099FF] text-[#050811] shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                    : 'text-[#8A99AD] hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <m.icon className="w-4 h-4" />
                <span>{m.label}</span>
                <span className={clsx('text-[10px] hidden sm:inline', mode === m.id ? 'opacity-80' : 'opacity-50')}>
                  · {m.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Main Drop Surface */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            {mode === 'quick' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropZone
                  label="Pre-Disaster Baseline"
                  sublabel="Reference satellite pass before impact"
                  tag="REFERENCE BASELINE"
                  icon={ImageIcon}
                  file={preFile}
                  accentColor="#00E5FF"
                  getRootProps={getRPre}
                  getInputProps={getIPre}
                  onClear={() => setPreFile(null)}
                />
                <DropZone
                  label="Post-Disaster Target"
                  sublabel="Active damage imagery for AI classification"
                  tag="INCIDENT PASS"
                  icon={Satellite}
                  file={postFile}
                  accentColor="#FF6B00"
                  getRootProps={getRPost}
                  getInputProps={getIPost}
                  onClear={() => setPostFile(null)}
                />
              </div>
            ) : (
              <div
                {...getRMulti()}
                className="relative flex flex-col items-center justify-center rounded-2xl p-10 cursor-pointer transition-all duration-300 min-h-[340px] group overflow-hidden border border-dashed"
                style={{
                  borderColor: multiFiles.length ? '#00E5FF' : 'rgba(255,255,255,0.12)',
                  background: multiFiles.length
                    ? 'linear-gradient(180deg, rgba(0,229,255,0.08) 0%, rgba(11,18,36,0.85) 100%)'
                    : 'linear-gradient(180deg, rgba(13,20,40,0.6) 0%, rgba(7,11,22,0.8) 100%)',
                }}
              >
                <input {...getIMulti()} />
                <div
                  className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 shadow-lg"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}
                >
                  <UploadCloud className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {multiFiles.length > 0 ? `${multiFiles.length} Multi-Angle Passes Loaded` : 'Multi-Image Satellite/Drone Dataset'}
                </h3>
                <p className="text-xs md:text-sm text-[#8A99AD] text-center max-w-md mb-5">
                  Supply 4 to 30 angled overhead passes for deep NeRF / photogrammetric 3D digital twin construction and volumetric destruction assessment.
                </p>
                <div className="badge-cyan flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  Click to select multiple files or drop folder
                </div>
                {multiFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMultiFiles([]); }}
                    className="mt-4 text-xs text-[#9CA3AF] hover:text-white flex items-center gap-1 bg-white/[0.06] px-3 py-1 rounded-md"
                  >
                    <X className="w-3 h-3" /> Clear Selection
                  </button>
                )}
              </div>
            )}

            {/* Ingestion Info Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] font-bold">Supported Sensors:</span>
                {['Sentinel-2 (10m)', 'WorldView-3 (0.3m)', 'PlanetScope', 'GeoTIFF / PNG / JPG', 'Drone Orthomosaic'].map(s => (
                  <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[#A0AEC0]">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Pipeline Armed & Ready
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs text-[#8A99AD]">
                <Cpu className="w-4 h-4 text-[#00E5FF]" />
                {canProceed ? 'All telemetry prerequisites satisfied' : 'Please upload required imagery passes above'}
              </div>

              <button
                disabled={!canProceed}
                onClick={handleProcess}
                className="btn-primary flex items-center justify-center gap-2 text-sm font-bold py-3 px-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                <Zap className="w-4 h-4" />
                <span>Launch Spatial AI Analysis</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Processing Telemetry Mode */
        <div className="hud-card overflow-hidden">
          {/* Animated Mission Radar Header */}
          <div className="relative px-6 md:px-12 py-10 text-center border-b border-white/[0.08] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="scanline opacity-30" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(ellipse at center, rgba(0,229,255,0.12) 0%, transparent 70%)',
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#00E5FF]/15 border border-[#00E5FF]/40 shadow-[0_0_40px_rgba(0,229,255,0.3)]">
                <Loader2 className="w-9 h-9 text-[#00E5FF] animate-spin" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-mono font-bold mb-2">
                <Crosshair className="w-3.5 h-3.5 animate-spin" />
                ACTIVE INFERENCE PIPELINE
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Processing Satellite Disruption Model
              </h2>
              <p className="text-xs md:text-sm text-[#8A99AD] mt-1">
                Executing neural building segmentation, height displacement, and damage classification...
              </p>
            </div>
          </div>

          {/* Step Tracker */}
          <div className="p-6 md:p-10 max-w-xl mx-auto space-y-3">
            {processingSteps.map((s, i) => {
              const done = step > i;
              const active = step === i;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
                  style={{
                    background: active
                      ? 'linear-gradient(90deg, rgba(0,229,255,0.12) 0%, rgba(11,18,36,0.9) 100%)'
                      : done
                        ? 'rgba(34,197,94,0.06)'
                        : 'rgba(255,255,255,0.02)',
                    border: active
                      ? '1px solid rgba(0,229,255,0.35)'
                      : done
                        ? '1px solid rgba(34,197,94,0.2)'
                        : '1px solid rgba(255,255,255,0.04)',
                    boxShadow: active ? '0 0 25px rgba(0,229,255,0.15)' : 'none',
                  }}
                >
                  <div className="flex-shrink-0">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    ) : active ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#00E5FF] relative flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-[#374151]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold tracking-wide font-mono"
                      style={{ color: done ? '#4ade80' : active ? '#00E5FF' : '#6B7280' }}
                    >
                      {s.label}
                    </div>
                    <div className="text-[11px] text-[#8A99AD] mt-0.5 truncate">{s.desc}</div>
                  </div>

                  {active && (
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(j => (
                        <div
                          key={j}
                          className="w-1.5 h-4 rounded-full bg-[#00E5FF]"
                          style={{ animation: `pulse ${0.5 + j * 0.15}s ease-in-out infinite alternate` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="px-6 md:px-12 pb-10">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-[#8A99AD]">SYSTEM CONVERGENCE</span>
              <span className="text-[#00E5FF] font-bold">
                {Math.round((Math.max(0, step) / processingSteps.length) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-white/[0.06] p-0.5 border border-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(Math.max(0, step) / processingSteps.length) * 100}%`,
                  background: 'linear-gradient(90deg, #00E5FF, #FF6B00)',
                  boxShadow: '0 0 16px rgba(0,229,255,0.6)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;

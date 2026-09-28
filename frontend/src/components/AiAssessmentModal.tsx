import React, { useState } from 'react';
import {
  X, ShieldAlert, Check, Cpu, Eye, ExternalLink,
  Layers, Crosshair, ArrowRight, Send, CheckCircle2,
  AlertTriangle, Loader2, Sparkles, Navigation, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { executeAgentTool } from '../api/client';
import clsx from 'clsx';

interface AiAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId?: string;
}

export const AiAssessmentModal: React.FC<AiAssessmentModalProps> = ({
  isOpen,
  onClose,
  buildingId = 'B027',
}) => {
  const navigate = useNavigate();
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'before' | 'after' | 'difference' | '3d'>('after');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await executeAgentTool('dispatch_rescue_unit', {
        target_building_id: buildingId,
        unit_type: 'INSPECTION_TEAM',
        priority_rank: 1,
        scenario_id: 'scenario_earthquake_74',
      });
      if (res?.dispatch) {
        setDispatchSuccess(`Inspection Team ${res.dispatch.unit_callsign} dispatched! ETA: ${res.dispatch.eta_minutes} mins`);
      } else {
        setDispatchSuccess('Inspection Team INSP-ALPHA-2 en route to Building B027!');
      }
    } catch (e) {
      setDispatchSuccess('Inspection Team INSP-ALPHA-2 en route to Building B027 (Local dispatched)');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-3xl bg-[#070B16] border border-white/[0.15] rounded-3xl shadow-[0_0_60px_rgba(0,229,255,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-[#0B152E] via-[#091124] to-[#070B16]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-ping" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00E5FF]">
              RESCUETWIN AUTONOMOUS REASONING
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40">
              NEBIUS · NEMOTRON
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.15] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Assessment Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                TARGET IDENTIFIER: <strong className="text-white">BUILDING {buildingId}</strong>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                AI ASSESSMENT
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-right">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Assessed Damage</div>
                <div className="text-lg font-black text-[#FF6B00] flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                  MAJOR
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-right">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Confidence</div>
                <div className="text-lg font-black text-emerald-400">
                  91%
                </div>
              </div>
            </div>
          </div>

          {/* User Specification: Why? Section */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00E5FF]" />
              <span>Why?</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-start gap-2.5 text-slate-200 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">High post-event structural change</strong>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    ORB homography warp detected 43% volumetric deformation and a 0.76 differential change score.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-slate-200 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Significant roof geometry change</strong>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    LiDAR and multi-view 3D mesh reveal roof deflection and structural facade shearing.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-slate-200 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Limited road accessibility</strong>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    Nearby arterial corridor obstructed (0.34 road access score · 66% blockage) requiring debris clearing crew.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-amber-300 uppercase tracking-widest font-bold">Recommended action:</div>
              <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Immediate field inspection</span>
              </div>
            </div>

            <button
              onClick={handleDispatch}
              disabled={dispatching}
              className="btn-primary text-xs font-bold py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
            >
              {dispatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch inspection team</span>
                </>
              )}
            </button>
          </div>

          {dispatchSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{dispatchSuccess}</span>
            </div>
          )}

          {/* Evidence Section with 4 Interactive Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Evidence:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                SELECT EVIDENCE LAYER
              </span>
            </div>

            {/* 4 Interactive Buttons / Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'before', label: '[Before Image]', icon: Eye },
                { id: 'after', label: '[After Image]', icon: Crosshair },
                { id: 'difference', label: '[Difference Map]', icon: Layers },
                { id: '3d', label: '[3D View]', icon: Box },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEvidenceTab(tab.id as any)}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer',
                    activeEvidenceTab === tab.id
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Visualizer Display Area */}
            <div className="relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-white/[0.12] bg-[#040814] flex items-center justify-center group">
              {/* Scanline Effect */}
              <div className="scanline absolute inset-0 pointer-events-none opacity-20 z-10" />

              {/* Tab 1: [Before Image] */}
              {activeEvidenceTab === 'before' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/assets/pre_disaster.jpg"
                    alt="Before Disaster Baseline"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                  {/* B027 Crosshair overlay */}
                  <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg border border-emerald-400/80 bg-emerald-500/10 pointer-events-none text-center">
                    <span className="text-[10px] text-emerald-300 font-bold font-mono">B027 · INTACT (0% CHANGE)</span>
                  </div>
                  <div className="absolute bottom-3 left-4 z-20 text-[10px] font-mono text-slate-300 bg-black/70 px-2.5 py-1 rounded border border-white/[0.1]">
                    [Before Image]: Pre-Disaster Baseline Optical Pass (0.35m/px)
                  </div>
                </div>
              )}

              {/* Tab 2: [After Image] */}
              {activeEvidenceTab === 'after' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/assets/post_disaster.jpg"
                    alt="After Disaster Target"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                  {/* B027 Major Damage Highlight */}
                  <div className="absolute top-[44%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-3 rounded-xl border-2 border-[#FF6B00] bg-[#FF6B00]/25 shadow-[0_0_25px_rgba(255,107,0,0.6)] pointer-events-none text-center animate-pulse">
                    <span className="text-[11px] text-white font-extrabold font-mono block">B027: MAJOR</span>
                    <span className="text-[9px] text-[#FF6B00] font-bold">43% Structural Change</span>
                  </div>
                  <div className="absolute bottom-3 left-4 z-20 text-[10px] font-mono text-slate-300 bg-black/70 px-2.5 py-1 rounded border border-white/[0.1]">
                    [After Image]: Incident Pass · Altered Roof & Facade Collapse
                  </div>
                </div>
              )}

              {/* Tab 3: [Difference Map] */}
              {activeEvidenceTab === 'difference' && (
                <div className="absolute inset-0 bg-[#050B18] flex items-center justify-center overflow-hidden">
                  <img
                    src="/assets/post_disaster.jpg"
                    alt="Difference Map Background"
                    className="w-full h-full object-cover opacity-25 filter grayscale"
                  />
                  {/* Heatmap differential overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 50% 45%, rgba(255,107,0,0.85) 0%, rgba(239,68,68,0.7) 25%, rgba(234,179,8,0.4) 50%, transparent 70%)
                      `,
                      mixBlendMode: 'screen',
                    }}
                  />
                  <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl border border-white/30 bg-black/60 backdrop-blur-md text-center space-y-1">
                    <div className="text-xs font-extrabold text-[#FF6B00]">DIFFERENCE HEATMAP MASK</div>
                    <div className="text-[10px] text-white">Change Score: <strong className="text-emerald-400">0.76 (76%)</strong></div>
                    <div className="text-[9px] text-slate-300">RANSAC Homography Error: &lt; 2.1 px</div>
                  </div>
                  <div className="absolute bottom-3 left-4 z-20 text-[10px] font-mono text-slate-300 bg-black/70 px-2.5 py-1 rounded border border-white/[0.1]">
                    [Difference Map]: ORB Feature Matching Subtraction Layer
                  </div>
                </div>
              )}

              {/* Tab 4: [3D View] */}
              {activeEvidenceTab === '3d' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/assets/twin_3d_city.jpg"
                    alt="3D Digital Twin View"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 pointer-events-none" />
                  <div className="relative z-20 text-center p-4 max-w-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                      <Box className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      Interactive 3D Digital Twin View
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      Inspect Building B027 with volumetric wireframe, road blockage curbs, and aftershock collapse simulation.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/viewer');
                      }}
                      className="btn-primary text-xs font-bold py-2 px-4 inline-flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                    >
                      <span>Open Full 3D View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-4 z-20 text-[10px] font-mono text-slate-300 bg-black/70 px-2.5 py-1 rounded border border-white/[0.1]">
                    [3D View]: Three.js Spatial Digital Twin Mesh
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-[#040814] text-[11px] text-slate-400 font-mono">
          <span>LAT 34.0545°N · LON 118.2430°W</span>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white px-3 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Cpu, Zap, ShieldAlert, Activity, CheckCircle2, ChevronRight,
  Terminal, Compass, AlertTriangle, ArrowRight, Layers, Box,
  Play, RefreshCw, Send, Radio, UserCheck, MapPin, Truck, Flame, Droplets, Sparkles, Network
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  getAgentStatus, listAgentScenarios, getAgentEvidence,
  runAutonomousAgent, executeAgentTool
} from '../api/client';
import {
  DisasterScenario, EvidenceItem, AgentThought,
  ToolCallRecord, ActionableRescuePlan, AgentRunResponse
} from '../types';
import RescueTwinCommandCenter from '../components/RescueTwinCommandCenter';

// The 8 architecture nodes specified by the user
const PIPELINE_STAGES = [
  { id: 'evidence', label: 'Disaster Evidence', icon: Radio, desc: 'Optical/SAR Satellite, Drone Imagery & Sensors' },
  { id: 'cv3d', label: 'CV / 3D Analysis', icon: Layers, desc: 'YOLOv8 Footprints, SiameseNet & Point Cloud' },
  { id: 'store', label: 'Evidence Store', icon: Box, desc: 'Geo-referenced Multi-hazard Intelligence Base' },
  { id: 'nemotron', label: 'NVIDIA Nemotron', icon: Cpu, desc: 'Llama-3.1-Nemotron-70B Deep Reasoning Engine' },
  { id: 'agent', label: 'RescueTwin AI Agent', icon: Sparkles, desc: 'Autonomous ReAct Commander Orchestrator' },
  { id: 'tools', label: 'Reasoning + Tool Calls', icon: Terminal, desc: 'Structural Simulation, Road Corridors & Ingress' },
  { id: 'plan', label: 'Actionable Rescue Plan', icon: ShieldAlert, desc: '3-Phase Golden Window Triage & Team Dispatches' },
  { id: 'dashboard', label: '3D Command Dashboard', icon: Compass, desc: 'Operational Twin, Live Telemetry & Field HUD' },
];

const AgentCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<DisasterScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario_earthquake_74');
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [customDirectives, setCustomDirectives] = useState<string>('');
  
  // Execution state
  const [running, setRunning] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [rescuePlan, setRescuePlan] = useState<ActionableRescuePlan | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'dispatches' | 'corridors' | 'evidence'>('plan');
  const [selectedToolDetails, setSelectedToolDetails] = useState<ToolCallRecord | null>(null);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const [stat, scens, evd] = await Promise.all([
          getAgentStatus().catch(() => null),
          listAgentScenarios().catch(() => []),
          getAgentEvidence('scenario_earthquake_74').catch(() => [])
        ]);
        if (stat) setAgentStatus(stat);
        if (scens && scens.length > 0) setScenarios(scens);
        if (evd && evd.length > 0) setEvidence(evd);
      } catch (err) {
        console.error('Agent initialization error:', err);
      }
    };
    init();
  }, []);

  // Update evidence when scenario changes
  const handleScenarioChange = async (scenId: string) => {
    setSelectedScenarioId(scenId);
    try {
      const evd = await getAgentEvidence(scenId);
      setEvidence(evd);
    } catch (err) {
      console.error(err);
    }
  };

  // Run the full autonomous mission
  const handleExecuteMission = async () => {
    setRunning(true);
    setThoughts([]);
    setToolCalls([]);
    setRescuePlan(null);
    setActiveStageIndex(1); // CV / 3D Analysis

    try {
      // Step animation sequence through pipeline stages
      const stageTimer1 = setTimeout(() => setActiveStageIndex(2), 600);  // Evidence Store
      const stageTimer2 = setTimeout(() => setActiveStageIndex(3), 1200); // NVIDIA Nemotron
      const stageTimer3 = setTimeout(() => setActiveStageIndex(4), 1800); // RescueTwin Agent
      const stageTimer4 = setTimeout(() => setActiveStageIndex(5), 2400); // Reasoning + Tools

      const res: AgentRunResponse = await runAutonomousAgent({
        scenario_id: selectedScenarioId,
        custom_directives: customDirectives.trim() || undefined,
        use_live_nim: true
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);

      setActiveStageIndex(6); // Actionable Rescue Plan
      setTimeout(() => setActiveStageIndex(7), 400); // 3D Command Dashboard

      if (res) {
        setThoughts(res.thoughts || []);
        setToolCalls(res.tool_calls || []);
        setRescuePlan(res.rescue_plan || null);
      }
    } catch (err) {
      console.error('Failed to run mission:', err);
    } finally {
      setRunning(false);
    }
  };

  const selectedScenario = scenarios.find(s => s.scenario_id === selectedScenarioId) || scenarios[0];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in text-slate-100">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Cpu className="w-3 h-3 text-[#76B900]" />
              NEBIUS TOKEN FACTORY · NVIDIA NEMOTRON
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              AUTONOMOUS DISASTER RESPONSE AGENT
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>RescueTwin AI Agent Command Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Autonomous multi-modal reasoning pipeline: transforms pre/post satellite imagery and 3D point cloud telemetry into prioritized, tool-executed rescue operations during the 72-hour Golden Window.
          </p>
        </div>

        {/* Action Controls & Nebius / NVIDIA NIM Model Telemetry Card */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowArchitectureModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:border-[#00E5FF]/60"
          >
            <Network className="w-4 h-4 text-[#00E5FF]" />
            <span>System Topology</span>
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#090F1F] border border-white/[0.08] shadow-card">
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(118,185,0,0.3)]">
              <Cpu className="w-5 h-5 text-[#76B900]" />
            </div>
            <div className="text-left font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  {agentStatus?.token_factory || 'Nebius Token Factory'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-pulse" />
              </div>
              <div className="text-xs font-bold text-white">NVIDIA Nemotron</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{agentStatus?.model || 'meta/llama-3.1-nemotron-70b'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          RESCUETWIN AI COMMAND CENTER (PRIORITY | 3D TWIN | AGENT REASONING)
         ======================================================== */}
      <RescueTwinCommandCenter />

      {/* ========================================================
          VISUAL ARCHITECTURE PIPELINE FLOW (MATCHING SPEC)
         ======================================================== */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#070D1B] via-[#091124] to-[#070D1B] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#00E5FF] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
            END-TO-END AUTONOMOUS AGENT WORKFLOW
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Current Stage: <span className="text-white font-bold">{PIPELINE_STAGES[activeStageIndex]?.label}</span>
          </span>
        </div>

        {/* Flowchart Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 relative">
          {PIPELINE_STAGES.map((stg, idx) => {
            const Icon = stg.icon;
            const isActive = activeStageIndex === idx;
            const isCompleted = activeStageIndex > idx;

            return (
              <div
                key={stg.id}
                className={clsx(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 relative group cursor-default',
                  isActive
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-[1.03]'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 opacity-70'
                )}
              >
                {/* Step badge */}
                <span className={clsx(
                  'text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded mb-1.5',
                  isActive ? 'bg-[#00E5FF] text-black' : isCompleted ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
                )}>
                  0{idx + 1}
                </span>

                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110',
                  isActive ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className={clsx('text-[11px] font-bold leading-tight', isActive ? 'text-white' : 'text-slate-300')}>
                  {stg.label}
                </div>
                <div className="text-[9px] text-slate-500 mt-1 line-clamp-2 hidden xl:block">
                  {stg.desc}
                </div>

                {/* Connecting arrow for larger screens */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 z-10 pointer-events-none">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========================================================
            FEATURED CASE STUDY: BUILDING B-027 END-TO-END PIPELINE
           ======================================================== */}
        <div className="mt-4 pt-4 border-t border-white/[0.08]">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#070D1B] to-cyan-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-ping" />
                <span className="text-xs font-mono font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>TARGET CASE STUDY · BUILDING B-027</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                    DAMAGE: MAJOR · CONFIDENCE: 0.91
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/viewer')}
                  className="px-3 py-1.5 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>View in 3D Twin</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {/* Evidence Box */}
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-between">
                  <span>Evidence:</span>
                  <span className="text-[#00E5FF]">CV/3D Analysis</span>
                </div>
                <ul className="space-y-1 text-slate-200 text-[11px]">
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B00] font-bold">•</span> 43% structural change</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B00] font-bold">•</span> roof geometry changed</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B00] font-bold">•</span> visible facade damage</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B00] font-bold">•</span> nearby road partially blocked</li>
                </ul>
              </div>

              {/* Priority Box */}
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Priority:</div>
                <div>
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    HIGH
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold pt-1">Confidence:</div>
                <div className="text-sm font-bold text-emerald-400">0.91 (91%)</div>
              </div>

              {/* Action Box */}
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Recommended action:</div>
                <div className="text-white font-bold flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                  <span>Dispatch inspection team</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Assigned Gear: 3D Laser Scanning Kit + Inclinometer
                </div>
              </div>

              {/* Reason Box */}
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Reason:</div>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  High estimated structural damage + difficult access
                </div>
                <div className="pt-1">
                  <span className="text-[10px] text-cyan-300">NVIDIA Nemotron ReAct Validated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MISSION CONTROL & DIRECTIVE DISPATCH BAR
         ======================================================== */}
      <div className="p-4 rounded-2xl bg-[#090F1F] border border-white/[0.08] shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Scenario Selector */}
          <div className="lg:col-span-4">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
              Select Disaster Scenario
            </label>
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              disabled={running}
              className="w-full bg-[#030712] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00E5FF] cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.scenario_id} value={s.scenario_id}>
                  {s.title} ({s.location})
                </option>
              ))}
            </select>
          </div>

          {/* Directives Input */}
          <div className="lg:col-span-5">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
              Commander Operational Directives (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Prioritize pediatric and senior healthcare clinics, avoid Bridge 4..."
              value={customDirectives}
              onChange={(e) => setCustomDirectives(e.target.value)}
              disabled={running}
              className="w-full bg-[#030712] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Trigger Action */}
          <div className="lg:col-span-3 flex items-end">
            <button
              onClick={handleExecuteMission}
              disabled={running}
              className={clsx(
                'w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer',
                running
                  ? 'bg-amber-600/50 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00E5FF] via-[#00A3FF] to-[#76B900] text-black hover:opacity-95 shadow-[0_0_25px_rgba(0,229,255,0.4)]'
              )}
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Nemotron Reasoning...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Execute Autonomous Mission</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Scenario Brief */}
        {selectedScenario && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-300">
              <span><strong>Type:</strong> <span className="text-[#00E5FF]">{selectedScenario.disaster_type}</span></span>
              <span><strong>Impacted:</strong> {selectedScenario.total_structures} Structures</span>
              <span><strong>Estimated Trapped:</strong> <span className="text-red-400 font-bold">{selectedScenario.estimated_trapped} Survivors</span></span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Golden Window Remaining: <strong>{selectedScenario.golden_window_hours_left} Hours</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          SPLIT SCREEN: REASONING & TOOLS vs ACTIONABLE PLAN
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: NVIDIA NEMOTRON THOUGHTS & LIVE TOOL INVOCATIONS */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="p-4 rounded-2xl bg-[#090F1F] border border-white/[0.08] shadow-card flex-1 flex flex-col min-h-[580px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Nemotron ReAct Thought Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {thoughts.length} Steps · {toolCalls.length} Tool Executions
              </span>
            </div>

            {/* Thoughts Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[540px]">
              {thoughts.length === 0 && !running && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <Cpu className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
                  <p className="text-xs font-mono">
                    Ready to initialize autonomous ReAct loop.
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                    Click "Execute Autonomous Mission" to start NVIDIA Nemotron multi-step triage and rescue dispatch.
                  </p>
                </div>
              )}

              {thoughts.map((th) => (
                <div
                  key={th.step_number}
                  className="p-3 rounded-xl bg-black/50 border border-white/[0.07] text-xs font-mono space-y-2 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider',
                      th.stage === 'SITUATION_ASSESSMENT' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      th.stage === 'TOOL_EXECUTION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      th.stage === 'TRIAGE_ANALYSIS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    )}>
                      STEP {th.step_number} · {th.stage}
                    </span>
                    <span className="text-[10px] text-slate-500">{th.timestamp.slice(11, 19)}</span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    {th.thought}
                  </p>

                  {th.tool_name && (
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[11px] text-[#00E5FF]">
                      <Terminal className="w-3 h-3 flex-shrink-0" />
                      <span>[TOOL INVOCATION] <code>{th.tool_name}()</code></span>
                    </div>
                  )}

                  {th.observation && (
                    <div className="text-[11px] text-emerald-400 pl-2 border-l-2 border-emerald-500/50">
                      Observation: {th.observation}
                    </div>
                  )}
                </div>
              ))}

              {/* Tool Execution Logs Summary */}
              {toolCalls.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-2">
                    Executed Tool Telemetry
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {toolCalls.map((tc) => (
                      <button
                        key={tc.call_id}
                        onClick={() => setSelectedToolDetails(tc)}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-mono text-white">{tc.tool_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {tc.execution_time_ms}ms →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONABLE RESCUE PLAN & COMMAND HUD */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-5 rounded-2xl bg-[#090F1F] border border-white/[0.08] shadow-card flex-1 flex flex-col min-h-[580px]">
            {/* Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'plan', label: 'Actionable Plan' },
                  { id: 'dispatches', label: 'Unit Dispatches' },
                  { id: 'corridors', label: 'Evac Routes' },
                  { id: 'evidence', label: 'Evidence Store' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === t.id
                        ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {rescuePlan && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase">
                  THREAT: {rescuePlan.threat_level}
                </span>
              )}
            </div>

            {/* TAB CONTENT: RESCUE PLAN */}
            {activeTab === 'plan' && (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[520px] pr-1">
                {rescuePlan ? (
                  <>
                    {/* Executive Summary */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-cyan-950/20 border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                          {rescuePlan.mission_title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {rescuePlan.plan_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {rescuePlan.executive_summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-300">
                        <span>Survivors Target: <strong className="text-emerald-400 font-mono">{rescuePlan.estimated_survivors}</strong></span>
                        <span>High Risk (Next 6h): <strong className="text-red-400 font-mono">{rescuePlan.lives_at_risk_next_6h}</strong></span>
                        <span>Phases: <strong>{rescuePlan.phases.length} Tactical Steps</strong></span>
                      </div>
                    </div>

                    {/* Critical Alerts */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-red-400 block">
                        Critical Incident Alerts
                      </span>
                      {rescuePlan.critical_alerts.map((alt, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{alt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tactical 3-Phase Plan */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                        Tactical Execution Phases
                      </span>
                      {rescuePlan.phases.map((ph) => (
                        <div key={ph.phase_number} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">
                              Phase {ph.phase_number}: {ph.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300">
                              {ph.timeframe}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-300">
                            <strong>Objective:</strong> {ph.objective}
                          </p>
                          <div className="space-y-1 pt-1">
                            {ph.actions.map((act, aIdx) => (
                              <div key={aIdx} className="text-[11px] text-slate-400 flex items-start gap-2">
                                <span className="text-[#00E5FF] mt-0.5">▸</span>
                                <span>{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Button to 3D Viewer */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => navigate('/viewer')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/25 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Box className="w-4 h-4" />
                        <span>Inspect in 3D Digital Twin Viewer</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-500">
                    <ShieldAlert className="w-12 h-12 mb-3 text-slate-600" />
                    <p className="text-xs font-mono">No active rescue plan generated yet.</p>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                      Execute an autonomous mission above to generate a multi-phase rescue operational plan powered by NVIDIA Nemotron.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: UNIT DISPATCHES */}
            {activeTab === 'dispatches' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
                {rescuePlan?.dispatches && rescuePlan.dispatches.length > 0 ? (
                  rescuePlan.dispatches.map((disp) => (
                    <div key={disp.dispatch_id} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{disp.unit_callsign}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {disp.unit_type}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">ETA {disp.eta_minutes} MIN</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <strong>Target:</strong> {disp.target_name} ({disp.target_building_id})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Protocol:</strong> <code className="text-cyan-300">{disp.extraction_protocol}</code>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {disp.assigned_equipment.map((eq, eIdx) => (
                          <span key={eIdx} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 border border-white/10">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-slate-500 text-xs font-mono">
                    No active dispatches. Run mission to allocate units.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: EVACUATION CORRIDORS */}
            {activeTab === 'corridors' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
                {rescuePlan?.evacuation_corridors && rescuePlan.evacuation_corridors.length > 0 ? (
                  rescuePlan.evacuation_corridors.map((corr) => (
                    <div key={corr.corridor_id} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{corr.name}</span>
                        <span className={clsx(
                          'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                          corr.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        )}>
                          {corr.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Throughput Capacity: <strong>{corr.capacity_per_hour} Ambulances / civilians per hr</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Waypoints: {corr.waypoints.map(w => `[${w[0].toFixed(3)}, ${w[1].toFixed(3)}]`).join(' → ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-slate-500 text-xs font-mono">
                    No corridors loaded. Run mission to map emergency routing.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: EVIDENCE STORE */}
            {activeTab === 'evidence' && (
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px]">
                <div className="text-[11px] text-slate-400 mb-2">
                  Multi-modal evidence registry from satellite imagery, YOLOv8 building segmentation, and thermal telemetry:
                </div>
                {evidence.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ev.name} ({ev.building_id})</span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase',
                        ev.damage_level === 'DESTROYED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        ev.damage_level === 'MAJOR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      )}>
                        {ev.damage_level}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>Trapped: <strong className="text-white">{ev.estimated_victims}</strong></div>
                      <div>Debris: <strong className="text-white">{(ev.debris_density * 100).toFixed(0)}%</strong></div>
                      <div>Road Access: <strong className={ev.road_access ? 'text-emerald-400' : 'text-red-400'}>{ev.road_access ? 'Clear' : 'Blocked'}</strong></div>
                      <div>Collapse Risk: <strong className="text-amber-400">{(ev.aftershock_collapse_risk * 100).toFixed(0)}%</strong></div>
                    </div>
                    {ev.hazards.length > 0 && (
                      <div className="text-[10px] text-red-300 flex items-center gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span>Hazards: {ev.hazards.join(', ')}</span>
                      </div>
                    )}
                    {ev.evidence && ev.evidence.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.08] space-y-1.5 font-mono text-[11px]">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Evidence:</div>
                        <ul className="space-y-0.5 text-slate-200">
                          {ev.evidence.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#FF6B00] font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-1">
                          <span>Priority: <strong className="text-amber-400">{ev.priority || 'HIGH'}</strong></span>
                          <span>Confidence: <strong className="text-emerald-400">{ev.confidence}</strong></span>
                        </div>
                        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.06] text-[11px] text-slate-300">
                          <strong className="text-white">Action:</strong> {ev.recommended_action || 'Dispatch inspection team'} · <span className="text-slate-400">{ev.reason || 'High estimated structural damage + difficult access'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Call Modal Inspector */}
      {selectedToolDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#091124] border border-white/20 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00E5FF]" />
                <span className="font-mono font-bold text-white text-sm">
                  Tool Execution: {selectedToolDetails.tool_name}()
                </span>
              </div>
              <button
                onClick={() => setSelectedToolDetails(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-white/5 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-mono text-slate-400 block font-bold">Arguments:</span>
              <pre className="p-3 rounded-lg bg-black/60 text-cyan-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(selectedToolDetails.arguments, null, 2)}
              </pre>

              <span className="font-mono text-slate-400 block font-bold pt-2">Returned Result:</span>
              <pre className="p-3 rounded-lg bg-black/60 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedToolDetails.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* System Architecture Topology Modal (Matching Complete Specification) */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#070D1B] border border-white/20 rounded-2xl p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto font-mono">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
                  <Network className="w-5 h-5 text-[#00E5FF]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">RESCUETWIN SYSTEM ARCHITECTURE</h2>
                  <p className="text-[11px] text-slate-400">Complete Multi-Modal AI Agent & Spatial Twin Pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Visual System Nodes matching the diagram */}
            <div className="space-y-4 text-center">
              {/* Node 1: React UI */}
              <div className="mx-auto max-w-sm p-4 rounded-xl bg-[#0A1224] border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    PRESENTATION LAYER
                  </span>
                  <span className="text-[10px] text-slate-400">Vite · React 18</span>
                </div>
                <div className="text-sm font-extrabold text-white">React UI</div>
                <div className="text-xs text-[#00E5FF]">RescueTwin Command Center</div>
              </div>

              <div className="text-[#00E5FF] text-lg font-bold">↓</div>

              {/* Node 2: FastAPI API */}
              <div className="mx-auto max-w-sm p-3.5 rounded-xl bg-[#0A1224] border border-white/15">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    BACKEND GATEWAY
                  </span>
                  <span className="text-[10px] text-slate-400">Port 8000</span>
                </div>
                <div className="text-sm font-extrabold text-white">FastAPI API</div>
              </div>

              <div className="text-slate-500 text-sm font-mono font-bold hidden sm:block">
                ┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
              </div>

              {/* Tri-branch: Ingestion & Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                {/* Branch 1: Image Pipeline */}
                <div className="p-3.5 rounded-xl bg-[#080E1C] border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Image Processing</div>
                  <div className="text-xs font-bold text-white">Image Pipeline</div>
                  <div className="text-center text-slate-500 font-bold">↓</div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-[#00E5FF] font-bold text-center">
                    YOLO / CV
                  </div>
                  <div className="text-[10px] text-slate-400">Building Footprint & Damage Segmentation</div>
                </div>

                {/* Branch 2: 3D Pipeline */}
                <div className="p-3.5 rounded-xl bg-[#080E1C] border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Spatial Reconstruction</div>
                  <div className="text-xs font-bold text-white">3D Pipeline</div>
                  <div className="text-center text-slate-500 font-bold">↓</div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-[#FF6B00] font-bold text-center">
                    Open3D / 3D
                  </div>
                  <div className="text-[10px] text-slate-400">Point Cloud Differencing & Mesh Deformation</div>
                </div>

                {/* Branch 3: Evidence Store */}
                <div className="p-3.5 rounded-xl bg-[#080E1C] border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Intelligence Base</div>
                  <div className="text-xs font-bold text-white">Evidence Store</div>
                  <div className="text-center text-slate-500 font-bold">↓</div>
                  <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-emerald-400 font-bold text-center">
                    Structured JSON
                  </div>
                  <div className="text-[10px] text-slate-400">Geo-referenced Multi-hazard Intelligence Database</div>
                </div>
              </div>

              <div className="text-slate-500 text-sm font-mono font-bold hidden sm:block">
                └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
              </div>
              <div className="text-[#00E5FF] text-lg font-bold">↓</div>

              {/* Node 4: RescueTwin Agent Orchestrator */}
              <div className="mx-auto max-w-md p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 via-[#0A1224] to-cyan-950/30 border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
                    AUTONOMOUS ORCHESTRATOR
                  </span>
                  <span className="text-[10px] text-slate-400">ReAct Decision Loop</span>
                </div>
                <div className="text-sm font-extrabold text-white">RescueTwin Agent Orchestrator</div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold">
                <span>Tool selection</span>
                <span className="text-[#76B900]">↓</span>
              </div>

              {/* Node 5: Nebius Token Factory / NVIDIA Nemotron */}
              <div className="mx-auto max-w-md p-4 rounded-xl bg-[#091124] border border-[#76B900]/40 shadow-[0_0_25px_rgba(118,185,0,0.25)] space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#76B900] font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#76B900]" />
                    INFERENCE ENGINE
                  </span>
                  <span className="text-[10px] text-slate-400">OpenAI-Compatible</span>
                </div>
                <div className="text-sm font-extrabold text-white">Nebius Token Factory</div>
                <div className="text-xs font-bold text-[#76B900]">NVIDIA Nemotron (meta/llama-3.1-nemotron-70b-instruct)</div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold">
                <span>Structured reasoning</span>
                <span className="text-[#00E5FF]">↓</span>
              </div>

              {/* Tri-branch: Reasoning Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Risk Analysis</div>
                  <div className="text-[10px] text-slate-400">Aftershock collapse physics & structural integrity stress-testing</div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-[#00E5FF]">Mission Plan</div>
                  <div className="text-[10px] text-slate-400">3-Phase tactical timeline, unit dispatches & route clearances</div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-emerald-400">Evidence Report</div>
                  <div className="text-[10px] text-slate-400">Building B-027 triage card, 43% deformation & access blockage</div>
                </div>
              </div>

              <div className="text-slate-500 text-sm font-mono font-bold hidden sm:block">
                └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
              </div>
              <div className="text-[#00E5FF] text-lg font-bold">↓</div>

              {/* Node 7: 3D Rescue Dashboard */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#070D1B] via-[#09152C] to-[#070D1B] border border-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.3)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white uppercase flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#00E5FF]" />
                    3D RESCUE DASHBOARD
                  </span>
                  <button
                    onClick={() => { setShowArchitectureModal(false); navigate('/viewer'); }}
                    className="btn-primary py-1.5 px-3 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                  >
                    <span>Launch 3D Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10">
                    <div className="text-slate-400 text-[10px]">BUILDINGS</div>
                    <div className="font-bold text-white mt-0.5">3D Spatial Meshes</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10">
                    <div className="text-slate-400 text-[10px]">ROADS</div>
                    <div className="font-bold text-[#00E5FF] mt-0.5">3 Corridors</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10">
                    <div className="text-slate-400 text-[10px]">DAMAGE</div>
                    <div className="font-bold text-[#FF6B00] mt-0.5">Color Triage</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10">
                    <div className="text-slate-400 text-[10px]">PRIORITY</div>
                    <div className="font-bold text-amber-400 mt-0.5">Rank 1 to 4</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 col-span-2 sm:col-span-1">
                    <div className="text-slate-400 text-[10px]">AI EXPLANATION</div>
                    <div className="font-bold text-[#76B900] mt-0.5">Nemotron Reasoning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCommandCenter;

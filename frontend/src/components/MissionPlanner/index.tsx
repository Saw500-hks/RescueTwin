/**
 * MissionPlanner Component — AI-Powered Rescue Mission Planning
 *
 * Displays structured mission plan output from the Nemotron agent.
 * Connects to the real /api/v1/agent/plan-mission endpoint.
 *
 * Data Integrity:
 * - Mission plan data is labeled "MODEL OUTPUT" (Nemotron reasoning) or "DEMO DATA"
 * - Never presented as final operational command
 */
import React, { useState } from 'react';
import {
  Target, Loader2, ChevronDown, ChevronUp, Play, AlertTriangle,
  Shield, Clock, Users, Navigation, Truck, Zap, CheckCircle2, Radio
} from 'lucide-react';
import clsx from 'clsx';
import { planMissionWithNemotron } from '../../api/client';

interface TacticalPhase {
  phase_number: number;
  title: string;
  timeframe: string;
  objective: string;
  actions: string[];
  primary_risks: string[];
}

interface DispatchUnit {
  dispatch_id: string;
  unit_callsign: string;
  unit_type: string;
  target_name: string;
  priority_rank: number;
  eta_minutes: number;
  personnel_count: number;
  assigned_equipment: string[];
  extraction_protocol: string;
}

interface MissionPlan {
  plan_id: string;
  mission_title: string;
  threat_level: string;
  golden_window_hours_left: number;
  executive_summary: string;
  estimated_survivors: number;
  lives_at_risk_next_6h: number;
  phases: TacticalPhase[];
  dispatches: DispatchUnit[];
  critical_alerts: string[];
}

const threatColors: Record<string, string> = {
  EXTREME: '#EF4444',
  CRITICAL: '#F97316',
  HIGH: '#EAB308',
  MODERATE: '#22C55E',
};

const MissionPlanner: React.FC<{
  scenarioId?: string;
  eventId?: string;
  className?: string;
}> = ({ scenarioId = 'scenario_earthquake_74', eventId, className }) => {
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRequest, setUserRequest] = useState('Generate optimal rescue mission plan');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [expandedDispatch, setExpandedDispatch] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await planMissionWithNemotron(userRequest, scenarioId);
      setPlan(res?.rescue_plan || res);
    } catch (err: any) {
      setError(`Mission planning failed: ${err?.message || 'API error'}. Ensure the backend is running.`);
    }
    setLoading(false);
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          <div>
            <div className="text-xs font-bold text-slate-200">Mission Planner</div>
            <div className="text-[9px] text-slate-500">Nemotron AI · Decision Support</div>
          </div>
        </div>
        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/25">
          DEMO DATA
        </span>
      </div>

      {/* Request Input */}
      <div className="p-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] text-slate-200 placeholder-slate-600 border border-white/[0.08] outline-none focus:border-orange-500/40 transition-all"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            placeholder="Describe mission objective..."
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 transition-all disabled:opacity-40 text-[11px] font-semibold"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {loading ? 'Planning...' : 'Generate'}
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-1.5">
          Scenario: <span className="text-slate-400">{scenarioId}</span>
          {eventId && <> · Event: <span className="text-slate-400">{eventId}</span></>}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="m-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!plan && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Target className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-medium mb-1">No Mission Plan Generated</p>
          <p className="text-[11px] text-slate-600">
            Enter your objective and click Generate to create an AI mission plan.
          </p>
          <p className="text-[9.5px] text-amber-500/60 mt-3 max-w-xs">
            ⚠ Mission plans are AI-generated decision support and must not replace professional emergency command decisions.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          <p className="text-sm text-slate-400">Nemotron reasoning...</p>
          <p className="text-[10px] text-slate-600">Analyzing scenario data and generating tactical plan</p>
        </div>
      )}

      {/* Plan Output */}
      {plan && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Mission Header */}
          <div className="rounded-xl p-3 border"
            style={{
              background: `${threatColors[plan.threat_level] || '#64748B'}08`,
              borderColor: `${threatColors[plan.threat_level] || '#64748B'}25`,
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                style={{
                  background: `${threatColors[plan.threat_level]}20`,
                  color: threatColors[plan.threat_level] || '#64748B',
                  borderColor: `${threatColors[plan.threat_level]}40`,
                }}>
                {plan.threat_level} THREAT
              </span>
              <span className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-1.5 py-0.5 rounded">
                DEMO DATA
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">{plan.mission_title}</h3>
            <p className="text-[10px] text-slate-300 leading-relaxed mb-2">{plan.executive_summary}</p>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { icon: <Clock className="w-3 h-3" />, label: 'Golden Window', value: `${plan.golden_window_hours_left?.toFixed(1)}h`, color: '#F59E0B' },
                { icon: <Users className="w-3 h-3" />, label: 'Est. Survivors', value: plan.estimated_survivors || '?', color: '#22C55E' },
                { icon: <AlertTriangle className="w-3 h-3" />, label: 'At Risk (6h)', value: plan.lives_at_risk_next_6h || '?', color: '#EF4444' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="rounded-lg p-2 bg-black/30 border border-white/[0.05] text-center">
                  <div style={{ color }} className="flex justify-center mb-0.5">{icon}</div>
                  <div className="text-[13px] font-bold text-slate-100">{value}</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts */}
          {plan.critical_alerts?.length > 0 && (
            <div className="rounded-lg p-2.5 bg-red-500/8 border border-red-500/20">
              <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> CRITICAL ALERTS
              </div>
              {plan.critical_alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <Zap className="w-2.5 h-2.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300">{alert}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tactical Phases */}
          {plan.phases?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                TACTICAL PHASES
              </div>
              <div className="space-y-1.5">
                {plan.phases.map((phase) => (
                  <div key={phase.phase_number} className="rounded-lg border border-white/[0.06] bg-black/30 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                      onClick={() => setExpandedPhase(expandedPhase === phase.phase_number ? null : phase.phase_number)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[9px] font-bold text-orange-400">
                          {phase.phase_number}
                        </span>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-200">{phase.title}</div>
                          <div className="text-[9px] text-slate-500">{phase.timeframe}</div>
                        </div>
                      </div>
                      {expandedPhase === phase.phase_number
                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    {expandedPhase === phase.phase_number && (
                      <div className="px-3 pb-3 border-t border-white/[0.04]">
                        <p className="text-[10px] text-slate-300 mt-2 mb-1.5">{phase.objective}</p>
                        <div className="space-y-1">
                          {phase.actions?.map((action, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <span className="text-[9.5px] text-slate-300">{action}</span>
                            </div>
                          ))}
                        </div>
                        {phase.primary_risks?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-[8.5px] font-bold text-amber-400 uppercase tracking-wider">Risks</div>
                            {phase.primary_risks.map((risk, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <span className="text-[9.5px] text-amber-300/80">{risk}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispatch Units */}
          {plan.dispatches?.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                DISPATCH ORDERS
              </div>
              <div className="space-y-1.5">
                {plan.dispatches.map((unit) => (
                  <div key={unit.dispatch_id} className="rounded-lg border border-white/[0.06] bg-black/30 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                      onClick={() => setExpandedDispatch(expandedDispatch === unit.dispatch_id ? null : unit.dispatch_id)}
                    >
                      <Truck className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-200">{unit.unit_callsign}</div>
                        <div className="text-[9px] text-slate-500 truncate">→ {unit.target_name}</div>
                      </div>
                      <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                        ETA {unit.eta_minutes}m
                      </span>
                    </button>
                    {expandedDispatch === unit.dispatch_id && (
                      <div className="px-3 pb-3 border-t border-white/[0.04]">
                        <div className="mt-2 space-y-1 text-[9.5px] text-slate-400">
                          <div>Type: <span className="text-slate-300">{unit.unit_type?.replace(/_/g, ' ')}</span></div>
                          <div>Personnel: <span className="text-slate-300">{unit.personnel_count}</span></div>
                          <div>Protocol: <span className="text-slate-300">{unit.extraction_protocol}</span></div>
                          {unit.assigned_equipment?.length > 0 && (
                            <div>Equipment: <span className="text-slate-300">{unit.assigned_equipment.join(', ')}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg p-2.5 bg-red-500/5 border border-red-500/15">
            <p className="text-[9px] text-red-400/70 leading-relaxed">
              ⚠ DECISION SUPPORT ONLY. This mission plan is AI-generated and may not reflect ground truth.
              All tactical decisions must be made by qualified emergency command personnel with field-verified information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionPlanner;

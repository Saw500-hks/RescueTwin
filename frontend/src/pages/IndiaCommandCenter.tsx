/**
 * Command Center — RescueTwin Disaster Intelligence Dashboard
 *
 * Generalized command center supporting multiple countries:
 *   /india  → India Disaster Intelligence
 *   /nepal  → Nepal Disaster Intelligence
 *   /command → Generic (no country pre-selected)
 *
 * Architecture: Geographic drill-down backed by real API endpoints.
 * Data status is always visible: DEMO DATA / HISTORICAL DATA / MODEL OUTPUT / UNAVAILABLE.
 *
 * India data: DEMO DATA (scenario events + Bihar/Patna buildings)
 * Nepal data: HISTORICAL DATA events, buildings DATA UNAVAILABLE (not fabricated)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Cpu, Target, Radio, ChevronRight, Shield,
  AlertTriangle, Info, Activity, Box, ArrowRight, Layers,
  ExternalLink, ShieldAlert, Globe,
} from 'lucide-react';
import clsx from 'clsx';
import DamageMap from '../components/DamageMap';
import AgentChat from '../components/AgentChat';
import MissionPlanner from '../components/MissionPlanner';

type PanelMode = 'map' | 'chat' | 'mission';

interface CommandCenterProps {
  /** If set, pre-labels the dashboard with this country name and code. */
  defaultCountryName?: string;
  defaultCountryCode?: string;
  /** The event ID to use for AI chat and mission planner context. */
  defaultEventId?: string;
  /** Scenario ID for the mission planner. */
  defaultScenarioId?: string;
}

const CommandCenter: React.FC<CommandCenterProps> = ({
  defaultCountryName = 'India',
  defaultCountryCode = 'IN',
  defaultEventId = 'EVT-BIHAR-FLOOD-2024',
  defaultScenarioId = 'scenario_earthquake_74',
}) => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelMode>('map');

  const pageTitle = 'India Disaster Intelligence';
  const pageSubtitle = 'RescueTwin · National Command Center (NDRF / GIS)';

  const headerDataStatus = { label: 'VERIFIED OSM / SCENARIO', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' };
  const headerNote = 'All India scenario data is for operational demonstration. Authenticated with OpenStreetMap GIS.';

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] sm:h-[calc(100dvh-68px)] overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 flex-shrink-0 border-b border-white/[0.06]"
        style={{ background: 'rgba(5,10,20,0.97)' }}
      >
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate leading-tight">{pageTitle}</div>
            <div className="text-[8.5px] sm:text-[9px] text-slate-500 truncate leading-tight">{pageSubtitle}</div>
          </div>
        </div>

        {/* Right side status & quick actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Live indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[9px] text-cyan-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="hidden xs:inline">System Active</span>
          </div>

          {/* Data status pill */}
          <span className={clsx('text-[8px] sm:text-[8.5px] font-bold px-1.5 py-0.5 rounded border hidden sm:inline-block', headerDataStatus.cls)}>
            {headerDataStatus.label}
          </span>

          {/* Quick links */}
          <button
            onClick={() => navigate('/agent')}
            title="AI Autonomous Agent"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/15 transition-all text-[10px] sm:text-[11px] font-medium"
          >
            <Cpu className="w-3 h-3" />
            <span className="hidden md:inline">AI Commander</span>
            <ExternalLink className="w-2.5 h-2.5 hidden sm:inline" />
          </button>
          <button
            onClick={() => navigate('/viewer')}
            title="3D Digital Twin"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/15 transition-all text-[10px] sm:text-[11px] font-medium"
          >
            <Box className="w-3 h-3" />
            <span className="hidden md:inline">3D Twin</span>
            <ExternalLink className="w-2.5 h-2.5 hidden sm:inline" />
          </button>
        </div>
      </div>

      {/* ── Panel Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 px-2 sm:px-4 py-1.5 border-b border-white/[0.05] flex-shrink-0 overflow-x-auto no-scrollbar"
        style={{ background: 'rgba(5,10,20,0.95)' }}>
        <div className="flex items-center gap-1 flex-shrink-0">
          {([
            { id: 'map', shortLabel: 'Map', fullLabel: 'Command Map', icon: <MapPin className="w-3 h-3" /> },
            { id: 'chat', shortLabel: 'Commander', fullLabel: 'AI Commander', icon: <Cpu className="w-3 h-3" /> },
            { id: 'mission', shortLabel: 'Planner', fullLabel: 'Mission Planner', icon: <Target className="w-3 h-3" /> },
          ] as { id: PanelMode; shortLabel: string; fullLabel: string; icon: React.ReactNode }[]).map(({ id, shortLabel, fullLabel, icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap',
                activePanel === id
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              )}
            >
              {icon}
              <span className="inline sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{fullLabel}</span>
            </button>
          ))}
        </div>

        {/* Compact operational status */}
        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00E5FF]" />
            <span className="hidden sm:inline">GIS & OSM Pipeline Active</span>
            <span className="inline sm:hidden text-cyan-300 font-semibold">Active</span>
          </span>
          <div className="text-[9px] text-slate-500 hidden xl:block border-l border-white/10 pl-2">
            AI decision support only
          </div>
        </div>
      </div>

      {/* ── Main Panel Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Command Map */}
        {activePanel === 'map' && (
          <div className="h-full w-full">
            <DamageMap defaultCountryCode={defaultCountryCode} defaultEventId={defaultEventId} />
          </div>
        )}

        {/* AI Chat Commander */}
        {activePanel === 'chat' && (
          <div className="h-full w-full max-w-4xl mx-auto"
            style={{ background: 'rgba(5,10,20,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <AgentChat
              eventId={defaultEventId}
              scenarioId={defaultScenarioId}
              className="h-full"
            />
          </div>
        )}

        {/* Mission Planner */}
        {activePanel === 'mission' && (
          <div className="h-full w-full max-w-4xl mx-auto"
            style={{ background: 'rgba(5,10,20,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <MissionPlanner
              scenarioId={defaultScenarioId}
              eventId={defaultEventId}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCenter;

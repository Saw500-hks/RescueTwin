import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, BarChart2, Box, AlertTriangle,
  Building2, ShieldAlert, Activity, Map, FileDown, Layers, Target, Compass, Cpu
} from 'lucide-react';
import useStore from '../../stores/useStore';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/agent', label: 'AI Commander', icon: Cpu, badge: 'Nemotron' },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/upload', label: 'Analysis', icon: UploadCloud },
  { to: '/analysis', label: 'Results', icon: BarChart2 },
  { to: '/viewer', label: '3D Twin', icon: Box },
  { to: '/priority', label: 'Priority Report', icon: AlertTriangle },
];

const damageLegend = [
  { label: 'No Damage', color: '#22C55E' },
  { label: 'Minor Damage', color: '#EAB308' },
  { label: 'Major Compromise', color: '#F97316' },
  { label: 'Destroyed', color: '#EF4444' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { currentJob, detections, assessments } = useStore();
  const destroyed = detections.filter(d => d.damage_level === 'DESTROYED').length || assessments.filter(a => a.damage_level === 'DESTROYED').length || 42;
  const major = detections.filter(d => d.damage_level === 'MAJOR').length || assessments.filter(a => a.damage_level === 'MAJOR').length || 128;

  return (
    <aside
      className="hidden md:flex w-[240px] flex-shrink-0 h-[calc(100vh-64px)] flex-col"
      style={{
        background: '#070B14',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {/* Nav label */}
        <div className="px-3 pt-1 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">
            OPERATIONAL HUD
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group relative',
              isActive
                ? 'text-white bg-[#00E5FF]/10 border border-[#00E5FF]/30 shadow-[0_0_16px_rgba(0,229,255,0.12)]'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    width: '16px', height: '16px',
                    color: isActive ? '#00E5FF' : undefined
                  }}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-extrabold uppercase tracking-wider bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/30">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="ml-auto w-1 h-3.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Real-time Telemetry Processing Status */}
        <div className="mt-6 pt-5 px-3 border-t border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B] block mb-2.5">
            MISSION STATUS
          </span>
          <div className="rounded-xl p-3 bg-black/40 border border-white/[0.06]">
            {currentJob ? (
              <div>
                <div className="flex justify-between text-[11px] mb-2">
                  <span className="text-[#94A3B8] capitalize font-medium">{currentJob.status}</span>
                  <span className="text-[#00E5FF] font-bold font-mono">{currentJob.progress}%</span>
                </div>
                <div className="w-full rounded-full h-1.5 bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-[#00E5FF] to-[#38BDF8]"
                    style={{
                      width: `${currentJob.progress}%`,
                      boxShadow: '0 0 10px rgba(0,229,255,0.6)',
                    }}
                  />
                </div>
                <div className="mt-2 text-[9.5px] text-[#64748B] font-mono truncate">{currentJob.job_id || currentJob.jobId}</div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="text-[11px] text-[#94A3B8]">Telemetry Ingestion Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Operational Stats */}
        <div className="mt-5 pt-4 px-3 border-t border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B] block mb-2.5">
            RAPID METRICS
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5 text-center bg-black/40 border border-white/[0.06]">
              <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-[#00E5FF]" />
              <div className="text-[17px] font-extrabold font-mono text-white">1,248</div>
              <div className="text-[8.5px] uppercase tracking-wider text-[#64748B] font-bold">Buildings</div>
            </div>
            <div className="rounded-xl p-2.5 text-center bg-black/40 border border-white/[0.06]">
              <ShieldAlert className="w-3.5 h-3.5 mx-auto mb-1 text-[#EF4444]" />
              <div className="text-[17px] font-extrabold font-mono text-[#EF4444]">42</div>
              <div className="text-[8.5px] uppercase tracking-wider text-[#64748B] font-bold">Destroyed</div>
            </div>
          </div>
        </div>

        {/* Damage Severity Legend */}
        <div className="mt-5 pt-4 px-3 border-t border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B] block mb-2.5">
            DAMAGE MATRIX
          </span>
          <div className="space-y-2">
            {damageLegend.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 px-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span className="text-[11.5px] text-[#94A3B8]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer quick action buttons */}
      <div className="p-3 mt-auto border-t border-white/[0.06] space-y-1.5">
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#94A3B8] hover:text-white hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/25 border border-transparent transition-all cursor-pointer"
        >
          <Map className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Open Live Map</span>
        </button>
        <button
          onClick={() => navigate('/priority')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.05] border border-transparent transition-all cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span>Priority Action Plan</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

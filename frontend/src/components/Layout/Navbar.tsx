import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Map as MapIcon,
  BarChart2,
  FileText,
  Box as BoxIcon,
  Target,
  Menu,
  X,
  Activity,
  Cpu
} from 'lucide-react';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: 'Overview', icon: Home, exact: true },
  { to: '/map', label: 'Command Map', icon: MapIcon },
  { to: '/agent', label: 'AI Commander', icon: Cpu },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/viewer', label: '3D Twin', icon: BoxIcon },
  { to: '/priority', label: 'Priority', icon: Target },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-50 h-[68px] bg-[#020811]/95 backdrop-blur-xl border-b border-[#08AFFF]/15 px-4 lg:px-10 flex items-center justify-between select-none">
        {/* Brand Title (Clean typography, logo displayed only in opening app) */}
        <div
          onClick={() => navigate('/')}
          className="flex flex-col cursor-pointer group"
          title="RescueTwin"
        >
          <div className="text-xl font-bold tracking-tight text-white flex items-center group-hover:text-[#00D2FF] transition-colors">
            Rescue<span className="text-zinc-400">Twin</span>
          </div>
          <div className="text-[9px] font-mono tracking-[0.25em] text-[#94A3B8] uppercase font-bold">
            AI DISASTER RESPONSE
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={clsx(
                  'relative flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all rounded-lg',
                  isActive
                    ? 'text-[#00D2FF]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-14px] left-3 right-3 h-[2.5px] bg-gradient-to-r from-[#00A3FF] to-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Section: System Online Badge & Menu Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* System Online Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#052814]/80 border border-[#22C55E]/40 text-[#4ADE80] text-xs font-semibold shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]" />
            <span className="hidden sm:inline">System Online</span>
          </div>

          {/* Menu / Hamburger Button matching reference */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 hover:border-[#00D2FF]/40 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-[#00D2FF]" />
            ) : (
              <Menu className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </header>

      {/* Slide-over Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[68px] z-50 bg-[#020811]/98 border-b border-[#08AFFF]/20 p-5 space-y-2 backdrop-blur-2xl shadow-2xl animate-fade-in max-w-[1540px] mx-auto">
          <div className="text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-widest px-2 mb-2">
            MISSION MODULES & NAVIGATION
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'text-[#00D2FF] bg-[#00A3FF]/15 border border-[#00A3FF]/30'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06] border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#00D2FF]" />
                    <span>{link.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">→</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

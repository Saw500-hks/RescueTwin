import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useStore from '../../stores/useStore';
import { Smartphone, Monitor, X, RotateCcw, Wifi, Battery, Signal } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { phoneFrameMode, togglePhoneFrameMode } = useStore();
  const isMobilePreview = location.search.includes('preview=mobile');
  const showSidebar = location.pathname !== '/' && !phoneFrameMode && !isMobilePreview;

  // If this window is rendering inside the mobile preview iframe
  if (isMobilePreview) {
    return (
      <div className="min-h-screen text-[#F3F4F6] flex flex-col selection:bg-[#08AFFF]/30 selection:text-white bg-[#020811] overflow-x-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative bg-[#020811]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#F3F4F6] flex flex-col selection:bg-[#08AFFF]/30 selection:text-white bg-[#020811]">
      <Navbar />

      {phoneFrameMode ? (
        /* ── PHONE FRAME SIMULATOR MODE ── */
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 bg-[#01040a] relative overflow-y-auto min-h-[calc(100vh-68px)]">
          {/* Top Frame Control Bar */}
          <div className="mb-4 flex items-center gap-3 bg-[#0a1324] border border-[#00A3FF]/30 px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(0,163,255,0.2)] font-mono text-xs z-30">
            <div className="flex items-center gap-2 text-[#00D2FF] font-bold">
              <Smartphone className="w-4 h-4" />
              <span>iPhone 16 Pro · 393 × 852 px</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={togglePhoneFrameMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF3B30]/20 border border-[#FF3B30]/50 text-[#FF3B30] hover:bg-[#FF3B30]/30 transition-colors font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Phone View</span>
            </button>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="relative w-[393px] max-w-full h-[852px] rounded-[52px] border-[10px] border-[#1e293b] shadow-[0_0_80px_rgba(0,163,255,0.3),0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/20 bg-[#020811] flex flex-col overflow-hidden">
            {/* Phone Top Status Bar & Dynamic Island */}
            <div className="h-11 w-full bg-[#020811] flex items-center justify-between px-7 flex-shrink-0 z-40 relative select-none border-b border-white/05">
              <span className="text-[11px] font-mono font-bold text-slate-300">09:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-24 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Embedded Live Mobile App (True 393px Viewport) */}
            <div className="flex-1 w-full relative overflow-hidden bg-[#020811]">
              <iframe
                src={`${location.pathname}?preview=mobile`}
                className="w-full h-full border-0 select-auto"
                title="RescueTwin Mobile Viewport"
              />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-5 w-full bg-[#020811] flex items-center justify-center flex-shrink-0 z-40 border-t border-white/05">
              <div className="w-32 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* ── NORMAL DESKTOP VIEW ── */
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && <Sidebar />}
          <main className="flex-1 overflow-y-auto relative bg-[#020811]">
            {/* Subtle tactical grid background */}
            <div
              className="pointer-events-none fixed inset-0 z-0 opacity-70"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(8, 175, 255, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(8, 175, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
              }}
            />
            {/* Ambient Lighting */}
            <div
              className="pointer-events-none fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15"
              style={{ background: '#08AFFF' }}
            />
            <div
              className="pointer-events-none fixed bottom-10 left-1/4 w-[600px] h-[350px] rounded-full blur-[170px] opacity-10"
              style={{ background: '#FF8A00' }}
            />

            <div className="relative z-10 min-h-full">
              {children}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;

import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ThreeDOpenPage from '../ThreeDOpenPage';
import useStore from '../../stores/useStore';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { show3DIntro } = useStore();
  const isMobilePreview = location.search.includes('preview=mobile');
  const isDirectIntro = location.pathname === '/open' || location.pathname === '/intro';
  const showSidebar = location.pathname !== '/' && !isMobilePreview && !isDirectIntro;

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
      {show3DIntro && !isMobilePreview && !isDirectIntro && <ThreeDOpenPage />}
      <Navbar />

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
    </div>
  );
};

export default Layout;

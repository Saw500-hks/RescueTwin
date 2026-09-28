import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import GeoMap from './pages/GeoMap';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Viewer3D from './pages/Viewer3D';
import PriorityReport from './pages/PriorityReport';
import AgentCommandCenter from './pages/AgentCommandCenter';
import IndiaCommandCenter from './pages/IndiaCommandCenter';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agent" element={<AgentCommandCenter />} />
          <Route path="/india" element={<IndiaCommandCenter />} />
          <Route path="/map" element={<GeoMap />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/viewer" element={<Viewer3D />} />
          <Route path="/priority" element={<PriorityReport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
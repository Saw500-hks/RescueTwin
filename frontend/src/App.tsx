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
import IntroPage from './pages/IntroPage';
import TodosPage from './pages/Todos';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/open" element={<IntroPage />} />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/agent" element={<AgentCommandCenter />} />
          {/* Unified Disaster Command Map */}
          <Route path="/map" element={<IndiaCommandCenter defaultCountryName="India" defaultCountryCode="IN" />} />
          <Route path="/command" element={<IndiaCommandCenter defaultCountryName="India" defaultCountryCode="IN" />} />
          <Route path="/india" element={<IndiaCommandCenter defaultCountryName="India" defaultCountryCode="IN" />} />
          <Route path="/nepal" element={<Navigate to="/map" replace />} />
          <Route path="/geomap" element={<GeoMap />} />
          {/* Analysis & Ingestion */}
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/upload" element={<Analysis defaultTab="upload" />} />
          <Route path="/viewer" element={<Viewer3D />} />
          <Route path="/priority" element={<PriorityReport />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
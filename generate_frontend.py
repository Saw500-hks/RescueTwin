import os

BASE_DIR = "/Users/himanshu/RescueTwin/frontend"

FILES = {}

FILES["package.json"] = """{
  "name": "rescuetwin-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "three": "^0.167.1",
    "@react-three/fiber": "^8.17.7",
    "@react-three/drei": "^9.109.2",
    "axios": "^1.7.7",
    "zustand": "^5.0.0-rc.2",
    "lucide-react": "^0.436.0",
    "recharts": "^2.12.7",
    "react-dropzone": "^14.2.3",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.167.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}"""

FILES["tsconfig.json"] = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}"""

FILES["tsconfig.node.json"] = """{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}"""

FILES["vite.config.ts"] = """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  }
});"""

FILES["tailwind.config.js"] = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        disaster: {
          green: '#22c55e',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
          blue: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}"""

FILES["postcss.config.js"] = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

FILES[".env.example"] = """VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000"""

FILES["index.html"] = """<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI 3D Digital Twin for Disaster Damage Assessment and Rescue Prioritization" />
    <title>RescueTwin - AI Disaster Assessment</title>
  </head>
  <body class="bg-slate-900 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>"""

FILES["public/favicon.svg"] = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-satellite"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>"""

FILES["src/index.css"] = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[#0f172a] text-white;
  }
}

@layer utilities {
  .glass {
    @apply bg-slate-800/80 backdrop-blur-md border border-slate-700;
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  @apply bg-slate-900;
}
::-webkit-scrollbar-thumb {
  @apply bg-slate-700 rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-600;
}"""

FILES["src/types/index.ts"] = """export type DamageLevel = 'NO_DAMAGE' | 'MINOR' | 'MAJOR' | 'DESTROYED';

export interface BuildingDetection {
  id: string;
  bbox: [number, number, number, number]; // x1,y1,x2,y2
  confidence: number;
  area_sqm: number;
}

export interface DamageAssessment {
  building_id: string;
  damage_level: DamageLevel;
  confidence: number;
  change_score: number;
}

export interface RescuePriority {
  building_id: string;
  rank: number;
  priority_score: number;
  damage_level: DamageLevel;
  road_access: boolean;
  notes: string;
}

export interface ProcessingJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  result_path?: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  damage_level?: DamageLevel;
  building_id?: string;
}

export interface ReconstructionResult {
  job_id: string;
  points: Point3D[];
  building_count: number;
  damage_summary: Record<DamageLevel, number>;
}"""

FILES["src/api/client.ts"] = """import axios from 'axios';
import { BuildingDetection, DamageAssessment, ProcessingJob, ReconstructionResult, RescuePriority } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
});

export const uploadImages = async (preFile: File, postFile: File): Promise<ProcessingJob> => {
  const formData = new FormData();
  formData.append('preFile', preFile);
  formData.append('postFile', postFile);
  const res = await api.post('/upload', formData);
  return res.data;
};

export const detectBuildings = async (imageFile: File): Promise<BuildingDetection[]> => {
  const formData = new FormData();
  formData.append('imageFile', imageFile);
  const res = await api.post('/detect', formData);
  return res.data;
};

export const assessDamage = async (preFile: File, postFile: File): Promise<{job_id: string, detections: BuildingDetection[], assessments: DamageAssessment[]}> => {
  const formData = new FormData();
  formData.append('preFile', preFile);
  formData.append('postFile', postFile);
  const res = await api.post('/assess', formData);
  return res.data;
};

export const computePriority = async (assessments: DamageAssessment[]): Promise<RescuePriority[]> => {
  const res = await api.post('/priority', { assessments });
  return res.data;
};

export const startReconstruction = async (files: File[]): Promise<ProcessingJob> => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await api.post('/reconstruct', formData);
  return res.data;
};

export const getJobStatus = async (jobId: string): Promise<ProcessingJob> => {
  const res = await api.get(`/jobs/${jobId}`);
  return res.data;
};

export const getReconstructionResult = async (jobId: string): Promise<ReconstructionResult> => {
  const res = await api.get(`/results/${jobId}`);
  return res.data;
};

export const getPriorityReport = async (jobId: string): Promise<RescuePriority[]> => {
  const res = await api.get(`/reports/${jobId}`);
  return res.data;
};"""

FILES["src/stores/useStore.ts"] = """import { create } from 'zustand';
import { ProcessingJob, BuildingDetection, DamageAssessment, RescuePriority, ReconstructionResult } from '../types';

interface StoreState {
  currentJob: ProcessingJob | null;
  detections: BuildingDetection[];
  assessments: DamageAssessment[];
  priorities: RescuePriority[];
  reconstructionResult: ReconstructionResult | null;
  selectedBuilding: string | null;
  setCurrentJob: (job: ProcessingJob | null) => void;
  setDetections: (detections: BuildingDetection[]) => void;
  setAssessments: (assessments: DamageAssessment[]) => void;
  setPriorities: (priorities: RescuePriority[]) => void;
  setReconstructionResult: (result: ReconstructionResult | null) => void;
  selectBuilding: (id: string | null) => void;
  reset: () => void;
}

const useStore = create<StoreState>((set) => ({
  currentJob: null,
  detections: [],
  assessments: [],
  priorities: [],
  reconstructionResult: null,
  selectedBuilding: null,
  setCurrentJob: (job) => set({ currentJob: job }),
  setDetections: (detections) => set({ detections }),
  setAssessments: (assessments) => set({ assessments }),
  setPriorities: (priorities) => set({ priorities }),
  setReconstructionResult: (result) => set({ reconstructionResult: result }),
  selectBuilding: (id) => set({ selectedBuilding: id }),
  reset: () => set({
    currentJob: null,
    detections: [],
    assessments: [],
    priorities: [],
    reconstructionResult: null,
    selectedBuilding: null
  })
}));

export default useStore;"""

FILES["src/hooks/useUpload.ts"] = """import { useState } from 'react';
import axios from 'axios';
import { ProcessingJob } from '../types';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (endpoint: string, files: Record<string, File | File[]>): Promise<ProcessingJob | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    
    const formData = new FormData();
    Object.entries(files).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(f => formData.append(key, f));
      } else {
        formData.append(key, value);
      }
    });

    try {
      const res = await axios.post(`/api/v1${endpoint}`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, progress, error };
};"""

FILES["src/hooks/useJobStatus.ts"] = """import { useState, useEffect } from 'react';
import { getJobStatus } from '../api/client';
import { ProcessingJob } from '../types';

export const useJobStatus = (jobId: string | null) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const currentStatus = await getJobStatus(jobId);
        setJob(currentStatus);
        
        if (currentStatus.status === 'completed' || currentStatus.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(intervalId);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  return { job, error };
};"""

FILES["src/hooks/useWebSocket.ts"] = """import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (jobId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const connect = () => {
      const url = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/progress/${jobId}`;
      ws.current = new WebSocket(url);

      ws.current.onopen = () => setConnected(true);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Auto reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [jobId]);

  return { messages, connected };
};"""

FILES["src/main.tsx"] = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);"""

FILES["src/components/Layout/Navbar.tsx"] = """import React from 'react';
import { NavLink } from 'react-router-dom';
import { Satellite, Menu, Moon, Sun, Activity } from 'lucide-react';
import clsx from 'clsx';

const Navbar = () => {
  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Satellite className="text-disaster-blue w-6 h-6" />
        <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          RescueTwin
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/upload', label: 'Upload' },
          { to: '/analysis', label: 'Analysis' },
          { to: '/viewer', label: '3D Viewer' },
          { to: '/priority', label: 'Priority Report' },
        ].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => clsx(
              "text-sm font-medium transition-colors hover:text-blue-400",
              isActive ? "text-blue-400" : "text-slate-300"
            )}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full">
          <Activity className="w-3.5 h-3.5 text-green-500" />
          Backend Connected
        </div>
        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <Sun className="w-5 h-5 text-slate-300" />
        </button>
        <button className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;"""

FILES["src/components/Layout/Sidebar.tsx"] = """import React from 'react';
import { Map, FileBarChart, AlertTriangle, Building, Layers } from 'lucide-react';
import useStore from '../../stores/useStore';

const Sidebar = () => {
  const { currentJob, detections } = useStore();

  return (
    <aside className="w-64 glass h-[calc(100vh-64px)] p-4 flex flex-col gap-6 overflow-y-auto">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing Status</h3>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          {currentJob ? (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{currentJob.status}</span>
                <span>{currentJob.progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${currentJob.progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No active jobs</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center">
            <Building className="w-5 h-5 mx-auto mb-1 text-slate-400" />
            <div className="text-xl font-bold">{detections.length}</div>
            <div className="text-[10px] text-slate-400 uppercase">Buildings</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-disaster-red" />
            <div className="text-xl font-bold">0</div>
            <div className="text-[10px] text-slate-400 uppercase">Critical</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legend</h3>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-2 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-disaster-green"></div> No Damage</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-disaster-yellow"></div> Minor Damage</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-disaster-orange"></div> Major Damage</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-disaster-red"></div> Destroyed</div>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortcuts</h3>
        <button className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg text-sm transition-colors text-left">
          <Map className="w-4 h-4 text-slate-400" /> View Map
        </button>
        <button className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg text-sm transition-colors text-left">
          <FileBarChart className="w-4 h-4 text-slate-400" /> Export PDF
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;"""

FILES["src/pages/Dashboard.tsx"] = """import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, AlertOctagon, Clock, ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="glass p-6 rounded-xl flex items-center gap-4">
    <div className={`p-4 rounded-lg bg-slate-900/50 ${colorClass}`}>
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <div className="text-sm text-slate-400 font-medium">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="text-center py-12 px-4 rounded-2xl glass relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10" />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 relative z-10">
          AI-Powered 3D Disaster Assessment
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-8 relative z-10">
          Rapidly analyze pre and post-disaster imagery to detect building damage, generate 3D digital twins, and prioritize rescue operations.
        </p>
        <div className="flex justify-center gap-4 relative z-10">
          <button onClick={() => navigate('/upload')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
            New Analysis <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/viewer')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            View 3D Map
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Buildings Analyzed" value="1,248" icon={Building2} colorClass="text-blue-400" />
        <StatCard title="Damaged Detected" value="342" icon={AlertOctagon} colorClass="text-disaster-red" />
        <StatCard title="High Priority Zones" value="12" icon={Activity} colorClass="text-disaster-orange" />
        <StatCard title="Avg Processing Time" value="4.2m" icon={Clock} colorClass="text-disaster-green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6">Recent Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Job ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium">job_8f72c3...</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span></td>
                  <td className="px-6 py-4">2023-10-27 14:32</td>
                  <td className="px-6 py-4"><button className="text-blue-400 hover:underline">View Report</button></td>
                </tr>
                <tr className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium">job_a19bc4...</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Processing (45%)</span></td>
                  <td className="px-6 py-4">2023-10-27 15:10</td>
                  <td className="px-6 py-4"><button className="text-slate-400 cursor-not-allowed">Wait...</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6">System Pipeline</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            {['Image Upload', 'Building Detection', 'Damage Assessment', 'Priority Ranking', '3D Reconstruction'].map((step, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {idx + 1}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-3 rounded text-sm text-center">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;"""

FILES["src/pages/Upload.tsx"] = """import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, Map, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../stores/useStore';

const Upload = () => {
  const [mode, setMode] = useState<'quick' | 'reconstruction'>('quick');
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setCurrentJob } = useStore();

  const onDropPre = useCallback((acceptedFiles: File[]) => { setPreFile(acceptedFiles[0]); }, []);
  const onDropPost = useCallback((acceptedFiles: File[]) => { setPostFile(acceptedFiles[0]); }, []);
  const onDropMulti = useCallback((acceptedFiles: File[]) => { setMultiFiles(prev => [...prev, ...acceptedFiles]); }, []);

  const { getRootProps: getRootPre, getInputProps: getInputPre } = useDropzone({ onDrop: onDropPre, accept: {'image/*': []}, maxFiles: 1 });
  const { getRootProps: getRootPost, getInputProps: getInputPost } = useDropzone({ onDrop: onDropPost, accept: {'image/*': []}, maxFiles: 1 });
  const { getRootProps: getRootMulti, getInputProps: getInputMulti } = useDropzone({ onDrop: onDropMulti, accept: {'image/*': []} });

  const handleProcess = async () => {
    setProcessing(true);
    setStep(1);
    
    // Mock processing delay for demo
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
    setTimeout(() => setStep(4), 6000);
    setTimeout(() => {
      setCurrentJob({ jobId: 'mock_job_123', status: 'completed', progress: 100, created_at: new Date().toISOString() });
      setProcessing(false);
      navigate(mode === 'quick' ? '/analysis' : '/viewer');
    }, 8000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Imagery</h1>
          <p className="text-slate-400">Provide satellite or drone imagery for AI analysis.</p>
        </div>
        <div className="glass flex p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'quick' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('quick')}
          >
            Quick Analysis (Pre/Post)
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'reconstruction' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('reconstruction')}
          >
            3D Reconstruction
          </button>
        </div>
      </div>

      {!processing ? (
        <div className="glass p-8 rounded-xl">
          {mode === 'quick' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div {...getRootPre()} className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px]">
                <input {...getInputPre()} />
                <ImageIcon className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-lg font-medium mb-1">Pre-Disaster Image</p>
                <p className="text-sm text-slate-500">{preFile ? preFile.name : 'Drag & drop or click to select'}</p>
              </div>
              <div {...getRootPost()} className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px]">
                <input {...getInputPost()} />
                <Map className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-lg font-medium mb-1">Post-Disaster Image</p>
                <p className="text-sm text-slate-500">{postFile ? postFile.name : 'Drag & drop or click to select'}</p>
              </div>
            </div>
          ) : (
             <div {...getRootMulti()} className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[400px]">
                <input {...getInputMulti()} />
                <UploadCloud className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-xl font-medium mb-2">Upload Multiple Images</p>
                <p className="text-sm text-slate-500 mb-4">Provide drone image sets for photogrammetry and AI damage assessment.</p>
                <div className="text-sm font-bold text-blue-400">{multiFiles.length} files selected</div>
             </div>
          )}

          <div className="mt-8 flex justify-end">
            <button 
              disabled={mode === 'quick' ? (!preFile || !postFile) : multiFiles.length === 0}
              onClick={handleProcess}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Start AI Analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="glass p-12 rounded-xl text-center space-y-8">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Processing Data...</h2>
          
          <div className="max-w-md mx-auto space-y-4 text-left">
            {[
              'Uploading images...',
              'Detecting buildings using AI...',
              'Analyzing structural damage...',
              mode === 'quick' ? 'Computing rescue priorities...' : 'Generating 3D Point Cloud...'
            ].map((text, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${step > i ? 'bg-green-500/10 text-green-400' : step === i ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-slate-500'}`}>
                {step > i ? <div className="w-2 h-2 rounded-full bg-green-500" /> : 
                 step === i ? <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> : 
                 <div className="w-2 h-2 rounded-full bg-slate-600" />}
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;"""

FILES["src/pages/Analysis.tsx"] = """import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Filter } from 'lucide-react';

const mockData = [
  { name: 'Destroyed', count: 42, color: '#ef4444' },
  { name: 'Major', count: 128, color: '#f97316' },
  { name: 'Minor', count: 312, color: '#eab308' },
  { name: 'No Damage', count: 766, color: '#22c55e' },
];

const Analysis = () => {
  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Damage Analysis Results</h1>
        <button className="glass px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass p-4 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Satellite Imagery Map</h2>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700">Pre-Disaster</span>
              <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Post-Disaster (AI Overlay)</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-900 rounded-lg min-h-[400px] border border-slate-700 relative overflow-hidden flex items-center justify-center">
            {/* Placeholder for map/image with canvas overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2000')] bg-cover bg-center"></div>
            <div className="relative z-10 text-center space-y-2">
              <MapIcon className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-slate-400">Interactive map view rendered here</p>
            </div>
            
            {/* Mock Bounding Boxes */}
            <div className="absolute top-[20%] left-[30%] w-16 h-16 border-2 border-disaster-red bg-disaster-red/20 rounded-sm"></div>
            <div className="absolute top-[40%] left-[50%] w-20 h-24 border-2 border-disaster-orange bg-disaster-orange/20 rounded-sm"></div>
            <div className="absolute top-[60%] left-[20%] w-12 h-12 border-2 border-disaster-green bg-disaster-green/20 rounded-sm"></div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl flex flex-col">
          <h2 className="font-semibold mb-6">Damage Distribution</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Building Assessments</h2>
          <button className="text-sm flex items-center gap-2 text-slate-400 hover:text-white"><Filter className="w-4 h-4"/> Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">Building ID</th>
                <th className="px-6 py-3">Damage Level</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">Change Score</th>
                <th className="px-6 py-3 rounded-tr-lg">Priority Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {[
                { id: 'BLD-901', level: 'DESTROYED', conf: 98.5, change: 0.92, rank: 1, color: 'text-red-400 bg-red-400/10' },
                { id: 'BLD-442', level: 'MAJOR', conf: 87.2, change: 0.74, rank: 14, color: 'text-orange-400 bg-orange-400/10' },
                { id: 'BLD-112', level: 'MINOR', conf: 91.0, change: 0.35, rank: 156, color: 'text-yellow-400 bg-yellow-400/10' },
                { id: 'BLD-005', level: 'NO_DAMAGE', conf: 99.1, change: 0.02, rank: 890, color: 'text-green-400 bg-green-400/10' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{row.id}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.color}`}>{row.level}</span></td>
                  <td className="px-6 py-4">{row.conf}%</td>
                  <td className="px-6 py-4">{row.change}</td>
                  <td className="px-6 py-4">#{row.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple Map Icon component since I used it above
const MapIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" x2="9" y1="3" y2="18"></line><line x1="15" x2="15" y1="6" y2="21"></line></svg>
);

export default Analysis;"""

FILES["src/pages/Viewer3D.tsx"] = """import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Layers, Maximize, RotateCcw } from 'lucide-react';
import useStore from '../stores/useStore';
import { DamageLevel } from '../types';

const getColor = (damage?: DamageLevel) => {
  switch (damage) {
    case 'NO_DAMAGE': return '#22c55e';
    case 'MINOR': return '#eab308';
    case 'MAJOR': return '#f97316';
    case 'DESTROYED': return '#ef4444';
    default: return '#94a3b8';
  }
};

const DemoScene = ({ onBuildingClick }: { onBuildingClick: (data: any) => void }) => {
  const demoBuildings = [
    { id: 'BLD-01', position: [-5, 2, -5], scale: [2, 4, 2], damage: 'NO_DAMAGE' },
    { id: 'BLD-02', position: [5, 3, 5], scale: [3, 6, 3], damage: 'MINOR' },
    { id: 'BLD-03', position: [-2, 1, 6], scale: [2, 2, 2], damage: 'MAJOR' },
    { id: 'BLD-04', position: [6, 0.5, -4], scale: [4, 1, 3], rotation: [0.2, 0.1, 0.1], damage: 'DESTROYED' },
    { id: 'BLD-05', position: [0, 4, 0], scale: [2, 8, 2], damage: 'NO_DAMAGE' },
    { id: 'BLD-06', position: [-6, 2.5, 3], scale: [2, 5, 2], damage: 'MINOR' },
    { id: 'BLD-07', position: [3, 2, -7], scale: [3, 4, 3], damage: 'MINOR' },
    { id: 'BLD-08', position: [7, 1.5, 0], scale: [2, 3, 2], damage: 'MAJOR' },
  ];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {demoBuildings.map((b, i) => (
        <Box 
          key={i} 
          position={b.position as any} 
          scale={b.scale as any} 
          rotation={b.rotation as any}
          onClick={(e) => { e.stopPropagation(); onBuildingClick(b); }}
          onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
          onPointerOut={(e) => (document.body.style.cursor = 'auto')}
        >
          <meshStandardMaterial color={getColor(b.damage as DamageLevel)} />
        </Box>
      ))}
    </>
  );
};

const Viewer3D = () => {
  const { reconstructionResult } = useStore();
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-64px)] w-full relative bg-slate-950">
      <div className="absolute top-4 left-4 z-10 glass p-4 rounded-xl w-64 shadow-xl">
        <h3 className="font-bold text-white mb-3">3D Damage Map</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-disaster-green rounded-full"></div> No Damage</div><span className="text-slate-400">2</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-disaster-yellow rounded-full"></div> Minor</div><span className="text-slate-400">3</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-disaster-orange rounded-full"></div> Major</div><span className="text-slate-400">2</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-disaster-red rounded-full"></div> Destroyed</div><span className="text-slate-400">1</span></div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button className="glass p-2 rounded-lg hover:bg-slate-700 transition-colors" title="Layers"><Layers className="w-5 h-5 text-slate-300" /></button>
        <button className="glass p-2 rounded-lg hover:bg-slate-700 transition-colors" title="Reset View"><RotateCcw className="w-5 h-5 text-slate-300" /></button>
        <button className="glass p-2 rounded-lg hover:bg-slate-700 transition-colors" title="Fullscreen"><Maximize className="w-5 h-5 text-slate-300" /></button>
      </div>
      
      {selected && (
        <div className="absolute bottom-4 left-4 z-10 glass p-4 rounded-xl w-72 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold">{selected.id}</h4>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">&times;</button>
          </div>
          <div className={`text-xs inline-block px-2 py-1 rounded font-bold mb-3 ${
            selected.damage === 'NO_DAMAGE' ? 'bg-disaster-green/20 text-disaster-green' :
            selected.damage === 'MINOR' ? 'bg-disaster-yellow/20 text-disaster-yellow' :
            selected.damage === 'MAJOR' ? 'bg-disaster-orange/20 text-disaster-orange' :
            'bg-disaster-red/20 text-disaster-red'
          }`}>{selected.damage}</div>
          <div className="space-y-1 text-sm text-slate-300">
            <div className="flex justify-between"><span>Confidence:</span> <span className="font-medium text-white">94.2%</span></div>
            <div className="flex justify-between"><span>Est. Volume:</span> <span className="font-medium text-white">1,240 m³</span></div>
            <div className="flex justify-between"><span>Priority Rank:</span> <span className="font-medium text-white">#12</span></div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 5]} intensity={1.2} castShadow />
        <DemoScene onBuildingClick={setSelected} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
};

export default Viewer3D;"""

FILES["src/pages/PriorityReport.tsx"] = """import React from 'react';
import { Download, Map, Navigation, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const mockPriorities = [
  { id: 'BLD-901', rank: 1, score: 98, level: 'DESTROYED', access: true, notes: 'Complete collapse. Main road clear.' },
  { id: 'BLD-842', rank: 2, score: 95, level: 'DESTROYED', access: false, notes: 'Structural failure. Road blocked by debris.' },
  { id: 'BLD-331', rank: 3, score: 87, level: 'MAJOR', access: true, notes: 'Roof caved in. High risk of secondary collapse.' },
  { id: 'BLD-115', rank: 4, score: 82, level: 'MAJOR', access: true, notes: 'Partial wall failure.' },
];

const pieData = [
  { name: 'Immediate (Score > 90)', value: 12, color: '#ef4444' },
  { name: 'High (Score 70-89)', value: 45, color: '#f97316' },
  { name: 'Medium (Score 40-69)', value: 89, color: '#eab308' },
  { name: 'Low (Score < 40)', value: 240, color: '#22c55e' },
];

const PriorityReport = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Rescue Priority Report</h1>
          <p className="text-slate-400">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-disaster-red" /> Immediate Action Required</h2>
          
          {mockPriorities.map((item) => (
            <div key={item.id} className="glass p-5 rounded-xl border-l-4" style={{ borderLeftColor: item.level === 'DESTROYED' ? '#ef4444' : '#f97316' }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white font-bold border border-slate-600">
                    {item.rank}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg">{item.id}</h3>
                    <span className={`text-xs font-bold ${item.level === 'DESTROYED' ? 'text-red-400' : 'text-orange-400'}`}>
                      {item.level.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black">{item.score}<span className="text-sm text-slate-500 font-normal">/100</span></div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Priority Score</div>
                </div>
              </div>
              
              <div className="bg-slate-900/50 p-3 rounded-lg text-sm mb-3 text-slate-300">
                <span className="font-semibold text-white">Notes: </span> {item.notes}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1.5 ${item.access ? 'text-green-400' : 'text-red-400'}`}>
                  {item.access ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {item.access ? 'Road Access Clear' : 'Road Blocked'}
                </div>
                <button className="text-blue-400 flex items-center gap-1 hover:underline ml-auto">
                  <Navigation className="w-4 h-4" /> Get Coordinates
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-xl">
            <h3 className="font-bold mb-4">Priority Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((d, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-slate-400" /> Sector Map</h3>
            <div className="w-full aspect-square bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden grid grid-cols-4 grid-rows-4">
              {/* Fake Map Grid */}
              {Array.from({length: 16}).map((_, i) => (
                <div key={i} className="border border-slate-800/50 flex items-center justify-center relative">
                  {i === 5 && <div className="absolute w-full h-full bg-disaster-red/20 animate-pulse"></div>}
                  {i === 6 && <div className="absolute w-full h-full bg-disaster-orange/20"></div>}
                  <span className="text-[10px] text-slate-600 select-none">S{i+1}</span>
                </div>
              ))}
              <div className="absolute top-[35%] left-[35%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
              <div className="absolute top-[45%] left-[40%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
            </div>
            <button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-sm font-medium py-2 rounded-lg transition-colors">
              Open Full Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityReport;"""

FILES["src/components/Layout/Layout.tsx"] = """import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;"""

FILES["src/App.tsx"] = """import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Viewer3D from './pages/Viewer3D';
import PriorityReport from './pages/PriorityReport';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/viewer" element={<Viewer3D />} />
          <Route path="/priority" element={<PriorityReport />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;"""

for path, content in FILES.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content.strip() + '\\n')

print("All frontend files created successfully.")

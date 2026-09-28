import axios from 'axios';
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
};

// ==========================================
// NVIDIA NEMOTRON AI AGENT API
// ==========================================

export const getAgentStatus = async () => {
  const res = await api.get('/agent/status');
  return res.data;
};

export const listAgentScenarios = async () => {
  const res = await api.get('/agent/scenarios');
  return res.data;
};

export const getAgentEvidence = async (scenarioId: string = 'scenario_earthquake_74') => {
  const res = await api.get(`/agent/evidence?scenario_id=${scenarioId}`);
  return res.data;
};

export const runAutonomousAgent = async (params: {
  scenario_id?: string;
  custom_directives?: string;
  use_live_nim?: boolean;
}) => {
  const res = await api.post('/agent/run', params);
  return res.data;
};

export const listAgentPlans = async () => {
  const res = await api.get('/agent/plans');
  return res.data;
};

export const executeAgentTool = async (toolName: string, payload: Record<string, any>) => {
  const res = await api.post(`/agent/tools/${toolName}`, payload);
  return res.data;
};

export const queryInspectionPriorities = async (query: string = "Which buildings should we inspect first?", scenarioId: string = "scenario_earthquake_74") => {
  const res = await api.post('/agent/query-inspection-priorities', { query, scenario_id: scenarioId });
  return res.data;
};

export const planMissionWithNemotron = async (userRequest: string = "Formulate optimal triage and rescue plan for Sector 7", scenarioId: string = "scenario_earthquake_74") => {
  const res = await api.post('/agent/plan-mission', { user_request: userRequest, scenario_id: scenarioId });
  return res.data;
};

// ==========================================
// 5-STEP COMPUTER VISION & GEOSPATIAL PIPELINE
// ==========================================

export const getPipelineStages = async () => {
  const res = await api.get('/pipeline/stages');
  return res.data;
};

export const runCVPipeline = async (preFile?: File | null, postFile?: File | null) => {
  const formData = new FormData();
  if (preFile) formData.append('pre', preFile);
  if (postFile) formData.append('post', postFile);
  const res = await api.post('/pipeline/run-cv-pipeline', formData);
  return res.data;
};

// ==========================================
// 4-TIER FULL-STACK SYSTEM PIPELINE
// Frontend -> API -> GPU inference / CV -> Nebius Token Factory
// ==========================================

export const getPipelineArchitecture = async () => {
  const res = await api.get('/pipeline/architecture');
  return res.data;
};

export const runFullStackPipeline = async (params?: {
  scenarioId?: string;
  userRequest?: string;
  preFile?: File | null;
  postFile?: File | null;
}) => {
  if (params?.preFile || params?.postFile) {
    const formData = new FormData();
    if (params.preFile) formData.append('pre', params.preFile);
    if (params.postFile) formData.append('post', params.postFile);
    if (params.scenarioId) formData.append('scenario_id', params.scenarioId);
    if (params.userRequest) formData.append('user_request', params.userRequest);
    const res = await api.post('/pipeline/run-full-stack-upload', formData);
    return res.data;
  }
  const res = await api.post('/pipeline/run-full-stack-pipeline', {
    scenario_id: params?.scenarioId || 'scenario_earthquake_74',
    user_request: params?.userRequest || 'Formulate optimal triage and rescue plan for Sector 7',
  });
  return res.data;
};

// ==========================================
// PAN-INDIA GEOGRAPHIC & DISASTER API
// ==========================================

export const getRegions = async () => {
  const res = await api.get('/geo/regions');
  return res.data;
};

export const getStates = async () => {
  const res = await api.get('/geo/states');
  return res.data;
};

export const getStateDistricts = async (stateId: string) => {
  const res = await api.get(`/geo/states/${stateId}/districts`);
  return res.data;
};

export const getDisasterTypes = async () => {
  const res = await api.get('/geo/disaster-types');
  return res.data;
};

export const getDisasters = async (stateId?: string, disasterType?: string) => {
  const params = new URLSearchParams();
  if (stateId) params.append('state_id', stateId);
  if (disasterType) params.append('disaster_type', disasterType);
  const qs = params.toString();
  const res = await api.get(`/geo/disasters${qs ? '?' + qs : ''}`);
  return res.data;
};

export const getDisasterEvent = async (eventId: string) => {
  const res = await api.get(`/geo/disasters/${eventId}`);
  return res.data;
};

export const getDisasterBuildings = async (eventId: string) => {
  const res = await api.get(`/geo/disasters/${eventId}/buildings`);
  return res.data;
};

export const getBuildingDetail = async (buildingId: string) => {
  const res = await api.get(`/geo/buildings/${buildingId}`);
  return res.data;
};

export const getBuildingEvidence = async (buildingId: string) => {
  const res = await api.get(`/geo/buildings/${buildingId}/evidence`);
  return res.data;
};

// ==========================================
// AI DECISION SUPPORT API
// ==========================================

export const aiExplain = async (params: {
  building_id?: string;
  event_id?: string;
  scenario_id?: string;
  question?: string;
  available_data?: Record<string, any>;
}) => {
  const res = await api.post('/ai/explain', params);
  return res.data;
};

export const aiPrioritize = async (params: {
  event_id?: string;
  scenario_id?: string;
  buildings?: any[];
}) => {
  const res = await api.post('/ai/prioritize', params);
  return res.data;
};

export const aiAnalyze = async (params: {
  event_id?: string;
  scenario_id?: string;
  context?: string;
}) => {
  const res = await api.post('/ai/analyze', params);
  return res.data;
};

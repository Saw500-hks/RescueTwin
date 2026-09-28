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


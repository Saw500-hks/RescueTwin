import { create } from 'zustand';
import { ProcessingJob, BuildingDetection, DamageAssessment, RescuePriority, ReconstructionResult } from '../types';

interface StoreState {
  currentJob: ProcessingJob | null;
  detections: BuildingDetection[];
  assessments: DamageAssessment[];
  priorities: RescuePriority[];
  reconstructionResult: ReconstructionResult | null;
  selectedBuilding: string | null;
  phoneFrameMode: boolean;
  setPhoneFrameMode: (active: boolean) => void;
  togglePhoneFrameMode: () => void;
  setCurrentJob: (job: ProcessingJob | null) => void;
  setDetections: (detections: BuildingDetection[]) => void;
  setAssessments: (assessments: DamageAssessment[]) => void;
  setPriorities: (priorities: RescuePriority[]) => void;
  setReconstructionResult: (result: ReconstructionResult | null) => void;
  selectBuilding: (id: string | null) => void;
  reset: () => void;
}

const useStore = create<StoreState>((set) => ({
  phoneFrameMode: false,
  setPhoneFrameMode: (active) => set({ phoneFrameMode: active }),
  togglePhoneFrameMode: () => set((state) => ({ phoneFrameMode: !state.phoneFrameMode })),
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

export default useStore

export type DamageLevel = 'NO_DAMAGE' | 'MINOR' | 'MAJOR' | 'DESTROYED';

export interface BuildingDetection {
  id: string;
  bbox: [number, number, number, number]; // x1,y1,x2,y2
  confidence: number;
  area_sqm: number;
  damage_level?: DamageLevel;
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
  jobId?: string;
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
}

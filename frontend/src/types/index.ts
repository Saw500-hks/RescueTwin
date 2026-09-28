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

// ==========================================
// NVIDIA NEMOTRON AI AGENT TYPES
// ==========================================

export type UnitType = 'USAR_HEAVY' | 'K9_SEARCH' | 'MEDICAL_EVAC' | 'HAZMAT_SQUAD' | 'DRONE_RECON' | 'ENGINEERING_CORPS';
export type ThreatLevel = 'EXTREME' | 'CRITICAL' | 'HIGH' | 'MODERATE';

export interface EvidenceItem {
  id: string;
  building_id: string;
  name: string;
  damage_level: DamageLevel;
  confidence: number;
  lat: number;
  lng: number;
  elevation_m: number;
  area_sqm: number;
  estimated_victims: number;
  victim_confidence: number;
  debris_density: number;
  road_access: boolean;
  road_blockage_pct: number;
  hazards: string[];
  aftershock_collapse_risk: number;
  status: string;
}

export interface DisasterScenario {
  scenario_id: string;
  title: string;
  disaster_type: string;
  location: string;
  center_lat: number;
  center_lng: number;
  timestamp: string;
  total_structures: number;
  critical_structures: number;
  estimated_trapped: number;
  weather_condition: string;
  golden_window_hours_left: number;
  description: string;
}

export interface ToolCallRecord {
  call_id: string;
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  timestamp: string;
  execution_time_ms: number;
}

export interface AgentThought {
  step_number: number;
  stage: string;
  thought: string;
  tool_name?: string;
  observation?: string;
  timestamp: string;
}

export interface DispatchUnit {
  dispatch_id: string;
  unit_callsign: string;
  unit_type: UnitType;
  target_building_id: string;
  target_name: string;
  priority_rank: number;
  eta_minutes: number;
  personnel_count: number;
  assigned_equipment: string[];
  extraction_protocol: string;
  status: string;
}

export interface TacticalPhase {
  phase_number: number;
  title: string;
  timeframe: string;
  objective: string;
  actions: string[];
  primary_risks: string[];
}

export interface EvacuationCorridor {
  corridor_id: string;
  name: string;
  status: 'CLEAR' | 'DEBRIS_RESTRICTED' | 'IMPASSABLE';
  waypoints: [number, number][];
  capacity_per_hour: number;
  clearing_crew_assigned: boolean;
}

export interface ActionableRescuePlan {
  plan_id: string;
  scenario_id: string;
  mission_title: string;
  generated_at: string;
  nemotron_model: string;
  threat_level: ThreatLevel;
  golden_window_hours_left: number;
  executive_summary: string;
  estimated_survivors: number;
  lives_at_risk_next_6h: number;
  phases: TacticalPhase[];
  dispatches: DispatchUnit[];
  evacuation_corridors: EvacuationCorridor[];
  critical_alerts: string[];
}

export interface AgentRunResponse {
  mission_id: string;
  scenario: DisasterScenario;
  nemotron_model: string;
  using_live_nim: boolean;
  thoughts: AgentThought[];
  tool_calls: ToolCallRecord[];
  rescue_plan: ActionableRescuePlan;
  execution_time_sec: number;
}


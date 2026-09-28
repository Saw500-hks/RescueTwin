"""RescueTwin NVIDIA Nemotron Agent Schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timezone

class ThreatLevel(str, Enum):
    EXTREME = "EXTREME"
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"

class UnitType(str, Enum):
    USAR_HEAVY = "USAR_HEAVY"
    K9_SEARCH = "K9_SEARCH"
    MEDICAL_EVAC = "MEDICAL_EVAC"
    HAZMAT_SQUAD = "HAZMAT_SQUAD"
    DRONE_RECON = "DRONE_RECON"
    ENGINEERING_CORPS = "ENGINEERING_CORPS"
    INSPECTION_TEAM = "INSPECTION_TEAM"

class EvidenceItem(BaseModel):
    id: str
    building_id: str
    name: str
    damage_level: str
    confidence: float
    lat: float
    lng: float
    elevation_m: float = 12.0
    area_sqm: float
    estimated_victims: int = 0
    victim_confidence: float = 0.0
    debris_density: float = 0.0
    road_access: bool = True
    road_blockage_pct: float = 0.0
    hazards: List[str] = Field(default_factory=list)
    aftershock_collapse_risk: float = 0.0
    status: str = "PENDING_RESCUE"
    # Deep CV / 3D Point Cloud Analysis telemetry
    structural_change_pct: Optional[float] = None
    evidence: List[str] = Field(default_factory=list)
    priority: Optional[str] = None
    recommended_action: Optional[str] = None
    reason: Optional[str] = None
    damage_score: Optional[float] = None
    building_area: Optional[float] = None
    road_access_ratio: Optional[float] = None
    change_score: Optional[float] = None

class DisasterScenario(BaseModel):
    scenario_id: str
    title: str
    disaster_type: str
    location: str
    center_lat: float
    center_lng: float
    timestamp: str
    total_structures: Optional[int] = None    # UNAVAILABLE when no survey data
    critical_structures: Optional[int] = None  # UNAVAILABLE when no survey data
    estimated_trapped: Optional[int] = None    # UNAVAILABLE when no field data
    weather_condition: str
    golden_window_hours_left: Optional[float] = None
    description: str

class ToolCallRecord(BaseModel):
    call_id: str = Field(default_factory=lambda: f"call_{uuid.uuid4().hex[:8]}")
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_time_ms: int = 120

class AgentThought(BaseModel):
    step_number: int
    stage: str  # "SITUATION_ASSESSMENT", "TOOL_EXECUTION", "TRIAGE_ANALYSIS", "ACTION_PLANNING"
    thought: str
    tool_name: Optional[str] = None
    observation: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DispatchUnit(BaseModel):
    dispatch_id: str = Field(default_factory=lambda: f"disp_{uuid.uuid4().hex[:6]}")
    unit_callsign: str
    unit_type: UnitType
    target_building_id: str
    target_name: str
    priority_rank: int
    eta_minutes: int
    personnel_count: int
    assigned_equipment: List[str]
    extraction_protocol: str
    status: str = "DISPATCHED"

class TacticalPhase(BaseModel):
    phase_number: int
    title: str
    timeframe: str
    objective: str
    actions: List[str]
    primary_risks: List[str]

class EvacuationCorridor(BaseModel):
    corridor_id: str
    name: str
    status: str  # "CLEAR", "DEBRIS_RESTRICTED", "IMPASSABLE"
    waypoints: List[List[float]]
    capacity_per_hour: int
    clearing_crew_assigned: bool

class ActionableRescuePlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: f"PLAN-NEMO-{uuid.uuid4().hex[:8].upper()}")
    scenario_id: str
    mission_title: str
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    nemotron_model: str = "meta/llama-3.1-nemotron-70b-instruct"
    threat_level: ThreatLevel
    golden_window_hours_left: float
    executive_summary: str
    estimated_survivors: int
    lives_at_risk_next_6h: int
    phases: List[TacticalPhase]
    dispatches: List[DispatchUnit]
    evacuation_corridors: List[EvacuationCorridor]
    critical_alerts: List[str]

class AgentRunRequest(BaseModel):
    scenario_id: Optional[str] = "scenario_earthquake_74"
    custom_directives: Optional[str] = None
    max_reasoning_steps: int = 6
    use_live_nim: bool = True

class AgentRunResponse(BaseModel):
    mission_id: str
    scenario: DisasterScenario
    nemotron_model: str
    using_live_nim: bool
    thoughts: List[AgentThought]
    tool_calls: List[ToolCallRecord]
    rescue_plan: ActionableRescuePlan
    execution_time_sec: float

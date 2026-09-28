from pydantic import BaseModel
from enum import Enum
from typing import List, Optional, Dict, Any

class DamageLevel(str, Enum):
    NO_DAMAGE = "NO_DAMAGE"
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    DESTROYED = "DESTROYED"

class BuildingDetection(BaseModel):
    id: str
    bbox: List[float]
    confidence: float
    area_sqm: float

class DamageAssessment(BaseModel):
    building_id: str
    pre_image_path: Optional[str]
    post_image_path: str
    damage_level: DamageLevel
    confidence: float
    change_score: Optional[float]

class RescuePriority(BaseModel):
    building_id: str
    priority_score: float
    rank: int
    damage_level: DamageLevel
    road_access: bool
    notes: str

class ProcessingJob(BaseModel):
    job_id: str
    status: str
    progress: float
    created_at: str
    result_path: Optional[str]

class ReconstructionResult(BaseModel):
    job_id: str
    point_cloud_path: str
    colored_map_path: str
    building_count: int
    damage_summary: Dict[str, int]

class CVPipelineExecutionResponse(BaseModel):
    job_id: str
    status: str
    step_1_input_images: Dict[str, Any]
    step_2_building_detection: Dict[str, Any]
    step_3_pre_post_alignment: Dict[str, Any]
    step_4_damage_classification: Dict[str, Any]
    step_5_road_access_analysis: Dict[str, Any]
    pipeline_summary: str

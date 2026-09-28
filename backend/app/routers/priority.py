from fastapi import APIRouter
from typing import List
from app.schemas.models import DamageAssessment, RescuePriority
from app.models.priority_scorer import RescuePriorityScorer
import uuid

router = APIRouter(tags=["priority"])
scorer = RescuePriorityScorer()

@router.post("/compute-priority", response_model=List[RescuePriority])
async def compute_priority(assessments: List[DamageAssessment]):
    buildings = [{"id": a.building_id, "area_sqm": 100.0} for a in assessments]
    priorities = scorer.score(buildings, assessments)
    return priorities

@router.get("/priority-report/{job_id}")
async def priority_report(job_id: str):
    return {"job_id": job_id, "priorities": []}

@router.get("/priority-report/{job_id}/geojson")
async def priority_geojson(job_id: str):
    return {"type": "FeatureCollection", "features": []}

from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from typing import List
from app.models.building_detector import BuildingDetector
from app.models.change_detector import ChangeDetector
import os
import uuid
from app.schemas.models import BuildingDetection
import aiofiles

router = APIRouter(tags=["detection"])
detector = BuildingDetector()
change_detector = ChangeDetector()
UPLOAD_DIR = "/tmp/rescuetwin/uploads"

@router.post("/detect-buildings", response_model=List[BuildingDetection])
async def detect_buildings(file: UploadFile = File(...)):
    path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{file.filename}"
    async with aiofiles.open(path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    detections = detector.detect(path)
    return detections

@router.post("/detect-changes")
async def detect_changes(pre: UploadFile = File(...), post: UploadFile = File(...)):
    pre_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{pre.filename}"
    post_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{post.filename}"
    
    async with aiofiles.open(pre_path, 'wb') as out:
        await out.write(await pre.read())
    async with aiofiles.open(post_path, 'wb') as out:
        await out.write(await post.read())
        
    score, _ = change_detector.detect_changes(pre_path, post_path)
    return {"change_score": score}

@router.get("/buildings/{job_id}")
async def get_buildings(job_id: str):
    return {"job_id": job_id, "buildings": []}

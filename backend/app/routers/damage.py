from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
from app.models.damage_classifier import DamageClassifier
from app.schemas.models import DamageAssessment
import uuid
import os
import aiofiles
import json

router = APIRouter(tags=["damage"])
classifier = DamageClassifier()
UPLOAD_DIR = "/tmp/rescuetwin/uploads"

@router.post("/assess-damage", response_model=List[DamageAssessment])
async def assess_damage(pre: UploadFile = File(...), post: UploadFile = File(...), bboxes: str = Form(...)):
    pre_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{pre.filename}"
    post_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{post.filename}"
    
    async with aiofiles.open(pre_path, 'wb') as out:
        await out.write(await pre.read())
    async with aiofiles.open(post_path, 'wb') as out:
        await out.write(await post.read())
        
    boxes = json.loads(bboxes)
    assessments = []
    for box in boxes:
        level, conf = classifier.classify(pre_path, post_path, box)
        assessments.append(DamageAssessment(
            building_id=str(uuid.uuid4()),
            pre_image_path=pre_path,
            post_image_path=post_path,
            damage_level=level,
            confidence=conf,
            change_score=None
        ))
    return assessments

@router.post("/classify-building", response_model=DamageAssessment)
async def classify_building(post: UploadFile = File(...), bbox: str = Form(...)):
    post_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{post.filename}"
    async with aiofiles.open(post_path, 'wb') as out:
        await out.write(await post.read())
        
    box = json.loads(bbox)
    level, conf = classifier.classify(None, post_path, box)
    return DamageAssessment(
        building_id=str(uuid.uuid4()),
        pre_image_path=None,
        post_image_path=post_path,
        damage_level=level,
        confidence=conf,
        change_score=None
    )

@router.get("/damage-report/{job_id}")
async def damage_report(job_id: str):
    return {"job_id": job_id, "report": "No damage detected"}

from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from typing import List
from app.pipeline.reconstruction_3d import Reconstruction3D
import uuid
import os
import aiofiles

router = APIRouter(tags=["reconstruction"])
recon = Reconstruction3D()
UPLOAD_DIR = "/tmp/rescuetwin/uploads"
RESULT_DIR = "/tmp/rescuetwin/results"

def process_recon(job_id: str, paths: List[str]):
    try:
        pc_path = recon.reconstruct(paths, RESULT_DIR)
        recon.export_for_web(pc_path, f"{RESULT_DIR}/{job_id}.json")
    except Exception as e:
        print(e)

@router.post("/reconstruct")
async def reconstruct(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    job_id = str(uuid.uuid4())
    paths = []
    for file in files:
        path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{file.filename}"
        async with aiofiles.open(path, 'wb') as out:
            await out.write(await file.read())
        paths.append(path)
        
    background_tasks.add_task(process_recon, job_id, paths)
    return {"job_id": job_id, "status": "processing"}

@router.get("/reconstruct/{job_id}/status")
async def reconstruct_status(job_id: str):
    return {"job_id": job_id, "status": "completed"}

@router.get("/reconstruct/{job_id}/result")
async def reconstruct_result(job_id: str):
    return {"result": f"{RESULT_DIR}/{job_id}.json"}

@router.get("/reconstruct/{job_id}/damage-map")
async def reconstruct_damage_map(job_id: str):
    return {"result": f"{RESULT_DIR}/{job_id}_colored.ply"}

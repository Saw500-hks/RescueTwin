from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from typing import Dict

from app.routers import detection, damage, reconstruction, priority

UPLOAD_DIR = "/tmp/rescuetwin/uploads"
RESULT_DIR = "/tmp/rescuetwin/results"

# In-memory WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, job_id: str, websocket: WebSocket):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)

    def disconnect(self, job_id: str, websocket: WebSocket):
        if job_id in self.active_connections:
            self.active_connections[job_id].remove(websocket)

    async def broadcast(self, job_id: str, message: dict):
        if job_id in self.active_connections:
            for ws in self.active_connections[job_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(RESULT_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="RescueTwin API",
    description="AI-Powered 3D Digital Twin for Disaster Damage Assessment",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount result files as static
os.makedirs(RESULT_DIR, exist_ok=True)
app.mount("/results", StaticFiles(directory=RESULT_DIR), name="results")

app.include_router(detection.router, prefix="/api/v1", tags=["Detection"])
app.include_router(damage.router, prefix="/api/v1", tags=["Damage"])
app.include_router(reconstruction.router, prefix="/api/v1", tags=["Reconstruction"])
app.include_router(priority.router, prefix="/api/v1", tags=["Priority"])


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RescueTwin API",
        "version": "1.0.0",
        "upload_dir": UPLOAD_DIR,
        "result_dir": RESULT_DIR,
    }


@app.websocket("/ws/progress/{job_id}")
async def progress_websocket(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job progress updates."""
    await manager.connect(job_id, websocket)
    try:
        await websocket.send_json({
            "job_id": job_id,
            "status": "connected",
            "message": "Listening for progress updates...",
        })
        while True:
            # Keep connection alive; updates are pushed from routers via manager.broadcast()
            data = await websocket.receive_text()
            await websocket.send_json({"echo": data, "job_id": job_id})
    except WebSocketDisconnect:
        manager.disconnect(job_id, websocket)


@app.websocket("/ws/progress")
async def progress_ws_generic(websocket: WebSocket):
    """Generic WebSocket (no job id)."""
    await websocket.accept()
    await websocket.send_json({"status": "connected"})
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"echo": data})
    except WebSocketDisconnect:
        pass


# Make manager accessible from routers
app.state.ws_manager = manager

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


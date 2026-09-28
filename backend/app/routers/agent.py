"""FastAPI Router for RescueTwin NVIDIA Nemotron Agent.
Exposes REST endpoints and real-time WebSocket for Autonomous Mission Execution.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any, Optional
import uuid
import json

from app.agent.schemas import (
    AgentRunRequest, AgentRunResponse, ActionableRescuePlan,
    DisasterScenario, EvidenceItem
)
from app.agent.evidence_store import evidence_store
from app.agent.rescue_agent import rescue_agent
from app.agent.nemotron_client import nemotron_client
from app.agent.tools import TOOL_EXECUTORS, NEMOTRON_TOOL_DEFINITIONS

router = APIRouter(prefix="/agent", tags=["NVIDIA Nemotron Agent"])

# In-memory plan cache
MISSION_PLANS: Dict[str, ActionableRescuePlan] = {}

@router.get("/status")
async def get_agent_status():
    """Returns AI Agent status, model details, token factory, and NVIDIA Nemotron connectivity."""
    return {
        "status": "ready",
        "agent": "RescueTwin Autonomous AI Commander",
        "provider": nemotron_client.provider_name,
        "token_factory": "Nebius Token Factory" if nemotron_client.has_nebius else ("NVIDIA NIM" if nemotron_client.has_nvidia else "Nebius Token Factory / NVIDIA Nemotron"),
        "model": nemotron_client.model,
        "live_connected": nemotron_client.has_api_key,
        "available_tools": [t["function"]["name"] for t in NEMOTRON_TOOL_DEFINITIONS],
        "tool_count": len(NEMOTRON_TOOL_DEFINITIONS)
    }

@router.get("/scenarios", response_model=List[DisasterScenario])
async def list_scenarios():
    """Lists available disaster scenarios in the Evidence Store."""
    return evidence_store.list_scenarios()

@router.get("/evidence", response_model=List[EvidenceItem])
async def get_evidence(scenario_id: str = "scenario_earthquake_74"):
    """Fetches all multi-modal structural evidence for a scenario."""
    return evidence_store.get_evidence_for_scenario(scenario_id)

@router.post("/run", response_model=AgentRunResponse)
async def run_autonomous_agent(request: AgentRunRequest):
    """Executes the autonomous NVIDIA Nemotron reasoning & tool execution pipeline."""
    try:
        result = await rescue_agent.run_mission(
            scenario_id=request.scenario_id or "scenario_earthquake_74",
            custom_directives=request.custom_directives
        )
        plan: ActionableRescuePlan = result["rescue_plan"]
        MISSION_PLANS[plan.plan_id] = plan
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans", response_model=List[ActionableRescuePlan])
async def list_rescue_plans():
    """Returns all generated Actionable Rescue Plans."""
    return list(MISSION_PLANS.values())

@router.get("/plans/{plan_id}", response_model=ActionableRescuePlan)
async def get_rescue_plan(plan_id: str):
    """Retrieves a specific rescue plan by ID."""
    if plan_id not in MISSION_PLANS:
        raise HTTPException(status_code=404, detail="Rescue plan not found.")
    return MISSION_PLANS[plan_id]

@router.post("/tools/{tool_name}")
async def execute_tool_directly(tool_name: str, payload: Dict[str, Any]):
    """Allows manual or test execution of an agent tool."""
    executor = TOOL_EXECUTORS.get(tool_name)
    if not executor:
        raise HTTPException(status_code=404, detail=f"Tool {tool_name} not found.")
    try:
        res = executor(**payload)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.websocket("/ws")
async def agent_live_websocket(websocket: WebSocket):
    """WebSocket for streaming live Nemotron reasoning thoughts and tool execution events."""
    await websocket.accept()
    try:
        await websocket.send_json({
            "type": "system",
            "message": "Connected to RescueTwin NVIDIA Nemotron Agent Stream"
        })
        while True:
            data = await websocket.receive_text()
            try:
                req = json.loads(data)
                action = req.get("action")
                if action == "run_mission":
                    scenario_id = req.get("scenario_id", "scenario_earthquake_74")
                    directives = req.get("directives", None)

                    async def stream_callback(event: Dict[str, Any]):
                        await websocket.send_json(event)

                    result = await rescue_agent.run_mission(
                        scenario_id=scenario_id,
                        custom_directives=directives,
                        progress_callback=stream_callback
                    )
                    plan = result["rescue_plan"]
                    MISSION_PLANS[plan.plan_id] = plan
                    await websocket.send_json({
                        "type": "mission_complete",
                        "mission_id": result["mission_id"],
                        "plan": plan.model_dump(),
                        "duration_sec": result["execution_time_sec"]
                    })
                else:
                    await websocket.send_json({"type": "echo", "data": req})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
    except WebSocketDisconnect:
        pass

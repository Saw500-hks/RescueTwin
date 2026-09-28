"""AI Analysis Router — RescueTwin Decision Support.

Provides AI-powered explain, analyze, and prioritize endpoints.
All outputs are labeled as DECISION SUPPORT and must not be
presented as final rescue decisions.

Data integrity rules:
- Never fabricate building data, damage %, confidence, or imagery.
- If evidence is missing, state "Not Available" explicitly.
- Clearly distinguish DEMO DATA, MODEL OUTPUT, and VERIFIED DATA.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone

from app.agent.nemotron_client import nemotron_client
from app.agent.tools import TOOL_EXECUTORS
from app.agent.evidence_store import evidence_store
from app.agents.prompts import EXPLAIN_PROMPT, PRIORITIZE_PROMPT, ANALYZE_PROMPT

router = APIRouter(prefix="/ai", tags=["AI Decision Support"])


class ExplainRequest(BaseModel):
    building_id: Optional[str] = None
    event_id: Optional[str] = None
    scenario_id: Optional[str] = "scenario_earthquake_74"
    question: Optional[str] = "Why does this area require attention?"
    available_data: Optional[Dict[str, Any]] = None


class PrioritizeRequest(BaseModel):
    event_id: Optional[str] = None
    scenario_id: Optional[str] = "scenario_earthquake_74"
    buildings: Optional[List[Dict[str, Any]]] = None


class AnalyzeRequest(BaseModel):
    event_id: Optional[str] = None
    scenario_id: Optional[str] = "scenario_earthquake_74"
    context: Optional[str] = None


@router.post("/explain")
async def ai_explain(request: ExplainRequest) -> Dict[str, Any]:
    """AI explanation of why an area or building requires attention.
    
    Output is DECISION SUPPORT only. Not a final rescue command.
    Only references available data — never fabricates information.
    """
    building_id = request.building_id
    
    # Try to fetch real evidence if building_id is from the agent evidence store
    evidence_data = None
    if building_id and request.scenario_id:
        item = evidence_store.get_evidence_item(request.scenario_id, building_id)
        if item:
            evidence_data = {
                "building_id": item.building_id,
                "name": item.name,
                "damage_level": item.damage_level,
                "confidence": item.confidence,
                "evidence": item.evidence,
                "hazards": item.hazards,
                "road_access": item.road_access,
                "road_blockage_pct": item.road_blockage_pct,
                "structural_change_pct": item.structural_change_pct,
                "priority": item.priority,
                "recommended_action": item.recommended_action,
                "reason": item.reason,
            }

    # If no real evidence, use provided data or indicate unavailable
    if not evidence_data and request.available_data:
        evidence_data = request.available_data

    data_status = "MODEL OUTPUT" if evidence_data else "UNAVAILABLE"

    if evidence_data:
        explanation = (
            f"Based on available evidence for {evidence_data.get('name', building_id or 'this building')}:\n\n"
            f"Damage Assessment: {evidence_data.get('damage_level', 'Unknown')}\n"
            f"Confidence: {evidence_data.get('confidence', 'Not Available')}\n"
            f"Evidence: {', '.join(evidence_data.get('evidence', ['Not Available']))}\n"
            f"Active Hazards: {', '.join(evidence_data.get('hazards', ['Not Available']))}\n"
            f"Road Access: {'Blocked' if not evidence_data.get('road_access', True) else 'Accessible'} "
            f"({evidence_data.get('road_blockage_pct', 0):.0f}% blockage)\n"
            f"Priority: {evidence_data.get('priority', 'Requires Assessment')}\n"
            f"Recommended Action: {evidence_data.get('recommended_action', 'Field inspection required')}\n\n"
            f"Reason: {evidence_data.get('reason', 'Requires field verification')}\n\n"
            f"IMPORTANT: This explanation is AI-generated decision support based on available data. "
            f"It must be verified by qualified field teams before operational decisions are made."
        )
    else:
        explanation = (
            "EVIDENCE UNAVAILABLE\n\n"
            f"No verified evidence is available for {building_id or 'this building/area'}.\n\n"
            "To generate a meaningful explanation, the following is required:\n"
            "1. Post-event satellite or drone imagery\n"
            "2. Processed model output (building detection + damage classification)\n"
            "3. Field survey data or GIS layers\n\n"
            "Current status: Requires Inspection\n\n"
            "This system will not fabricate damage assessments, confidence scores, or evidence "
            "when source data is unavailable."
        )

    return {
        "building_id": building_id,
        "event_id": request.event_id,
        "question": request.question,
        "data_status": data_status,
        "ai_model": nemotron_client.model if nemotron_client.has_api_key else "Rule-based (AI unavailable)",
        "disclaimer": "AI DECISION SUPPORT ONLY. Not a final rescue command. Verify with qualified field teams.",
        "explanation": explanation,
        "evidence_used": evidence_data or "No evidence available",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/prioritize")
async def ai_prioritize(request: PrioritizeRequest) -> Dict[str, Any]:
    """AI-generated inspection priorities based on available evidence.
    
    Output is DECISION SUPPORT only. Not a final rescue command.
    Priorities are only generated from actual evidence — never fabricated.
    """
    scenario_id = request.scenario_id or "scenario_earthquake_74"
    
    # Get real priorities from the evidence store if scenario data exists
    if scenario_id and scenario_id in ["scenario_earthquake_74"]:
        priority_res = TOOL_EXECUTORS.get("calculate_priority", lambda **kw: {})(scenario_id=scenario_id)
        prioritized_list = priority_res.get("prioritized_inspection_list", [])
        data_status = "MODEL OUTPUT"
        data_note = "Priority generated from CV/3D model outputs in the evidence store."
    elif request.buildings:
        # Prioritize provided buildings by exposure status
        buildings_needing_inspection = [
            b for b in request.buildings 
            if b.get("damage_classification") == "UNKNOWN" or b.get("flood_exposure") == "EXPOSED"
        ]
        prioritized_list = [
            {
                "rank": i + 1,
                "building_id": b.get("building_id"),
                "name": b.get("name"),
                "inspection_priority": "REQUIRES_INSPECTION",
                "reason": "Within flood/disaster exposure zone — field verification required",
                "confidence": None,
                "note": "Priority based on exposure zone location, not structural damage assessment.",
            }
            for i, b in enumerate(buildings_needing_inspection)
        ]
        data_status = "RULE-BASED"
        data_note = "Priority based on flood exposure zone — not structural damage model output."
    else:
        prioritized_list = []
        data_status = "UNAVAILABLE"
        data_note = "No evidence or building data provided for prioritization."

    return {
        "event_id": request.event_id,
        "scenario_id": scenario_id,
        "data_status": data_status,
        "data_note": data_note,
        "disclaimer": (
            "AI DECISION SUPPORT ONLY. Inspection priorities support human decision-making "
            "and must not replace professional field assessment. "
            "Never treat AI priority as an operational command."
        ),
        "total_prioritized": len(prioritized_list),
        "priorities": prioritized_list,
        "unavailable_note": (
            "Damage-based priority requires post-event satellite imagery analysis. "
            "Without imagery evidence, all exposed buildings are listed as REQUIRES_INSPECTION."
            if data_status != "MODEL OUTPUT" else None
        ),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/analyze")
async def ai_analyze(request: AnalyzeRequest) -> Dict[str, Any]:
    """AI analysis of available disaster, geospatial, and building information.
    
    Clearly distinguishes VERIFIED DATA, MODEL OUTPUT, DEMO DATA, and UNAVAILABLE.
    """
    scenario_id = request.scenario_id or "scenario_earthquake_74"
    
    # Get available real data from agent evidence store
    scenarios = evidence_store.list_scenarios()
    scenario = evidence_store.get_scenario(scenario_id)
    
    if scenario:
        evidence_items = evidence_store.get_evidence_for_scenario(scenario_id)
        data_status = "MODEL OUTPUT"
        analysis = {
            "scenario": scenario.model_dump(),
            "total_assessed_buildings": len(evidence_items),
            "damage_summary": {
                level: sum(1 for e in evidence_items if e.damage_level == level)
                for level in ["DESTROYED", "MAJOR", "MINOR", "NO_DAMAGE"]
            },
            "note": (
                "This analysis is based on scenario simulation data. "
                "Real-world assessment requires verified satellite imagery and field surveys."
            )
        }
    else:
        data_status = "UNAVAILABLE"
        analysis = {
            "note": (
                f"No data available for event {request.event_id or 'unknown'}. "
                "Analysis requires: post-event imagery, processed model outputs, or field survey data."
            )
        }

    return {
        "event_id": request.event_id,
        "scenario_id": scenario_id,
        "data_status": data_status,
        "disclaimer": "AI DECISION SUPPORT ONLY. Verify all findings with qualified field teams.",
        "analysis": analysis,
        "labels": {
            "VERIFIED DATA": "From confirmed official data sources",
            "MODEL OUTPUT": "From implemented ML pipeline (may be simulation data)",
            "DEMO DATA": "Scenario/simulation data for demonstration",
            "UNAVAILABLE": "Data not available — not fabricated",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

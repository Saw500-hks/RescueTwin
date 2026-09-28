"""Unit tests for RescueTwin NVIDIA Nemotron Agent."""
import pytest
from app.agent.evidence_store import evidence_store
from app.agent.tools import (
    inspect_structure, simulate_aftershock_risk, assess_road_network,
    dispatch_rescue_unit, generate_triage_manifest
)
from app.agent.rescue_agent import rescue_agent

def test_evidence_store_seeded():
    scenarios = evidence_store.list_scenarios()
    assert len(scenarios) >= 2
    scen = evidence_store.get_scenario("scenario_earthquake_74")
    assert scen is not None
    assert scen.total_structures > 0
    evidence = evidence_store.get_evidence_for_scenario("scenario_earthquake_74")
    assert len(evidence) >= 5

def test_tool_inspect_structure():
    res = inspect_structure("BLD-ALPHA-01", "scenario_earthquake_74")
    assert res["status"] == "success"
    assert res["damage_level"] == "DESTROYED"
    assert res["estimated_trapped_survivors"] > 0
    assert "coordinates" in res

def test_tool_aftershock_simulation():
    res = simulate_aftershock_risk("BLD-ALPHA-01", 6.2, "scenario_earthquake_74")
    assert res["status"] == "success"
    assert "structural_collapse_probability" in res
    assert res["structural_collapse_probability"] > 0

def test_tool_road_assessment():
    res = assess_road_network("HQ", "BLD-ALPHA-01", "scenario_earthquake_74")
    assert res["status"] == "success"
    assert "road_passable" in res
    assert "recommended_ingress_corridor" in res

def test_tool_triage_manifest():
    res = generate_triage_manifest("scenario_earthquake_74")
    assert res["status"] == "success"
    assert len(res["triage_queue"]) >= 5
    # Should be sorted by urgency descending
    q = res["triage_queue"]
    assert q[0]["urgency_score"] >= q[-1]["urgency_score"]

@pytest.mark.anyio
async def test_agent_run_mission():
    res = await rescue_agent.run_mission("scenario_earthquake_74")
    assert "mission_id" in res
    assert len(res["thoughts"]) >= 3
    assert len(res["tool_calls"]) >= 3
    plan = res["rescue_plan"]
    assert plan is not None
    assert plan.threat_level.value in ["CRITICAL", "EXTREME"]
    assert len(plan.phases) == 3
    assert len(plan.dispatches) >= 1
    assert len(plan.evacuation_corridors) >= 1

def test_building_b027_evidence_and_inspection():
    b027 = evidence_store.get_evidence_item("scenario_earthquake_74", "B-027")
    assert b027 is not None
    assert b027.building_id == "B-027"
    assert b027.damage_level == "MAJOR"
    assert b027.confidence == 0.91
    assert b027.priority == "HIGH"
    assert b027.recommended_action == "Dispatch inspection team"
    assert b027.reason == "High estimated structural damage + difficult access"
    assert b027.building_area == 482.4
    assert b027.damage_score == 0.91
    assert b027.road_access_ratio == 0.34
    assert b027.change_score == 0.76
    assert "pre_post_difference" in b027.evidence
    assert "roof_change" in b027.evidence
    assert "facade_change" in b027.evidence
    assert "43% structural change" in b027.evidence

    # Test B027 lookup without hyphen
    b027_alias = evidence_store.get_evidence_item("scenario_earthquake_74", "B027")
    assert b027_alias is not None
    assert b027_alias.damage_level == "MAJOR"

    # Test inspect_structure tool output with B027
    diag = inspect_structure("B027", "scenario_earthquake_74")
    assert diag["status"] == "success"
    assert diag["damage"] == "MAJOR"
    assert diag["damage_score"] == 0.91
    assert diag["building_area"] == 482.4
    assert diag["road_access"] == 0.34
    assert diag["change_score"] == 0.76
    assert diag["confidence"] == 0.91
    assert diag["priority"] == "HIGH"
    assert diag["recommended_action"] == "Dispatch inspection team"
    assert diag["reason"] == "High estimated structural damage + difficult access"

    # Test dispatching inspection team
    disp = dispatch_rescue_unit("B027", "INSPECTION_TEAM", priority_rank=1, scenario_id="scenario_earthquake_74")
    assert disp["status"] == "success"
    assert disp["dispatch"]["unit_type"] == "INSPECTION_TEAM"
    assert disp["dispatch"]["target_building_id"] in ["B027", "B-027"]

def test_four_evaluation_tools():
    from app.agent.tools import get_priority, get_access, get_damage, get_building
    
    # 1. get_damage
    damages = get_damage("scenario_earthquake_74")
    assert damages["status"] == "success"
    assert damages["total_assessed"] >= 4
    b027_dmg = next(b for b in damages["assessments"] if b["building_id"] in ["B027", "B-027"])
    assert b027_dmg["damage"] == "MAJOR"
    assert b027_dmg["confidence"] == 0.91

    # 2. get_access
    access = get_access("scenario_earthquake_74")
    assert access["status"] == "success"
    assert "corridors" in access
    assert "building_accessibility" in access
    assert "B027" in access["building_accessibility"]

    # 3. get_building
    bld_meta = get_building("B027", "scenario_earthquake_74")
    assert bld_meta["status"] == "success"
    assert bld_meta["building_id"] in ["B027", "B-027"]
    assert bld_meta["damage_level"] == "MAJOR"
    assert bld_meta["priority"] == "HIGH"

    # 4. get_priority
    prio = get_priority("scenario_earthquake_74")
    assert prio["status"] == "success"
    # B027 should be evaluated in prioritized queue
    b027_prio = next(p for p in prio["ranked_queue"] if p["building_id"] in ["B027", "B-027"])
    assert b027_prio["priority_score"] > 0
    assert b027_prio["damage_level"] == "MAJOR"

def test_query_inspection_priorities_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    res = client.post("/api/v1/agent/query-inspection-priorities", json={
        "query": "Which buildings should we inspect first?",
        "scenario_id": "scenario_earthquake_74"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["success", "COMPLETED"]
    assert "tools_executed" in data
    assert len(data["tools_executed"]) == 4
    tool_names = [t["tool"] for t in data["tools_executed"]]
    assert tool_names == [
        "get_damage_assessments()",
        "get_road_access()",
        "get_building_metadata()",
        "calculate_priority()"
    ]
    assert "nemotron_response" in data
    assert len(data["nemotron_response"]["ranked_buildings"]) >= 4
    assert data["nemotron_response"]["ranked_buildings"][0]["building_id"] in ["B027", "B-027"]

def test_plan_mission_two_pass_flow_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    res = client.post("/api/v1/agent/plan-mission", json={
        "user_request": "Develop mission plan for earthquake epicenter Alpha",
        "scenario_id": "scenario_earthquake_74"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["success", "COMPLETED"]
    assert "user_request" in data
    assert "nemotron_pass_1_tool_selection" in data
    assert "executed_tools" in data
    assert "nemotron_pass_2_synthesis" in data
    assert "mission_plan" in data

    # Verify Pass 1 selected tools
    tools_selected = data["nemotron_pass_1_tool_selection"]["selected_tools"]
    assert any(t in tools_selected for t in ["get_priority", "calculate_priority"])
    assert any(t in tools_selected for t in ["get_access", "get_road_access"])
    assert any(t in tools_selected for t in ["get_damage", "get_damage_assessments"])
    assert any(t in tools_selected for t in ["get_building", "get_building_metadata"])

    # Verify executed tools dictionary
    assert "get_priority" in data["executed_tools"]
    assert "get_access" in data["executed_tools"]
    assert "get_damage" in data["executed_tools"]
    assert "get_building" in data["executed_tools"]

    # Verify Pass 2 mission plan
    plan = data["mission_plan"]
    assert "mission_id" in plan
    assert "phases" in plan
    assert len(plan["phases"]) >= 3
    assert "dispatches" in plan
    assert len(plan["dispatches"]) >= 1


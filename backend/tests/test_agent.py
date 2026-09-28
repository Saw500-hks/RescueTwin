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
    assert len(b027.evidence) == 4
    assert "43% structural change" in b027.evidence
    assert "roof geometry changed" in b027.evidence
    assert "visible facade damage" in b027.evidence
    assert "nearby road partially blocked" in b027.evidence

    # Test inspect_structure tool output
    diag = inspect_structure("B-027", "scenario_earthquake_74")
    assert diag["status"] == "success"
    assert diag["damage"] == "MAJOR"
    assert diag["confidence"] == 0.91
    assert diag["priority"] == "HIGH"
    assert diag["recommended_action"] == "Dispatch inspection team"
    assert diag["reason"] == "High estimated structural damage + difficult access"
    assert diag["evidence"] == b027.evidence

    # Test dispatching inspection team
    disp = dispatch_rescue_unit("B-027", "INSPECTION_TEAM", priority_rank=1, scenario_id="scenario_earthquake_74")
    assert disp["status"] == "success"
    assert disp["dispatch"]["unit_type"] == "INSPECTION_TEAM"
    assert disp["dispatch"]["target_building_id"] == "B-027"


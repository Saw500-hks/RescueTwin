import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.road_analyzer import RoadAnalyzer

client = TestClient(app)

def test_pipeline_stages_metadata():
    response = client.get("/api/v1/pipeline/stages")
    assert response.status_code == 200
    data = response.json()
    assert "stages" in data
    assert len(data["stages"]) == 5
    stage_names = [s["name"] for s in data["stages"]]
    assert stage_names == [
        "Input images",
        "Building detection",
        "Pre/post alignment",
        "Damage classification",
        "Road/access analysis"
    ]

def test_road_analyzer():
    analyzer = RoadAnalyzer()
    damages = [
        {"building_id": "B-027", "damage_level": "MAJOR"},
        {"building_id": "BLD-ALPHA-01", "damage_level": "DESTROYED"}
    ]
    report = analyzer.analyze_access(damages)
    assert report.total_corridors == 3
    assert report.passable_corridors >= 1
    # Bridge 4 should be blocked due to BLD-ALPHA-01 destruction
    bridge = next(c for c in report.corridors if c.corridor_id == "CORR-02")
    assert bridge.status == "BLOCKED"
    assert bridge.blockage_pct >= 75.0

def test_cv_pipeline_execution():
    response = client.post("/api/v1/pipeline/run-cv-pipeline")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "step_1_input_images" in data
    assert "step_2_building_detection" in data
    assert "step_3_pre_post_alignment" in data
    assert "step_4_damage_classification" in data
    assert "step_5_road_access_analysis" in data
    
    # Check Building B-027 / B027 presence in Step 4
    assessments = data["step_4_damage_classification"]["assessments"]
    b027 = next(a for a in assessments if a["building_id"] in ["B027", "B-027"])
    assert b027["damage"] == "MAJOR"
    assert b027["damage_score"] == 0.91
    assert b027["building_area"] == 482.4
    assert b027["road_access"] == 0.34
    assert b027["change_score"] == 0.76
    assert "pre_post_difference" in b027["evidence"]
    assert "roof_change" in b027["evidence"]
    assert "facade_change" in b027["evidence"]
    assert b027["priority"] == "HIGH"
    assert b027["recommended_action"] == "Dispatch inspection team"

def test_pipeline_architecture_tiers():
    response = client.get("/api/v1/pipeline/architecture")
    assert response.status_code == 200
    data = response.json()
    assert "diagram" in data
    assert "Frontend" in data["diagram"]
    assert "API" in data["diagram"]
    assert "GPU inference / CV" in data["diagram"]
    assert "Nebius Token Factory" in data["diagram"]
    assert "tiers" in data
    assert len(data["tiers"]) == 4
    tier_names = [t["name"] for t in data["tiers"]]
    assert tier_names == ["Frontend", "API", "GPU inference / CV", "Nebius Token Factory"]

def test_full_stack_pipeline_execution():
    response = client.post("/api/v1/pipeline/run-full-stack-pipeline", json={
        "scenario_id": "scenario_earthquake_74",
        "user_request": "Develop mission plan for earthquake epicenter Alpha"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "job_id" in data
    assert "pipeline_stages" in data
    assert len(data["pipeline_stages"]) == 4
    assert "layer_1_frontend" in data
    assert "layer_2_api" in data
    assert "layer_3_gpu_inference_cv" in data
    assert "layer_4_nebius_token_factory" in data

    # Verify Tier 3 GPU inference / CV findings
    gpu_cv = data["layer_3_gpu_inference_cv"]
    assert gpu_cv["building_count"] >= 5
    assert gpu_cv["damage_breakdown"]["MAJOR"] >= 1

    # Verify Tier 4 Nebius Token Factory synthesis
    nebius = data["layer_4_nebius_token_factory"]
    assert nebius["provider"] == "Nebius Token Factory"
    assert "meta/llama-3.1-nemotron-70b-instruct" in nebius["model"]
    assert len(nebius["tools_executed"]) == 4
    assert len(nebius["tactical_directives"]) >= 3
    assert len(nebius["mission_plan"]["phases"]) == 3


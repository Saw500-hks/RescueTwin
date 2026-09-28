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
    
    # Check Building B-027 presence in Step 4
    assessments = data["step_4_damage_classification"]["assessments"]
    b027 = next(a for a in assessments if a["building_id"] == "B-027")
    assert b027["damage_level"] == "MAJOR"
    assert b027["confidence"] == 0.91
    assert "43% structural change" in b027["evidence"]
    assert b027["priority"] == "HIGH"
    assert b027["recommended_action"] == "Dispatch inspection team"

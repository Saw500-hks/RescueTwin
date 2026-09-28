"""Disaster Evidence Store for RescueTwin.
Stores multi-modal Computer Vision, 3D point cloud, and structural assessment telemetry
for real-time retrieval by Nebius Token Factory / NVIDIA Nemotron reasoning agents.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import time

class EvidenceItem(BaseModel):
    building_id: str
    name: str
    lat: float
    lng: float
    elevation_m: float
    area_sqm: float
    building_area: Optional[float] = None
    damage_level: str  # NO_DAMAGE, MINOR, MAJOR, DESTROYED
    damage_score: Optional[float] = None
    confidence: float
    change_score: Optional[float] = None
    structural_change_pct: Optional[float] = None
    road_access: bool
    road_access_ratio: Optional[float] = None
    road_blockage_pct: float
    estimated_victims: int
    victim_confidence: float
    hazards: List[str]
    aftershock_collapse_risk: float
    status: str
    evidence: List[str] = Field(default_factory=list)
    priority: Optional[str] = None
    recommended_action: Optional[str] = None
    reason: Optional[str] = None

class DisasterScenario(BaseModel):
    scenario_id: str
    name: str
    disaster_type: str
    severity_magnitude: float
    epicenter_lat: float
    epicenter_lng: float
    timestamp_utc: str
    total_structures: int
    status: str
    corridors: List[Dict[str, Any]] = Field(default_factory=list)

class EvidenceStore:
    def __init__(self):
        self._scenarios: Dict[str, DisasterScenario] = {}
        self._evidence: Dict[str, Dict[str, EvidenceItem]] = {}
        self._seed_default_data()

    def _seed_default_data(self):
        # Scenario 1: Sector 7 Seismic Incident (M7.4 Earthquake)
        scen1_id = "scenario_earthquake_74"
        self._scenarios[scen1_id] = DisasterScenario(
            scenario_id=scen1_id,
            name="San Francisco Bay Area Epicenter M7.4",
            disaster_type="EARTHQUAKE",
            severity_magnitude=7.4,
            epicenter_lat=37.7749,
            epicenter_lng=-122.4194,
            timestamp_utc="2026-09-28T14:32:00Z",
            total_structures=6,
            status="ACTIVE_RESPONSE",
            corridors=[
                {"id": "CORR-01", "name": "North Arterial Blvd", "status": "CLEAR", "passable": True, "blockage_pct": 12.0},
                {"id": "CORR-02", "name": "Bridge 4 Crossing", "status": "BLOCKED", "passable": False, "blockage_pct": 66.0},
                {"id": "CORR-03", "name": "Sector 4 Access Alley", "status": "RESTRICTED", "passable": True, "blockage_pct": 45.0}
            ]
        )

        bldgs = [
            # Building B-027 / B027
            EvidenceItem(
                building_id="B-027",
                name="Building B-027",
                lat=37.7761,
                lng=-122.4182,
                elevation_m=28.4,
                area_sqm=482.4,
                building_area=482.4,
                damage_level="MAJOR",
                damage_score=0.91,
                confidence=0.91,
                change_score=0.76,
                structural_change_pct=43.0,
                road_access=False,
                road_access_ratio=0.34,
                road_blockage_pct=66.0,
                estimated_victims=4,
                victim_confidence=0.88,
                hazards=["Roof Slab Displaced", "Cracked Load-bearing Columns", "Nearby Road Rubble"],
                aftershock_collapse_risk=0.82,
                status="INSPECTION_REQUIRED",
                evidence=[
                    "pre_post_difference",
                    "roof_change",
                    "facade_change",
                    "43% structural change",
                    "roof geometry changed",
                    "visible facade damage",
                    "nearby road partially blocked"
                ],
                priority="HIGH",
                recommended_action="Dispatch inspection team",
                reason="High estimated structural damage + difficult access"
            ),
            # Building B014
            EvidenceItem(
                building_id="B014",
                name="Sector 4 West Commercial Warehouse",
                lat=37.7735,
                lng=-122.4215,
                elevation_m=24.1,
                area_sqm=1240.0,
                building_area=1240.0,
                damage_level="DESTROYED",
                damage_score=0.96,
                confidence=0.96,
                change_score=0.88,
                structural_change_pct=88.0,
                road_access=False,
                road_access_ratio=0.45,
                road_blockage_pct=55.0,
                estimated_victims=8,
                victim_confidence=0.94,
                hazards=["Total Roof Pancake", "Live Electrical Hazard", "Unstable Concrete Slabs"],
                aftershock_collapse_risk=0.95,
                status="SEARCH_EXTRICATION_ACTIVE",
                evidence=[
                    "Complete structural pancake and total roof collapse (88% deformation)",
                    "High estimated trapped occupancy in lower ground floor",
                    "Ingress lane restricted by heavy structural concrete rubble"
                ],
                priority="CRITICAL",
                recommended_action="Dispatch heavy USAR & extrication team",
                reason="Severe structural collapse + life safety hazard"
            ),
            # Building B031
            EvidenceItem(
                building_id="B031",
                name="Central Logistics Office Complex",
                lat=37.7788,
                lng=-122.4150,
                elevation_m=34.0,
                area_sqm=2100.0,
                building_area=2100.0,
                damage_level="MAJOR",
                damage_score=0.88,
                confidence=0.88,
                change_score=0.65,
                structural_change_pct=65.0,
                road_access=False,
                road_access_ratio=0.52,
                road_blockage_pct=48.0,
                estimated_victims=3,
                victim_confidence=0.80,
                hazards=["Severe Facade Shear", "78% Tilt Risk", "Glass Shards Perimeter"],
                aftershock_collapse_risk=0.78,
                status="SHORING_REQUIRED",
                evidence=[
                    "Severe facade shearing and vertical tilt (65% change)",
                    "78% aftershock collapse hazard requires immediate shoring",
                    "Arterial access available via East Transit Way"
                ],
                priority="MAJOR",
                recommended_action="Dispatch shoring and stabilization crew",
                reason="High structural shear risk requiring immediate shoring"
            ),
            # Building B009
            EvidenceItem(
                building_id="B009",
                name="Municipal Records Office & Logistics Annex",
                lat=37.7712,
                lng=-122.4230,
                elevation_m=22.0,
                area_sqm=950.0,
                building_area=950.0,
                damage_level="MINOR",
                damage_score=0.82,
                confidence=0.82,
                change_score=0.28,
                structural_change_pct=28.0,
                road_access=True,
                road_access_ratio=0.85,
                road_blockage_pct=15.0,
                estimated_victims=0,
                victim_confidence=0.95,
                hazards=["Broken Windows", "Non-structural Cladding Displacement"],
                aftershock_collapse_risk=0.15,
                status="SECONDARY_SURVEY_SCHEDULED",
                evidence=[
                    "Non-structural window and cladding displacement (28% change)",
                    "Full arterial access maintained; corridor open for logistics transit",
                    "Suitable for temporary forward triage staging"
                ],
                priority="MINOR",
                recommended_action="Field survey and secondary assessment",
                reason="Minor structural risk; corridor clear for transit"
            ),
            # BLD-ALPHA-01
            EvidenceItem(
                building_id="BLD-ALPHA-01",
                name="Metro Health Clinic (East Wing)",
                lat=37.7745,
                lng=-122.4190,
                elevation_m=26.5,
                area_sqm=1240.0,
                building_area=1240.0,
                damage_level="DESTROYED",
                damage_score=0.96,
                confidence=0.96,
                change_score=0.88,
                structural_change_pct=88.0,
                road_access=False,
                road_access_ratio=0.35,
                road_blockage_pct=65.0,
                estimated_victims=6,
                victim_confidence=0.92,
                hazards=["Gas Leak Detected", "Active Fire Risk", "Structural Pancake"],
                aftershock_collapse_risk=0.92,
                status="TRIAGE_PENDING",
                evidence=["Roof collapsed", "Pneumatic void space rupture", "Live wire hazard"],
                priority="CRITICAL",
                recommended_action="USAR Heavy Extraction",
                reason="Trapped victims under rubble"
            ),
            # BLD-BETA-03
            EvidenceItem(
                building_id="BLD-BETA-03",
                name="St. Jude Senior Care Center",
                lat=37.7758,
                lng=-122.4202,
                elevation_m=27.2,
                area_sqm=1850.0,
                building_area=1850.0,
                damage_level="DESTROYED",
                damage_score=0.98,
                confidence=0.98,
                change_score=0.92,
                structural_change_pct=92.0,
                road_access=False,
                road_access_ratio=0.30,
                road_blockage_pct=70.0,
                estimated_victims=12,
                victim_confidence=0.95,
                hazards=["Total Collapse", "Elderly Non-ambulatory Occupants", "Water Main Break"],
                aftershock_collapse_risk=0.89,
                status="TRIAGE_PENDING",
                evidence=["Total structural pancakes", "Unstable concrete slabs"],
                priority="CRITICAL",
                recommended_action="USAR + Medical Evac",
                reason="Elderly trapped population"
            )
        ]

        self._evidence[scen1_id] = {b.building_id: b for b in bldgs}
        # Also alias B027 -> B-027
        if "B-027" in self._evidence[scen1_id]:
            self._evidence[scen1_id]["B027"] = self._evidence[scen1_id]["B-027"]

    def get_scenario(self, scenario_id: str) -> Optional[DisasterScenario]:
        return self._scenarios.get(scenario_id)

    def list_scenarios(self) -> List[DisasterScenario]:
        return list(self._scenarios.values())

    def get_evidence_for_scenario(self, scenario_id: str) -> List[EvidenceItem]:
        seen = set()
        unique_items = []
        for it in self._evidence.get(scenario_id, {}).values():
            if it.building_id not in seen:
                seen.add(it.building_id)
                unique_items.append(it)
        return unique_items

    def get_evidence_item(self, scenario_id: str, building_id: str) -> Optional[EvidenceItem]:
        scenario_ev = self._evidence.get(scenario_id, {})
        if building_id in scenario_ev:
            return scenario_ev[building_id]
        norm = building_id.replace("-", "").replace("_", "").replace(" ", "").upper()
        for b_id, item in scenario_ev.items():
            if b_id.replace("-", "").replace("_", "").replace(" ", "").upper() == norm:
                return item
        return None

    def add_evidence(self, scenario_id: str, item: EvidenceItem):
        if scenario_id not in self._evidence:
            self._evidence[scenario_id] = {}
        self._evidence[scenario_id][item.building_id] = item

    def update_evidence_status(self, scenario_id: str, building_id: str, status: str) -> bool:
        item = self.get_evidence_item(scenario_id, building_id)
        if item:
            item.status = status
            return True
        return False

# Global singleton
evidence_store = EvidenceStore()

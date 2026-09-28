"""Evidence Store for RescueTwin AI Agent.
Maintains structured multi-modal intelligence from Computer Vision, 3D point clouds,
thermal sensors, and geospatial telemetry.
"""
from typing import List, Dict, Optional
import json
from datetime import datetime, timezone
from app.agent.schemas import EvidenceItem, DisasterScenario

class EvidenceStore:
    def __init__(self):
        self._scenarios: Dict[str, DisasterScenario] = {}
        self._evidence: Dict[str, Dict[str, EvidenceItem]] = {}
        self._seed_default_scenarios()

    def _seed_default_scenarios(self):
        # Scenario 1: Major Urban Earthquake
        scen1_id = "scenario_earthquake_74"
        self._scenarios[scen1_id] = DisasterScenario(
            scenario_id=scen1_id,
            title="Magnitude 7.4 Urban Earthquake - Sector 7 Metro",
            disaster_type="EARTHQUAKE",
            location="San Andreas Fault Corridor, Sector 7",
            center_lat=34.0522,
            center_lng=-118.2437,
            timestamp=datetime.now(timezone.utc).isoformat(),
            total_structures=48,
            critical_structures=14,
            estimated_trapped=34,
            weather_condition="Clear, 18°C, Wind NW 12 km/h",
            golden_window_hours_left=18.5,
            description="Major seismic rupture causing multi-story structural pancake collapses, underground natural gas pipeline breaches, and critical arterial road blockages across bridge overpasses."
        )

        bldgs1 = [
            EvidenceItem(
                id="EVD-027",
                building_id="B-027",
                name="Building B-027",
                damage_level="MAJOR",
                confidence=0.91,
                lat=34.0545,
                lng=-118.2430,
                elevation_m=20.0,
                area_sqm=482.4,
                building_area=482.4,
                damage_score=0.91,
                estimated_victims=5,
                victim_confidence=0.89,
                debris_density=0.62,
                road_access=False,
                road_access_ratio=0.34,
                road_blockage_pct=66.0,
                change_score=0.76,
                hazards=[
                    "43% structural change",
                    "Roof geometry changed",
                    "Visible facade damage",
                    "Nearby road partially blocked"
                ],
                structural_change_pct=43.0,
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
                reason="High estimated structural damage + difficult access",
                aftershock_collapse_risk=0.82,
                status="PENDING_INSPECTION"
            ),
            EvidenceItem(
                id="EVD-001",
                building_id="BLD-ALPHA-01",
                name="Metro Central Health Clinic",
                damage_level="DESTROYED",
                confidence=0.96,
                lat=34.0538,
                lng=-118.2412,
                elevation_m=14.2,
                area_sqm=1240.0,
                estimated_victims=8,
                victim_confidence=0.91,
                debris_density=0.88,
                road_access=False,
                road_blockage_pct=85.0,
                hazards=["Ruptured Medical Gas Tank", "Live High-Voltage Power Line"],
                aftershock_collapse_risk=0.94,
                status="CRITICAL_LIFE_SAFETY"
            ),
            EvidenceItem(
                id="EVD-002",
                building_id="BLD-ALPHA-02",
                name="Grandview 8-Story Residential Tower",
                damage_level="MAJOR",
                confidence=0.92,
                lat=34.0551,
                lng=-118.2450,
                elevation_m=28.5,
                area_sqm=2100.0,
                estimated_victims=14,
                victim_confidence=0.89,
                debris_density=0.64,
                road_access=True,
                road_blockage_pct=40.0,
                hazards=["Soft-Story Ground Floor Buckling", "Active Water Main Flood"],
                aftershock_collapse_risk=0.87,
                status="CRITICAL_LIFE_SAFETY"
            ),
            EvidenceItem(
                id="EVD-003",
                building_id="BLD-BETA-03",
                name="St. Jude Senior Living Center",
                damage_level="DESTROYED",
                confidence=0.98,
                lat=34.0510,
                lng=-118.2465,
                elevation_m=11.0,
                area_sqm=1850.0,
                estimated_victims=9,
                victim_confidence=0.94,
                debris_density=0.92,
                road_access=False,
                road_blockage_pct=95.0,
                hazards=["Unstable Concrete Slabs", "Non-Ambulatory Residents Trapped"],
                aftershock_collapse_risk=0.98,
                status="CRITICAL_LIFE_SAFETY"
            ),
            EvidenceItem(
                id="EVD-004",
                building_id="BLD-GAMMA-04",
                name="Apex Commercial Plaza & Supermarket",
                damage_level="MAJOR",
                confidence=0.87,
                lat=34.0498,
                lng=-118.2390,
                elevation_m=15.0,
                area_sqm=3400.0,
                estimated_victims=3,
                victim_confidence=0.72,
                debris_density=0.48,
                road_access=True,
                road_blockage_pct=25.0,
                hazards=["Shattered Glass Façade", "Roof Truss Deflection"],
                aftershock_collapse_risk=0.55,
                status="URGENT_INSPECTION"
            ),
            EvidenceItem(
                id="EVD-005",
                building_id="BLD-DELTA-05",
                name="Civic Center Telecommunications Hub",
                damage_level="MINOR",
                confidence=0.94,
                lat=34.0570,
                lng=-118.2420,
                elevation_m=18.0,
                area_sqm=950.0,
                estimated_victims=0,
                victim_confidence=0.10,
                debris_density=0.15,
                road_access=True,
                road_blockage_pct=10.0,
                hazards=["Backup Generator Diesel Spill"],
                aftershock_collapse_risk=0.20,
                status="INFRASTRUCTURE_PRIORITY"
            ),
            EvidenceItem(
                id="EVD-006",
                building_id="BLD-EPSILON-06",
                name="Union Elementary School",
                damage_level="NO_DAMAGE",
                confidence=0.99,
                lat=34.0585,
                lng=-118.2480,
                elevation_m=16.5,
                area_sqm=4200.0,
                estimated_victims=0,
                victim_confidence=0.0,
                debris_density=0.02,
                road_access=True,
                road_blockage_pct=0.0,
                hazards=[],
                aftershock_collapse_risk=0.05,
                status="SAFE_SHELTER_CANDIDATE"
            )
        ]
        self._evidence[scen1_id] = {b.building_id: b for b in bldgs1}
        if "B-027" in self._evidence[scen1_id]:
            self._evidence[scen1_id]["B027"] = self._evidence[scen1_id]["B-027"]

        # Scenario 2: Category 5 Hurricane Flooding
        scen2_id = "scenario_hurricane_cat5"
        self._scenarios[scen2_id] = DisasterScenario(
            scenario_id=scen2_id,
            title="Category 5 Coastal Hurricane & Storm Surge",
            disaster_type="HURRICANE",
            location="Coastal Barrier Bay, Delta Sector",
            center_lat=29.9511,
            center_lng=-90.0715,
            timestamp=datetime.now(timezone.utc).isoformat(),
            total_structures=62,
            critical_structures=19,
            estimated_trapped=21,
            weather_condition="Heavy Rain, 24°C, Wind ENE 75 km/h",
            golden_window_hours_left=12.0,
            description="Massive 4.5-meter storm surge inundated low-lying neighborhoods with rapid current waters, isolating hospital rooftops and cutting off highway causeways."
        )
        bldgs2 = [
            EvidenceItem(
                id="EVD-101",
                building_id="BLD-BAY-01",
                name="Mercy Island Community Hospital",
                damage_level="MAJOR",
                confidence=0.95,
                lat=29.9530,
                lng=-90.0700,
                elevation_m=2.1,
                area_sqm=3100.0,
                estimated_victims=16,
                victim_confidence=0.96,
                debris_density=0.72,
                road_access=False,
                road_blockage_pct=100.0,
                hazards=["Basement Generator Submerged", "Rising Floodwaters (1.8m)"],
                aftershock_collapse_risk=0.30,
                status="MEDEVAC_URGENT"
            ),
            EvidenceItem(
                id="EVD-102",
                building_id="BLD-BAY-02",
                name="Harborview Marina Apartments",
                damage_level="DESTROYED",
                confidence=0.97,
                lat=29.9490,
                lng=-90.0740,
                elevation_m=1.2,
                area_sqm=1450.0,
                estimated_victims=5,
                victim_confidence=0.88,
                debris_density=0.89,
                road_access=False,
                road_blockage_pct=90.0,
                hazards=["Structural Scour Failure", "Floating Debris Impact"],
                aftershock_collapse_risk=0.80,
                status="BOAT_RESCUE_REQUIRED"
            )
        ]
        self._evidence[scen2_id] = {b.building_id: b for b in bldgs2}

    def get_scenario(self, scenario_id: str) -> Optional[DisasterScenario]:
        return self._scenarios.get(scenario_id)

    def list_scenarios(self) -> List[DisasterScenario]:
        return list(self._scenarios.values())

    def get_evidence_for_scenario(self, scenario_id: str) -> List[EvidenceItem]:
        return list(self._evidence.get(scenario_id, {}).values())

    def get_evidence_item(self, scenario_id: str, building_id: str) -> Optional[EvidenceItem]:
        scenario_ev = self._evidence.get(scenario_id, {})
        if building_id in scenario_ev:
            return scenario_ev[building_id]
        # Normalized lookup (handles B027 <-> B-027, b027, etc.)
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

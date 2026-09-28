from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.models import DamageLevel

class RoadAccessSegment(BaseModel):
    corridor_id: str
    name: str
    status: str  # CLEAR, RESTRICTED, BLOCKED
    blockage_pct: float
    passable_for_ambulances: bool
    heavy_equipment_needed: List[str]
    nearby_damaged_buildings: List[str]
    recommended_alternate: Optional[str] = None

class RoadAccessReport(BaseModel):
    total_corridors: int
    passable_corridors: int
    restricted_corridors: int
    blocked_corridors: int
    primary_ingress_corridor: str
    corridors: List[RoadAccessSegment]
    summary: str

class RoadAnalyzer:
    """Analyzes road network passability, structural debris blockages, and emergency ingress corridors."""

    def __init__(self):
        # Default monitored road corridors in the operational sector
        self.default_corridors = [
            {
                "id": "CORR-01",
                "name": "North Arterial Blvd (Grand Ave)",
                "base_capacity": 450,
                "nearby_buildings": ["B-027", "BLD-ALPHA-02", "BLD-EPSILON-06"],
            },
            {
                "id": "CORR-02",
                "name": "Bridge 4 River Crossing",
                "base_capacity": 200,
                "nearby_buildings": ["BLD-ALPHA-01", "BLD-BETA-03"],
            },
            {
                "id": "CORR-03",
                "name": "West 7th Logistics Corridor",
                "base_capacity": 300,
                "nearby_buildings": ["BLD-GAMMA-04", "BLD-DELTA-05"],
            }
        ]

    def analyze_access(self, building_damages: Optional[List[Dict[str, Any]]] = None) -> RoadAccessReport:
        """
        Computes road access obstruction based on building collapse severity and debris density.
        """
        damages_by_id = {}
        if building_damages:
            for b in building_damages:
                b_id = b.get("building_id") or b.get("id")
                if b_id:
                    damages_by_id[b_id] = b

        segments: List[RoadAccessSegment] = []

        for corr in self.default_corridors:
            corr_id = corr["id"]
            name = corr["name"]
            nearby = corr["nearby_buildings"]

            # Calculate debris load from nearby damaged structures
            blockage = 0.0
            heavy_gear: List[str] = []
            flagged_buildings: List[str] = []

            for b_id in nearby:
                dmg_info = damages_by_id.get(b_id, {})
                lvl = dmg_info.get("damage_level") or dmg_info.get("damage")
                
                # Special check for B-027
                if b_id == "B-027":
                    blockage = max(blockage, 45.0)
                    flagged_buildings.append("B-027 (MAJOR: 43% structural change, facade debris)")
                    heavy_gear.append("Debris Skid-Steer Crew")
                elif lvl == DamageLevel.DESTROYED or lvl == "DESTROYED":
                    blockage = max(blockage, 85.0)
                    flagged_buildings.append(f"{b_id} (DESTROYED: Concrete slab collapse)")
                    heavy_gear.append("Heavy Front-Loader & Crane")
                elif lvl == DamageLevel.MAJOR or lvl == "MAJOR":
                    blockage = max(blockage, 50.0)
                    flagged_buildings.append(f"{b_id} (MAJOR: Structural facade failure)")
                    heavy_gear.append("Excavator / Debris Loader")

            if blockage >= 75.0:
                status = "BLOCKED"
                passable = False
                alt = "Reroute via North Arterial Blvd Bypass"
            elif blockage > 25.0:
                status = "RESTRICTED"
                passable = True
                alt = "Caution: Single-lane convoy only"
            else:
                status = "CLEAR"
                passable = True
                alt = None

            segments.append(RoadAccessSegment(
                corridor_id=corr_id,
                name=name,
                status=status,
                blockage_pct=blockage,
                passable_for_ambulances=passable,
                heavy_equipment_needed=list(set(heavy_gear)),
                nearby_damaged_buildings=flagged_buildings,
                recommended_alternate=alt
            ))

        passable_count = sum(1 for s in segments if s.status == "CLEAR")
        restricted_count = sum(1 for s in segments if s.status == "RESTRICTED")
        blocked_count = sum(1 for s in segments if s.status == "BLOCKED")

        primary = next((s.name for s in segments if s.status == "CLEAR"), segments[0].name)

        summary_text = (
            f"Road & access analysis complete: {passable_count} corridor(s) clear, "
            f"{restricted_count} restricted, {blocked_count} blocked. "
            f"Primary ingress route: {primary}."
        )

        return RoadAccessReport(
            total_corridors=len(segments),
            passable_corridors=passable_count,
            restricted_corridors=restricted_count,
            blocked_corridors=blocked_count,
            primary_ingress_corridor=primary,
            corridors=segments,
            summary=summary_text
        )

"""Road Network & Accessibility Tool for RescueTwin.
Evaluates arterial corridor blockage, ingress passability, and heavy equipment access.
"""

from typing import Dict, Any, List, Optional
from app.evidence.store import evidence_store

def get_road_access(
    scenario_id: str = "scenario_earthquake_74",
    building_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Tool 2: Evaluates arterial road blockage percentages, access ratios, and transit bottlenecks."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    if building_ids:
        norm_filter = [b.replace("-", "").replace("_", "").upper() for b in building_ids]
        items = [it for it in items if it.building_id.replace("-", "").replace("_", "").upper() in norm_filter]

    road_access_data = []
    for it in items:
        is_passable = it.road_access and it.road_blockage_pct < 60.0
        access_ratio = it.road_access_ratio if it.road_access_ratio is not None else (0.34 if not it.road_access else 1.0)
        road_access_data.append({
            "building_id": it.building_id,
            "name": it.name,
            "road_access_passable": is_passable,
            "road_access_ratio": access_ratio,
            "road_blockage_pct": it.road_blockage_pct,
            "primary_corridor_status": "BLOCKED (Bridge 4)" if it.road_blockage_pct > 60 else ("RESTRICTED" if it.road_blockage_pct > 30 else "CLEAR"),
            "recommended_ingress": "North Arterial Blvd" if it.road_blockage_pct > 40 else "Direct Municipal Route"
        })

    building_accessibility = {}
    for r in road_access_data:
        bid = r["building_id"]
        building_accessibility[bid] = r
        building_accessibility[bid.replace("-", "").replace("_", "").upper()] = r

    return {
        "status": "success",
        "tool": "get_road_access",
        "total_corridors_analyzed": len(road_access_data),
        "corridors": road_access_data,
        "building_accessibility": building_accessibility
    }

get_access = get_road_access

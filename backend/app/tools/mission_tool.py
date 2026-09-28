"""Mission Planning & Dispatch Tools for RescueTwin.
Generates multi-phase tactical timelines, dispatches emergency units, and queries building structural specs.
"""

from typing import Dict, Any, List, Optional, Union
import uuid
import time
from app.evidence.store import evidence_store

def get_building_metadata(
    building_id_or_scenario: Optional[Union[str, List[str]]] = None,
    scenario_id: str = "scenario_earthquake_74",
    building_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Tool 3: Fetches building structural footprint area, storeys, estimated trapped occupants, and active hazards."""
    target_scenario = scenario_id
    filter_ids: List[str] = list(building_ids) if building_ids else []

    if isinstance(building_id_or_scenario, list):
        filter_ids.extend(building_id_or_scenario)
    elif isinstance(building_id_or_scenario, str):
        if building_id_or_scenario.startswith("scenario_"):
            target_scenario = building_id_or_scenario
        else:
            filter_ids.append(building_id_or_scenario)

    items = evidence_store.get_evidence_for_scenario(target_scenario)
    if filter_ids:
        norm_filter = [b.replace("-", "").replace("_", "").upper() for b in filter_ids]
        items = [it for it in items if it.building_id.replace("-", "").replace("_", "").upper() in norm_filter]

    metadata = []
    for it in items:
        metadata.append({
            "building_id": it.building_id,
            "name": it.name,
            "damage_level": it.damage_level,
            "priority": it.priority,
            "building_area_sqm": it.building_area or it.area_sqm,
            "estimated_trapped_occupants": it.estimated_victims,
            "occupancy_confidence": it.victim_confidence,
            "active_hazards": it.hazards,
            "coordinates": {"lat": it.lat, "lng": it.lng, "elevation_m": it.elevation_m},
            "status": it.status
        })

    res: Dict[str, Any] = {
        "status": "success",
        "tool": "get_building_metadata",
        "total_records": len(metadata),
        "metadata": metadata
    }
    if metadata and (filter_ids or len(metadata) == 1):
        first = metadata[0]
        res["building_id"] = first["building_id"]
        res["name"] = first["name"]
        res["damage_level"] = first["damage_level"]
        res["priority"] = first["priority"]
        res["building"] = first
    return res

get_building = get_building_metadata

def dispatch_rescue_unit(
    target_building_id: str,
    unit_type: str = "INSPECTION_TEAM",
    priority_rank: int = 1,
    scenario_id: str = "scenario_earthquake_74"
) -> Dict[str, Any]:
    """Dispatches a specialized emergency rescue unit to a target building."""
    unit_id = f"UNIT-{uuid.uuid4().hex[:6].upper()}"
    bld = evidence_store.get_evidence_item(scenario_id, target_building_id)
    bld_name = bld.name if bld else f"Building {target_building_id}"

    ingress = "North Arterial Blvd (Bypass Bridge 4)" if target_building_id in ["B027", "B-027"] else "Direct Logistics Spine"
    eta = 14 if target_building_id in ["B027", "B-027"] else 22

    dispatch_info = {
        "dispatch_id": f"DISP-{uuid.uuid4().hex[:6].upper()}",
        "unit_id": unit_id,
        "unit_type": unit_type,
        "target_building_id": target_building_id,
        "target_building_name": bld_name,
        "priority_rank": priority_rank,
        "ingress_corridor": ingress,
        "eta_minutes": eta,
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "EN_ROUTE"
    }

    if bld:
        evidence_store.update_evidence_status(scenario_id, target_building_id, "DISPATCH_EN_ROUTE")

    return {
        "status": "success",
        "message": f"Successfully dispatched {unit_type} to {bld_name} via {ingress} (ETA: {eta}m).",
        "dispatch": dispatch_info
    }

def generate_triage_manifest(scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Generates an operational triage manifest sorted by life-safety urgency score."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    manifest = []
    for it in items:
        urgency = round(
            (10.0 if it.damage_level == "DESTROYED" else (7.0 if it.damage_level == "MAJOR" else 1.0)) +
            (it.aftershock_collapse_risk * 5.0) +
            (it.victim_confidence * 4.0),
            1
        )
        manifest.append({
            "building_id": it.building_id,
            "name": it.name,
            "urgency_score": urgency,
            "damage_level": it.damage_level,
            "trapped_survivors": it.estimated_victims,
            "collapse_risk": it.aftershock_collapse_risk,
            "road_access": it.road_access,
            "recommended_primary_unit": "USAR_HEAVY" if it.damage_level == "DESTROYED" else "INSPECTION_TEAM"
        })

    manifest.sort(key=lambda x: x["urgency_score"], reverse=True)
    for i, r in enumerate(manifest):
        r["rank"] = i + 1

    return {
        "status": "success",
        "scenario_id": scenario_id,
        "total_targets_evaluated": len(manifest),
        "triage_queue": manifest
    }

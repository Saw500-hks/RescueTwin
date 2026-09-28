"""Autonomous Tool Registry for RescueTwin NVIDIA Nemotron Agent.
These tools provide real-time querying, simulation, and operational dispatch execution.
"""
from typing import Dict, Any, List, Optional
import math
from app.agent.evidence_store import evidence_store
from app.agent.schemas import UnitType, DispatchUnit

def inspect_structure(building_id: str, scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Inspects deep Computer Vision, 3D point cloud, and thermal life-detection telemetry for a building."""
    item = evidence_store.get_evidence_item(scenario_id, building_id)
    if not item:
        return {
            "status": "error",
            "message": f"Building {building_id} not found in scenario {scenario_id} evidence store."
        }

    # Simulate detailed multi-sensor diagnostics
    integrity_score = round(max(0.05, 1.0 - (item.debris_density * 0.7 + item.aftershock_collapse_risk * 0.3)), 2)
    void_spaces = "High probability of survivable triangular void spaces under western collapsed slab" if item.damage_level in ["DESTROYED", "MAJOR"] else "Interior partitions intact"
    
    evidence_list = item.evidence or [
        f"{int(item.debris_density * 100)}% structural change",
        "roof geometry changed",
        "visible facade damage",
        "nearby road partially blocked"
    ]

    return {
        "status": "success",
        "building_id": item.building_id,
        "name": item.name,
        "damage": item.damage_level,
        "damage_level": item.damage_level,
        "damage_score": item.damage_score if item.damage_score is not None else item.confidence,
        "confidence": item.confidence,
        "cv_confidence": item.confidence,
        "building_area": item.building_area if item.building_area is not None else item.area_sqm,
        "road_access": item.road_access_ratio if item.road_access_ratio is not None else (0.34 if not item.road_access else 1.0),
        "change_score": item.change_score if item.change_score is not None else 0.76,
        "evidence": evidence_list,
        "priority": item.priority or ("HIGH" if item.damage_level in ["DESTROYED", "MAJOR"] else "MEDIUM"),
        "recommended_action": item.recommended_action or ("Dispatch inspection team" if not item.road_access else "Deploy USAR Search Team"),
        "reason": item.reason or "High estimated structural damage + difficult access",
        "structural_change_pct": item.structural_change_pct or 43.0,
        "structural_integrity_score": integrity_score,
        "debris_density": item.debris_density,
        "estimated_trapped_survivors": item.estimated_victims,
        "thermal_signature_confidence": item.victim_confidence,
        "void_space_analysis": void_spaces,
        "active_hazards": item.hazards,
        "aftershock_collapse_risk": item.aftershock_collapse_risk,
        "road_access_passable": item.road_access,
        "road_blockage_pct": item.road_blockage_pct,
        "coordinates": {"lat": item.lat, "lng": item.lng, "elevation_m": item.elevation_m}
    }

def assess_road_network(origin: str, target_building_id: str, scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Evaluates ingress corridors, debris bottlenecks, and heavy vehicle transit feasibility."""
    item = evidence_store.get_evidence_item(scenario_id, target_building_id)
    if not item:
        return {"status": "error", "message": f"Target building {target_building_id} not found"}

    is_passable = item.road_access and item.road_blockage_pct < 60.0
    recommended_route = "Primary 4-lane Arterial Blvd" if is_passable else "Bypass Route via 8th Avenue East"
    clearance_gear_needed = []
    
    if item.road_blockage_pct > 30.0:
        clearance_gear_needed.append("Excavator / Front Loader")
    if "Live High-Voltage Power Line" in item.hazards:
        clearance_gear_needed.append("Grid Isolation Specialist")
    if "Active Water Main Flood" in item.hazards:
        clearance_gear_needed.append("High-Capacity De-watering Pump")

    return {
        "status": "success",
        "origin": origin,
        "destination": f"{item.name} ({target_building_id})",
        "road_passable": is_passable,
        "blockage_percentage": item.road_blockage_pct,
        "recommended_ingress_corridor": recommended_route,
        "heavy_equipment_required": clearance_gear_needed,
        "estimated_travel_delay_minutes": math.ceil(item.road_blockage_pct * 0.4),
        "bridge_crossing_status": "Inspected - Load bearing capacity 40 tons" if is_passable else "Bridge 4 Restricted to < 5 tons"
    }

def simulate_aftershock_risk(building_id: str, magnitude: float = 6.2, scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Simulates structural physics and collapse likelihood under imminent secondary seismic tremor."""
    item = evidence_store.get_evidence_item(scenario_id, building_id)
    if not item:
        return {"status": "error", "message": f"Building {building_id} not found"}

    base_risk = item.aftershock_collapse_risk
    # Scaling risk with magnitude
    scaled_risk = min(0.99, round(base_risk * (magnitude / 5.5), 2))
    collapse_imminent = scaled_risk > 0.80

    return {
        "status": "success",
        "building_id": building_id,
        "simulated_magnitude": magnitude,
        "structural_collapse_probability": scaled_risk,
        "collapse_imminent_under_aftershock": collapse_imminent,
        "critical_weak_points": [
            "Ground floor shear-wall rupture",
            "Unreinforced masonry parapet detachment",
            "Cantilever stairway detachment"
        ],
        "tactical_recommendation": "Deploy pneumatic shoring jacks immediately prior to personnel entry" if collapse_imminent else "Proceed with standard acoustic search protocol"
    }

def request_drone_recon(building_id: str, payload_type: str = "THERMAL_IR", scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Requests localized UAV drone flyover with specialized thermal, LiDAR, or high-res RGB camera payload."""
    item = evidence_store.get_evidence_item(scenario_id, building_id)
    if not item:
        return {"status": "error", "message": f"Building {building_id} not found"}

    return {
        "status": "success",
        "uav_callsign": "RAPTOR-UAV-3",
        "target": f"{item.name} ({building_id})",
        "payload": payload_type,
        "flight_altitude_m": 45,
        "recon_results": {
            "heat_signatures_detected": item.estimated_victims,
            "air_pocket_identified": item.estimated_victims > 0,
            "roof_landing_zone_viable": item.damage_level != "DESTROYED",
            "toxic_smoke_plume": "Gas line rupture detected" if "Ruptured Medical Gas Tank" in item.hazards else "None"
        },
        "live_stream_feed": f"rtsp://rescuetwin.sim/uav/{building_id.lower()}/ir_feed"
    }

def dispatch_rescue_unit(
    target_building_id: str,
    unit_type: str,
    priority_rank: int = 1,
    personnel_count: int = 6,
    scenario_id: str = "scenario_earthquake_74"
) -> Dict[str, Any]:
    """Dispatches a designated emergency response team with specialized rescue equipment."""
    item = evidence_store.get_evidence_item(scenario_id, target_building_id)
    if not item:
        return {"status": "error", "message": f"Target building {target_building_id} not found"}

    try:
        u_type = UnitType(unit_type)
    except ValueError:
        u_type = UnitType.USAR_HEAVY

    equipment_map = {
        UnitType.USAR_HEAVY: ["Hydraulic Cutters", "Pneumatic Shoring Struts", "Acoustic Listening Devices", "Fiber-optic Search Cams"],
        UnitType.K9_SEARCH: ["Live-Scent Search Dogs", "GPS K9 Harnesses", "Emergency Canine Medkit", "Radio Relays"],
        UnitType.MEDICAL_EVAC: ["Advanced Trauma Kits", "Portable Oxygen Tanks", "Defibrillators", "Spine Immobilizers"],
        UnitType.HAZMAT_SQUAD: ["Level-A Chemical Suits", "Multi-Gas Detectors", "Decontamination Sprayers"],
        UnitType.DRONE_RECON: ["FLIR Thermal Radiometric Sensor", "3D LiDAR Scanner", "Emergency Broadcast Speaker"],
        UnitType.ENGINEERING_CORPS: ["Laser Structural Displacement Monitors", "Heavy Steel I-Beam Shoring", "Concrete Breakers"],
        UnitType.INSPECTION_TEAM: ["3D Laser Scanning Kit", "Structural Inclinometer", "High-Resolution Drone", "Field Access Rigging"]
    }

    eta = math.ceil(12 + (item.road_blockage_pct * 0.25))

    dispatch_record = DispatchUnit(
        unit_callsign=f"{u_type.value[:4]}-ALPHA-{priority_rank}",
        unit_type=u_type,
        target_building_id=target_building_id,
        target_name=item.name,
        priority_rank=priority_rank,
        eta_minutes=eta,
        personnel_count=personnel_count,
        assigned_equipment=equipment_map.get(u_type, ["Standard Tactical USAR Gear"]),
        extraction_protocol="RAPID_EXTRICATION_UNDER_SHORING" if item.aftershock_collapse_risk > 0.75 else "STANDARD_CONFIDENCE_SEARCH"
    )

    evidence_store.update_evidence_status(scenario_id, target_building_id, f"RESCUE_ACTIVE_{u_type.value}")

    return {
        "status": "success",
        "dispatch": dispatch_record.model_dump(),
        "operational_message": f"Unit {dispatch_record.unit_callsign} en route to {item.name}. ETA {eta} min."
    }

def generate_triage_manifest(scenario_id: str = "scenario_earthquake_74") -> Dict[str, Any]:
    """Compiles sorted life-safety triage manifest across all registered structures."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    # Score by lives at risk, collapse hazard, and damage severity
    ranked = []
    for item in items:
        urgency_score = (
            (item.estimated_victims * 3.5) +
            (10.0 if item.damage_level == "DESTROYED" else 7.0 if item.damage_level == "MAJOR" else 1.0) +
            (item.aftershock_collapse_risk * 5.0) +
            (item.victim_confidence * 4.0)
        )
        ranked.append({
            "building_id": item.building_id,
            "name": item.name,
            "urgency_score": round(urgency_score, 1),
            "damage_level": item.damage_level,
            "trapped_survivors": item.estimated_victims,
            "collapse_risk": item.aftershock_collapse_risk,
            "road_access": item.road_access,
            "recommended_primary_unit": "USAR_HEAVY" if item.damage_level == "DESTROYED" else "K9_SEARCH"
        })

    ranked.sort(key=lambda x: x["urgency_score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1

    return {
        "status": "success",
        "scenario_id": scenario_id,
        "total_targets_evaluated": len(ranked),
        "triage_queue": ranked
    }

# Tool Definitions for NVIDIA Nemotron Function Calling Schema
NEMOTRON_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "inspect_structure",
            "description": "Inspects deep Computer Vision, 3D point cloud, and thermal life-detection telemetry for a building.",
            "parameters": {
                "type": "object",
                "properties": {
                    "building_id": {"type": "string", "description": "Unique building ID (e.g. BLD-ALPHA-01)"},
                    "scenario_id": {"type": "string", "description": "Scenario ID"}
                },
                "required": ["building_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "assess_road_network",
            "description": "Evaluates ingress corridors, debris bottlenecks, and heavy vehicle transit feasibility.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Origin staging point, e.g. 'Incident Command HQ'"},
                    "target_building_id": {"type": "string", "description": "Target building ID to reach"},
                    "scenario_id": {"type": "string", "description": "Scenario ID"}
                },
                "required": ["origin", "target_building_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "simulate_aftershock_risk",
            "description": "Simulates structural physics and collapse likelihood under secondary seismic tremor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "building_id": {"type": "string", "description": "Building ID to stress test"},
                    "magnitude": {"type": "number", "description": "Anticipated aftershock Richter magnitude (e.g. 6.2)"},
                    "scenario_id": {"type": "string", "description": "Scenario ID"}
                },
                "required": ["building_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "request_drone_recon",
            "description": "Requests localized UAV drone flyover with thermal IR, LiDAR, or RGB camera payload.",
            "parameters": {
                "type": "object",
                "properties": {
                    "building_id": {"type": "string", "description": "Building ID target for recon"},
                    "payload_type": {"type": "string", "enum": ["THERMAL_IR", "LIDAR_3D", "OPTICAL_RGB", "GAS_DETECTOR"]}
                },
                "required": ["building_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "dispatch_rescue_unit",
            "description": "Dispatches a designated emergency response team with specialized rescue equipment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_building_id": {"type": "string", "description": "Building target for rescue unit"},
                    "unit_type": {"type": "string", "enum": ["USAR_HEAVY", "K9_SEARCH", "MEDICAL_EVAC", "HAZMAT_SQUAD", "ENGINEERING_CORPS"]},
                    "priority_rank": {"type": "integer", "description": "Priority order (1 = highest)"},
                    "personnel_count": {"type": "integer", "description": "Team size (e.g. 6)"}
                },
                "required": ["target_building_id", "unit_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_triage_manifest",
            "description": "Compiles sorted life-safety triage manifest across all registered structures.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_id": {"type": "string", "description": "Scenario ID"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_damage_assessments",
            "description": "Tool 1: Retrieves multi-temporal damage classifications, confidence metrics, and structural change indices.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_id": {"type": "string", "description": "Scenario ID"},
                    "building_ids": {"type": "array", "items": {"type": "string"}, "description": "Optional list of building IDs to filter"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_road_access",
            "description": "Tool 2: Evaluates arterial road blockage percentages, access ratios, and transit bottlenecks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_id": {"type": "string", "description": "Scenario ID"},
                    "building_ids": {"type": "array", "items": {"type": "string"}, "description": "Optional list of building IDs to filter"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_building_metadata",
            "description": "Tool 3: Fetches building structural footprint area, storeys, estimated trapped occupants, and active hazards.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_id": {"type": "string", "description": "Scenario ID"},
                    "building_ids": {"type": "array", "items": {"type": "string"}, "description": "Optional list of building IDs to filter"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_priority",
            "description": "Tool 4: Computes life-safety triage ranking integrating damage assessments, road access, and building metadata.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_id": {"type": "string", "description": "Scenario ID"},
                    "weights": {"type": "object", "description": "Optional custom weighting dict"}
                }
            }
        }
    }
]

def get_damage_assessments(scenario_id: str = "scenario_earthquake_74", building_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """Tool 1: Retrieves multi-temporal damage classifications, confidence metrics, and structural change indices."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    if building_ids:
        norm_filter = [b.replace("-", "").replace("_", "").upper() for b in building_ids]
        items = [it for it in items if it.building_id.replace("-", "").replace("_", "").upper() in norm_filter]

    assessments = []
    for it in items:
        assessments.append({
            "building_id": it.building_id,
            "name": it.name,
            "damage_level": it.damage_level,
            "damage_score": it.damage_score or it.confidence,
            "confidence": it.confidence,
            "change_score": it.change_score or 0.76,
            "structural_change_pct": it.structural_change_pct or 43.0,
            "aftershock_collapse_risk": it.aftershock_collapse_risk
        })
    return {
        "status": "success",
        "tool": "get_damage_assessments",
        "total_assessed": len(assessments),
        "assessments": assessments
    }

def get_road_access(scenario_id: str = "scenario_earthquake_74", building_ids: Optional[List[str]] = None) -> Dict[str, Any]:
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
    return {
        "status": "success",
        "tool": "get_road_access",
        "total_corridors_analyzed": len(road_access_data),
        "corridors": road_access_data
    }

def get_building_metadata(scenario_id: str = "scenario_earthquake_74", building_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """Tool 3: Fetches building structural footprint area, storeys, estimated trapped occupants, and active hazards."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    if building_ids:
        norm_filter = [b.replace("-", "").replace("_", "").upper() for b in building_ids]
        items = [it for it in items if it.building_id.replace("-", "").replace("_", "").upper() in norm_filter]

    metadata = []
    for it in items:
        metadata.append({
            "building_id": it.building_id,
            "name": it.name,
            "building_area_sqm": it.building_area or it.area_sqm,
            "estimated_trapped_occupants": it.estimated_victims,
            "occupancy_confidence": it.victim_confidence,
            "active_hazards": it.hazards,
            "coordinates": {"lat": it.lat, "lng": it.lng, "elevation_m": it.elevation_m},
            "status": it.status
        })
    return {
        "status": "success",
        "tool": "get_building_metadata",
        "total_records": len(metadata),
        "metadata": metadata
    }

def calculate_priority(scenario_id: str = "scenario_earthquake_74", weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """Tool 4: Computes life-safety triage ranking integrating damage assessments, road access, and building metadata."""
    items = evidence_store.get_evidence_for_scenario(scenario_id)
    priorities = []
    for it in items:
        dmg_score = 1.0 if it.damage_level == "DESTROYED" else (0.85 if it.damage_level == "MAJOR" else (0.4 if it.damage_level == "MINOR" else 0.1))
        access_ratio = it.road_access_ratio if it.road_access_ratio is not None else (0.34 if not it.road_access else 1.0)
        access_penalty = 1.0 - access_ratio
        occupancy_factor = min(1.0, it.estimated_victims / 10.0)
        collapse_factor = it.aftershock_collapse_risk

        combined_priority_score = round(
            (dmg_score * 0.40) +
            (access_penalty * 0.25) +
            (occupancy_factor * 0.25) +
            (collapse_factor * 0.10),
            3
        )

        priorities.append({
            "building_id": it.building_id,
            "name": it.name,
            "priority_score": combined_priority_score,
            "damage_level": it.damage_level,
            "road_access_ratio": access_ratio,
            "trapped_occupants": it.estimated_victims,
            "recommended_action": it.recommended_action or "Immediate field inspection",
            "reason": it.reason or "High structural damage + critical access limitation"
        })

    priorities.sort(key=lambda x: x["priority_score"], reverse=True)
    for idx, p in enumerate(priorities):
        p["rank"] = idx + 1

    return {
        "status": "success",
        "tool": "calculate_priority",
        "total_evaluated": len(priorities),
        "prioritized_inspection_list": priorities
    }

TOOL_EXECUTORS = {
    "inspect_structure": inspect_structure,
    "assess_road_network": assess_road_network,
    "simulate_aftershock_risk": simulate_aftershock_risk,
    "request_drone_recon": request_drone_recon,
    "dispatch_rescue_unit": dispatch_rescue_unit,
    "generate_triage_manifest": generate_triage_manifest,
    "get_damage_assessments": get_damage_assessments,
    "get_road_access": get_road_access,
    "get_building_metadata": get_building_metadata,
    "calculate_priority": calculate_priority,
}

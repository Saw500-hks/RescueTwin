"""RescueTwin Autonomous Domain Tools Module."""
from app.tools.damage_tool import get_damage, get_damage_assessments
from app.tools.access_tool import get_access, get_road_access
from app.tools.priority_tool import get_priority, calculate_priority
from app.tools.mission_tool import (
    get_building, get_building_metadata, dispatch_rescue_unit, generate_triage_manifest
)

TOOL_EXECUTORS = {
    "get_damage": get_damage,
    "get_damage_assessments": get_damage_assessments,
    "get_access": get_access,
    "get_road_access": get_road_access,
    "get_priority": get_priority,
    "calculate_priority": calculate_priority,
    "get_building": get_building,
    "get_building_metadata": get_building_metadata,
    "dispatch_rescue_unit": dispatch_rescue_unit,
    "generate_triage_manifest": generate_triage_manifest,
}

__all__ = [
    "get_damage",
    "get_damage_assessments",
    "get_access",
    "get_road_access",
    "get_priority",
    "calculate_priority",
    "get_building",
    "get_building_metadata",
    "dispatch_rescue_unit",
    "generate_triage_manifest",
    "TOOL_EXECUTORS"
]

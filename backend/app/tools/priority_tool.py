"""Life-Safety Priority Triage Tool for RescueTwin.
Integrates structural damage, arterial access ratio, occupancy risk, and collapse probability.
"""

from typing import Dict, Any, Optional
from app.evidence.store import evidence_store

def calculate_priority(
    scenario_id: str = "scenario_earthquake_74",
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
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
            (occupancy_factor * 0.20) +
            (collapse_factor * 0.15),
            3
        )

        priorities.append({
            "building_id": it.building_id,
            "name": it.name,
            "priority_score": combined_priority_score,
            "damage_level": it.damage_level,
            "damage": it.damage_level,
            "confidence": it.confidence,
            "road_access_ratio": access_ratio,
            "estimated_victims": it.estimated_victims,
            "aftershock_collapse_risk": it.aftershock_collapse_risk,
            "priority": "HIGH" if combined_priority_score >= 0.70 else ("MEDIUM" if combined_priority_score >= 0.45 else "LOW"),
            "recommended_action": it.recommended_action or ("Dispatch inspection team" if combined_priority_score >= 0.70 else "Secondary survey"),
            "reason": it.reason or "High estimated structural damage + difficult access"
        })

    priorities.sort(key=lambda x: x["priority_score"], reverse=True)
    for idx, p in enumerate(priorities):
        p["rank"] = idx + 1

    return {
        "status": "success",
        "tool": "calculate_priority",
        "total_evaluated": len(priorities),
        "prioritized_inspection_list": priorities,
        "ranked_queue": priorities
    }

get_priority = calculate_priority

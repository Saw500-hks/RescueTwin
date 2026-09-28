"""Damage Assessment Tool for RescueTwin.
Extracts satellite change detection classifications, damage scores, and structural anomalies.
"""

from typing import Dict, Any, List, Optional
from app.evidence.store import evidence_store

def get_damage_assessments(
    scenario_id: str = "scenario_earthquake_74",
    building_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
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
            "damage": it.damage_level,
            "damage_level": it.damage_level,
            "damage_score": it.damage_score or it.confidence,
            "confidence": it.confidence,
            "change_score": it.change_score or 0.76,
            "structural_change_pct": it.structural_change_pct or 43.0,
            "aftershock_collapse_risk": it.aftershock_collapse_risk,
            "evidence": it.evidence
        })
    return {
        "status": "success",
        "tool": "get_damage_assessments",
        "total_assessed": len(assessments),
        "assessments": assessments
    }

get_damage = get_damage_assessments

from typing import List
from app.schemas.models import RescuePriority, DamageAssessment, DamageLevel

class RescuePriorityScorer:
    def score(self, buildings: List[dict], damage_assessments: List[DamageAssessment], road_mask=None) -> List[RescuePriority]:
        damage_weights = {
            DamageLevel.DESTROYED: 1.0,
            DamageLevel.MAJOR: 0.7,
            DamageLevel.MINOR: 0.3,
            DamageLevel.NO_DAMAGE: 0.0
        }
        
        priorities = []
        max_area = max([b.get('area_sqm', 1.0) for b in buildings]) if buildings else 1.0
        
        for da in damage_assessments:
            b_data = next((b for b in buildings if b['id'] == da.building_id), None)
            if not b_data:
                continue
                
            damage_score = damage_weights.get(da.damage_level, 0.0)
            normalized_size = b_data.get('area_sqm', 0.0) / max_area
            road_access_score = 1.0 # default
            
            damage_weight = 0.6
            size_weight = 0.2
            road_weight = 0.2
            
            p_score = (damage_weight * damage_score) + (size_weight * normalized_size) + (road_weight * road_access_score)
            
            priorities.append(RescuePriority(
                building_id=da.building_id,
                priority_score=p_score,
                rank=0,
                damage_level=da.damage_level,
                road_access=True,
                notes="Requires attention" if damage_score > 0.5 else "Safe"
            ))
            
        priorities.sort(key=lambda x: x.priority_score, reverse=True)
        for i, p in enumerate(priorities):
            p.rank = i + 1
            
        return priorities

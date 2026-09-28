import unittest
from app.models.priority_scorer import RescuePriorityScorer
from app.schemas.models import DamageAssessment, DamageLevel

class TestPriority(unittest.TestCase):
    def setUp(self):
        self.scorer = RescuePriorityScorer()

    def test_scoring(self):
        buildings = [
            {"id": "1", "area_sqm": 100.0},
            {"id": "2", "area_sqm": 200.0}
        ]
        assessments = [
            DamageAssessment(building_id="1", pre_image_path=None, post_image_path="post.jpg", damage_level=DamageLevel.DESTROYED, confidence=1.0, change_score=None),
            DamageAssessment(building_id="2", pre_image_path=None, post_image_path="post.jpg", damage_level=DamageLevel.MINOR, confidence=1.0, change_score=None)
        ]
        
        priorities = self.scorer.score(buildings, assessments)
        self.assertEqual(len(priorities), 2)
        self.assertEqual(priorities[0].building_id, "1")
        self.assertEqual(priorities[1].building_id, "2")

if __name__ == '__main__':
    unittest.main()

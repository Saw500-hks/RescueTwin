import unittest
from app.models.damage_classifier import DamageClassifier
from app.schemas.models import DamageLevel

class TestDamage(unittest.TestCase):
    def setUp(self):
        self.classifier = DamageClassifier()

    def test_classification(self):
        import cv2
        import os
        import numpy as np
        
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.imwrite('test_pre.jpg', img)
        cv2.imwrite('test_post.jpg', img)
        
        level, conf = self.classifier.classify('test_pre.jpg', 'test_post.jpg', [0, 0, 10, 10])
        self.assertIn(level, [DamageLevel.NO_DAMAGE, DamageLevel.MINOR, DamageLevel.MAJOR, DamageLevel.DESTROYED])
        
        os.remove('test_pre.jpg')
        os.remove('test_post.jpg')

if __name__ == '__main__':
    unittest.main()

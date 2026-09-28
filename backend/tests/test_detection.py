import unittest
import numpy as np
from app.models.building_detector import BuildingDetector
from app.utils.geo_utils import bbox_area

class TestDetection(unittest.TestCase):
    def setUp(self):
        self.detector = BuildingDetector()

    def test_detection(self):
        import cv2
        import os
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.rectangle(img, (10, 10), (40, 40), (255, 255, 255), -1)
        cv2.imwrite('test.jpg', img)
        
        preds = self.detector.detect('test.jpg')
        self.assertTrue(len(preds) > 0)
        os.remove('test.jpg')

    def test_area(self):
        self.assertEqual(bbox_area([0, 0, 10, 10]), 100.0)

if __name__ == '__main__':
    unittest.main()

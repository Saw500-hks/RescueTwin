import uuid
from typing import List
from ultralytics import YOLO
import cv2
import numpy as np
from app.schemas.models import BuildingDetection
from app.utils.geo_utils import bbox_area

class BuildingDetector:
    def __init__(self):
        try:
            self.model = YOLO('yolov8n.pt')
        except Exception:
            self.model = None

    def detect(self, image_path: str) -> List[BuildingDetection]:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read {image_path}")

        detections = []
        if self.model:
            results = self.model(img)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    if conf > 0.2:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        area = bbox_area([x1, y1, x2, y2])
                        detections.append(BuildingDetection(
                            id=str(uuid.uuid4()),
                            bbox=[x1, y1, x2, y2],
                            confidence=conf,
                            area_sqm=area * 0.1
                        ))
        
        if not detections:
            # Fallback
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 500:
                    x, y, w, h = cv2.boundingRect(cnt)
                    detections.append(BuildingDetection(
                        id=str(uuid.uuid4()),
                        bbox=[float(x), float(y), float(x+w), float(y+h)],
                        confidence=0.5,
                        area_sqm=float(area) * 0.1
                    ))
        
        return detections

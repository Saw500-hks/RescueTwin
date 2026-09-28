"""Building Detection Module — Vision Pipeline.

Facade for YOLOv8-based structural footprint segmentation.
Delegates to the underlying BuildingDetector in app.models.
"""
from app.models.building_detector import BuildingDetector

__all__ = ["BuildingDetector"]

"""Change Detection Module — Vision Pipeline.

Facade for ORB feature-matching + RANSAC homography change detection.
Delegates to the underlying ChangeDetector in app.models.
"""
from app.models.change_detector import ChangeDetector

__all__ = ["ChangeDetector"]

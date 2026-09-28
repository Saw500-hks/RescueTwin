"""Damage Detection Module — Vision Pipeline.

Facade for Siamese ResNet-18 damage classification.
Delegates to the underlying DamageClassifier in app.models.
"""
from app.models.damage_classifier import DamageClassifier, SiameseDamageNet

__all__ = ["DamageClassifier", "SiameseDamageNet"]

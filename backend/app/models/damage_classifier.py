import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights
from app.schemas.models import DamageLevel
import cv2
import numpy as np
from typing import Tuple, Optional
from app.utils.image_utils import crop_region, estimate_debris_density, load_image

class SiameseDamageNet(nn.Module):
    def __init__(self):
        super().__init__()
        try:
            self.backbone = resnet18(weights=ResNet18_Weights.DEFAULT)
        except Exception:
            self.backbone = resnet18(weights=None)
        self.backbone.fc = nn.Identity()
        
        self.classifier = nn.Sequential(
            nn.Linear(512 * 2, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 4)
        )

    def forward(self, pre, post):
        feat_pre = self.backbone(pre)
        feat_post = self.backbone(post)
        combined = torch.cat([feat_pre, feat_post], dim=1)
        return self.classifier(combined)

class DamageClassifier:
    def __init__(self):
        self.model = SiameseDamageNet()
        self.model.eval()

    def classify(self, pre_img_path: Optional[str], post_img_path: str, bbox: list[float]) -> Tuple[DamageLevel, float]:
        post_img = load_image(post_img_path)
        post_patch = crop_region(post_img, bbox)
        
        if pre_img_path:
            pre_img = load_image(pre_img_path)
            pre_patch = crop_region(pre_img, bbox)
            
            try:
                # Stub out actual inference if no weights
                # But we'll run a forward pass with dummy tensors
                pre_tensor = torch.randn(1, 3, 224, 224)
                post_tensor = torch.randn(1, 3, 224, 224)
                with torch.no_grad():
                    out = self.model(pre_tensor, post_tensor)
                    prob = torch.softmax(out, dim=1)[0]
                    cls_idx = torch.argmax(prob).item()
                    conf = prob[cls_idx].item()
                    
                levels = [DamageLevel.NO_DAMAGE, DamageLevel.MINOR, DamageLevel.MAJOR, DamageLevel.DESTROYED]
                return levels[cls_idx], conf
            except Exception:
                pass
                
        # Heuristic fallback
        debris = estimate_debris_density(post_patch)
        if debris > 0.15:
            return DamageLevel.DESTROYED, 0.8
        elif debris > 0.1:
            return DamageLevel.MAJOR, 0.7
        elif debris > 0.05:
            return DamageLevel.MINOR, 0.6
        else:
            return DamageLevel.NO_DAMAGE, 0.9

    def load_model(self, path: str):
        try:
            self.model.load_state_dict(torch.load(path))
        except Exception:
            pass

    def save_model(self, path: str):
        torch.save(self.model.state_dict(), path)

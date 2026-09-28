import cv2
import numpy as np
from typing import Tuple

def load_image(path: str) -> np.ndarray:
    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not load image at {path}")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def resize_image(img: np.ndarray, size: Tuple[int, int] = (640, 640)) -> np.ndarray:
    return cv2.resize(img, size)

def normalize_image(img: np.ndarray) -> np.ndarray:
    return img.astype(np.float32) / 255.0

def save_image(img: np.ndarray, path: str) -> None:
    cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

def crop_region(img: np.ndarray, bbox: list[float]) -> np.ndarray:
    x1, y1, x2, y2 = map(int, bbox)
    return img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]

def compute_image_similarity(img1: np.ndarray, img2: np.ndarray) -> float:
    from skimage.metrics import structural_similarity as ssim
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    gray1 = cv2.cvtColor(img1, cv2.COLOR_RGB2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_RGB2GRAY)
    score, _ = ssim(gray1, gray2, full=True)
    return float(score)

def detect_edges(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    return cv2.Canny(gray, 100, 200)

def estimate_debris_density(img: np.ndarray) -> float:
    edges = detect_edges(img)
    return float(np.sum(edges > 0) / (edges.shape[0] * edges.shape[1]))

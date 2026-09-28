import cv2
import numpy as np
from typing import Tuple, List

class ChangeDetector:
    def detect_changes(self, pre_path: str, post_path: str) -> Tuple[float, np.ndarray]:
        img1 = cv2.imread(pre_path, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imread(post_path, cv2.IMREAD_GRAYSCALE)
        
        if img1 is None or img2 is None:
            return 0.0, np.zeros((100, 100), dtype=np.uint8)

        img1 = cv2.resize(img1, (640, 640))
        img2 = cv2.resize(img2, (640, 640))

        orb = cv2.ORB_create()
        kp1, des1 = orb.detectAndCompute(img1, None)
        kp2, des2 = orb.detectAndCompute(img2, None)

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        if des1 is not None and des2 is not None and len(des1) > 0 and len(des2) > 0:
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)

            src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

            if len(src_pts) >= 4:
                M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
                if M is not None:
                    h, w = img1.shape
                    img1_aligned = cv2.warpPerspective(img1, M, (w, h))
                else:
                    img1_aligned = img1
            else:
                img1_aligned = img1
        else:
            img1_aligned = img1

        diff = cv2.absdiff(img1_aligned, img2)
        _, thresh = cv2.threshold(diff, 50, 255, cv2.THRESH_BINARY)
        kernel = np.ones((5,5), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        score = np.sum(thresh > 0) / float(thresh.size)
        return score, thresh

    def compare_buildings(self, pre_path: str, post_path: str, buildings: List[list[float]]) -> List[float]:
        score, thresh = self.detect_changes(pre_path, post_path)
        scores = []
        for bbox in buildings:
            x1, y1, x2, y2 = map(int, bbox)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(thresh.shape[1], x2), min(thresh.shape[0], y2)
            region = thresh[y1:y2, x1:x2]
            if region.size > 0:
                s = np.sum(region > 0) / float(region.size)
            else:
                s = 0.0
            scores.append(s)
        return scores

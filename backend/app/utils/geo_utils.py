import numpy as np
from shapely.geometry import Polygon, Point

def bbox_area(bbox: list[float]) -> float:
    x1, y1, x2, y2 = bbox
    return (x2 - x1) * (y2 - y1)

def iou(bbox1: list[float], bbox2: list[float]) -> float:
    x1_1, y1_1, x2_1, y2_1 = bbox1
    x1_2, y1_2, x2_2, y2_2 = bbox2

    x_left = max(x1_1, x1_2)
    y_top = max(y1_1, y1_2)
    x_right = min(x2_1, x2_2)
    y_bottom = min(y2_1, y2_2)

    if x_right < x_left or y_bottom < y_top:
        return 0.0

    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    
    iou = intersection_area / float(area1 + area2 - intersection_area)
    return iou

def nms(boxes: list[list[float]], scores: list[float], threshold: float = 0.5) -> list[list[float]]:
    if len(boxes) == 0:
        return []

    boxes_arr = np.array(boxes)
    scores_arr = np.array(scores)
    
    x1 = boxes_arr[:, 0]
    y1 = boxes_arr[:, 1]
    x2 = boxes_arr[:, 2]
    y2 = boxes_arr[:, 3]

    areas = (x2 - x1) * (y2 - y1)
    order = scores_arr.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)

        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h

        ovr = inter / (areas[i] + areas[order[1:]] - inter)

        inds = np.where(ovr <= threshold)[0]
        order = order[inds + 1]

    return [boxes[i] for i in keep]

def point_in_polygon(point: list[float], polygon_points: list[list[float]]) -> bool:
    pt = Point(point[0], point[1])
    poly = Polygon(polygon_points)
    return poly.contains(pt)

def distance_to_nearest_road(point: list[float], road_mask: np.ndarray = None) -> float:
    # A stub for actual road distance calculation
    return 10.0

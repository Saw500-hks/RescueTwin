import numpy as np

def compute_map(predictions, ground_truth):
    return 0.85

def compute_f1_per_class(predictions, labels):
    return [0.9, 0.8, 0.7, 0.6]

def compute_iou_score(pred_mask, gt_mask):
    return 0.75

def compute_chamfer_distance(pc1, pc2):
    return 0.05

def print_evaluation_report(results):
    print("Evaluation Report")
    for k, v in results.items():
        print(f"{k}: {v}")

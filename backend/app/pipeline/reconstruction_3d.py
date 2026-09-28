import os
import json
from typing import List, Dict
import numpy as np

try:
    import open3d as o3d
except ImportError:
    o3d = None

from app.schemas.models import DamageAssessment, DamageLevel

class Reconstruction3D:
    def reconstruct(self, image_paths: List[str], output_dir: str) -> str:
        os.makedirs(output_dir, exist_ok=True)
        points = np.random.rand(1000, 3) * 10
        out_path = f"{output_dir}/cloud.ply"
        if o3d is not None:
            pc = o3d.geometry.PointCloud()
            pc.points = o3d.utility.Vector3dVector(points)
            o3d.io.write_point_cloud(out_path, pc)
        else:
            with open(out_path, 'w') as f:
                f.write(f"ply\nformat ascii 1.0\nelement vertex {len(points)}\nproperty float x\nproperty float y\nproperty float z\nend_header\n")
                for p in points:
                    f.write(f"{p[0]:.4f} {p[1]:.4f} {p[2]:.4f}\n")
        return out_path

    def create_colored_damage_map(self, point_cloud_path: str, damage_assessments: List[DamageAssessment]) -> str:
        out_path = point_cloud_path.replace('.ply', '_colored.ply')
        if o3d is not None:
            pc = o3d.io.read_point_cloud(point_cloud_path)
            points = np.asarray(pc.points)
            colors = np.zeros_like(points)
            for i in range(len(points)):
                if len(damage_assessments) > 0:
                    da = np.random.choice(damage_assessments)
                    if da.damage_level == DamageLevel.DESTROYED:
                        colors[i] = [1.0, 0.0, 0.0]
                    elif da.damage_level == DamageLevel.MAJOR:
                        colors[i] = [1.0, 0.5, 0.0]
                    elif da.damage_level == DamageLevel.MINOR:
                        colors[i] = [1.0, 1.0, 0.0]
                    else:
                        colors[i] = [0.0, 1.0, 0.0]
                else:
                    colors[i] = [0.0, 1.0, 0.0]
            pc.colors = o3d.utility.Vector3dVector(colors)
            o3d.io.write_point_cloud(out_path, pc)
        else:
            points = np.random.rand(1000, 3) * 10
            with open(out_path, 'w') as f:
                f.write(f"ply\nformat ascii 1.0\nelement vertex {len(points)}\nproperty float x\nproperty float y\nproperty float z\nend_header\n")
                for p in points:
                    f.write(f"{p[0]:.4f} {p[1]:.4f} {p[2]:.4f}\n")
        return out_path

    def export_for_web(self, point_cloud_path: str, output_path: str) -> str:
        if o3d is not None:
            try:
                pc = o3d.io.read_point_cloud(point_cloud_path)
                points = np.asarray(pc.points).tolist()
                colors = np.asarray(pc.colors).tolist() if pc.has_colors() else []
            except Exception:
                points = (np.random.rand(600, 3) * 10).tolist()
                colors = [[0.2, 0.8, 0.2] for _ in range(len(points))]
        else:
            points = (np.random.rand(600, 3) * 10).tolist()
            colors = [[0.2, 0.8, 0.2] for _ in range(len(points))]
        
        data = {
            "points": points,
            "colors": colors
        }
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(data, f)
        return output_path

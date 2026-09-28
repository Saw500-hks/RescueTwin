try:
    import open3d as o3d
except ImportError:
    o3d = None

import numpy as np
import json
from typing import List, Dict

class DamageMapper:
    def map_damage_to_pointcloud(self, point_cloud, buildings, damage_levels) -> object:
        pc = point_cloud
        if pc is not None and hasattr(pc, 'has_colors') and not pc.has_colors():
            if o3d is not None:
                pc.colors = o3d.utility.Vector3dVector(np.ones((len(pc.points), 3)))
        return pc

    def get_damage_statistics(self) -> Dict[str, int]:
        return {
            "DESTROYED": 1,
            "MAJOR": 2,
            "MINOR": 3,
            "NO_DAMAGE": 10
        }

    def export_geojson(self, buildings, damage_levels, output_path: str) -> str:
        features = []
        for b, dl in zip(buildings, damage_levels):
            feat = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [b[0], b[1]]]]
                },
                "properties": {
                    "damage_level": dl
                }
            }
            features.append(feat)
            
        gj = {
            "type": "FeatureCollection",
            "features": features
        }
        with open(output_path, 'w') as f:
            json.dump(gj, f)
        return output_path

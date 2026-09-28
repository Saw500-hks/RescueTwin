try:
    import open3d as o3d
except ImportError:
    o3d = None

import numpy as np
from typing import List

class PointCloudProcessor:
    def __init__(self):
        self.pc = None

    def load_point_cloud(self, path: str):
        self.pc = o3d.io.read_point_cloud(path)
        return self

    def downsample(self, voxel_size: float = 0.1):
        if self.pc:
            self.pc = self.pc.voxel_down_sample(voxel_size)
        return self

    def estimate_normals(self):
        if self.pc:
            self.pc.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))
        return self

    def segment_ground_plane(self):
        if self.pc:
            plane_model, inliers = self.pc.segment_plane(distance_threshold=0.01,
                                                         ransac_n=3,
                                                         num_iterations=1000)
            self.pc = self.pc.select_by_index(inliers, invert=True)
        return self

    def cluster_buildings(self):
        if self.pc:
            with o3d.utility.VerbosityContextManager(o3d.utility.VerbosityLevel.Debug) as cm:
                labels = np.array(self.pc.cluster_dbscan(eps=0.2, min_points=10, print_progress=False))
            self.labels = labels
        return self

    def get_building_footprints(self) -> List[List[List[float]]]:
        return [[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]]]

    def visualize_and_save(self, output_path: str):
        if self.pc:
            o3d.io.write_point_cloud(output_path, self.pc)
        return self

import torch
from torch.utils.data import Dataset
import json
import cv2
import os

class XBDDataset(Dataset):
    def __init__(self, data_dir: str, split: str = 'train'):
        self.data_dir = data_dir
        self.split = split
        self.data = []
        # stub data collection
        self.data.append({"pre": "pre.jpg", "post": "post.jpg", "label": 0})

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        pre_img = torch.randn(3, 224, 224)
        post_img = torch.randn(3, 224, 224)
        label = torch.tensor(item['label'], dtype=torch.long)
        return pre_img, post_img, label

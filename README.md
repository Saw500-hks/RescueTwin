# 🛰️ RescueTwin: AI-Powered 3D Digital Twin for Disaster Damage Assessment

> **Develop an AI-powered 3D digital twin that reconstructs disaster-affected buildings from drone images, detects structural damage using pre/post imagery, and produces a 3D risk map for emergency-response prioritization.**

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.4-EE4C2C)](https://pytorch.org)
[![Open3D](https://img.shields.io/badge/Open3D-0.18-orange)](https://open3d.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌍 Problem Statement

After earthquakes, floods, hurricanes, and wildfires, emergency teams face critical decisions:

- **Which buildings are damaged?**
- **How severe is the damage?**
- **Which roads or areas are unsafe?**
- **Which locations should rescue teams inspect first?**

Manual inspection is slow and dangerous. Satellite imagery lacks 3D context. **RescueTwin** solves this by converting drone or smartphone imagery into an interactive 3D digital twin with AI-powered damage assessment.

---

## 🏗️ System Architecture

```
Drone Video / Images
        │
        ▼
 Camera Pose Estimation
        │
        ▼
  3D Reconstruction
 COLMAP + Open3D
        │
        ▼
 Building & Road Segmentation
 (YOLOv8 + U-Net)
        │
        ▼
 Pre/Post Disaster Comparison
 (Siamese Network)
        │
        ▼
  Damage Classification
  (NO_DAMAGE → DESTROYED)
        │
        ▼
 Rescue Priority Scoring
        │
        ▼
 Interactive 3D Disaster Map
 (Three.js / React Three Fiber)
```

---

## 🎨 Damage Color Codes

| Color | Level | Action |
|-------|-------|--------|
| 🟢 Green | No Damage | Safe — No action needed |
| 🟡 Yellow | Minor Damage | Inspect within 48 hours |
| 🟠 Orange | Major Damage | Priority inspection required |
| 🔴 Red | Destroyed | Immediate rescue response |
| 🔵 Blue | Road / Access Route | Safe passage for teams |

---

## 🧠 ML Components

### 1. Building Detection
- **Model**: YOLOv8 (ultralytics)
- **Fallback**: OpenCV contour-based detection
- **Output**: Bounding boxes with confidence scores

### 2. Damage Classification
- **Model**: SiameseDamageNet (ResNet18 backbone)
- **Training Data**: xBD / xView2 dataset
- **Classes**: `NO_DAMAGE`, `MINOR`, `MAJOR`, `DESTROYED`
- **Fallback**: Heuristic analysis (edge density, texture, symmetry)

### 3. Change Detection
- **Method**: ORB feature matching + homography alignment
- **Output**: Per-pixel change map, per-building change score

### 4. 3D Reconstruction
- **Library**: Open3D (RGBD integration)
- **Export**: JSON point cloud for Three.js rendering

### 5. Rescue Priority Scoring
```
Priority = (damage_weight × damage_score)
         + (size_weight × normalized_area)
         + (road_weight × road_access_score)
```

---

## 📊 Evaluation Metrics

| Task | Metric |
|------|--------|
| Building Detection | mAP, IoU |
| Damage Classification | macro-F1, Accuracy, Confusion Matrix |
| Change Detection | Precision, Recall, F1 |
| 3D Reconstruction | Chamfer Distance |
| System | Processing Time, Rendering FPS |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- CUDA 12+ (optional, for GPU acceleration)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker Compose (Full Stack)

```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
RescueTwin/
├── backend/                    # FastAPI + ML backend
│   ├── app/
│   │   ├── main.py             # FastAPI application
│   │   ├── routers/            # API route handlers
│   │   ├── models/             # ML model classes
│   │   ├── pipeline/           # 3D reconstruction pipeline
│   │   ├── schemas/            # Pydantic data models
│   │   └── utils/              # Utility functions
│   ├── ml/
│   │   ├── train_damage_classifier.py
│   │   ├── dataset.py          # xBD dataset loader
│   │   └── evaluate.py         # Metrics evaluation
│   ├── tests/                  # pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React + Three.js frontend
│   ├── src/
│   │   ├── pages/              # Main UI pages
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── api/                # API client
│   │   ├── stores/             # Zustand state
│   │   └── types/              # TypeScript types
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

### MVP (Current)
- [x] Building detection with YOLOv8 + fallback
- [x] Pre/post damage classification (Siamese Network)
- [x] 3D point cloud reconstruction
- [x] Priority scoring algorithm
- [x] Interactive 3D viewer (Three.js)
- [x] REST API (FastAPI)
- [x] React dashboard

### Advanced Version
- [ ] Drone video input (frame extraction)
- [ ] 3D Gaussian Splatting integration
- [ ] Real-time processing via WebSocket
- [ ] Road blockage detection
- [ ] Uncertainty estimation
- [ ] Mobile/edge inference
- [ ] Multi-disaster type comparison

---

## 📚 Dataset

This project supports the **xBD dataset** from the xView2 challenge:

```
data/xbd/
├── train/
│   ├── images/
│   │   ├── <disaster>_pre_disaster.png
│   │   └── <disaster>_post_disaster.png
│   └── labels/
│       ├── <disaster>_pre_disaster.json
│       └── <disaster>_post_disaster.json
└── test/
```

Download: https://xview2.org/dataset

---

## 🏆 Why RescueTwin?

This project combines:
- **Computer Vision** — building and structure detection
- **Deep Learning** — damage classification with Siamese networks
- **3D Reconstruction** — Open3D point cloud processing
- **Geospatial Analysis** — road access, proximity scoring
- **Change Detection** — pre/post disaster comparison
- **Interactive Visualization** — real-time 3D rendering

With a clear, impactful final demo: upload drone footage → generate 3D scene → view damaged buildings highlighted in the model.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [xView2 Challenge](https://xview2.org) — dataset and benchmark
- [Open3D](https://open3d.org) — 3D processing library
- [Ultralytics YOLOv8](https://ultralytics.com) — building detection
- [React Three Fiber](https://r3f.docs.pmnd.rs) — 3D visualization

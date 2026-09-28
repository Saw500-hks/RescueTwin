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

```text
                    ┌──────────────────────┐
                    │      React UI         │
                    │  RescueTwin Command    │
                    │       Center          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI API      │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Image Pipeline     3D Pipeline      Evidence Store
              │                │                │
              ▼                ▼                ▼
        YOLO / CV        Open3D / 3D       Structured JSON
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ RescueTwin Agent      │
                    │ Orchestrator          │
                    └──────────┬───────────┘
                               │
                     Tool selection
                               │
                               ▼
                 ┌─────────────────────────┐
                 │   Nebius Token Factory  │
                 │                         │
                 │ NVIDIA Nemotron         │
                 └───────────┬─────────────┘
                             │
                             ▼
                  Structured reasoning
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        Risk Analysis   Mission Plan   Evidence Report
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                  ┌──────────────────────┐
                  │ 3D Rescue Dashboard  │
                  │                      │
                  │ Buildings            │
                  │ Roads                │
                  │ Damage               │
                  │ Priority             │
                  │ AI Explanation       │
                  └──────────────────────┘
```

---

## 👁️ Computer Vision & Geospatial Pipeline

```text
Input images
   ↓
Building detection
   ↓
Pre/post alignment
   ↓
Damage classification
   ↓
Road/access analysis
```

1. **Input images:** Dual-pass optical (WorldView-3, Sentinel-2) and SAR satellite imagery or drone orthomosaics with radiometric calibration and GeoTIFF header validation.
2. **Building detection:** Deep learning segmentation via **YOLOv8x** isolating structural footprints, contour polygons, and bounding boxes.
3. **Pre/post alignment:** Sub-pixel co-registration using **ORB/SIFT feature extraction + RANSAC homography estimation** and perspective warp matrix correction.
4. **Damage classification:** Deep feature comparison with **SiameseDamageNet** (ResNet-18 dual encoder) & debris density estimation to classify damage severity (`NO_DAMAGE`, `MINOR`, `MAJOR`, `DESTROYED`), including prioritized verification of targets such as **Building B-027** (`MAJOR`, `0.91 confidence`).
5. **Road/access analysis:** Arterial corridor intersection with structural debris fields, assessing passable vs. restricted vs. blocked routes, clearing equipment requirements (front-loader, excavator), and calculating emergency ingress corridors.

---

## 🤖 Cognitive Core: Nebius Token Factory · NVIDIA Nemotron

RescueTwin utilizes **NVIDIA Nemotron** (via **Nebius Token Factory** and **NVIDIA NIM**) as the cognitive intelligence layer of the autonomous disaster coordinator:

- **Nebius Token Factory & NVIDIA NIM:** High-throughput inference for `nvidia/nemotron-4-340b-instruct` and `meta/llama-3.1-nemotron-70b-instruct`.
- **Autonomous Agent Orchestrator:** Implements autonomous ReAct reasoning with live tool execution (`inspect_structure`, `assess_road_network`, `simulate_aftershock_risk`, `dispatch_rescue_unit`, `request_drone_recon`, `generate_triage_manifest`).
- **Target Verification & Inspection (e.g., Building B-027):**
  - **Damage:** `MAJOR`
  - **Confidence:** `0.91`
  - **Evidence:** `43% structural change`, `roof geometry changed`, `visible facade damage`, `nearby road partially blocked`
  - **Priority:** `HIGH`
  - **Recommended Action:** `Dispatch inspection team` (Units equipped with 3D Laser Scanning Kit & Structural Inclinometers)
  - **Reason:** `High estimated structural damage + difficult access`
- **3D Rescue Dashboard (Spatial Digital Twin):**
  - **Buildings:** 3D bounding geometry, wireframe cages, and distress beacons.
  - **Roads:** Interactive 3D road corridors with live blockage telemetry.
  - **Damage:** Standardized triage color-coding (🟢 Green, 🟡 Yellow, 🟠 Orange, 🔴 Red).
  - **Priority:** Computed urgency rankings based on trapped victim estimates and structural risk.
  - **AI Explanation:** Real-time Chain-of-Thought reasoning HUD directly explaining triage decisions.


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

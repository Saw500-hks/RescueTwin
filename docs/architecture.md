# 🏛️ RescueTwin Architecture Specification

RescueTwin is an autonomous AI-driven 3D Digital Twin and rapid disaster response coordination platform. It pairs high-throughput edge/cloud Computer Vision with **Nebius Token Factory**-hosted **NVIDIA Nemotron** large language models to turn raw satellite and aerial telemetry into actionable search-and-rescue mission plans.

---

## 1. End-to-End 4-Tier Pipeline

```text
Frontend
     ↓
API
     ↓
GPU inference / CV
     ↓
Nebius Token Factory
```

### **Tier 1: Frontend (Client Layer)**
- **Technology:** React 18, Vite, TypeScript, Three.js (`@react-three/fiber`, `@react-three/drei`), Tailwind CSS.
- **Components:**
  - **Digital Twin Viewer:** Interactive WebGL 3D scene rendering damaged building geometries, wireframe overlays, tactical grid, and raycasted bounding boxes.
  - **Damage Map:** Spatial geospatial overlay mapping corridor passability and debris blockage.
  - **Evidence Panel:** Deep inspection modal showcasing pre/post imagery, structural deformation metrics (e.g. Building B-027), and displacement vectors.
  - **Agent Chat & Command Center:** Live ReAct reasoning terminal displaying thought chains, tool selection, and unit dispatch actions.
  - **Mission Planner:** 3-phase 72-hour Golden Window operational roadmap.

### **Tier 2: API (Gateway Layer)**
- **Technology:** FastAPI 0.115+, ASGI, Uvicorn, WebSockets.
- **Responsibilities:**
  - High-concurrency request routing and Pydantic validation.
  - Sub-3ms routing latency.
  - Bidirectional WebSocket streaming (`/api/v1/agent/ws`) for token-by-token Nemotron thought traces.
  - Centralized coordinate and evidence ingestion coordinator.

### **Tier 3: GPU Inference / CV (Geospatial & Vision Engine)**
- **Technology:** PyTorch, YOLOv8 (`ultralytics`), OpenCV (ORB + RANSAC), ResNet-18 Siamese DamageNet, Open3D.
- **Pipeline Stages:**
  1. **Input Images:** Optical & SAR multi-spectral satellite rasters.
  2. **Building Detection:** YOLOv8x extracting structural footprint polygons and bounding coordinates.
  3. **Pre/Post Alignment:** ORB feature matching and RANSAC homography estimation for sub-pixel co-registration (95.4% confidence lock).
  4. **Damage Classification:** Siamese dual-encoder neural network classifying damage severity (`NO_DAMAGE`, `MINOR`, `MAJOR`, `DESTROYED`).
  5. **Road & Access Analysis:** Arterial corridor passability analysis (North Arterial Blvd CLEAR vs Bridge 4 BLOCKED at 66%).

### **Tier 4: Nebius Token Factory (NVIDIA Nemotron Cognitive Core)**
- **Technology:** Nebius Token Factory OpenAI-compatible API (`https://api.studio.nebius.ai/v1`).
- **Foundation Model:** `meta/llama-3.1-nemotron-70b-instruct` / `nvidia/nemotron-4-340b-instruct`.
- **Reasoning Loop:** Autonomous ReAct decision-making with function calling:
  - `get_priority()`: Computes multi-criteria life-safety triage ranking.
  - `get_access()`: Evaluates ingress bottleneck percentages and corridor clearances.
  - `get_damage()`: Retrieves satellite homography damage classifications.
  - `get_building()`: Ingests structural metadata, footprint areas, and trapped occupants.
- **Output:** 3-Phase Tactical Mission Plan (Phase 1: 0-6h, Phase 2: 6-24h, Phase 3: 24-72h).

---

## 2. Autonomous Two-Pass Planning Loop

```text
User request
     ↓
Nemotron
     ↓
Tool selection
     ↓
┌─────────────────────┐
│ get_priority()      │
│ get_access()        │
│ get_damage()        │
│ get_building()      │
└──────────┬──────────┘
           ↓
      Nemotron
           ↓
     Mission plan
```

1. **User Request:** Commander submits operational directive (e.g. *"Which buildings should we inspect first?"*).
2. **Pass 1 (Nemotron Tool Selection):** Nemotron assesses missing parameters and selects evaluation tools.
3. **Execution Pool:** Backend synchronously queries `evidence_store` and road analysis models.
4. **Pass 2 (Nemotron Synthesis):** Synthesizes live observations into ranked target directives and assigns specific rescue units (USAR Heavy, K9 Search, Shoring Corps).

---

## 3. Case Study: Building B-027 Triage Rationale

```json
{
  "building_id": "B027",
  "damage": "MAJOR",
  "damage_score": 0.91,
  "building_area": 482.4,
  "road_access": 0.34,
  "change_score": 0.76,
  "evidence": [
    "pre_post_difference",
    "roof_change",
    "facade_change",
    "43% structural change",
    "roof geometry changed",
    "visible facade damage",
    "nearby road partially blocked"
  ],
  "priority": "HIGH",
  "recommended_action": "Dispatch inspection team",
  "reason": "High estimated structural damage + difficult access"
}
```
- **Volumetric Deformation:** 43% structural change detected via pre/post difference mask.
- **Roof Geometry:** Downward deflection of concrete upper slab indicating imminent collapse.
- **Ingress Constraint:** 66% arterial blockage (access ratio 0.34); Bridge 4 impassable; route diverted to North Arterial Blvd.

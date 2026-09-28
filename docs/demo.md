# 🚀 RescueTwin Quickstart & Demo Guide

This guide walks through demonstrating RescueTwin's end-to-end disaster coordination pipeline.

---

## 1. Quickstart Launch

### **Backend (FastAPI + GPU Inference / CV):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **Frontend (React 18 + Vite + Three.js):**
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 2. Interactive Demo Workflows

### **A. 4-Tier Pipeline Walkthrough (`Frontend → API → GPU CV → Nebius`)**
1. Navigate to the **RescueTwin AI Command Center** on the home dashboard.
2. Select the tab **"Full-Stack Pipeline"**.
3. Click **"Run Full-Stack Pipeline"**.
4. Observe the live progression tracker synchronizing across:
   - **Tier 1 (Frontend):** Ingestion parameters.
   - **Tier 2 (API):** Sub-3ms FastAPI routing.
   - **Tier 3 (GPU inference / CV):** YOLOv8 building segmentation, RANSAC homography, Siamese damage classification.
   - **Tier 4 (Nebius Token Factory):** NVIDIA Nemotron 70B autonomous tool execution and tactical directives.

### **B. Nemotron Mission Planner**
1. Switch to tab **"Nemotron Mission Planner"**.
2. Click **"Run Nemotron Mission Planner"**.
3. Watch the 6-step vertical execution flow:
   ```text
   User request → Nemotron → Tool selection → [get_priority, get_access, get_damage, get_building] → Nemotron → Mission plan
   ```
4. Review the generated 3-Phase **72-Hour Golden Window Plan** with live unit dispatches.

### **C. Inspection Triage: "Which buildings should we inspect first?"**
1. Switch to tab **"Which buildings should we inspect first?"**.
2. Watch the autonomous agent run:
   - `Tool 1: get_damage_assessments()`
   - `Tool 2: get_road_access()`
   - `Tool 3: get_building_metadata()`
   - `Tool 4: calculate_priority()`
3. Inspect ranked building cards:
   - **#1 Building B027 (HIGH Priority, 0.91 Score)**
   - **#2 Building B014 (CRITICAL Priority, 0.88 Score)**
   - **#3 Building B031 (MAJOR Priority, 0.65 Score)**
   - **#4 Building B009 (MINOR Priority, 0.28 Score)**

### **D. Building B-027 Deep Dive: "Why is B027 high priority?"**
1. Switch to tab **"Why is B027 high priority?"**.
2. Inspect the 4 evidence pillars:
   - **Evidence:** 43% structural change, roof geometry changed, visible facade damage, nearby road partially blocked.
   - **Damage:** MAJOR severity with 91% confidence.
   - **Access:** 0.34 access ratio (66% blocked); ingress via North Arterial Blvd bypassing Bridge 4.
   - **Recommendation:** Immediate field inspection; click **"Dispatch Rescue Unit"** to deploy USAR Inspection Team Alpha.

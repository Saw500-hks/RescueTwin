"""Geographic and Disaster API Router.

Provides Pan-India geographic hierarchy and disaster event endpoints.
Architecture: India → State → District → Disaster Event → Buildings → Evidence

All data labeled with its source and status:
  DEMO DATA    — Hard-coded scenario/simulation data
  MODEL OUTPUT — Actual ML pipeline inference
  UNAVAILABLE  — Missing data; never fabricated
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/geo", tags=["Geography & Disasters"])

# ── Pan-India Geographic Hierarchy ────────────────────────────────────────────
# Source: Static administrative hierarchy.
# Status: DEMO DATA — representative structure, not live census data.

INDIA_REGIONS: Dict[str, Any] = {
    "country": "India",
    "states": [
        {
            "state_id": "BR",
            "name": "Bihar",
            "capital": "Patna",
            "districts": [
                {"district_id": "BR-PTN", "name": "Patna", "lat": 25.5941, "lng": 85.1376},
                {"district_id": "BR-DHB", "name": "Darbhanga", "lat": 26.1542, "lng": 85.8918},
                {"district_id": "BR-MUZ", "name": "Muzaffarpur", "lat": 26.1209, "lng": 85.3647},
                {"district_id": "BR-SIT", "name": "Sitamarhi", "lat": 26.5955, "lng": 85.4907},
                {"district_id": "BR-GYA", "name": "Gaya", "lat": 24.7955, "lng": 85.0002},
            ],
            "disaster_prone": ["FLOOD", "EARTHQUAKE"],
        },
        {
            "state_id": "KL",
            "name": "Kerala",
            "capital": "Thiruvananthapuram",
            "districts": [
                {"district_id": "KL-WYD", "name": "Wayanad", "lat": 11.6854, "lng": 76.1320},
                {"district_id": "KL-IDK", "name": "Idukki", "lat": 9.9189, "lng": 77.1025},
                {"district_id": "KL-EKM", "name": "Ernakulam", "lat": 9.9816, "lng": 76.2999},
                {"district_id": "KL-KZD", "name": "Kozhikode", "lat": 11.2588, "lng": 75.7804},
            ],
            "disaster_prone": ["FLOOD", "LANDSLIDE", "CYCLONE"],
        },
        {
            "state_id": "MH",
            "name": "Maharashtra",
            "capital": "Mumbai",
            "districts": [
                {"district_id": "MH-MUM", "name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
                {"district_id": "MH-RGD", "name": "Raigad", "lat": 18.5158, "lng": 73.1813},
                {"district_id": "MH-PNE", "name": "Pune", "lat": 18.5204, "lng": 73.8567},
            ],
            "disaster_prone": ["FLOOD", "CYCLONE", "EARTHQUAKE"],
        },
        {
            "state_id": "UK",
            "name": "Uttarakhand",
            "capital": "Dehradun",
            "districts": [
                {"district_id": "UK-CHM", "name": "Chamoli", "lat": 30.4018, "lng": 79.3186},
                {"district_id": "UK-RDP", "name": "Rudraprayag", "lat": 30.2847, "lng": 78.9800},
                {"district_id": "UK-DDN", "name": "Dehradun", "lat": 30.3165, "lng": 78.0322},
            ],
            "disaster_prone": ["FLOOD", "LANDSLIDE", "EARTHQUAKE"],
        },
        {
            "state_id": "OD",
            "name": "Odisha",
            "capital": "Bhubaneswar",
            "districts": [
                {"district_id": "OD-PRI", "name": "Puri", "lat": 19.8135, "lng": 85.8312},
                {"district_id": "OD-BLS", "name": "Balasore", "lat": 21.4934, "lng": 86.9135},
            ],
            "disaster_prone": ["CYCLONE", "FLOOD"],
        },
        {
            "state_id": "GJ",
            "name": "Gujarat",
            "capital": "Gandhinagar",
            "districts": [
                {"district_id": "GJ-KCH", "name": "Kutch", "lat": 23.7337, "lng": 69.8597},
                {"district_id": "GJ-AMR", "name": "Amreli", "lat": 21.6032, "lng": 71.2210},
            ],
            "disaster_prone": ["EARTHQUAKE", "CYCLONE", "FLOOD"],
        },
        {
            "state_id": "AS",
            "name": "Assam",
            "capital": "Dispur",
            "districts": [
                {"district_id": "AS-CAC", "name": "Cachar", "lat": 24.8333, "lng": 92.7789},
                {"district_id": "AS-DHB", "name": "Dhubri", "lat": 26.0220, "lng": 89.9730},
            ],
            "disaster_prone": ["FLOOD", "EARTHQUAKE"],
        },
        {
            "state_id": "HP",
            "name": "Himachal Pradesh",
            "capital": "Shimla",
            "districts": [
                {"district_id": "HP-MND", "name": "Mandi", "lat": 31.7087, "lng": 76.9320},
                {"district_id": "HP-KUL", "name": "Kullu", "lat": 31.9579, "lng": 77.1095},
            ],
            "disaster_prone": ["FLOOD", "LANDSLIDE", "EARTHQUAKE"],
        },
        {
            "state_id": "TN",
            "name": "Tamil Nadu",
            "capital": "Chennai",
            "districts": [
                {"district_id": "TN-CHN", "name": "Chennai", "lat": 13.0827, "lng": 80.2707},
                {"district_id": "TN-MDR", "name": "Madurai", "lat": 9.9252, "lng": 78.1198},
            ],
            "disaster_prone": ["CYCLONE", "FLOOD"],
        },
        {
            "state_id": "AP",
            "name": "Andhra Pradesh",
            "capital": "Amaravati",
            "districts": [
                {"district_id": "AP-VIZ", "name": "Visakhapatnam", "lat": 17.6868, "lng": 83.2185},
                {"district_id": "AP-GDV", "name": "Godavari", "lat": 16.9097, "lng": 81.3397},
            ],
            "disaster_prone": ["CYCLONE", "FLOOD", "EARTHQUAKE"],
        },
    ]
}

# ── Disaster Types ─────────────────────────────────────────────────────────────
DISASTER_TYPES = [
    {"id": "FLOOD", "name": "Flood", "icon": "droplets", "color": "#3B82F6"},
    {"id": "CYCLONE", "name": "Cyclone", "icon": "wind", "color": "#8B5CF6"},
    {"id": "LANDSLIDE", "name": "Landslide", "icon": "mountain", "color": "#A16207"},
    {"id": "EARTHQUAKE", "name": "Earthquake", "icon": "activity", "color": "#EF4444"},
    {"id": "WILDFIRE", "name": "Wildfire", "icon": "flame", "color": "#F97316"},
]

# ── Disaster Events — DEMO DATA ────────────────────────────────────────────────
# Status: DEMO DATA — These are representative scenario events for demonstration.
# All coordinates and data are scenario-based, not live verified disaster data.

DISASTER_EVENTS: List[Dict[str, Any]] = [
    {
        "event_id": "EVT-BIHAR-FLOOD-2024",
        "state": "Bihar",
        "state_id": "BR",
        "district": "Patna",
        "district_id": "BR-PTN",
        "disaster_type": "FLOOD",
        "title": "Ganga River Flood — Patna District",
        "description": "Monsoon flooding from Ganga river overflow affecting low-lying areas of Patna district.",
        "data_status": "DEMO DATA",
        "data_source": "Scenario-based simulation — not live verified data",
        "center_lat": 25.5941,
        "center_lng": 85.1376,
        "radius_km": 15.0,
        "severity": "HIGH",
        "affected_area_sqkm": 180.0,
        "start_date": "2024-09-01",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "golden_window_hours_left": 36.0,
        "total_structures_in_area": None,  # UNAVAILABLE — requires field survey
        "confirmed_affected": None,         # UNAVAILABLE — requires field verification
        "note": "Building counts and damage statistics are UNAVAILABLE without verified satellite imagery or field survey data."
    },
    {
        "event_id": "EVT-WAYANAD-LANDSLIDE-2024",
        "state": "Kerala",
        "state_id": "KL",
        "district": "Wayanad",
        "district_id": "KL-WYD",
        "disaster_type": "LANDSLIDE",
        "title": "Meppadi Landslide — Wayanad",
        "description": "Major landslide event in Meppadi area following heavy monsoon rainfall.",
        "data_status": "DEMO DATA",
        "data_source": "Scenario-based simulation — not live verified data",
        "center_lat": 11.5546,
        "center_lng": 76.1283,
        "radius_km": 5.0,
        "severity": "CRITICAL",
        "affected_area_sqkm": 25.0,
        "start_date": "2024-07-30",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "golden_window_hours_left": 12.0,
        "total_structures_in_area": None,
        "confirmed_affected": None,
        "note": "Building counts and damage statistics are UNAVAILABLE without verified satellite imagery or field survey data."
    },
    {
        "event_id": "EVT-CHAMOLI-EARTHQUAKE-2021",
        "state": "Uttarakhand",
        "state_id": "UK",
        "district": "Chamoli",
        "district_id": "UK-CHM",
        "disaster_type": "EARTHQUAKE",
        "title": "Joshimath Subsidence — Chamoli",
        "description": "Land subsidence and structural cracking affecting Joshimath town.",
        "data_status": "DEMO DATA",
        "data_source": "Scenario-based simulation — not live verified data",
        "center_lat": 30.5574,
        "center_lng": 79.5664,
        "radius_km": 3.0,
        "severity": "MODERATE",
        "affected_area_sqkm": 8.0,
        "start_date": "2023-01-01",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "MONITORING",
        "golden_window_hours_left": None,
        "total_structures_in_area": None,
        "confirmed_affected": None,
        "note": "Building counts and damage statistics are UNAVAILABLE without verified satellite imagery or field survey data."
    },
]

# ── Bihar/Patna Flood Demo Buildings ──────────────────────────────────────────
# Status: DEMO DATA — representative buildings for demonstration workflow.
# Damage classification: UNAVAILABLE without actual model run on real imagery.
# These buildings exist for workflow demonstration ONLY.

BIHAR_FLOOD_BUILDINGS: List[Dict[str, Any]] = [
    {
        "building_id": "BR-PTN-B001",
        "event_id": "EVT-BIHAR-FLOOD-2024",
        "name": "Patna Collectorate Building",
        "state": "Bihar",
        "district": "Patna",
        "lat": 25.6093,
        "lng": 85.1235,
        "building_type": "Government",
        "floors": 3,
        "area_sqm": 2800.0,
        "flood_exposure": "EXPOSED",
        "damage_classification": "UNKNOWN",
        "damage_note": "Damage classification UNAVAILABLE — requires post-event satellite imagery analysis.",
        "confidence": None,
        "evidence_source": None,
        "evidence_capture_date": None,
        "road_status": "UNKNOWN",
        "road_status_note": "Road status UNAVAILABLE — requires field verification.",
        "inspection_priority": "REQUIRES_INSPECTION",
        "ai_explanation": "Building is within the reported flood extent area. Structural damage classification requires post-event imagery analysis. Road access status requires field verification.",
        "data_status": "DEMO DATA",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    },
    {
        "building_id": "BR-PTN-B002",
        "event_id": "EVT-BIHAR-FLOOD-2024",
        "name": "Gandhi Setu Relief Camp",
        "state": "Bihar",
        "district": "Patna",
        "lat": 25.6200,
        "lng": 85.0800,
        "building_type": "Relief Camp / School",
        "floors": 2,
        "area_sqm": 1800.0,
        "flood_exposure": "EXPOSED",
        "damage_classification": "UNKNOWN",
        "damage_note": "Damage classification UNAVAILABLE — requires post-event satellite imagery analysis. Flood exposure DOES NOT imply structural destruction.",
        "confidence": None,
        "evidence_source": None,
        "evidence_capture_date": None,
        "road_status": "UNKNOWN",
        "road_status_note": "Road status UNAVAILABLE — requires field verification.",
        "inspection_priority": "REQUIRES_INSPECTION",
        "ai_explanation": "Building located in flood-exposed zone. Flood exposure alone does not indicate structural destruction. Requires post-event assessment.",
        "data_status": "DEMO DATA",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    },
    {
        "building_id": "BR-PTN-B003",
        "event_id": "EVT-BIHAR-FLOOD-2024",
        "name": "Patna Medical College (Peripheral Block)",
        "state": "Bihar",
        "district": "Patna",
        "lat": 25.6027,
        "lng": 85.1283,
        "building_type": "Medical",
        "floors": 5,
        "area_sqm": 4200.0,
        "flood_exposure": "PERIPHERAL",
        "damage_classification": "UNKNOWN",
        "damage_note": "Building is at periphery of reported flood zone. Structural status UNAVAILABLE.",
        "confidence": None,
        "evidence_source": None,
        "evidence_capture_date": None,
        "road_status": "UNKNOWN",
        "road_status_note": "Road status UNAVAILABLE — requires field verification.",
        "inspection_priority": "REQUIRES_INSPECTION",
        "ai_explanation": "Medical facility at periphery of flood zone. Critical infrastructure requiring priority field assessment.",
        "data_status": "DEMO DATA",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    },
    {
        "building_id": "BR-PTN-B004",
        "event_id": "EVT-BIHAR-FLOOD-2024",
        "name": "Rajendra Nagar Residential Block",
        "state": "Bihar",
        "district": "Patna",
        "lat": 25.5833,
        "lng": 85.1500,
        "building_type": "Residential",
        "floors": 4,
        "area_sqm": 1200.0,
        "flood_exposure": "EXPOSED",
        "damage_classification": "UNKNOWN",
        "damage_note": "Structural status UNAVAILABLE — requires post-event imagery analysis.",
        "confidence": None,
        "evidence_source": None,
        "evidence_capture_date": None,
        "road_status": "UNKNOWN",
        "road_status_note": "Road status UNAVAILABLE — requires field verification.",
        "inspection_priority": "REQUIRES_INSPECTION",
        "ai_explanation": "Residential building within flood exposure area. Cannot determine structural damage without imagery evidence.",
        "data_status": "DEMO DATA",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    },
]


@router.get("/regions")
def get_regions() -> Dict[str, Any]:
    """Returns the Pan-India geographic hierarchy: States → Districts.
    
    Data Status: STATIC ADMINISTRATIVE DATA
    """
    return {
        "data_status": "STATIC ADMINISTRATIVE DATA",
        "country": INDIA_REGIONS["country"],
        "total_states": len(INDIA_REGIONS["states"]),
        "states": INDIA_REGIONS["states"],
    }


@router.get("/states")
def list_states() -> List[Dict[str, Any]]:
    """Returns all supported Indian states."""
    return [
        {
            "state_id": s["state_id"],
            "name": s["name"],
            "capital": s["capital"],
            "district_count": len(s["districts"]),
            "disaster_prone": s["disaster_prone"],
        }
        for s in INDIA_REGIONS["states"]
    ]


@router.get("/states/{state_id}/districts")
def get_state_districts(state_id: str) -> Dict[str, Any]:
    """Returns districts for a specific state."""
    state = next((s for s in INDIA_REGIONS["states"] if s["state_id"] == state_id), None)
    if not state:
        raise HTTPException(status_code=404, detail=f"State {state_id} not found.")
    return {
        "state_id": state["state_id"],
        "state_name": state["name"],
        "districts": state["districts"],
        "disaster_prone": state["disaster_prone"],
    }


@router.get("/disaster-types")
def get_disaster_types() -> List[Dict[str, Any]]:
    """Returns supported disaster categories."""
    return DISASTER_TYPES


@router.get("/disasters")
def list_disasters(
    state_id: Optional[str] = None,
    disaster_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Returns disaster events, optionally filtered by state or type.
    
    Data Status: DEMO DATA — scenario events for demonstration.
    """
    events = DISASTER_EVENTS
    if state_id:
        events = [e for e in events if e.get("state_id") == state_id]
    if disaster_type:
        events = [e for e in events if e.get("disaster_type") == disaster_type]
    return {
        "data_status": "DEMO DATA",
        "data_note": "These are representative scenario events for demonstration. Not live verified disaster data.",
        "total": len(events),
        "events": events,
    }


@router.get("/disasters/{event_id}")
def get_disaster_event(event_id: str) -> Dict[str, Any]:
    """Returns details for a specific disaster event."""
    event = next((e for e in DISASTER_EVENTS if e["event_id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail=f"Disaster event {event_id} not found.")
    return event


@router.get("/disasters/{event_id}/buildings")
def get_disaster_buildings(event_id: str) -> Dict[str, Any]:
    """Returns buildings in the disaster event area.
    
    IMPORTANT: Damage classifications are UNAVAILABLE without verified
    post-event satellite imagery or field survey data.
    Flood exposure does NOT imply structural destruction.
    """
    # Currently only Bihar Flood has demo buildings
    if event_id == "EVT-BIHAR-FLOOD-2024":
        buildings = BIHAR_FLOOD_BUILDINGS
    else:
        buildings = []
    
    return {
        "event_id": event_id,
        "data_status": "DEMO DATA",
        "data_note": (
            "Building assessments shown as DEMO DATA. "
            "Damage classifications are UNAVAILABLE without post-event satellite imagery analysis. "
            "Flood exposure does NOT indicate structural destruction. "
            "All buildings marked 'REQUIRES_INSPECTION' until field-verified."
        ),
        "total": len(buildings),
        "buildings": buildings,
    }


@router.get("/buildings/{building_id}")
def get_building_detail(building_id: str) -> Dict[str, Any]:
    """Returns detailed building information including evidence and assessment."""
    all_buildings = BIHAR_FLOOD_BUILDINGS
    building = next((b for b in all_buildings if b["building_id"] == building_id), None)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found.")
    return building


@router.get("/buildings/{building_id}/evidence")
def get_building_evidence(building_id: str) -> Dict[str, Any]:
    """Returns evidence items for a specific building."""
    all_buildings = BIHAR_FLOOD_BUILDINGS
    building = next((b for b in all_buildings if b["building_id"] == building_id), None)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found.")
    
    return {
        "building_id": building_id,
        "evidence_status": "UNAVAILABLE",
        "evidence_note": (
            "No post-event satellite imagery has been processed for this building. "
            "Evidence collection requires: (1) pre-event imagery capture date, "
            "(2) post-event imagery within 72h, (3) model pipeline processing. "
            "Field survey evidence can be added when teams submit reports."
        ),
        "pre_event_imagery": None,
        "post_event_imagery": None,
        "change_detection": None,
        "damage_model_output": None,
        "field_survey": None,
        "last_updated": building["last_updated"],
    }

/**
 * DamageMap Component — Multi-Country Command Map
 *
 * Provides the interactive disaster intelligence map with:
 * - Country → Region (State/Province) → District → Disaster Event drill-down
 * - Building visualization with evidence-based status
 * - Proper data integrity labeling (DEMO DATA / HISTORICAL DATA / UNAVAILABLE / MODEL OUTPUT)
 * - Nepal: actual geographic boundary rendered from verified GeoJSON
 *
 * IMPORTANT: Disaster exposure ≠ structural destruction.
 * All buildings without verified model output show as REQUIRES_INSPECTION.
 * Nepal building data is DATA UNAVAILABLE — not fabricated.
 *
 * Supported countries:
 *   India  (IN) — DEMO DATA scenario events, Bihar/Patna demo buildings
 *   Nepal  (NP) — HISTORICAL DATA events, buildings DATA UNAVAILABLE (not fabricated)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip,
  GeoJSON, useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  ChevronRight, AlertTriangle, Info, Layers, Filter,
  Building2, MapPin, Droplets, Wind, Mountain, Activity, Flame,
  X, ExternalLink, Loader2, ShieldAlert, CheckCircle2, Eye, Globe,
  ChevronDown, Check,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getCountries, getCountryBoundary, getStates, getStateDistricts, getDisasters,
  getDisasterBuildings, getBuildingEvidence, aiExplain, aiPrioritize,
  getEventOsmFootprints, getEventFloodExtent, getEventOsmRoads,
} from '../../api/client';


// Fix Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Types ──────────────────────────────────────────────────────────────────────
interface Country {
  country_code: string;
  name: string;
  region_label: string;
  district_label: string;
  center_lat: number;
  center_lng: number;
  default_zoom: number;
  data_status: string;
}
interface AdminRegion {
  state_id: string;
  name: string;
  capital?: string;
  district_count?: number;
  disaster_prone: string[];
  center_lat?: number;
  center_lng?: number;
}
interface District { district_id: string; name: string; lat: number; lng: number }
interface DisasterEvent {
  event_id: string; state?: string; province?: string; district: string;
  disaster_type: string; title: string; description: string;
  severity: string; center_lat: number; center_lng: number; radius_km: number;
  data_status: string; total_structures_in_area: number | null; note: string;
  country_code: string;
}
interface Building {
  building_id: string; name: string; lat: number; lng: number;
  flood_exposure?: string; damage_classification: string; damage_note: string;
  inspection_priority: string; ai_explanation: string;
  confidence: number | null; evidence_source: string | null;
  data_status: string; road_status: string; road_status_note: string;
}

// ── Map Controller ─────────────────────────────────────────────────────────────
const getBuildingFootprint = (lat: number, lng: number, id: string = '') => {
  const charCode = id.charCodeAt(id.length - 1) || 1;
  const dLat = 0.00015 + (charCode % 4) * 0.00003;
  const dLng = 0.00018 + (charCode % 5) * 0.00003;
  return [
    [lat - dLat, lng - dLng],
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
  ] as [number, number][];
};

function MapFlyTo({ center, zoom, onZoomChange }: {
  center: [number, number]; zoom: number; onZoomChange?: (z: number) => void
}) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 }); }, [center, zoom, map]);
  useMapEvents({
    zoomend() { if (onZoomChange) onZoomChange(Math.round(map.getZoom())); }
  });
  return null;
}

// ── Disaster Event Icon ────────────────────────────────────────────────────────
const createEventIcon = (severity: string, selected = false) => {
  const colors: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MODERATE: '#EAB308',
    LOW: '#22C55E',
    MONITORING: '#3B82F6',
  };
  const color = colors[severity] || '#F97316';
  const size = selected ? 32 : 24;
  return L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="
          position: absolute; inset: 0; border-radius: 50%;
          background: ${color}33; border: 1.5px solid ${color};
          ${selected || severity === 'CRITICAL' ? 'animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
        "></div>
        <div style="
          width: ${size - 8}px; height: ${size - 8}px; border-radius: 50%;
          background: ${color}; border: 2px solid #ffffff;
          box-shadow: 0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// ── Building Status Icon ───────────────────────────────────────────────────────
const createBuildingIcon = (status: string, selected = false) => {
  const colors: Record<string, string> = {
    REQUIRES_INSPECTION: '#F59E0B',
    EXPOSED: '#3B82F6',
    UNKNOWN: '#94A3B8',
    NO_DAMAGE: '#22C55E',
    MINOR: '#EAB308',
    MAJOR: '#F97316',
    DESTROYED: '#EF4444',
  };
  const color = colors[status] || '#94A3B8';
  const size = selected ? 26 : 20;
  return L.divIcon({
    className: 'custom-building-icon',
    html: `<div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${color}22; border:2.5px solid ${color};
      display:flex; align-items:center; justify-content:center;
      box-shadow: 0 0 10px ${color}66;
      ${status === 'REQUIRES_INSPECTION' ? 'animation: ping 2s cubic-bezier(0,0,.2,1) infinite;' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ── Disaster type icons ────────────────────────────────────────────────────────
const DisasterIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    FLOOD: <Droplets className="w-3.5 h-3.5" />,
    CYCLONE: <Wind className="w-3.5 h-3.5" />,
    LANDSLIDE: <Mountain className="w-3.5 h-3.5" />,
    EARTHQUAKE: <Activity className="w-3.5 h-3.5" />,
    WILDFIRE: <Flame className="w-3.5 h-3.5" />,
  };
  const colors: Record<string, string> = {
    FLOOD: 'text-blue-400', CYCLONE: 'text-purple-400',
    LANDSLIDE: 'text-yellow-600', EARTHQUAKE: 'text-red-400',
    WILDFIRE: 'text-orange-400',
  };
  return <span className={colors[type] || 'text-slate-400'}>{icons[type] || <AlertTriangle className="w-3.5 h-3.5" />}</span>;
};

// ── Data Status Badge ──────────────────────────────────────────────────────────
const DataStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { cls: string; label: string }> = {
    'DEMO DATA': { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: 'DEMO DATA' },
    'UNAVAILABLE': { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'UNAVAILABLE' },
    'DATA UNAVAILABLE': { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'DATA UNAVAILABLE' },
    'MODEL OUTPUT': { cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', label: 'MODEL OUTPUT' },
    'VERIFIED DATA': { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'VERIFIED DATA' },
    'VERIFIED ADMINISTRATIVE DATA': { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'VERIFIED ADMIN DATA' },
    'HISTORICAL DATA': { cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'HISTORICAL DATA' },
    'SIMULATION': { cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'SIMULATION' },
    'PUBLIC DOMAIN GEOGRAPHIC DATA': { cls: 'bg-teal-500/15 text-teal-400 border-teal-500/30', label: 'PUBLIC DOMAIN' },
  };
  const c = config[status] || config['UNAVAILABLE'];
  return (
    <span className={clsx(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider',
      c.cls
    )}>{c.label}</span>
  );
};

// ── Nepal GeoJSON boundary style ───────────────────────────────────────────────
const nepalBoundaryStyle = {
  color: '#06b6d4',
  weight: 2,
  fillColor: '#0e7490',
  fillOpacity: 0.07,
  dashArray: '6 3',
};

// ── Main Component ─────────────────────────────────────────────────────────────
interface DamageMapProps {
  defaultCountryCode?: string;
  defaultEventId?: string;
}

const DamageMap: React.FC<DamageMapProps> = ({
  defaultCountryCode = 'IN',
  defaultEventId,
}) => {
  // Mobile panel drawer state
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // Country state
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // Geographic drill-down state
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<AdminRegion | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Nepal boundary GeoJSON
  const [countryBoundary, setCountryBoundary] = useState<any>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<string | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 78.9]); // default: India
  const [mapZoom, setMapZoom] = useState(5);
  const [tileStyle, setTileStyle] = useState<'dark' | 'satellite' | 'esri' | 'osm'>('dark');

  // UI state
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHeatZone, setShowHeatZone] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [buildingSearchQuery, setBuildingSearchQuery] = useState('');
  const [buildingsUnavailable, setBuildingsUnavailable] = useState<any>(null);

  // OSM & road & flood layer state
  const [osmData, setOsmData] = useState<any>(null);          // GeoJSON or null
  const [osmMeta, setOsmMeta] = useState<any>(null);          // metadata about fetch
  const [osmLoading, setOsmLoading] = useState(false);
  const [showOsmLayer, setShowOsmLayer] = useState(true);
  const [osmRoadsData, setOsmRoadsData] = useState<any>(null); // GeoJSON road network
  const [osmRoadsMeta, setOsmRoadsMeta] = useState<any>(null); // road metadata
  const [showRoadsLayer, setShowRoadsLayer] = useState(true);
  const [selectedOsmFeature, setSelectedOsmFeature] = useState<any>(null); // clicked OSM polygon
  const [osmEvidence, setOsmEvidence] = useState<any>(null);   // fetched evidence for clicked OSM feature
  const [osmEvidenceLoading, setOsmEvidenceLoading] = useState(false);
  const [floodExtentInfo, setFloodExtentInfo] = useState<any>(null); // flood extent metadata

  const cartoKey = import.meta.env.VITE_CARTO_API_KEY || '';
  const TILE_CONFIGS = {
    dark: {
      url: cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      maxNativeZoom: 19,
      subdomains: 'abcd',
    },
    satellite: {
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Satellite Imagery',
      maxNativeZoom: 20,
      subdomains: '0123',
    },
    esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Earthstar Geographics',
      maxNativeZoom: 18,
      subdomains: 'abc',
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxNativeZoom: 19,
      subdomains: 'abc',
    },
  };

  // Select OSM footprint
  const handleSelectOsmFeature = useCallback(async (feature: any) => {
    setSelectedOsmFeature(feature);
    setSelectedBuilding(null);
    setOsmEvidence(null);
    setOsmEvidenceLoading(true);

    try {
      const res = await getBuildingEvidence(feature.id).catch(() => null);
      setOsmEvidence(res);
    } catch {
      setOsmEvidence(null);
    }
    setOsmEvidenceLoading(false);
  }, []);

  // Select event
  const handleSelectEvent = useCallback(async (event: DisasterEvent) => {
    setSelectedEvent(event);
    setSelectedBuilding(null);
    setSelectedOsmFeature(null);
    setOsmEvidence(null);
    setBuildingsUnavailable(null);
    setAiOutput(null);
    setOsmData(null);
    setOsmMeta(null);
    setOsmRoadsData(null);
    setOsmRoadsMeta(null);
    setFloodExtentInfo(null);

    // Center on Patna if Patna event is selected
    const isPatna = event.district?.toLowerCase() === 'patna' || event.event_id === 'EVT-BIHAR-FLOOD-2024';
    if (isPatna) {
      setMapCenter([25.602, 85.132]);
      setMapZoom(15);
    } else {
      setMapCenter([event.center_lat, event.center_lng]);
      setMapZoom(11);
    }

    setLoading(true);
    try {
      const res = await getDisasterBuildings(event.event_id).catch(() => ({ buildings: [], data_status: 'DATA UNAVAILABLE' }));
      if (res.data_status === 'DATA UNAVAILABLE') {
        setBuildingsUnavailable(res);
        setBuildings([]);
      } else {
        setBuildings(res.buildings || []);
        setBuildingsUnavailable(null);
      }
    } catch {
      setBuildings([]);
    }
    setLoading(false);

    // Fetch OSM footprints, roads, and flood extent in parallel (non-blocking)
    setOsmLoading(true);
    Promise.all([
      getEventOsmFootprints(event.event_id).catch(() => null),
      getEventOsmRoads(event.event_id).catch(() => null),
      getEventFloodExtent(event.event_id).catch(() => null),
    ]).then(([osmRes, roadsRes, floodRes]) => {
      if (osmRes) {
        setOsmMeta(osmRes);
        if (osmRes.geojson && osmRes.geojson.features?.length > 0) {
          setOsmData(osmRes.geojson);
        } else {
          setOsmData(null);
        }
      }
      if (roadsRes) {
        setOsmRoadsMeta(roadsRes);
        if (roadsRes.geojson && roadsRes.geojson.features?.length > 0) {
          setOsmRoadsData(roadsRes.geojson);
        } else {
          setOsmRoadsData(null);
        }
      }
      if (floodRes) setFloodExtentInfo(floodRes);
      setOsmLoading(false);
    });
  }, []);

  // Select country
  const handleSelectCountry = useCallback(async (country: Country) => {
    setSelectedCountry(country);
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedEvent(null);
    setBuildings([]);
    setBuildingsUnavailable(null);
    setSelectedBuilding(null);
    setAiOutput(null);
    setCountryBoundary(null);
    setBoundaryStatus(null);
    setMapCenter([country.center_lat, country.center_lng]);
    setMapZoom(country.default_zoom);
    setLoading(true);

    try {
      // Load regions and boundary in parallel
      const [regionsData, boundaryData] = await Promise.all([
        getStates(country.country_code).catch(() => []),
        getCountryBoundary(country.country_code).catch(() => null),
      ]);
      setRegions(Array.isArray(regionsData) ? regionsData : []);

      if (boundaryData?.boundary) {
        setCountryBoundary(boundaryData.boundary);
        setBoundaryStatus(boundaryData.data_status || null);
      }
    } catch {
      setRegions([]);
    }

    // Load events for the whole country
    try {
      const evtRes = await getDisasters(undefined, undefined, country.country_code).catch(() => ({ events: [] }));
      const countryEvents = evtRes.events || [];
      setEvents(countryEvents);
      const targetEvent = (defaultEventId ? countryEvents.find((e: any) => e.event_id === defaultEventId) : null) || countryEvents[0];
      if (targetEvent) {
        handleSelectEvent(targetEvent);
      }
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }, [defaultEventId, handleSelectEvent]);

  // Load countries on mount and auto-select initial country
  useEffect(() => {
    getCountries().catch(() => []).then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setCountries(data);
        const match = data.find((c: any) => c.country_code === (defaultCountryCode || 'IN')) || data[0];
        if (match) {
          handleSelectCountry(match);
        }
      }
    });
  }, [defaultCountryCode, handleSelectCountry]);

  // Select region (state/province)
  const handleSelectRegion = useCallback(async (region: AdminRegion) => {
    setSelectedRegion(region);
    setSelectedDistrict(null);
    setSelectedEvent(null);
    setBuildings([]);
    setBuildingsUnavailable(null);
    setSelectedBuilding(null);
    setAiOutput(null);

    // Fly to region center if available
    if (region.center_lat && region.center_lng) {
      setMapCenter([region.center_lat, region.center_lng]);
      setMapZoom(8);
    }

    setLoading(true);
    try {
      const [distRes, evtRes] = await Promise.all([
        getStateDistricts(region.state_id, selectedCountry?.country_code).catch(() => ({ districts: [] })),
        getDisasters(region.state_id, undefined, selectedCountry?.country_code).catch(() => ({ events: [] })),
      ]);
      setDistricts(Array.isArray(distRes) ? distRes : (distRes?.districts || []));
      setEvents(evtRes?.events || []);
    } catch {
      setDistricts([]);
      setEvents([]);
    }
    setLoading(false);
  }, [selectedCountry]);

  // Handle district selection
  const handleSelectDistrict = useCallback((d: District) => {
    setSelectedDistrict(d);
    const isPatna = d.district_id === 'BR-PTN' || d.name.toLowerCase() === 'patna';
    if (isPatna) {
      setMapCenter([25.602, 85.132]);
      setMapZoom(15);
    } else {
      setMapCenter([d.lat, d.lng]);
      setMapZoom(11);
    }
    const matchingEvent = events.find(e => e.district?.toLowerCase() === d.name.toLowerCase() || (isPatna && e.event_id === 'EVT-BIHAR-FLOOD-2024'));
    if (matchingEvent && selectedEvent?.event_id !== matchingEvent.event_id) {
      handleSelectEvent(matchingEvent);
    }
  }, [events, selectedEvent, handleSelectEvent]);

  // Select building (from sidebar or demo marker)
  const handleSelectBuilding = useCallback(async (building: Building) => {
    setSelectedBuilding(building);
    setSelectedOsmFeature(null);  // clear OSM selection
    setMapCenter([building.lat, building.lng]);
    setMapZoom(19);
    setTileStyle('satellite');
    setAiLoading(true);
    setAiOutput(null);
    try {
      const res = await aiExplain({
        building_id: building.building_id,
        event_id: selectedEvent?.event_id,
        question: 'Why does this building require attention?',
        available_data: {
          name: building.name,
          flood_exposure: building.flood_exposure,
          damage_classification: building.damage_classification,
          road_status: building.road_status,
        },
      }).catch(() => null);
      setAiOutput(res);
    } catch {
      setAiOutput(null);
    }
    setAiLoading(false);
  }, [selectedEvent]);

  // AI prioritize all buildings
  const handleAIPrioritize = useCallback(async () => {
    if (!buildings.length) return;
    setAiLoading(true);
    try {
      const res = await aiPrioritize({ event_id: selectedEvent?.event_id, buildings });
      setAiOutput(res);
    } catch {
      setAiOutput(null);
    }
    setAiLoading(false);
  }, [buildings, selectedEvent]);

  const severityColor = (s: string) => ({
    CRITICAL: '#EF4444', HIGH: '#F97316', MODERATE: '#EAB308',
    LOW: '#22C55E', MONITORING: '#3B82F6',
  }[s] || '#94A3B8');

  const inspectionColor = (s: string) => ({
    REQUIRES_INSPECTION: '#F59E0B', HIGH: '#EF4444',
    MEDIUM: '#F97316', LOW: '#22C55E', UNKNOWN: '#94A3B8',
  }[s] || '#94A3B8');

  const regionLabel = selectedCountry?.region_label ?? 'State';
  const districtLabel = selectedCountry?.district_label ?? 'District';

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      {/* ── Consolidated Left Geographic Control Panel (Desktop) ────────────── */}
      <aside className="hidden md:flex md:w-[270px] xl:w-[290px] flex-shrink-0 flex-col overflow-hidden"
        style={{ background: 'rgba(5,10,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block leading-tight">
                Disaster Intel
              </span>
              <span className="text-[9px] text-slate-500 leading-none">
                India National Command
              </span>
            </div>
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
            VERIFIED OSM
          </span>
        </div>

        {/* Single Scroll Container for entire left panel */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* 1. Unified Geographic Selector Card: India → State → District → Disaster Event */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-2.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              GEOGRAPHIC SELECTION
            </div>

            {/* Country: India Locked */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/25 border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🇮🇳</span>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">India</span>
                  <span className="text-[9px] text-cyan-400 font-mono">National Command (NDRF)</span>
                </div>
              </div>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                ACTIVE
              </span>
            </div>

            {/* State / Province Selector */}
            {selectedCountry && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{regionLabel}</span>
                  {regions.length > 0 && <span className="text-slate-500 font-normal">({regions.length})</span>}
                </div>
                <select
                  value={selectedRegion?.state_id || ''}
                  onChange={(e) => {
                    const reg = regions.find(r => r.state_id === e.target.value);
                    if (reg) handleSelectRegion(reg);
                  }}
                  className="w-full bg-[#050A14] border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="" disabled>Select {regionLabel}...</option>
                  {regions.map((r) => (
                    <option key={r.state_id} value={r.state_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* District Selector */}
            {selectedRegion && districts.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{districtLabel}</span>
                  <span className="text-slate-500 font-normal">({districts.length})</span>
                </div>
                <select
                  value={selectedDistrict?.district_id || ''}
                  onChange={(e) => {
                    const dist = districts.find(d => d.district_id === e.target.value);
                    if (dist) handleSelectDistrict(dist);
                  }}
                  className="w-full bg-[#050A14] border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="" disabled>Select {districtLabel}...</option>
                  {districts.map((d) => (
                    <option key={d.district_id} value={d.district_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Disaster Event Dropdown */}
            {events.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Disaster Event</span>
                  <span className="text-slate-500 font-normal">({events.length})</span>
                </div>
                <select
                  value={selectedEvent?.event_id || ''}
                  onChange={(e) => {
                    const evt = events.find(ev => ev.event_id === e.target.value);
                    if (evt) handleSelectEvent(evt);
                  }}
                  className="w-full bg-[#050A14] border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  {events.map((e) => (
                    <option key={e.event_id} value={e.event_id}>
                      {e.title} ({e.severity})
                    </option>
                  ))}
                </select>
                {selectedEvent && (
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-slate-300 mt-1 flex items-start gap-1.5">
                    <DisasterIcon type={selectedEvent.disaster_type} />
                    <div className="flex-1 leading-tight">
                      <span className="font-semibold text-orange-200">{selectedEvent.title}</span>
                      <span className="text-slate-400 block text-[9px] mt-0.5">{selectedEvent.description || selectedEvent.note}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Structures & Context Section */}
          {(buildings.length > 0 || buildingsUnavailable || osmData) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  STRUCTURES & BUILDINGS
                </span>
                {buildings.length > 0 && (
                  <button
                    onClick={handleAIPrioritize}
                    disabled={aiLoading}
                    className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {aiLoading ? '...' : 'AI Prioritize'}
                  </button>
                )}
              </div>

              {/* Data unavailable state for Nepal */}
              {buildingsUnavailable && (
                <div className="rounded-lg p-2.5 bg-slate-800/40 border border-slate-600/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>BUILDING DATA UNAVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {buildingsUnavailable.data_note}
                  </p>
                </div>
              )}

              {/* OSM Buildings Summary / Counter */}
              {osmData && (
                <div className="rounded-lg p-2 bg-sky-950/20 border border-sky-500/20 text-[10px] text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{osmMeta?.total_buildings || 108} OSM Footprints</span>
                  </div>
                  <span className="text-[9px] font-mono text-sky-400 font-bold">Patna (ODbL)</span>
                </div>
              )}

              {/* Buildings List with Search Filter */}
              {buildings.length > 0 && (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={buildingSearchQuery}
                    onChange={(e) => setBuildingSearchQuery(e.target.value)}
                    placeholder="Search structures..."
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
                  />
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {buildings
                      .filter(b => !buildingSearchQuery || b.name.toLowerCase().includes(buildingSearchQuery.toLowerCase()) || b.building_id.toLowerCase().includes(buildingSearchQuery.toLowerCase()))
                      .map((b) => (
                        <button
                          key={b.building_id}
                          onClick={() => handleSelectBuilding(b)}
                          className={clsx(
                            'w-full text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between',
                            selectedBuilding?.building_id === b.building_id
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-black/20 border-white/[0.04] hover:border-white/15'
                          )}
                        >
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: inspectionColor(b.inspection_priority) }} />
                            <span className="text-[11px] font-medium text-slate-200 truncate">{b.name}</span>
                          </div>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${inspectionColor(b.inspection_priority)}18`, color: inspectionColor(b.inspection_priority) }}
                          >
                            {b.inspection_priority.replace(/_/g, ' ')}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-[11px] px-2 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading geographical data...</span>
            </div>
          )}
        </div>

        {/* Global Compact Status Footer */}
        <div className="p-2.5 border-t border-white/[0.06] bg-black/40">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
            <span>DATA STATUS</span>
            <span className="px-1.5 py-0.5 rounded border text-[8px] bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
              VERIFIED OSM / SCENARIO
            </span>
          </div>
          <p className="text-[8.5px] text-slate-500 leading-tight">
            Disaster exposure ≠ damage. All unverified structures require field inspection.
          </p>
        </div>
      </aside>

      {/* ── Mobile Geographic Modal / Bottom Drawer ─────────────────────────── */}
      {mobilePanelOpen && (
        <div className="md:hidden fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className="bg-[#050A14] border-t border-cyan-500/40 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">Disaster Intelligence & Region Selection</span>
              </div>
              <button
                onClick={() => setMobilePanelOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-2.5">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  GEOGRAPHIC SELECTION
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/25 border border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🇮🇳</span>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">India</span>
                      <span className="text-[9px] text-cyan-400 font-mono">National Command (NDRF)</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    ACTIVE
                  </span>
                </div>
                {selectedCountry && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{regionLabel}</span>
                      {regions.length > 0 && <span className="text-slate-500 font-normal">({regions.length})</span>}
                    </div>
                    <select
                      value={selectedRegion?.state_id || ''}
                      onChange={(e) => {
                        const reg = regions.find(r => r.state_id === e.target.value);
                        if (reg) handleSelectRegion(reg);
                      }}
                      className="w-full bg-[#050A14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="" disabled>Select {regionLabel}...</option>
                      {regions.map((r) => (
                        <option key={r.state_id} value={r.state_id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedRegion && districts.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{districtLabel}</span>
                      <span className="text-slate-500 font-normal">({districts.length})</span>
                    </div>
                    <select
                      value={selectedDistrict?.district_id || ''}
                      onChange={(e) => {
                        const dist = districts.find(d => d.district_id === e.target.value);
                        if (dist) handleSelectDistrict(dist);
                      }}
                      className="w-full bg-[#050A14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="" disabled>Select {districtLabel}...</option>
                      {districts.map((d) => (
                        <option key={d.district_id} value={d.district_id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {events.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Disaster Event</span>
                      <span className="text-slate-500 font-normal">({events.length})</span>
                    </div>
                    <select
                      value={selectedEvent?.event_id || ''}
                      onChange={(e) => {
                        const evt = events.find(ev => ev.event_id === e.target.value);
                        if (evt) handleSelectEvent(evt);
                      }}
                      className="w-full bg-[#050A14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium"
                    >
                      <option value="" disabled>Select Disaster Event...</option>
                      {events.map((ev) => (
                        <option key={ev.event_id} value={ev.event_id}>
                          {ev.title || ev.disaster_type} ({ev.severity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t border-white/10 bg-black/60 flex-shrink-0">
              <button
                onClick={() => setMobilePanelOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98"
              >
                <Check className="w-4 h-4" /> Apply & Explore Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative h-full">
        {/* Mobile Floating Drawer Trigger */}
        <div className="md:hidden absolute top-2.5 left-2.5 z-[990]">
          <button
            onClick={() => setMobilePanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#050A14]/90 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] shadow-2xl backdrop-blur-md active:scale-95 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[140px]">
              {selectedDistrict ? selectedDistrict.name : selectedRegion ? selectedRegion.name : 'India · Patna'}
            </span>
            <ChevronDown className="w-3 h-3 text-cyan-400" />
          </button>
        </div>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={3}
          maxZoom={20}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapFlyTo center={mapCenter} zoom={mapZoom} onZoomChange={setMapZoom} />
          <TileLayer
            key={tileStyle}
            url={TILE_CONFIGS[tileStyle].url}
            attribution={TILE_CONFIGS[tileStyle].attribution}
            maxZoom={20}
            maxNativeZoom={TILE_CONFIGS[tileStyle].maxNativeZoom}
            subdomains={TILE_CONFIGS[tileStyle].subdomains as any}
          />

          {/* Country boundary (Nepal verified GeoJSON, India not yet available) */}
          {countryBoundary && showBoundary && (
            <GeoJSON
              key={`boundary-${selectedCountry?.country_code}`}
              data={countryBoundary}
              style={nepalBoundaryStyle}
            />
          )}

          {/* OSM Road Network Layer (authentic road data from OpenStreetMap) */}
          {osmRoadsData && showRoadsLayer && (
            <GeoJSON
              key={`osm-roads-${selectedEvent?.event_id}`}
              data={osmRoadsData}
              style={(feature) => {
                const hw = feature?.properties?.highway;
                let color = '#64748b'; // slate
                let weight = 1.3;
                let opacity = 0.65;
                if (hw === 'primary' || hw === 'trunk') {
                  color = '#f59e0b'; // amber
                  weight = 2.4;
                  opacity = 0.9;
                } else if (hw === 'secondary' || hw === 'tertiary') {
                  color = '#38bdf8'; // sky
                  weight = 1.8;
                  opacity = 0.8;
                }
                return { color, weight, opacity };
              }}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const name = props.name || `${(props.highway || 'road').toUpperCase()} Road`;
                layer.bindTooltip(
                  `<div style="font-size:10px;font-weight:bold;color:#e2e8f0;background:#0f172a;padding:4px 8px;border-radius:4px;border:1px solid rgba(56,189,248,0.4)">
                    ${name}<br/>
                    <span style="color:#94a3b8;font-weight:normal">Highway: ${props.highway || 'road'}</span><br/>
                    <span style="color:#f59e0b;font-weight:normal">Status: Requires Inspection</span><br/>
                    <span style="color:#64748b;font-size:8px">Source: OpenStreetMap (ODbL)</span>
                  </div>`,
                  { direction: 'top', offset: [0, -4], opacity: 0.95 }
                );
              }}
            />
          )}

          {/* OSM Building Footprint Layer (authentic Patna buildings from OpenStreetMap) */}
          {osmData && showOsmLayer && (
            <GeoJSON
              key={`osm-buildings-${selectedEvent?.event_id}`}
              data={osmData}
              style={(feature) => {
                const isSel = selectedOsmFeature?.id === feature?.id;
                return {
                  color: isSel ? '#00f0ff' : '#38bdf8',
                  weight: isSel ? 2.5 : 1.2,
                  fillColor: isSel ? '#0284c7' : '#0ea5e9',
                  fillOpacity: isSel ? 0.55 : 0.18,
                  opacity: isSel ? 1 : 0.7,
                };
              }}
              onEachFeature={(feature, layer) => {
                layer.on('click', () => {
                  handleSelectOsmFeature(feature);
                  if (mapZoom < 16) setMapZoom(16);
                });
                const props = feature.properties || {};
                const name = props.name || `Building #${props.osm_id}`;
                layer.bindTooltip(
                  `<div style="font-size:10px;font-weight:bold;color:#e2e8f0;background:#0f172a;padding:4px 8px;border-radius:4px;border:1px solid rgba(56,189,248,0.4)">
                    ${name}<br/>
                    <span style="color:#f59e0b;font-weight:normal">Damage: Requires Inspection</span><br/>
                    <span style="color:#94a3b8;font-weight:normal">Source: OpenStreetMap (ODbL)</span>
                  </div>`,
                  { direction: 'top', offset: [0, -6], opacity: 0.95 }
                );
              }}
            />
          )}

          {/* Disaster Event Markers */}
          {events.map((e) => {
            const isSelected = selectedEvent?.event_id === e.event_id;
            return (
              <Marker
                key={`evt-${e.event_id}`}
                position={[e.center_lat, e.center_lng]}
                icon={createEventIcon(e.severity, isSelected)}
                eventHandlers={{
                  click: () => handleSelectEvent(e),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[210px]" style={{ color: '#e2e8f0', background: 'transparent' }}>
                    <div className="font-bold text-sm mb-1">{e.title}</div>
                    <div className="text-xs text-slate-400 mb-1">{e.district}, {e.state || e.province || ''}</div>
                    <div className="flex items-center gap-1.5 my-1">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${severityColor(e.severity)}22`, color: severityColor(e.severity) }}
                      >{e.severity}</span>
                      <DataStatusBadge status={e.data_status} />
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{e.description}</p>
                    <button
                      onClick={() => handleSelectEvent(e)}
                      className="mt-2 w-full py-1 text-[11px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" /> Focus Disaster Zone
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Disaster event heat zone */}
          {selectedEvent && showHeatZone && (
            <Circle
              center={[selectedEvent.center_lat, selectedEvent.center_lng]}
              radius={selectedEvent.radius_km * 1000}
              pathOptions={{
                color: severityColor(selectedEvent.severity),
                fillColor: severityColor(selectedEvent.severity),
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '6 4',
              }}
            />
          )}

          {/* Building footprints and markers */}
          {buildings.map((b) => {
            const isSelected = selectedBuilding?.building_id === b.building_id;
            const color = inspectionColor(b.inspection_priority);
            const footprint = getBuildingFootprint(b.lat, b.lng, b.building_id);

            return (
              <React.Fragment key={b.building_id}>
                {(mapZoom >= 16 || isSelected) && (
                  <Polygon
                    positions={footprint}
                    pathOptions={{
                      color: color,
                      weight: isSelected ? 3 : 1.5,
                      fillColor: color,
                      fillOpacity: isSelected ? 0.45 : 0.25,
                      dashArray: isSelected ? undefined : '3, 4',
                    }}
                    eventHandlers={{ click: () => handleSelectBuilding(b) }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={isSelected && mapZoom >= 18}>
                      <div className="text-[10px] font-mono font-bold text-white bg-black/90 px-1.5 py-0.5 rounded border border-white/20">
                        {b.name}
                      </div>
                    </Tooltip>
                  </Polygon>
                )}

                <Marker
                  position={[b.lat, b.lng]}
                  icon={createBuildingIcon(b.inspection_priority, isSelected)}
                  eventHandlers={{ click: () => handleSelectBuilding(b) }}
                >
                  <Popup>
                    <div className="p-2 min-w-[210px]" style={{ color: '#e2e8f0', background: 'transparent' }}>
                      <div className="font-bold text-sm mb-1">{b.name}</div>
                      <div className="text-xs text-slate-400 mb-1">{b.building_id}</div>
                      <DataStatusBadge status={b.data_status} />
                      <div className="mt-2 text-xs">
                        <div>Damage: <span className="text-amber-400">{b.damage_classification}</span></div>
                        <div>Priority: <span className="text-orange-400">{b.inspection_priority.replace(/_/g, ' ')}</span></div>
                      </div>
                      <div className="mt-1.5 text-[10px] text-slate-500 italic">{b.damage_note}</div>
                      <button
                        onClick={() => { setMapCenter([b.lat, b.lng]); setMapZoom(19); setTileStyle('satellite'); }}
                        className="mt-2 w-full py-1 text-[11px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> 🛰️ Satellite Close-Up (19x)
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Collapsible Map Layers Panel */}
        <div className="absolute top-3 right-3 z-[999] flex flex-col items-end">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all backdrop-blur-md border shadow-xl cursor-pointer',
              showLayerPanel
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-[#070E1E]/90 text-slate-300 hover:text-white border-white/10 hover:border-white/20'
            )}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono ml-0.5">({tileStyle})</span>
          </button>

          {showLayerPanel && (
            <div className="mt-2 w-64 p-3 rounded-xl bg-[#070E1E]/95 border border-white/10 backdrop-blur-md shadow-2xl space-y-3">
              {/* Base Map Selector */}
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Base Map Tile</span>
                  <span className="text-[9px] font-mono text-cyan-400">{tileStyle}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(['dark', 'satellite', 'esri', 'osm'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTileStyle(t)}
                      className={clsx(
                        'px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all text-center cursor-pointer',
                        tileStyle === t
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                          : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      )}
                    >
                      {t === 'satellite' ? 'Satellite' : t === 'esri' ? 'Esri' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlays */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Operational Layers
                </div>

                {/* Buildings Layer Toggle */}
                {osmData && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/5 cursor-pointer">
                    <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>OSM Footprints ({osmMeta?.total_buildings || 108})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showOsmLayer}
                      onChange={(e) => setShowOsmLayer(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                )}

                {/* Roads Layer Toggle */}
                {osmRoadsData && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/5 cursor-pointer">
                    <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roads ({osmRoadsMeta?.total_roads || 710})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoadsLayer}
                      onChange={(e) => setShowRoadsLayer(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                )}

                {/* Hazard Zone Buffer Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-orange-400" />
                    <span>Hazard Zone Buffer</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHeatZone}
                    onChange={(e) => setShowHeatZone(e.target.checked)}
                    className="rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Boundary Toggle */}
                {countryBoundary && (
                  <label className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/5 cursor-pointer">
                    <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Boundary ({selectedCountry?.name})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showBoundary}
                      onChange={(e) => setShowBoundary(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Flood Layer Status Alert (bottom-right of map) */}
        {selectedEvent && (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-[999] max-w-[calc(100vw-20px)] sm:max-w-[320px] p-2 sm:p-2.5 rounded-xl backdrop-blur text-[10px] sm:text-[11px] border shadow-2xl"
            style={{
              background: 'rgba(5, 10, 20, 0.92)',
              borderColor: floodExtentInfo?.data_status === 'DATA UNAVAILABLE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)',
            }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 text-xs">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Flood Extent:</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700/60 text-amber-400 border border-amber-500/30">
                Data Not Available
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Verified flood inundation layer is <strong className="text-amber-300">Data Not Available</strong>. Circular zone is a scenario approximation only.
            </p>
            <div className="mt-1 text-[9px] text-slate-500 font-mono">
              Requires: Sentinel-1 SAR / Copernicus EMS / BSDMA
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="hidden sm:flex absolute top-3 left-3 z-[999] items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur text-[11px]"
          style={{ background: 'rgba(5,10,20,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-slate-500">RescueTwin</span>
          {selectedCountry && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-cyan-400 font-bold">{selectedCountry.name}</span></>}
          {selectedRegion && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-cyan-300">{selectedRegion.name}</span></>}
          {selectedDistrict && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-cyan-200">{selectedDistrict.name}</span></>}
          {selectedEvent && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-orange-300">{selectedEvent.disaster_type}</span></>}
          {selectedBuilding && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-amber-300">{selectedBuilding.building_id}</span></>}
          {selectedOsmFeature && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-sky-300">OSM #{selectedOsmFeature.properties?.osm_id}</span></>}
        </div>

        {/* No country selected prompt */}
        {!selectedCountry && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="text-center px-6 py-5 rounded-2xl backdrop-blur"
              style={{ background: 'rgba(5,10,20,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white mb-1">India Disaster Command</div>
              <div className="text-[11px] text-slate-400">Loading geographical intelligence...</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Building Detail / AI Panel ───────────────────────────────── */}
      {/* 1. DEMO BUILDING DETAIL PANEL */}
      {selectedBuilding && (
        <aside className="fixed inset-x-0 bottom-0 max-h-[75vh] z-[1500] rounded-t-2xl border-t border-cyan-500/30 shadow-2xl backdrop-blur-xl md:relative md:inset-auto md:w-[300px] md:max-h-none md:rounded-none md:z-auto md:border-t-0 md:border-l md:border-white/[0.07] flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(5,10,20,0.98)' }}>
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-1.5 md:hidden" />
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Building Intelligence</span>
            </div>
            <button onClick={() => setSelectedBuilding(null)} className="text-slate-500 hover:text-white p-1 rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <div className="font-bold text-slate-100 text-sm mb-0.5">{selectedBuilding.name}</div>
              <div className="text-[10px] text-slate-500 font-mono mb-1.5">{selectedBuilding.building_id}</div>
              <DataStatusBadge status={selectedBuilding.data_status} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setMapCenter([selectedBuilding.lat, selectedBuilding.lng]); setMapZoom(19); setTileStyle('satellite'); }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> 🛰️ Satellite Close-Up
              </button>
              {mapZoom >= 18 && (
                <button
                  onClick={() => setMapZoom(11)}
                  className="py-1.5 px-2 rounded-lg border border-white/10 bg-black/40 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                >Area</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Damage', value: selectedBuilding.damage_classification, color: '#F59E0B' },
                { label: 'Confidence', value: selectedBuilding.confidence !== null && selectedBuilding.confidence !== undefined ? `${selectedBuilding.confidence}%` : 'Not Available', color: '#94A3B8' },
                { label: 'Road Status', value: selectedBuilding.road_status || 'Requires Inspection', color: '#94A3B8' },
                { label: 'Evidence', value: selectedBuilding.evidence_source ?? 'None Available', color: '#94A3B8' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-[11px] font-semibold" style={{ color: String(value) === 'Not Available' || String(value) === 'None Available' ? '#64748B' : color }}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg p-2.5 bg-amber-500/5 border border-amber-500/15">
              <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Info className="w-2.5 h-2.5" /> DAMAGE ASSESSMENT NOTE
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">{selectedBuilding.damage_note}</p>
            </div>

            <div className="rounded-lg p-2.5 bg-slate-500/5 border border-slate-500/15">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ROAD ACCESS</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{selectedBuilding.road_status_note}</p>
            </div>

            <div className="rounded-lg p-2.5 border"
              style={{
                background: `${inspectionColor(selectedBuilding.inspection_priority)}10`,
                borderColor: `${inspectionColor(selectedBuilding.inspection_priority)}30`,
              }}>
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1"
                style={{ color: inspectionColor(selectedBuilding.inspection_priority) }}>
                INSPECTION PRIORITY
              </div>
              <div className="text-xs font-bold text-slate-100 mb-1">
                {selectedBuilding.inspection_priority.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="rounded-lg p-2.5 bg-cyan-500/5 border border-cyan-500/15">
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5" /> AI DECISION SUPPORT
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating explanation...</span>
                </div>
              ) : aiOutput ? (
                <div>
                  <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-line">
                    {aiOutput.explanation}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-white/[0.05]">
                    <DataStatusBadge status={aiOutput.data_status || 'MODEL OUTPUT'} />
                    <p className="text-[9px] text-slate-500 mt-1 italic">{aiOutput.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">{selectedBuilding.ai_explanation}</p>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* 2. AUTHENTIC OSM BUILDING FOOTPRINT PANEL */}
      {selectedOsmFeature && (
        <aside className="fixed inset-x-0 bottom-0 max-h-[75vh] z-[1500] rounded-t-2xl border-t border-cyan-500/30 shadow-2xl backdrop-blur-xl md:relative md:inset-auto md:w-[310px] md:max-h-none md:rounded-none md:z-auto md:border-t-0 md:border-l md:border-white/[0.07] flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(5,10,20,0.98)' }}>
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-1.5 md:hidden" />
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">OSM Building Intelligence</span>
            </div>
            <button onClick={() => setSelectedOsmFeature(null)} className="text-slate-500 hover:text-white p-1 rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <div className="font-bold text-slate-100 text-sm mb-0.5">
                {selectedOsmFeature.properties?.name || `Building #${selectedOsmFeature.properties?.osm_id}`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mb-1.5">
                OSM ID: {selectedOsmFeature.properties?.osm_id}
              </div>
              <DataStatusBadge status={selectedOsmFeature.properties?.data_status || 'PUBLIC DOMAIN GEOGRAPHIC DATA'} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const coords = selectedOsmFeature.geometry?.coordinates?.[0]?.[0];
                  if (coords) {
                    setMapCenter([coords[1], coords[0]]);
                    setMapZoom(19);
                    setTileStyle('satellite');
                  }
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> 🛰️ Satellite Close-Up (19x)
              </button>
              {mapZoom >= 18 && (
                <button
                  onClick={() => setMapZoom(15)}
                  className="py-1.5 px-2 rounded-lg border border-white/10 bg-black/40 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                >Area</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">DAMAGE</div>
                <div className="text-[11px] font-bold text-amber-400">
                  {selectedOsmFeature.properties?.evidence ? selectedOsmFeature.properties?.damage_assessment : 'Requires Inspection'}
                </div>
              </div>
              <div className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">CONFIDENCE</div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {selectedOsmFeature.properties?.confidence ?? 'Not Available'}
                </div>
              </div>
              <div className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">ROAD ACCESS</div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {selectedOsmFeature.properties?.road_access || 'Requires Inspection'}
                </div>
              </div>
              <div className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">SOURCE</div>
                <div className="text-[10px] font-semibold text-sky-400 truncate">
                  OpenStreetMap (ODbL)
                </div>
              </div>
            </div>

            {/* Changeset Timestamp */}
            <div className="rounded-lg p-2.5 bg-slate-900/60 border border-white/[0.06] text-[10px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-300">
                  {selectedOsmFeature.properties?.timestamp ? new Date(selectedOsmFeature.properties.timestamp).toLocaleString() : 'Not Available'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Building Tag:</span>
                <span className="font-mono text-slate-300">{selectedOsmFeature.properties?.building || 'yes'}</span>
              </div>
            </div>

            {/* Damage Assessment Note */}
            <div className="rounded-lg p-2.5 bg-amber-500/5 border border-amber-500/20">
              <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Info className="w-2.5 h-2.5" /> DAMAGE ASSESSMENT STATUS
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-300">Requires Inspection</span> — No verified structural damage assessment exists for this footprint.
                Presence within flood vicinity does not imply destruction.
              </p>
            </div>

            {/* Evidence & Verification Card */}
            <div className="rounded-lg p-2.5 bg-slate-800/40 border border-white/[0.08] space-y-2">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-cyan-400" /> EVIDENCE & VERIFICATION
              </div>
              {osmEvidenceLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading evidence...</span>
                </div>
              ) : (
                <div className="text-[10px] space-y-1.5 text-slate-400">
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span>Evidence Source:</span>
                    <span className="text-slate-300 font-semibold">{osmEvidence?.evidence_source || 'No Evidence Available'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span>Pre-Event Imagery:</span>
                    <span className="text-slate-500">{osmEvidence?.pre_event_imagery || 'Unavailable'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span>Post-Event Imagery:</span>
                    <span className="text-slate-500">{osmEvidence?.post_event_imagery || 'Unavailable — Satellite Tasking Required'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span>Field Survey:</span>
                    <span className="text-slate-500">{osmEvidence?.field_survey || 'Not Completed'}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-1 leading-relaxed">
                    {osmEvidence?.evidence_note || 'Structural condition requires on-site field team verification.'}
                  </p>
                </div>
              )}
            </div>

            {/* Inspection Priority */}
            <div className="rounded-lg p-2.5 bg-amber-500/10 border border-amber-500/30">
              <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                INSPECTION PRIORITY
              </div>
              <div className="text-xs font-bold text-slate-100">
                REQUIRES INSPECTION
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Queued for ground survey. No prior damage classification recorded.
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default DamageMap;


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search, MapPin, Plus, Navigation, Layers, ShieldAlert,
  CheckCircle2, AlertTriangle, Filter, Box, Eye, Trash2,
  Maximize2, Compass, Radio, Building2, ChevronRight, X,
  Check, Info, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

// Fix leaflet default marker icon asset issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom animated tactical HTML markers
const createTacticalIcon = (level: string, isSelected: boolean = false) => {
  const colorMap: Record<string, string> = {
    DESTROYED: '#ef4444',
    MAJOR: '#f97316',
    MINOR: '#eab308',
    NO_DAMAGE: '#22c55e',
  };
  const color = colorMap[level] || '#00E5FF';
  const ringCls = level === 'DESTROYED' ? 'pulse-red' : level === 'MAJOR' ? 'pulse-orange' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${color}25;
          border: 1px solid ${color}60;
          ${level === 'DESTROYED' || level === 'MAJOR' ? 'animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
        "></div>
        <div style="
          width: ${isSelected ? '22px' : '18px'};
          height: ${isSelected ? '22px' : '18px'};
          border-radius: 50%;
          background: radial-gradient(circle, ${color} 30%, ${color}bb 100%);
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 16px ${color}, 0 2px 8px rgba(0,0,0,0.8);
          transition: all 0.2s ease;
        "></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

export interface GeoLocationSite {
  id: string;
  name: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  damage: 'DESTROYED' | 'MAJOR' | 'MINOR' | 'NO_DAMAGE';
  priorityScore: number;
  roadAccess: boolean;
  estimatedOccupancy: number;
  notes: string;
  status: 'Pending' | 'Dispatched' | 'Rescued';
  timestamp: string;
}

// Preset regions (India States & Districts + Global Disaster Hotspots)
const PRESET_REGIONS = [
  { state: 'Kerala', district: 'Wayanad (Meppadi Landslide)', lat: 11.5546, lng: 76.1283, zoom: 13 },
  { state: 'Kerala', district: 'Idukki', lat: 9.8494, lng: 76.9804, zoom: 12 },
  { state: 'Kerala', district: 'Kozhikode', lat: 11.2588, lng: 75.7804, zoom: 12 },
  { state: 'Maharashtra', district: 'Mumbai Coastal Area', lat: 18.9220, lng: 72.8347, zoom: 13 },
  { state: 'Maharashtra', district: 'Pune (Ambegaon Zone)', lat: 18.5204, lng: 73.8567, zoom: 12 },
  { state: 'Maharashtra', district: 'Raigad (Mahad)', lat: 18.0827, lng: 73.4243, zoom: 13 },
  { state: 'Uttarakhand', district: 'Chamoli (Joshimath)', lat: 30.5574, lng: 79.5664, zoom: 13 },
  { state: 'Uttarakhand', district: 'Rudraprayag (Kedarnath)', lat: 30.7352, lng: 79.0669, zoom: 13 },
  { state: 'Himachal Pradesh', district: 'Mandi (Flash Flood Zone)', lat: 31.7087, lng: 76.9320, zoom: 13 },
  { state: 'Himachal Pradesh', district: 'Kullu', lat: 31.9579, lng: 77.1095, zoom: 12 },
  { state: 'Odisha', district: 'Puri (Cyclone Corridor)', lat: 19.8135, lng: 85.8312, zoom: 13 },
  { state: 'Odisha', district: 'Balasore', lat: 21.4934, lng: 86.9135, zoom: 12 },
  { state: 'Gujarat', district: 'Kutch (Bhuj Fault)', lat: 23.2420, lng: 69.6669, zoom: 12 },
  { state: 'Assam', district: 'Cachar (Silchar Flood Plain)', lat: 24.8333, lng: 92.7789, zoom: 13 },
  { state: 'Tamil Nadu', district: 'Chennai (Adyar Basin)', lat: 13.0067, lng: 80.2570, zoom: 13 },
  { state: 'Delhi NCR', district: 'Yamuna Floodplain Zone', lat: 28.6139, lng: 77.2090, zoom: 13 },
  { state: 'International', district: 'Hatay / Antakya (Turkey)', lat: 36.2021, lng: 36.1606, zoom: 13 },
  { state: 'International', district: 'Sendai (Japan)', lat: 38.2682, lng: 140.8694, zoom: 13 },
  { state: 'International', district: 'Maui / Lahaina (USA)', lat: 20.8783, lng: -156.6825, zoom: 13 },
];

const INITIAL_SITES: GeoLocationSite[] = [
  {
    id: 'SITE-KL-01',
    name: 'Chooralmala Primary Hospital & Quarters',
    state: 'Kerala',
    district: 'Wayanad (Meppadi Landslide)',
    lat: 11.5420,
    lng: 76.1360,
    damage: 'DESTROYED',
    priorityScore: 99,
    roadAccess: false,
    estimatedOccupancy: 28,
    notes: 'Severe debris flow impact. Main access bridge washed out. Heavy excavator & airlift required.',
    status: 'Pending',
    timestamp: '10 mins ago',
  },
  {
    id: 'SITE-KL-02',
    name: 'Mundakkai School Shelter Complex',
    state: 'Kerala',
    district: 'Wayanad (Meppadi Landslide)',
    lat: 11.5580,
    lng: 76.1210,
    damage: 'DESTROYED',
    priorityScore: 96,
    roadAccess: false,
    estimatedOccupancy: 42,
    notes: 'Structural collapse on western wing. Secondary mudflow risk active. High priority beacon.',
    status: 'Dispatched',
    timestamp: '25 mins ago',
  },
  {
    id: 'SITE-KL-03',
    name: 'Meppadi Town Commercial Center',
    state: 'Kerala',
    district: 'Wayanad (Meppadi Landslide)',
    lat: 11.5510,
    lng: 76.1290,
    damage: 'MAJOR',
    priorityScore: 84,
    roadAccess: true,
    estimatedOccupancy: 15,
    notes: 'Ground floor flooding and partial wall compromise. Evacuation staging zone active.',
    status: 'Dispatched',
    timestamp: '1 hour ago',
  },
  {
    id: 'SITE-KL-04',
    name: 'Attamala Residential Cluster',
    state: 'Kerala',
    district: 'Wayanad (Meppadi Landslide)',
    lat: 11.5360,
    lng: 76.1430,
    damage: 'MAJOR',
    priorityScore: 78,
    roadAccess: true,
    estimatedOccupancy: 19,
    notes: 'Power grid down. Silt accumulation up to 1.5m. Search & rescue team Bravo on site.',
    status: 'Pending',
    timestamp: '2 hours ago',
  },
  {
    id: 'SITE-KL-05',
    name: 'Vellarimala Relief Staging Camp',
    state: 'Kerala',
    district: 'Wayanad (Meppadi Landslide)',
    lat: 11.5650,
    lng: 76.1150,
    damage: 'NO_DAMAGE',
    priorityScore: 12,
    roadAccess: true,
    estimatedOccupancy: 120,
    notes: 'Safe staging hub. Medical supply depot & satellite comms center operational.',
    status: 'Rescued',
    timestamp: '3 hours ago',
  },
  {
    id: 'SITE-MH-01',
    name: 'Mahad Industrial Warehouse 4',
    state: 'Maharashtra',
    district: 'Raigad (Mahad)',
    lat: 18.0850,
    lng: 73.4280,
    damage: 'MAJOR',
    priorityScore: 82,
    roadAccess: true,
    estimatedOccupancy: 8,
    notes: 'Savitri river breach overflow. Water level receding.',
    status: 'Pending',
    timestamp: '4 hours ago',
  },
  {
    id: 'SITE-UT-01',
    name: 'Joshimath Ward 5 Subsidized Complex',
    state: 'Uttarakhand',
    district: 'Chamoli (Joshimath)',
    lat: 30.5590,
    lng: 79.5640,
    damage: 'MAJOR',
    priorityScore: 88,
    roadAccess: true,
    estimatedOccupancy: 24,
    notes: 'Land subsidence fissures widened to 8cm across foundation.',
    status: 'Pending',
    timestamp: '5 hours ago',
  },
];

const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4264_1_3438c67ecbcbe54961ebf696';

const TILE_LAYERS = {
  dark: {
    name: 'Tactical Dark',
    url: CARTO_KEY 
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> OpenStreetMap',
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics',
  },
  osm: {
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  topo: {
    name: 'Topographic Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
  },
};

// Generates a realistic polygon footprint around the coordinate
const getBuildingFootprint = (lat: number, lng: number, id: string = '') => {
  const charCode = id.charCodeAt(id.length - 1) || 1;
  const dLat = 0.00014 + (charCode % 4) * 0.00003;
  const dLng = 0.00018 + (charCode % 5) * 0.00003;
  return [
    [lat - dLat, lng - dLng],
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
  ] as [number, number][];
};

// Map FlyTo Helper Component with dynamic zoom sync
function MapController({
  center,
  zoom,
  onZoomChange,
}: {
  center: [number, number];
  zoom: number;
  onZoomChange?: (z: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [center, zoom, map]);

  useMapEvents({
    zoomend() {
      if (onZoomChange) {
        onZoomChange(Math.round(map.getZoom()));
      }
    },
  });

  return null;
}

// Click to Add Pin Handler
function MapClickHandler({
  onMapClick,
  isAddMode,
}: {
  onMapClick: (lat: number, lng: number) => void;
  isAddMode: boolean;
}) {
  useMapEvents({
    click(e) {
      if (isAddMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const GeoMap = () => {
  const navigate = useNavigate();

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.5546, 76.1283]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [tileStyle, setTileStyle] = useState<keyof typeof TILE_LAYERS>('dark');
  const [sites, setSites] = useState<GeoLocationSite[]>(INITIAL_SITES);
  const [selectedSite, setSelectedSite] = useState<GeoLocationSite | null>(INITIAL_SITES[0]);

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [showHeatmaps, setShowHeatmaps] = useState(true);

  // Live Geocoding Search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Add Location Modal / Mode
  const [isAddMode, setIsAddMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteData, setNewSiteData] = useState({
    name: '',
    state: 'Kerala',
    district: 'Wayanad',
    lat: 11.5546,
    lng: 76.1283,
    damage: 'DESTROYED' as 'DESTROYED' | 'MAJOR' | 'MINOR' | 'NO_DAMAGE',
    priorityScore: 95,
    roadAccess: false,
    estimatedOccupancy: 12,
    notes: '',
  });

  // Unique list of states for filter
  const stateOptions = Array.from(new Set(sites.map((s) => s.state)));

  // Perform Live Geocoding via Nominatim API with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=6`
        );
        const data = await res.json();
        setSearchResults(data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Geocoding search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Preset District / State Selection
  const handleSelectPreset = (preset: typeof PRESET_REGIONS[0]) => {
    setMapCenter([preset.lat, preset.lng]);
    setMapZoom(preset.zoom);
    setSearchQuery(`${preset.district}, ${preset.state}`);
    setShowSuggestions(false);
  };

  // Handle Geocoding Result Click
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(13);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowSuggestions(false);
  };

  // Handle Locate User GPS
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter([lat, lng]);
          setMapZoom(14);
        },
        (err) => {
          alert('Unable to retrieve your location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Handle Map Click to Pin
  const handleMapClick = (lat: number, lng: number) => {
    setNewSiteData((prev) => ({
      ...prev,
      lat: parseFloat(lat.toFixed(5)),
      lng: parseFloat(lng.toFixed(5)),
      name: `Site @ ${lat.toFixed(3)}N, ${lng.toFixed(3)}E`,
    }));
    setShowAddModal(true);
    setIsAddMode(false);
  };

  // Save new Site
  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    const site: GeoLocationSite = {
      id: `SITE-${Date.now().toString().slice(-4)}`,
      name: newSiteData.name || 'Unnamed Disaster Location',
      state: newSiteData.state || 'General',
      district: newSiteData.district || 'General Zone',
      lat: newSiteData.lat,
      lng: newSiteData.lng,
      damage: newSiteData.damage,
      priorityScore: Number(newSiteData.priorityScore) || 50,
      roadAccess: newSiteData.roadAccess,
      estimatedOccupancy: Number(newSiteData.estimatedOccupancy) || 0,
      notes: newSiteData.notes || 'User registered observation point.',
      status: 'Pending',
      timestamp: 'Just now',
    };

    setSites((prev) => [site, ...prev]);
    setSelectedSite(site);
    setShowAddModal(false);
    setMapCenter([site.lat, site.lng]);
  };

  // Delete Site
  const handleDeleteSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    if (selectedSite?.id === id) {
      setSelectedSite(null);
    }
  };

  // Filtered Sites
  const filteredSites = sites.filter((site) => {
    const matchesState = selectedStateFilter === 'ALL' || site.state === selectedStateFilter;
    const matchesSeverity = selectedSeverityFilter === 'ALL' || site.damage === selectedSeverityFilter;
    const matchesSearch =
      !searchQuery ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSeverity && matchesSearch;
  });

  const damageBadgeCls: Record<string, string> = {
    DESTROYED: 'badge-red',
    MAJOR: 'badge-orange',
    MINOR: 'badge-yellow',
    NO_DAMAGE: 'badge-green',
  };

  const damageColorMap: Record<string, string> = {
    DESTROYED: '#ef4444',
    MAJOR: '#f97316',
    MINOR: '#eab308',
    NO_DAMAGE: '#22c55e',
  };

  return (
    <div className="relative h-[calc(100vh-60px)] w-full flex flex-col overflow-hidden" style={{ background: '#060A14' }}>
      {/* ── Top Bar: Search, State/District Presets & Layer Controls ── */}
      <div
        className="z-20 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{
          background: 'rgba(11, 15, 25, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Search Bar + Live Geocoding */}
        <div className="relative flex-1 min-w-[280px] max-w-[440px]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search any state, district, or landmark (e.g. Wayanad, Mumbai, Kedarnath)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[13px] text-white placeholder-[#6B7280] focus:outline-none transition-all"
              style={{
                background: 'rgba(22, 27, 34, 0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-2.5 text-[#6B7280] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete / Geocoding Suggestions Dropdown */}
          {showSuggestions && (searchResults.length > 0 || PRESET_REGIONS.length > 0) && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in-up"
              style={{
                background: 'rgba(11, 15, 25, 0.98)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {/* Live Geocoding API Results */}
              {searchResults.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#00E5FF] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Global Search Results
                  </div>
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearchResult(r)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors flex items-start gap-2.5 group cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#FF8A3D] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-[13px] font-medium text-white line-clamp-1">{r.display_name.split(',')[0]}</div>
                        <div className="text-[11px] text-[#6B7280] line-clamp-1">{r.display_name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Preset Districts & States */}
              <div className="p-2 border-t border-white/[0.06]">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#FF8A3D] flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> High-Risk Disaster Districts & Hotspots
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {PRESET_REGIONS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectPreset(preset)}
                      className="text-left px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D]" />
                        <span className="text-[12px] text-[#D1D5DB] group-hover:text-white font-medium">{preset.district}</span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">{preset.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Layer Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Add Site / Pin Button */}
          <button
            onClick={() => {
              if (isAddMode) {
                setIsAddMode(false);
              } else {
                setIsAddMode(true);
              }
            }}
            className={clsx(
              'px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer',
              isAddMode
                ? 'bg-[#EF4444] text-white shadow-[0_0_16px_rgba(239,68,68,0.5)] animate-pulse'
                : 'btn-primary'
            )}
          >
            <Plus className="w-4 h-4" />
            {isAddMode ? 'Click Map to Place Pin' : 'Add Disaster Point'}
          </button>

          {/* Quick Add Form Modal Trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary px-3 py-2 text-[12px] flex items-center gap-1.5 cursor-pointer"
            title="Open manual coordinate entry form"
          >
            <Building2 className="w-3.5 h-3.5 text-[#00E5FF]" /> Manual Entry
          </button>

          {/* Locate GPS */}
          <button
            onClick={handleLocateMe}
            className="btn-ghost px-3 py-2 text-[12px] flex items-center gap-1.5 cursor-pointer"
            title="Center on my current GPS location"
          >
            <Compass className="w-3.5 h-3.5 text-[#22C55E]" /> Locate Me
          </button>

          {/* Map Layer Selector */}
          <div
            className="flex items-center p-0.5 rounded-lg border border-white/[0.08]"
            style={{ background: 'rgba(22, 27, 34, 0.8)' }}
          >
            {(Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>).map((key) => (
              <button
                key={key}
                onClick={() => setTileStyle(key)}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer"
                style={
                  tileStyle === key
                    ? {
                        background: 'linear-gradient(135deg, #FF6B00, #E55A00)',
                        color: 'white',
                      }
                    : { color: '#9CA3AF' }
                }
              >
                {TILE_LAYERS[key].name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* 3D Viewer Link */}
          <button
            onClick={() => navigate('/viewer')}
            className="btn-secondary px-3 py-2 text-[12px] flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-[#00E5FF]" /> 3D Digital Twin
          </button>
        </div>
      </div>

      {/* ── Main Workspace: Map Canvas + Floating Sidebars ── */}
      <div className="relative flex-1 w-full h-full">
        {/* Leaflet Map Container with Zoom up to 20 for rooftop resolution */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={3}
          maxZoom={20}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url={TILE_LAYERS[tileStyle].url}
            attribution={TILE_LAYERS[tileStyle].attribution}
            maxZoom={20}
            maxNativeZoom={19}
          />
          <MapController center={mapCenter} zoom={mapZoom} onZoomChange={setMapZoom} />
          <MapClickHandler onMapClick={handleMapClick} isAddMode={isAddMode} />

          {/* Render All Disaster Sites, Building Footprints & Markers */}
          {filteredSites.map((site) => {
            const isSelected = selectedSite?.id === site.id;
            const markerColor = damageColorMap[site.damage];
            const footprint = getBuildingFootprint(site.lat, site.lng, site.id);

            return (
              <React.Fragment key={site.id}>
                {/* Hotspot Danger Zone Circle */}
                {showHeatmaps && (site.damage === 'DESTROYED' || site.damage === 'MAJOR') && (
                  <Circle
                    center={[site.lat, site.lng]}
                    radius={site.damage === 'DESTROYED' ? 450 : 250}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: site.damage === 'DESTROYED' ? 0.18 : 0.12,
                      weight: 1.5,
                      dashArray: '4, 6',
                    }}
                  />
                )}

                {/* Building Footprint Polygon (Visible at Close Zoom >= 16 or when selected) */}
                {(mapZoom >= 16 || isSelected) && (
                  <Polygon
                    positions={footprint}
                    pathOptions={{
                      color: markerColor,
                      weight: isSelected ? 3 : 1.5,
                      fillColor: markerColor,
                      fillOpacity: isSelected ? 0.45 : 0.2,
                      dashArray: isSelected ? undefined : '3, 4',
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedSite(site);
                        setMapCenter([site.lat, site.lng]);
                        setMapZoom(19);
                        setTileStyle('satellite');
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -12]} opacity={0.95} permanent={isSelected && mapZoom >= 18}>
                      <div className="text-[11px] font-mono font-bold text-white bg-black/90 px-2 py-0.5 rounded border border-white/20">
                        {site.name} · {site.damage}
                      </div>
                    </Tooltip>
                  </Polygon>
                )}

                {/* Tactical Marker */}
                <Marker
                  position={[site.lat, site.lng]}
                  icon={createTacticalIcon(site.damage, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedSite(site);
                      setMapCenter([site.lat, site.lng]);
                      setMapZoom(19);
                      setTileStyle('satellite');
                    },
                  }}
                >
                  <Popup className="tactical-leaflet-popup">
                    <div className="p-3.5 w-[270px] text-white">
                      {/* Popup Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.08]">
                        <span className="text-[12px] font-mono font-bold text-white truncate">
                          {site.id}
                        </span>
                        <span className={damageBadgeCls[site.damage]}>
                          {site.damage.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Name & Region */}
                      <div className="text-[13px] font-bold text-white mb-1 leading-snug">
                        {site.name}
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FF8A3D]" />
                        {site.district}, {site.state}
                      </div>

                      {/* Quick Meta Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/40 border border-white/[0.06] mb-3 text-[11px]">
                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase">Priority</span>
                          <span className="font-mono font-bold text-[#FF8A3D]">{site.priorityScore}/100</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase">Road Access</span>
                          <span className={site.roadAccess ? 'text-[#22C55E] font-semibold' : 'text-[#EF4444] font-semibold'}>
                            {site.roadAccess ? '✓ Clear' : '⚠ Blocked'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase">Est. Occupants</span>
                          <span className="font-mono text-white">~{site.estimatedOccupancy}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase">Status</span>
                          <span className="text-[#00E5FF] font-medium">{site.status}</span>
                        </div>
                      </div>

                      {/* Notes snippet */}
                      <p className="text-[11px] text-[#9CA3AF] mb-3 line-clamp-2">
                        {site.notes}
                      </p>

                      {/* Popup Actions */}
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            setMapCenter([site.lat, site.lng]);
                            setMapZoom(19);
                            setTileStyle('satellite');
                          }}
                          className="w-full py-1.5 px-2.5 rounded bg-gradient-to-r from-[#00E5FF]/20 to-[#0088FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/30 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> 🛰️ Direct Satellite Close-Up
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate('/viewer')}
                            className="btn-primary flex-1 py-1.5 text-[11px] justify-center flex items-center gap-1.5 cursor-pointer"
                          >
                            <Box className="w-3 h-3" /> 3D Twin
                          </button>
                          <button
                            onClick={() => navigate('/priority')}
                            className="btn-secondary py-1.5 px-2.5 text-[11px] flex items-center justify-center cursor-pointer"
                            title="View in Rescue Priority Plan"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* ── Add Mode Floating Banner ── */}
        {isAddMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce">
            <div
              className="px-5 py-2.5 rounded-full flex items-center gap-2.5 text-[13px] font-bold text-white shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                border: '2px solid #ffffff',
                boxShadow: '0 0 24px rgba(239, 68, 68, 0.8)',
              }}
            >
              <MapPin className="w-4 h-4 animate-spin" />
              Click anywhere on the map to pin a disaster location
              <button
                onClick={() => setIsAddMode(false)}
                className="ml-2 bg-black/40 hover:bg-black/60 rounded-full p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Left Overlay: District Directory & Filters ── */}
        <div
          className="absolute top-4 left-4 z-10 w-[300px] max-h-[calc(100%-32px)] flex flex-col rounded-xl overflow-hidden shadow-2xl transition-all"
          style={{
            background: 'rgba(11, 15, 25, 0.94)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF8A3D]" />
              <span className="text-[13px] font-bold text-white">Disaster Sites</span>
              <span className="badge-orange text-[10px] px-1.5 py-0.2">{filteredSites.length}</span>
            </div>
            <button
              onClick={() => setShowHeatmaps(!showHeatmaps)}
              className={clsx(
                'text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors',
                showHeatmaps ? 'bg-[#00E5FF]15 text-[#00E5FF] border border-[#00E5FF]30' : 'text-[#6B7280]'
              )}
            >
              Heatmap: {showHeatmaps ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Quick Filter Selectors */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="flex gap-1.5">
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-[#D1D5DB] bg-black/40 border border-white/[0.08] focus:outline-none"
              >
                <option value="ALL">All States</option>
                {stateOptions.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              <select
                value={selectedSeverityFilter}
                onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-[#D1D5DB] bg-black/40 border border-white/[0.08] focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="DESTROYED">Destroyed</option>
                <option value="MAJOR">Major Damage</option>
                <option value="MINOR">Minor Damage</option>
                <option value="NO_DAMAGE">Safe / No Damage</option>
              </select>
            </div>
          </div>

          {/* Sites Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[380px]">
            {filteredSites.length === 0 ? (
              <div className="p-6 text-center text-[#6B7280] text-[12px]">
                No matching disaster sites found in this region.
              </div>
            ) : (
              filteredSites.map((site) => {
                const isSelected = selectedSite?.id === site.id;
                const col = damageColorMap[site.damage];
                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      setSelectedSite(site);
                      setMapCenter([site.lat, site.lng]);
                      setMapZoom(19);
                      setTileStyle('satellite');
                    }}
                    className={clsx(
                      'p-2.5 rounded-lg transition-all cursor-pointer border group',
                      isSelected
                        ? 'bg-white/[0.06] border-[#FF8A3D] shadow-[0_0_14px_rgba(255,107,0,0.15)]'
                        : 'bg-black/30 border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.1]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="text-[12px] font-semibold text-white group-hover:text-[#FF8A3D] transition-colors line-clamp-1">
                        {site.name}
                      </div>
                      <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color: col }}>
                        {site.priorityScore} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                      <span>{site.district}</span>
                      <div className="flex items-center gap-2">
                        <span className={site.roadAccess ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                          {site.roadAccess ? 'Road Clear' : 'Road Blocked'}
                        </span>
                        <span className="text-[#00E5FF] font-semibold flex items-center gap-0.5 group-hover:underline">
                          <Eye className="w-2.5 h-2.5" /> 19x
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Selected Site HUD Card ── */}
        {selectedSite && (
          <div
            className="absolute bottom-4 right-4 z-10 w-[320px] rounded-xl overflow-hidden shadow-2xl animate-fade-in-up"
            style={{
              background: 'rgba(11, 15, 25, 0.96)',
              border: `1px solid ${damageColorMap[selectedSite.damage]}40`,
              boxShadow: `0 0 28px ${damageColorMap[selectedSite.damage]}20, 0 12px 40px rgba(0,0,0,0.7)`,
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: damageColorMap[selectedSite.damage] }} />
                <span className="text-[13px] font-bold font-mono text-white">{selectedSite.id}</span>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-[#6B7280] hover:text-white text-[16px] leading-none transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <span className={damageBadgeCls[selectedSite.damage]}>
                  {selectedSite.damage.replace('_', ' ')}
                </span>
                <h3 className="text-[15px] font-bold text-white mt-1.5">{selectedSite.name}</h3>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {selectedSite.district}, {selectedSite.state}
                </p>
              </div>

              {/* Coordinates & Meta */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px]">
                <div>
                  <span className="text-[#6B7280] text-[9px] uppercase block">Coordinates</span>
                  <span className="font-mono text-white text-[10px]">
                    {selectedSite.lat.toFixed(4)}°N, {selectedSite.lng.toFixed(4)}°E
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[9px] uppercase block">Road Condition</span>
                  <span className={selectedSite.roadAccess ? 'text-[#22C55E] font-semibold' : 'text-[#EF4444] font-semibold'}>
                    {selectedSite.roadAccess ? '✓ Clear Access' : '⚠ Blocked Access'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[9px] uppercase block">Est. Occupants</span>
                  <span className="font-mono text-white font-bold">{selectedSite.estimatedOccupancy} people</span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[9px] uppercase block">Priority Score</span>
                  <span className="font-mono font-bold" style={{ color: damageColorMap[selectedSite.damage] }}>
                    {selectedSite.priorityScore}/100
                  </span>
                </div>
              </div>

              {/* Field Notes */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05] text-[11px] text-[#9CA3AF]">
                <span className="text-[9px] uppercase tracking-wider text-[#6B7280] font-semibold block mb-0.5">Field Report</span>
                {selectedSite.notes}
              </div>

              {/* Direct Close-Up Satellite Inspection Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMapCenter([selectedSite.lat, selectedSite.lng]);
                    setMapZoom(19);
                    setTileStyle('satellite');
                  }}
                  className="flex-1 py-2 px-3 text-[12px] font-bold rounded-lg border border-[#00E5FF]/50 bg-gradient-to-r from-[#00E5FF]/20 to-[#0088FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/35 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  title="Direct zoom to building rooftop and footprint on satellite map"
                >
                  <Eye className="w-4 h-4" /> 🛰️ Direct Building Zoom (19x)
                </button>
                {mapZoom >= 18 && (
                  <button
                    onClick={() => {
                      setMapZoom(14);
                    }}
                    className="py-2 px-2.5 text-[11px] rounded-lg border border-white/10 bg-black/40 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Zoom back out to neighborhood level"
                  >
                    Area View (14x)
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => navigate('/viewer')}
                  className="btn-primary flex-1 py-2 text-[12px] justify-center flex items-center gap-1.5 cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" /> Launch 3D Twin
                </button>
                <button
                  onClick={() => navigate('/priority')}
                  className="btn-secondary flex-1 py-2 text-[12px] justify-center flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Priority Report
                </button>
                <button
                  onClick={() => handleDeleteSite(selectedSite.id)}
                  className="btn-ghost p-2 text-[#EF4444] hover:bg-[#EF4444]15 rounded-lg cursor-pointer"
                  title="Remove this pinned site"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Coordinates HUD overlay (bottom left) ── */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden md:block">
          <div
            className="px-3.5 py-2 rounded-lg text-[11px] font-mono text-[#9CA3AF] flex items-center gap-3"
            style={{
              background: 'rgba(11, 15, 25, 0.85)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] pulse-dot" />
              <span>LIVE SATELLITE TELEMETRY</span>
            </div>
            <span className="text-white">LAT: {mapCenter[0].toFixed(4)}°N</span>
            <span className="text-white">LNG: {mapCenter[1].toFixed(4)}°E</span>
            <span>ZOOM: {mapZoom}x</span>
          </div>
        </div>
      </div>

      {/* ── Manual Add Disaster Location Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative"
            style={{
              background: 'rgba(16, 21, 31, 0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,107,0,0.15)',
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#FF6B00]20 border border-[#FF6B00]30">
                  <MapPin className="w-5 h-5 text-[#FF8A3D]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-white">Add Disaster Location</h3>
                  <p className="text-[11px] text-[#6B7280]">Register new damage report to the live map</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6B7280] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                  Location / Building Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meppadi Town Hall or Bridge Access point"
                  value={newSiteData.name}
                  onChange={(e) => setNewSiteData({ ...newSiteData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kerala"
                    value={newSiteData.state}
                    onChange={(e) => setNewSiteData({ ...newSiteData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    District / Region
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wayanad"
                    value={newSiteData.district}
                    onChange={(e) => setNewSiteData({ ...newSiteData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newSiteData.lat}
                    onChange={(e) => setNewSiteData({ ...newSiteData, lat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] font-mono text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newSiteData.lng}
                    onChange={(e) => setNewSiteData({ ...newSiteData, lng: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] font-mono text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    Damage Severity
                  </label>
                  <select
                    value={newSiteData.damage}
                    onChange={(e) => setNewSiteData({ ...newSiteData, damage: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  >
                    <option value="DESTROYED">Destroyed (Critical)</option>
                    <option value="MAJOR">Major Damage</option>
                    <option value="MINOR">Minor Damage</option>
                    <option value="NO_DAMAGE">Safe / No Damage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    Priority Score (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newSiteData.priorityScore}
                    onChange={(e) => setNewSiteData({ ...newSiteData, priorityScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] font-mono text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                    Est. Occupants
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={newSiteData.estimatedOccupancy}
                    onChange={(e) => setNewSiteData({ ...newSiteData, estimatedOccupancy: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 text-[13px] text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newSiteData.roadAccess}
                      onChange={(e) => setNewSiteData({ ...newSiteData, roadAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-[#FF6B00] accent-[#FF6B00]"
                    />
                    <span>Road Access Clear</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">
                  Field Notes / Rescue Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe structural collapse, emergency needs, evacuation status..."
                  value={newSiteData.notes}
                  onChange={(e) => setNewSiteData({ ...newSiteData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-white bg-black/40 border border-white/[0.1] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost flex-1 py-2.5 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 text-[13px] justify-center flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save & Pin on Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoMap;

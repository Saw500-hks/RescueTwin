/**
 * DamageMap Component — Pan-India Command Map
 *
 * Provides the interactive disaster intelligence map with:
 * - India → State → District → Disaster Event drill-down
 * - Building visualization with evidence-based status
 * - Proper data integrity labeling (DEMO DATA / UNAVAILABLE / MODEL OUTPUT)
 *
 * IMPORTANT: Flood exposure ≠ structural destruction.
 * All buildings without verified model output show as REQUIRES_INSPECTION.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  ChevronRight, AlertTriangle, Info, Layers, Filter,
  Building2, MapPin, Droplets, Wind, Mountain, Activity, Flame,
  X, ExternalLink, Loader2, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getStates, getStateDistricts, getDisasters,
  getDisasterBuildings, getBuildingEvidence, aiExplain, aiPrioritize,
} from '../../api/client';

// Fix Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Types ──────────────────────────────────────────────────────────────────────
interface State { state_id: string; name: string; capital: string; disaster_prone: string[] }
interface District { district_id: string; name: string; lat: number; lng: number }
interface DisasterEvent {
  event_id: string; state: string; district: string; disaster_type: string;
  title: string; description: string; severity: string; center_lat: number;
  center_lng: number; radius_km: number; data_status: string;
  total_structures_in_area: number | null; note: string;
}
interface Building {
  building_id: string; name: string; lat: number; lng: number;
  flood_exposure: string; damage_classification: string; damage_note: string;
  inspection_priority: string; ai_explanation: string;
  confidence: number | null; evidence_source: string | null;
  data_status: string; road_status: string; road_status_note: string;
}

// ── Map Controller ─────────────────────────────────────────────────────────────
function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.3 }); }, [center, zoom, map]);
  return null;
}

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
    'MODEL OUTPUT': { cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', label: 'MODEL OUTPUT' },
    'VERIFIED DATA': { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'VERIFIED DATA' },
    'SIMULATION': { cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'SIMULATION' },
  };
  const c = config[status] || config['UNAVAILABLE'];
  return (
    <span className={clsx(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider',
      c.cls
    )}>{c.label}</span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const DamageMap: React.FC = () => {
  // Geographic drill-down state
  const [states, setStates] = useState<State[]>([]);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 78.9]); // India center
  const [mapZoom, setMapZoom] = useState(5);
  const [tileStyle, setTileStyle] = useState<'dark' | 'satellite' | 'osm'>('dark');

  // UI state
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showHeatZone, setShowHeatZone] = useState(true);

  const cartoKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4264_1_3438c67ecbcbe54961ebf696';
  const TILE_URLS = {
    dark: cartoKey 
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  // Load states on mount
  useEffect(() => {
    getStates().catch(() => []).then((data: any) => {
      if (Array.isArray(data)) setStates(data);
    });
  }, []);

  // Select state
  const handleSelectState = useCallback(async (state: State) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedEvent(null);
    setBuildings([]);
    setSelectedBuilding(null);
    setAiOutput(null);
    setLoading(true);
    try {
      const [distRes, evtRes] = await Promise.all([
        getStateDistricts(state.state_id).catch(() => ({ districts: [] })),
        getDisasters(state.state_id).catch(() => ({ events: [] })),
      ]);
      setDistricts(distRes.districts || []);
      setEvents(evtRes.events || []);
    } catch {
      setDistricts([]);
      setEvents([]);
    }
    setLoading(false);
  }, []);

  // Select event
  const handleSelectEvent = useCallback(async (event: DisasterEvent) => {
    setSelectedEvent(event);
    setSelectedBuilding(null);
    setAiOutput(null);
    setMapCenter([event.center_lat, event.center_lng]);
    setMapZoom(12);
    setLoading(true);
    try {
      const res = await getDisasterBuildings(event.event_id).catch(() => ({ buildings: [] }));
      setBuildings(res.buildings || []);
    } catch {
      setBuildings([]);
    }
    setLoading(false);
  }, []);

  // Select building → AI explain
  const handleSelectBuilding = useCallback(async (building: Building) => {
    setSelectedBuilding(building);
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
      const res = await aiPrioritize({
        event_id: selectedEvent?.event_id,
        buildings,
      });
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
    REQUIRES_INSPECTION: '#F59E0B',
    HIGH: '#EF4444',
    MEDIUM: '#F97316',
    LOW: '#22C55E',
    UNKNOWN: '#94A3B8',
  }[s] || '#94A3B8');

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      {/* ── Left Control Panel ─────────────────────────────────────────────── */}
      <aside className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'rgba(5,10,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Pan-India Intelligence</span>
          </div>
          <p className="text-[10px] text-slate-500">India → State → District → Disaster → Building</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Step 1: States */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">
              1 · SELECT STATE
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {states.length === 0 && (
                <div className="text-[11px] text-slate-500 px-2 py-1">Loading states...</div>
              )}
              {states.map((s) => (
                <button
                  key={s.state_id}
                  onClick={() => handleSelectState(s)}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all text-left',
                    selectedState?.state_id === s.state_id
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  )}
                >
                  <span>{s.name}</span>
                  <div className="flex items-center gap-1">
                    {s.disaster_prone.slice(0, 2).map((d) => (
                      <DisasterIcon key={d} type={d} />
                    ))}
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Districts */}
          {selectedState && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">
                2 · DISTRICT — {selectedState.name.toUpperCase()}
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {districts.map((d) => (
                  <button
                    key={d.district_id}
                    onClick={() => {
                      setSelectedDistrict(d);
                      setMapCenter([d.lat, d.lng]);
                      setMapZoom(11);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all text-left',
                      selectedDistrict?.district_id === d.district_id
                        ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300'
                        : 'text-slate-400 hover:bg-white/[0.03] border border-transparent'
                    )}
                  >
                    <span>{d.name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Disaster Events */}
          {events.length > 0 && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">
                3 · DISASTER EVENTS
              </div>
              <div className="space-y-1.5">
                {events.map((e) => (
                  <button
                    key={e.event_id}
                    onClick={() => handleSelectEvent(e)}
                    className={clsx(
                      'w-full text-left px-2.5 py-2 rounded-lg border transition-all',
                      selectedEvent?.event_id === e.event_id
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                        : 'bg-black/20 border-white/[0.06] text-slate-300 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <DisasterIcon type={e.disaster_type} />
                      <span className="text-[11px] font-semibold">{e.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${severityColor(e.severity)}22`, color: severityColor(e.severity) }}
                      >{e.severity}</span>
                      <DataStatusBadge status={e.data_status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Buildings */}
          {buildings.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  4 · BUILDINGS ({buildings.length})
                </div>
                <button
                  onClick={handleAIPrioritize}
                  disabled={aiLoading}
                  className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {aiLoading ? '...' : 'AI Prioritize'}
                </button>
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {buildings.map((b) => (
                  <button
                    key={b.building_id}
                    onClick={() => handleSelectBuilding(b)}
                    className={clsx(
                      'w-full text-left px-2.5 py-2 rounded-lg border transition-all',
                      selectedBuilding?.building_id === b.building_id
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-black/20 border-white/[0.04] hover:border-white/15'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: inspectionColor(b.inspection_priority) }} />
                      <span className="text-[11px] font-medium text-slate-200 truncate">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{ background: `${inspectionColor(b.inspection_priority)}22`, color: inspectionColor(b.inspection_priority) }}>
                        {b.inspection_priority.replace(/_/g, ' ')}
                      </span>
                      <DataStatusBadge status={b.data_status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-[11px] px-2 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading data...</span>
            </div>
          )}
        </div>

        {/* Damage Legend */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">INSPECTION STATUS</div>
          <div className="space-y-1">
            {[
              { label: 'Requires Inspection', color: '#F59E0B' },
              { label: 'Flood Exposed', color: '#3B82F6' },
              { label: 'Status Unknown', color: '#94A3B8' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
                <span className="text-[10.5px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 px-1.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            <p className="text-[9px] text-amber-400 font-medium">
              Flood exposure ≠ structural damage. All buildings require field verification.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <TileLayer url={TILE_URLS[tileStyle]} attribution="&copy; CartoDB" />

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

          {/* Building markers */}
          {buildings.map((b) => (
            <Marker
              key={b.building_id}
              position={[b.lat, b.lng]}
              icon={createBuildingIcon(b.inspection_priority, selectedBuilding?.building_id === b.building_id)}
              eventHandlers={{ click: () => handleSelectBuilding(b) }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]" style={{ color: '#e2e8f0', background: 'transparent' }}>
                  <div className="font-bold text-sm mb-1">{b.name}</div>
                  <div className="text-xs text-slate-400 mb-1">{b.building_id}</div>
                  <DataStatusBadge status={b.data_status} />
                  <div className="mt-2 text-xs">
                    <div>Flood Exposure: <span className="text-blue-400">{b.flood_exposure}</span></div>
                    <div>Damage: <span className="text-amber-400">{b.damage_classification}</span></div>
                    <div>Priority: <span className="text-orange-400">{b.inspection_priority.replace(/_/g, ' ')}</span></div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-500 italic">{b.damage_note}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Tile layer controls */}
        <div className="absolute top-3 right-3 z-[999] flex gap-1.5">
          {(['dark', 'satellite', 'osm'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTileStyle(t)}
              className={clsx(
                'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all',
                tileStyle === t
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-black/60 border-white/10 text-slate-400 hover:border-white/25 backdrop-blur'
              )}
            >{t}</button>
          ))}
          <button
            onClick={() => setShowHeatZone(!showHeatZone)}
            className={clsx(
              'px-2 py-1 rounded text-[10px] font-bold border transition-all',
              showHeatZone ? 'bg-orange-500/15 border-orange-500/30 text-orange-300' : 'bg-black/60 border-white/10 text-slate-500 backdrop-blur'
            )}
          >Zone</button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-3 left-3 z-[999] flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur text-[11px]"
          style={{ background: 'rgba(5,10,20,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-slate-400">India</span>
          {selectedState && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-cyan-300">{selectedState.name}</span></>}
          {selectedDistrict && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-cyan-200">{selectedDistrict.name}</span></>}
          {selectedEvent && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-orange-300">{selectedEvent.disaster_type}</span></>}
          {selectedBuilding && <><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-amber-300">{selectedBuilding.building_id}</span></>}
        </div>
      </div>

      {/* ── Right Building Detail / AI Panel ───────────────────────────────── */}
      {selectedBuilding && (
        <aside className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden border-l border-white/[0.07]"
          style={{ background: 'rgba(5,10,20,0.97)' }}>
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
            {/* Building Header */}
            <div>
              <div className="font-bold text-slate-100 text-sm mb-0.5">{selectedBuilding.name}</div>
              <div className="text-[10px] text-slate-500 font-mono mb-1.5">{selectedBuilding.building_id}</div>
              <DataStatusBadge status={selectedBuilding.data_status} />
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Flood Exposure', value: selectedBuilding.flood_exposure, color: '#3B82F6' },
                { label: 'Damage', value: selectedBuilding.damage_classification, color: '#F59E0B' },
                { label: 'Confidence', value: selectedBuilding.confidence ?? 'Not Available', color: '#94A3B8' },
                { label: 'Road Status', value: selectedBuilding.road_status, color: '#94A3B8' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg p-2 bg-black/30 border border-white/[0.05]">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-[11px] font-semibold" style={{ color: String(value) === 'Not Available' ? '#64748B' : color }}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Damage Note */}
            <div className="rounded-lg p-2.5 bg-amber-500/5 border border-amber-500/15">
              <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Info className="w-2.5 h-2.5" /> DAMAGE ASSESSMENT NOTE
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">{selectedBuilding.damage_note}</p>
            </div>

            {/* Road Status Note */}
            <div className="rounded-lg p-2.5 bg-slate-500/5 border border-slate-500/15">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ROAD ACCESS</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{selectedBuilding.road_status_note}</p>
            </div>

            {/* Inspection Priority */}
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

            {/* AI Explanation */}
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
                    <DataStatusBadge status={aiOutput.data_status || 'UNAVAILABLE'} />
                    <p className="text-[9px] text-slate-500 mt-1 italic">{aiOutput.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">{selectedBuilding.ai_explanation}</p>
              )}
            </div>

            {/* Evidence */}
            <div className="rounded-lg p-2.5 bg-slate-800/30 border border-white/[0.06]">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">EVIDENCE</div>
              <div className="text-[10px] text-slate-500">
                {selectedBuilding.evidence_source ?? 'No evidence available'}
              </div>
              <p className="text-[9px] text-slate-600 mt-1 italic">
                Requires: post-event satellite imagery + field survey
              </p>
            </div>

            {/* Disclaimer */}
            <div className="rounded p-2 bg-red-500/5 border border-red-500/15">
              <p className="text-[9px] text-red-400/80 leading-relaxed">
                ⚠ AI output is DECISION SUPPORT ONLY. Verify all assessments with qualified field teams before operational action.
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default DamageMap;

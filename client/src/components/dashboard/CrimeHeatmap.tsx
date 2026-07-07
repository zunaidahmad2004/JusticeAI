import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Locate, RefreshCw, Layers, Filter,
  AlertTriangle, X, ExternalLink, Search,
} from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CrimeMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  crime_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  date_of_incident: string;
  io_name?: string;
  case_number: string;
}

interface OfficerLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

/* ─── Priority colours ───────────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#3B82F6',
};

/* ─── Haversine distance (km) ────────────────────────────────────────────── */
function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Leaflet CSS injected once ──────────────────────────────────────────── */
let cssLoaded = false;
function injectLeafletCSS() {
  if (cssLoaded) return;
  cssLoaded = true;
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  // Marker cluster CSS
  const link2 = document.createElement('link');
  link2.rel  = 'stylesheet';
  link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
  document.head.appendChild(link2);
  const link3 = document.createElement('link');
  link3.rel  = 'stylesheet';
  link3.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
  document.head.appendChild(link3);
}

/* ─── SVG marker factory ─────────────────────────────────────────────────── */
function makeSvgIcon(color: string, L: any) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9 13 21 13 21s13-12 13-21C26 5.8 20.2 0 13 0z"
            fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/>
      <circle cx="13" cy="13" r="5.5" fill="white" opacity="0.9"/>
    </svg>`;
  return new L.DivIcon({
    html:       `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${svg}</div>`,
    iconSize:   [26, 34],
    iconAnchor: [13, 34],
    popupAnchor:[0, -36],
    className:  '',
  });
}

function makeOfficerIcon(L: any) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="16" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
      <circle cx="17" cy="17" r="8"  fill="white" opacity="0.9"/>
      <circle cx="17" cy="17" r="4"  fill="#3B82F6"/>
    </svg>`;
  return new L.DivIcon({
    html:       `<div style="filter:drop-shadow(0 3px 6px rgba(59,130,246,0.6))">${svg}</div>`,
    iconSize:   [34, 34],
    iconAnchor: [17, 17],
    popupAnchor:[0, -20],
    className:  '',
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CrimeHeatmap() {
  const navigate   = useNavigate();
  const mapDiv     = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const officerRef = useRef<any>(null);
  const radiusRef  = useRef<any>(null);
  const watchId    = useRef<number | null>(null);

  const [officer, setOfficer]       = useState<OfficerLocation | null>(null);
  const [crimes, setCrimes]         = useState<CrimeMarker[]>([]);
  const [loading, setLoading]       = useState(true);
  const [locError, setLocError]     = useState('');
  const [radius, setRadius]         = useState(10);    // km
  const [filter, setFilter]         = useState<string>('all');
  const [search, setSearch]         = useState('');
  const [selectedCrime, setSelectedCrime] = useState<(CrimeMarker & { dist: number }) | null>(null);
  const [mapReady, setMapReady]     = useState(false);

  /* ── Fetch crimes from backend ─────────────────────────────────────── */
  const fetchCrimes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/cases', { params: { limit: 100 } });
      const cases = (res.data?.cases ?? res.data ?? []) as any[];
      const markers: CrimeMarker[] = cases
        .filter((c: any) => c.latitude && c.longitude)
        .map((c: any) => ({
          id:                c.id ?? c._id,
          lat:               parseFloat(c.latitude),
          lng:               parseFloat(c.longitude),
          title:             c.title,
          crime_type:        c.crime_type || 'Unknown',
          priority:          c.priority || 'low',
          status:            c.status,
          date_of_incident:  c.date_of_incident,
          io_name:           c.io_name,
          case_number:       c.case_number,
        }));

      // If no cases have coordinates, generate demo markers near officer/default
      if (markers.length === 0) {
        const base = officer ?? { lat: 28.6139, lng: 77.2090 }; // Delhi default
        const DEMO: CrimeMarker[] = [
          { id: 'd1', lat: base.lat + 0.03, lng: base.lng + 0.02, title: 'Armed Robbery', crime_type: 'Robbery', priority: 'critical', status: 'under_investigation', date_of_incident: new Date().toISOString(), io_name: 'SI Rajan', case_number: 'CASE-001' },
          { id: 'd2', lat: base.lat - 0.02, lng: base.lng + 0.04, title: 'Cyber Fraud', crime_type: 'Cyber Crime', priority: 'high', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Priya', case_number: 'CASE-002' },
          { id: 'd3', lat: base.lat + 0.05, lng: base.lng - 0.03, title: 'Vehicle Theft', crime_type: 'Theft', priority: 'medium', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Kumar', case_number: 'CASE-003' },
          { id: 'd4', lat: base.lat - 0.04, lng: base.lng - 0.02, title: 'Chain Snatching', crime_type: 'Snatching', priority: 'medium', status: 'under_investigation', date_of_incident: new Date().toISOString(), io_name: 'SI Meera', case_number: 'CASE-004' },
          { id: 'd5', lat: base.lat + 0.01, lng: base.lng + 0.06, title: 'House Burglary', crime_type: 'Burglary', priority: 'high', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Arjun', case_number: 'CASE-005' },
          { id: 'd6', lat: base.lat - 0.06, lng: base.lng + 0.01, title: 'Assault Case', crime_type: 'Assault', priority: 'low', status: 'closed', date_of_incident: new Date().toISOString(), io_name: 'SI Neha', case_number: 'CASE-006' },
        ];
        setCrimes(DEMO);
      } else {
        setCrimes(markers);
      }
    } catch {
      // Use demo data if API fails
      const base = officer ?? { lat: 28.6139, lng: 77.2090 };
      setCrimes([
        { id: 'd1', lat: base.lat + 0.03, lng: base.lng + 0.02, title: 'Armed Robbery', crime_type: 'Robbery', priority: 'critical', status: 'under_investigation', date_of_incident: new Date().toISOString(), io_name: 'SI Rajan', case_number: 'CASE-001' },
        { id: 'd2', lat: base.lat - 0.02, lng: base.lng + 0.04, title: 'Cyber Fraud', crime_type: 'Cyber Crime', priority: 'high', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Priya', case_number: 'CASE-002' },
        { id: 'd3', lat: base.lat + 0.05, lng: base.lng - 0.03, title: 'Vehicle Theft', crime_type: 'Theft', priority: 'medium', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Kumar', case_number: 'CASE-003' },
        { id: 'd4', lat: base.lat - 0.04, lng: base.lng - 0.02, title: 'Chain Snatching', crime_type: 'Snatching', priority: 'medium', status: 'under_investigation', date_of_incident: new Date().toISOString(), io_name: 'SI Meera', case_number: 'CASE-004' },
        { id: 'd5', lat: base.lat + 0.01, lng: base.lng + 0.06, title: 'House Burglary', crime_type: 'Burglary', priority: 'high', status: 'open', date_of_incident: new Date().toISOString(), io_name: 'SI Arjun', case_number: 'CASE-005' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [officer]);

  /* ── Get officer geolocation ───────────────────────────────────────── */
  const locateOfficer = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOfficer({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocError('');
        if (mapRef.current) {
          mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13, { animate: true });
        }
      },
      (err) => {
        // Fallback to Delhi if denied
        setOfficer({ lat: 28.6139, lng: 77.2090, accuracy: 0 });
        setLocError(err.code === 1 ? 'Location access denied. Showing default location.' : 'Location unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Init map ──────────────────────────────────────────────────────── */
  useEffect(() => {
    injectLeafletCSS();
    if (!mapDiv.current || mapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapDiv.current || mapRef.current) return;

      // Dark tile layer (CartoDB Dark Matter — free, no API key)
      const map = L.map(mapDiv.current, {
        center: [20.5937, 78.9629], // India center
        zoom:   5,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);

      // Custom zoom controls bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      // Locate officer immediately
      locateOfficer();
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  /* ── Continuous location watch ─────────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setOfficer({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current!); };
  }, []);

  /* ── Update officer marker + radius circle when location changes ───── */
  useEffect(() => {
    if (!mapRef.current || !officer) return;
    import('leaflet').then((L) => {
      // Officer marker
      if (officerRef.current) officerRef.current.remove();
      officerRef.current = L.marker([officer.lat, officer.lng], { icon: makeOfficerIcon(L), zIndexOffset: 1000 })
        .addTo(mapRef.current)
        .bindPopup('<div style="color:#1e293b;font-weight:700;font-size:13px">📍 Your Location</div>');

      // Radius circle
      if (radiusRef.current) radiusRef.current.remove();
      radiusRef.current = L.circle([officer.lat, officer.lng], {
        radius:      radius * 1000,
        color:       '#3B82F6',
        fillColor:   '#3B82F6',
        fillOpacity: 0.04,
        weight:      1.5,
        dashArray:   '6 4',
      }).addTo(mapRef.current);
    });
  }, [officer, radius]);

  /* ── Fetch crimes after location is set ────────────────────────────── */
  useEffect(() => {
    if (mapReady) fetchCrimes();
  }, [mapReady, fetchCrimes]);

  /* ── Render crime markers whenever crimes / filter change ───────────── */
  useEffect(() => {
    if (!mapRef.current || crimes.length === 0) return;
    import('leaflet').then(async (L) => {
      // Remove old cluster group
      if (clusterRef.current) { clusterRef.current.remove(); clusterRef.current = null; }

      // Load marker cluster
      const { default: MarkerCluster } = await import('leaflet.markercluster');
      const group = (L as any).markerClusterGroup({
        maxClusterRadius:     50,
        spiderfyOnMaxZoom:    true,
        showCoverageOnHover:  false,
        zoomToBoundsOnClick:  true,
        iconCreateFunction:   (cluster: any) => {
          const c = cluster.getChildCount();
          return new L.DivIcon({
            html: `<div style="
              background:rgba(239,68,68,0.85);
              border:2px solid rgba(255,255,255,0.4);
              border-radius:50%;width:36px;height:36px;
              display:flex;align-items:center;justify-content:center;
              font-size:12px;font-weight:700;color:white;
              box-shadow:0 2px 8px rgba(0,0,0,0.4)
            ">${c}</div>`,
            className: '',
            iconSize: [36, 36],
          });
        },
      });

      const filtered = crimes.filter((c) => {
        if (filter !== 'all' && c.priority !== filter) return false;
        if (search && !c.title.toLowerCase().includes(search.toLowerCase())
          && !c.crime_type.toLowerCase().includes(search.toLowerCase())
          && !c.case_number.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });

      filtered.forEach((crime) => {
        const color  = PRIORITY_COLOR[crime.priority] ?? '#3B82F6';
        const marker = L.marker([crime.lat, crime.lng], { icon: makeSvgIcon(color, L) });
        const dist   = officer ? distKm(officer.lat, officer.lng, crime.lat, crime.lng) : 0;

        marker.on('click', () => setSelectedCrime({ ...crime, dist }));
        group.addLayer(marker);
      });

      clusterRef.current = group;
      mapRef.current.addLayer(group);
    });
  }, [crimes, filter, search, officer]);

  /* ── Radius circle update ───────────────────────────────────────────── */
  useEffect(() => {
    if (!radiusRef.current) return;
    radiusRef.current.setRadius(radius * 1000);
  }, [radius]);

  /* ── Center map on officer ─────────────────────────────────────────── */
  const centerOnOfficer = () => {
    if (mapRef.current && officer) {
      mapRef.current.setView([officer.lat, officer.lng], 14, { animate: true });
    } else {
      locateOfficer();
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="card h-full flex flex-col overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="card-header flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Crime Map</h2>
              <p className="text-xs text-slate-500">Live · Real-time incidents</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Radius selector */}
            <div className="flex items-center gap-0.5 bg-base-elevated rounded-lg p-0.5 border border-base-border">
              {[5, 10, 25].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    radius === r ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-0.5 bg-base-elevated rounded-lg p-0.5 border border-base-border">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${
                    filter === f ? 'bg-primary-500/20 text-primary-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button onClick={fetchCrimes} className="btn-icon w-7 h-7" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search case, crime type, PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2 text-xs h-8"
          />
        </div>

        {/* Location error banner */}
        {locError && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {locError}
          </div>
        )}
      </div>

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        {/* Leaflet container */}
        <div ref={mapDiv} className="absolute inset-0" style={{ zIndex: 0 }} />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-card/60 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading crime data...</p>
            </div>
          </div>
        )}

        {/* My Location button */}
        <button
          onClick={centerOnOfficer}
          title="My Location"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl
                     bg-base-card/90 backdrop-blur-sm border border-base-border
                     flex items-center justify-center text-blue-400
                     hover:bg-base-elevated hover:border-blue-500/40 transition-all shadow-card"
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
          <div className="glass-strong rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              {[
                { color: '#EF4444', label: 'Critical' },
                { color: '#F97316', label: 'High'     },
                { color: '#F59E0B', label: 'Medium'   },
                { color: '#3B82F6', label: 'Low'      },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-[10px] text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-xl px-3 py-1.5">
            <p className="text-[10px] text-slate-400">
              <span className="text-white font-semibold">{crimes.filter(c => filter === 'all' || c.priority === filter).length}</span>
              {' '}incidents · <span className="text-blue-400">{radius}km radius</span>
            </p>
          </div>
        </div>

        {/* Crime popup (custom, outside Leaflet) */}
        {selectedCrime && (
          <div className="absolute top-3 left-3 z-20 w-72 glass-strong rounded-2xl border border-base-border shadow-card overflow-hidden">
            {/* Priority banner */}
            <div
              className="h-1 w-full"
              style={{ background: PRIORITY_COLOR[selectedCrime.priority] }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500">{selectedCrime.case_number}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase"
                      style={{
                        color: PRIORITY_COLOR[selectedCrime.priority],
                        background: PRIORITY_COLOR[selectedCrime.priority] + '15',
                      }}
                    >
                      {selectedCrime.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight truncate">{selectedCrime.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCrime(null)}
                  className="ml-2 w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-base-elevated transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                {[
                  { label: 'Crime Type', value: selectedCrime.crime_type },
                  { label: 'Status',     value: selectedCrime.status.replace(/_/g, ' ') },
                  { label: 'Date',       value: new Date(selectedCrime.date_of_incident).toLocaleDateString('en-IN') },
                  { label: 'Distance',   value: `${selectedCrime.dist.toFixed(1)} km away` },
                  { label: 'Officer',    value: selectedCrime.io_name || 'Unassigned' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">{row.label}</span>
                    <span className="text-[11px] text-slate-300 capitalize">{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/cases/${selectedCrime.id}`)}
                className="btn-primary w-full btn-sm text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Case
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
